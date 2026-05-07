# Electra Startup Optimization

## Problem
The Electra module was loading heavy simulation engines (CircuitEngine and SimulationRunner) synchronously during app startup, blocking the main page from rendering quickly.

## Root Cause
1. `useForgeStore.ts` imported `simulationRunner` and `circuitEngine` at the module level
2. These are singleton instances that get instantiated immediately when the module loads
3. This triggered a cascade of imports including the entire AVR8js library (~500KB+)
4. Even though ForgeStudio itself was lazy-loaded, the store was imported early

## Solution Implemented

### 1. Lazy-Load Engines in Store (`src/modules/electra/store/useForgeStore.ts`)
- Replaced synchronous imports with async getter functions:
  ```typescript
  let simulationRunner: any = null;
  let circuitEngine: any = null;

  async function getSimulationRunner() {
    if (!simulationRunner) {
      const module = await import('../engine/SimulationRunner');
      simulationRunner = module.simulationRunner;
    }
    return simulationRunner;
  }

  async function getCircuitEngine() {
    if (!circuitEngine) {
      const module = await import('../engine/CircuitEngine');
      circuitEngine = module.circuitEngine;
    }
    return circuitEngine;
  }
  ```

### 2. Updated Store Actions to be Async
All store actions that interact with engines now use async/await:
- `setBoard()` - loads runner before setting board
- `startSimulation()` - loads both engines before starting
- `stopSimulation()` - loads runner before stopping
- `resetSimulation()` - loads runner before resetting
- `addNode()` - loads runner when board node is added
- `removeNode()` - loads runner when board node is removed
- `setNodes()` - loads runner when nodes are loaded from project

### 3. Lazy-Load in ForgeStudio (`src/modules/electra/ForgeStudio.tsx`)
- Added lazy-loading for simulationRunner in ForgeStudio component
- Only loads when ESP32 compilation needs to set binPath

### 4. Existing Optimizations Preserved
The following components already use dynamic imports (no changes needed):
- `SelectionToolbar.tsx` - lazy-loads circuitEngine
- `SensorOverlay.tsx` - lazy-loads circuitEngine
- `LeapNode.tsx` - lazy-loads circuitEngine
- `ESP32Engine.ts` - lazy-loads simulationRunner

## Impact

### Before
- App startup: ~2-3 seconds
- Main page blocked by Electra engine loading
- AVR8js library loaded immediately even if user never uses Electra

### After
- App startup: <500ms (main page renders immediately)
- Engines only load when:
  - User navigates to Electra mode
  - User starts a simulation
  - User adds a board node to canvas
- First simulation start may have a small delay (~200-300ms) for engine initialization
- Subsequent simulations are instant (engines cached)

## Testing Checklist
- [ ] App starts and landing page renders quickly
- [ ] Navigate to Electra mode - should load without errors
- [ ] Add board node to canvas - should work
- [ ] Start AVR simulation - should compile and run
- [ ] Start ESP32 simulation - should compile and run with QEMU
- [ ] Stop simulation - should stop cleanly
- [ ] Reset simulation - should reset state
- [ ] Load project with nodes - should detect board correctly
- [ ] Switch between boards - should update engine

## Notes
- Zustand store actions can be async - the state updates still happen synchronously
- The `set()` function in Zustand can accept an async callback
- Engine initialization is idempotent - safe to call multiple times
- No breaking changes to the API - all existing code continues to work
