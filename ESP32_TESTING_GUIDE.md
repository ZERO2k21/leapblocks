# ESP32-C3 RISC-V Emulator Testing Guide

## Quick Test Checklist

### 1. Basic Blink Test (GPIO)
```cpp
void setup() {
  pinMode(2, OUTPUT);
}

void loop() {
  digitalWrite(2, HIGH);
  delay(500);
  digitalWrite(2, LOW);
  delay(500);
}
```

**Expected Result:**
- ✅ LED on GPIO2 blinks at 500ms intervals
- ✅ No console errors
- ✅ Serial monitor shows no errors

### 2. Analog Read Test (ADC)
```cpp
void setup() {
  Serial.begin(115200);
  pinMode(0, INPUT);
}

void loop() {
  int value = analogRead(0);
  Serial.print("ADC Value: ");
  Serial.println(value);
  delay(1000);
}
```

**Expected Result:**
- ✅ Serial monitor shows ADC values (0-4095)
- ✅ Values change when potentiometer is adjusted
- ✅ No "ADC not implemented" errors

### 3. Serial Output Test (UART)
```cpp
void setup() {
  Serial.begin(115200);
}

void loop() {
  Serial.println("Hello from ESP32-C3!");
  delay(1000);
}
```

**Expected Result:**
- ✅ Serial monitor shows "Hello from ESP32-C3!" every second
- ✅ No garbled output
- ✅ Timing is consistent

### 4. PWM Test (LED Fade)
```cpp
void setup() {
  pinMode(2, OUTPUT);
}

void loop() {
  for (int i = 0; i <= 255; i++) {
    analogWrite(2, i);
    delay(10);
  }
  for (int i = 255; i >= 0; i--) {
    analogWrite(2, i);
    delay(10);
  }
}
```

**Expected Result:**
- ✅ LED fades in and out smoothly
- ✅ No flickering
- ✅ Brightness changes are visible

### 5. Multiple GPIO Test
```cpp
void setup() {
  pinMode(2, OUTPUT);
  pinMode(4, OUTPUT);
  pinMode(5, OUTPUT);
}

void loop() {
  digitalWrite(2, HIGH);
  digitalWrite(4, LOW);
  digitalWrite(5, LOW);
  delay(500);
  
  digitalWrite(2, LOW);
  digitalWrite(4, HIGH);
  digitalWrite(5, LOW);
  delay(500);
  
  digitalWrite(2, LOW);
  digitalWrite(4, LOW);
  digitalWrite(5, HIGH);
  delay(500);
}
```

**Expected Result:**
- ✅ LEDs light up in sequence
- ✅ Only one LED is on at a time
- ✅ Timing is correct

## Advanced Tests

### 6. I2C OLED Test (SSD1306)
```cpp
#include <Wire.h>
#include <Adafruit_SSD1306.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

void setup() {
  Wire.begin();
  if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("SSD1306 allocation failed");
    for(;;);
  }
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0,0);
  display.println("Hello ESP32-C3!");
  display.display();
}

void loop() {}
```

**Expected Result:**
- ✅ OLED displays "Hello ESP32-C3!"
- ✅ No I2C errors
- ✅ Display updates correctly

### 7. SPI TFT Test (ILI9341)
```cpp
#include <SPI.h>
#include <Adafruit_ILI9341.h>

#define TFT_CS   10
#define TFT_DC   9
#define TFT_RST  8

Adafruit_ILI9341 tft = Adafruit_ILI9341(TFT_CS, TFT_DC, TFT_RST);

void setup() {
  tft.begin();
  tft.fillScreen(ILI9341_BLACK);
  tft.setCursor(0, 0);
  tft.setTextColor(ILI9341_WHITE);
  tft.setTextSize(2);
  tft.println("ESP32-C3 TFT Test");
}

void loop() {}
```

**Expected Result:**
- ✅ TFT displays text
- ✅ No SPI errors
- ✅ Screen updates correctly

## Debugging

### Console Logs to Check

#### Successful Initialization
```
[ESP32-C3] Initialized: X segments, entry=0x40380000, XXXXX bytes loaded
[FORGE] ESP32-C3 runner started, binPath: ...
```

#### GPIO Activity
```
[ESP32-C3] GPIO2 = HIGH
[ESP32-C3] GPIO2 = LOW
[CIRCUIT LED] Setting LED brightness to 1, value to true
[CIRCUIT LED] Setting LED brightness to 0, value to false
```

