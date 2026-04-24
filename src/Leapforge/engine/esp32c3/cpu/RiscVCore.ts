/**
 * LeapBlocks – ESP32-C3 RV32IMC Core Emulator
 *
 * Implements the full RISC-V RV32I base ISA + M (multiply/divide) + C
 * (compressed 16-bit) extensions required by the ESP32-C3 (RV32IMC).
 *
 * Design goals:
 *  - Zero external dependencies — pure TypeScript, runs in browser + Electron
 *  - Cycle-accurate enough for GPIO/peripheral timing (instruction-level)
 *  - Typed memory map so peripherals can register MMIO read/write handlers
 *  - Interrupt controller wired to platform peripherals (UART, GPIO, Timer)
 *
 * Memory map (matches ESP32-C3 Technical Reference Manual):
 *   0x4037_8000 – 0x403D_FFFF   IRAM / instruction cache mirror
 *   0x3FC8_0000 – 0x3FCF_FFFF   DRAM (512 KB)
 *   0x6000_0000 – 0x6002_FFFF   Peripheral bus (MMIO)
 *   0x4000_0000 – 0x4001_FFFF   ROM
 *
 * References:
 *   RISC-V Unprivileged ISA Specification v20191213
 *   ESP32-C3 Technical Reference Manual v0.4
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type u32 = number; // treated as unsigned 32-bit
export type i32 = number; // treated as signed   32-bit

export interface MemoryRegion {
  base: u32;
  size: u32;
  read8(addr: u32): u32;
  read16(addr: u32): u32;
  read32(addr: u32): u32;
  write8(addr: u32, val: u32): void;
  write16(addr: u32, val: u32): void;
  write32(addr: u32, val: u32): void;
}

export interface RiscVCoreOptions {
  /** Total DRAM size in bytes (default 524288 = 512 KB) */
  dramBytes?: number;
  /** Callback fired on ECALL — return false to halt */
  onEcall?: (core: RiscVCore) => boolean;
  /** Callback fired on EBREAK */
  onEbreak?: (core: RiscVCore) => void;
  /** Called when an unrecognised instruction is encountered */
  onIllegal?: (core: RiscVCore, insn: u32) => void;
}

export interface CpuState {
  pc: u32;
  regs: Uint32Array; // x0–x31
  cycles: number;
  halted: boolean;
}

// ---------------------------------------------------------------------------
// Helper bit-manipulation utilities (inline for performance)
// ---------------------------------------------------------------------------

/** Sign-extend `bits`-wide value to JS number (i32) */
function sext(value: u32, bits: number): i32 {
  const shift = 32 - bits;
  return ((value << shift) >> shift) as i32;
}

/** Mask to 32 bits and treat as unsigned */
const u32m = (v: number): u32 => v >>> 0;

/** Treat JS number as signed 32-bit integer */
const i32s = (v: number): i32 => (v | 0) as i32;

// ---------------------------------------------------------------------------
// RAM region
// ---------------------------------------------------------------------------

class RAMRegion implements MemoryRegion {
  base: u32;
  size: u32;
  protected data: Uint8Array;
  protected view: DataView;

  constructor(base: u32, size: u32, sharedBuffer?: ArrayBuffer) {
    this.base = base;
    this.size = size;
    if (sharedBuffer) {
      if (sharedBuffer.byteLength < size) throw new Error('Shared buffer too small');
      this.data = new Uint8Array(sharedBuffer, 0, size);
    } else {
      this.data = new Uint8Array(size);
    }
    this.view = new DataView(this.data.buffer, this.data.byteOffset, this.data.byteLength);
  }

  load(src: Uint8Array, offset: u32 = 0): void {
    this.data.set(src, offset);
  }

  /** Fill entire region with a repeated 32-bit word (little-endian) */
  fill32(word: u32): void {
    const view = new DataView(this.data.buffer, this.data.byteOffset, this.data.byteLength);
    for (let i = 0; i < this.size; i += 4) {
      view.setUint32(i, word, true);
    }
  }

  private local(addr: u32): number {
    const off = u32m(addr - this.base);
    if (off >= this.size) {
      throw new RangeError(`[RiscVCore RAM] Out-of-bounds access: 0x${addr.toString(16)}`);
    }
    return off;
  }

  read8(addr: u32): u32 { return this.data[this.local(addr)]; }
  read16(addr: u32): u32 { return this.view.getUint16(this.local(addr), true); }
  read32(addr: u32): u32 { return this.view.getUint32(this.local(addr), true); }

  write8(addr: u32, val: u32): void { this.data[this.local(addr)] = val & 0xFF; }
  write16(addr: u32, val: u32): void { this.view.setUint16(this.local(addr), val & 0xFFFF, true); }
  write32(addr: u32, val: u32): void { this.view.setUint32(this.local(addr), val >>> 0, true); }
}

// ---------------------------------------------------------------------------
// MMIO bus — peripherals register here
// ---------------------------------------------------------------------------

export class MMIOBus {
  private regions: MemoryRegion[] = [];
  // Stub map: silently absorbs writes to unregistered MMIO, returns last written value on read.
  // This covers WDT, SYSTEM, INTERRUPT MATRIX, and other init-time registers the firmware
  // touches but the simulator doesn't need to fully implement.
  private stubRegs = new Map<u32, u32>();

  register(region: MemoryRegion): void {
    this.regions.push(region);
  }

  private find(addr: u32): MemoryRegion | undefined {
    return this.regions.find(r => addr >= r.base && addr < r.base + r.size);
  }

  read8(addr: u32): u32 { return (this.find(addr)?.read8(addr) ?? this.stubRead(addr)) & 0xFF; }
  read16(addr: u32): u32 { return (this.find(addr)?.read16(addr) ?? this.stubRead(addr)) & 0xFFFF; }
  read32(addr: u32): u32 { return this.find(addr)?.read32(addr) ?? this.stubRead(addr); }

  write8(addr: u32, v: u32): void {
    const r = this.find(addr);
    if (r) { r.write8(addr, v); return; }
    if (addr >= 0x60000000) this.stubRegs.set(addr, v);
  }
  write16(addr: u32, v: u32): void {
    const r = this.find(addr);
    if (r) { r.write16(addr, v); return; }
    if (addr >= 0x60000000) this.stubRegs.set(addr, v);
  }
  write32(addr: u32, v: u32): void {
    const r = this.find(addr);
    if (r) { r.write32(addr, v); return; }
    if (addr >= 0x60000000) this.stubRegs.set(addr, v);
  }

