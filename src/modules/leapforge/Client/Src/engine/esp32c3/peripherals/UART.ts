/**
 * LeapBlocks – ESP32-C3 UART Peripheral (MMIO)
 *
 * Register offsets verified against:
 *   esp-idf/components/soc/esp32c3/include/soc/uart_reg.h (v5.1)
 *
 * UART0 base: 0x60000000
 * UART1 base: 0x60010000
 *
 * Key registers (offsets from base):
 *   0x000  UART_FIFO_REG         — write byte → TX; read → RX
 *   0x004  UART_INT_RAW_REG
 *   0x008  UART_INT_ST_REG
 *   0x00C  UART_INT_ENA_REG
 *   0x010  UART_INT_CLR_REG
 *   0x014  UART_CLKDIV_REG
 *   0x018  UART_RX_FILT_REG
 *   0x01C  UART_STATUS_REG       — TXFIFO_CNT[25:16], RXFIFO_CNT[9:0]
 *   0x020  UART_CONF0_REG
 *   0x024  UART_CONF1_REG        — TXFIFO_EMPTY_THRHD[17:9], RXFIFO_FULL_THRHD[8:0]
 *   0x060  UART_MEM_CONF_REG
 *   0x078  UART_CLK_CONF_REG
 *   0x07C  UART_DATE_REG
 *   0x080  UART_ID_REG
 */

import { MemoryRegion } from '../cpu/RiscVCore';

type u32 = number;

export type SerialOutputCallback = (char: string) => void;

// Register offsets (from official uart_reg.h)
const UART_FIFO_REG = 0x000;
const UART_INT_RAW_REG = 0x004;
const UART_INT_ST_REG = 0x008;
const UART_INT_ENA_REG = 0x00C;
const UART_INT_CLR_REG = 0x010;
const UART_CLKDIV_REG = 0x014;
const UART_STATUS_REG = 0x01C; // ← correct offset (was 0x024 before)
const UART_CONF0_REG = 0x020; // ← correct offset (was 0x02C before)
const UART_CONF1_REG = 0x024; // ← correct offset (was 0x030 before)
const UART_MEM_CONF_REG = 0x060;
const UART_CLK_CONF_REG = 0x078;
const UART_DATE_REG = 0x07C;
const UART_ID_REG = 0x080;

// UART_STATUS_REG bits
// TXFIFO_CNT[25:16] — bytes in TX FIFO (we always report 0 = empty/ready)
// RXFIFO_CNT[9:0]   — bytes in RX FIFO
const UART_STATUS_TX_IDLE = 0x00000000; // TXFIFO_CNT = 0 (TX FIFO empty, ready)

// UART_INT_RAW bits
const UART_TXFIFO_EMPTY_INT = (1 << 1); // TX FIFO below threshold
const UART_RXFIFO_FULL_INT = (1 << 0); // RX FIFO above threshold

export class ESP32C3UART implements MemoryRegion {
  readonly base: u32;
  readonly size: u32 = 0x1000;

  private intRaw: u32 = UART_TXFIFO_EMPTY_INT; // TX FIFO starts empty
  private intEna: u32 = 0;
  private conf0: u32 = 0;
  private conf1: u32 = 0x60 | (0x60 << 9); // default thresholds
  private clkdiv: u32 = 0x2B6;
  private clkConf: u32 = (1 << 22) | (1 << 24) | (1 << 25) | (3 << 20); // clocks enabled

  // RX FIFO
  private rxFifo: number[] = [];
  // TX accumulation buffer — emit on newline
  private txBuf: string = '';

  private onOutput: SerialOutputCallback[] = [];
  private onIRQ: ((irq: number) => void) | null = null;

  readonly uartNo: number;

  constructor(uartNo: number) {
    this.uartNo = uartNo;
    this.base = uartNo === 0 ? 0x60000000 : 0x60010000;
  }

