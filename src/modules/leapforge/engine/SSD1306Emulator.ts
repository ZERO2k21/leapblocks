/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
/**
 * SSD1306Emulator.ts
 * Emulates the SSD1306 128x64 OLED display via I2C.
 * Decodes I2C command/data bytes into a pixel buffer.
 */
export class SSD1306Emulator {
  readonly width = 128;
  readonly height = 64;
  readonly pages = 8; // 64 / 8
  private buffer: Uint8Array;
  private addressingMode = 0; // 0=Horizontal, 1=Vertical, 2=Page
  private colStart = 0;
  private colEnd = 127;
  private pageStart = 0;
  private pageEnd = 7;
  private col = 0;
  private page = 0;
  private displayOn = false;
  private contrast = 0xFF;
  private pendingCommand: number | null = null;
  private onUpdate: (pixels: Uint8Array, displayOn: boolean) => void;

  constructor(onUpdate: (pixels: Uint8Array, displayOn: boolean) => void) {
    this.buffer = new Uint8Array(this.width * this.pages);
    this.onUpdate = onUpdate;
  }

  /** Process an I2C byte. controlByte determines command vs data. */
  processI2CByte(controlByte: number, dataByte: number) {
    const isData = (controlByte & 0x40) !== 0;
    if (isData) {
      this.writeData(dataByte);
    } else {
      this.writeCommand(dataByte);
    }
  }

  private writeCommand(cmd: number) {
    if (this.pendingCommand !== null) {
      const prev = this.pendingCommand;
      this.pendingCommand = null;

      switch (prev) {
        case 0x20: this.addressingMode = cmd & 0x03; return;
        case 0x21: // Column address - first byte = start
          this.colStart = cmd & 0x7F;
          this.pendingCommand = 0xF0; // wait for end
          return;
        case 0xF0: // Column address - second byte = end
          this.colEnd = cmd & 0x7F;
          this.col = this.colStart;
          return;
        case 0x22: // Page address - first byte = start
          this.pageStart = cmd & 0x07;
          this.pendingCommand = 0xF1;
          return;
        case 0xF1: // Page address - second byte = end
          this.pageEnd = cmd & 0x07;
          this.page = this.pageStart;
          return;
        case 0x81: this.contrast = cmd; return;
        default: return;
      }
    }

    if (cmd === 0xAE) { this.displayOn = false; this.flush(); }
    else if (cmd === 0xAF) { this.displayOn = true; this.flush(); }
    else if (cmd === 0x20) { this.pendingCommand = 0x20; }
    else if (cmd === 0x21) { this.pendingCommand = 0x21; }
    else if (cmd === 0x22) { this.pendingCommand = 0x22; }
    else if (cmd === 0x81) { this.pendingCommand = 0x81; }
    // Page addressing mode column/page set
    else if ((cmd & 0xF0) === 0x00) { this.col = (this.col & 0xF0) | (cmd & 0x0F); }
    else if ((cmd & 0xF0) === 0x10) { this.col = (this.col & 0x0F) | ((cmd & 0x0F) << 4); }
    else if ((cmd & 0xF8) === 0xB0) { this.page = cmd & 0x07; }
  }

  private writeData(data: number) {
    if (this.col >= 0 && this.col < this.width && this.page >= 0 && this.page < this.pages) {
      this.buffer[this.page * this.width + this.col] = data;
    }

    this.col++;
    if (this.col > this.colEnd) {
      this.col = this.colStart;
      this.page++;
      if (this.page > this.pageEnd) {
        this.page = this.pageStart;
        this.flush();
      }
    }
  }

  private flush() {
    this.onUpdate(new Uint8Array(this.buffer), this.displayOn);
  }

  getPixelBuffer(): Uint8Array {
    return this.buffer;
  }

  isOn(): boolean {
    return this.displayOn;
  }
}
