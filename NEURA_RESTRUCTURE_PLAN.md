# 🔄 Neura Restructuring Plan

## 📋 Overview
Restructuring Neura files from scattered locations into a unified `src/leapNeura` structure following the same pattern as other modules (leapEmbed, leapCodex, leapIgnite).

## 🎯 Goals
1. ✅ Consolidate all Neura files into `src/leapNeura`
2. ✅ Separate client (frontend) and server (backend) code
3. ✅ Convert all filenames to camelCase
4. ✅ Maintain working condition without breaking logic
5. ✅ Follow existing module patterns

## 📁 Current Structure → New Structure

### Current Locations:
```
neura-ml/                           # Standalone module
src/NeuraApp.tsx                    # Main entry
src/app/neura/                      # Some components
src/components/neura/               # UI components
src/styles/neura-theme.css          # Styles
src/types/neura.d.ts                # Types
src/types/neura.types.ts            # Type definitions
```

### New Structure:
```
src/leapNeura/
├── client/                         # Frontend code
│   ├── neuraApp.tsx               # Main app (renamed from NeuraApp.tsx)
│   ├── components/                # UI components
│   │   ├── common/
│   │   │   ├── projectHeader.tsx
│   │   │   ├── classCard.tsx
│   │   │   ├── classifierLayout.tsx
│   │   │   ├── testingPanel.tsx
│   │   │   ├── trainingPanel.tsx
│   │   │   └── webcamModal.tsx
│   │   ├── dashboard/
│   │   │   ├── myProjectsHeader.tsx
│   │   │   ├── emptyStateIllustration.tsx
│   │   │   └── projectCard.tsx
│   │   ├── createProject/
│   │   │   └── createProjectModal.tsx
│   │   └── classifiers/
│   │       ├── imageClassifier/
│   │       │   └── imageClassifier.tsx
│   │       ├── objectDetection/
│   │       │   └── objectDetection.tsx
│   │       ├── poseClassifier/
│   │       │   └── poseClassifier.tsx
│   │       ├── handPoseClassifier/
│   │       │   └── handPoseClassifier.tsx
│   │       ├── audioClassifier/
│   │       │   └── audioClassifier.tsx
│   │       ├── numbersClassifier/
│   │       │   └── numbersClassifier.tsx
│   │       └── textClassifier/
│   │           └── textClassifier.tsx
│   ├── hooks/
│   │   └── useTFClassifier.ts     # TensorFlow hook
│   ├── pages/
│   │   ├── classifierRouter.tsx
│   │   ├── createProjectPage.tsx
│   │   └── myProjectsPage.tsx
│   ├── styles/
│   │   └── neuraTheme.css         # Renamed from neura-theme.css
│   └── types/
│       ├── neura.d.ts
│       └── neura.types.ts
├── server/                         # Backend code (future)
│   ├── modelStorage.ts            # Model persistence
│   ├── projectManager.ts          # Project CRUD
│   └── tfBackend.ts               # TensorFlow backend
├── shared/                         # Shared utilities
│   ├── constants.ts               # Shared constants
│   └── utils.ts                   # Utility functions
└── neura.ts                       # Module entry point
```

## 🔄 File Mapping

### Main Entry
- `src/NeuraApp.tsx` → `src/leapNeura/client/neuraApp.tsx`

### Components (from src/components/neura/)
- `common/ProjectHeader.tsx` → `client/components/common/projectHeader.tsx`
- `dashboard/MyProjectsHeader.tsx` → `client/components/dashboard/myProjectsHeader.tsx`
- `dashboard/EmptyStateIllustration.tsx` → `client/components/dashboard/emptyStateIllustration.tsx`
- `dashboard/ProjectCard.tsx` → `client/components/dashboard/projectCard.tsx`
- `create-project/CreateProjectModal.tsx` → `client/components/createProject/createProjectModal.tsx`

