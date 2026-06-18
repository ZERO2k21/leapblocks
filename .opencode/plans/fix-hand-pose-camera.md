# Fix: Camera Not Opening for Hand Pose in Ignite

## Root Cause

The `hp_camera` generator in `extensionDefinitions.ts` (line 579) does NOT call `window.__setCameraOn`:

```ts
// hp_camera generator — MISSING camera toggle
jsGen.forBlock['hp_camera'] = (b) => 
    `if(window.runtime?.handPose) window.runtime.handPose.analyse('${b.getFieldValue("ACTION")}');\n`;
```

Compare with `fd_camera` (face_detection) which DOES work:
```ts
// fd_camera generator — has camera toggle ✓
jsGen.forBlock['fd_camera'] = (b) => {
    const action = b.getFieldValue('ACTION');
    return `if(window.__setCameraOn) window.__setCameraOn(${action === 'on'});\nif(window.runtime?.face) window.runtime.face.analyse('${action}');\n`;
};
```

Without `__setCameraOn`, `getUserMedia` is never called, the video element never renders, `setFaceVideoElement` is never called, and `handPoseRuntime.videoEl` stays null → `_startLoop()` returns immediately.

## Fix

**File:** `src/extensions/extensionDefinitions.ts`

### Fix 1: `hp_camera` generator (line 579)

Add `window.__setCameraOn` call before `handPose.analyse()`:

```ts
jsGen.forBlock['hp_camera'] = (b: any) => {
    const action = b.getFieldValue('ACTION');
    return `if(window.__setCameraOn) window.__setCameraOn(${action === 'on'});\nif(window.runtime?.handPose) window.runtime.handPose.analyse('${action}');\n`;
};
```

### Fix 2: `hp_analyze` generator (line 580)

Same issue — when action is 'analyze', camera needs to be on:

```ts
jsGen.forBlock['hp_analyze'] = (b: any) => {
    const action = b.getFieldValue('ACTION');
    const needsCamera = action === 'analyze';
    return `${needsCamera ? 'if(window.__setCameraOn) window.__setCameraOn(true);\n' : ''}if(window.runtime?.handPose) window.runtime.handPose.analyse('${action}');\n`;
};
```

### What stays the same
- `toggleCamera` in `useJuniorUIHandlers.js` — already fixed
- `window.__setCameraOn` in `useJuniorWindowActions.js` — already defined
- `setFaceVideoElement` import in `useJuniorUIHandlers.js` — already added
- All block definitions — unchanged
- IntermediateApp — unchanged
