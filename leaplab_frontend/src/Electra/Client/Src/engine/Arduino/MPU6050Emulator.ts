/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
/**
 * MPU6050Emulator.ts
 * Emulates the MPU-6050 6-axis IMU (accelerometer + gyroscope) via I2C.
 *
 * I2C address: 0x68 (AD0=LOW, default) or 0x69 (AD0=HIGH)
 *
 * Register map (subset — sufficient for Wire/MPU6050 Arduino libraries):
 *   0x19  SMPLRT_DIV       sample rate divider
 *   0x1A  CONFIG           DLPF config
 *   0x1B  GYRO_CONFIG      gyro full-scale
 *   0x1C  ACCEL_CONFIG     accel full-scale
 *   0x3B  ACCEL_XOUT_H     accel X high byte  }
 *   0x3C  ACCEL_XOUT_L     accel X low byte   } 16-bit signed, big-endian
 *   0x3D  ACCEL_YOUT_H
 *   0x3E  ACCEL_YOUT_L
 *   0x3F  ACCEL_ZOUT_H
 *   0x40  ACCEL_ZOUT_L
 *   0x41  TEMP_OUT_H       temperature high byte
 *   0x42  TEMP_OUT_L       temperature low byte
 *   0x43  GYRO_XOUT_H
 *   0x44  GYRO_XOUT_L
 *   0x45  GYRO_YOUT_H
 *   0x46  GYRO_YOUT_L
 *   0x47  GYRO_ZOUT_H
 *   0x48  GYRO_ZOUT_L
 *   0x6B  PWR_MGMT_1       power management (sleep bit)
 *   0x75  WHO_AM_I         returns 0x68
 *
 * Sensor value ranges (±2g / ±250°/s defaults):
 *   Accel: raw = value_g * 16384   (LSB/g at ±2g)
 *   Gyro:  raw = value_dps * 131   (LSB/°/s at ±250°/s)
 *   Temp:  raw = (temp_C * 340) + 36307
 */

export interface MPU6050SensorValues {
  accelX: number;  // g  (-2 … +2)
  accelY: number;  // g
  accelZ: number;  // g  (1.0 = flat, gravity)
  gyroX:  number;  // °/s  (-250 … +250)
  gyroY:  number;  // °/s
  gyroZ:  number;  // °/s
  temp:   number;  // °C  (-40 … +85)
}

const ACCEL_SCALE = 16384; // LSB/g  at ±2g
const GYRO_SCALE  = 131;   // LSB/°/s at ±250°/s

function toInt16Bytes(value: number): [number, number] {
  const raw = Math.round(value) & 0xFFFF;
  return [(raw >> 8) & 0xFF, raw & 0xFF];
}

export class MPU6050Emulator {
  // Register file — 256 bytes
  private regs = new Uint8Array(256);

  // Current I2C register pointer (set by first write byte after address)
  private regPointer = 0;
  private pointerSet = false;

  constructor() {
    this.regs[0x75] = 0x68; // WHO_AM_I
    this.regs[0x6B] = 0x40; // PWR_MGMT_1: sleep=1 on power-up
    this.updateRegisters({
      accelX: 0, accelY: 0, accelZ: 1,
      gyroX: 0,  gyroY: 0,  gyroZ: 0,
      temp: 25,
    });
  }

  /**
   * Update the sensor register values from simulated sensor data.
   * Call this whenever the user moves a slider.
   */
  updateRegisters(v: MPU6050SensorValues) {
    const ax = toInt16Bytes(v.accelX * ACCEL_SCALE);
    const ay = toInt16Bytes(v.accelY * ACCEL_SCALE);
    const az = toInt16Bytes(v.accelZ * ACCEL_SCALE);
    const gx = toInt16Bytes(v.gyroX  * GYRO_SCALE);
    const gy = toInt16Bytes(v.gyroY  * GYRO_SCALE);
    const gz = toInt16Bytes(v.gyroZ  * GYRO_SCALE);
    const tp = toInt16Bytes(v.temp * 340 + 36307);

    this.regs[0x3B] = ax[0]; this.regs[0x3C] = ax[1];
    this.regs[0x3D] = ay[0]; this.regs[0x3E] = ay[1];
    this.regs[0x3F] = az[0]; this.regs[0x40] = az[1];
    this.regs[0x41] = tp[0]; this.regs[0x42] = tp[1];
    this.regs[0x43] = gx[0]; this.regs[0x44] = gx[1];
    this.regs[0x45] = gy[0]; this.regs[0x46] = gy[1];
    this.regs[0x47] = gz[0]; this.regs[0x48] = gz[1];
  }

  // ── I2C protocol ────────────────────────────────────────────────────────

  onStart(_repeated: boolean) {
    this.pointerSet = false;
  }

  onStop() {
    this.pointerSet = false;
  }

  /** Master writes a byte — first byte sets the register pointer, subsequent bytes write registers */
  onWrite(data: number): boolean {
    if (!this.pointerSet) {
      this.regPointer = data & 0xFF;
      this.pointerSet = true;
    } else {
      if (this.regPointer === 0x6B) {
        if (data & 0x80) {
          // Device reset: reset registers to default state and clear the reset bit
          this.regs.fill(0);
          this.regs[0x75] = 0x68; // WHO_AM_I
          this.regs[0x6B] = 0x40; // Default sleep mode (reset bit 0x80 is cleared)
        } else {
          this.regs[0x6B] = data;
        }
      } else {
        // Write to register
        this.regs[this.regPointer] = data;
      }
      this.regPointer = (this.regPointer + 1) & 0xFF;
    }
    return true; // ACK
  }

  /** Master reads a byte — returns register at current pointer, auto-increments */
  onRead(_ack: boolean): number {
    const value = this.regs[this.regPointer & 0xFF];
    this.regPointer = (this.regPointer + 1) & 0xFF;
    return value;
  }
}
