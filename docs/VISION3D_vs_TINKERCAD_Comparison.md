# Vision3D vs TinkerCAD: Exhaustive Feature-by-Feature Comparison

**Document Version:** 1.0
**Date:** July 2026
**Purpose:** Complete gap analysis of LeapLab Vision3D module against TinkerCAD full feature set

---

## Legend

| Symbol | Meaning |
|--------|---------|
| YES | Feature fully implemented in Vision3D |
| PARTIAL | Feature partially implemented |
| MISSING | Feature not implemented |
| N/A | Not applicable to Vision3D scope |

---

## 1. WORKSPACE AND UI LAYOUT

| # | Feature | TinkerCAD | Vision3D | Gap |
|---|---------|-----------|----------|-----|
| 1.1 | Central workplane grid | Blue grid default 200x200mm | YES gridHelper size 20 | Fixed size not configurable per-printer |
| 1.2 | Shape Panel categories | 13 categories including Basic Creatures Vehicles | PARTIAL Basic 15 Extended 5 Text 1 | Missing 10 categories |
| 1.3 | Top toolbar left | Copy Paste Duplicate Delete Undo Redo | YES File Edit View menus | Implemented via dropdown menus |
| 1.4 | Top toolbar right | Group Ungroup Align Mirror | YES Toolbar buttons | Align limited to center-only per axis |
| 1.5 | Properties Inspector | Solid/Hole Color Multicolor shape params Transparency | YES Position Rotation Scale Color Material Hole Visibility Lock | Missing Multicolor Transparency shortcut T font selection |
| 1.6 | Scene Outliner | Not primary in TinkerCAD | YES SceneList component | Vision3D extra feature |
| 1.7 | Status bar | Grid snap and units shown | YES Object count selection grid snap | Good coverage |
| 1.8 | Mobile responsive | Web app works on tablets | YES Mobile menu drawer | Good coverage |

---

## 2. CAMERA AND NAVIGATION

| # | Feature | TinkerCAD | Vision3D | Gap |
|---|---------|-----------|----------|-----|
| 2.1 | ViewCube | Interactive cube with 6 clickable faces | YES ViewCube component | Positioned bottom-right via GizmoHelper |
| 2.2 | Home button | Reset to default isometric view | PARTIAL No dedicated Home button | Need Home/reset view button |
| 2.3 | Perspective/Orthographic toggle | Toggle between views | MISSING Perspective only | Need orthographic camera mode |
| 2.4 | Right-click orbit | Right-click drag to orbit | YES OrbitControls | Implemented |
| 2.5 | Middle-click pan | Middle mouse pans | YES OrbitControls | Implemented |
| 2.6 | Scroll zoom | Mouse wheel zooms | YES OrbitControls | With min/max distance |
| 2.7 | Plus/Minus key zoom | Keyboard zoom | MISSING | Add +/- key zoom |
| 2.8 | F key fit selection | Center camera on selected | MISSING | Add F key handler |
| 2.9 | Ctrl+Left orbit | Single-button mouse orbit | MISSING | Low priority |
| 2.10 | Shift+Right pan | Single-button mouse pan | MISSING | Low priority |
| 2.11 | Camera damping | Smooth momentum | YES enableDamping | Implemented |
| 2.12 | Max polar angle | Camera stays above workplane | YES maxPolarAngle PI/2 | Implemented |

---

## 3. TRANSFORM SYSTEM - MOVEMENT

| # | Feature | TinkerCAD | Vision3D | Gap |
|---|---------|-----------|----------|-----|
| 3.1 | Arrow keys X/Y | Move 1 grid unit | MISSING | Add arrow key nudge |
| 3.2 | Ctrl+Arrow Z | Move vertically | MISSING | Add Ctrl+Arrow vertical |
| 3.3 | Shift+Arrow 10x | Fast nudge | MISSING | Add 10x nudge |
| 3.4 | Shift+Drag constrain | Axis-constrained drag | MISSING | Add axis constraint |
| 3.5 | Click+Drag move | Reposition on workplane | YES TransformControls translate | Implemented |
| 3.6 | Cone handle lift | Black cone for Z-lift | PARTIAL Y handle exists | No dedicated cone visual |
| 3.7 | D key drop | Drop to workplane | YES D key mapped | Implemented |
| 3.8 | Cruise Tool C | Precise placement mode | MISSING | Add cruise tool |
| 3.9 | Alt+Drag copy | Duplicate while dragging | MISSING | Add alt-drag clone |
| 3.10 | Dimension input | Click handle type value | YES Properties panel inputs | Implemented |
| 3.11 | On-handle labels | Hover shows dimensions | MISSING | Add floating labels |

