# Neura ML Studio - Usage & Extension Guide

## 🚀 Quick Start

### Accessing Neura from LeapLab

```typescript
// In your main app or landing page
import NeuraApp from './NeuraApp';

// Render Neura
<NeuraApp onBack={() => navigateToLanding()} />
```

---

## 📖 Using Existing Components

### 1. Dashboard View

The dashboard automatically shows when no projects exist:

```typescript
// Empty state with animation
<EmptyStateIllustration />

// Or with projects
<div className="grid grid-cols-4 gap-6">
  {projects.map(project => (
    <ProjectCard 
      key={project.id}
      project={project}
      onClick={() => openProject(project)}
    />
  ))}
</div>
```

### 2. Creating a New Project

```typescript
// Open the create project modal
<CreateProjectModal
  onClose={() => setView('dashboard')}
  onSelectType={(typeId) => {
    setCurrentProjectType(typeId);
    setView('project');
  }}
/>
```

### 3. Using the Image Classifier

```typescript
import ImageClassifier from './components/neura/project-types/image-classifier/ImageClassifier';

<ImageClassifier 
  onBack={() => navigateToDashboard()}
/>
```

### 4. Using Custom Hooks

```typescript
import { useImageClassifier } from './hooks/useImageClassifier';

function MyComponent() {
  const {
    classes,
    isTraining,
    accuracy,
    addClass,
    deleteClass,
    renameClass,
    addSample,
    removeSample,
    trainModel,
    canTrain,
  } = useImageClassifier();

  return (
    <div>
      <button onClick={addClass}>Add Class</button>
      <button onClick={trainModel} disabled={!canTrain()}>
        Train Model
      </button>
      {accuracy && <div>Accuracy: {accuracy}%</div>}
    </div>
  );
}
```

---

## 🔧 Adding a New Project Type

### Step 1: Create the Component

```typescript
// src/components/neura/project-types/my-new-type/MyNewType.tsx

'use client';

import React from 'react';
import ProjectHeader from '../../common/ProjectHeader';

interface MyNewTypeProps {
    onBack?: () => void;
}

export default function MyNewType({ onBack }: MyNewTypeProps) {
    return (
        <div className="h-screen flex flex-col bg-gray-50">
            <ProjectHeader
                icon="🎯"
                title="My New Type"
                onBack={onBack}
                onSave={() => console.log('Save')}
            />

            <div className="flex flex-1 overflow-hidden">
                {/* Left: Main content */}
                <div className="w-2/3 p-6 overflow-auto">
                    {/* Your content here */}
                </div>

                {/* Right: Training/Testing */}
                <div className="w-1/3 border-l bg-white p-6 overflow-auto">
                    {/* Training and testing panels */}
                </div>
            </div>
        </div>
    );
}
```

### Step 2: Add to Types

```typescript
// src/types/neura.types.ts

export type ProjectType =
    | 'image-classifier'
    | 'object-detection'
    | 'pose-classifier'
    | 'hand-pose-classifier'
    | 'audio-classifier'
    | 'numbers-cr'
    | 'text-classifier'
    | 'my-new-type';  // ← Add your new type
```

### Step 3: Add to Create Modal

```typescript
// src/components/neura/create-project/CreateProjectModal.tsx

const projectTypes: ProjectTypeInfo[] = [
    // ... existing types
    { 
        id: 'my-new-type', 
        name: 'My New Type', 
        icon: '🎯', 
        color: 'bg-indigo-100',
        description: 'Description of what this does'
    },
];
```

### Step 4: Add to NeuraApp Router

```typescript
// src/NeuraApp.tsx

import MyNewType from './components/neura/project-types/my-new-type/MyNewType';

// In renderProjectComponent():
case 'my-new-type':
    return <MyNewType onBack={handleBackToDashboard} />;
```

**That's it!** Your new project type is now fully integrated. 🎉

---

## 🎨 Styling Guidelines

### Using Neura Theme Colors

```tsx
// Purple primary button
<button className="neura-button-primary">
  Click Me
</button>

// Purple secondary button
<button className="neura-button-secondary">
  Click Me
</button>

// Purple gradient background
<div className="neura-gradient">
  Content
</div>

// Card with shadow
<div className="neura-card">
  Content
</div>

// Input with purple focus
<input className="neura-input" />
```

### Using Tailwind Purple Classes

```tsx
// Background colors
bg-[#6b21a8]      // Primary purple
bg-purple-50      // Very light
bg-purple-100     // Light
bg-purple-600     // Medium
bg-purple-800     // Dark

// Text colors
text-purple-600
text-purple-700
text-purple-800

// Border colors
border-purple-300
border-purple-400
```

---

## 🧩 Reusable Components

### ProjectHeader

```tsx
<ProjectHeader
  icon="📸"
  title="My Project"
  onBack={() => goBack()}
  onSave={() => saveProject()}
  onUploadFolder={() => uploadFolder()}
/>
```

### TrainButton

```tsx
<TrainButton
  onClick={() => train()}
  isTraining={isTraining}
  disabled={!canTrain}
/>
```

### WebcamCapture

```tsx
<WebcamCapture
  onCapture={(imageData) => handleCapture(imageData)}
  isActive={isCapturing}
  className="w-full"
/>
```

### SampleUploader

```tsx
<SampleUploader
  onUpload={(files) => handleFiles(files)}
  accept="image/*"
  multiple={true}
/>
```

---

