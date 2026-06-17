/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 *
 * IR Receiver Emulator (NEC Protocol)
 *
 * NEC IR Protocol Timing:
 *   - Carrier frequency: 38 kHz (modulated)
 *   - Start burst: 9ms MARK + 4.5ms SPACE
 *   - Logical '0': 560µs MARK + 560µs SPACE (1.12ms total)
 *   - Logical '1': 560µs MARK + 1.69ms SPACE (2.25ms total)
 *   - Stop bit: 560µs MARK
 *   - Frame: 32 bits (Address + ~Address + Command + ~Command)
 *   - Repeat: 9ms MARK + 2.25ms SPACE + 560µs MARK (every 110ms while button held)
 *
 * This emulator generates the NEC protocol signal on the DATA pin when
 * an IR remote button is pressed, compatible with IRremote.h library.
 */

import { PinState, simulationRunner } from './SimulationRunner';

const CPU_MHZ = 16;
/** Convert microseconds → AVR clock cycles (integer) */
const us = (n: number) => Math.round(n * CPU_MHZ);

// NEC Protocol Timing Constants (in microseconds)
const NEC_TIMING = {
    START_MARK: 9000,
    START_SPACE: 4500,
    BIT_MARK: 560,
    BIT_0_SPACE: 560,
    BIT_1_SPACE: 1690,
    STOP_MARK: 560,
    REPEAT_MARK: 9000,
    REPEAT_SPACE: 2250,
    REPEAT_PERIOD: 110000, // 110ms between repeat frames
};

/**
 * IR Receiver Emulator
 * Simulates an IR receiver module (like TSOP38238) receiving NEC protocol signals.
 * The DATA pin is normally HIGH (idle), and goes LOW during IR pulses (inverted logic).
 */
export class IRReceiverEmulator {
    private isTransmitting = false;
    private repeatTimer: number | null = null;
    private lastCommand: { address: number; command: number } | null = null;

    /**
     * @param pin    AVR pin ID (e.g. "PD2")
     * @param nodeId ReactFlow node ID for the IR receiver
     */
    constructor(
        private readonly pin: string,
        private readonly nodeId: string = '',
    ) {
        // Set initial state to HIGH (idle)
        simulationRunner.setVirtualInput(this.pin, true);
    }

    /**
     * Transmit an IR code when a remote button is pressed.
     * @param address NEC address byte (0x00 for generic remotes)
     * @param command NEC command byte (button code)
     * @param repeat  Whether this is a repeat signal (button held)
     */
    public transmit(address: number, command: number, repeat: boolean = false) {
        if (this.isTransmitting && !repeat) {
            console.warn('[IR RECEIVER] Already transmitting, ignoring new command');
            return;
        }

        // Cancel any pending repeat timer
        if (this.repeatTimer !== null) {
            clearTimeout(this.repeatTimer);
            this.repeatTimer = null;
        }

        if (repeat && this.lastCommand) {
            // Send repeat code
            this.sendRepeatCode();
        } else {
            // Send full NEC frame
            this.lastCommand = { address, command };
            this.sendNECFrame(address, command);
        }
    }

    /**
     * Stop transmission (button released).
     */
    public release() {
        if (this.repeatTimer !== null) {
            clearTimeout(this.repeatTimer);
            this.repeatTimer = null;
        }
        this.lastCommand = null;
        this.isTransmitting = false;

        // Return to idle state (HIGH)
        simulationRunner.setVirtualInput(this.pin, true);
        console.log(`[IR RECEIVER] Released (${this.nodeId})`);
    }

    // ── NEC Protocol Implementation ─────────────────────────────────────────

    /**
     * Send a complete NEC frame (32 bits).
     * Frame format: [Address 8 bits] [~Address 8 bits] [Command 8 bits] [~Command 8 bits]
     */
    private sendNECFrame(address: number, command: number) {
        this.isTransmitting = true;
        const now = simulationRunner.getCycles();
        let t = now;

        console.log(`[IR RECEIVER] Sending NEC frame: addr=0x${address.toString(16).padStart(2, '0')}, cmd=0x${command.toString(16).padStart(2, '0')}`);

        // Start burst: 9ms MARK + 4.5ms SPACE
        this.scheduleMark(t, NEC_TIMING.START_MARK);
        t += us(NEC_TIMING.START_MARK);
        this.scheduleSpace(t, NEC_TIMING.START_SPACE);
        t += us(NEC_TIMING.START_SPACE);

        // Build 32-bit frame
        const frame = [
            address & 0xFF,
            (~address) & 0xFF,
            command & 0xFF,
            (~command) & 0xFF,
        ];

        // Send 32 bits (LSB first)
        for (const byte of frame) {
            for (let bit = 0; bit < 8; bit++) {
                const isBit1 = (byte & (1 << bit)) !== 0;

                // Bit MARK (always 560µs)
                this.scheduleMark(t, NEC_TIMING.BIT_MARK);
                t += us(NEC_TIMING.BIT_MARK);

                // Bit SPACE (560µs for 0, 1690µs for 1)
                const spaceTime = isBit1 ? NEC_TIMING.BIT_1_SPACE : NEC_TIMING.BIT_0_SPACE;
                this.scheduleSpace(t, spaceTime);
                t += us(spaceTime);
            }
        }

        // Stop bit: 560µs MARK
        this.scheduleMark(t, NEC_TIMING.STOP_MARK);
        t += us(NEC_TIMING.STOP_MARK);

        // Return to idle (HIGH)
        simulationRunner.scheduleAt(t, () => {
            simulationRunner.setVirtualInput(this.pin, true);
            this.isTransmitting = false;
        });

        // Schedule repeat code if button is still held
        // (In real usage, the remote component will call transmit() again with repeat=true)
    }

    /**
     * Send a repeat code (sent every 110ms while button is held).
     * Repeat format: 9ms MARK + 2.25ms SPACE + 560µs MARK
     */
    private sendRepeatCode() {
        const now = simulationRunner.getCycles();
        let t = now;

        console.log(`[IR RECEIVER] Sending repeat code`);

        // Repeat burst: 9ms MARK + 2.25ms SPACE + 560µs MARK
        this.scheduleMark(t, NEC_TIMING.REPEAT_MARK);
        t += us(NEC_TIMING.REPEAT_MARK);
        this.scheduleSpace(t, NEC_TIMING.REPEAT_SPACE);
        t += us(NEC_TIMING.REPEAT_SPACE);
        this.scheduleMark(t, NEC_TIMING.STOP_MARK);
        t += us(NEC_TIMING.STOP_MARK);

        // Return to idle (HIGH)
        simulationRunner.scheduleAt(t, () => {
            simulationRunner.setVirtualInput(this.pin, true);
        });
    }

    /**
     * Schedule a MARK (IR LED on, receiver output LOW).
     * In NEC protocol, MARK means the IR LED is pulsing at 38kHz.
     * The receiver module outputs LOW during MARK periods.
     */
    private scheduleMark(startCycles: number, durationUs: number) {
        simulationRunner.scheduleAt(startCycles, () => {
            simulationRunner.setVirtualInput(this.pin, false); // LOW = IR detected
        });
    }

    /**
     * Schedule a SPACE (IR LED off, receiver output HIGH).
     * The receiver module outputs HIGH during SPACE periods.
     */
    private scheduleSpace(startCycles: number, durationUs: number) {
        simulationRunner.scheduleAt(startCycles, () => {
            simulationRunner.setVirtualInput(this.pin, true); // HIGH = no IR
        });
    }

    /**
     * Cleanup method to be called when the emulator is destroyed.
     */
    public destroy() {
        this.release();
    }
}
