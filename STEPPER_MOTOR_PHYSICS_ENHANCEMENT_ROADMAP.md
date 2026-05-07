# Stepper Motor Physics Enhancement Roadmap

## Current Implementation Analysis

### ✅ What's Already Implemented (Good Foundation)

**1. Basic Stepping Logic** ✅
- Full-step sequences (4-phase)
- Half-step sequences (8-phase)
- Microstepping support (1/2, 1/4, 1/8, 1/16, etc.)
- Step counting and angle calculation

**2. Speed Calculation** ✅
- Real-time speed measurement from step intervals
- Median filtering for noise reduction
- Speed window buffering

**3. Torque & Load** ✅
- Peak torque configuration
- Load torque setting
- Speed-torque curve (simplified)
- Stall detection
- Missed step tracking

**4. Acceleration** ✅
- Configurable acceleration
- Speed ramping
- Target speed tracking

**5. Dual Mode Support** ✅
- 4-wire coil control (direct)
- STEP/DIR control (driver mode)
- Automatic mode detection

### ❌ What's Missing (Enhancement Opportunities)

Based on the comprehensive guide provided, here's what's missing:

## Phase 1: Electrical Layer Enhancements

### 1.1 RL Circuit Simulation (HIGH PRIORITY)

**Current State**: Instant current changes
**Target**: Realistic coil inductance simulation

**Mathematical Model**:
```
V = L(dI/dt) + IR

Where:
- V = applied voltage
- L = coil inductance (typically 1-10 mH)
- I = coil current
- R = coil resistance (typically 1-10 Ω)
- dI/dt = rate of current change
```

**Implementation**:
```typescript
interface CoilPhysics {
  resistance: number;      // Ohms
  inductance: number;      // Henries
  current: number;         // Amperes
  voltage: number;         // Volts
  targetCurrent: number;   // Amperes
}

class CoilEmulator {
  private physics: CoilPhysics;
  
  // Discrete-time RL circuit solver
  updateCurrent(dt: number, targetVoltage: number) {
    // Time constant: τ = L/R
    const tau = this.physics.inductance / this.physics.resistance;
    
    // Target current: I = V/R
    this.physics.targetCurrent = targetVoltage / this.physics.resistance;
    
    // Exponential approach: I(t) = I_target * (1 - e^(-t/τ))
    const alpha = 1 - Math.exp(-dt / tau);
    this.physics.current += (this.physics.targetCurrent - this.physics.current) * alpha;
  }
}
```

**Benefits**:
- ✅ Realistic current rise/fall times
- ✅ Proper microstepping behavior
- ✅ Back-EMF effects
- ✅ Accurate torque generation

### 1.2 Magnetic Vector Model (CRITICAL FOR MICROSTEPPING)

**Current State**: Boolean coil states
**Target**: Continuous current values with vector math

**Mathematical Model**:
```
θ_target = atan2(I_B, I_A)

Where:
- I_A = current in coil A
- I_B = current in coil B
- θ_target = rotor target angle
```

**Implementation**:
```typescript
interface MagneticVector {
  angle: number;      // radians
  magnitude: number;  // normalized 0-1
}

calculateMagneticVector(coilA: CoilEmulator, coilB: CoilEmulator): MagneticVector {
  // Get current values (can be negative for reverse polarity)
  const I_A = coilA.getCurrentSigned();
  const I_B = coilB.getCurrentSigned();
  
  // Calculate magnetic field angle
  const angle = Math.atan2(I_B, I_A);
  
  // Calculate magnitude
  const magnitude = Math.sqrt(I_A * I_A + I_B * I_B);
  
  return { angle, magnitude };
}
```

**Benefits**:
- ✅ True microstepping (smooth sine/cosine currents)
- ✅ Accurate rotor positioning
- ✅ Realistic torque calculation

### 1.3 PWM Current Control (DRIVER SIMULATION)

**Current State**: Direct coil control
**Target**: Simulate A4988/DRV8825 chopper behavior

