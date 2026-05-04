/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
/**
 * SDCardSPISlave.ts
 * Bridges the AVR SPI bus to the SDCardEmulator.
 *
 * The microSD card uses 7-wire SPI interface:
 *   - CS   LOW  → chip selected
 *   - MOSI → command/data from master
 *   - MISO ← response/data from card
 *   - SCK  → serial clock
 *   - VCC  → power (3.3V or 5V tolerant)
 *   - GND  → ground
 *   - CD   → card detect (not used in simulation)
 *
 * IMPORTANT — AVRSPI.onByte is SPIByteTransferCallback = (value: u8) => void.
 * The callback MUST call spi.completeTransfer(receivedByte) within transferCycles
 * CPU cycles, otherwise the AVR hangs waiting for SPIF.
 *
 * Usage in CircuitEngine:
 *   const slave = new SDCardSPISlave(spi, onUpdate);
 *   slave.attach();   // hooks spi.onByte
 *   slave.detach();   // restores default spi.onByte
 */
import { AVRSPI } from '../../lib/avr8js';
import { SDCardEmulator, SDCardUpdateCallback } from './SDCardEmulator';

export class SDCardSPISlave {
  private emulator: SDCardEmulator;
  private csActive = false; // CS pin: true = selected (CS LOW)
  private spi: AVRSPI;
  private byteCount = 0;

  constructor(spi: AVRSPI, onUpdate: SDCardUpdateCallback = () => {}) {
    this.spi = spi;
    this.emulator = new SDCardEmulator(onUpdate);
  }

  /**
   * Hook into the SPI bus. Replaces spi.onByte with our handler.
   * Must be called after simulationRunner.initCPU().
   */
  attach(): void {
    this.spi.onByte = (byte: number) => {
      // Process the byte through the emulator
      if (this.csActive) {
        // Every 6 bytes starts a new command (command + 4 args + CRC/stop bit)
        if (this.byteCount % 6 === 0) {
          // Start of new command
          this.emulator.writeCommand(byte);
          console.log(`[SD SPI] Command byte: 0x${byte.toString(16)}`);
        } else {
          // Command argument bytes
          this.emulator.writeByte(byte);
        }
        this.byteCount++;
      } else {
        this.byteCount = 0;
      }

      // CRITICAL: complete the SPI transfer so the AVR CPU doesn't deadlock.
      // Return the response byte from the emulator
      const response = this.emulator.readByte();
      this.spi.completeTransfer(response);
    };
  }

  /** Restore the default SPI onByte handler. */
  detach(): void {
    // Restore default: completes transfer with 0 after transferCycles
    this.spi.onByte = (value: number) => {
      this.spi.completeTransfer(0);
    };
  }

  /** Call when the CS pin changes. Pass true when CS goes LOW (chip selected). */
  setCS(isActive: boolean): void {
    if (!this.csActive && isActive) {
      this.byteCount = 0; // Reset byte counter on CS activation
      console.log('[SD SPI] Card selected (CS LOW)');
    } else if (this.csActive && !isActive) {
      console.log('[SD SPI] Card deselected (CS HIGH)');
    }
    this.csActive = isActive;
    this.emulator.setCS(isActive);
  }

  getEmulator(): SDCardEmulator {
    return this.emulator;
  }
}
