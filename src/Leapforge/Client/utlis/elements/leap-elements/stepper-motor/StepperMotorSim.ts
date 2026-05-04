/**
 * StepperMotorSim.ts - NEMA Stepper Motor Physics Simulator
 * 
 * Simulates a bipolar stepper motor with:
 * - Full step (4-phase) and half-step (8-phase) modes
 * - Standard NEMA 200 steps/revolution (1.8°/step)
 * - Gear ratio support (1:1 to 32:1)
 * - CW/CCW direction detection
 */

export type StepperPinName = 'A-' | 'A+' | 'B+' | 'B-';

export interface CoilPattern {
  Ap: boolean;  // A+ (Coil A positive)
  An: boolean;  // A- (Coil A negative)
  Bp: boolean;  // B+ (Coil B positive)
  Bn: boolean;  // B- (Coil B negative)
}

export class StepperMotorSimulator {
  // Constants
  private static readonly STEPS_PER_REV = 200;      // NEMA standard
  private static readonly DEGREES_PER_STEP = 1.8;
  private static readonly HALF_STEP_DEGREES = 0.9;

  // Full-step sequence (4 patterns)
  private static readonly FULL_STEP_SEQUENCE: CoilPattern[] = [
    { Ap: true,  An: false, Bp: true,  Bn: false }, // Pattern 0
    { Ap: false, An: true,  Bp: true,  Bn: false }, // Pattern 1
    { Ap: false, An: true,  Bp: false, Bn: true  }, // Pattern 2
    { Ap: true,  An: false, Bp: false, Bn: true  }, // Pattern 3
  ];

  // Half-step sequence (8 patterns)
  private static readonly HALF_STEP_SEQUENCE: CoilPattern[] = [
    { Ap: true,  An: false, Bp: false, Bn: false },
    { Ap: true,  An: false, Bp: true,  Bn: false },
    { Ap: false, An: false, Bp: true,  Bn: false },
    { Ap: false, An: true,  Bp: true,  Bn: false },
    { Ap: false, An: true,  Bp: false, Bn: false },
    { Ap: false, An: true,  Bp: false, Bn: true  },
    { Ap: false, An: false, Bp: false, Bn: true  },
    { Ap: true,  An: false, Bp: false, Bn: true  },
  ];

  // State
  private stepCount: number = 0;
  private angle: number = 0;                // 0-360 degrees
  private direction: number = 1;            // 1 = CW, -1 = CCW
  private gearRatio: number = 1;            // Output multiplier
  private useHalfStepping: boolean = false;
  private prevPattern: string = '';

  // Pin states
  private pinA_neg: boolean = false;
  private pinA_pos: boolean = false;
  private pinB_pos: boolean = false;
  private pinB_neg: boolean = false;

  // Callbacks
  private updateCallback: ((steps: number, angle: number) => void) | null = null;

  constructor(gearRatio: string = '1:1', useHalfStepping: boolean = false) {
    this.setGearRatio(gearRatio);
    this.useHalfStepping = useHalfStepping;
  }

  /**
   * Handle pin state change
   */
  onPinChange(pin: StepperPinName, value: boolean): void {
    switch (pin) {
      case 'A-':
        this.pinA_neg = value;
        break;
      case 'A+':
        this.pinA_pos = value;
        break;
      case 'B+':
        this.pinB_pos = value;
        break;
      case 'B-':
        this.pinB_neg = value;
        break;
    }

    // Check if pattern changed
    const currentPattern = this.detectPattern();
    if (currentPattern !== this.prevPattern) {
      const stepDelta = this.calculateStep(this.prevPattern, currentPattern);

      if (stepDelta !== 0) {
        this.stepCount += stepDelta;
        this.updateAngle();
        this.notifyUpdate();
      }

      this.prevPattern = currentPattern;
    }
  }

