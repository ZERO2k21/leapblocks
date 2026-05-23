# 🚀 ESP32 Simulation Guide - Wokwi-Level Quality

## Welcome to LeapBlocks ESP32 Simulation!

Your ESP32 simulation now has **Wokwi-level quality** with complete Arduino library support. This guide will help you get started.

---

## 📚 Quick Start

### Step 1: Select ESP32-C3 Board
1. Open LeapBlocks
2. Add ESP32-C3 board to canvas
3. Connect components with wires

### Step 2: Write Your Code
```cpp
#include <Servo.h>

Servo myServo;

void setup() {
  Serial.begin(115200);
  myServo.attach(9);
}

void loop() {
  myServo.write(90);
  delay(1000);
  myServo.write(0);
  delay(1000);
}
```

### Step 3: Compile & Run
1. Click "Compile & Run"
2. Watch your components come to life!
3. Check Serial Monitor for output

---

## 🎯 Supported Libraries

### ✅ **Servo** - Motor control
```cpp
#include <Servo.h>
Servo myServo;
myServo.attach(9);
myServo.write(90);  // 90 degrees
```

### ✅ **Stepper** - Stepper motor control
```cpp
#include <Stepper.h>
Stepper myStepper(200, 8, 9, 10, 11);
myStepper.setSpeed(60);
myStepper.step(100);
```

### ✅ **DHT** - Temperature & humidity
```cpp
#include <DHT.h>
DHT dht(2, DHT22);
float temp = dht.readTemperature();
float humidity = dht.readHumidity();
```

### ✅ **Adafruit_NeoPixel** - RGB LEDs
```cpp
#include <Adafruit_NeoPixel.h>
Adafruit_NeoPixel strip(8, 6, NEO_GRB);
strip.setPixelColor(0, 255, 0, 0);  // Red
strip.show();
```

### ✅ **LiquidCrystal_I2C** - LCD displays
```cpp
#include <LiquidCrystal_I2C.h>
LiquidCrystal_I2C lcd(0x27, 16, 2);
lcd.print("Hello World!");
```

### ✅ **Ultrasonic** - Distance sensors
```cpp
#include <NewPing.h>
NewPing sonar(12, 13, 200);
int distance = sonar.ping_cm();
```

---

## 🔌 Component Wiring Guide

### **Servo Motor**
```
Servo Signal (Orange) → GPIO 9
Servo VCC (Red)       → 5V
Servo GND (Brown)     → GND
```

### **DHT22 Sensor**
```
DHT Data → GPIO 2
DHT VCC  → 3.3V
DHT GND  → GND
```

### **NeoPixel Strip**
```
NeoPixel Data In → GPIO 6
NeoPixel VCC     → 5V
NeoPixel GND     → GND
```

### **LCD I2C Display**
```
LCD SDA → GPIO 21
LCD SCL → GPIO 22
LCD VCC → 5V
LCD GND → GND
```

### **HC-SR04 Ultrasonic**
```
TRIG → GPIO 12
ECHO → GPIO 13
VCC  → 5V
GND  → GND
```

---

## 📖 Example Projects

### 1. **Servo Sweep**
See: `examples/ESP32_Servo_Example.ino`

Sweeps a servo from 0° to 180° and back.

### 2. **Temperature Display**
See: `examples/ESP32_DHT_LCD_Example.ino`

Reads DHT22 sensor and displays on LCD.

### 3. **Rainbow LEDs**
See: `examples/ESP32_NeoPixel_Rainbow.ino`

Creates a rainbow effect on NeoPixel strip.

### 4. **Distance Sensor**
See: `examples/ESP32_Ultrasonic_LED.ino`

Measures distance and controls LED brightness.

---

## 🐛 Troubleshooting

### **Problem: Component not responding**

**Solution:**
1. Check wire connections in circuit editor
2. Verify pin numbers match your code
3. Ensure GND connections are present
4. Check Serial Monitor for errors

### **Problem: Library not found**

**Solution:**
All libraries are built-in! Just use `#include <LibraryName.h>`

Supported libraries:
- `<Servo.h>`
- `<Stepper.h>`
- `<DHT.h>`
- `<Adafruit_NeoPixel.h>`
- `<LiquidCrystal_I2C.h>`
- `<NewPing.h>`
- `<Ultrasonic.h>`

### **Problem: Servo not moving**

**Solution:**
1. Check servo is connected to correct pin
2. Verify `myServo.attach(pin)` is called in `setup()`
3. Check power connections (VCC and GND)
4. Look for console logs: `[Servo] Pin X → Y°`

### **Problem: LCD not displaying**

**Solution:**
1. Verify I2C address (usually 0x27 or 0x3F)
2. Check `lcd.begin()` is called in `setup()`
3. Call `lcd.backlight()` to turn on backlight
4. Ensure SDA/SCL pins are correct (21/22)

### **Problem: NeoPixels not lighting**

