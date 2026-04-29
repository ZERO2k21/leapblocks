# LeapCodex Mode Layout Implementation Summary

## Overview
The LeapCodex application has three distinct workflow modes: **IDE**, **Stage**, and **Upload**. Each mode has a specific layout and functionality tailored to its purpose.

## Changes Applied

### 1. IDE Mode Layout Fix
**Issue**: The terminal was positioned at the bottom of the editor, but the target design shows it on the right side.

**Solution**: Reverted the layout to show:
- **Left**: SidePanel (240px wide) with file explorer
- **Center**: Monaco editor with file tabs and status bar
- **Right**: Terminal/REPL panel (380px wide, full height)

**Key Features**:
- Dark theme (#1e1e2e background)
- File tabs in the second toolbar (dark bar)
- Terminal panel with `▶ Terminal` and `>>> REPL` tabs
- "No files yet" empty state with "+ New File" button
- Floating action buttons (FABs) at bottom of sidebar:
  - Purple circular button for Python session actions (PIP/Extensions)
  - Purple circular button for adding files (Python/Image/Text/CSV)

### 2. TerminalPanel Enhancement
**Change**: Added `fillHeight` prop to TerminalPanel component.

**Purpose**: Allows the terminal to:
- Fill available vertical space in IDE mode (`fillHeight={true}`)
- Use fixed height (220px) in Stage mode (`fillHeight={false}`, default)

**Implementation**:
```jsx
const containerStyle = fillHeight
    ? { flex: 1, minHeight: 0, display: "flex", flexDirection: "column", ... }
    : { height: 220, display: "flex", flexDirection: "column", ... };
```

## Current Mode Layouts

### IDE Mode
```
┌─────────────────────────────────────────────────────────────────┐
│ TopBar: LEAPLAB CODEX | File Edit ... | Mode [IDE] Stage Upload │
├─────────────────────────────────────────────────────────────────┤
│ Second Toolbar: File tabs | Undo/Redo | Run/Stop                │
├──────────────┬──────────────────────────────────┬───────────────┤
│              │                                  │               │
│  SidePanel   │         Monaco Editor            │   Terminal    │
│  (240px)     │         (flex: 1)                │   (380px)     │
│              │                                  │               │
│  Files       │  - File tabs                     │  ▶ Terminal   │
│  [+] New     │  - Code editor                   │  >>> REPL     │
│              │  - Status bar                    │               │
│  [FAB] Py    │                                  │  Output...    │
│  [FAB] Add   │                                  │               │
│              │                                  │               │
│  MODULES/    │                                  │               │
│  LIBRARIES   │                                  │               │
│  • Sprite    │                                  │               │
└──────────────┴──────────────────────────────────┴───────────────┘
```

### Stage Mode
```
┌─────────────────────────────────────────────────────────────────┐
│ TopBar: LEAPLAB CODEX | File Edit ... | Mode IDE [Stage] Upload │
├─────────────────────────────────────────────────────────────────┤
│ Second Toolbar: Blocks [Python] | Costumes Sounds | Run/Stop    │
├──────────────┬──────────────────────────────────┬───────────────┤
│              │                                  │               │
│  SidePanel   │         Monaco Editor            │  StagePanel   │
│  (240px)     │         (flex: 1)                │  (380px)      │
│              │                                  │               │
│  Files       │  - File tabs                     │  STAGE        │
│  [+] New     │  - Code editor                   │  ┌─────────┐  │
│              │  - Status bar                    │  │ Canvas  │  │
│  [FAB] Py    │  ─────────────────────           │  └─────────┘  │
│  [FAB] Add   │  ▶ Terminal | >>> REPL           │               │
│              │  Output...                       │  Sprite Props │
│  MODULES/    │                                  │  x: 0  y: 0   │
│  LIBRARIES   │                                  │  Show Size:100│
│  • Sprite    │                                  │               │
│              │                                  │  SPRITES      │
│              │                                  │  [+ Add]      │
│              │                                  │  • Robot      │
└──────────────┴──────────────────────────────────┴───────────────┘
```

### Upload Mode
```
┌─────────────────────────────────────────────────────────────────┐
│ TopBar: LEAPLAB CODEX | File Edit ... | Mode IDE Stage [Upload] │
├─────────────────────────────────────────────────────────────────┤
│ Second Toolbar: [MicroPython] Board C++ | Arduino Uno | Port... │
├──────────────┬──────────────────────────────────────────────────┤
│              │                                                   │
│  Sidebar     │         Monaco Editor                            │
│  (278px)     │         (flex: 1)                                │
│              │                                                   │
│  Files       │  - main.py tab                                   │
│  [New .py]   │  - Code editor                                   │
│  [Import]    │  - Status bar                                    │
│              │  ─────────────────────────────────────────       │
│  • main.py   │  Terminal | Log | [Serial Monitor]               │
│              │  Output...                       [Upload Code]   │
│  ┌─────────┐ │                                                   │
│  │ Board   │ │                                                   │
│  │ Uno     │ │                                                   │
│  └─────────┘ │                                                   │
│  ┌─────────┐ │                                                   │
│  │ Connect │ │                                                   │
│  │ Status  │ │                                                   │
│  └─────────┘ │                                                   │
│              │                                                   │
│  [FAB] C++   │                                                   │
└──────────────┴───────────────────────────────────────────────────┘
```

## Key Components

### pythonApp.jsx
- Main application component
- Manages workflow mode state (`workflowMode`: "ide" | "stage" | "upload")
- Renders appropriate layout based on mode
- Handles mode switching via `handleWorkflowModeChange()`

### SidePanel.jsx
- Left sidebar component
- Shows different panels based on `sidePanel` state:
  - `"files"`: File explorer with FABs
  - `"sprites"`: Sprite library
  - `"backdrops"`: Backdrop library
  - `"extensions"`: Extensions panel
  - `"pip"`: PIP packages panel
- Includes `PythonSessionActionMenu` and `FileAddMenu` FABs

### TerminalPanel.jsx
- Terminal/REPL component
- Supports two layout modes via `fillHeight` prop
- Shows tabs: `▶ Terminal` | `>>> REPL`
- Displays output with syntax highlighting

### EditorPanel.jsx
- Wraps Monaco editor, status bar, and terminal
- Used in Stage mode to show editor + terminal stacked

### StagePanel.jsx
- Right panel in Stage mode
- Shows stage canvas, sprite properties, costume selector, sprite list
- Includes "+ Add Sprite" button

## Workflow Functionality

### IDE Mode
1. **File Management**: Create, open, save, delete Python files
2. **Code Editing**: Monaco editor with Python syntax highlighting
3. **Execution**: Run code with Ctrl+Enter or F5, Stop with Escape
4. **Terminal**: View output, errors, and execution logs
5. **REPL**: Interactive Python shell for testing code snippets
6. **Packages**: Install PIP packages (built-in and external)
7. **Extensions**: Add capabilities (Music, Pen, ML, Face Detection, Speech, IoT, Arduino)

### Stage Mode
1. **Visual Programming**: Edit Python code that controls sprites
2. **Sprite Management**: Add, delete, select sprites from library
3. **Costume Management**: Switch costumes, add new costumes
4. **Backdrop Management**: Change stage backgrounds
5. **Live Preview**: See sprites on canvas while coding
6. **Sprite Properties**: Adjust position, direction, size, visibility
7. **Code Execution**: Run code to animate sprites

### Upload Mode
1. **Dual File System**:
   - **MicroPython**: main.py and custom modules
   - **Board C++**: Arduino sketch (.ino) and libraries (.h/.cpp)
2. **Board Selection**: Choose target board (Arduino Uno, Mega, Nano, ESP32)
3. **Port Management**: Detect, select, and connect to serial ports
4. **Code Upload**: Upload firmware to connected board
5. **Serial Monitor**: Communicate with board via serial
6. **Library Management**: Create/import C++ libraries
7. **Include Management**: Add #include statements to board code

## Mode Switching
- **TopBar**: `Mode | IDE | Stage | Upload` buttons
- **Active Mode**: Highlighted with color (IDE: purple, Stage: green, Upload: green)
- **State Persistence**: Mode state maintained in `workflowMode`
- **Smooth Transitions**: Layout changes instantly on mode switch

## File Structure
```
src/leapCodex/client/
├── pythonApp.jsx           # Main app component (3659 lines)
├── layout/
│   ├── topBar.jsx          # Top navigation bar
│   └── activityBar.jsx     # Sidebar activity icons (not currently used)
├── panels/
│   ├── editorPanel.jsx     # Editor wrapper
│   ├── sidePanel.jsx       # Left sidebar (724 lines)
│   ├── stagePanel.jsx      # Stage canvas + properties
│   ├── backdropPanel.jsx   # Backdrop selector
│   ├── fileAddMenu.jsx     # FAB menus
│   └── pipPanel.jsx        # PIP packages panel
├── editor/
│   ├── monacoEditor.jsx    # Code editor
│   ├── fileTabs.jsx        # File tabs
│   └── statusBar.jsx       # Editor status bar
├── terminal/
│   └── terminalPanel.jsx   # Terminal/REPL panel
└── stage/
    ├── stageCanvas.jsx     # Canvas rendering
    └── spriteProperties.jsx # Sprite property editor
```

## Next Steps (If Needed)
1. **Activity Bar Integration**: The `activityBar.jsx` component exists but isn't used. Consider integrating it as a vertical icon bar on the left edge.
2. **Mode Transition Animations**: Add smooth fade/slide animations when switching modes.
3. **Keyboard Shortcuts**: Add mode-specific shortcuts (e.g., Ctrl+1 for IDE, Ctrl+2 for Stage, Ctrl+3 for Upload).
4. **State Persistence**: Save mode preference to localStorage.
5. **Mode-Specific Help**: Add tooltips and help panels for each mode.

## Verification
To verify the implementation matches the target design:
1. ✅ IDE mode: Terminal on right side (380px wide)
2. ✅ Stage mode: StagePanel on right side with canvas and sprite properties
3. ✅ Upload mode: Custom layout with board/port controls
4. ✅ Mode switching: Buttons in topBar work correctly
5. ✅ FABs: Floating action buttons at bottom of sidebar
6. ✅ Terminal flexibility: Fills height in IDE mode, fixed height in Stage mode

## Conclusion
The LeapCodex application now has three fully functional workflow modes with distinct layouts and features. The IDE mode layout has been corrected to match the target design with the terminal on the right side. The TerminalPanel component has been enhanced to support both flexible and fixed height layouts.
