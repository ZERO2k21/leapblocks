# A4988 Stepper Motor Simulation - Diagnosis & Fix

## Problem Summary
Your stepper motor doesn't simulate when connected through the A4988 driver. The logs show 4 ESP32 pins (GPIO 4, 5, 18, 19) toggling with **2 listeners each**, indicating a **double-wiring issue**.

## Root Cause Analysis

### What the Logs Tell Us
```
[SIM RUNNER] setPinState: ESP4 = HIGH (was LOW)
[SIM RUNNER] notifyListeners: ESP4 = HIGH, 2 listeners
```

**2 listeners per pin** means each ESP32 GPIO is connected to **TWO different components**:
1. One listener from the **stepper motor** (direct 4-wire connection)
2. One listener from the **A4988 driver**

### The Fundamental Issue

The **A4988 driver** is a STEP/DIR controller. It expects:
- **Input**: STEP and DIR signals from your microcontroller
- **Output**: 4-wire coil signals (1A, 1B, 2A, 2B) to the stepper motor

However, your Arduino code is using the `Stepper` library in **4-wire mode**, which means:
- Your ESP32 is **directly generating coil sequences** on 4 GPIO pins
- These signals are meant to go **directly to the motor**, not through a driver
- The A4988 never receives STEP/DIR signals, so it never activates

## Wiring Configurations

### ❌ Current (Incorrect) Setup
```
ESP32 GPIO 4,5,18,19 (4-wire coils)
    ├─→ Stepper Motor (A+, A-, B+, B-)  ← Works but conflicts
    └─→ A4988 (???)                      ← Doesn't work
         └─→ Stepper Motor (1A, 1B, 2A, 2B)
```

### ✅ Option A: Direct 4-Wire (Remove A4988)
```
ESP32 GPIO 4,5,18,19 (4-wire coils)
    └─→ Stepper Motor (A+, A-, B+, B-)
```

**Arduino Code:**
```cpp
#include <Stepper.h>

Stepper myStepper(200, 4, 5, 18, 19);  // 4-wire mode

void setup() {
  myStepper.setSpeed(60);  // RPM
}

void loop() {
  myStepper.step(200);   // 1 revolution CW
  delay(1000);
  myStepper.step(-200);  // 1 revolution CCW
  delay(1000);
}
```

### ✅ Option B: STEP/DIR with A4988 (Recommended)
```
ESP32 GPIO 2,3 (STEP, DIR)
    └─→ A4988 (STEP, DIR pins)
         └─→ Stepper Motor (via 1A, 1B, 2A, 2B)
```

**Arduino Code:**
```cpp
#include <AccelStepper.h>

// AccelStepper(DRIVER, STEP_PIN, DIR_PIN)
AccelStepper stepper(AccelStepper::DRIVER, 2, 3);

void setup() {
  stepper.setMaxSpeed(1000);
  stepper.setAcceleration(500);
}

void loop() {
  stepper.moveTo(200);   // Move to position 200
  stepper.runToPosition();
  delay(1000);
  
  stepper.moveTo(0);     // Return to position 0
  stepper.runToPosition();
  delay(1000);
}
```

**Wiring for Option B:**
- ESP32 GPIO 2 → A4988 STEP pin
- ESP32 GPIO 3 → A4988 DIR pin
- A4988 1A → Motor A+ (coil 1)
- A4988 1B → Motor A- (coil 1)
- A4988 2A → Motor B+ (coil 2)
- A4988 2B → Motor B- (coil 2)
- A4988 VMOT → Motor power supply (8-35V)
- A4988 GND → Common ground
- A4988 VDD → 3.3V or 5V logic supply

## Diagnostic Improvements Added

I've added comprehensive diagnostics to help identify these issues:

### 1. Double-Wiring Detection
When a stepper motor is wired to both ESP32 and A4988:
```
[STEPPER] WARNING: Motor xyz is connected to BOTH:
[STEPPER]   1. ESP32 pins directly (4-wire mode)
[STEPPER]   2. A4988 driver(s): abc
[STEPPER] Choose ONE: Remove A4988 OR remove direct wiring
```

### 2. A4988 Missing STEP/DIR Detection
When A4988 has no STEP/DIR connections:
```
[A4988 ERROR] No STEP/DIR pins connected to A4988!
[A4988 ERROR] The A4988 driver requires STEP and DIR signals
[A4988 ERROR] Options:
[A4988 ERROR]   1. Remove A4988, wire ESP32 directly to motor
[A4988 ERROR]   2. Use AccelStepper library with STEP/DIR mode
```

### 3. Coil State Logging
Tracks actual coil signal changes:
```
[STEPPER] Coil A+ changed: LOW → HIGH
[STEPPER] Current coil state: A+=true, B+=false, A-=false, B-=true
```

## How to Fix Your Setup

### Quick Fix (Option A - Direct Wiring)
1. **Remove all wires** from the A4988 driver
2. **Delete the A4988** component from your canvas
3. **Wire ESP32 directly to motor:**
   - GPIO 4 → Motor A+
   - GPIO 5 → Motor B+
   - GPIO 18 → Motor A-
   - GPIO 19 → Motor B-
4. **Keep your current Arduino code** (using `Stepper` library)
5. **Run simulation** - motor should now work!

### Proper Fix (Option B - Use A4988)
1. **Change your Arduino code** to use `AccelStepper` library
2. **Rewire your circuit:**
   - Remove direct ESP32 → Motor connections
   - Wire ESP32 GPIO 2 → A4988 STEP
   - Wire ESP32 GPIO 3 → A4988 DIR
   - Wire A4988 outputs (1A, 1B, 2A, 2B) → Motor coils
3. **Run simulation** - motor should work with microstepping support!

## Benefits of Each Approach

### Option A (Direct 4-Wire)
- ✅ Simpler wiring
- ✅ Works with standard Arduino `Stepper` library
- ❌ No microstepping (lower precision)
- ❌ No current limiting (motor may overheat in real hardware)

### Option B (A4988 Driver)
- ✅ Microstepping support (1/2, 1/4, 1/8, 1/16 steps)
- ✅ Current limiting protects motor
- ✅ Better torque control
- ✅ More realistic for actual hardware projects
- ❌ Requires `AccelStepper` library
- ❌ Slightly more complex wiring

## Testing the Fix

After applying either fix, you should see in the console:

**For Option A:**
```
[STEPPER] Wiring 4-wire emulator for node xyz
[STEPPER] Coil A+ changed: LOW → HIGH
[STEPPER] CW Step: 1, Angle: 1.80°
```

**For Option B:**
```
[A4988] Motor edges found: 4 connections
[STEPPER] Wiring A4988 STEP/DIR emulator for motor node xyz
[STEPPER] CW Step: 1, Angle: 1.80°
```

## Files Modified

1. **CircuitEngine.ts** - Added diagnostic logging:
   - Double-wiring detection for stepper motors
   - A4988 STEP/DIR connection validation
   - Coil state change logging
   - Motor edge detection logging

2. **CircuitEngine.ts** - Added debug flag:
   - `a4988DebugLogged` property to prevent log spam

## Next Steps

1. **Check your browser console** when you run the simulation
2. **Look for the diagnostic messages** I added
3. **Choose Option A or B** based on your project needs
4. **Rewire your circuit** accordingly
5. **Update your Arduino code** if using Option B
6. **Test the simulation** - motor should now rotate!

If you still see issues, share the console output and I'll help debug further.
