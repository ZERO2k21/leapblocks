# MIT App Inventor Blocks - Visual Guide

## Block Categories Overview

### 🟠 Control Blocks (Orange #F59E0B)
```
┌─────────────────────────────────┐
│ if [test]                       │
│   then                          │
│     [do something]              │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ for each [i] from [1] to [10]  │
│   by [1]                        │
│   do                            │
│     [do something]              │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ while [test]                    │
│   do                            │
│     [do something]              │
└─────────────────────────────────┘
```

### 🔵 Logic Blocks (Blue #4A90E2)
```
┌──────┐
│ true │  Boolean value
└──────┘

┌──────────┐
│ not [  ] │  Logical NOT
└──────────┘

┌─────────────────┐
│ [  ] = [  ]     │  Comparison
└─────────────────┘

┌─────────────────┐
│ [  ] and [  ]   │  Logical AND
└─────────────────┘
```

### 🟣 Math Blocks (Purple-Blue #5B67A5)
```
┌───┐
│ 0 │  Number
└───┘

┌─────────────────┐
│ [  ] + [  ]     │  Addition
└─────────────────┘

┌─────────────────────────────┐
│ random integer from [1]     │
│   to [100]                  │
└─────────────────────────────┘

┌──────────────┐
│ square root  │
│   of [  ]    │
└──────────────┘
```

### 🟢 Text Blocks (Green #68A83A)
```
┌────┐
│ "" │  Text string
└────┘

┌─────────────────┐
│ join [  ] [  ]  │  Concatenate
└─────────────────┘

┌──────────────┐
│ length [  ]  │  String length
└──────────────┘

┌─────────────────────────┐
│ in text [  ]            │
│   contains [  ]         │
└─────────────────────────┘
```

### 🔴 List Blocks (Red #C03838)
```
┌──────────────────┐
│ create empty list│  New list
└──────────────────┘

┌─────────────────────┐
│ make a list         │
│   [  ] [  ] [  ]    │
└─────────────────────┘

┌─────────────────────┐
│ select list item    │
│   list [  ]         │
│   index [  ]        │
└─────────────────────┘

┌─────────────────────┐
│ is in list?         │
│   thing [  ]        │
│   list [  ]         │
└─────────────────────┘
```

### 🟣 Color Blocks (Purple #A55BA5)
```
┌────────┐
│ [🎨]   │  Color picker
└────────┘

┌─────────────────────┐
│ make color          │
│   red [255]         │
│   green [0]         │
│   blue [0]          │
└─────────────────────┘

┌──────────────┐
│ random color │
└──────────────┘
```

## Component Blocks

### 🟡 Event Blocks (Yellow #FACC15)
```
┌─────────────────────────────────┐
│ when Button1.Click              │
│   do                            │
│     [do something]              │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ when TextBox1.TextChanged       │
│   do                            │
│     [do something]              │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ when Screen1.Initialize         │
│   do                            │
│     [do something]              │
└─────────────────────────────────┘
```

### 🟣 Method Blocks (Purple #894FC4)
```
┌─────────────────────┐
│ call Canvas1.Clear  │  No return value
└─────────────────────┘

┌─────────────────────────────┐
│ call Canvas1.DrawCircle     │
│   centerX [  ]              │
│   centerY [  ]              │
│   radius [  ]               │
│   fill [  ]                 │
└─────────────────────────────┘

┌─────────────────────────────┐
│ call TinyDB1.StoreValue     │
│   tag [  ]                  │
│   valueToStore [  ]         │
└─────────────────────────────┘
```

### 🟢 Property Getter Blocks (Green #439970)
```
┌──────────────┐
│ Button1.Text │  Returns value
└──────────────┘

┌─────────────────────────┐
│ Button1.BackgroundColor │
└─────────────────────────┘

┌──────────────────┐
│ Slider1.Position │
└──────────────────┘
```

