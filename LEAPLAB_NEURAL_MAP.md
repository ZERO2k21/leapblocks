# 🧠 LeapLab Neural Map - Complete Application Architecture

## 📊 Overview
LeapLab is a comprehensive educational platform combining visual programming (Blockly), Python coding, ML/AI tools, and hardware simulation in an Electron-based desktop application.

---

## 🏗️ Core Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    ELECTRON SHELL                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Main       │  │   Preload    │  │   Renderer   │      │
│  │   Process    │  │   Scripts    │  │   Process    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   APPLICATION MODES                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ LeapEmbed│ │ LeapCodex│ │ LeapIgnite│ │ LeapNeura│      │
│  │ (Blockly)│ │ (Python) │ │ (Junior) │ │ (AI/ML)  │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   SHARED SERVICES                            │
│  • Scratch VM Engine  • Audio System  • File Management     │
│  • Hardware Simulation • Build System • Extension System    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Directory Structure Deep Dive

### 🎯 `/src` - Main Application Source

#### **Core Entry Points**
```
src/
├── index.ts              # Main Electron entry point
├── preload.ts            # Electron preload scripts (IPC bridge)
├── renderer.tsx          # React renderer entry
├── App.tsx               # Root React component
└── LandingPage.tsx       # Mode selection interface
```

#### **Application Modes** (4 Major Modules)

##### 1️⃣ **LeapEmbed** - Visual Programming (Blockly)
```
src/leapembed/
├── client/
│   ├── EmbedApp.tsx                    # Main Blockly IDE
│   ├── components/
│   │   ├── BlocklyWorkspace.tsx        # Blockly editor
│   │   ├── SpriteLibrary.tsx           # Sprite management
│   │   ├── EmbedRightPanel.tsx         # Properties panel
│   │   ├── Logo.jsx                    # Branding
│   │   ├── BoardSelectionModal.tsx     # Hardware board picker
│   │   └── TableMonitor.tsx            # Variable monitors
│   ├── stage/
│   │   ├── SpritePanel.tsx             # Stage rendering
│   │   └── StageCanvas.tsx             # Canvas operations
│   ├── hooks/
│   │   ├── useBlocklyInit.ts           # Blockly initialization
│   │   ├── useProject.ts               # Project state
│   │   ├── useSprites.ts               # Sprite management
│   │   └── useMonitors.ts              # Variable monitors
│   ├── styles/
│   │   └── embedApp.styles.ts          # Styled components
│   └── drivers/                        # Hardware drivers
│       ├── ESP32Driver.ts
│       └── ArduinoDriver.ts
├── server/                             # Backend services
└── drivers/                            # Hardware abstraction
```

**Key Features:**
- Drag-and-drop block programming
- Real-time sprite animation
- Hardware board simulation (ESP32, Arduino)
- Extension system for custom blocks
- Variable monitors and debugging

##### 2️⃣ **LeapCodex** - Python IDE
```
src/leapCodex/
├── client/
│   ├── pythonApp.jsx                   # Main Python IDE
│   ├── pythonNotebook.jsx              # Jupyter-style notebook
│   ├── layout/
│   │   ├── topBar.jsx                  # Menu and toolbar
│   │   ├── activityBar.jsx             # Side navigation
│   │   └── statusBar.jsx               # Bottom status
│   ├── panels/
│   │   ├── editorPanel.jsx             # Monaco code editor
│   │   ├── sidePanel.jsx               # File explorer
│   │   ├── pipPanel.jsx                # Package manager
│   │   └── outputPanel.jsx             # Console output
│   ├── terminal/
│   │   └── terminalPanel.jsx           # Terminal emulator
│   └── engines/
│       ├── SkulptEngine.js             # Browser Python (Skulpt)
│       └── NativePythonBridge.js       # Native Python bridge
├── server/                             # Python execution server
└── codex.ts                            # Module entry
```

