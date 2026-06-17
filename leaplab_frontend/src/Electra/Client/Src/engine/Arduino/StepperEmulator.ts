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
  constrainRotation?: boolean; // Enable rotation constraints (0-359°)
  visualStepsPerRev?: number;  // Target steps per revolution for UI display
}

export interface StepperState {
  stepCount: number;
  currentSteps?: number;
  currentAngle?: number;
  microPosition: number;
  angle: number;
  currentSpeed: number;
  energized: boolean;
  stalled: boolean;
  stepsLost: number;
  coilState: [boolean, boolean, boolean, boolean];
  direction: 1 | -1;
  actualAngle?: number;        // Smooth interpolated angle (0-360 degrees, physics simulation)
  actualAngleUnbounded?: number; // Unbounded smooth angle for CSS transforms
  angularVelocity?: number;    // Current rotation speed (rad/s)
  isClamped?: boolean;         // Rotation constraint limit reached
}

// ── Constants ────────────────────────────────────────────────────────────────

const VALID_DIVISORS = [1, 2, 4, 8, 16, 32, 64, 128, 256] as const;

// Matches Arduino Stepper.cpp 4-wire stepMotor() sequence exactly:
// step 0: 1010, step 1: 0110, step 2: 0101, step 3: 1001
// Order here is [A-, A+, B+, B-] == Wokwi physical pin order == [pin1, pin2, pin3, pin4]
const FULL_STEP_SEQ: Array<[boolean, boolean, boolean, boolean]> = [
  [true, false, true, false],  // 1010
  [false, true, true, false],  // 0110
  [false, true, false, true],  // 0101
  [true, false, false, true],  // 1001
];

const HALF_STEP_SEQ: Array<[boolean, boolean, boolean, boolean]> = [
  [true, false, false, false],  // phase 0
  [true, true, false, false],  // phase 1
  [false, true, false, false],  // phase 2
  [false, true, true, false],  // phase 3
  [false, false, true, false],  // phase 4
  [false, false, true, true],  // phase 5
  [false, false, false, true],  // phase 6
  [true, false, false, true],  // phase 7
];

// ── Class ────────────────────────────────────────────────────────────────────

export class StepperEmulator {
  private readonly nodeId: string;
  private stepsPerRev: number;
  private baseStepsPerRev: number;

  private steppingMode: SteppingMode;
  private microstepDivisor: number;
  private peakTorque: number;
  private acceleration: number;

  private stepCount = 0;
  private microSubStep = 0;

  private currentSpeed = 0;
  private targetSpeed = 0;
  private lastStepTime = 0;
  private lastDirection: 1 | -1 | 0 = 0;
  private readonly stepIntervals: number[] = [];
  private static readonly SPEED_WINDOW = 16;
  private static readonly MIN_INTERVAL_MS = 0.05;
  private static readonly MAX_INTERVAL_MS = 500;

  private loadTorque = 0;
  private stalled = false;
  private stepsLost = 0;

  private coilState: [boolean, boolean, boolean, boolean] = [false, false, false, false];
  private lastPhase = -1;
  private energized = false;

  private dirHigh: boolean;
  private lastStepHigh = false;

  private mode: 'unknown' | '4-wire' | 'step-dir' = 'unknown';
  private lastLoggedStep = 0;
  private readonly onUpdate: (state: StepperState) => void;
  private rampTimer: ReturnType<typeof setInterval> | null = null;

  // ── Physics Simulation Properties ──────────────────────────────────────────
  private physicsEnabled = true;
  private actualAngle = 0;           // Current physical angle (radians)
  private targetAngle = 0;           // Target angle from step commands (radians)
  private angularVelocity = 0;       // Current rotation speed (rad/s)
  private physicsTimer: ReturnType<typeof setInterval> | null = null;
  private readonly PHYSICS_HZ = 120; // Physics update rate (120 Hz for smooth motion)
  private readonly INERTIA = 0.001;    // Moment of inertia (kg⋅m²) - stable with 120Hz physics
  private readonly DAMPING = 0.07;     // Damping coefficient - ~critical damping (ζ≈1.1)
  private readonly SPRING_K = 1;       // Spring constant - gentle pull, stable at 120Hz
  private readonly MAX_VELOCITY = 150; // Max angular velocity (rad/s ~ 1432 RPM)

