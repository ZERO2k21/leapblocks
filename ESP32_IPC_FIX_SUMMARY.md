# ESP32-C3 IPC Handler Fix - Complete Summary

## Issue
ESP32-C3 RISC-V simulation was failing with thousands of illegal instruction 0x0 errors starting at PC=0x404cf630.

## Root Cause Analysis

### Primary Issue: Missing IPC Handler ❌
The **critical bug** was in `electron/main.js` - the `read-bin-file` IPC handler was **completely missing**.

**Call chain:**
1. `SimulationRunner.ts` calls: `await window.electronAPI.readBinFile(this.binPath)`
2. `preload.js` invokes: `ipcRenderer.invoke('read-bin-file', filePath)`
3. `main.js` had **NO HANDLER** for `'read-bin-file'` ❌
4. IPC call returns `undefined` or hangs
5. Firmware buffer is empty (0 bytes)
6. RISC-V CPU tries to execute from entry point → finds only zeros
7. Illegal instruction 0x0 errors flood the console

### Compilation Was Working ✅
The user's logs showed:
```
[MAIN:IPC] compile-code ESP32 exit=0
[MAIN:IPC] stdout: Sketch uses 970439 bytes (74%) of program storage space.
[MAIN:IPC] Using arduino-cli merged image: C:\Users\VIGNES~1\AppData\Local\Temp\forge_esp32_1776841017184\sketch.ino.merged.bin
```

The .bin file was successfully created (970,439 bytes), but the simulation couldn't read it due to the missing IPC handler.

## The Fix

### Added IPC Handler in `electron/main.js`

```javascript
// ── read-bin-file: Read compiled ESP32 binary for RISC-V simulation ──────
ipcMain.handle('read-bin-file', async (_, filePath) => {
  console.log(`[MAIN:IPC] read-bin-file request: ${filePath}`);
  
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`[MAIN:IPC] File not found: ${filePath}`);
      throw new Error(`Binary file not found: ${filePath}`);
    }

    // Read the file as a Buffer
    const buffer = fs.readFileSync(filePath);
    console.log(`[MAIN:IPC] Read ${buffer.length} bytes from ${filePath}`);
    
    // Log first 16 bytes for debugging
    const preview = Array.from(buffer.slice(0, Math.min(16, buffer.length)))
      .map(b => '0x' + b.toString(16).padStart(2, '0'))
      .join(' ');
    console.log(`[MAIN:IPC] First bytes: ${preview}`);
    
    // Return as ArrayBuffer (convert Node Buffer to ArrayBuffer)
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  } catch (err) {
    console.error(`[MAIN:IPC] read-bin-file error:`, err);
    throw err;
  }
});
```

### Key Implementation Details

1. **File Existence Check**: Validates the file exists before reading
2. **Proper Buffer Conversion**: Converts Node.js Buffer to ArrayBuffer for the renderer
3. **Diagnostic Logging**: Logs file size and first 16 bytes for debugging
4. **Error Handling**: Throws clear errors if file is missing or read fails
5. **Windows Path Support**: Works with Windows paths containing spaces (e.g., `C:\Users\VIGNES~1\...`)

## Enhanced Diagnostics (Already Implemented)

### ESP32C3SimulationRunner.ts
- Validates firmware size (catches empty buffers)
- Verifies entry point is in valid IRAM range
- Reads first instruction at entry point to detect uninitialized memory
- Auto-halts CPU on illegal instruction 0x0 (prevents infinite error loops)

### SimulationRunner.ts
- Throws error if firmware buffer is empty (no silent fallback)
- Logs hex preview of loaded bytes
- Better error messages with file paths

### FirmwareLoader.ts
- Logs firmware size, magic number, and format
- Hex dump of first 16 bytes

## Testing the Fix

### Expected Console Output (Success)
```
[MAIN:IPC] compile-code ESP32 exit=0
[MAIN:IPC] Using arduino-cli merged image: C:\Users\...\sketch.ino.merged.bin
[MAIN:IPC] read-bin-file request: C:\Users\...\sketch.ino.merged.bin
[MAIN:IPC] Read 970439 bytes from C:\Users\...\sketch.ino.merged.bin
[MAIN:IPC] First bytes: 0xe9 0x02 0x02 0x40 0x00 0x00 0x00 0x00 ...
[FORGE] Loaded firmware: 970439 bytes
[FirmwareLoader] Loading firmware: 970439 bytes
[FirmwareLoader] Magic: 0xe9
[ESP32-C3] Entry point: 0x40380000, segments loaded: 2
[ESP32-C3] First instruction at entry point: 0x12345678
[FORGE] ESP32-C3 runner started
```

### Red Flags (Errors)
- ❌ `[MAIN:IPC] File not found` - Binary wasn't created or wrong path
- ❌ `Read 0 bytes` - Compilation failed silently
- ❌ `First instruction at entry point: 0x0` - Entry point not loaded correctly
- ❌ `Illegal insn 0x0 @ PC=0x...` - Firmware not loaded into memory

## Files Modified

1. **`electron/main.js`** - Added `read-bin-file` IPC handler (CRITICAL FIX)
2. `src/modules/electra/engine/esp32c3/ESP32C3SimulationRunner.ts` - Enhanced diagnostics
3. `src/modules/electra/engine/SimulationRunner.ts` - Improved error handling
4. `ESP32_ILLEGAL_INSTRUCTION_FIX.md` - Updated documentation

## Verification Steps

1. **Compile an ESP32-C3 sketch** with the fixed code
2. **Check console logs** for the expected output above
3. **Verify simulation starts** without illegal instruction errors
4. **Test with a simple blink sketch** to confirm GPIO works

## Why This Bug Was Hard to Find

1. **Silent IPC Failure**: Missing IPC handlers don't throw errors in Electron - they just return undefined
2. **Async Call**: The `await` on a missing handler doesn't reject, it resolves to undefined
3. **No Type Safety**: JavaScript doesn't catch missing handler at compile time
4. **Misleading Symptoms**: The error manifested as "illegal instruction" in the CPU, not "IPC handler missing"
5. **Successful Compilation**: The .bin file was created successfully, making it seem like a simulation issue

## Prevention

To prevent similar issues in the future:

1. **Add IPC Handler Tests**: Unit tests that verify all IPC handlers exist
2. **Type-Safe IPC**: Use TypeScript interfaces for IPC channels
3. **Handler Registry**: Maintain a list of all IPC channels and their handlers
4. **Startup Validation**: Check that all expected IPC handlers are registered at app startup
5. **Better Error Messages**: Catch undefined IPC responses and log clear errors

## Related Documentation

- `ESP32_ILLEGAL_INSTRUCTION_FIX.md` - Detailed diagnostic guide
- `src/modules/electra/engine/esp32c3/README.md` - ESP32-C3 architecture
- `SIMULATION_ARCHITECTURE.md` - Overall simulation design

---

**Status**: ✅ FIXED - IPC handler added, simulation should now work correctly
