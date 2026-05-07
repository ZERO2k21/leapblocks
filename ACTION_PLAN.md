# ESP32 Platform Installation - Action Plan

## Immediate Actions Required

### 1. Install ESP32 Platform (REQUIRED)
**Double-click:** `install-esp32-platform.bat`

This will:
- Update the arduino-cli package index
- Download and install the ESP32 platform (~200MB)
- Take 2-5 minutes depending on internet speed

**Wait for the message:** "Installation Complete!"

### 2. Restart the Electron App (REQUIRED)
The changes to `electron/main.js` require a full app restart:

1. **Close all app windows**
2. **Open Task Manager** (Ctrl+Shift+Esc)
3. **End all "LeapBlocks" or "Electron" processes**
4. **Start the app again**

### 3. Test ESP32 Compilation
1. Add an ESP32 board to the canvas
2. Click "Run Simulation"
3. Watch the serial monitor for progress messages

## What to Expect

### First Compile (if platform wasn't installed)
You should see in the serial monitor:
```
[SYSTEM] Checking ESP32 platform installation...
[ESP32 SETUP] Checking for ESP32 core installation...
[ESP32 SETUP] ✓ ESP32 core already installed
```

### If Installation is Needed
```
[ESP32 SETUP] ESP32 core not found — installing (this may take 2-5 minutes)...
[ESP32 SETUP] Please wait, downloading ESP32 platform...
[ESP32 SETUP] Package index updated, installing ESP32 core...
[ESP32 SETUP] Attempting install via Espressif CDN...
[ESP32 SETUP] ✓ ESP32 core installed successfully!
```

### Successful Compilation
```
[FORGE UI] ESP32 compile result: Success
ESP32 compiled. Starting QEMU simulation...
```

## Troubleshooting

### If you still get "Platform not found" error:

1. **Run diagnostic:** Double-click `check-esp32-platform.bat`
   - This will show if the platform is actually installed

2. **Check console logs:** Look for these in your terminal:
   ```
   [compile-code] ========== COMPILE START ==========
   [compile-code] FQBN: espressif:esp32:esp32
   [compile-code] *** ESP32 DETECTED - CALLING ensureESP32Core() ***
   ```
   
   **If you DON'T see these logs:**
   - The app wasn't restarted properly
   - Kill all Electron processes and restart

3. **Verify FQBN:** The log should show `espressif:esp32:esp32` (not `esp32:esp32:esp32`)

4. **Manual installation:** If automatic installation fails, the script will do it for you

## Files Created for You

1. **`install-esp32-platform.bat`** - Installs ESP32 platform automatically
2. **`check-esp32-platform.bat`** - Checks if platform is installed
3. **`MANUAL_ESP32_INSTALL.md`** - Manual installation instructions
4. **`ESP32_TROUBLESHOOTING.md`** - Comprehensive troubleshooting guide

## Code Changes Made

### ✅ Fixed Files:
1. `src/modules/electra/ForgeStudio.tsx` - FQBN mapping corrected
2. `electron/main.js` - Installation logic fixed with proper error handling
3. `src/upload/ArduinoUploader.ts` - Platform name corrected

### ✅ Configuration:
- `forge-lib/arduino-cli.yaml` - Already has correct board manager URLs

## Success Criteria

You'll know it's working when:
- [ ] `check-esp32-platform.bat` shows ESP32 platform installed
- [ ] Console logs show "ESP32 DETECTED - CALLING ensureESP32Core()"
- [ ] Serial monitor shows "[ESP32 SETUP]" messages
- [ ] Compilation succeeds and returns a .bin file path
- [ ] QEMU simulation starts

## Quick Start (TL;DR)

```bash
# 1. Install platform
install-esp32-platform.bat

# 2. Restart app completely (kill all processes)

# 3. Try compiling ESP32 code

# 4. If issues, run diagnostic
check-esp32-platform.bat
```

## Need Help?

See `ESP32_TROUBLESHOOTING.md` for detailed troubleshooting steps.

---

**Status:** Ready to test  
**Next Step:** Run `install-esp32-platform.bat`