**Implementation**:
```typescript
interface DriverConfig {
  vRef: number;           // Reference voltage (sets current limit)
  choppingFrequency: number; // Typically 20-40 kHz
  decayMode: 'fast' | 'slow' | 'mixed';
}

class ChopperDriver {
  private config: DriverConfig;
  
  // Simulate PWM current regulation
  regulateCurrent(coil: CoilEmulator, targetCurrent: number, dt: number) {
    const actualCurrent = coil.getCurrent();
    const error = targetCurrent - actualCurrent;
    
    // Chopper logic
    if (actualCurrent > targetCurrent * 1.1) {
      // Current too high - fast decay
      coil.applyVoltage(0, dt);
    } else if (actualCurrent < targetCurrent * 0.9) {
      // Current too low - drive high
      coil.applyVoltage(this.config.vRef, dt);
    } else {
      // In regulation - slow decay
      coil.applyVoltage(this.config.vRef * 0.5, dt);
    }
  }
}
```

## Phase 2: Mechanical Layer Enhancements

### 2.1 Rotational Dynamics (HIGH PRIORITY)

**Current State**: Instant position changes
**Target**: Realistic inertia and damping

**Mathematical Model**:
```
T = Jα + Bω

Where:
- T = net torque (N⋅m)
- J = moment of inertia (kg⋅m²)
- α = angular acceleration (rad/s²)
- B = damping coefficient (N⋅m⋅s)
- ω = angular velocity (rad/s)
```

**Implementation**:
```typescript
interface RotorDynamics {
  angle: number;          // radians
  velocity: number;       // rad/s
  acceleration: number;   // rad/s²
  inertia: number;        // kg⋅m² (typically 0.00001 - 0.001)
  damping: number;        // N⋅m⋅s (typically 0.0001 - 0.01)
}

class RotorPhysics {
  private dynamics: RotorDynamics;
  
  update(magneticTorque: number, loadTorque: number, dt: number) {
    // Net torque
    const netTorque = magneticTorque - loadTorque - this.dynamics.damping * this.dynamics.velocity;
    
    // Angular acceleration: α = T/J
    this.dynamics.acceleration = netTorque / this.dynamics.inertia;
    
    // Update velocity: ω = ω + α⋅dt
    this.dynamics.velocity += this.dynamics.acceleration * dt;
    
    // Update angle: θ = θ + ω⋅dt
    this.dynamics.angle += this.dynamics.velocity * dt;
  }
}
```

**Benefits**:
- ✅ Realistic acceleration/deceleration
- ✅ Overshoot and settling behavior
- ✅ Load response
- ✅ Resonance effects

### 2.2 Torque Generation Model

**Current State**: Simplified speed-torque curve
**Target**: Physics-based torque calculation

**Mathematical Model**:
```
T = K_t ⋅ I ⋅ sin(Δθ)

Where:
- K_t = torque constant (N⋅m/A)
- I = coil current (A)
- Δθ = alignment error (radians)
```

**Implementation**:
```typescript
calculateTorque(
  magneticVector: MagneticVector,
  rotorAngle: number,
  torqueConstant: number
): number {
  // Alignment error
  const deltaTheta = magneticVector.angle - rotorAngle;
  
  // Torque proportional to current and sine of error
  const torque = torqueConstant * magneticVector.magnitude * Math.sin(deltaTheta);
  
  return torque;
}
```

### 2.3 Detent Torque

**Current State**: Not implemented
**Target**: Simulate permanent magnet cogging

**Implementation**:
```typescript
calculateDetentTorque(rotorAngle: number, stepsPerRev: number): number {
  // Detent torque creates "notches" at step positions
  const detentStrength = 0.05; // 5% of holding torque
  const anglePerStep = (2 * Math.PI) / stepsPerRev;
  
  // Sine wave with period = step angle
  const detentTorque = detentStrength * Math.sin(rotorAngle / anglePerStep * 2 * Math.PI);
  
  return detentTorque;
}
```

## Phase 3: Advanced Features

### 3.1 Resonance Simulation

**Problem**: Steppers vibrate at certain frequencies
**Solution**: Add resonance frequency modeling

```typescript
interface ResonanceModel {
  naturalFrequency: number;  // Hz (typically 100-200 Hz)
  dampingRatio: number;      // 0-1 (typically 0.1-0.3)
}

calculateResonanceEffect(speed: number, resonance: ResonanceModel): number {
  const frequency = speed / (2 * Math.PI);
  const ratio = frequency / resonance.naturalFrequency;
  
  // Resonance amplification factor
  const amplification = 1 / Math.sqrt(
    Math.pow(1 - ratio * ratio, 2) + 
    Math.pow(2 * resonance.dampingRatio * ratio, 2)
  );
  
  return amplification;
}
```

### 3.2 Back-EMF

**Current State**: Not implemented
**Target**: Voltage generated by rotation

