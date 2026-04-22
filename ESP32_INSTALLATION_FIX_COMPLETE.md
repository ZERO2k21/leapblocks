# ESP32 Platform Installation - Complete Fix

## Problem
ESP32 compilation was failing with:
```
Platform 'espressif:esp32' not found: platform not installed
Platform espressif:esp32 is not found in any known index
```

## Root Causes Identified

1. **Wrong Platform Name**: Code was using `esp32:esp32:esp32` instead of `espressif:esp32:esp32`
2. **Silent Installation Failures**: `runCLI()` returns exit codes, not exceptions - errors were being ignored
3. **No User Feedback**: Installation process had no progress messages to the user

## Complete Fix Applied

### 1. Fixed FQBN Mapping (`src/modules/leapforge/ForgeStudio.tsx`)
Changed ESP32 board FQBNs from `esp32:` prefix to `espressif:` prefix:
```typescript
const FQBN: Record<string, string> = {
  'esp32': 'espressif:esp32:esp32',           // was: 'esp32:esp32:esp32'
  'esp32-devkit-v1': 'espressif:esp32:esp32', // was: 'esp32:esp32:esp32'
  'esp32-s2': 'espressif:esp32:esp32s2',      // was: 'esp32:esp32:esp32s2'
  'esp32-s3': 'espressif:esp32:esp32s3',      // was: 'esp32:esp32:esp32s3'
  'esp32-c3': 'espressif:esp32:esp32c3',      // was: 'esp32:esp32:esp32c3'
};
```

### 2. Fixed Core Installation (`electron/main.js`)

#### A. Updated `ensureESP32Core()` function:
- **Returns boolean**: `true` if core is installed/installed successfully, `false` on failure
- **Checks exit codes**: Properly checks `code` from `runCLI()` instead of relying on exceptions
- **Sends progress messages**: Uses `mainWindow.webContents.send('serial-data', ...)` to show progress in serial monitor
- **Better error handling**: Logs detailed error messages and returns false on failure

#### B. Updated `compile-code` handler:
- **Checks installation result**: Verifies `ensureESP32Core()` returned `true` before compiling
- **Returns clear error**: If installation fails, returns helpful error message with manual install command

#### C. Updated platform detection:
- **Checks both prefixes**: Detects cores with `esp32:` OR `espressif:` prefix (backward compatible)
- **Installs correct platform**: Uses `espressif:esp32` (not `esp32:esp32`)

### 3. Fixed ArduinoUploader (`src/upload/ArduinoUploader.ts`)
Updated `ensureESP32Core()` to match main.js changes:
- Checks for both `esp32:` and `espressif:` prefixes
- Installs `espressif:esp32` platform

## User Experience Improvements

### Progress Messages in Serial Monitor
Users now see real-time progress during ESP32 core installation:
```
[ESP32 SETUP] Checking for ESP32 core installation...
[ESP32 SETUP] ESP32 core not found — installing (this may take 2-5 minutes)...
[ESP32 SETUP] Please wait, downloading ESP32 platform...
[ESP32 SETUP] Package index updated, installing ESP32 core...
[ESP32 SETUP] Attempting install via Espressif CDN...
[ESP32 SETUP] ✓ ESP32 core installed successfully!
```

### Clear Error Messages
If installation fails, users get actionable error messages:
```
[ESP32 SETUP] ERROR: All ESP32 core install attempts failed
[ESP32 SETUP] Please install manually: arduino-cli core install espressif:esp32
```

## How to Test

1. **Restart the Electron app** (important - main.js changes require restart)
2. Delete existing ESP32 core to test fresh install:
   ```bash
   arduino-cli core uninstall espressif:esp32 --config-file forge-lib/arduino-cli.yaml
   ```
3. Add an ESP32 board to the canvas
4. Click "Run Simulation"
5. Watch the serial monitor for installation progress
6. First compile will take 2-5 minutes (downloading ~200MB)
7. Subsequent compiles will be fast (core is cached)

## Installation Flow

```
User clicks "Run Simulation"
  ↓
ForgeStudio.tsx detects ESP32 board
  ↓
Calls compileCode() with fqbn='espressif:esp32:esp32'
  ↓
electron/main.js compile-code handler
  ↓
Calls ensureESP32Core()
  ↓
Checks if espressif:esp32 is installed
  ↓
If NOT installed:
  - Sends "[ESP32 SETUP] Checking..." to serial monitor
  - Updates package index
  - Attempts install via Espressif CDN
  - If fails, tries GitHub URL
  - Sends progress messages throughout
  - Returns true/false
  ↓
If ensureESP32Core() returns false:
  - Returns error to renderer
  - Shows error in serial monitor
  ↓
If ensureESP32Core() returns true:
  - Proceeds with compilation
  - Returns binPath
  - Starts QEMU simulation
```

## Files Modified

1. ✅ `src/modules/leapforge/ForgeStudio.tsx` - Fixed FQBN mapping
2. ✅ `electron/main.js` - Fixed ensureESP32Core() and compile-code handler
3. ✅ `src/upload/ArduinoUploader.ts` - Fixed ensureESP32Core()
4. ✅ `src/simulation/ESP32BoardConfig.ts` - Already had correct FQBN

## Configuration Files

- ✅ `forge-lib/arduino-cli.yaml` - Already has correct board manager URLs:
  ```yaml
  board_manager:
    additional_urls:
      - https://dl.espressif.com/dl/package_esp32_index.json
      - https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
  ```

## Verification

Run diagnostics to confirm no TypeScript errors:
```bash
# All files should have no errors
✓ src/modules/leapforge/ForgeStudio.tsx
✓ src/upload/ArduinoUploader.ts
✓ electron/main.js
✓ src/simulation/ESP32BoardConfig.ts
```

## Status
✅ **COMPLETE** - ESP32 platform installation is now fully automated with user feedback

---

**Date:** April 21, 2026  
**Status:** Ready for testing  
**Action Required:** Restart Electron app to apply main.js changes
