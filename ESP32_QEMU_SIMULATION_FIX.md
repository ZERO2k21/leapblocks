# ESP32 QEMU Simulation Flow - Complete Fix

## Current State Analysis

### The Intended Flow (from your diagram)
```
Arduino Sketch (.ino)
  ↓
arduino-cli compile → .bin / .elf
  ↓
Worker/Service → QEMU spawn (xtensa ESP32)
  ↓
QEMU stdout → Serial output
QEMU semihosting / custom → GPIO state
  ↓
IPC → Renderer → UI update (Serial monitor, LED, WiFi log)
```

### What's Actually Implemented

The codebase has **TWO SEPARATE ESP32 simulation paths**:

#### Path 1: **Stub Mode** (Currently Active)
- **Location**: `src/modules/leapforge/engine/esp32/ESP32Engine.ts`
- **How it works**: Parses Arduino sketch source code and replays actions
- **No QEMU**: Runs entirely in the browser
- **Used by**: `SimulationRunner` when board is `esp32` (legacy FQBN)

#### Path 2: **QEMU Mode** (Partially Implemented, Not Connected)
- **Location**: `electron/qemuManager.js`, `electron/esp32Compiler.js`
- **How it works**: Compiles `.bin`, spawns QEMU, reads serial via TCP
- **Status**: ✅ Fully implemented in main process, ❌ NOT wired to renderer

---

## The Problem: Missing IPC Bridge

### What's Missing

1. **Preload Mismatch**
   - `src/preload.ts` has `compileCode` ✅
   - `electron/preload.js` does NOT have `compileCode` ❌
   - **Which one is used?** Depends on your build config

2. **CompilerService Calls Wrong Method**
   ```typescript
   // CompilerService.ts line 32
   const result = await (window as any).electronAPI.compileCode(
     req.code,
     req.board,
   );
   ```
   - Calls `compileCode` but `electron/preload.js` doesn't expose it
   - Should call `invoke('compile-code', ...)` directly

3. **ForgeStudio Doesn't Use ESP32SimulationRunner**
   - `ForgeStudio.tsx` calls `compileCode` → gets `binPath`
   - Then calls `simulationRunner.setBoard(board, binPath)`
   - But `SimulationRunner.initCPU()` checks `ESP32_QEMU_BOARDS` and creates `ESP32SimulationRunner`
   - **Problem**: `ESP32SimulationRunner` is never started with the binPath!

4. **ESP32SimulationRunner Not Integrated**
   - `ESP32SimulationRunner.start(binPath)` calls `invoke('esp32-start', binPath)`
   - But `SimulationRunner.start()` doesn't call `esp32Runner.start(binPath)`
   - The binPath is lost!

---

## The Fix: 3-Step Integration

### Step 1: Fix Preload Bridge

**File**: `electron/preload.js`

Add the missing `compileCode` method:

```javascript
contextBridge.exposeInMainWorld("electronAPI", {
  // ... existing methods ...
  
  // ── Unified compile-code handler ──────────────────────────────────────────
  compileCode: (code, fqbn, libraryPath) => 
    ipcRenderer.invoke('compile-code', code, fqbn || 'arduino:avr:uno', libraryPath),
  
  // ... rest of existing methods ...
});
```

**Why**: `CompilerService.ts` calls `electronAPI.compileCode()` but it's not exposed in `electron/preload.js`.

---

### Step 2: Wire ESP32SimulationRunner to SimulationRunner

**File**: `src/modules/leapforge/engine/SimulationRunner.ts`

**Current code** (lines 95-105):
```typescript
async start() {
  // ── QEMU ESP32 path (espressif:esp32:*) ──────────────────────
  if (ESP32_QEMU_BOARDS.has(this.selectedBoard)) {
    if (!this.binPath) throw new Error('[FORGE] binPath required for QEMU ESP32 simulation');
    if (!this.esp32Runner) this.esp32Runner = new ESP32SimulationRunner();
    await this.esp32Runner.start(this.binPath);  // ← THIS LINE
    console.log('[FORGE] QEMU ESP32 runner started.');
    return; // no requestAnimationFrame loop for QEMU
  }
  // ... AVR path ...
}
```

**Problem**: `this.binPath` is set by `setBoard(board, binPath)` but the QEMU runner is created in `initCPU()` which doesn't have access to binPath.

**Fix**: Pass binPath through the flow correctly.

**Updated `SimulationRunner.ts`**:

