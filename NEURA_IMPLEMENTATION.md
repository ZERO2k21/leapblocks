# Neura ML Studio - Implementation Guide

## Overview
Neura is a complete machine learning project system integrated into LeapLab, allowing users to create, train, and test various ML models with an intuitive visual interface.

## Architecture

### Folder Structure
```
src/
├── NeuraApp.tsx                          # Main Neura application component
├── types/
│   └── neura.types.ts                    # TypeScript type definitions
├── styles/
│   └── neura-theme.css                   # Purple-themed Tailwind styles
└── components/neura/
    ├── dashboard/
    │   ├── MyProjectsHeader.tsx          # Dashboard header with "New Project" button
    │   ├── EmptyStateIllustration.tsx    # Empty state with animated icons
    │   └── ProjectCard.tsx               # Individual project card component
    ├── create-project/
    │   ├── CreateProjectModal.tsx        # Modal for selecting project type
    │   └── ProjectTypeCard.tsx           # Individual project type card
    ├── project-types/
    │   ├── image-classifier/
    │   │   ├── ImageClassifier.tsx       # Main image classifier component
    │   │   ├── components/
    │   │   │   ├── ClassSection.tsx      # Class with samples management
    │   │   │   ├── TrainingPanel.tsx     # Training controls and accuracy
    │   │   │   └── TestingPanel.tsx      # Testing with webcam/upload
    │   │   └── hooks/
    │   │       └── useImageClassifier.ts # (Future) Custom hook for ML logic
    │   ├── object-detection/             # Placeholder for future implementation
    │   ├── pose-classifier/              # Placeholder for future implementation
    │   ├── hand-pose-classifier/         # Placeholder for future implementation
    │   ├── audio-classifier/             # Placeholder for future implementation
    │   ├── numbers-cr/                   # Placeholder for future implementation
    │   └── text-classifier/              # Placeholder for future implementation
    └── common/                            # (Future) Shared components
        ├── ProjectHeader.tsx
        ├── TrainButton.tsx
        ├── WebcamCapture.tsx
        └── SidebarNav.tsx
```

## Features Implemented

### ✅ Dashboard (Image 1)
- **My Projects Header**: Title, description, and "New Project" button
- **Empty State**: Animated illustration with floating icons (📸🎵🤖✨)
- **Project Grid**: Responsive grid layout for project cards
- **Project Cards**: Display project type, name, class count, training status, and accuracy

### ✅ Create Project Modal (Image 2)
- **Purple Header**: "Create New Project" with back button
- **Project Type Grid**: 4-column responsive grid
- **7 Project Types**:
  1. 📸 Image Classifier (Orange)
  2. 🐱 Object Detection (Yellow)
  3. 🤸 Pose Classifier (Blue)
  4. ✋ Hand Pose Classifier (Pink)
  5. 🎵 Audio Classifier (Green)
  6. 🔢 Numbers CR (Purple)
  7. 📝 Text Classifier (Red)

### ✅ Image Classifier (Image 3)
- **Purple Top Bar**: Icon, title, "Upload Classes from Folder", "Save Project" buttons
- **Left Panel (2/3 width)**:
  - Class sections with color indicators
  - Sample grid (4 columns)
  - Webcam and Upload buttons per class
  - Add Class button
- **Right Panel (1/3 width)**:
  - **Training Section**:
    - Epochs slider (10-200)
    - Train Model button with loading state
    - Accuracy display (green badge)
    - Training tips
  - **Testing Section**:
    - Webcam preview placeholder
    - Webcam and Upload test buttons
    - Prediction results with confidence bar
    - Testing info

## Integration with LeapLab

### App.tsx Changes
```typescript
// Added Neura to AppMode type
type AppMode = '... | neura';

// Added lazy import
const NeuraApp = lazy(() => import('./NeuraApp'));

// Added route
{mode === 'neura' && <NeuraApp onBack={() => setMode('home')} />}
```

### LandingPage.tsx Changes
```typescript
// Changed Neura card from "Coming Soon" to active
onClick={() => handleCardClick(() => onSelect('neura'))}
```

## Design System

