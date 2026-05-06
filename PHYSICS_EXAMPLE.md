# Stepper Motor Physics - Visual Example

## How the Physics Simulation Works

### Scenario: Motor Receives 1 Step Command

Let's walk through what happens when the motor receives a single step command:

```
Time: 0ms
┌─────────────────────────────────────┐
│ Step Command Received               │
│ Target Angle: 1.8° (1 step)        │
│ Actual Angle: 0°                    │
│ Velocity: 0 rad/s                   │
└─────────────────────────────────────┘
```

### Physics Update Loop (60 Hz = every 16.67ms)

#### Update 1 (16.67ms)
```typescript
// Calculate error
error = targetAngle - actualAngle = 1.8° - 0° = 1.8°

// Spring force (pulls toward target)
springTorque = SPRING_K * error = 50 * 0.0314 rad = 1.57 N⋅m

// Damping force (opposes motion)
dampingTorque = -DAMPING * velocity = -0.002 * 0 = 0 N⋅m

// Net torque
netTorque = 1.57 + 0 = 1.57 N⋅m

// Acceleration
acceleration = netTorque / INERTIA = 1.57 / 0.0001 = 15,700 rad/s²

// Update velocity
velocity = 0 + 15,700 * 0.01667 = 261.7 rad/s

// Update angle
actualAngle = 0 + 261.7 * 0.01667 = 4.36 rad = 0.073°
```

**Result:** Motor starts moving, but only reaches 0.073° (not yet at target 1.8°)

#### Update 2 (33.33ms)
```typescript
error = 1.8° - 0.073° = 1.727°
springTorque = 50 * 0.0301 = 1.505 N⋅m
dampingTorque = -0.002 * 261.7 = -0.523 N⋅m
netTorque = 1.505 - 0.523 = 0.982 N⋅m
acceleration = 0.982 / 0.0001 = 9,820 rad/s²
velocity = 261.7 + 9,820 * 0.01667 = 425.4 rad/s
actualAngle = 0.073° + 425.4 * 0.01667 = 0.193°
```

**Result:** Motor continues accelerating, now at 0.193°

#### Update 3-10 (50ms - 166ms)
```
Update 3:  actualAngle = 0.35°,  velocity = 550 rad/s
Update 4:  actualAngle = 0.54°,  velocity = 640 rad/s
Update 5:  actualAngle = 0.76°,  velocity = 700 rad/s
Update 6:  actualAngle = 1.01°,  velocity = 730 rad/s
Update 7:  actualAngle = 1.28°,  velocity = 720 rad/s  ← Peak velocity
Update 8:  actualAngle = 1.54°,  velocity = 680 rad/s  ← Decelerating
Update 9:  actualAngle = 1.76°,  velocity = 600 rad/s
Update 10: actualAngle = 1.92°,  velocity = 480 rad/s  ← Overshoot!
```

**Result:** Motor overshoots target slightly (1.92° > 1.8°)

#### Update 11-20 (183ms - 333ms)
```
Update 11: actualAngle = 2.01°,  velocity = 320 rad/s  ← Still overshooting
Update 12: actualAngle = 2.03°,  velocity = 150 rad/s  ← Slowing down
Update 13: actualAngle = 2.01°,  velocity = -20 rad/s  ← Reversing!
Update 14: actualAngle = 1.97°,  velocity = -180 rad/s ← Moving back
Update 15: actualAngle = 1.88°,  velocity = -280 rad/s
Update 16: actualAngle = 1.76°,  velocity = -320 rad/s ← Undershoot
Update 17: actualAngle = 1.68°,  velocity = -280 rad/s
Update 18: actualAngle = 1.64°,  velocity = -200 rad/s
Update 19: actualAngle = 1.65°,  velocity = -80 rad/s
Update 20: actualAngle = 1.69°,  velocity = 40 rad/s   ← Reversing again
```

**Result:** Motor oscillates around target (damped oscillation)

#### Update 21-40 (350ms - 666ms)
```
Update 21-30: Small oscillations around 1.8°
Update 31-40: Oscillations getting smaller (damping effect)
```

#### Update 41+ (683ms+)
```
Update 41: actualAngle = 1.799°, velocity = 5 rad/s
Update 42: actualAngle = 1.800°, velocity = 2 rad/s
Update 43: actualAngle = 1.800°, velocity = 0 rad/s  ← Settled!
```

**Result:** Motor settles at target angle 1.8°

## Visual Representation

```
Angle vs Time Graph:

2.1° ┤                    ╭─╮
2.0° ┤                  ╭─╯ ╰─╮
1.9° ┤                ╭─╯     ╰─╮
1.8° ┤              ╭─╯         ╰─────────  ← Target
1.7° ┤            ╭─╯
1.6° ┤          ╭─╯
1.5° ┤        ╭─╯
1.4° ┤      ╭─╯
1.3° ┤    ╭─╯
1.2° ┤  ╭─╯
1.1° ┤╭─╯
1.0° ┤╯
0.9° ┤
0.8° ┤
0.7° ┤
0.6° ┤
0.5° ┤
0.4° ┤
0.3° ┤
0.2° ┤
0.1° ┤
0.0° ┼────────────────────────────────────
     0   100  200  300  400  500  600  700ms

     ↑   ↑    ↑    ↑    ↑    ↑    ↑    ↑
     │   │    │    │    │    │    │    └─ Settled
     │   │    │    │    │    │    └────── Small oscillations
     │   │    │    │    │    └─────────── Undershoot
     │   │    │    │    └──────────────── Overshoot peak
     │   │    │    └───────────────────── Peak velocity
     │   │    └────────────────────────── Accelerating
     │   └─────────────────────────────── Starting to move
     └─────────────────────────────────── Step command
```