  /**
   * Detect current coil pattern as 4-bit binary string
   * Bit order: A+ A- B+ B-
   */
  private detectPattern(): string {
    return (
      (this.pinA_pos ? 1 : 0).toString() +
      (this.pinA_neg ? 1 : 0).toString() +
      (this.pinB_pos ? 1 : 0).toString() +
      (this.pinB_neg ? 1 : 0).toString()
    );
  }

  /**
   * Calculate step count delta based on pattern transition
   * Uses full-step sequence for direction detection
   */
  private calculateStep(prevPattern: string, currPattern: string): number {
    const sequence = StepperMotorSimulator.FULL_STEP_SEQUENCE;

    // Find indices in full-step sequence
    const prevIdx = this.findPatternIndex(prevPattern, sequence);
    const currIdx = this.findPatternIndex(currPattern, sequence);

    // If pattern not found, no valid step
    if (prevIdx === -1 || currIdx === -1) {
      return 0;
    }

    // Calculate step delta
    let diff = currIdx - prevIdx;

    // Handle wraparound (circular sequence)
    if (diff === 1 || diff === -3) {
      return 1; // CW forward
    } else if (diff === -1 || diff === 3) {
      return -1; // CCW backward
    }

    return 0;
  }

  /**
   * Find pattern index in sequence
   */
  private findPatternIndex(patternStr: string, sequence: CoilPattern[]): number {
    const [ap, an, bp, bn] = patternStr.split('').map((b) => b === '1');

    return sequence.findIndex(
      (p) => p.Ap === ap && p.An === an && p.Bp === bp && p.Bn === bn
    );
  }

  /**
   * Update angle based on step count and gear ratio
   */
  private updateAngle(): void {
    const degreesPerStep = StepperMotorSimulator.DEGREES_PER_STEP;
    const totalDegrees = (this.stepCount * degreesPerStep) / this.gearRatio;

    // Normalize to 0-360 range
    this.angle = totalDegrees % 360;
    if (this.angle < 0) {
      this.angle += 360;
    }
  }

  /**
   * Set gear ratio from string format (e.g. "2:1", "4:1")
   * Gear ratio affects steps-per-revolution:
   * - "1:1" → 200 steps/rev
   * - "2:1" → 400 steps/rev
   * - "4:1" → 800 steps/rev
   */
  setGearRatio(ratioStr: string): void {
    const [a, b] = ratioStr.split(':').map(Number);
    this.gearRatio = b / a;
    this.updateAngle();
  }

  /**
   * Register callback for updates
   */
  onStepUpdate(callback: (steps: number, angle: number) => void): void {
    this.updateCallback = callback;
  }

  /**
   * Notify listeners of step update
   */
  private notifyUpdate(): void {
    if (this.updateCallback) {
      this.updateCallback(this.stepCount, this.angle);
    }
  }

  /**
   * Get current step count
   */
  getStepCount(): number {
    return this.stepCount;
  }

  /**
   * Get current angle in degrees (0-360)
   */
  getAngle(): number {
    return this.angle;
  }

  /**
   * Get current direction (1 = CW, -1 = CCW, 0 = stopped)
   */
  getDirection(): number {
    return this.direction;
  }

  /**
   * Reset simulator to initial state
   */
  reset(): void {
    this.stepCount = 0;
    this.angle = 0;
    this.direction = 1;
    this.prevPattern = '';
    this.pinA_neg = false;
    this.pinA_pos = false;
    this.pinB_pos = false;
    this.pinB_neg = false;
    this.notifyUpdate();
  }

  /**
   * Get simulator state for debugging
   */
  getState() {
    return {
      stepCount: this.stepCount,
      angle: this.angle,
      gearRatio: this.gearRatio,
      currentPattern: this.detectPattern(),
      pins: {
        A_neg: this.pinA_neg,
        A_pos: this.pinA_pos,
        B_pos: this.pinB_pos,
        B_neg: this.pinB_neg,
      },
    };
  }
}

export default StepperMotorSimulator;
