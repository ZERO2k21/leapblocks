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
  private data: Uint8Array;
  private view: DataView;

  constructor(base: u32, size: u32) {
    this.base = base;
    this.size = size;
    this.data = new Uint8Array(size);
    this.view = new DataView(this.data.buffer);
  }

  load(src: Uint8Array, offset: u32 = 0): void {
    this.data.set(src, offset);
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

  register(region: MemoryRegion): void {
    this.regions.push(region);
  }

  private find(addr: u32): MemoryRegion | undefined {
    return this.regions.find(r => addr >= r.base && addr < r.base + r.size);
  }

  read8(addr: u32): u32 { return this.find(addr)?.read8(addr) ?? 0; }
  read16(addr: u32): u32 { return this.find(addr)?.read16(addr) ?? 0; }
  read32(addr: u32): u32 { return this.find(addr)?.read32(addr) ?? 0; }

  write8(addr: u32, v: u32): void { this.find(addr)?.write8(addr, v); }
  write16(addr: u32, v: u32): void { this.find(addr)?.write16(addr, v); }
  write32(addr: u32, v: u32): void { this.find(addr)?.write32(addr, v); }
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
  readonly iram: RAMRegion;
  readonly dram: RAMRegion;
  readonly irom: RAMRegion;
  readonly drom: RAMRegion;
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
  static readonly MMIO_BASE = 0x60000000;
  static readonly MMIO_SIZE = 0x00100000;

  constructor(opts: RiscVCoreOptions = {}) {
    this.iram = new RAMRegion(RiscVCore.IRAM_BASE, opts.dramBytes ?? RiscVCore.IRAM_SIZE);
    this.dram = new RAMRegion(RiscVCore.DRAM_BASE, opts.dramBytes ?? RiscVCore.DRAM_SIZE);
    this.irom = new RAMRegion(RiscVCore.IROM_BASE, RiscVCore.IROM_SIZE);
    this.drom = new RAMRegion(RiscVCore.DROM_BASE, RiscVCore.DROM_SIZE);
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

  // ---------------------------------------------------------------------------
  // Unified memory access (routes to IRAM / DRAM / MMIO)
  // ---------------------------------------------------------------------------

  memRead8(addr: u32): u32 {
    addr = u32m(addr);
    if (addr >= RiscVCore.IRAM_BASE && addr < RiscVCore.IRAM_BASE + RiscVCore.IRAM_SIZE) return this.iram.read8(addr);
    if (addr >= RiscVCore.DRAM_BASE && addr < RiscVCore.DRAM_BASE + RiscVCore.DRAM_SIZE) return this.dram.read8(addr);
    return this.mmio.read8(addr);
  }
  memRead16(addr: u32): u32 {
    addr = u32m(addr);
    if (addr >= RiscVCore.IRAM_BASE && addr < RiscVCore.IRAM_BASE + RiscVCore.IRAM_SIZE) return this.iram.read16(addr);
    if (addr >= RiscVCore.DRAM_BASE && addr < RiscVCore.DRAM_BASE + RiscVCore.DRAM_SIZE) return this.dram.read16(addr);
    return this.mmio.read16(addr);
  }
  memRead32(addr: u32): u32 {
    addr = u32m(addr);
    if (addr >= RiscVCore.IRAM_BASE && addr < RiscVCore.IRAM_BASE + RiscVCore.IRAM_SIZE) return this.iram.read32(addr);
    if (addr >= RiscVCore.DRAM_BASE && addr < RiscVCore.DRAM_BASE + RiscVCore.DRAM_SIZE) return this.dram.read32(addr);
    return this.mmio.read32(addr);
  }
  memWrite8(addr: u32, v: u32): void {
    addr = u32m(addr);
    if (addr >= RiscVCore.DRAM_BASE && addr < RiscVCore.DRAM_BASE + RiscVCore.DRAM_SIZE) { this.dram.write8(addr, v); return; }
    this.mmio.write8(addr, v);
  }
  memWrite16(addr: u32, v: u32): void {
    addr = u32m(addr);
    if (addr >= RiscVCore.DRAM_BASE && addr < RiscVCore.DRAM_BASE + RiscVCore.DRAM_SIZE) { this.dram.write16(addr, v); return; }
    this.mmio.write16(addr, v);
  }
  memWrite32(addr: u32, v: u32): void {
    addr = u32m(addr);
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

    // Fetch
    let insn: u32;
    let pcIncrement: u32;
    const raw16 = this.memRead16(this.pc);
    const expanded = this.expandCompressed(raw16);

    if (expanded !== -1) {
      insn = expanded as u32;
      pcIncrement = 2;
    } else {
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
            case 0x1: result = i32s(Number(BigInt(i32s(r1)) * BigInt(i32s(r2)) >> 32n)); break; // MULH
            case 0x2: result = i32s(Number(BigInt(i32s(r1)) * BigInt(u32m(r2)) >> 32n)); break; // MULHSU
            case 0x3: result = i32s(Number(BigInt(u32m(r1)) * BigInt(u32m(r2)) >> 32n)); break; // MULHU
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
        this.onIllegal(this, insn);
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
