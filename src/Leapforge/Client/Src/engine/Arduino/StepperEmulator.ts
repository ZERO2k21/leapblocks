/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

const TAG = '[STEPPER]';
const LOG_INTERVAL = 20;

// ── Types ────────────────────────────────────────────────────────────────────

export type SteppingMode = 'full' | 'half' | 'micro';

export interface StepperConfig {
  stepsPerRev?: number;
  steppingMode?: SteppingMode;
  microstepDivisor?: number;
  peakTorque?: number;
  acceleration?: number;
  directionCW?: boolean;
}

export interface StepperState {
  stepCount: number;
  microPosition: number;
  angle: number;
  currentSpeed: number;
  energized: boolean;
  stalled: boolean;
  stepsLost: number;
  coilState: [boolean, boolean, boolean, boolean];
  direction: 1 | -1;
}

// ── Constants ────────────────────────────────────────────────────────────────

const VALID_DIVISORS = [1, 2, 4, 8, 16, 32, 64, 128, 256] as const;

const FULL_STEP_SEQ: Array<[boolean, boolean, boolean, boolean]> = [
  [true,  false, false, true ],  // phase 0: A+ B-
  [true,  true,  false, false],  // phase 1: A+ B+
  [false, true,  true,  false],  // phase 2: A- B+
  [false, false, true,  true ],  // phase 3: A- B-
];

const HALF_STEP_SEQ: Array<[boolean, boolean, boolean, boolean]> = [
  [true,  false, false, false],  // phase 0
  [true,  true,  false, false],  // phase 1
  [false, true,  false, false],  // phase 2
  [false, true,  true,  false],  // phase 3
  [false, false, true,  false],  // phase 4
  [false, false, true,  true ],  // phase 5
  [false, false, false, true ],  // phase 6
  [true,  false, false, true ],  // phase 7
];

// ── Class ────────────────────────────────────────────────────────────────────

export class StepperEmulator {
  private readonly nodeId: string;
  private readonly stepsPerRev: number;

  private steppingMode: SteppingMode;
  private microstepDivisor: number;
  private peakTorque: number;
  private acceleration: number;

  private stepCount    = 0;
  private microSubStep = 0;

  private currentSpeed = 0;
  private targetSpeed  = 0;
  private lastStepTime = 0;
  private lastDirection: 1 | -1 | 0 = 0;
  private readonly stepIntervals: number[] = [];
  private static readonly SPEED_WINDOW    = 16;
  private static readonly MIN_INTERVAL_MS = 0.05;
  private static readonly MAX_INTERVAL_MS = 500;

  private loadTorque = 0;
  private stalled    = false;
  private stepsLost  = 0;

  private coilState: [boolean, boolean, boolean, boolean] = [false, false, false, false];
  private lastPhase = -1;
  private lastPhaseSeqLen: 4 | 8 | 0 = 0;
  private energized = false;

  private dirHigh: boolean;
  private lastStepHigh = false;

