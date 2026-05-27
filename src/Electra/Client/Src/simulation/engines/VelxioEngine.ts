/**
 * VelxioEngine.ts
 * Primary simulation engine using Velxio self-hosted Docker.
 *
 * Velxio runs at a configurable URL (default: http://localhost:3080).
 * This engine compiles Arduino C++ via Velxio's arduino-cli backend,
 * then runs the firmware in Velxio's QEMU-based ESP32-C3 emulator.
 *
 * If Velxio is unreachable or compilation fails, this engine throws
 * SimulationEngineError so SimulationOrchestrator can try the next engine.
 */

import type { BoardType, CompiledFirmware, SimulationResult, ISimulationEngine } from '../types';
import { SimulationEngineError } from '../types';

export interface VelxioConfig {
  velxioUrl?: string;
  timeoutMs?: number;
  retries?: number;
}

export class VelxioEngine implements ISimulationEngine {
  name = 'velxio';
  priority = 1;

  constructor(private config: VelxioConfig = {}) {}

  async isAvailable(): Promise<boolean> {
    if (!this.config.velxioUrl) return false;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs ?? 3000);

    try {
      const res = await fetch(`${this.config.velxioUrl}/api/health`, {
        signal: controller.signal,
      });
      if (!res.ok) return false;
      const body = await res.json();
      return body?.status === 'ok';
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  }

  async compile(code: string, board: BoardType): Promise<CompiledFirmware> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs ?? 3000);

    try {
      const res = await fetch(`${this.config.velxioUrl}/api/compile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, board }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new SimulationEngineError(
          this.name,
          'compile',
          `compile failed (${res.status}): ${errBody}`,
        );
      }

      const data = await res.json();
      const binaryBase64 = data.binary || data.hex || data.binBase64;

      if (!binaryBase64) {
        throw new SimulationEngineError(
          this.name,
          'compile',
          'compile response missing binary data',
        );
      }

      return {
        binary: binaryBase64,
        board,
        engine: this.name,
      };
    } catch (err) {
      if (err instanceof SimulationEngineError) throw err;
      throw new SimulationEngineError(
        this.name,
        'compile',
        `compile request failed: ${err}`,
      );
    } finally {
      clearTimeout(timer);
    }
  }

  async run(firmware: CompiledFirmware): Promise<SimulationResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs ?? 3000);

    try {
      const res = await fetch(`${this.config.velxioUrl}/api/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          binary: firmware.binary,
          board: firmware.board,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new SimulationEngineError(
          this.name,
          'run',
          `run failed (${res.status}): ${errBody}`,
        );
      }

      const data = await res.json();

      return {
        engine: 'velxio',
        serial: data.serialOutput ?? [],
        pinStates: data.pinStates ?? {},
        errors: data.errors ?? [],
        durationMs: data.duration ?? 0,
      };
    } catch (err) {
      if (err instanceof SimulationEngineError) throw err;
      throw new SimulationEngineError(
        this.name,
        'run',
        `run request failed: ${err}`,
      );
    } finally {
      clearTimeout(timer);
    }
  }
}
