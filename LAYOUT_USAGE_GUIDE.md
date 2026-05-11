# Layout Components - Complete Usage Guide
## MIT App Inventor Style - Multiple Components Support

## ✅ Current Implementation Status

**Good News:** Layout components already support adding **unlimited components**! 

The system works exactly like MIT App Inventor:
1. Select the layout container
2. Drag and drop components one by one
3. Each component gets added to the container
4. No limit on number of components

## 📖 Step-by-Step Guide

### Example 1: Adding Multiple Buttons to HorizontalArrangement

**Step 1: Add Layout Container**
```
1. Drag "HorizontalArrangement" from Palette
2. Drop it on the canvas
3. You see: [Empty container with dashed border]
```

**Step 2: Select the Container**
```
1. Click on "HorizontalArrangement1"
2. It gets selected (blue ring appears)
3. Properties panel shows "HorizontalArrangement Properties"
```

**Step 3: Add First Component**
```
1. Drag "Button" from Palette
2. Drop it onto HorizontalArrangement1
3. Blue highlight appears when hovering
4. Button1 appears inside the container
```

**Step 4: Add Second Component**
```
1. HorizontalArrangement1 is still selected
2. Drag another "Button" from Palette
3. Drop it onto HorizontalArrangement1
4. Button2 appears next to Button1
```

**Step 5: Add Third Component**
```
1. HorizontalArrangement1 is still selected
2. Drag "Label" from Palette
3. Drop it onto HorizontalArrangement1
4. Label1 appears next to Button2
```

**Result:**
```
┌─────────────────────────────────────────────────────┐
│  [Button1]  [Button2]  [Label1]                     │
└─────────────────────────────────────────────────────┘
```

### Example 2: Creating a Form with VerticalArrangement

**Step 1: Add Container**
```
Drag "VerticalArrangement" → Drop on canvas
```

**Step 2: Select Container**
```
Click on "VerticalArrangement1"
```

**Step 3: Add Components One by One**
```
1. Drag "Label" → Drop → "Name:" appears
2. Drag "TextBox" → Drop → TextBox1 appears below
3. Drag "Label" → Drop → "Email:" appears below
4. Drag "TextBox" → Drop → TextBox2 appears below
5. Drag "Label" → Drop → "Phone:" appears below
6. Drag "TextBox" → Drop → TextBox3 appears below
7. Drag "Button" → Drop → "Submit" appears at bottom
```

**Result:**
```
┌─────────────────────────────────────────────────────┐
│  Name:                                              │
│  [_____________________________________________]    │
│  Email:                                             │
│  [_____________________________________________]    │
│  Phone:                                             │
│  [_____________________________________________]    │
│  [Submit]                                           │
└─────────────────────────────────────────────────────┘
```

### Example 3: Button Row with 5 Buttons

**Steps:**
```
1. Add HorizontalArrangement
2. Select it
3. Add Button → "1"
4. Add Button → "2"
5. Add Button → "3"
6. Add Button → "4"
7. Add Button → "5"
```

**Result:**
```
┌─────────────────────────────────────────────────────┐
│  [1]  [2]  [3]  [4]  [5]                            │
└─────────────────────────────────────────────────────┘
```

### Example 4: Complex Nested Layout

**Steps:**
```
1. Add VerticalArrangement (main container)
2. Select VerticalArrangement1
3. Add Label → "Settings"
4. Add HorizontalArrangement (for buttons)
5. Select HorizontalArrangement1
6. Add Button → "Save"
7. Add Button → "Cancel"
8. Add Button → "Reset"
9. Select VerticalArrangement1 again
10. Add Label → "Status: Ready"
```

**Result:**
```
┌─────────────────────────────────────────────────────┐
│  Settings                                           │
│  ┌───────────────────────────────────────────────┐  │
│  │  [Save]  [Cancel]  [Reset]                    │  │
│  └───────────────────────────────────────────────┘  │
│  Status: Ready                                      │
└─────────────────────────────────────────────────────┘
```