### 🟢 Property Setter Blocks (Dark Green #266643)
```
┌─────────────────────────┐
│ set Button1.Text        │
│   to [  ]               │
└─────────────────────────┘

┌─────────────────────────┐
│ set Label1.Visible      │
│   to [  ]               │
└─────────────────────────┘

┌─────────────────────────┐
│ set Image1.Picture      │
│   to [  ]               │
└─────────────────────────┘
```

## Toolbox Structure

```
📁 Blocks Editor
├── 🟠 Control (11 blocks)
│   ├── if/then
│   ├── if/then/else
│   ├── for each number
│   ├── for each item in list
│   ├── while
│   ├── choose
│   ├── do/result
│   ├── evaluate but ignore
│   ├── open another screen
│   ├── close screen
│   └── break
│
├── 🔵 Logic (4 blocks)
│   ├── true/false
│   ├── not
│   ├── comparison (=, ≠, <, ≤, >, ≥)
│   └── and/or
│
├── 🟣 Math (10 blocks)
│   ├── number
│   ├── arithmetic (+, -, ×, /, ^)
│   ├── single operations (√, abs, -, log, e^)
│   ├── trigonometry (sin, cos, tan, asin, acos, atan)
│   ├── constants (π, e, φ, √2, √½, ∞)
│   ├── number properties
│   ├── round
│   ├── modulo
│   ├── random integer
│   └── random fraction
│
├── 🟢 Text (13 blocks)
│   ├── text
│   ├── join
│   ├── length
│   ├── is empty
│   ├── compare texts
│   ├── trim
│   ├── upcase/downcase
│   ├── starts at
│   ├── contains
│   ├── split
│   ├── segment
│   ├── get substring
│   └── replace all
│
├── 🔴 Lists (23 blocks)
│   ├── create empty list
│   ├── make a list
│   ├── add items to list
│   ├── is in list?
│   ├── length of list
│   ├── is list empty?
│   ├── pick a random item
│   ├── index in list
│   ├── select list item
│   ├── replace list item
│   ├── remove list item
│   ├── append to list
│   ├── copy list
│   ├── is a list?
│   ├── reverse list
│   ├── list to csv row
│   ├── list from csv row
│   ├── list to csv table
│   ├── list from csv table
│   ├── lookup in pairs
│   ├── join items using separator
│   ├── sort list
│   └── repeat
│
├── 🟣 Colors (5 blocks)
│   ├── color picker
│   ├── random color
│   ├── make color (RGB)
│   ├── split color
│   └── blend colors
│
├── ─────────────────────
│
├── 🟡 Screen1 (Dynamic)
│   ├── when Screen1.Initialize
│   ├── when Screen1.BackPressed
│   └── when Screen1.ErrorOccurred
│
├── 🟡 Button1 (Dynamic)
│   ├── when Button1.Click
│   ├── when Button1.LongClick
│   ├── Button1.Text (getter)
│   ├── set Button1.Text to (setter)
│   ├── Button1.BackgroundColor (getter)
│   ├── set Button1.BackgroundColor to (setter)
│   └── ... (all properties)
│
├── 🟡 Label1 (Dynamic)
│   ├── when Label1.Click
│   ├── Label1.Text (getter)
│   ├── set Label1.Text to (setter)
│   └── ... (all properties)
│
└── 🟡 [Other Components] (Dynamic)
    └── ... (events, methods, properties)
```

## Example: Simple Button Click App

