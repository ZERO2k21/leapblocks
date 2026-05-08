/**
 * Stepper emulator for two 4-wire models:
 * - 28BYJ-48 (ULN2003): 8-phase half-step sequence, 4096 steps/rev
 * - Bipolar NEMA: 4-phase full-step sequence, 200 steps/rev
 * Angle is derived from cumulative steps using:
 * angle = ((stepCount % stepsPerRevolution) / stepsPerRevolution) * 360, wrapped to [0, 360).
 * Unbounded tracking is also provided as:
 * totalDegrees = (stepCount / stepsPerRevolution) * 360.
 * Stall is flagged after 5 consecutive invalid phase transitions.
 */

export type StepperModel = '28byj48' | 'bipolar_nema';

export interface StepperState {
  angle: number;
  totalDegrees: number;
  stepCount: number;
  rpm: number;
  direction: 'CW' | 'CCW' | 'STOP';
  phase: number;
  coilState: number[];
  stalled: boolean;
  model: StepperModel;
  stepsPerRevolution: number;
}

type CoilState = [number, number, number, number];

const SEQ_28BYJ48: CoilState[] = [
  [1, 0, 0, 0],
  [1, 1, 0, 0],
  [0, 1, 0, 0],
  [0, 1, 1, 0],
  [0, 0, 1, 0],
  [0, 0, 1, 1],
  [0, 0, 0, 1],
  [1, 0, 0, 1],
];

const SEQ_BIPOLAR_NEMA: CoilState[] = [
  [1, 0, 1, 0],
  [0, 1, 1, 0],
  [0, 1, 0, 1],
  [1, 0, 0, 1],
];

const IDLE_TIMEOUT_MS = 150;
const RPM_WINDOW_SIZE = 20;

export class StepperEmulator {
  private readonly model: StepperModel;
  private readonly sequence: CoilState[];
  private readonly stepsPerRevolution: number;

  private pinState: CoilState = [0, 0, 0, 0];
  private currentPhase = -1;
  private stepCount = 0;
  private angle = 0;
  private totalDegrees = 0;
  private rpm = 0;
  private direction: 'CW' | 'CCW' | 'STOP' = 'STOP';
  private readonly stepHistory: number[] = [];
  private lastStepTime = 0;
  private invalidTransitionCount = 0;
  private readonly STALL_THRESHOLD = 5;
  private stalled = false;
  private stallWarned = false;

  constructor(model: StepperModel) {
    this.model = model;
    this.sequence = model === '28byj48' ? SEQ_28BYJ48 : SEQ_BIPOLAR_NEMA;
    this.stepsPerRevolution = model === '28byj48' ? 4096 : 200;
  }

  onPinChange(in1: boolean, in2: boolean, in3: boolean, in4: boolean): void {
    const newState: CoilState = [Number(in1), Number(in2), Number(in3), Number(in4)];
    if (
      newState[0] === this.pinState[0] &&
      newState[1] === this.pinState[1] &&
      newState[2] === this.pinState[2] &&
      newState[3] === this.pinState[3]
    ) {
      return;
    }

    this.pinState = newState;
    const matchedPhase = this.findPhase(newState);
    if (matchedPhase === -1) {
      this.direction = 'STOP';
      return;
    }

    if (this.currentPhase === -1) {
      this.currentPhase = matchedPhase;
      this.direction = 'STOP';
      return;
    }

    const seqLen = this.sequence.length;
    const delta = (matchedPhase - this.currentPhase + seqLen) % seqLen;
    if (delta !== 1 && delta !== seqLen - 1) {
      this.invalidTransitionCount += 1;
      if (this.invalidTransitionCount >= this.STALL_THRESHOLD) {
        this.stalled = true;
        if (!this.stallWarned) {
          console.warn('[STEPPER] Motor stalled — check coil wiring order');
          this.stallWarned = true;
        }
      }
      return;
    }

    this.invalidTransitionCount = 0;
    this.stalled = false;
    this.stallWarned = false;

    if (delta === 1) {
      this.stepCount += 1;
      this.direction = 'CW';
    } else {
      this.stepCount -= 1;
      this.direction = 'CCW';
    }

    this.currentPhase = matchedPhase;
    this.updateAngle();

    const now = performance.now();
    this.stepHistory.push(now);
    if (this.stepHistory.length > RPM_WINDOW_SIZE) this.stepHistory.shift();
    this.recalculateRpm();
    this.lastStepTime = now;
  }

  checkIdle(): void {
    if (this.lastStepTime <= 0) return;
    if (performance.now() - this.lastStepTime > IDLE_TIMEOUT_MS) {
      this.direction = 'STOP';
      this.rpm = 0;
    }
  }

  getState(): StepperState {
    return {
      angle: this.angle,
      totalDegrees: this.totalDegrees,
      stepCount: this.stepCount,
      rpm: this.rpm,
      direction: this.direction,
      phase: this.currentPhase,
      coilState: [...this.pinState],
      stalled: this.stalled,
      model: this.model,
      stepsPerRevolution: this.stepsPerRevolution,
    };
  }

  resetState(): void {
    this.stepCount = 0;
    this.angle = 0;
    this.totalDegrees = 0;
    this.rpm = 0;
    this.direction = 'STOP';
    this.currentPhase = -1;
    this.stepHistory.length = 0;
    this.invalidTransitionCount = 0;
    this.stalled = false;
    this.stallWarned = false;
    this.lastStepTime = 0;
    this.pinState = [0, 0, 0, 0];
  }

  private findPhase(state: CoilState): number {
    for (let i = 0; i < this.sequence.length; i++) {
      const p = this.sequence[i];
      if (p[0] === state[0] && p[1] === state[1] && p[2] === state[2] && p[3] === state[3]) {
        return i;
      }
    }
    return -1;
  }

  private updateAngle(): void {
    let angle = ((this.stepCount % this.stepsPerRevolution) / this.stepsPerRevolution) * 360;
    if (angle < 0) angle += 360;
    this.angle = angle;
    this.totalDegrees = (this.stepCount / this.stepsPerRevolution) * 360;
  }

  private recalculateRpm(): void {
    const windowSize = this.stepHistory.length;
    if (windowSize < 2) {
      this.rpm = 0;
      return;
    }

    const elapsedMs = this.stepHistory[windowSize - 1] - this.stepHistory[0];
    if (elapsedMs <= 0) {
      this.rpm = 0;
      return;
    }

    const rawRpm = ((windowSize - 1) / elapsedMs) * 60000 / this.stepsPerRevolution;
    this.rpm = Math.round(rawRpm * 10) / 10;
  }
}
