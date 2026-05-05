# Timing Instrumentation Guide

## Overview
Comprehensive timing logs have been added throughout the entire startup process to measure every operation. This allows us to identify bottlenecks and verify optimizations.

## Instrumented Areas

### 1. Main Process (`src/index.ts`)
**Timing Variable:** `STARTUP_TIME` (Date.now())

**Logged Events:**
- ✅ Main process script loaded
- ✅ Electron app ready event fired
- ✅ createWindow() called
- ✅ BrowserWindow created
- ✅ Started loading dev server URL / renderer HTML
- ✅ DevTools opened (dev mode only)
- ✅ Renderer finished loading (did-finish-load)
- ✅ DOM ready
- ✅ Window ready to show
- ✅ SerialManager initialization (start + end)
- ✅ ArduinoUploader initialization (start + end)
- ✅ PythonManager initialization (start + end)
- ✅ createWindow() completed
- ✅ All windows closed
- ✅ App activated
- ✅ App before-quit event

**Log Format:**
```
[TIMING] 0ms - Main process script loaded
[TIMING] 45ms - Electron app ready event fired
[TIMING] 47ms - createWindow() called
[TIMING] 89ms - BrowserWindow created
...
```

### 2. Renderer Process (`src/renderer.tsx`)
**Timing Variable:** `RENDERER_START` (performance.now())

**Logged Events:**
- ✅ Renderer script started
- ✅ React imported
- ✅ ReactDOM imported
- ✅ App component imported
- ✅ CSS imported
- ✅ Root element found
- ✅ React root created
- ✅ App rendered
- ✅ First frame painted
- ✅ Browser idle - startup complete

**Log Format:**
```
[RENDERER TIMING] 0.00ms - Renderer script started
[RENDERER TIMING] 12.50ms - React imported
[RENDERER TIMING] 18.30ms - ReactDOM imported
[RENDERER TIMING] 25.10ms - App component imported
...
```

### 3. App Component (`src/App.tsx`)
**Timing Variable:** `APP_LOAD_START` (performance.now())

**Logged Events:**
- ✅ App.tsx module loaded
- ✅ Loader imported
- ✅ All lazy components defined
- ✅ App component function called
- ✅ App component mounted
- ✅ Mode changed to: [mode]
- ✅ [Module] lazy load started (for each module)
- ✅ [Module] lazy load completed (for each module)

**Lazy Modules Tracked:**
- LandingPage
- IntermediateApp (Blockly)
- JuniorApp
- PythonApp
- PythonNotebook
- AppInventor
- AppForgeStudio
- LeapForgeStudio
- NeuraApp

**Log Format:**
```
[APP TIMING] 0.00ms - App.tsx module loaded
[APP TIMING] 2.10ms - Loader imported
[APP TIMING] 2.15ms - All lazy components defined
[APP TIMING] 2.20ms - App component function called
[APP TIMING] 15.50ms - App component mounted
[APP TIMING] 15.55ms - Mode changed to: home
[APP TIMING] 120.30ms - LandingPage lazy load started
[APP TIMING] 245.80ms - LandingPage lazy load completed
```

### 4. LeapForge Store (`src/modules/leapforge/store/useForgeStore.ts`)
**Timing Variable:** `STORE_LOAD_START` (performance.now())

**Logged Events:**
- ✅ Store module started loading
- ✅ Lazy loaders defined
- ✅ getSimulationRunner() called
- ✅ SimulationRunner loaded in [X]ms (first time)
- ✅ SimulationRunner already cached (subsequent calls)
- ✅ getCircuitEngine() called
- ✅ CircuitEngine loaded in [X]ms (first time)
- ✅ CircuitEngine already cached (subsequent calls)

**Log Format:**
```
[STORE TIMING] 0.00ms - Store module started loading
[STORE TIMING] 0.50ms - Lazy loaders defined
[STORE TIMING] 1250.30ms - getSimulationRunner() called
[STORE TIMING] 1680.50ms - SimulationRunner loaded in 430.20ms
[STORE TIMING] 2100.10ms - getCircuitEngine() called
[STORE TIMING] 2320.40ms - CircuitEngine loaded in 220.30ms
```

## How to Read the Logs

### Startup Sequence
```
1. [TIMING] Main process loads
2. [TIMING] Electron ready
3. [TIMING] Window created
4. [TIMING] Services initialized
5. [RENDERER TIMING] Renderer starts
6. [RENDERER TIMING] React loads
7. [APP TIMING] App component loads
8. [APP TIMING] LandingPage loads
9. [RENDERER TIMING] First paint
10. [RENDERER TIMING] Browser idle
```

### Module Navigation Sequence
```
User clicks "LeapForge"
1. [APP TIMING] Mode changed to: leapforge
2. [APP TIMING] LeapForgeStudio lazy load started
3. [APP TIMING] LeapForgeStudio lazy load completed
4. [STORE TIMING] Store module started loading (if first time)
5. [STORE TIMING] Lazy loaders defined
```

### Simulation Start Sequence
```
User clicks "Run Simulation"
1. [STORE TIMING] getSimulationRunner() called
2. [STORE TIMING] SimulationRunner loaded in Xms
3. [STORE TIMING] getCircuitEngine() called
4. [STORE TIMING] CircuitEngine loaded in Xms
```

## Expected Timing Benchmarks

