# MIT App Inventor Blocks Editor - Expected Behavior

## Overview
MIT App Inventor uses Google's Blockly library for visual programming. The blocks editor allows users to create app logic by dragging and connecting blocks together.

## Core Block Behaviors

### 1. **Block Categories**
- **Events** (Yellow/Gold) - Component event handlers (when Button.Click, etc.)
- **Control** (Orange) - If/else, loops, for each
- **Logic** (Green) - Boolean operations, comparisons
- **Math** (Blue) - Numbers, arithmetic, random
- **Text** (Pink) - String operations, join, length
- **Lists** (Purple) - List operations, add items, get item
- **Colors** (Gray) - Color definitions
- **Variables** (Red) - Get/set global and local variables
- **Procedures** (Purple) - Custom functions
- **Components** (Various) - Component-specific blocks

### 2. **Drag and Drop Behavior**

#### From Toolbox to Workspace:
- Click and hold on a block in the toolbox (left panel)
- A copy of the block appears and follows the cursor
- The original block remains in the toolbox
- Release to place the block on the workspace
- Blocks snap to grid for alignment

#### Moving Blocks on Workspace:
- Click and drag any block to move it
- When dragging a statement block, all connected blocks below move with it
- Blocks show connection indicators when near compatible connections
- **Insertion marker** (green/translucent) shows where block will connect
- Blocks highlight when hovering over valid connection points

#### Connecting Blocks:
- **Statement blocks** (notch on top, bump on bottom) connect vertically
- **Value blocks** (puzzle piece shape) fit into sockets
- **Boolean blocks** (diamond shape) fit into boolean sockets
- Blocks only connect to compatible types
- Invalid connections are rejected (block bounces back)

### 3. **Block Connection Types**

#### Statement Connections:
- Previous connection (notch on top)
- Next connection (bump on bottom)
- Allows chaining of commands

#### Value Connections:
- Output connection (left side puzzle piece)
- Input connection (right side socket)
- For expressions and values

#### Boolean Connections:
- Diamond-shaped for true/false values
- Only accepts boolean blocks

### 4. **Visual Feedback**

#### During Drag:
- Dragged block becomes slightly transparent (opacity: 0.8)
- Cursor changes to "grabbing"
- Compatible connection points highlight in blue
- Insertion marker (green translucent) shows connection preview

#### On Hover:
- Blocks glow slightly when hovering over them
- Connection points become more visible
- Tooltip may appear with block description

#### On Connection:
- Blocks snap together with satisfying alignment
- Connection is immediate and solid
- No gap between connected blocks

### 5. **Block Manipulation**

#### Right-Click Context Menu:
- **Duplicate** - Create a copy of the block and its children
- **Add Comment** - Add a text comment to the block
- **Inline Inputs** - Toggle between external and inline inputs
- **Collapse Block** - Minimize block to save space
- **Disable Block** - Gray out block (won't generate code)
- **Delete Block** - Remove block (or drag to trash)
- **Help** - Show documentation for the block

#### Keyboard Shortcuts:
- **Ctrl+C** - Copy selected block
- **Ctrl+V** - Paste copied block
- **Ctrl+Z** - Undo
- **Ctrl+Shift+Z** - Redo
- **Delete** - Delete selected block
- **Shift+Drag** - Select multiple blocks (newer versions)

### 6. **Workspace Features**

#### Zoom Controls:
- **+** button - Zoom in
- **-** button - Zoom out
- **Reset** button - Return to 100% zoom
- Mouse wheel - Zoom in/out
- Pinch gesture on touch devices

#### Panning:
- Click and drag on empty workspace to pan
- Scrollbars appear when workspace is larger than view

#### Trash Can:
- Located in bottom-right corner
- Drag blocks here to delete them
- Click trash to view recently deleted blocks
- Can restore blocks from trash (undo delete)

### 7. **Block States**

#### Normal State:
- Full color, solid appearance
- Fully functional

#### Disabled State:
- Grayed out appearance
- Won't generate code
- Still connected to other blocks
- Can be re-enabled

#### Error State:
- Red outline or highlight
- Indicates missing required inputs
- Shows warning icon

#### Collapsed State:
- Block shrinks to show only header
- Saves workspace space
- Click to expand

### 8. **Special Block Types**

#### Event Handler Blocks:
- Cannot be nested inside other blocks
- Must be at top level of workspace
- Have "when" prefix (when Button1.Click)
- Define entry points for code execution

#### Procedure Definition Blocks:
- Define custom functions
- Can have parameters
- Can return values
- Called by procedure call blocks

#### Variable Blocks:
- Global variables - accessible everywhere
- Local variables - scoped to procedure
- Initialize blocks set initial values

### 9. **Code Generation**
- Blocks generate code in real-time
- Code is not directly visible to users (abstracted)
- Generated code is Java/Kotlin for Android
- Blocks ensure syntactically correct code
- Type checking prevents runtime errors

### 10. **Performance Considerations**
- Smooth 60fps dragging on modern devices
- Efficient rendering for large workspaces (100+ blocks)
- Lazy loading of block definitions
- Optimized SVG rendering
- Hardware acceleration when available

## Implementation Requirements for Clone

### Must Have:
1. ✅ Smooth drag and drop from toolbox to workspace
2. ✅ Blocks remain visible during entire drag operation
3. ✅ Connection indicators (insertion markers) show where blocks will connect
4. ✅ Blocks snap to compatible connections automatically
5. ✅ Invalid connections are rejected (block doesn't connect)
6. ✅ Dragging statement blocks moves all connected blocks below
7. ✅ Right-click context menu for block operations
8. ✅ Undo/redo functionality
9. ✅ Zoom and pan controls
10. ✅ Trash can for deleting blocks

### Nice to Have:
- Block search functionality
- Keyboard navigation
- Multi-block selection (Shift+drag)
- Block animations (smooth connections)
- Sound effects (optional)
- Touch device support
- Accessibility features (screen reader support)

## Current Implementation Status

### ✅ Completed:
- Blockly workspace initialization
- Category-based toolbox
- Basic block definitions (Control, Logic, Math, Text, Components)
- Drag from toolbox to workspace
- Block connections
- Zoom controls
- Trash can

### ⚠️ In Progress:
- **Z-index fix for dragging blocks** - Blocks should stay visible during drag
- **Media files (sprites.png)** - Using CDN fallback
- **Connection indicators** - Need to ensure insertion markers are visible

### 🔲 Not Started:
- Right-click context menu
- Block comments
- Block collapse/expand
- Block disable/enable
- Procedure blocks
- Variable blocks
- List blocks
- Advanced block types

## Technical Notes

### Blockly Version:
- Using Blockly v12.5.1
- Zelos renderer for modern appearance
- Classic theme for familiar look

### Key Configuration:
```javascript
{
  renderer: 'zelos',        // Modern block appearance
  theme: Blockly.Themes.Classic,
  media: 'https://unpkg.com/blockly/media/',
  grid: { spacing: 20, snap: true },
  zoom: { controls: true, wheel: true },
  trashcan: true,
  move: { drag: true, scrollbars: true, wheel: true }
}
```

### CSS Requirements:
- Proper z-index for drag surface (9999)
- Cursor feedback (grab/grabbing)
- Connection indicator styling
- Insertion marker visibility
- SVG overflow: visible

## References
- [MIT App Inventor Official Site](https://appinventor.mit.edu/)
- [Blockly Documentation](https://developers.google.com/blockly)
- [MIT App Inventor Community](https://community.appinventor.mit.edu/)
