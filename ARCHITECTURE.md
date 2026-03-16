# LeapBlocks Python System Architecture

## Overview

LeapBlocks is an Electron-based educational programming environment that combines visual block-based programming (Blockly) with a Python IDE. The system is designed to teach programming concepts through interactive sprite control and hardware integration.

## Core System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Electron App (Main Process)                       │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        Renderer Process                              │   │
│  │                                                                      │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │                     UI Layer (React)                         │   │   │
│  │  │                                                              │   │   │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │   │   │
│  │  │  │   Blockly   │  │  Python IDE │  │   Python Notebook   │  │   │   │
│  │  │  │  Workspace  │  │   Editor    │  │        UI           │  │   │   │
│  │  │  └─────────────┘  └─────────────┘  └─────────────────────┘  │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  │                              │                                       │   │
│  │                              ▼                                       │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │              Execution Controller                            │   │   │
│  │  │         (Run / Stop / Upload / Debug)                        │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  │                              │                                       │   │
│  │                              ▼                                       │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │            Python Runtime Manager                            │   │   │
│  │  │          (Skulpt - In-browser Python)                        │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  │                              │                                       │   │
│  │              ┌───────────────┴───────────────┐                       │   │
│  │              ▼                               ▼                       │   │
│  │  ┌─────────────────────┐       ┌─────────────────────┐              │   │
│  │  │  Hardware Interface │       │   Output Console    │              │   │
│  │  │  (Serial/WebSocket) │       │   (Stdout/Errors)   │              │   │
│  │  └─────────────────────┘       └─────────────────────┘              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      Main Process                                   │   │
│  │                                                                      │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐  │   │
│  │  │   Serial    │  │   File      │  │      IPC Bridge             │  │   │
│  │  │   Manager   │  │   System    │  │   (Renderer ↔ Main)         │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Module Architecture

### 1. UI Layer (React Components)

The UI is built with React and styled using Tailwind CSS. Key components:

| Component | File | Purpose |
|-----------|------|---------|
| `PythonApp` | `src/python/PythonApp.jsx` | Main Python IDE interface |
| `BlocklyWorkspace` | `src/blockly/` | Visual block programming |
| `PythonIDEGuide` | `src/python/PythonIDEGuide.jsx` | Help and documentation |
| `SpriteLibrary` | `src/components/SpriteLibrary.tsx` | Sprite catalog |
| `BackdropLibrary` | `src/components/BackdropLibrary.tsx` | Stage backgrounds |

### 2. Execution Controller

Located in `PythonApp.jsx`, the execution controller manages:

```javascript
// Run state management
const [isRunning, setIsRunning] = useState(false);

// Execution flow
const handleRun = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setTerminalOutput([]);
    addLog(`▶ Running ${activeFile}...`, "info");
    
    // Reset stage
    if (skulptRef.current?.callbacks?.actions?.softResetAll) {
        skulptRef.current.callbacks.actions.softResetAll();
    }
    
    try {
        await skulptRef.current.runPython(projectFiles[activeFile]);
        addLog("✓ Program finished.", "success");
    } catch (e) {
        addLog("✗ " + e.message, "error");
    } finally {
        setIsRunning(false);
    }
};
```

### 3. Python Runtime Manager (SkulptEngine)

Located in `src/junior/engine/SkulptEngine.js`, this module:

- **Uses Skulpt**: In-browser Python interpreter (no server required)
- **Provides Sprite API**: PictoBlox-compatible sprite control
- **Handles REPL**: Interactive Python shell
- **Manages Execution**: Code execution with timeout protection

```javascript
export class SkulptEngine {
    constructor(callbacks) {
        this.callbacks = callbacks; // { onOut, onErr, actions }
        this._replReady = false;
    }

    async runPython(code) {
        // Configure Skulpt
        this._configureSkulpt(sk);
        
        // Execute with sprite preamble
        const prog = SPRITE_PREAMBLE + '\n' + code;
        const runner = sk.importMainWithBody('<stdin>', false, prog, true);
        if (runner?.then) await runner;
    }

    async runRepl(line) {
        // Interactive REPL execution
        const result = await sk.importMainWithBody('<repl>', false, line, true);
        return result;
    }
}
```

### 4. Hardware Bridge

Two components handle hardware communication:

#### SerialManager (`src/serial/SerialManager.ts`)
- Manages serial port connections
- Handles Arduino/ESP32 communication
- Provides port listing and connection management

