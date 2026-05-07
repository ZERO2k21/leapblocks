/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
/**
 * TiltSwitchEmulator.ts
 * Emulates a tilt switch (ball switch / mercury switch).
 *
 * Pin behavior:
 *   OUT – goes HIGH when tilted (ball makes contact), LOW when upright.
 *   VCC – power supply
 *   GND – ground
 *
 * The tilt state is controlled by the UI (user clicks to toggle tilt).
 */
export class TiltSwitchEmulator {
  private tilted = false;
  private setPin: (pin: string, high: boolean) => void;
  private pinOut: string;

  constructor(
    pinOut: string,
    setPin: (pin: string, high: boolean) => void
  ) {
    this.pinOut = pinOut;
    this.setPin = setPin;
  }

  /**
   * Set the tilt state.
   * @param tilted - true if tilted (ball makes contact), false if upright
   */
  setTilted(tilted: boolean) {
    this.tilted = tilted;
    // OUT pin goes HIGH when tilted, LOW when upright
    this.setPin(this.pinOut, tilted);
  }

  /**
   * Get the current tilt state.
   */
  isTilted(): boolean {
    return this.tilted;
  }

  /**
   * Toggle the tilt state.
   */
  toggle() {
    this.setTilted(!this.tilted);
  }
}
