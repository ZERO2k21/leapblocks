# ESP32-C3 Simulation Flow Check

## Current Implementation Flow

### 1. User Clicks "Compile & Run" (ForgeStudio.tsx)

```typescript
// Line ~119
if (isESP32) {
  const result = await compileCode({
    code,
    board: 'esp32:esp32:esp32c3',
    libraries: useForgeStore.getState().importedLibraries,
  });
  
  if (!result.success) {
    // Show error
    return;
  }
  
  const binPath = result.binPath; // Path to compiled .bin file
  
  // Pass binPath to SimulationRunner
  const runner = await getSimulationRunner();
  runner.setBoard(board, binPath); // ✅ Stores binPath
  
  // Start simulation with special marker
  startSimulation('__esp32_c3_riscv__'); // ✅ Triggers ESP32-C3 path
  
  appendSerial('ESP32-C3 compiled. Starting RISC-V simulation...\n');
}
```

### 2. Store Handles Simulation Start (useForgeStore.ts)

```typescript
// Line ~177
startSimulation: (hexString) => {
  set({ isSimulating: true, serialOutput: '', wifiLog: [] });
  
  Promise.all([getCircuitEngine(), getSimulationRunner()]).then(([engine, runner]) => {
    engine.init();
    
    const isESP32C3 = hexString === '__esp32_c3_riscv__'; // ✅ Detects ESP32-C3
    
    if (isESP32C3) {
      runner.initCPU(''); // ✅ Creates ESP32C3SimulationRunner instance
      
      // Wire serial listener
      const esp32c3Runner = runner.ESP32C3Runner; // ✅ Gets runner instance
      if (esp32c3Runner) {
        esp32c3Runner.addSerialListener((line: string) => {
          useForgeStore.getState().appendSerial(line);
          // Parse GPIO/PWM lines...
        });
      }
    }
    
    engine.syncCircuitGraph(); // ✅ Syncs circuit
    
    runner.start(); // ✅ Calls SimulationRunner.start()
  });
}
```

### 3. SimulationRunner Starts ESP32-C3 (SimulationRunner.ts)

```typescript
// Line ~169
async start() {
  const ESP32_C3_BOARD_IDS = ['esp32', 'esp32-devkit-v1', 'esp32-c3'];
  
  if (ESP32_C3_BOARD_IDS.includes(this.selectedBoard)) { // ✅ Detects ESP32
    if (!this.binPath) {
      throw new Error('binPath is required for ESP32-C3 simulation');
    }
    
    if (!this.esp32c3Runner) {
      this.esp32c3Runner = new ESP32C3SimulationRunner();
    }
    
    // Load firmware via IPC
    let firmwareBin: Uint8Array;
    try {
      const buffer = await window.electronAPI.readBinFile(this.binPath); // ✅ IPC call
      firmwareBin = new Uint8Array(buffer);
      console.log(`Loaded firmware: ${firmwareBin.length} bytes`);
    } catch (err) {
      console.warn('Could not read .bin via IPC:', err);
      firmwareBin = new Uint8Array(0);
    }
    
    await this.esp32c3Runner.init(firmwareBin); // ✅ Initialize RISC-V core
    this.esp32c3Runner.run(); // ✅ Start simulation loop
    
    return;
  }
  
  // AVR path...
}
```

### 4. ESP32C3SimulationRunner Executes (ESP32C3SimulationRunner.ts)

```typescript
// Line ~155
async init(firmware: Uint8Array, entryPoint?: number): Promise<void> {
  this.stop();
  
  this.platform = new ESP32C3Platform(); // ✅ Create platform
  const loader = new FirmwareLoader(this.platform.core);
  
  const result = loader.load(firmware); // ✅ Load firmware into IRAM/DRAM
  
  const ep = entryPoint ?? result.entryPoint;
  this.platform.core.reset(ep); // ✅ Reset CPU to entry point
  
  // Wire GPIO pin change → setPinState
  this.platform.gpio.onPinChange((gpio, value, isAnalog) => {
    const pin = gpioToPinName(gpio);
    const state = isAnalog ? value : (value ? 'HIGH' : 'LOW');
    this.setPinState(pin, state); // ✅ Update pin state
  });
  
  // Wire UART output → serial listeners
  this.platform.uart0.onSerialOutput(line => {
    this.serialListeners.forEach(cb => cb(line)); // ✅ Send to serial monitor
  });
}

// Line ~195
run(): void {
  if (this.running || !this.platform) return;
  this.running = true;
  this.scheduleFrame(); // ✅ Start RAF loop
}

// Line ~218
private executeTick(): void {
  const { core, sysTimer } = this.platform;
  
  // Execute CPU instructions
  const cyclesExecuted = core.runCycles(CYCLES_PER_FRAME); // ✅ Run 266,666 cycles
  
  // Advance system timer
  sysTimer.cpuCycles += cyclesExecuted;
  sysTimer.tick();
  
  if (core.halted) {
    this.running = false;
  }
}
```

## Potential Issues

### Issue 1: IPC Handler Not Registered ✅ FIXED
**Status**: Resolved - handler exists in built files, just needs app restart

### Issue 2: TypeScript API Mismatch ✅ FIXED
**Status**: Resolved - all method calls updated to match ESP32C3SimulationRunner API

### Issue 3: Firmware Loading Fails ⚠️ POSSIBLE
**Symptoms**:
- `readBinFile` throws error
- Firmware buffer is empty (0 bytes)
- `FirmwareLoader.load()` fails

