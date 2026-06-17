/**
 * LeapBlocks – ESP32-C3 System Timer (SYSTIMER) Peripheral (MMIO)
 *
 * The ESP32-C3 uses SYSTIMER for:
 *   - millis() / micros() / delay() in Arduino core
 *   - FreeRTOS tick (simulated via cooperative scheduler in FreeRTOS.ts)
 *
 * SYSTIMER base: 0x6002_3000
 *
 * The SYSTIMER has a free-running 64-bit counter clocked at 16 MHz.
 * It exposes two alarm comparators (ALARM0, ALARM1).
 *
 * Key registers:
 *   0x000  SYSTIMER_CONF_REG
 *   0x004  SYSTIMER_UNIT0_OP_REG     — trigger latch of unit0 counter
 *   0x008  SYSTIMER_UNIT1_OP_REG     — trigger latch of unit1 counter
 *   0x040  SYSTIMER_UNIT0_VALUE_LO   — latched counter bits 31:0
 *   0x044  SYSTIMER_UNIT0_VALUE_HI   — latched counter bits 51:32
 *   0x048  SYSTIMER_UNIT1_VALUE_LO
 *   0x04C  SYSTIMER_UNIT1_VALUE_HI
 *   0x050  SYSTIMER_TARGET0_LO       — alarm 0 low 32 bits
 *   0x054  SYSTIMER_TARGET0_HI       — alarm 0 high 20 bits
 *   0x058  SYSTIMER_TARGET0_CONF     — alarm 0 enable & period
 *   0x05C  SYSTIMER_TARGET1_LO
 *   0x060  SYSTIMER_TARGET1_HI
 *   0x064  SYSTIMER_TARGET1_CONF
 *   0x07C  SYSTIMER_INT_ENA_REG
 *   0x080  SYSTIMER_INT_RAW_REG
 *   0x084  SYSTIMER_INT_CLR_REG
 *   0x088  SYSTIMER_INT_ST_REG
 */

import { MemoryRegion } from '../cpu/RiscVCore';

type u32 = number;

const SYSTIMER_CONF_REG = 0x000;
const SYSTIMER_UNIT0_OP_REG = 0x004;
const SYSTIMER_UNIT0_VALUE_LO = 0x040;
const SYSTIMER_UNIT0_VALUE_HI = 0x044;
const SYSTIMER_UNIT1_VALUE_LO = 0x048;
const SYSTIMER_UNIT1_VALUE_HI = 0x04C;
const SYSTIMER_TARGET0_LO = 0x050;
const SYSTIMER_TARGET0_HI = 0x054;
const SYSTIMER_TARGET0_CONF = 0x058;
const SYSTIMER_TARGET1_LO = 0x05C;
const SYSTIMER_TARGET1_HI = 0x060;
const SYSTIMER_TARGET1_CONF = 0x064;
const SYSTIMER_INT_ENA_REG = 0x07C;
const SYSTIMER_INT_RAW_REG = 0x080;
const SYSTIMER_INT_CLR_REG = 0x084;
const SYSTIMER_INT_ST_REG = 0x088;

/** ESP32-C3 SYSTIMER clock: 16 MHz */
const SYSTIMER_CLOCK_HZ = 16_000_000;

export class ESP32C3SysTimer implements MemoryRegion {
  readonly base: u32 = 0x60023000;
  readonly size: u32 = 0x1000;

  private conf: u32 = 0;
  private intEna: u32 = 0;
  private intRaw: u32 = 0;

  // Alarm targets (64-bit stored as two u32s)
  private target0Lo: u32 = 0;
  private target0Hi: u32 = 0;
  private target1Lo: u32 = 0;
  private target1Hi: u32 = 0;
  private target0Conf: u32 = 0;
  private target1Conf: u32 = 0;

  // Latched unit0 value (64-bit split)
  private unit0LatchLo: u32 = 0;
  private unit0LatchHi: u32 = 0;

  // CPU cycles elapsed — updated by ESP32C3SimulationRunner
  cpuCycles: number = 0;
  /** ESP32-C3 CPU frequency in Hz */
  cpuFreqHz: number = 160_000_000;

  private onIRQ: ((irq: number) => void) | null = null;

  onInterrupt(cb: (irq: number) => void): void { this.onIRQ = cb; }

  /**
   * Returns current SYSTIMER ticks using Number arithmetic (no BigInt).
   * CPU runs at 160 MHz, SYSTIMER at 16 MHz → ratio is 1/10.
   * Number.MAX_SAFE_INTEGER (2^53) can represent ~3.6 years of ticks at 16 MHz.
   */
  private timerTicks(): number {
    return (this.cpuCycles / this.cpuFreqHz) * SYSTIMER_CLOCK_HZ;
  }

