# LeapBlocks Simulation Architecture

## Overview

LeapBlocks supports two distinct simulation architectures for running Arduino sketches in the browser:

1. **AVR Simulation** - Cycle-accurate AVR8 emulation for Arduino boards
2. **ESP32-C3 RISC-V Simulation** - Firmware-scan based simulation for ESP32 boards

Both architectures share the same **CircuitEngine** for peripheral emulation (LEDs, sensors, displays, etc.) but use different execution engines.

---

## Architecture Comparison

| Feature | AVR Simulation | ESP32-C3 RISC-V Simulation |
|---------|---------------|---------------------------|
| **Execution** | Cycle-accurate AVR8 emulator | Firmware-scan replay |
| **Boards** | Arduino Uno, Nano, Mega, ATtiny85 | ESP32, ESP32 DevKit V1, ESP32-C3 |
| **Compiler Output** | Intel HEX (.hex) | Binary (.bin) |
| **Execution Speed** | Real-time (16 MHz emulated) | Timeline replay (500ms intervals) |
| **Peripheral Support** | Full hardware emulation | GPIO monitor injection |
| **Serial Output** | USART hardware emulation | GPIO monitor strings |
| **Accuracy** | Cycle-accurate | Functional (loop-level) |

---

## AVR Simulation Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                      AVR Simulation Stack                    │
├─────────────────────────────────────────────────────────────┤
│  ForgeStudio.tsx                                            │
│    ↓ (compile Arduino sketch)                               │
│  CompilerService → arduino-cli → .hex file                  │
│    ↓ (start simulation)                                     │
│  SimulationRunner.ts                                        │
│    ↓ (initialize AVR CPU)                                   │
│  avr8js Library                                             │
│    ├─ CPU (ATmega328P/ATmega2560/ATtiny85)                 │
│    ├─ AVRIOPort (PORTB, PORTC, PORTD)                      │
│    ├─ AVRTimer (Timer0, Timer1, Timer2)                    │
│    ├─ AVRUSART (Serial communication)                      │
│    ├─ AVRADC (Analog-to-digital converter)                 │
│    ├─ AVRTWI (I2C/TWI bus)                                 │
│    ├─ AVRSPI (SPI bus)                                     │
│    └─ AVREEPROM (EEPROM storage)                           │
│    ↓ (pin state changes)                                    │
│  CircuitEngine.ts                                           │
│    ↓ (update peripherals)                                   │
│  LED, Buzzer, LCD, Sensors, etc.                           │
└─────────────────────────────────────────────────────────────┘
```

### Execution Flow

1. **Compilation**
   - User writes Arduino sketch in Monaco editor
   - `arduino-cli compile` generates Intel HEX file
   - HEX file contains AVR machine code

2. **Initialization**
   - `SimulationRunner.initCPU()` parses HEX file
   - Creates AVR CPU instance (ATmega328P/ATmega2560/ATtiny85)
   - Attaches hardware peripherals (USART, ADC, TWI, SPI, Timers)
   - Registers port listeners for GPIO changes

3. **Execution Loop**
   - `requestAnimationFrame` drives the simulation at 60 FPS
   - Each frame executes ~160,000 AVR instructions (~10ms of AVR time)
   - Port changes trigger `pushPortState()` → `setPinState()` → listeners
   - Listeners update CircuitEngine → peripheral visual updates

4. **Pin State Propagation**
   ```
   AVR Port Write (e.g., PORTB = 0xFF)
     ↓
   AVRIOPort.addListener() fires
     ↓
   SimulationRunner.pushPortState('B', 0xFF)
     ↓
   SimulationRunner.setPinState('PB5', 'HIGH')
     ↓
   CircuitEngine listener fires
     ↓
   LED.brightness = 1.0, LED.value = true
     ↓
   LED glows in UI
   ```

### Supported Features

- ✅ Cycle-accurate timing (delays, PWM, timers)
- ✅ Serial communication (USART)
- ✅ Analog input (ADC with 10-bit resolution)
- ✅ I2C/TWI communication (LCD, OLED, sensors)
- ✅ SPI communication (TFT displays)
- ✅ EEPROM read/write
- ✅ Interrupts and timers
- ✅ PWM output (analogWrite)
- ✅ All Arduino core functions

### Board Support

| Board | MCU | Flash | RAM | EEPROM | Frequency |
|-------|-----|-------|-----|--------|-----------|
| Arduino Uno | ATmega328P | 32 KB | 2 KB | 1 KB | 16 MHz |
| Arduino Nano | ATmega328P | 32 KB | 2 KB | 1 KB | 16 MHz |
| Arduino Mega | ATmega2560 | 256 KB | 8 KB | 4 KB | 16 MHz |
| ATtiny85 | ATtiny85 | 8 KB | 512 B | 512 B | 8 MHz |

---

## ESP32-C3 RISC-V Simulation Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                   ESP32-C3 Simulation Stack                  │
├─────────────────────────────────────────────────────────────┤
│  ForgeStudio.tsx                                            │
│    ↓ (compile ESP32 sketch)                                 │
│  src/index.ts (main process)                                │
│    ├─ Inject GPIO monitor header                            │
│    ├─ arduino-cli compile → .bin file                       │
│    └─ Merge bootloader + partitions + app → flash image     │
│    ↓ (start simulation)                                     │
│  SimulationRunner.ts                                        │
│    ↓ (detect ESP32-C3 board)                                │
│  ESP32C3SimulationRunner.ts                                 │
│    ├─ Load .bin via IPC (readBinFile)                      │
│    ├─ Scan binary for __LF_GPIO strings                    │
│    ├─ Build GPIO timeline                                   │
│    └─ Replay timeline at 500ms intervals                    │
│    ↓ (GPIO events)                                          │
│  SimulationRunner.setPinState('ESP2', 'HIGH')              │
│    ↓ (notify listeners)                                     │
│  CircuitEngine.ts                                           │
│    ↓ (update peripherals)                                   │
│  LED, Buzzer, LCD, Sensors, etc.                           │
└─────────────────────────────────────────────────────────────┘
```

