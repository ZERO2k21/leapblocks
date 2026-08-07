/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 *
 * EM-18 RFID Reader Module Emulator
 *
 * EM-18 Specifications:
 *   - Operating Voltage: 5V DC
 *   - Operating Frequency: 125 kHz
 *   - Reading Range: Up to 10 cm
 *   - Baud Rate: 9600 bps (default)
 *   - Data Format: 12-byte ASCII string (card UID)
 *
 * This emulator simulates the EM-18 RFID reader module.
 * When a card is detected, it sends the card UID via the TX pin
 * using serial communication at 9600 baud.
 */

import { simulationRunner } from './SimulationRunner';

/**
 * EM-18 RFID Reader Emulator
 * Simulates an EM-18 RFID reader module that sends card UIDs via serial (TX pin).
 * The TX pin idles HIGH and sends data when a card is detected.
 */
export class RFIDReaderEmulator {
    private _cardPresent = false;
    private _cardUid = 'E24B891F00';
    private _isTransmitting = false;

    /**
     * @param txPin   AVR pin ID for TX (e.g. "PD1" for Serial TX)
     * @param nodeId  ReactFlow node ID for the EM-18 module
     */
    constructor(
        private readonly txPin: string,
        private readonly nodeId: string = '',
    ) {
        // Set initial state to HIGH (idle state for UART)
        simulationRunner.setVirtualInput(this.txPin, true);
    }

    /**
     * Get the current card UID
     */
    public get cardUid(): string {
        return this._cardUid;
    }

    /**
     * Set the card UID (10 hex characters)
     */
    public set cardUid(uid: string) {
        this._cardUid = uid.replace(/\s/g, '').toUpperCase().slice(0, 10);
    }

    /**
     * Get card presence status
     */
    public get isCardPresent(): boolean {
        return this._cardPresent;
    }

    /**
     * Simulate presenting a card to the reader.
     * This triggers serial transmission of the card UID.
     * @param uid Optional card UID to send (default: uses current cardUid)
     */
    public presentCard(uid?: string): void {
        if (this._isTransmitting) {
            console.warn('[EM-18 RFID] Already transmitting, ignoring new card');
            return;
        }

        if (uid) {
            this.cardUid = uid;
        }

        this._cardPresent = true;
        this._isTransmitting = true;

        // Send card UID via serial (EM-18 format: 12 bytes)
        this.sendCardData();

        console.log(`[EM-18 RFID] Card detected: ${this._cardUid}`);
    }

    /**
     * Remove card from reader
     */
    public removeCard(): void {
        this._cardPresent = false;
        this._isTransmitting = false;

        // Return TX pin to idle state (HIGH)
        simulationRunner.setVirtualInput(this.txPin, true);

        console.log('[EM-18 RFID] Card removed');
    }

    /**
     * Send card data via serial (EM-18 format).
     * EM-18 sends: CR LF + 10 hex chars + CR LF (or just the UID as ASCII)
     * For simplicity, we send the UID as ASCII bytes followed by CR LF.
     */
    private sendCardData(): void {
        // EM-18 sends data as ASCII bytes at 9600 baud
        // Format: 10 hex characters + CR (0x0D) + LF (0x0A)
        const data = this._cardUid + '\r\n';

        // Inject data directly into the serial input buffer
        // This makes the data available for Serial.read() in the Arduino sketch
        simulationRunner.sendSerialInput(data);

        console.log(`[EM-18 RFID] Sent card data: ${data.trim()}`);

        // Mark transmission as complete
        this._isTransmitting = false;
    }

    /**
     * Get the current state for simulation overlay
     */
    public getState(): { cardPresent: boolean; cardUid: string; isTransmitting: boolean } {
        return {
            cardPresent: this._cardPresent,
            cardUid: this._cardUid,
            isTransmitting: this._isTransmitting,
        };
    }
}
