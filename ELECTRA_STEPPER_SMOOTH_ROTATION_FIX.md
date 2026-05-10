# Electra Module - Stepper Motor Smooth Rotation Fix

## Problem (Tamil Request)
"elecrtra la stepper motor compouent 0 to 359 degree clockwise um anticlockwise la 359 to 0 vara poittu varanum athu shaft vainthu fixed axis la roates aaganum"

**Translation:** In Electra, the stepper motor component should rotate smoothly from 0 to 359 degrees clockwise and 359 to 0 degrees anticlockwise. The shaft should rotate around a fixed axis.

**Issue:** The stepper motor was jumping instantly between angles instead of rotating smoothly with realistic physics simulation.

## Root Cause
1. **Physics Simulation Disabled**: `physicsEnabled = false` in `StepperEmulator.ts`
2. **Wrong Angle Used**: CircuitEngine was using `angle` (0-360° modulo) instead of `actualAngleUnbounded` (cumulative angle)
3. **No Smooth Interpolation**: Visual component received discrete step angles, not smooth interpolated angles

## Solution

### 1. Enable Physics Simulation
**File:** `src/Electra/Client/Src/engine/Arduino/StepperEmulator.ts`

Changed:
```typescript
private physicsEnabled = false;  // ❌ OLD
```

To:
```typescript
private physicsEnabled = true;  // ✅ NEW - Enable physics for smooth realistic motion
```

### 2. Use Unbounded Angle for Smooth Rotation
**File:** `src/Electra/Client/Src/engine/Arduino/CircuitEngine.ts`

#### For Direct 4-Wire Stepper Motor (lines ~1595-1620)
Changed callback to use `actualAngleUnbounded`:
```typescript
this.stepperEmulators.set(peripheralId, new StepperEmulator((state) => {
  pendingUpdate = { 
    angle: state.angle,  // Display angle (0-360°)
    stepCount: state.stepCount, 
    energized: state.energized,
    actualAngleUnbounded: state.actualAngleUnbounded  // ✅ Cumulative angle for rotation
  };
  // ...
  updateNodeData(peripheralId, {
    angle: unbounded ?? a,  // ✅ Use unbounded angle for smooth rotation
    value: `${a.toFixed(1)}°`,
    units: `${s > 0 ? '+' : ''}${s} steps`,
  });
}, { stepsPerRev: 200 }, peripheralId));
```

#### For A4988 Driver + Stepper Motor (lines ~1780-1810)
Same fix applied for A4988-driven stepper motors:
```typescript
this.stepperEmulators.set(motorNodeId, new StepperEmulator((state) => {
  pendingUpdate = { 
    angle: state.angle, 
    stepCount: state.stepCount, 
    energized: state.energized,
    actualAngleUnbounded: state.actualAngleUnbounded  // ✅ Cumulative angle
  };
  // ...
  updateNodeData(motorNodeId, {
    angle: unbounded ?? a,  // ✅ Use unbounded angle for smooth rotation
    value: `${a.toFixed(1)}°`,
    units: `${s > 0 ? '+' : ''}${s} steps`,
    arrow: e ? '#BEF264' : '',
  });
}, { stepsPerRev: 200 }, motorNodeId));
```

## How Physics Simulation Works

### Spring-Damper Model
The stepper motor now uses a realistic physics model:

```
T = Jα + Bω
```

Where:
- **T** = Net torque (spring force - damping - load)
- **J** = Moment of inertia (0.0001 kg⋅m²)
- **α** = Angular acceleration
- **B** = Damping coefficient (0.002)
- **ω** = Angular velocity

### Physics Parameters
```typescript
PHYSICS_HZ = 60         // 60 updates per second
INERTIA = 0.0001        // Small for responsive feel
DAMPING = 0.002         // Controls settling time
SPRING_K = 50           // How strongly motor pulls to target
```

### Rotation Behavior
1. **Acceleration**: Motor accelerates smoothly toward target angle
2. **Deceleration**: Damping slows down motion as it approaches target
3. **Settling**: Spring force pulls rotor to exact target position
4. **Continuous Rotation**: Unbounded angle allows multiple revolutions without wrap-around jumps

## Visual Component Integration

### Stepper Motor Element
**File:** `src/Electra/Client/utlis/elements/leap-elements/stepper-motor-element.ts`

