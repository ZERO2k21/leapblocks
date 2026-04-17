# Neura ML Studio - Visual Reference Guide

## 🎨 Complete Visual Breakdown

---

## 1️⃣ Dashboard View - "My Projects"

```
┌─────────────────────────────────────────────────────────────────┐
│  🧠 Neura ML Studio                              [← Back]        │ ← Purple header (#6b21a8)
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  My Projects                                  [+ New Project]    │ ← Header with button
│  Manage and train your machine learning models                   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                           │   │
│  │                        🧑‍💻                                │   │ ← Empty state
│  │                   📸  🎵  🤖  ✨                          │   │   (animated icons)
│  │                                                           │   │
│  │              No Projects Yet                              │   │
│  │   Start your AI journey by creating your first            │   │
│  │          machine learning project                         │   │
│  │                                                           │   │
│  │           [+ Create Your First Project]                   │   │
│  │                                                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

OR (with projects):

┌─────────────────────────────────────────────────────────────────┐
│  My Projects                                  [+ New Project]    │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ 📸       │  │ 🐱       │  │ 🤸       │  │ ✋       │       │
│  │ Cat vs   │  │ Object   │  │ Yoga     │  │ Sign     │       │
│  │ Dog      │  │ Detector │  │ Poses    │  │ Language │       │
│  │          │  │          │  │          │  │          │       │
│  │ Classes:2│  │ Classes:3│  │ Classes:5│  │ Classes:4│       │
│  │ ✓ Trained│  │          │  │ ✓ Trained│  │          │       │
│  │ 95%      │  │          │  │ 88%      │  │          │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

**Colors:**
- Header: Purple gradient (#6b21a8)
- Cards: White with shadow
- Icons: Colorful backgrounds
- Buttons: Purple (#6b21a8)

---

## 2️⃣ Create Project Modal - Project Type Selector

```
┌─────────────────────────────────────────────────────────────────┐
│  Create New Project                              [← Back]        │ ← Purple header
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │          │  │          │  │          │  │          │       │
│  │   📸     │  │   🐱     │  │   🤸     │  │   ✋     │       │ ← Row 1
│  │          │  │          │  │          │  │          │       │
│  │  Image   │  │  Object  │  │   Pose   │  │   Hand   │       │
│  │Classifier│  │Detection │  │Classifier│  │   Pose   │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│   Orange bg     Yellow bg     Blue bg       Pink bg            │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                     │
│  │          │  │          │  │          │                     │
│  │   🎵     │  │   🔢     │  │   📝     │                     │ ← Row 2
│  │          │  │          │  │          │                     │
│  │  Audio   │  │ Numbers  │  │   Text   │                     │
│  │Classifier│  │    CR    │  │Classifier│                     │
│  └──────────┘  └──────────┘  └──────────┘                     │
│   Green bg      Purple bg     Red bg                            │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Card Colors:**
- 📸 Image Classifier: `bg-orange-100`
- 🐱 Object Detection: `bg-yellow-100`
- 🤸 Pose Classifier: `bg-blue-100`
- ✋ Hand Pose: `bg-pink-100`
- 🎵 Audio: `bg-green-100`
- 🔢 Numbers: `bg-purple-100`
- 📝 Text: `bg-red-100`

**Interactions:**
- Hover: Card lifts up, shadow increases
- Click: Navigate to project type

---

