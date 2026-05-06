# Slide Switch Setup Guide

## ✅ Component Status: FULLY CONFIGURED

The slide switch is now fully set up with **3 terminals** and proper SPDT (Single Pole Double Throw) simulation.

---

## 🔌 Terminal Configuration

### Pin Layout:
```
┌─────────────────┐
│   SLIDE SWITCH  │
│                 │
│  NC   COM   NO  │
│  ●     ●     ●  │
└──┬────┬────┬───┘
   │    │    │
  Pin3 Pin1 Pin2
```

### Pin Definitions:

| Pin | Name | Type | Description |
|-----|------|------|-------------|
| **1** | **COM** | Common (Pole) | Always connected to either Pin 2 or Pin 3 |
| **2** | **NO** | Normally Open | Connected to COM when switch is **ON** (value=1) |
| **3** | **NC** | Normally Closed | Connected to COM when switch is **OFF** (value=0) |

---

## 🎯 How SPDT Works

### Switch States:

#### State 1: OFF (value = 0)
```
Pin 1 (COM) ──┬── Pin 3 (NC)  ✅ CONNECTED
              │
              └── Pin 2 (NO)  ❌ DISCONNECTED
```

#### State 2: ON (value = 1)
```
Pin 1 (COM) ──┬── Pin 2 (NO)  ✅ CONNECTED
              │
              └── Pin 3 (NC)  ❌ DISCONNECTED
```

---

## 💡 Visual Indicators

The slide switch element now shows:

1. **Handle Color:**
   - 🟢 Green (`#4ade80`) when ON
   - 🔵 Gray (`#94a3b8`) when OFF

2. **Terminal Highlights:**
   - Active terminal glows green
   - Inactive terminal is gray

3. **State Label:**
   - Shows "ON" or "OFF" on the switch body

4. **Terminal Labels:**
   - "NC" label on Pin 3 (left)
   - "NO" label on Pin 2 (right)

---

## 🔧 Wiring Examples

### Example 1: Simple LED Control

**Circuit:**
```
Arduino 5V ──→ Pin 1 (COM)
Pin 2 (NO) ──→ LED+ ──→ Resistor ──→ GND
Pin 3 (NC) ──→ (not connected)
```

**Behavior:**
- Switch OFF → LED is OFF (circuit open)
- Switch ON → LED is ON (circuit closed)

**Arduino Code:**
```cpp
// No code needed! The switch directly controls the LED
```

---

### Example 2: Digital Input Reading

**Circuit:**
```
Arduino 5V ──→ Pin 1 (COM)
Pin 2 (NO) ──→ Arduino Pin 2
Pin 3 (NC) ──→ GND
Arduino Pin 2 ──→ 10kΩ Pull-down Resistor ──→ GND
```

**Behavior:**
- Switch OFF → Pin 2 reads LOW (connected to GND via NC)
- Switch ON → Pin 2 reads HIGH (connected to 5V via NO)

**Arduino Code:**
```cpp
const int SWITCH_PIN = 2;

void setup() {
  pinMode(SWITCH_PIN, INPUT);
  Serial.begin(9600);
}

void loop() {
  int state = digitalRead(SWITCH_PIN);
  
  if (state == HIGH) {
    Serial.println("Switch is ON");
  } else {
    Serial.println("Switch is OFF");
  }
  
  delay(500);
}
```

---

### Example 3: Mode Selection (Two Different Circuits)

**Circuit:**
```
Arduino 5V ──→ Pin 1 (COM)
Pin 2 (NO) ──→ Green LED ──→ Resistor ──→ GND
Pin 3 (NC) ──→ Red LED ──→ Resistor ──→ GND
```

**Behavior:**
- Switch OFF → Red LED ON, Green LED OFF
- Switch ON → Green LED ON, Red LED OFF

**Arduino Code:**
```cpp
// No code needed! The switch automatically routes power
// to either the red LED (OFF) or green LED (ON)
```

---

### Example 4: Motor Direction Control

**Circuit:**
```
Arduino Pin 3 ──→ Pin 1 (COM)
Pin 2 (NO) ──→ Motor Driver DIR pin (HIGH = CW)
Pin 3 (NC) ──→ GND (LOW = CCW)
```

**Behavior:**
- Switch OFF → Motor rotates CCW (DIR = LOW)
- Switch ON → Motor rotates CW (DIR = HIGH)

**Arduino Code:**
```cpp
const int STEP_PIN = 4;
const int DIR_PIN = 3;  // Connected to switch COM

void setup() {
  pinMode(STEP_PIN, OUTPUT);
  pinMode(DIR_PIN, OUTPUT);
  digitalWrite(DIR_PIN, HIGH);  // Switch controls actual direction
}

void loop() {
  // Generate steps
  digitalWrite(STEP_PIN, HIGH);
  delayMicroseconds(1000);
  digitalWrite(STEP_PIN, LOW);
  delayMicroseconds(1000);
}
```

---

### Example 5: Interrupt-Based Detection

**Circuit:**
```
Arduino 5V ──→ Pin 1 (COM)
Pin 2 (NO) ──→ Arduino Pin 2 (Interrupt)
Pin 3 (NC) ──→ GND
```