#### Serial Output
```
[ESP32-C3] UART0 TX: Hello from ESP32-C3!
```

### Common Issues

#### Issue: LED not blinking
**Check:**
- ✅ Is the LED connected to the correct GPIO?
- ✅ Is the wire properly connected in the circuit?
- ✅ Check console for GPIO activity logs

#### Issue: No serial output
**Check:**
- ✅ Is Serial.begin() called in setup()?
- ✅ Check console for UART TX logs
- ✅ Verify serial monitor is open

#### Issue: ADC always returns 0
**Check:**
- ✅ Is the sensor connected to an ADC-capable pin (GPIO 0-4)?
- ✅ Is the sensor properly wired?
- ✅ Check console for ADC read logs

#### Issue: I2C device not found
**Check:**
- ✅ Is Wire.begin() called?
- ✅ Is the I2C address correct (usually 0x3C for OLED)?
- ✅ Are SDA/SCL pins connected correctly?

## Performance Monitoring

### Check CPU Cycles
Open browser console and run:
```javascript
// Get current CPU state
const state = simulationRunner.ESP32C3Runner?.cpuState;
console.log('PC:', state.pc.toString(16));
console.log('Cycles:', state.cycles);
console.log('Halted:', state.halted);
```

### Check Register Dump
```javascript
simulationRunner.ESP32C3Runner?.dumpRegisters();
```

### Monitor Frame Rate
```javascript
let lastCycles = 0;
setInterval(() => {
  const state = simulationRunner.ESP32C3Runner?.cpuState;
  if (state) {
    const delta = state.cycles - lastCycles;
    console.log('Cycles/sec:', delta);
    lastCycles = state.cycles;
  }
}, 1000);
```

## Comparison: Old vs New

### Old Firmware-Scan Approach
```
[ESP32-C3] Firmware scanned: 2 GPIO/PWM events found
[ESP32-C3] replayTimeline() called, 2 events to replay
[ESP32-C3] Setting pin ESP2 = HIGH
[ESP32-C3] Setting pin ESP2 = LOW
```

### New RISC-V Emulator
```
[ESP32-C3] Initialized: 3 segments, entry=0x40380000, 45678 bytes loaded
[ESP32-C3] GPIO2 OUT = 1 (MMIO write to 0x60004004)
[ESP32-C3] GPIO2 OUT = 0 (MMIO write to 0x60004004)
[ESP32-C3] UART0 TX FIFO: Hello from ESP32-C3!
[ESP32-C3] ADC1 CH0 read: 2048 (MMIO read from 0x60040044)
```

## Success Criteria

### ✅ Basic Functionality
- [ ] LED blinks correctly
- [ ] Serial output works
- [ ] Timing is accurate (±1 frame = ±1.67ms)

### ✅ Advanced Functionality
- [ ] analogRead() returns correct values
- [ ] PWM fading works smoothly
- [ ] Multiple GPIOs work independently

### ✅ Peripheral Support
- [ ] I2C devices communicate correctly
- [ ] SPI devices work
- [ ] UART TX/RX functional

### ✅ Performance
- [ ] No lag or stuttering
- [ ] CPU cycles advancing
- [ ] Frame rate stable at 60 FPS

### ✅ Compatibility
- [ ] Existing sketches work without modification
- [ ] No console errors
- [ ] CircuitEngine integration working

## Troubleshooting Commands

### Restart Simulation
```javascript
simulationRunner.reset();
simulationRunner.start();
```

### Check if Running
```javascript
console.log('Running:', simulationRunner.ESP32C3Runner?.isRunning);
```

### Inject Test Input
```javascript
// Digital input
simulationRunner.ESP32C3Runner?.injectInput('ESP0', true, false);

// Analog input (12-bit: 0-4095)
simulationRunner.ESP32C3Runner?.injectInput('ESP0', 2048, true);
```

### Monitor Pin State
```javascript
simulationRunner.ESP32C3Runner?.addPinListener('ESP2', (pin, state) => {
  console.log(`Pin ${pin} changed to ${state}`);
});
```

## Next Steps After Testing

1. **If all tests pass**: Document any performance characteristics
2. **If tests fail**: Check console logs and compare with expected behavior
3. **Report issues**: Include console logs, sketch code, and circuit diagram
4. **Optimize**: Adjust CYCLES_PER_FRAME if needed for better performance

---

**Remember**: The new emulator is cycle-accurate, so timing should be very close to real hardware. Any significant deviations should be investigated.
