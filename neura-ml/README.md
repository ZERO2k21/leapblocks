# NeuraML - Machine Learning Platform

A comprehensive machine learning platform for Neura, inspired by PictoBlox's ML environment.

## 📁 Folder Structure

```
neura-ml/
├── NeuraML.jsx                          ← Root entry point (drop into Neura)
│
├── pages/
│   ├── MyProjectsPage.jsx               ← Screen 1: project list + empty state
│   ├── CreateProjectPage.jsx            ← Screen 2: name + select project type
│   └── ClassifierRouter.jsx             ← Routes to correct classifier by type
│
├── components/                          ← Shared across all classifiers
│   ├── NeuraHeader.jsx                  ← Purple top nav (LeapLab/Neura branded)
│   ├── ClassifierLayout.jsx             ← Sub-header bar + project context
│   ├── ClassCard.jsx                    ← Colored class card (upload/webcam/samples)
│   ├── TrainingPanel.jsx                ← Train button, progress, JS/Py toggle, advanced
│   ├── TestingPanel.jsx                 ← Live webcam + upload + confidence bars
│   └── WebcamModal.jsx                  ← Hold-to-record capture modal
│
├── hooks/
│   └── useTFClassifier.js               ← TF.js + MobileNet + KNN (shared logic)
│
└── classifiers/
    ├── image-classifier/ImageClassifier.jsx       ← Full 3-panel PictoBlox layout
    ├── audio-classifier/AudioClassifier.jsx       ← Mic record per class
    ├── pose-classifier/PoseClassifier.jsx         ← MoveNet keypoints
    ├── hand-pose-classifier/HandPoseClassifier.jsx ← MediaPipe 21 landmarks
    ├── object-detection/ObjectDetection.jsx       ← COCO-SSD, no training needed
    ├── text-classifier/TextClassifier.jsx         ← Type examples per class
    └── numbers-classifier/NumbersClassifier.jsx   ← CSV upload + k-NN
```

## 🚀 Features

### 7 Classifier Types

1. **Image Classifier** - Train custom image recognition models using webcam or uploads
2. **Audio Classifier** - Classify sounds using microphone input
3. **Pose Classifier** - Detect and classify body poses using MoveNet
4. **Hand Pose Classifier** - Recognize hand gestures with MediaPipe Hands
5. **Object Detection** - Real-time object detection with pre-trained COCO-SSD
6. **Text Classifier** - Classify text into custom categories
7. **Numbers Classifier** - Classify numerical data from CSV files using k-NN

### Core Components

- **NeuraHeader** - Consistent purple navigation bar across all screens
- **ClassifierLayout** - Unified layout wrapper with project context
- **ClassCard** - Reusable colored class cards with sample management
- **TrainingPanel** - Training controls with progress, export options, and advanced settings
- **TestingPanel** - Live testing with webcam, file upload, and confidence visualization
- **WebcamModal** - Hold-to-record modal for capturing training samples

### Shared Logic

- **useTFClassifier** - Custom React hook for TensorFlow.js integration
  - MobileNet for feature extraction
  - KNN Classifier for training
  - Model save/load functionality

## 📦 Installation

```bash
npm install
```

## 🎯 Usage

### Integration into Neura

Drop `NeuraML.jsx` into your main Neura app:

```jsx
import NeuraML from './neura-ml/NeuraML';

function App() {
  return (
    <div>
      {/* Your existing Neura components */}
      <NeuraML />
    </div>
  );
}
```

### Creating a New Project

1. Navigate to "My Projects"
2. Click "New Project"
3. Enter project name
4. Select classifier type
5. Start training!

## 🎨 Design Philosophy

- **PictoBlox-inspired** - Familiar 3-panel layout for image/audio/pose classifiers
- **Color-coded classes** - Visual distinction between different classes
- **Progressive disclosure** - Advanced settings hidden by default
- **Real-time feedback** - Live testing with confidence bars
- **Export flexibility** - JavaScript and Python export options

## 🔧 Technical Stack

- **React** - UI framework
- **React Router** - Navigation
- **TensorFlow.js** - Machine learning
- **MobileNet** - Feature extraction
- **KNN Classifier** - Training algorithm
- **COCO-SSD** - Object detection
- **MediaPipe** - Hand pose detection
- **MoveNet** - Body pose detection

## 📝 Project Storage

Projects are stored in browser localStorage with the following structure:

```json
{
  "id": "timestamp",
  "name": "Project Name",
  "type": "image|audio|pose|hand-pose|object-detection|text|numbers",
  "createdAt": "ISO date string",
  "classes": [],
  "model": null
}
```

## 🎓 Educational Focus

NeuraML is designed for:
- Students learning machine learning concepts
- Educators teaching AI/ML
- Makers building interactive projects
- Anyone exploring computer vision and ML

## 🚧 Future Enhancements

- [ ] Model export to TensorFlow Lite
- [ ] Cloud model storage
- [ ] Collaborative projects
- [ ] Pre-trained model templates
- [ ] Advanced hyperparameter tuning
- [ ] Model performance metrics
- [ ] Dataset augmentation tools

## 📄 License

Part of the Neura platform by LeapLab

---

Built with ❤️ for the Neura community
