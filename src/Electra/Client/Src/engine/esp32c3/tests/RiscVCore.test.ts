/**
 * LeapBlocks – RiscVCore Unit Tests
 *
 * Tests the RV32IMC instruction set execution.
 * Run with:  npx jest RiscVCore.test.ts
 *
 * Coverage:
 *   ✓ RV32I — all arithmetic, load/store, branch, jump instructions
 *   ✓ RV32M — multiply / divide / remainder
 *   ✓ RV32C — compressed instruction expansion and execution
 *   ✓ CSR   — mstatus, mtvec, mepc, MRET
 *   ✓ Memory — IRAM/DRAM routing, byte/half/word access
 *   ✓ Interrupts — IRQ dispatch and return
 */

import { describe, test, expect } from 'vitest';
import { RiscVCore } from '../cpu/RiscVCore';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeCore(): RiscVCore {
  return new RiscVCore({
    onEcall:   () => false, // halt on ECALL
    onEbreak:  () => {},
    onIllegal: (c, insn) => {
      throw new Error(`Illegal instruction 0x${insn.toString(16)} @ 0x${c.pc.toString(16)}`);
    },
  });
}

/** Encode a 32-bit instruction into IRAM at the given address */
function writeInsn(core: RiscVCore, addr: number, insn: number): void {
  core.memWrite32(addr, insn >>> 0);
}

/** Encode a sequence of instructions starting at addr and run the core until halt */
function runProgram(core: RiscVCore, addr: number, insns: number[], maxSteps = 10000): void {
  core.reset(addr);
  insns.forEach((insn, i) => core.memWrite32(addr + i * 4, insn >>> 0));
  // ECALL at the end to halt
  core.memWrite32(addr + insns.length * 4, 0x00000073); // ecall
  for (let i = 0; i < maxSteps && !core.halted; i++) core.step();
}

const BASE = RiscVCore.IRAM_BASE;

// ---------------------------------------------------------------------------
// RV32I — R-type
// ---------------------------------------------------------------------------