  private mode: 'unknown' | '4-wire' | 'step-dir' = 'unknown';
  private lastLoggedStep = 0;
  private readonly onUpdate: (state: StepperState) => void;
  private rampTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    onUpdate: (state: StepperState) => void,
    config: StepperConfig = {},
    nodeId = '',
  ) {
    this.nodeId           = nodeId;
    this.stepsPerRev      = config.stepsPerRev   ?? 200;
    this.steppingMode     = config.steppingMode  ?? 'full';
    this.microstepDivisor = this.clampDivisor(config.microstepDivisor ?? 16);
    this.peakTorque       = config.peakTorque     ?? 40;
    this.acceleration     = config.acceleration   ?? 200;
    this.dirHigh          = config.directionCW    ?? true;
    this.onUpdate         = onUpdate;

    console.log(`${TAG} [${nodeId}] Created. Initial Dir: ${this.dirHigh ? 'CW' : 'CCW'}`);
  }

  // ── Configuration Methods ──────────────────────────────────────────────────

  setSteppingMode(mode: SteppingMode, divisor?: number) {
    this.steppingMode = mode;
    if (mode === 'micro' && divisor !== undefined) {
      this.microstepDivisor = this.clampDivisor(divisor);
    }
    this.microSubStep = 0;
  }

  setLoad(torqueNcm: number) { this.loadTorque = Math.max(0, torqueNcm); }

  setTargetSpeed(stepsPerSec: number) {
    this.targetSpeed = Math.max(0, stepsPerSec);
    this.startRamp();
  }

  setDirection(isHigh: boolean) {
    this.dirHigh = isHigh;
  }

  toggleDirection() {
    this.dirHigh = !this.dirHigh;
    this.stepIntervals.length = 0; // Flush speed buffer on reversal
    this.lastStepTime = 0;
    this.lastDirection = 0;
  }

  // ── Mode A: 4-wire (Coil) Logic ────────────────────────────────────────────

  processCoils(aPlus: boolean, bPlus: boolean, aMinus: boolean, bMinus: boolean) {
    this.energized = aPlus || bPlus || aMinus || bMinus;
    this.coilState = [aPlus, bPlus, aMinus, bMinus];

    if (!this.energized) {
      this.lastPhase = -1;
      this.emit();
      return;
    }

    const fullIdx = FULL_STEP_SEQ.findIndex(s => s.every((v, i) => v === this.coilState[i]));
    const halfIdx = HALF_STEP_SEQ.findIndex(s => s.every((v, i) => v === this.coilState[i]));

    let seqLen: 4 | 8 | 0 = 0;
    let newPhase = -1;
    if (fullIdx !== -1) {
      seqLen = 4;
      newPhase = fullIdx;
    } else if (halfIdx !== -1) {
      seqLen = 8;
      newPhase = halfIdx;
    }

    if (newPhase === -1) { this.emit(); return; }

    // In full-step mode, ignore half-step intermediary states that appear while
    // individual GPIO pins change one-by-one. This removes direction glitches.
    if (this.steppingMode === 'full' && seqLen !== 4) {
      this.emit();
      return;
    }

    if (this.mode !== '4-wire') {
      this.mode = '4-wire';
    }

    if (this.lastPhase !== -1) {
      // Compare only within the same sequence family (4-step or 8-step).
      // Mixing sequence lengths can create false reverse pulses.
      if (this.lastPhaseSeqLen !== seqLen) {
        this.lastPhase = newPhase;
        this.lastPhaseSeqLen = seqLen;
        this.emit();
        return;
      }

      const delta = newPhase - this.lastPhase;
      let step: 1 | -1 | 0 = 0;

      // Logic: If wrap-around occurs (0->3 or 3->0), math checks for length boundary
      if (delta === 1  || delta === -(seqLen - 1)) step =  1;   // CW
      else if (delta === -1 || delta === +(seqLen - 1)) step = -1;   // CCW

      if (step !== 0) {
        // SYNC: Ensure dirHigh stays consistent with manual coil driving
        this.dirHigh = (step === 1); 
        this.applyStep(step as 1 | -1);
      }
    }

    this.lastPhase = newPhase;
    this.lastPhaseSeqLen = seqLen;
    this.emit();
  }

  // ── Mode B: STEP/DIR Logic ────────────────────────────────────────────────

  processStep(isHigh: boolean) {
    if (isHigh && !this.lastStepHigh) {
      this.mode = 'step-dir';
      this.energized = true;
      // Uses the persistent dirHigh state
      this.applyStep(this.dirHigh ? 1 : -1);
      this.emit();
    }
    this.lastStepHigh = isHigh;
  }

  // ── Core Movement Logic ────────────────────────────────────────────────────

  private applyStep(direction: 1 | -1) {
    const now = performance.now();

    // Reset buffer if we change physical direction
    if (this.lastDirection !== 0 && direction !== this.lastDirection) {
      this.stepIntervals.length = 0;
      this.lastStepTime = 0;
    }
    this.lastDirection = direction;

    if (this.lastStepTime > 0) {
      const dt = now - this.lastStepTime;
      if (dt >= StepperEmulator.MIN_INTERVAL_MS && dt <= StepperEmulator.MAX_INTERVAL_MS) {
        this.stepIntervals.push(dt);
        if (this.stepIntervals.length > StepperEmulator.SPEED_WINDOW) this.stepIntervals.shift();
        
        if (this.stepIntervals.length >= 4) {
          const sorted = [...this.stepIntervals].sort((a, b) => a - b);
          const mid = Math.floor(sorted.length / 2);
          this.currentSpeed = 1000 / sorted[mid];
        }
      }
    }
    this.lastStepTime = now;

    if (this.loadTorque > this.availableTorque()) {
      this.stalled = true;
      this.stepsLost++;
      return;
    }
    this.stalled = false;

    // CCW results in decrementing stepCount
    if (this.steppingMode === 'micro') {
      this.microSubStep += direction;
      if (this.microSubStep >= this.microstepDivisor) { this.microSubStep = 0; this.stepCount++; }
      else if (this.microSubStep < 0) { this.microSubStep = this.microstepDivisor - 1; this.stepCount--; }
    } else if (this.steppingMode === 'half') {
      this.microSubStep += direction;
      if (this.microSubStep >= 8) { this.microSubStep = 0; this.stepCount++; }
      else if (this.microSubStep < 0) { this.microSubStep = 7; this.stepCount--; }
    } else {
      this.stepCount += direction;
    }

    this.logStep(direction > 0 ? 'CW' : 'CCW');
  }

  private availableTorque(): number {
    const ratio = Math.min(1, this.currentSpeed / 1000);
    return Math.max(0, this.peakTorque * (1 - ratio));
  }

  private startRamp() {
    if (this.acceleration <= 0) { this.currentSpeed = this.targetSpeed; return; }
    if (this.rampTimer !== null) return;

    this.rampTimer = setInterval(() => {
      const diff = this.targetSpeed - this.currentSpeed;
      if (Math.abs(diff) < 0.5) {
        this.currentSpeed = this.targetSpeed;
        clearInterval(this.rampTimer!);
        this.rampTimer = null;
        return;
      }
      this.currentSpeed += Math.sign(diff) * this.acceleration * 0.02;
    }, 20);
  }

  private clampDivisor(d: number): number {
    return (VALID_DIVISORS as readonly number[]).includes(d) ? d : 16;
  }

  private logStep(dir: string) {
    if (Math.abs(this.stepCount - this.lastLoggedStep) < LOG_INTERVAL) return;
    this.lastLoggedStep = this.stepCount;
    console.log(`${TAG} [${this.nodeId}] ${dir} Step: ${this.stepCount}, Angle: ${this.getAngle().toFixed(2)}°`);
  }

  private subStepRange(): number {
    if (this.steppingMode === 'micro') return this.microstepDivisor;
    if (this.steppingMode === 'half')  return 8;
    return 1;
  }

  public getAngle(): number {
    const range = this.subStepRange();
    const totalSteps = this.stepCount + (this.microSubStep / range);
    const rawAngle = (totalSteps / this.stepsPerRev) * 360;
    return ((rawAngle % 360) + 360) % 360; // Double modulo for negative CCW angles
  }

  public getState(): StepperState {
    const range = this.subStepRange();
    return {
      stepCount:     this.stepCount,
      microPosition: range > 1 ? this.microSubStep / range : 0,
      angle:         this.getAngle(),
      currentSpeed:  this.currentSpeed,
      energized:     this.energized,
      stalled:       this.stalled,
      stepsLost:     this.stepsLost,
      coilState:     [...this.coilState],
      // If moving, show lastDirection. If stopped, show the DIR pin state.
      direction:     this.currentSpeed > 0.1 ? (this.lastDirection as 1 | -1) : (this.dirHigh ? 1 : -1),
    };
  }

  private emit() { this.onUpdate(this.getState()); }

  reset() {
    if (this.rampTimer) clearInterval(this.rampTimer);
    this.stepCount = 0;
    this.microSubStep = 0;
    this.currentSpeed = 0;
    this.lastDirection = 0;
    this.lastPhase = -1;
    this.lastPhaseSeqLen = 0;
    this.emit();
  }

  destroy() { if (this.rampTimer) clearInterval(this.rampTimer); }
}
