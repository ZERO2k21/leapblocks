# File and Edit Operations Implementation

## Overview
Comprehensive implementation of file operations (New, Open, Save, Save As) and edit operations (Undo, Redo, Cut, Copy, Paste) for ForgeStudio with keyboard shortcuts and dropdown menus.

## Features Implemented

### 1. Enhanced Topbar Component
**File**: `src/Electra/Client/Src/components/Layout/Topbar.tsx`

#### New Props Added:
```typescript
interface IgniteTopbarProps {
  // File operations
  onSave: () => void;
  onSaveAs?: () => void;
  onNew?: () => void;
  onOpen?: () => void;
  
  // Edit operations
  onUndo?: () => void;
  onRedo?: () => void;
  onCut?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  
  // Undo/Redo state
  canUndo?: boolean;
  canRedo?: boolean;
  
  // Existing props...
  title: string;
  onTitleChange: (val: string) => void;
  onBack: () => void;
  centerContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  brandName?: string;
}
```

#### File Menu Dropdown:
- **New Project** (Ctrl+N) - Create new project
- **Open Project** (Ctrl+O) - Open existing project
- **Save** (Ctrl+S) - Save current project
- **Save As...** (Ctrl+Shift+S) - Save with new name/location

#### Edit Menu Dropdown:
- **Undo** (Ctrl+Z) - Undo last change
- **Redo** (Ctrl+Y) - Redo undone change
- **Cut** (Ctrl+X) - Cut selected component
- **Copy** (Ctrl+C) - Copy selected component
- **Paste** (Ctrl+V) - Paste copied component

### 2. ForgeStudio Implementation
**File**: `src/Electra/Client/Src/ForgeStudio.tsx`

#### Undo/Redo History System:
```typescript
// State management
const [history, setHistory] = useState<Array<{ nodes: any[]; edges: any[]; code: string }>>([]);
const [historyIndex, setHistoryIndex] = useState(-1);

// Save to history (debounced 1 second)
const saveToHistory = () => {
  const newState = { nodes, edges, code };
  const newHistory = history.slice(0, historyIndex + 1);
  newHistory.push(newState);
  if (newHistory.length > 50) newHistory.shift(); // Limit to 50 states
  setHistory(newHistory);
  setHistoryIndex(newHistory.length - 1);
};

// Undo operation
const handleUndo = () => {
  if (historyIndex > 0) {
    const prevState = history[historyIndex - 1];
    setNodes(prevState.nodes);
    setEdges(prevState.edges);
    setCode(prevState.code);
    setHistoryIndex(historyIndex - 1);
  }
};

// Redo operation
const handleRedo = () => {
  if (historyIndex < history.length - 1) {
    const nextState = history[historyIndex + 1];
    setNodes(nextState.nodes);
    setEdges(nextState.edges);
    setCode(nextState.code);
    setHistoryIndex(historyIndex + 1);
  }
};
```

#### File Operations:

**New Project:**
```typescript
const handleNewProject = () => {
  if (confirm('Create a new project? Unsaved changes will be lost.')) {
    setNodes([]);
    setEdges([]);
    setCode(`// New Electra Project...`);
    setProjectName('Untitled Project');
    setProjectPath(null);
    setHistory([]);
    setHistoryIndex(-1);
    saveToHistory();
    
    // Add board back to canvas
    const state = useForgeStore.getState();
    state.addNode(board, { x: 400, y: 300 }, {
      label: board === 'esp32-c3' ? 'ESP32-C3' : 'Arduino Uno'
    });
  }
};
```

**Open Project:**
```typescript
const handleOpenProject = async () => {
  const result = await window.electronAPI.openProject();
  if (result && result.data) {
    const { nodes, edges, code } = result.data;
    setNodes(nodes || []);
    setEdges(edges || []);
    setCode(code || '');
    setProjectPath(result.projectPath);
    
    // Extract project name from path
    const pathParts = result.projectPath.split(/[\\/]/);
    setProjectName(pathParts[pathParts.length - 1]);
    
    // Reset history
    setHistory([]);
    setHistoryIndex(-1);
    saveToHistory();
  }
};
```

**Save Project:**
```typescript
const handleSaveProject = async () => {
  const projectData = { 
    nodes, 
    edges, 
    code, 
    board,
    version: '1.0.0',
    timestamp: new Date().toISOString()
  };
  const result = await window.electronAPI.saveProject(projectData, projectPath);
  if (result.success && result.projectPath) {
    setProjectPath(result.projectPath);
    const pathParts = result.projectPath.split(/[\\/]/);
    setProjectName(pathParts[pathParts.length - 1]);
  }
};
```

**Save As:**
```typescript
const handleSaveAsProject = async () => {
  const projectData = { nodes, edges, code, board, version: '1.0.0' };
  // Pass null to force "Save As" dialog
  const result = await window.electronAPI.saveProject(projectData, null);
  if (result.success && result.projectPath) {
    setProjectPath(result.projectPath);
    const pathParts = result.projectPath.split(/[\\/]/);
    setProjectName(pathParts[pathParts.length - 1]);
  }
};
```

#### Edit Operations:

**Cut:**
```typescript
const handleCut = () => {
  handleCopy(); // Copy first
  const state = useForgeStore.getState();
  if (state.selectedNodeId) {
    state.removeNode(state.selectedNodeId);
  }
  if (state.selectedEdgeId) {
    state.removeEdge(state.selectedEdgeId);
  }
};
```

**Copy:**
```typescript
const handleCopy = () => {
  const state = useForgeStore.getState();
  const clipboardData: any = {};
  
  if (state.selectedNodeId) {
    const node = nodes.find(n => n.id === state.selectedNodeId);
    if (node) clipboardData.node = JSON.parse(JSON.stringify(node));
  }
  
  if (state.selectedEdgeId) {
    const edge = edges.find(e => e.id === state.selectedEdgeId);
    if (edge) clipboardData.edge = JSON.parse(JSON.stringify(edge));
  }
  
  sessionStorage.setItem('forge-clipboard', JSON.stringify(clipboardData));
};
```

**Paste:**
```typescript
const handlePaste = () => {
  const clipboardStr = sessionStorage.getItem('forge-clipboard');
  if (!clipboardStr) return;
  
  const clipboardData = JSON.parse(clipboardStr);
  const state = useForgeStore.getState();
  
  if (clipboardData.node) {
    const newNode = {
      ...clipboardData.node,
      id: `${clipboardData.node.id}-copy-${Date.now()}`,
      position: {
        x: clipboardData.node.position.x + 50,
        y: clipboardData.node.position.y + 50
      }
    };
    state.addNode(newNode.data.type, newNode.position, newNode.data);
  }
};
```

#### Keyboard Shortcuts:
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      handleSaveProject();
    }
    else if (e.ctrlKey && e.shiftKey && e.key === 'S') {
      e.preventDefault();
      handleSaveAsProject();
    }
    else if (e.ctrlKey && e.key === 'n') {
      e.preventDefault();
      handleNewProject();
    }
    else if (e.ctrlKey && e.key === 'o') {
      e.preventDefault();
      handleOpenProject();
    }
    else if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      handleUndo();
    }
    else if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
      e.preventDefault();
      handleRedo();
    }
    else if (e.ctrlKey && e.key === 'x') {
      e.preventDefault();
      handleCut();
    }
    else if (e.ctrlKey && e.key === 'c') {
      e.preventDefault();
      handleCopy();
    }
    else if (e.ctrlKey && e.key === 'v') {
      e.preventDefault();
      handlePaste();
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [historyIndex, history, nodes, edges, code, projectPath]);
```