### Execution Flow

1. **Compilation**
   - User writes ESP32 sketch in Monaco editor
   - Main process injects GPIO monitor header (wraps digitalWrite/analogWrite)
   - `arduino-cli compile --fqbn esp32:esp32:esp32c3` generates .bin file
   - Merge bootloader + partitions + app into 4 MB flash image

2. **GPIO Monitor Header Injection**
   ```cpp
   // Auto-injected by src/index.ts
   static void __lf_digitalWrite(uint8_t pin, uint8_t val) {
     digitalWrite(pin, val);
     Serial.printf("__LF_GPIO:%d:%d\n", pin, (int)val);
   }
   #define digitalWrite(p,v) __lf_digitalWrite((p),(v))
   ```

3. **Firmware Scanning**
   - `ESP32C3SimulationRunner.init()` loads .bin via IPC
   - Scans binary for ASCII strings: `__LF_GPIO:<pin>:<value>`
   - Builds GPIO timeline: `[{type: 'gpio', pin: 2, value: 1}, ...]`
   - **Fallback**: If no events found, uses test blink pattern on GPIO2

4. **Timeline Replay**
   - `requestAnimationFrame` loop runs at 60 FPS
   - Every 500ms, replays the entire GPIO timeline
   - Each event:
     - Emits serial line: `__LF_GPIO:2:1\n`
     - Calls `simulationRunner.setPinState('ESP2', 'HIGH')`
     - Fires CircuitEngine listeners
     - Updates LED/peripheral visuals

