# PinHarness Files - Important Information

## The Problem

There are **TWO** PinHarness files in this directory:

1. **PinHarness.json** - The source file (easy to edit)
2. **PinHarness.ts** - The compiled TypeScript file (used by components)

**⚠️ IMPORTANT:** Components import from `PinHarness.ts`, NOT from `PinHarness.json`!

If you edit `PinHarness.json` directly, your changes **will not appear** in the application until you sync the files.

## The Solution

### Option 1: Manual Sync (Quick Fix)

After editing `PinHarness.json`, run:

```bash
npm run sync:pinharness
```

This will copy your changes from JSON → TS.

### Option 2: Auto-Sync (Recommended for Development)

Run the file watcher in a separate terminal:

```bash
npm run watch:pinharness
```

This will automatically sync `PinHarness.json` → `PinHarness.ts` whenever you save changes to the JSON file.

## Workflow

### When Editing Pin Configurations:

1. **Edit** `PinHarness.json` (easier to read and edit)
2. **Run** `npm run sync:pinharness` (or use the watcher)
3. **Reload** your application to see changes

### Example: Adding a New Component

```json
// In PinHarness.json
"my-new-component": {
  "viewBox": {
    "minX": 0,
    "minY": 0,
    "width": 100,
    "height": 50
  },
  "pins": [
    { "name": "VCC", "x": 10, "y": 5 },
    { "name": "GND", "x": 10, "y": 45 }
  ]
}
```

Then run: `npm run sync:pinharness`

## Why Two Files?

- **JSON** is easier to edit and maintain
- **TypeScript** provides type safety and is required for imports
- The sync script bridges the gap between them

## Files

- `PinHarness.json` - **Edit this file** for pin configurations
- `PinHarness.ts` - **Auto-generated** from JSON (don't edit manually)
- `../../../../../../scripts/sync-pinharness.js` - Sync script
- `../../../../../../scripts/watch-pinharness.js` - File watcher

## Troubleshooting

### Changes not appearing?

1. Check if you edited `PinHarness.json` (correct) or `PinHarness.ts` (wrong)
2. Run `npm run sync:pinharness`
3. Reload your application (Ctrl+R or Cmd+R)

### Sync script not working?

Make sure you're in the project root directory when running npm commands.

### Still not working?

Check the browser console for errors and verify that the component is importing from the correct path:

```typescript
import { LEAP_PINS } from '../engine/Arduino/PinHarness';
```
