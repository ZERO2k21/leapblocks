/**
 * VelxioEngine.ts
 * Secondary simulation engine using Velxio self-hosted Docker.
 *
 * Velxio runs at a configurable URL (default: http://localhost:3080).
 * This engine compiles Arduino C++ via Velxio's arduino-cli backend,
 * then runs the firmware in Velxio's QEMU-based ESP32-C3 emulator.
 *
 * Priority 2 — tried SECOND, after TranspiledJS (P1) fails or is unavailable.
 * Falls back gracefully if Velxio Docker service is not running.
 *
 * API Endpoints:
 *   GET  /api/health      → { status: 'ok', version: string }
 *   POST /api/compile     → { code, board } → { binary: base64, entryPoint: number }
 *   POST /api/simulate    → { binary, board, timeoutMs? } → { serialOutput, pinStates, errors, duration }
 *   POST /api/stream      → { binary, board } → SSE stream of { type: 'serial'|'gpio'|'error', ... }
 */

import type { BoardType, CompiledFirmware, SimulationResult, ISimulationEngine } from '../types';
import { SimulationEngineError } from '../types';

export interface VelxioConfig {
  /** Base URL of the Velxio Docker service (default: http://localhost:3080) */
  velxioUrl?: string;
  /** Timeout for individual HTTP requests in ms (default: 5000) */
  timeoutMs?: number;
  /** Number of retries for health check (default: 1) */
  retries?: number;
  /** Max simulation duration in ms before auto-stop (default: 30000) */
  maxSimulationMs?: number;
  /** Board type override (default: esp32c3) */
  board?: BoardType;
}

interface VelxioHealthResponse {
  status: string;
  version?: string;
  qemuAvailable?: boolean;
  arduinoCliAvailable?: boolean;
}

interface VelxioCompileResponse {
  binary: string;
  entryPoint?: number;
  size?: number;
  warnings?: string[];
}

interface VelxioSimulateResponse {
  serialOutput: string[];
  pinStates: Record<string, boolean | number>;
  errors: string[];
  duration: number;
  exitCode?: number;
}

export class VelxioEngine implements ISimulationEngine {
  name = 'velxio';
  priority = 2;

  private lastHealthCheck: { ok: boolean; timestamp: number } | null = null;
  private healthCheckCacheMs = 10000; // Cache health check for 10 seconds

  constructor(private config: VelxioConfig = {}) {}

  // ─── Health Check ──────────────────────────────────────────────────────

  async isAvailable(): Promise<boolean> {
    const url = this.config.velxioUrl;
    if (!url) return false;

    // Use cached result if fresh enough
    if (this.lastHealthCheck && (Date.now() - this.lastHealthCheck.timestamp) < this.healthCheckCacheMs) {
      return this.lastHealthCheck.ok;
    }

    const retries = this.config.retries ?? 1;
    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.config.timeoutMs ?? 3000);

      try {
        const res = await fetch(`${url}/api/health`, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' },
        });

        if (!res.ok) {
          this.lastHealthCheck = { ok: false, timestamp: Date.now() };
          return false;
        }

        const body: VelxioHealthResponse = await res.json();
        const ok = body?.status === 'ok';

        this.lastHealthCheck = { ok, timestamp: Date.now() };

        if (ok) {
          console.info(`[Velxio] Service available at ${url} (v${body.version ?? 'unknown'}, QEMU=${body.qemuAvailable ?? '?'})`);
        }

