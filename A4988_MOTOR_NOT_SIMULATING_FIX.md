# A4988 Stepper Motor Not Simulating - Diagnostic & Fix

## Critical Bug Fixed

### Bug #1: ENABLE Pin Logic Error ❌→✅

**Problem**: The A4988 driver was checking if `buf['ENABLE'] === false`, but when the ENABLE pin is not connected, `buf['ENABLE']` is `undefined`. Since `undefined === false` returns `false`, the driver was incorrectly disabled!

**Old Code (BROKEN)**:
```typescript
const enableLow = buf['ENABLE'] === false; // ❌ Returns false when undefined!
const driverEnabled = enableLow && resetHigh && sleepHigh;
if (!driverEnabled) return; // Motor never moves!
```

**New Code (FIXED)**:
```typescript
const enableLow = buf['ENABLE'] !== true; // ✅ undefined or false = enabled
const driverEnabled = enableLow && resetHigh && sleepHigh;
```

**Why This Matters**:
- A4988 ENABLE pin is **active-low** and **pulled-down by default**
- When not connected: `buf['ENABLE']` = `undefined` → should be treated as LOW (enabled)
- Old logic: `undefined === false` → `false` → driver disabled ❌
- New logic: `undefined !== true` → `true` → driver enabled ✅

### Bug #2: Missing Diagnostic Logging

Added comprehensive logging to help diagnose issues:

```typescript
console.log(`[A4988] Driver state check: ENABLE=${buf['ENABLE']}, RESET=${buf['RESET']}, SLEEP=${buf['SLEEP']}`);
console.log(`[A4988] Computed: enableLow=${enableLow}, resetHigh=${resetHigh}, sleepHigh=${sleepHigh}, driverEnabled=${driverEnabled}`);
console.log(`[A4988→MOTOR] Updating motor: angle=45.0°, stepCount=25, energized=true`);
```

## How to Test the Fix

### Step 1: Check Browser Console

When you start the simulation, you should see:

**If STEP/DIR are connected:**
```
[A4988 DEBUG] First pin change detected: STEP = HIGH
[A4988 DEBUG] A4988 node ID: node_xyz
[A4988 DEBUG] STEP/DIR pins properly connected: 2 edges
[A4988] Motor edges found: 4 connections
[STEPPER] Wiring A4988 STEP/DIR emulator for motor node motor_abc
```

**When driver processes signals:**
```
[A4988] Driver state check: ENABLE=undefined, RESET=true, SLEEP=true
[A4988] Computed: enableLow=true, resetHigh=true, sleepHigh=true, driverEnabled=true
[A4988→MOTOR] Updating motor motor_abc: angle=1.8°, stepCount=1, energized=true
[STEPPER] [motor_abc] CW Step: 1, Angle: 1.80°
```

### Step 2: Common Issues & Solutions

#### Issue A: No STEP/DIR Connections
```
[A4988 ERROR] No STEP/DIR pins connected to A4988!
```

**Solution**: Wire your ESP32 pins to A4988 STEP and DIR pins:
```
ESP32 GPIO 2 → A4988 STEP
ESP32 GPIO 3 → A4988 DIR
```

**Arduino Code**:
```cpp
#include <AccelStepper.h>
AccelStepper stepper(AccelStepper::DRIVER, 2, 3); // STEP=2, DIR=3
```

#### Issue B: No Motor Connections
```
[A4988] No motor edges found for A4988 node xyz
```

**Solution**: Wire A4988 outputs to stepper motor:
```
A4988 1A → Motor A+
A4988 1B → Motor A-
A4988 2A → Motor B+
A4988 2B → Motor B-
```

#### Issue C: Driver Disabled
```
[A4988] Driver state check: ENABLE=true, RESET=false, SLEEP=true
[A4988] Computed: enableLow=false, resetHigh=false, sleepHigh=true, driverEnabled=false
[A4988] Driver disabled! Motor will not move.
```

**Explanation**:
- `ENABLE=true` means HIGH → driver disabled (active-low)
- `RESET=false` means LOW → driver in reset (active-low)

**Solution**: Check your wiring:
- **ENABLE pin**: Leave unconnected (pulled-down = LOW = enabled) OR connect to GND
- **RESET pin**: Leave unconnected (floating = HIGH = not in reset) OR connect to VDD
- **SLEEP pin**: Leave unconnected (pulled-up = HIGH = awake) OR connect to VDD

#### Issue D: Using Wrong Arduino Library
```
[SIM RUNNER] setPinState: ESP4 = HIGH, 2 listeners
[SIM RUNNER] setPinState: ESP5 = HIGH, 2 listeners
[SIM RUNNER] setPinState: ESP18 = HIGH, 2 listeners
[SIM RUNNER] setPinState: ESP19 = HIGH, 2 listeners
```

**Problem**: You're using Arduino `Stepper` library (4-wire mode), not `AccelStepper` (STEP/DIR mode)

**Solution**: Change your code to use AccelStepper:

**Wrong (4-wire mode)**:
```cpp
#include <Stepper.h>
Stepper myStepper(200, 4, 5, 18, 19); // ❌ 4-wire mode
```

**Correct (STEP/DIR mode)**:
```cpp
#include <AccelStepper.h>
AccelStepper stepper(AccelStepper::DRIVER, 2, 3); // ✅ STEP/DIR mode
```

## Complete Working Example

