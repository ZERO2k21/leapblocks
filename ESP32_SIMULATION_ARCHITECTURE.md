# ESP32-C3 Simulation Architecture in Electra

## 🎯 Overview

The ESP32-C3 simulation in Electra is a **full RISC-V RV32IMC soft-core emulator** that runs compiled ESP32 firmware directly in the browser. It provides cycle-accurate instruction execution, peripheral emulation, and seamless integration with the visual circuit editor.

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Electra Studio UI                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ ForgeStudio  │  │ Circuit View │  │ Serial Monitor│              │
│  │   (React)    │  │   (Canvas)   │  │   (Output)   │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                  │                  │                       │
└─────────┼──────────────────┼──────────────────┼───────────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Simulation Layer                                │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              SimulationRunner (Orchestrator)                  │  │
│  │  • Manages simulation lifecycle                               │  │
│  │  • Routes board-specific execution                            │  │
│  │  • Bridges CircuitEngine ↔ ESP32C3SimulationRunner           │  │
│  └──────────────────┬───────────────────────────────────────────┘  │
│                     │                                                │
│                     ▼                                                │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │           ESP32C3SimulationRunner (ESP32-C3 Core)             │  │
│  │  • Initializes RISC-V platform                                │  │
│  │  • Loads firmware into memory                                 │  │
│  │  • Runs simulation loop (requestAnimationFrame)               │  │
│  │  • Manages pin listeners and serial output                    │  │
│  └──────────────────┬───────────────────────────────────────────┘  │
│                     │                                                │
└─────────────────────┼────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    RISC-V Emulation Core                             │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    ESP32C3Platform                            │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐             │  │
│  │  │ RiscVCore  │  │   GPIO     │  │   UART0    │             │  │
│  │  │ (CPU)      │  │ (Pins)     │  │ (Serial)   │             │  │
│  │  └────────────┘  └────────────┘  └────────────┘             │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐             │  │
│  │  │    ADC     │  │    I2C0    │  │    SPI2    │             │  │
│  │  │ (Analog)   │  │ (OLED/LCD) │  │ (TFT)      │             │  │
│  │  └────────────┘  └────────────┘  └────────────┘             │  │
│  │  ┌────────────┐  ┌────────────┐                              │  │
│  │  │  SysTimer  │  │   MMIO Bus │                              │  │
│  │  │ (Timing)   │  │ (Periph)   │                              │  │
│  │  └────────────┘  └────────────┘                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Memory Subsystem                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │     IRAM     │  │     DRAM     │  │     IROM     │             │
│  │  0x40380000  │  │  0x3FC80000  │  │  0x42000000  │             │
│  │   384 KB     │  │   384 KB     │  │   12 MB      │             │
│  │  [READ-ONLY] │  │  [WRITABLE]  │  │  [READ-ONLY] │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│  ┌──────────────┐  ┌──────────────┐                                │
│  │     DROM     │  │   ROM Stub   │                                │
│  │  0x3C000000  │  │  0x40000000  │                                │
│  │   12 MB      │  │   3.5 MB     │                                │
│  │  [READ-ONLY] │  │  [READ-ONLY] │                                │
│  └──────────────┘  └──────────────┘                                │
└─────────────────────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Compilation Pipeline                              │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                   ArduinoUploader                             │  │
│  │  • Compiles Arduino sketch using arduino-cli                 │  │
│  │  • Generates .bin firmware (merged flash image)              │  │
│  │  • Injects GPIO/Serial monitoring code                       │  │
│  └──────────────────┬───────────────────────────────────────────┘  │
│                     │                                                │
│                     ▼                                                │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                  FirmwareLoader                               │  │
│  │  • Parses ESP32 flash image format                            │  │
│  │  • Loads segments into IRAM/DRAM/IROM/DROM                   │  │
│  │  • Sets CPU entry point                                       │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## 🏗️ Core Components

### 1. **SimulationRunner** (`SimulationRunner.ts`)
**Role**: Top-level orchestrator for all board simulations

**Responsibilities**:
- Detects board type (AVR, ESP32-C3, etc.)
- Routes to appropriate simulation engine
- Manages simulation lifecycle (start/stop/reset)
- Bridges CircuitEngine with board-specific runners

**Key Methods**:
```typescript
setBoard(boardId: string, binPath?: string): void
start(): void
stop(): void
reset(): void
```

