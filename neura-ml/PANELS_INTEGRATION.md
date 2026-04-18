# Training & Testing Panels Integration Guide

## Overview
The TrainingPanel and TestingPanel components have been upgraded with modern Tailwind CSS styling and enhanced functionality. This document outlines the changes and integration patterns.

---

## TrainingPanel

### New Features

1. **Modern Tailwind Styling**
   - Purple-themed header with status indicator dot
   - Clean card-based design with proper spacing
   - Smooth progress animations

2. **Python/JavaScript Toggle**
   - Visual toggle switch in header
   - Shows current export format (Python 🐍 or JavaScript JS)
   - Ready for future export functionality

3. **Enhanced Status Display**
   - Training progress with percentage
   - Success state with accuracy display
   - Sample count summary
   - Clear idle state messaging

4. **Advanced Settings**
   - Collapsible advanced panel
   - Epochs slider (5-100, step 5)
   - Privacy notice about in-browser training

5. **Backward Compatibility**
   - Supports both new and legacy prop APIs
   - Graceful fallback for missing props

### Component API

```jsx
<TrainingPanel
  // New API (recommended)
  status="idle" | "training" | "trained"
  progress={0-100}
  accuracy={0-1}
  canTrain={boolean}
  onTrain={() => void}
  showAdvanced={boolean}
  setShowAdvanced={(boolean) => void}
  epochs={number}
  setEpochs={(number) => void}
  trained={boolean}
  sampleCounts={{ "Class 1": 10, "Class 2": 15 }}
  
  // Legacy API (still supported)
  isTraining={boolean}
  modelTrained={boolean}
/>
```

### State Management Patterns

#### Pattern 1: Full Control (Recommended)
```javascript
const [trainingStatus, setTrainingStatus] = useState('idle')
const [showAdvanced, setShowAdvanced] = useState(false)
const [epochs, setEpochs] = useState(50)

<TrainingPanel
  status={trainingStatus}
  progress={trainingProgress}
  accuracy={0.95}
  canTrain={canTrain}
  onTrain={handleTrain}
  showAdvanced={showAdvanced}
  setShowAdvanced={setShowAdvanced}
  epochs={epochs}
  setEpochs={setEpochs}
  trained={modelTrained}
  sampleCounts={sampleCounts}
/>
```

#### Pattern 2: Internal State (Simpler)
```javascript
// Component manages showAdvanced and epochs internally
<TrainingPanel
  status={trainingStatus}
  progress={trainingProgress}
  canTrain={canTrain}
  onTrain={handleTrain}
  trained={modelTrained}
/>
```

#### Pattern 3: Legacy (Backward Compatible)
```javascript
<TrainingPanel
  isTraining={isTraining}
  progress={trainingProgress}
  modelTrained={modelTrained}
  onTrain={handleTrain}
/>
```

### Sample Counts Calculation

```javascript
const sampleCounts = classes.reduce((acc, cls) => {
  acc[cls.name] = cls.samples.length
  return acc
}, {})
```

---

## TestingPanel

### New Features

1. **Modern Tailwind Styling**
   - Purple-themed header
   - Clean button design with icons
   - Smooth transitions and hover states

2. **Dual Testing Modes**
   - **Upload Mode**: Test with static images
   - **Webcam Mode**: Real-time testing with live video
   - Visual mode indicators

3. **Enhanced Predictions Display**
   - Top prediction highlighted in purple box
   - Confidence bars with color coding
   - Percentage display for each class
   - Smooth animations

4. **Smart Camera Management**
   - Automatic cleanup on unmount
   - Error handling with user feedback
   - Mirrored video display (scaleX(-1))
   - Throttled predictions (300ms interval)

5. **Backward Compatibility**
   - Supports both new and legacy prop APIs
   - Flexible prediction format handling

### Component API