---

## 4. TRANSFORM SYSTEM - ROTATION

| # | Feature | TinkerCAD | Vision3D | Gap |
|---|---------|-----------|----------|-----|
| 4.1 | Curved handles | Three rotation rings | YES TransformControls rotate | Implemented |
| 4.2 | Inner ring 22.5 snap | Snap to 22.5 increments | MISSING | Add angle snapping |
| 4.3 | Outer ring free | Free rotation | PARTIAL Free but no snap zones | Need dual-zone rotation |
| 4.4 | Shift 45 snap | Shift for 45 degree snap | MISSING | Add shift-snap |
| 4.5 | Angle display | Shows angle during rotation | PARTIAL Only in properties panel | Show during interactive rotation |

---

## 5. TRANSFORM SYSTEM - SCALING

| # | Feature | TinkerCAD | Vision3D | Gap |
|---|---------|-----------|----------|-----|
| 5.1 | Corner handles 2D | Scale width+depth | PARTIAL TransformControls | No handle distinction |
| 5.2 | Edge handles 1D | Scale single axis | PARTIAL Individual axes possible | No visual edge handles |
| 5.3 | Top handle height | Height only | PARTIAL Y handle exists | No dedicated top visual |
| 5.4 | Shift uniform | Proportional scale | MISSING | Add shift+scale |
| 5.5 | Alt center | Scale from center | MISSING | Add alt+scale |
| 5.6 | Shift+Alt combined | Center+uniform | MISSING | Add combined modifier |
| 5.7 | Direct dimension | Type exact size | YES Panel numeric inputs | Implemented |

---

## 6. SELECTION SYSTEM

| # | Feature | TinkerCAD | Vision3D | Gap |
|---|---------|-----------|----------|-----|
| 6.1 | Single click | Click to select | YES selectShape | Implemented |
| 6.2 | Shift+click multi | Add to selection | YES shift key handled | Implemented |
| 6.3 | Marquee rectangle | Drag-select box | MISSING | Add rubber-band selection |
| 6.4 | Ctrl+A select all | Select all objects | YES Mapped | Implemented |
| 6.5 | Click empty deselect | Click empty to deselect | YES Escape works | Need click-on-empty too |
| 6.6 | Selection highlight | Visual feedback | YES Blue wireframe overlay | Implemented |
| 6.7 | Multi-select props | Common properties panel | PARTIAL Shows first only | Need multi-select editing |

---

## 7. WORKPLANE SYSTEM

| # | Feature | TinkerCAD | Vision3D | Gap |
|---|---------|-----------|----------|-----|
| 7.1 | Default blue grid | Blue workplane at Y=0 | YES | Implemented |
| 7.2 | W key workplane | Press W click face for temp workplane | MISSING | Add workplane tool |
| 7.3 | Orange temp workplane | Temporary orange plane | MISSING | Add temp workplane |
| 7.4 | Snap to workplane | Shapes orient to temp plane | MISSING | Dependent on 7.2 |
| 7.5 | E key shape workplane | Show shape workplane | MISSING | Add E key handler |
| 7.6 | Shift+W flip | Flip workplane direction | MISSING | Add Shift+W |
| 7.7 | Reset workplane | Click tool then empty space | MISSING | Add reset |
| 7.8 | Size presets | Printer bed presets | PARTIAL Fixed 20 units | Add presets |
| 7.9 | Units mm/inches/bricks | Unit system | MISSING | Add unit toggle |

---

## 8. GRID SYSTEM

