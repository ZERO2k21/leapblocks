/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 *
 * ESP32SimulationRunner — bridges the React/TS renderer to the QEMU-backed
 * ESP32 simulation running in the Electron main process.
 *
 * KEY DIFFERENCE from SimulationRunner:
 *   No tick() loop, no requestAnimationFrame — QEMU executes natively at full
 *   speed in the main process. This class is purely an IPC adapter.
 *
 * IPC channels used:
 *   invoke  "esp32-start"    binPath → void
 *   invoke  "esp32-stop"     → void
 *   invoke  "esp32-gpio-set" pin, high → void
 *   invoke  "esp32-adc-set"  channel, voltage → void
 *   on      "serial-data"    data: string (pushed from main via qemuManager)
 *
 * Serial protocol:
 *   Lines starting with "__LF_GPIO:<pin>:<val>" are GPIO state reports injected
 *   by the LeapForge GPIO monitor header in esp32Compiler.js.  They are parsed
 *   and routed to pin listeners, then STRIPPED from the serial monitor output.
 *   All other lines are forwarded character-by-character to serial listeners,
 *   matching the AVR SimulationRunner behaviour.
 */

// ── IPC bridge ────────────────────────────────────────────────────────────────
// contextIsolation is enabled, so ipcRenderer is not directly importable.
// All IPC goes through window.electronAPI (exposed by electron/preload.js).
declare global {
    interface Window {
        electronAPI: {
            invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
            onSerialData: (cb: (data: string) => void) => void;
            removeSerialDataListener: () => void;
            isElectron?: boolean;
        };
    }
}

// ── Types ─────────────────────────────────────────────────────────────────────

/** Callback fired when a GPIO output pin changes state */
export type PinChangeCallback = (high: boolean) => void;

/** Callback fired for each character of normal serial output */
export type SerialCharCallback = (char: string) => void;

// ── Class ─────────────────────────────────────────────────────────────────────

export class ESP32SimulationRunner {
    // gpio number → set of listeners
    private pinListeners: Map<number, Set<PinChangeCallback>> = new Map();

    // listeners for normal (non-GPIO-report) serial characters
    private serialListeners: Set<SerialCharCallback> = new Set();

    // incomplete line fragment carried between data chunks
    private serialBuffer: string = '';

    /** True while QEMU is running */
    isRunning: boolean = false;

    // ── Lifecycle ───────────────────────────────────────────────────────────────

    /**
     * Start the QEMU ESP32 simulation.
     * @param binPath Absolute path to the compiled .bin file (from esp32Compiler.js).
     */
    async start(binPath: string): Promise<void> {
        if (this.isRunning) {
            console.warn('[ESP32Runner] start() called while already running — stopping first');
            this.stop();
        }

        // Register serial-data listener before starting QEMU so no data is missed
        window.electronAPI.onSerialData((data: string) => this.onSerialData(data));

        await window.electronAPI.invoke('esp32-start', binPath);
        this.isRunning = true;
        console.log('[ESP32Runner] QEMU started, binPath:', binPath);
    }

    /**
     * Stop the QEMU simulation and clean up IPC listeners.
     */
    stop(): void {
        if (!this.isRunning) return;

        window.electronAPI.invoke('esp32-stop').catch((err: unknown) => {
            console.error('[ESP32Runner] esp32-stop error:', err);
        });

        window.electronAPI.removeSerialDataListener();

        this.isRunning = false;
        this.serialBuffer = '';
        console.log('[ESP32Runner] QEMU stopped');
    }

    // ── GPIO / ADC injection ────────────────────────────────────────────────────

    /**
     * Drive a GPIO input pin HIGH or LOW from the simulation UI.
     * Routes to the QMP "gpio-set" command via main process.
     * @param pin  GPIO number (e.g. 4, 13)
     * @param high true = HIGH (3.3 V), false = LOW (0 V)
     */
    async setGPIOInput(pin: number, high: boolean): Promise<void> {
        await window.electronAPI.invoke('esp32-gpio-set', pin, high);
    }

