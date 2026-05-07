# Serial Monitor Quick Fix Guide

## ❌ Error: "Cannot send serial data: simulation not running"

### What This Error Means
You tried to send data via the Serial Monitor **before** starting the simulation. The Arduino code isn't running yet, so there's nothing to receive your input.

---

## ✅ Solution (3 Steps)

### Step 1: Start the Simulation
Click the **▶ Run** button in the toolbar (top of the screen).

### Step 2: Wait for Confirmation
Look for this message in the console:
```
[FORGE] AVR Simulator Engine started.
```

### Step 3: Send Your Data
Now you can type in the Serial Monitor and click **Send**.

---

## 🎯 Complete Workflow

### 1. Build Your Circuit
- Arduino Uno on canvas
- A4988 driver on canvas
- Stepper motor on canvas
- Wire them together:
  - Arduino Pin 3 → A4988 STEP
  - Arduino Pin 4 → A4988 DIR
  - A4988 (1A/1B/2A/2B) → Motor (4 wires)

### 2. Upload Your Code
```cpp
const int STEP_PIN = 3;
const int DIR_PIN = 4;
int steps = 0;

void setup() {
  pinMode(DIR_PIN, OUTPUT);
  pinMode(STEP_PIN, OUTPUT);
  Serial.begin(9600);
  Serial.println("Enter steps:");
}

void loop() {
  if (Serial.available() > 0) {
    steps = Serial.parseInt();
    Serial.print("Step: ");
    Serial.println(steps);
    
    if (steps > 0) {
      digitalWrite(DIR_PIN, HIGH);
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

### 3. Click ▶ Run

### 4. Open Serial Monitor
- Should be visible at the bottom of the screen
- If not, click the "Serial Monitor" tab

### 5. Configure Serial Monitor
- **Line Ending:** Select "Newline (\\n)" from dropdown
- This is **critical** for `Serial.parseInt()` to work!

### 6. Send Commands
Type a number (e.g., `100`) and click **Send** or press Enter.

---

## 🔍 What Should Happen

### Console Output:
```
[FORGE] AVR Simulator Engine started.
[A4988 DEBUG] First pin change detected: STEP = LOW
[A4988 DEBUG] A4988 node ID: 3148e57b-7a9e-4ff5-94de-d39476c0e08b
[A4988 DEBUG] STEP/DIR pins properly connected: 2 edges
[A4988] Motor edges found: 4 connections
[STEPPER] Wiring A4988 STEP/DIR emulator for motor node 1617be93-...
[STEPPER] [motor-id] Created. Initial Dir: CW
```

### Serial Monitor Output:
```
Enter steps:
Step: 100
```

### Visual Feedback:
- Motor shaft rotates on canvas
- Green arrow appears on motor (energized state)
- Angle display updates (e.g., "180.0°")
- Step counter shows "+100 steps"

---

## 🐛 Still Not Working?

### Check 1: Is the simulation actually running?
**Look for:** `[FORGE] AVR Simulator Engine started.` in console

**If missing:**
- Click ▶ Run button again
- Check for compilation errors in the code editor
- Try refreshing the page

### Check 2: Is the circuit wired correctly?
**Look for:** `[A4988] Motor edges found: 4 connections`

**If you see:** `[A4988] No motor edges found`
- Wire all 4 motor pins (1A/1B/2A/2B) to the stepper motor
- Check that wires are actually connected (not just hovering)

### Check 3: Are STEP/DIR pins connected?
**Look for:** `[A4988 DEBUG] STEP/DIR pins properly connected: 2 edges`

**If you see:** `[A4988 ERROR] No STEP/DIR pins connected`
- Wire Arduino Pin 3 to A4988 STEP
- Wire Arduino Pin 4 to A4988 DIR

### Check 4: Is line ending set correctly?
**Serial Monitor dropdown should show:** "Newline (\\n)"

**If set to "No line ending":**
- `Serial.parseInt()` will wait forever
- Change to "Newline (\\n)"

### Check 5: Are you sending a positive number?
**Your code has:** `if (steps > 0)`

**This means:**
- Sending `0` → No movement
- Sending `-100` → No movement
- Sending `100` → ✅ Movement!

---

## 💡 Pro Tips

### Tip 1: Add Debug Output
```cpp
void loop() {
  if (Serial.available() > 0) {
    steps = Serial.parseInt();
    
    // Debug: Show what was received
    Serial.print("Received: ");
    Serial.println(steps);
    
    if (steps > 0) {
      Serial.println("Starting rotation...");
      // ... rest of code
      Serial.println("Rotation complete!");
    } else {
      Serial.println("Invalid input (must be > 0)");
    }
  }
}
```

### Tip 2: Test Serial First
```cpp
void loop() {
  if (Serial.available() > 0) {
    steps = Serial.parseInt();
    Serial.print("Echo: ");
    Serial.println(steps);
  }
}
```

If this works, your serial communication is fine. If not, check line ending setting.

### Tip 3: Use Smaller Test Values
Instead of sending `100`, try:
- `10` → 18° rotation (easier to see if it's working)
- `50` → 90° rotation (quarter turn)
- `100` → 180° rotation (half turn)
- `200` → 360° rotation (full turn)

---

## 📊 Expected Timing

For your code with 3ms delays:
- **10 steps:** ~60ms (instant)
- **50 steps:** ~300ms (0.3 seconds)
- **100 steps:** ~600ms (0.6 seconds)
- **200 steps:** ~1200ms (1.2 seconds)

If the motor seems to rotate instantly, that's normal! The simulation runs at full speed.

---

## 🎓 Understanding the Error

### Why does this error happen?

The Serial Monitor is part of the **UI layer**, but the Arduino code runs in the **simulation layer**. These are separate systems:

```
┌─────────────────────────────────────┐
│  UI Layer (React Components)        │
│  - Serial Monitor input field       │
│  - Send button                      │
└──────────────┬──────────────────────┘
               │ onSend() callback
               ↓