| # | Feature | TinkerCAD | Vision3D | Gap |
|---|---------|-----------|----------|-----|
| 8.1 | Snap dropdown | Off/0.1/0.25/0.5/1.0/2.0/5.0/Brick | PARTIAL 0.1/0.25/0.5/1.0/2.5/5.0 | Missing Off 2.0 Brick |
| 8.2 | Snap OFF | Free movement | MISSING | Add snap-off |
| 8.3 | Edit Grid panel | Configure units and size | MISSING | Add grid settings dialog |
| 8.4 | Grid size config | Custom workplane dimensions | MISSING Fixed at 20 | Make configurable |
| 8.5 | Unit system | mm/inches toggle | MISSING | Add units |
| 8.6 | Grid visibility | Show/hide grid | YES | Implemented |
| 8.7 | Axes visibility | Show/hide axes | YES | Implemented |

---

## 9. SHAPE LIBRARY

| # | Feature | TinkerCAD | Vision3D | Gap |
|---|---------|-----------|----------|-----|
| 9.1 | Box | With radius and steps | YES W/H/D only | Missing edge roundness |
| 9.2 | Cylinder | With sides | YES Full params | Implemented |
| 9.3 | Sphere | With sides | YES Full params | Implemented |
| 9.4 | Half Sphere | Dome shape | YES | Implemented |
| 9.5 | Cone | With sides | YES | Implemented |
| 9.6 | Torus | Tube and sides | YES | Implemented |
| 9.7 | Pyramid | Adjustable sides | YES | Implemented |
| 9.8 | Wedge | Triangular wedge | YES | Implemented |
| 9.9 | Roof | House roof | YES | Implemented |
| 9.10 | Round Roof | Half-cylinder | YES | Implemented |
| 9.11 | Tube | Hollow cylinder | YES | Implemented |
| 9.12 | Star | With points | YES | Implemented |
| 9.13 | Heart | Heart shape | YES | Implemented |
| 9.14 | Polygon | Adjustable sides | YES | Implemented |
| 9.15 | Text | 3D extruded text | PARTIAL No font selection | Add font dropdown |
| 9.16 | Scribble | Freehand to 3D | MISSING | Add scribble tool |
| 9.17 | Ring | Flat ring | YES | Implemented |
| 9.18 | Box Hole pre-made | Pre-made hole shape | PARTIAL Toggle exists | No dedicated hole shapes |
| 9.19 | Cylinder Hole pre-made | Pre-made hole shape | PARTIAL Toggle exists | Same |
| 9.20 | Shape Generators | Community parametric shapes | MISSING | Add generators |
| 9.21 | Design Starters | Templates | MISSING | Add templates |
| 9.22 | Creatures | Creature parts | MISSING | Add creature shapes |
| 9.23 | Vehicles | Vehicle parts | MISSING | Add vehicle shapes |
| 9.24 | Structures | Building parts | MISSING | Add structure shapes |
| 9.25 | Hardware | Hardware shapes | MISSING | Add hardware |
| 9.26 | Electronics | Electronic parts | MISSING | Add electronics |
| 9.27 | Fun and Games | Game shapes | MISSING | Add game shapes |
| 9.28 | Everyday Objects | Common objects | MISSING | Add everyday shapes |
| 9.29 | Favorites | Bookmarked shapes | MISSING | Add favorites |
| 9.30 | Your Creations | User custom shapes | MISSING | Add user library |

---

## 10. SHAPE PARAMETERS

| # | Feature | TinkerCAD | Vision3D | Gap |
|---|---------|-----------|----------|-----|
| 10.1 | Box radius | Edge roundness | MISSING | Add radius slider |
| 10.2 | Box steps | Smoothness for roundness | MISSING | Add steps |
| 10.3 | Cylinder sides | Facet count | YES radialSegments | Implemented |
| 10.4 | Sphere sides | Smoothness | YES segments | Implemented |
| 10.5 | Cone sides | Facet count | YES | Implemented |
| 10.6 | Torus sides | Smoothness | YES | Implemented |
| 10.7 | Text font | Font selection | MISSING | Add font dropdown |
| 10.8 | Text alignment | Left/Center/Right | MISSING | Add alignment |
| 10.9 | Polygon sides | Number of sides | YES | Implemented |
| 10.10 | Star points | Number of points | YES | Implemented |

---

## 11. PROPERTIES INSPECTOR