```typescript
calculateBackEMF(velocity: number, motorConstant: number): number {
  // Back-EMF opposes applied voltage
  // E = K_e ⋅ ω
  return motorConstant * velocity;
}
```

### 3.3 Thermal Model

**Current State**: Not implemented
**Target**: Winding temperature simulation

```typescript
interface ThermalModel {
  temperature: number;      // °C
  ambientTemp: number;      // °C
  thermalResistance: number; // °C/W
  thermalCapacitance: number; // J/°C
}

updateTemperature(power: number, dt: number, thermal: ThermalModel) {
  // Power dissipation: P = I²R
  const heatGenerated = power * dt;
  
  // Temperature rise
  const deltaT = heatGenerated / thermal.thermalCapacitance;
  
  // Cooling to ambient
  const cooling = (thermal.temperature - thermal.ambientTemp) / thermal.thermalResistance * dt;
  
  thermal.temperature += deltaT - cooling;
}
```

## Implementation Priority

### 🔴 Phase 1 (Critical - Do First)
1. **RL Circuit Simulation** - Enables realistic current behavior
2. **Magnetic Vector Model** - Enables true microstepping
3. **Rotational Dynamics** - Enables realistic motion

### 🟡 Phase 2 (Important - Do Second)
4. **Torque Generation Model** - Improves accuracy
5. **PWM Current Control** - Realistic driver behavior
6. **Detent Torque** - Adds realism

### 🟢 Phase 3 (Nice to Have - Do Later)
7. **Resonance Simulation** - Advanced feature
8. **Back-EMF** - Advanced feature
9. **Thermal Model** - Advanced feature

## Recommended Architecture

```typescript
class RealisticStepperEmulator {
  // Electrical layer
  private coilA: CoilEmulator;
  private coilB: CoilEmulator;
  private driver: ChopperDriver;
  
  // Mechanical layer
  private rotor: RotorPhysics;
  private torqueModel: TorqueCalculator;
  
  // Configuration
  private config: StepperConfig;
  
  // Main update loop (called every simulation tick)
  update(dt: number) {
    // 1. Update coil currents (RL circuit)
    this.coilA.updateCurrent(dt, this.driver.getVoltageA());
    this.coilB.updateCurrent(dt, this.driver.getVoltageB());
    
    // 2. Calculate magnetic vector
    const magneticVector = this.calculateMagneticVector();
    
    // 3. Calculate torque
    const magneticTorque = this.torqueModel.calculate(
      magneticVector,
      this.rotor.angle
    );
    
    // 4. Update rotor dynamics
    this.rotor.update(magneticTorque, this.loadTorque, dt);
    
    // 5. Calculate back-EMF
    const backEMF = this.calculateBackEMF(this.rotor.velocity);
    
    // 6. Update driver (PWM regulation)
    this.driver.update(dt, backEMF);
    
    // 7. Emit state
    this.emit();
  }
}
```

## Simulation Tick Rate

**Current**: Event-driven (on step pulse)
**Recommended**: Fixed time-step physics loop

```typescript
class PhysicsEngine {
  private readonly PHYSICS_DT = 1 / 10000; // 10 kHz (0.1ms)
  private accumulator = 0;
  
  tick(realDt: number) {
    this.accumulator += realDt;
    
    // Fixed time-step updates
    while (this.accumulator >= this.PHYSICS_DT) {
      this.stepper.update(this.PHYSICS_DT);
      this.accumulator -= this.PHYSICS_DT;
    }
  }
}
```

## Performance Considerations

### Optimization Strategies

1. **Adaptive Time-Step**
   - Use smaller dt when motor is moving fast
   - Use larger dt when motor is stationary

2. **Lazy Evaluation**
   - Only run physics when motor is energized
   - Skip updates when no change detected

3. **Web Worker**
   - Run physics in separate thread
   - Avoid blocking UI

4. **WASM**
   - Compile physics engine to WebAssembly
   - 10-100x performance improvement

## Testing Strategy

### Unit Tests
```typescript
describe('CoilEmulator', () => {
  it('should simulate RL circuit rise time', () => {
    const coil = new CoilEmulator({ R: 2, L: 0.002 });
    coil.applyVoltage(12, 0.001); // 1ms
    expect(coil.current).toBeCloseTo(3.93, 2); // 63% of final
  });
});

describe('RotorPhysics', () => {
  it('should accelerate with applied torque', () => {
    const rotor = new RotorPhysics({ J: 0.0001, B: 0.001 });
    rotor.update(0.01, 0, 0.001); // 10mNm torque, 1ms
    expect(rotor.velocity).toBeGreaterThan(0);
  });
});
```

