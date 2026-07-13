# Vision3D Module

Welcome to the **Vision3D** module! This is the 3D solid modeling and geometry workspace inside LeapBlocks. It allows users to build and combine 3D shapes (using a solid editor and CSG operations) and interactively explore how flat 2D nets fold up into complete 3D solids.

---

## 🎨 Interactive 3D Folding Nets

The folding net engine lets users interactively transition shapes from a flat 2D net (progress `t = 0`) to a completed 3D solid (progress `t = 1`). 

Instead of shapes simply sliding in straight lines, we use dedicated folding components that simulate real cardboard/paper hinges and curvature folding:

### 1. Cube & Box Folding (`BoxFold.jsx`)
Folds using a parent-child rotation hierarchy:
* **Bottom** face acts as the stationary base on the ground plane.
* **Left, Right, and Back** faces rotate $90^\circ$ around their shared bottom edges.
* The **Front** face hinges $90^\circ$ up from the bottom. The **Top** face is nested *inside* the Front face's coordinate group, meaning it inherits the front face's position and rotates an additional $90^\circ$ to cover the top of the box.

### 2. Tetrahedron Folding (`TetrahedronFold.jsx`)
Folds 4 equilateral triangles along base edges:
* The **Base** triangle remains flat on the floor.
* The 3 outer triangles hinge-fold along the base edges. Because the left and right edges are skewed at angles ($60^\circ$ and $-60^\circ$), the component calculates custom axes of rotation using Three.js Quaternions.
* Faces rotate up by the exact dihedral angle of a regular tetrahedron ($\approx 109.47^\circ$) to meet seamlessly at the top apex.

### 3. Sphere Clamshell Joining (`SphereFold.jsx`)
Animates two hemispheres joining to form a solid sphere:
* At `t = 0` (flat net), the top and bottom hemispheres lie flat on the floor next to each other, separated by a gap of `1.5 * radius`.
* As the animation plays, both hemispheres slide towards the center while **lifting up in a smooth vertical arch** (using a sine wave trajectory for the height: $y = \text{offset} \cdot \sin(t \cdot \pi) \cdot 0.5$).
* Their X-axis rotations smoothly transition from flat ($90^\circ$ / $-90^\circ$) to vertical ($0^\circ$), closing like a clamshell.

### 4. Cone & Cylinder Curling (`ConeCurl.jsx`, `CylinderCurl.jsx`)
* **Curling Sheet**: Deforms flat mesh position attributes along a cylindrical/conical curve parameterized by the timeline progress.
* **Cone Base Hinging**: Rather than sliding horizontally, the circular base rotates $180^\circ$ around the outer edge midpoint of the unrolled sector to cap the bottom of the cone.

---

## 🏗️ Architecture Decisions

### Decoupled Animation Components
To avoid breaking the database schema or serialization logic, we kept the core **[netDefinitions.js](file:///d:/Creoleap%20Company/leapblocks/leaplab_frontend/src/vision3d/components/shapeNet/netDefinitions.js)** simple and untouched. 

Instead of adding complex animation math to the shape definitions, we created modular React components for each shape inside `components/shapeNet/`. The **[NetScene.jsx](file:///d:/Creoleap%20Company/leapblocks/leaplab_frontend/src/vision3d/components/shapeNet/NetScene.jsx)** router component dynamically decides which folding animation to load based on the shape type.

### Eased Autoplay Timeline
The autoplay engine inside **[ShapeNet.jsx](file:///d:/Creoleap%20Company/leapblocks/leaplab_frontend/src/vision3d/components/ShapeNet.jsx)** applies a **Cubic Ease-In-Out** curve to the timeline progress. This starts the folding animation slowly, accelerates it through the middle, and decelerates it gently as the shapes fit together.

---

## 📂 Folder Layout

```
vision3d/
├── index.jsx                  # Module entry wrapper (toolbar, layout panels)
├── README.md                  # Developer guide & math documentation
├── components/                # React / R3F components
│   ├── Canvas3D.jsx           # Main R3F Canvas & Camera Controllers
│   ├── ShapeRenderer.jsx      # Generates & renders 3D mesh geometries
│   ├── ToolbarSection.jsx     # Import, Export, Animate, and Combine controls
│   ├── ShapePanel.jsx         # Sidebar grid of draggable shapes
│   ├── PropertiesPanel.jsx    # Numerical inputs for selected shape properties
│   ├── ShapeNet.jsx           # Fullscreen layout container for folding nets
│   ├── transformGizmo/        # Translate and rotate transform gizmos
│   └── shapeNet/              # Custom modular shape-net folding animations
│       ├── BoxFold.jsx        # Cube hinge folding component
│       ├── TetrahedronFold.jsx# Equilateral triangle hinge folding component
│       ├── SphereFold.jsx     # Clamshell joining hemisphere component
│       ├── CylinderCurl.jsx   # Cylinder wrapping animation
│       ├── ConeCurl.jsx       # Cone sector folding animation
│       └── netDefinitions.js  # Has/properties mapping for folding solids
├── engine/                    # 3D algorithms & CSG operations
│   ├── CSGEngine.js           # Boolean operation processor (Three-bvh-csg)
│   ├── ExportEngine.js        # Formatter for STL, OBJ exports
│   └── ImportManager.js       # Parser for imported mesh files
├── store/                     # Zustand state management
│   ├── use3DStore.js          # Core store (history, actions, registry)
│   ├── cameraSlice.js         # Camera view state controller
│   ├── editModeSlice.js       # Component editing state (verts, edges, faces)
│   └── rulerSlice.js          # Measurement ruler state
└── utils/                     # Constant configurations & math helpers
    ├── geometry.js            # Serializer & Geometry creator factory
    ├── helpers.js             # Snap math, scale helpers, color catalogs
    └── indexedDB.js           # LocalStorage / IDB project serialization
```

---

## 🚀 Mount the Component

To open the 3D editor workspace inside your parent React application:

```jsx
import Vision3DApp from './vision3d';

const EditorPage = () => {
  return (
    <div className="w-screen h-screen">
      <Vision3DApp onBack={() => console.log('Returned to dashboard')} />
    </div>
  );
};
```
