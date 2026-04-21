# ESP32 and Arduino Simulation Process Summary

## Overview
The LeapForge simulation system supports both **Arduino (AVR)** and **ESP32** microcontrollers with two distinct simulation approaches:

1. **AVR Simulation**: Cycle-accurate hardware emulation using avr8js
2. **ESP32 Simulation**: Dual-mode system with QEMU-based binary execution and sketch-aware stub mode

---

## Arduino (AVR) Simulation Process

### Architecture Components

#### 1. **SimulationRunner** (`src/modules/leapforge/engine/SimulationRunner.ts`)
- **Core Engine**: Wraps avr8js WASM binary for cycle-accurate AVR emulation
- **Supported Boards**: Arduino Uno, Nano, Mega, ATtiny85
- **Frequency**: 16MHz clock simulation
- **Execution Model**: requestAnimationFrame loop executing ~160,000 instructions per frame

#### 2. **Key Features**
```typescript
// Pin state management
setPinState(pinId: string, state: 'HIGH' | 'LOW' | 'FLOATING')
getPinState(pinId: string): PinState

// Analog input injection (0-5V)
setAnalogInput(channel: number, voltage: number)

// Event scheduling (cycle-accurate)
scheduleEvent(cyclesInFuture: number, callback: () => void)
scheduleAt(absoluteCycles: number, callback: () => void)
```

#### 3. **Peripheral Emulation**
- **USART**: Serial communication via USARTEmulator
- **ADC**: 6-channel analog-to-digital converter (A0-A5)
- **TWI/I2C**: Hardware I2C bus with slave device support
- **SPI**: Hardware SPI bus for displays (ILI9341)
- **Timers**: AVRTimer for PWM and timing
- **EEPROM**: Persistent storage emulation

### Compilation Flow

#### 1. **Sketch Compilation** (`src/upload/ArduinoUploader.ts`)
```bash
arduino-cli compile --fqbn arduino:avr:uno \
  --export-binaries \
  --libraries forge-lib/libraries \
  sketch_dir
```

#### 2. **Output**: Intel HEX file
- Parsed by `parseHexString()` in `HexParser.ts`
- Loaded into avr8js CPU memory
- Executed instruction-by-instruction

#### 3. **Execution Loop**
```typescript
// SimulationRunner.tick()
const cyclesToRun = Math.floor(elapsedMs * (frequency / 1000));
while (cpu.cycles - startCycles < cyclesToRun) {
  avrInstruction(cpu);  // Execute one AVR instruction
  cpu.tick();           // Advance CPU state
  
  // Process scheduled peripheral events
  while (scheduledEvents[0].targetCycles <= cpu.cycles) {
    scheduledEvents.shift().callback();
  }
}
```

---

## ESP32 Simulation Process

### Dual-Mode Architecture

The ESP32 simulation system operates in **two modes** depending on QEMU availability:

#### **Mode 1: QEMU Binary Execution** (Full Hardware Emulation)
- **When**: QEMU ESP32 WASM binary is available
- **How**: Executes compiled `.bin` firmware in QEMU Xtensa emulator
- **Accuracy**: Cycle-accurate hardware simulation
- **Limitations**: QEMU binary not yet integrated (falls back to stub mode)

#### **Mode 2: Sketch-Aware Stub Mode** (Source-Level Interpretation)
- **When**: QEMU unavailable (current default)
- **How**: Parses sketch source and replays actions with real timing
- **Accuracy**: Functional simulation without cycle-level precision
- **Advantage**: Works without binary compilation, instant feedback

---

### ESP32 Stub Mode Implementation

#### 1. **ESP32Engine** (`src/modules/leapforge/engine/esp32/ESP32Engine.ts`)

**Core Concept**: Parse the Arduino sketch source code and extract high-level actions (digitalWrite, Serial.print, WiFi.begin) then replay them with accurate timing.

#### 2. **Sketch Parsing Pipeline**

##### **Step 1: Constant Resolution**
```typescript
// Extract #define and const declarations
#define LED_PIN 13
const int DELAY_MS = 1000;

// Build defines map: { LED_PIN: 13, DELAY_MS: 1000 }
```

##### **Step 2: Array Declaration Parsing**
```typescript
// Parse array literals for 7-segment displays, LED matrices
int leds[] = {13, 12, 14, 27};
// → arrays.set('leds', [13, 12, 14, 27])
```

##### **Step 3: For-Loop Expansion**
```typescript
// Unroll loops at parse time
for (int i = 0; i < 8; i++) {
  digitalWrite(leds[i], HIGH);
}

// → Expands to:
digitalWrite(13, HIGH);
digitalWrite(12, HIGH);
digitalWrite(14, HIGH);
// ... etc
```

