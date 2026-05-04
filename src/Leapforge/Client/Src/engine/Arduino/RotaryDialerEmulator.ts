/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
/**
 * RotaryDialerEmulator.ts
 * Emulates a classic telephone rotary dialer.
 *
 * Pin behaviour (matching Wokwi rotary-dialer):
 *   DIAL  – goes HIGH while the dial is in motion (off-normal).
 *   PULSE – toggles LOW/HIGH for each pulse. Digit N produces N pulses
 *           (digit 0 produces 10 pulses).
 *
 * Typical timing: ~10 pps (100 ms per pulse cycle), ~60 % break (LOW).
 */
export class RotaryDialerEmulator {
  private setPin: (pin: string, high: boolean) => void;
  private pinDial: string;
  private pinPulse: string;
  private running = false;

  constructor(
    pinDial: string,
    pinPulse: string,
    setPin: (pin: string, high: boolean) => void
  ) {
    this.pinDial = pinDial;
    this.pinPulse = pinPulse;
    this.setPin = setPin;
  }

  /** Start a dial sequence for the given digit (0-9). */
  dial(digit: number) {
    if (this.running) return; // ignore if already dialling
    this.running = true;

    const pulseCount = digit === 0 ? 10 : digit;
    const cycleMs = 100;          // 10 pulses per second
    const breakMs = 60;           // LOW duration (~60 % break)
    const makeMs = cycleMs - breakMs;

    let pulse = 0;

    // DIAL goes HIGH as soon as the finger leaves the digit hole
    this.setPin(this.pinDial, true);

    const doPulse = () => {
      if (pulse >= pulseCount) {
        // All pulses sent — return to idle
        this.setPin(this.pinPulse, true); // idle HIGH
        this.setPin(this.pinDial, false);
        this.running = false;
        return;
      }

      // Break (LOW)
      this.setPin(this.pinPulse, false);

      setTimeout(() => {
        // Make (HIGH)
        this.setPin(this.pinPulse, true);
        pulse++;

        setTimeout(() => doPulse(), makeMs);
      }, breakMs);
    };

    // Kick off the first pulse after a short initial delay
    setTimeout(() => doPulse(), 50);
  }

  isRunning(): boolean {
    return this.running;
  }
}
