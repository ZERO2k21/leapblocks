# LeapLab Responsive Breakpoints Guide

## Visual Layout Reference

### 🖥️ Desktop (>1024px)
```
┌─────────────────────────────────────────────────────────────┐
│ MenuBar (Project Name, Board, Upload, etc.)                 │
├─────────────────────────────────────────────────────────────┤
│ Toolbar (Blocks/Python/Costumes/Sounds | Stage Controls)    │
├──────────────────────────────────────┬──────────────────────┤
│                                      │                      │
│                                      │   Stage (450px)      │
│   Blockly Workspace                  │   ┌──────────────┐   │
│   (Flexible width)                   │   │              │   │
│                                      │   │   480 x 360  │   │
│   [Blocks and Scripts]               │   │              │   │
│                                      │   └──────────────┘   │
│                                      │                      │
│   [Add Extension] (56px → 200px)     │   Sprite Panel       │
│                                      │   [Sprite List]      │
│                                      │                      │
├──────────────────────────────────────┴──────────────────────┤
│ Upload Mode: Code Preview + Log/Serial Monitor              │
└─────────────────────────────────────────────────────────────┘
```

### 📱 Tablet (768px - 1024px)
```
┌───────────────────────────────────────────────────┐
│ MenuBar                                           │
├───────────────────────────────────────────────────┤
│ Toolbar                                           │
├─────────────────────────────────┬─────────────────┤
│                                 │                 │
│   Blockly Workspace             │  Stage (360px)  │
│   (Flexible)                    │  ┌───────────┐  │
│                                 │  │           │  │
│   [Blocks]                      │  │ 360x270   │  │
│                                 │  │           │  │
│   [Add Extension] (12px margin) │  └───────────┘  │
│                                 │                 │
│                                 │  Sprite Panel   │
└─────────────────────────────────┴─────────────────┘
```

### 📱 Mobile Portrait (≤768px)
```
┌─────────────────────────────┐
│ MenuBar                     │
├─────────────────────────────┤
│ Toolbar (if stage mode)     │
├─────────────────────────────┤
│                             │
│   Blockly Workspace         │
│   (100% width)              │
│   (60vh height)             │
│                             │
│   [Blocks and Scripts]      │
│                             │
│   [Ext] (48px, no expand)   │
│                             │
├─────────────────────────────┤ ← Border Top
│                             │
│   Stage (100% width)        │
│   ┌───────────────────────┐ │
│   │                       │ │
│   │    Max 450px wide     │ │
│   │    Centered           │ │
│   │                       │ │
│   └───────────────────────┘ │
│                             │
│   Sprite Panel              │
│   [Sprite List]             │
│                             │
├─────────────────────────────┤
│ Upload: Code + Log (if any) │
└─────────────────────────────┘
```

### 📱 Mobile Landscape (≤768px + landscape)
```
┌────────────────────────────────────────────────────────┐
│ MenuBar                                                │
├────────────────────────────────────────────────────────┤
│ Toolbar                                                │
├─────────────────────────────────┬──────────────────────┤
│                                 │                      │
│   Blockly Workspace             │   Stage (40% width)  │
│   (60% width)                   │   ┌──────────────┐   │
│                                 │   │              │   │
│   [Blocks]                      │   │   Centered   │   │
│                                 │   │              │   │
│   [Ext] (8px margin)            │   └──────────────┘   │
│                                 │                      │
│                                 │   Sprite Panel       │
└─────────────────────────────────┴──────────────────────┘
```

### 📱 Extra Small Mobile (≤480px)
```
┌───────────────────────┐
│ MenuBar (compact)     │
├───────────────────────┤
│ Toolbar (if stage)    │
├───────────────────────┤
│                       │
│  Blockly Workspace    │
│  (100% width)         │
│  (50vh height)        │
│                       │
│  [Blocks]             │
│                       │
│  [Ext] (4px margin)   │
│                       │
├───────────────────────┤
│                       │
│  Stage (100% width)   │
│  ┌─────────────────┐  │
│  │                 │  │
│  │   Full width    │  │
│  │                 │  │
│  └─────────────────┘  │
│                       │
│  Sprite Panel         │
│  (Compact)            │
│                       │
└───────────────────────┘
```