### 2. **ESP32C3SimulationRunner** (`ESP32C3SimulationRunner.ts`)
**Role**: ESP32-C3 specific simulation manager

**Responsibilities**:
- Initializes ESP32C3Platform (CPU + peripherals)
- Loads firmware using FirmwareLoader
- Runs simulation loop (requestAnimationFrame)
- Manages pin state changes and serial output
- Provides CircuitEngine integration API

**Key Methods**:
```typescript
async init(firmware: Uint8Array, entryPoint?: number): Promise<void>
run(): void
stop(): void
setPinState(pin: string, state: PinState): void
getPinState(pin: string): PinState
injectInput(pin: string, value: boolean | number, isAnalog: boolean): void
```

**Simulation Loop**:
```typescript
// Runs at 60 FPS
private executeTick(): void {
  // Execute ~266,666 CPU cycles per frame
  const cyclesExecuted = core.runCycles(CYCLES_PER_FRAME);
  
  // Advance system timer
  sysTimer.cpuCycles += cyclesExecuted;
  sysTimer.tick();
  
  // Check for halt condition
  if (core.halted) {
    this.running = false;
  }
}
```

### 3. **ESP32C3Platform** (`ESP32C3SimulationRunner.ts`)
**Role**: Assembles all RISC-V peripherals into one unit

**Components**:
- **RiscVCore**: CPU emulator (RV32IMC instruction set)
- **GPIO**: 22 GPIO pins with digital/analog support
- **UART0/UART1**: Serial communication
- **ADC**: 12-bit analog-to-digital converter
- **I2C0/I2C1**: I2C bus for OLED, LCD, sensors
- **SPI2/SPI3**: SPI bus for TFT displays
- **SysTimer**: System timer with alarm support

**Peripheral Wiring**:
```typescript
// Wire peripherals into MMIO bus
bus.register(this.uart0);
bus.register(this.gpio);
bus.register(this.adc);
bus.register(this.i2c0);
bus.register(this.spi2);

// Wire interrupt sources
this.uart0.onInterrupt(raiseIRQ);
this.i2c0.onInterrupt(raiseIRQ);
this.sysTimer.onInterrupt(raiseIRQ);
```

### 4. **RiscVCore** (`cpu/RiscVCore.ts`)
**Role**: RISC-V RV32IMC CPU emulator

**Features**:
- Full RV32I base instruction set (40+ instructions)
- M extension (multiply/divide)
- C extension (compressed 16-bit instructions)
- Cycle-accurate execution
- Memory-mapped I/O (MMIO) support
- Interrupt controller

**Instruction Set**:
```
• Arithmetic: ADD, SUB, MUL, DIV, REM
• Logic: AND, OR, XOR, SLL, SRL, SRA
• Branches: BEQ, BNE, BLT, BGE, BLTU, BGEU
• Jumps: JAL, JALR
• Memory: LB, LH, LW, LBU, LHU, SB, SH, SW
• Immediate: ADDI, SLTI, ANDI, ORI, XORI
• Upper: LUI, AUIPC
• System: ECALL, EBREAK
• Compressed: C.ADDI, C.LW, C.SW, C.J, C.BEQZ, etc.
```

**Memory Access**:
```typescript
memRead32(addr: u32): u32
memWrite32(addr: u32, v: u32): void

// Memory regions:
// IRAM: 0x40380000 - 0x403DFFFF (READ-ONLY)
// DRAM: 0x3FC80000 - 0x3FCDFFFF (WRITABLE)
// IROM: 0x42000000 - 0x42BFFFFF (READ-ONLY)
// DROM: 0x3C000000 - 0x3CBFFFFF (READ-ONLY)
// MMIO: 0x60000000 - 0x6002FFFF (PERIPHERALS)
```

### 5. **FirmwareLoader** (`compiler/FirmwareLoader.ts`)
**Role**: Parses and loads ESP32 firmware into memory

**Supported Formats**:
- ESP32 flash image (.bin) - merged bootloader + app
- ELF32 RISC-V executable

**Loading Process**:
```typescript
1. Detect format (flash image vs ELF)
2. Parse header (magic, segments, entry point)
3. Load each segment into appropriate memory region:
   - IRAM: Instruction code
   - DRAM: Initialized data
   - IROM: Flash-mapped code
   - DROM: Flash-mapped data
4. Set CPU entry point
5. Verify integrity
```

