/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */

import { simulationRunner } from './SimulationRunner';

/**
 * IRReceiverEmulator
 * 
 * Emulates an infrared receiver module (e.g., TSOP38238, VS1838B).
 * Receives IR codes from IR remote and generates the NEC protocol signal
 * on the DATA pin that Arduino libraries like IRremote can decode.
 * 
 * NEC Protocol Timing:
 * - Start burst: 9ms mark + 4.5ms space
 * - Logical '0': 562.5µs mark + 562.5µs space
 * - Logical '1': 562.5µs mark + 1.6875ms space
 * - Stop bit: 562.5µs mark
 * - Repeat code: 9ms mark + 2.25ms space + 562.5µs mark
 * 
 * The DATA pin is normally HIGH (idle), goes LOW during IR bursts.
 */
export class IRReceiverEmulator {
    private pin: string;
    private nodeId: string;
    private currentTransmission: number | null = null;

    constructor(pin: string, nodeId: string) {
        this.pin = pin;
        this.nodeId = nodeId;
        // Demodulated IR receiver outputs idle HIGH when no carrier is present.
        simulationRunner.setVirtualInput(this.pin, true);
        console.log(`[IR RECEIVER] Emulator created for node ${nodeId} on pin ${pin}`);
    }

    /**
     * Transmit an IR code using NEC protocol.
     * @param code - 8-bit IR command code (0x00-0xFF)
     * @param address - 8-bit address (default 0x00 for generic remote)
     */
    public transmit(code: number, address: number = 0x00) {
        if (this.currentTransmission !== null) {
            console.warn(`[IR RECEIVER] Transmission already in progress, ignoring new code 0x${code.toString(16)}`);
            return;
        }

        console.log(`[IR RECEIVER] Transmitting code 0x${code.toString(16).toUpperCase()} (address 0x${address.toString(16).toUpperCase()}) on ${this.pin}`);

        // Build 32-bit NEC frame: [address][~address][command][~command]
        const addressInv = (~address) & 0xFF;
        const commandInv = (~code) & 0xFF;
        const frame = (address) | (addressInv << 8) | (code << 16) | (commandInv << 24);

        this.transmitNECFrame(frame);
    }

    /**
     * Transmit a 32-bit NEC protocol frame.
     * Frame format: LSB first, 32 bits total
     */
    private transmitNECFrame(frame: number) {
        const isESP32 = simulationRunner.isESP32C3Board;
        const baseCycles = isESP32 ? 0 : simulationRunner.getCycles();
        let elapsed = 0;

        // Helper to convert microseconds to CPU cycles (16 MHz for AVR)
        const us = (microseconds: number) => isESP32 ? microseconds / 1000 : Math.floor(microseconds * 16);

        // Helper to schedule pin state changes
        const schedulePin = (delay: number, state: boolean) => {
            elapsed += delay;
            if (isESP32) {
                // ESP32: use setTimeout (no cycle-accurate timing)
                setTimeout(() => {
                    simulationRunner.setVirtualInput(this.pin, state);
                }, elapsed);
            } else {
                // AVR: schedule using absolute CPU cycles relative to the current core time.
                simulationRunner.scheduleAt(baseCycles + elapsed, () => {
                    simulationRunner.setVirtualInput(this.pin, state);
                });
            }
        };

        // Mark transmission as in progress
        this.currentTransmission = frame;

        // NEC Protocol transmission sequence:

        // 1. Start burst: 9ms LOW (mark) + 4.5ms HIGH (space)
        schedulePin(0, false);           // Start mark
        schedulePin(us(9000), true);     // Start space
        schedulePin(us(4500), false);    // Ready for data

        // 2. Transmit 32 bits (LSB first)
        for (let i = 0; i < 32; i++) {
            const bit = (frame >> i) & 1;

            // Mark: 562.5µs LOW
            schedulePin(us(562.5), true);

            // Space: 562.5µs for '0', 1687.5µs for '1'
            if (bit === 0) {
                schedulePin(us(562.5), false);
            } else {
                schedulePin(us(1687.5), false);
            }
        }

        // 3. Stop bit: 562.5µs LOW
        schedulePin(us(562.5), true);

        // 4. Return to idle (HIGH) and mark transmission complete
        schedulePin(us(100), true);

        // Clear transmission flag after completion
        const totalTime = isESP32 ? elapsed : elapsed / 16000; // Convert to ms for setTimeout
        setTimeout(() => {
            this.currentTransmission = null;
            console.log(`[IR RECEIVER] Transmission complete for code 0x${(frame >> 16 & 0xFF).toString(16).toUpperCase()}`);
        }, totalTime + 100);
    }

    /**
     * Check if a transmission is currently in progress.
     */
    public isBusy(): boolean {
        return this.currentTransmission !== null;
    }

    /**
     * Get the current pin state (for debugging).
     */
    public getPin(): string {
        return this.pin;
    }
}
