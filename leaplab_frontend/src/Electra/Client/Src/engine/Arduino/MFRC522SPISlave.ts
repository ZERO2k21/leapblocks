/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */

/**
 * MFRC522SPISlave.ts
 * Bridges the AVR SPI bus to the MFRC522 RFID reader simulation.
 *
 * MFRC522 SPI Protocol Details:
 * - Address Byte:
 *   - Bit 7: Read (1) or Write (0)
 *   - Bits 6..1: Register address (0x00..0x3F)
 *   - Bit 0: 0
 * - Data Phase:
 *   - For Read: Master sends 0x00 dummy bytes, Slave returns register / FIFO bytes.
 *   - For Write: Master sends data bytes to be written to register / FIFO.
 */
import { AVRSPI } from '../../lib/avr8js';

export class MFRC522SPISlave {
  private spi: AVRSPI;
  private cardPresent = false;
  private uid: number[] = [];
  private cardName = '';

  // MFRC522 Register state buffer (64 registers)
  private registers = new Uint8Array(0x40);
  private fifo: number[] = [];

  // Transaction state tracking
  private currentReg = 0;
  private isRead = false;
  private addressPhase = true;

  constructor(spi: AVRSPI) {
    this.spi = spi;
    this.resetRegisters();
  }

  /** Reset registers to default state */
  public resetRegisters(): void {
    this.registers.fill(0);
    this.registers[0x37] = 0x92; // VersionReg = MFRC522 v2.0 (official chip version)
    this.registers[0x01] = 0x00; // CommandReg = PCD_Idle
    this.registers[0x04] = 0x00; // ComIrqReg
    this.registers[0x0A] = 0x00; // FIFOLengthReg
    this.fifo = [];
    this.addressPhase = true;
  }

  /** Update card state when user presents a card in the UI */
  public presentCard(uid: number[], cardName: string): void {
    this.cardPresent = true;
    this.uid = uid.length > 0 ? [...uid] : [0xA1, 0xB2, 0xC3, 0xD4];
    this.cardName = cardName;
    console.log(`[MFRC522 SPI Slave] Card presented: ${cardName} UID=${this.uid.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ')}`);
  }

  /** Update card state when user removes card */
  public removeCard(): void {
    this.cardPresent = false;
    this.uid = [];
    this.cardName = '';
    console.log('[MFRC522 SPI Slave] Card removed');
  }

  /**
   * Hook into the SPI bus. Replaces spi.onByte with our handler.
   */
  public attach(): void {
    this.spi.onByte = (byte: number) => {
      let responseByte = 0x00;

      if (this.addressPhase) {
        // Address phase: byte is (address << 1) with MSB set for read
        this.isRead = (byte & 0x80) !== 0;
        this.currentReg = (byte >> 1) & 0x3F;
        this.addressPhase = false;
        responseByte = 0x00; // Slave returns 0x00 during address byte
      } else {
        // Data phase: read or write
        if (this.isRead) {
          responseByte = this.readRegister(this.currentReg);
        } else {
          this.writeRegister(this.currentReg, byte);
          responseByte = 0x00;
        }
        // If not FIFODataReg (0x09), reset addressPhase for next single byte transaction
        if (this.currentReg !== 0x09) {
          this.addressPhase = true;
        }
      }

      // Schedule completeTransfer after transferCycles to match AVR hardware SPI clock timing
      const cpu = (this.spi as any).cpu;
      const cycles = this.spi.transferCycles || 16;
      if (cpu && typeof cpu.addClockEvent === 'function') {
        cpu.addClockEvent(() => {
          this.spi.completeTransfer(responseByte);
        }, cycles);
      } else {
        this.spi.completeTransfer(responseByte);
      }
    };
  }

  /** Restore default SPI handler */
  public detach(): void {
    this.spi.onByte = (value: number) => {
      const cpu = (this.spi as any).cpu;
      const cycles = this.spi.transferCycles || 16;
      if (cpu && typeof cpu.addClockEvent === 'function') {
        cpu.addClockEvent(() => {
          this.spi.completeTransfer(0);
        }, cycles);
      } else {
        this.spi.completeTransfer(0);
      }
    };
  }

  /** Reset address phase (e.g. when SS toggles) */
  public resetFrame(): void {
    this.addressPhase = true;
  }