## 🎯 Key Points

### ✅ What Works (Already Implemented)

1. **Unlimited Components**
   - Add as many components as you want
   - No limit on number of children
   - Works for all layout types

2. **Keep Container Selected**
   - Container stays selected after adding component
   - Easy to add multiple components quickly
   - Just keep dragging and dropping

3. **Visual Feedback**
   - Blue highlight when dragging over container
   - Dashed border shows it's a container
   - Components appear immediately

4. **Nested Layouts**
   - Add layouts inside layouts
   - Unlimited nesting depth
   - Switch between containers by clicking

### 🔄 Workflow Tips

**Tip 1: Keep Container Selected**
```
After adding first component, container stays selected.
Just keep dragging components - no need to re-select!
```

**Tip 2: Switch Containers**
```
To add to different container:
1. Click on the other container
2. Start dragging components to it
```

**Tip 3: Add to Root**
```
To add components outside containers:
1. Click on empty canvas area (deselect container)
2. Drag component to canvas
3. It adds to root level
```

**Tip 4: Nested Layouts**
```
To add layout inside layout:
1. Select parent layout
2. Drag child layout
3. Drop on parent
4. Select child layout
5. Add components to child
```

## 📊 Component Hierarchy Example

### Visual Structure
```
Screen1
├── VerticalArrangement1
│   ├── Label1 (Title)
│   ├── HorizontalArrangement1
│   │   ├── Button1 (Yes)
│   │   ├── Button2 (No)
│   │   └── Button3 (Cancel)
│   ├── Label2 (Description)
│   └── TextBox1
├── HorizontalArrangement2
│   ├── Button4 (Save)
│   └── Button5 (Load)
└── Label3 (Footer)
```

### How to Build This

**Step 1: Main Container**
```
1. Add VerticalArrangement → VerticalArrangement1
2. Select VerticalArrangement1
```

**Step 2: Add Top Components**
```
3. Add Label → Label1 (change text to "Title")
```

**Step 3: Add Nested Container**
```
4. Add HorizontalArrangement → HorizontalArrangement1
5. Select HorizontalArrangement1
```

**Step 4: Add Buttons to Nested Container**
```
6. Add Button → Button1 (change text to "Yes")
7. Add Button → Button2 (change text to "No")
8. Add Button → Button3 (change text to "Cancel")
```

**Step 5: Back to Main Container**
```
9. Click on VerticalArrangement1 to select it
10. Add Label → Label2 (change text to "Description")
11. Add TextBox → TextBox1
```

**Step 6: Add Root Level Components**
```
12. Click on empty canvas (deselect)
13. Add HorizontalArrangement → HorizontalArrangement2
14. Select HorizontalArrangement2
15. Add Button → Button4 (change text to "Save")
16. Add Button → Button5 (change text to "Load")
```

**Step 7: Add Footer**
```
17. Click on empty canvas (deselect)
18. Add Label → Label3 (change text to "Footer")
```

## 🎨 Visual Examples

### Example 1: Calculator Layout
```
┌─────────────────────────────────────────────────────┐
│  [Display: 0                                    ]   │
│  ┌───────────────────────────────────────────────┐  │
│  │  [7]  [8]  [9]  [÷]                           │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │  [4]  [5]  [6]  [×]                           │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │  [1]  [2]  [3]  [-]                           │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │  [0]  [.]  [=]  [+]                           │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘

Structure:
- VerticalArrangement (main)
  - TextBox (display)
  - HorizontalArrangement (row 1)
    - Button (7), Button (8), Button (9), Button (÷)
  - HorizontalArrangement (row 2)
    - Button (4), Button (5), Button (6), Button (×)
  - HorizontalArrangement (row 3)
    - Button (1), Button (2), Button (3), Button (-)
  - HorizontalArrangement (row 4)
    - Button (0), Button (.), Button (=), Button (+)
```

