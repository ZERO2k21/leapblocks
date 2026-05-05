# ClassCard Integration Guide

## Overview
The ClassCard component has been upgraded with modern Tailwind CSS styling and enhanced functionality. This document outlines the changes and how to use the new component.

## New Features

### 1. **Modern Tailwind Styling**
- Colorful header with 6 predefined color schemes (red, teal, violet, orange, pink, blue)
- Clean, card-based design with proper spacing and shadows
- Responsive layout with split sections for actions and previews

### 2. **Inline Editing**
- Click the edit icon to rename classes inline
- Press Enter to save, Escape to cancel
- Auto-focus on edit mode

### 3. **Enhanced Sample Management**
- Visual thumbnail previews (up to 10 shown)
- "+N" indicator for additional samples
- Support for both file upload and webcam capture
- Hidden file input with proper ref handling

### 4. **Flexible API**
- Works with both controlled and uncontrolled upload patterns
- Optional `onUpload` prop for custom upload handling
- Built-in file handling with `onAddSamples` callback

## Component API

```jsx
<ClassCard
  classData={{
    id: number | string,
    name: string,
    samples: Array<{ preview: string }> // dataURL or blob URL
  }}
  index={number}                    // For color selection (0-5 cycles)
  onRename={(classId, newName) => void}
  onDelete={(classId) => void}
  onAddSamples={(classId, dataURL) => void}  // Called for each file
  onWebcam={(classId) => void}
  onUpload={(classId) => void}      // Optional: custom upload handler
  showImagePreviews={boolean}       // Default: true
/>
```

## Migration Guide

### Old API (Before)
```jsx
<ClassCard
  classData={cls}
  color={cls.color}              // ❌ Removed
  onWebcam={() => {...}}
  onUpload={() => {...}}
  onDelete={() => handleDelete(cls.id)}
/>
```

### New API (After)
```jsx
<ClassCard
  classData={cls}
  index={index}                  // ✅ Added for color
  onRename={handleRename}        // ✅ Added
  onDelete={handleDelete}        // ✅ Simplified
  onAddSamples={handleAddSamples} // ✅ Added
  onWebcam={handleWebcam}        // ✅ Simplified
  onUpload={handleUpload}        // ✅ Optional
  showImagePreviews={true}       // ✅ Added
/>
```

## State Structure Changes

### Old Structure
```javascript
const [classes, setClasses] = useState([
  { id: 0, name: 'Class 1', samples: [], color: '#FF6B6B' },
  { id: 1, name: 'Class 2', samples: [], color: '#4ECDC4' },
]);
```

### New Structure
```javascript
const [classes, setClasses] = useState([
  { id: 1, name: 'Class 1', samples: [] },  // No color needed
  { id: 2, name: 'Class 2', samples: [] },
]);

// Samples structure
samples: [
  { preview: 'data:image/png;base64,...' },  // dataURL
  { preview: 'blob:http://...' },            // blob URL
]
```

## Required Handler Updates

### 1. Add Rename Handler
```javascript
const handleRenameClass = (classId, newName) => {
  setClasses(classes.map(cls =>
    cls.id === classId ? { ...cls, name: newName } : cls
  ));
};
```

### 2. Add Samples Handler
```javascript
const handleAddSamples = (classId, dataURL) => {
  setClasses(classes.map(cls => {
    if (cls.id === classId) {
      return {
        ...cls,
        samples: [...cls.samples, { preview: dataURL }],
      };
    }
    return cls;
  }));
};
```

### 3. Update Add Class Handler
```javascript
const handleAddClass = () => {
  const newClass = {
    id: Date.now(),  // Use timestamp for unique ID
    name: `Class ${classes.length + 1}`,
    samples: [],
    // No color property needed
  };
  setClasses([...classes, newClass]);
};
```

### 4. Simplify Delete Handler
```javascript
const handleDeleteClass = (classId) => {
  if (classes.length <= 2) {
    alert('You need at least 2 classes');
    return;
  }
  setClasses(classes.filter(c => c.id !== classId));
};
```

## Color Scheme

The component automatically cycles through 6 color schemes based on the `index` prop:

| Index | Header Color | Light BG | Border | Dot Color |
|-------|-------------|----------|--------|-----------|
| 0     | Red         | Red-50   | Red-200| #ef4444   |
| 1     | Teal        | Teal-50  | Teal-200| #14b8a6  |
| 2     | Violet      | Violet-50| Violet-200| #8b5cf6 |
| 3     | Orange      | Orange-50| Orange-200| #f97316 |
| 4     | Pink        | Pink-50  | Pink-200| #ec4899  |
| 5     | Blue        | Blue-50  | Blue-200| #3b82f6  |

## Files Updated

- ✅ `neura-ml/components/ClassCard.jsx` - Component implementation
- ✅ `neura-ml/classifiers/image-classifier/ImageClassifier.jsx` - Full integration
- ⏳ `neura-ml/classifiers/audio-classifier/AudioClassifier.jsx` - Pending
- ⏳ `neura-ml/classifiers/pose-classifier/PoseClassifier.jsx` - Pending
- ⏳ `neura-ml/classifiers/hand-pose-classifier/HandPoseClassifier.jsx` - Pending
- ⏳ `neura-ml/classifiers/text-classifier/TextClassifier.jsx` - Pending

## Testing Checklist

- [ ] Class renaming works (inline edit)
- [ ] File upload adds samples with previews
- [ ] Webcam capture adds samples
- [ ] Delete class works (with 2-class minimum)
- [ ] Add class creates new class with correct color
- [ ] Sample count displays correctly
- [ ] Thumbnail previews show (max 10)
- [ ] "+N" indicator shows for >10 samples
- [ ] Colors cycle correctly through all 6 schemes
- [ ] Responsive layout works on different screen sizes

## Notes

- The component uses Tailwind CSS classes - ensure Tailwind is properly configured
- File input is hidden and triggered via ref
- Colors are managed internally - no need to track in state
- Sample previews support both dataURL and blob URL formats
- The component is fully controlled - parent manages all state