    /**
     * Inject an analog voltage into an ADC1 channel.
     * Routes to the QMP "qom-set" command via main process.
     * @param channel ADC1 channel index (0–9, from ESP32BoardConfig.adc)
     * @param voltage Voltage in volts (0.0 – 3.3)
     */
    async setAnalogInput(channel: number, voltage: number): Promise<void> {
        await window.electronAPI.invoke('esp32-adc-set', channel, voltage);
    }

    // ── Pin listeners ───────────────────────────────────────────────────────────

    /**
     * Register a callback that fires whenever the sketch drives a GPIO output.
     * GPIO state is detected by parsing "__LF_GPIO:<pin>:<val>" serial lines
     * injected by the LeapForge GPIO monitor header.
     */
    addPinListener(gpioNum: number, cb: PinChangeCallback): void {
        if (!this.pinListeners.has(gpioNum)) {
            this.pinListeners.set(gpioNum, new Set());
        }
        this.pinListeners.get(gpioNum)!.add(cb);
    }

    /**
     * Remove a previously registered pin listener.
     */
    removePinListener(gpioNum: number, cb: PinChangeCallback): void {
        this.pinListeners.get(gpioNum)?.delete(cb);
    }

    // ── Serial listeners ────────────────────────────────────────────────────────

    /**
     * Register a callback that receives normal serial output one character at a
     * time, matching the AVR SimulationRunner behaviour.
     * GPIO report lines (__LF_GPIO:…) are stripped before reaching this callback.
     */
    addSerialListener(cb: SerialCharCallback): void {
        this.serialListeners.add(cb);
    }

    /**
     * Remove a previously registered serial listener.
     */
    removeSerialListener(cb: SerialCharCallback): void {
        this.serialListeners.delete(cb);
    }

    // ── Internal serial processing ──────────────────────────────────────────────

    /**
     * Called on every "serial-data" IPC event from qemuManager.
     * Buffers incoming data and processes complete lines.
     */
    private onSerialData(data: string): void {
        this.serialBuffer += data;

        // Split on newline; keep the trailing incomplete fragment in the buffer
        const lines = this.serialBuffer.split('\n');
        this.serialBuffer = lines.pop() ?? '';

        for (const line of lines) {
            this.parseSerialLine(line);
        }
    }

    /**
     * Parse a single complete serial line.
     *
     * GPIO report wire format (injected by LeapForge GPIO monitor header):
     *   __LF_GPIO:{pin}:{value}
     *   pin   = uint8 GPIO number, 0–39
     *   value = "0" or "1"
     *
     * Validation rules (all others → discard silently, never crash):
     *   • Must match /^__LF_GPIO:(\d+):(\d)$/ exactly
     *   • pin must be an integer in [0, 39]
     *   • value digit not "0" or "1" → treated as LOW (0)
     *
     * GPIO report lines are NEVER forwarded to serial listeners.
     * Empty lines (after stripping \n) are discarded silently.
     * All other non-empty lines are forwarded char-by-char + "\n".
     */
    private parseSerialLine(line: string): void {
        // ── Discard empty lines silently ──────────────────────────────────────
        if (line.length === 0) return;

        // ── GPIO state report ─────────────────────────────────────────────────
        // Regex anchored at both ends — rejects trailing garbage, extra colons,
        // whitespace, or multi-digit value fields.
        const GPIO_RE = /^__LF_GPIO:(\d+):(\d)$/;
        const m = GPIO_RE.exec(line);

        if (m !== null) {
            const pin = parseInt(m[1], 10);

            // Discard out-of-range pin numbers silently
            if (pin < 0 || pin > 39) return;

            // Value not "0" or "1" → treat as LOW per spec
            const high = m[2] === '1';

            this.pinListeners.get(pin)?.forEach(cb => cb(high));
            return;
        }

        // ── Normal serial output ──────────────────────────────────────────────
        // Lines that start with "__LF_GPIO:" but fail the full regex (malformed)
        // are silently discarded here — they must not reach the serial monitor.
        if (line.startsWith('__LF_GPIO:')) return;

        // Forward char-by-char + newline to match AVR SimulationRunner behaviour.
        const text = line + '\n';
        for (const ch of text) {
            this.serialListeners.forEach(cb => cb(ch));
        }
    }
}