| # | Feature | TinkerCAD | Vision3D | Gap |
|---|---------|-----------|----------|-----|
| 11.1 | Solid/Hole toggle | Switch shape mode | YES | Implemented |
| 11.2 | Color picker | Choose any color | YES Input plus 16 presets | Implemented |
| 11.3 | Multicolor grouping | Keep colors in group | MISSING | Add multicolor option |
| 11.4 | Transparency T key | Toggle transparency | PARTIAL opacity exists | No T key not in UI |
| 11.5 | Lock object | Prevent movement | YES | Implemented |
| 11.6 | Hide object | Hide from view | YES | Implemented |
| 11.7 | Show All Ctrl+Shift+H | Unhide all | MISSING | Add shortcut |
| 11.8 | Position X/Y/Z | Numeric entry | YES | Implemented |
| 11.9 | Rotation X/Y/Z | Numeric entry degrees | YES | Implemented |
| 11.10 | Scale X/Y/Z | Numeric entry | YES | Implemented |
| 11.11 | Metalness/Roughness | Material properties | YES | Vision3D extra |
| 11.12 | Name editing | Edit shape name | YES | Vision3D extra |

---

## 12. GROUPING SYSTEM

| # | Feature | TinkerCAD | Vision3D | Gap |
|---|---------|-----------|----------|-----|
| 12.1 | Group Ctrl+G | Combine shapes | YES | Implemented |
| 12.2 | Ungroup Ctrl+Shift+G | Break apart | YES | Implemented |
| 12.3 | Boolean Union | Solid+Solid merge | PARTIAL Visual only | No real CSG |
| 12.4 | Boolean Subtract | Hole cuts solid | MISSING Flag exists | No actual boolean op |
| 12.5 | Boolean Intersect Ctrl+I | Keep overlap | MISSING | Add intersect |
| 12.6 | Bundle Group Ctrl+B | Visual-only group | MISSING | Add bundle |
| 12.7 | Multicolor group | Preserve colors | MISSING | Add option |
| 12.8 | Double-click group edit | Edit children | MISSING | Add group editing |
| 12.9 | Color unification | Group takes first color | PARTIAL | Add color inheritance |

---

## 13. ALIGN TOOL

| # | Feature | TinkerCAD | Vision3D | Gap |
|---|---------|-----------|----------|-----|
| 13.1 | Align L key | 9 alignment handles | PARTIAL 3 center buttons only | Need 9-dot grid |
| 13.2 | Edge alignment | Min/Max per axis | MISSING | Add min/max |
| 13.3 | Align preview | Hover preview | MISSING | Add preview |
| 13.4 | L key shortcut | Press L for align | MISSING | Add L key |

---

## 14. MIRROR TOOL

| # | Feature | TinkerCAD | Vision3D | Gap |
|---|---------|-----------|----------|-----|
| 14.1 | Mirror M key | 3-axis flip selection | PARTIAL X only | Need full 3-axis |
| 14.2 | X mirror | Left-right flip | YES | Implemented |
| 14.3 | Y mirror | Up-down flip | MISSING | Add Y mirror |
| 14.4 | Z mirror | Front-back flip | MISSING | Add Z mirror |
| 14.5 | Mirror preview | Hover preview | MISSING | Add preview |
| 14.6 | Mirror center | Around selection center | MISSING Uses world origin | Fix center reference |

---

## 15. DUPLICATE AND REPEAT

| # | Feature | TinkerCAD | Vision3D | Gap |
|---|---------|-----------|----------|-----|
| 15.1 | Duplicate Ctrl+D | Copy in same position | PARTIAL Offsets +2 X | Should copy in place |
| 15.2 | Smart Duplicate Repeat | Repeat transformation | MISSING | Add transform tracking |
| 15.3 | Array creation | Auto pattern from repeat | MISSING | Dependent on 15.2 |
| 15.4 | Rotation duplicate | Circular patterns | MISSING | Add rotation repeat |
| 15.5 | Copy Ctrl+C | Clipboard copy | PARTIAL Menu only | Add keyboard handler |
| 15.6 | Paste Ctrl+V | Clipboard paste | PARTIAL Menu only | Add keyboard handler |
| 15.7 | Cut Ctrl+X | Clipboard cut | PARTIAL Menu only | Add keyboard handler |

---

## 16. UNDO AND REDO

