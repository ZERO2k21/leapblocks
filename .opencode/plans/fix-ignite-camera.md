# Fix: Camera Not Opening in Ignite Workspace

## Problem
When clicking Start with `camera on` block, the camera doesn't open in the Ignite sprite panel. Blocks execute but no video stream appears.

## Root Cause — Three Broken Links

1. `window.hpCameraToggle` is never defined → generated code silently no-ops
2. `window.__setCameraOn` is never defined → face_detection camera blocks also no-op
3. `setFaceVideoElement()` never called → runtime video refs stay null, detection loops exit immediately

## Fix — Two Files

### File 1: `src/leapignite/client/hooks/useJuniorWindowActions.js`

Add camera window functions that the generated code calls:

```javascript
// Camera toggle — bridges generated code to React state
window.__setCameraOn = async (on) => {
    if (window.setCameraOn) window.setCameraOn(on);
};
window.hpCameraToggle = window.__setCameraOn;
window.fdCameraToggle = window.__setCameraOn;
```

### File 2: `src/leapignite/client/JuniorApp.jsx`

Add camera infrastructure that mirrors IntermediateApp's Stage.tsx:

1. Add `isCameraOn` state + `cameraVideoRef`
2. Add hidden `<video ref={cameraVideoRef} autoPlay playsInline muted style={{display:'none'}}>` in the DOM
3. Expose `window.setCameraOn = (on) => setIsCameraOn(on)`
4. Add useEffect watching `isCameraOn`:
   - When true: call `navigator.mediaDevices.getUserMedia({video: true})`, set `cameraVideoRef.current.srcObject = stream`, call `setFaceVideoElement(cameraVideoRef.current)`
   - When false: stop stream tracks, set `setFaceVideoElement(null)`
5. Cleanup on unmount: stop stream, setFaceVideoElement(null)

### What stays unchanged
- All block definitions and generators
- IntermediateApp (Embed)
- RuntimeBridge
- Extension library UIs

### Verification
- Add hand_pose or face_detection extension in Ignite
- Click Start with `camera on` block
- Camera should open in sprite panel area
- Detection blocks should now work (emotion/face count/hand landmarks)