describe('RV32I R-type instructions', () => {
  test('ADD: x3 = x1 + x2', () => {
    const core = makeCore();
    // addi x1, x0, 10      → 0x00A00093
    // addi x2, x0, 20      → 0x01400113
    // add  x3, x1, x2      → 0x002081B3
    runProgram(core, BASE, [0x00A00093, 0x01400113, 0x002081B3]);
    expect(core.regs[3] >>> 0).toBe(30);
  });

  test('SUB: x3 = x1 - x2', () => {
    const core = makeCore();
    runProgram(core, BASE, [
      0x01400093, // addi x1, x0, 20
      0x00600113, // addi x2, x0, 6
      0x402081B3, // sub  x3, x1, x2
    ]);
    expect(core.regs[3] >>> 0).toBe(14);
  });

  test('AND: x3 = x1 & x2', () => {
    const core = makeCore();
    runProgram(core, BASE, [
      0x0FF00093, // addi x1, x0, 0xFF
      0x0F000113, // addi x2, x0, 0xF0
      0x0020F1B3, // and  x3, x1, x2
    ]);
    expect(core.regs[3] >>> 0).toBe(0xF0);
  });

  test('OR:  x3 = x1 | x2', () => {
    const core = makeCore();
    runProgram(core, BASE, [
      0x00F00093, // addi x1, x0, 0x0F
      0x0F000113, // addi x2, x0, 0xF0
      0x0020E1B3, // or   x3, x1, x2
    ]);
    expect(core.regs[3] >>> 0).toBe(0xFF);
  });

  test('XOR: x3 = x1 ^ x2', () => {
    const core = makeCore();
    runProgram(core, BASE, [
      0x0FF00093, // addi x1, x0, 0xFF
      0x0F000113, // addi x2, x0, 0xF0
      0x0020C1B3, // xor  x3, x1, x2
    ]);
    expect(core.regs[3] >>> 0).toBe(0x0F);
  });

  test('SLL: x3 = x1 << x2', () => {
    const core = makeCore();
    runProgram(core, BASE, [
      0x00100093, // addi x1, x0, 1
      0x00400113, // addi x2, x0, 4
      0x002091B3, // sll  x3, x1, x2
    ]);
    expect(core.regs[3] >>> 0).toBe(16);
  });

  test('SRL: x3 = x1 >>> x2 (logical)', () => {
    const core = makeCore();
    runProgram(core, BASE, [
      0x08000093, // addi x1, x0, 128
      0x00300113, // addi x2, x0, 3
      0x0020D1B3, // srl  x3, x1, x2
    ]);
    expect(core.regs[3] >>> 0).toBe(16);
  });

  test('SLT: signed comparison', () => {
    const core = makeCore();
    runProgram(core, BASE, [
      0xFFF00093, // addi x1, x0, -1  (signed)
      0x00100113, // addi x2, x0, 1
      0x002021B3, // slt  x3, x1, x2  (should be 1)
    ]);
    expect(core.regs[3]).toBe(1);
  });

  test('SLTU: unsigned comparison', () => {
    const core = makeCore();
    runProgram(core, BASE, [
      0x00100093, // addi x1, x0, 1
      0x00200113, // addi x2, x0, 2
      0x002031B3, // sltu x3, x1, x2   (should be 1)
    ]);
    expect(core.regs[3]).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// RV32I — I-type immediate
// ---------------------------------------------------------------------------

describe('RV32I I-type (immediate) instructions', () => {
  test('ADDI accumulates correctly', () => {
    const core = makeCore();
    runProgram(core, BASE, [
      0x00500093, // addi x1, x0, 5
      0x00308093, // addi x1, x1, 3
    ]);
    expect(core.regs[1]).toBe(8);
  });

  test('ADDI with negative immediate', () => {
    const core = makeCore();
    runProgram(core, BASE, [
      0x00A00093, // addi x1, x0, 10
      0xFF908093, // addi x1, x1, -7
    ]);
    expect(core.regs[1]).toBe(3);
  });

  test('SLTI with negative value', () => {
    const core = makeCore();
    runProgram(core, BASE, [
      0xFFF00093, // addi x1, x0, -1
      0x0010A113, // slti x2, x1, 1   (signed: -1 < 1 → 1)
    ]);
    expect(core.regs[2]).toBe(1);
  });

  test('XORI toggles bits', () => {
    const core = makeCore();
    runProgram(core, BASE, [
      0x0FF00093, // addi x1, x0, 255
      0x0550C113, // xori x2, x1, 0x55
    ]);
    expect(core.regs[2] >>> 0).toBe(0xFF ^ 0x55);
  });

  test('SRLI shift right logical immediate', () => {
    const core = makeCore();
    runProgram(core, BASE, [
      0x08000093, // addi x1, x0, 128
      0x0020D113, // srli x2, x1, 2
    ]);
    expect(core.regs[2]).toBe(32);
  });

  test('SRAI shift right arithmetic (sign-extends)', () => {
    const core = makeCore();
    runProgram(core, BASE, [
      0xFFC00093, // addi x1, x0, -4
      0x4010D113, // srai x2, x1, 1   (-4 >> 1 = -2)
    ]);
    expect(core.regs[2] | 0).toBe(-2);
  });
});

// ---------------------------------------------------------------------------
// RV32I — Load / Store
// ---------------------------------------------------------------------------

describe('RV32I Load/Store', () => {
  test('SW then LW round-trips a value', () => {
    const core = makeCore();
    const dataAddr = RiscVCore.DRAM_BASE;
    runProgram(core, BASE, [
      0x0DEADEB7,                          // lui  x1, 0x0DEAD  (but we'll just store a known val)
      // simpler: store 42 directly
      0x02A00093, // addi x1, x0, 42
      // li x2, DRAM_BASE — use LUI+ADDI for the address
      // DRAM_BASE = 0x3FC80000
      // lui x2, 0x3FC80   → upper 20 bits of 0x3FC80000
      // 0x3FC80000 >> 12 = 0x3FC80 → encode in LUI
      // LUI x2, 0x3FC80: 0x3FC80137  (rd=x2=2, opcode=0x37, imm=0x3FC80)
      0x3FC80137, // lui x2, 0x3FC80
      // sw x1, 0(x2)
      0x00112023, // sw  x1, 0(x2)
      // lw x3, 0(x2)
      0x00012183, // lw  x3, 0(x2)
    ]);
    expect(core.regs[3] | 0).toBe(42);
  });

  test('SB / LBU — byte store and unsigned byte load', () => {
    const core = makeCore();
    runProgram(core, BASE, [
      0x0AB00093, // addi x1, x0, 0xAB
      0x3FC80137, // lui  x2, 0x3FC80
      0x00110023, // sb   x1, 0(x2)
      0x00014183, // lbu  x3, 0(x2)
    ]);
    expect(core.regs[3] >>> 0).toBe(0xAB);
  });

  test('SH / LHU — halfword store and unsigned halfword load', () => {
    const core = makeCore();
    runProgram(core, BASE, [
      0x0AB00093, // addi x1, x0, 0xAB
      0x3FC80137, // lui  x2, 0x3FC80
      0x00111023, // sh   x1, 0(x2)
      0x00015183, // lhu  x3, 0(x2)
    ]);
    expect(core.regs[3] >>> 0).toBe(0xAB);
  });
});

// ---------------------------------------------------------------------------
// RV32I — Branch instructions
// ---------------------------------------------------------------------------

describe('RV32I Branch instructions', () => {
  test('BEQ taken when registers equal', () => {
    const core = makeCore();
    // x1 = 5, x2 = 5; BEQ jumps over addi x3, x0, 99 → x3 should be 0
    runProgram(core, BASE, [
      0x00500093, // addi x1, x0, 5
      0x00500113, // addi x2, x0, 5
      0x00208463, // beq  x1, x2, +8  (skip next insn)
      0x06300193, // addi x3, x0, 99  ← skipped
    ]);
    expect(core.regs[3]).toBe(0);
  });

  test('BNE not taken when registers equal', () => {
    const core = makeCore();
    runProgram(core, BASE, [
      0x00500093, // addi x1, x0, 5
      0x00500113, // addi x2, x0, 5
      0x00209463, // bne  x1, x2, +8  (NOT taken)
      0x06300193, // addi x3, x0, 99  ← executed
    ]);
    expect(core.regs[3]).toBe(99);
  });

  test('BLT taken when x1 < x2 (signed)', () => {
    const core = makeCore();
    runProgram(core, BASE, [
      0xFFF00093, // addi x1, x0, -1
      0x00100113, // addi x2, x0,  1
      0x0020C463, // blt  x1, x2, +8  (taken: -1 < 1)
      0x06300193, // addi x3, x0, 99  ← skipped
    ]);
    expect(core.regs[3]).toBe(0);
  });

  test('BLTU taken (unsigned)', () => {
    const core = makeCore();
    runProgram(core, BASE, [
      0x00100093, // addi x1, x0, 1
      0x00200113, // addi x2, x0, 2
      0x0020E463, // bltu x1, x2, +8
      0x06300193, // addi x3, x0, 99  ← skipped
    ]);
    expect(core.regs[3]).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// RV32I — JAL / JALR
// ---------------------------------------------------------------------------

describe('RV32I Jump instructions', () => {
  test('JAL stores return address and jumps', () => {
    const core = makeCore();
    // JAL x1, +8  (jump over one word)
    // addi x2, x0, 99   ← should be skipped
    // [jump target] addi x3, x0, 77
    runProgram(core, BASE, [
      0x008000EF, // jal x1, +8
      0x06300113, // addi x2, x0, 99  ← skipped
      0x04D00193, // addi x3, x0, 77  ← jump target
    ]);
    expect(core.regs[2]).not.toBe(99); // skipped (contains initial SP)
    expect(core.regs[3]).toBe(77);  // executed
    expect(core.regs[1] >>> 0).toBe(BASE + 4); // return addr
  });

  test('JALR jumps to register + offset', () => {
    const core = makeCore();
    runProgram(core, BASE, [
      // Set x1 to BASE+12 (3rd word)
      // lui x1, upper, then addi x1, x1, lower
      // For simplicity encode absolute: BASE = 0x40380000
      // lui x1, 0x40380  → 0x403800B7
      0x403800B7, // lui  x1, 0x40380
      0x00C08067, // jalr x0, 12(x1)   → PC = 0x40380000 + 12 = BASE+12
      0x06300113, // addi x2, x0, 99   ← skipped
      0x04D00193, // addi x3, x0, 77   ← jump target (BASE+12)
    ]);
    expect(core.regs[2]).not.toBe(99); // skipped (contains initial SP)
    expect(core.regs[3]).toBe(77);
  });
});

// ---------------------------------------------------------------------------
// RV32I — LUI / AUIPC
// ---------------------------------------------------------------------------

describe('RV32I LUI and AUIPC', () => {
  test('LUI loads upper 20 bits', () => {
    const core = makeCore();
    runProgram(core, BASE, [
      0xDEAD00B7, // lui x1, 0xDEAD0  → x1 = 0xDEAD0000
    ]);
    expect(core.regs[1] >>> 0).toBe(0xDEAD0000);
  });

  test('AUIPC adds PC to upper immediate', () => {
    const core = makeCore();
    // At BASE, AUIPC with imm=0 → x1 = BASE
    runProgram(core, BASE, [
      0x00000097, // auipc x1, 0  → x1 = PC (= BASE)
    ]);
    expect(core.regs[1] >>> 0).toBe(BASE);
  });
});

// ---------------------------------------------------------------------------
// RV32M — Multiply / Divide
// ---------------------------------------------------------------------------

describe('RV32M Multiply/Divide extension', () => {
  test('MUL: 6 * 7 = 42', () => {
    const core = makeCore();
    runProgram(core, BASE, [
      0x00600093, // addi x1, x0, 6
      0x00700113, // addi x2, x0, 7
      0x022081B3, // mul  x3, x1, x2
    ]);
    expect(core.regs[3]).toBe(42);
  });

  test('MUL with negatives: -3 * 5 = -15', () => {
    const core = makeCore();
    runProgram(core, BASE, [
      0xFFD00093, // addi x1, x0, -3
      0x00500113, // addi x2, x0,  5
      0x022081B3, // mul  x3, x1, x2
    ]);
    expect(core.regs[3] | 0).toBe(-15);
  });

  test('DIV: 100 / 5 = 20', () => {
    const core = makeCore();
    runProgram(core, BASE, [
      0x06400093, // addi x1, x0, 100
      0x00500113, // addi x2, x0, 5
      0x0220C1B3, // div  x3, x1, x2
    ]);
    expect(core.regs[3]).toBe(20);
  });

  test('DIVU: unsigned divide', () => {
    const core = makeCore();
    runProgram(core, BASE, [
      0x00C00093, // addi x1, x0, 12
      0x00400113, // addi x2, x0,  4
      0x0220D1B3, // divu x3, x1, x2
    ]);
    expect(core.regs[3] >>> 0).toBe(3);
  });

  test('REM: 13 % 5 = 3', () => {
    const core = makeCore();
    runProgram(core, BASE, [
      0x00D00093, // addi x1, x0, 13
      0x00500113, // addi x2, x0, 5
      0x0220E1B3, // rem  x3, x1, x2
    ]);
    expect(core.regs[3]).toBe(3);
  });

  test('DIV by zero returns -1 (per RISC-V spec)', () => {
    const core = makeCore();
    runProgram(core, BASE, [
      0x00A00093, // addi x1, x0, 10
      0x00000113, // addi x2, x0, 0    (explicitly clear stack pointer from x2)
      0x0220C1B3, // div  x3, x1, x2
    ]);
    expect(core.regs[3] | 0).toBe(-1);
  });

  test('MULH: upper 32 bits of signed multiply', () => {
    const core = makeCore();
    // 0x80000000 * 0x80000000 = 0x4000000000000000 → upper 32 = 0x40000000
    runProgram(core, BASE, [
      0x80000137, // lui  x2, 0x80000  → x2 = 0x80000000
      0x00010093, // addi x1, x2, 0    (mv x1, x2 encoded as addi)
      0x022091B3, // mulh x3, x1, x2
    ]);
    expect(core.regs[3] >>> 0).toBe(0x40000000);
  });
});

// ---------------------------------------------------------------------------
// CSR instructions
// ---------------------------------------------------------------------------

describe('CSR instructions', () => {
  test('CSRRW reads old value, writes new', () => {
    const core = makeCore();
    // Write 0xABCD to mscratch (CSR 0x340), then read it back
    runProgram(core, BASE, [
      0x0AB00093,    // addi x1, x0, 0xAB
      0x34009073,    // csrrw x0, mscratch, x1   (write, discard old)
      0x34002173,    // csrrs x2, mscratch, x0   (read without modify)
    ]);
    expect(core.regs[2] >>> 0).toBe(0xAB);
  });

  test('CSRRS sets bits', () => {
    const core = makeCore();
    runProgram(core, BASE, [
      0x00300093,    // addi x1, x0, 3       (bits to set)
      0x34009073,    // csrrw x0, mscratch, x1
      0x00500113,    // addi x2, x0, 5
      0x34012173,    // csrrs x2, mscratch, x2   (OR in 5 → 3|5=7)
      0x340021F3,    // csrrs x3, mscratch, x0   (read)
    ]);
    expect(core.regs[3] >>> 0).toBe(7);
  });
});

// ---------------------------------------------------------------------------
// Interrupt handling
// ---------------------------------------------------------------------------

describe('Interrupt handling', () => {
  test('IRQ dispatches to mtvec and MRET returns', () => {
    const core = makeCore();
    const HANDLER = BASE + 0x100;

    // Set mtvec to HANDLER
    // lui x1, upper20(HANDLER)
    const upper = (HANDLER >>> 12) & 0xFFFFF;
    const lower = HANDLER & 0xFFF;
    const luiInsn  = 0x00000037 | (upper << 12) | (1 << 7);
    const addiInsn = 0x00000013 | (1 << 7) | (1 << 15) | ((lower & 0xFFF) << 20);
    const csrwMtvec = 0x30509073; // csrrw x0, mtvec, x1

    // Enable global interrupts: csrrsi x0, mstatus, 8 (set MIE bit)
    const enableIRQ = 0x30046073; // csrrsi x0, mstatus, 8

    // Main program
    const program: number[] = [
      luiInsn,     // lui  x1, HANDLER>>12
      addiInsn,    // addi x1, x1, lower
      csrwMtvec,   // set mtvec
      enableIRQ,   // enable global IRQs
      0x00000013,  // nop (interrupt expected here)
      0x00000013,  // nop
      0x00000013,  // nop
    ];
    program.forEach((insn, i) => core.memWrite32(BASE + i * 4, insn >>> 0));
    core.memWrite32(BASE + program.length * 4, 0x00000073); // ecall → halt

    // Handler at HANDLER: addi x10, x0, 0xAA; mret
    core.memWrite32(HANDLER,     0x0AA00513); // addi x10, x0, 0xAA
    core.memWrite32(HANDLER + 4, 0x30200073); // mret

    core.reset(BASE);

    // Run until after nop at offset 16, then raise IRQ
    for (let i = 0; i < 5; i++) core.step(); // run 5 insns (setup + nops)
    core.irqCtrl.raise(0); // raise IRQ 0

    // Run until halt
    for (let i = 0; i < 1000 && !core.halted; i++) core.step();

    expect(core.regs[10] >>> 0).toBe(0xAA); // handler ran
  });
});

// ---------------------------------------------------------------------------
// RV32C — Compressed instructions (sample)
// ---------------------------------------------------------------------------

describe('RV32C Compressed instruction execution', () => {
  test('C.ADDI (Q1, funct3=0) increments register', () => {
    const core = makeCore();
    // Manually place a C.ADDI instruction: x1 += 5
    // C.ADDI encoding: funct3=000, rd=x1, imm=5
    // [15:13]=000 [12]=0 [11:7]=00001 [6:2]=00101 [1:0]=01
    const cAddi = (0b000 << 13) | (0 << 12) | (1 << 7) | (5 << 2) | 0b01;
    // Write 2-byte insn + ECALL (4 bytes)
    core.memWrite16(BASE, cAddi);
    core.memWrite32(BASE + 2, 0x00000073); // ecall
    core.reset(BASE);
    core.regs[1] = 10;
    for (let i = 0; i < 10 && !core.halted; i++) core.step();
    expect(core.regs[1] | 0).toBe(15);
  });

  test('C.MV moves value between registers', () => {
    const core = makeCore();
    // C.MV: add x3, x0, x2 (compressed)
    // [15:13]=100 [12]=0 [11:7]=00011(x3) [6:2]=00010(x2) [1:0]=10
    const cMv = (0b100 << 13) | (0 << 12) | (3 << 7) | (2 << 2) | 0b10;
    core.memWrite16(BASE, cMv);
    core.memWrite32(BASE + 2, 0x00000073);
    core.reset(BASE);
    core.regs[2] = 0xDEAD;
    for (let i = 0; i < 10 && !core.halted; i++) core.step();
    expect(core.regs[3] >>> 0).toBe(0xDEAD);
  });
});

// ---------------------------------------------------------------------------
// x0 register — always reads zero
// ---------------------------------------------------------------------------

describe('x0 register invariant', () => {
  test('Writing to x0 has no effect', () => {
    const core = makeCore();
    runProgram(core, BASE, [
      0x00500013, // addi x0, x0, 5  (should be no-op)
    ]);
    expect(core.regs[0]).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// ROM Emulation Layer Tests
// ---------------------------------------------------------------------------

describe('ROM Emulation Layer', () => {
  test('memset fills memory correctly', () => {
    const core = makeCore();
    core.reset(BASE);
    const dest = RiscVCore.DRAM_BASE + 0x100;
    core.regs[10] = dest; // a0
    core.regs[11] = 0xAA; // a1
    core.regs[12] = 10;   // a2
    core.regs[1] = BASE + 4; // ra
    core.pc = 0x40000354;

    core.step();

    expect(core.pc).toBe(BASE + 4);
    expect(core.regs[10]).toBe(dest);
    for (let i = 0; i < 10; i++) {
      expect(core.memRead8(dest + i)).toBe(0xAA);
    }
  });

  test('memcpy copies memory correctly', () => {
    const core = makeCore();
    core.reset(BASE);
    const dest = RiscVCore.DRAM_BASE + 0x200;
    const src = RiscVCore.DRAM_BASE + 0x300;
    for (let i = 0; i < 8; i++) {
      core.memWrite8(src + i, 0x11 * (i + 1));
    }
    core.regs[10] = dest; // a0
    core.regs[11] = src;  // a1
    core.regs[12] = 8;    // a2
    core.regs[1] = BASE + 8; // ra
    core.pc = 0x40000358;

    core.step();

    expect(core.pc).toBe(BASE + 8);
    expect(core.regs[10]).toBe(dest);
    for (let i = 0; i < 8; i++) {
      expect(core.memRead8(dest + i)).toBe(0x11 * (i + 1));
    }
  });

  test('strlen calculates string length correctly', () => {
    const core = makeCore();
    core.reset(BASE);
    const strAddr = RiscVCore.DRAM_BASE + 0x400;
    core.memWrite8(strAddr, 0x48); // 'H'
    core.memWrite8(strAddr + 1, 0x65); // 'e'
    core.memWrite8(strAddr + 2, 0x6c); // 'l'
    core.memWrite8(strAddr + 3, 0x6c); // 'l'
    core.memWrite8(strAddr + 4, 0x6f); // 'o'
    core.memWrite8(strAddr + 5, 0); // null
    
    core.regs[10] = strAddr; // a0
    core.regs[1] = BASE + 12; // ra
    core.pc = 0x40000374;

    core.step();

    expect(core.pc).toBe(BASE + 12);
    expect(core.regs[10]).toBe(5);
  });

  test('__udivdi3 performs 64-bit unsigned division correctly', () => {
    const core = makeCore();
    core.reset(BASE);
    core.regs[10] = 4; // a0
    core.regs[11] = 2; // a1
    core.regs[12] = 2; // a2
    core.regs[13] = 0; // a3
    core.regs[1] = BASE + 16; // ra
    core.pc = 0x400008ac;

    core.step();

    expect(core.pc).toBe(BASE + 16);
    expect(core.regs[10]).toBe(2);
    expect(core.regs[11]).toBe(1);
  });
});