### Wiring Diagram
```
ESP32-C3                A4988               Stepper Motor
┌─────────┐            ┌──────┐            ┌──────────┐
│ GPIO 2  ├───────────→│ STEP │            │          │
│ GPIO 3  ├───────────→│ DIR  │            │          │
│         │            │      │            │          │
│ 3.3V    ├───────────→│ VDD  │            │          │
│ GND     ├───────────→│ GND  │            │          │
└─────────┘            │      │            │          │
                       │ 1A   ├───────────→│ A+       │
                       │ 1B   ├───────────→│ A-       │
                       │ 2A   ├───────────→│ B+       │
                       │ 2B   ├───────────→│ B-       │
                       └──────┘            └──────────┘
                          ↑
                       12V Motor
                       Power Supply
```

### Arduino Code
```cpp
#include <AccelStepper.h>

// Define stepper motor connections and motor interface type
#define STEP_PIN 2
#define DIR_PIN 3

// Create stepper object
AccelStepper stepper(AccelStepper::DRIVER, STEP_PIN, DIR_PIN);

void setup() {
  // Set maximum speed and acceleration
  stepper.setMaxSpeed(1000);      // Steps per second
  stepper.setAcceleration(500);   // Steps per second^2
}

void loop() {
  // Move 200 steps (1 revolution for 200-step motor)
  stepper.moveTo(200);
  stepper.runToPosition();
  delay(1000);
  
  // Move back to position 0
  stepper.moveTo(0);
  stepper.runToPosition();
  delay(1000);
}
```

### Expected Console Output
```
[A4988 DEBUG] First pin change detected: STEP = HIGH
[A4988 DEBUG] A4988 node ID: a4988_node_123
[A4988 DEBUG] STEP/DIR pins properly connected: 2 edges
[A4988] Motor edges found: 4 connections
[STEPPER] Wiring A4988 STEP/DIR emulator for motor node stepper_456
[A4988] Driver state check: ENABLE=undefined, RESET=true, SLEEP=true
[A4988] Computed: enableLow=true, resetHigh=true, sleepHigh=true, driverEnabled=true
[A4988→MOTOR] Updating motor stepper_456: angle=1.8°, stepCount=1, energized=true
[STEPPER] [stepper_456] CW Step: 1, Angle: 1.80°
[STEPPER] [stepper_456] CW Step: 20, Angle: 36.00°
[STEPPER] [stepper_456] CW Step: 40, Angle: 72.00°
...
[STEPPER] [stepper_456] CW Step: 200, Angle: 360.00°
```

## A4988 Pin States Reference

### Default Pin States (No Connections)

| Pin | Default State | Logic | Driver Behavior |
|-----|--------------|-------|-----------------|
| ENABLE | LOW (pulled-down) | Active-low | ✅ Enabled |
| RESET | HIGH (floating) | Active-low | ✅ Not in reset |
| SLEEP | HIGH (pulled-up) | Active-low | ✅ Awake |
| MS1 | LOW (pulled-down) | - | Full step mode |
| MS2 | LOW (pulled-down) | - | Full step mode |
| MS3 | LOW (pulled-down) | - | Full step mode |

### Microstepping Configuration

| MS1 | MS2 | MS3 | Mode | Steps per Revolution |
|-----|-----|-----|------|---------------------|
| LOW | LOW | LOW | Full step | 200 |
| HIGH | LOW | LOW | Half step | 400 |
| LOW | HIGH | LOW | 1/4 step | 800 |
| HIGH | HIGH | LOW | 1/8 step | 1600 |
| HIGH | HIGH | HIGH | 1/16 step | 3200 |

## Troubleshooting Checklist

- [ ] **STEP pin connected** to ESP32 GPIO
- [ ] **DIR pin connected** to ESP32 GPIO
- [ ] **A4988 outputs (1A, 1B, 2A, 2B) connected** to motor
- [ ] **Using AccelStepper library** (not Stepper library)
- [ ] **Motor power supply connected** to A4988 VMOT
- [ ] **Logic power (VDD) connected** to 3.3V or 5V
- [ ] **Common ground** between ESP32, A4988, and power supply
- [ ] **ENABLE pin** left unconnected or tied to GND
- [ ] **RESET pin** left unconnected or tied to VDD
- [ ] **SLEEP pin** left unconnected or tied to VDD

## Files Modified

### `src/Leapforge/Client/Src/engine/Arduino/CircuitEngine.ts`

**Line ~1606**: Fixed ENABLE pin logic
```typescript
// OLD: const enableLow = buf['ENABLE'] === false;
// NEW: const enableLow = buf['ENABLE'] !== true;
```

**Line ~1610**: Added diagnostic logging
```typescript
console.log(`[A4988] Driver state check: ...`);
console.log(`[A4988] Computed: ...`);
```

**Line ~1695**: Added motor update logging
```typescript
console.log(`[A4988→MOTOR] Updating motor ${motorNodeId}: ...`);
```

## Summary

The motor wasn't simulating because:
1. ❌ **ENABLE pin logic was wrong** - treated undefined as disabled
2. ❌ **No diagnostic logging** - couldn't see what was wrong

Now fixed:
1. ✅ **ENABLE pin logic corrected** - undefined = enabled (default state)
2. ✅ **Comprehensive logging added** - shows exact driver state
3. ✅ **Motor updates tracked** - see every step in console

**Test the fix**: Run your simulation and check the browser console for diagnostic messages!
