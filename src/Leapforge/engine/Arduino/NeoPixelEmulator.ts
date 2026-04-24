/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
/**
 * NeoPixelEmulator.ts
 * Decodes WS2812B data protocol from a single data pin.
 * Each LED = 24 bits (GRB order): 8 green, 8 red, 8 blue.
 * Timing: '1' bit = HIGH ~800ns LOW ~450ns, '0' bit = HIGH ~400ns LOW ~850ns
 * Reset gap: >50µs LOW
 */
export class NeoPixelEmulator {
  private pixels: Array<{ r: number; g: number; b: number }> = [];
  private bitBuffer: number[] = [];
  private lastHighCycles = 0;
  private lastLowCycles = 0;
  private isHigh = false;
  private hasSeenFirstEdge = false;
  private readonly cpuFreqMHz: number;
  private onUpdate: (pixels: Array<{ r: number; g: number; b: number }>) => void;

  constructor(numPixels: number, cpuFreqMHz: number, onUpdate: (pixels: Array<{ r: number; g: number; b: number }>) => void) {
    this.cpuFreqMHz = cpuFreqMHz;
    this.onUpdate = onUpdate;
    this.pixels = Array.from({ length: numPixels }, () => ({ r: 0, g: 0, b: 0 }));
  }

  processSignal(isHigh: boolean, currentCycles: number) {
    if (isHigh && !this.isHigh) {
      // Rising edge: measure LOW duration
      if (!this.hasSeenFirstEdge) {
        // Skip reset-gap check on the very first edge — lastLowCycles is 0
        // which would produce a massive fake duration and flush an empty buffer
        this.hasSeenFirstEdge = true;
        this.lastHighCycles = currentCycles;
        this.isHigh = isHigh;
        return;
      }

      const lowDurationNs = ((currentCycles - this.lastLowCycles) / this.cpuFreqMHz) * 1000;
      
      // Reset gap: >50µs LOW means frame is done
      if (lowDurationNs > 50000 && this.bitBuffer.length > 0) {
        this.flushBits();
      }
      this.lastHighCycles = currentCycles;
    } else if (!isHigh && this.isHigh) {
      // Falling edge: measure HIGH duration to determine bit value
      const highDurationNs = ((currentCycles - this.lastHighCycles) / this.cpuFreqMHz) * 1000;
      
      // '1' bit: HIGH ~700-1000ns, '0' bit: HIGH ~200-500ns
      const bit = highDurationNs > 550 ? 1 : 0;
      this.bitBuffer.push(bit);
      this.lastLowCycles = currentCycles;
    }
    this.isHigh = isHigh;
  }

  private flushBits() {
    // Every 24 bits = 1 pixel (GRB order)
    const numCompletePixels = Math.floor(this.bitBuffer.length / 24);
    for (let i = 0; i < this.pixels.length; i++) {
      if (i < numCompletePixels) {
        const offset = i * 24;
        let g = 0, r = 0, b = 0;
        for (let bit = 0; bit < 8; bit++) {
          g = (g << 1) | (this.bitBuffer[offset + bit] || 0);
          r = (r << 1) | (this.bitBuffer[offset + 8 + bit] || 0);
          b = (b << 1) | (this.bitBuffer[offset + 16 + bit] || 0);
        }
        this.pixels[i] = { r, g, b };
      } else {
        // Pixels beyond the frame data go dark
        this.pixels[i] = { r: 0, g: 0, b: 0 };
      }
    }
    this.bitBuffer = [];
    this.onUpdate([...this.pixels]);
  }

  getPixels() {
    return this.pixels;
  }
}
