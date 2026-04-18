# Stage Buttons Visual Guide 🎨

## Overview
Visual reference for the premium Add Sprite and Add Backdrop buttons in the Intermediate (Blocks) environment.

---

## 🎯 BUTTON PLACEMENT

### Stage Area Layout
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                                                         │
│                                                         │
│                  Stage Canvas                           │
│                  (480px × 360px)                        │
│                                                         │
│                                                         │
│                                                         │
│                                       ┌──────────────┐  │
│                                       │ +  Sprite    │  │ ← 16px from right
│                                       └──────────────┘  │
│                                       ┌──────────────┐  │
│                                       │ +  Backdrop  │  │ ← 16px from bottom
│                                       └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 BUTTON DESIGN

### Default State
```
┌──────────────────┐
│  +    Sprite     │  Background: rgba(255,255,255,0.95)
└──────────────────┘  Border: 1px solid #cbd5e1
                      Shadow: 0 4px 15px rgba(0,0,0,0.08)
                      Backdrop Blur: 10px
```

### Hover State
```
┌──────────────────┐
│  +    Sprite     │  Background: #fff (solid white)
└──────────────────┘  Transform: translateY(-1px) ↑
     ↑                Shadow: 0 6px 20px rgba(0,0,0,0.12)
  Elevated            Backdrop Blur: 10px
```

---

## 📐 DIMENSIONS

### Button Size
```
Width: Auto (content-based)
Height: Auto (content-based)
Padding: 10px 16px

┌─────────────────────┐
│ 10px                │
│ ┌─────────────────┐ │
│ │  +    Sprite    │ │ ← 16px padding horizontal
│ └─────────────────┘ │
│ 10px                │
└─────────────────────┘
```

### Icon + Text Layout
```
┌───┬─────────────┐
│ + │   Sprite    │
└───┴─────────────┘
  ↑       ↑
 18px    13px
 icon    text
  
Gap: 8px between icon and text
```

---

## 🎨 COLOR PALETTE

### Background Colors
```
Default:  rgba(255,255,255,0.95)  ← Semi-transparent white
Hover:    #fff                     ← Solid white

┌─────────────────┐
│ rgba(255,255,   │  95% opacity
│ 255,0.95)       │  Glassmorphic
└─────────────────┘

┌─────────────────┐
│ #fff            │  100% opacity
│                 │  Solid white
└─────────────────┘
```

### Border & Shadow
```
Border:  #cbd5e1  (light gray)
Shadow:  rgba(0,0,0,0.08)  (default)
         rgba(0,0,0,0.12)  (hover)
```

### Text & Icon
```
Text Color:  #334155  (dark gray)
Icon:        +  (plus sign)
Font Size:   13px (text), 18px (icon)
Font Weight: 600 (semibold)
```

---

## 🎬 ANIMATION SEQUENCE

### Hover Animation
```
Step 1: Default (0ms)
┌──────────────┐
│ +  Sprite    │  Y: 0, Shadow: 4px, BG: 95%
└──────────────┘

Step 2: Hover Start (0-200ms)
┌──────────────┐
│ +  Sprite    │  Y: -0.5px, Shadow: 5px, BG: 97.5%
└──────────────┘

Step 3: Hover Complete (200ms)
┌──────────────┐
│ +  Sprite    │  Y: -1px, Shadow: 6px, BG: 100%
└──────────────┘
     ↑
  Elevated
```

---

## 🔧 GLASSMORPHISM EFFECT

### Visual Breakdown
```
Layer 1: Backdrop (Stage content)
┌─────────────────────────────────┐
│  🤖  Robot sprite               │
│                                 │
│  🌳  Tree sprite                │
└─────────────────────────────────┘

Layer 2: Blur Effect (10px)
┌─────────────────────────────────┐
│  🤖  Robot sprite (blurred)     │
│                                 │
│  🌳  Tree sprite (blurred)      │
└─────────────────────────────────┘

Layer 3: Button (semi-transparent)
                    ┌──────────────┐
                    │ +  Sprite    │ ← 95% white
                    └──────────────┘
                         ↑
                    Content behind
                    is blurred
```

### CSS Implementation
```css
background: rgba(255,255,255,0.95);
backdropFilter: blur(10px);
border: 1px solid #cbd5e1;
boxShadow: 0 4px 15px rgba(0,0,0,0.08);
```

---

## 📱 RESPONSIVE BEHAVIOR

### Desktop (Default)
```
┌─────────────────────────────────┐
│                                 │
│  Stage (480px × 360px)          │
│                                 │
│                  ┌────────────┐ │
│                  │ + Sprite   │ │
│                  └────────────┘ │
│                  ┌────────────┐ │
│                  │ + Backdrop │ │
│                  └────────────┘ │
└─────────────────────────────────┘

Buttons: Visible ✅
Position: Bottom-right (16px)
```

