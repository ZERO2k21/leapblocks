/**
 * DS1307Emulator.ts
 * Emulates the DS1307 Real-Time Clock via I2C (address 0x68).
 * Provides BCD-encoded time registers that the AVR reads via TWI.
 */
import { I2CSlave } from './I2CBusManager';

export class DS1307Emulator implements I2CSlave {
  readonly i2cAddress = 0x68;
  private registers = new Uint8Array(64);
  private regPointer = 0;
  private firstByte = true;

  constructor() {
    this.syncToSystemTime();
  }

  syncToSystemTime() {
    const now = new Date();
    this.registers[0] = this.toBCD(now.getSeconds());
    this.registers[1] = this.toBCD(now.getMinutes());
    this.registers[2] = this.toBCD(now.getHours());
    this.registers[3] = now.getDay() + 1;
    this.registers[4] = this.toBCD(now.getDate());
    this.registers[5] = this.toBCD(now.getMonth() + 1);
    this.registers[6] = this.toBCD(now.getFullYear() % 100);
    this.registers[7] = 0x00;
  }

  private toBCD(value: number): number {
    return ((Math.floor(value / 10) & 0x0F) << 4) | (value % 10);
  }

  onStart(_repeated: boolean) {
    this.firstByte = true;
    this.syncToSystemTime();
  }

  onConnect(_write: boolean): boolean {
    return true; // Always ACK
  }

  onWrite(data: number): boolean {
    if (this.firstByte) {
      this.regPointer = data & 0x3F;
      this.firstByte = false;
    } else {
      this.registers[this.regPointer & 0x3F] = data;
      this.regPointer = (this.regPointer + 1) & 0x3F;
    }
    return true;
  }

  onRead(_ack: boolean): number {
    const val = this.registers[this.regPointer & 0x3F];
    this.regPointer = (this.regPointer + 1) & 0x3F;
    return val;
  }

  onStop() {
    this.firstByte = true;
  }
}
