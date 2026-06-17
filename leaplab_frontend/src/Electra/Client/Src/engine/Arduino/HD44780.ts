/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
/**
 * HD44780 Emulator
 * Simulates the internal state of a Hitachi HD44780 LCD controller.
 * Supports full 80-byte DDRAM, display scrolling, and 4-bit parallel mode.
 *
 * DDRAM Layout (real hardware):
 *   Block 0 (40 bytes): addresses 0x00–0x27  → Row 0 + Row 2
 *   Block 1 (40 bytes): addresses 0x40–0x67  → Row 1 + Row 3
 *
 * The display window shows `cols` characters from each block,
 * offset by `displayShift`.
 */
export class HD44780 {
  // Real HD44780 has 40 characters per DDRAM row block
  private static readonly DDRAM_ROW_SIZE = 40;

  // Internal 80-byte DDRAM (2 blocks × 40)
  private ddram: Uint8Array;

  // Visible output buffer (cols × rows) – consumed by UI rendering
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
  private displayShift: number = 0; // Scroll offset for the display window

  // 4-bit nibble collection state
  private is4BitMode: boolean = false;
  private firstNibble: number | null = null;

  constructor(cols: number = 16, rows: number = 2) {
    this.cols = cols;
    this.rows = rows;
    this.ddram = new Uint8Array(HD44780.DDRAM_ROW_SIZE * 2).fill(32); // 80 bytes, filled with spaces
    this.displayMemory = new Uint8Array(cols * rows).fill(32);
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
      // COMMAND WRITE – decode per HD44780 instruction set (highest bit first)
      if (value & 0x80) {
        // Set DDRAM Address (1xxxxxxx)
        this.ddramAddress = value & 0x7F;
      } else if (value & 0x40) {
        // Set CGRAM Address (01xxxxxx) – custom characters, not fully implemented
      } else if (value & 0x20) {
        // Function Set (001xxxxx) – 4/8 bit mode, lines, font. Already handled at pulse level.
      } else if (value & 0x10) {
        // Cursor or Display Shift (0001 S/C R/L xx)
        const isDisplayShift = !!(value & 0x08); // S/C bit: 1 = display, 0 = cursor
        const isRightShift = !!(value & 0x04);   // R/L bit: 1 = right, 0 = left
        if (isDisplayShift) {
          // Shift the entire display window
          if (isRightShift) {
            // scrollDisplayRight: display window moves right → shift counter decrements
            this.displayShift = (this.displayShift - 1 + HD44780.DDRAM_ROW_SIZE) % HD44780.DDRAM_ROW_SIZE;
          } else {
            // scrollDisplayLeft: display window moves left → shift counter increments
            this.displayShift = (this.displayShift + 1) % HD44780.DDRAM_ROW_SIZE;
          }
        } else {
          // Shift cursor only
          if (isRightShift) {
            this.ddramAddress++;
          } else {
            this.ddramAddress--;
          }
          this.ddramAddress &= 0x7F;
        }
      } else if (value & 0x08) {
        // Display Control (00001xxx)
        this.displayOn = !!(value & 0x04);
        this.cursorOn = !!(value & 0x02);
        this.blinkOn = !!(value & 0x01);
      } else if (value & 0x04) {
        // Entry Mode Set (000001xx)
        this.entryMode = value;
      } else if (value & 0x02) {
        // Return Home (0000001x) – reset address and shift, DDRAM contents unchanged
        this.ddramAddress = 0;
        this.displayShift = 0;
      } else if (value === 0x01) {
        // Clear Display (00000001) – fill DDRAM with spaces, reset address and shift
        this.ddram.fill(32);
        this.ddramAddress = 0;
        this.displayShift = 0;
      }
    }
    this.updateVisibleMemory();
    this.updateCursorCoords();
  }

  /**
   * Write a character to the internal DDRAM at the current address.
   */
  private writeChar(char: number) {
    const R = HD44780.DDRAM_ROW_SIZE;
    if (this.ddramAddress < 0x40) {
      // Block 0 (Row 0 / Row 2)
      const idx = this.ddramAddress % R;
      this.ddram[idx] = char;
    } else {
      // Block 1 (Row 1 / Row 3)
      const idx = (this.ddramAddress - 0x40) % R;
      this.ddram[R + idx] = char;
    }

    // Auto-increment/decrement address based on Entry Mode
    if (this.entryMode & 0x02) {
      this.ddramAddress++;
    } else {
      this.ddramAddress--;
    }
    this.ddramAddress &= 0x7F;
  }

  /**
   * Extract the visible portion of DDRAM into displayMemory,
   * applying the current display shift offset.
   *
   * For a 16×2 display:
   *   Row 0 visible = block0[(shift)...(shift+15)] mod 40
   *   Row 1 visible = block1[(shift)...(shift+15)] mod 40
   *
   * For 4-row displays, rows 2/3 continue from block0/block1
   * offset by `cols`.
   */
  private updateVisibleMemory() {
    const R = HD44780.DDRAM_ROW_SIZE;
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        let blockStart: number;
        let baseOffset: number;

        if (row === 0) {
          blockStart = 0;
          baseOffset = 0;
        } else if (row === 1) {
          blockStart = R;
          baseOffset = 0;
        } else if (row === 2) {
          // Row 2 starts at DDRAM 0x14 (= cols for 20-col) in block 0
          blockStart = 0;
          baseOffset = this.cols;
        } else {
          // Row 3 starts at DDRAM 0x54 (= 0x40 + cols) in block 1
          blockStart = R;
          baseOffset = this.cols;
        }

        const ddramCol = (baseOffset + col + this.displayShift) % R;
        this.displayMemory[row * this.cols + col] = this.ddram[blockStart + ddramCol];
      }
    }
  }

  /**
   * Convert the current DDRAM address to visible cursor coordinates,
   * accounting for display shift.
   */
  private updateCursorCoords() {
    const R = HD44780.DDRAM_ROW_SIZE;
    let rawRow: number;
    let rawCol: number;

    if (this.ddramAddress < 0x40) {
      // Block 0
      const addr = this.ddramAddress % R;
      if (addr < this.cols) {
        rawRow = 0;
        rawCol = addr;
      } else {
        rawRow = 2;
        rawCol = addr - this.cols;
      }
    } else {
      // Block 1
      const offset = (this.ddramAddress - 0x40) % R;
      if (offset < this.cols) {
        rawRow = 1;
        rawCol = offset;
      } else {
        rawRow = 3;
        rawCol = offset - this.cols;
      }
    }

    // Apply display shift to convert DDRAM column to visible screen column
    this.cursorX = (rawCol - this.displayShift + R) % R;
    this.cursorY = rawRow;
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
