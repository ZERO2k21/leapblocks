# 🚀 IR Receiver Quick Start Guide

## 📦 What You Get

Your Electra simulation now has a **fully functional IR receiver** that works just like Wokwi! 

- ✅ Drag-and-drop IR receiver component
- ✅ Drag-and-drop IR remote control
- ✅ Click buttons on remote to send IR signals
- ✅ Compatible with IRremote.h Arduino library
- ✅ No configuration needed!

## 🎯 Quick Setup (3 Steps)

### Step 1: Add Components
1. Open your Electra circuit
2. Add **IR Receiver** from the component library (Sensors category)
3. Add **IR Remote** from the component library (Inputs category)

### Step 2: Wire the IR Receiver
```
IR Receiver → Arduino
├─ GND → GND
├─ VCC → 5V
└─ DAT → D2 (or any digital pin)
```

### Step 3: Upload Code
```cpp
#include <IRremote.h>

#define IR_PIN 2

void setup() {
  Serial.begin(9600);
  IrReceiver.begin(IR_PIN, ENABLE_LED_FEEDBACK);
  Serial.println("IR Ready!");
}

void loop() {
  if (IrReceiver.decode()) {
    Serial.print("Button: 0x");
    Serial.println(IrReceiver.decodedIRData.command, HEX);
    IrReceiver.resume();
  }
}
```

## 🎮 Using the IR Remote

### Click Any Button
- **Power** → 0xA2
- **1** → 0x30
- **2** → 0x18
- **3** → 0x7A
- **Play** → 0xA8
- *(and 15 more buttons!)*

### Watch the Serial Monitor
```
IR Ready!
Button: 0x30
Button: 0x18
Button: 0xA8
```

## 💡 Example Projects

### 1. LED Control
```cpp
#include <IRremote.h>

#define IR_PIN 2
#define LED_PIN 13

void setup() {
  pinMode(LED_PIN, OUTPUT);
  IrReceiver.begin(IR_PIN, ENABLE_LED_FEEDBACK);
}

void loop() {
  if (IrReceiver.decode()) {
    if (IrReceiver.decodedIRData.command == 0x30) {
      digitalWrite(LED_PIN, HIGH);  // Button 1 = ON
    } else if (IrReceiver.decodedIRData.command == 0x18) {
      digitalWrite(LED_PIN, LOW);   // Button 2 = OFF
    }
    IrReceiver.resume();
  }
}
```

### 2. Servo Control
```cpp
#include <IRremote.h>
#include <Servo.h>

#define IR_PIN 2
Servo myServo;

void setup() {
  myServo.attach(9);
  IrReceiver.begin(IR_PIN, ENABLE_LED_FEEDBACK);
}

void loop() {
  if (IrReceiver.decode()) {
    switch (IrReceiver.decodedIRData.command) {
      case 0x30: myServo.write(0);   break;  // Button 1
      case 0x18: myServo.write(90);  break;  // Button 2
      case 0x7A: myServo.write(180); break;  // Button 3
    }
    IrReceiver.resume();
  }
}
```

### 3. RGB LED Control
```cpp
#include <IRremote.h>

#define IR_PIN 2
#define RED_PIN 9
#define GREEN_PIN 10
#define BLUE_PIN 11

void setup() {
  pinMode(RED_PIN, OUTPUT);
  pinMode(GREEN_PIN, OUTPUT);
  pinMode(BLUE_PIN, OUTPUT);
  IrReceiver.begin(IR_PIN, ENABLE_LED_FEEDBACK);
}

void loop() {
  if (IrReceiver.decode()) {
    switch (IrReceiver.decodedIRData.command) {
      case 0x30: // Button 1 - Red
        analogWrite(RED_PIN, 255);
        analogWrite(GREEN_PIN, 0);
        analogWrite(BLUE_PIN, 0);
        break;
      case 0x18: // Button 2 - Green
        analogWrite(RED_PIN, 0);
        analogWrite(GREEN_PIN, 255);
        analogWrite(BLUE_PIN, 0);
        break;
      case 0x7A: // Button 3 - Blue
        analogWrite(RED_PIN, 0);
        analogWrite(GREEN_PIN, 0);
        analogWrite(BLUE_PIN, 255);
        break;
      case 0x68: // Button 0 - Off
        analogWrite(RED_PIN, 0);
        analogWrite(GREEN_PIN, 0);
        analogWrite(BLUE_PIN, 0);
        break;
    }
    IrReceiver.resume();
  }
}
```