The visual component already had support for smooth rotation:
```typescript
<g
  id="rotator"
  style="transform: rotate(${this._cumulativeAngle}deg); 
         transform-origin: ${shaftCenterPx_X}px ${shaftCenterPx_Y}px; 
         transition: transform 100ms linear;"
>
```

The shaft rotates around its center point with CSS transitions for smooth animation.

## User Experience

### Before Fix
- ❌ Stepper motor shaft jumped instantly between angles
- ❌ No smooth rotation animation
- ❌ Unrealistic motion (no inertia, no acceleration)
- ❌ Angle wrapped around at 360° causing visual jumps

### After Fix
- ✅ Smooth rotation from 0° to 359° clockwise
- ✅ Smooth rotation from 359° to 0° anticlockwise
- ✅ Realistic acceleration and deceleration
- ✅ Shaft rotates around fixed axis (center point)
- ✅ Continuous multi-revolution rotation without jumps
- ✅ Physics-based motion with inertia and damping

## Testing

### Test Code (Arduino Uno + Stepper Motor)
```cpp
#include <Stepper.h>

const int stepsPerRevolution = 200;
Stepper myStepper(stepsPerRevolution, 8, 9, 10, 11);

void setup() {
  Serial.begin(9600);
  myStepper.setSpeed(60);  // 60 RPM
}

void loop() {
  Serial.println("Clockwise 360°");
  myStepper.step(stepsPerRevolution);  // 0° → 360°
  delay(1000);
  
  Serial.println("Anticlockwise 360°");
  myStepper.step(-stepsPerRevolution);  // 360° → 0°
  delay(1000);
}
```

### Test Code (Arduino Uno + A4988 + Stepper Motor)
```cpp
const int stepPin = 3;
const int dirPin = 2;

void setup() {
  Serial.begin(9600);
  pinMode(stepPin, OUTPUT);
  pinMode(dirPin, OUTPUT);
}

void loop() {
  // Clockwise 360°
  digitalWrite(dirPin, HIGH);
  Serial.println("Clockwise");
  for(int i = 0; i < 200; i++) {
    digitalWrite(stepPin, HIGH);
    delayMicroseconds(1000);
    digitalWrite(stepPin, LOW);
    delayMicroseconds(1000);
  }
  delay(1000);
  
  // Anticlockwise 360°
  digitalWrite(dirPin, LOW);
  Serial.println("Anticlockwise");
  for(int i = 0; i < 200; i++) {
    digitalWrite(stepPin, HIGH);
    delayMicroseconds(1000);
    digitalWrite(stepPin, LOW);
    delayMicroseconds(1000);
  }
  delay(1000);
}
```

### Expected Behavior
1. **Smooth Rotation**: Shaft rotates smoothly, not jumping
2. **Clockwise**: 0° → 90° → 180° → 270° → 360° (smooth animation)
3. **Anticlockwise**: 360° → 270° → 180° → 90° → 0° (smooth animation)
4. **Fixed Axis**: Shaft center stays in same position
5. **Realistic Motion**: Visible acceleration and deceleration
6. **Continuous**: Can rotate multiple times (720°, 1080°, etc.) without visual jumps

## Files Modified
1. `src/Electra/Client/Src/engine/Arduino/StepperEmulator.ts` - Enabled physics simulation
2. `src/Electra/Client/Src/engine/Arduino/CircuitEngine.ts` - Use unbounded angle for both 4-wire and A4988 modes

## Technical Details

### Angle Types
1. **angle** (0-360°): Display angle shown in text, modulo 360
2. **actualAngleUnbounded**: Cumulative angle for CSS rotation (can be > 360°)
3. **actualAngle**: Smooth interpolated angle (0-360°) from physics simulation

### Physics Update Loop
Runs at 60 Hz (every ~16.67ms):
1. Calculate angular error (target - actual)
2. Apply spring force (pulls toward target)
3. Apply damping force (opposes motion)
4. Calculate angular acceleration
5. Update angular velocity
6. Update actual angle
7. Emit state to visual component

### CSS Transform
```css
transform: rotate(${unboundedAngle}deg);
transform-origin: center;
transition: transform 100ms linear;
```

The unbounded angle allows CSS to animate the shortest path without wrap-around jumps.

## Status
✅ **COMPLETED** - Stepper motor now rotates smoothly with realistic physics simulation

---
**Date:** 2026-05-08  
**Module:** Electra (Arduino/ESP32 Simulator)  
**Task:** Smooth stepper motor rotation with physics simulation  
**User Request (Tamil):** "shaft vainthu fixed axis la roates aaganum"