**Key Features:**
- Monaco editor with Python syntax highlighting
- Skulpt (browser-based Python) execution
- Native Python integration (Electron)
- Package management (pip)
- REPL console
- Jupyter-style notebooks

##### 3️⃣ **LeapIgnite** - Junior Mode (Simplified)
```
src/leapignite/
├── client/
│   ├── JuniorApp.tsx                   # Simplified interface
│   ├── components/
│   │   ├── SimplifiedBlocks.tsx        # Kid-friendly blocks
│   │   ├── TutorialOverlay.tsx         # Interactive tutorials
│   │   └── ProgressTracker.tsx         # Learning progress
│   ├── hooks/
│   │   └── useJuniorWorkspace.tsx      # Workspace management
│   └── themes/
│       └── juniorTheme.ts              # Child-friendly styling
└── server/
```

**Key Features:**
- Simplified block palette
- Guided tutorials
- Progress tracking
- Age-appropriate UI/UX

##### 4️⃣ **LeapNeura** - AI/ML Training Platform
```
src/leapNeura/                          # Unified Neura module
├── client/                             # Frontend application
│   ├── neuraApp.tsx                    # Main entry point
│   ├── components/
│   │   ├── common/                     # Shared components
│   │   │   ├── projectHeader.tsx
│   │   │   ├── trainButton.tsx
│   │   │   ├── webcamCapture.tsx
│   │   │   ├── classifierLayout.tsx
│   │   │   └── trainingPanel.tsx
│   │   ├── dashboard/                  # Dashboard view
│   │   │   ├── myProjectsHeader.tsx
│   │   │   ├── emptyStateIllustration.tsx
│   │   │   └── projectCard.tsx
│   │   ├── createProject/              # Project creation
│   │   │   ├── createProjectModal.tsx
│   │   │   └── projectTypeCard.tsx
│   │   └── classifiers/                # ML classifiers
│   │       ├── imageClassifier/        # Image classification
│   │       ├── objectDetection/        # Object detection
│   │       ├── poseClassifier/         # Body pose detection
│   │       ├── handPoseClassifier/     # Hand gesture recognition
│   │       ├── audioClassifier/        # Sound classification
│   │       ├── numbersClassifier/      # Digit recognition
│   │       └── textClassifier/         # Text classification
│   ├── hooks/                          # Custom React hooks
│   ├── pages/                          # Page components
│   ├── styles/
│   │   └── neuraTheme.css
│   └── types/
│       ├── neura.d.ts
│       └── neura.types.ts
├── server/                             # Backend (ready for expansion)
├── shared/                             # Shared utilities
└── neura.ts                            # Module entry point

neura-ml/                               # Legacy standalone module (optional)
├── hooks/useTFClassifier.js            # TensorFlow.js integration
└── [other legacy files]
```

**Key Features:**
- 7 ML classifier types (image, object, pose, hand, audio, text, numbers)
- Visual training interface with webcam/audio capture
- Real-time model training and testing
- Project management system
- TensorFlow.js integration
- Export trained models

**Entry Point:** `src/App.tsx` → lazy loads `src/leapNeura/client/neuraApp.tsx`

---

### 🧩 **Shared Systems**

#### **Scratch VM Engine**
```
src/scratch-vm/
├── src/
│   ├── engine/
│   │   ├── runtime.js                  # Execution engine
│   │   ├── thread.js                   # Thread management
│   │   └── sequencer.js                # Block sequencing
│   ├── blocks/
│   │   ├── scratch3_motion.js          # Motion blocks
│   │   ├── scratch3_looks.js           # Appearance blocks
│   │   ├── scratch3_sound.js           # Audio blocks
│   │   └── scratch3_control.js         # Control flow blocks
│   ├── sprites/
│   │   └── sprite.js                   # Sprite class
│   └── extensions/
│       └── extension-manager.js        # Extension loader
```

#### **Audio System**
```
src/scratch-audio/
├── src/
│   ├── AudioEngine.js                  # Core audio engine
│   ├── effects/
│   │   ├── PitchEffect.js
│   │   ├── PanEffect.js
│   │   └── VolumeEffect.js
│   └── SoundPlayer.js                  # Sound playback
```

