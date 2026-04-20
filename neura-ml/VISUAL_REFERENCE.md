# NeuraML Visual Reference Guide

## Component Layout Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         NeuraML Header                               │
│  🧠 NeuraML by LeapLab                              [Help]           │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┬──────────────────┬──────────────────┐
│   Classes Panel  │  Training Panel  │  Testing Panel   │
│                  │                  │                  │
│  [+ Add Class]   │  ● Training      │  Testing         │
│                  │  🐍 [====] JS    │                  │
│  ┌────────────┐  │                  │  [Upload][Webcam]│
│  │ Class 1    │  │  Progress: 75%   │                  │
│  │ [Edit][×]  │  │  ▓▓▓▓▓▓▓▓░░░     │  📷 Video Feed   │
│  ├────────────┤  │                  │                  │
│  │ 📤 Upload  │  │  [Train Model]   │  Prediction:     │
│  │ 📹 Webcam  │  │                  │  Class 1         │
│  ├────────────┤  │  Advanced ▼      │                  │
│  │ 10 Samples │  │  Epochs: 50      │  Class 1: 85%    │
│  │ 🖼️🖼️🖼️🖼️   │  │  [====]          │  ▓▓▓▓▓▓▓▓░░      │
│  └────────────┘  │                  │  Class 2: 15%    │
│                  │                  │  ▓▓░░░░░░░░      │
│  ┌────────────┐  │                  │                  │
│  │ Class 2    │  │                  │                  │
│  └────────────┘  │                  │                  │
└──────────────────┴──────────────────┴──────────────────┘
```

---

## ClassCard Component

### Structure
```
┌─────────────────────────────────────────┐
│ ████████████████████████████████████    │ ← Colored Header (Red/Teal/Violet/etc)
│ █ Class Name          [✏️] [×]      █    │   - Class name (editable)
│ ████████████████████████████████████    │   - Edit button
│                                         │   - Delete button
├─────────────────────┬───────────────────┤
│ Add Image Samples   │ 10 Image Samples  │
│                     │                   │
│ ┌─────┐  ┌─────┐   │ 🖼️ 🖼️ 🖼️ 🖼️ 🖼️    │
│ │  📤 │  │ 📹  │   │ 🖼️ 🖼️ 🖼️ 🖼️ 🖼️    │
│ │Upload│  │Webcam│  │ [+5]              │
│ └─────┘  └─────┘   │                   │
└─────────────────────┴───────────────────┘
```

### Color Variations
```
Index 0: 🔴 Red     - bg-red-500    / bg-red-50    / border-red-200
Index 1: 🟢 Teal    - bg-teal-500   / bg-teal-50   / border-teal-200
Index 2: 🟣 Violet  - bg-violet-500 / bg-violet-50 / border-violet-200
Index 3: 🟠 Orange  - bg-orange-500 / bg-orange-50 / border-orange-200
Index 4: 🩷 Pink    - bg-pink-500   / bg-pink-50   / border-pink-200
Index 5: 🔵 Blue    - bg-blue-500   / bg-blue-50   / border-blue-200
```

### States

#### Empty State
```
┌─────────────────────────────────────────┐
│ ████████████████████████████████████    │
│ █ Class 1             [✏️] [×]      █    │
│ ████████████████████████████████████    │
├─────────────────────┬───────────────────┤
│ Add Image Samples   │ 0 Image Samples   │
│                     │                   │
│ ┌─────┐  ┌─────┐   │ No samples yet    │
│ │  📤 │  │ 📹  │   │                   │
│ │Upload│  │Webcam│  │                   │
│ └─────┘  └─────┘   │                   │
└─────────────────────┴───────────────────┘
```

#### Editing State
```
┌─────────────────────────────────────────┐
│ ████████████████████████████████████    │
│ █ [My Class Name_]    [✏️] [×]      █    │ ← Input field active
│ ████████████████████████████████████    │   Press Enter to save
│                                         │   Press Escape to cancel
```

#### Overflow State (>10 samples)
```
│ 25 Image Samples  │
│                   │
│ 🖼️ 🖼️ 🖼️ 🖼️ 🖼️    │ ← Shows last 10 samples
│ 🖼️ 🖼️ 🖼️ 🖼️ 🖼️    │
│ [+15]             │ ← Overflow indicator
```

---

## TrainingPanel Component

### Structure
```
┌──────────────────────────────────┐
│ ████████████████████████████████ │ ← Purple Header
│ █ ● Training    🐍 [====] JS  █  │   - Status dot (green when trained)
│ ████████████████████████████████ │   - Python/JS toggle
├──────────────────────────────────┤
│                                  │
│ Extracting features…        75%  │ ← Progress indicator
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░            │
│                                  │
│ ┌──────────────────────────────┐ │
│ │    [Train Model]             │ │ ← Train button
│ └──────────────────────────────┘ │
│                                  │
│ Advanced ▼                       │ ← Collapsible section
│                                  │
└──────────────────────────────────┘
```

### States

#### Idle State
```
┌──────────────────────────────────┐
│ ████████████████████████████████ │
│ █ ○ Training    🐍 [====] JS  █  │ ← Gray dot (not trained)
│ ████████████████████████████████ │
├──────────────────────────────────┤
│                                  │
│ Add samples to at least 2        │
│ classes to train.                │
│                                  │
│ ┌──────────────────────────────┐ │
│ │    [Train Model]             │ │ ← Disabled (gray)
│ └──────────────────────────────┘ │
│                                  │
│ Advanced ▼                       │
│                                  │
└──────────────────────────────────┘
```

#### Training State
```
┌──────────────────────────────────┐
│ ████████████████████████████████ │
│ █ ○ Training    🐍 [====] JS  █  │
│ ████████████████████████████████ │
├──────────────────────────────────┤
│                                  │
│ Extracting features…        45%  │
│ ▓▓▓▓▓▓▓▓▓░░░░░░░░░░░            │ ← Animated progress
│                                  │
│ ┌──────────────────────────────┐ │
│ │    [Training…]               │ │ ← Disabled during training
│ └──────────────────────────────┘ │
│                                  │
│ Advanced ▼                       │
│                                  │
└──────────────────────────────────┘
```

#### Trained State
```
┌──────────────────────────────────┐
│ ████████████████████████████████ │
│ █ ● Training    🐍 [====] JS  █  │ ← Green dot (trained)
│ ████████████████████████████████ │
├──────────────────────────────────┤
│                                  │
│ ┌──────────────────────────────┐ │
│ │ ✓ Model trained              │ │ ← Success banner
│ │ 95% accuracy · 50 samples    │ │
│ └──────────────────────────────┘ │
│                                  │
│ ┌──────────────────────────────┐ │
│ │    [Retrain Model]           │ │ ← Button text changes
│ └──────────────────────────────┘ │
│                                  │
│ Advanced ▼                       │
│                                  │
└──────────────────────────────────┘
```

#### Advanced Settings Expanded
```
│ Advanced ▲                       │ ← Arrow rotates
│                                  │
│ ┌──────────────────────────────┐ │
│ │ Epochs              50       │ │
│ │ [====●==============]        │ │ ← Slider (5-100)
│ │                              │ │
│ │ In-browser via TF.js ·       │ │
│ │ MobileNet transfer learning  │ │
│ │ · No data leaves your device.│ │
│ └──────────────────────────────┘ │
```

---

## TestingPanel Component

### Structure
```
┌──────────────────────────────────┐
│ ████████████████████████████████ │ ← Purple Header
│ █ Testing                     █  │
│ ████████████████████████████████ │
├──────────────────────────────────┤
│                                  │
│ ┌──────────┐  ┌──────────┐      │
│ │ 📤 Upload│  │ 📹 Webcam│      │ ← Mode buttons
│ └──────────┘  └──────────┘      │
│                                  │
│ ┌──────────────────────────────┐ │
│ │                              │ │
│ │      📷 Video Feed           │ │ ← Video/Image preview
│ │                              │ │
│ └──────────────────────────────┘ │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ Prediction      Class 1      │ │ ← Top prediction
│ └──────────────────────────────┘ │
│                                  │
│ Class 1                     85%  │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░            │ ← Confidence bars
│                                  │
│ Class 2                     15%  │
│ ▓▓▓░░░░░░░░░░░░░░░░░            │
│                                  │
└──────────────────────────────────┘
```

### States

#### Untrained State
```
┌──────────────────────────────────┐
│ ████████████████████████████████ │
│ █ Testing                     █  │
│ ████████████████████████████████ │
├──────────────────────────────────┤
│                                  │
│         🧠                       │
│                                  │
│ You must train a model on the    │
│ left before you can test it here.│
│                                  │
└──────────────────────────────────┘
```

#### Upload Mode (Active)
```
│ ┌──────────┐  ┌──────────┐      │
│ │ 📤 Upload│  │ 📹 Webcam│      │ ← Upload highlighted
│ └──────────┘  └──────────┘      │   (purple border/bg)
│                                  │
│ ┌──────────────────────────────┐ │
│ │                              │ │
│ │      🖼️ Uploaded Image       │ │ ← Shows uploaded image
│ │                              │ │
│ └──────────────────────────────┘ │
```

#### Webcam Mode (Active)
```
│ ┌──────────┐  ┌──────────┐      │
│ │ 📤 Upload│  │ 📹 Stop  │      │ ← Webcam highlighted
│ └──────────┘  └──────────┘      │   Button changes to "Stop"
│                                  │
│ ┌──────────────────────────────┐ │
│ │                              │ │
│ │   📹 Live Video (mirrored)   │ │ ← Live webcam feed
│ │                              │ │
│ └──────────────────────────────┘ │
```

#### Predictions Display
```
│ ┌──────────────────────────────┐ │
│ │ Prediction      Class 1      │ │ ← Purple highlight box
│ └──────────────────────────────┘ │
│                                  │
│ Class 1                     85%  │ ← Purple bar
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░            │
│                                  │
│ Class 2                     12%  │ ← Teal bar
│ ▓▓░░░░░░░░░░░░░░░░░░            │
│                                  │
│ Class 3                      3%  │ ← Orange bar
│ ░░░░░░░░░░░░░░░░░░░░            │
```

#### Error State
```
│ ┌──────────┐  ┌──────────┐      │
│ │ 📤 Upload│  │ 📹 Webcam│      │
│ └──────────┘  └──────────┘      │
│                                  │
│ ⚠️ Camera access denied.         │ ← Error message
│                                  │
```

---

## Color Reference

### Confidence Bar Colors (Cycle)
```
1. ▓▓▓▓▓ Purple  (#a855f7 - purple-500)
2. ▓▓▓▓▓ Teal    (#14b8a6 - teal-500)
3. ▓▓▓▓▓ Orange  (#fb923c - orange-400)
4. ▓▓▓▓▓ Pink    (#ec4899 - pink-500)
5. ▓▓▓▓▓ Blue    (#3b82f6 - blue-500)
6. ▓▓▓▓▓ Green   (#22c55e - green-500)
```

### Status Colors
```
● Green  - Model trained (#22c55e - green-400)
○ Gray   - Not trained   (#ffffff30 - white/30)
```

### Button States
```
Active:   border-purple-500 bg-purple-50 text-purple-700
Inactive: border-gray-200 text-gray-500
Hover:    border-purple-300
Disabled: bg-gray-100 text-gray-300
```

---

## Responsive Behavior

### Desktop (>1024px)
```
┌────────────────────────────────────────────────────────────┐
│                     Full 3-Panel Layout                     │
│  [Classes: 33%]  [Training: 33%]  [Testing: 33%]          │
└────────────────────────────────────────────────────────────┘
```

### Tablet (768px - 1024px)
```
┌──────────────────────────────────┐
│      Stacked 2-Column Layout      │
│  [Classes: 50%]  [Training: 50%] │
│  [Testing: 100%]                  │
└──────────────────────────────────┘
```

### Mobile (<768px)
```
┌──────────────────┐
│  Single Column   │
│  [Classes: 100%] │
│  [Training: 100%]│
│  [Testing: 100%] │
└──────────────────┘
```

---

## Interaction Patterns

### ClassCard Interactions
```
1. Click [✏️] → Enter edit mode
2. Type new name → Press Enter to save
3. Press Escape → Cancel edit
4. Click [×] → Delete class (with confirmation)
5. Click [Upload] → Open file picker
6. Click [Webcam] → Open webcam modal
7. Drag files → Auto-upload (if implemented)
```

### TrainingPanel Interactions
```
1. Click [Train Model] → Start training
2. Click [Advanced ▼] → Expand settings
3. Drag epochs slider → Update value
4. Click [Retrain Model] → Train again
5. Click 🐍/JS toggle → Switch export format (future)
```

### TestingPanel Interactions
```
1. Click [Upload] → Open file picker
2. Click [Webcam] → Start camera
3. Click [Stop] → Stop camera
4. Upload image → Show prediction
5. Webcam active → Continuous predictions (300ms)
```

---

## Animation Timings

```
Progress Bar:     300ms ease-in-out
Confidence Bars:  300ms ease-in-out
Button Hover:     150ms ease
Panel Toggle:     200ms ease
Status Dot:       200ms ease
Arrow Rotation:   200ms ease
```

---

## Accessibility Features

### Keyboard Navigation
```
Tab       → Navigate between interactive elements
Enter     → Activate buttons, save edits
Escape    → Cancel edits, close modals
Space     → Toggle checkboxes/switches
Arrow Keys→ Adjust sliders
```

### Screen Reader Labels
```
- "Edit class name"
- "Delete class"
- "Upload images"
- "Start webcam"
- "Train model button, disabled"
- "Prediction confidence: 85%"
```

### Visual Indicators
```
- Focus rings on interactive elements
- Disabled state clearly visible
- Error messages in red
- Success messages in green
- Loading states with animations
```

---

## Icon Reference

```
🧠 - Brain (NeuraML logo)
📤 - Upload
📹 - Webcam/Video
✏️ - Edit
× - Delete/Close
● - Status indicator (filled)
○ - Status indicator (empty)
▼ - Expand (down)
▲ - Collapse (up)
✓ - Success/Checkmark
⚠️ - Warning
🐍 - Python
🖼️ - Image thumbnail
```

---

**Last Updated**: 2026-04-18
**Purpose**: Quick visual reference for developers and designers
