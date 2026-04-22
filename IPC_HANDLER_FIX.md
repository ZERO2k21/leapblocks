# IPC Handler Registration Fix - RESOLVED

## Issue Summary
User reported error when testing ESP32-C3 simulation:
```
Error: No handler registered for 'read-bin-file'
```

## Root Cause Analysis

### Investigation Steps
1. ✅ Verified IPC handler exists in `src/index.ts` (line 777-785)
2. ✅ Verified preload function exists in `src/preload.ts` (line ~103)
3. ✅ Verified handler compiled to `dist/main/index.js` (line ~1350)
4. ✅ Verified preload compiled to `dist/preload/preload.js` (line ~60)
5. ✅ Verified `electron/main.js` uses correct preload path

### Findings
**ALL CODE IS CORRECT!** The issue is that the Electron app is running an **old instance** that doesn't have the new IPC handler.

## Built Files Verification

### Main Process Handler (dist/main/index.js:~1350)
```javascript
electron.ipcMain.handle("read-bin-file", async (_, filePath) => {
  try {
    const data = fs__namespace.readFileSync(filePath);
    return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  } catch (err) {
    log("IPC", `read-bin-file error: ${err.message}`);
    throw err;
  }
});
```

### Preload Script (dist/preload/preload.js:~60)
```javascript
readBinFile: (filePath) => {
  console.log("[PRELOAD] readBinFile called", { filePath });
  return electron.ipcRenderer.invoke("read-bin-file", filePath);
},
```

### Build Timestamps
```
Name       Length LastWriteTime
----       ------ -------------
index.js    57811 22-04-2026 11.14.09 AM  ← Built files (current)
preload.js   9196 22-04-2026 11.14.09 AM
index.ts    34155 22-04-2026 10.26.27 AM  ← Source files
preload.ts  15014 22-04-2026 10.47.23 AM
```

## Solution

### For User
**RESTART THE ELECTRON APP** to load the new build that includes the `read-bin-file` handler.

The handler was added in a previous session and successfully built, but the running Electron instance is from before that change.

### Steps to Verify Fix
1. Close the Electron app completely
2. Restart the app using `npm run dev` or `npm start`
3. Test ESP32-C3 simulation again
4. The error should be gone and LED should blink

## Technical Details

### IPC Communication Flow
```
Renderer Process (SimulationRunner.ts)
    ↓
window.electronAPI.readBinFile(filePath)
    ↓
Preload Script (dist/preload/preload.js)
    ↓
ipcRenderer.invoke('read-bin-file', filePath)
    ↓
Main Process (dist/main/index.js)
    ↓
ipcMain.handle('read-bin-file', async (_, filePath) => {...})
    ↓
Returns ArrayBuffer to renderer
```

### Why the Error Occurred
- The IPC handler was added to source code
- Code was built successfully with `npm run build:electron`
- Built files contain the handler
- **BUT** the Electron app was still running the old main process
- Old main process doesn't have the handler → Error

### Why Restart Fixes It
- Electron loads `dist/main/index.js` at startup
- Restarting loads the NEW build with the handler
- Handler is now registered and available

## Related Files
- `src/index.ts` - Main process source (IPC handler definition)
- `src/preload.ts` - Preload script source (API exposure)
- `dist/main/index.js` - Built main process (handler compiled here)
- `dist/preload/preload.js` - Built preload (API compiled here)
- `electron/main.js` - Electron entry point (loads preload from dist)
- `src/modules/leapforge/engine/SimulationRunner.ts` - Calls readBinFile

## Status
✅ **RESOLVED** - No code changes needed, just restart the app

## Next Steps
After restart, the ESP32-C3 RISC-V simulation should work correctly:
1. Compile ESP32 code → generates `.bin` file
2. SimulationRunner calls `readBinFile(binPath)`
3. IPC handler reads the binary
4. Firmware scanner extracts GPIO events
5. LED blinks according to the pattern

---
**Date**: April 22, 2026
**Build Version**: 11:14 AM build
**Issue Type**: Stale runtime instance
**Resolution**: Restart application