**Flash Image Format**:
```
Offset  | Size | Description
--------|------|----------------------------------
0x0000  | 8    | Header (magic, segments, entry)
0x0008  | var  | Segment 0 (addr, size, data)
...     | var  | Segment N
0x10000 | var  | Application firmware (main code)
```

### 6. **Peripherals** (`peripherals/`)

#### **GPIO** (`GPIO.ts`)
- 22 GPIO pins (GPIO0-GPIO21)
- Digital input/output
- Analog input (ADC channels)
- Pin change callbacks

```typescript
setOutput(gpio: number, high: boolean): void
setInput(gpio: number, high: boolean): void
setAnalog(gpio: number, value12bit: number): void
onPinChange(callback: (gpio, value, isAnalog) => void): void
```

#### **UART** (`UART.ts`)
- Serial communication (UART0, UART1)
- Baud rate configuration
- TX/RX buffers
- Serial output callbacks

```typescript
write(byte: number): void
read(): number
onSerialOutput(callback: (line: string) => void): void
```

#### **ADC** (`ADC.ts`)
- 12-bit resolution (0-4095)
- 6 channels (GPIO0-GPIO5)
- Voltage reference: 3.3V

```typescript
setChannelValue(channel: number, value12bit: number): void
read(channel: number): number
```

#### **I2C** (`I2C.ts`)
- I2C master/slave mode
- Device registration
- OLED/LCD support

```typescript
registerDevice(device: I2CDevice): void
write(addr: number, data: Uint8Array): void
read(addr: number, length: number): Uint8Array
```

#### **SPI** (`SPI.ts`)
- SPI master mode
- TFT display support
- Configurable clock speed

```typescript
attachDevice(device: SPIDevice): void
transfer(data: Uint8Array): Uint8Array
```

## 🔄 Execution Flow

### 1. **Compilation Phase**
```
User Code (Arduino sketch)
    ↓
ArduinoUploader.compileESP32ForSimulation()
    ↓
arduino-cli compile --fqbn esp32:esp32:esp32c3
    ↓
Inject GPIO/Serial monitoring code
    ↓
Generate .bin firmware (merged flash image)
    ↓
Store in temp directory
```

### 2. **Initialization Phase**
```
ForgeStudio.handleToggleSimulation()
    ↓
SimulationRunner.setBoard("esp32-c3", binPath)
    ↓
ESP32C3SimulationRunner.init(firmware)
    ↓
FirmwareLoader.load(firmware)
    ↓
Load segments into IRAM/DRAM/IROM/DROM
    ↓
Set CPU entry point (typically 0x403807ce)
    ↓
Wire peripherals to MMIO bus
    ↓
Wire GPIO/UART callbacks
```

### 3. **Execution Phase**
```
ESP32C3SimulationRunner.run()
    ↓
requestAnimationFrame loop (60 FPS)
    ↓
executeTick()
    ├─ RiscVCore.runCycles(266,666)
    │   ├─ Fetch instruction from PC
    │   ├─ Decode opcode
    │   ├─ Execute instruction
    │   ├─ Update registers
    │   └─ Advance PC
    ├─ SysTimer.tick()
    │   └─ Fire alarm callbacks
    ├─ GPIO.onPinChange()
    │   └─ CircuitEngine.updatePinState()
    └─ UART.onSerialOutput()
        └─ ForgeStore.appendSerial()
```

### 4. **Circuit Integration**
```
GPIO Pin Change
    ↓
ESP32C3GPIO.setOutput(gpio, high)
    ↓
ESP32C3SimulationRunner.setPinState("ESP2", "HIGH")
    ↓
CircuitEngine.updatePinState("ESP2", "HIGH")
    ↓
Update LED/component state in circuit view
    ↓
Re-render canvas
```

## 🎮 User Interaction Flow

### **Compile & Run**
```
1. User writes Arduino code in ForgeStudio
2. User clicks "Run" button
3. Code compiles to .bin firmware
4. Firmware loads into emulator
5. Simulation starts
6. Serial output appears in monitor
7. GPIO changes update circuit view
```

