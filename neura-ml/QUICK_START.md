# NeuraML Components Quick Start Guide

## 🚀 Get Started in 5 Minutes

This guide will help you integrate the new NeuraML components into your classifier.

---

## Step 1: Update Your State

Add these state variables to your classifier component:

```javascript
import { useState } from 'react'

function YourClassifier({ project }) {
  // Classes (remove 'color' property)
  const [classes, setClasses] = useState([
    { id: 1, name: 'Class 1', samples: [] },
    { id: 2, name: 'Class 2', samples: [] },
  ])
  
  // Training state
  const [modelTrained, setModelTrained] = useState(false)
  const [trainingStatus, setTrainingStatus] = useState('idle')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [epochs, setEpochs] = useState(50)
  
  // ... rest of your component
}
```

---

## Step 2: Add Required Handlers

### Rename Handler (NEW)
```javascript
const handleRenameClass = (classId, newName) => {
  setClasses(classes.map(cls =>
    cls.id === classId ? { ...cls, name: newName } : cls
  ))
}
```

### Add Samples Handler (NEW)
```javascript
const handleAddSamples = (classId, dataURL) => {
  setClasses(classes.map(cls => {
    if (cls.id === classId) {
      return {
        ...cls,
        samples: [...cls.samples, { preview: dataURL }],
      }
    }
    return cls
  }))
}
```

### Update Train Handler
```javascript
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
```

### Update Predict Handler
```javascript
const handlePredict = async (canvas) => {
  const result = await predict(canvas)
  
  // Return in the format expected by TestingPanel
  return {
    confidences: result.predictions.reduce((acc, pred) => {
      const className = classes.find(c => c.id === pred.classId)?.name
      acc[className] = pred.confidence
      return acc
    }, {})
  }
}
```

---

## Step 3: Calculate Helper Values

```javascript
// Sample counts for TrainingPanel
const sampleCounts = classes.reduce((acc, cls) => {
  acc[cls.name] = cls.samples.length
  return acc
}, {})

// Can train check
const canTrain = classes.every(cls => cls.samples.length >= 5)
```

---

## Step 4: Update Component Usage

### ClassCard
```javascript
{classes.map((cls, index) => (
  <ClassCard
    key={cls.id}
    classData={cls}
    index={index}
    onRename={handleRenameClass}
    onDelete={handleDeleteClass}
    onAddSamples={handleAddSamples}
    onWebcam={() => {
      setActiveClass(cls.id)
      setShowWebcam(true)
    }}
    onUpload={() => {
      // Your upload logic
    }}
    showImagePreviews={true}
  />
))}
```

### TrainingPanel
```javascript
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

### TestingPanel
```javascript
<TestingPanel
  trained={modelTrained}
  predict={handlePredict}
  classes={classes}
/>
```

---

## Complete Example

Here's a minimal working example:

```javascript
import { useState } from 'react'
import ClassCard from '../../components/ClassCard'
import TrainingPanel from '../../components/TrainingPanel'
import TestingPanel from '../../components/TestingPanel'