### Color Palette
- **Primary Purple**: `#6b21a8` (Deep purple for headers, buttons)
- **Accent Purple**: `#a855f7` (Light purple for hover states)
- **Hover Purple**: `#7c3aed` (Button hover)
- **Light Purple**: `#f3e8ff` (Backgrounds)
- **Dark Purple**: `#581c87` (Dark accents)

### Tailwind Classes
- `.neura-gradient`: Purple gradient background
- `.neura-card`: White card with rounded corners and shadow
- `.neura-button-primary`: Purple button with hover effect
- `.neura-button-secondary`: White button with purple border
- `.neura-input`: Input field with purple focus ring

### Typography
- **Headers**: Bold, 2xl-3xl size
- **Body**: Regular, sm-base size
- **Buttons**: Semibold, sm-base size

## TypeScript Types

```typescript
export type ProjectType = 
  | 'image-classifier'
  | 'object-detection'
  | 'pose-classifier'
  | 'hand-pose-classifier'
  | 'audio-classifier'
  | 'numbers-cr'
  | 'text-classifier';

export interface NeuraProject {
  id: string;
  type: ProjectType;
  name: string;
  classes: ClassData[];
  createdAt: number;
  updatedAt: number;
  modelTrained: boolean;
  accuracy?: number;
}

export interface ClassData {
  id: string;
  name: string;
  color: string;
  samples: Sample[];
}

export interface Sample {
  id: string;
  type: 'image' | 'audio' | 'text';
  data: string; // base64 or URL
  timestamp: number;
}
```

## Navigation Flow

```
Landing Page
    ↓ (Click Neura)
Dashboard (Empty State or Project List)
    ↓ (Click "New Project")
Create Project Modal
    ↓ (Select Project Type)
Project Editor (e.g., Image Classifier)
    ↓ (Click "Back" or "Save")
Dashboard (Updated with new project)
```

## Future Enhancements

### Phase 2: ML Integration
- [ ] Integrate TensorFlow.js for actual model training
- [ ] Implement webcam capture functionality
- [ ] Add file upload with drag-and-drop
- [ ] Implement model export/import
- [ ] Add real-time prediction

### Phase 3: Additional Project Types
- [ ] Complete Object Detection implementation
- [ ] Complete Pose Classifier implementation
- [ ] Complete Hand Pose Classifier implementation
- [ ] Complete Audio Classifier implementation
- [ ] Complete Numbers CR implementation
- [ ] Complete Text Classifier implementation

### Phase 4: Advanced Features
- [ ] Project templates and examples
- [ ] Model performance analytics
- [ ] Batch testing and evaluation
- [ ] Model versioning
- [ ] Collaborative features
- [ ] Export to Python/JavaScript code

### Phase 5: Common Components
- [ ] Reusable WebcamCapture component
- [ ] Reusable ProjectHeader component
- [ ] Reusable TrainButton component
- [ ] Reusable SidebarNav component

## Testing

### Manual Testing Checklist
- [ ] Navigate from Landing Page to Neura
- [ ] View empty dashboard
- [ ] Click "New Project" button
- [ ] Select each project type
- [ ] Image Classifier: Add/remove classes
- [ ] Image Classifier: Rename classes
- [ ] Image Classifier: Adjust epochs slider
- [ ] Image Classifier: Click "Train Model"
- [ ] Image Classifier: View accuracy display
- [ ] Navigate back to dashboard
- [ ] Responsive design on mobile/tablet/desktop

## Build and Run

```bash
# Development
npm run dev:web

# Production build
npm run build:web

# Preview production build
npm run preview:web
```

## Dependencies

All dependencies are already included in the project:
- React 18+
- TypeScript
- Tailwind CSS
- Vite

## Notes

- The current implementation is UI-only with simulated training
- Actual ML functionality requires TensorFlow.js integration
- All components are fully responsive and follow Tailwind best practices
- The design matches the PictoBlox purple theme
- Error boundaries are handled at the App level

## Credits

**Copyright © 2026 Creoleap Technologies Pvt. Ltd.**
All rights reserved. Proprietary and confidential.