```
┌─────────────────────────────────────────────┐
│ when Button1.Click                          │
│   do                                        │
│   ┌─────────────────────────────────────┐  │
│   │ set Label1.Text                     │  │
│   │   to                                │  │
│   │   ┌──────────────────────────────┐  │  │
│   │   │ join                         │  │  │
│   │   │   ┌────────────────┐         │  │  │
│   │   │   │ "Hello, "      │         │  │  │
│   │   │   └────────────────┘         │  │  │
│   │   │   ┌────────────────┐         │  │  │
│   │   │   │ TextBox1.Text  │         │  │  │
│   │   │   └────────────────┘         │  │  │
│   │   └──────────────────────────────┘  │  │
│   └─────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

This creates an app where:
1. User types their name in TextBox1
2. User clicks Button1
3. Label1 displays "Hello, [name]"

## Example: Counter App

```
┌─────────────────────────────────────────────┐
│ when Screen1.Initialize                     │
│   do                                        │
│   ┌─────────────────────────────────────┐  │
│   │ initialize global counter           │  │
│   │   to                                │  │
│   │   ┌───┐                             │  │
│   │   │ 0 │                             │  │
│   │   └───┘                             │  │
│   └─────────────────────────────────────┘  │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ when Button1.Click                          │
│   do                                        │
│   ┌─────────────────────────────────────┐  │
│   │ set global counter                  │  │
│   │   to                                │  │
│   │   ┌──────────────────────────────┐  │  │
│   │   │ [get counter] + [1]          │  │  │
│   │   └──────────────────────────────┘  │  │
│   └─────────────────────────────────────┘  │
│   ┌─────────────────────────────────────┐  │
│   │ set Label1.Text                     │  │
│   │   to                                │  │
│   │   ┌──────────────────────────────┐  │  │
│   │   │ get global counter           │  │  │
│   │   └──────────────────────────────┘  │  │
│   └─────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

This creates a counter that:
1. Initializes counter to 0
2. Increments counter when button is clicked
3. Displays current count in label

## Block Connection Types

### Statement Blocks (No return value)
```
┌─────────────────────┐
│ set Label1.Text     │  ← Previous statement
│   to [  ]           │
└─────────────────────┘
         ↓
    Next statement
```

### Value Blocks (Return a value)
```
    ┌──────────────┐
    │ Button1.Text │  ← Can be plugged into inputs
    └──────────────┘
```

### Boolean Blocks (Return true/false)
```
    ┌──────┐
    │ true │  ← Can be plugged into boolean inputs
    └──────┘
```

### Event Blocks (Top-level only)
```
┌─────────────────────────────────┐
│ when Button1.Click              │  ← Cannot be nested
│   do                            │
│     [statements]                │
└─────────────────────────────────┘
```

## Drag and Drop Behavior

### From Flyout to Workspace
```
Flyout                    Workspace
┌──────────┐             ┌──────────────────┐
│ [Block]  │  ────────>  │                  │
│          │   Drag      │    [Block]       │
│          │             │                  │
└──────────┘             └──────────────────┘
```

### Within Workspace
```
Before                    After
┌──────────────────┐     ┌──────────────────┐
│  [Block A]       │     │                  │
│                  │     │  [Block A]       │
│  [Block B]       │     │  [Block B]       │
└──────────────────┘     └──────────────────┘
```

### Connecting Blocks
```
Before                    After
┌──────────────┐         ┌──────────────┐
│ set Label    │         │ set Label    │
│   to [    ]  │         │   to [text]  │
└──────────────┘         └──────────────┘
     ↑                        ↑
     │                        │
  [text]                   Connected!
```

### To Trashcan
```
Workspace                 Trashcan
┌──────────────────┐     ┌──────┐
│  [Block]         │     │ 🗑️   │
│                  │     │      │
│                  │  ─> │ 💥   │
└──────────────────┘     └──────┘
                         Deleted!
```

## Summary

✅ **66 Built-in Blocks** across 6 categories  
✅ **Dynamic Component Blocks** for all components  
✅ **MIT App Inventor Colors** exact match  
✅ **Full Drag-and-Drop** support  
✅ **360° Drag Angle** like MIT App Inventor  
✅ **Grid Snapping** for alignment  
✅ **Zoom Controls** (0.3x to 3x)  
✅ **Trashcan** for deleting blocks  

The block editor is now **fully functional** and provides the exact same experience as MIT App Inventor!
