# 🚀 ESP32 Simulation - Quick Reference Card

## 📚 Library Includes

```cpp
#include <Servo.h>              // Servo motors
#include <Stepper.h>            // Stepper motors
#include <DHT.h>                // DHT11/DHT22 sensors
#include <Adafruit_NeoPixel.h>  // WS2812B RGB LEDs
#include <LiquidCrystal_I2C.h>  // I2C LCD displays
#include <NewPing.h>            // HC-SR04 ultrasonic
#include <Ultrasonic.h>         // Alternative ultrasonic
```

---

## ⚡ Quick Code Snippets

### **Servo Motor**
```cpp
Servo myServo;
myServo.attach(9);
myServo.write(90);  // 0-180 degrees
```

### **Stepper Motor**
```cpp
Stepper myStepper(200, 8, 9, 10, 11);
myStepper.setSpeed(60);  // RPM
myStepper.step(100);     // Steps
```

### **DHT Sensor**
```cpp
DHT dht(2, DHT22);
dht.begin();
float temp = dht.readTemperature();
float humidity = dht.readHumidity();
```

### **NeoPixel**
```cpp
Adafruit_NeoPixel strip(8, 6, NEO_GRB);
strip.begin();
strip.setPixelColor(0, 255, 0, 0);  // Red
strip.show();
```

### **LCD Display**
```cpp
LiquidCrystal_I2C lcd(0x27, 16, 2);
lcd.begin();
lcd.backlight();
lcd.print("Hello!");
```

### **Ultrasonic**
```cpp
NewPing sonar(12, 13, 200);
int distance = sonar.ping_cm();
```

---

## 🔌 Common Pin Assignments

| Component | Pin | Type |
|-----------|-----|------|
| LED | 2 | Digital |
| Servo | 9 | PWM |
| DHT22 | 2 | Digital |
| NeoPixel | 6 | Digital |
| Ultrasonic TRIG | 12 | Digital |
| Ultrasonic ECHO | 13 | Digital |
| LCD SDA | 21 | I2C |
| LCD SCL | 22 | I2C |
| Stepper | 8,9,10,11 | Digital |

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Component not working | Check wire connections |
| Library not found | All libraries are built-in! |
| Servo not moving | Call `myServo.attach(pin)` in setup() |
| LCD blank | Call `lcd.backlight()` |
| NeoPixel not lighting | Call `strip.show()` after setting colors |
| No Serial output | Call `Serial.begin(115200)` |

---

## 💡 Pro Tips

1. **Always call begin()** - Most libraries need initialization
2. **Use Serial Monitor** - Great for debugging
3. **Check console logs** - Press F12 for detailed info
4. **Test individually** - Start with one component
5. **Verify connections** - GND is essential!

---

## 📖 Full Documentation

- **User Guide:** `ESP32_SIMULATION_GUIDE.md`
- **Technical Docs:** `ESP32_WOKWI_LEVEL_SIMULATION.md`
- **Examples:** `examples/` folder

---

**Happy Coding! 🎉**