#### **Hardware Simulation**
```
src/simulation/
├── ESP32SimulationRunner.ts            # ESP32 emulator
├── ESP32BoardConfig.ts                 # Board configurations
└── __tests__/
    └── esp32Integration.test.ts        # Integration tests
```

#### **Extensions System**
```
src/extensions/
├── index.ts                            # Extension registry
public/extensions/
├── ext-face-detection.html             # Face detection
├── ext-object-detection.html           # Object detection
├── ext-music.html                      # Music blocks
├── ext-pen.html                        # Drawing tools
└── ext-detail.html                     # Extension details
```

---

### 🎨 **Assets & Resources**

```
public/
├── assets/
│   ├── sprites/                        # Sprite images
│   ├── backdrops/                      # Stage backgrounds
│   ├── sounds/                         # Audio files
│   └── ui/                             # UI icons
├── blockly-media/                      # Blockly UI assets
├── icons/                              # Block category icons
├── models/                             # ML models (face detection)
├── skulpt-stdlib.js                    # Python standard library
└── skulpt.min.js                       # Python interpreter
```

---

### ⚙️ **Build & Configuration**

```
Root/
├── electron.vite.config.ts             # Vite config for Electron
├── vite.web.config.ts                  # Vite config for web
├── electron-builder.yml                # Electron packaging
├── tsconfig.json                       # TypeScript config
├── tailwind.config.js                  # Tailwind CSS
├── package.json                        # Dependencies
└── .eslintrc.json                      # Linting rules
```

---

### 🤖 **AI Agent System**

```
.agent/
├── agents/                             # Specialized AI agents
│   ├── frontend-specialist.md
│   ├── backend-specialist.md
│   ├── database-architect.md
│   ├── devops-engineer.md
│   └── [17 more agents]
├── skills/                             # Reusable skills
│   ├── api-patterns/
│   ├── architecture/
│   ├── clean-code/
│   ├── database-design/
│   └── [30+ skill modules]
├── workflows/                          # Workflow templates
│   ├── brainstorm.md
│   ├── create.md
│   ├── debug.md
│   └── [7 more workflows]
├── scripts/                            # Automation scripts
│   ├── auto_preview.py
│   ├── checklist.py
│   └── verify_all.py
└── .shared/
    └── ui-ux-pro-max/                  # UI/UX knowledge base
        ├── data/
        │   ├── charts.csv
        │   ├── colors.csv
        │   ├── icons.csv
        │   └── stacks/                 # Framework-specific guides
        └── scripts/
            ├── core.py
            ├── design_system.py
            └── search.py
```

---

## 🔄 Data Flow Architecture

### **User Interaction Flow**
```
User Action
    ↓
Landing Page (Mode Selection)
    ↓
┌─────────────┬─────────────┬─────────────┬─────────────┐
│  LeapEmbed  │  LeapCodex  │ LeapIgnite  │  LeapNeura  │
└─────────────┴─────────────┴─────────────┴─────────────┘
    ↓               ↓               ↓               ↓
Blockly VM      Skulpt/Python   Simplified VM   TensorFlow.js
    ↓               ↓               ↓               ↓
Hardware Sim    Terminal Output  Tutorial Flow  Model Training
    ↓               ↓               ↓               ↓
Visual Output   Console Display  Progress Track  Predictions
```

### **Build & Compilation Flow**
```
Source Code (TypeScript/React)
    ↓
Vite Build System
    ↓
┌─────────────────┬─────────────────┐
│  Main Process   │  Renderer       │
│  (Node.js)      │  (Chromium)     │
└─────────────────┴─────────────────┘
    ↓
Electron Builder
    ↓
Packaged Application (.exe, .dmg, .AppImage)
```

---

## 🔌 Key Technologies

