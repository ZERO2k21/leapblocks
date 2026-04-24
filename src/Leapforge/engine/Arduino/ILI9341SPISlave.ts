/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
/**
 * ILI9341SPISlave.ts
 * Bridges the AVR SPI bus to the ILI9341Emulator.
 *
 * The ILI9341 uses a 4-wire SPI interface plus a D/C (Data/Command) pin:
 *   - CS   LOW  → chip selected
 *   - D/C  LOW  → next byte is a command
 *   - D/C  HIGH → next byte is data
 *   - MOSI → byte stream from master
 *
 * IMPORTANT — AVRSPI.onByte is SPIByteTransferCallback = (value: u8) => void.
 * The callback MUST call spi.completeTransfer(receivedByte) within transferCycles
 * CPU cycles, otherwise the AVR hangs waiting for SPIF.
 *
 * Usage in CircuitEngine:
 *   const slave = new ILI9341SPISlave(spi, onUpdate);
 *   slave.attach();   // hooks spi.onByte
 *   slave.detach();   // restores default spi.onByte
 */
import { AVRSPI } from '../lib/avr8js';
import { ILI9341Emulator, ILI9341UpdateCallback } from './ILI9341Emulator';

export class ILI9341SPISlave {
  private emulator: ILI9341Emulator;
  private dcHigh = false;   // D/C pin: true = data, false = command
  private csActive = false; // CS pin: true = selected (CS LOW)
  private spi: AVRSPI;

  constructor(spi: AVRSPI, onUpdate: ILI9341UpdateCallback) {
    this.spi = spi;
    this.emulator = new ILI9341Emulator(onUpdate);
  }

  /**
   * Hook into the SPI bus. Replaces spi.onByte with our handler.
   * Must be called after simulationRunner.initCPU().
   */
  attach(): void {
    this.spi.onByte = (byte: number) => {
      // Process the byte through the emulator
      if (this.csActive) {
        if (this.dcHigh) {
          this.emulator.writeData(byte);
        } else {
          this.emulator.writeCommand(byte);
        }
      }
      // CRITICAL: complete the SPI transfer so the AVR CPU doesn't deadlock.
      // ILI9341 is write-only in typical use; return 0xFF on MISO.
      this.spi.completeTransfer(0xFF);
    };
  }

  /** Restore the default SPI onByte handler. */
  detach(): void {
    // Restore default: completes transfer with 0 after transferCycles
    this.spi.onByte = (value: number) => {
      this.spi.completeTransfer(0);
    };
  }

  /** Call when the D/C pin changes. HIGH = data mode, LOW = command mode. */
  setDC(isHigh: boolean): void {
    this.dcHigh = isHigh;
  }

  /** Call when the CS pin changes. Pass true when CS goes LOW (chip selected). */
  setCS(isActive: boolean): void {
    this.csActive = isActive;
  }

  getEmulator(): ILI9341Emulator {
    return this.emulator;
  }
}
