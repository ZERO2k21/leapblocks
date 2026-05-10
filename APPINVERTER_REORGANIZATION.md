# AppInventor Reorganization & Studio Link Fix

## Summary

This document describes the changes made to:
1. Consolidate all AppInventor files into a single searchable folder (`src/appinverter`)
2. Fix the Studio card link that was incorrectly routing to Electra session

## Changes Made

### 1. Created New AppInventor Folder Structure

**Location**: `d:\leapblocks\src\appinverter\`

All AppInventor files have been moved from `src/modules/AppInventor/` to `src/appinverter/` and organized as follows:

```
src/appinverter/
├── components/
│   ├── BlocksView.jsx
│   ├── BuildModal.jsx
│   ├── Palette.jsx
│   ├── PhoneCanvas.jsx
│   └── PropertiesPanel.jsx
├── data/
│   ├── defaultProperties.js
│   └── paletteComponents.js
├── hooks/
│   └── useAppState.js
├── utils/
│   └── codeGenerators.js
├── index.jsx
└── README.md (NEW - comprehensive documentation)
```

### 2. Updated Import Paths

#### File: `src/App.tsx`
**Line 65**: Changed import path
```typescript
// BEFORE
return import('./modules/AppInventor').then(module => {

// AFTER
return import('./appinverter').then(module => {
```

#### File: `electron/buildApk.js`
**Line 61**: Changed require path
```javascript
// BEFORE
const codeGen = require('../src/modules/AppInventor/utils/codeGenerators.js');

// AFTER
const codeGen = require('../src/appinverter/utils/codeGenerators.js');
```

### 3. Fixed Studio Card Routing

#### File: `src/LandingPage.tsx`
**Line 790**: Fixed the Studio card onClick handler

```typescript
// BEFORE
<div className={`tc tc-studio ${tcClass(6)}`} onClick={() => handleCardClick(() => onSelect('appforge'))}>

// AFTER
<div className={`tc tc-studio ${tcClass(6)}`} onClick={() => handleCardClick(() => onSelect('appinventor'))}>
```

**Explanation**: The Studio card was calling `onSelect('appforge')`, which in `App.tsx` was incorrectly mapped to `ElectraStudio`. Now it correctly calls `onSelect('appinventor')` which loads the AppInventor module.

## Routing Logic

The correct routing in the landing page is now:

| Card Name | Description | Mode | Component Loaded |
|-----------|-------------|------|------------------|
| Ignite | Leap & Block Coding | `junior` | JuniorApp |
| Embed | Arduino & Embedded Systems | `intermediate` | IntermediateApp |
| Codex | Python Programming | `python` | PythonApp |
| Neura | AI Logic & Advanced Block | `neura` | NeuraApp |
| **Electra** | **Circuit Design & Simulation** | `electra` | ElectraStudio |
| Vision3D | 3D Design & Modeling | (coming soon) | - |
| **Studio** | **App & Game Development** | `appinventor` | AppInventor |
| Pulse | Assessment & Quiz | (coming soon) | - |

## Benefits

1. **Searchability**: All AppInventor files are now in one consolidated folder with comprehensive README documentation
2. **Correct Routing**: Studio card now correctly opens AppInventor instead of Electra
3. **Clear Separation**: AppInventor (Studio) and Electra are now properly separated
4. **Better Organization**: Flat structure in `src/appinverter` makes files easier to find
5. **Documentation**: Added README.md with keywords for better searchability

## Testing Checklist

- [ ] Click "Studio" card on landing page → Should open AppInventor (App & Game Development)
- [ ] Click "Electra" card on landing page → Should open ElectraStudio (Circuit Design)
- [ ] Verify AppInventor loads correctly from new path
- [ ] Verify APK build process still works (uses new path in buildApk.js)
- [ ] Search for "appinventor" keywords → Should find the new folder and README

## Files Not Modified

As requested, no other files in the landing page were touched except for the Studio card's onClick handler. The Electra card and all other cards remain unchanged.

## Original Issue

**Problem**: When clicking the "Studio" card (App & Game Development), it was routing to `mode='appforge'`, which in `App.tsx` was mapped to `ElectraStudio` (Circuit Design & Simulation). This was incorrect.

**Root Cause**: In `App.tsx` line 193, `{mode === 'appforge' && <ElectraStudio .../>}` was incorrectly routing appforge mode to ElectraStudio.

**Solution**: Changed Studio card to call `onSelect('appinventor')` which correctly loads the AppInventor module.
