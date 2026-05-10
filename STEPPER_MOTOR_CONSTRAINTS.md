# Stepper Motor Rotation Constraints

## Overview
The stepper motor component now supports rotation with 1° step increments and automatic wrapping. The shaft is fixed on the axis and rotates according to the following rules:

## Rotation Behavior

### Clockwise Rotation (CW)
- **Range**: 0° to 359° (wraps to 0°)
- **Direction**: Positive rotation (increasing angle)
- **Step Size**: Exactly 1° per step
- **Wrapping**: 359° + 1° = 0° (seamless wrap-around)
- **Example**: 0° → 90° → 180° → 270° → 359° → 0° → 1° ...

### Anticlockwise Rotation (CCW)
- **Range**: 359° to 0° (wraps to 359°)
- **Direction**: Negative rotation (decreasing angle)
- **Step Size**: Exactly 1° per step
- **Wrapping**: 0° - 1° = 359° (seamless wrap-around)
- **Example**: 359° → 270° → 180° → 90° → 0° → 359° → 358° ...

## Implementation Details

### Key Features
1. **Exact 1° Steps**: Each step moves exactly 1 degree (not dependent on stepsPerRev)
2. **Seamless Wrapping**: Automatic wrap-around at 0°/359° boundary
3. **Integer Angles**: Always returns exact integer angles (0, 1, 2, ..., 359)
4. **No Boundaries**: Motor never stalls - continuous rotation with wrapping
5. **Configurable**: Can be disabled to allow unbounded rotation if needed

### Configuration

The rotation constraint can be configured when creating a stepper motor:

```typescript
// Default: constrained rotation (0-359°)
const stepper = new StepperEmulator(onUpdate, {
  stepsPerRev: 200,
  constrainRotation: true  // Default
}, nodeId);

// Unbounded rotation (legacy behavior)
const stepper = new StepperEmulator(onUpdate, {
  stepsPerRev: 200,
  constrainRotation: false
}, nodeId);
```

### Runtime Control

You can also enable/disable constraints at runtime:

```typescript
// Enable constraints
stepper.setConstrainRotation(true);

// Disable constraints
stepper.setConstrainRotation(false);
```

## Technical Implementation

### Angle Calculation
- **Step-based**: Each step = exactly 1°
- **Wrapping**: Automatic wrap at 0°/359° boundary
- **Integer precision**: Always returns exact integer angles

### Wrapping Behavior
1. **Clockwise**: When angle > 359°, wraps to 0°
2. **Anticlockwise**: When angle < 0°, wraps to 359°
3. **Seamless**: No stalling or boundaries - continuous rotation

### State Reporting
The stepper state includes:
- `angle`: Current angle (0-359°, exact integer)
- `actualAngle`: Same as angle in constrained mode
- `actualAngleUnbounded`: Same as angle in constrained mode (no unbounded rotation)
- `stalled`: False (no boundaries to hit)

## Usage Example

```typescript
// Arduino code example
#include <Stepper.h>

const int stepsPerRevolution = 200;
Stepper myStepper(stepsPerRevolution, 8, 9, 10, 11);

void setup() {
  myStepper.setSpeed(60); // 60 RPM
}

void loop() {
  // Rotate clockwise 90 degrees (50 steps for 200 steps/rev motor)
  myStepper.step(50);
  delay(1000);
  
  // Rotate counter-clockwise 90 degrees
  myStepper.step(-50);
  delay(1000);
  
  // Note: Motor will stop if trying to exceed 0-359° range
}
```

## Visual Feedback

The stepper motor visual element provides:
- **Shaft rotation**: Smooth CSS transform based on angle
- **Direction arrow**: Shows current rotation direction
- **Energization glow**: Indicates when coils are active
- **Angle display**: Shows current position in degrees
- **Step count**: Shows cumulative steps taken

## Benefits

1. **Exact Positioning**: 1° step resolution for precise angle control
2. **Continuous Rotation**: No boundaries - wraps seamlessly at 0°/359°
3. **Predictable**: Integer angles make position tracking simple
4. **Realistic**: Mimics real-world stepper motors with 360° rotation
5. **Flexible**: Can be disabled for applications requiring unbounded rotation

## Notes

- Default behavior is **constrained with wrapping** (0-359°, 1° steps)
- Existing code continues to work with new default behavior
- No physics simulation in constrained mode (discrete 1° steps)
- No stalling - motor wraps around at boundaries
- Each step moves exactly 1° regardless of stepsPerRev configuration
