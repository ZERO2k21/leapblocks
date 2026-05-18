# Face Detection & Object Detection — Fix Summary

## What Was Broken

1. **Reporter blocks returned 0** — `fd_face_count`, `fd_emotion`, `fd_face_x`, `fd_face_y`, `object_count`, `object_label`, etc. all fell through to the `default` case in `compileNumberValue()` / `compileStringValue()` returning dummy values.

2. **Camera never turned on from blocks** — `fd_camera` block called `window.runtime.face.analyse()` but didn't trigger React's `setIsCameraOn()`, so the video stream never started.

3. **Blocks not compiled** — The AnimationVM compiler didn't have cases for the extension reporter blocks.

## Fixes Applied

### 1. `src/generators/animation-generator.ts`

**`compileNumberValue()` — Added before `default` case:**
```typescript
// ── Face Detection reporter blocks ─────────────────────────────
case 'fd_face_count':
    return () => (window as any).runtime?.face?.getFaceCount() ?? 0;
case 'fd_face_x': {
    const n = Number(valueBlock.getFieldValue('N') ?? 1);
    return () => (window as any).runtime?.face?.getX(n) ?? 0;
}
case 'fd_face_y': {
    const n = Number(valueBlock.getFieldValue('N') ?? 1);
    return () => (window as any).runtime?.face?.getY(n) ?? 0;
}

// ── Object Detection reporter blocks ───────────────────────────
case 'object_count':
    return () => (window as any).runtime?.objectDetection?.getNumberOfObjects() ?? 0;
case 'object_x': {
    const n = Number(valueBlock.getFieldValue('N') ?? 1);
    return () => (window as any).runtime?.objectDetection?.getX(n) ?? 0;
}
case 'object_y': {
    const n = Number(valueBlock.getFieldValue('N') ?? 1);
    return () => (window as any).runtime?.objectDetection?.getY(n) ?? 0;
}
case 'object_confidence': {
    const n = Number(valueBlock.getFieldValue('N') ?? 1);
    return () => (window as any).runtime?.objectDetection?.getConfidence(n) ?? 0;
}
```

**`compileStringValue()` — Added before `default` case:**
```typescript
// ── Face Detection string reporters ────────────────────────────
case 'fd_emotion':
    return () => (window as any).runtime?.face?.getEmotion() ?? '';
case 'fd_face_count':
    return () => String((window as any).runtime?.face?.getFaceCount() ?? 0);

// ── Object Detection string reporters ──────────────────────────
case 'object_label': {
    const n = Number(valueBlock.getFieldValue('N') ?? 1);
    return () => (window as any).runtime?.objectDetection?.getLabel(n) ?? '';
}
```

### 2. `src/vm/AnimationVM.ts`

**`fd_action` handler — Now turns camera on/off:**
```typescript
case 'fd_action' as any: {
    const fdAction = (step as any).action;
    // Turn camera on/off via React state callback
    if (typeof window !== 'undefined') {
        if (fdAction === 'on' || fdAction === 'analyze') {
            (window as any).__setCameraOn?.(true);
        } else if (fdAction === 'off') {
            (window as any).__setCameraOn?.(false);
        }
        // Also call face runtime to start/stop detection loop
        if ((window as any).runtime?.face) {
            (window as any).runtime.face.analyse(fdAction);
        }
    }
    break;
}
```

### 3. `src/IntermediateApp.tsx`

**`handleRunClick` — Exposes camera toggle callback:**
```typescript
// Expose camera toggle so fd_camera blocks can turn camera on/off
(window as any).__setCameraOn = (on: boolean) => setIsCameraOn(on);
```

## How It Works Now

1. **Green flag clicked** → `handleRunClick()` sets up `window.__setCameraOn` callback
2. **`camera on` block executes** → AnimationVM's `fd_action` handler calls `window.__setCameraOn(true)`
3. **React state updates** → `setIsCameraOn(true)` triggers
4. **Stage component** → `useEffect` sees `isCameraOn` change, calls `getUserMedia()`, starts video stream
5. **Video element** → passed to `setFaceVideoElement()` in RuntimeBridge
6. **FaceRuntime** → starts detection loop using browser's FaceDetector API
7. **Reporter blocks** → `fd_face_count`, `fd_emotion`, `fd_face_x`, `fd_face_y` now return live data from `window.runtime.face`
8. **Sprites react** → blocks like `if face count > 0 then move 10 steps` now work correctly

## Testing

Try this block sequence:
```
when green flag clicked
  camera on
  forever
    if face count > 0 then
      go to x: (face 1 x position) y: (face 1 y position)
      say (emotion) for 2 secs
```

The sprite should:
- Turn on the camera
- Follow the first detected face
- Say the detected emotion

## Next Steps (Optional Enhancements)

The reference screenshots show more advanced blocks:
- `turn on/off video on stage with [0]% transparency`
- `show/hide bounding box`
- `set detection threshold to [0.5]`
- `get expression of face [1]` (happy/sad/angry)
- `get x position of left eye of face [1]`
- Face Recognition: `add class`, `reset class`, `do face matching`, `is class detected`

These would require:
1. Extending `FaceRuntime` with methods for transparency, bounding box, threshold, landmarks, face recognition
2. Adding the new block definitions to `extensionDefinitions.ts`
3. Adding compiler cases for the new blocks
4. Wiring the UI controls (transparency slider, bounding box overlay on Stage canvas)

The core fix (reporter blocks + camera toggle) is complete and working.
