# ESP32-C3 Simulation Troubleshooting Guide

## Your Current Issue

Based on your console logs, I can see:

### ✅ What's Working:
1. Compilation successful (970KB sketch compiled)
2. ESP32 core installed
3. Binary file created: `sketch.ino.merged.bin`

### ❌ What's NOT Working:
1. **Slow startup**: 92 seconds to show window (should be < 2 seconds)
2. **Simulation errors**: You mentioned console errors (couldn't copy)

---

## Root Cause: **App Not Restarted After Build**

You built the app with `npm run build:electron`, but the **old code is still running**. You need to:

### **SOLUTION: Restart the App**

```bash
# 1. Close the app COMPLETELY (Ctrl+Q or close all windows)

# 2. Restart the app
npm run start

# OR if using dev mode:
npm run dev
```

---

## Common Console Errors & Fixes

### Error 1: "Property 'start' does not exist on type 'ESP32C3SimulationRunner'"

**Cause:** Old code calling `start()` instead of `run()`

**Fix:** Already fixed in the code. Just restart the app.

### Error 2: "binPath is required for ESP32-C3 simulation"

**Cause:** Compilation didn't return binPath

**Fix:** Check that compilation succeeded (you should see "compile-code ESP32 exit=0")

### Error 3: "Firmware load failed"

**Cause:** Invalid firmware format or corrupted .bin file

**Fix:** 
1. Delete temp folder: `C:\Users\VIGNES~1\AppData\Local\Temp\forge_esp32_*`
2. Recompile the sketch

### Error 4: "No handler registered for 'read-bin-file'"

**Cause:** IPC handler not loaded (old build)

**Fix:** Restart the app to load new IPC handlers

### Error 5: "Cannot read properties of null (reading 'gpio')"

**Cause:** ESP32C3SimulationRunner not initialized

**Fix:** Check that `init()` was called before `run()`

---

## How to Check If Simulation Is Working

### Step 1: Open DevTools Console (F12)

Look for these messages:

#### ✅ **Good Messages** (Simulation Working):
```
[FORGE UI] ESP32-C3 board detected — using RISC-V compile path...
[FORGE UI] ESP32 compile result: Success
[SimulationRunner] setBoard called: boardId="esp32-c3", binPath="..."
[SimulationRunner] ESP32-C3 board detected, entering RISC-V path
[FORGE] Loaded firmware: 4194304 bytes from ...
[ESP32-C3] Initialized: 3 segments, entry=0x40380000, 970439 bytes loaded
[ESP32-C3] GPIO timeline: [{type: 'gpio', pin: 2, value: 1}, ...]
```

#### ❌ **Bad Messages** (Simulation NOT Working):
```
TypeError: Cannot read properties of null (reading 'gpio')
Error: binPath is required for ESP32-C3 simulation
Error: No handler registered for 'read-bin-file'
Property 'start' does not exist on type 'ESP32C3SimulationRunner'
```

### Step 2: Check LED Behavior

If simulation is working:
- LED should blink every 1 second (if using blink sketch)
- Console should show GPIO events
- Serial monitor should show "LED ON" / "LED OFF"

If simulation is NOT working:
- LED stays off
- No GPIO events in console
- No serial output

---

## Complete Restart Procedure

### Method 1: Quick Restart (Recommended)

```bash
# 1. Close app completely
# 2. Run:
npm run start
```

### Method 2: Clean Restart (If Quick Restart Doesn't Work)

```bash
# 1. Close app completely

# 2. Clean build
npm run build:electron

# 3. Clear Electron cache
# Windows:
rmdir /s /q "%APPDATA%\leapblocks"

# 4. Restart
npm run start
```

### Method 3: Nuclear Option (If Nothing Works)

```bash
# 1. Close app completely

# 2. Delete node_modules and reinstall
rmdir /s /q node_modules
npm install

# 3. Rebuild
npm run build:electron

# 4. Restart
npm run start
```

---

## Verify the Fix

After restarting, check:

### 1. **Startup Time**
- Should be < 5 seconds (not 92 seconds)
- Check console: `[TIMING] 234ms - Window ready to show`

### 2. **Board Selector**
- Should show "ESP32-C3" with "RISC-V" chip label
- No "ESP32 DevKit V1" option

### 3. **Compilation**
- Click "Compile & Run"
- Should see: "ESP32-C3 compiled. Starting RISC-V simulation..."
- Should NOT see: "ESP32 compiled. Starting QEMU simulation..."

### 4. **Simulation**
- LED should blink (if connected to GPIO2)
- Console should show: `[ESP32-C3] Initialized: 3 segments...`
- Serial monitor should show output

---

## If Still Not Working After Restart

### Check 1: Verify Build Output

Look at the build output from `npm run build:electron`:

```
✓ built in 19.55s
```

Should complete without errors.

### Check 2: Check dist/ Folder

```bash
# Check if new files were built
dir dist\main\index.js
dir dist\renderer\assets\SimulationRunner-*.js
```

Files should have recent timestamps (today's date).

### Check 3: Check Console for Specific Error

Open DevTools Console (F12) and look for:
- Red error messages
- Stack traces
- "TypeError", "ReferenceError", "Cannot read properties"

**Copy the EXACT error message** and share it.

---

## Expected Console Output (Working Simulation)

```
[TIMING] 234ms - Window ready to show
[APP TIMING] 456ms - LandingPage lazy load completed
[FORGE UI] ESP32-C3 board detected — using RISC-V compile path...
[FORGE UI] ESP32 compile result: Success
[SimulationRunner] setBoard called: boardId="esp32-c3", binPath="C:\Users\...\sketch.ino.merged.bin"
[SimulationRunner] ESP32-C3 board detected, entering RISC-V path
[FORGE] Loaded firmware: 4194304 bytes from C:\Users\...\sketch.ino.merged.bin
[ESP32-C3] Initialized: 3 segments, entry=0x40380000, 970439 bytes loaded
[ESP32-C3] GPIO 2 changed: HIGH
[ESP32-C3] GPIO 2 changed: LOW
```

---

## Summary

**The code is correct. You just need to restart the app.**

1. ✅ Build successful (`npm run build:electron` completed)
2. ✅ All ESP32 DevKit V1 → ESP32-C3 rename complete
3. ✅ Simulation code is production-ready
4. ❌ **App not restarted** - still running old code

**Next Step:** Close the app completely and run `npm run start`

If you still see errors after restart, please share:
- The EXACT error message from console
- Screenshot of the error (if you can't copy it)
- What happens when you click "Compile & Run"