### Upload Mode
```
┌─────────────────────────────────┐
│                                 │
│  Arduino Code Preview           │
│                                 │
│  (No Stage visible)             │
│                                 │
│                                 │
└─────────────────────────────────┘

Buttons: Hidden ❌
Reason: No Stage in Upload mode
```

### Fullscreen Mode
```
┌─────────────────────────────────┐
│                                 │
│  Stage (Fullscreen)             │
│                                 │
│                                 │
│                                 │
│                                 │
└─────────────────────────────────┘

Buttons: Hidden ❌
Reason: Cleaner fullscreen experience
```

---

## 🎯 INTERACTION STATES

### 1. Idle (Default)
```
┌──────────────┐
│ +  Sprite    │  Cursor: pointer
└──────────────┘  Opacity: 100%
                  Transform: none
```

### 2. Hover
```
┌──────────────┐
│ +  Sprite    │  Cursor: pointer
└──────────────┘  Opacity: 100%
     ↑            Transform: translateY(-1px)
  Elevated        Background: solid white
                  Shadow: elevated
```

### 3. Click
```
┌──────────────┐
│ +  Sprite    │  Opens Sprite Library modal
└──────────────┘  Modal appears over workspace
```

---

## 🔍 VISUAL COMPARISON

### Before (No Buttons)
```
┌─────────────────────────────────┐
│                                 │
│  Stage                          │
│                                 │
│                                 │
│                                 │
│  (No quick add buttons)         │
└─────────────────────────────────┘

❌ User must use SpritePanel below
❌ Less convenient
❌ Not Scratch-like
```

### After (With Premium Buttons)
```
┌─────────────────────────────────┐
│                                 │
│  Stage                          │
│                                 │
│                  ┌────────────┐ │
│                  │ + Sprite   │ │
│                  └────────────┘ │
│                  ┌────────────┐ │
│                  │ + Backdrop │ │
│                  └────────────┘ │
└─────────────────────────────────┘

✅ Quick access buttons
✅ Convenient positioning
✅ Scratch-inspired
✅ Premium glassmorphic design
```

---

## 🎨 DESIGN DETAILS

### Border Radius
```
12px rounded corners

┌─────────────────┐
│                 │  ← Smooth curves
│  +   Sprite     │
│                 │
└─────────────────┘
```

### Shadow Depth
```
Default: 0 4px 15px rgba(0,0,0,0.08)
         ↓
         4px offset
         15px blur
         8% opacity

Hover:   0 6px 20px rgba(0,0,0,0.12)
         ↓
         6px offset (more elevation)
         20px blur (softer)
         12% opacity (darker)
```

### Backdrop Blur
```
blur(10px)

Without Blur:
┌──────────────┐
│ +  Sprite    │  ← Sharp background
└──────────────┘

With Blur:
┌──────────────┐
│ +  Sprite    │  ← Blurred background
└──────────────┘     (glassmorphism)
```

---

## 📊 SPACING GUIDE

### Button Positioning
```
Stage Container (480px × 360px)
┌─────────────────────────────────┐
│                                 │
│                                 │
│                                 │
│                                 │
│                                 │
│                                 │
│                                 │
│                  ┌────────────┐ │
│                  │ + Sprite   │ │ ← 16px from right
│                  └────────────┘ │
│                  ↕ 10px gap     │
│                  ┌────────────┐ │
│                  │ + Backdrop │ │ ← 16px from bottom
│                  └────────────┘ │
└─────────────────────────────────┘
```

### Internal Spacing
```
Button Internal Layout:
┌─────────────────────────┐
│ 10px                    │ ← Top padding
│ ┌─────────────────────┐ │
│ │ 16px  +  Sprite  16px│ │ ← Horizontal padding
│ └─────────────────────┘ │
│ 10px                    │ ← Bottom padding
└─────────────────────────┘

Icon + Text:
┌───┬───┬─────────┐
│ + │ 8 │ Sprite  │
└───┴───┴─────────┘
  ↑   ↑      ↑
 18px gap   13px
 icon       text
```

---

## 🎉 SUMMARY

### Key Visual Features
- ✅ **Glassmorphic Design**: Semi-transparent white with backdrop blur
- ✅ **Smooth Elevation**: Buttons lift on hover
- ✅ **Premium Shadows**: Soft, subtle shadows
- ✅ **Perfect Positioning**: Bottom-right of Stage (16px)
- ✅ **Clear Icons**: + symbol (18px)
- ✅ **Readable Text**: 13px semibold
- ✅ **Smooth Animations**: 0.2s transitions

### Design Inspiration
- ✅ **Scratch**: Bottom-right positioning
- ✅ **Modern UI**: Glassmorphism and elevation
- ✅ **LeapLab**: Premium feel and polish

---

**Premium buttons that are both functional and beautiful!** 🎨✨🚀
