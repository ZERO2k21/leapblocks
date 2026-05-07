# ML Environment Topbar - Visual Reference

## 🎨 New Topbar Design

### Layout Structure
```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  [🏠] │ [Logo] LEAPLAB    [📚 Tutorials]    [🧠 Project Name 💾]    [💬🏆⚙️❓] [👤 Sign In] [CREOLEAP]  │
│       │       NEURA ML                                                                │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Section Breakdown

#### Left Section (33% width)
```
┌──────────────────────────────────────────────┐
│ [Home]  │  [LeapLab Logo]  [Tutorials]      │
│  Icon   │   + Branding                       │
└──────────────────────────────────────────────┘
```

**Components:**
1. **Home Button** (40x40px)
   - Icon: Home (lucide-react)
   - Background: rgba(255, 255, 255, 0.1)
   - Border radius: 12px
   - Hover: rgba(255, 255, 255, 0.15)

2. **Vertical Divider** (1px x 32px)
   - Color: rgba(255, 255, 255, 0.1)

3. **LeapLab Logo** (52px height)
   - Image: leaplab_logo_transparent.png
   - Drop shadow effect

4. **Branding Text**
   - "LEAPLAB" (8px, yellow #FFD500, uppercase)
   - "NEURA ML" (16px, white, bold)

5. **Tutorials Button**
   - Icon: BookOpen (14px)
   - Text: "Tutorials" (13px)
   - Hover: rgba(255, 255, 255, 0.1) background

#### Middle Section (34% width)
```
┌──────────────────────────────────────────────┐
│     [🧠  My ML Project  💾]                  │
│      Emoji  Input  Save                      │
└──────────────────────────────────────────────┘
```

**Components:**
1. **Project Container** (height: 40px)
   - Background: rgba(0, 0, 0, 0.25)
   - Border: 1px solid rgba(255, 255, 255, 0.08)
   - Border radius: 20px
   - Padding: 18px left, 5px right

2. **Project Emoji** (14px)
   - Opacity: 0.45
   - Dynamic based on project type

3. **Project Name Input** (170px width)
   - Font: 14px, weight 700
   - Color: white
   - Text align: center
   - Background: transparent
   - No border

4. **Save Button** (42x42px circle)
   - Background: #22c55e (green)
   - Icon: Save (18px, lucide-react)
   - Hover: scale(1.08) + brightness(1.1)
   - Box shadow

#### Right Section (33% width)
```
┌──────────────────────────────────────────────┐
│  [Upload] │ [💬🏆⚙️❓] │ [👤 Sign In] [Logo] │
│  (optional)│  Utilities │                     │
└──────────────────────────────────────────────┘
```

**Components:**
1. **Upload Folder Button** (optional)
   - Background: rgba(255, 255, 255, 0.2)
   - Border: 1px solid rgba(255, 255, 255, 0.3)
   - Border radius: 8px
   - Icon: 📁 + "Upload Folder"

2. **Utility Icons** (20px each)
   - Feedback (MessageSquareWarning)
   - Achievements (Trophy)
   - Settings (Settings)
   - Help (HelpCircle)
   - Color: rgba(255, 255, 255, 0.55)
   - Hover: rgba(255, 255, 255, 0.9)
   - Separated by border-right

3. **Sign In Button** (height: 38px)
   - Background: rgba(255, 255, 255, 0.1)
   - Border radius: 20px
   - Avatar circle (28x28px)
     - Gradient: yellow to orange
     - "LB" initials
   - Text: "Sign In" (13px, bold)

4. **Creoleap Logo** (160px height)
   - Image: CREOLEAP LOGO LEAP INTO THE AI FUTURE
   - Drop shadow effect

## 🎨 Color Palette

### Background
```css
background: linear-gradient(135deg, #0a015a 0%, #080a25 100%);
```
- Start: Deep navy blue (#0a015a)
- End: Very dark blue (#080a25)
- Direction: 135deg (diagonal)

### Accent Colors
```css
/* Primary Purple */
--purple-700: #7c3aed;
--purple-800: #6d28d9;

/* Success Green */
--green-500: #22c55e;

/* Warning Yellow */
--yellow-500: #FFD500;

/* Text */
--white: #ffffff;
--white-55: rgba(255, 255, 255, 0.55);
--white-90: rgba(255, 255, 255, 0.9);
```

### Overlays & Borders
```css
/* Button Backgrounds */
--overlay-10: rgba(255, 255, 255, 0.1);
--overlay-15: rgba(255, 255, 255, 0.15);
--overlay-20: rgba(255, 255, 255, 0.2);
--overlay-25: rgba(0, 0, 0, 0.25);

/* Borders */
--border-light: rgba(255, 255, 255, 0.1);
--border-blue: rgba(100, 180, 255, 0.1);
```

### Shadows
```css
/* Main Shadow */
box-shadow: rgba(8, 10, 37, 0.45) 0px 4px 20px,
            rgba(255, 255, 255, 0.06) 0px -1px 0px inset;

/* Button Shadow */
box-shadow: rgba(0, 0, 0, 0.3) 0px 4px 6px -1px;

/* Logo Drop Shadow */
filter: drop-shadow(rgba(80, 200, 255, 0.3) 0px 0px 14px)
        drop-shadow(rgba(0, 0, 0, 0.3) 0px 2px 6px);
```

## 📐 Spacing & Sizing

### Header Dimensions
```css
height: 64px;
padding: 0px 18px;
z-index: 100;
```

### Button Sizes
```css
/* Home Button */
width: 40px;
height: 40px;
border-radius: 12px;

/* Save Button */
width: 42px;
height: 42px;
border-radius: 50%; /* Circle */

/* Sign In Button */
height: 38px;
border-radius: 20px;
padding: 0px 5px 0px 18px;
```

### Icon Sizes
```css
/* Home Icon */
size: 20px;
stroke-width: 2.2;

/* Utility Icons */
size: 20px;
stroke-width: 2.2;

/* Save Icon */
size: 18px;
stroke-width: 2.8;

/* Tutorials Icon */
size: 14px;
stroke-width: 2.2;
```

### Logo Sizes
```css
/* LeapLab Logo */
height: 52px;

/* Creoleap Logo */
height: 160px;
```

### Gaps & Spacing
```css
/* Main sections */
gap: 12px; /* Left section items */
gap: 16px; /* Middle section */
gap: 20px; /* Right section */

/* Utility icons */
gap: 14px;

/* Divider */
height: 32px;
width: 1px;
```

## 🎭 Interactive States

### Hover Effects

#### Buttons
```css
/* Default State */
background: rgba(255, 255, 255, 0.1);

/* Hover State */
background: rgba(255, 255, 255, 0.15);
transition: 0.2s;
```

#### Save Button
```css
/* Default */
transform: scale(1);
filter: none;

/* Hover */
transform: scale(1.08);
filter: brightness(1.1);
```

#### Utility Icons
```css
/* Default */
color: rgba(255, 255, 255, 0.55);

/* Hover */
color: rgba(255, 255, 255, 0.9);
```

### Focus States
```css
/* Input Focus */
outline: none;
/* No visible focus ring - relies on container */
```

## 📱 Responsive Behavior

### Flex Layout
```css
/* Left Section */
flex: 1 1 0%;
min-width: 0px;

/* Middle Section */
/* Fixed width based on content */

/* Right Section */
flex: 1 1 0%;
min-width: 0px;
```

### Shrink Priority
1. **Never Shrink:**
   - Home button (40px)
   - Save button (42px)
   - Logos (fixed heights)

2. **Can Shrink:**
   - Project name input (min-width: 100px)
   - Spacing between sections

3. **Hide on Small Screens:**
   - Upload folder button (optional)
   - Some utility icons (future enhancement)

## 🔤 Typography

### Font Stack
```css
font-family: "Segoe UI", Inter, sans-serif;
```

### Text Styles

#### Logo Text
```css
/* LEAPLAB */
font-size: 8px;
font-weight: 900;
text-transform: uppercase;
letter-spacing: 0.18em;
color: #FFD500;

/* NEURA ML */
font-size: 16px;
font-weight: 900;
letter-spacing: 0.08em;
color: #ffffff;
```

#### Buttons
```css
/* Tutorials, Upload */
font-size: 13px;
font-weight: 600;
letter-spacing: 0.02em;

/* Sign In */
font-size: 13px;
font-weight: 700;
```

#### Project Name
```css
font-size: 14px;
font-weight: 700;
letter-spacing: 0.01em;
text-align: center;
```

#### Avatar Initials
```css
font-size: 11px;
font-weight: 900;
color: #5A2D82; /* Purple */
```

## 🎯 Comparison with Other Environments

### Similarities (Ignite, Python, Embed)
✅ Same gradient background
✅ Same header height (64px)
✅ Same logo placement and sizing
✅ Same utility icons layout
✅ Same sign-in button design
✅ Same Creoleap logo on right

### Differences
- **Brand Name:** "NEURA ML" instead of "ELECTRA", "CODEX", etc.
- **Middle Section:** Project name input (ML-specific)
- **Optional Button:** Upload folder (ML-specific)
- **No File/Edit Menus:** Simplified for ML workflow

## 📸 Visual Examples

### Dashboard View
```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  [🏠] │ [Logo] LEAPLAB                                [💬🏆⚙️❓] [👤 Sign In] [CREOLEAP]  │
│       │       NEURA ML                                                                │
└─────────────────────────────────────────────────────────────────────────────────────┘
```
- No project input (dashboard doesn't have active project)
- No save button
- No upload button

### Classifier View
```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  [🏠] │ [Logo] LEAPLAB    [📚 Tutorials]    [🖼️ My Image Classifier 💾]    [💬🏆⚙️❓] [👤] [LOGO] │
│       │       NEURA ML                                                                │
└─────────────────────────────────────────────────────────────────────────────────────┘
```
- Project input visible with emoji
- Save button present
- Upload button may be present

### Sub-Header (Classifier Only)
```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  [🧠 My Project          ]  [Untrained]              [📤 Export] [⚙️ Settings]      │
│     Image Classifier                                                                 │
└─────────────────────────────────────────────────────────────────────────────────────┘
```
- Purple gradient background (#7c3aed to #6d28d9)
- Project info card on left
- Status badge
- Action buttons on right

## ✨ Animation & Transitions

### Timing
```css
transition: all 0.2s ease;
```

### Transform Animations
```css
/* Save Button Hover */
@keyframes save-hover {
  from { transform: scale(1); }
  to { transform: scale(1.08); }
}

/* Button Press */
@keyframes button-press {
  from { transform: scale(1); }
  to { transform: scale(0.95); }
}
```

### Color Transitions
```css
/* Icon Hover */
transition: color 0.2s ease;

/* Background Hover */
transition: background 0.2s ease;
```

---

**Reference Images:**
- See `src/modules/electra/components/Layout/IgniteTopbar.tsx` for Ignite implementation
- See `src/python/layout/TopBar.jsx` for Python implementation
- See `neura-ml/components/NeuraHeader.jsx` for ML implementation

**Last Updated:** 2026-04-18