#### HardwareAdapter (`src/hardware/HardwareAdapter.ts`)
- High-level API for hardware control
- Command/response protocol handling
- Pin operations (digital, analog, PWM, servo)

```typescript
export class HardwareAdapter {
    async setDigitalPin(pin: number, value: boolean): Promise<boolean>
    async readAnalogPin(pin: number): Promise<number | null>
    async setServo(pin: number, angle: number): Promise<boolean>
    async setMotor(motorId: number, speed: number): Promise<boolean>
    async playTone(pin: number, frequency: number, durationMs: number): Promise<boolean>
}
```

### 5. Output Console

The terminal/console system provides:

- **Terminal Output**: Program stdout/stderr
- **REPL Interface**: Interactive Python shell
- **Debug Panel**: Variable inspection and breakpoints
- **PIP Package Manager**: Module installation UI

## Python IDE Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Python IDE Workflow                          │
└─────────────────────────────────────────────────────────────────┘

User writes Python code
        │
        ▼
┌─────────────────────┐
│  Monaco Editor      │
│  (Code Storage)     │
└─────────────────────┘
        │
        ▼
User clicks RUN ▶
        │
        ▼
┌─────────────────────┐
│ Execution Controller│
│  - Set isRunning    │
│  - Reset stage      │
│  - Clear console    │
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  SkulptEngine       │
│  - Configure Skulpt │
│  - Add sprite API   │
│  - Execute code     │
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  Skulpt Runtime     │
│  (Python 3 in JS)   │
└─────────────────────┘
        │
        ├──────────────────┐
        ▼                  ▼
┌───────────────┐  ┌───────────────┐
│ Sprite Actions│  │ stdout/stderr │
│ (move, say,   │  │ (print, error)│
│  turn, etc.)  │  │               │
└───────────────┘  └───────────────┘
        │                  │
        ▼                  ▼
┌───────────────┐  ┌───────────────┐
│ Stage Canvas  │  │ Console Panel │
│ (Visual       │  │ (Text output) │
│  feedback)    │  │               │
└───────────────┘  └───────────────┘
```

## Sprite API (PictoBlox-Compatible)

The `Sprite` class provides a Scratch/PictoBlox-compatible API:

```python
# Create a sprite
sprite = Sprite('Robot')

# Movement
sprite.move(50)           # Move forward
sprite.move_right(20)     # Move right
sprite.move_left(20)      # Move left
sprite.move_up(20)        # Move up
sprite.move_down(20)      # Move down
sprite.go_to(100, 50)     # Go to x, y
sprite.setx(100)          # Set x position
sprite.sety(50)           # Set y position

# Rotation
sprite.turn_right()       # Turn right 15°
sprite.turn_left()        # Turn left 15°
sprite.point_in_direction(90)  # Set angle

# Appearance
sprite.say("Hello!")      # Speech bubble
sprite.think("Hmm...")    # Thought bubble
sprite.hide()             # Hide sprite
sprite.show()             # Show sprite
sprite.set_size(150)      # Set size %
sprite.next_costume()     # Next costume
sprite.switch_costume('wave1')  # Specific costume
```

## File Structure

```
src/
├── python/
│   ├── PythonApp.jsx          # Main Python IDE component
│   └── PythonIDEGuide.jsx     # Help documentation
├── junior/
│   └── engine/
│       └── SkulptEngine.js    # Python runtime manager
├── hardware/
│   └── HardwareAdapter.ts     # High-level hardware API
├── serial/
│   └── SerialManager.ts       # Serial port management
├── components/
│   ├── SpriteLibrary.tsx      # Sprite catalog
│   └── BackdropLibrary.tsx    # Backdrop catalog
├── blockly/                   # Blockly workspace
├── firmware/                  # Firmware protocol
└── services/                  # Shared services
```

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Desktop** | Electron 39 | Cross-platform desktop app |
| **UI Framework** | React 19 | Component-based UI |
| **Styling** | Tailwind CSS 4 | Utility-first CSS |
| **Code Editor** | Monaco Editor | VS Code-like editing |
| **Python Runtime** | Skulpt | In-browser Python 3 |
| **Visual Programming** | Blockly | Block-based coding |
| **Hardware** | SerialPort | Arduino/ESP32 communication |
| **Bundler** | Webpack 5 | Module bundling |

## Tailwind CSS Integration

The project uses Tailwind CSS v4 with the following configuration:

```javascript
// tailwind.config.js
module.exports = {
    content: ['./src/**/*.{js,jsx,ts,tsx}'],
    theme: {
        extend: {
            colors: {
                'leap-purple': '#8B5CF6',
                'leap-dark': '#7C3AED',
                'leap-light': '#EDE9FE',
            }
        }
    }
}
```

### Key UI Styling Patterns

```jsx
// Header with Tailwind
<header className="h-12 bg-leap-purple flex items-center px-4 
                   justify-between text-white z-10 shadow-md flex-shrink-0">
    {/* Header content */}
