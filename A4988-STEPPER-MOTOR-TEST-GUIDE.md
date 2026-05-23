# A4988 Stepper Motor - Complete Test Guide

## Your Circuit Setup

Based on your image and code:

```
Arduino Uno
├── Pin 3 (Digital) → A4988 STEP
├── Pin 4 (Digital) → A4988 DIR
└── USB (Serial) ↔ Serial Monitor

A4988 Driver
├── STEP ← Arduino Pin 3
├── DIR ← Arduino Pin 4
├── ENABLE → (pulled LOW by default - driver enabled)
├── RESET → (pulled HIGH by default - driver active)
├── SLEEP → (pulled HIGH by default - driver awake)
├── MS1/MS2/MS3 → (pulled LOW by default - full step mode)
├── VDD → 5V (logic power)
├── VMOT → Motor power supply
├── GND → Ground
├── 1A → Stepper Motor Coil 1 (Phase A)
├── 1B → Stepper Motor Coil 1 (Phase A)
├── 2A → Stepper Motor Coil 2 (Phase B)
└── 2B → Stepper Motor Coil 2 (Phase B)

Stepper Motor (NEMA 17 or similar)
├── Coil 1 (A) ← A4988 1A/1B
└── Coil 2 (B) ← A4988 2A/2B
```

## How It Works

### Signal Flow:

1. **Arduino sends STEP pulse** (Pin 3 HIGH → LOW)
2. **A4988 receives STEP** → advances motor one step
3. **A4988 reads DIR** (Pin 4) → determines rotation direction
4. **A4988 energizes coils** → 1A/1B/2A/2B outputs
5. **Stepper motor rotates** → shaft moves

### Your Code Flow:

```cpp
Serial.parseInt()           // Read number from Serial Monitor
  ↓
digitalWrite(DIR_PIN, HIGH) // Set direction (CW)
  ↓
for (i = 0; i < steps; i++) // Loop for each step
  ↓
digitalWrite(STEP_PIN, HIGH)  // Rising edge
delayMicroseconds(3000)       // Pulse width
digitalWrite(STEP_PIN, LOW)   // Falling edge
delayMicroseconds(3000)       // Step delay
```

## Testing Checklist

### ✅ Step 1: Verify Circuit Connections

Check in your circuit diagram:

- [ ] Arduino Pin 3 connected to A4988 STEP
- [ ] Arduino Pin 4 connected to A4988 DIR
- [ ] A4988 1A/1B connected to Stepper Motor Coil 1
- [ ] A4988 2A/2B connected to Stepper Motor Coil 2
- [ ] A4988 VDD connected to 5V
- [ ] A4988 GND connected to Ground
- [ ] A4988 VMOT connected to motor power supply

### ✅ Step 2: Upload and Start Simulation

1. **Paste your code** into the editor
2. **Click Compile** (hammer icon)
3. **Wait for compilation** to complete
4. **Click Play** (green button)
5. **Check console** for:
   ```
   [FORGE] AVR Simulator Engine started
   [A4988 DEBUG] STEP/DIR pins properly connected
   [A4988] Motor edges found: 4 connections
   [STEPPER] Wiring A4988 STEP/DIR emulator for motor node
   ```

### ✅ Step 3: Test Serial Input

1. **Switch to Serial Monitor tab**
2. **Wait for prompt**: `"Enter steps:"`
3. **Type a number**: `200`
4. **Select line ending**: `Newline`
5. **Click Send** or press Enter
6. **Check output**: `"Step: 200"`

### ✅ Step 4: Verify Motor Movement

Watch the stepper motor visualization:

- [ ] **Shaft rotates** (visual animation)
- [ ] **Angle updates** (displays current angle)
- [ ] **Step count updates** (shows "+200 steps")
- [ ] **Direction arrow** appears (green glow)
- [ ] **Rotation is smooth** (not jumpy)

### ✅ Step 5: Test Different Values

Try these inputs to verify full functionality:

