# NeuraML Quick Start Guide

## 🎯 What is NeuraML?

NeuraML is a complete machine learning platform for Neura, inspired by PictoBlox's ML environment. It provides 7 different types of classifiers with an intuitive 3-panel interface.

## 📦 Installation

### 1. Install Dependencies

```bash
cd neura-ml
npm install
```

### 2. Required Packages

The following packages will be installed:

- **React & Router**: UI framework and navigation
- **TensorFlow.js**: Core ML library
- **@tensorflow-models/mobilenet**: Image feature extraction
- **@tensorflow-models/knn-classifier**: K-nearest neighbors
- **@tensorflow-models/coco-ssd**: Object detection
- **@tensorflow-models/posenet**: Pose detection
- **@mediapipe/hands**: Hand gesture recognition

## 🚀 Integration into Neura

### Option 1: Standalone Route

```jsx
// In your main App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NeuraML from './neura-ml/NeuraML';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/ml/*" element={<NeuraML />} />
        {/* Your other routes */}
      </Routes>
    </Router>
  );
}
```

### Option 2: Direct Import

```jsx
// Import specific components
import { 
  ImageClassifier, 
  AudioClassifier,
  NeuraHeader 
} from './neura-ml';

// Use in your app
function MyComponent() {
  return (
    <div>
      <NeuraHeader />
      <ImageClassifier project={myProject} />
    </div>
  );
}
```

## 🎨 Styling

Import the global styles in your main CSS or App component:

```jsx
import './neura-ml/styles.css';
```

Or customize by overriding CSS variables:

```css
:root {
  --neura-purple: #7C3AED;
  --neura-purple-dark: #5B21B6;
  --neura-bg: #F9FAFB;
  /* ... other variables */
}
```

## 📱 User Flow

### 1. My Projects Page
- View all saved ML projects
- Empty state prompts first project creation
- Delete or open existing projects

### 2. Create Project Page
- Enter project name
- Select from 7 classifier types:
  - 🖼️ Image Classifier
  - 🎤 Audio Classifier
  - 🧍 Pose Classifier
  - ✋ Hand Pose Classifier
  - 🎯 Object Detection
  - 📝 Text Classifier
  - 📊 Numbers Classifier

### 3. Classifier Interface (3-Panel Layout)

**Left Panel - Classes**
- Add/remove classes
- Upload samples or use webcam
- View sample count per class

**Middle Panel - Training**
- Train model button
- Progress indicator
- Export format selection (JS/Python)
- Advanced settings

**Right Panel - Testing**
- Live webcam testing
- File upload testing
- Real-time confidence bars

## 🎓 Example: Creating an Image Classifier

### Step 1: Create Project
```
1. Click "New Project"
2. Name: "Cat vs Dog Classifier"
3. Type: Image Classifier
4. Click "Create Project"
```

### Step 2: Add Training Data
```
1. Click webcam icon on "Class 1"
2. Hold record button while showing cats
3. Capture 20-30 samples
4. Rename "Class 1" to "Cat"
5. Repeat for "Class 2" with dogs
```

### Step 3: Train Model
```
1. Click "Train Model" button
2. Wait for progress bar to complete
3. Model is now ready!
```

### Step 4: Test Model
```
1. Click "Start Live Test" in right panel
2. Show cat/dog to webcam
3. See real-time predictions with confidence
```

## 🔧 Advanced Usage

### Custom Hook Usage

```jsx
import useTFClassifier from './neura-ml/hooks/useTFClassifier';

function MyCustomClassifier() {
  const { train, predict, isTraining, trainingProgress } = useTFClassifier();

  const handleTrain = async () => {
    const success = await train(myClasses);
    if (success) {
      console.log('Training complete!');
    }
  };

  const handlePredict = async (imageElement) => {
    const result = await predict(imageElement);
    console.log('Prediction:', result);
  };

  return (
    <div>
      <button onClick={handleTrain} disabled={isTraining}>
        Train ({trainingProgress}%)
      </button>
      {/* Your UI */}
    </div>
  );
}
```

### Saving/Loading Models

```jsx
const { saveModel, loadModel } = useTFClassifier();

// Save model
const modelData = saveModel();
localStorage.setItem('my-model', JSON.stringify(modelData));

// Load model
const savedData = JSON.parse(localStorage.getItem('my-model'));
loadModel(savedData);
```

## 📊 Data Structure

### Project Object
```javascript
{
  id: "1234567890",
  name: "My Classifier",
  type: "image",
  createdAt: "2024-01-01T00:00:00.000Z",
  classes: [
    {
      id: 0,
      name: "Class 1",
      samples: [
        { image: ImageElement, preview: "blob:..." }
      ],
      color: "#FF6B6B"
    }
  ],
  model: null
}
```

## 🐛 Troubleshooting

### Webcam Not Working
- Check browser permissions
- Ensure HTTPS (required for getUserMedia)
- Try different browser

### Model Training Fails
- Ensure at least 5 samples per class
- Check browser console for errors
- Verify TensorFlow.js loaded correctly

### Slow Performance
- Reduce image resolution
- Use fewer training samples
- Close other browser tabs

## 🎯 Best Practices

1. **Training Data**
   - Minimum 10 samples per class
   - Vary lighting and angles
   - Include edge cases

2. **Testing**
   - Test with new data (not training samples)
   - Try different conditions
   - Validate confidence scores

3. **Performance**
   - Keep sample count reasonable (<100 per class)
   - Use appropriate image sizes
   - Clear unused models from memory

## 📚 Resources

- [TensorFlow.js Docs](https://www.tensorflow.org/js)
- [MobileNet Guide](https://github.com/tensorflow/tfjs-models/tree/master/mobilenet)
- [KNN Classifier](https://github.com/tensorflow/tfjs-models/tree/master/knn-classifier)

## 🤝 Contributing

To add a new classifier type:

1. Create folder in `classifiers/`
2. Implement component following existing patterns
3. Add route in `ClassifierRouter.jsx`
4. Add type to `CreateProjectPage.jsx`

## 📄 License

Part of the Neura platform by LeapLab

---

**Ready to build?** Start with `npm install` and create your first ML project! 🚀