  onSerialOutput(cb: SerialOutputCallback): void { this.onOutput.push(cb); }
  onInterrupt(cb: (irq: number) => void): void { this.onIRQ = cb; }

  injectRx(str: string): void {
    for (const ch of str) this.rxFifo.push(ch.charCodeAt(0));
    this.intRaw |= UART_RXFIFO_FULL_INT;
    if (this.intEna & UART_RXFIFO_FULL_INT && this.onIRQ) {
      this.onIRQ(this.uartNo === 0 ? 21 : 22);
    }
  }

  // ── MemoryRegion ──────────────────────────────────────────────────────────

  read8(addr: u32): u32 { return this.read32(addr & ~3) >> ((addr & 3) * 8) & 0xFF; }
  read16(addr: u32): u32 { return this.read32(addr & ~3) >> ((addr & 2) * 8) & 0xFFFF; }

  read32(addr: u32): u32 {
    const off = (addr - this.base) >>> 0;
    switch (off) {
      case UART_FIFO_REG: {
        if (this.rxFifo.length > 0) {
          const byte = this.rxFifo.shift()!;
          if (this.rxFifo.length === 0) this.intRaw &= ~UART_RXFIFO_FULL_INT;
          return byte;
        }
        return 0;
      }
      case UART_INT_RAW_REG: return this.intRaw;
      case UART_INT_ST_REG: return this.intRaw & this.intEna;
      case UART_INT_ENA_REG: return this.intEna;
      case UART_CLKDIV_REG: return this.clkdiv;
      case UART_STATUS_REG: {
        // TXFIFO_CNT[25:16] = 0 (TX always empty/ready)
        // RXFIFO_CNT[9:0]   = rxFifo.length
        const rxCnt = Math.min(this.rxFifo.length, 0x3FF);
        return (0 << 16) | rxCnt; // TXFIFO_CNT=0, RXFIFO_CNT=actual
      }
      case UART_CONF0_REG: return this.conf0;
      case UART_CONF1_REG: return this.conf1;
      case UART_CLK_CONF_REG: return this.clkConf;
      case UART_DATE_REG: return 0x2008270; // version
      case UART_ID_REG: return 0x40000500 | (this.uartNo === 0 ? 0 : 1);
      default: return 0;
    }
  }

  write8(addr: u32, val: u32): void { this.write32(addr & ~3, val & 0xFF); }
  write16(addr: u32, val: u32): void { this.write32(addr & ~3, val & 0xFFFF); }

  write32(addr: u32, val: u32): void {
    const off = (addr - this.base) >>> 0;
    switch (off) {
      case UART_FIFO_REG: {
        // TX: write one byte to the FIFO
        const ch = String.fromCharCode(val & 0xFF);
        this.txBuf += ch;
        console.log(`[UART${this.uartNo}] TX byte: 0x${(val & 0xFF).toString(16)} '${ch.replace(/\n/, '\\n')}'`);
        // Emit on newline OR when buffer gets large (flush)
        if (ch === '\n' || this.txBuf.length >= 256) {
          const line = this.txBuf;
          this.txBuf = '';
          this.onOutput.forEach(cb => cb(line));
        }
        // TX FIFO empty interrupt (we process immediately)
        this.intRaw |= UART_TXFIFO_EMPTY_INT;
        if (this.intEna & UART_TXFIFO_EMPTY_INT && this.onIRQ) {
          this.onIRQ(this.uartNo === 0 ? 21 : 22);
        }
        break;
      }
      case UART_INT_ENA_REG: this.intEna = val; break;
      case UART_INT_CLR_REG: this.intRaw &= ~val; break;
      case UART_CLKDIV_REG: this.clkdiv = val; break;
      case UART_CONF0_REG: this.conf0 = val; break;
      case UART_CONF1_REG: this.conf1 = val; break;
      case UART_CLK_CONF_REG: this.clkConf = val; break;
      // All other writes silently accepted
    }
  }
}