**Check**:
```typescript
// In SimulationRunner.start()
try {
  const buffer = await window.electronAPI.readBinFile(this.binPath);
  firmwareBin = new Uint8Array(buffer);
  console.log(`Loaded firmware: ${firmwareBin.length} bytes`); // ← Check this log
} catch (err) {
  console.warn('Could not read .bin via IPC:', err); // ← Check for this error
  firmwareBin = new Uint8Array(0); // ← Empty buffer = no simulation
}
```

### Issue 4: Firmware Format Invalid ⚠️ POSSIBLE
**Symptoms**:
- Firmware loads but `FirmwareLoader.load()` throws error
- No segments loaded
- Entry point is 0 or invalid

**Check**:
```typescript
// In ESP32C3SimulationRunner.init()
try {
  result = loader.load(firmware);
} catch (e) {
  console.error('[ESP32-C3] Firmware load failed:', e); // ← Check for this error
  throw e;
}
```

### Issue 5: Circuit Not Synced ⚠️ POSSIBLE
**Symptoms**:
- Simulation runs but LED doesn't update
- Pin state changes but CircuitEngine doesn't receive them

**Check**:
```typescript
// In useForgeStore.startSimulation()
engine.syncCircuitGraph(); // ← Must be called before runner.start()
```

### Issue 6: Serial Listener Not Wired ⚠️ POSSIBLE
**Symptoms**:
- No serial output in monitor
- GPIO/PWM parsing doesn't work

**Check**:
```typescript
// In useForgeStore.startSimulation()
const esp32c3Runner = runner.ESP32C3Runner;
if (esp32c3Runner) {
  esp32c3Runner.addSerialListener((line: string) => {
    // This should be called
  });
} else {
  console.error('ESP32C3Runner is null!'); // ← Check for this
}
```

## Debugging Steps

### Step 1: Check Console Logs After Restart
Look for these log messages in order:

1. `[FORGE UI] ESP32-C3 board detected — using RISC-V compile path...`
2. `[FORGE UI] ESP32 compile result: Success`
3. `[SimulationRunner] setBoard called: boardId="esp32", binPath="..."`
4. `[FORGE STORE] startSimulation triggered. Hex length: 19`
5. `[FORGE STORE] ESP32-C3 RISC-V path — initializing ESP32-C3 runner...`
6. `[FORGE ENGINE] ESP32-C3 RISC-V runner created for board: esp32`
7. `[SimulationRunner] start() called, selectedBoard="esp32"`
8. `[SimulationRunner] ESP32-C3 board detected, entering RISC-V path`
9. `[PRELOAD] readBinFile called`
10. `[FORGE] Loaded firmware: XXXX bytes from ...`
11. `[ESP32-C3] Initialized: X segments, entry=0x...`
12. `[FORGE] ESP32-C3 runner started`

### Step 2: Check for Errors
Look for these error messages:

- ❌ `No handler registered for 'read-bin-file'` → Restart app
- ❌ `binPath is required for ESP32-C3 simulation` → Compilation failed
- ❌ `Could not read .bin via IPC` → IPC handler issue
- ❌ `Firmware load failed` → Invalid firmware format
- ❌ `ESP32C3Runner is null` → Runner not created

### Step 3: Check Firmware Size
```typescript
// Should see this log:
console.log(`Loaded firmware: ${firmwareBin.length} bytes`);

// If firmwareBin.length === 0:
// → IPC call failed or returned empty buffer
// → Check that binPath is correct
// → Check that .bin file exists
```

### Step 4: Check LED Updates
```typescript
// In ESP32C3SimulationRunner.setPinState()
console.log(`[ESP32-C3] Pin ${pin} = ${state}`);

// Should see logs like:
// [ESP32-C3] Pin ESP2 = HIGH
// [ESP32-C3] Pin ESP2 = LOW
```

### Step 5: Check Circuit Engine
```typescript
// In CircuitEngine
console.log('[CircuitEngine] Pin state changed:', pin, state);

// Should see logs when LED state changes
```

## Expected Console Output (Success)

```
[FORGE UI] ESP32-C3 board detected — using RISC-V compile path...
[FORGE UI] ESP32 compile result: Success
[SimulationRunner] setBoard called: boardId="esp32", binPath="C:\Users\...\sketch.ino.bin"
[FORGE STORE] startSimulation triggered. Hex length: 19
[FORGE STORE] ESP32-C3 RISC-V path — initializing ESP32-C3 runner...
[FORGE ENGINE] ESP32-C3 RISC-V runner created for board: esp32
[SimulationRunner] start() called, selectedBoard="esp32"
[SimulationRunner] ESP32-C3 board detected, entering RISC-V path
[PRELOAD] readBinFile called { filePath: 'C:\Users\...\sketch.ino.bin' }
[FORGE] Loaded firmware: 245760 bytes from C:\Users\...\sketch.ino.bin
[ESP32-C3] Initialized: 3 segments, entry=0x40380000, 245760 bytes loaded
[FORGE] ESP32-C3 runner started, binPath: C:\Users\...\sketch.ino.bin
[ESP32-C3] Pin ESP2 = HIGH
[CircuitEngine] LED ESP2 brightness: 255
[ESP32-C3] Pin ESP2 = LOW
[CircuitEngine] LED ESP2 brightness: 0
```

## Action Items

1. **Restart Electron app** to load new build with IPC handler
2. **Test LED blink** with simple sketch
3. **Check console logs** for the expected output above
4. **Report any errors** that appear in console
5. **Check serial monitor** for output

---

**Status**: Ready for testing after app restart  
**Expected Result**: LED should blink, serial output should appear  
**If Still Not Working**: Check console logs and report errors