| # | Feature | TinkerCAD | Vision3D | Gap |
|---|---------|-----------|----------|-----|
| 16.1 | Undo Ctrl+Z | Step back | YES MAX_HISTORY 50 | Implemented |
| 16.2 | Redo Ctrl+Y | Step forward | YES | Implemented |
| 16.3 | History depth | Extensive | YES 50 steps | Adequate |
| 16.4 | History granularity | Per-action snapshots | YES pushHistory on transform | Implemented |

---

## 17. RULER TOOL

| # | Feature | TinkerCAD | Vision3D | Gap |
|---|---------|-----------|----------|-----|
| 17.1 | Ruler R key | Place ruler on workplane | MISSING | Add ruler |
| 17.2 | Dimension display | Show dimensions | MISSING | Dependent on 17.1 |
| 17.3 | Distance display | Object distances | MISSING | Dependent on 17.1 |
| 17.4 | Ruler modes | Edge/center reference | MISSING | Add modes |

---

## 18. NOTES TOOL

| # | Feature | TinkerCAD | Vision3D | Gap |
|---|---------|-----------|----------|-----|
| 18.1 | Notes N key | Place sticky notes | MISSING | Add notes |
| 18.2 | Note text | Edit note content | MISSING | Dependent on 18.1 |
| 18.3 | Note visibility | Show/hide notes | MISSING | Dependent on 18.1 |

---

## 19. IMPORT AND EXPORT

| # | Feature | TinkerCAD | Vision3D | Gap |
|---|---------|-----------|----------|-----|
| 19.1 | Export STL | Download STL | YES Binary STL | Implemented |
| 19.2 | Export OBJ | Download OBJ | YES | Implemented |
| 19.3 | Export GLTF | Download GLTF | YES | Implemented |
| 19.4 | Export GLB | Download GLB | YES | Implemented |
| 19.5 | Export SVG | 2D SVG export | MISSING | Add SVG export |
| 19.6 | Import STL | Load STL | PARTIAL Loads but not added to scene | Fix scene integration |
| 19.7 | Import OBJ | Load OBJ | PARTIAL Same issue | Fix scene integration |
| 19.8 | Import SVG | SVG to 3D extrusion | MISSING | Add SVG import |
| 19.9 | Import dialog | Scale/height settings | MISSING | Add import options |
| 19.10 | Auto-save | Background saving | YES IndexedDB | Implemented |
| 19.11 | Project save/load | Named projects | YES IndexedDB | Implemented |

---

## 20. KEYBOARD SHORTCUTS

| # | Action | TinkerCAD | Vision3D | Gap |
|--------|--------|-----------|----------|-----|
| 20.1 | Delete | Delete/Backspace | YES | Implemented |
| 20.2 | Group | Ctrl+G | YES | Implemented |
| 20.3 | Ungroup | Ctrl+Shift+G | YES | Implemented |
| 20.4 | Duplicate | Ctrl+D | YES | Implemented |
| 20.5 | Undo | Ctrl+Z | YES | Implemented |
| 20.6 | Redo | Ctrl+Y or Ctrl+Shift+Z | YES only Shift+Z | Missing Ctrl+Y |
| 20.7 | Select All | Ctrl+A | YES | Implemented |
| 20.8 | Deselect | Escape | YES | Implemented |
| 20.9 | Select Tool | V | YES | Implemented |
| 20.10 | Move Tool | G | YES | Implemented |
| 20.11 | Rotate Tool | R | YES | Implemented |
| 20.12 | Scale Tool | S | YES | Implemented |
| 20.13 | Drop Workplane | D | YES | Implemented |
| 20.14 | Mirror | M | YES X only | Only X-axis |
| 20.15 | Align | L | MISSING | Add L key |
| 20.16 | Workplane | W | MISSING | Add W key |
| 20.17 | Ruler | R | MISSING conflicts | Needs context |
| 20.18 | Note | N | MISSING | Add N key |
| 20.19 | Transparency | T | MISSING | Add T key |
| 20.20 | Make Hole | H | MISSING | Add H key |
| 20.21 | Make Solid | S conflicts | MISSING | Needs context |
| 20.22 | Lock | Ctrl+L | MISSING | Add Ctrl+L |
| 20.23 | Hide | Ctrl+H | MISSING | Add Ctrl+H |
| 20.24 | Show All | Ctrl+Shift+H | MISSING | Add shortcut |
| 20.25 | Fit View | F | MISSING | Add F key |
| 20.26 | Arrow Move | Arrow keys | MISSING | Add arrows |
| 20.27 | Ctrl+Arrow Z | Ctrl+Up/Down | MISSING | Add Ctrl+Arrow |
| 20.28 | Shift+Arrow 10x | Shift+Arrow | MISSING | Add fast nudge |
| 20.29 | Copy | Ctrl+C | PARTIAL | Add handler |
| 20.30 | Paste | Ctrl+V | PARTIAL | Add handler |
| 20.31 | Cut | Ctrl+X | PARTIAL | Add handler |