## 3️⃣ Image Classifier - Full Screen Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [← Back]  📸 Image Classifier    [📁 Upload Folder] [💾 Save Project]      │ ← Purple header
├──────────────────────────────────────────────┬──────────────────────────────┤
│                                              │                              │
│  LEFT PANEL (2/3 width)                     │  RIGHT PANEL (1/3 width)     │
│                                              │                              │
│  ┌──────────────────────────────────────┐  │  ┌────────────────────────┐ │
│  │ 🔴 class1              (5 samples)   │  │  │  🎯 Training           │ │
│  │                                      │  │  │                        │ │
│  │  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐    │  │  │  Epochs: 50            │ │
│  │  │img│ │img│ │img│ │img│ │img│    │  │  │  ━━━━━━━━━━━━━━━━━━━  │ │
│  │  └───┘ └───┘ └───┘ └───┘ └───┘    │  │  │                        │ │
│  │                                      │  │  │  [Train Model]         │ │
│  │  [📷 Webcam]  [📁 Upload]           │  │  │                        │ │
│  └──────────────────────────────────────┘  │  │  ┌──────────────────┐ │ │
│                                              │  │  │ Model Accuracy   │ │ │
│  ┌──────────────────────────────────────┐  │  │  │      95%         │ │ │
│  │ 🟢 class2              (8 samples)   │  │  │  └──────────────────┘ │ │
│  │                                      │  │  │                        │ │
│  │  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐    │  │  │  💡 Tip: Add 20+      │ │
│  │  │img│ │img│ │img│ │img│ │img│    │  │  │     samples per class  │ │
│  │  └───┘ └───┘ └───┘ └───┘ └───┘    │  │  └────────────────────────┘ │
│  │  ┌───┐ ┌───┐ ┌───┐                │  │                              │
│  │  │img│ │img│ │img│                │  │  ┌────────────────────────┐ │
│  │  └───┘ └───┘ └───┘                │  │  │  🧪 Testing            │ │
│  │                                      │  │  │                        │ │
│  │  [📷 Webcam]  [📁 Upload]           │  │  │  ┌──────────────────┐ │ │
│  └──────────────────────────────────────┘  │  │  │                  │ │ │
│                                              │  │  │   📹 Webcam      │ │ │
│  ┌──────────────────────────────────────┐  │  │  │     Preview      │ │ │
│  │  + Add Class                         │  │  │  │                  │ │ │
│  └──────────────────────────────────────┘  │  │  └──────────────────┘ │ │
│                                              │  │                        │ │
│                                              │  │  [📷 Webcam] [📁 Upload]│ │
│                                              │  │                        │ │
│                                              │  │  ┌──────────────────┐ │ │
│                                              │  │  │ Prediction       │ │ │
│                                              │  │  │ class1           │ │ │
│                                              │  │  │ Confidence: 95%  │ │ │
│                                              │  │  │ ████████████░░░  │ │ │
│                                              │  │  └──────────────────┘ │ │
│                                              │  └────────────────────────┘ │
└──────────────────────────────────────────────┴──────────────────────────────┘
```

**Layout:**
- **Top Bar:** Purple (#6b21a8), fixed height
- **Left Panel:** 66.67% width, white cards, scrollable
- **Right Panel:** 33.33% width, white background, scrollable
- **Cards:** Rounded corners (1.5rem), shadow on hover

**Class Section:**
- Color indicator (red, emerald, blue, etc.)
- Editable class name
- Sample count
- Image grid (4 columns)
- Delete button (🗑️) on hover
- Webcam and Upload buttons

**Training Panel:**
- Epochs slider (10-200)
- Train button (purple)
- Loading state with spinner
- Accuracy display (green)
- Helpful tip

**Testing Panel:**
- Webcam preview (dark background)
- Test buttons (blue & emerald)
- Prediction result (purple)
- Confidence bar

---

## 4️⃣ Object Detection Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [← Back]  🐱 Object Detection    [📁 Upload Folder] [💾 Save Project]      │
├──────────────────────────────────────────────┬──────────────────────────────┤
│                                              │                              │
│  ┌──────────────────────────────────────┐  │  ┌────────────────────────┐ │
│  │  Objects to Detect                   │  │  │  🎯 Training           │ │
│  │                                      │  │  │                        │ │
│  │  🔵 Cat                         [🗑️] │  │  │  [Train Model]         │ │
│  │  🔵 Dog                         [🗑️] │  │  │                        │ │
│  │  🔵 Bird                        [🗑️] │  │  │  💡 Draw bounding      │ │
│  │                                      │  │  │     boxes around       │ │
│  │  [+ Add Object]                      │  │  │     objects            │ │
│  └──────────────────────────────────────┘  │  └────────────────────────┘ │
│                                              │                              │
│  ┌──────────────────────────────────────┐  │  ┌────────────────────────┐ │
│  │  Draw Bounding Boxes                 │  │  │  🧪 Testing            │ │
│  │                                      │  │  │                        │ │
│  │  ┌────────────────────────────────┐ │  │  │  [📹 Webcam Preview]   │ │
│  │  │                                │ │  │  │                        │ │
│  │  │     🖼️ Upload image            │  │  │  [📷 Webcam] [📁 Upload]│ │
│  │  │        to annotate             │ │  │  └────────────────────────┘ │
│  │  │                                │ │  │                              │
│  │  └────────────────────────────────┘ │  │                              │
│  └──────────────────────────────────────┘  │                              │
└──────────────────────────────────────────────┴──────────────────────────────┘
```