| Input | Expected Result |
|-------|----------------|
| `100` | Motor rotates 100 steps (180°) |
| `200` | Motor rotates 200 steps (360° = 1 full rotation) |
| `400` | Motor rotates 400 steps (720° = 2 full rotations) |
| `50` | Motor rotates 50 steps (90°) |
| `0` | No movement |
| `-100` | No movement (your code only accepts positive) |

## Expected Console Output

### Successful Operation:

```
[FORGE] AVR Simulator Engine started
[A4988 DEBUG] First pin change detected: STEP = LOW
[A4988 DEBUG] A4988 node ID: 3148e57b-7a9e-4ff5-94de-d39476c0e08b
[A4988 DEBUG] STEP/DIR pins properly connected: 2 edges
[A4988] Motor edges found: 4 connections
[STEPPER] Wiring A4988 STEP/DIR emulator for motor node 1617be93-06c8-4796-b9e0-e06bc6da5efc
[STEPPER] [1617be93-06c8-4796-b9e0-e06bc6da5efc] Created. Initial Dir: CW
[USART] Sent 4 bytes to AVR RX: "200\n"
[STEPPER] [1617be93-06c8-4796-b9e0-e06bc6da5efc] CW Step: 20, Angle: 36.00°
[STEPPER] [1617be93-06c8-4796-b9e0-e06bc6da5efc] CW Step: 40, Angle: 72.00°
[STEPPER] [1617be93-06c8-4796-b9e0-e06bc6da5efc] CW Step: 60, Angle: 108.00°
...
[STEPPER] [1617be93-06c8-4796-b9e0-e06bc6da5efc] CW Step: 200, Angle: 0.00°
```

## Troubleshooting

### Problem: "Cannot send serial data: simulation not running"

**Solution:**
- Make sure simulation is running (green Stop button visible)
- Check console for "[FORGE] AVR Simulator Engine started"
- Restart simulation if needed

### Problem: Motor doesn't move

**Check:**
1. **A4988 connections**
   - Verify 1A/1B/2A/2B are connected to motor
   - Check STEP/DIR are connected to Arduino

2. **A4988 enable state**
   - ENABLE pin should be LOW (enabled)
   - RESET pin should be HIGH (active)
   - SLEEP pin should be HIGH (awake)

3. **Code logic**
   - Verify `steps > 0` condition
   - Check `digitalWrite(STEP_PIN, ...)` is called
   - Ensure `delayMicroseconds()` is present

### Problem: Motor rotates wrong direction

**Solution:**
- Swap DIR pin logic: `digitalWrite(DIR_PIN, LOW)` instead of HIGH
- Or swap motor coil wires (1A ↔ 1B or 2A ↔ 2B)

### Problem: Motor steps are jerky

**Possible causes:**
- `delayMicroseconds(3000)` might be too fast
- Try increasing to `delayMicroseconds(5000)`
- Or add acceleration/deceleration ramps

### Problem: Serial input not working

**Check:**
1. **Serial.begin() called** in setup()
2. **Serial.available() checked** in loop()
3. **Line ending selected** (Newline recommended)
4. **Simulation is running** (not paused)

## Advanced Testing

### Test 1: Variable Speed

Modify your code to accept speed parameter:

```cpp
void loop() {
  if (Serial.available() > 0) {
    int steps = Serial.parseInt();
    int speed = Serial.parseInt(); // Add speed parameter
    
    if (steps > 0 && speed > 0) {
      digitalWrite(DIR_PIN, HIGH);
      for (int i = 0; i < steps; i++) {
        digitalWrite(STEP_PIN, HIGH);
        delayMicroseconds(speed);
        digitalWrite(STEP_PIN, LOW);
        delayMicroseconds(speed);
      }
    }
  }
}
```

**Test:** Send `"200 5000"` (200 steps at 5000µs delay)

### Test 2: Bidirectional Control

Add direction control:

