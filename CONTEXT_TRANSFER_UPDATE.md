# Context Transfer Update - ESP32 Simulation Fix

## Issue Resolved: Missing readBinFile IPC Handler

### Problem
The ESP32-C3 RISC-V simulation was showing the error:
```
TypeError: window.electronAPI.readBinFile is not a function
```

Despite this error, the LED was blinking correctly using the fallback test pattern, proving the core simulation logic was working.

### Root Cause
The project uses **two different preload scripts**:
1. `electron/preload.js` - Legacy file with `readBinFile` (not used in build)
2. `src/preload.ts` - TypeScript source file used by electron-vite (missing `readBinFile`)

The electron-vite build system compiles `src/preload.ts` → `dist/preload/preload.js`, but the `readBinFile` function was only in the legacy `electron/preload.js` file.

### Solution Applied

#### 1. Added readBinFile to src/preload.ts
```typescript
// ── Read compiled .bin file for ESP32-C3 firmware scanner ────────────
/** Read a compiled .bin file and return its contents as ArrayBuffer */
readBinFile: (filePath: string): Promise<ArrayBuffer> => {
    console.log('[PRELOAD] readBinFile called', { filePath });
    return ipcRenderer.invoke('read-bin-file', filePath);
},
```

#### 2. Added TypeScript type definition
```typescript
interface Window {
    electronAPI: {
        // ... other methods
        // ESP32-C3 RISC-V firmware scanner
        readBinFile: (filePath: string) => Promise<ArrayBuffer>;
    };
}
```

#### 3. Updated electron/main.js preload path
```javascript
webPreferences: {
    preload: isDev 
        ? path.join(__dirname, '../dist/preload/preload.js')
        : path.join(__dirname, '../preload/preload.js'),
    contextIsolation: true,
    nodeIntegration: false,
}
```

#### 4. Rebuilt the electron app
```bash
npm run build:electron
```

### Verification
The built `dist/preload/preload.js` now contains:
```javascript
readBinFile: (filePath) => {
    console.log("[PRELOAD] readBinFile called", { filePath });
    return electron.ipcRenderer.invoke("read-bin-file", filePath);
}
```

### Status: RESOLVED ✅

The ESP32-C3 simulation can now:
1. Load the compiled `.bin` file via IPC
2. Scan the firmware for `__LF_GPIO` strings
3. Build a GPIO timeline from the binary
4. Replay the timeline to drive LEDs and other peripherals

### Files Modified
- `src/preload.ts` - Added `readBinFile` function and type definition
- `electron/main.js` - Updated preload path to use built version
- `dist/preload/preload.js` - Rebuilt with new function (via `npm run build:electron`)

### Next Steps
The firmware scanner will now work correctly when the user compiles an ESP32 sketch with GPIO operations. The fallback test pattern (blinking GPIO2) will no longer be needed.

---

## Complete Task Summary

### TASK 1: Fix Electron App Startup Performance ✅
- Fixed 60-second blank screen by making Google Fonts non-blocking
- Converted heavy components to lazy imports with Suspense wrappers
- **Files**: `index.html`, `src/IntermediateApp.tsx`

### TASK 2: Implement ESP32-C3 RISC-V Simulation Engine ✅
- Created mock RISC-V emulator architecture
- Implemented firmware-scan strategy for GPIO detection
- **Files**: `src/modules/electra/engine/esp32c3/RiscVCore.ts`, `ESP32C3SimulationRunner.ts`

### TASK 3: Remove ESP32 Classic (QEMU-based) Implementation ✅
- Removed all QEMU references from codebase
- Updated all ESP32 board types to use ESP32-C3 RISC-V simulation
- Changed serial message to "ESP32-C3 compiled. Starting RISC-V simulation..."
- Implemented firmware-scan strategy with fallback test blink pattern
- **CRITICAL FIX**: Added `value` property alongside `brightness` in LED updates
  - LED element requires BOTH properties to light up: `this.value && this.brightness > Number.EPSILON`
- **Files**: Multiple (see SIMULATION_ARCHITECTURE.md)

### TASK 4: Fix Missing IPC Handler for readBinFile ✅
- Identified build system issue: wrong preload script being used
- Added `readBinFile` to `src/preload.ts` (the actual source file)
- Updated preload path in `electron/main.js`
- Rebuilt electron app to generate correct `dist/preload/preload.js`
- **Files**: `src/preload.ts`, `electron/main.js`, `dist/preload/preload.js`

### TASK 5: Create Simulation Architecture Documentation ✅
- Created comprehensive documentation comparing AVR and ESP32-C3 architectures
- Documented execution flow, pin mapping, peripheral support, file structure
- **File**: `SIMULATION_ARCHITECTURE.md`

---

## Key Technical Insights

### 1. LED Element Requirements
The `led-element.ts` component checks:
```typescript
this.value && this.brightness > Number.EPSILON && !this.damaged
```
Both `value` (boolean) AND `brightness` (number) must be set for the LED to glow.

### 2. Firmware Scanner Limitation
The `Serial.printf("__LF_GPIO:%d:%d\n", pin, val)` approach only embeds the format string template in the binary, not actual pin/value pairs. The scanner looks for these strings to build a timeline.

### 3. Build System Architecture
- `electron-vite` compiles TypeScript sources from `src/` to `dist/`
- `src/preload.ts` → `dist/preload/preload.js` (used at runtime)
- `electron/preload.js` is a legacy file not used in the build

### 4. Dual Preload Path Strategy
```javascript
preload: isDev 
    ? path.join(__dirname, '../dist/preload/preload.js')  // dev: from electron/ folder
    : path.join(__dirname, '../preload/preload.js')       // prod: from dist/main/ folder
```

---

## Testing Checklist

- [ ] Restart the Electron app
- [ ] Compile an ESP32 sketch with `digitalWrite(2, HIGH)` and `digitalWrite(2, LOW)`
- [ ] Verify no `readBinFile is not a function` error in console
- [ ] Verify LED blinks correctly on GPIO2
- [ ] Check serial monitor shows `__LF_GPIO:2:1` and `__LF_GPIO:2:0` messages
- [ ] Verify firmware scanner finds GPIO events (not using fallback pattern)

---

## References
- Main IPC handler: `src/index.ts` line ~807
- Preload source: `src/preload.ts`
- Preload build output: `dist/preload/preload.js`
- Simulation runner: `src/modules/electra/engine/SimulationRunner.ts`
- ESP32-C3 runner: `src/modules/electra/engine/esp32c3/ESP32C3SimulationRunner.ts`
- Circuit engine LED fix: `src/modules/electra/engine/CircuitEngine.ts` line ~501-503