---

## 21. ADVANCED TINKERCAD FEATURES

| # | Feature | TinkerCAD | Vision3D | Gap |
|---|---------|-----------|----------|-----|
| 21.1 | Codeblocks | Visual block programming | MISSING | Major new subsystem |
| 21.2 | Circuits | Electronic simulator | N/A | Out of scope |
| 21.3 | Classrooms | Teacher/student mgmt | N/A | Out of scope |
| 21.4 | Fusion 360 export | Professional CAD | N/A | Out of scope |
| 21.5 | Community shapes | User shape libraries | MISSING | Add cloud library |
| 21.6 | Shape favorites | Bookmark shapes | MISSING | Add favorites |
| 21.7 | Custom shapes | Create save shapes | MISSING | Add shape authoring |
| 21.8 | History panel | Visual undo timeline | MISSING | Add panel |
| 21.9 | Shape search | Search library | MISSING | Add search |
| 21.10 | Auto-save indicator | Save status visual | YES | Implemented |
| 21.11 | Cloud storage | Cloud project save | PARTIAL Local only | No cloud sync |

---

## 22. INTERACTION DETAILS

| # | Feature | TinkerCAD | Vision3D | Gap |
|---|---------|-----------|----------|-----|
| 22.1 | Drag-and-drop | Drag from panel to workplane | YES | Implemented |
| 22.2 | Click-to-add | Click shape to place | YES | Implemented |
| 22.3 | Hover cursor | Pointer on hover | YES | Implemented |
| 22.4 | Transform gizmo | Colored arrows/rings | YES drei TransformControls | Implemented |
| 22.5 | Hover highlight | Subtle highlight | MISSING | Add highlight |
| 22.6 | Multi-select box | Rectangle select | MISSING | Add marquee |
| 22.7 | Right-click menu | Context menu | MISSING | Add context menu |
| 22.8 | Double-click group | Enter edit mode | MISSING | Add group editing |
| 22.9 | Escape cancel | Cancel transform | YES Deselects | Partial |

---

## 23. RENDERING AND VISUAL

| # | Feature | TinkerCAD | Vision3D | Gap |
|---|---------|-----------|----------|-----|
| 23.1 | Shadows | Objects cast shadows | YES | Implemented |
| 23.2 | Ambient lighting | Even illumination | YES ambient plus hemisphere | Implemented |
| 23.3 | Directional light | Sun-like light | YES Two lights | Implemented |
| 23.4 | Hole visual | Semi-transparent stripes | PARTIAL Gray only | Missing stripe pattern |
| 23.5 | Selection wireframe | Blue overlay | YES | Implemented |
| 23.6 | Grid lines | Workplane grid | YES gridHelper | Implemented |
| 23.7 | Axis colors | R=X G=Y B=Z | YES | Implemented |
| 23.8 | Smooth shading | Smooth surfaces | YES MeshStandardMaterial | Implemented |
| 23.9 | Antialiasing | Smooth edges | YES | Implemented |

---

## 24. PROJECT MANAGEMENT

| # | Feature | TinkerCAD | Vision3D | Gap |
|---|---------|-----------|----------|-----|
| 24.1 | New project | Blank project | YES clearScene | Implemented |
| 24.2 | Project naming | Name in top bar | YES Editable title | Implemented |
| 24.3 | Save project | Manual save | YES | Implemented |
| 24.4 | Auto-save | Background save | YES | Implemented |
| 24.5 | Load project | Open existing | PARTIAL Function exists no UI | Need project browser |
| 24.6 | Share project | Share link | YES TopbarShareButton | Implemented |
| 24.7 | Clear scene | Delete all | YES | Implemented |

