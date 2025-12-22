// ═══════════════════════════════════════════════════════════════════════════
// HARDWARE ADAPTER - Bridge between Stage/VM and hardware via serial
// ═══════════════════════════════════════════════════════════════════════════

import { COMMANDS, parseResponse, buildCommand, FirmwareResponse } from '../firmware/firmware-protocol';

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
        if (typeof window !== 'undefined' && window.electronAPI) {
            window.electronAPI.onSerialData((data: string) => {
                this.handleSerialData(data);
            });

            window.electronAPI.onConnectionChange((connected: boolean) => {
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
            window.electronAPI.sendSerial(command);
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
    async setDigitalPin(pin: number, value: boolean): Promise<boolean> {
        const response = await this.sendCommand(
            buildCommand(COMMANDS.SET_DIGITAL, pin, value ? 1 : 0)
        );
        return response.success;
    }

    /**
     * Read a digital pin
     */
    async readDigitalPin(pin: number): Promise<boolean | null> {
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
    async readAnalogPin(pin: number): Promise<number | null> {
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
    async setPWM(pin: number, value: number): Promise<boolean> {
        const clamped = Math.max(0, Math.min(255, Math.round(value)));
        const response = await this.sendCommand(
            buildCommand(COMMANDS.SET_PWM, pin, clamped)
        );
        return response.success;
    }

    /**
     * Set servo angle (0-180 degrees)
     */
    async setServo(pin: number, angle: number): Promise<boolean> {
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
    async playTone(pin: number, frequency: number, durationMs: number): Promise<boolean> {
        const response = await this.sendCommand(
            buildCommand(COMMANDS.TONE, pin, `${frequency},${durationMs}`)
        );
        return response.success;
    }

    /**
     * Stop tone on a pin
     */
    async stopTone(pin: number): Promise<boolean> {
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
}

// Singleton instance
export const hardwareAdapter = new HardwareAdapter();
