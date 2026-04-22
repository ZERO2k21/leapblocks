/**
 * ESP32-C3 Simulation Runner
 * 
 * Manages the RISC-V core execution in a requestAnimationFrame loop,
 * handles pin listeners, and converts analog inputs for the ESP32-C3.
 */

import { RiscVCore, type RiscVCoreCallbacks } from './RiscVCore';
import { useForgeStore } from '../../modules/leapforge/store/useForgeStore';
import { I2CBusManager } from '../../modules/leapforge/engine/I2CBusManager';

// CPU frequency and timing constants
const CPU_FREQUENCY_HZ = 160_000_000; // 160 MHz
const TARGET_FPS = 60;
const STEPS_PER_FRAME = Math.floor(CPU_FREQUENCY_HZ / TARGET_FPS / 1000); // Start conservative: ~2666 steps

export class ESP32C3SimulationRunner {
    private core: RiscVCore;
    private pinListeners = new Map<number, Set<(high: boolean) => void>>();
    private rafId: number | null = null;
    private isRunning = false;

    constructor() {
        // Create RISC-V core with peripheral callbacks
        const callbacks: RiscVCoreCallbacks = {
            onGPIOOutput: this.handleGPIOOutput.bind(this),
            onUARTByte: this.handleUARTByte.bind(this),
            onI2CWrite: this.handleI2CWrite.bind(this),
        };

        this.core = new RiscVCore(callbacks);
    }

    async init(firmwareBin: Uint8Array): Promise<void> {
        try {
            await this.core.init(firmwareBin);
            console.log('[ESP32-C3] Simulation runner initialized');
        } catch (error) {
            console.error('[ESP32-C3] Failed to initialize simulation runner:', error);
            throw error;
        }
    }

    start(): void {
        if (this.isRunning) {
            console.warn('[ESP32-C3] Simulation already running');
            return;
        }

        this.isRunning = true;
        console.log('[ESP32-C3] Starting simulation');

        const tick = () => {
            if (!this.isRunning) return;

            try {
                // Execute CPU for one frame worth of cycles
                this.core.step(STEPS_PER_FRAME);

                // Schedule next frame
                this.rafId = requestAnimationFrame(tick);
            } catch (error) {
                console.error('[ESP32-C3] Simulation error:', error);
                this.stop(); // Stop on error to prevent infinite error loop
            }
        };

        // Start the simulation loop
        this.rafId = requestAnimationFrame(tick);
    }

    stop(): void {
        if (!this.isRunning) return;

        this.isRunning = false;

        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }

        console.log('[ESP32-C3] Simulation stopped');
    }

    addPinListener(gpioNum: number, callback: (high: boolean) => void): void {
        if (!this.pinListeners.has(gpioNum)) {
            this.pinListeners.set(gpioNum, new Set());
        }
        this.pinListeners.get(gpioNum)!.add(callback);
    }

    removePinListener(gpioNum: number, callback: (high: boolean) => void): void {
        const listeners = this.pinListeners.get(gpioNum);
        if (listeners) {
            listeners.delete(callback);
            if (listeners.size === 0) {
                this.pinListeners.delete(gpioNum);
            }
        }
    }

    setAnalogInput(channel: number, voltage: number): void {
        // Convert voltage (0-3.3V) to 12-bit ADC raw value (0-4095)
        const raw12bit = Math.round((voltage / 3.3) * 4095);
        const clampedRaw = Math.max(0, Math.min(4095, raw12bit));

        this.core.setADCValue(channel, clampedRaw);
    }

    setGPIOInput(gpioNum: number, high: boolean): void {
        this.core.setGPIOInput(gpioNum, high);
    }

    private handleGPIOOutput(pin: number, high: boolean): void {
        // Notify SimulationRunner about pin state change
        const pinId = `ESP${pin}`;
        const state = high ? 'HIGH' : 'LOW';

        // Get SimulationRunner instance and update pin state
        // Note: This assumes SimulationRunner has a static method or global instance
        // The actual implementation may need to be adjusted based on how SimulationRunner is structured
        try {
            const { setPinState } = require('../SimulationRunner');
            if (typeof setPinState === 'function') {
                setPinState(pinId, state);
            }
        } catch (error) {
            console.warn('[ESP32-C3] Could not notify SimulationRunner of pin change:', error);
        }

        // Fire pin listeners
        const listeners = this.pinListeners.get(pin);
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(high);
                } catch (error) {
                    console.error(`[ESP32-C3] Pin listener error for GPIO${pin}:`, error);
                }
            });
        }
    }

    private handleUARTByte(byte: number): void {
        // Convert byte to character and append to serial output
        const char = String.fromCharCode(byte);

        try {
            useForgeStore.getState().appendSerial(char);
        } catch (error) {
            console.error('[ESP32-C3] Failed to append serial data:', error);
        }
    }

    private handleI2CWrite(address: number, data: Uint8Array): void {
        try {
            // Get I2C bus manager instance - assuming it's a singleton
            // If I2CBusManager doesn't have getInstance, we'll need to get it from SimulationRunner
            const { simulationRunner } = require('../../modules/leapforge/engine/SimulationRunner');
            const i2cManager = simulationRunner.TWI; // Use the TWI property instead

            if (i2cManager && i2cManager.slaves) {
                const slave = i2cManager.slaves.get(address);

                if (slave) {
                    // Send data to the I2C slave
                    slave.onWrite(data);

                    // Trigger slave processing (e.g., SSD1306 display update)
                    if (typeof slave.onStop === 'function') {
                        slave.onStop();
                    }
                } else {
                    console.warn(`[ESP32-C3] No I2C slave found at address 0x${address.toString(16).padStart(2, '0')}`);
                }
            }
        } catch (error) {
            console.error('[ESP32-C3] I2C write error:', error);
        }
    }

    // Utility methods for debugging
    getRunningState(): boolean {
        return this.isRunning;
    }

    getPinListenerCount(): number {
        let total = 0;
        this.pinListeners.forEach(listeners => {
            total += listeners.size;
        });
        return total;
    }
}