        return ok;
      } catch {
        // Connection refused or timeout — service not running
        this.lastHealthCheck = { ok: false, timestamp: Date.now() };
        return false;
      } finally {
        clearTimeout(timer);
      }
    }

    return false;
  }

  /**
   * Force-clear the health check cache (e.g. after Velxio Docker starts).
   */
  clearHealthCache(): void {
    this.lastHealthCheck = null;
  }

  // ─── Compile ───────────────────────────────────────────────────────────

  async compile(code: string, board: BoardType): Promise<CompiledFirmware> {
    const url = this.config.velxioUrl;
    if (!url) {
      throw new SimulationEngineError(this.name, 'compile', 'velxioUrl not configured');
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs ?? 5000);

    try {
      console.info(`[Velxio] Compiling ${code.length} chars of Arduino code for ${board}...`);

      const res = await fetch(`${url}/api/compile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          code,
          board: board || 'esp32c3',
          optimize: true,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        let errDetail = '';
        try {
          const errBody = await res.json();
          errDetail = errBody?.error || errBody?.message || await res.text();
        } catch {
          errDetail = await res.text();
        }
        throw new SimulationEngineError(
          this.name,
          'compile',
          `HTTP ${res.status}: ${errDetail || res.statusText}`,
        );
      }

      const data: VelxioCompileResponse = await res.json();

      if (!data.binary) {
        throw new SimulationEngineError(this.name, 'compile', 'Response missing binary data');
      }

      if (data.warnings?.length) {
        console.warn(`[Velxio] Compile warnings:`, data.warnings);
      }

      console.info(`[Velxio] Compiled successfully (${data.size ?? '?'} bytes, entry=0x${(data.entryPoint ?? 0x40380000).toString(16)})`);

      return {
        binary: data.binary,
        board,
        engine: this.name,
      };
    } catch (err) {
      if (err instanceof SimulationEngineError) throw err;
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new SimulationEngineError(this.name, 'compile', `Request timed out after ${this.config.timeoutMs ?? 5000}ms`);
      }
      throw new SimulationEngineError(this.name, 'compile', `Network error: ${err}`);
    } finally {
      clearTimeout(timer);
    }
  }

  // ─── Run ───────────────────────────────────────────────────────────────

  async run(firmware: CompiledFirmware): Promise<SimulationResult> {
    const url = this.config.velxioUrl;
    if (!url) {
      throw new SimulationEngineError(this.name, 'run', 'velxioUrl not configured');
    }

    if (!firmware.binary) {
      throw new SimulationEngineError(this.name, 'run', 'No binary firmware to run');
    }

    // Try streaming first (SSE), fall back to regular POST
    try {
      return await this.runStreaming(url, firmware);
    } catch (streamErr) {
      console.warn(`[Velxio] Streaming failed, falling back to standard mode:`, streamErr);
      return await this.runStandard(url, firmware);
    }
  }

  /**
   * Standard (non-streaming) simulation — single HTTP POST that returns all results at once.
   */
  private async runStandard(url: string, firmware: CompiledFirmware): Promise<SimulationResult> {
    const maxMs = this.config.maxSimulationMs ?? 30000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), maxMs);

    try {
      console.info(`[Velxio] Starting simulation (max ${maxMs}ms)...`);

      const res = await fetch(`${url}/api/simulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          binary: firmware.binary,
          board: firmware.board || 'esp32c3',
          timeoutMs: maxMs,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        let errDetail = '';
        try {
          const errBody = await res.json();
          errDetail = errBody?.error || errBody?.message || await res.text();
        } catch {
          errDetail = await res.text();
        }
        throw new SimulationEngineError(this.name, 'run', `HTTP ${res.status}: ${errDetail || res.statusText}`);
      }

      const data: VelxioSimulateResponse = await res.json();

      console.info(`[Velxio] Simulation completed in ${data.duration}ms (${data.serialOutput?.length ?? 0} serial lines, ${data.errors?.length ?? 0} errors)`);

      return {
        engine: 'velxio',
        serial: data.serialOutput ?? [],
        pinStates: data.pinStates ?? {},
        errors: data.errors ?? [],
        durationMs: data.duration ?? 0,
      };
    } catch (err) {
      if (err instanceof SimulationEngineError) throw err;
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new SimulationEngineError(this.name, 'run', `Simulation timed out after ${maxMs}ms`);
      }
      throw new SimulationEngineError(this.name, 'run', `Network error: ${err}`);
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Streaming simulation — Server-Sent Events (SSE) for real-time serial/GPIO output.
   * Falls back to standard if the server doesn't support SSE.
   */
  private async runStreaming(url: string, firmware: CompiledFirmware): Promise<SimulationResult> {
    const maxMs = this.config.maxSimulationMs ?? 30000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), maxMs);

    const serialLines: string[] = [];
    const pinStates: Record<string, boolean | number> = {};
    const errors: string[] = [];
    const startTime = Date.now();

    try {
      console.info(`[Velxio] Starting streaming simulation...`);

      const res = await fetch(`${url}/api/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          binary: firmware.binary,
          board: firmware.board || 'esp32c3',
          timeoutMs: maxMs,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        // Server doesn't support SSE — throw so caller falls back to standard
        throw new Error(`SSE not supported (HTTP ${res.status})`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr || jsonStr === '[DONE]') continue;

          try {
            const evt = JSON.parse(jsonStr);
            switch (evt.type) {
              case 'serial':
                serialLines.push(evt.data ?? evt.line ?? '');
                break;
              case 'gpio':
                if (evt.pin !== undefined) {
                  pinStates[`ESP${evt.pin}`] = evt.value;
                }
                break;
              case 'error':
                errors.push(evt.message ?? evt.data ?? 'Unknown error');
                break;
              case 'halted':
                console.info(`[Velxio] CPU halted (exit code: ${evt.exitCode ?? '?'})`);
                break;
            }
          } catch {
            // Skip malformed JSON lines
          }
        }
      }

      const duration = Date.now() - startTime;
      console.info(`[Velxio] Streaming simulation completed in ${duration}ms (${serialLines.length} serial lines)`);

      return {
        engine: 'velxio',
        serial: serialLines,
        pinStates,
        errors,
        durationMs: duration,
      };
    } finally {
      clearTimeout(timer);
    }
  }

  // ─── Utility ───────────────────────────────────────────────────────────

  /**
   * Get Velxio service info (version, capabilities).
   */
  async getServiceInfo(): Promise<{ version: string; qemuAvailable: boolean; arduinoCliAvailable: boolean } | null> {
    const url = this.config.velxioUrl;
    if (!url) return null;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);

    try {
      const res = await fetch(`${url}/api/health`, { signal: controller.signal });
      if (!res.ok) return null;
      const body: VelxioHealthResponse = await res.json();
      return {
        version: body.version ?? 'unknown',
        qemuAvailable: body.qemuAvailable ?? false,
        arduinoCliAvailable: body.arduinoCliAvailable ?? false,
      };
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
}
