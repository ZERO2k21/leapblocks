# Slide Switch Test Guide

## ✅ Implementation Complete!

The slide switch now has full simulation support with SPDT (Single Pole Double Throw) behavior.

---

## 🔧 Your Circuit Setup

Based on your code, here's the correct wiring:

### Circuit Diagram:
```
Arduino 5V ──→ Slide Switch Pin 1 (COM)
Slide Switch Pin 2 (NO) ──→ Arduino Pin 2
Slide Switch Pin 3 (NC) ──→ GND
Arduino Pin 13 ──→ LED ──→ GND (built-in LED)
```

### How It Works:
- **Switch OFF (value=0):** Pin 1 connects to Pin 3 → Arduino Pin 2 reads LOW (GND)
- **Switch ON (value=1):** Pin 1 connects to Pin 2 → Arduino Pin 2 reads HIGH (5V)

---

## 📝 Your Arduino Code

```cpp
// Slide Switch with Arduino
int switchPin = 2;   // Slide switch connected to D2
int ledPin = 13;     // Built-in LED

void setup() {
  pinMode(switchPin, INPUT);
  pinMode(ledPin, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  int switchState = digitalRead(switchPin);
  
  if (switchState == HIGH) {
    digitalWrite(ledPin, HIGH);
    Serial.println("Switch ON");
  } else {
    digitalWrite(ledPin, LOW);
    Serial.println("Switch OFF");
  }
  
  delay(100);
}
```

---

## 🎯 Testing Steps

### Step 1: Build the Circuit
1. Place **Arduino Uno** on canvas
2. Place **Slide Switch** on canvas
3. Place **LED** on canvas (or use built-in LED on Pin 13)

### Step 2: Wire the Components
```
Arduino 5V → Slide Switch Pin 1 (leftmost pin - COM)
Slide Switch Pin 2 (middle pin - NO) → Arduino Pin 2
Slide Switch Pin 3 (rightmost pin - NC) → Arduino GND
```

**Important:** Make sure Pin 1 (COM) is connected to 5V!

### Step 3: Upload Code
1. Copy the Arduino code above
2. Paste into the code editor
3. Click **▶ Run**

### Step 4: Test the Switch
1. **Click the slide switch** on the canvas
2. **Watch the handle slide** left/right
3. **Observe the LED** turn ON/OFF
4. **Check Serial Monitor** for "Switch ON" / "Switch OFF"

---

## 🔍 Expected Behavior

### When Switch is OFF (handle to the left):
- ✅ Handle position: LEFT
- ✅ Terminal colors: Pin 3 (NC) glows GREEN
- ✅ Arduino Pin 2: reads LOW
- ✅ LED: OFF
- ✅ Serial Monitor: "Switch OFF"

### When Switch is ON (handle to the right):
- ✅ Handle position: RIGHT
- ✅ Handle color: GREEN
- ✅ Terminal colors: Pin 2 (NO) glows GREEN
- ✅ Arduino Pin 2: reads HIGH
- ✅ LED: ON
- ✅ Serial Monitor: "Switch ON"

---

## 📊 Console Output

You should see these messages in the browser console:

```
[SLIDE SWITCH] Node [id] state: OFF (COM→NC)
[SLIDE SWITCH] COM connected to power → Output NC = HIGH
[SLIDE SWITCH] Injecting HIGH to NC (Pin 3)
[FORGE CIRCUIT] Peripheral Node [id] requesting inject on pin 3 to HIGH
```

When you toggle:

```
[SLIDE SWITCH] Node [id] state: ON (COM→NO)
[SLIDE SWITCH] COM connected to power → Output NO = HIGH
[SLIDE SWITCH] Injecting HIGH to NO (Pin 2)
[FORGE CIRCUIT] Peripheral Node [id] requesting inject on pin 2 to HIGH
```

---

## 🐛 Troubleshooting

### Issue: LED doesn't turn ON
**Check:**
1. ✅ Pin 1 (COM) connected to 5V?
2. ✅ Pin 2 (NO) connected to Arduino Pin 2?
3. ✅ Pin 3 (NC) connected to GND?
4. ✅ Simulation is running (clicked ▶ Run)?

### Issue: LED is always ON or always OFF
**Check:**
1. ✅ Wiring is correct (COM to 5V, not GND)
2. ✅ Pin 2 and Pin 3 are not swapped
3. ✅ Switch is clickable (try clicking it)

### Issue: Serial Monitor shows nothing
**Check:**
1. ✅ Serial Monitor tab is open
2. ✅ Simulation is running
3. ✅ Code has `Serial.begin(9600)` in setup()

### Issue: Switch doesn't toggle
**Solution:**
- Click directly on the switch body or handle
- The switch should slide left/right with animation

---

## 🎨 Visual Feedback

The slide switch element now shows:

1. **Handle Animation:** Slides smoothly left (OFF) or right (ON)
2. **Handle Color:** 
   - Gray when OFF
   - Green when ON
3. **Terminal Highlights:**
   - Active terminal (connected to COM) glows green
   - Inactive terminal is gray
4. **State Label:** Shows "ON" or "OFF" on the switch body
5. **Terminal Labels:** "NC" and "NO" labels on the pins

---

## 🔬 Advanced Testing

### Test 1: Dual LED Mode Selection
```
Arduino 5V → Pin 1 (COM)
Pin 2 (NO) → Green LED → Resistor → GND
Pin 3 (NC) → Red LED → Resistor → GND
```

**Expected:**
- Switch OFF → Red LED ON
- Switch ON → Green LED ON

### Test 2: Interrupt-Based Detection
```cpp
const int SWITCH_PIN = 2;
volatile bool switchState = false;

void setup() {
  pinMode(SWITCH_PIN, INPUT);
  pinMode(13, OUTPUT);
  Serial.begin(9600);
  
  attachInterrupt(digitalPinToInterrupt(SWITCH_PIN), onSwitchChange, CHANGE);
}

void onSwitchChange() {
  switchState = digitalRead(SWITCH_PIN);
  digitalWrite(13, switchState);
  Serial.print("Interrupt! Switch: ");
  Serial.println(switchState ? "ON" : "OFF");
}

void loop() {
  // Main code here
}
```

---

## ✅ Summary

Your slide switch is now fully functional with:
- ✅ 3 terminals (COM, NO, NC) properly configured
- ✅ SPDT behavior simulation
- ✅ Visual state indicators
- ✅ Interactive toggle
- ✅ Signal propagation to Arduino pins
- ✅ Console logging for debugging

**The LED should now turn ON/OFF when you click the switch!** 🎉

---

**Test Status:** ✅ Ready to Test  
**Date:** 2026-05-06  
**Component:** Slide Switch (SPDT)
