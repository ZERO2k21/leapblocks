/**
 * LeapBlocks – ESP32-C3 UART0 Peripheral (MMIO)
 *
 * Implements UART0 registers so that Serial.print() / Serial.println()
 * in Arduino sketches emit characters to the LeapBlocks console.
 *
 * UART0 MMIO base: 0x6000_0000
 * UART1 MMIO base: 0x6001_0000
 *
 * Key registers implemented (offsets from base):
 *   0x000  UART_FIFO_REG         — write byte here → TX; read → RX
 *   0x004  UART_INT_RAW_REG      — interrupt raw status
 *   0x008  UART_INT_ST_REG       — interrupt status (masked)
 *   0x00C  UART_INT_ENA_REG      — interrupt enable
 *   0x010  UART_INT_CLR_REG      — write 1 to clear
 *   0x024  UART_STATUS_REG       — bit 0: RX FIFO not empty, bit 1: TX FIFO not full
 *   0x02C  UART_CONF0_REG        — configuration
 *   0x030  UART_CONF1_REG        — FIFO thresholds
 */

import { MemoryRegion } from '../cpu/RiscVCore';

type u32 = number;

export type SerialOutputCallback = (char: string) => void;

const UART_FIFO_REG    = 0x000;
const UART_INT_RAW_REG = 0x004;
const UART_INT_ST_REG  = 0x008;
const UART_INT_ENA_REG = 0x00C;
const UART_INT_CLR_REG = 0x010;
const UART_STATUS_REG  = 0x024;
const UART_CONF0_REG   = 0x02C;

// UART status: TX FIFO always ready (bit 1), RX empty (bit 0 = 0)
const UART_STATUS_TX_READY = 0x02;

export class ESP32C3UART implements MemoryRegion {
  readonly base: u32;
  readonly size: u32 = 0x1000;

  private intRaw: u32  = 0;
  private intEna: u32  = 0;
  private conf0: u32   = 0;

  // RX FIFO — bytes injected from the outside (e.g. Serial.read())
  private rxFifo: number[] = [];
  // TX line buffer — collect bytes until newline then fire callback
  private txBuf: string = '';

  private onOutput: SerialOutputCallback[] = [];
  private onIRQ: ((irq: number) => void) | null = null;

  /** UART instance number (0 or 1) */
  readonly uartNo: number;

  constructor(uartNo: number) {
    this.uartNo = uartNo;
    this.base = uartNo === 0 ? 0x60000000 : 0x60010000;
  }

  onSerialOutput(cb: SerialOutputCallback): void  { this.onOutput.push(cb); }
  onInterrupt(cb: (irq: number) => void): void    { this.onIRQ = cb; }

  /** Inject a string into the RX FIFO (simulates incoming serial data) */
  injectRx(str: string): void {
    for (const ch of str) this.rxFifo.push(ch.charCodeAt(0));
    this.intRaw |= 0x1; // RXFIFO_FULL_INT_RAW
    if (this.intEna & 0x1 && this.onIRQ) this.onIRQ(this.uartNo === 0 ? 21 : 22);
  }

  // -----------------------------------------------------------------------
  // MemoryRegion
  // -----------------------------------------------------------------------

  read8(addr: u32): u32  { return this.read32(addr & ~3); }
  read16(addr: u32): u32 { return this.read32(addr & ~3); }

  read32(addr: u32): u32 {
    const off = (addr - this.base) >>> 0;
    switch (off) {
      case UART_FIFO_REG: {
        if (this.rxFifo.length > 0) {
          const byte = this.rxFifo.shift()!;
          if (this.rxFifo.length === 0) this.intRaw &= ~0x1;
          return byte;
        }
        return 0;
      }
      case UART_INT_RAW_REG: return this.intRaw;
      case UART_INT_ST_REG:  return this.intRaw & this.intEna;
      case UART_INT_ENA_REG: return this.intEna;
      case UART_STATUS_REG:  return UART_STATUS_TX_READY | (this.rxFifo.length > 0 ? 1 : 0);
      case UART_CONF0_REG:   return this.conf0;
      default: return 0;
    }
  }

  write8(addr: u32, val: u32): void { this.write32(addr, val & 0xFF); }
  write16(addr: u32, val: u32): void { this.write32(addr, val & 0xFFFF); }

  write32(addr: u32, val: u32): void {
    const off = (addr - this.base) >>> 0;
    switch (off) {
      case UART_FIFO_REG: {
        const ch = String.fromCharCode(val & 0xFF);
        this.txBuf += ch;
        if (ch === '\n') {
          const line = this.txBuf;
          this.txBuf = '';
          this.onOutput.forEach(cb => cb(line));
        }
        // TX FIFO empty interrupt
        this.intRaw |= 0x4;
        if (this.intEna & 0x4 && this.onIRQ) this.onIRQ(this.uartNo === 0 ? 21 : 22);
        break;
      }
      case UART_INT_ENA_REG: this.intEna = val; break;
      case UART_INT_CLR_REG: this.intRaw &= ~val; break;
      case UART_CONF0_REG:   this.conf0 = val; break;
    }
  }
}