### Example 2: Login Form
```
┌─────────────────────────────────────────────────────┐
│  Login                                              │
│  ┌───────────────────────────────────────────────┐  │
│  │  Username:                                    │  │
│  │  [_____________________________________]      │  │
│  │  Password:                                    │  │
│  │  [_____________________________________]      │  │
│  │  ┌─────────────────────────────────────────┐ │  │
│  │  │  [Login]  [Cancel]                      │ │  │
│  │  └─────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘

Structure:
- Label (Login)
- VerticalArrangement (form)
  - Label (Username:)
  - TextBox
  - Label (Password:)
  - PasswordTextBox
  - HorizontalArrangement (buttons)
    - Button (Login)
    - Button (Cancel)
```

### Example 3: Settings Screen
```
┌─────────────────────────────────────────────────────┐
│  Settings                                           │
│  ┌───────────────────────────────────────────────┐  │
│  │  Notifications                                │  │
│  │  [Enable notifications          ] [Toggle]   │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │  Sound                                        │  │
│  │  [Enable sound                  ] [Toggle]   │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │  Theme                                        │  │
│  │  [Light] [Dark] [Auto]                        │  │
│  └───────────────────────────────────────────────┘  │
│  [Save Settings]                                    │
└─────────────────────────────────────────────────────┘

Structure:
- Label (Settings)
- HorizontalArrangement (notifications)
  - Label (Notifications)
  - Label (Enable notifications)
  - Switch
- HorizontalArrangement (sound)
  - Label (Sound)
  - Label (Enable sound)
  - Switch
- VerticalArrangement (theme)
  - Label (Theme)
  - HorizontalArrangement (theme buttons)
    - Button (Light)
    - Button (Dark)
    - Button (Auto)
- Button (Save Settings)
```

## 🔧 Technical Details

### How Multiple Components Work

**State Structure:**
```javascript
{
  id: 'HorizontalArrangement1',
  type: 'HorizontalArrangement',
  children: [
    { id: 'Button1', type: 'Button', props: {...} },
    { id: 'Button2', type: 'Button', props: {...} },
    { id: 'Button3', type: 'Button', props: {...} },
    { id: 'Label1', type: 'Label', props: {...} },
    { id: 'TextBox1', type: 'TextBox', props: {...} }
    // ... unlimited components
  ]
}
```

**Add Component Logic:**
```javascript
// When container is selected
if (selectedParent && ARRANGEMENT_TYPES.has(selectedParent.type)) {
  // Add to container's children array
  container.children.push(newComponent);
}
```

**Rendering Logic:**
```javascript
// Render all children
{comp.children && comp.children.length > 0 ? (
  comp.children.map(child => renderComponentPreview(child))
) : (
  <div>Drop components here</div>
)}
```

## ✨ Summary

### What You Can Do Now:

1. ✅ **Add Unlimited Components** to any layout
2. ✅ **Keep Adding** without re-selecting container
3. ✅ **Nest Layouts** inside layouts
4. ✅ **Mix Component Types** (buttons, labels, textboxes, etc.)
5. ✅ **Visual Feedback** (blue highlight on drag over)
6. ✅ **Component Tree** shows all nested components
7. ✅ **Delete Any Component** from properties panel or component list

### MIT App Inventor Parity:

| Feature | MIT App Inventor | LeapBlocks | Status |
|---------|------------------|------------|--------|
| Add multiple components | ✅ | ✅ | ✅ Complete |
| Unlimited components | ✅ | ✅ | ✅ Complete |
| Keep container selected | ✅ | ✅ | ✅ Complete |
| Nested layouts | ✅ | ✅ | ✅ Complete |
| Visual feedback | ✅ | ✅ | ✅ Complete |
| Component tree | ✅ | ✅ | ✅ Complete |

---

**Status:** ✅ Fully Working
**Date:** May 11, 2026
**Note:** System already supports adding unlimited components to layouts, exactly like MIT App Inventor!
