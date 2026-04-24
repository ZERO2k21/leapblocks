/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
/**
 * ILI9341Emulator.ts
 * Emulates the ILI9341 320×240 TFT display controller via SPI.
 *
 * Protocol summary:
 *   - D/C pin LOW  → command byte
 *   - D/C pin HIGH → data byte(s)
 *   - Pixels are written as 16-bit RGB565 values (big-endian, MSB first)
 *
 * Supported commands (subset sufficient for Arduino/Adafruit GFX libraries):
 *   0x01  SWRESET  – software reset
 *   0x11  SLPOUT   – sleep out
 *   0x13  NORON    – normal display mode on
 *   0x20  INVOFF   – display inversion off
 *   0x21  INVON    – display inversion on
 *   0x26  GAMSET   – gamma set (1 data byte, ignored)
 *   0x28  DISPOFF  – display off
 *   0x29  DISPON   – display on
 *   0x2A  CASET    – column address set (4 bytes)
 *   0x2B  PASET    – page/row address set (4 bytes)
 *   0x2C  RAMWR    – memory write (pixel stream)
 *   0x36  MADCTL   – memory access control (1 byte, ignored)
 *   0x3A  COLMOD   – pixel format (1 byte, ignored — assume RGB565)
 *   0xB1  FRMCTR1  – frame rate control (variable, ignored)
 *   0xC0  PWCTR1   – power control (variable, ignored)
 *   0xE0  GMCTRP1  – positive gamma (15 bytes, ignored)
 *   0xE1  GMCTRN1  – negative gamma (15 bytes, ignored)
 */

export type ILI9341UpdateCallback = (pixels: Uint8ClampedArray, displayOn: boolean) => void;

const WIDTH  = 240;
const HEIGHT = 320;

// Flush to UI every N pixels written (avoids flooding React with updates)
const FLUSH_INTERVAL = 1024;

export class ILI9341Emulator {
  readonly width  = WIDTH;
  readonly height = HEIGHT;

  // RGBA frame buffer (4 bytes per pixel)
  private buffer = new Uint8ClampedArray(WIDTH * HEIGHT * 4);

  // Window registers
  private colStart = 0;
  private colEnd   = WIDTH - 1;
  private rowStart = 0;
  private rowEnd   = HEIGHT - 1;

  // Current write cursor
  private curCol = 0;
  private curRow = 0;

  // State machine
  private currentCommand: number | null = null;
  private pendingHighByte: number | null = null; // first byte of a 16-bit pixel pair
  private displayOn = true; // treat as on by default so pixels show immediately

  // CASET / PASET / multi-byte command accumulator
  private addrBuf: number[] = [];

  // Throttled flush counter
  private pixelsSinceFlush = 0;

  private onUpdate: ILI9341UpdateCallback;

  constructor(onUpdate: ILI9341UpdateCallback) {
    this.onUpdate = onUpdate;
    // Fill buffer with black, fully opaque
    for (let i = 3; i < this.buffer.length; i += 4) this.buffer[i] = 255;
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /** Called by the SPI slave when D/C is LOW (command byte). */
  writeCommand(cmd: number): void {
    // Flush any pending pixel data before switching to command mode
    if (this.pixelsSinceFlush > 0) {
      this.flush();
    }

    this.currentCommand = cmd;
    this.addrBuf = [];
    this.pendingHighByte = null;

    switch (cmd) {
      case 0x01: // SWRESET
        this.reset();
        break;
      case 0x11: // SLPOUT — wake up, treat display as on
        this.displayOn = true;
        break;
      case 0x13: // NORON
        break;
      case 0x29: // DISPON
        this.displayOn = true;
        this.flush();
        break;
      case 0x28: // DISPOFF
        this.displayOn = false;
        this.flush();
        break;
      // All other commands: data bytes handled in writeData
    }
  }

  /** Called by the SPI slave when D/C is HIGH (data byte). */
  writeData(byte: number): void {
    if (this.currentCommand === null) return;

    switch (this.currentCommand) {
      case 0x2A: // CASET — 4 bytes: x0_hi, x0_lo, x1_hi, x1_lo
        this.addrBuf.push(byte);
        if (this.addrBuf.length === 4) {
          this.colStart = (this.addrBuf[0] << 8) | this.addrBuf[1];
          this.colEnd   = (this.addrBuf[2] << 8) | this.addrBuf[3];
          this.curCol   = this.colStart;
          this.addrBuf  = [];
        }
        break;

      case 0x2B: // PASET — 4 bytes: y0_hi, y0_lo, y1_hi, y1_lo
        this.addrBuf.push(byte);
        if (this.addrBuf.length === 4) {
          this.rowStart = (this.addrBuf[0] << 8) | this.addrBuf[1];
          this.rowEnd   = (this.addrBuf[2] << 8) | this.addrBuf[3];
          this.curRow   = this.rowStart;
          this.addrBuf  = [];
        }
        break;

      case 0x2C: // RAMWR — stream of 16-bit RGB565 pixels
        if (this.pendingHighByte === null) {
          this.pendingHighByte = byte;
        } else {
          const rgb565 = (this.pendingHighByte << 8) | byte;
          this.pendingHighByte = null;
          this.writePixel(this.curCol, this.curRow, rgb565);
          this.advanceCursor();
        }
        break;

      // Single-byte commands whose data bytes we ignore
      case 0x26: // GAMSET
      case 0x36: // MADCTL
      case 0x3A: // COLMOD
        break;

      // Multi-byte init commands — consume and ignore
      default:
        break;
    }
  }

  getBuffer(): Uint8ClampedArray {
    return this.buffer;
  }

  isOn(): boolean {
    return this.displayOn;
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private reset(): void {
    this.buffer.fill(0);
    for (let i = 3; i < this.buffer.length; i += 4) this.buffer[i] = 255;
    this.colStart = 0; this.colEnd = WIDTH - 1;
    this.rowStart = 0; this.rowEnd = HEIGHT - 1;
    this.curCol = 0;   this.curRow = 0;
    this.displayOn = true;
    this.pendingHighByte = null;
    this.addrBuf = [];
    this.pixelsSinceFlush = 0;
  }

  /** Convert RGB565 → RGBA and write into the frame buffer. */
  private writePixel(col: number, row: number, rgb565: number): void {
    if (col < 0 || col >= WIDTH || row < 0 || row >= HEIGHT) return;

    // RGB565: RRRRR GGGGGG BBBBB
    const r = ((rgb565 >> 11) & 0x1F) << 3;
    const g = ((rgb565 >>  5) & 0x3F) << 2;
    const b =  (rgb565        & 0x1F) << 3;

    const idx = (row * WIDTH + col) * 4;
    this.buffer[idx]     = r;
    this.buffer[idx + 1] = g;
    this.buffer[idx + 2] = b;
    this.buffer[idx + 3] = 255;
  }

  /** Advance the write cursor within the active window. */
  private advanceCursor(): void {
    this.pixelsSinceFlush++;

    this.curCol++;
    if (this.curCol > this.colEnd) {
      this.curCol = this.colStart;
      this.curRow++;
      if (this.curRow > this.rowEnd) {
        this.curRow = this.rowStart;
        // Full window written — always flush
        this.flush();
        return;
      }
    }

    // Throttled intermediate flush
    if (this.pixelsSinceFlush >= FLUSH_INTERVAL) {
      this.flush();
    }
  }

  private flush(): void {
    this.pixelsSinceFlush = 0;
    this.onUpdate(new Uint8ClampedArray(this.buffer), this.displayOn);
  }
}
