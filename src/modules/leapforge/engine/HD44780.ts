/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
/**
 * HD44780 Emulator
 * Simulates the internal state of a Hitachi HD44780 LCD controller.
 * Focuses on 4-bit parallel mode as used by the Arduino LiquidCrystal library.
 */
export class HD44780 {
  public displayMemory: Uint8Array;
  public cursorX: number = 0;
  public cursorY: number = 0;
  public displayOn: boolean = true;
  public cursorOn: boolean = false;
  public blinkOn: boolean = false;
  public backlight: boolean = true;
  
  private cols: number;
  private rows: number;
  private ddramAddress: number = 0;
  private entryMode: number = 0x06; // Increment, no shift
  
  // 4-bit nibble collection state
  private is4BitMode: boolean = false;
  private firstNibble: number | null = null;

  constructor(cols: number = 16, rows: number = 2) {
    this.cols = cols;
    this.rows = rows;
    this.displayMemory = new Uint8Array(cols * rows).fill(32); // Space char
  }

  /**
   * Process a hardware pulse from the Enable (E) pin.
   * @param rs Register Select (0 = Command, 1 = Data)
   * @param data 4-bit or 8-bit data byte
   */
  public processPulse(rs: boolean, data: number) {
    if (!this.is4BitMode) {
      // 8-bit mode or initial switch to 4-bit
      if ((data & 0xF0) === 0x20 && !this.is4BitMode) {
        this.is4BitMode = true;
        this.firstNibble = null;
        // console.log('[LCD] Switched to 4-bit mode');
        return;
      }
      this.handleCommand(rs, data);
    } else {
      // 4-bit mode: Collect two nibbles
      if (this.firstNibble === null) {
        this.firstNibble = data & 0xF0;
      } else {
        const fullByte = this.firstNibble | ((data >> 4) & 0x0F);
        this.firstNibble = null;
        this.handleCommand(rs, fullByte);
      }
    }
  }

  private handleCommand(rs: boolean, value: number) {
    if (rs) {
      // DATA WRITE
      this.writeChar(value);
    } else {
      // COMMAND WRITE
      if (value === 0x01) {
        // Clear Display
        this.displayMemory.fill(32);
        this.ddramAddress = 0;
      } else if (value & 0x80) {
        // Set DDRAM Address
        this.ddramAddress = value & 0x7F;
      } else if (value & 0x40) {
        // Set CGRAM Address (Custom characters - not fully implemented)
      } else if ((value & 0xF8) === 0x08) {
        // Display Control
        this.displayOn = !!(value & 0x04);
        this.cursorOn = !!(value & 0x02);
        this.blinkOn = !!(value & 0x01);
      } else if ((value & 0xFC) === 0x04) {
        // Entry Mode
        this.entryMode = value;
      }
    }
    this.updateCursorCoords();
  }

  private writeChar(char: number) {
    // Map DDRAM address to memory index
    // HD44780 DDRAM layout:
    //   Row 0: 0x00–0x27  (cols 0..cols-1)
    //   Row 1: 0x40–0x67  (cols 0..cols-1)
    //   Row 2: 0x14–0x27  (only for 4-row displays, same physical RAM as row 0 upper half)
    //   Row 3: 0x54–0x67  (only for 4-row displays, same physical RAM as row 1 upper half)
    let row: number;
    let col: number;
    if (this.ddramAddress < 0x40) {
      if (this.ddramAddress < this.cols) {
        row = 0; col = this.ddramAddress;
      } else {
        row = 2; col = this.ddramAddress - this.cols;
      }
    } else {
      const offset = this.ddramAddress - 0x40;
      if (offset < this.cols) {
        row = 1; col = offset;
      } else {
        row = 3; col = offset - this.cols;
      }
    }

    const memIndex = row * this.cols + col;
    if (memIndex >= 0 && memIndex < this.displayMemory.length) {
      this.displayMemory[memIndex] = char;
    }

    // Auto-increment address
    if (this.entryMode & 0x02) {
      this.ddramAddress++;
    } else {
      this.ddramAddress--;
    }
  }

  private updateCursorCoords() {
    if (this.ddramAddress < 0x40) {
      if (this.ddramAddress < this.cols) {
        this.cursorX = this.ddramAddress;
        this.cursorY = 0;
      } else {
        this.cursorX = this.ddramAddress - this.cols;
        this.cursorY = 2;
      }
    } else {
      const offset = this.ddramAddress - 0x40;
      if (offset < this.cols) {
        this.cursorX = offset;
        this.cursorY = 1;
      } else {
        this.cursorX = offset - this.cols;
        this.cursorY = 3;
      }
    }
  }

  public getState() {
    return {
      characters: Array.from(this.displayMemory),
      cursorX: this.cursorX,
      cursorY: this.cursorY,
      cursor: this.cursorOn,
      blink: this.blinkOn,
      backlight: this.backlight
    };
  }
}