### Classifiers (from src/components/neura/project-types/)
- `image-classifier/ImageClassifier.tsx` → `client/components/classifiers/imageClassifier/imageClassifier.tsx`
- `object-detection/ObjectDetection.tsx` → `client/components/classifiers/objectDetection/objectDetection.tsx`
- `pose-classifier/PoseClassifier.tsx` → `client/components/classifiers/poseClassifier/poseClassifier.tsx`
- `hand-pose-classifier/HandPoseClassifier.tsx` → `client/components/classifiers/handPoseClassifier/handPoseClassifier.tsx`
- `audio-classifier/AudioClassifier.tsx` → `client/components/classifiers/audioClassifier/audioClassifier.tsx`
- `numbers-cr/NumbersCR.tsx` → `client/components/classifiers/numbersClassifier/numbersClassifier.tsx`
- `text-classifier/TextClassifier.tsx` → `client/components/classifiers/textClassifier/textClassifier.tsx`

### From neura-ml/
- `components/ClassCard.jsx` → `client/components/common/classCard.tsx`
- `components/ClassifierLayout.jsx` → `client/components/common/classifierLayout.tsx`
- `components/NeuraHeader.jsx` → `client/components/common/neuraHeader.tsx`
- `components/TestingPanel.jsx` → `client/components/common/testingPanel.tsx`
- `components/TrainingPanel.jsx` → `client/components/common/trainingPanel.tsx`
- `components/WebcamModal.jsx` → `client/components/common/webcamModal.tsx`
- `hooks/useTFClassifier.js` → `client/hooks/useTFClassifier.ts`
- `pages/ClassifierRouter.jsx` → `client/pages/classifierRouter.tsx`
- `pages/CreateProjectPage.jsx` → `client/pages/createProjectPage.tsx`
- `pages/MyProjectsPage.jsx` → `client/pages/myProjectsPage.tsx`

### Styles & Types
- `src/styles/neura-theme.css` → `client/styles/neuraTheme.css`
- `src/types/neura.d.ts` → `client/types/neura.d.ts`
- `src/types/neura.types.ts` → `client/types/neura.types.ts`

## 📝 Import Path Updates

### Before:
```typescript
import NeuraApp from './NeuraApp';
import { NeuraProject } from './types/neura.types';
import './styles/neura-theme.css';
import ProjectHeader from './components/neura/common/ProjectHeader';
```

### After:
```typescript
import NeuraApp from './leapNeura/client/neuraApp';
import { NeuraProject } from './leapNeura/client/types/neura.types';
import './leapNeura/client/styles/neuraTheme.css';
import ProjectHeader from './leapNeura/client/components/common/projectHeader';
```

## 🔧 Files to Update

### 1. Entry Points
- ✅ `src/App.tsx` - Update lazy import path
- ✅ `src/LandingPage.tsx` - Update import if used
- ✅ `src/renderer.tsx` - Check for any imports

### 2. Internal Imports
- ✅ All files in `leapNeura/client/` - Update relative imports
- ✅ Component cross-references
- ✅ Type imports
- ✅ Style imports

### 3. Configuration Files
- ✅ `tsconfig.json` - Add path alias if needed
- ✅ `vite.web.config.ts` - Check for any Neura-specific config
- ✅ `electron.vite.config.ts` - Check for any Neura-specific config

## ⚠️ Critical Considerations

1. **Preserve Logic**: All component logic must remain unchanged
2. **Maintain State**: State management patterns stay the same
3. **Keep Dependencies**: TensorFlow.js and other deps unchanged
4. **Test Imports**: Verify all import paths resolve correctly
5. **CSS Classes**: Ensure CSS class names still match

## 🚀 Migration Steps

1. ✅ Create new directory structure
2. ✅ Copy files to new locations with renamed files
3. ✅ Update all import statements
4. ✅ Update export statements
5. ✅ Test compilation
6. ✅ Test runtime functionality
7. ✅ Remove old files after verification

## ✅ Verification Checklist

- [ ] All files moved to new structure
- [ ] All imports updated and resolving
- [ ] TypeScript compilation successful
- [ ] No runtime errors
- [ ] Neura app launches correctly
- [ ] All classifiers functional
- [ ] Webcam/audio access working
- [ ] Model training functional
- [ ] Project save/load working
- [ ] Navigation between views working
- [ ] Old files cleaned up

## 📦 Benefits

1. **Consistency**: Matches leapEmbed, leapCodex, leapIgnite patterns
2. **Organization**: Clear separation of concerns
3. **Scalability**: Easy to add server-side features
4. **Maintainability**: Easier to navigate and understand
5. **CamelCase**: Consistent naming convention
6. **Modularity**: Self-contained module structure

---

*This plan ensures a smooth transition while maintaining all existing functionality.*