## Responsive Features by Breakpoint

### Desktop (>1024px)
- ✅ Full workspace + 450px right panel
- ✅ Extension button expands on hover (56px → 200px)
- ✅ Code preview: `calc(50vh - 100px)` max height
- ✅ Log area: 250px height
- ✅ All features fully visible

### Tablet (768px - 1024px)
- ✅ Workspace + 380px right panel
- ✅ Stage: 360px width
- ✅ Extension button: 12px margins
- ✅ Code preview: `calc(35vh - 80px)` max height
- ✅ Slightly reduced but fully functional

### Mobile Portrait (≤768px)
- ✅ Vertical stack layout
- ✅ Workspace: 100% width, 60vh height (min 400px)
- ✅ Stage: 100% width, max 450px, centered
- ✅ Extension button: 48px fixed (no hover expansion)
- ✅ Border-top separator instead of border-left
- ✅ Code preview: 200px max height
- ✅ Log area: 150px height

### Mobile Landscape (≤768px + landscape)
- ✅ Side-by-side layout (60/40 split)
- ✅ Workspace: 60% width
- ✅ Stage: 40% width
- ✅ Better use of horizontal space
- ✅ Border-left separator

### Extra Small (≤480px)
- ✅ Workspace: 50vh height (min 350px)
- ✅ Stage: 100% width
- ✅ Extension button: 4px margins
- ✅ Code preview: 150px max height
- ✅ Minimal spacing for maximum content

## Height-Based Responsive Features

### Code Preview Area (Upload Mode)
- **Height >900px**: `calc(35vh - 80px)` max, 150px min
- **Height ≤900px**: `calc(35vh - 80px)` max, 150px min
- **Height ≤768px**: 200px max, 120px min
- **Height ≤600px**: 150px max, 100px min

### Log Area (Upload Mode)
- **Height >768px**: 250px
- **Height ≤768px**: 150px

## CSS Classes Reference

| Class Name | Applied To | Purpose |
|------------|-----------|---------|
| `.main-container-responsive` | Main container | Switches flex-direction on mobile |
| `.workspace-container-responsive` | Workspace area | Adjusts width/height per breakpoint |
| `.right-panel-responsive` | Right panel | Adjusts width, border, overflow |
| `.stage-container-responsive` | Stage container | Adjusts width, centering on mobile |
| `.code-preview-area` | Code preview | Height limits based on viewport |
| `.log-area-responsive` | Log area | Height adjustment on small screens |
| `.add-extension-btn-container` | Extension button | Margin and hover behavior per size |

## Testing Checklist

### Desktop Testing
- [ ] Workspace resizes smoothly
- [ ] Extension button expands on hover
- [ ] Stage renders at 450px width
- [ ] Code preview scrolls properly
- [ ] All panels visible simultaneously

### Tablet Testing
- [ ] Layout adjusts to 380px right panel
- [ ] Stage renders at 360px width
- [ ] Extension button has proper margins
- [ ] Touch interactions work smoothly

### Mobile Portrait Testing
- [ ] Layout stacks vertically
- [ ] Workspace takes 60vh (min 400px)
- [ ] Stage centers and limits to 450px
- [ ] Extension button stays 48px (no expansion)
- [ ] Border-top separator visible
- [ ] Scrolling works in all panels

### Mobile Landscape Testing
- [ ] Layout switches to 60/40 split
- [ ] Workspace takes 60% width
- [ ] Stage takes 40% width
- [ ] Border-left separator visible
- [ ] All controls accessible

### Extra Small Testing
- [ ] Workspace takes 50vh (min 350px)
- [ ] Stage scales to full width
- [ ] Extension button has 4px margins
- [ ] Content remains readable
- [ ] No horizontal overflow

## Browser Compatibility

✅ Chrome/Edge (Chromium): Full support
✅ Firefox: Full support
✅ Safari (iOS/macOS): Full support
✅ Samsung Internet: Full support
✅ Opera: Full support

## Performance Notes

- Transitions: 0.2-0.3s for smooth layout changes
- Lazy loading: Large components load on-demand
- Chunk splitting: Optimized bundle sizes
- Overflow: Proper scroll behavior prevents layout shift
- Z-index: Correct layering for modals and fullscreen
