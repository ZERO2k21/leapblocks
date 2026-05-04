/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 *
 * ESP32SimulationRunner — bridges the React/TS renderer to the QEMU-backed
 * ESP32 simulation running in the Electron main process.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * __LF_ SERIAL PROTOCOL  (all lines stripped — never reach serial monitor)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Tag              Format                    Listener fired
 * ──────────────── ──────────────────────── ──────────────────────────────
 * __LF_GPIO        __LF_GPIO:{pin}:{0|1}    pinListeners.get(pin)(high)
 *                  pin ∈ [0,39], val ∈ {0,1}
 *
 * __LF_PWM         __LF_PWM:{pin}:{duty}    pwmListeners.get(pin)(duty)
 *                  pin ∈ [0,39], duty ∈ [0,255]
 *
 * __LF_I2C_S       __LF_I2C_S:{addr}        starts i2c transaction
 *                  addr = decimal I2C address
 *
 * __LF_I2C_B       __LF_I2C_B:{byte}        appends byte to current transaction
 *                  byte = decimal 0–255
 *
 * __LF_I2C_E       __LF_I2C_E:{retcode}     ends transaction, fires i2cListeners
 *                  retcode 0=OK, 4=NACK
 *                  → i2cListeners.get(addr)(Uint8Array(bytes))
 *                  → retcode 4: serialListeners get "I2C NACK at 0x{addr}\n"
 *
 * __LF_WIFI        __LF_WIFI:{event}         appendWiFiLog(event)
 *                  event ∈ { connected, disconnected, ip:{x.x.x.x} }
 *
 * Everything else  forwarded char-by-char + "\n" to serialListeners
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * IPC channels used:
 *   invoke  "esp32-start"    binPath → void
 *   invoke  "esp32-stop"     → void
 *   invoke  "esp32-gpio-set" pin, high → void
 *   invoke  "esp32-adc-set"  channel, voltage → void
 *   on      "serial-data"    data: string (pushed from main via qemuManager)
 *   on      "esp32-status"   { stage, progress?, message? }
 */

// ── IPC bridge ────────────────────────────────────────────────────────────────
// Window.electronAPI is defined globally via src/preload.ts

// ── Types ─────────────────────────────────────────────────────────────────────

/** Callback fired when a GPIO output pin changes state */
export type PinChangeCallback = (high: boolean) => void;

/** Callback fired when analogWrite() is called — value is 0–255 duty cycle */
export type PwmCallback = (value: number) => void;

/** Callback fired when a complete I2C transaction is received */
export type I2CCallback = (data: Uint8Array) => void;

/** Callback fired for each character of normal serial output */
export type SerialCharCallback = (char: string) => void;

// ── I2C transaction state ─────────────────────────────────────────────────────
interface I2CTransaction {
    addr: number;
    bytes: number[];
}

// ── Class ─────────────────────────────────────────────────────────────────────

export class ESP32SimulationRunner {
    // ── Listener maps ─────────────────────────────────────────────────────────
    private pinListeners: Map<number, Set<PinChangeCallback>> = new Map();
    private pwmListeners: Map<number, Set<PwmCallback>> = new Map();
    private i2cListeners: Map<number, Set<I2CCallback>> = new Map();
    private serialListeners: Set<SerialCharCallback> = new Set();

    // ── Serial buffer ─────────────────────────────────────────────────────────
    private serialBuffer: string = '';

    // ── I2C state machine ─────────────────────────────────────────────────────
    private i2cPending: I2CTransaction | null = null;

    /** True while QEMU is running */
    isRunning: boolean = false;

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    async start(binPath: string): Promise<void> {
        if (this.isRunning) {
            console.warn('[ESP32Runner] start() called while already running — stopping first');
            this.stop();
        }

        console.log('[ESP32Runner] Registering serial data listener...');
        (window as any).electronAPI.onSerialData((data: string) => {
            console.log('[ESP32Runner] Serial data received:', data.length, 'chars');
            this.onSerialData(data);
        });

        await (window as any).electronAPI.invoke('esp32-start', binPath);
        this.isRunning = true;
        console.log('[ESP32Runner] QEMU started, binPath:', binPath);
    }

    stop(): void {
        if (!this.isRunning) return;

        (window as any).electronAPI.invoke('esp32-stop').catch((err: unknown) => {
            console.error('[ESP32Runner] esp32-stop error:', err);
        });

        (window as any).electronAPI.removeSerialDataListener();

        this.isRunning = false;
        this.serialBuffer = '';
        this.i2cPending = null;
        console.log('[ESP32Runner] QEMU stopped');
    }

    // ── GPIO / ADC injection ──────────────────────────────────────────────────

    async setGPIOInput(pin: number, high: boolean): Promise<void> {
        await (window as any).electronAPI.invoke('esp32-gpio-set', pin, high);
    }

    async setAnalogInput(channel: number, voltage: number): Promise<void> {
        await (window as any).electronAPI.invoke('esp32-adc-set', channel, voltage);
    }

    // ── GPIO pin listeners ────────────────────────────────────────────────────

    addPinListener(gpioNum: number, cb: PinChangeCallback): void {
        if (!this.pinListeners.has(gpioNum)) this.pinListeners.set(gpioNum, new Set());
        this.pinListeners.get(gpioNum)!.add(cb);
        console.log(`[ESP32Runner] Pin listener added: GPIO${gpioNum}, total listeners: ${this.pinListeners.get(gpioNum)!.size}`);
    }