```jsx
<TestingPanel
  // New API (recommended)
  trained={boolean}
  predict={(canvas) => Promise<{ confidences: { [className]: number } }>}
  classes={Array<{ id, name }>}
  
  // Legacy API (still supported)
  model={boolean}
  onPredict={(imageElement) => Promise<predictions>}
/>
```

### Prediction Format

The `predict` function should return:

```javascript
{
  confidences: {
    "Class 1": 0.85,
    "Class 2": 0.12,
    "Class 3": 0.03
  }
}
```

### Implementation Example

```javascript
const handlePredict = async (canvas) => {
  try {
    const result = await predict(canvas)
    
    // Transform to expected format
    return {
      confidences: result.predictions.reduce((acc, pred) => {
        const className = classes.find(c => c.id === pred.classId)?.name || 'Unknown'
        acc[className] = pred.confidence
        return acc
      }, {})
    }
  } catch (error) {
    console.error('Prediction error:', error)
    return { confidences: {} }
  }
}

<TestingPanel
  trained={modelTrained}
  predict={handlePredict}
  classes={classes}
/>
```

### Camera Lifecycle

```javascript
// Automatic cleanup on component unmount
useEffect(() => () => stopCam(), [stopCam])

// Manual stop
const stopCam = useCallback(() => {
  if (rafRef.current) cancelAnimationFrame(rafRef.current)
  streamRef.current?.getTracks().forEach(t => t.stop())
  rafRef.current = null
  streamRef.current = null
}, [])
```

---

## Complete Integration Example

```javascript
import { useState } from 'react'
import TrainingPanel from '../../components/TrainingPanel'
import TestingPanel from '../../components/TestingPanel'

function ImageClassifier({ project }) {
  const [classes, setClasses] = useState([
    { id: 1, name: 'Class 1', samples: [] },
    { id: 2, name: 'Class 2', samples: [] },
  ])
  const [modelTrained, setModelTrained] = useState(false)
  const [trainingStatus, setTrainingStatus] = useState('idle')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [epochs, setEpochs] = useState(50)

  const { train, predict, trainingProgress } = useTFClassifier()

  const handleTrain = async () => {
    setTrainingStatus('training')
    const success = await train(classes, { epochs })
    if (success) {
      setModelTrained(true)
      setTrainingStatus('trained')
    } else {
      setTrainingStatus('idle')
    }
  }

  const handlePredict = async (canvas) => {
    const result = await predict(canvas)
    return {
      confidences: result.predictions.reduce((acc, pred) => {
        const className = classes.find(c => c.id === pred.classId)?.name
        acc[className] = pred.confidence
        return acc
      }, {})
    }
  }

  const sampleCounts = classes.reduce((acc, cls) => {
    acc[cls.name] = cls.samples.length
    return acc
  }, {})

  const canTrain = classes.every(cls => cls.samples.length >= 5)

  return (
    <div className="three-panel-layout">
      {/* Classes Panel */}
      <div className="panel">
        {/* ClassCard components */}
      </div>

      {/* Training Panel */}
      <TrainingPanel
        status={trainingStatus}
        progress={trainingProgress}
        accuracy={0.95}
        canTrain={canTrain}
        onTrain={handleTrain}
        showAdvanced={showAdvanced}
        setShowAdvanced={setShowAdvanced}
        epochs={epochs}
        setEpochs={setEpochs}
        trained={modelTrained}
        sampleCounts={sampleCounts}
      />

      {/* Testing Panel */}
      <TestingPanel
        trained={modelTrained}
        predict={handlePredict}
        classes={classes}
      />
    </div>
  )
}
```

---

## Migration Checklist

### TrainingPanel Migration

- [ ] Add `trainingStatus` state ('idle' | 'training' | 'trained')
- [ ] Add `showAdvanced` and `setShowAdvanced` state (optional)
- [ ] Add `epochs` and `setEpochs` state (optional)
- [ ] Calculate `sampleCounts` from classes
- [ ] Calculate `canTrain` boolean
- [ ] Update `handleTrain` to set status
- [ ] Pass new props to TrainingPanel
- [ ] Remove old CSS classes if any

