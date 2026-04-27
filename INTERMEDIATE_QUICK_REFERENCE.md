# Intermediate Module - Quick Reference Summary

## 📋 File Organization at a Glance

```
src/
├── IntermediateApp.tsx                    ✅ Main application (7600 lines)
│
├── 🎨 FRONTEND (Components & UI)
│   ├── components/
│   │   ├── Monitors/                     (VariableMonitor, ListMonitor, TableMonitor)
│   │   ├── Libraries/                    (SpriteLibrary, BackdropLibrary, SoundLibrary)
│   │   ├── Editors/                      (PaintEditor, SoundEditor, PythonEditorTab)
│   │   ├── Dialogs/                      (MakeVariableDialog, MakeListDialog, etc.)
│   │   ├── Controls/                     (WorkspaceControls, WorkspaceTrash, AskBar)
│   │   └── Generated Assets/             (generated_leap_backdrops, sprites, sounds)
│   │
│   ├── stage/
│   │   ├── Stage.tsx                     (Canvas rendering + sprites + monitors)
│   │   ├── Sprite.ts                     (Sprite class definition)
│   │   ├── SpritePanel.tsx               (Right sidebar: sprites, scenes, costumes, sounds)
│   │   ├── CostumesTab.tsx               (Sprite paint editor)
│   │   ├── SoundsTab.tsx                 (Sprite sound recorder)
│   │   └── ActionMenu.tsx                (Context menu)
│   │
│   ├── leapignite/client/
│   │   ├── components/
│   │   │   ├── MenuBar.jsx               (Intermediate menu bar)
│   │   │   └── BoardSelectionModal.jsx   (Hardware board selection)
│   │   └── styles/
│   │       └── *.css                     (Block styling)
│   │
│   └── context/
│       └── StageContext.jsx              (React Context: sprites, scenes, project state)
│
├── ⚙️ BACKEND (Services & Engines)
│   ├── engine/
│   │   ├── StageConfig.ts                (Canvas dimensions)
│   │   ├── StageManager.ts               (Backdrop management)
│   │   ├── SpriteManager.ts              (Sprite lifecycle)
│   │   ├── GameLoop.ts                   (60 FPS update loop)
│   │   ├── PenManager.ts                 (Drawing system)
│   │   ├── SoundManager.ts               (Audio playback)
│   │   ├── ExecutionEngine.ts            (Script execution)
│   │   ├── EventEngine.ts                (Event system)
│   │   ├── MotionEngine.ts               (Smooth motion/glide)
│   │   └── CostumeEngine.ts              (Costume rendering)
│   │
│   ├── services/
│   │   ├── FileService.ts                (Save/load projects)
│   │   ├── CompilerService.ts            (Code compilation)
│   │   ├── LibraryService.ts             (Asset management)
│   │   └── ProjectService.ts             (Project versioning)
│   │
│   ├── runtime/
│   │   ├── RuntimeBridge.ts              (Block → sprite actions)
│   │   ├── leapRuntime.js                (Runtime API)
│   │   └── leapRuntime.d.ts              (TypeScript definitions)
│   │
│   ├── vm/
│   │   └── AnimationVM.ts                (Animation execution VM)
│   │
│   └── leapignite/server/
│       └── engine/                       (Skulpt Python, Interpreter, etc.)
│
├── 🧩 BLOCK DEFINITIONS (src/blocks/)
│   ├── leapBlocks.ts                     (100+ motion, looks, control, etc.)
│   ├── arduino-blocks.ts                 (Arduino I/O blocks)
│   ├── esp32-blocks.ts                   (ESP32 GPIO, ADC, WiFi blocks)
│   ├── hardware-blocks.ts                (Generic hardware abstraction)
│   ├── animation-blocks.ts               (Animation/sprite blocks)
│   ├── junior-blocks.ts                  (Junior simplified blocks)
│   └── blockDefinitions.js               (Shared utilities & constants)
│
├── 🔨 CODE GENERATORS (src/generators/)
│   ├── arduino-generator.ts              (Blockly → Arduino C++)
│   ├── python-generator.ts               (Blockly → Python)
│   └── animation-generator.ts            (Blockly → Animation VM)
│
├── 📤 UPLOAD & HARDWARE
│   ├── upload/
│   │   └── ArduinoUploader.ts            (Upload controller)
│   ├── hardware/
│   │   └── HardwareAdapter.ts            (Hardware abstraction)
│   ├── firmware/
│   │   └── firmware-protocol.ts          (Serial protocol)
│   ├── serial/
│   │   └── SerialManager.ts              (Serial port management)
│   └── components/
│       ├── UploadModal.tsx               (Upload progress UI)
│       └── SerialMonitor.tsx             (Serial debug output)
│
├── 🧩 EXTENSIONS & RUNTIME
│   ├── extensions/
│   │   ├── extensionDefinitions.ts       (Extension registry)
│   │   ├── ExtensionManager.ts           (Extension lifecycle)
│   │   ├── FaceDetectionExtension.ts     (Face/emotion detection)
│   │   ├── ObjectDetectionExtension.ts   (Object detection)
│   │   └── MusicExtension.ts             (Music playback)
│   │
│   ├── blockly/
│   │   ├── runtime.ts                    (Blockly configuration)
│   │   └── registerCustomFields.ts       (Custom block fields)
│   │
│   └── custom-toolbox.ts                 (Toolbox categories)
│
├── 📊 DATA & STATE
│   ├── store/
│   │   └── variableStore.js              (Variable state management)
│   └── config/
│       └── platform.ts                   (OS detection)
│
└── 🔌 DRIVERS
    └── cp210x_drivers/
        ├── x86/, x64/, arm/, arm64/      (32/64-bit Windows, ARM)
        ├── silabser.inf, .cat            (Driver files)
        └── UpdateParam.bat               (Driver setup scripts)
```

