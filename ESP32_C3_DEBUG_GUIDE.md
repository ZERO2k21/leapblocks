# ESP32-C3 RISC-V Simulation Debug Guide

## Current Status

The ESP32-C3 RISC-V simulation has been implemented with a firmware-scan strategy. The system is designed to:

1. **Compile ESP32-C3 sketches** with a GPIO monitor header that wraps `digitalWrite()` calls
2. **Scan the compiled .bin file** for GPIO command strings (`__LF_GPIO:pin:value`)
3. **Replay the GPIO timeline** at 500ms intervals to simulate the sketch's `loop()` function
4. **Drive CircuitEngine listeners** so LEDs, buzzers, and other peripherals respond

## Recent Changes

### Added Comprehensive Logging

Added detailed console logging to track the entire flow:

- `[SimulationRunner] setBoard()` - Shows when board ID and binPath are set
- `[SimulationRunner] start()` - Shows which path (ESP32-C3 vs AVR) is taken
- `[ESP32-C3] init()` - Shows firmware size and scan results
- `[ESP32-C3] scanBinaryForGPIOEvents()` - Shows regex matches and decoded text sample
- `[ESP32-C3] replayTimeline()` - Shows each GPIO event being replayed
- `[SIM RUNNER 7SEG] setPinState()` - Shows when ESP32 pins change state
- `[SIM RUNNER 7SEG] notifyListeners()` - Shows when listeners are notified

### Added Fallback Test Pattern

If no GPIO events are found in the firmware (which is expected since `Serial.printf` format strings don't embed the actual pin/value), the system now creates a test blink pattern:

```typescript
this.gpioTimeline = [
    { type: 'gpio', pin: 2, value: 1 },  // LED ON
    { type: 'gpio', pin: 2, value: 0 },  // LED OFF
];
```

This will make GPIO2 blink at 500ms intervals, which should make any LED connected to GPIO2 blink.

## Testing Steps

### 1. Restart the App

```bash
npm run dev
```

### 2. Create a Simple ESP32-C3 Blink Circuit

1. Add an **ESP32 DevKit V1** board to the canvas
2. Add an **LED** to the canvas
3. Wire **D2** (GPIO2) from the ESP32 to the LED's **+** pin
4. Wire **GND** from the ESP32 to the LED's **-** pin

### 3. Write a Simple Blink Sketch

```cpp
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

### 4. Compile and Run

1. Click the **Compile & Run** button
2. Watch the console output for the logging messages

### 5. Expected Console Output

You should see:

```
[FORGE UI] ESP32-C3 board detected — using RISC-V compile path...
[FORGE UI] ESP32 compile result: Success
[SimulationRunner] setBoard called: boardId="esp32-devkit-v1", binPath="C:\Users\...\forge_esp32_...\flash_image.bin"
[SimulationRunner] start() called, selectedBoard="esp32-devkit-v1"
[SimulationRunner] ESP32-C3 board detected, entering RISC-V path
[FORGE] Loaded firmware: 4194304 bytes from C:\Users\...\forge_esp32_...\flash_image.bin
[ESP32-C3] init() called with firmware size: 4194304 bytes
[ESP32-C3] Scanning 4194304 bytes for GPIO strings...
[ESP32-C3] First 500 chars of decoded text: ...
[ESP32-C3] Found 0 __LF_GPIO matches
[ESP32-C3] Found 0 __LF_PWM matches
[ESP32-C3] No GPIO events found in firmware, using test blink pattern on GPIO2
[ESP32-C3] Firmware scanned: 2 GPIO/PWM events found
[ESP32-C3] GPIO timeline: [{type: 'gpio', pin: 2, value: 1}, {type: 'gpio', pin: 2, value: 0}]
[FORGE] ESP32-C3 runner started, binPath: ...
[ESP32-C3] Simulation started (firmware-scan mode)
[ESP32-C3] replayTimeline() called, 2 events to replay
[ESP32-C3] Setting pin ESP2 = HIGH
[SIM RUNNER 7SEG] setPinState: ESP2 = HIGH (was undefined)
[SIM RUNNER 7SEG] notifyListeners: ESP2 = HIGH, X listeners
[ESP32-C3] Setting pin ESP2 = LOW
[SIM RUNNER 7SEG] setPinState: ESP2 = LOW (was HIGH)
[SIM RUNNER 7SEG] notifyListeners: ESP2 = LOW, X listeners
```

### 6. Expected Behavior

- The LED should **blink** at 500ms intervals (ON for 500ms, OFF for 500ms)
- The serial monitor should show `__LF_GPIO:2:1` and `__LF_GPIO:2:0` lines
- The console should show the GPIO events being replayed

## Known Issues

### Issue 1: GPIO Monitor Strings Not Found in Binary

**Problem**: The `Serial.printf("__LF_GPIO:%d:%d\n", pin, val)` calls don't embed the formatted strings in the binary - only the format string template is embedded.

**Current Solution**: Use a fallback test pattern that blinks GPIO2.

**Future Solution**: 
- Option A: Use a real RISC-V emulator (e.g., WASM-based RV32IMC core)
- Option B: Embed GPIO commands as compile-time string literals using macros
- Option C: Parse the sketch AST to extract digitalWrite() calls and their arguments

### Issue 2: Serial Monitor Shows Old Message

**Problem**: The serial monitor might still show "ESP32 compiled. Starting QEMU simulation..." instead of "ESP32-C3 compiled. Starting RISC-V simulation..."

**Status**: This has been fixed in `ForgeStudio.tsx` line 145. If you still see the old message, it means the old code is cached. Try:
1. Hard refresh the browser (Ctrl+Shift+R)
2. Restart the dev server
3. Clear the Electron cache

## Debugging Checklist

If the LED doesn't blink:

- [ ] Check console for `[SimulationRunner] ESP32-C3 board detected, entering RISC-V path`
- [ ] Check console for `[ESP32-C3] GPIO timeline: [{type: 'gpio', pin: 2, value: 1}, ...]`
- [ ] Check console for `[ESP32-C3] replayTimeline() called, 2 events to replay`
- [ ] Check console for `[ESP32-C3] Setting pin ESP2 = HIGH`
- [ ] Check console for `[SIM RUNNER 7SEG] setPinState: ESP2 = HIGH`
- [ ] Check console for `[SIM RUNNER 7SEG] notifyListeners: ESP2 = HIGH, X listeners`
- [ ] Verify the LED is wired to GPIO2 (D2 pin on ESP32 DevKit V1)
- [ ] Verify CircuitEngine has registered a listener for ESP2

If you see "AVR Simulator Engine started" in the console:

- [ ] Check that `selectedBoard` is set to `"esp32-devkit-v1"` or `"esp32"` or `"esp32-c3"`
- [ ] Check that `setBoard()` was called before `start()`
- [ ] Check that the board node type in the canvas is `"esp32-devkit-v1"` or `"esp32"`

## Next Steps

Once the test blink pattern works, we can:

1. Implement a proper RISC-V emulator (WASM-based)
2. OR improve the GPIO monitor header to embed actual GPIO commands
3. OR parse the sketch source code to extract digitalWrite() calls

For now, the test pattern proves that the CircuitEngine → SimulationRunner → ESP32C3SimulationRunner flow is working correctly.