    removePinListener(gpioNum: number, cb: PinChangeCallback): void {
        this.pinListeners.get(gpioNum)?.delete(cb);
    }

    // ── PWM listeners ─────────────────────────────────────────────────────────

    addPwmListener(gpioNum: number, cb: PwmCallback): void {
        if (!this.pwmListeners.has(gpioNum)) this.pwmListeners.set(gpioNum, new Set());
        this.pwmListeners.get(gpioNum)!.add(cb);
    }

    removePwmListener(gpioNum: number, cb: PwmCallback): void {
        this.pwmListeners.get(gpioNum)?.delete(cb);
    }

    // ── I2C listeners ─────────────────────────────────────────────────────────

    addI2CListener(addr: number, cb: I2CCallback): void {
        if (!this.i2cListeners.has(addr)) this.i2cListeners.set(addr, new Set());
        this.i2cListeners.get(addr)!.add(cb);
    }

    removeI2CListener(addr: number, cb: I2CCallback): void {
        this.i2cListeners.get(addr)?.delete(cb);
    }

    // ── Serial listeners ──────────────────────────────────────────────────────

    addSerialListener(cb: SerialCharCallback): void {
        this.serialListeners.add(cb);
    }

    removeSerialListener(cb: SerialCharCallback): void {
        this.serialListeners.delete(cb);
    }

    // ── Internal serial processing ────────────────────────────────────────────

    private onSerialData(data: string): void {
        this.serialBuffer += data;
        const lines = this.serialBuffer.split('\n');
        this.serialBuffer = lines.pop() ?? '';
        for (const line of lines) {
            console.log('[ESP32Runner] Serial line:', JSON.stringify(line));
            this.parseSerialLine(line);
        }
    }

    private parseSerialLine(line: string): void {
        if (line.length === 0) return;

        // ── __LF_GPIO:{pin}:{0|1} ─────────────────────────────────────────────
        const gpioM = /^__LF_GPIO:(\d+):(\d)$/.exec(line);
        if (gpioM !== null) {
            const pin = parseInt(gpioM[1], 10);
            if (pin < 0 || pin > 39) return;
            const high = gpioM[2] === '1';
            console.log(`[ESP32Runner] GPIO detected: pin=${pin}, high=${high}, listeners=${this.pinListeners.get(pin)?.size ?? 0}`);
            this.pinListeners.get(pin)?.forEach(cb => cb(high));
            return;
        }

        // ── __LF_PWM:{pin}:{duty 0-255} ───────────────────────────────────────
        const pwmM = /^__LF_PWM:(\d+):(\d+)$/.exec(line);
        if (pwmM !== null) {
            const pin = parseInt(pwmM[1], 10);
            const value = Math.max(0, Math.min(255, parseInt(pwmM[2], 10)));
            if (pin < 0 || pin > 39) return;
            this.pwmListeners.get(pin)?.forEach(cb => cb(value));
            return;
        }

        // ── __LF_I2C_S:{addr} — start transaction ─────────────────────────────
        const i2cSM = /^__LF_I2C_S:(\d+)$/.exec(line);
        if (i2cSM !== null) {
            this.i2cPending = { addr: parseInt(i2cSM[1], 10), bytes: [] };
            return;
        }

        // ── __LF_I2C_B:{byte} — append byte ──────────────────────────────────
        const i2cBM = /^__LF_I2C_B:(\d+)$/.exec(line);
        if (i2cBM !== null) {
            if (this.i2cPending) {
                this.i2cPending.bytes.push(parseInt(i2cBM[1], 10));
            }
            return;
        }

        // ── __LF_I2C_E:{retcode} — end transaction ────────────────────────────
        const i2cEM = /^__LF_I2C_E:(\d+)$/.exec(line);
        if (i2cEM !== null) {
            const retCode = parseInt(i2cEM[1], 10);
            if (this.i2cPending) {
                const { addr, bytes } = this.i2cPending;
                this.i2cPending = null;
                if (retCode === 4) {
                    // NACK — report to serial monitor
                    const msg = `I2C NACK at 0x${addr.toString(16).padStart(2, '0')}\n`;
                    for (const ch of msg) this.serialListeners.forEach(cb => cb(ch));
                } else {
                    this.i2cListeners.get(addr)?.forEach(cb => cb(new Uint8Array(bytes)));
                }
            }
            return;
        }

        // ── __LF_WIFI:{event} ─────────────────────────────────────────────────
        const wifiM = /^__LF_WIFI:(.+)$/.exec(line);
        if (wifiM !== null) {
            // Lazy import to avoid circular dep — store is a singleton
            import('../Leapforge/Client/utlis/store/useForgeStore').then(({ useForgeStore }) => {
                useForgeStore.getState().appendWiFiLog(wifiM[1]);
            }).catch(() => { /* non-fatal */ });
            return;
        }

        // ── Discard any other __LF_ prefixed lines silently ───────────────────
        if (line.startsWith('__LF_')) return;

        // ── Normal serial output → char-by-char to serial monitor ─────────────
        const text = line + '\n';
        for (const ch of text) {
            this.serialListeners.forEach(cb => cb(ch));
        }
    }
}