  // ── Rotation Constraints ───────────────────────────────────────────────────
  private readonly ANGLE_MIN = 0;    // Minimum angle in degrees (0°)
  private readonly ANGLE_MAX = 360;  // Maximum angle in degrees (360°)
  private constrainRotation = true;  // Enable rotation constraints (0-359°)
  private anglePosition = 0;         // Current angle position (0-359°)
  private isClamped = false;         // Rotation constraint limit reached
  private visualStepsPerRev = 200;   // Target steps per revolution for UI display
  private maxBackendStep = 200;      // Maximum step in the backend (e.g., 2042 for 28BYJ-48)

  constructor(
    onUpdate: (state: StepperState) => void,
    config: StepperConfig = {},
    nodeId = '',
  ) {
    this.nodeId = nodeId;
    this.stepsPerRev = config.stepsPerRev ?? 200;
    this.baseStepsPerRev = this.stepsPerRev;
    this.steppingMode = config.steppingMode ?? 'full';
    this.microstepDivisor = this.clampDivisor(config.microstepDivisor ?? 16);
    this.peakTorque = config.peakTorque ?? 40;
    this.acceleration = config.acceleration ?? 200;
    this.dirHigh = config.directionCW ?? true;
    this.constrainRotation = config.constrainRotation ?? true; // Default: constrained
    this.visualStepsPerRev = config.visualStepsPerRev ?? this.stepsPerRev;
    this.recalculateMaxBackendStep();
    this.anglePosition = 0; // Start at 0°
    this.onUpdate = onUpdate;

    console.log(`${TAG} [${nodeId}] Created. Initial Dir: ${this.dirHigh ? 'CW' : 'CCW'}, Rotation: ${this.constrainRotation ? `0-360° (${(360 / this.stepsPerRev).toFixed(2)}° per step, wraps)` : 'unbounded'}, maxBackendStep: ${this.maxBackendStep}`);

    // Start physics simulation loop for smooth motion
    this.startPhysicsLoop();
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

  setEnergized(v: boolean) {
    this.energized = v;
  }

  setConstrainRotation(constrain: boolean) {
    this.constrainRotation = constrain;
    console.log(`${TAG} [${this.nodeId}] Rotation constraints ${constrain ? 'enabled (0-359°)' : 'disabled (unbounded)'}`);
  }

  private recalculateMaxBackendStep() {
    let maxS = this.stepsPerRev;
    while (maxS > 0) {
      const vis = Math.round((maxS / this.stepsPerRev) * this.visualStepsPerRev);
      if (vis < this.visualStepsPerRev) {
        break;
      }
      maxS--;
    }
    this.maxBackendStep = maxS;
  }

  setStepsPerRev(steps: number, visualSteps?: number) {
    if (steps > 0) {
      this.stepsPerRev = steps;
      if (visualSteps !== undefined) {
        this.visualStepsPerRev = visualSteps;
      }
      this.recalculateMaxBackendStep();
      console.log(`${TAG} [${this.nodeId}] Updated stepsPerRev = ${steps} (${(360 / steps).toFixed(4)}° per step), maxBackendStep = ${this.maxBackendStep}`);
    }
  }

  getStepsPerRev(): number {
    return this.stepsPerRev;
  }

  getBaseStepsPerRev(): number {
    return this.baseStepsPerRev;
  }

  getVisualStepsPerRev(): number {
    return this.visualStepsPerRev;
  }

  setPhysicsEnabled(enabled: boolean) {
    this.physicsEnabled = enabled;
    if (enabled && !this.physicsTimer) this.startPhysicsLoop();
    console.log(`${TAG} [${this.nodeId}] Physics simulation ${enabled ? 'enabled' : 'disabled'}`);
  }

  setSpringK(k: number) {
    (this as any).SPRING_K = Math.max(1, k);
  }

  setDamping(d: number) {
    (this as any).DAMPING = Math.max(0.001, d);
  }

  setInertia(j: number) {
    (this as any).INERTIA = Math.max(0.00001, j);
  }

  toggleDirection() {
    this.dirHigh = !this.dirHigh;
    this.stepIntervals.length = 0; // Flush speed buffer on reversal
    this.lastStepTime = 0;
    this.lastDirection = 0;
  }

  // ── Mode A: 4-wire (Coil) Logic ────────────────────────────────────────────

  processCoils(aMinus: boolean, aPlus: boolean, bPlus: boolean, bMinus: boolean) {
    this.energized = aMinus || aPlus || bPlus || bMinus;
    this.coilState = [aMinus, aPlus, bPlus, bMinus];

    if (!this.energized) {
      this.lastPhase = -1;
      this.emit();
      return;
    }

    // In full-step mode (Arduino Stepper.h default), only advance on full-step phases.
    // This avoids over-counting transient/intermediate coil states while pins are updated.
    const isHalfMode = this.steppingMode === 'half';
    let phaseSeq = isHalfMode ? HALF_STEP_SEQ : FULL_STEP_SEQ;
    let newPhase = phaseSeq.findIndex(s => s.every((v, i) => v === this.coilState[i]));

    // If standard full-step matching fails, try alternative unipolar/ULN2003 sequence
    if (!isHalfMode && newPhase === -1) {
      const altSeq: Array<[boolean, boolean, boolean, boolean]> = [
        [true, true, false, false],  // 1100
        [false, true, true, false],  // 0110
        [false, false, true, true],  // 0011
        [true, false, false, true],  // 1001
      ];
      newPhase = altSeq.findIndex(s => s.every((v, i) => v === this.coilState[i]));
      if (newPhase !== -1) {
        phaseSeq = altSeq;
      }
    }

    const wrap = phaseSeq.length;

    if (newPhase === -1) {
      // Invalid or intermediate state. Keep lastPhase intact and wait for the rest of the pins to update.
      this.emit();
      return;
    }

    if (this.mode !== '4-wire') {
      this.mode = '4-wire';
    }

    if (this.lastPhase !== -1 && newPhase !== this.lastPhase) {
      let delta = (newPhase - this.lastPhase + wrap) % wrap;

      if (!isHalfMode) {
        // Full-step state ring has 4 phases.
        // If we observe a 2-phase jump, it usually means the UI/runtime missed an intermediate update.
        // Treat it as a single step in the previously observed direction instead of dropping it.
        if (delta === 2) {
          if (this.lastDirection !== 0) {
            delta = this.lastDirection > 0 ? 1 : -1;
          } else {
            delta = this.dirHigh ? 1 : -1;
          }
        } else if (delta === 3) {
          delta = -1;
        }
      } else {
        if (delta > wrap / 2) delta -= wrap;
      }

      // Standard delta-based direction mapping:
      const dir: 1 | -1 = delta > 0 ? 1 : -1;
      const stepsToApply = Math.abs(delta);
      this.dirHigh = (dir === 1);
      for (let i = 0; i < stepsToApply; i++) this.applyStep(dir);
    }

    this.lastPhase = newPhase;
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

    // Apply step with proper angle calculation based on stepsPerRev
    if (this.constrainRotation) {
      const degreesPerStep = 360 / this.stepsPerRev;
      const nextStepCount = this.stepCount + direction;
      const nextAngle = this.anglePosition + direction * degreesPerStep;

      // Clamp step count to [0, maxBackendStep] range
      // Instead of stalling (which blocks the Arduino CPU), clamp and continue.
      // The motor visually stops at the limit but the CPU can proceed.
      if (nextStepCount >= 0 && nextStepCount <= this.maxBackendStep) {
        this.stepCount = nextStepCount;
        this.anglePosition = Math.max(0, Math.min(360, nextAngle));
        this.isClamped = false;
      } else {
        // At the boundary — don't stall, just clamp.
        // This allows the Arduino step() loop to finish so the program
        // can proceed to the next instruction (e.g. step(-2048)).
        this.stepCount = Math.max(0, Math.min(this.maxBackendStep, nextStepCount));
        const limitStep = direction === 1 ? this.maxBackendStep : 0;
        this.anglePosition = (limitStep * 360) / this.stepsPerRev;
        this.isClamped = true;
        // Skip emitting/logging for clamped steps to avoid noise
        return;
      }
    } else {
      // Original unbounded behavior
      if (this.steppingMode === 'micro') {
        this.microSubStep += direction;
        if (this.microSubStep >= this.microstepDivisor) { this.microSubStep = 0; this.stepCount++; }
        else if (this.microSubStep < 0) { this.microSubStep = this.microstepDivisor - 1; this.stepCount--; }
      } else if (this.steppingMode === 'half') {
        this.microSubStep += direction;
        if (this.microSubStep >= 2) { this.microSubStep = 0; this.stepCount++; }
        else if (this.microSubStep < 0) { this.microSubStep = 1; this.stepCount--; }
      } else {
        this.stepCount += direction;
      }
    }

    // Update target angle for physics simulation
    if (this.physicsEnabled) {
      if (this.constrainRotation) {
        this.targetAngle = (this.anglePosition * Math.PI) / 180; // Convert to radians
      } else {
        const range = this.subStepRange();
        const totalSteps = this.stepCount + (this.microSubStep / range);
        this.targetAngle = (totalSteps / this.stepsPerRev) * 2 * Math.PI; // radians
      }
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
    if (this.steppingMode === 'half') return 2;
    return 1;
  }

  // ── Physics Simulation Methods ────────────────────────────────────────────

  /**
   * Start the physics simulation loop for smooth, realistic motion.
   * Uses a spring-damper model to simulate inertia and acceleration.
   */
  private startPhysicsLoop() {
    if (this.physicsTimer !== null) return;

    const dt = 1 / this.PHYSICS_HZ; // Time step in seconds

    this.physicsTimer = setInterval(() => {
      this.updatePhysics(dt);
    }, (dt * 1000) | 0); // Convert to milliseconds
  }

  /**
   * Update physics simulation using spring-damper model.
   * This creates realistic acceleration, deceleration, and settling behavior.
   * 
   * Model: T = Jα + Bω (Torque = Inertia × Acceleration + Damping × Velocity)
   * Spring force: F = -k(x - x_target) (pulls rotor toward target angle)
   */
  private updatePhysics(dt: number) {
    if (!this.physicsEnabled || !this.energized) {
      // When not energized, gradually slow down due to damping
      const dampingFactor = 1 - this.DAMPING * dt * 10;
      if (Math.abs(this.angularVelocity) > 0.001) {
        this.angularVelocity *= Math.max(0, dampingFactor);

        // Apply rotation constraints
        if (this.constrainRotation) {
          const nextAngle = this.actualAngle + this.angularVelocity * dt;
          const nextAngleDeg = (nextAngle * 180 / Math.PI);
          const minRad = this.ANGLE_MIN * Math.PI / 180;
          const maxRad = this.ANGLE_MAX * Math.PI / 180;

          if (nextAngleDeg < this.ANGLE_MIN || nextAngleDeg > this.ANGLE_MAX) {
            this.angularVelocity = 0; // Stop at boundary
            this.actualAngle = Math.max(minRad, Math.min(maxRad, this.actualAngle));
          } else {
            this.actualAngle = nextAngle;
          }
        } else {
          this.actualAngle += this.angularVelocity * dt;
        }
      }
      return;
    }

    // Calculate angular error (shortest path, handling wrap-around)
    let error = this.targetAngle - this.actualAngle;

    // Normalize error to [-π, π] for shortest rotation path
    while (error > Math.PI) error -= 2 * Math.PI;
    while (error < -Math.PI) error += 2 * Math.PI;

    // Spring-damper model for realistic motion
    // Spring force: pulls toward target (proportional to error)
    const springTorque = this.SPRING_K * error;

    // Damping force: opposes motion (proportional to velocity)
    const dampingTorque = -this.DAMPING * this.angularVelocity;

    // Load torque: external resistance
    const loadTorqueRad = (this.loadTorque / this.peakTorque) * 0.1; // Normalized

    // Net torque
    const netTorque = springTorque + dampingTorque - loadTorqueRad;

    // Angular acceleration: α = T / J
    const angularAcceleration = netTorque / this.INERTIA;

    // Update velocity: ω = ω + α⋅dt
    this.angularVelocity += angularAcceleration * dt;

    // Velocity limiting (realistic motor speed limits)
    this.angularVelocity = Math.max(-this.MAX_VELOCITY, Math.min(this.MAX_VELOCITY, this.angularVelocity));

    // Update angle: θ = θ + ω⋅dt
    const nextAngle = this.actualAngle + this.angularVelocity * dt;

    // Apply rotation constraints
    if (this.constrainRotation) {
      const minRad = this.ANGLE_MIN * Math.PI / 180;
      const maxRad = this.ANGLE_MAX * Math.PI / 180;

      // Clamp at boundaries without stalling — the motor stops visually
      // but remains ready to reverse direction immediately.
      if (nextAngle > maxRad) {
        this.actualAngle = maxRad;
        this.angularVelocity = 0;
      } else if (nextAngle < minRad) {
        this.actualAngle = minRad;
        this.angularVelocity = 0;
      } else {
        this.actualAngle = nextAngle;
      }
      this.stalled = false;
    } else {
      this.actualAngle = nextAngle;

      // Check for stall condition
      if (Math.abs(error) > 0.5 && Math.abs(this.angularVelocity) < 0.01) {
        // Motor is stuck (large error but no movement)
        this.stalled = true;
      } else {
        this.stalled = false;
      }
    }

    // Emit state update for visual rendering
    this.emit();
  }

  /**
   * Get the smooth interpolated angle for realistic animation.
   * Returns angle in degrees (0-360). With physics enabled, this
   * returns the smooth spring-damper interpolated position.
   */
  public getSmoothAngle(): number {
    if (this.physicsEnabled) {
      const degrees = (this.actualAngle * 180 / Math.PI) % 360;
      return ((degrees % 360) + 360) % 360;
    }
    return this.getAngle();
  }

  /**
   * Get the unbounded smooth angle for CSS transforms.
   * This maintains cumulative rotation across multiple revolutions.
   */
  public getSmoothAngleUnbounded(): number {
    if (this.physicsEnabled) {
      return this.actualAngle * 180 / Math.PI;
    }
    const range = this.subStepRange();
    const totalSteps = this.stepCount + (this.microSubStep / range);
    return (totalSteps / this.stepsPerRev) * 360;
  }

  public getAngle(): number {
    if (this.constrainRotation) {
      return this.anglePosition;
    }
    const range = this.subStepRange();
    const totalSteps = this.stepCount + (this.microSubStep / range);
    return (totalSteps / this.stepsPerRev) * 360;
  }

  public getState(): StepperState {
    const range = this.subStepRange();
    const moving = this.currentSpeed > 0.1 || Math.abs(this.angularVelocity) > 0.05;
    const currentSteps = this.stepCount;
    let currentAngle = (currentSteps % this.stepsPerRev) * 360.0 / this.stepsPerRev;
    if (currentAngle < 0) {
      currentAngle += 360.0;
    }
    return {
      stepCount: this.stepCount,
      currentSteps,
      currentAngle,
      microPosition: range > 1 ? this.microSubStep / range : 0,
      angle: this.getAngle(),
      currentSpeed: this.currentSpeed,
      energized: this.energized,
      stalled: this.stalled,
      stepsLost: this.stepsLost,
      coilState: [...this.coilState],
      direction: moving ? (this.lastDirection as 1 | -1) : (this.dirHigh ? 1 : -1),
      actualAngle: this.getSmoothAngle(),
      actualAngleUnbounded: this.getSmoothAngleUnbounded(),
      angularVelocity: this.physicsEnabled ? this.angularVelocity : undefined,
      isClamped: this.isClamped,
    };
  }

  private emit() { this.onUpdate(this.getState()); }

  reset() {
    if (this.rampTimer) clearInterval(this.rampTimer);
    if (this.physicsTimer) clearInterval(this.physicsTimer);
    this.stepCount = 0;
    this.microSubStep = 0;
    this.currentSpeed = 0;
    this.lastDirection = 0;
    this.lastPhase = -1;
    this.actualAngle = 0;
    this.targetAngle = 0;
    this.angularVelocity = 0;
    this.anglePosition = 0; // Reset to 0°
    this.isClamped = false;
    this.emit();
    // Restart physics loop
    this.startPhysicsLoop();
  }

  destroy() {
    if (this.rampTimer) clearInterval(this.rampTimer);
    if (this.physicsTimer) clearInterval(this.physicsTimer);
  }
}
