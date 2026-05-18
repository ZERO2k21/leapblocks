# LeapBlocks Extensions Guide

## Overview

LeapBlocks now supports dynamic extensions that add new block categories and functionality. This guide explains how the extension system works and how to use the newly implemented AI/ML extensions.

## Implemented Extensions

### 1. **Object Detection** 🐱
Identify objects from images or live camera using AI vision.

**Blocks:**
- `detect objects in camera` - Runs object detection on current camera frame
- `when [object] detected` - Event trigger when specific object is found
- `label of object (n)` - Returns the label name of the nth detected object
- `confidence of object (n)` - Returns confidence score (0-100)
- `x of object (n)` - Returns X coordinate
- `y of object (n)` - Returns Y coordinate
- `number of objects` - Returns total count of detected objects

**Usage:**
```
when green flag clicked
forever
  detect objects in camera
  if (number of objects) > 0 then
    say (label of object (1))
  end
end
```

### 2. **Music** 🎹
Play instruments, drums, and compose musical sequences with Web Audio API.

**Blocks:**
- `play note [60] for [0.25] beats` - Play MIDI note
- `set instrument [1]` - Set instrument (1-21)
- `play drum [1] for [0.25] beats` - Play drum sound
- `set tempo [60] bpm` - Set tempo
- `change tempo by [20]` - Adjust tempo
- `tempo` - Get current tempo
- `rest for [0.25] beats` - Pause playback

**Usage:**
```
when green flag clicked
set tempo 120 bpm
set instrument 1
play note 60 for 0.5 beats
play note 64 for 0.5 beats
play note 67 for 1 beats
```

## How to Add Extensions

### From the Extension Library:

1. Click the **"Extensions"** button (➕ icon) in the bottom-left corner
2. Browse available extensions by category:
   - 🤖 AI & Machine Learning
   - 🌐 IoT & Connectivity
   - 🎮 Games & Animation
   - 🛠️ Utilities
3. Click on an extension card to view details
4. Click **"➕ Add Blocks"** to add the extension to your project
5. The new category will appear in your blocks toolbox

### Programmatically:

Extensions can also be added via postMessage:

```javascript
window.postMessage({
    type: 'ADD_EXTENSION',
    extension: 'object_detection', // or 'music'
    extensionId: 'object_detection',
    title: 'Object Detection'
}, '*');
```

## Architecture

### Extension System Components:

1. **ExtensionManager** (`src/extensions/ExtensionManager.ts`)
   - Manages dynamic extension loading
   - Registers Blockly categories
   - Tracks loaded extensions

2. **Extension Definitions** (`src/extensions/`)
   - Block definitions (JSON)
   - Runtime implementations (TypeScript classes)
   - JavaScript code generators

3. **RuntimeBridge** (`src/runtime/RuntimeBridge.ts`)
   - Exposes extension runtimes via `window.runtime`
   - Connects blocks to actual functionality

4. **Extension HTML Pages** (`public/extensions/`)
   - User-facing extension detail pages
   - "Add Blocks" buttons that send postMessage

### Data Flow:

```
User clicks "Add Blocks"
  ↓
postMessage sent to parent window
  ↓
IntermediateApp receives message
  ↓
Extension blocks registered with Blockly
  ↓
New category appears in toolbox
  ↓
User drags blocks to workspace
  ↓
Code generator creates JavaScript
  ↓
Runtime executes via window.runtime.extensionName
```

## Creating New Extensions

### 1. Create Extension File

