/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
/**
 * MPU6050I2CSlave.ts
 * Wraps MPU6050Emulator as an I2C slave for the I2CBusManager.
 * Default I2C address: 0x68 (AD0=LOW). Use 0x69 when AD0=HIGH.
 */
import { I2CSlave } from './I2CBusManager';
import { MPU6050Emulator, MPU6050SensorValues } from './MPU6050Emulator';

export class MPU6050I2CSlave implements I2CSlave {
  readonly i2cAddress: number;
  private emulator: MPU6050Emulator;

  constructor(address: number) {
    this.i2cAddress = address;
    this.emulator = new MPU6050Emulator();
  }

  /** Push new sensor values into the register map. */
  setSensorValues(values: MPU6050SensorValues) {
    this.emulator.updateRegisters(values);
  }

  // ── I2CSlave interface ───────────────────────────────────────────────────

  onStart(repeated: boolean) {
    this.emulator.onStart(repeated);
  }

  onConnect(_write: boolean): boolean {
    return true; // always ACK
  }

  onWrite(data: number): boolean {
    return this.emulator.onWrite(data);
  }

  onRead(ack: boolean): number {
    return this.emulator.onRead(ack);
  }

  onStop() {
    this.emulator.onStop();
  }

  getEmulator(): MPU6050Emulator {
    return this.emulator;
  }
}