##### **Step 4: Function Inlining**
```typescript
// Extract user-defined functions
void colorWipe(uint32_t color, int wait) {
  for(int i=0; i<strip.numPixels(); i++) {
    strip.setPixelColor(i, color);
    strip.show();
    delay(wait);
  }
}

// Inline calls with argument substitution
colorWipe(strip.Color(255, 0, 0), 50);
// → Replaces with function body, substituting parameters
```

##### **Step 5: Action Extraction**
```typescript
// Parse into structured actions
parseActions(body: string): Action[]

// Supported action types:
- digitalWrite(pin, HIGH/LOW)
- Serial.print/println(text)
- analogRead(pin) / digitalRead(pin)
- delay(ms)
- servo.write(angle)
- strip.setPixelColor(i, r, g, b)
- lcd.print(text) / lcd.setCursor(col, row)
- stepper.step(steps)
- tone(pin, freq) / noTone(pin)
- DHT readTemperature/readHumidity
```

#### 3. **Execution Model**

##### **Setup Phase**
```typescript
// Execute setup() actions once with cumulative delays
const setupActions = parseActions(extractBody('setup'));
let setupDelay = 0;

for (const action of setupActions) {
  if (action.type === 'delay') {
    setupDelay += action.ms;
  } else {
    setTimeout(() => execAction(action), setupDelay);
  }
}
```

##### **Loop Phase**
```typescript
// Schedule loop() actions with precise timing
const loopActions = parseActions(extractBody('loop'));
let totalMs = 0;
const schedule: { offsetMs: number; action: Action }[] = [];

for (const action of loopActions) {
  schedule.push({ offsetMs: totalMs, action });
  if (action.type === 'delay') totalMs += action.ms;
}

// Execute one action per tick (8ms interval)
// Restart loop after totalMs duration
```

#### 4. **GPIO Monitor Injection**

**Problem**: How does the stub mode detect GPIO state changes?

**Solution**: Inject a wrapper function that logs every digitalWrite call:

```cpp
// Auto-injected by esp32Compiler.js before compilation
static void __lf_digitalWrite(uint8_t pin, uint8_t val) {
  digitalWrite(pin, val);
  Serial.printf("__LF_GPIO:%d:%d\n", pin, (int)val);
}
#define digitalWrite(p,v) __lf_digitalWrite((p),(v))
```

**Wire Format**: `__LF_GPIO:<pin>:<value>\n`
- Example: `__LF_GPIO:13:1` → GPIO 13 went HIGH
- Parsed by `ESP32SimulationRunner.parseSerialLine()`

---

### ESP32 Compilation Flow

#### 1. **Sketch Preprocessing** (`src/upload/ArduinoUploader.ts`)

##### **API Migration: LEDC v2 → v3**
```typescript
// ESP32 core v3 removed ledcSetup/ledcAttachPin
// Old API (v2):
ledcSetup(channel, freq, resolution);
ledcAttachPin(pin, channel);
ledcWrite(channel, duty);

// New API (v3):
ledcAttach(pin, freq, resolution);
ledcWrite(pin, duty);

// Auto-migration algorithm:
migrateESP32LedcAPI(code: string): string
```

##### **Library Substitution**
```typescript
// Replace AVR-only libraries with ESP32 equivalents
#include <Servo.h>  →  #include <ESP32Servo.h>
```

#### 2. **Compilation**
```bash
arduino-cli compile --fqbn espressif:esp32:esp32 \
  --export-binaries \
  --build-path temp_dir \
  sketch_dir
```

#### 3. **Output Handling**
- **AVR**: `.hex` file (Intel HEX format)
- **ESP32**: `.bin` file (raw binary)
  - Converted to Intel HEX via `binToIntelHex()` for parser compatibility

---

## Circuit Integration (CircuitEngine)

### Unified Pin Mapping

#### **AVR Pin Conversion**
```typescript
convertArduinoPin(pin: number | string): PinMapping
// D0-D7  → PD0-PD7
// D8-D13 → PB0-PB5
// A0-A5  → PC0-PC5 (with ADC channel)
```

#### **ESP32 Pin Conversion**
```typescript
convertESP32Pin(label: string): PinMapping
// Supports:
// - Digital: D0, D2, D4, D5, D12-D15, D18-D23
// - Analog: A0-A7, VP, VN (with ADC channel)
// - Serial: RX0, TX0, RX2, TX2
// - Power: 3V3, VIN, GND (returns null)

// Example:
convertESP32Pin('A0')  → { avrPin: 'ESP36', adcChannel: 0 }
convertESP32Pin('D13') → { avrPin: 'ESP13' }
```