---

## 25. SUMMARY STATISTICS

| Status | Count | Percentage |
|--------|-------|------------|
| YES Fully Implemented | ~65 | ~42% |
| PARTIAL | ~22 | ~14% |
| MISSING | ~65 | ~42% |
| N/A | ~3 | ~2% |

---

## 26. CRITICAL MISSING FEATURES High Priority

1. **Boolean CSG Operations** - Hole+Solid subtraction not performed on meshes
2. **Temporary Workplane W key** - Core TinkerCAD workflow
3. **Arrow Key Movement** - Basic keyboard navigation
4. **Duplicate and Repeat Smart Duplicate** - Pattern creation
5. **Align Tool L key 9-dot grid** - Precise multi-object alignment
6. **Full Mirror Tool 3-axis** - Currently X-only
7. **Scribble Tool** - Freehand to 3D shapes
8. **Ruler Tool** - Measurement and dimensioning
9. **Perspective/Orthographic Toggle** - Camera modes
10. **Fit to View F key** - Camera navigation
11. **Snap Grid OFF Option** - Freeform movement
12. **Unit System mm/inches** - Measurement units

## 27. MEDIUM PRIORITY MISSING FEATURES

13. Box Radius Edge Roundness - Shape parameter
14. Text Font Selection - Typography control
15. Marquee Selection - Multi-select workflow
16. Group Edit Mode Double-click - Group modification
17. L key Align shortcut - Keyboard workflow
18. Clipboard Operations Ctrl+C/V/X - Standard editing
19. Notes Tool N key - Annotation feature
20. Hole Visual Style Stripes - Visual feedback

## 28. LOW PRIORITY NICE-TO-HAVE

21. Codeblocks - Major feature separate subsystem
22. Shape Generators - Community shapes
23. Design Starters/Templates - Pre-made designs
24. SVG Import/Export - File format support
25. Cloud Sync - Cloud storage
26. Right-click Context Menu - Power user feature
27. History Panel - Visual undo timeline
28. Object Hover Highlight - Visual polish

---

## 29. RECOMMENDED IMPLEMENTATION ORDER

### Phase 1 Core Interactions 1-2 weeks
- Arrow key movement 3.1 3.2 3.3
- Snap grid OFF option 8.2
- F key fit-to-view 2.8
- L key align mode 13.1 13.2 13.4
- H key hole toggle 20.20
- Clipboard Ctrl+C/V/X 20.29 20.30 20.31
- Duplicate in place not offset 15.1

### Phase 2 Workplane and Tools 2-3 weeks
- Temporary workplane W key 7.2-7.7
- Ruler tool R key 17.1-17.5
- Notes tool N key 18.1-18.3
- Perspective/Orthographic toggle 2.3
- Unit system mm/inches 8.9
- Workplane size presets 8.8

### Phase 3 Advanced Transform 2-3 weeks
- Smart Duplicate and Repeat 15.2-15.4
- Align tool 9-dot grid 13.1-13.3
- Full 3-axis mirror 14.2-14.6
- Rotation snap 22.5/45 degree 4.2-4.4
- Shift+scale uniform 5.4
- Alt+scale from center 5.5

### Phase 4 Boolean and Advanced Grouping 3-4 weeks
- Real CSG boolean operations 12.3-12.6
- Multicolor group 12.7
- Group edit mode 12.8
- Intersect group 12.5

### Phase 5 Extended Features 4-6 weeks
- Scribble tool 9.16
- Box edge radius 10.1-10.3
- Text font selection 10.9
- Marquee selection 6.3
- SVG import 19.8
- Additional shape categories 9.20-9.30

### Phase 6 Polish and Extras Ongoing
- Object hover highlight 22.5
- Right-click context menu 22.7
- History panel 21.8
- Shape search 21.9
- Hole stripe visual 23.4

---

*Document generated by analyzing Vision3D source code*
*Key files: store/use3DStore.js, utils/constants.js, utils/helpers.js, components/*
*Engine: engine/ExportEngine.js*
