# PinHarness Update Guide

## 🔴 Problem Identified

When you edit `PinHarness.json`, the changes don't appear in your components because:

- Components import from `PinHarness.ts` (TypeScript file)
- You're editing `PinHarness.json` (JSON file)
- These two files are **separate** and need to be synced

## ✅ Solution

I've created automated scripts to sync the files:

### Quick Fix (One-Time Sync)

After editing `PinHarness.json`, run:

```bash
npm run sync:pinharness
```

### Automatic Sync (Recommended)

Run this in a separate terminal while developing:

```bash
npm run watch:pinharness
```

This will automatically sync every time you save `PinHarness.json`.

## 📝 Workflow

1. **Edit** `src/Leapforge/Client/Src/engine/Arduino/PinHarness.json`
2. **Sync** using one of the methods above
3. **Reload** your application to see changes

## 📂 Files Created

- ✅ `scripts/sync-pinharness.js` - Manual sync script
- ✅ `scripts/watch-pinharness.js` - Auto-sync file watcher
- ✅ `src/Leapforge/Client/Src/engine/Arduino/README.md` - Detailed documentation
- ✅ Updated `package.json` with new scripts

## 🎯 Example Usage

### Scenario: You want to update biaxial-stepper pins

1. Open `src/Leapforge/Client/Src/engine/Arduino/PinHarness.json`
2. Find the `"biaxial-stepper"` section
3. Edit the pin coordinates:
   ```json
   "biaxial-stepper": {
     "viewBox": { ... },
     "pins": [
       { "name": "B1-", "x": 45, "y": 20 },
       // ... edit coordinates here
     ]
   }
   ```
4. Save the file
5. Run `npm run sync:pinharness`
6. Reload your app (Ctrl+R or Cmd+R)

## 🔍 Verification

To verify the sync worked:

```bash
# Check if PinHarness.ts was updated
git diff src/Leapforge/Client/Src/engine/Arduino/PinHarness.ts
```

## ⚠️ Important Notes

- **Always edit** `PinHarness.json` (not `PinHarness.ts`)
- **Always sync** after editing
- **PinHarness.ts** is auto-generated - don't edit it manually
- The watcher only works while it's running - stop it with Ctrl+C

## 🚀 Next Steps

1. Try editing `PinHarness.json`
2. Run `npm run sync:pinharness`
3. Check if your changes appear in the component

Need help? Check the detailed README at:
`src/Leapforge/Client/Src/engine/Arduino/README.md`