### **Circuit Interaction**
```
1. User clicks button in circuit view
2. CircuitEngine detects click
3. CircuitEngine calls runner.injectInput("ESP4", true, false)
4. ESP32C3GPIO.setInput(4, true)
5. Arduino code reads digitalRead(4)
6. Code responds (e.g., turns on LED)
7. GPIO.setOutput(2, true)
8. Circuit view updates LED state
```

## 📊 Performance Characteristics

### **Execution Speed**
- **Target**: 160 MHz (ESP32-C3 actual speed)
- **Simulated**: ~16 MHz (1/10th speed for browser responsiveness)
- **Cycles per frame**: 266,666 (at 60 FPS)
- **Instructions per second**: ~16 million

### **Memory Usage**
- **IRAM**: 384 KB (instruction code)
- **DRAM**: 384 KB (data)
- **IROM**: 12 MB (flash-mapped code)
- **DROM**: 12 MB (flash-mapped data)
- **Total**: ~25 MB per simulation

### **Latency**
- **GPIO update**: <16ms (next frame)
- **Serial output**: <16ms (next frame)
- **Compilation**: 10-60 seconds (first time), 2-5 seconds (cached)

## 🔧 Key Features

### ✅ **Implemented**
- Full RV32IMC instruction set
- GPIO digital I/O
- GPIO analog input (ADC)
- UART serial communication
- I2C bus (OLED, LCD)
- SPI bus (TFT displays)
- System timer with alarms
- Interrupt controller
- Memory-mapped I/O
- Circuit integration
- Serial monitor
- Pin state visualization

### 🚧 **Limitations**
- Runs at 1/10th actual speed (16 MHz vs 160 MHz)
- No WiFi/Bluetooth emulation
- No flash filesystem emulation
- Limited peripheral support (no CAN, USB, etc.)
- No power management emulation

## 🐛 Common Issues & Solutions

### **Issue**: Illegal instruction 0x0
**Cause**: IRAM corruption (firmware writing to instruction memory)
**Solution**: IRAM is now read-only ✅

### **Issue**: Compilation linker errors
**Cause**: ESP32 core 3.3.8 USB CDC bug
**Solution**: Added USB CDC build flags ✅

### **Issue**: Stuck at same PC
**Cause**: Infinite loop or waiting for interrupt
**Solution**: Check if code is waiting for Serial input or timer

### **Issue**: No serial output
**Cause**: Serial.begin() not called or wrong baud rate
**Solution**: Ensure `Serial.begin(115200)` in setup()

## 📚 File Structure

```
src/Electra/Client/Src/engine/esp32c3/
├── ESP32C3SimulationRunner.ts    # Main simulation runner
├── ArduinoRuntime.ts              # Arduino API stubs (transpiled path)
├── cpu/
│   └── RiscVCore.ts               # RISC-V CPU emulator
├── peripherals/
│   ├── GPIO.ts                    # GPIO controller
│   ├── UART.ts                    # Serial communication
│   ├── ADC.ts                     # Analog-to-digital converter
│   ├── I2C.ts                     # I2C bus
│   ├── SPI.ts                     # SPI bus
│   └── SysTimer.ts                # System timer
├── compiler/
│   └── FirmwareLoader.ts          # Firmware parser/loader
└── tests/
    ├── RiscVCore.test.ts          # CPU tests
    └── ESP32C3Platform.test.ts    # Platform tests
```

## 🎯 Design Philosophy

1. **Browser-First**: Pure TypeScript, no native dependencies
2. **Cycle-Accurate**: Instruction-level timing for GPIO/peripheral accuracy
3. **Modular**: Peripherals are independent, pluggable modules
4. **Testable**: Comprehensive unit tests for CPU and peripherals
5. **Debuggable**: Extensive logging and diagnostic tools
6. **Extensible**: Easy to add new peripherals or instructions

## 🚀 Future Enhancements

- [ ] WiFi emulation (HTTP client/server)
- [ ] Bluetooth emulation (BLE)
- [ ] Flash filesystem (SPIFFS/LittleFS)
- [ ] Debugger integration (breakpoints, step execution)
- [ ] Performance profiling
- [ ] Power consumption estimation
- [ ] Multi-core support (ESP32-C3 is single-core, but ESP32 has dual-core)

---

**Status**: ✅ Fully functional with IRAM protection fix applied
**Last Updated**: 2026-05-18
**Version**: 2.0 (RISC-V emulation path)
