# ESP32 Not Simulating - Diagnosis

## Current Status

✅ **Code is correct** - All TypeScript errors fixed, IPC handler exists  
⚠️ **Needs testing** - App must be restarted to load new build

## Why ESP32 Might Not Be Simulating

### Root Cause: Stale App Instance

The most likely reason ESP32 simulation isn't working is that you're running an **old version of the Electron app** that doesn't have:

1. The `read-bin-file` IPC handler (added in previous session)
2. The fixed API calls (just fixed in this session)
3. The complete ESP32-C3 RISC-V emulator

### Solution

**RESTART THE ELECTRON APP:**

```bash
# Close the app completely
# Then restart:
npm run dev
```

## What Should Happen After Restart

### 1. Compile ESP32 Code
- Click "Compile & Run" with ESP32 board selected
- Should see: `ESP32-C3 compiled. Starting RISC-V simulation...`

### 2. Simulation Starts
- LED should appear on canvas
- LED should blink according to your code
- Serial monitor should show output

### 3. Console Logs (Expected)
```
[FORGE UI] ESP32-C3 board detected — using RISC-V compile path...
[FORGE UI] ESP32 compile result: Success
[SimulationRunner] setBoard called: boardId="esp32", binPath="..."
[FORGE STORE] startSimulation triggered
[PRELOAD] readBinFile called
[FORGE] Loaded firmware: XXXX bytes
[ESP32-C3] Initialized: X segments, entry=0x...
[FORGE] ESP32-C3 runner started
```

## If Still Not Working After Restart

### Check 1: IPC Handler Error
**Look for:** `No handler registered for 'read-bin-file'`  
**Solution:** Rebuild and restart again:
```bash
npm run build:electron
npm run dev
```

### Check 2: Firmware Loading Error
**Look for:** `Could not read .bin via IPC`  
**Cause:** IPC handler not working or binPath invalid  
**Solution:** Check console for full error message

### Check 3: Firmware Size is 0
**Look for:** `Loaded firmware: 0 bytes`  
**Cause:** IPC call returned empty buffer  
**Solution:** Check that compilation succeeded and .bin file exists

### Check 4: No LED on Canvas
**Cause:** Circuit not synced or LED not connected  
**Solution:** 
- Make sure LED is connected to GPIO2 in circuit
- Check that LED has both `value` and `brightness` properties

### Check 5: LED Doesn't Blink
**Cause:** Firmware not executing or GPIO not updating  
**Solution:** Check console for `[ESP32-C3] Pin ESP2 = HIGH/LOW` logs

## Test Sketch

Use this simple blink sketch to test:

```cpp
void setup() {
  pinMode(2, OUTPUT);
  Serial.begin(115200);
  Serial.println("ESP32-C3 Blink Test");
}

void loop() {
  Serial.println("LED ON");
  digitalWrite(2, HIGH);
  delay(1000);
  
  Serial.println("LED OFF");
  digitalWrite(2, LOW);
  delay(1000);
}
```

**Expected:**
- LED blinks every second
- Serial monitor shows "LED ON" / "LED OFF" messages

## Circuit Setup

1. **Add ESP32 board** to canvas
2. **Add LED** to canvas
3. **Connect LED** to GPIO2 on ESP32
4. **Connect LED** to GND
5. **Click "Compile & Run"**

## Debugging Checklist

- [ ] Restarted Electron app
- [ ] ESP32 board selected in dropdown
- [ ] Code compiles without errors
- [ ] LED connected to GPIO2 in circuit
- [ ] Console shows "ESP32-C3 compiled. Starting RISC-V simulation..."
- [ ] Console shows "Loaded firmware: XXXX bytes" (not 0)
- [ ] Console shows "[ESP32-C3] Initialized"
- [ ] No IPC handler errors in console
- [ ] Serial monitor shows output

## Common Issues

### Issue: "binPath is required for ESP32-C3 simulation"
**Cause:** Compilation failed or didn't return binPath  
**Fix:** Check compilation errors in console

### Issue: "Firmware load failed"
**Cause:** Invalid firmware format  
**Fix:** Check that ESP32 core is installed correctly

### Issue: LED glows but doesn't blink
**Cause:** Simulation not running or delay() not working  
**Fix:** Check that `run()` was called and RAF loop is active

### Issue: Serial output not showing
**Cause:** Serial listener not wired  
**Fix:** Check that `addSerialListener()` was called in store

## Files to Check

If issues persist, check these files:

1. **`dist/main/index.js`** - Should contain `read-bin-file` handler
2. **`dist/preload/preload.js`** - Should contain `readBinFile` function
3. **`dist/renderer/assets/SimulationRunner-*.js`** - Should be ~90 KB

## Build Verification

Check build timestamps:
```bash
ls -la dist/main/index.js
ls -la dist/preload/preload.js
```

Should show recent timestamps (today's date).

## Next Steps

1. **Restart app** (most important!)
2. **Test with simple blink sketch**
3. **Check console logs** for errors
4. **Report results** with console output

---

**Most Likely Issue:** App not restarted  
**Most Likely Fix:** Restart the Electron app  
**Expected Result:** LED blinks, serial output appears

If still not working after restart, share the console logs and I'll help debug further!
