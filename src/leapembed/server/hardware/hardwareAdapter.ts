/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
// ═══════════════════════════════════════════════════════════════════════════
// HARDWARE ADAPTER - Bridge between Stage/VM and hardware via serial
// ═══════════════════════════════════════════════════════════════════════════

import { COMMANDS, parseResponse, buildCommand, FirmwareResponse } from '../firmware/firmwareProtocol';

/**
 * HardwareAdapter provides a high-level API for controlling hardware
 * from the Stage mode. It sends commands via the serialport IPC bridge
 * and processes responses.
 */
export class HardwareAdapter {
    private responseBuffer: string = '';
    private pendingCallbacks: Map<number, (response: FirmwareResponse) => void> = new Map();
    private callbackId: number = 0;
    private isConnected: boolean = false;

    constructor() {
        // Set up serial data listener
        if (typeof window !== 'undefined' && (window as any).electronAPI) {
            (window as any).electronAPI.onSerialData((data: string) => {
                this.handleSerialData(data);
            });

            (window as any).electronAPI.onConnectionChange((connected: boolean) => {
                this.isConnected = connected;
                if (!connected) {
                    this.responseBuffer = '';
                    // Reject all pending callbacks
                    this.pendingCallbacks.forEach(cb => {
                        cb({ success: false, error: 'Disconnected' });
                    });
                    this.pendingCallbacks.clear();
                }
            });
        }
    }

    /**
     * Check if adapter is connected to hardware
     */
    get connected(): boolean {
        return this.isConnected;
    }

    /**
     * Handle incoming serial data
     */
    private handleSerialData(data: string): void {
        this.responseBuffer += data;

        // Check for complete responses (ending with newline)
        let newlineIndex: number;
        while ((newlineIndex = this.responseBuffer.indexOf('\n')) !== -1) {
            const response = this.responseBuffer.substring(0, newlineIndex);
            this.responseBuffer = this.responseBuffer.substring(newlineIndex + 1);

            // Process the response
            const parsed = parseResponse(response);

            // For now, just resolve the oldest pending callback
            // In a more sophisticated implementation, we'd track request IDs
            const [firstKey] = this.pendingCallbacks.keys();
            if (firstKey !== undefined) {
                const callback = this.pendingCallbacks.get(firstKey);
                this.pendingCallbacks.delete(firstKey);
                callback?.(parsed);
            }
        }
    }

