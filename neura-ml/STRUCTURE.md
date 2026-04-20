# NeuraML Complete Folder Structure

```
neura-ml/
│
├── 📄 NeuraML.jsx                    # Root entry point with React Router
├── 📄 index.js                       # Main exports
├── 📄 package.json                   # Dependencies and scripts
├── 📄 README.md                      # Documentation
├── 📄 STRUCTURE.md                   # This file
├── 📄 styles.css                     # Global styles
├── 📄 .gitignore                     # Git ignore rules
│
├── 📁 pages/
│   ├── MyProjectsPage.jsx            # Screen 1: Project list + empty state
│   ├── CreateProjectPage.jsx         # Screen 2: Name + select project type
│   └── ClassifierRouter.jsx          # Routes to correct classifier by type
│
├── 📁 components/                    # Shared UI components
│   ├── NeuraHeader.jsx               # Purple top nav (LeapLab/Neura branded)
│   ├── ClassifierLayout.jsx          # Sub-header bar + project context wrapper
│   ├── ClassCard.jsx                 # Colored class card (upload/webcam/samples)
│   ├── TrainingPanel.jsx             # Train button, progress, JS/Py toggle, advanced
│   ├── TestingPanel.jsx              # Live webcam + upload + confidence bars
│   └── WebcamModal.jsx               # Hold-to-record capture modal
│
├── 📁 hooks/
│   └── useTFClassifier.js            # TF.js + MobileNet + KNN (shared logic)
│
└── 📁 classifiers/
    │
    ├── 📁 image-classifier/
    │   └── ImageClassifier.jsx       # Full 3-panel PictoBlox layout
    │
    ├── 📁 audio-classifier/
    │   └── AudioClassifier.jsx       # Mic record per class
    │
    ├── 📁 pose-classifier/
    │   └── PoseClassifier.jsx        # MoveNet keypoints
    │
    ├── 📁 hand-pose-classifier/
    │   └── HandPoseClassifier.jsx    # MediaPipe 21 landmarks
    │
    ├── 📁 object-detection/
    │   └── ObjectDetection.jsx       # COCO-SSD, no training needed
    │
    ├── 📁 text-classifier/
    │   └── TextClassifier.jsx        # Type examples per class
    │
    └── 📁 numbers-classifier/
        └── NumbersClassifier.jsx     # CSV upload + k-NN
```

## 📊 File Count Summary

- **Total Files**: 24
- **React Components**: 18
- **Hooks**: 1
- **Config Files**: 5

## 🎯 Component Hierarchy

```
NeuraML (Router)
│
├── MyProjectsPage
│   └── NeuraHeader
│
├── CreateProjectPage
│   └── NeuraHeader
│
└── ClassifierRouter
    └── [Specific Classifier]
        └── ClassifierLayout
            ├── NeuraHeader
            ├── ClassCard (multiple)
            ├── TrainingPanel
            ├── TestingPanel
            └── WebcamModal (conditional)
```

## 🔄 Data Flow

```
User Action
    ↓
Component Event Handler
    ↓
useTFClassifier Hook (for ML operations)
    ↓
TensorFlow.js Models (MobileNet, KNN, etc.)
    ↓
State Update
    ↓
UI Re-render
```

## 💾 Storage Structure

```javascript
localStorage['neura-ml-projects'] = [
  {
    id: "timestamp",
    name: "My Project",
    type: "image|audio|pose|hand-pose|object-detection|text|numbers",
    createdAt: "ISO date",
    classes: [
      {
        id: 0,
        name: "Class Name",
        samples: [...],
        color: "#FF6B6B"
      }
    ],
    model: null // Serialized model data
  }
]
```

## 🎨 Styling Architecture

- **CSS Variables** - Theme colors defined in `:root`
- **Component-scoped** - Each component has its own class namespace
- **Responsive** - Grid layouts adapt to screen size
- **Consistent** - Shared design tokens across all classifiers

## 🚀 Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Import into your app**:
   ```jsx
   import NeuraML from './neura-ml/NeuraML';
   ```

3. **Add to your router**:
   ```jsx
   <Route path="/ml/*" element={<NeuraML />} />
   ```

## 📝 Notes

- All classifiers follow the same 3-panel layout pattern
- Shared components ensure consistent UX
- useTFClassifier hook abstracts ML complexity
- LocalStorage provides simple persistence
- Ready for cloud storage integration

---

**Status**: ✅ Complete folder structure created
**Next Steps**: Integration testing, model training implementation, cloud storage
