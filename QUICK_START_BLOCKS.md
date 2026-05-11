# Quick Start Guide - MIT App Inventor Blocks

## What Was Fixed & Implemented

### ✅ Fixed Issues
1. **Drag-and-Drop Not Working**
   - Fixed CSS `pointer-events` blocking interactions
   - Enabled 360° drag angle (MIT App Inventor standard)
   - Added touch support for mobile devices

2. **Blocks Not Moving in Workspace**
   - Configured proper workspace move settings
   - Enabled pointer events on all block elements
   - Fixed SVG interaction issues

### ✅ Implemented Features
1. **66 Built-in Blocks**
   - Control (11 blocks)
   - Logic (4 blocks)
   - Math (10 blocks)
   - Text (13 blocks)
   - Lists (23 blocks)
   - Colors (5 blocks)

2. **Dynamic Component Blocks**
   - Event blocks (when Component.Event)
   - Method blocks (call Component.Method)
   - Property getters (Component.Property)
   - Property setters (set Component.Property to)

3. **MIT App Inventor Styling**
   - Exact color scheme
   - Proper toolbox structure
   - Workspace configuration

## How to Use

### 1. Start the Application
```bash
npm run dev
```

### 2. Open AppInventor Mode
- Navigate to the AppInventor section
- Create a new project or open existing

### 3. Add Components (Designer View)
- Drag components from palette to phone canvas
- Example: Add Button, Label, TextBox

### 4. Switch to Blocks View
- Click the "Blocks" button at the top

### 5. Use Built-in Blocks
```
Control Category:
├── if/then - Conditional logic
├── for each - Loops
└── while - Conditional loops

Logic Category:
├── true/false - Boolean values
├── not - Logical NOT
└── and/or - Logical operators

Math Category:
├── number - Number literal
├── + - × / - Arithmetic
└── random integer - Random numbers

Text Category:
├── text - Text literal
├── join - Concatenate
└── length - String length

Lists Category:
├── create empty list
├── make a list
└── add items to list

Colors Category:
├── color picker
├── make color (RGB)
└── random color
```

### 6. Use Component Blocks
```
For each component (e.g., Button1):

Events:
├── when Button1.Click do
├── when Button1.LongClick do
└── when Button1.GotFocus do

Properties (Getters):
├── Button1.Text
├── Button1.BackgroundColor
└── Button1.Enabled

Properties (Setters):
├── set Button1.Text to
├── set Button1.BackgroundColor to
└── set Button1.Enabled to

Methods:
└── (if component has methods)
```

## Example: Hello World App

### Step 1: Add Components
1. Add a **Button** (Button1)
2. Add a **Label** (Label1)

### Step 2: Create Blocks
```
┌─────────────────────────────────┐
│ when Button1.Click              │
│   do                            │
│   ┌─────────────────────────┐  │
│   │ set Label1.Text         │  │
│   │   to                    │  │
│   │   ┌──────────────────┐  │  │
│   │   │ "Hello, World!"  │  │  │
│   │   └──────────────────┘  │  │
│   └─────────────────────────┘  │
└─────────────────────────────────┘
```

### Step 3: How to Build
1. Open **Control** category
2. Drag **when Button1.Click** to workspace
3. Open **Button1** category
4. Drag **set Button1.Text to** into the "do" section
5. Open **Text** category
6. Drag **text** block and connect to "to" input
7. Type "Hello, World!" in the text block

## Example: Counter App

### Step 1: Add Components
1. Add a **Button** (Button1) with text "Count"
2. Add a **Label** (Label1) with text "0"

### Step 2: Initialize Counter
```
┌─────────────────────────────────┐
│ when Screen1.Initialize         │
│   do                            │
│   ┌─────────────────────────┐  │
│   │ initialize global       │  │
│   │   counter to            │  │
│   │   ┌───┐                 │  │
│   │   │ 0 │                 │  │
│   │   └───┘                 │  │
│   └─────────────────────────┘  │
└─────────────────────────────────┘
```

### Step 3: Increment Counter
```
┌─────────────────────────────────┐
│ when Button1.Click              │
│   do                            │
│   ┌─────────────────────────┐  │
│   │ set global counter      │  │
│   │   to                    │  │
│   │   ┌──────────────────┐  │  │
│   │   │ [counter] + [1]  │  │  │
│   │   └──────────────────┘  │  │
│   └─────────────────────────┘  │
│   ┌─────────────────────────┐  │
│   │ set Label1.Text         │  │
│   │   to                    │  │
│   │   ┌──────────────────┐  │  │
│   │   │ get counter      │  │  │
│   │   └──────────────────┘  │  │
│   └─────────────────────────┘  │
└─────────────────────────────────┘
```

## Drag and Drop Tips

### ✅ DO:
- Drag blocks from the flyout (left panel) to workspace
- Drag blocks within the workspace to rearrange
- Drag blocks together to connect them
- Drag blocks to the trashcan to delete
- Drag in any direction (360°)

### ❌ DON'T:
- Don't try to edit blocks in the flyout
- Don't force incompatible blocks together
- Don't worry about exact positioning (grid snapping helps)

## Keyboard Shortcuts

- **Ctrl+C** - Copy selected block
- **Ctrl+V** - Paste copied block
- **Ctrl+Z** - Undo
- **Ctrl+Y** - Redo
- **Delete** - Delete selected block
- **Ctrl+Scroll** - Zoom in/out

## Troubleshooting

### Blocks won't drag from flyout
✅ **Fixed!** This issue has been resolved. Blocks should now drag smoothly.

### Blocks won't move in workspace
✅ **Fixed!** This issue has been resolved. Blocks should now move freely.

### Blocks won't connect
- Make sure the blocks are compatible (check colors and shapes)
- Try dragging closer to the connection point
- Look for the white highlight indicating a valid connection

### Can't find a block
- Check the correct category (Control, Logic, Math, etc.)
- For component blocks, check the component's category (Button1, Label1, etc.)
- Use the search feature (if implemented)

## Block Colors Reference

| Color | Category | Hex Code |
|-------|----------|----------|
| 🟠 Orange | Control | #F59E0B |
| 🔵 Blue | Logic | #4A90E2 |
| 🟣 Purple-Blue | Math | #5B67A5 |
| 🟢 Green | Text | #68A83A |
| 🔴 Red | Lists | #C03838 |
| 🟣 Purple | Colors | #A55BA5 |
| 🟡 Yellow | Events | #FACC15 |
| 🟣 Purple | Methods | #894FC4 |
| 🟢 Green | Getters | #439970 |
| 🟢 Dark Green | Setters | #266643 |

## Next Steps

1. **Explore all block categories** - Try different blocks
2. **Build simple apps** - Start with Hello World
3. **Experiment with logic** - Use if/then blocks
4. **Add interactivity** - Use events and properties
5. **Test your app** - Build and run on device

## Resources

- [MIT_APP_INVENTOR_BLOCKS_STRUCTURE.md](./MIT_APP_INVENTOR_BLOCKS_STRUCTURE.md) - Complete block reference
- [BLOCKS_VISUAL_GUIDE.md](./BLOCKS_VISUAL_GUIDE.md) - Visual examples
- [IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md) - Technical details
- [MIT App Inventor Documentation](https://appinventor.mit.edu/explore/ai2/support)

## Support

If you encounter any issues:
1. Check this guide first
2. Review the troubleshooting section
3. Check the implementation documentation
4. Report bugs with detailed steps to reproduce

---

**Status:** ✅ Fully Functional  
**Version:** 1.0.0  
**Last Updated:** May 11, 2026