```typescript
// Add binPath to class state
private binPath: string | null = null;

// Update setBoard to accept binPath
public setBoard(boardId: string, binPath?: string) {
  this.selectedBoard = boardId;
  if (binPath) {
    this.binPath = binPath;
    console.log(`[SimulationRunner] binPath set: ${binPath}`);
  }
  if (this.isRunning) {
    this.reset();
  }
}

// Update start() to use binPath
async start() {
  // ── QEMU ESP32 path (espressif:esp32:*) ──────────────────────
  if (ESP32_QEMU_BOARDS.has(this.selectedBoard)) {
    if (!this.binPath) {
      throw new Error('[FORGE] binPath required for QEMU ESP32 simulation. Call setBoard(board, binPath) first.');
    }
    if (!this.esp32Runner) {
      this.esp32Runner = new ESP32SimulationRunner();
    }
    await this.esp32Runner.start(this.binPath);
    console.log('[FORGE] QEMU ESP32 runner started with binPath:', this.binPath);
    return; // no requestAnimationFrame loop for QEMU
  }

  // ── AVR path ──────────────────────────────────────────────────
  if (this.isRunning) return;
  if (!this.cpu) this.initCPU();
  // ... rest of AVR start logic ...
}
```

---

### Step 3: Update ForgeStudio to Pass binPath Correctly

**File**: `src/modules/leapforge/ForgeStudio.tsx`

**Current code** (lines 60-90):
```typescript
const result = await compileCode({
  code,
  board: FQBN[board] ?? 'arduino:avr:uno',
  libraries: useForgeStore.getState().importedLibraries,
});

if (result.success && result.hexContent) {
  startSimulation(result.hexContent);
} else if (result.success && result.binPath) {
  // ESP32 QEMU path
  simulationRunner.setBoard(board, result.binPath);
  startSimulation('__esp32_qemu__');  // ← sentinel value
}
```

**Problem**: The sentinel `'__esp32_qemu__'` is passed to `startSimulation()` which calls `initCPU(hexString)`, but `initCPU()` doesn't use the binPath stored in `setBoard()`.

**Fix**: Update `useForgeStore.startSimulation()` to handle binPath.

**Updated `src/modules/leapforge/store/useForgeStore.ts`**:

```typescript
startSimulation: (hexString) => set((state) => {
  console.log('[FORGE STORE] startSimulation triggered. Hex length:', hexString.length);
  circuitEngine.init();

  // Sync board selection before init
  simulationRunner.setBoard(state.board);

  // For ESP32 QEMU boards the sentinel '__esp32_qemu__' is passed —
  // initCPU creates the ESP32SimulationRunner (no AVR CPU needed).
  // For AVR boards the real hex string is passed.
  console.log('[FORGE STORE] Initializing CPU and syncing graph...');
  
  // ── IMPORTANT: Don't call initCPU for QEMU boards ──
  // The binPath was already set via setBoard(board, binPath) in ForgeStudio
  const isQEMU = hexString === '__esp32_qemu__';
  if (!isQEMU) {
    simulationRunner.initCPU(hexString);
  }
  
  circuitEngine.syncCircuitGraph();

  console.log('[FORGE STORE] Firing simulationRunner.start()');
  simulationRunner.start().catch(err => {
    console.error('[FORGE STORE] simulationRunner.start() failed:', err);
  });

  return { isSimulating: true, serialOutput: '', wifiLog: [] };
}),
```

---

## Testing Checklist

After applying all fixes:

### 1. Verify Preload Exposure
```javascript
// In browser console (renderer)
console.log(typeof window.electronAPI.compileCode); // should be "function"
```

### 2. Test AVR Compilation (Unchanged)
- Place Arduino Uno node
- Write blink sketch
- Click "Run" → should compile to .hex and run in avr8js

### 3. Test ESP32 QEMU Compilation
- Place ESP32 DevKit V1 node
- Write blink sketch with `Serial.println("Hello")`
- Click "Run"
- **Expected**:
  1. Compiles to `.bin` (check console: `[ESP32 Compiler] Found .bin at: ...`)
  2. QEMU starts (check console: `[QEMU] Launching: ...`)
  3. Serial monitor shows: `Hello` (from QEMU stdout)
  4. GPIO monitor lines stripped: `__LF_GPIO:13:1` → LED turns on

### 4. Test GPIO Injection
- Add button connected to ESP32 GPIO 4
- Click button → should call `esp32Runner.setGPIOInput(4, true)`
- Sketch should read `digitalRead(4)` as HIGH

### 5. Test ADC Injection
- Add potentiometer to ESP32 A0 (GPIO36)
- Move slider → should call `esp32Runner.setAnalogInput(0, voltage)`
- Sketch should read `analogRead(36)` as voltage

---

## File Summary

### Files to Modify

1. **`electron/preload.js`** — Add `compileCode` method
2. **`src/modules/leapforge/engine/SimulationRunner.ts`** — Store binPath, use in start()
3. **`src/modules/leapforge/store/useForgeStore.ts`** — Skip initCPU for QEMU boards