function ImageClassifier({ project }) {
  // State
  const [classes, setClasses] = useState([
    { id: 1, name: 'Class 1', samples: [] },
    { id: 2, name: 'Class 2', samples: [] },
  ])
  const [modelTrained, setModelTrained] = useState(false)
  const [trainingStatus, setTrainingStatus] = useState('idle')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [epochs, setEpochs] = useState(50)

  // Handlers
  const handleRenameClass = (classId, newName) => {
    setClasses(classes.map(cls =>
      cls.id === classId ? { ...cls, name: newName } : cls
    ))
  }

  const handleDeleteClass = (classId) => {
    if (classes.length <= 2) {
      alert('You need at least 2 classes')
      return
    }
    setClasses(classes.filter(c => c.id !== classId))
  }

  const handleAddSamples = (classId, dataURL) => {
    setClasses(classes.map(cls => {
      if (cls.id === classId) {
        return {
          ...cls,
          samples: [...cls.samples, { preview: dataURL }],
        }
      }
      return cls
    }))
  }

  const handleTrain = async () => {
    setTrainingStatus('training')
    // Your training logic here
    setTimeout(() => {
      setModelTrained(true)
      setTrainingStatus('trained')
    }, 2000)
  }

  const handlePredict = async (canvas) => {
    // Your prediction logic here
    return {
      confidences: {
        'Class 1': 0.85,
        'Class 2': 0.15,
      }
    }
  }

  // Helper values
  const sampleCounts = classes.reduce((acc, cls) => {
    acc[cls.name] = cls.samples.length
    return acc
  }, {})
  const canTrain = classes.every(cls => cls.samples.length >= 5)

  return (
    <div className="three-panel-layout">
      {/* Classes Panel */}
      <div className="panel">
        {classes.map((cls, index) => (
          <ClassCard
            key={cls.id}
            classData={cls}
            index={index}
            onRename={handleRenameClass}
            onDelete={handleDeleteClass}
            onAddSamples={handleAddSamples}
            showImagePreviews={true}
          />
        ))}
      </div>

      {/* Training Panel */}
      <TrainingPanel
        status={trainingStatus}
        progress={0}
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

export default ImageClassifier
```

---

## Common Patterns

### Pattern 1: File Upload
```javascript
const handleFileUpload = (classId, files) => {
  Array.from(files).forEach(file => {
    const reader = new FileReader()
    reader.onload = (e) => {
      handleAddSamples(classId, e.target.result)
    }
    reader.readAsDataURL(file)
  })
}
```

### Pattern 2: Webcam Capture
```javascript
const handleWebcamCapture = (blob) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    handleAddSamples(activeClassId, e.target.result)
  }
  reader.readAsDataURL(blob)
}
```

### Pattern 3: Add New Class
```javascript
const handleAddClass = () => {
  const newClass = {
    id: Date.now(),
    name: `Class ${classes.length + 1}`,
    samples: [],
  }
  setClasses([...classes, newClass])
}
```

---

## Troubleshooting

### Issue: Colors not showing
**Solution**: Make sure you're passing the `index` prop to ClassCard:
```javascript
{classes.map((cls, index) => (
  <ClassCard index={index} ... />
))}
```

### Issue: Predictions not updating
**Solution**: Ensure your predict function returns the correct format:
```javascript
return {
  confidences: {
    "Class 1": 0.85,
    "Class 2": 0.15
  }
}
```

### Issue: Train button always disabled
**Solution**: Check that `canTrain` is calculated correctly:
```javascript
const canTrain = classes.every(cls => cls.samples.length >= 5)
```

### Issue: Progress bar not animating
**Solution**: Ensure `status` is set to 'training' and `progress` is a number 0-100:
```javascript
setTrainingStatus('training')
// Update progress during training
```

---

## Testing Your Integration

### Checklist
- [ ] ClassCard displays with correct colors
- [ ] Can rename classes inline
- [ ] Can delete classes (minimum 2 enforced)
- [ ] Can upload images
- [ ] Sample count updates correctly
- [ ] Thumbnails display correctly
- [ ] Train button enables when enough samples
- [ ] Progress bar animates during training
- [ ] Status changes to 'trained' after training
- [ ] Testing panel enables after training
- [ ] Can upload test images
- [ ] Can use webcam for testing
- [ ] Predictions display correctly
- [ ] Confidence bars animate

---

## Next Steps

1. **Test thoroughly** - Try all interactions
2. **Add error handling** - Handle edge cases
3. **Customize styling** - Adjust colors/spacing if needed
4. **Add features** - Implement additional functionality
5. **Review docs** - Check detailed guides for advanced usage

---

## Additional Resources

- **CLASSCARD_INTEGRATION.md** - Detailed ClassCard guide
- **PANELS_INTEGRATION.md** - Detailed Panels guide
- **COMPONENT_UPGRADE_SUMMARY.md** - Complete overview
- **VISUAL_REFERENCE.md** - Visual design reference
- **ImageClassifier.jsx** - Reference implementation

---

## Need Help?

1. Check the reference implementation in `ImageClassifier.jsx`
2. Review the detailed integration guides
3. Check the troubleshooting section above
4. Look at the visual reference for expected behavior

---

**Last Updated**: 2026-04-18
**Estimated Integration Time**: 15-30 minutes per classifier