### **Frontend Stack**
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Monaco Editor** - Code editing
- **Blockly** - Visual programming
- **D3.js** - Data visualization
- **Fabric.js** - Canvas manipulation

### **Backend/Runtime**
- **Electron** - Desktop framework
- **Node.js** - Server runtime
- **Skulpt** - Browser Python
- **TensorFlow.js** - ML inference
- **AVR8js** - Arduino simulation

### **Build Tools**
- **Vite** - Build system
- **Electron Builder** - Packaging
- **ESLint** - Code quality
- **Vitest** - Testing

---

## 📦 Module Dependencies

```
LeapEmbed → Scratch VM → Audio Engine
         → Hardware Drivers → ESP32 Sim
         → Extension System

LeapCodex → Skulpt Engine
         → Monaco Editor
         → Terminal Emulator
         → Python Bridge

LeapIgnite → Simplified Scratch VM
          → Tutorial System
          → Progress Tracker

LeapNeura → TensorFlow.js
         → Webcam/Audio APIs
         → Model Storage
```

---

## 🚀 Startup Sequence

1. **Electron Main Process** (`src/index.ts`)
   - Initialize window
   - Load preload scripts
   - Setup IPC handlers

2. **Renderer Process** (`src/renderer.tsx`)
   - Mount React app
   - Load Landing Page

3. **Mode Selection** (`src/LandingPage.tsx`)
   - User chooses mode
   - Route to appropriate app

4. **App Initialization**
   - Load mode-specific components
   - Initialize engines (VM/Skulpt/TensorFlow)
   - Setup event listeners
   - Render UI

---

## 🎯 Key File Relationships

### **Critical Paths**
```
Entry → Mode Selection → App Initialization
  ↓
src/index.ts
  ↓
src/renderer.tsx
  ↓
src/LandingPage.tsx
  ↓
┌──────────────────────────────────────────┐
│ src/leapembed/client/EmbedApp.tsx        │
│ src/leapCodex/client/pythonApp.jsx       │
│ src/leapignite/client/JuniorApp.tsx      │
│ src/leapNeura/client/neuraApp.tsx        │
└──────────────────────────────────────────┘
```

### **Shared Dependencies**
```
All Modes Use:
├── src/scratch-vm/          (Execution engine)
├── src/scratch-audio/       (Sound system)
├── public/assets/           (Media files)
└── src/components/          (Shared UI components)
```

---

## 📊 Statistics

- **Total Directories**: ~500+
- **Total Files**: ~5000+
- **Lines of Code**: ~500K+
- **Main Modules**: 4 (Embed, Codex, Ignite, Neura)
- **Extensions**: 5+ (Face, Object, Music, Pen, etc.)
- **AI Agents**: 20+
- **Skills**: 35+
- **Supported Languages**: Python, JavaScript, C/C++ (Arduino)
- **Hardware Platforms**: ESP32, Arduino, Generic boards

---

## 🔍 Quick Navigation Guide

**Want to modify...**
- **Blockly blocks?** → `src/scratch-vm/src/blocks/`
- **Python IDE?** → `src/leapCodex/client/pythonApp.jsx`
- **ML classifiers?** → `neura-ml/classifiers/`
- **UI styling?** → `src/styles/` + `tailwind.config.js`
- **Hardware simulation?** → `src/simulation/`
- **Extensions?** → `src/extensions/` + `public/extensions/`
- **Build config?** → `electron.vite.config.ts`
- **Assets?** → `public/assets/`

---

## 🎓 Learning Path

1. **Start Here**: `src/LandingPage.tsx` - Understand mode routing
2. **Pick a Mode**: Choose one app to deep dive
3. **Trace Data Flow**: Follow user actions through components
4. **Explore Engines**: Understand VM/Skulpt/TensorFlow integration
5. **Study Extensions**: See how plugins extend functionality
6. **Review Build**: Understand packaging and distribution

---

*This neural map provides a comprehensive overview of the LeapLab application architecture. Use it as a reference for navigation, development, and understanding the system's interconnections.*