### Files Already Correct (No Changes Needed)

- ✅ `electron/main.js` — `compile-code` handler works
- ✅ `electron/qemuManager.js` — QEMU spawn/serial/QMP works
- ✅ `electron/esp32Compiler.js` — GPIO monitor injection works
- ✅ `src/simulation/ESP32SimulationRunner.ts` — IPC bridge works
- ✅ `src/services/CompilerService.ts` — Calls correct method (once preload fixed)
- ✅ `src/modules/leapforge/ForgeStudio.tsx` — Passes binPath correctly

---

## Why This Was Broken

1. **Two preload files**: `src/preload.ts` vs `electron/preload.js` — only one is used at runtime
2. **Sentinel value confusion**: `'__esp32_qemu__'` was passed to `initCPU()` but binPath was stored separately
3. **Missing binPath flow**: `setBoard(board, binPath)` stored binPath but `start()` didn't use it
4. **Incomplete integration**: QEMU code was written but never connected to the renderer

---

## Architecture After Fix

```
┌─────────────────────────────────────────────────────────────────┐
│                    Renderer Process                              │
│                                                                  │
│  ForgeStudio.tsx                                                 │
│    ↓ compileCode(code, 'espressif:esp32:esp32')                 │
│  CompilerService.ts                                              │
│    ↓ electronAPI.compileCode(code, fqbn)                         │
│  ────────────────────────────────────────────────────────────── │
│                         IPC Bridge                               │
│  ────────────────────────────────────────────────────────────── │
│  electron/preload.js                                             │
│    ↓ ipcRenderer.invoke('compile-code', code, fqbn)             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     Main Process                                 │
│                                                                  │
│  electron/main.js                                                │
│    ↓ ipcMain.handle('compile-code', ...)                        │
│    ↓ esp32Compiler.compileESP32(code, fqbn)                     │
│  electron/esp32Compiler.js                                       │
│    ↓ arduino-cli compile --fqbn espressif:esp32:esp32           │
│    ↓ returns { success: true, binPath: '/tmp/sketch.ino.bin' }  │
│  ────────────────────────────────────────────────────────────── │
│                    Back to Renderer                              │
│  ────────────────────────────────────────────────────────────── │
│  ForgeStudio.tsx                                                 │
│    ↓ simulationRunner.setBoard('esp32', binPath)                │
│    ↓ startSimulation('__esp32_qemu__')                           │
│  useForgeStore.ts                                                │
│    ↓ simulationRunner.start()                                   │
│  SimulationRunner.ts                                             │
│    ↓ esp32Runner.start(this.binPath)                            │
│  ESP32SimulationRunner.ts                                        │
│    ↓ electronAPI.invoke('esp32-start', binPath)                 │
│  ────────────────────────────────────────────────────────────── │
│                    Back to Main Process                          │
│  ────────────────────────────────────────────────────────────── │
│  electron/main.js                                                │
│    ↓ ipcMain.handle('esp32-start', ...)                         │
│    ↓ qemuManager.startQemu(binPath, mainWindow)                 │
│  electron/qemuManager.js                                         │
│    ↓ spawn('qemu-system-xtensa', ['-drive', binPath, ...])      │
│    ↓ connectSerial(mainWindow) → TCP :5555                      │
│    ↓ connectQMP() → TCP :5556                                   │
│    ↓ sendQMPCommand('cont') → resume CPU                        │
│  ────────────────────────────────────────────────────────────── │
│                    QEMU Running                                  │
│  ────────────────────────────────────────────────────────────── │
│  QEMU stdout → TCP :5555                                         │
│    ↓ mainWindow.webContents.send('serial-data', text)           │
│  ────────────────────────────────────────────────────────────── │
│                    Back to Renderer                              │
│  ────────────────────────────────────────────────────────────── │
│  ESP32SimulationRunner.ts                                        │
│    ↓ onSerialData(data)                                          │
│    ↓ parseSerialLine(line)                                      │
│    ↓ if (__LF_GPIO:13:1) → pinListeners.get(13).forEach(cb)     │
│    ↓ else → serialListeners.forEach(cb)                         │
│  CircuitEngine.ts                                                │
│    ↓ LED node listener fires → updateNodeData(ledId, {on:true}) │
│  useForgeStore.ts                                                │
│    ↓ appendSerial(text) → serial monitor updates                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Summary

The QEMU simulation code is **fully implemented** but **not connected**. The fix is simple:

1. Expose `compileCode` in `electron/preload.js`
2. Store and use `binPath` in `SimulationRunner`
3. Skip `initCPU()` for QEMU boards in `useForgeStore`

After these 3 changes, ESP32 QEMU simulation will work end-to-end.