---

## 5️⃣ Coming Soon Screens (Placeholders)

```
┌─────────────────────────────────────────────────────────────────┐
│ [← Back]  🤸 Pose Classifier                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│                                                                   │
│                           🤸                                      │
│                                                                   │
│                    Pose Classifier                                │
│                                                                   │
│     Train AI to recognize different body poses and                │
│          movements using your webcam                              │
│                                                                   │
│                  ┌─────────────────────┐                         │
│                  │   🚧 Coming Soon    │                         │
│                  │                     │                         │
│                  │ This feature is     │                         │
│                  │ under development   │                         │
│                  └─────────────────────┘                         │
│                                                                   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Same layout for:**
- ✋ Hand Pose Classifier
- 🎵 Audio Classifier
- 🔢 Numbers CR
- 📝 Text Classifier

---

## 🎨 Color Palette Reference

### Primary Colors
```
Purple Primary:   #6b21a8  ████████
Purple Accent:    #a855f7  ████████
Purple Hover:     #7c3aed  ████████
Purple Light:     #f3e8ff  ████████
Purple Dark:      #581c87  ████████
```

### Project Type Colors
```
Orange (Image):   #fed7aa  ████████
Yellow (Object):  #fef3c7  ████████
Blue (Pose):      #dbeafe  ████████
Pink (Hand):      #fce7f3  ████████
Green (Audio):    #d1fae5  ████████
Purple (Numbers): #f3e8ff  ████████
Red (Text):       #fee2e2  ████████
```

### Status Colors
```
Success Green:    #10b981  ████████
Error Red:        #ef4444  ████████
Warning Yellow:   #f59e0b  ████████
Info Blue:        #3b82f6  ████████
```

---

## 📐 Spacing & Sizing

### Border Radius
- Small: `0.75rem` (12px)
- Medium: `1rem` (16px)
- Large: `1.5rem` (24px)
- XL: `2rem` (32px)

### Padding
- Tight: `p-3` (12px)
- Normal: `p-4` (16px)
- Comfortable: `p-6` (24px)
- Spacious: `p-8` (32px)

### Gaps
- Tight: `gap-2` (8px)
- Normal: `gap-3` (12px)
- Comfortable: `gap-4` (16px)
- Spacious: `gap-6` (24px)

---

## 🎭 Animations

### Bounce (Empty State Icons)
```css
animate-bounce
animation-delay: 0s, 0.2s, 0.4s, 0.6s
```

### Hover Effects
```css
hover:scale-105        /* Cards */
hover:-translate-y-1   /* Project type cards */
hover:shadow-2xl       /* Cards */
hover:bg-purple-100    /* Buttons */
```

### Transitions
```css
transition-all duration-300    /* Cards */
transition-colors duration-200 /* Buttons */
transition-transform          /* Hover effects */
```

---

## 📱 Responsive Breakpoints

```
Mobile Portrait:    < 640px   (sm)
Mobile Landscape:   640-768px (md)
Tablet:            768-1024px (lg)
Desktop:          1024-1280px (xl)
XL Desktop:         ≥ 1280px (2xl)
```

### Layout Changes
- **Mobile:** Single column, stacked panels
- **Tablet:** 2 columns for project cards
- **Desktop:** 3-4 columns, side-by-side panels
- **XL:** 4+ columns, maximum spacing

---

## ✨ Interactive States

### Buttons
```
Default:  bg-[#6b21a8] text-white
Hover:    bg-[#7c3aed]
Active:   scale-95
Disabled: bg-gray-300 text-gray-500 cursor-not-allowed
Loading:  spinner animation
```

### Cards
```
Default:  shadow-md
Hover:    shadow-2xl scale-105
Active:   border-purple-300
```

### Inputs
```
Default:  border-gray-300
Focus:    border-purple-600 ring-purple-300
Error:    border-red-500
```

---

This visual reference provides exact layouts, colors, and interactions for every screen in Neura ML Studio! 🎨