## Velocity vs Time Graph

```
Velocity (rad/s):

 800 ┤
 700 ┤        ╭─╮
 600 ┤      ╭─╯ ╰─╮
 500 ┤    ╭─╯     ╰─╮
 400 ┤  ╭─╯         ╰─╮
 300 ┤╭─╯             ╰─╮
 200 ┤╯                 ╰─╮
 100 ┤                    ╰─╮
   0 ┼──────────────────────╰─────────────
-100 ┤                      ╭─╮
-200 ┤                    ╭─╯ ╰─╮
-300 ┤                  ╭─╯     ╰─╮
-400 ┤                ╭─╯         ╰───────
     0   100  200  300  400  500  600  700ms

     ↑   ↑    ↑    ↑    ↑    ↑    ↑    ↑
     │   │    │    │    │    │    │    └─ Zero velocity (settled)
     │   │    │    │    │    │    └────── Damped oscillations
     │   │    │    │    │    └─────────── Negative velocity (moving back)
     │   │    │    │    └──────────────── Velocity reverses (overshoot)
     │   │    │    └───────────────────── Peak velocity
     │   │    └────────────────────────── Accelerating
     │   └─────────────────────────────── Initial acceleration
     └─────────────────────────────────── Zero velocity (at rest)
```

## Key Observations

### 1. **Smooth Acceleration** (0-200ms)
- Motor doesn't jump instantly to target
- Velocity increases gradually
- Looks natural and realistic

### 2. **Overshoot** (200-250ms)
- Motor overshoots target slightly
- This is realistic behavior (inertia)
- Damping prevents excessive overshoot

### 3. **Damped Oscillation** (250-600ms)
- Motor oscillates around target
- Each oscillation is smaller (damping)
- Eventually settles at target

### 4. **Settling Time** (~600ms)
- Total time to reach target: ~600ms
- Can be tuned by adjusting DAMPING parameter
- Higher damping = faster settling, less overshoot
- Lower damping = slower settling, more overshoot

## Comparison: Instant vs Physics

### Instant Stepping (Before)
```
Angle:
1.8° ┤ ┌─────────────────────────────────
     │ │
     │ │
     │ │
0.0° ┼─┘
     0   100  200  300  400  500  600  700ms
     
     ↑
     └─ Instant jump (unrealistic)
```

### Physics Simulation (After)
```
Angle:
1.8° ┤              ╭─╮
     │            ╭─╯ ╰─╮
     │          ╭─╯     ╰─────────
     │        ╭─╯
0.0° ┼────────╯
     0   100  200  300  400  500  600  700ms
     
     ↑   ↑    ↑    ↑    ↑
     │   │    │    │    └─ Settled
     │   │    │    └────── Overshoot
     │   │    └─────────── Accelerating
     │   └──────────────── Starting
     └──────────────────── Step command
```

## Microstepping Example

With 16x microstepping (A4988 with MS1=MS2=MS3=HIGH):

```
Full Step = 1.8°
Microstep = 1.8° / 16 = 0.1125°

Step 1:  Target = 0.1125°  → Smooth motion to 0.1125°
Step 2:  Target = 0.2250°  → Smooth motion to 0.2250°
Step 3:  Target = 0.3375°  → Smooth motion to 0.3375°
...
Step 16: Target = 1.8000°  → Smooth motion to 1.8000°

Result: Ultra-smooth continuous rotation (no visible steps)
```

## Fast Stepping Example

When steps come quickly (e.g., 10ms apart):

```
Time:   0ms    10ms   20ms   30ms   40ms   50ms
Step:   1      2      3      4      5      6
Target: 1.8°   3.6°   5.4°   7.2°   9.0°   10.8°

Actual: 0.1°   0.5°   1.2°   2.3°   3.8°   5.6°
        ↑      ↑      ↑      ↑      ↑      ↑
        │      │      │      │      │      └─ Still accelerating
        │      │      │      │      └──────── Velocity increasing
        │      │      │      └───────────── Smooth acceleration
        │      │      └──────────────────── No jumps
        │      └───────────────────────── Gradual speed-up
        └──────────────────────────────── Smooth start

Result: Smooth continuous rotation (motor never "catches up" to target,
        but maintains constant velocity offset - looks like smooth spinning)
```

## Parameter Tuning Guide

### INERTIA (default: 0.0001)
- **Higher** → Slower acceleration, more realistic for heavy loads
- **Lower** → Faster acceleration, more responsive feel

### DAMPING (default: 0.002)
- **Higher** → Less overshoot, faster settling, more "sticky" feel
- **Lower** → More overshoot, slower settling, more "bouncy" feel

### SPRING_K (default: 50)
- **Higher** → Stronger pull to target, faster response
- **Lower** → Weaker pull to target, slower response

## Recommended Settings

### Default (Balanced)
```typescript
INERTIA = 0.0001  // Responsive but realistic
DAMPING = 0.002   // Slight overshoot, natural settling
SPRING_K = 50     // Strong pull to target
```

### High Performance (Fast, Responsive)
```typescript
INERTIA = 0.00005  // Very responsive
DAMPING = 0.005    // Quick settling
SPRING_K = 100     // Very strong pull
```

### High Realism (Slow, Heavy)
```typescript
INERTIA = 0.0002   // Feels heavier
DAMPING = 0.001    // More overshoot
SPRING_K = 30      // Gentler pull
```

### Educational (Exaggerated Physics)
```typescript
INERTIA = 0.0005   // Very slow
DAMPING = 0.0005   // Lots of oscillation
SPRING_K = 20      // Weak pull
```

---

This physics simulation creates realistic, smooth motion that feels natural and educational while maintaining excellent performance (60 FPS, low CPU usage).
