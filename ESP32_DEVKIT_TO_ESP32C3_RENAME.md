# ESP32 DevKit V1 → ESP32-C3 Rename Complete

## ✅ RENAMING COMPLETE

All references to "ESP32 DevKit V1" have been renamed to "ESP32-C3" to accurately reflect that the simulator only handles ESP32-C3 RISC-V architecture.

## Files Renamed

### Element Files
1. ✅ `esp32-devkit-v1-element.ts` → `esp32-c3-element.ts`
2. ✅ `esp32-devkit-v1-element.stories.ts` → `esp32-c3-element.stories.ts`
3. ✅ `esp32-devkit-v1-element.spec.ts` → `esp32-c3-element.spec.ts`

## Content Updated

### 1. ✅ Element Class (`esp32-c3-element.ts`)
```typescript
// Before
@customElement('leap-esp32-devkit-v1')
export class ESP32DevkitV1Element extends LitElement {

// After
@customElement('leap-esp32-c3')
export class ESP32C3Element extends LitElement {
```

**Visual Change:**
- Board text changed from "ESP32" to "ESP32-C3"

### 2. ✅ Stories File (`esp32-c3-element.stories.ts`)
```typescript
// Before
import './esp32-devkit-v1-element';
title: 'ESP32 Devkit V1',
component: 'leap-esp32-devkit-v1',
html`<leap-esp32-devkit-v1 ...></leap-esp32-devkit-v1>`

// After
import './esp32-c3-element';
title: 'ESP32-C3',
component: 'leap-esp32-c3',
html`<leap-esp32-c3 ...></leap-esp32-c3>`
```

### 3. ✅ Spec File (`esp32-c3-element.spec.ts`)
```typescript
// Before
import { ESP32DevkitV1Element } from './esp32-devkit-v1-element';
describe('ESP32DevkitV1Element', () => {
  const pngData = await renderToPng(new ESP32DevkitV1Element());
  await savePng('leap-esp32-devkit-v1', pngData);
});

// After
import { ESP32C3Element } from './esp32-c3-element';
describe('ESP32C3Element', () => {
  const pngData = await renderToPng(new ESP32C3Element());
  await savePng('leap-esp32-c3', pngData);
});
```

### 4. ✅ Index Exports (`index.ts`)
```typescript
// Before
export { ESP32DevkitV1Element } from './esp32-devkit-v1-element';

// After
export { ESP32C3Element } from './esp32-c3-element';
```

### 5. ✅ React Types (`react-types.ts`)
```typescript
// Before
import { ESP32DevkitV1Element } from './esp32-devkit-v1-element';
'leap-esp32-devkit-v1': LeapElement<ESP32DevkitV1Element>;

// After
import { ESP32C3Element } from './esp32-c3-element';
'leap-esp32-c3': LeapElement<ESP32C3Element>;
```

### 6. ✅ Board Selector (`BoardSelector.tsx`)
```typescript
// Before
export type BoardType = ... | 'esp32';
{ id: 'esp32', label: 'ESP32', chip: 'Xtensa LX6', color: '#E53935', badge: 'WiFi' }

// After
export type BoardType = ... | 'esp32-c3';
{ id: 'esp32-c3', label: 'ESP32-C3', chip: 'RISC-V', color: '#E53935', badge: 'WiFi' }
```

### 7. ✅ Sidebar (`Sidebar.tsx`)
```typescript
// Before
{ id: 'esp32-devkit-v1', name: 'ESP32 DevKit', category: 'boards', desc: 'WiFi & Bluetooth MCU' }

// After
{ id: 'esp32-c3', name: 'ESP32-C3', category: 'boards', desc: 'RISC-V WiFi & Bluetooth MCU' }
```

### 8. ✅ Part Picker (`PartPicker.tsx`)
```typescript
// Before
{ id: 'esp32-devkit-v1', name: 'ESP32 DevKit', category: 'boards', desc: 'WiFi & Bluetooth MCU' }

// After
{ id: 'esp32-c3', name: 'ESP32-C3', category: 'boards', desc: 'RISC-V WiFi & Bluetooth MCU' }
```

### 9. ✅ Store Mapping (`useForgeStore.ts`)
```typescript
// Before
const BOARD_NODE_TO_BOARD_ID: Record<string, string> = {
  'esp32-devkit-v1': 'esp32',
  'esp32': 'esp32',
  ...
};

// After
const BOARD_NODE_TO_BOARD_ID: Record<string, string> = {
  'esp32-c3': 'esp32-c3',
  'esp32': 'esp32-c3',  // Legacy support
  ...
};
```