### Signal Propagation

#### **Output Path** (Board → Peripheral)
```typescript
// 1. AVR/ESP32 drives pin HIGH/LOW
// 2. SimulationRunner.setPinState() updates state map
// 3. CircuitEngine listener fires
// 4. traceNet() finds connected peripherals
// 5. Update peripheral node data (LED brightness, buzzer state, etc.)
```

#### **Input Path** (Peripheral → Board)
```typescript
// 1. User interacts with sensor (button press, slider change)
// 2. CircuitEngine.pushInputSignal() called
// 3. Find wire connecting sensor to board
// 4. Convert board pin to AVR/ESP32 format
// 5. Inject signal:
//    - AVR: simulationRunner.setVirtualInput(avrPin, isHigh)
//    - ESP32: esp32Runner.setAnalogInput(channel, voltage)
```

### Peripheral Emulation Examples

#### **LCD Display (HD44780)**
```typescript
// Parallel mode: E, RS, D4-D7 pins
// I2C mode: PCF8574 backpack at 0x27
// Emulator: HD44780.ts
// Updates: lcdState { characters[], cursorX, cursorY, backlight }
```

#### **NeoPixel (WS2812B)**
```typescript
// Protocol: 800kHz data stream, 1.25µs per bit
// Emulator: NeoPixelEmulator.ts
// Uses RAW listener (no deduplication) to capture every edge
// Decodes RGB data from timing: T0H=0.4µs, T1H=0.8µs
```

#### **Stepper Motor**
```typescript
// 4-wire mode: A+, B+, A-, B-
// STEP/DIR mode: via A4988 driver
// Emulator: StepperEmulator.ts
// Tracks: angle, stepCount, energized state
```

#### **DHT22 Temperature/Humidity**
```typescript
// Protocol: 40-bit data packet, 1-wire interface
// Emulator: DHT.ts
// Reads sensorValues from store (slider-controlled)
// Injects response timing into SimulationRunner
```

---

## Key Differences: AVR vs ESP32

| Feature | AVR (Arduino) | ESP32 |
|---------|---------------|-------|
| **Execution** | Cycle-accurate WASM (avr8js) | Stub mode (source parsing) or QEMU |
| **Compilation** | `.hex` file | `.bin` file |
| **Clock Speed** | 16 MHz | 240 MHz (not cycle-accurate in stub) |
| **Pin Voltage** | 5V logic | 3.3V logic |
| **ADC Resolution** | 10-bit (0-1023) | 12-bit (0-4095) |
| **ADC Reference** | 5V | 3.3V |
| **Pin Mapping** | Port-based (PB5, PD3) | GPIO number (ESP13, ESP36) |
| **Serial Monitor** | USART hardware emulation | Stub mode: direct emit, QEMU: UART |
| **WiFi** | Not supported | NetworkBridge emulation |
| **Timing Accuracy** | Cycle-perfect | Action-level (ms granularity) |

---

## Simulation Lifecycle

### 1. **Initialization**
```typescript
// User clicks "Start Simulation"
1. CircuitEngine.init()
2. SimulationRunner.initCPU(hexString)
   - AVR: Load HEX into avr8js CPU
   - ESP32: Create ESP32Engine with sketch source
3. CircuitEngine.syncCircuitGraph()
   - Wire board pins to peripheral listeners
   - Register I2C/SPI slaves
   - Initialize emulators (LCD, DHT, NeoPixel, etc.)
```

### 2. **Execution**
```typescript
// AVR Path
SimulationRunner.start()
  → requestAnimationFrame loop
    → tick() executes ~160k AVR instructions
      → Port writes trigger listeners
        → CircuitEngine updates peripheral UI

// ESP32 Path (Stub Mode)
ESP32Engine.start()
  → SketchStub.start()
    → Parse setup() and loop()
      → Schedule actions with delays
        → execAction() drives pins via setESP32Pin()
          → SimulationRunner.setPinState()
            → CircuitEngine listeners fire
```

### 3. **Peripheral Interaction**
```typescript
// Example: Button Press
1. User clicks button element
2. Button.tsx calls pushInputSignal(nodeId, 'OUT', true)
3. CircuitEngine.pushInputSignal()
   - Find wire to board
   - Convert pin (e.g., 'D2' → 'PD2' or 'ESP2')
   - Inject: simulationRunner.setVirtualInput('PD2', true)
4. AVR sketch's digitalRead(2) now returns HIGH
```

