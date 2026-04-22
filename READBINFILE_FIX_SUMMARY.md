# readBinFile Fix - Quick Summary

## Problem
```
TypeError: window.electronAPI.readBinFile is not a function
```

## Root Cause
The project has TWO preload scripts:
- ❌ `electron/preload.js` (legacy, has readBinFile, NOT used in build)
- ✅ `src/preload.ts` (actual source, missing readBinFile, USED in build)

electron-vite compiles `src/preload.ts` → `dist/preload/preload.js`

## Fix Applied

### 1. Added to src/preload.ts (line ~95)
```typescript
// ── Read compiled .bin file for ESP32-C3 firmware scanner ────────────
readBinFile: (filePath: string): Promise<ArrayBuffer> => {
    console.log('[PRELOAD] readBinFile called', { filePath });
    return ipcRenderer.invoke('read-bin-file', filePath);
},
```

### 2. Added TypeScript type (line ~260)
```typescript
// ESP32-C3 RISC-V firmware scanner
readBinFile: (filePath: string) => Promise<ArrayBuffer>;
```

### 3. Updated electron/main.js (line ~96)
```javascript
preload: isDev 
    ? path.join(__dirname, '../dist/preload/preload.js')
    : path.join(__dirname, '../preload/preload.js'),
```

### 4. Rebuilt
```bash
npm run build:electron
```

## Result
✅ `dist/preload/preload.js` now has readBinFile
✅ ESP32-C3 firmware scanner can load .bin files
✅ No more "readBinFile is not a function" error

## Test
Restart the app and compile an ESP32 sketch. The error should be gone.
