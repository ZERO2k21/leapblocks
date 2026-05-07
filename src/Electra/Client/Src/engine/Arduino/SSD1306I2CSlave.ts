/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
/**
 * SSD1306I2CSlave.ts
 * Wraps SSD1306Emulator as an I2C slave for the I2CBusManager.
 * I2C address: 0x3C (default) or 0x3D.
 */
import { I2CSlave } from './I2CBusManager';
import { SSD1306Emulator } from './SSD1306Emulator';

export class SSD1306I2CSlave implements I2CSlave {
  readonly i2cAddress: number;
  private emulator: SSD1306Emulator;
  private controlByte: number | null = null;

  constructor(address: number, onUpdate: (pixels: Uint8Array, displayOn: boolean) => void) {
    this.i2cAddress = address;
    this.emulator = new SSD1306Emulator(onUpdate);
  }

  onStart(_repeated: boolean) {
    this.controlByte = null;
  }

  onConnect(_write: boolean): boolean {
    return true;
  }

  onWrite(data: number): boolean {
    if (this.controlByte === null) {
      // First byte after address is control byte
      this.controlByte = data;
    } else {
      // Subsequent bytes are command or data based on control byte
      this.emulator.processI2CByte(this.controlByte, data);
    }
    return true;
  }

  onRead(_ack: boolean): number {
    return 0xFF; // SSD1306 doesn't typically support reads
  }

  onStop() {
    this.controlByte = null;
  }

  getEmulator(): SSD1306Emulator {
    return this.emulator;
  }
}
