# ESP32-C3 Fix Verification Checklist

## Pre-Flight Checks

### 1. Build the Application
```bash
npm run build
```

**Expected:**
- ✅ No TypeScript errors
- ✅ `dist/main/index.js` created
- ✅ `dist/preload/preload.js` created
- ✅ `dist/renderer/` created

### 2. Verify IPC Handler in Built Files

**Check `dist/main/index.js`:**
```bash
grep -n "read-bin-file" dist/main/index.js
```

**Expected output:**
```
XXXX: ipcMain.handle('read-bin-file', async (_, filePath) => {
```

If missing, the build didn't pick up the changes. Try:
```bash
npm run clean
npm run build
```

### 3. Verify Preload API

**Check `dist/preload/preload.js`:**
```bash
grep -n "readBinFile" dist/preload/preload.js
```

**Expected output:**
```
XXXX: readBinFile: (filePath) => ipcRenderer.invoke('read-bin-file', filePath),
```

## Runtime Verification

### 4. Start the Application
```bash
npm run dev
# or
npm start
```

### 5. Open DevTools Console
Press `F12` or `Ctrl+Shift+I` to open DevTools

### 6. Create ESP32-C3 Test Circuit

1. **Add ESP32-C3 board** to canvas
2. **Add LED** to canvas
3. **Wire LED** to GPIO2 (or any GPIO pin)
4. **Add simple blink code:**