**Arduino Code:**
```cpp
const int SWITCH_PIN = 2;
volatile bool switchState = false;

void setup() {
  pinMode(SWITCH_PIN, INPUT);
  Serial.begin(9600);
  
  // Attach interrupt for both edges
  attachInterrupt(digitalPinToInterrupt(SWITCH_PIN), onSwitchChange, CHANGE);
}

void onSwitchChange() {
  switchState = digitalRead(SWITCH_PIN);
  Serial.print("Switch changed to: ");
  Serial.println(switchState ? "ON" : "OFF");
}

void loop() {
  // Main code here
}
```

---

## 🎮 Interactive Usage

### On Canvas:
1. **Click the switch** to toggle between ON/OFF
2. **Watch the handle slide** left (OFF) or right (ON)
3. **See terminal colors change** to show active connection
4. **Observe connected LEDs** respond immediately

### Keyboard Control:
- **Tab** to focus the switch
- **Space** or **Enter** to toggle
- **Click** anywhere on the switch to toggle

---

## 🔬 Simulation Behavior

### Internal Logic:

```typescript
// When switch value changes:
if (value === 0) {
  // OFF state
  Pin1_to_Pin3 = CONNECTED;
  Pin1_to_Pin2 = DISCONNECTED;
} else {
  // ON state
  Pin1_to_Pin2 = CONNECTED;
  Pin1_to_Pin3 = DISCONNECTED;
}
```

### Signal Propagation:

1. **User clicks switch** → `value` changes (0 or 1)
2. **Element dispatches event** → `InputEvent('input')`
3. **CircuitEngine detects change** → Updates pin states
4. **Signal propagates** through connected wires
5. **Connected components react** → LEDs light up, Arduino reads state

---

## 📊 Technical Specifications

| Property | Value |
|----------|-------|
| **Type** | SPDT (Single Pole Double Throw) |
| **Terminals** | 3 (COM, NO, NC) |
| **States** | 2 (ON/OFF) |
| **Switching Time** | 200ms (animation) |
| **Contact Rating** | Digital signal only (simulation) |
| **Debounce** | Not required (clean digital signal) |

---

## 🧪 Testing Guide

### Test 1: Basic Toggle
1. Place slide switch on canvas
2. Click the switch
3. **Expected:** Handle slides, color changes

### Test 2: LED Control
1. Wire: 5V → Pin 1, Pin 2 → LED → Resistor → GND
2. Toggle switch
3. **Expected:** LED turns ON when switch is ON

### Test 3: Digital Read
1. Wire: 5V → Pin 1, Pin 2 → Arduino Pin 2, Pin 3 → GND
2. Add pull-down resistor on Pin 2
3. Upload code to read Pin 2
4. Toggle switch
5. **Expected:** Serial Monitor shows "ON" / "OFF"

### Test 4: Dual LED (Mode Selection)
1. Wire: 5V → Pin 1
2. Pin 2 → Green LED → Resistor → GND
3. Pin 3 → Red LED → Resistor → GND
4. Toggle switch
5. **Expected:** 
   - OFF → Red LED ON, Green LED OFF
   - ON → Green LED ON, Red LED OFF

---

## 🎨 Customization

### Change Switch Appearance:

Edit `slide-switch-element.ts`:

```typescript
// Change ON color
fill="${this.value ? '#ff0000' : '#94a3b8'}"  // Red when ON

// Change OFF color
fill="${this.value ? '#4ade80' : '#0000ff'}"  // Blue when OFF

// Adjust animation speed
transition: transform 0.5s ease-out;  // Slower animation
```

---

## 🐛 Troubleshooting

### Issue: Switch doesn't toggle
**Solution:** Click directly on the switch body or handle

### Issue: No signal on Arduino pin
**Solution:** 
- Check wiring: COM must be connected to power or signal source
- Verify NO or NC is connected to Arduino pin
- Add pull-down resistor if reading floating pin

### Issue: Both LEDs light up
**Solution:** 
- This is impossible with SPDT - check for wiring shorts
- Verify only ONE of NO/NC is connected to each LED

### Issue: Switch state not saved
**Solution:** 
- Switch state is not persistent (resets on simulation restart)
- Use Arduino code to set initial state if needed

---

## 📚 Related Components

- **Push Button:** Momentary contact (returns to OFF)
- **DIP Switch:** Multiple SPST switches in one package
- **Toggle Switch:** Similar to slide switch, different form factor
- **Relay:** Electrically controlled switch

---

## 🎯 Best Practices

1. **Always connect COM (Pin 1)** to your signal source
2. **Use pull-down resistors** when reading switch state
3. **Label your wires** to track NO vs NC connections
4. **Test both states** before finalizing circuit
5. **Consider debouncing** in real hardware (not needed in simulation)

---

## 📖 Example Projects

### Project 1: Speed Controller
Use slide switch to select between slow/fast motor speeds.

### Project 2: Mode Selector
Switch between two different LED patterns or behaviors.

### Project 3: Safety Interlock
Use NC terminal for fail-safe operation (default state is safe).

### Project 4: Direction Control
Control motor or servo direction with a simple switch.

---

## ✅ Summary

The slide switch is now fully functional with:
- ✅ 3 terminals (COM, NO, NC)
- ✅ SPDT behavior simulation
- ✅ Visual state indicators
- ✅ Interactive toggle
- ✅ Proper pin configuration
- ✅ Circuit integration

**Ready to use in your projects!** 🚀

---

**Document Version:** 1.0  
**Date:** 2026-05-06  
**Component:** Slide Switch (SPDT)  
**Status:** ✅ Fully Configured