  private stubRead(addr: u32): u32 {
    // SYSTEM peripheral (0x60002000-0x60002FFF): correct default values from system_reg.h
    if (addr >= 0x60002000 && addr < 0x60003000) {
      const off = addr - 0x60002000;
      switch (off) {
        case 0x000: return 0x00000000; // SYSTEM_CPU_PERI_CLK_EN_REG
        case 0x004: return 0x000000C0; // SYSTEM_CPU_PERI_RST_EN_REG
        case 0x008: return 0x0000000C; // SYSTEM_CPU_PER_CONF_REG
        case 0x00C: return 0x00000001; // SYSTEM_MEM_PD_MASK_REG
        case 0x010: return 0xFFFFFFFF; // SYSTEM_PERIP_CLK_EN0_REG (all clocks on)
        case 0x014: return 0x00000600; // SYSTEM_PERIP_CLK_EN1_REG
        case 0x018: return 0x00000000; // SYSTEM_PERIP_RST_EN0_REG (no resets = ready)
        case 0x01C: return 0x000001C0; // SYSTEM_PERIP_RST_EN1_REG
        case 0x03C: return 0x00000001; // SYSTEM_EDMA_CTRL_REG (EDMA_CLK_ON=1)
        case 0x040: return 0x00000005; // SYSTEM_CACHE_CONTROL_REG (clocks on)
        case 0x054: return 0x00000001; // SYSTEM_CLOCK_GATE_REG
        case 0x058: return 0x00000001; // SYSTEM_SYSCLK_CONF_REG
        default: return 0x00000000;
      }
    }

    // TIMG0 (0x6001F000) and TIMG1 (0x60020000): Timer Group / Watchdog
    // Startup waits for WDT status bits — return values indicating WDT is disabled/idle
    if ((addr >= 0x6001F000 && addr < 0x60020000) ||
      (addr >= 0x60020000 && addr < 0x60021000)) {
      const off = addr & 0xFFF;
      switch (off) {
        case 0x048: return 0x00000000; // TIMG_WDTCONFIG0: WDT disabled
        case 0x060: return 0x00000000; // TIMG_WDTFEED
        case 0x064: return 0x50D83AA1; // TIMG_WDTWPROTECT: write-protect key
        case 0x068: return 0x00008000; // TIMG_RTCCALICFG: RTC_CALI_RDY (bit 15) = 1 (calibration done)
        case 0x06C: return 0x000FFF00; // TIMG_RTCCALICFG1: calibration result value
        case 0x070: return 0x00000000; // TIMG_INT_ENA_TIMERS
        case 0x074: return 0x00000000; // TIMG_INT_RAW_TIMERS
        case 0x078: return 0x00000000; // TIMG_INT_ST_TIMERS
        case 0x07C: return 0x00000000; // TIMG_INT_CLR_TIMERS
        case 0x080: return 0x80000000; // TIMG_RTCCALICFG2: RDY bit set = calibration done
        default: return 0x00000000;
      }
    }

    // EXTMEM — Cache/MMU controller (0x600C4000)
    // ESP-IDF startup enables the ICache and checks ready status here
    if (addr >= 0x600C4000 && addr < 0x600C5000) {
      const off = addr - 0x600C4000;
      switch (off) {
        case 0x000: return 0x00000001; // EXTMEM_ICACHE_CTRL_REG — ICACHE_ENABLE=1
        case 0x004: return 0x00000001; // EXTMEM_ICACHE_CTRL1_REG — cache done / ready
        case 0x008: return 0x00000003; // EXTMEM_ICACHE_TAG_POWER_CTRL — tag mem powered on
        case 0x040: return 0x00000001; // EXTMEM_ICACHE_SYNC_CTRL — sync done
        case 0x044: return 0x00000000; // EXTMEM_ICACHE_SYNC_SIZE
        case 0x060: return 0x00000001; // EXTMEM_ICACHE_PRELOAD_CTRL — preload done
        case 0x0A0: return 0x00000000; // EXTMEM_ICACHE_LOCK_CTRL — no lock
        case 0x0AC: return 0x00000003; // EXTMEM_CACHE_STATE — cache idle/ready
        default: return 0x00000000;
      }
    }

    // SENSITIVE — Security/permission (0x600C1000)
    if (addr >= 0x600C1000 && addr < 0x600C2000) {
      return 0x00000000; // All permissions open / no security restrictions
    }

    // INTERRUPT_CORE0 — Interrupt matrix (0x600C2000)
    if (addr >= 0x600C2000 && addr < 0x600C3000) {
      const off = addr - 0x600C2000;
      // 0x190: INTERRUPT_CORE0_CPU_INT_THRESH_REG (interrupt threshold)
      if (off === 0x190) return 0x00000000;
      // 0x194: INTERRUPT_CORE0_CPU_INT_CLEAR_REG
      if (off === 0x194) return 0x00000000;
      return 0x00000000; // All interrupt sources unmapped
    }

    // SYSTEM_BASE (0x600C0000) — per-bus registers
    if (addr >= 0x600C0000 && addr < 0x600C1000) {
      const off = addr - 0x600C0000;
      switch (off) {
        case 0x000: return 0xFFFFFFFF; // SYSTEM_CPU_PERI_CLK_EN_REG (all clocks on)
        case 0x004: return 0x00000000; // SYSTEM_CPU_PERI_RST_EN_REG (no resets)
        case 0x008: return 0x00000001; // SYSTEM_CPU_PER_CONF (PLL div ready)
        case 0x00C: return 0x00000001; // SYSTEM_MEM_PD_MASK (powered up)
        case 0x010: return 0xFFFFFFFF; // SYSTEM_PERIP_CLK_EN0 (all peripheral clocks on)
        case 0x014: return 0x00000600; // SYSTEM_PERIP_CLK_EN1
        case 0x018: return 0x00000000; // SYSTEM_PERIP_RST_EN0 (no resets active)
        case 0x01C: return 0x00000000; // SYSTEM_PERIP_RST_EN1
        case 0x03C: return 0x00000001; // SYSTEM_EDMA_CTRL (EDMA_CLK_ON)
        case 0x040: return 0x00000005; // SYSTEM_CACHE_CONTROL (clocks on)
        case 0x054: return 0x00000001; // SYSTEM_CLOCK_GATE
        case 0x058: return 0x00000001; // SYSTEM_SYSCLK_CONF
        default: return 0x00000000;
      }
    }

    // ASSIST_DEBUG (0x600CE000) — debug controller
    if (addr >= 0x600CE000 && addr < 0x600CF000) {
      return 0x00000000; // Debug features disabled
    }

    // RTC_CNTL (0x60008000-0x600087FF): RTC controller — startup reads clock/reset status
    if (addr >= 0x60008000 && addr < 0x60008800) {
      const off = addr - 0x60008000;
      switch (off) {
        case 0x000: return 0x00000000; // RTC_CNTL_OPTIONS0_REG
        case 0x01C: return 0x00000000; // RTC_CNTL_RESET_STATE_REG (no reset pending)
        case 0x024: return 0x00000000; // RTC_CNTL_WDTCONFIG0: WDT disabled
        case 0x028: return 0x00000000;
        case 0x02C: return 0x00000000;
        case 0x030: return 0x00000000;
        case 0x034: return 0x00000000;
        case 0x070: return 0x00000000; // RTC_CNTL_INT_ENA_REG
        case 0x080: return 0x00000000; // RTC_CNTL_STORE0_REG
        case 0x088: return 0x00000000; // RTC_CNTL_STORE1_REG
        case 0x08C: return 0x00000000;
        default: return 0x00000000;
      }
    }

    // EFUSE controller (0x60008800)
    if (addr >= 0x60008800 && addr < 0x60009000) {
      const off = addr - 0x60008800;
      // Return "fuse read done" and chip version info
      if (off === 0x044) return 0x00000001; // EFUSE_STATUS — read_done=1
      if (off === 0x01C) return 0x00050000; // EFUSE_RD_MAC_SPI_SYS_3 — chip version
      return 0x00000000;
    }

    // USB_SERIAL_JTAG (0x60043000) 
    if (addr >= 0x60043000 && addr < 0x60044000) {
      const off = addr - 0x60043000;
      // Return EP1_IN buffer ready to accept data
      if (off === 0x004) return 0x00000002; // USB_SERIAL_JTAG_EP1_CONF — serial_IN_EP_DATA_FREE=1
      if (off === 0x044) return 0x00000001; // USB_SERIAL_JTAG_JFIFO_ST — JTAG idle
      return 0x00000000;
    }

    // GDMA (0x6003F000) — General DMA
    if (addr >= 0x6003F000 && addr < 0x60040000) {
      return 0x00000000; // DMA idle
    }

    // SPI0 / SPI_MEM (0x60003000) — cache/flash controller
    // Firmware reads this during cache initialization; return "idle/ready" values
    if (addr >= 0x60003000 && addr < 0x60004000) {
      const off = addr - 0x60003000;
      switch (off) {
        case 0x000: return 0x00200000; // SPI_MEM_CMD — no command active
        case 0x008: return 0x00000000; // SPI_MEM_CTRL — default
        case 0x00C: return 0x00000000; // SPI_MEM_CTRL1
        case 0x010: return 0x00000000; // SPI_MEM_CTRL2
        case 0x02C: return 0x00000001; // SPI_MEM_FSM — idle
        case 0x0DC: return 0x00000000; // SPI_MEM_TIMING_CALI — calibration complete
        default: return 0x00000000;
      }
    }

    // IO MUX (0x60009000) — GPIO function select / pull-up/down configuration
    if (addr >= 0x60009000 && addr < 0x6000A000) {
      const off = addr - 0x60009000;
      if (off === 0x000) return 0x00000000; // IO_MUX_PIN_CTRL
      // Per-pin MUX registers: 0x04, 0x08, 0x0C, ...  (GPIO0..21)
      // Return a safe default: function 0, no pull-up/down
      return 0x00000000;
    }

    // RTC_I2C (0x6000E000) — Real-time clock I2C controller
    if (addr >= 0x6000E000 && addr < 0x6000F000) {
      const off = addr - 0x6000E000;
      switch (off) {
        case 0x040: return 0x00000000; // RTC_I2C_SCL_LOW — default clock config
        case 0x044: return 0x00000000; // RTC_I2C_CTRL
        default: return 0x00000000;
      }
    }

    // RF peripherals: FE2 (0x60005000), FE (0x60006000), NRX (0x6001CC00), BB (0x6001D000)
    // These are RF frontend/baseband — return 0 (idle)
    if ((addr >= 0x60005000 && addr < 0x60007000) ||
        (addr >= 0x6001C000 && addr < 0x6001F000)) {
      return 0x00000000;
    }

    // APB_CTRL / SYSCON (0x60026000): APB controller
    if (addr >= 0x60026000 && addr < 0x60027000) {
      const off = addr - 0x60026000;
      switch (off) {
        case 0x09C: return 0x00000000; // APB_CTRL_DATE_REG
        case 0x0AC: return 0x00000000;
        default: return 0x00000000;
      }
    }

    const val = this.stubRegs.get(addr) ?? 0;
    // Log first-time reads of unregistered MMIO
    if (!this.stubRegs.has(addr) && addr >= 0x60000000) {
      this.stubRegs.set(addr, val);
      console.log(`[MMIO] First read @ 0x${addr.toString(16)} → 0x${val.toString(16)}`);
    }
    return val;
  }
}

