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
  actualAngle?: number;        // Smooth interpolated angle (0-360 degrees, physics simulation)
  actualAngleUnbounded?: number; // Unbounded smooth angle for CSS transforms
  angularVelocity?: number;    // Current rotation speed (rad/s)
}

// ── Constants ────────────────────────────────────────────────────────────────

const VALID_DIVISORS = [1, 2, 4, 8, 16, 32, 64, 128, 256] as const;

const FULL_STEP_SEQ: Array<[boolean, boolean, boolean, boolean]> = [
  [true, false, false, true],  // phase 0: A+ B-
  [true, true, false, false],  // phase 1: A+ B+
  [false, true, true, false],  // phase 2: A- B+
  [false, false, true, true],  // phase 3: A- B-
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
  private readonly stepsPerRev: number;

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
  private physicsEnabled = false;
  private actualAngle = 0;           // Current physical angle (radians)
  private targetAngle = 0;           // Target angle from step commands (radians)
  private angularVelocity = 0;       // Current rotation speed (rad/s)
  private physicsTimer: ReturnType<typeof setInterval> | null = null;
  private readonly PHYSICS_HZ = 60;  // Physics update rate
  private readonly INERTIA = 0.0001; // Moment of inertia (kg⋅m²) - small for responsive feel
  private readonly DAMPING = 0.002;  // Damping coefficient - controls settling time
  private readonly SPRING_K = 50;    // Spring constant - controls how strongly motor pulls to target

  constructor(
    onUpdate: (state: StepperState) => void,
    config: StepperConfig = {},
    nodeId = '',
  ) {
    this.nodeId = nodeId;
    this.stepsPerRev = config.stepsPerRev ?? 200;
    this.steppingMode = config.steppingMode ?? 'full';
    this.microstepDivisor = this.clampDivisor(config.microstepDivisor ?? 16);
    this.peakTorque = config.peakTorque ?? 40;
    this.acceleration = config.acceleration ?? 200;
    this.dirHigh = config.directionCW ?? true;
    this.onUpdate = onUpdate;

    console.log(`${TAG} [${nodeId}] Created. Initial Dir: ${this.dirHigh ? 'CW' : 'CCW'}`);

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

    // Always match against HALF_STEP_SEQ to provide a unified 8-position state machine
    // This perfectly handles rapid sequential pin changes typical in Arduino Stepper library
    const newPhase = HALF_STEP_SEQ.findIndex(s => s.every((v, i) => v === this.coilState[i]));

    if (newPhase === -1) { 
      // Invalid or intermediate state. Keep lastPhase intact and wait for the rest of the pins to update.
      this.emit(); 
      return; 
    }

    if (this.mode !== '4-wire') {
      this.mode = '4-wire';
    }

    if (this.lastPhase !== -1 && newPhase !== this.lastPhase) {
      let delta = newPhase - this.lastPhase;

      // Normalize delta for 8-step circular buffer (shortest path)
      if (delta > 4) delta -= 8;
      if (delta < -4) delta += 8;

      // Determine physical direction (CW if delta < 0, CCW if delta > 0)
      const dir = delta < 0 ? 1 : -1;
      const stepsToApply = Math.abs(delta);

      this.dirHigh = (dir === 1);
      
      // Temporarily set steppingMode to 'half' to perfectly process the phase delta
      const originalMode = this.steppingMode;
      this.steppingMode = 'half';
      for (let i = 0; i < stepsToApply; i++) {
        this.applyStep(dir);
      }
      this.steppingMode = originalMode;
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

    // CCW results in decrementing stepCount
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

    // Update target angle for physics simulation
    if (this.physicsEnabled) {
      const range = this.subStepRange();
      const totalSteps = this.stepCount + (this.microSubStep / range);
      this.targetAngle = (totalSteps / this.stepsPerRev) * 2 * Math.PI; // radians
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
      if (Math.abs(this.angularVelocity) > 0.001) {
        this.angularVelocity *= 0.95; // Exponential decay
        this.actualAngle += this.angularVelocity * dt;
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
    const maxVelocity = 100; // rad/s (~955 RPM)
    this.angularVelocity = Math.max(-maxVelocity, Math.min(maxVelocity, this.angularVelocity));

    // Update angle: θ = θ + ω⋅dt
    this.actualAngle += this.angularVelocity * dt;

    // Check for stall condition
    if (Math.abs(error) > 0.5 && Math.abs(this.angularVelocity) < 0.01) {
      // Motor is stuck (large error but no movement)
      this.stalled = true;
    } else {
      this.stalled = false;
    }

    // Emit state update for visual rendering
    this.emit();
  }

  /**
   * Get the smooth interpolated angle for realistic animation.
   * Returns angle in degrees (0-360).
   */
  public getSmoothAngle(): number {
    if (!this.physicsEnabled) {
      return this.getAngle();
    }

    // Convert from radians to degrees
    const degrees = (this.actualAngle * 180 / Math.PI) % 360;
    return ((degrees % 360) + 360) % 360; // Normalize to 0-360
  }

  /**
   * Get the unbounded smooth angle for CSS transforms.
   * This maintains cumulative rotation across multiple revolutions.
   */
  public getSmoothAngleUnbounded(): number {
    if (!this.physicsEnabled) {
      const range = this.subStepRange();
      const totalSteps = this.stepCount + (this.microSubStep / range);
      return (totalSteps / this.stepsPerRev) * 360;
    }

    // Convert from radians to degrees (unbounded)
    return this.actualAngle * 180 / Math.PI;
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
      stepCount: this.stepCount,
      microPosition: range > 1 ? this.microSubStep / range : 0,
      angle: this.getAngle(),
      currentSpeed: this.currentSpeed,
      energized: this.energized,
      stalled: this.stalled,
      stepsLost: this.stepsLost,
      coilState: [...this.coilState],
      // If moving, show lastDirection. If stopped, show the DIR pin state.
      direction: this.currentSpeed > 0.1 ? (this.lastDirection as 1 | -1) : (this.dirHigh ? 1 : -1),
      // Physics simulation data
      actualAngle: this.getSmoothAngle(),
      actualAngleUnbounded: this.getSmoothAngleUnbounded(),
      angularVelocity: this.physicsEnabled ? this.angularVelocity : undefined,
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
    this.emit();
    // Restart physics loop
    this.startPhysicsLoop();
  }

  destroy() {
    if (this.rampTimer) clearInterval(this.rampTimer);
    if (this.physicsTimer) clearInterval(this.physicsTimer);
  }
}