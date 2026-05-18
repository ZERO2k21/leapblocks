# ESP32-C3 Simulation Quick Reference

## 🎯 Quick Start

### Compile & Run
```typescript
// 1. User writes code in ForgeStudio
// 2. Click "Run" button
// 3. Code compiles → .bin firmware
// 4. Firmware loads → emulator
// 5. Simulation starts
```

### Key Files
```
ESP32C3SimulationRunner.ts  → Main simulation manager
RiscVCore.ts                → CPU emulator (RV32IMC)
FirmwareLoader.ts           → Loads .bin into memory
GPIO.ts, UART.ts, etc.      → Peripheral emulators
```

## 📋 Memory Map

| Region | Address Range | Size | Access | Purpose |
|--------|--------------|------|--------|---------|
| IRAM | 0x40380000 - 0x403DFFFF | 384 KB | READ-ONLY | Instructions |
| DRAM | 0x3FC80000 - 0x3FCDFFFF | 384 KB | WRITABLE | Data |
| IROM | 0x42000000 - 0x42BFFFFF | 12 MB | READ-ONLY | Flash code |
| DROM | 0x3C000000 - 0x3CBFFFFF | 12 MB | READ-ONLY | Flash data |
| MMIO | 0x60000000 - 0x6002FFFF | 192 KB | R/W | Peripherals |
| ROM | 0x40000000 - 0x4037FFFF | 3.5 MB | READ-ONLY | Boot ROM |

## 🔧 Key APIs

### ESP32C3SimulationRunner
```typescript
// Initialize with firmware
await runner.init(firmwareBytes, entryPoint);

// Start simulation
runner.run();

// Stop simulation
runner.stop();

// Pin control
runner.setPinState("ESP2", "HIGH");
const state = runner.getPinState("ESP2");

// Inject input (button, sensor)
runner.injectInput("ESP4", true, false); // digital
runner.injectInput("ESP0", 2048, true);  // analog (0-4095)

// Serial output
runner.addSerialListener((line) => {
  console.log("Serial:", line);
});
```

### RiscVCore
```typescript
// Execute instructions
const cyclesRun = core.runCycles(266666);

// Memory access
const value = core.memRead32(0x40380000);
core.memWrite32(0x3FC80000, 0x12345678);

// Register access
const pc = core.pc;
const sp = core.regs[2];
const ra = core.regs[1];

// Reset
core.reset(entryPoint);
```

### GPIO
```typescript
// Set output
gpio.setOutput(2, true);  // GPIO2 = HIGH

// Set input
gpio.setInput(4, true);   // GPIO4 = HIGH (button pressed)

// Set analog
gpio.setAnalog(0, 2048);  // GPIO0 = 1.65V (12-bit: 0-4095)

// Listen for changes
gpio.onPinChange((gpio, value, isAnalog) => {
  console.log(`GPIO${gpio} changed to ${value}`);
});
```

### UART
```typescript
// Write byte
uart.write(0x41); // 'A'

// Read byte
const byte = uart.read();

// Listen for output
uart.onSerialOutput((line) => {
  console.log("Serial:", line);
});
```

## 🎮 Simulation Loop

```typescript
// Runs at 60 FPS
function executeTick() {
  // 1. Execute CPU cycles
  const cycles = core.runCycles(266666); // ~16 MHz
  
  // 2. Update timer
  sysTimer.cpuCycles += cycles;
  sysTimer.tick();
  
  // 3. Check GPIO changes
  // (handled by GPIO.onPinChange callbacks)
  
  // 4. Check serial output
  // (handled by UART.onSerialOutput callbacks)
  
  // 5. Schedule next frame
  requestAnimationFrame(executeTick);
}
```

## 🔍 Debugging

### Check Firmware Loading
```typescript
console.log(`Entry point: 0x${entryPoint.toString(16)}`);
console.log(`Segments loaded: ${segmentsLoaded}`);
console.log(`Total bytes: ${totalBytes}`);
```