// ---------------------------------------------------------------------------
// Interrupt Controller (PLIC-like, simplified for ESP32-C3)
// ---------------------------------------------------------------------------

export class InterruptController {
  /** Pending interrupt bits (bit N = interrupt N pending) */
  pending: u32 = 0;
  /** Enabled interrupt bits */
  enabled: u32 = 0xFFFFFFFF;
  /** MIE bit in mstatus */
  globalEnable: boolean = false;

  raise(irq: number): void { this.pending |= (1 << irq); }
  clear(irq: number): void { this.pending &= ~(1 << irq); }
  hasPending(): boolean { return this.globalEnable && (this.pending & this.enabled) !== 0; }
  nextPending(): number {
    const masked = this.pending & this.enabled;
    for (let i = 0; i < 32; i++) if (masked & (1 << i)) return i;
    return -1;
  }
}

// ---------------------------------------------------------------------------
// RiscVCore — main CPU class
// ---------------------------------------------------------------------------

export class RiscVCore {
  // ----- architectural state -----
  readonly regs: Int32Array = new Int32Array(32);   // x0–x31 (signed for arithmetic)
  pc: u32 = 0;
  cycles: number = 0;
  halted: boolean = false;

  // ----- CSRs (minimal set) -----
  private mstatus: u32 = 0;
  private mie: u32 = 0;
  private mip: u32 = 0;
  private mepc: u32 = 0;
  private mcause: u32 = 0;
  private mtvec: u32 = 0;
  private mscratch: u32 = 0;
  private minstret: number = 0;
  private mcycle: number = 0;

  // ----- memory -----
  // On real ESP32-C3, IRAM (0x40380000) and DRAM (0x3FC80000) are aliases for
  // the same 384KB physical SRAM.  However, in our simulation we use SEPARATE
  // backing buffers.  Why?  Because ESP-IDF startup code zeroes the .bss section
  // in DRAM, and those DRAM address ranges map to the same shared-buffer offsets
  // that hold loaded IRAM code.  Zeroing BSS therefore corrupts the instruction
  // memory, causing "illegal instruction 0x0" crashes.
  //
  // In practice the firmware's linker script ensures that IRAM code and DRAM
  // data occupy non-overlapping physical regions, so separate buffers produce
  // equivalent behaviour to the real hardware for well-linked firmware.
  readonly iram: RAMRegion;  // IRAM — independent buffer
  readonly dram: RAMRegion;  // DRAM — independent buffer
  readonly irom: RAMRegion;
  readonly drom: RAMRegion;
  readonly rom: RAMRegion;       // ROM stub (0x40000000–0x4037FFFF), filled with RET
  readonly nullGuard: RAMRegion; // Null-guard (0x0–0xFFF), filled with RET
  readonly mmio: MMIOBus = new MMIOBus();
  readonly irqCtrl: InterruptController = new InterruptController();

