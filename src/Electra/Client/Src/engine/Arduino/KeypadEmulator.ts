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
  private pressedKeys = new Set<string>();
  public get currentKey(): string | null {
    return this.pressedKeys.size > 0 ? Array.from(this.pressedKeys)[this.pressedKeys.size - 1] : null;
  }
  private rowPins: string[]; // AVR pins for rows
  private colPins: string[]; // AVR pins for columns
  private setPin: (pin: string, high: boolean) => void;
  private isPinOutput: (pin: string) => boolean;
  private getPinState: (pin: string) => any;
  private getCycles: () => number;
  private getFrequency: () => number;

  private activeKey: string | null = null;
  private activeKeyStartCycles = 0;
  private isGapActive = false;
  private keyQueue: string[] = [];

  private isUpdatingMatrix = false;

  constructor(
    rowPins: string[],
    colPins: string[],
    setPin: (pin: string, high: boolean) => void,
    isPinOutput: (pin: string) => boolean,
    getPinState: (pin: string) => any,
    getCycles: () => number,
    getFrequency: () => number
  ) {
    this.rowPins = rowPins;
    this.colPins = colPins;
    this.setPin = setPin;
    this.isPinOutput = isPinOutput;
    this.getPinState = getPinState;
    this.getCycles = getCycles;
    this.getFrequency = getFrequency;
  }

  /** Called when any keypad pin changes its direction or value in CircuitEngine */
  onPinChange(pin: string, isHigh: boolean, isOutput: boolean) {
    if (this.isUpdatingMatrix) {
      return;
    }

    this.updateMatrix();
  }

  /** Set the currently pressed key from UI */
  pressKey(key: string | null) {
    if (key === null) {
      this.keyQueue = [];
      this.activeKey = null;
      this.pressedKeys.clear();
    } else {
      this.keyQueue.push(key);
    }
    this.updateMatrix();
  }

  /** Release the key from UI if it matches the currently pressed key */
  releaseKey(key: string | null) {
    // No-op: releases are handled automatically based on CPU cycles/frequency time slice
  }

  private cleanupExpiredKeys(): boolean {
    if (!this.activeKey) {
      // Load the next key from the queue if available
      if (this.keyQueue.length > 0) {
        const next = this.keyQueue.shift();
        if (next) {
          this.activeKey = next;
          this.activeKeyStartCycles = this.getCycles();
          this.isGapActive = false;
          this.pressedKeys.clear();
          this.pressedKeys.add(next);
          return true;
        }
      }
      return false;
    }

    const currentCycles = this.getCycles();
    const frequency = this.getFrequency() || 16e6;
    const elapsedMs = ((currentCycles - this.activeKeyStartCycles) / frequency) * 1000;

    if (this.isGapActive) {
      // 20ms idle gap between key presses to simulate key release
      if (elapsedMs >= 20) {
        this.activeKey = null;
        this.pressedKeys.clear();
        // Load next key immediately if available
        this.cleanupExpiredKeys();
        return true;
      }
    } else {
      // 80ms active key press to pass microcontroller Keypad library debounce threshold
      if (elapsedMs >= 80) {
        this.isGapActive = true;
        this.activeKeyStartCycles = currentCycles;
        this.pressedKeys.clear(); // Disconnect row/col during the gap
        return true;
      }
    }

    return false;
  }

  private updateMatrix() {
    if (this.isUpdatingMatrix) return;
    this.isUpdatingMatrix = true;
    try {
      this.cleanupExpiredKeys();

      // 1. Reset any INPUT pins to HIGH (pull-up) first.
      // Do NOT reset OUTPUT pins — they are actively driven by the AVR CPU as outputs.
      // Resetting driven outputs would corrupt their pin state (LOW → HIGH), triggering recursive
      // listener calls, and causing keypresses to be undetectable.
      this.rowPins.forEach(pin => {
        if (pin && !this.isPinOutput(pin)) {
          this.setPin(pin, true);
        }
      });
      this.colPins.forEach(pin => {
        if (pin && !this.isPinOutput(pin)) {
          this.setPin(pin, true);
        }
      });

      // 2. If no key is pressed, we are done (all inputs float/pull HIGH).
      if (this.pressedKeys.size === 0) return;

      // 3. Connect row and column for each pressed key:
      this.pressedKeys.forEach(key => {
        let pressedRow = -1, pressedCol = -1;
        for (let r = 0; r < this.keys.length; r++) {
          const c = this.keys[r].indexOf(key);
          if (c !== -1) { pressedRow = r; pressedCol = c; break; }
        }

        if (pressedRow === -1) return;

        const rowPin = this.rowPins[pressedRow];
        const colPin = this.colPins[pressedCol];
        if (!rowPin || !colPin) return;

        const rowIsOutput = this.isPinOutput(rowPin);
        const colIsOutput = this.isPinOutput(colPin);

        // Get the high/low state of the pins from the runner
        const rowIsHigh = this.getPinState(rowPin) === 'HIGH';
        const colIsHigh = this.getPinState(colPin) === 'HIGH';

        // 4. Connect row and column electrically:
        // If column is output and row is input:
        if (colIsOutput && !rowIsOutput) {
          this.setPin(rowPin, colIsHigh);
        }
        // If row is output and column is input:
        else if (rowIsOutput && !colIsOutput) {
          this.setPin(colPin, rowIsHigh);
        }
      });
    } finally {
      this.isUpdatingMatrix = false;
    }
  }

  getKeys(): string[][] {
    return this.keys;
  }
}
