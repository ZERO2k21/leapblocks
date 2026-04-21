# ESP32 QEMU Simulation — Complete Fix

## Root Causes Identified

### 1. **Wrong Platform ID** (`espressif:esp32` vs `esp32:esp32`)
The codebase used `espressif:esp32:esp32` as the FQBN, but the installed platform from the Espressif package index is `esp32:esp32`. Every FQBN reference was wrong.

### 2. **Two Main Process Entry Points**
- `electron/main.js` — had all the ESP32 QEMU code (compile-code with binPath, esp32-start, esp32-stop, GPIO/ADC handlers)
- `src/index.ts` — **actual entry point** used by electron-vite, but was missing all ESP32 QEMU code

The app runs `src/index.ts`, so all the QEMU handlers in `electron/main.js` were never registered.

### 3. **ESP32SimulationRunner Created Too Late**
`CircuitEngine.syncCircuitGraph()` checked `simulationRunner.ESP32Runner` to decide whether to wire QEMU pin listeners. But the runner was created inside `simulationRunner.start()` which ran **after** `syncCircuitGraph()`. Result: QEMU listeners were never registered, LED never responded to GPIO output.

### 4. **QEMU Pin Listener Set Wrong Property**
The QEMU pin listener set `pinState: 'HIGH'` but the LED component reads `brightness: 1.0`. The AVR path correctly set `brightness`, but the QEMU path didn't.

### 5. **QEMU Binary Not Installed**
`qemu-system-xtensa.exe` was never present in `resources/`. The code expected it but had no auto-download mechanism.

### 6. **Callback Hell and Mixed Async Patterns**
- `runCLI` wrapped `spawn` in `new Promise()` manually
- `compile-arduino` used `new Promise()` inside an `async` function
- `startQemu` used `setTimeout(() => connectSerial(), 800)` instead of awaiting readiness
- `connectSerial` was callback-based, not awaitable

---

## All Files Changed

| File | What Changed |
|---|---|
| **`src/index.ts`** | Added ESP32 QEMU compile path, esp32-start/stop/gpio/adc handlers, runCLI/ensureESP32Core/migrateESP32LedcAPI helpers |
| **`src/preload.ts`** | Added `binPath` to compileCode return type, added esp32Start/Stop/GpioSet/AdcSet methods |
| **`src/modules/leapforge/ForgeStudio.tsx`** | Fixed FQBN map: `espressif:esp32:*` → `esp32:esp32:*` |
| **`src/modules/leapforge/store/useForgeStore.ts`** | Call `initCPU('')` for QEMU path to create ESP32Runner before syncCircuitGraph |
| **`src/modules/leapforge/engine/CircuitEngine.ts`** | QEMU pin listener now sets `brightness`/`intensity`/`hasSignal` like AVR path |
| **`src/simulation/ESP32BoardConfig.ts`** | Fixed FQBN: `espressif:esp32:esp32` → `esp32:esp32:esp32` |
| **`electron/main.js`** | Fixed FQBN, install command, async/await patterns, parallel startup, window flash fix |
| **`electron/preload.js`** | Added `compileCode` method (was missing) |
| **`electron/qemuManager.js`** | Full rewrite: async/await, `waitForTcpPort`, `ensureQemuSilent`, auto-download |
| **`src/upload/ArduinoUploader.ts`** | Fixed install command: `espressif:esp32` → `esp32:esp32` |
| **`test/esp32Integration.test.ts`** | Fixed all test FQBNs and assertions |
| **`scripts/download-qemu.js`** | New script to download QEMU binary at install time |
| **`package.json`** | Added `postinstall` hook to download QEMU |
| **`electron-builder.yml`** | Package `resources/qemu-system-xtensa.exe` in production builds |
| **`src/App.tsx`** | Defer Blockly registration to idle, prefetch heavy modules |

---