  private readRegister(reg: number): number {
    if (reg === 0x37) {
      // VersionReg — MFRC522 v2.0
      return 0x92;
    }
    if (reg === 0x09) {
      // FIFODataReg
      if (this.fifo.length > 0) {
        const val = this.fifo.shift()!;
        this.registers[0x0A] = this.fifo.length;
        return val;
      }
      return 0x00;
    }
    if (reg === 0x0A) {
      // FIFOLengthReg
      return this.fifo.length;
    }
    if (reg === 0x04) {
      // ComIrqReg: RxIRq (0x20) | IdleIRq (0x10) | TxIRq (0x01)
      return 0x31;
    }
    if (reg === 0x06) {
      // ErrorReg
      return 0x00;
    }
    if (reg === 0x08) {
      // Status2Reg
      return 0x00;
    }
    return this.registers[reg] ?? 0x00;
  }

  private writeRegister(reg: number, val: number): void {
    this.registers[reg] = val;

    if (reg === 0x01) {
      // CommandReg
      this.executeCommand(val);
    } else if (reg === 0x09) {
      // FIFODataReg — push byte
      if (this.fifo.length < 64) {
        this.fifo.push(val);
        this.registers[0x0A] = this.fifo.length;
      }
    } else if (reg === 0x0A) {
      // FIFOLengthReg — write with bit 7 set flushes FIFO
      if (val & 0x80) {
        this.fifo = [];
        this.registers[0x0A] = 0;
      }
    }
  }

  private executeCommand(cmd: number): void {
    if (cmd === 0x0F) {
      // PCD_SoftReset
      this.resetRegisters();
      return;
    }

    if (cmd === 0x00) {
      // PCD_Idle
      return;
    }

    if (cmd === 0x0E) {
      // PCD_MFAuthent — simulate successful authentication
      this.fifo = [];
      this.registers[0x0A] = 0;
      this.registers[0x04] = 0x10; // IdleIRq
      this.registers[0x08] = 0x08; // Status2Reg: MFCrypto1On bit set
      return;
    }

    if (cmd === 0x0C) {
      // PCD_Transceive: Transmit FIFO contents and receive response into FIFO
      if (!this.cardPresent || this.uid.length === 0) {
        this.fifo = [];
        this.registers[0x0A] = 0;
        this.registers[0x04] = 0x01; // TimerIRq (timeout)
        return;
      }

      const inputLen = this.fifo.length;
      const lastCmd = inputLen > 0 ? this.fifo[0] : 0;
      this.fifo = []; // clear input FIFO

      if (lastCmd === 0x26 || lastCmd === 0x52) {
        // PICC_CMD_REQA (0x26) or PICC_CMD_WUPA (0x52) -> Return ATQA [0x04, 0x00]
        this.fifo = [0x04, 0x00];
      } else if (lastCmd === 0x93 || lastCmd === 0x95 || lastCmd === 0x97) {
        // PICC_CMD_SEL_CL1 (0x93), CL2 (0x95), CL3 (0x97)
        if (inputLen > 2) {
          // Step 2 of PICC_Select: NVB == 0x70, sending 7 bytes UID+BCC -> Return 1-byte SAK (0x08)
          this.fifo = [0x08];
        } else {
          // Step 1 of PICC_Select: NVB == 0x20 -> Return 5-byte UID+BCC
          const uidBytes = this.uid.length >= 4 ? this.uid.slice(0, 4) : [0xA1, 0xB2, 0xC3, 0xD4];
          const bcc = uidBytes[0] ^ uidBytes[1] ^ uidBytes[2] ^ uidBytes[3];
          this.fifo = [...uidBytes, bcc];
        }
      } else if (lastCmd === 0x30) {
        // PICC_CMD_MF_READ (0x30) -> Return 16 dummy bytes of block data
        this.fifo = new Array(16).fill(0x00);
      } else if (lastCmd === 0x50) {
        // PICC_CMD_MF_HALT (0x50) -> Halt card
        this.fifo = [];
      } else {
        // Default response: Return UID bytes + BCC
        const uidBytes = this.uid.length >= 4 ? this.uid.slice(0, 4) : [0xA1, 0xB2, 0xC3, 0xD4];
        const bcc = uidBytes[0] ^ uidBytes[1] ^ uidBytes[2] ^ uidBytes[3];
        this.fifo = [...uidBytes, bcc];
      }

      this.registers[0x0A] = this.fifo.length;
      this.registers[0x04] = 0x31; // RxIRq | IdleIRq | TxIRq
    }
  }
}