## 📊 Working with Project Data

### Creating a New Project

```typescript
const newProject: NeuraProject = {
  id: Date.now().toString(),
  type: 'image-classifier',
  name: 'My First Project',
  classes: [
    {
      id: '1',
      name: 'Cat',
      color: 'red',
      samples: []
    },
    {
      id: '2',
      name: 'Dog',
      color: 'blue',
      samples: []
    }
  ],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  modelTrained: false,
};
```

### Adding Samples

```typescript
const newSample: Sample = {
  id: Date.now().toString(),
  type: 'image',
  data: 'data:image/jpeg;base64,...', // base64 image data
  timestamp: Date.now(),
};

// Add to class
const updatedClasses = classes.map(c => 
  c.id === classId 
    ? { ...c, samples: [...c.samples, newSample] }
    : c
);
```

### Training a Model

```typescript
const trainModel = async () => {
  setIsTraining(true);
  
  try {
    // Your ML training logic here
    // For example, using TensorFlow.js
    
    const accuracy = await performTraining(classes);
    setAccuracy(accuracy);
    setModelTrained(true);
  } catch (error) {
    console.error('Training failed:', error);
  } finally {
    setIsTraining(false);
  }
};
```

---

## 🔌 Integration with TensorFlow.js

### Example: Image Classification Training

```typescript
import * as tf from '@tensorflow/tfjs';

async function trainImageClassifier(classes: ClassData[]) {
  // 1. Prepare data
  const images = [];
  const labels = [];
  
  classes.forEach((classData, classIndex) => {
    classData.samples.forEach(sample => {
      images.push(sample.data);
      labels.push(classIndex);
    });
  });

  // 2. Create model
  const model = tf.sequential({
    layers: [
      tf.layers.conv2d({
        inputShape: [224, 224, 3],
        filters: 32,
        kernelSize: 3,
        activation: 'relu',
      }),
      tf.layers.maxPooling2d({ poolSize: 2 }),
      tf.layers.flatten(),
      tf.layers.dense({ units: 128, activation: 'relu' }),
      tf.layers.dense({ units: classes.length, activation: 'softmax' }),
    ],
  });

  // 3. Compile model
  model.compile({
    optimizer: 'adam',
    loss: 'sparseCategoricalCrossentropy',
    metrics: ['accuracy'],
  });

  // 4. Train model
  const history = await model.fit(imagesTensor, labelsTensor, {
    epochs: 50,
    validationSplit: 0.2,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        console.log(`Epoch ${epoch}: loss = ${logs.loss}`);
      },
    },
  });

  // 5. Return accuracy
  return history.history.acc[history.history.acc.length - 1] * 100;
}
```

---

## 🎯 Best Practices

### 1. Component Structure

```
project-type/
├── MyProjectType.tsx          # Main component
├── components/                # Sub-components
│   ├── LeftPanel.tsx
│   ├── RightPanel.tsx
│   └── SpecificFeature.tsx
└── hooks/                     # Custom hooks
    └── useMyProjectType.ts
```

### 2. State Management

Use custom hooks for complex state:

```typescript
// ✅ Good
const { classes, addClass, deleteClass } = useImageClassifier();

// ❌ Avoid
const [classes, setClasses] = useState([]);
const [isTraining, setIsTraining] = useState(false);
const [accuracy, setAccuracy] = useState();
// ... lots of state
```

### 3. Styling

Use Tailwind classes with Neura theme:

```tsx
// ✅ Good
<button className="bg-[#6b21a8] text-white px-6 py-2 rounded-2xl hover:bg-[#7c3aed]">
  Train
</button>

// ✅ Also good
<button className="neura-button-primary">
  Train
</button>

// ❌ Avoid inline styles
<button style={{ backgroundColor: '#6b21a8' }}>
  Train
</button>
```

### 4. Error Handling

Always handle errors gracefully:

```typescript
try {
  await trainModel();
} catch (error) {
  console.error('Training failed:', error);
  setError('Failed to train model. Please try again.');
}
```

---

## 🐛 Debugging Tips

### Check Component Props

```typescript
console.log('Classes:', classes);
console.log('Is Training:', isTraining);
console.log('Accuracy:', accuracy);
```

### Verify State Updates

```typescript
useEffect(() => {
  console.log('Classes updated:', classes);
}, [classes]);
```

### Test with Mock Data

```typescript
const mockProject: NeuraProject = {
  id: '1',
  type: 'image-classifier',
  name: 'Test Project',
  classes: [
    { id: '1', name: 'Cat', color: 'red', samples: [] },
    { id: '2', name: 'Dog', color: 'blue', samples: [] },
  ],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  modelTrained: false,
};
```

---

## 📚 Additional Resources

### Tailwind CSS
- [Tailwind Documentation](https://tailwindcss.com/docs)
- [Tailwind Colors](https://tailwindcss.com/docs/customizing-colors)

### TensorFlow.js
- [TensorFlow.js Guide](https://www.tensorflow.org/js/guide)
- [Image Classification Tutorial](https://www.tensorflow.org/js/tutorials/transfer/image_classification)

### React Hooks
- [React Hooks Documentation](https://react.dev/reference/react)
- [Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)

---

## 🎉 You're Ready!

You now have everything you need to:
- ✅ Use existing Neura components
- ✅ Create new project types
- ✅ Customize the UI
- ✅ Integrate ML models
- ✅ Debug issues

Happy coding! 🚀