## The Complete ESP32 QEMU Flow (After Fix)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Renderer Process                                    │
│                                                                              │
│  ForgeStudio.tsx                                                             │
│    ↓ User clicks Run                                                         │
│    ↓ compileCode({ code, board: 'esp32:esp32:esp32' })                      │
│  CompilerService.ts                                                          │
│    ↓ electronAPI.compileCode(code, fqbn)                                     │
│  ────────────────────────────────────────────────────────────────────────── │
│                         IPC Bridge (src/preload.ts)                          │
│  ────────────────────────────────────────────────────────────────────────── │
│    ↓ ipcRenderer.invoke('compile-code', code, fqbn)                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Main Process (src/index.ts)                         │
│                                                                              │
│  ipcMain.handle('compile-code', ...)                                         │
│    ↓ isESP32 = fqbn.startsWith('esp32:')  → true                            │
│    ↓ await ensureESP32Core()  → checks/installs esp32:esp32 platform        │
│    ↓ Inject GPIO monitor header                                              │
│    ↓ Preprocess: Servo.h → ESP32Servo.h, LEDC v2 → v3                       │
│    ↓ await runCLI(['compile', '--fqbn', 'esp32:esp32:esp32', ...])          │
│    ↓ Scan tempDir for sketch.ino.bin                                         │
│    ↓ return { success: true, binPath: '/tmp/sketch.ino.bin' }               │
│  ────────────────────────────────────────────────────────────────────────── │
│                    Back to Renderer                                          │
│  ────────────────────────────────────────────────────────────────────────── │
│  ForgeStudio.tsx                                                             │
│    ↓ result.binPath exists → simulationRunner.setBoard('esp32', binPath)    │
│    ↓ startSimulation('__esp32_qemu__')                                       │
│  useForgeStore.ts                                                            │
│    ↓ circuitEngine.init()                                                    │
│    ↓ simulationRunner.initCPU('')  → creates ESP32SimulationRunner          │
│    ↓ circuitEngine.syncCircuitGraph()                                        │
│      ↓ qemuRunner = simulationRunner.ESP32Runner  → NOT null ✅              │
│      ↓ qemuRunner.addPinListener(13, (high) => { ... })  → wired ✅          │
│    ↓ simulationRunner.start()                                                │
│  SimulationRunner.ts                                                         │
│    ↓ esp32Runner.start(this.binPath)                                         │
│  ESP32SimulationRunner.ts                                                    │
│    ↓ window.electronAPI.onSerialData(...)  → register listener              │
│    ↓ await window.electronAPI.invoke('esp32-start', binPath)                │
│  ────────────────────────────────────────────────────────────────────────── │
│                    Back to Main Process                                      │
│  ────────────────────────────────────────────────────────────────────────── │
│  ipcMain.handle('esp32-start', ...)                                          │
│    ↓ await qemuManager.startQemu(binPath, mainWindow)                       │
│  qemuManager.js                                                              │
│    ↓ await ensureQemu(mainWindow)  → checks/downloads qemu-system-xtensa    │
│    ↓ spawn('qemu-system-xtensa', ['-drive', binPath, ...])                  │
│    ↓ await waitForTcpPort(5555, '127.0.0.1', 8000)  → polls until ready     │
│    ↓ await connectSerial(mainWindow)  → TCP :5555                           │
│    ↓ await connectQMP()  → TCP :5556                                         │
│    ↓ await sendQMPCommand({ execute: 'cont' })  → resume CPU                │
│  ────────────────────────────────────────────────────────────────────────── │
│                    QEMU Running                                              │
│  ────────────────────────────────────────────────────────────────────────── │
│  Sketch executes: digitalWrite(13, HIGH)                                     │
│    ↓ __lf_digitalWrite wrapper emits: __LF_GPIO:13:1                        │
│  QEMU stdout → TCP :5555 → mainWindow.webContents.send('serial-data', ...)  │
│  ────────────────────────────────────────────────────────────────────────── │
│                    Back to Renderer                                          │
│  ────────────────────────────────────────────────────────────────────────── │
│  ESP32SimulationRunner.ts                                                    │
│    ↓ onSerialData('__LF_GPIO:13:1\n')                                        │
│    ↓ parseSerialLine('__LF_GPIO:13:1')                                       │
│    ↓ pinListeners.get(13).forEach(cb => cb(true))  → fires listener         │
│  CircuitEngine.ts (qemuPinListener)                                          │
│    ↓ traceNet(ledId, 'ANODE')  → finds LED node                             │
│    ↓ updateNodeData(ledId, { brightness: 1.0, pinStates: {...} })           │
│  useForgeStore.ts                                                            │
│    ↓ nodes updated → React re-renders                                        │
│  LeapNode.tsx (LED element)                                                  │
│    ↓ reads node.data.brightness = 1.0                                        │
│    ↓ LED glows ✅                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Testing Checklist

After all fixes:

- [x] ESP32 platform installs automatically on first compile
- [x] QEMU binary downloads automatically at startup (if missing)
- [x] Compile returns `{ success: true, binPath: '...' }`
- [x] `ESP32SimulationRunner` is created before `syncCircuitGraph()`
- [x] QEMU pin listeners are registered on the runner
- [x] QEMU starts and connects to serial/QMP
- [x] Sketch runs and emits `__LF_GPIO:13:1`
- [x] GPIO lines are parsed and routed to pin listeners
- [x] LED `brightness` is set to 1.0 when GPIO goes HIGH
- [x] LED glows on the canvas ✅

---

## Summary

The ESP32 QEMU simulation is now fully functional end-to-end:

1. ✅ **Correct platform ID** — `esp32:esp32` everywhere
2. ✅ **Unified entry point** — all ESP32 code in `src/index.ts` (the actual main process)
3. ✅ **Runner created early** — before `syncCircuitGraph()` so listeners wire correctly
4. ✅ **Correct LED property** — QEMU listener sets `brightness`, not just `pinState`
5. ✅ **QEMU auto-install** — downloads on first use, pre-checks at startup
6. ✅ **Clean async/await** — no callback hell, no fixed delays, polls for readiness
7. ✅ **Fast startup** — parallel tasks, idle-time work, no white flash

The LED now glows when `digitalWrite(13, HIGH)` runs in the ESP32 sketch.
