# Slide Switch Debug Guide

## 🔍 Debugging Steps

Based on your screenshot, I can see the circuit is wired, but the LED isn't lighting up. Let's debug this step by step.

### Step 1: Verify Console Output

Open the browser console (F12) and look for these messages when you click the switch:

**Expected messages:**
```
[SLIDE SWITCH] Node [id] state: ON (COM→NO)
[SLIDE SWITCH] COM connected to power → Output NO = HIGH
[SLIDE SWITCH] Injecting HIGH to NO (Pin 2)
[FORGE CIRCUIT] Peripheral Node [id] requesting inject on pin 2 to HIGH
[FORGE CIRCUIT] Digital Signal: Peripheral[id] pin 2 -> HIGH on PD2
```

**If you see these messages, the switch is working!**

### Step 2: Check Wiring

From your screenshot, verify:

1. ✅ **Arduino 5V** → **Slide Switch Pin 1** (leftmost pin - COM)
2. ✅ **Slide Switch Pin 2** (middle pin - NO) → **Arduino Pin 2** (D2)
3. ✅ **Slide Switch Pin 3** (rightmost pin - NC) → **Arduino GND**

**Important:** The slide switch pins are numbered **1, 2, 3** from left to right when looking at the component.

### Step 3: Test the Switch State

1. **Before clicking the switch:**
   - Switch should be OFF (handle on the left)
   - Pin 1 (COM) connects to Pin 3 (NC)
   - Arduino Pin 2 should read LOW (connected to GND via NC)
   - LED should be OFF

2. **After clicking the switch:**
   - Switch should be ON (handle on the right, turns green)
   - Pin 1 (COM) connects to Pin 2 (NO)
   - Arduino Pin 2 should read HIGH (connected to 5V via NO)
   - LED should be ON

### Step 4: Verify Simulation is Running

Make sure you:
1. ✅ Clicked the **▶ Run** button
2. ✅ See "AVR Simulator Engine started" in console
3. ✅ Serial Monitor shows "Switch OFF" or "Switch ON"

### Step 5: Try This Test Code

Replace your code with this simpler version to test:

```cpp
int switchPin = 2;
int ledPin = 13;

void setup() {
  pinMode(switchPin, INPUT);
  pinMode(ledPin, OUTPUT);
  Serial.begin(9600);
  Serial.println("=== SLIDE SWITCH TEST ===");
}

void loop() {
  int state = digitalRead(switchPin);
  
  // Print raw pin state
  Serial.print("Pin 2 state: ");
  Serial.println(state);
  
  // Control LED
  digitalWrite(ledPin, state);
  
  delay(500);
}
```

**Expected Serial Output:**
```
=== SLIDE SWITCH TEST ===
Pin 2 state: 0
Pin 2 state: 0
Pin 2 state: 0
```

Then click the switch:

```
Pin 2 state: 1
Pin 2 state: 1
Pin 2 state: 1
```

### Step 6: Check Pin Mapping

The slide switch element has these pins:
- **Pin 1** at x=6.5, y=34 (leftmost)
- **Pin 2** at x=16, y=34 (middle)
- **Pin 3** at x=25.5, y=34 (rightmost)

Make sure your wires are connected to the correct visual pins on the canvas.

### Step 7: Force Refresh

Sometimes the component needs a refresh:
1. Stop the simulation (⏹ Stop button)
2. Refresh the browser page (F5)
3. Rebuild the circuit
4. Click ▶ Run again
5. Try the switch

### Step 8: Alternative Wiring (Reverse Logic)

If the above doesn't work, try this wiring:

```
Arduino GND → Slide Switch Pin 1 (COM)
Slide Switch Pin 2 (NO) → Arduino Pin 2
Slide Switch Pin 3 (NC) → Arduino 5V
Arduino Pin 2 → 10kΩ Pull-up Resistor → 5V
```

**Expected behavior:**
- Switch OFF → Pin 2 reads HIGH (pulled up to 5V via NC)
- Switch ON → Pin 2 reads LOW (connected to GND via NO)

**Modified code:**
```cpp
void loop() {
  int state = digitalRead(switchPin);
  
  if (state == LOW) {  // Reversed logic
    digitalWrite(ledPin, HIGH);
    Serial.println("Switch ON");
  } else {
    digitalWrite(ledPin, LOW);
    Serial.println("Switch OFF");
  }
  
  delay(100);
}
```

### Step 9: Check for Conflicting Code

Make sure your code doesn't have:
- `pinMode(switchPin, OUTPUT)` - should be INPUT
- `pinMode(ledPin, INPUT)` - should be OUTPUT
- Any code that writes to Pin 2 (conflicts with switch input)

### Step 10: Verify LED Connection

The built-in LED on Pin 13 should work automatically. If using an external LED:

```
Arduino Pin 13 → LED (long leg/anode)
LED (short leg/cathode) → 220Ω Resistor → GND
```

---

## 🔧 Quick Fix Checklist

- [ ] Simulation is running (▶ Run clicked)
- [ ] Switch is wired: 5V → Pin 1, Pin 2 → D2, Pin 3 → GND
- [ ] Switch can be clicked (handle slides left/right)
- [ ] Console shows slide switch messages
- [ ] Serial Monitor shows output
- [ ] Code has `pinMode(2, INPUT)` not OUTPUT
- [ ] LED is on Pin 13 (built-in)

---

## 🆘 Still Not Working?

If the LED still doesn't light up, please check:

1. **Browser Console** - Copy all messages starting with `[SLIDE SWITCH]` and `[FORGE CIRCUIT]`
2. **Serial Monitor** - What does it show?
3. **Switch Visual** - Does the handle slide when clicked? Does it turn green?
4. **Wiring Screenshot** - Take a screenshot showing all wire connections

This will help identify the exact issue!

---

**Debug Status:** 🔍 Investigating  
**Date:** 2026-05-06