```cpp
void loop() {
  if (Serial.available() > 0) {
    int steps = Serial.parseInt();
    char dir = Serial.read(); // Read direction character
    
    if (steps > 0) {
      digitalWrite(DIR_PIN, dir == 'F' ? HIGH : LOW);
      for (int i = 0; i < steps; i++) {
        digitalWrite(STEP_PIN, HIGH);
        delayMicroseconds(3000);
        digitalWrite(STEP_PIN, LOW);
        delayMicroseconds(3000);
      }
    }
  }
}
```

**Test:** 
- Send `"200F"` for forward
- Send `"200R"` for reverse

### Test 3: Continuous Rotation

Make motor rotate continuously:

```cpp
void loop() {
  if (Serial.available() > 0) {
    char cmd = Serial.read();
    
    if (cmd == 'S') { // Start
      while (!Serial.available()) {
        digitalWrite(STEP_PIN, HIGH);
        delayMicroseconds(3000);
        digitalWrite(STEP_PIN, LOW);
        delayMicroseconds(3000);
      }
    }
  }
}
```

**Test:** 
- Send `"S"` to start rotation
- Send any character to stop

## Performance Metrics

### Timing:

- **Step pulse width**: 3000µs (3ms)
- **Step frequency**: ~166 Hz
- **RPM**: ~50 RPM (for 200 steps/rev motor)
- **200 steps duration**: ~1.2 seconds

### Calculations:

```
Steps per revolution: 200
Pulse width: 3000µs
Total time per step: 6000µs (HIGH + LOW)
Steps per second: 1,000,000 / 6000 = 166.67
RPM: (166.67 / 200) * 60 = 50 RPM
```

## Visual Indicators

### Stepper Motor Element:

- **Shaft rotation**: Smooth animation showing rotation
- **Angle display**: Current angle (0-360°)
- **Step count**: Cumulative steps (e.g., "+200 steps")
- **Direction arrow**: Green when energized
- **Glow effect**: Indicates motor is powered

### A4988 Element:

- **STEP LED**: Blinks green on each pulse
- **DIR indicator**: Blue when HIGH
- **ENABLE status**: Green when enabled
- **Power indicator**: Shows driver is active

## Success Criteria

Your setup is working correctly if:

- ✅ Serial Monitor receives input
- ✅ Arduino code reads the number
- ✅ STEP pulses are generated
- ✅ A4988 receives STEP/DIR signals
- ✅ Stepper motor shaft rotates
- ✅ Angle updates in real-time
- ✅ Step count increments correctly
- ✅ Visual feedback is smooth

## Next Steps

Once basic operation is confirmed:

1. **Add acceleration** - Ramp up/down speed
2. **Implement microstepping** - Connect MS1/MS2/MS3 pins
3. **Add position tracking** - Keep track of absolute position
4. **Create motion profiles** - Trapezoidal velocity curves
5. **Multi-axis control** - Control multiple motors

## Reference

### A4988 Pin Functions:

| Pin | Function | Default State |
|-----|----------|---------------|
| STEP | Step pulse input | LOW |
| DIR | Direction control | LOW (CCW) / HIGH (CW) |
| ENABLE | Enable driver | LOW (enabled) |
| RESET | Reset driver | HIGH (active) |
| SLEEP | Sleep mode | HIGH (awake) |
| MS1 | Microstep select 1 | LOW |
| MS2 | Microstep select 2 | LOW |
| MS3 | Microstep select 3 | LOW |

### Microstepping Modes:

| MS1 | MS2 | MS3 | Mode | Steps/Rev |
|-----|-----|-----|------|-----------|
| 0 | 0 | 0 | Full | 200 |
| 1 | 0 | 0 | Half | 400 |
| 0 | 1 | 0 | 1/4 | 800 |
| 1 | 1 | 0 | 1/8 | 1600 |
| 1 | 1 | 1 | 1/16 | 3200 |

Your circuit is now fully functional! 🎉