```typescript
// src/extensions/MyExtension.ts

import Blockly from '@blockly-runtime';
import type { ExtensionCategory } from './ExtensionManager';

// Define blocks
export const myBlocks = [
    {
        type: 'my_block',
        message0: 'do something %1',
        args0: [{ type: 'field_number', name: 'VALUE', value: 0 }],
        previousStatement: null,
        nextStatement: null,
        colour: '#FF6680'
    }
];

// Runtime implementation
export class MyRuntime {
    doSomething(value: number) {
        console.log('Doing something with', value);
    }
}

// Register blocks
export function registerMyBlocks() {
    const newBlocks = myBlocks.filter(block => !Blockly.Blocks[block.type]);
    if (newBlocks.length > 0) {
        Blockly.defineBlocksWithJsonArray(newBlocks);
    }
}

// JavaScript generators
export function registerMyGenerators() {
    const jsGen = (window as any).Blockly?.JavaScript;
    if (!jsGen) return;

    jsGen['my_block'] = (block: any) => {
        const value = block.getFieldValue('VALUE');
        return `window.runtime.myExtension.doSomething(${value});\n`;
    };
}

// Extension configuration
export const myExtension: ExtensionCategory = {
    id: 'my_extension',
    name: 'My Extension',
    colour: '#FF6680',
    icon: '✨',
    blocks: myBlocks.map(block => ({
        kind: 'block',
        type: block.type
    }))
};
```

### 2. Register in index.ts

```typescript
// src/extensions/index.ts

export {
    MyRuntime,
    myExtension,
    registerMyBlocks,
    registerMyGenerators
} from './MyExtension';

export function initializeExtensions() {
    // ... existing extensions
    registerMyBlocks();
    registerMyGenerators();
}
```

### 3. Add to RuntimeBridge

```typescript
// src/runtime/RuntimeBridge.ts

import { MyRuntime } from '../extensions/MyExtension';

export function initRuntime() {
    const myRuntime = new MyRuntime();
    
    (window as any).runtime = {
        // ... existing runtimes
        myExtension: myRuntime,
    };
}
```

### 4. Create HTML Page

```html
<!-- public/extensions/ext-my-extension.html -->
<!DOCTYPE html>
<html>
<head>
    <title>My Extension</title>
    <!-- Add styling -->
</head>
<body>
    <button onclick="addExtension()">➕ Add Blocks</button>
    
    <script>
        function addExtension() {
            window.parent.postMessage({
                type: 'ADD_EXTENSION',
                extension: 'my_extension',
                extensionId: 'my_extension',
                title: 'My Extension'
            }, '*');
        }
    </script>
</body>
</html>
```

### 5. Add to Extension Library

```javascript
// src/junior/components/JuniorExtensionLibrary.jsx

const EXTENSIONS = [
    // ... existing extensions
    { 
        id: 'my_extension', 
        name: 'My Extension', 
        description: 'Does something cool', 
        emoji: '✨', 
        color: 'linear-gradient(135deg,#FF6680,#FF8C9E)', 
        cat: 'games', 
        iconBg: '#FF6680', 
        icon: '🎨' 
    },
];

// In getIframeUrl function:
if (ext.id === 'my_extension') {
    return `/extensions/ext-my-extension.html`;
}
```

## Future Enhancements

### Planned Extensions:
- **Human Body Detection** - Pose estimation and gesture recognition
- **ML Environment** - Custom model loading and classification
- **Speech Recognition** - Voice-to-text conversion
- **Text Recognition (OCR)** - Read text from images

### Improvements:
- TensorFlow.js integration for real object detection
- MediaPipe for pose/hand tracking
- Better Web Audio synthesis for music
- Extension marketplace/repository
- Hot-reload for extension development

## Troubleshooting

### Extension blocks not appearing:
1. Check browser console for errors
2. Verify extension is registered in `initializeExtensions()`
3. Ensure postMessage is being received
4. Clear Vite cache: `rm -rf node_modules/.vite`

### Runtime errors:
1. Check `window.runtime` is initialized
2. Verify extension runtime is added to RuntimeBridge
3. Check code generator syntax
4. Look for TypeScript compilation errors

### Blocks not executing:
1. Verify JavaScript generator is registered
2. Check `window.runtime.extensionName` exists
3. Test runtime methods in browser console
4. Enable verbose logging in AnimationVM

## Resources

- [Blockly Documentation](https://developers.google.com/blockly)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [TensorFlow.js](https://www.tensorflow.org/js)
- [MediaPipe](https://mediapipe.dev/)

---

**Note:** The Object Detection and Music extensions are currently using simulated/basic implementations. For production use, integrate real ML models (TensorFlow.js COCO-SSD) and enhanced audio synthesis.
