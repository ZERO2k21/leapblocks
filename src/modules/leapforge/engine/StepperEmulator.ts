/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 *
 * StepperEmulator — bipolar stepper motor simulation
 *
 * Supports two wiring modes (auto-detected):
 *
 * Mode A — Direct 4-wire (Arduino Stepper.h / ULN2003):
 *   Pins: A+, A-, B+, B-
 *   Detects full-step and half-step coil sequences, accumulates angle.
 *
 * Mode B — STEP/DIR driver (A4988 / DRV8825):
 *   Pins: STEP, DIR
 *   Steps on every rising edge of STEP. DIR HIGH = CW, LOW = CCW.
 *
 * The visual element receives:
 *   angle  — continuous rotation in degrees (can exceed 360, wraps for display)
 *   value  — formatted angle string (e.g. "720.0°")
 *   units  — "°"
 *   arrow  — '#BEF264' when energized, '' when idle
 */
export class StepperEmulator {
  // Accumulated step count (signed, unbounded)
  private stepCount = 0;

  // Steps per full revolution (default NEMA 200 = 1.8°/step)
  private readonly stepsPerRev: number;

  // 4-wire coil state tracking
  private lastPhase = -1;
  private coilState = { aPlus: false, aMinus: false, bPlus: false, bMinus: false };

  // STEP/DIR state tracking
  private lastStepHigh = false;
  private dirHigh = true; // HIGH = CW

  // Whether any coil is currently energized (for arrow visibility)
  private energized = false;

  private readonly onUpdate: (angle: number, stepCount: number, energized: boolean) => void;

  /**
   * Full-step sequence for bipolar stepper (A+, A-, B+, B-)
   * Each entry is [aPlus, aMinus, bPlus, bMinus]
   * Sequence order = clockwise rotation
   */
  private static readonly FULL_STEP_SEQ: Array<[boolean, boolean, boolean, boolean]> = [
    [true,  false, true,  false], // phase 0
    [false, true,  true,  false], // phase 1
    [false, true,  false, true ], // phase 2
    [true,  false, false, true ], // phase 3
  ];

  /**
   * Half-step sequence (8 phases)
   */
  private static readonly HALF_STEP_SEQ: Array<[boolean, boolean, boolean, boolean]> = [
    [true,  false, false, false], // phase 0
    [true,  false, true,  false], // phase 1
    [false, false, true,  false], // phase 2
    [false, true,  true,  false], // phase 3
    [false, true,  false, false], // phase 4
    [false, true,  false, true ], // phase 5
    [false, false, false, true ], // phase 6
    [true,  false, false, true ], // phase 7
  ];

  constructor(
    stepsPerRev: number,
    onUpdate: (angle: number, stepCount: number, energized: boolean) => void,
  ) {
    this.stepsPerRev = stepsPerRev;
    this.onUpdate = onUpdate;
  }

  // ── Mode A: 4-wire coil control ─────────────────────────────────────────

  /** Call whenever any of the 4 coil pins changes */
  processCoils(aPlus: boolean, aMinus: boolean, bPlus: boolean, bMinus: boolean) {
    this.coilState = { aPlus, aMinus, bPlus, bMinus };
    this.energized = aPlus || aMinus || bPlus || bMinus;

    // Try full-step first, then half-step
    const fullIdx = this.matchPhase(StepperEmulator.FULL_STEP_SEQ, aPlus, aMinus, bPlus, bMinus);
    const halfIdx = this.matchPhase(StepperEmulator.HALF_STEP_SEQ, aPlus, aMinus, bPlus, bMinus);

    const seqLen = fullIdx !== -1 ? 4 : halfIdx !== -1 ? 8 : 0;
    const newPhase = fullIdx !== -1 ? fullIdx : halfIdx;

    if (newPhase === -1) {
      // Coil pattern not in sequence (e.g. all off, or transition state) — skip
      this.emit();
      return;
    }

    if (this.lastPhase !== -1) {
      // Determine direction from phase delta
      const delta = newPhase - this.lastPhase;
      // Wrap-around: e.g. 3→0 = +1 step CW, 0→3 = -1 step CCW
      let step = 0;
      if (delta === 1 || delta === -(seqLen - 1)) step = 1;
      else if (delta === -1 || delta === (seqLen - 1)) step = -1;
      // delta of ±2 or more = skip (noise/glitch), ignore

      this.stepCount += step;
    }

    this.lastPhase = newPhase;
    this.emit();
  }

  // ── Mode B: STEP/DIR driver (A4988 / DRV8825) ───────────────────────────

  /** Call when DIR pin changes */
  setDirection(isHigh: boolean) {
    this.dirHigh = isHigh;
  }

  /** Call when STEP pin changes — steps on rising edge */
  processStep(isHigh: boolean) {
    if (isHigh && !this.lastStepHigh) {
      this.stepCount += this.dirHigh ? 1 : -1;
      this.energized = true;
      this.emit();
    }
    this.lastStepHigh = isHigh;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private matchPhase(
    seq: Array<[boolean, boolean, boolean, boolean]>,
    aPlus: boolean, aMinus: boolean, bPlus: boolean, bMinus: boolean,
  ): number {
    return seq.findIndex(
      ([ap, am, bp, bm]) => ap === aPlus && am === aMinus && bp === bPlus && bm === bMinus,
    );
  }

  private emit() {
    // Continuous angle in degrees (unbounded — shows total rotation)
    const angle = (this.stepCount / this.stepsPerRev) * 360;
    // Display angle wraps to 0–360 for the value text
    const displayAngle = ((angle % 360) + 360) % 360;
    this.onUpdate(displayAngle, this.stepCount, this.energized);
  }

  getStepCount(): number { return this.stepCount; }
  getAngle(): number { return (this.stepCount / this.stepsPerRev) * 360; }
}