  private latchUnit0(): void {
    const ticks = this.timerTicks();
    this.unit0LatchLo = ticks >>> 0;
    this.unit0LatchHi = (ticks / 0x100000000) >>> 0;
  }

  /** Build a 64-bit tick target from lo/hi register values */
  private buildTarget(lo: u32, hi: u32): number {
    return (hi & 0xFFFFF) * 0x100000000 + (lo >>> 0);
  }

  /** Called by simulation runner each tick to check alarms */
  tick(): void {
    const ticks = this.timerTicks();

    // Alarm 0
    if (this.target0Conf & 1) {
      const target = this.buildTarget(this.target0Lo, this.target0Hi);
      if (ticks >= target) {
        this.intRaw |= 1;
        if (this.intEna & 1 && this.onIRQ) this.onIRQ(37);
        if (this.target0Conf & 2) {
          const period = ((this.target0Conf >> 16) & 0xFFFF) * 0x10000;
          const next = target + period;
          this.target0Lo = next >>> 0;
          this.target0Hi = ((next / 0x100000000) >>> 0) & 0xFFFFF;
        } else {
          this.target0Conf &= ~1;
        }
      }
    }

    // Alarm 1
    if (this.target1Conf & 1) {
      const target = this.buildTarget(this.target1Lo, this.target1Hi);
      if (ticks >= target) {
        this.intRaw |= 2;
        if (this.intEna & 2 && this.onIRQ) this.onIRQ(38);
        if (this.target1Conf & 2) {
          const period = ((this.target1Conf >> 16) & 0xFFFF) * 0x10000;
          const next = target + period;
          this.target1Lo = next >>> 0;
          this.target1Hi = ((next / 0x100000000) >>> 0) & 0xFFFFF;
        } else {
          this.target1Conf &= ~1;
        }
      }
    }
  }

  // -----------------------------------------------------------------------
  // MemoryRegion
  // -----------------------------------------------------------------------

  read8(addr: u32): u32 { return this.read32(addr) & 0xFF; }
  read16(addr: u32): u32 { return this.read32(addr) & 0xFFFF; }

  read32(addr: u32): u32 {
    const off = (addr - this.base) >>> 0;
    switch (off) {
      case SYSTIMER_CONF_REG: return this.conf;
      case SYSTIMER_UNIT0_VALUE_LO: return this.unit0LatchLo;
      case SYSTIMER_UNIT0_VALUE_HI: return this.unit0LatchHi;
      // Unit1 mirrors unit0 in our single-unit sim
      case SYSTIMER_UNIT1_VALUE_LO: return this.unit0LatchLo;
      case SYSTIMER_UNIT1_VALUE_HI: return this.unit0LatchHi;
      case SYSTIMER_TARGET0_LO: return this.target0Lo;
      case SYSTIMER_TARGET0_HI: return this.target0Hi;
      case SYSTIMER_TARGET0_CONF: return this.target0Conf;
      case SYSTIMER_TARGET1_LO: return this.target1Lo;
      case SYSTIMER_TARGET1_HI: return this.target1Hi;
      case SYSTIMER_TARGET1_CONF: return this.target1Conf;
      case SYSTIMER_INT_ENA_REG: return this.intEna;
      case SYSTIMER_INT_RAW_REG: return this.intRaw;
      case SYSTIMER_INT_ST_REG: return this.intRaw & this.intEna;
      default: return 0;
    }
  }

  write8(addr: u32, val: u32): void { this.write32(addr, val); }
  write16(addr: u32, val: u32): void { this.write32(addr, val); }

  write32(addr: u32, val: u32): void {
    const off = (addr - this.base) >>> 0;
    switch (off) {
      case SYSTIMER_CONF_REG: this.conf = val; break;
      case SYSTIMER_UNIT0_OP_REG: this.latchUnit0(); break; // trigger latch
      case SYSTIMER_TARGET0_LO: this.target0Lo = val; break;
      case SYSTIMER_TARGET0_HI: this.target0Hi = val; break;
      case SYSTIMER_TARGET0_CONF: this.target0Conf = val; break;
      case SYSTIMER_TARGET1_LO: this.target1Lo = val; break;
      case SYSTIMER_TARGET1_HI: this.target1Hi = val; break;
      case SYSTIMER_TARGET1_CONF: this.target1Conf = val; break;
      case SYSTIMER_INT_ENA_REG: this.intEna = val; break;
      case SYSTIMER_INT_CLR_REG: this.intRaw &= ~val; break;
    }
  }
}
