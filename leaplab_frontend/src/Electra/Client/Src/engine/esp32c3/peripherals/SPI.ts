/**
 * LeapBlocks – ESP32-C3 SPI2 (GPSPI2) Peripheral (MMIO)
 *
 * Implements the GPSPI2 (SPI2) master MMIO registers used by the
 * Arduino ESP32 SPI library and TFT_eSPI for TFT display support.
 *
 * SPI2 base: 0x6002_4000
 * SPI3 base: 0x6002_5000
 *
 * Key registers:
 *   0x000  SPI_CMD_REG        — USR bit (bit 18) triggers transaction
 *   0x004  SPI_ADDR_REG       — address phase data
 *   0x008  SPI_CTRL_REG       — byte order, bit order
 *   0x010  SPI_USER_REG       — MOSI/MISO enable, CPHA/CPOL, etc.
 *   0x014  SPI_USER1_REG      — MOSI/MISO bit lengths
 *   0x018  SPI_USER2_REG      — command length/value
 *   0x01C  SPI_MS_DLEN_REG    — MOSI data bit length
 *   0x020  SPI_MISC_REG       — CS pin config
 *   0x024  SPI_DIN_MODE_REG
 *   0x098  SPI_W0_REG – SPI_W15_REG  data buffer (64 bytes)
 *   0x0EC  SPI_SLAVE_REG
 *   0x0F0  SPI_SLAVE1_REG
 *   0x0F8  SPI_CLK_GATE_REG
 *   0x0FC  SPI_DATE_REG
 */

import { MemoryRegion } from '../cpu/RiscVCore';

type u32 = number;

// ---------------------------------------------------------------------------
// SPI Device interface
// ---------------------------------------------------------------------------

export interface SPIDevice {
  /** Called at start of transaction with CS asserted */
  onSelect(): void;
  /** Called for each byte exchanged — return MISO byte */
  onTransfer(txByte: number): number;
  /** Called when CS deasserted */
  onDeselect(): void;
}

// ---------------------------------------------------------------------------
// Register offsets
// ---------------------------------------------------------------------------
const SPI_CMD_REG      = 0x000;
const SPI_ADDR_REG     = 0x004;
const SPI_CTRL_REG     = 0x008;
const SPI_USER_REG     = 0x010;
const SPI_USER1_REG    = 0x014;
const SPI_USER2_REG    = 0x018;
const SPI_MS_DLEN_REG  = 0x01C;
const SPI_MISC_REG     = 0x020;
const SPI_W0_BASE      = 0x098;
const SPI_W_COUNT      = 16; // 16 × u32 = 64 bytes

export class ESP32C3SPI implements MemoryRegion {
  readonly base: u32;
  readonly size: u32 = 0x1000;
  readonly spiNo: number;

  private device: SPIDevice | null = null;

  private cmd: u32 = 0;
  private addr: u32 = 0;
  private ctrl: u32 = 0;
  private user: u32 = 0;
  private user1: u32 = 0;
  private user2: u32 = 0;
  private msDlen: u32 = 0;
  private misc: u32 = 0;
  private wBuf: u32[] = new Array(SPI_W_COUNT).fill(0);

  constructor(spiNo: number) {
    this.spiNo = spiNo;
    this.base = spiNo === 2 ? 0x60024000 : 0x60025000;
  }

  attachDevice(dev: SPIDevice): void { this.device = dev; }

  // ---------------------------------------------------------------------------
  // Execute a SPI transaction when USR bit is set
  // ---------------------------------------------------------------------------

