/**
 * LeapBlocks – ESP32-C3 GPIO Peripheral (MMIO)
 *
 * Implements the ESP32-C3 GPIO matrix register map so that
 * firmware can write to real GPIO registers and the simulation
 * reacts exactly as hardware would.
 *
 * Relevant TRM sections: Chapter 5 (GPIO), Chapter 6 (IO MUX)
 *
 * GPIO MMIO base: 0x6000_4000
 * IO MUX base:   0x6000_9000
 */

import { MemoryRegion } from '../cpu/RiscVCore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PinChangeCallback = (pin: number, value: number, isAnalog: boolean) => void;

// ---------------------------------------------------------------------------
// Register offsets (relative to GPIO base 0x60004000)
// ---------------------------------------------------------------------------
const GPIO_OUT_REG = 0x004; // GPIO output register (GPIO 0–25)
const GPIO_OUT_W1TS_REG = 0x008; // Write 1 to set
const GPIO_OUT_W1TC_REG = 0x00C; // Write 1 to clear
const GPIO_ENABLE_REG = 0x020; // Output enable register
const GPIO_ENABLE_W1TS = 0x024;
const GPIO_ENABLE_W1TC = 0x028;
const GPIO_IN_REG = 0x03C; // Input register (read)
const GPIO_STATUS_REG = 0x044; // Interrupt status register
const GPIO_STATUS_W1TC = 0x04C; // Interrupt status clear (W1TC)
const GPIO_FUNC0_IN_SEL = 0x154; // Peripheral signal routing base

// Per-pin configuration registers (GPIO_PIN0 … GPIO_PIN25)
// base = 0x074 + pin * 4
const GPIO_PIN_BASE = 0x074;

// ---------------------------------------------------------------------------
// GPIO Peripheral
// ---------------------------------------------------------------------------

export class ESP32C3GPIO implements MemoryRegion {
  readonly base: u32 = 0x60004000;
  readonly size: u32 = 0x1000;

  // Shadow registers
  private outReg: u32 = 0;  // current output levels
  private enableReg: u32 = 0;  // output enable mask
  private inReg: u32 = 0;  // injected input levels (set by CircuitEngine)
  private statusReg: u32 = 0;  // interrupt status
  private pinCfg: u32[] = new Array(26).fill(0);

  // Analog channel values (0–4095) indexed by GPIO number
  // ESP32-C3 ADC1 channels: GPIO 0–4
  private adcValues: number[] = new Array(26).fill(0);

  private listeners: PinChangeCallback[] = [];
  private prevOut: u32 = 0;

  onPinChange(cb: PinChangeCallback): void {
    this.listeners.push(cb);
  }

  isOutput(pin: number): boolean {
    return (this.enableReg & (1 << pin)) !== 0;
  }

  private notify(changed: u32): void {
    for (let pin = 0; pin < 26; pin++) {
      if (changed & (1 << pin)) {
        const val = (this.outReg >> pin) & 1;
        this.listeners.forEach(cb => cb(pin, val, false));
      }
    }
  }

  // Called by CircuitEngine to inject digital input
  setInput(pin: number, high: boolean): void {
    const prev = this.inReg;
    if (high) this.inReg |= (1 << pin);
    else this.inReg &= ~(1 << pin);
    // Only mark interrupt status if value actually changed
    if (this.inReg !== prev) {
      this.statusReg |= (1 << pin);
    }
  }

  // Called by CircuitEngine to inject analog ADC value
  setAnalog(pin: number, value12bit: number): void {
    this.adcValues[pin] = value12bit & 0xFFF;
  }

  // ---------------------------------------------------------------------------
  // MemoryRegion interface
  // ---------------------------------------------------------------------------

  read8(addr: u32): u32 { return this.read32(addr & ~3) >> ((addr & 3) * 8) & 0xFF; }
  read16(addr: u32): u32 { return this.read32(addr & ~3) >> ((addr & 2) * 8) & 0xFFFF; }

  read32(addr: u32): u32 {
    const off = addr - this.base;
    switch (off) {
      case GPIO_OUT_REG: return this.outReg;
      case GPIO_ENABLE_REG: return this.enableReg;
      case GPIO_IN_REG: return this.inReg;
      case GPIO_STATUS_REG: return this.statusReg;
      default: {
        if (off >= GPIO_PIN_BASE && off < GPIO_PIN_BASE + 26 * 4) {
          return this.pinCfg[(off - GPIO_PIN_BASE) >> 2];
        }
        return 0;
      }
    }
  }

  write8(addr: u32, val: u32): void {
    // Reconstruct 32-bit write (simplified — write8 to output reg)
    const aligned = addr & ~3;
    const shift = (addr & 3) * 8;
    const old = this.read32(aligned);
    this.write32(aligned, (old & ~(0xFF << shift)) | ((val & 0xFF) << shift));
  }

  write16(addr: u32, val: u32): void {
    const aligned = addr & ~3;
    const shift = (addr & 2) * 8;
    const old = this.read32(aligned);
    this.write32(aligned, (old & ~(0xFFFF << shift)) | ((val & 0xFFFF) << shift));
  }

  write32(addr: u32, val: u32): void {
    const off = (addr - this.base) >>> 0;
    switch (off) {
      case GPIO_OUT_REG: {
        const changed = (this.outReg ^ val) & this.enableReg;
        this.outReg = val >>> 0;
        if (changed) this.notify(changed);
        break;
      }
      case GPIO_OUT_W1TS_REG: {
        const next = (this.outReg | val) >>> 0;
        const changed = (this.outReg ^ next) & this.enableReg;
        this.outReg = next;
        if (changed) this.notify(changed);
        break;
      }
      case GPIO_OUT_W1TC_REG: {
        const next = (this.outReg & ~val) >>> 0;
        const changed = (this.outReg ^ next) & this.enableReg;
        this.outReg = next;
        if (changed) this.notify(changed);
        break;
      }
      case GPIO_ENABLE_REG: this.enableReg = val >>> 0; break;
      case GPIO_ENABLE_W1TS: this.enableReg = (this.enableReg | val) >>> 0; break;
      case GPIO_ENABLE_W1TC: this.enableReg = (this.enableReg & ~val) >>> 0; break;
      case GPIO_STATUS_W1TC: this.statusReg = (this.statusReg & ~val) >>> 0; break;
      default: {
        if (off >= GPIO_PIN_BASE && off < GPIO_PIN_BASE + 26 * 4) {
          this.pinCfg[(off - GPIO_PIN_BASE) >> 2] = val >>> 0;
        }
        break;
      }
    }
  }
}

// Re-export the type alias used in RiscVCore
type u32 = number;