### 4. **Cleanup**
```typescript
// User clicks "Stop Simulation"
1. SimulationRunner.stop()
   - Cancel requestAnimationFrame
   - Float all pins (set to FLOATING)
2. CircuitEngine.syncCircuitGraph()
   - Unsubscribe all listeners
   - Clear emulator instances
   - Reset node states
```

---

## Advanced Features

### 1. **Analog Sensor Voltage Computation**
```typescript
computeSensorVoltage(type: string, sensorValues: any, vref: number): number
// Examples:
// - NTC Temperature: Steinhart-Hart equation
// - Photoresistor: Voltage divider with 10kΩ
// - Gas Sensor: Linear 0-5V mapping
// - Heart Rate: PulseSensor.com ADC model (512 baseline, 750-900 peak)
```

### 2. **I2C Bus Emulation**
```typescript
// I2CBusManager.ts
- Manages multiple I2C slave devices
- Address-based routing (0x27 for LCD, 0x3C for OLED, 0x68 for MPU6050)
- Handles START, STOP, ACK/NACK, data transfer
- Slaves: PCF8574, SSD1306, MPU6050
```

### 3. **SPI Display Emulation**
```typescript
// ILI9341SPISlave.ts
- 240x320 TFT display
- Command/data mode via D/C pin
- Chip select via CS pin (active-LOW)
- Renders to ImageData for React canvas
```

### 4. **Network Emulation (ESP32)**
```typescript
// NetworkBridge.ts
- Simulates WiFi.begin(), WiFi.status()
- Assigns virtual IP (192.168.1.100)
- Intercepts ROM calls for network stack
- HTTP client simulation (fetch API proxy)
```

---

## Performance Optimizations

### 1. **Deduplication**
```typescript
// Only update UI when pin state actually changes
if (currentState === newState) return;
```

### 2. **Batched Updates**
```typescript
// Use requestAnimationFrame to batch React updates
let pending = null;
let rafScheduled = false;
if (!rafScheduled) {
  rafScheduled = true;
  requestAnimationFrame(() => {
    updateNodeData(nodeId, pending);
    rafScheduled = false;
  });
}
```

### 3. **Cycle Budget**
```typescript
// Cap AVR execution to 160k instructions per frame (~10ms)
// Prevents blocking React's render loop
if (executedInstructions >= 160_000) break;
```

### 4. **Lazy Emulator Creation**
```typescript
// Only create emulators when peripherals are wired
if (!this.dhtEmulators.has(peripheralId)) {
  this.dhtEmulators.set(peripheralId, new DHT(...));
}
```

---

## Error Handling

### 1. **Compilation Errors**
```typescript
// ArduinoUploader.compileForSimulation()
try {
  await execAsync(compileCmd);
} catch (compileError) {
  return { success: false, error: compileError.stderr };
}
```

### 2. **Runtime Crashes**
```typescript
// SimulationRunner.tick()
try {
  avrInstruction(cpu);
} catch (e) {
  console.error("[FORGE ENGINE] AVR CPU CRASHED:", e);
  this.stop();
}
```

### 3. **Pin Mapping Failures**
```typescript
// CircuitEngine.syncCircuitGraph()
const mapping = simulationRunner.convertPin(pinLabel, isESP32);
if (!mapping) {
  console.warn(`Unknown pin: ${pinLabel}`);
  return; // Skip this wire
}
```

---

## Future Enhancements

### 1. **QEMU Integration**
- Full ESP32 binary execution
- Cycle-accurate timing
- Real WiFi/Bluetooth stack
- FreeRTOS task scheduling

### 2. **Multi-Core Support**
- ESP32 dual-core simulation
- Task pinning to cores
- Inter-core communication

### 3. **Power Analysis**
- Current consumption tracking
- Battery life estimation
- Sleep mode simulation

### 4. **Debugging Tools**
- Breakpoints in sketch code
- Variable inspection
- Memory viewer
- Call stack traces

---

## Summary

The LeapForge simulation system provides:

1. **AVR**: Cycle-accurate hardware emulation via avr8js WASM
2. **ESP32**: Sketch-aware stub mode with source parsing and action replay
3. **Unified Circuit Integration**: Single CircuitEngine for both platforms
4. **Rich Peripheral Support**: 20+ sensor/actuator types with accurate physics
5. **Real-Time Feedback**: Sub-10ms latency from code change to visual update
6. **Production-Ready**: Handles complex sketches with loops, functions, arrays, and timing

The dual-mode architecture ensures users get instant feedback (stub mode) while maintaining a path to full hardware accuracy (QEMU mode) as the platform evolves.
