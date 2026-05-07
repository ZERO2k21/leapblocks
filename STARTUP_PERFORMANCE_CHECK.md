# Startup Performance Diagnostic

## Current Status

The app has the following optimizations already in place:

### ✅ Optimizations Already Applied

1. **Google Fonts Non-Blocking** (`index.html`)
   ```html
   <link href="..." rel="stylesheet" media="print" onload="this.media='all'">
   ```
   - Fonts load asynchronously
   - Won't block page render

2. **Lazy Loading** (`App.tsx`)
   - All major components lazy loaded
   - LandingPage, IntermediateApp, JuniorApp, PythonApp, etc.
   - Load only when user navigates to them

3. **Prefetch Disabled** (`App.tsx`)
   - Heavy modules (Electra, Blockly) don't preload
   - Only load when user actually needs them

4. **Timing Logs** (`App.tsx`)
   - Performance timing logs to track load times
   - Check console for `[APP TIMING]` messages

---

## How to Diagnose Slow Startup

### Step 1: Check Console Timing Logs

After starting the app, open DevTools Console and look for:

```
[APP TIMING] 0.00ms - App.tsx module loaded
[APP TIMING] 5.23ms - Loader imported
[APP TIMING] 8.45ms - All lazy components defined
[APP TIMING] 12.67ms - App component function called
[APP TIMING] 15.89ms - App component mounted
[APP TIMING] 18.23ms - Mode changed to: home
[APP TIMING] 234.56ms - LandingPage lazy load started
[APP TIMING] 456.78ms - LandingPage lazy load completed
```

**Expected Times:**
- App module load: < 20ms
- LandingPage load: < 500ms
- **Total to interactive: < 1 second**

**If you see > 5 seconds:**
- Check network tab for slow font loading
- Check if any synchronous imports are blocking
- Check if Electron is slow to initialize

### Step 2: Check Network Tab

Open DevTools → Network tab:

1. **Fonts (Google Fonts)**
   - Should load in background (not blocking)
   - If taking > 2 seconds, fonts are blocking render
   - **Fix**: Already applied (media="print" onload)

2. **JavaScript Bundles**
   - `index.js` should load quickly (< 500ms)
   - Large bundles (> 1MB) may be slow
   - **Check**: Bundle sizes in build output

### Step 3: Check Electron Initialization

The slow startup might be **Electron itself**, not React:

**Common Causes:**
1. **Electron DevTools** - Opening DevTools on startup adds 2-3 seconds
2. **Antivirus Scanning** - Windows Defender may scan .exe files
3. **Cold Start** - First launch after reboot is slower
4. **Large node_modules** - Electron scans dependencies

**Test:**
```bash
# Build production version
npm run build:electron

# Run production build (faster than dev)
npm run start
```

---

## Quick Fixes to Try

### Fix 1: Disable DevTools Auto-Open (if enabled)

Check `src/index.ts` (main process):

```typescript
// Remove or comment out:
mainWindow.webContents.openDevTools();
```

### Fix 2: Add Splash Screen

Instead of blank screen, show a splash screen immediately:

**`index.html`:**
```html
<style>
  #splash {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 24px;
    font-weight: bold;
    z-index: 9999;
  }
</style>

<body>
  <div id="splash">
    <div>
      <div>LeapBlocks</div>
      <div style="font-size: 14px; margin-top: 10px;">Loading...</div>
    </div>
  </div>
  <div id="root"></div>
  <script>
    // Hide splash when React loads
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        const splash = document.getElementById('splash');
        if (splash) splash.style.display = 'none';
      }, 100);
    });
  </script>
  <script type="module" src="/src/renderer.tsx"></script>
</body>
```

### Fix 3: Optimize Electron Window Creation

**`src/index.ts`:**
```typescript
const mainWindow = new BrowserWindow({
  width: 1200,
  height: 800,
  show: false, // Don't show until ready
  backgroundColor: '#667eea', // Match splash color
  webPreferences: {
    preload: path.join(__dirname, '../preload/preload.js'),
    nodeIntegration: false,
    contextIsolation: true,
  },
});

// Show window when ready
mainWindow.once('ready-to-show', () => {
  mainWindow.show();
});
```

---

## Measuring Current Performance

### Test 1: Measure React Load Time

Add to `src/renderer.tsx`:

```typescript
const RENDER_START = performance.now();
console.log('[RENDER] Starting React render');

// After ReactDOM.render
console.log(`[RENDER] React rendered in ${(performance.now() - RENDER_START).toFixed(2)}ms`);
```

### Test 2: Measure Electron Window Creation

Add to `src/index.ts`:

```typescript
const ELECTRON_START = Date.now();
console.log('[ELECTRON] Starting window creation');

// After mainWindow.loadURL
console.log(`[ELECTRON] Window loaded in ${Date.now() - ELECTRON_START}ms`);
```

---

## Expected vs Actual Performance

| Stage | Expected | Acceptable | Slow |
|-------|----------|------------|------|
| Electron window creation | < 500ms | < 1s | > 2s |
| React bundle load | < 200ms | < 500ms | > 1s |
| LandingPage render | < 300ms | < 500ms | > 1s |
| **Total to interactive** | **< 1s** | **< 2s** | **> 5s** |

---

## If Still Slow After Fixes

### Check These:

1. **Hardware**
   - SSD vs HDD (HDD is 10x slower)
   - Available RAM (< 4GB may cause swapping)
   - CPU usage (other apps consuming resources)

2. **Antivirus**
   - Windows Defender may scan Electron .exe
   - Add exception for `node_modules/.bin` and `dist/`

3. **Node Modules**
   - Try: `npm ci` (clean install)
   - Try: Delete `node_modules` and `npm install`

4. **Electron Cache**
   - Clear: `%APPDATA%/leapblocks` (Windows)
   - Clear: `~/.config/leapblocks` (Linux)

---

## Next Steps

1. **Run the app** and check console for `[APP TIMING]` logs
2. **Measure actual times** - is it 1s, 5s, or 60s?
3. **Identify bottleneck** - Electron, React, or Network?
4. **Apply appropriate fix** from above

If startup is still > 5 seconds after checking these, please share:
- Console timing logs
- Network tab screenshot
- System specs (RAM, CPU, SSD/HDD)
