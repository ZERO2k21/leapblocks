/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
/**
 * KeypadEmulator.ts
 * Emulates a 4x4 membrane keypad matrix scanning.
 * Row pins are output (scanned by Arduino), Column pins are input (read by Arduino).
 */
export class KeypadEmulator {
  private keys: string[][] = [
    ['1', '2', '3', 'A'],
    ['4', '5', '6', 'B'],
    ['7', '8', '9', 'C'],
    ['*', '0', '#', 'D']
  ];
  private pressedKey: string | null = null;
  public get currentKey(): string | null { return this.pressedKey; }
  private rowPins: string[]; // AVR pins for rows
  private colPins: string[]; // AVR pins for columns
  private rowStates: boolean[] = [true, true, true, true]; // Current row output states
  private setPin: (pin: string, high: boolean) => void;

  constructor(
    rowPins: string[],
    colPins: string[],
    setPin: (pin: string, high: boolean) => void
  ) {
    this.rowPins = rowPins;
    this.colPins = colPins;
    this.setPin = setPin;
  }

  /** Called when Arduino sets a row pin HIGH/LOW during scanning */
  onRowChange(rowPin: string, isHigh: boolean) {
    const rowIdx = this.rowPins.indexOf(rowPin);
    if (rowIdx === -1) return;
    this.rowStates[rowIdx] = isHigh;
    this.updateColumns();
  }

  /** Set the currently pressed key from UI */
  pressKey(key: string | null) {
    this.pressedKey = key;
    this.updateColumns();
  }

  private updateColumns() {
    if (!this.pressedKey) {
      // No key pressed: all columns HIGH (pull-up)
      this.colPins.forEach(pin => this.setPin(pin, true));
      return;
    }

    // Find which row/col the pressed key is in
    let pressedRow = -1, pressedCol = -1;
    for (let r = 0; r < this.keys.length; r++) {
      const c = this.keys[r].indexOf(this.pressedKey);
      if (c !== -1) { pressedRow = r; pressedCol = c; break; }
    }

    if (pressedRow === -1) return;

    // If the row being scanned is LOW and matches pressed key's row,
    // then the corresponding column goes LOW
    this.colPins.forEach((colPin, colIdx) => {
      if (colIdx === pressedCol && !this.rowStates[pressedRow]) {
        this.setPin(colPin, false);
      } else {
        this.setPin(colPin, true);
      }
    });
  }

  getKeys(): string[][] {
    return this.keys;
  }
}