    /**
     * Send a command and wait for response
     */
    private async sendCommand(command: string, timeoutMs: number = 1000): Promise<FirmwareResponse> {
        if (!this.isConnected) {
            return { success: false, error: 'Not connected' };
        }

        const electronAPI = (window as any).electronAPI;
        if (!electronAPI) {
            return { success: false, error: 'Hardware interaction requires LeapBlocks Desktop' };
        }

        return new Promise((resolve) => {
            const id = this.callbackId++;

            // Set up timeout
            const timeout = setTimeout(() => {
                this.pendingCallbacks.delete(id);
                resolve({ success: false, error: 'Timeout' });
            }, timeoutMs);

            // Register callback
            this.pendingCallbacks.set(id, (response) => {
                clearTimeout(timeout);
                resolve(response);
            });

            // Send command
            try {
                electronAPI.sendSerial(command);
            } catch (err) {
                console.error('[HardwareAdapter] sendSerial failed:', err);
                resolve({ success: false, error: 'Failed to send command' });
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // HIGH-LEVEL COMMANDS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Ping the hardware to check connection
     */
    async ping(): Promise<boolean> {
        const response = await this.sendCommand(buildCommand(COMMANDS.PING));
        return response.success;
    }

    /**
     * Set a digital pin HIGH or LOW
     */
    async setDigitalPin(pin: number | string, value: boolean): Promise<boolean> {
        const response = await this.sendCommand(
            buildCommand(COMMANDS.SET_DIGITAL, pin, value ? 1 : 0)
        );
        return response.success;
    }

    /**
     * Read a digital pin
     */
    async readDigitalPin(pin: number | string): Promise<boolean | null> {
        const response = await this.sendCommand(
            buildCommand(COMMANDS.READ_DIGITAL, pin)
        );
        if (response.success && response.data !== undefined) {
            return response.data === '1';
        }
        return null;
    }

    /**
     * Read an analog pin (0-1023)
     */
    async readAnalogPin(pin: number | string): Promise<number | null> {
        const response = await this.sendCommand(
            buildCommand(COMMANDS.READ_ANALOG, pin)
        );
        if (response.success && response.data !== undefined) {
            return parseInt(response.data, 10);
        }
        return null;
    }

    /**
     * Set PWM value on a pin (0-255)
     */
    async setPWM(pin: number | string, value: number): Promise<boolean> {
        const clamped = Math.max(0, Math.min(255, Math.round(value)));
        const response = await this.sendCommand(
            buildCommand(COMMANDS.SET_PWM, pin, clamped)
        );
        return response.success;
    }

    /**
     * Set servo angle (0-180 degrees)
     */
    async setServo(pin: number | string, angle: number): Promise<boolean> {
        const clamped = Math.max(0, Math.min(180, Math.round(angle)));
        const response = await this.sendCommand(
            buildCommand(COMMANDS.SET_SERVO, pin, clamped)
        );
        return response.success;
    }

    /**
     * Set motor speed (-255 to 255, negative for reverse)
     */
    async setMotor(motorId: number, speed: number): Promise<boolean> {
        const clamped = Math.max(-255, Math.min(255, Math.round(speed)));
        const response = await this.sendCommand(
            buildCommand(COMMANDS.SET_MOTOR, motorId, clamped)
        );
        return response.success;
    }

    /**
     * Stop all motors
     */
    async stopMotors(): Promise<boolean> {
        const response = await this.sendCommand(buildCommand(COMMANDS.STOP_MOTORS));
        return response.success;
    }

    /**
     * Play a tone on a buzzer
     */
    async playTone(pin: number | string, frequency: number, durationMs: number): Promise<boolean> {
        const response = await this.sendCommand(
            buildCommand(COMMANDS.TONE, pin, `${frequency},${durationMs}`)
        );
        return response.success;
    }

    /**
     * Stop tone on a pin
     */
    async stopTone(pin: number | string): Promise<boolean> {
        const response = await this.sendCommand(
            buildCommand(COMMANDS.NOTONE, pin)
        );
        return response.success;
    }

    /**
     * Built-in LED control (convenience method)
     */
    async setBuiltinLED(on: boolean): Promise<boolean> {
        return this.setDigitalPin(13, on);
    }

    private sensorCache: Map<string, number> = new Map();
    private activePolling: Map<string, NodeJS.Timeout> = new Map();

    /**
     * Read ultrasonic distance synchronously from cache
     */
    getUltrasonicSync(trig: number | string, echo: number | string): number {
        const key = `ultrasonic_${trig}_${echo}`;
        // Start polling if not already active
        if (!this.activePolling.has(key)) {
            this.startPollingUltrasonic(trig, echo);
        }
        return this.sensorCache.get(key) ?? 0;
    }

    /**
     * Start polling ultrasonic sensor
     */
    startPollingUltrasonic(trig: number | string, echo: number | string, intervalMs: number = 200): void {
        const key = `ultrasonic_${trig}_${echo}`;
        if (this.activePolling.has(key)) return;

        console.log(`[HardwareAdapter] Starting polling for ${key}`);
        const poll = async () => {
            if (!this.isConnected) return;
            const val = await this.readUltrasonic(trig, echo);
            if (val !== null) {
                this.sensorCache.set(key, val);
            }
        };

        // Initial poll
        poll();

        // Setup interval
        const timer = setInterval(poll, intervalMs);
        this.activePolling.set(key, timer);
    }

    /**
     * Stop all sensor polling
     */
    stopAllPolling(): void {
        console.log('[HardwareAdapter] Stopping all polling');
        this.activePolling.forEach((timer) => clearInterval(timer));
        this.activePolling.clear();
        this.sensorCache.clear();
    }

    /**
     * Read ultrasonic distance (cm)
     */
    async readUltrasonic(trig: number | string, echo: number | string): Promise<number | null> {
        const response = await this.sendCommand(
            buildCommand(COMMANDS.READ_ULTRASONIC, trig, echo),
            500 // Short timeout for polling
        );
        if (response.success && response.data !== undefined) {
            return parseFloat(response.data);
        }
        return null;
    }
}

let _hardwareAdapter: HardwareAdapter | null = null;
export function getHardwareAdapter(): HardwareAdapter {
    if (!_hardwareAdapter) _hardwareAdapter = new HardwareAdapter();
    return _hardwareAdapter;
}
export const hardwareAdapter: HardwareAdapter = new Proxy({} as HardwareAdapter, {
    get(_target, prop) {
        const instance = getHardwareAdapter();
        const value = (instance as any)[prop];
        return typeof value === 'function' ? value.bind(instance) : value;
    },
    set(_target, prop, value) { (getHardwareAdapter() as any)[prop] = value; return true; }
});