**Solution:**
1. Call `strip.begin()` in `setup()`
2. Call `strip.show()` after setting colors
3. Check data pin connection
4. Verify power supply (5V, GND)

---

## 💡 Tips & Tricks

### **1. Use Serial Monitor for Debugging**
```cpp
Serial.begin(115200);
Serial.println("Debug message");
Serial.print("Value: ");
Serial.println(value);
```

### **2. Adjust Component Values**
- Click on sensors to adjust values (temperature, distance, etc.)
- Use sliders to change sensor readings in real-time

### **3. Test Components Individually**
Start with simple code to test each component:

```cpp
// Test LED
void setup() {
  pinMode(2, OUTPUT);
}

void loop() {
  digitalWrite(2, HIGH);
  delay(1000);
  digitalWrite(2, LOW);
  delay(1000);
}
```

### **4. Check Console Logs**
Open browser console (F12) to see detailed logs:
- `[Servo] Attached to pin 9`
- `[DHT] Read: 25.0°C, 60.0%`
- `[NeoPixel] Updated 8 pixels`

### **5. Use Delays Wisely**
```cpp
delay(1000);  // Wait 1 second
delayMicroseconds(10);  // Wait 10 microseconds
```

---

## 🎓 Learning Resources

### **Arduino Reference**
- [Arduino Language Reference](https://www.arduino.cc/reference/en/)
- [ESP32 Arduino Core](https://docs.espressif.com/projects/arduino-esp32/)

### **Library Documentation**
- [Servo Library](https://www.arduino.cc/reference/en/libraries/servo/)
- [DHT Sensor Library](https://github.com/adafruit/DHT-sensor-library)
- [Adafruit NeoPixel](https://learn.adafruit.com/adafruit-neopixel-uberguide)
- [LiquidCrystal I2C](https://github.com/johnrickman/LiquidCrystal_I2C)

### **Example Projects**
- Check the `examples/` folder for ready-to-use code
- Modify examples to learn how things work
- Combine multiple components for complex projects

---

## 🚀 Advanced Features

### **1. Multiple Servos**
```cpp
Servo servo1, servo2, servo3;

void setup() {
  servo1.attach(9);
  servo2.attach(10);
  servo3.attach(11);
}

void loop() {
  servo1.write(0);
  servo2.write(90);
  servo3.write(180);
  delay(1000);
}
```

### **2. NeoPixel Animations**
```cpp
// Rainbow cycle
for(int i=0; i<strip.numPixels(); i++) {
  int hue = (i * 65536L / strip.numPixels());
  strip.setPixelColor(i, Adafruit_NeoPixel::ColorHSV(hue));
}
strip.show();
```

### **3. LCD Custom Characters**
```cpp
byte heart[8] = {
  0b00000,
  0b01010,
  0b11111,
  0b11111,
  0b01110,
  0b00100,
  0b00000,
  0b00000
};

lcd.createChar(0, heart);
lcd.write(0);  // Display heart
```

### **4. Stepper Motor Control**
```cpp
Stepper myStepper(200, 8, 9, 10, 11);

void setup() {
  myStepper.setSpeed(60);  // 60 RPM
}

void loop() {
  myStepper.step(100);   // 100 steps clockwise
  delay(500);
  myStepper.step(-100);  // 100 steps counter-clockwise
  delay(500);
}
```

---

## 📊 Performance Tips

### **1. Optimize Loop Speed**
```cpp
void loop() {
  // Do work
  delay(10);  // Don't run too fast
}
```

### **2. Use Non-Blocking Code**
```cpp
unsigned long lastUpdate = 0;
const long interval = 1000;

void loop() {
  unsigned long currentMillis = millis();
  
  if (currentMillis - lastUpdate >= interval) {
    lastUpdate = currentMillis;
    // Do periodic work
  }
  
  // Other code runs continuously
}
```

### **3. Minimize Serial Output**
```cpp
// Instead of printing every loop:
if (millis() % 1000 == 0) {
  Serial.println("Status update");
}
```

---

## ✅ Component Checklist

Before running your project, verify:

- [ ] All components are connected with wires
- [ ] Pin numbers in code match circuit
- [ ] GND connections are present
- [ ] Power connections (VCC/5V/3.3V) are correct
- [ ] `Serial.begin()` is called if using Serial Monitor
- [ ] Library `#include` statements are present
- [ ] `begin()` or `attach()` methods are called in `setup()`

---

## 🎉 You're Ready!

Your ESP32 simulation now has **Wokwi-level quality**. Start building amazing projects!

### **Next Steps:**
1. Try the example projects in `examples/` folder
2. Combine multiple components
3. Build your own custom projects
4. Share your creations!

### **Need Help?**
- Check console logs (F12)
- Review this guide
- Test components individually
- Check wire connections

---

**Happy Making! 🚀**

*LeapBlocks ESP32 Simulation - Production Ready*
