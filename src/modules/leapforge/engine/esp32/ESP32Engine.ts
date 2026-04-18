/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 *
 * ESP32Engine — wraps the QEMU Xtensa WASM binary when available,
 * or falls back to a sketch-aware stub that simulates WiFi / Serial / GPIO
 * by parsing the sketch source and driving SimulationRunner pin states directly.
 */

import { NetworkBridge, NetworkBridgeOptions } from './NetworkBridge';

export type PinChangeCallback = (pin: number, value: boolean) => void;
export type UARTCallback = (char: string) => void;

export interface ESP32EngineOptions extends NetworkBridgeOptions {
    onPinChange?: PinChangeCallback;
    onUARTData?: UARTCallback;
    /** Original sketch source — used by stub mode to simulate Serial / WiFi / GPIO */
    sketchSource?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Drive an ESP32 GPIO pin state into SimulationRunner (lazy import avoids circular deps) */
function setESP32Pin(gpio: number, high: boolean): void {
    import('../SimulationRunner').then(({ simulationRunner }) => {
        simulationRunner.setPinState(`ESP${gpio}`, high ? 'HIGH' : 'LOW');
    });
}

function floatESP32Pin(gpio: number): void {
    import('../SimulationRunner').then(({ simulationRunner }) => {
        simulationRunner.setPinState(`ESP${gpio}`, 'FLOATING');
    });
}

// ─── Stub-mode sketch interpreter ────────────────────────────────────────────
// Parses the sketch source and replays digitalWrite / Serial.print / WiFi.begin
// with real timing so the circuit canvas and serial monitor stay useful even
// without the WASM binary.

interface StubTask {
    intervalMs: number;
    lastRun: number;
    fn: () => void;
}

class SketchStub {
    private tasks: StubTask[] = [];
    private rafId: number | null = null;
    private running = false;
    private touchedPins = new Set<number>();

    constructor(
        private source: string,
        private uart: (char: string) => void,
        private bridge: NetworkBridge,
        private log: (msg: string) => void,
    ) { }

    start(): void {
        this.running = true;
        this.tasks = [];
        this.parseAndSchedule();
        this.tick();
    }

    stop(): void {
        this.running = false;
        if (this.rafId !== null) { cancelAnimationFrame(this.rafId); this.rafId = null; }
        // Float all pins we touched
        this.touchedPins.forEach(gpio => floatESP32Pin(gpio));
        this.touchedPins.clear();
    }

    private tick = () => {
        if (!this.running) return;
        const now = performance.now();
        for (const t of this.tasks) {
            if (now - t.lastRun >= t.intervalMs) {
                t.lastRun = now;
                t.fn();
            }
        }
        this.rafId = requestAnimationFrame(this.tick);
    };

    private emit(text: string): void {
        for (const ch of text) this.uart(ch);
    }

    private drivePin(gpio: number, high: boolean): void {
        this.touchedPins.add(gpio);
        setESP32Pin(gpio, high);
    }

