# ESP32-C3 RISC-V Simulation Engine

This directory contains the ESP32-C3 RISC-V simulation engine for LeapForge.

## Implementation Status

🚧 **DEVELOPMENT IN PROGRESS** 🚧

This is currently a **mock implementation** for development and testing purposes. The core architecture is in place, but a real RISC-V emulator needs to be integrated.

## Architecture

### Files

- **`RiscVCore.ts`** - Core RISC-V CPU emulator with memory-mapped I/O
- **`ESP32C3SimulationRunner.ts`** - Simulation runner with RAF loop and pin management
- **Integration points:**
  - `SimulationRunner.ts` - Board detection and lifecycle management
  - `CircuitEngine.ts` - Analog sensor input routing
  - `electron/main.js` - Compilation support for `esp32:esp32:esp32c3`

### Memory Map

```
Flash:  0x4200_0000 - 0x4240_0000 (4MB)  - Application code
SRAM:   0x3FC8_0000 - 0x3FCA_8000 (400KB) - Data/stack

Peripherals:
UART0:  0x6000_0000  - Serial output
GPIO:   0x6000_4000  - Digital I/O
I2C0:   0x6001_3000  - I2C communication  
ADC:    0x6004_0000  - Analog input (GPIO0-4 = CH0-4)
```

### Pin Mapping

ESP32-C3 uses the same pin ID scheme as other ESP32 boards: `"ESP{gpioNumber}"`

- **Digital pins:** ESP0, ESP2, ESP4, ESP5, ESP12, ESP13, etc.
- **ADC pins:** ESP0-ESP4 (channels 0-4)
- **I2C:** ESP8 (SDA), ESP9 (SCL) - default
- **UART:** ESP20 (RX), ESP21 (TX) - default

## Integration with Existing Architecture

### SimulationRunner.ts
- Detects `esp32:esp32:esp32c3` FQBN
- Creates `ESP32C3SimulationRunner` instance
- Manages lifecycle (start/stop)
- Provides pin listener methods

### CircuitEngine.ts  
- Routes analog sensor voltages to ESP32-C3 ADC channels
- Same sensor support as other ESP32 boards
- Uses `simulationRunner.setESP32C3AnalogInput(gpio, voltage)`

### Compilation
- `electron/main.js` includes `esp32:esp32:esp32c3` in `ESP32_FQBNS`
- Uses same compilation pipeline as other ESP32 boards
- Outputs `sketch.ino.merged.bin` flash image

## TODO: RISC-V Emulator Integration

### Recommended Emulators

1. **d0iasm/rvemu** (Rust + WASM)
   - ✅ WebAssembly support
   - ✅ Full RV64GC support
   - ❌ Need RV32IMC variant
   - 🔗 https://github.com/d0iasm/rvemu

2. **@aloeminium108/risc-v-emulator** (JavaScript)
   - ✅ Pure JavaScript, easy integration
   - ✅ RV32I base instruction set
   - ❌ Missing M (multiply) and C (compressed) extensions
   - 🔗 https://www.npmjs.com/package/@aloeminium108/risc-v-emulator

3. **Custom RISC-V Emulator**
   - Compile existing C/C++ RISC-V emulator to WASM
   - Examples: rv32emu, riscv-isa-sim

### Integration Steps

1. **Choose and install RISC-V emulator**
   ```bash
   npm install <risc-v-emulator-package>
   ```

2. **Update `RiscVCore.ts`**
   - Replace mock CPU with real emulator
   - Implement memory-mapped I/O hooks
   - Add proper instruction execution

3. **Add memory access hooks**
   ```typescript
   cpu.onMemoryWrite((addr, value, size) => {
     if (addr === UART_TX_REG) this.callbacks.onUARTByte(value);
     if (addr === GPIO_OUT_REG) this.handleGPIOWrite(value);
     // ... other peripherals
   });
   ```

4. **Test with real ESP32-C3 firmware**
   - Compile Arduino sketch with `esp32:esp32:esp32c3`
   - Load resulting `.bin` file into emulator
   - Verify GPIO, UART, I2C, ADC functionality

## Testing

### Current Mock Testing
```typescript
// The mock implementation allows testing the integration points:
const runner = new ESP32C3SimulationRunner();
await runner.init(mockFirmware);
runner.start();

// Test pin listeners
runner.addPinListener(2, (high) => console.log(`GPIO2: ${high}`));

// Test analog input
runner.setAnalogInput(0, 1.65); // 1.65V on ADC channel 0 (GPIO0)
```

### Future Real Testing
Once a real RISC-V emulator is integrated:
1. Compile simple Arduino sketches for ESP32-C3
2. Test basic GPIO output (LED blink)
3. Test serial output (Serial.println)
4. Test analog input (analogRead)
5. Test I2C communication (SSD1306 display)

## Performance Considerations

- **Target:** 160 MHz ESP32-C3 @ 60 FPS = ~2.67M instructions/frame
- **Current:** Limited to ~50K instructions/frame to prevent blocking
- **Optimization:** Use WASM for CPU emulation, minimize JavaScript overhead
- **Memory:** 4MB flash + 400KB SRAM simulation

## Compatibility

- ✅ Same pin ID scheme as existing ESP32 boards (`ESP{n}`)
- ✅ Same I2C slave support (SSD1306, PCF8574, MPU6050)
- ✅ Same analog sensor support (temperature, light, etc.)
- ✅ Same compilation pipeline (arduino-cli + ESP32 core)
- ✅ Same circuit engine integration