### Optimal Performance (After Optimization)
```
Main Process:
  0-50ms:    Main script loaded
  50-100ms:  Electron ready
  100-150ms: Window created
  150-200ms: Services initialized

Renderer Process:
  0-20ms:    React/ReactDOM imported
  20-40ms:   App component imported
  40-60ms:   CSS imported
  60-100ms:  React root created
  100-150ms: App rendered
  150-200ms: First frame painted
  200-300ms: Browser idle (STARTUP COMPLETE)

Module Loading (On-Demand):
  LandingPage:      100-200ms
  IntermediateApp:  300-600ms (Blockly is heavy)
  LeapForgeStudio:  200-400ms
  SimulationRunner: 300-500ms (AVR8js is heavy)
  CircuitEngine:    100-200ms
```

### Warning Signs (Performance Issues)
```
❌ Main process > 200ms - Check service initialization
❌ Renderer > 300ms - Check for synchronous imports
❌ App component > 100ms - Check for heavy computations
❌ LandingPage > 300ms - Check for heavy assets
❌ First paint > 500ms - Critical path too heavy
❌ Browser idle > 1000ms - Too much work at startup
```

## Analyzing the Logs

### 1. Find the Critical Path
Look for the longest time between "Main process script loaded" and "Browser idle":
```bash
# In console, find:
[TIMING] 0ms - Main process script loaded
[RENDERER TIMING] XXXms - Browser idle - startup complete

# Critical path = XXX ms
```

### 2. Identify Bottlenecks
Look for large gaps between consecutive log entries:
```
[TIMING] 100ms - BrowserWindow created
[TIMING] 450ms - SerialManager initialized  # ❌ 350ms gap!
```

### 3. Verify Lazy Loading
Ensure heavy modules don't load at startup:
```
✅ Good:
[APP TIMING] 2.15ms - All lazy components defined
[RENDERER TIMING] 250ms - Browser idle
[APP TIMING] 1200ms - LeapForgeStudio lazy load started  # After user action

❌ Bad:
[APP TIMING] 2.15ms - All lazy components defined
[APP TIMING] 50ms - LeapForgeStudio lazy load started  # Too early!
[RENDERER TIMING] 2500ms - Browser idle  # Too slow!
```

### 4. Check Caching
Verify engines load once and cache:
```
✅ Good:
[STORE TIMING] 1250ms - SimulationRunner loaded in 430ms
[STORE TIMING] 2100ms - SimulationRunner already cached

❌ Bad:
[STORE TIMING] 1250ms - SimulationRunner loaded in 430ms
[STORE TIMING] 2100ms - SimulationRunner loaded in 420ms  # Not cached!
```

## Testing Procedure

### 1. Clean Startup Test
```bash
# Close app completely
# Clear cache if in dev mode
# Launch app
# Check console for timing logs
# Verify "Browser idle" < 500ms
```

### 2. Module Navigation Test
```bash
# Launch app
# Wait for "Browser idle"
# Click "LeapForge"
# Check console for lazy load timing
# Verify module loads in < 500ms
```

### 3. Simulation Start Test
```bash
# Navigate to LeapForge
# Click "Run Simulation"
# Check console for engine load timing
# Verify engines load in < 1000ms total
```

### 4. Cache Verification Test
```bash
# Start simulation once (engines load)
# Stop simulation
# Start simulation again
# Verify "already cached" messages
```

## Collecting Timing Data

### Export Logs to File
```javascript
// In DevTools console:
const logs = [];
const originalLog = console.log;
console.log = function(...args) {
    logs.push(args.join(' '));
    originalLog.apply(console, args);
};

// After startup completes:
copy(logs.join('\n'));
// Paste into timing-logs.txt
```

### Generate Timing Report
```javascript
// In DevTools console after startup:
const timingLogs = logs.filter(log => 
    log.includes('[TIMING]') || 
    log.includes('[RENDERER TIMING]') || 
    log.includes('[APP TIMING]') ||
    log.includes('[STORE TIMING]')
);

const report = {
    mainProcess: timingLogs.filter(l => l.includes('[TIMING]')),
    renderer: timingLogs.filter(l => l.includes('[RENDERER TIMING]')),
    app: timingLogs.filter(l => l.includes('[APP TIMING]')),
    store: timingLogs.filter(l => l.includes('[STORE TIMING]'))
};

console.table(report);
```

## Performance Goals

### Target Metrics
- **Time to Interactive:** < 500ms
- **First Contentful Paint:** < 200ms
- **Main Process Ready:** < 100ms
- **Renderer Ready:** < 300ms
- **Module Load (on-demand):** < 500ms
- **Engine Load (on-demand):** < 1000ms

### Success Criteria
✅ All timing logs present
✅ No gaps > 200ms in critical path
✅ Heavy modules load after "Browser idle"
✅ Engines load only when simulation starts
✅ Subsequent loads use cache

## Troubleshooting

### Missing Timing Logs
- Check console filters (show all logs)
- Verify code changes were compiled
- Check for syntax errors

### Unexpected Delays
- Look for synchronous imports
- Check for heavy computations
- Verify lazy loading is working
- Check network requests

### Module Loading Too Early
- Verify prefetch is disabled
- Check for eager imports
- Look for side effects in modules

## Conclusion

With comprehensive timing instrumentation, you can now:
1. **Measure** exact startup performance
2. **Identify** bottlenecks and delays
3. **Verify** lazy loading is working
4. **Track** performance over time
5. **Optimize** based on real data

Run the app and check the console for detailed timing logs! 🚀
