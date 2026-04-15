/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
/**
 * StepperEmulator.ts
 * Tracks step count and angle from pulse signals on STEP/DIR pins.
 */
export class StepperEmulator {
  private steps = 0;
  private direction = 1; // 1 = CW, -1 = CCW
  private stepsPerRevolution: number;
  private lastStepState = false;
  private onUpdate: (angle: number, steps: number) => void;

  constructor(stepsPerRevolution: number, onUpdate: (angle: number, steps: number) => void) {
    this.stepsPerRevolution = stepsPerRevolution;
    this.onUpdate = onUpdate;
  }

  /** Process direction pin change */
  setDirection(isHigh: boolean) {
    this.direction = isHigh ? 1 : -1;
  }

  /** Process step pin change (step on rising edge) */
  processStep(isHigh: boolean) {
    if (isHigh && !this.lastStepState) {
      this.steps += this.direction;
      const angle = ((this.steps % this.stepsPerRevolution) / this.stepsPerRevolution) * 360;
      this.onUpdate(Math.abs(angle), this.steps);
    }
    this.lastStepState = isHigh;
  }

  /** 4-wire stepper: process coil states for half/full step */
  processCoils(a1: boolean, a2: boolean, b1: boolean, b2: boolean) {
    // Determine step from coil energization pattern
    const phase = (a1 ? 1 : 0) | (a2 ? 2 : 0) | (b1 ? 4 : 0) | (b2 ? 8 : 0);
    // Full step sequences: 0101 -> 0110 -> 1010 -> 1001
    const fullSteps = [0b0101, 0b0110, 0b1010, 0b1001];
    const idx = fullSteps.indexOf(phase);
    if (idx !== -1) {
      this.steps = idx;
      const angle = (idx / 4) * 360;
      this.onUpdate(angle, this.steps);
    }
  }

  getSteps(): number { return this.steps; }
  getAngle(): number { return ((this.steps % this.stepsPerRevolution) / this.stepsPerRevolution) * 360; }
}