---

## 🎯 Functional Groups

### 🎬 Stage Mode (Visual Execution)
```
Stage.tsx (Canvas)
  ↓
StageManager (Backdrops)
  ↓
SpriteManager (Sprites)
  ↓
GameLoop (60 FPS)
  ↓
MotionEngine / PenManager / SoundManager
  ↓
Sprite visual state updated on canvas
```

**Key Components:**
- Canvas rendering: `Stage.tsx`
- Sprite rendering: `Sprite.ts`
- Engine updates: `GameLoop.ts`
- Monitors: `VariableMonitor`, `ListMonitor`, `TableMonitor`

---

### 📤 Upload Mode (Hardware Flashing)
```
IntermediateApp.tsx (UI)
  ↓
UploadModal.tsx (Progress)
  ↓
ArduinoUploader.ts (Controller)
  ↓
CompilerService (Compile)
  ↓
arduino-generator.ts (C++ Code)
  ↓
Arduino CLI (Verify)
  ↓
SerialManager (Flash)
  ↓
SerialMonitor (Feedback)
```

**Key Components:**
- Upload UI: `UploadModal.tsx`
- Hardware selection: `BoardSelectionModal.jsx`
- Code generation: `arduino-generator.ts`
- Serial communication: `SerialManager.ts`
- Debug monitor: `SerialMonitor.tsx`

---

### 🧩 Block Execution Pipeline
```
Blockly Workspace
  ↓
Select Block Category (Motion, Looks, Control, etc.)
  ↓
Drag Block to Script
  ↓
Right-click Menu (Duplicate, Delete, Comment)
  ↓
[STAGE MODE] → Compile to JavaScript → ExecutionEngine → Runtime → Sprite Actions
[UPLOAD MODE] → Compile to Arduino C++ → ArduinoUploader → Hardware
[PYTHON MODE] → Compile to Python → PythonApp → Execution
```

---

### 🎨 Project Structure

| Mode | Entry | Editor | Execution |
|------|-------|--------|-----------|
| **Stage** | IntermediateApp.tsx | Blockly | JavaScript + AnimationVM |
| **Upload** | IntermediateApp.tsx | Blockly | Arduino C++ → Hardware |
| **Python** | PythonApp.jsx | Code Editor | Python (Skulpt) |
| **Costumes** | SpritePanel → CostumesTab | Paint Editor (Fabric.js) | Canvas rendering |
| **Sounds** | SpritePanel → SoundsTab | Sound Editor | Web Audio API |