5. **Pin State Propagation**
   ```
   Timeline Replay (every 500ms)
     ↓
   ESP32C3SimulationRunner.replayTimeline()
     ↓
   simulationRunner.setPinState('ESP2', 'HIGH')
     ↓
   SimulationRunner.notifyListeners('ESP2', 'HIGH')
     ↓
   CircuitEngine listener fires
     ↓
   LED.brightness = 1.0, LED.value = true
     ↓
   LED glows in UI
   ```

### Current Limitations

- ⚠️ **No real RISC-V emulation** - Uses firmware-scan strategy
- ⚠️ **Loop-level accuracy** - Replays GPIO timeline, not cycle-accurate
- ⚠️ **Limited GPIO detection** - `Serial.printf` format strings don't embed actual values
- ⚠️ **No analog input** - ADC not yet implemented
- ⚠️ **No I2C/SPI** - Bus protocols not yet implemented
- ⚠️ **No WiFi/Bluetooth** - Network features not simulated

### Supported Features

- ✅ Digital GPIO output (digitalWrite)
- ✅ PWM output (analogWrite via ledcWrite)
- ✅ Serial output (via GPIO monitor strings)
- ✅ LED, buzzer, basic peripherals
- ✅ Blink patterns and simple sketches

### Board Support

| Board | Chip | Flash | RAM | GPIO | Frequency |
|-------|------|-------|-----|------|-----------|
| ESP32 DevKit V1 | ESP32-C3 | 4 MB | 400 KB | 22 | 160 MHz |
| ESP32-C3 | ESP32-C3 | 4 MB | 400 KB | 22 | 160 MHz |

**Note**: All ESP32 board types (esp32, esp32-devkit-v1, esp32-c3) now map to ESP32-C3 RISC-V simulation. ESP32 Classic (QEMU-based) has been removed.

---

## CircuitEngine (Shared)

Both simulation architectures use the same **CircuitEngine** for peripheral emulation.

### Responsibilities

1. **Wire Tracing** - Traces electrical connections between board pins and peripherals
2. **Listener Registration** - Registers callbacks for pin state changes
3. **Peripheral Emulation** - Updates peripheral visuals based on pin states
4. **Sensor Input** - Injects sensor values back into the simulation

### Peripheral Support

| Peripheral | AVR | ESP32-C3 | Notes |
|------------|-----|----------|-------|
| LED | ✅ | ✅ | Requires `value` AND `brightness` |
| RGB LED | ✅ | ✅ | 3-pin color mixing |
| Buzzer | ✅ | ✅ | Frequency-based tone |
| Button | ✅ | ✅ | Digital input |
| Potentiometer | ✅ | ⚠️ | ADC not yet implemented for ESP32 |
| LDR | ✅ | ⚠️ | ADC not yet implemented for ESP32 |
| DHT22 | ✅ | ❌ | Requires cycle-accurate timing |
| HC-SR04 | ✅ | ⚠️ | Uses setTimeout for ESP32 |
| Servo | ✅ | ⚠️ | PWM timing differs |
| LCD 1602/2004 | ✅ | ✅ | Parallel and I2C modes |
| OLED SSD1306 | ✅ | ⚠️ | I2C not yet implemented for ESP32 |
| TFT ILI9341 | ✅ | ⚠️ | SPI not yet implemented for ESP32 |
| NeoPixel | ✅ | ❌ | Requires cycle-accurate timing |
| Stepper Motor | ✅ | ✅ | Step/direction control |
| Relay | ✅ | ✅ | Contact switching |

---

## Pin Mapping

### AVR Pin Mapping

Arduino pins are mapped to AVR port pins:

```
Arduino D0-D7   → PORTD (PD0-PD7)
Arduino D8-D13  → PORTB (PB0-PB5)
Arduino A0-A5   → PORTC (PC0-PC5) + ADC channels
```

Example: `digitalWrite(13, HIGH)` → `PORTB |= (1 << 5)` → `PB5 = HIGH`

### ESP32 Pin Mapping

ESP32 pins use GPIO numbers directly:

```
D0  → GPIO0  → ESP0
D2  → GPIO2  → ESP2
D13 → GPIO13 → ESP13
A0  → GPIO36 → ESP36 (ADC channel 0)
```

Example: `digitalWrite(2, HIGH)` → `ESP2 = HIGH`

---

## File Structure

```
src/modules/electra/
├── engine/
│   ├── SimulationRunner.ts          # Main simulation coordinator
│   ├── CircuitEngine.ts              # Peripheral emulation (shared)
│   ├── BoardConfig.ts                # AVR board configurations
│   ├── ESP32BoardConfig.ts           # ESP32 pin mappings
│   ├── esp32c3/
│   │   ├── ESP32C3SimulationRunner.ts  # ESP32-C3 firmware scanner
│   │   ├── RiscVCore.ts                # Mock RISC-V core (placeholder)
│   │   └── README.md                   # ESP32-C3 implementation notes
│   ├── HexParser.ts                  # Intel HEX parser (AVR)
│   ├── USARTEmulator.ts              # Serial communication (AVR)
│   ├── HD44780.ts                    # LCD display emulator
│   ├── DHT.ts                        # DHT sensor emulator
│   ├── NeoPixelEmulator.ts           # WS2812B protocol decoder
│   ├── StepperEmulator.ts            # Stepper motor physics
│   └── ...
├── lib/
│   └── avr8js/                       # AVR8 emulation library
│       ├── cpu/                      # CPU core
│       ├── peripherals/              # Hardware peripherals
│       └── ...
├── store/
│   └── useForgeStore.ts              # Zustand state management
└── ForgeStudio.tsx                   # Main UI component
```

---

## Future Improvements

### ESP32-C3 Simulation

1. **Real RISC-V Emulator**
   - Integrate WASM-based RV32IMC core
   - Cycle-accurate execution
   - Full peripheral support (ADC, I2C, SPI, WiFi)

2. **Improved GPIO Detection**
   - Parse sketch AST to extract digitalWrite() calls
   - Embed GPIO commands as compile-time constants
   - Support dynamic pin assignments

3. **Hardware Peripheral Emulation**
   - ADC for analog sensors
   - I2C bus for OLED, sensors
   - SPI bus for TFT displays
   - WiFi/Bluetooth simulation

### AVR Simulation

1. **Performance Optimization**
   - WebAssembly compilation for faster execution
   - Lazy peripheral initialization
   - Optimized pin state propagation

2. **Additional Board Support**
   - Arduino Leonardo (ATmega32U4)
   - Arduino Due (ARM Cortex-M3)
   - STM32 boards

---

## Debugging

### AVR Simulation

Enable detailed logging:
```typescript
console.log('[FORGE] AVR Simulator Engine started.');
console.log('[FORGE CIRCUIT] Wired Logic Route: Board[13] <==> PB5 <==> Peripheral[Anode]');
```

Check:
- CPU cycles advancing
- Port state changes
- Pin listener callbacks
- Peripheral updates

### ESP32-C3 Simulation

Enable detailed logging:
```typescript
console.log('[ESP32-C3] Firmware scanned: X GPIO/PWM events found');
console.log('[ESP32-C3] replayTimeline() called, X events to replay');
console.log('[SIM RUNNER 7SEG] setPinState: ESP2 = HIGH');
console.log('[CIRCUIT LED] Setting LED brightness to 1, value to true');
```

Check:
- Firmware loaded successfully
- GPIO events found in binary
- Timeline replay firing
- Pin state changes
- Listener callbacks
- LED updates

---

## Conclusion

LeapBlocks provides two complementary simulation architectures:

- **AVR Simulation**: Cycle-accurate, full-featured, production-ready
- **ESP32-C3 Simulation**: Functional, limited, development-stage

Both share the same CircuitEngine for consistent peripheral behavior across platforms. The ESP32-C3 simulation is a temporary solution until a real RISC-V emulator is integrated.