  private readonly onEcall: (c: RiscVCore) => boolean;
  private readonly onEbreak: (c: RiscVCore) => void;
  private readonly onIllegal: (c: RiscVCore, insn: u32) => void;

  // ESP32-C3 memory map constants
  static readonly IRAM_BASE = 0x40380000;
  static readonly IRAM_SIZE = 0x00060000; // 384 KB
  static readonly DRAM_BASE = 0x3FC80000;
  static readonly DRAM_SIZE = 0x00060000; // 384 KB active
  // Flash-mapped regions (MMU cache window) — sized to hold a full 4 MB app
  static readonly IROM_BASE = 0x42000000;
  static readonly IROM_SIZE = 0x00400000; // 4 MB (flash-mapped code)
  static readonly DROM_BASE = 0x3C000000;
  static readonly DROM_SIZE = 0x00400000; // 4 MB (flash-mapped read-only data)
  // ROM stub: 0x40000000–0x4037FFFF (ESP32-C3 first-stage bootloader ROM)
  // Filled with RET (jalr x0, 0(ra) = 0x00008067) so ROM calls return safely
  static readonly ROM_BASE = 0x40000000;
  static readonly ROM_SIZE = 0x00380000; // 3.5 MB covers full ROM window
  // Null-guard: 0x00000000–0x00000FFF — returns RET so null-pointer jumps
  // (e.g. mtvec=0 dispatch before app init) don't crash with illegal insn 0x0
  static readonly NULL_GUARD_BASE = 0x00000000;
  static readonly NULL_GUARD_SIZE = 0x00001000; // 4 KB
  static readonly MMIO_BASE = 0x60000000;
  static readonly MMIO_SIZE = 0x00100000;

  constructor(opts: RiscVCoreOptions = {}) {
    // Allocate SEPARATE buffers for IRAM and DRAM.
    // This prevents ESP-IDF BSS zeroing (via DRAM addresses) from corrupting
    // loaded IRAM code.  See the memory comment block above.
    const sramSize = opts.dramBytes ?? RiscVCore.IRAM_SIZE;
    this.iram = new RAMRegion(RiscVCore.IRAM_BASE, sramSize);
    this.dram = new RAMRegion(RiscVCore.DRAM_BASE, sramSize);
    this.irom = new RAMRegion(RiscVCore.IROM_BASE, RiscVCore.IROM_SIZE);
    this.drom = new RAMRegion(RiscVCore.DROM_BASE, RiscVCore.DROM_SIZE);

    // Fill ROM stub with RET instructions (0x00008067 = jalr x0, 0(ra))
    // so any call into ROM returns immediately without crashing.
    this.rom = new RAMRegion(RiscVCore.ROM_BASE, RiscVCore.ROM_SIZE);
    this.rom.fill32(0x00008067); // jalr x0, 0(ra) = RET

    // Null-guard: cover address 0x0 so null-pointer jumps return safely
    this.nullGuard = new RAMRegion(RiscVCore.NULL_GUARD_BASE, RiscVCore.NULL_GUARD_SIZE);
    this.nullGuard.fill32(0x00008067); // jalr x0, 0(ra) = RET
    this.onEcall = opts.onEcall ?? (() => true);
    this.onEbreak = opts.onEbreak ?? (() => { });
    this.onIllegal = opts.onIllegal ?? ((c, insn) => {
      console.warn(`[RiscVCore] Illegal instruction 0x${insn.toString(16)} at PC=0x${c.pc.toString(16)}`);
    });
  }

  // ---------------------------------------------------------------------------
  // Memory load helpers
  // ---------------------------------------------------------------------------

  loadIRAM(data: Uint8Array, offset: u32 = 0): void { this.iram.load(data, offset); }
  loadDRAM(data: Uint8Array, offset: u32 = 0): void { this.dram.load(data, offset); }
  /** Load into both IRAM and DRAM (since they no longer share a buffer but represent the same physical SRAM) */
  loadSRAM(data: Uint8Array, offset: u32 = 0): void {
    this.iram.load(data, offset);
    this.dram.load(data, offset);
  }
  loadIROM(data: Uint8Array, offset: u32 = 0): void { this.irom.load(data, offset); }
  loadDROM(data: Uint8Array, offset: u32 = 0): void { this.drom.load(data, offset); }

  // ---------------------------------------------------------------------------
  // Unified memory access (routes to IRAM / DRAM / IROM / DROM / MMIO)
  // ---------------------------------------------------------------------------