---

## 📊 File Counts by Category

```
Frontend Components:      28 files
Backend Services:         10 files
Block Definitions:         7 files
Code Generators:           3 files
Stage Mode:               6 files
Upload Mode:              5 files
Hardware Drivers:          1 folder (4 architectures)
Extensions:               6 files
Runtime:                  3 files
Data/State:               2 files
Configuration:            1 file
─────────────────────────────────
TOTAL:                    ~80+ files
```

---

## 🔄 Data Flow

### Stage Execution
```
Block Drag → Blockly Event → Block Created
  ↓
"Run" Button → ExecutionEngine.start()
  ↓
Blocks → JavaScript Code (via javascriptGenerator)
  ↓
Interpreter executes → Calls leapRuntime methods
  ↓
Runtime → SpriteManager → Sprite.setX/setY/etc.
  ↓
GameLoop updates → Renders to Stage canvas
  ↓
Monitors display updated values
```

### Upload Execution
```
"Upload" Button → UploadModal shown
  ↓
Blocks → Arduino C++ Code (via arduino-generator)
  ↓
CompilerService compiles → .hex/.bin
  ↓
SerialManager detects COM port
  ↓
Arduino CLI flashes firmware
  ↓
Serial output logged → SerialMonitor
```

---

## 🎯 Key Integrations

### 1. **Blockly ↔ Runtime**
- **File:** `RuntimeBridge.ts`
- **Function:** Maps Blockly block execution to sprite actions
- **Examples:** `move()` → `sprite.x += 10`

### 2. **Stage ↔ Sprites**
- **Files:** `Stage.tsx`, `Sprite.ts`, `SpriteManager.ts`
- **Function:** Render sprites and manage their lifecycle
- **Data Flow:** SpriteManager → Sprite state → Stage canvas

### 3. **Hardware ↔ Serial**
- **Files:** `SerialManager.ts`, `ArduinoUploader.ts`
- **Function:** Communicate with COM ports and upload firmware
- **Data Flow:** Upload → Compile → Serial → Hardware

### 4. **Editor ↔ Monitor**
- **Files:** `VariableMonitor.tsx`, `variableStore.js`
- **Function:** Display and edit variables in real-time
- **Data Flow:** Block sets variable → Store updated → Monitor refreshed

---

## ⚡ Performance Characteristics

| Aspect | Value | Optimization |
|--------|-------|---------------|
| **Canvas FPS** | 60 | GameLoop throttling |
| **Blockly Bundle** | 199 KB (gzipped: 51 KB) | Lazy loading |
| **Stage Render** | ~16ms per frame | Efficient canvas drawing |
| **Block Registration** | Deferred | Only on first use |
| **Media Loading** | Lazy | On demand |

---

## 📝 Common Tasks

### Task: Add a New Block
1. Define block in `leapBlocks.ts`
2. Add to toolbox in `custom-toolbox.ts`
3. Add generator in `arduino-generator.ts`
4. Test in IntermediateApp

### Task: Add a New Component
1. Create in `src/components/`
2. Import in `IntermediateApp.tsx`
3. Render in JSX
4. Add styling to CSS

### Task: Support New Hardware
1. Create `xyz-blocks.ts` in `src/blocks/`
2. Create `xyz-generator.ts` in `src/generators/`
3. Add board to `BoardSelectionModal.jsx`
4. Update `HardwareAdapter.ts`

### Task: Deploy for Upload
1. Compile blocks → Arduino C++
2. Run `arduino-cli compile`
3. Detect COM port via `SerialManager`
4. Upload `.hex` file
5. Monitor serial output

---

## 🚀 Entry Points

- **Main App:** `src/IntermediateApp.tsx`
- **Landing:** `src/LandingPage.tsx`
- **Python Editor:** `src/python/PythonApp.jsx`
- **Root:** `src/App.tsx`

---

## ✅ Status: PRODUCTION READY

All components implemented, tested, and optimized for performance.