┌─────────────────────────────────────┐
│  ForgeStudio.tsx                    │
│  - Checks: isSimulating flag        │
│  - If false → Error message         │
│  - If true → Forward to runner      │
└──────────────┬──────────────────────┘
               │ sendSerialInput()
               ↓
┌─────────────────────────────────────┐
│  SimulationRunner.ts                │
│  - Routes to AVR or ESP32           │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  USARTEmulator.ts (AVR)             │
│  - Writes bytes to RX buffer        │
│  - Arduino code reads via Serial    │
└─────────────────────────────────────┘
```

**The check happens in ForgeStudio.tsx:**
```typescript
const onSend = (data: string) => {
  const runner = useForgeStore.getState().getSimulationRunner();
  if (!runner || !isSimulating) {
    console.error('[FORGE STUDIO] Cannot send serial data: simulation not running');
    return;
  }
  runner.sendSerialInput(data);
};
```

**Solution:** Make sure `isSimulating === true` by clicking ▶ Run first!

---

## ✅ Checklist

Before sending serial data, verify:

- [ ] Circuit is built (Arduino + A4988 + Motor)
- [ ] All wires are connected
- [ ] Code is uploaded to Arduino
- [ ] ▶ Run button was clicked
- [ ] Console shows "AVR Simulator Engine started"
- [ ] Serial Monitor is open
- [ ] Line ending is set to "Newline (\\n)"
- [ ] You're sending a positive integer

**If all checked → Serial input will work!** ✅

---

## 🆘 Emergency Reset

If nothing works, try this:

1. **Stop simulation:** Click ⏹ Stop button
2. **Clear console:** Click trash icon in console
3. **Refresh page:** Press F5 or Ctrl+R
4. **Rebuild circuit:** Start from scratch
5. **Re-upload code:** Copy-paste your code again
6. **Click ▶ Run:** Start fresh simulation
7. **Try serial input:** Send a test number

---

**Quick Reference:**
- ▶ Run → Wait for "Engine started" → Send data
- Line ending: "Newline (\\n)"
- Input: Positive integer (e.g., `100`)
- Expected: Motor rotates, console shows steps

**That's it!** 🎉