  memRead8(addr: u32): u32 {
    addr = u32m(addr);
    if (addr >= RiscVCore.IRAM_BASE && addr < RiscVCore.IRAM_BASE + RiscVCore.IRAM_SIZE) return this.iram.read8(addr);
    if (addr >= RiscVCore.DRAM_BASE && addr < RiscVCore.DRAM_BASE + RiscVCore.DRAM_SIZE) return this.dram.read8(addr);
    if (addr >= RiscVCore.IROM_BASE && addr < RiscVCore.IROM_BASE + RiscVCore.IROM_SIZE) return this.irom.read8(addr);
    if (addr >= RiscVCore.DROM_BASE && addr < RiscVCore.DROM_BASE + RiscVCore.DROM_SIZE) return this.drom.read8(addr);
    if (addr >= RiscVCore.ROM_BASE && addr < RiscVCore.ROM_BASE + RiscVCore.ROM_SIZE) return this.rom.read8(addr);
    if (addr < RiscVCore.NULL_GUARD_SIZE) return this.nullGuard.read8(addr);
    return this.mmio.read8(addr);
  }
  memRead16(addr: u32): u32 {
    addr = u32m(addr);
    if (addr >= RiscVCore.IRAM_BASE && addr < RiscVCore.IRAM_BASE + RiscVCore.IRAM_SIZE) return this.iram.read16(addr);
    if (addr >= RiscVCore.DRAM_BASE && addr < RiscVCore.DRAM_BASE + RiscVCore.DRAM_SIZE) return this.dram.read16(addr);
    if (addr >= RiscVCore.IROM_BASE && addr < RiscVCore.IROM_BASE + RiscVCore.IROM_SIZE) return this.irom.read16(addr);
    if (addr >= RiscVCore.DROM_BASE && addr < RiscVCore.DROM_BASE + RiscVCore.DROM_SIZE) return this.drom.read16(addr);
    if (addr >= RiscVCore.ROM_BASE && addr < RiscVCore.ROM_BASE + RiscVCore.ROM_SIZE) return this.rom.read16(addr);
    if (addr < RiscVCore.NULL_GUARD_SIZE) return this.nullGuard.read16(addr);
    return this.mmio.read16(addr);
  }
  memRead32(addr: u32): u32 {
    addr = u32m(addr);
    if (addr >= RiscVCore.IRAM_BASE && addr < RiscVCore.IRAM_BASE + RiscVCore.IRAM_SIZE) return this.iram.read32(addr);
    if (addr >= RiscVCore.DRAM_BASE && addr < RiscVCore.DRAM_BASE + RiscVCore.DRAM_SIZE) return this.dram.read32(addr);
    if (addr >= RiscVCore.IROM_BASE && addr < RiscVCore.IROM_BASE + RiscVCore.IROM_SIZE) return this.irom.read32(addr);
    if (addr >= RiscVCore.DROM_BASE && addr < RiscVCore.DROM_BASE + RiscVCore.DROM_SIZE) return this.drom.read32(addr);
    if (addr >= RiscVCore.ROM_BASE && addr < RiscVCore.ROM_BASE + RiscVCore.ROM_SIZE) return this.rom.read32(addr);
    if (addr < RiscVCore.NULL_GUARD_SIZE) return this.nullGuard.read32(addr);
    return this.mmio.read32(addr);
  }
  memWrite8(addr: u32, v: u32): void {
    addr = u32m(addr);
    if (addr >= RiscVCore.IRAM_BASE && addr < RiscVCore.IRAM_BASE + RiscVCore.IRAM_SIZE) { this.iram.write8(addr, v); return; }
    if (addr >= RiscVCore.DRAM_BASE && addr < RiscVCore.DRAM_BASE + RiscVCore.DRAM_SIZE) { this.dram.write8(addr, v); return; }
    this.mmio.write8(addr, v);
  }
  memWrite16(addr: u32, v: u32): void {
    addr = u32m(addr);
    if (addr >= RiscVCore.IRAM_BASE && addr < RiscVCore.IRAM_BASE + RiscVCore.IRAM_SIZE) { this.iram.write16(addr, v); return; }
    if (addr >= RiscVCore.DRAM_BASE && addr < RiscVCore.DRAM_BASE + RiscVCore.DRAM_SIZE) { this.dram.write16(addr, v); return; }
    this.mmio.write16(addr, v);
  }
  memWrite32(addr: u32, v: u32): void {
    addr = u32m(addr);
    if (addr >= RiscVCore.IRAM_BASE && addr < RiscVCore.IRAM_BASE + RiscVCore.IRAM_SIZE) { this.iram.write32(addr, v); return; }
    if (addr >= RiscVCore.DRAM_BASE && addr < RiscVCore.DRAM_BASE + RiscVCore.DRAM_SIZE) { this.dram.write32(addr, v); return; }
    this.mmio.write32(addr, v);
  }

  // ---------------------------------------------------------------------------
  // Register helpers
  // ---------------------------------------------------------------------------

  private regRead(r: number): i32 { return r === 0 ? 0 : this.regs[r]; }
  private regWrite(r: number, v: i32): void { if (r !== 0) this.regs[r] = v; }

  // ---------------------------------------------------------------------------
  // CSR access
  // ---------------------------------------------------------------------------

  private csrRead(csr: number): u32 {
    switch (csr) {
      case 0x300: return this.mstatus;
      case 0x304: return this.mie;
      case 0x344: return this.mip;
      case 0x341: return this.mepc;
      case 0x342: return this.mcause;
      case 0x305: return this.mtvec;
      case 0x340: return this.mscratch;
      case 0xC00: return u32m(this.mcycle & 0xFFFFFFFF);
      case 0xC80: return u32m((this.mcycle / 0x100000000) & 0xFFFFFFFF);
      case 0xC02: return u32m(this.minstret & 0xFFFFFFFF);
      default: return 0;
    }
  }

  private csrWrite(csr: number, val: u32): void {
    switch (csr) {
      case 0x300: this.mstatus = val; this.irqCtrl.globalEnable = !!(val & 0x8); break;
      case 0x304: this.mie = val; this.irqCtrl.enabled = val; break;
      case 0x344: this.mip = val; break;
      case 0x341: this.mepc = val; break;
      case 0x342: this.mcause = val; break;
      case 0x305: this.mtvec = val; break;
      case 0x340: this.mscratch = val; break;
    }
  }

  // ---------------------------------------------------------------------------
  // Interrupt dispatch
  // ---------------------------------------------------------------------------

  private handleInterrupt(): void {
    const irq = this.irqCtrl.nextPending();
    if (irq < 0) return;
    // Don't dispatch if mtvec hasn't been set yet (app startup hasn't run).
    // Defer the interrupt — it will be retried on the next step().
    if (this.mtvec === 0) return;
    this.mepc = this.pc;
    this.mcause = u32m(0x80000000 | irq);
    this.mstatus = this.mstatus & ~0x8; // clear MIE
    this.irqCtrl.globalEnable = false;
    this.pc = this.mtvec & ~0x3;        // vectored or direct
    this.irqCtrl.clear(irq);
  }

  // ---------------------------------------------------------------------------
  // MRET instruction
  // ---------------------------------------------------------------------------

  private execMRET(): void {
    this.pc = this.mepc;
    this.mstatus |= 0x8; // restore MIE
    this.irqCtrl.globalEnable = true;
  }

  // ---------------------------------------------------------------------------
  // Compressed (RV32C) instruction expansion
  // Returns the equivalent 32-bit instruction or -1 if not a compressed insn.
  // ---------------------------------------------------------------------------