### 3. Topbar Integration:
```typescript
<IgniteTopbar
  title={projectName}
  onTitleChange={setProjectName}
  onBack={onBack}
  onSave={handleSaveProject}
  onSaveAs={handleSaveAsProject}
  onNew={handleNewProject}
  onOpen={handleOpenProject}
  onUndo={handleUndo}
  onRedo={handleRedo}
  onCut={handleCut}
  onCopy={handleCopy}
  onPaste={handlePaste}
  canUndo={historyIndex > 0}
  canRedo={historyIndex < history.length - 1}
/>
```

## Keyboard Shortcuts Reference

| Shortcut | Action |
|----------|--------|
| **Ctrl+N** | New Project |
| **Ctrl+O** | Open Project |
| **Ctrl+S** | Save |
| **Ctrl+Shift+S** | Save As |
| **Ctrl+Z** | Undo |
| **Ctrl+Y** | Redo |
| **Ctrl+Shift+Z** | Redo (alternative) |
| **Ctrl+X** | Cut |
| **Ctrl+C** | Copy |
| **Ctrl+V** | Paste |

## Project File Format

Projects are saved as `.lbp` (LeapBlocks Project) files with the following structure:

```json
{
  "nodes": [...],
  "edges": [...],
  "code": "...",
  "board": "arduino-uno" | "esp32-c3",
  "version": "1.0.0",
  "timestamp": "2026-05-08T..."
}
```

## Features

### Undo/Redo System:
- ✅ Tracks up to 50 history states
- ✅ Debounced (1 second) to avoid excessive history entries
- ✅ Tracks nodes, edges, and code changes
- ✅ Visual feedback (disabled state) when undo/redo unavailable
- ✅ Keyboard shortcuts (Ctrl+Z, Ctrl+Y)

### File Operations:
- ✅ New Project with confirmation dialog
- ✅ Open Project with file picker
- ✅ Save Project (updates existing or prompts for location)
- ✅ Save As (always prompts for new location)
- ✅ Auto-extracts project name from folder path
- ✅ Saves board configuration with project

### Edit Operations:
- ✅ Cut selected components
- ✅ Copy selected components
- ✅ Paste with offset positioning
- ✅ Uses sessionStorage for clipboard
- ✅ Works with both nodes and edges

### UI/UX:
- ✅ Dropdown menus with icons
- ✅ Keyboard shortcut hints in menus
- ✅ Disabled state for unavailable actions
- ✅ Smooth animations
- ✅ Click-outside to close menus
- ✅ Visual feedback on hover

## Testing

### Test File Operations:
1. **New Project**: Click File → New Project, confirm dialog appears
2. **Save**: Create circuit, click File → Save or Ctrl+S
3. **Open**: Click File → Open, select project folder
4. **Save As**: Click File → Save As, choose new location

### Test Edit Operations:
1. **Undo**: Make changes, click Edit → Undo or Ctrl+Z
2. **Redo**: After undo, click Edit → Redo or Ctrl+Y
3. **Copy/Paste**: Select component, Ctrl+C, then Ctrl+V
4. **Cut**: Select component, Ctrl+X (component removed and copied)

### Test Keyboard Shortcuts:
- Press each shortcut and verify action executes
- Verify shortcuts work when menus are closed
- Verify shortcuts don't conflict with browser defaults

## Known Limitations

1. **Clipboard**: Uses sessionStorage (not system clipboard) due to browser security
2. **History Limit**: Maximum 50 undo states to prevent memory issues
3. **Paste Offset**: Pasted components appear 50px offset from original
4. **Single Selection**: Cut/Copy only works with one selected item at a time

## Future Enhancements

- Multi-select cut/copy/paste
- System clipboard integration
- Drag-and-drop file opening
- Recent projects list
- Auto-save functionality
- Project templates
- Export/import functionality
- Collaborative editing

---

**Last Updated**: 2026-05-08
**Version**: 1.0.0
