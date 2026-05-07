# ESP32-C3 Illegal Instruction Fix

## Problem
The ESP32-C3 RISC-V simulator was encountering illegal instructions (0x0) starting at PC=0x404cf630, causing the simulation to fail with thousands of error messages.

## Root Cause
The **primary issue** was a **missing IPC handler** in `electron/main.js`. The renderer process was calling `window.electronAPI.readBinFile(binPath)` which invoked `ipcRenderer.invoke('read-bin-file', filePath)`, but there was no corresponding `ipcMain.handle('read-bin-file', ...)` handler to respond to it.

This caused the IPC call to hang or return undefined, resulting in an empty firmware buffer being passed to the RISC-V simulator. When the CPU tried to execute from the entry point, it found only zeros (uninitialized memory), leading to thousands of illegal instruction 0x0 errors.

**Secondary issues** that would have occurred after fixing the IPC handler:
1. **Empty firmware binary** - The .bin file is empty or wasn't generated correctly
2. **Wrong entry point** - The PC is set to an address that doesn't contain valid code
3. **Failed firmware load** - The binary wasn't loaded into IRAM/DRAM correctly

## Fixes Applied

### 1. **CRITICAL FIX: Added Missing IPC Handler in electron/main.js**
The root cause was that the `read-bin-file` IPC handler was **completely missing** from `electron/main.js`. The preload.js file was calling `ipcRenderer.invoke('read-bin-file', filePath)` but there was no handler to respond to it, causing the firmware to be empty.

**Added handler:**
```javascript
ipcMain.handle('read-bin-file', async (_, filePath) => {
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`Binary file not found: ${filePath}`);
  }
  
  // Read the file as a Buffer
  const buffer = fs.readFileSync(filePath);
  
  // Return as ArrayBuffer (convert Node Buffer to ArrayBuffer)
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
});
```

### 2. Enhanced Diagnostics in ESP32C3SimulationRunner.ts
- Added firmware size validation
- Added entry point verification
- Added memory read test at entry point to detect uninitialized memory
- Changed illegal instruction handler from `console.warn` to `console.error`
- **Auto-halt on 0x0 instruction** to prevent infinite error loops

```typescript
// Now halts CPU when hitting illegal instruction 0x0
if (insn === 0) {
    console.error('[ESP32-C3] Halting CPU due to illegal instruction 0x0');
    c.halted = true;
}
```

### 3. Enhanced Firmware Loader Diagnostics
- Added hex dump of first 16 bytes
- Added magic number logging
- Added format detection logging

### 4. Improved Error Handling in SimulationRunner.ts
- Changed from silent fallback (empty buffer) to **throwing an error**
- Added binary file existence check
- Added hex preview of loaded bytes
- Better error messages with file path

## How to Debug

When you see illegal instruction errors, check the console for these diagnostic messages:

```
[FORGE] Attempting to read binary from: /path/to/file.bin
[FORGE] Loaded firmware: 12345 bytes from /path/to/file.bin
[FORGE] First bytes: 0xe9 0x02 0x02 0x40 ...
[FirmwareLoader] Loading firmware: 12345 bytes
[FirmwareLoader] Magic: 0xe9
[ESP32-C3] Entry point: 0x40380000, segments loaded: 2
[ESP32-C3] First instruction at entry point: 0x12345678
```

### Red Flags:
- ❌ `Loaded firmware: 0 bytes` - Binary is empty
- ❌ `First instruction at entry point: 0x0` - Entry point not loaded
- ❌ `Could not read .bin via IPC` - File doesn't exist or IPC failed
- ❌ `Firmware too small` - Compilation failed

## Common Causes & Solutions

### 1. Compilation Failed
**Symptom:** Empty or very small .bin file  
**Solution:** Check compiler output for errors. Ensure ESP32 toolchain is installed.

### 2. Wrong File Path
**Symptom:** IPC read error  
**Solution:** Verify `binPath` is absolute and points to the actual .bin file in the build directory.

### 3. Wrong Board FQBN
**Symptom:** Binary format mismatch  
**Solution:** Ensure FQBN is `esp32:esp32:esp32c3` for ESP32-C3 boards.

### 4. Missing Entry Point
**Symptom:** Entry point at 0x0 or outside IRAM  
**Solution:** Check linker script. ESP32-C3 entry should be in range 0x40380000-0x403DFFFF.

## Testing the Fix

1. **Compile a simple sketch:**
```cpp
void setup() {
  Serial.begin(115200);
  Serial.println("Hello ESP32-C3!");
}

void loop() {
  delay(1000);
}
```

2. **Check console output** - Should see:
   - Firmware size > 0
   - Valid magic number (0x7f454c46 for ELF or 0xe9 for ESP32 image)
   - Entry point in IRAM range
   - First instruction != 0x0

3. **Simulation should:**
   - Start without errors
   - Halt gracefully if it hits uninitialized memory (instead of infinite loop)
   - Show clear error message pointing to the root cause

## Next Steps

If you still see illegal instruction errors after these fixes:

1. **Check the .bin file manually:**
   ```bash
   ls -lh /path/to/sketch.bin
   hexdump -C /path/to/sketch.bin | head -n 5
   ```

2. **Verify ESP32 toolchain:**
   ```bash
   arduino-cli core list | grep esp32
   ```

3. **Check IPC handler** in `electron/main.js`:
   - Ensure `read-bin-file` handler exists
   - Verify it returns ArrayBuffer, not string

4. **Enable verbose logging** in CompilerService to see full compilation output

## Files Modified

- **`electron/main.js`** - **CRITICAL FIX**: Added missing `read-bin-file` IPC handler
- `src/modules/electra/engine/esp32c3/ESP32C3SimulationRunner.ts` - Enhanced diagnostics
- `src/modules/electra/engine/esp32c3/compiler/FirmwareLoader.ts` - Enhanced diagnostics
- `src/modules/electra/engine/SimulationRunner.ts` - Improved error handling
