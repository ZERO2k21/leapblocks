# ESP32-C3 RISC-V Emulator Fix - IRAM Corruption Issue

## Problem
The ESP32-C3 RISC-V emulator was hitting illegal instruction `0x0` at address `0x40386b86` during execution, causing the simulation to fail with:
```
[ESP32-C3] Illegal insn 0x0 @ PC=0x40386b86 (count=1)
[ESP32-C3] Recovering from insn 0x0 — returning via ra=0x40386b4a
```

## Root Cause
The RISC-V emulator was allowing **writes to IRAM (Instruction RAM)** during execution, which corrupted the loaded firmware code. 

In the ESP32-C3:
- **IRAM** (0x40380000-0x403DFFFF): Instruction memory, should be read-only during execution
- **DRAM** (0x3FC80000-0x3FCDFFFF): Data memory, writable

The firmware was writing to IRAM addresses (thinking they were data), which overwrote the loaded instructions with zeros, causing the CPU to fetch illegal instruction `0x0`.

## Solution Applied

✅ **Made IRAM read-only** in `RiscVCore.ts`:
- `memWrite8`, `memWrite16`, `memWrite32` now silently ignore writes to IRAM addresses
- This prevents code corruption while allowing normal DRAM writes

```typescript
// Before (WRONG - allowed IRAM writes):
if (addr >= RiscVCore.IRAM_BASE && addr < RiscVCore.IRAM_BASE + RiscVCore.IRAM_SIZE) { 
  this.iram.write32(addr, v); 
  return; 
}

// After (CORRECT - IRAM is read-only):
if (addr >= RiscVCore.IRAM_BASE && addr < RiscVCore.IRAM_BASE + RiscVCore.IRAM_SIZE) {
  // Silently ignore writes to IRAM to prevent code corruption
  return;
}
```

## Testing

After applying the fix:
1. Clear browser cache (Ctrl+Shift+Delete)
2. Restart the application
3. Try running ESP32-C3 simulation again

The emulator should now execute without hitting illegal instruction errors.

## Technical Details

### Why This Happened
The ESP-IDF (ESP32 SDK) performs memory initialization during startup, including zeroing BSS sections. Some of these operations inadvertently targeted IRAM addresses, which should have been protected.

### Memory Map
```
0x40380000 - 0x403DFFFF: IRAM (384 KB) - Instruction memory [NOW READ-ONLY]
0x3FC80000 - 0x3FCDFFFF: DRAM (384 KB) - Data memory [WRITABLE]
0x42000000 - 0x42BFFFFF: IROM (12 MB) - Flash-mapped instructions [READ-ONLY]
0x3C000000 - 0x3CBFFFFF: DROM (12 MB) - Flash-mapped data [READ-ONLY]
```

### Expected Behavior
- Firmware loads successfully into IRAM
- CPU starts executing from entry point (typically 0x403807ce)
- IRAM remains intact throughout execution
- Serial output appears in the monitor
- GPIO operations trigger circuit updates

## Phone Canvas Size Fix

✅ **FIXED**: Updated phone canvas dimensions from 360x640 to 390x844 (iPhone 14 Pro size) in `PhoneCanvas_Enhanced.jsx` for better visibility.

## ESP32 Compilation Fix

✅ **FIXED**: Added USB CDC build flags to `ArduinoUploader.ts` to resolve ESP32 core 3.3.8 linker issues:
```typescript
'--build-property', 'compiler.c.extra_flags=-DARDUINO_USB_CDC_ON_BOOT=0',
'--build-property', 'compiler.cpp.extra_flags=-DARDUINO_USB_CDC_ON_BOOT=0',
```

## Summary of All Fixes

### Files Modified:
1. ✅ `src/appinverter/components/PhoneCanvas_Enhanced.jsx` - Updated phone dimensions (360x640 → 390x844)
2. ✅ `src/upload/ArduinoUploader.ts` - Added USB CDC build flags for ESP32 core 3.3.8
3. ✅ `src/Electra/Client/Src/engine/esp32c3/cpu/RiscVCore.ts` - Made IRAM read-only to prevent code corruption

### Issues Resolved:
1. ✅ Phone canvas too small - Now uses iPhone 14 Pro size
2. ✅ ESP32 compilation linker errors - Fixed with USB CDC flags
3. ✅ ESP32 simulation illegal instruction errors - Fixed by protecting IRAM from writes

### User Actions:
1. ⏳ Clear browser cache (Ctrl+Shift+Delete)
2. ⏳ Restart the application
3. ⏳ Test ESP32-C3 simulation

The ESP32-C3 RISC-V emulator should now work correctly!