  private expandCompressed(insn16: u32): u32 | -1 {
    const op = insn16 & 0x3;
    if (op === 0x3) return -1; // not compressed

    const funct3 = (insn16 >> 13) & 0x7;

    switch (op) {
      case 0x0: { // Quadrant 0
        if (funct3 === 0x0) {
          // C.ADDI4SPN → addi rd', x2, nzuimm
          const rd = 8 + ((insn16 >> 2) & 0x7);
          const imm = ((insn16 >> 6) & 0x1) << 2 |
            ((insn16 >> 5) & 0x1) << 3 |
            ((insn16 >> 11) & 0x3) << 4 |
            ((insn16 >> 7) & 0xF) << 6;
          if (imm === 0) return -1;
          return 0x00010013 | (rd << 7) | (2 << 15) | (imm << 20); // addi rd, x2, imm
        }
        if (funct3 === 0x2) {
          // C.LW → lw rd', offset(rs1')
          const rd = 8 + ((insn16 >> 2) & 0x7);
          const rs1 = 8 + ((insn16 >> 7) & 0x7);
          const imm = ((insn16 >> 6) & 0x1) << 2 |
            ((insn16 >> 10) & 0x7) << 3 |
            ((insn16 >> 5) & 0x1) << 6;
          return 0x00002003 | (rd << 7) | (rs1 << 15) | (imm << 20);
        }
        if (funct3 === 0x6) {
          // C.SW → sw rs2', offset(rs1')
          const rs2 = 8 + ((insn16 >> 2) & 0x7);
          const rs1 = 8 + ((insn16 >> 7) & 0x7);
          const imm = ((insn16 >> 6) & 0x1) << 2 |
            ((insn16 >> 10) & 0x7) << 3 |
            ((insn16 >> 5) & 0x1) << 6;
          const imm11_5 = (imm >> 5) & 0x7F;
          const imm4_0 = imm & 0x1F;
          return 0x00002023 | (imm11_5 << 25) | (rs2 << 20) | (rs1 << 15) | (imm4_0 << 7);
        }
        return -1;
      }

      case 0x1: { // Quadrant 1
        if (funct3 === 0x0) {
          // C.ADDI / C.NOP
          const rd = (insn16 >> 7) & 0x1F;
          const imm = sext(((insn16 >> 12) & 0x1) << 5 | ((insn16 >> 2) & 0x1F), 6);
          return 0x00000013 | (rd << 7) | (rd << 15) | (u32m(imm) << 20);
        }
        if (funct3 === 0x1) {
          // C.JAL → jal x1, offset
          const imm = this.cjImm(insn16);
          return this.encodeJ(1, imm);
        }
        if (funct3 === 0x2) {
          // C.LI → addi rd, x0, imm
          const rd = (insn16 >> 7) & 0x1F;
          const imm = sext(((insn16 >> 12) & 0x1) << 5 | ((insn16 >> 2) & 0x1F), 6);
          return 0x00000013 | (rd << 7) | (u32m(imm) << 20);
        }
        if (funct3 === 0x3) {
          const rd = (insn16 >> 7) & 0x1F;
          if (rd === 2) {
            // C.ADDI16SP
            const imm = sext(
              ((insn16 >> 12) & 0x1) << 9 | ((insn16 >> 6) & 0x1) << 4 |
              ((insn16 >> 5) & 0x1) << 6 | ((insn16 >> 3) & 0x3) << 7 |
              ((insn16 >> 2) & 0x1) << 5, 10);
            return 0x00010013 | (2 << 7) | (2 << 15) | (u32m(imm) << 20);
          } else {
            // C.LUI
            const imm = sext(((insn16 >> 12) & 0x1) << 17 | ((insn16 >> 2) & 0x1F) << 12, 18);
            return 0x00000037 | (rd << 7) | (u32m(imm) & 0xFFFFF000);
          }
        }
        if (funct3 === 0x4) {
          const funct2 = (insn16 >> 10) & 0x3;
          const rd = 8 + ((insn16 >> 7) & 0x7);
          const imm5 = (insn16 >> 12) & 0x1;
          const shamt = ((insn16 >> 2) & 0x1F) | (imm5 << 5);
          if (funct2 === 0x0) {
            // C.SRLI
            return 0x00005013 | (rd << 7) | (rd << 15) | (shamt << 20);
          }
          if (funct2 === 0x1) {
            // C.SRAI
            return 0x40005013 | (rd << 7) | (rd << 15) | (shamt << 20);
          }
          if (funct2 === 0x2) {
            // C.ANDI
            const imm = sext(imm5 << 5 | ((insn16 >> 2) & 0x1F), 6);
            return 0x00007013 | (rd << 7) | (rd << 15) | (u32m(imm) << 20);
          }
          if (funct2 === 0x3) {
            const funct6b = (insn16 >> 12) & 0x1;
            const rs2 = 8 + ((insn16 >> 2) & 0x7);
            const op2 = (insn16 >> 5) & 0x3;
            if (funct6b === 0) {
              if (op2 === 0x0) return 0x40000033 | (rd << 7) | (rd << 15) | (rs2 << 20); // C.SUB
              if (op2 === 0x1) return 0x00004033 | (rd << 7) | (rd << 15) | (rs2 << 20); // C.XOR
              if (op2 === 0x2) return 0x00006033 | (rd << 7) | (rd << 15) | (rs2 << 20); // C.OR
              if (op2 === 0x3) return 0x00007033 | (rd << 7) | (rd << 15) | (rs2 << 20); // C.AND
            }
          }
        }
        if (funct3 === 0x5) {
          // C.J → jal x0, offset
          const imm = this.cjImm(insn16);
          return this.encodeJ(0, imm);
        }
        if (funct3 === 0x6) {
          // C.BEQZ
          const rs1 = 8 + ((insn16 >> 7) & 0x7);
          const imm = this.cbImm(insn16);
          return this.encodeB(0x0, rs1, 0, imm); // beq rs1, x0, imm
        }
        if (funct3 === 0x7) {
          // C.BNEZ
          const rs1 = 8 + ((insn16 >> 7) & 0x7);
          const imm = this.cbImm(insn16);
          return this.encodeB(0x1, rs1, 0, imm); // bne rs1, x0, imm
        }
        return -1;
      }

      case 0x2: { // Quadrant 2
        if (funct3 === 0x0) {
          // C.SLLI
          const rd = (insn16 >> 7) & 0x1F;
          const shamt = ((insn16 >> 12) & 0x1) << 5 | ((insn16 >> 2) & 0x1F);
          return 0x00001013 | (rd << 7) | (rd << 15) | (shamt << 20);
        }
        if (funct3 === 0x2) {
          // C.LWSP
          const rd = (insn16 >> 7) & 0x1F;
          const imm = ((insn16 >> 12) & 0x1) << 5 |
            ((insn16 >> 4) & 0x7) << 2 |
            ((insn16 >> 2) & 0x3) << 6;
          return 0x00002003 | (rd << 7) | (2 << 15) | (imm << 20);
        }
        if (funct3 === 0x4) {
          const bit12 = (insn16 >> 12) & 0x1;
          const rs1 = (insn16 >> 7) & 0x1F;
          const rs2 = (insn16 >> 2) & 0x1F;
          if (bit12 === 0 && rs2 === 0) {
            // C.JR → jalr x0, 0(rs1)
            return 0x00000067 | (rs1 << 15);
          }
          if (bit12 === 0 && rs2 !== 0) {
            // C.MV → add rd, x0, rs2
            return 0x00000033 | (rs1 << 7) | (rs2 << 20);
          }
          if (bit12 === 1 && rs1 !== 0 && rs2 === 0) {
            // C.JALR → jalr x1, 0(rs1)
            return 0x000000E7 | (rs1 << 15);
          }
          if (bit12 === 1 && rs2 !== 0) {
            // C.ADD → add rd, rd, rs2
            return 0x00000033 | (rs1 << 7) | (rs1 << 15) | (rs2 << 20);
          }
          if (bit12 === 1 && rs1 === 0 && rs2 === 0) {
            // C.EBREAK
            return 0x00100073;
          }
        }
        if (funct3 === 0x6) {
          // C.SWSP
          const rs2 = (insn16 >> 2) & 0x1F;
          const imm = ((insn16 >> 9) & 0xF) << 2 | ((insn16 >> 7) & 0x3) << 6;
          const imm11_5 = (imm >> 5) & 0x7F;
          const imm4_0 = imm & 0x1F;
          return 0x00002023 | (imm11_5 << 25) | (rs2 << 20) | (2 << 15) | (imm4_0 << 7);
        }
        return -1;
      }
    }
    return -1;
  }