### 10. ✅ Simulation Runner (`SimulationRunner.ts`)
```typescript
// Before
const ESP32_C3_BOARD_IDS = ['esp32', 'esp32-devkit-v1', 'esp32-c3'];

// After
const ESP32_C3_BOARD_IDS = ['esp32-c3'];
```

**Updated in:**
- `initCPU()` method
- `start()` method
- `stop()` method
- `isESP32C3Board` getter

## Board ID Flow (After Rename)

```
User Drags "ESP32-C3" from Sidebar
    ↓
Canvas Node Type: 'esp32-c3'
    ↓
Store Board ID: 'esp32-c3'
    ↓
SimulationRunner checks: ['esp32-c3']
    ↓
✅ ESP32-C3 RISC-V Emulator Activated
```

## Legacy Support

The mapping still supports `'esp32'` → `'esp32-c3'` for backward compatibility with existing projects.

## What Changed

| Component | Old Name | New Name |
|-----------|----------|----------|
| Element Tag | `<leap-esp32-devkit-v1>` | `<leap-esp32-c3>` |
| Class Name | `ESP32DevkitV1Element` | `ESP32C3Element` |
| Board ID | `'esp32-devkit-v1'` | `'esp32-c3'` |
| Display Name | "ESP32 DevKit" | "ESP32-C3" |
| Chip Label | "Xtensa LX6" | "RISC-V" |
| Description | "WiFi & Bluetooth MCU" | "RISC-V WiFi & Bluetooth MCU" |

## Benefits of Rename

1. **Accuracy** - Name reflects actual architecture (RISC-V, not Xtensa)
2. **Clarity** - Users know they're using ESP32-C3 specifically
3. **Consistency** - Element name matches emulator name
4. **Simplicity** - One board type instead of multiple aliases

## Testing Checklist

After restart, verify:

- [ ] ESP32-C3 appears in Sidebar
- [ ] ESP32-C3 appears in BoardSelector
- [ ] Dragging ESP32-C3 creates `<leap-esp32-c3>` element
- [ ] Board text shows "ESP32-C3" on canvas
- [ ] Compilation uses `esp32:esp32:esp32c3` FQBN
- [ ] Simulation uses ESP32C3SimulationRunner
- [ ] LED blinks correctly
- [ ] Serial output works

## Next Steps

1. **Restart Electron app**:
   ```bash
   npm run dev
   ```

2. **Test ESP32-C3 board**:
   - Drag "ESP32-C3" from Sidebar
   - Add LED to GPIO2
   - Write blink code
   - Click "Compile & Run"
   - Verify LED blinks

3. **Check console logs**:
   ```
   [FORGE ENGINE] ESP32-C3 RISC-V runner created for board: esp32-c3
   [SimulationRunner] ESP32-C3 board detected, entering RISC-V path
   [ESP32-C3] Initialized: 3 segments, entry=0x...
   ```

## Files Modified

### Element Files
- `src/modules/electra/elements/leap-elements/esp32-c3-element.ts`
- `src/modules/electra/elements/leap-elements/esp32-c3-element.stories.ts`
- `src/modules/electra/elements/leap-elements/esp32-c3-element.spec.ts`
- `src/modules/electra/elements/leap-elements/index.ts`
- `src/modules/electra/elements/leap-elements/react-types.ts`

### Configuration Files
- `src/modules/electra/components/BoardSelector.tsx`
- `src/modules/electra/components/Sidebar.tsx`
- `src/modules/electra/components/Library/PartPicker.tsx`
- `src/modules/electra/store/useForgeStore.ts`
- `src/modules/electra/engine/SimulationRunner.ts`

## Status

✅ **RENAME COMPLETE**  
✅ **All files updated**  
✅ **Board ID unified to 'esp32-c3'**  
✅ **Element renamed to ESP32C3Element**  
✅ **Display name changed to "ESP32-C3"**  
✅ **Chip label changed to "RISC-V"**  

**Action Required:** Restart app and test!

---

**Date**: April 22, 2026  
**Change Type**: Rename  
**Scope**: ESP32 DevKit V1 → ESP32-C3  
**Impact**: All ESP32 boards now clearly labeled as ESP32-C3
