# Fix: Camera Not Opening in Ignite — Video Element Ordering

## Root Cause

In `toggleCamera()`, `getUserMedia` is called first, then the stream is attached to `cameraVideoRef.current`. But the `<video>` element is conditionally rendered with `{isCameraOn && (<video .../>)}`, so when `isCameraOn` is false, `cameraVideoRef.current` is null — the stream is never attached.

## Fix

**File:** `src/leapignite/client/hooks/useJuniorUIHandlers.js`

Change `toggleCamera` to:
1. Call `setIsCameraOn(true)` FIRST (renders the `<video>` element)
2. Wait 50ms for React to commit the render
3. THEN call `getUserMedia` and attach stream to `cameraVideoRef.current`
4. THEN call `setFaceVideoElement(cameraVideoRef.current)` to wire runtimes