  private cjImm(insn16: u32): i32 {
    return sext(
      ((insn16 >> 3) & 0x7) << 1 |
      ((insn16 >> 11) & 0x1) << 4 |
      ((insn16 >> 2) & 0x1) << 5 |
      ((insn16 >> 7) & 0x1) << 6 |
      ((insn16 >> 6) & 0x1) << 7 |
      ((insn16 >> 9) & 0x3) << 8 |
      ((insn16 >> 8) & 0x1) << 10 |
      ((insn16 >> 12) & 0x1) << 11, 12);
  }

  private cbImm(insn16: u32): i32 {
    return sext(
      ((insn16 >> 3) & 0x3) << 1 |
      ((insn16 >> 10) & 0x3) << 3 |
      ((insn16 >> 2) & 0x1) << 5 |
      ((insn16 >> 5) & 0x3) << 6 |
      ((insn16 >> 12) & 0x1) << 8, 9);
  }

  private encodeJ(rd: number, imm: i32): u32 {
    const u = u32m(imm);
    return 0x0000006F | (rd << 7) |
      (((u >> 12) & 0xFF) << 12) |
      (((u >> 11) & 0x1) << 20) |
      (((u >> 1) & 0x3FF) << 21) |
      (((u >> 20) & 0x1) << 31);
  }

  private encodeB(funct3: number, rs1: number, rs2: number, imm: i32): u32 {
    const u = u32m(imm);
    return 0x00000063 | (funct3 << 12) | (rs1 << 15) | (rs2 << 20) |
      (((u >> 11) & 0x1) << 7) |
      (((u >> 1) & 0xF) << 8) |
      (((u >> 5) & 0x3F) << 25) |
      (((u >> 12) & 0x1) << 31);
  }

  // ---------------------------------------------------------------------------
  // Step: execute a single instruction
  // Returns number of cycles consumed
  // ---------------------------------------------------------------------------