    private parseAndSchedule(): void {
        const src = this.source;

        // ── WiFi.begin ────────────────────────────────────────────────────────
        const wifiBegin = src.match(/WiFi\.begin\s*\(\s*["']([^"']+)["']/);
        if (wifiBegin) {
            const ssid = wifiBegin[1];
            setTimeout(() => {
                if (!this.running) return;
                this.log(`[WiFi] Connecting to "${ssid}"...`);
                this.emit(`Connecting to ${ssid}\n`);
                setTimeout(() => {
                    if (!this.running) return;
                    this.bridge.handleROMCall(0x400819DC, 0, 0, 0, 0); // esp_wifi_connect
                    this.emit(`WiFi connected!\nIP: ${this.bridge.ipAddress}\n`);
                }, 600);
            }, 400);
        }

        // ── Extract loop body (handles nested braces) ─────────────────────────
        let loopBody = '';
        const loopMatch = src.match(/void\s+loop\s*\(\s*\)\s*\{/);
        if (loopMatch) {
            let depth = 0;
            let i = loopMatch.index! + loopMatch[0].length;
            const start = i;
            while (i < src.length) {
                if (src[i] === '{') depth++;
                else if (src[i] === '}') {
                    if (depth === 0) break;
                    depth--;
                }
                i++;
            }
            loopBody = src.slice(start, i);
        }

        // ── Build ordered action list from loop body ──────────────────────────
        interface Action {
            type: 'digitalWrite' | 'print' | 'println' | 'delay';
            gpio?: number;
            high?: boolean;
            text?: string;
            ms?: number;
        }

        const actions: Action[] = [];
        const lines = loopBody.split(/[;\n]/).map(l => l.trim()).filter(Boolean);

        for (const line of lines) {
            // digitalWrite(pin, HIGH/LOW/1/0)
            const dw = line.match(/\bdigitalWrite\s*\(\s*(\w+)\s*,\s*(HIGH|LOW|1|0)\s*\)/);
            if (dw) {
                const gpio = parseInt(dw[1], 10);
                if (!isNaN(gpio)) {
                    actions.push({ type: 'digitalWrite', gpio, high: dw[2] === 'HIGH' || dw[2] === '1' });
                }
                continue;
            }
            // Serial.println("text") / Serial.print("text")
            const sp = line.match(/Serial\.print(ln)?\s*\(\s*["']([^"']*)['"]/);
            if (sp) {
                actions.push({ type: sp[1] ? 'println' : 'print', text: sp[2] });
                continue;
            }
            // Serial.println(variable)
            const spv = line.match(/Serial\.print(ln)?\s*\(\s*(\w+)\s*\)/);
            if (spv && spv[2] !== 'Serial') {
                actions.push({ type: spv[1] ? 'println' : 'print', text: `[${spv[2]}]` });
                continue;
            }
            // delay(ms)
            const dl = line.match(/\bdelay\s*\(\s*(\d+)\s*\)/);
            if (dl) {
                actions.push({ type: 'delay', ms: parseInt(dl[1]) });
            }
        }

        // ── Fallback heartbeat ────────────────────────────────────────────────
        if (actions.length === 0) {
            this.tasks.push({
                intervalMs: 1000,
                lastRun: performance.now(),
                fn: () => this.emit('[ESP32] Running...\n'),
            });
            return;
        }

        // ── Replay actions with real timing ──────────────────────────────────
        // Compute cumulative delay offsets for each action.
        let totalMs = 0;
        const schedule: { offsetMs: number; action: Action }[] = [];
        for (const action of actions) {
            schedule.push({ offsetMs: totalMs, action });
            if (action.type === 'delay') totalMs += action.ms!;
        }
        if (totalMs === 0) totalMs = 1000; // default 1s loop if no delay()

        let loopStart = performance.now();
        let fired = new Set<number>();

        this.tasks.push({
            intervalMs: 8, // check every ~8ms (120fps)
            lastRun: performance.now(),
            fn: () => {
                const elapsed = performance.now() - loopStart;

                for (let i = 0; i < schedule.length; i++) {
                    const { offsetMs, action } = schedule[i];
                    if (!fired.has(i) && elapsed >= offsetMs) {
                        fired.add(i);
                        switch (action.type) {
                            case 'digitalWrite':
                                this.drivePin(action.gpio!, action.high!);
                                break;
                            case 'print':
                                this.emit(action.text!);
                                break;
                            case 'println':
                                this.emit(action.text! + '\n');
                                break;
                        }
                    }
                }

                // Restart loop
                if (elapsed >= totalMs) {
                    loopStart = performance.now();
                    fired = new Set<number>();
                }
            },
        });

        // ── HTTP / WiFiClient usage ───────────────────────────────────────────
        const httpUrl = src.match(/http\.begin\s*\(\s*["']([^"']+)["']/)?.[1]
            ?? src.match(/client\.connect\s*\(\s*["']([^"']+)["']/)?.[1];
        if (httpUrl && wifiBegin) {
            setTimeout(() => {
                if (!this.running) return;
                this.log(`[HTTP] Simulating GET ${httpUrl}`);
            }, 1500);
        }
    }
}

// ─── Main engine class ────────────────────────────────────────────────────────

export class ESP32Engine {
    private wasmInstance: WebAssembly.Instance | null = null;
    private wasmMemory: WebAssembly.Memory | null = null;
    private running = false;
    private rafId: number | null = null;

    private networkBridge: NetworkBridge;
    private pinCallbacks: PinChangeCallback[] = [];
    private uartCallbacks: UARTCallback[] = [];
    private sketchSource: string;

    private stub: SketchStub | null = null;
    private isStubMode = false;

    private gpio = new Uint8Array(64);

    constructor(opts: ESP32EngineOptions) {
        this.networkBridge = new NetworkBridge(opts);
        this.sketchSource = opts.sketchSource ?? '';
        if (opts.onPinChange) this.pinCallbacks.push(opts.onPinChange);
        if (opts.onUARTData) this.uartCallbacks.push(opts.onUARTData);
    }

    // ─── init ───────────────────────────────────────────────────────────────

    async init(firmwareHex: string): Promise<void> {
        const wasmUrl = new URL('../esp32-wasm/esp32.wasm', import.meta.url).href;

        let wasmBytes: ArrayBuffer | null = null;
        try {
            const resp = await fetch(wasmUrl);
            if (resp.ok) wasmBytes = await resp.arrayBuffer();
        } catch { /* fall through to stub */ }

        if (!wasmBytes) {
            console.info('[ESP32Engine] WASM binary not found — running in stub mode.');
            this.isStubMode = true;
            this.wasmMemory = new WebAssembly.Memory({ initial: 4 });
            this.networkBridge.init(this.wasmMemory, {});
            this.stub = new SketchStub(
                this.sketchSource,
                (ch) => this.uartCallbacks.forEach(cb => cb(ch)),
                this.networkBridge,
                (msg) => { for (const ch of msg + '\n') this.uartCallbacks.forEach(cb => cb(ch)); },
            );
            return;
        }

        // ── Full WASM mode ────────────────────────────────────────────────────
        const memory = new WebAssembly.Memory({ initial: 256, maximum: 512 });
        this.wasmMemory = memory;

        const imports: WebAssembly.Imports = {
            env: {
                memory,
                gpio_set_pin: (pin: number, value: number) => {
                    this.gpio[pin] = value;
                    this.pinCallbacks.forEach(cb => cb(pin, value !== 0));
                    // Also drive SimulationRunner so CircuitEngine listeners fire
                    setESP32Pin(pin, value !== 0);
                },
                uart_write_byte: (byte: number) => {
                    this.uartCallbacks.forEach(cb => cb(String.fromCharCode(byte)));
                },
                get_time_us: () => Math.floor(performance.now() * 1000),
                millis: () => Math.floor(performance.now()),
                micros: () => Math.floor(performance.now() * 1000),
                rom_hook: (addr: number, a2: number, a3: number, a4: number, a5: number): number => {
                    return this.networkBridge.handleROMCall(addr, a2, a3, a4, a5);
                },
                esp_log_write: () => { },
                esp_random: () => Math.floor(Math.random() * 0xFFFFFFFF),
                nvs_open: () => 1,
                nvs_get_str: () => 0,
                nvs_set_str: () => 0,
                nvs_commit: () => 0,
                nvs_close: () => { },
                vTaskDelay: () => { },
                xTaskCreate: () => 1,
                xTaskGetTickCount: () => Math.floor(performance.now()),
            },
            wasi_snapshot_preview1: this.buildWASI(memory),
        };

        const { instance } = await WebAssembly.instantiate(wasmBytes, imports);
        this.wasmInstance = instance;
        this.networkBridge.init(memory, instance.exports);
        await this.loadFirmware(firmwareHex);
    }

    private async loadFirmware(hex: string): Promise<void> {
        const exports = this.wasmInstance?.exports as any;
        if (!exports) return;
        const binary = this.parseHex(hex);
        const flashPtr = exports.get_flash_ptr?.() ?? 0x10000;
        new Uint8Array(this.wasmMemory!.buffer).set(binary, flashPtr);
        exports.esp32_init?.();
        exports.esp32_reset?.();
    }

    // ─── run loop ────────────────────────────────────────────────────────────

    start(): void {
        if (this.running) return;
        this.running = true;

        if (this.isStubMode) {
            this.stub?.start();
            return;
        }

        const CYCLES_PER_FRAME = 240_000;
        const exports = this.wasmInstance?.exports as any;
        const step = () => {
            if (!this.running) return;
            if (exports?.esp32_step) {
                for (let i = 0; i < CYCLES_PER_FRAME; i++) exports.esp32_step();
            }
            this.rafId = requestAnimationFrame(step);
        };
        this.rafId = requestAnimationFrame(step);
    }

    stop(): void {
        this.running = false;
        if (this.rafId !== null) { cancelAnimationFrame(this.rafId); this.rafId = null; }
        this.stub?.stop();
        this.networkBridge.cleanup();
    }

    reset(): void {
        this.stop();
        if (!this.isStubMode) {
            const exports = this.wasmInstance?.exports as any;
            exports?.esp32_reset?.();
        }
        this.start();
    }

    setDigitalInput(pin: number, high: boolean): void {
        const exports = this.wasmInstance?.exports as any;
        exports?.esp32_set_gpio?.(pin, high ? 1 : 0);
    }

    setAnalogInput(pin: number, millivolts: number): void {
        const exports = this.wasmInstance?.exports as any;
        exports?.esp32_set_adc?.(pin, millivolts);
    }

    onPinChange(cb: PinChangeCallback): void { this.pinCallbacks.push(cb); }
    onUARTData(cb: UARTCallback): void { this.uartCallbacks.push(cb); }

    get networkConnected(): boolean { return this.networkBridge.isConnected; }
    get ipAddress(): string { return this.networkBridge.ipAddress; }

    // ─── Intel HEX parser ────────────────────────────────────────────────────

    private parseHex(hex: string): Uint8Array {
        const result: number[] = [];
        for (const line of hex.split('\n')) {
            if (!line.startsWith(':')) continue;
            const len = parseInt(line.slice(1, 3), 16);
            const type = parseInt(line.slice(7, 9), 16);
            if (type !== 0) continue;
            for (let i = 0; i < len; i++) {
                result.push(parseInt(line.slice(9 + i * 2, 11 + i * 2), 16));
            }
        }
        return new Uint8Array(result);
    }

    // ─── Minimal WASI shim ───────────────────────────────────────────────────

    private buildWASI(memory: WebAssembly.Memory) {
        return {
            fd_write: (_fd: number, iovsPtr: number, iovsLen: number, nwrittenPtr: number) => {
                const view = new DataView(memory.buffer);
                let written = 0;
                for (let i = 0; i < iovsLen; i++) {
                    const ptr = view.getUint32(iovsPtr + i * 8, true);
                    const len = view.getUint32(iovsPtr + i * 8 + 4, true);
                    const buf = new Uint8Array(memory.buffer, ptr, len);
                    new TextDecoder().decode(buf).split('').forEach(ch => {
                        this.uartCallbacks.forEach(cb => cb(ch));
                    });
                    written += len;
                }
                view.setUint32(nwrittenPtr, written, true);
                return 0;
            },
            fd_seek: () => 0,
            fd_close: () => 0,
            proc_exit: () => { this.stop(); },
            args_get: () => 0,
            args_sizes_get: () => 0,
            environ_get: () => 0,
            environ_sizes_get: () => 0,
            clock_time_get: (_id: number, _prec: bigint, timePtr: number) => {
                const view = new DataView(memory.buffer);
                view.setBigUint64(timePtr, BigInt(Math.floor(performance.now() * 1e6)), true);
                return 0;
            },
            path_open: () => 8,
            fd_read: () => 0,
            random_get: (bufPtr: number, bufLen: number) => {
                crypto.getRandomValues(new Uint8Array(memory.buffer, bufPtr, bufLen));
                return 0;
            },
        };
    }
}
