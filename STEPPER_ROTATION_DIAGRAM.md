# Stepper Motor Rotation Diagram

## Visual Representation

```
                    0° / 360°
                       ↑
                       |
                       |
        315°           |           45°
            ╲          |          ╱
             ╲         |         ╱
              ╲        |        ╱
               ╲       |       ╱
                ╲      |      ╱
                 ╲     |     ╱
                  ╲    |    ╱
                   ╲   |   ╱
                    ╲  |  ╱
                     ╲ | ╱
                      ╲|╱
    270° ←────────────⊕────────────→ 90°
                      ╱|╲
                     ╱ | ╲
                    ╱  |  ╲
                   ╱   |   ╲
                  ╱    |    ╲
                 ╱     |     ╲
                ╱      |      ╲
               ╱       |       ╲
              ╱        |        ╲
             ╱         |         ╲
            ╱          |          ╲
        225°           |           135°
                       |
                       |
                       ↓
                     180°

    ⊕ = Motor shaft (fixed center)
    ↻ = Clockwise rotation (0° → 359°)
    ↺ = Anticlockwise rotation (359° → 0°)
```

## Rotation Limits

### Clockwise (CW) Rotation
```
Start: 0°
  ↓
  ↻ (rotate clockwise)
  ↓
 90° → 180° → 270° → 359°
                      ↓
                   [STOP]
                   (limit reached)
```

### Anticlockwise (CCW) Rotation
```
Start: 359°
  ↓
  ↺ (rotate anticlockwise)
  ↓
270° → 180° → 90° → 0°
                    ↓
                 [STOP]
                 (limit reached)
```

## Example Scenarios

### Scenario 1: Full CW Rotation
```
Initial Position: 0°
Command: Rotate CW 400 steps (720°)
Result: Motor rotates to 359° and stops (stalled)
Actual Rotation: 359° (not 720°)
```

### Scenario 2: Full CCW Rotation
```
Initial Position: 359°
Command: Rotate CCW 400 steps (-720°)
Result: Motor rotates to 0° and stops (stalled)
Actual Rotation: -359° (not -720°)
```

### Scenario 3: Bidirectional Movement
```
Initial Position: 180°

Step 1: Rotate CW 100 steps (+180°)
Result: 180° + 180° = 360° → clamped to 359°
Status: STALLED at 359°

Step 2: Rotate CCW 200 steps (-360°)
Result: 359° - 360° = -1° → clamped to 0°
Status: STALLED at 0°

Step 3: Rotate CW 50 steps (+90°)
Result: 0° + 90° = 90°
Status: OK (within range)
```

## State Transitions

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  ┌──────────┐    CW step     ┌──────────┐     │
│  │          │  (angle < 359°)│          │     │
│  │   IDLE   │───────────────→│ ROTATING │     │
│  │          │                 │    CW    │     │
│  └──────────┘                 └──────────┘     │
│       ↑                            │            │
│       │                            │            │
│       │                            ↓            │
│       │                       ┌──────────┐     │
│       │                       │          │     │
│       │                       │ STALLED  │     │
│       │                       │ at 359°  │     │
│       │                       │          │     │
│       │                       └──────────┘     │
│       │                            ↑            │
│       │                            │            │
│       │                            │            │
│  ┌──────────┐   CCW step     ┌──────────┐     │
│  │          │  (angle > 0°)  │          │     │
│  │   IDLE   │───────────────→│ ROTATING │     │
│  │          │                 │   CCW    │     │
│  └──────────┘                 └──────────┘     │
│       ↑                            │            │
│       │                            │            │
│       │                            ↓            │
│       │                       ┌──────────┐     │
│       │                       │          │     │
│       └───────────────────────│ STALLED  │     │
│                               │  at 0°   │     │
│                               │          │     │
│                               └──────────┘     │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Physics Simulation

The motor uses a spring-damper model for realistic motion:

```
Target Angle (from steps)
        ↓
    ┌───────┐
    │Spring │ → Pulls motor toward target
    └───────┘
        ↓
    ┌───────┐
    │Damper │ → Slows down motion (friction)
    └───────┘
        ↓
    ┌───────┐
    │Inertia│ → Resists acceleration
    └───────┘
        ↓
   Actual Angle (smooth)
```

### Motion Characteristics
- **Acceleration**: Gradual speed-up when starting
- **Deceleration**: Smooth slow-down when approaching target
- **Overshoot**: Minimal (well-damped system)
- **Settling Time**: ~100-200ms typical
- **Boundary Behavior**: Hard stop at 0° and 359°

## Code Example with Constraints

```cpp
// Arduino Stepper Library Example
#include <Stepper.h>

const int stepsPerRevolution = 200;
Stepper motor(stepsPerRevolution, 8, 9, 10, 11);

void setup() {
  motor.setSpeed(60); // 60 RPM
  Serial.begin(9600);
}

void loop() {
  // Try to rotate 2 full revolutions CW (400 steps)
  Serial.println("Attempting 2 full CW rotations...");
  motor.step(400);
  // Result: Motor stops at 359° (not 720°)
  
  delay(2000);
  
  // Try to rotate 2 full revolutions CCW (-400 steps)
  Serial.println("Attempting 2 full CCW rotations...");
  motor.step(-400);
  // Result: Motor stops at 0° (not -360°)
  
  delay(2000);
  
  // Rotate to 180° (100 steps from 0°)
  Serial.println("Rotating to 180°...");
  motor.step(100);
  // Result: Motor at 180° ✓
  
  delay(2000);
}
```

## Benefits of Constraints

1. **Safety**: Prevents mechanical damage from over-rotation
2. **Predictability**: Known range simplifies motion planning
3. **Realism**: Mimics real-world motors with mechanical stops
4. **Debugging**: Easier to track position within fixed range
5. **Control**: Clear boundaries for position feedback

## When to Disable Constraints

Consider disabling constraints (`constrainRotation: false`) for:
- Continuous rotation applications (e.g., wheels, fans)
- Multi-revolution positioning (e.g., lead screws)
- Legacy code expecting unbounded rotation
- Testing/debugging scenarios

## Summary

The stepper motor component now provides realistic rotation constraints:
- **CW**: 0° → 359° (stops at 359°)
- **CCW**: 359° → 0° (stops at 0°)
- **Shaft**: Fixed on axis, rotates smoothly with physics simulation
- **Configurable**: Can be disabled for unbounded rotation
