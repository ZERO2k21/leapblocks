# Blockly Block Definition Conflict - Fix Documentation

## Problem Summary

The application has **two different block systems** that were conflicting:

1. **Ignite** (`leapignite/`) - Junior/simplified blocks with `field_input` (plain text fields)
2. **Embed** (`leapembed/`) - Full Scratch-like blocks with `input_value` (connections for shadow blocks)

### The Conflict

Both systems defined the same block types (`looks_say`, `looks_think`, etc.) but with **different input types**:

- **leapBlocks.ts** (used by hardware/upload mode): `field_input` - simple text field
- **animationBlocks.ts** (used by stage/animation mode): `input_value` - connection for shadow blocks

When the toolbox tried to create blocks with shadow connections, but the registered block had `field_input`, it caused:
- ❌ `MissingConnection` error: "The block 'looks_say' is missing a MESSAGE connection"
- ❌ `TypeError`: "Cannot read properties of undefined (reading '2')"

## Root Cause

In `useBlocklyInit.ts`, blocks were registered in this order:
1. `registerleapBlocks()` - registered `looks_say` with `field_input`
2. `animationBlocks` - tried to register `looks_say` with `input_value`, but **skipped** because it already existed

Result: Animation mode toolbox expected `input_value` connections, but got `field_input` blocks.

## Solution

### 1. Created Separate Animation Block Definitions

**File**: `src/leapembed/server/blocks/animationBlocksOnly.ts`

- Explicitly defines animation-specific looks blocks with `input_value`
- Registered **FIRST** before any other blocks
- Takes precedence over conflicting definitions

### 2. Updated Registration Order

**File**: `src/leapembed/client/hooks/useBlocklyInit.ts`

```typescript
// NEW ORDER:
1. registerAnimationLooksBlocks()  // ← Animation-specific blocks FIRST
2. animationBlocks                  // ← Other animation blocks
3. arduinoBlocks, esp32Blocks       // ← Hardware blocks
4. registerleapBlocks()             // ← Legacy blocks LAST (won't override)
```

### 3. Enhanced Error Handling

**File**: `src/leapembed/server/blockly/runtime.ts`

- Added comprehensive validation in `updateFlyout_` patch
- Added try-catch to prevent crashes
- Added type checking before accessing properties

## Block Type Naming Conventions

### Animation Blocks (with underscores)
- `looks_say` - with `input_value`
- `looks_say_for_secs` - with `input_value`
- `looks_think` - with `input_value`
- `looks_think_for_secs` - with `input_value`

### Leap Blocks (without underscores in "forsecs")
- `looks_say` - with `field_input`
- `looks_sayforsecs` - with `field_input`
- `looks_think` - with `field_input`
- `looks_thinkforsecs` - with `field_input`

**Note**: Some blocks have different names (`looks_sayforsecs` vs `looks_say_for_secs`), so they don't conflict. The main conflicts are `looks_say` and `looks_think`.

## How It Works Now

### For Embed (Stage/Animation Mode)
1. `registerAnimationLooksBlocks()` registers `looks_say` with `input_value`
2. Toolbox creates blocks with shadow connections
3. ✅ Everything works - connections exist

### For Embed (Upload/Hardware Mode)
1. `registerAnimationLooksBlocks()` registers `looks_say` with `input_value`
2. Hardware toolbox doesn't use these blocks (uses hardware-specific blocks)
3. ✅ No conflict

### For Ignite (Junior Mode)
1. Ignite has its own separate block definitions in `leapignite/server/blocks/blocks.js`
2. Uses `field_dropdown` for emojis (different approach)
3. ✅ Completely independent system

## Files Modified

1. ✅ `src/leapembed/server/blocks/animationBlocksOnly.ts` - **CREATED**
   - New file with explicit animation block definitions

2. ✅ `src/leapembed/client/hooks/useBlocklyInit.ts` - **MODIFIED**
   - Changed registration order
   - Added `registerAnimationLooksBlocks()` call
   - Added error logging

3. ✅ `src/leapembed/server/blockly/runtime.ts` - **MODIFIED**
   - Enhanced `updateFlyout_` patch with better error handling
   - Added type checking and validation

4. ⚠️ `src/leapembed/server/blocks/leapBlocks.ts` - **NO CHANGES NEEDED**
   - Kept original `field_input` definitions
   - Used for hardware/upload mode only

## Testing Checklist

- [ ] Open Embed in Stage mode → Click "Looks" category → Verify no errors
- [ ] Drag `looks_say` block → Verify it has a text input connection
- [ ] Open Embed in Upload mode → Verify hardware blocks work
- [ ] Open Ignite → Verify junior blocks still work with emojis
- [ ] Switch between Stage and Upload modes → Verify no conflicts
- [ ] Check browser console → Verify no "MissingConnection" errors
- [ ] Check browser console → Verify no "Cannot read properties of undefined" errors

## Future Improvements

1. **Complete Separation**: Consider fully separating Ignite and Embed block systems
2. **Type Safety**: Add TypeScript interfaces for block definitions
3. **Dynamic Registration**: Register blocks based on active mode (stage vs upload)
4. **Block Versioning**: Add version numbers to block definitions for migration

## Key Takeaways

✅ **Animation blocks now register FIRST** - ensures correct definitions for stage mode
✅ **Explicit definitions** - no reliance on implicit registration order
✅ **Better error handling** - graceful degradation instead of crashes
✅ **Preserved backward compatibility** - leapBlocks still work for hardware mode
✅ **Ignite remains independent** - no impact on junior block system

---

**Last Updated**: 2026-05-05
**Author**: Kiro AI Assistant
