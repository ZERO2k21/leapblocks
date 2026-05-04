/**
 * LeapBlocks – ESP32-C3 ADC1 Peripheral (MMIO)
 *
 * Implements the SARADC (SAR ADC) register interface for ESP32-C3.
 * ADC1 channels map to GPIO 0–4 on the ESP32-C3.
 *
 * SARADC base: 0x6004_0000
 *
 * The Arduino core's analogRead(pin) triggers:
 *   1. Configure channel via SARADC_CTRL_REG
 *   2. Start conversion via SARADC_CTRL2_REG
 *   3. Poll SARADC_CTRL2_REG bit 28 (conversion done)
 *   4. Read result from SARADC_SAR1_DATA_STATUS_REG
 *
 * We simulate an immediate (0-cycle) conversion for simplicity while
 * delivering accurate 12-bit values set by CircuitEngine.
 *
 * Channel → GPIO mapping (ESP32-C3):
 *   CH0 → GPIO0    CH1 → GPIO1    CH2 → GPIO2
 *   CH3 → GPIO3    CH4 → GPIO4
 */

import { MemoryRegion } from '../cpu/RiscVCore';

type u32 = number;

// Register offsets
const SAR_CTRL_REG             = 0x000; // control
const SAR_CTRL2_REG            = 0x004; // start/done bit
const SAR_FILTER_CTRL1_REG     = 0x008;
const SAR_FSM_WAIT_REG         = 0x00C;
const SAR_SAR1_STATUS_REG      = 0x02C; // 12-bit result in bits 16–27
const SAR_SAR2_STATUS_REG      = 0x030;
const SAR_MEAS1_CTRL2_REG      = 0x090;
const SAR_MEAS1_MUX_REG        = 0x098; // channel select
const SAR_MEAS1_DATA_REG       = 0x09C; // result (Arduino core uses this)

// ADC1 channel → GPIO mapping
const CHANNEL_TO_GPIO: Record<number, number> = {
  0: 0, 1: 1, 2: 2, 3: 3, 4: 4,
};

export class ESP32C3ADC implements MemoryRegion {
  readonly base: u32 = 0x60040000;
  readonly size: u32 = 0x1000;

  // 12-bit values per GPIO (set by CircuitEngine)
  private gpioValues: number[] = new Array(26).fill(0);

  private ctrl: u32  = 0;
  private ctrl2: u32 = 0;
  private mux1: u32  = 0;

  /** Called by CircuitEngine to update an analog pin value (0–4095) */
  setChannelValue(gpio: number, value12bit: number): void {
    this.gpioValues[gpio] = value12bit & 0xFFF;
  }

  private selectedChannel(): number {
    // bits 12:9 of SAR_MEAS1_MUX_REG contain SARADC_MEAS1_MUX_SEL
    return (this.mux1 >> 9) & 0xF;
  }

  private resultForChannel(ch: number): u32 {
    const gpio = CHANNEL_TO_GPIO[ch] ?? -1;
    return gpio >= 0 ? this.gpioValues[gpio] : 0;
  }

  // -----------------------------------------------------------------------
  // MemoryRegion
  // -----------------------------------------------------------------------

  read8(addr: u32): u32  { return this.read32(addr) & 0xFF; }
  read16(addr: u32): u32 { return this.read32(addr) & 0xFFFF; }

  read32(addr: u32): u32 {
    const off = (addr - this.base) >>> 0;
    switch (off) {
      case SAR_CTRL_REG:         return this.ctrl;
      case SAR_CTRL2_REG:
        // Simulate instant conversion: always report done (bit 28 = 1)
        return this.ctrl2 | (1 << 28);
      case SAR_MEAS1_CTRL2_REG:  return 0;
      case SAR_MEAS1_MUX_REG:    return this.mux1;
      case SAR_MEAS1_DATA_REG: {
        // Arduino ESP32 core reads 16-bit result here, value in bits 11:0
        const ch  = this.selectedChannel();
        return this.resultForChannel(ch);
      }
      case SAR_SAR1_STATUS_REG: {
        // 12-bit result packed in bits 17:6 (TRM format)
        const ch  = this.selectedChannel();
        return (this.resultForChannel(ch) & 0xFFF) << 6;
      }
      default: return 0;
    }
  }

  write8(addr: u32, val: u32): void  { this.write32(addr, val); }
  write16(addr: u32, val: u32): void { this.write32(addr, val); }

  write32(addr: u32, val: u32): void {
    const off = (addr - this.base) >>> 0;
    switch (off) {
      case SAR_CTRL_REG:        this.ctrl = val; break;
      case SAR_CTRL2_REG:       this.ctrl2 = val & ~(1 << 28); break; // clear done on new start
      case SAR_MEAS1_MUX_REG:   this.mux1 = val; break;
    }
  }
}