### Integration Tests
```typescript
describe('RealisticStepperEmulator', () => {
  it('should complete 200 steps in one revolution', () => {
    const stepper = new RealisticStepperEmulator();
    for (let i = 0; i < 200; i++) {
      stepper.processStep(true);
      stepper.processStep(false);
    }
    expect(stepper.getAngle()).toBeCloseTo(360, 1);
  });
  
  it('should stall under excessive load', () => {
    const stepper = new RealisticStepperEmulator();
    stepper.setLoad(100); // Excessive load
    stepper.processStep(true);
    expect(stepper.getState().stalled).toBe(true);
  });
});
```

## Documentation Requirements

### For Each Feature
1. **Mathematical model** - Equations used
2. **Physical meaning** - What it represents
3. **Parameter ranges** - Typical values
4. **Validation** - How to verify correctness

### Example
```typescript
/**
 * Coil Inductance Simulation
 * 
 * Mathematical Model:
 *   V = L(dI/dt) + IR
 * 
 * Physical Meaning:
 *   Inductance causes current to rise/fall gradually, not instantly.
 *   This creates realistic microstepping behavior and torque ripple.
 * 
 * Parameter Ranges:
 *   - Inductance (L): 1-10 mH (typical NEMA17: 2-4 mH)
 *   - Resistance (R): 1-10 Ω (typical NEMA17: 1.5-3 Ω)
 * 
 * Validation:
 *   - Rise time to 63% should be τ = L/R
 *   - Final current should be I = V/R
 */
```

## Migration Path

### Step 1: Add Physics Layer (Non-Breaking)
```typescript
// Keep existing StepperEmulator
// Add new RealisticStepperEmulator
// Allow users to choose via config flag
```

### Step 2: A/B Testing
```typescript
const config = {
  useRealisticPhysics: true, // Feature flag
};
```

### Step 3: Gradual Rollout
- Test with simple circuits first
- Validate against real hardware
- Collect performance metrics
- Adjust parameters

### Step 4: Full Migration
- Make realistic physics default
- Deprecate old emulator
- Remove legacy code

## Resources for Implementation

### Libraries
- **math.js** - Mathematical operations
- **numeric.js** - Numerical methods
- **ode.js** - ODE solvers

### References
- **"Electric Motors and Drives"** by Austin Hughes
- **"Stepper Motor System Design Handbook"** by Douglas W. Jones
- **Microchip AN907** - Stepper Motor Control
- **Texas Instruments SLVA488** - Stepper Motor Basics

### Open Source Examples
- **Wokwi** - stepper-motor.chip.c
- **Falstad** - InductorElm.java
- **LTspice** - motor models

## Success Metrics

### Quantitative
- ✅ Current rise time matches RL time constant
- ✅ Microstepping produces smooth sine/cosine currents
- ✅ Torque-speed curve matches datasheet
- ✅ Resonance frequency matches real motor
- ✅ Step response settling time realistic

### Qualitative
- ✅ Visual motion looks realistic
- ✅ Sounds realistic (if audio added)
- ✅ Behaves like real hardware
- ✅ Educational value increased

## Conclusion

The current Electra stepper motor implementation has a **solid foundation** with:
- ✅ Good stepping logic
- ✅ Speed calculation
- ✅ Basic torque model
- ✅ Microstepping support

To achieve **professional-grade realism**, implement in this order:

1. **RL Circuit Simulation** (Phase 1) - Most impactful
2. **Magnetic Vector Model** (Phase 1) - Enables true microstepping
3. **Rotational Dynamics** (Phase 1) - Realistic motion
4. **Torque Model** (Phase 2) - Improved accuracy
5. **Advanced Features** (Phase 3) - Polish

This roadmap provides a clear path from the current "good enough" implementation to a **physics-accurate professional simulator**.

---

**Estimated Implementation Time**:
- Phase 1: 2-3 weeks
- Phase 2: 1-2 weeks
- Phase 3: 2-3 weeks
- **Total**: 5-8 weeks for complete implementation

**Recommended Approach**: Implement Phase 1 first, validate thoroughly, then proceed to Phase 2 and 3 based on user feedback and requirements.
