# Intermediate Module (LeapLab Embed) - Complete File Structure Guide

> **Date:** April 26, 2026  
> **Module:** Intermediate (LeapLab Embed) - Blockly-based block programming with hardware support  
> **Versions:** Stage Mode + Upload Mode + Full IDE with Costumes/Sounds

---

## 📋 Table of Contents
1. [Main Application](#main-application)
2. [Frontend Components](#frontend-components)
3. [Backend Services & Engines](#backend-services--engines)
4. [Block Definitions](#block-definitions)
5. [Code Generators](#code-generators)
6. [Stage Mode Files](#stage-mode-files)
7. [Upload Mode Files](#upload-mode-files)
8. [Drivers & Hardware](#drivers--hardware)
9. [Extensions & Runtime](#extensions--runtime)

---

## Main Application

### 📍 [IntermediateApp.tsx](src/IntermediateApp.tsx)
**Purpose:** Root component for the Intermediate (LeapLab Embed) environment  
**Status:** ✅ Fully Implemented  
**Responsibilities:**
- Main application layout with sidebar, editor, and stage
- Blockly workspace initialization and management
- Tab switching (Blocks, Python, Costumes, Sounds)
- Hardware connection and upload functionality
- Project management (load/save)
- Block registration and execution lifecycle
- Monitor display (variables, lists, tables)
- Modal management (upload, board selection, dialogs)

**Key Features:**
- ~7600 lines of comprehensive workspace management
- Multiple editor tabs (blocks, Python code view)
- Real-time block execution on stage
- Hardware upload integration
- Serial communication monitoring

---

## 🎨 Frontend Components

### UI Components (`src/components/`)

#### 📊 **Monitor Components**
| File | Description | Status |
|------|-------------|--------|
| [VariableMonitor.tsx](src/components/VariableMonitor.tsx) | Displays and manages variable monitors with display modes (normal, large, slider) | ✅ Working |
| [ListMonitor.tsx](src/components/ListMonitor.tsx) | Draggable list display monitor with item viewing and resizing | ✅ Working |
| [TableMonitor.tsx](src/components/TableMonitor.tsx) | Data table monitor with rows/cols display and resizing | ✅ Working |

#### 🎬 **Media & Library Components**
| File | Description | Status |
|------|-------------|--------|
| [BackdropLibrary.tsx](src/components/BackdropLibrary.tsx) | Backdrop/background selection library for stage scenes | ✅ Working |
| [SpriteLibrary.tsx](src/components/SpriteLibrary.tsx) | Sprite selection and import library (costumes, characters) | ✅ Working |
| [CostumeLibrary.tsx](src/components/CostumeLibrary.tsx) | Sprite costume selector and manager | ✅ Working |
| [SoundLibrary.tsx](src/components/SoundLibrary.tsx) | Sound/audio library for sound blocks | ✅ Working |

#### 🎵 **Editor Components**
| File | Description | Status |
|------|-------------|--------|
| [PaintEditor.tsx](src/components/PaintEditor.tsx) | Built-in sprite paint editor (Fabric.js based) | ✅ Working |
| [SoundEditor.tsx](src/components/SoundEditor.tsx) | Audio recorder and sound editor | ✅ Working |
| [PythonEditorTab.tsx](src/components/PythonEditorTab.tsx) | Python code editor/preview panel | ✅ Working |
| [MiniWaveform.tsx](src/components/MiniWaveform.tsx) | Audio waveform visualization for sounds | ✅ Working |

#### 🗂️ **Dialog & Control Components**
| File | Description | Status |
|------|-------------|--------|
| [MakeVariableDialog.tsx](src/components/MakeVariableDialog.tsx) | Dialog to create new variables | ✅ Working |
| [MakeListDialog.tsx](src/components/MakeListDialog.tsx) | Dialog to create new lists | ✅ Working |
| [MakeTableDialog.tsx](src/components/MakeTableDialog.tsx) | Dialog to create new tables/arrays | ✅ Working |
| [MakeBlockDialog.tsx](src/components/MakeBlockDialog.tsx) | Dialog to define custom blocks | ✅ Working |
| [MakeBlockDialog.tsx](src/components/MakeBlockDialog.tsx) | Dialog to define custom blocks | ✅ Working |

#### 🛠️ **Utility Components**
| File | Description | Status |
|------|-------------|--------|
| [WorkspaceControls.jsx](src/components/WorkspaceControls.jsx) | Workspace toolbar (undo/redo/delete/duplicate blocks) | ✅ Working |
| [WorkspaceTrash.jsx](src/components/WorkspaceTrash.jsx) | Block trash/delete zone | ✅ Working |
| [AskBar.tsx](src/components/AskBar.tsx) | Input prompt bar for "Ask" blocks | ✅ Working |
| [SerialMonitor.tsx](src/components/SerialMonitor.tsx) | Serial communication monitor for hardware debugging | ✅ Working |
| [UploadModal.tsx](src/components/UploadModal.tsx) | Modal for hardware upload progress and status | ✅ Working |
| [Loader.tsx](src/components/Loader.tsx) | Loading spinner component | ✅ Working |
| [HSBColorPicker.tsx](src/components/HSBColorPicker.tsx) | HSB color picker for costume colors | ✅ Working |
| [Logo.jsx](src/components/Logo.jsx) | Application logo and branding | ✅ Working |

#### 📚 **Generated Assets**
| File | Description | Status |
|------|-------------|--------|
| [generated_leap_backdrops.ts](src/components/generated_leap_backdrops.ts) | Pre-generated backdrop library (built-in scenes) | ✅ Working |
| [generated_leap_sprites.ts](src/components/generated_leap_sprites.ts) | Pre-generated sprite library (default characters) | ✅ Working |
| [generated_leap_sounds.ts](src/components/generated_leap_sounds.ts) | Pre-generated sound library (built-in sounds) | ✅ Working |

#### 🎨 **Intermediate-Specific Menu**
| File | Description | Status |
|------|-------------|--------|
| [MenuBar.jsx](src/leapignite/client/components/MenuBar.jsx) | Top menu bar for Intermediate (File, Edit, View options) | ✅ Working |
| [BoardSelectionModal.jsx](src/leapignite/client/components/BoardSelectionModal.jsx) | Hardware board selection (Arduino, ESP32, etc.) | ✅ Working |

### Layout & Context (`src/stage/`)

| File | Description | Status |
|------|-------------|--------|
| [Stage.tsx](src/stage/Stage.tsx) | Main stage rendering canvas with sprite display, grid, pen trails | ✅ Working |
| [SpritePanel.tsx](src/stage/SpritePanel.tsx) | Right-side panel showing sprites, scenes, and costume/sound tabs | ✅ Working |
| [Sprite.ts](src/stage/Sprite.ts) | Sprite class with position, rotation, costume, and interaction logic | ✅ Working |
| [CostumesTab.tsx](src/stage/CostumesTab.tsx) | Tab for editing sprite costumes (paint editor integration) | ✅ Working |
| [SoundsTab.tsx](src/stage/SoundsTab.tsx) | Tab for managing sprite sounds (sound recorder integration) | ✅ Working |
| [ActionMenu.tsx](src/stage/ActionMenu.tsx) | Context menu for sprite actions (duplicate, delete, etc.) | ✅ Working |

### Context & State (`src/context/`)

| File | Description | Status |
|------|-------------|--------|
| [StageContext.jsx](src/context/StageContext.jsx) | React context for stage, sprites, scenes, and project state | ✅ Working |

---

## ⚙️ Backend Services & Engines

### Core Engine Files (`src/engine/`)

| File | Description | Status |
|------|-------------|--------|
| **[StageConfig.ts](src/engine/StageConfig.ts)** | Stage canvas dimensions (STAGE_CONFIG: width, height settings) | ✅ Working |
| **[StageManager.ts](src/engine/StageManager.ts)** | Manages backdrop rendering, scene switching, image loading | ✅ Working |
| **[SpriteManager.ts](src/engine/SpriteManager.ts)** | Sprite lifecycle (create, delete, select, clone sprites) | ✅ Working |
| **[GameLoop.ts](src/engine/GameLoop.ts)** | Core 60 FPS game loop with update callbacks | ✅ Working |
| **[PenManager.ts](src/engine/PenManager.ts)** | Pen drawing system (down, up, draw lines, trails) | ✅ Working |
| **[SoundManager.ts](src/engine/SoundManager.ts)** | Audio playback engine (play, pause, volume control) | ✅ Working |
| **[ExecutionEngine.ts](src/engine/ExecutionEngine.ts)** | Script execution controller (run, stop, pause scripts) | ✅ Working |
| **[EventEngine.ts](src/engine/EventEngine.ts)** | Event system (click, key press, broadcast events) | ✅ Working |
| **[MotionEngine.ts](src/engine/MotionEngine.ts)** | Sprite movement interpolation (glide, smooth motion) | ✅ Working |
| **[CostumeEngine.ts](src/engine/CostumeEngine.ts)** | Costume/appearance switching and rendering | ✅ Working |

### Service Layer (`src/services/`)

| File | Description | Status |
|------|-------------|--------|
| **[FileService.ts](src/services/FileService.ts)** | Project file I/O (save/load .sb3, project metadata) | ✅ Working |
| **[CompilerService.ts](src/services/CompilerService.ts)** | Code compilation (Blockly → JavaScript/Python/Arduino) | ✅ Working |
| **[LibraryService.ts](src/services/LibraryService.ts)** | Asset library management (sprites, sounds, backdrops) | ✅ Working |
| **[ProjectService.ts](src/services/ProjectService.ts)** | Project creation, management, and versioning | ✅ Working |

### Runtime Bridge (`src/runtime/`)

| File | Description | Status |
|------|-------------|--------|
| **[RuntimeBridge.ts](src/runtime/RuntimeBridge.ts)** | Bridges Blockly blocks to runtime engines (sprite actions, events) | ✅ Working |
| **[leapRuntime.js](src/runtime/leapRuntime.js)** | Runtime object with sprite, sound, pen, event APIs | ✅ Working |
| **[leapRuntime.d.ts](src/runtime/leapRuntime.d.ts)** | TypeScript definitions for leapRuntime API | ✅ Working |

### VM & Animation (`src/vm/`)

| File | Description | Status |
|------|-------------|--------|
| **[AnimationVM.ts](src/vm/AnimationVM.ts)** | Virtual machine for animation execution and sprite state management | ✅ Working |

---

## 🧩 Block Definitions

### Block Type Files (`src/blocks/`)

| File | Description | Status | Platform |
|------|-------------|--------|----------|
| **[leapBlocks.ts](src/blocks/leapBlocks.ts)** | Core leap 3.0 blocks (100+ blocks: motion, looks, control, events, sound, sensing) | ✅ Working | Universal |
| **[arduino-blocks.ts](src/blocks/arduino-blocks.ts)** | Arduino-specific blocks (digital I/O, analog, PWM) | ✅ Working | Arduino |
| **[esp32-blocks.ts](src/blocks/esp32-blocks.ts)** | ESP32-specific blocks (GPIO, PWM, ADC, WiFi) | ✅ Working | ESP32 |
| **[hardware-blocks.ts](src/blocks/hardware-blocks.ts)** | Generic hardware abstraction blocks | ✅ Working | Universal |
| **[animation-blocks.ts](src/blocks/animation-blocks.ts)** | Animation and sprite manipulation blocks | ✅ Working | Stage |
| **[junior-blocks.ts](src/blocks/junior-blocks.ts)** | Junior (simplified) blocks for young learners | ✅ Working | Junior |
| **[blockDefinitions.js](src/blocks/blockDefinitions.js)** | Shared block utilities and constants | ✅ Working | Shared |

### Block Backend (Server) (`src/leapignite/server/blocks/`)

| File | Description | Status |
|------|-------------|--------|
| **[blocks.js](src/leapignite/server/blocks/blocks.js)** | Motion/control block definitions | ✅ Working |
| **[looksBlocks.js](src/leapignite/server/blocks/looksBlocks.js)** | Appearance/costume block definitions | ✅ Working |
| **[soundBlocks.js](src/leapignite/server/blocks/soundBlocks.js)** | Audio/music block definitions | ✅ Working |
| **[LeapRenderer.js](src/leapignite/server/blocks/LeapRenderer.js)** | Custom Blockly block renderer | ✅ Working |

---

## 🔨 Code Generators

### Generator Files (`src/generators/`)

| File | Description | Status | Output |
|------|-------------|--------|--------|
| **[arduino-generator.ts](src/generators/arduino-generator.ts)** | Blockly → Arduino C++ code generator | ✅ Working | Arduino/.ino |
| **[python-generator.ts](src/generators/python-generator.ts)** | Blockly → Python code generator | ✅ Working | Python/.py |
| **[animation-generator.ts](src/generators/animation-generator.ts)** | Blockly → Animation VM bytecode compiler | ✅ Working | Animation VM |

---

## 🎬 Stage Mode Files

> **Stage Mode:** Run scripts in real-time on the visual stage with sprites, pen trails, and sound playback.

### Stage Rendering System

| File | Description | Status |
|------|-------------|--------|
| **[Stage.tsx](src/stage/Stage.tsx)** | **Main Stage Canvas** - 2D canvas rendering engine with: sprite rendering, pen trails, grid, AI detection overlays, monitors | ✅ Working |
| **[Sprite.ts](src/stage/Sprite.ts)** | **Sprite Class** - Individual sprite representation with position, rotation, costume, size, visibility properties | ✅ Working |
| **[SpritePanel.tsx](src/stage/SpritePanel.tsx)** | **Sprite Sidebar** - Shows all project sprites, scenes, and tabs (costumes, sounds) | ✅ Working |
| **[StageManager.ts](src/engine/StageManager.ts)** | **Backdrop Management** - Load, switch, manage scene backdrops | ✅ Working |
| **[SpriteManager.ts](src/engine/SpriteManager.ts)** | **Sprite Lifecycle** - Create, delete, clone, select sprites | ✅ Working |

### Stage Engine Components

| File | Description | Status |
|------|-------------|--------|
| **[GameLoop.ts](src/engine/GameLoop.ts)** | **60 FPS Update Loop** - Continuous rendering and physics updates | ✅ Working |
| **[PenManager.ts](src/engine/PenManager.ts)** | **Pen Drawing** - Draw lines, control pen thickness/color | ✅ Working |
| **[MotionEngine.ts](src/engine/MotionEngine.ts)** | **Smooth Motion** - Glide animations, interpolation | ✅ Working |
| **[CostumeEngine.ts](src/engine/CostumeEngine.ts)** | **Costume Rendering** - Sprite appearance switching | ✅ Working |
| **[SoundManager.ts](src/engine/SoundManager.ts)** | **Audio Playback** - Play sounds, manage volume | ✅ Working |

### Stage Monitors

| Component | Purpose | Status |
|-----------|---------|--------|
| **Variable Monitors** | Display variable values (normal, large, slider modes) | ✅ Working |
| **List Monitors** | Show list items in draggable panels | ✅ Working |
| **Table Monitors** | Display 2D arrays/tables with resizing | ✅ Working |
| **Sensing Monitors** | Show sensor values (temperature, light, etc.) | ✅ Working |

### Stage Features

| Feature | Implementation | Status |
|---------|-----------------|--------|
| **Grid Display** | Canvas grid overlay with optional numbering | ✅ Working |
| **Drag Sprites** | Mouse drag to reposition sprites on stage | ✅ Working |
| **Camera Mode** | Webcam input with face detection overlays | ✅ Working |
| **Fullscreen** | Stage fullscreen expansion button | ✅ Working |
| **Responsive Scaling** | Stage scales in embedded layouts | ✅ Working |

---

## 📤 Upload Mode Files

> **Upload Mode:** Compile Blockly code to Arduino/ESP32 firmware and upload to physical hardware.

### Upload System

| File | Description | Status |
|------|-------------|--------|
| **[UploadModal.tsx](src/components/UploadModal.tsx)** | **Upload UI** - Shows upload progress, logs, status messages | ✅ Working |
| **[ArduinoUploader.ts](src/upload/ArduinoUploader.ts)** | **Upload Controller** - Manages upload process (compile → verify → flash) | ✅ Working |
| **[SerialMonitor.tsx](src/components/SerialMonitor.tsx)** | **Serial Communication** - Debug monitor for serial output during/after upload | ✅ Working |

### Hardware Adapters & Configuration

| File | Description | Status |
|------|-------------|--------|
| **[HardwareAdapter.ts](src/hardware/HardwareAdapter.ts)** | **Hardware Abstraction** - Unified interface for Arduino/ESP32 | ✅ Working |
| **[firmware-protocol.ts](src/firmware/firmware-protocol.ts)** | **Protocol Definition** - Communication protocol for serial uploads | ✅ Working |
| **[SerialManager.ts](src/serial/SerialManager.ts)** | **Serial Port Management** - COM port detection, connection, data I/O | ✅ Working |
| **[platform.ts](src/config/platform.ts)** | **Platform Detection** - Detect running platform (Windows, Mac, Linux) | ✅ Working |

### Upload Code Generators

| Generator | Output | Status |
|-----------|--------|--------|
| **Arduino Generator** | `.ino` (Arduino C++/Wiring) | ✅ Working |
| **Compiler Service** | Pre-compiled `.hex` or `.bin` files | ✅ Working |

### Upload Workflow

```
Blockly Blocks → Arduino Generator → C++/Wiring Code
                                        ↓
                                    Compile (arduino-cli)
                                        ↓
                                    Verify Binary
                                        ↓
                                    Serial Upload → Hardware
                                        ↓
                                    Serial Monitor (Feedback)
```

---

## 🔌 Drivers & Hardware

### Serial Communication Drivers (`cp210x_drivers/`)

> **Purpose:** USB-to-Serial drivers for Arduino/ESP32 boards using Silicon Labs CP210x chipset

| Item | Description | Supported |
|------|-------------|-----------|
| **[silabser.inf](cp210x_drivers/silabser.inf)** | Device driver information file (Windows setup) | ✅ Windows |
| **[silabser.cat](cp210x_drivers/silabser.cat)** | Digital signature catalog for driver verification | ✅ Windows |
| **[UpdateParameters.reg](cp210x_drivers/UpdateParameters.reg)** | Registry update script for driver parameters | ✅ Windows |
| **[UpdateParam.bat](cp210x_drivers/UpdateParam.bat)** | Batch script for driver parameter updates | ✅ Windows |
| **[SLAB_License_Agreement_VCP_Windows.txt](cp210x_drivers/SLAB_License_Agreement_VCP_Windows.txt)** | License for VCP (Virtual COM Port) drivers | ✅ Windows |

### Driver Architectures

| Architecture | Location | Status |
|--------------|----------|--------|
| **x86 (32-bit)** | `cp210x_drivers/x86/` | ✅ Supported |
| **x64 (64-bit)** | `cp210x_drivers/x64/` | ✅ Supported |
| **ARM (32-bit)** | `cp210x_drivers/arm/` | ✅ Supported |
| **ARM64 (64-bit)** | `cp210x_drivers/arm64/` | ✅ Supported |

### Hardware Platform Support

| Platform | Blocks | Upload | Status |
|----------|--------|--------|--------|
| **Arduino (UNO/Mega/Nano)** | ✅ arduino-blocks.ts | ✅ Arduino C++ | ✅ Working |
| **ESP32** | ✅ esp32-blocks.ts | ✅ ESP-IDF/Arduino | ✅ Working |
| **Generic Hardware** | ✅ hardware-blocks.ts | ✅ Abstract | ✅ Working |

### Board Selection Modal

| File | Description | Status |
|------|-------------|--------|
| **[BoardSelectionModal.jsx](src/leapignite/client/components/BoardSelectionModal.jsx)** | Dialog to select target hardware board | ✅ Working |

---

## 🧩 Extensions & Runtime

### Extensions System (`src/extensions/`)

| File | Description | Status |
|------|-------------|--------|
| **[extensionDefinitions.ts](src/extensions/extensionDefinitions.ts)** | **Extension Registry** - Defines all available extensions (Face, Object Detection, Music) | ✅ Working |
| **[ExtensionManager.ts](src/extensions/ExtensionManager.ts)** | **Extension Lifecycle** - Load, initialize, unload extensions | ✅ Working |
| **[FaceDetectionExtension.ts](src/extensions/FaceDetectionExtension.ts)** | **Face Detection** - Emotion & pose detection via browser FaceDetector API | ✅ Working |
| **[ObjectDetectionExtension.ts](src/extensions/ObjectDetectionExtension.ts)** | **Object Detection** - COCO-SSD model for object/animal/person detection | ✅ Working |
| **[MusicExtension.ts](src/extensions/MusicExtension.ts)** | **Music Blocks** - Musical note playback, tempo control | ✅ Working |

### Runtime Components (`src/runtime/`)

| File | Description | Status |
|------|-------------|--------|
| **[RuntimeBridge.ts](src/runtime/RuntimeBridge.ts)** | **Block-to-Runtime Mapping** - Connects Blockly blocks to sprite/pen/event actions | ✅ Working |
| **[leapRuntime.js](src/runtime/leapRuntime.js)** | **Runtime API** - Global sprite, sound, pen, event objects for script execution | ✅ Working |

### Blockly Integration (`src/blockly/`)

| File | Description | Status |
|------|-------------|--------|
| **[runtime.ts](src/blockly/runtime.ts)** | **Blockly Runtime Setup** - Blockly configuration and global variables | ✅ Working |
| **[registerCustomFields.ts](src/blockly/registerCustomFields.ts)** | **Custom Block Fields** - Dropdown fields, color pickers, etc. | ✅ Working |

### Custom Toolbox

| File | Description | Status |
|------|-------------|--------|
| **[custom-toolbox.ts](src/custom-toolbox.ts)** | **Toolbox Configuration** - Define block categories and organization | ✅ Working |

---

## 📊 Data & Store

### State Management (`src/store/`)

| File | Description | Status |
|------|-------------|--------|
| **[variableStore.js](src/store/variableStore.js)** | **Variable State** - Zustand/Redux store for project variables | ✅ Working |

### Context (`src/context/`)

| File | Description | Status |
|------|-------------|--------|
| **[StageContext.jsx](src/context/StageContext.jsx)** | **Global Stage Context** - Sprites, scenes, project metadata via React Context | ✅ Working |

---

## 🎨 Styling

### CSS Files

| File | Location | Purpose | Status |
|------|----------|---------|--------|
| **Leaplab-blocks.css** | `src/styles/Leaplab-blocks.css` | Main block styling for Intermediate | ✅ Working |
| **juniorBlocks.css** | `src/leapignite/client/styles/juniorBlocks.css` | Junior block styles (reused in Intermediate) | ✅ Working |
| **juniorLooksBlocks.css** | `src/leapignite/client/styles/juniorLooksBlocks.css` | Looks block styling | ✅ Working |

---

## 🔧 Configuration

### Platform & Config

| File | Description | Status |
|------|-------------|--------|
| **[platform.ts](src/config/platform.ts)** | Detect OS (Windows/Mac/Linux) for platform-specific setup | ✅ Working |

---

## 📚 Assets & Library

### Generated Assets

| File | Description | Size | Status |
|------|-------------|------|--------|
| **[generated_leap_backdrops.ts](src/components/generated_leap_backdrops.ts)** | Pre-built backdrop library (scenes) | Large | ✅ Working |
| **[generated_leap_sprites.ts](src/components/generated_leap_sprites.ts)** | Pre-built sprite library (characters) | Large | ✅ Working |
| **[generated_leap_sounds.ts](src/components/generated_leap_sounds.ts)** | Pre-built sound library (audio effects) | Large | ✅ Working |

### Asset Folders

| Folder | Contains | Status |
|--------|----------|--------|
| `assets/sprites/` | Sprite SVG/PNG files | ✅ Present |
| `assets/backdrops/` | Backdrop images | ✅ Present |
| `assets/sounds/` | Audio files | ✅ Present |

---

## 🚀 Summary Matrix

| Category | File Count | Status | Notes |
|----------|-----------|--------|-------|
| **Frontend Components** | 28+ | ✅ All Working | Lazy-loaded for performance |
| **Backend Services** | 10+ | ✅ All Working | Modular engine architecture |
| **Block Definitions** | 7 | ✅ All Working | 100+ total blocks |
| **Code Generators** | 3 | ✅ All Working | Arduino, Python, Animation |
| **Stage Mode** | 6 components | ✅ All Working | Real-time visual execution |
| **Upload Mode** | 5 components | ✅ All Working | Hardware firmware flashing |
| **Drivers** | 4 architectures | ✅ All Supported | CP210x USB serial drivers |
| **Extensions** | 6 types | ✅ All Working | ML + Audio capabilities |
| **Runtime** | 3 files | ✅ All Working | Block execution bridge |

---

## 🔗 Key Integration Points

### Frontend → Backend
- **Components** call services via `fileService`, `projectService`
- **Stage** renders sprites via `stageManager`, `spriteManager`
- **Monitors** read state from `variableStore`

### Blockly → Runtime
- **Blocks** compile to JavaScript/Arduino/Python via generators
- **Runtime Bridge** maps block execution to sprite actions
- **Engines** (Motion, Sound, Costume) execute sprite state changes

### Hardware Integration
- **Upload Modal** → **Arduino Uploader** → **Compiler Service**
- **Serial Monitor** ← **Serial Manager** ← Hardware feedback

---

## 📈 Performance Optimizations

### Lazy Loading
- **CostumesTab**, **SoundsTab** → Lazy loaded (fabric.js, wav-encoder)
- **BackdropLibrary**, **SpriteLibrary** → React.lazy()
- **JuniorExtensionLibrary** → Deferred import

### Code Splitting
- **Intermediate** chunk: ~199 KB (gzipped: ~51 KB)
- **Block definitions** lazy-registered on first use
- **Extensions** loaded on demand

---

## ✅ Implementation Status: COMPLETE

✅ All core components implemented and working  
✅ Stage mode fully functional  
✅ Upload mode with hardware support  
✅ 100+ block definitions  
✅ Code generation for multiple targets  
✅ Serial communication & monitoring  
✅ Extensions framework active  
✅ Performance optimizations in place  

**Ready for production use.**
