/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
/**
 * FT6206I2CSlave.ts
 * Emulates the FT6206 capacitive touch screen controller as an I2C slave.
 * Default I2C address: 0x38.
 */
import { I2CSlave } from './I2CBusManager';
import { useForgeStore } from '../../../utils/store/useForgeStore';

const NATIVE_W = 240;
const NATIVE_H = 320;

export class FT6206I2CSlave implements I2CSlave {
  readonly i2cAddress: number;
  private nodeId: string;
  private regs = new Uint8Array(256);
  private regPointer = 0;
  private pointerSet = false;

  constructor(address: number, nodeId: string) {
    this.i2cAddress = address;
    this.nodeId = nodeId;

    // Initialize ID registers
    this.regs[0xA8] = 0x11; // Vendor ID
    this.regs[0xA3] = 0x06; // Chip ID (FT6206)
    this.regs[0xA6] = 0x01; // Firmware Version
    this.regs[0x80] = 128;  // Default threshold
  }

  // ── I2CSlave interface ───────────────────────────────────────────────────

  onStart(repeated: boolean) {
    this.pointerSet = false;
    this.updateTouchData();
  }

  onStop() {
    this.pointerSet = false;
  }

  onConnect(_write: boolean): boolean {
    return true; // ACK
  }

  onWrite(data: number): boolean {
    if (!this.pointerSet) {
      this.regPointer = data & 0xFF;
      this.pointerSet = true;
    } else {
      // Handle writes to writable registers
      if (this.regPointer === 0x80) {
        this.regs[0x80] = data; // threshold
      } else if (this.regPointer === 0x00) {
        this.regs[0x00] = data; // work mode
      } else {
        this.regs[this.regPointer] = data;
      }
      this.regPointer = (this.regPointer + 1) & 0xFF;
    }
    return true; // ACK
  }

  onRead(ack: boolean): number {
    const value = this.regs[this.regPointer];
    this.regPointer = (this.regPointer + 1) & 0xFF;
    return value;
  }

  private updateTouchData() {
    let touched = false;
    let tx = 0;
    let ty = 0;

    try {
      const { nodes } = useForgeStore.getState();
      const node = nodes.find(n => n.id === this.nodeId);
      if (node && node.data?.sensorValues) {
        touched = !!node.data.sensorValues.touched;
        tx = node.data.sensorValues.touchX ?? 0;
        ty = node.data.sensorValues.touchY ?? 0;
      }
    } catch (e) {
      console.warn('Failed to read touch state from store', e);
    }

    if (touched) {
      this.regs[0x02] = 1; // 1 touch point

      // Map to bottom-right origin (Wokwi convention)
      const rawX = NATIVE_W - 1 - tx;
      const rawY = NATIVE_H - 1 - ty;

      // Touch 1 X coordinate: registers 0x03 (high 4 bits) and 0x04 (low 8 bits)
      this.regs[0x03] = (rawX >> 8) & 0x0F;
      this.regs[0x04] = rawX & 0xFF;

      // Touch 1 Y coordinate: registers 0x05 (high 4 bits) and 0x06 (low 8 bits)
      // Note: touch ID is placed in top 4 bits of 0x05 (we set ID = 0)
      this.regs[0x05] = (rawY >> 8) & 0x0F;
      this.regs[0x06] = rawY & 0xFF;
    } else {
      this.regs[0x02] = 0; // 0 touch points
      this.regs[0x03] = 0;
      this.regs[0x04] = 0;
      this.regs[0x05] = 0;
      this.regs[0x06] = 0;
    }
  }
}