## 🔧 Troubleshooting

### "No IR signal received"
- ✅ Check IR receiver is connected to correct pin
- ✅ Check GND and VCC are connected
- ✅ Verify pin number in code matches circuit
- ✅ Make sure IRremote library is installed

### "Wrong codes received"
- ✅ Use the button codes from the table below
- ✅ Print received codes to verify: `Serial.println(IrReceiver.decodedIRData.command, HEX);`

### "Library not found"
Install IRremote library:
1. Arduino IDE → Tools → Manage Libraries
2. Search "IRremote"
3. Install "IRremote by shirriff"

## 📋 Complete Button Code Reference

| Button | Hex Code | Decimal | Use Case |
|--------|----------|---------|----------|
| Power  | 0xA2     | 162     | On/Off toggle |
| Menu   | 0xE2     | 226     | Menu navigation |
| Test   | 0x22     | 34      | Test mode |
| Plus   | 0x02     | 2       | Increase value |
| Back   | 0xC2     | 194     | Go back |
| Prev   | 0xE0     | 224     | Previous item |
| Play   | 0xA8     | 168     | Play/Pause |
| Next   | 0x90     | 144     | Next item |
| 0      | 0x68     | 104     | Number 0 |
| Minus  | 0x98     | 152     | Decrease value |
| C      | 0xB0     | 176     | Clear/Cancel |
| 1      | 0x30     | 48      | Number 1 |
| 2      | 0x18     | 24      | Number 2 |
| 3      | 0x7A     | 122     | Number 3 |
| 4      | 0x10     | 16      | Number 4 |
| 5      | 0x38     | 56      | Number 5 |
| 6      | 0x5A     | 90      | Number 6 |
| 7      | 0x42     | 66      | Number 7 |
| 8      | 0x4A     | 74      | Number 8 |
| 9      | 0x52     | 82      | Number 9 |

## 🎓 Learning Resources

### Understanding NEC Protocol
The IR receiver uses the NEC protocol:
- **Start**: 9ms pulse + 4.5ms space
- **Bit 0**: 560µs pulse + 560µs space
- **Bit 1**: 560µs pulse + 1.69ms space
- **Frame**: 32 bits (Address + Command + checksums)

### IRremote Library Functions
```cpp
IrReceiver.begin(pin, LED_FEEDBACK);  // Initialize
IrReceiver.decode();                   // Check for signal
IrReceiver.decodedIRData.command;     // Get button code
IrReceiver.resume();                   // Ready for next
```

## 🌟 Tips & Tricks

1. **Multiple Receivers**: You can add multiple IR receivers to the same circuit - they all receive the same signal (like real IR!)

2. **Button Hold**: Hold a button on the remote to send repeat codes (every 110ms)

3. **Debugging**: Use Serial.print to see what codes you're receiving:
   ```cpp
   Serial.print("Received: 0x");
   Serial.println(IrReceiver.decodedIRData.command, HEX);
   ```

4. **Custom Actions**: Map any button to any action - LEDs, servos, motors, displays, etc.

## 🎉 You're Ready!

That's it! Your IR receiver simulation is ready to use. Just like Wokwi, but in Electra! 🚀

---

**Need Help?** Check the full documentation in `IR_RECEIVER_SIMULATION_COMPLETE.md`
