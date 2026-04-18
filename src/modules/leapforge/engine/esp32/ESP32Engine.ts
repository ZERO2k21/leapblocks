/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 *
 * ESP32Engine — wraps the QEMU Xtensa WASM binary, wires ROM hooks,
 * and exposes a board-agnostic pin/UART API matching SimulationRunner.
 */

import { NetworkBridge, NetworkBridgeOptions } from './NetworkBridge';

export type PinChangeCallback = (pin: number, value: boolean) => void;
export type UARTCallback = (char: string) => void;

export interface ESP32EngineOptions extends NetworkBridgeOptions {
    onPinChange?: PinChangeCallback;
    onUARTData?: UARTCallback;
}

export class ESP32Engine {
    private wasmInstance: WebAssembly.Instance | null = null;
    private wasmMemory: WebAssembly.Memory | null = null;
    private running = false;
    private rafId: number | null = null;

    private networkBridge: NetworkBridge;
    private pinCallbacks: PinChangeCallback[] = [];
    private uartCallbacks: UARTCallback[] = [];

    // GPIO state (64 pins)
    private gpio = new Uint8Array(64);

    constructor(opts: ESP32EngineOptions) {
        this.networkBridge = new NetworkBridge(opts);
        if (opts.onPinChange) this.pinCallbacks.push(opts.onPinChange);
        if (opts.onUARTData) this.uartCallbacks.push(opts.onUARTData);
    }

    // ─── init ───────────────────────────────────────────────────────────────

    async init(firmwareHex: string): Promise<void> {
        // Resolve WASM URL relative to this module
        const wasmUrl = new URL(
            '../esp32-wasm/esp32.wasm',
            import.meta.url
        ).href;

        let wasmBytes: ArrayBuffer;
        try {
            const resp = await fetch(wasmUrl);
            if (!resp.ok) throw new Error(`WASM fetch failed: ${resp.status}`);
            wasmBytes = await resp.arrayBuffer();
        } catch (e) {
            console.warn('[ESP32Engine] WASM binary not found — running in stub mode.', e);
            // Stub mode: WiFi hooks still work, CPU steps are no-ops
            this.wasmMemory = new WebAssembly.Memory({ initial: 4 });
            this.networkBridge.init(this.wasmMemory, {});
            return;
        }

        const memory = new WebAssembly.Memory({ initial: 256, maximum: 512 });
        this.wasmMemory = memory;

        const imports: WebAssembly.Imports = {
            env: {
                memory,

                // ── GPIO output (firmware sets a pin) ─────────────────────
                gpio_set_pin: (pin: number, value: number) => {
                    this.gpio[pin] = value;
                    this.pinCallbacks.forEach(cb => cb(pin, value !== 0));
                },

                // ── UART TX ───────────────────────────────────────────────
                uart_write_byte: (byte: number) => {
                    this.uartCallbacks.forEach(cb => cb(String.fromCharCode(byte)));
                },

                // ── Timing ────────────────────────────────────────────────
                get_time_us: () => Math.floor(performance.now() * 1000),
                millis: () => Math.floor(performance.now()),
                micros: () => Math.floor(performance.now() * 1000),

                // ── ROM hook dispatch ─────────────────────────────────────
                rom_hook: (addr: number, a2: number, a3: number, a4: number, a5: number): number => {
                    return this.networkBridge.handleROMCall(addr, a2, a3, a4, a5);
                },

                // ── Logging ───────────────────────────────────────────────
                esp_log_write: (_level: number, _tagPtr: number, _msgPtr: number) => { },

                // ── Random number generator ───────────────────────────────
                esp_random: () => Math.floor(Math.random() * 0xFFFFFFFF),

                // ── NVS (non-volatile storage) stubs ──────────────────────
                nvs_open: () => 1,
                nvs_get_str: () => 0,
                nvs_set_str: () => 0,
                nvs_commit: () => 0,
                nvs_close: () => { },

                // ── FreeRTOS task stubs ───────────────────────────────────
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
        this.running = true;
        const CYCLES_PER_FRAME = 240_000; // ESP32 @ 240MHz, ~1ms per frame
        const exports = this.wasmInstance?.exports as any;

        const step = () => {
            if (!this.running) return;
            if (exports?.esp32_step) {
                for (let i = 0; i < CYCLES_PER_FRAME; i++) {
                    exports.esp32_step();
                }
            }
            this.rafId = requestAnimationFrame(step);
        };

        this.rafId = requestAnimationFrame(step);
    }

    stop(): void {
        this.running = false;
        if (this.rafId !== null) cancelAnimationFrame(this.rafId);
        this.rafId = null;
        this.networkBridge.cleanup();
    }

    reset(): void {
        this.stop();
        const exports = this.wasmInstance?.exports as any;
        exports?.esp32_reset?.();
        this.start();
    }

    // ─── GPIO input (from UI components → into CPU) ──────────────────────────

    setDigitalInput(pin: number, high: boolean): void {
        const exports = this.wasmInstance?.exports as any;
        exports?.esp32_set_gpio?.(pin, high ? 1 : 0);
    }

    setAnalogInput(pin: number, millivolts: number): void {
        const exports = this.wasmInstance?.exports as any;
        exports?.esp32_set_adc?.(pin, millivolts);
    }

    // ─── event listeners ────────────────────────────────────────────────────

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
            fd_write: (fd: number, iovsPtr: number, iovsLen: number, nwrittenPtr: number) => {
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
            proc_exit: (_code: number) => { this.stop(); },
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