  step(): number {
    if (this.halted) return 0;

    // Check pending interrupts
    if (this.irqCtrl.hasPending()) {
      this.handleInterrupt();
      return 4;
    }

    // Fetch — determine instruction width from bits [1:0] of the first halfword.
    // In RISC-V, bits [1:0] = 0b11 → 32-bit instruction; anything else → 16-bit compressed.
    let insn: u32;
    let pcIncrement: u32;
    const raw16 = this.memRead16(this.pc);

    if ((raw16 & 0x3) !== 0x3) {
      // 16-bit compressed instruction (C extension)
      pcIncrement = 2;
      const expanded = this.expandCompressed(raw16);
      if (expanded !== -1) {
        insn = expanded as u32;
      } else {
        // Unrecognised compressed instruction — signal illegal but still advance by 2.
        // Pass the raw16 value so the default case in the switch fires onIllegal.
        this.onIllegal(this, raw16);
        this.pc = u32m(this.pc + 2);
        this.cycles += 1;
        this.mcycle += 1;
        this.minstret++;
        this.regs[0] = 0;
        return 1;
      }
    } else {
      // 32-bit instruction
      insn = this.memRead32(this.pc);
      pcIncrement = 4;
    }

    const opcode = insn & 0x7F;
    const rd = (insn >> 7) & 0x1F;
    const funct3 = (insn >> 12) & 0x7;
    const rs1 = (insn >> 15) & 0x1F;
    const rs2 = (insn >> 20) & 0x1F;
    const funct7 = (insn >> 25) & 0x7F;

    let nextPC: u32 = u32m(this.pc + pcIncrement);
    let cycles = 1;

    switch (opcode) {
      // ------- LUI -------
      case 0x37: {
        this.regWrite(rd, i32s(insn & 0xFFFFF000));
        break;
      }
      // ------- AUIPC -------
      case 0x17: {
        this.regWrite(rd, i32s(u32m(this.pc + (insn & 0xFFFFF000))));
        break;
      }
      // ------- JAL -------
      case 0x6F: {
        const imm = sext(
          ((insn >> 21) & 0x3FF) << 1 |
          ((insn >> 20) & 0x1) << 11 |
          ((insn >> 12) & 0xFF) << 12 |
          ((insn >> 31) & 0x1) << 20, 21);
        this.regWrite(rd, i32s(nextPC));
        nextPC = u32m(this.pc + imm);
        cycles = 3;
        break;
      }
      // ------- JALR -------
      case 0x67: {
        const imm = sext((insn >> 20), 12);
        const target = u32m((this.regRead(rs1) + imm) & ~1);
        this.regWrite(rd, i32s(nextPC));
        nextPC = target;
        cycles = 3;
        break;
      }
      // ------- BRANCH -------
      case 0x63: {
        const imm = sext(
          ((insn >> 8) & 0xF) << 1 |
          ((insn >> 25) & 0x3F) << 5 |
          ((insn >> 7) & 0x1) << 11 |
          ((insn >> 31) & 0x1) << 12, 13);
        const r1 = this.regRead(rs1);
        const r2 = this.regRead(rs2);
        let taken = false;
        switch (funct3) {
          case 0x0: taken = r1 === r2; break;           // BEQ
          case 0x1: taken = r1 !== r2; break;           // BNE
          case 0x4: taken = i32s(r1) < i32s(r2); break; // BLT
          case 0x5: taken = i32s(r1) >= i32s(r2); break;// BGE
          case 0x6: taken = u32m(r1) < u32m(r2); break; // BLTU
          case 0x7: taken = u32m(r1) >= u32m(r2); break;// BGEU
        }
        if (taken) { nextPC = u32m(this.pc + imm); cycles = 3; }
        break;
      }
      // ------- LOAD -------
      case 0x03: {
        const imm = sext((insn >> 20), 12);
        const addr = u32m(this.regRead(rs1) + imm);
        let val: i32 = 0;
        switch (funct3) {
          case 0x0: val = sext(this.memRead8(addr), 8); break; // LB
          case 0x1: val = sext(this.memRead16(addr), 16); break; // LH
          case 0x2: val = i32s(this.memRead32(addr)); break; // LW
          case 0x4: val = this.memRead8(addr); break; // LBU
          case 0x5: val = this.memRead16(addr); break; // LHU
        }
        this.regWrite(rd, val);
        cycles = 2;
        break;
      }
      // ------- STORE -------
      case 0x23: {
        const imm = sext(((insn >> 25) << 5) | ((insn >> 7) & 0x1F), 12);
        const addr = u32m(this.regRead(rs1) + imm);
        const val = u32m(this.regRead(rs2));
        switch (funct3) {
          case 0x0: this.memWrite8(addr, val); break; // SB
          case 0x1: this.memWrite16(addr, val); break; // SH
          case 0x2: this.memWrite32(addr, val); break; // SW
        }
        cycles = 2;
        break;
      }
      // ------- OP-IMM (I-type arithmetic) -------
      case 0x13: {
        const imm = sext((insn >> 20), 12);
        const r1 = this.regRead(rs1);
        let result: i32 = 0;
        switch (funct3) {
          case 0x0: result = i32s(r1 + imm); break;                              // ADDI
          case 0x1: result = i32s(u32m(r1) << (imm & 0x1F)); break;              // SLLI
          case 0x2: result = i32s(r1) < i32s(imm) ? 1 : 0; break;               // SLTI
          case 0x3: result = u32m(r1) < u32m(imm) ? 1 : 0; break;               // SLTIU
          case 0x4: result = i32s(r1 ^ imm); break;                              // XORI
          case 0x5:
            result = funct7 === 0x20
              ? i32s(r1) >> (imm & 0x1F)       // SRAI
              : i32s(u32m(r1) >>> (imm & 0x1F)); // SRLI
            break;
          case 0x6: result = i32s(r1 | imm); break;                              // ORI
          case 0x7: result = i32s(r1 & imm); break;                              // ANDI
        }
        this.regWrite(rd, result);
        break;
      }
      // ------- OP (R-type arithmetic + M extension) -------
      case 0x33: {
        const r1 = this.regRead(rs1);
        const r2 = this.regRead(rs2);
        let result: i32 = 0;
        if (funct7 === 0x01) {
          // M extension (multiply / divide)
          switch (funct3) {
            case 0x0: result = i32s(Math.imul(r1, r2)); break; // MUL
            case 0x1: result = i32s(Number(BigInt(i32s(r1)) * BigInt(i32s(r2)) >> BigInt(32))); break; // MULH
            case 0x2: result = i32s(Number(BigInt(i32s(r1)) * BigInt(u32m(r2)) >> BigInt(32))); break; // MULHSU
            case 0x3: result = i32s(Number(BigInt(u32m(r1)) * BigInt(u32m(r2)) >> BigInt(32))); break; // MULHU
            case 0x4: result = r2 === 0 ? -1 : i32s(Math.trunc(i32s(r1) / i32s(r2))); break;  // DIV
            case 0x5: result = r2 === 0 ? -1 : i32s(Math.trunc(u32m(r1) / u32m(r2))); break;  // DIVU
            case 0x6: result = r2 === 0 ? r1 : i32s(i32s(r1) % i32s(r2)); break; // REM
            case 0x7: result = r2 === 0 ? r1 : i32s(u32m(r1) % u32m(r2)); break; // REMU
          }
          cycles = 4;
        } else {
          switch (funct3) {
            case 0x0: result = funct7 === 0x20 ? i32s(r1 - r2) : i32s(r1 + r2); break; // ADD/SUB
            case 0x1: result = i32s(u32m(r1) << (u32m(r2) & 0x1F)); break; // SLL
            case 0x2: result = i32s(r1) < i32s(r2) ? 1 : 0; break;         // SLT
            case 0x3: result = u32m(r1) < u32m(r2) ? 1 : 0; break;         // SLTU
            case 0x4: result = i32s(r1 ^ r2); break;                        // XOR
            case 0x5: result = funct7 === 0x20
              ? i32s(r1) >> (u32m(r2) & 0x1F)
              : i32s(u32m(r1) >>> (u32m(r2) & 0x1F)); break;                // SRL/SRA
            case 0x6: result = i32s(r1 | r2); break;                        // OR
            case 0x7: result = i32s(r1 & r2); break;                        // AND
          }
        }
        this.regWrite(rd, result);
        break;
      }
      // ------- SYSTEM -------
      case 0x73: {
        const funct12 = (insn >> 20) & 0xFFF;
        if (funct3 === 0x0) {
          if (funct12 === 0x000) { // ECALL
            if (!this.onEcall(this)) { this.halted = true; }
          } else if (funct12 === 0x001) { // EBREAK
            this.onEbreak(this);
          } else if (funct12 === 0x105) { // WFI — Wait For Interrupt
            // In simulation, treat as a NOP.  If interrupts are enabled and
            // nothing is pending, we just continue to the next instruction.
            // A real core would stall until an interrupt arrives.
          } else if (funct12 === 0x302) { // MRET
            this.execMRET();
            nextPC = this.pc; // already updated in execMRET
          }
        } else {
          // CSR instructions
          const csrAddr = (insn >> 20) & 0xFFF;
          const old = this.csrRead(csrAddr);
          const src = funct3 & 0x4 ? u32m(rs1) : u32m(this.regRead(rs1));
          switch (funct3 & 0x3) {
            case 0x1: this.csrWrite(csrAddr, src); break;           // CSRRW / CSRRWI
            case 0x2: this.csrWrite(csrAddr, u32m(old | src)); break;  // CSRRS / CSRRSI
            case 0x3: this.csrWrite(csrAddr, u32m(old & ~src)); break; // CSRRC / CSRRCI
          }
          this.regWrite(rd, i32s(old));
        }
        break;
      }
      // ------- FENCE (no-op in single-core simulation) -------
      case 0x0F: break;

      default: {
        const pcBefore = this.pc;
        this.onIllegal(this, insn);
        // If onIllegal changed the PC (e.g. recovery by jumping to ra), honour it.
        if (this.pc !== pcBefore) {
          nextPC = this.pc;
        }
        break;
      }
    }

    this.pc = nextPC;
    this.cycles += cycles;
    this.mcycle += cycles;
    this.minstret++;
    this.regs[0] = 0; // x0 always reads 0

    return cycles;
  }

  // ---------------------------------------------------------------------------
  // Run N cycles (used by simulation loop)
  // ---------------------------------------------------------------------------

  runCycles(n: number): number {
    let executed = 0;
    while (!this.halted && executed < n) {
      executed += this.step();
    }
    return executed;
  }

  // ---------------------------------------------------------------------------
  // State snapshot (for debugging / UI)
  // ---------------------------------------------------------------------------

  snapshot(): CpuState {
    return {
      pc: this.pc,
      regs: new Uint32Array(this.regs.buffer),
      cycles: this.cycles,
      halted: this.halted,
    };
  }

  reset(entryPoint: u32 = RiscVCore.IRAM_BASE): void {
    this.regs.fill(0);
    this.pc = entryPoint;
    // Initialize stack pointer (x2) to top of DRAM — matches ESP32-C3 linker script.
    // Without this, the first stack push goes to 0xFFFFFFFC (wrap-around) and corrupts
    // everything before setup() even runs.
    this.regs[2] = u32m(RiscVCore.DRAM_BASE + RiscVCore.DRAM_SIZE - 16);
    this.cycles = 0;
    this.halted = false;
    this.mstatus = 0;
    this.mie = 0;
    this.mip = 0;
    this.mepc = 0;
    this.mcause = 0;
    this.mtvec = 0;
    this.mcycle = 0;
    this.minstret = 0;
    this.irqCtrl.pending = 0;
    this.irqCtrl.globalEnable = false;
  }
}