  private executeTransaction(): void {
    if (!this.device) return;

    const txBits  = (this.msDlen & 0x3FFFF) + 1; // MOSI data length in bits
    const txBytes = Math.ceil(txBits / 8);

    // Extract SPI mode from USER register (CPOL = bit 11, CPHA = bit 10)
    const cpol = !!(this.user & (1 << 11));
    const cpha = !!(this.user & (1 << 10));
    // Mode 0: CPOL=0,CPHA=0 | Mode 1: CPOL=0,CPHA=1
    // Mode 2: CPOL=1,CPHA=0 | Mode 3: CPOL=1,CPHA=1

    this.device.onSelect();

    // Pull bytes from W buffer, MSB-first
    const rxBuf: number[] = [];
    for (let i = 0; i < txBytes; i++) {
      const wordIdx = Math.floor(i / 4);
      const byteIdx = i % 4;
      // Respect bit-order from SPI_CTRL_REG (bit 23: WR_BIT_ORDER)
      const lsbFirst = !!(this.ctrl & (1 << 23));
      const txByte = lsbFirst
        ? this.reverseByte((this.wBuf[wordIdx] >> (byteIdx * 8)) & 0xFF)
        : (this.wBuf[wordIdx] >> (byteIdx * 8)) & 0xFF;

      const rxByte = this.device.onTransfer(txByte);
      rxBuf.push(rxByte);
    }

    // Store received bytes back into W buffer
    for (let i = 0; i < rxBuf.length; i++) {
      const wordIdx = Math.floor(i / 4);
      const byteIdx = i % 4;
      this.wBuf[wordIdx] =
        (this.wBuf[wordIdx] & ~(0xFF << (byteIdx * 8))) |
        ((rxBuf[i] & 0xFF) << (byteIdx * 8));
    }

    this.device.onDeselect();

    // Clear USR bit to indicate completion
    this.cmd &= ~(1 << 18);
  }

  private reverseByte(b: number): number {
    b = ((b & 0xAA) >> 1) | ((b & 0x55) << 1);
    b = ((b & 0xCC) >> 2) | ((b & 0x33) << 2);
    b = ((b & 0xF0) >> 4) | ((b & 0x0F) << 4);
    return b & 0xFF;
  }

  // ---------------------------------------------------------------------------
  // MemoryRegion
  // ---------------------------------------------------------------------------

  read8(addr: u32): u32  { return this.read32(addr) & 0xFF; }
  read16(addr: u32): u32 { return this.read32(addr) & 0xFFFF; }

  read32(addr: u32): u32 {
    const off = (addr - this.base) >>> 0;
    switch (off) {
      case SPI_CMD_REG:   return this.cmd;
      case SPI_ADDR_REG:  return this.addr;
      case SPI_CTRL_REG:  return this.ctrl;
      case SPI_USER_REG:  return this.user;
      case SPI_USER1_REG: return this.user1;
      case SPI_USER2_REG: return this.user2;
      case SPI_MS_DLEN_REG:return this.msDlen;
      case SPI_MISC_REG:  return this.misc;
      default: {
        if (off >= SPI_W0_BASE && off < SPI_W0_BASE + SPI_W_COUNT * 4) {
          return this.wBuf[(off - SPI_W0_BASE) >> 2];
        }
        return 0;
      }
    }
  }

  write8(addr: u32, val: u32): void  { this.write32(addr, val); }
  write16(addr: u32, val: u32): void { this.write32(addr, val); }

  write32(addr: u32, val: u32): void {
    const off = (addr - this.base) >>> 0;
    switch (off) {
      case SPI_CMD_REG:
        this.cmd = val;
        if (val & (1 << 18)) this.executeTransaction(); // USR bit
        break;
      case SPI_ADDR_REG:    this.addr   = val; break;
      case SPI_CTRL_REG:    this.ctrl   = val; break;
      case SPI_USER_REG:    this.user   = val; break;
      case SPI_USER1_REG:   this.user1  = val; break;
      case SPI_USER2_REG:   this.user2  = val; break;
      case SPI_MS_DLEN_REG: this.msDlen = val; break;
      case SPI_MISC_REG:    this.misc   = val; break;
      default: {
        if (off >= SPI_W0_BASE && off < SPI_W0_BASE + SPI_W_COUNT * 4) {
          this.wBuf[(off - SPI_W0_BASE) >> 2] = val;
        }
        break;
      }
    }
  }
}