### Check Memory Integrity
```typescript
const insn = core.memRead32(0x40386b86);
console.log(`Instruction at 0x40386b86: 0x${insn.toString(16)}`);
// Should NOT be 0x0 (illegal instruction)
```

### Dump Registers
```typescript
runner.dumpRegisters();
// Outputs all 32 registers + PC
```

### Check CPU State
```typescript
const state = runner.cpuState;
console.log(`PC: 0x${state.pc.toString(16)}`);
console.log(`SP: 0x${state.regs[2].toString(16)}`);
console.log(`Cycles: ${state.cycles}`);
console.log(`Halted: ${state.halted}`);
```

## 🐛 Common Issues

### Illegal Instruction 0x0
```
Cause: IRAM corruption (firmware writing to instruction memory)
Fix: IRAM is now read-only ✅
```

### Compilation Errors
```
Cause: ESP32 core 3.3.8 USB CDC linker bug
Fix: Added USB CDC build flags ✅
```

### No Serial Output
```
Cause: Serial.begin() not called
Fix: Add Serial.begin(115200) in setup()
```

### Stuck at Same PC
```
Cause: Infinite loop or waiting for interrupt
Fix: Check if code is waiting for input
```

### GPIO Not Updating
```
Cause: Pin not configured as output
Fix: Add pinMode(pin, OUTPUT) in setup()
```

## 📊 Performance

| Metric | Value |
|--------|-------|
| CPU Speed | ~16 MHz (1/10th of real 160 MHz) |
| Cycles/Frame | 266,666 (at 60 FPS) |
| Instructions/Sec | ~16 million |
| GPIO Latency | <16ms (next frame) |
| Serial Latency | <16ms (next frame) |

## 🎯 Supported Features

### ✅ Working
- Digital GPIO (input/output)
- Analog input (ADC, 12-bit)
- PWM output (via analogWrite)
- Serial communication (UART)
- I2C bus (OLED, LCD)
- SPI bus (TFT displays)
- System timer
- Interrupts
- Circuit integration

### ❌ Not Supported
- WiFi
- Bluetooth
- Flash filesystem
- USB
- CAN bus
- Touch sensors
- RTC

## 📝 Example Code

### Blink LED
```cpp
void setup() {
  Serial.begin(115200);
  pinMode(2, OUTPUT);
}

void loop() {
  digitalWrite(2, HIGH);
  Serial.println("LED ON");
  delay(1000);
  
  digitalWrite(2, LOW);
  Serial.println("LED OFF");
  delay(1000);
}
```

### Read Button
```cpp
void setup() {
  Serial.begin(115200);
  pinMode(4, INPUT_PULLUP);
  pinMode(2, OUTPUT);
}

void loop() {
  if (digitalRead(4) == LOW) {
    digitalWrite(2, HIGH);
    Serial.println("Button pressed!");
  } else {
    digitalWrite(2, LOW);
  }
  delay(100);
}
```

### Read Analog
```cpp
void setup() {
  Serial.begin(115200);
  pinMode(0, INPUT);
}

void loop() {
  int value = analogRead(0); // 0-4095
  Serial.print("Analog: ");
  Serial.println(value);
  delay(500);
}
```

### I2C OLED
```cpp
#include <Wire.h>
#include <Adafruit_SSD1306.h>

Adafruit_SSD1306 display(128, 64, &Wire, -1);

void setup() {
  Serial.begin(115200);
  Wire.begin();
  
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("OLED init failed");
    return;
  }
  
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("Hello ESP32!");
  display.display();
}

void loop() {
  // Update display
}
```

## 🔗 Related Files

- `ESP32_SIMULATION_ARCHITECTURE.md` - Full architecture overview
- `ESP32_FIXES_SUMMARY.md` - Recent fixes applied
- `ESP32_COMPILATION_FIX.md` - Compilation issue details

---

**Quick Tip**: Use `runner.dumpRegisters()` to debug CPU state!
