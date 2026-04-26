/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
/**
 * RotaryEncoderEmulator.ts
 * Emulates the KY-040 rotary encoder.
 * Generates quadrature A/B signals and switch press from UI interaction.
 */
export class RotaryEncoderEmulator {
  private position = 0;
  private setPin: (pin: string, high: boolean) => void;
  private pinA: string;
  private pinB: string;

  constructor(pinA: string, pinB: string, setPin: (pin: string, high: boolean) => void) {
    this.pinA = pinA;
    this.pinB = pinB;
    this.setPin = setPin;
    
    // Initialize encoder pins to idle state (both HIGH with pull-ups)
    this.setPin(this.pinA, true);
    this.setPin(this.pinB, true);
    console.log(`[RotaryEncoderEmulator] Initialized: ${pinA}=HIGH, ${pinB}=HIGH`);
  }

  /** Simulate one click clockwise. Generates proper quadrature. */
  stepCW() {
    this.position++;
    this.generateQuadrature(true);
  }

  /** Simulate one click counter-clockwise */
  stepCCW() {
    this.position--;
    this.generateQuadrature(false);
  }

  private generateQuadrature(clockwise: boolean) {
    // Quadrature encoding: 4-phase sequence
    // KY-040 with pull-ups: idle = [HIGH, HIGH]
    // Clockwise: [HIGH,HIGH] → [HIGH,LOW] → [LOW,LOW] → [LOW,HIGH] → [HIGH,HIGH]
    // Counter-clockwise: [HIGH,HIGH] → [LOW,HIGH] → [LOW,LOW] → [HIGH,LOW] → [HIGH,HIGH]
    const phases = clockwise 
      ? [[true, false], [false, false], [false, true], [true, true]]  // CW: A leads B
      : [[false, true], [false, false], [true, false], [true, true]]; // CCW: B leads A

    let step = 0;
    const interval = setInterval(() => {
      if (step >= phases.length) {
        clearInterval(interval);
        // Return to idle (both HIGH with pull-ups)
        this.setPin(this.pinA, true);
        this.setPin(this.pinB, true);
        console.log(`[RotaryEncoderEmulator] Quadrature complete, returned to idle`);
        return;
      }
      this.setPin(this.pinA, phases[step][0]);
      this.setPin(this.pinB, phases[step][1]);
      console.log(`[RotaryEncoderEmulator] Phase ${step}: CLK=${phases[step][0]}, DT=${phases[step][1]}`);
      step++;
    }, 1); // 1ms per phase = 4ms per detent
  }

  getPosition(): number {
    return this.position;
  }
}