</header>

// Editor panel
<div className="flex-1 flex flex-col overflow-hidden">
    <div className="flex bg-gray-100 border-b border-gray-200 h-9">
        {/* File tabs */}
    </div>
    <div className="flex-1 overflow-hidden">
        {/* Monaco editor */}
    </div>
</div>

// Console output
<div className="bg-gray-900 text-gray-100 font-mono text-sm p-4 overflow-auto">
    {/* Terminal output */}
</div>
```

## State Management

The Python IDE uses React hooks for state management:

```javascript
// Editor state
const [activeFile, setActiveFile] = useState("main.py");
const [projectFiles, setProjectFiles] = useState(DEFAULT_FILES);

// Execution state
const [isRunning, setIsRunning] = useState(false);

// Terminal state
const [terminalOutput, setTerminalOutput] = useState([]);
const [replInput, setReplInput] = useState("");
const [replHistory, setReplHistory] = useState([]);

// Sprite state
const [sprites, setSprites] = useState([/* initial sprites */]);
const [selectedSpriteId, setSelectedSpriteId] = useState('robot-1');

// UI state
const [sidePanel, setSidePanel] = useState("files");
const [activePanel, setActivePanel] = useState("terminal");
```

## IPC Communication (Electron)

Communication between renderer and main process:

```typescript
// Renderer → Main
window.electronAPI.sendSerial(command);
window.electronAPI.connect(portPath, baudRate, board);

// Main → Renderer
window.electronAPI.onSerialData((data: string) => { /* ... */ });
window.electronAPI.onConnectionChange((connected: boolean) => { /* ... */ });
```

## Extension System

Extensions add functionality to the Python environment:

```javascript
const EXTENSIONS = [
    { id: 'music',   name: 'Music',            icon: '🎵', code: '# Music\nfrom music import play_note' },
    { id: 'pen',     name: 'Pen',              icon: '✏', code: '# Pen\nfrom pen import pen_down, pen_up' },
    { id: 'ml',      name: 'Machine Learning', icon: '🧠', code: '# ML\nfrom ml import KNNClassifier' },
    { id: 'face',    name: 'Face Detection',   icon: '👁', code: '# Face\nfrom face import FaceDetection' },
    { id: 'speech',  name: 'Speech',           icon: '🗣', code: '# Speech\nfrom speech import say, listen' },
    { id: 'iot',     name: 'IoT / Quarky',     icon: '⚡', code: '# Quarky\nfrom quarky import Quarky' },
    { id: 'arduino', name: 'Arduino',          icon: '🔌', code: '# Arduino\nfrom arduino import Arduino' },
];
```

## PIP Package System

Simulated package management for Skulpt-compatible modules:

```javascript
const PIP_PACKAGES = [
    { name: "math", desc: "Mathematical functions", installed: true, builtin: true },
    { name: "random", desc: "Random number generation", installed: true, builtin: true },
    { name: "time", desc: "Time access & conversions", installed: true, builtin: true },
    { name: "json", desc: "JSON encoder/decoder", installed: true, builtin: true },
    // ... more packages
];
```

## Error Handling

Multi-level error handling:

1. **Skulpt Runtime Errors**: Caught and displayed in console
2. **Serial Communication Errors**: Timeout and connection error handling
3. **UI Errors**: React error boundaries (implicit)
4. **File System Errors**: Electron IPC error handling

## Performance Considerations

- **Skulpt Execution Limit**: 30-second timeout prevents infinite loops
- **Terminal Output Truncation**: Auto-scroll with smooth behavior
- **Sprite Updates**: Batched state updates via React
- **Serial Buffer**: Line-based parsing with buffer management

## Future Architecture Considerations

1. **Python Notebook Support**: Cell-based execution model
2. **Real Python Runtime**: Optional CPython backend via Electron
3. **Cloud Sync**: Project synchronization
4. **Collaborative Editing**: Real-time collaboration
5. **Plugin System**: Third-party extensions

---

*Generated for LeapBlocks Python System - Tailwind CSS UI Architecture*