```cpp
void setup() {
  pinMode(2, OUTPUT);
  Serial.begin(115200);
  Serial.println("ESP32-C3 Blink Test");
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

### 7. Compile the Code

Click **Compile** button

**Expected Console Output:**
```
[MAIN:IPC] compile-code request received. FQBN: esp32:esp32:esp32c3
[MAIN:IPC] ESP32-C3 detected — using RISC-V compile path
[MAIN:ESP32] Checking for ESP32 core installation...
[MAIN:ESP32] ✓ ESP32 core installed!
[MAIN:IPC] compile-code ESP32 exit=0
[MAIN:IPC] stdout: Sketch uses XXXXX bytes (XX%) of program storage space.
[MAIN:IPC] Using arduino-cli merged image: C:\Users\...\sketch.ino.merged.bin
[MAIN:IPC] compile-code ESP32 returning: { success: true, binPath: "..." }
```

**Red Flags:**
- ❌ `ESP32 core not found` - Run `arduino-cli core install esp32:esp32`
- ❌ `compile-code ESP32 exit=1` - Check compiler errors in serial monitor
- ❌ No `binPath` in return value - Compilation failed

### 8. Start Simulation

Click **Start Simulation** button

**Expected Console Output:**
```
[SimulationRunner] start() called, selectedBoard="esp32-c3"
[SimulationRunner] ESP32-C3 board detected, entering RISC-V path
[FORGE] Attempting to read binary from: C:\Users\...\sketch.ino.merged.bin
[MAIN:IPC] read-bin-file request: C:\Users\...\sketch.ino.merged.bin
[MAIN:IPC] Read 970439 bytes from C:\Users\...\sketch.ino.merged.bin
[MAIN:IPC] First bytes: 0xe9 0x02 0x02 0x40 0x00 0x00 0x00 0x00 ...
[FORGE] Loaded firmware: 970439 bytes from C:\Users\...\sketch.ino.merged.bin
[FORGE] First bytes: 0xe9 0x02 0x02 0x40 ...
[FirmwareLoader] Loading firmware: 970439 bytes
[FirmwareLoader] Magic: 0xe9
[FirmwareLoader] Format: ESP32 Image
[ESP32-C3] Entry point: 0x40380000, segments loaded: 2
[ESP32-C3] First instruction at entry point: 0x12345678
[ESP32-C3] Initialized: 2 segments, entry=0x40380000, 970439 bytes loaded
[FORGE] ESP32-C3 runner started, binPath: C:\Users\...\sketch.ino.merged.bin
```

**Red Flags:**
- ❌ `[MAIN:IPC] File not found` - Binary wasn't created or wrong path
- ❌ `Read 0 bytes` - Compilation failed silently
- ❌ `Loaded firmware: 0 bytes` - IPC handler returned empty buffer
- ❌ `First instruction at entry point: 0x0` - Entry point not loaded correctly
- ❌ `Illegal insn 0x0 @ PC=0x...` - Firmware not loaded into memory
- ❌ `Halting CPU due to illegal instruction 0x0` - Uninitialized memory

### 9. Verify LED Behavior

**Expected:**
- ✅ LED on canvas blinks ON/OFF every 1 second
- ✅ Serial monitor shows "LED ON" / "LED OFF" messages
- ✅ No error messages in console

**If LED doesn't blink:**
- Check GPIO pin number matches the wiring
- Check serial monitor for error messages
- Check console for simulation errors

### 10. Check Serial Output

**Expected Serial Monitor Output:**
```
ESP32-C3 Blink Test
LED ON
LED OFF
LED ON
LED OFF
...
```

## Troubleshooting

### Issue: "No handler registered for 'read-bin-file'"

**Cause:** IPC handler not in built files

**Solution:**
1. Verify `electron/main.js` has the handler (source file)
2. Run `npm run clean && npm run build`
3. Check `dist/main/index.js` has the handler
4. Restart the app

### Issue: "readBinFile is not a function"

**Cause:** Preload script not exposing the API

**Solution:**
1. Verify `electron/preload.js` has `readBinFile` (source file)
2. Run `npm run clean && npm run build`
3. Check `dist/preload/preload.js` has `readBinFile`
4. Restart the app

### Issue: "Loaded firmware: 0 bytes"

**Cause:** Binary file is empty or compilation failed

**Solution:**
1. Check compiler output in serial monitor
2. Verify ESP32 core is installed: `arduino-cli core list | grep esp32`
3. Check temp directory for .bin file
4. Verify file size: `ls -lh /path/to/sketch.ino.merged.bin`

### Issue: "Illegal instruction 0x0" errors

**Cause:** Firmware not loaded into memory correctly

**Solution:**
1. Check firmware size > 0
2. Check entry point is in IRAM range (0x40380000-0x403DFFFF)
3. Check first instruction at entry point != 0x0
4. Verify IPC handler returns ArrayBuffer, not string

### Issue: LED doesn't blink

**Possible Causes:**
1. Wrong GPIO pin number
2. Simulation not running (check console for errors)
3. CircuitEngine not connected to ESP32 runner
4. Pin listener not registered

**Solution:**
1. Add debug logging to `setPinState` in SimulationRunner
2. Check GPIO pin mapping in `convertESP32Pin`
3. Verify CircuitEngine is calling `addPinListener`

## Success Criteria

✅ All of the following must be true:

1. **Compilation succeeds** - No compiler errors
2. **Binary file created** - Size > 0 bytes
3. **IPC handler responds** - Logs show file read successfully
4. **Firmware loads** - Size > 0, magic number valid
5. **Entry point valid** - In IRAM range, first instruction != 0x0
6. **Simulation starts** - No illegal instruction errors
7. **LED blinks** - Visual feedback on canvas
8. **Serial output works** - Messages appear in serial monitor
9. **No console errors** - Clean console output

## Files to Check

### Source Files (Before Build)
- ✅ `electron/main.js` - Has `read-bin-file` handler
- ✅ `electron/preload.js` - Has `readBinFile` API
- ✅ `src/modules/electra/engine/esp32c3/ESP32C3SimulationRunner.ts` - Has diagnostics
- ✅ `src/modules/electra/engine/SimulationRunner.ts` - Calls `readBinFile`

### Built Files (After Build)
- ✅ `dist/main/index.js` - Contains IPC handler
- ✅ `dist/preload/preload.js` - Contains `readBinFile`
- ✅ `dist/renderer/assets/SimulationRunner-*.js` - Contains ESP32 runner

## Next Steps After Verification

If all checks pass:
1. ✅ Mark issue as RESOLVED
2. ✅ Update documentation
3. ✅ Test with more complex sketches (I2C, SPI, ADC)
4. ✅ Test with other ESP32 boards (ESP32-S2, ESP32-S3)

If any checks fail:
1. ❌ Review error messages
2. ❌ Check troubleshooting section
3. ❌ Add more diagnostic logging
4. ❌ Report issue with full console output

---

**Last Updated:** 2026-04-22  
**Status:** Ready for Testing  
**Priority:** HIGH - Critical fix for ESP32-C3 simulation