### TestingPanel Migration

- [ ] Update `handlePredict` to return `{ confidences: {...} }` format
- [ ] Change `model` prop to `trained`
- [ ] Change `onPredict` prop to `predict`
- [ ] Ensure predict function accepts canvas element
- [ ] Test webcam mode
- [ ] Test upload mode
- [ ] Verify confidence bars display correctly

---

## Color Schemes

### TrainingPanel
- **Primary**: Purple (#7c3aed - purple-700)
- **Success**: Green (#22c55e - green-400)
- **Progress**: Purple gradient
- **Background**: White with gray accents

### TestingPanel
- **Primary**: Purple (#7c3aed - purple-700)
- **Confidence Colors** (cycles):
  1. Purple (#a855f7 - purple-500)
  2. Teal (#14b8a6 - teal-500)
  3. Orange (#fb923c - orange-400)
  4. Pink (#ec4899 - pink-500)
  5. Blue (#3b82f6 - blue-500)
  6. Green (#22c55e - green-500)

---

## Files Updated

- ✅ `neura-ml/components/TrainingPanel.jsx` - Component implementation
- ✅ `neura-ml/components/TestingPanel.jsx` - Component implementation
- ✅ `neura-ml/classifiers/image-classifier/ImageClassifier.jsx` - Full integration
- ⏳ `neura-ml/classifiers/audio-classifier/AudioClassifier.jsx` - Pending
- ⏳ `neura-ml/classifiers/pose-classifier/PoseClassifier.jsx` - Pending
- ⏳ `neura-ml/classifiers/hand-pose-classifier/HandPoseClassifier.jsx` - Pending
- ⏳ `neura-ml/classifiers/text-classifier/TextClassifier.jsx` - Pending

---

## Testing Checklist

### TrainingPanel
- [ ] Status indicator dot changes color when trained
- [ ] Progress bar animates during training
- [ ] Train button disabled when not enough samples
- [ ] Advanced panel toggles correctly
- [ ] Epochs slider updates value
- [ ] Sample count displays correctly
- [ ] Accuracy displays after training
- [ ] Python/JS toggle renders correctly

### TestingPanel
- [ ] Upload button opens file picker
- [ ] Webcam button starts camera
- [ ] Camera stops when clicking Stop
- [ ] Uploaded image displays correctly
- [ ] Webcam video is mirrored
- [ ] Predictions update in real-time (webcam)
- [ ] Predictions show after upload
- [ ] Confidence bars animate smoothly
- [ ] Top prediction highlighted
- [ ] Camera cleanup on unmount
- [ ] Error message shows on camera failure

---

## Common Issues & Solutions

### Issue: Predictions not updating
**Solution**: Ensure `predict` function returns the correct format:
```javascript
{ confidences: { "Class 1": 0.85, "Class 2": 0.15 } }
```

### Issue: Camera not stopping
**Solution**: Ensure cleanup in useEffect:
```javascript
useEffect(() => () => stopCam(), [stopCam])
```

### Issue: Progress bar not animating
**Solution**: Ensure `progress` prop is a number 0-100 and `status` is 'training'

### Issue: Advanced settings not persisting
**Solution**: Use controlled state for `showAdvanced` and `epochs`:
```javascript
const [showAdvanced, setShowAdvanced] = useState(false)
const [epochs, setEpochs] = useState(50)
```

---

## Performance Notes

- **Webcam predictions**: Throttled to 300ms intervals to prevent overload
- **Canvas size**: Fixed at 224x224 for consistent model input
- **Video resolution**: 320x240 for optimal performance
- **Animation**: Uses CSS transitions for smooth 60fps animations
- **Cleanup**: Proper cleanup of video streams and animation frames

---

## Accessibility

- Semantic HTML structure
- Keyboard navigation support
- Clear visual feedback for interactions
- Error messages for camera access issues
- Descriptive button labels with icons
- Proper contrast ratios (WCAG AA compliant)
