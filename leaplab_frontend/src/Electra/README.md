# Electra Module - Microcontroller Development & Simulation Workspace

Welcome to **Electra**, the virtual hardware and microcontroller IDE workspace inside LeapBlocks. Electra gives users a complete, browser-based electronics playground where they can design circuit layouts visually, write Arduino C++ code in a Monaco editor, simulate the entire circuit in real-time, and deploy code directly to physical boards.

---

## 💡 What is Electra?

Electra is designed to bridge the gap between abstract code and physical circuits. It targets two primary microcontrollers: the **Arduino Uno** and the **ESP32-C3**. 

The module brings together four major sub-systems:
1. **Interactive Circuit Canvas**: A drag-and-drop circuit builder built on ReactFlow. Users can wire microcontrollers to LEDs, resistors, buttons, sensors, and breadboards.
2. **Monaco Code Editor**: A code-editor workspace complete with C++ syntax highlighting, autocomplete suggestions for Arduino APIs (pinMode, digitalWrite, etc.), and error detection.
3. **Hybrid Simulation Engine**:
   * For the **Arduino Uno**: Emulates the AVR microcontroller on an instruction-by-instruction level using `AVR8js` (running real compilation binary instructions).
   * For the **ESP32-C3**: Uses a custom-built transpiler to convert C++ code to JavaScript on the fly so it can run immediately in the browser simulator.
4. **Physical Board Compiler & Uploader**: Integrates browser Web Serial/WebUSB APIs so users can compile their sketch to a real binary and upload it to a plugged-in microcontroller without leaving the app.

---

## ⚙️ Core Architecture & Engine Breakdown

### 1. Arduino-to-JS Transpiler (`server/transpiler.ts`)
To make simulations run fast without compiling full C++ binaries in the browser, Electra uses a custom transpilation engine. When a user runs a sketch:
* The transpiler strips C++ header files (`#include`) and prototype declarations.
* It parses `#define` macros and type qualifiers (like `int`, `long`, `float`, and `uint8_t`) and converts them to standard JavaScript declarations (`let` and `const`).
* It transforms C++ array structures (e.g. `int arr[10]`) into pre-filled JavaScript arrays.
* It wraps user functions—including `setup()` and `loop()`—into asynchronous JavaScript functions (`async function __setup()` and `async function __loop()`), injecting delays (`await delay()`) to keep the browser thread responsive.
* The output JavaScript runs inside an `ArduinoRuntime` stub layer that handles emulated pin states.

### 2. State & Component Communication
* **State Management**: Electra's canvas, pin connections, component values, and simulation clocks are managed via a unified Zustand hook (`useForgeStore`).
* **Pin Harness System**: Defines the mapping of components to microcontroller pins. It translates logical board interactions (e.g., clicking a button connected to Pin 7) into electrical simulation pulses.

### 3. Virtual Measurement Instruments
For advanced users, Electra simulates test equipment:
* **Oscilloscope / Logic Analyzer**: Captures voltage transitions on specific pin channels and graphs them in real-time.
* **Protocol Analyzer**: Decodes UART serial communications, I2C logs, and SPI transactions directly within the workspace.

---

## 📂 Folder Directory

```
src/Electra/
├── README.md                  # Developer guide & architecture manual
├── Client/                    # Frontend client code
│   ├── Assets/                # Vector icons and electrical assets
│   ├── utils/                 # Store hooks (useForgeStore.js) and helpers
│   └── Src/                   # UI components and view controllers
│       ├── ElectraWorkspace.tsx # Workspace container & board detection modal
│       ├── ForgeElectra.tsx   # Editor core orchestrator (canvas, code panel)
│       ├── components/        # Canvas toolbars, inspector cards, oscilloscopes
│       ├── engine/            # Simulation state clock loop
│       ├── simulation/        # Virtual sensors and component logic
│       └── services/          # WebSerial interfaces and upload handlers
├── server/                    # Local server compiler service
│   ├── index.ts               # Express API and compile router
│   ├── transpiler.ts          # C++ to browser-runnable JS transpiler engine
│   └── tcp-proxy.ts           # TCP client connection proxies
├── docs/                      # Technical specifications & requirements logs
├── firmware/                  # Firmware libraries & hex base stubs
├── resources/                 # Component catalogs and wire harnesses
├── scripts/                   # Sync and build automation helpers
└── tests/                     # Simulation tests & unit logic verification
```

---

## 🚀 Mount the Workspace

To open the Electra board selection modal and editor workspace inside LeapBlocks:

```tsx
import ElectraWorkspace from './Electra';

const MyElectronicsLab = () => {
  return (
    <div className="w-screen h-screen">
      <ElectraWorkspace
        onBack={() => console.log('Returned')}
        onHome={() => console.log('Home')}
      />
    </div>
  );
};
```
