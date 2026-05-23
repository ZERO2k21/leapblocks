# Junior (Ignite) Blocks vs Embed Category Flyout Analysis

## Current State

### Junior (Ignite) Mode - `src/leapignite/`
**Architecture:**
- Uses **custom category sidebar** with manual XML toolbox generation
- Categories defined in `useJuniorWorkspace.tsx` as React components
- Blocks defined in `server/blocks/blocks.js` using Blockly.Blocks API
- Toolbox generated via `getToolboxXml()` function that creates XML strings
- **No pictobloxCategory** - uses simple XML-based flyout

**Block Definition Pattern:**
```javascript
Blockly.Blocks['move_right'] = {
    init: function () {
        juniorBlockBase(this, "→", "STEPS", MOVE_OPTIONS);
    }
};
```

**Toolbox Pattern:**
```javascript
const getToolboxXml = (catId: string) => {
    let xml = '<xml xmlns="https://developers.google.com/blockly/xml">';
    blocks.forEach(b => {
        xml += `<block type="${b.type}"></block>`;
    });
    xml += '</xml>';
    return xml;
};
```

### Embed Mode - `src/leapembed/`
**Architecture:**
- Uses **pictobloxCategory** with custom renderer
- Categories defined in block files (animationBlocks.ts, arduinoBlocks.ts, etc.)
- Blocks defined using JSON arrays + `createBlockDefinitionsFromJsonArray()`
- Toolbox uses structured objects with `kind: 'pictobloxCategory'`
- **Proper flyout callbacks** registered via `registerToolboxCategoryCallback()`

**Block Definition Pattern:**
```typescript
{
    type: 'junior_move_forward',
    message0: '➡️ MOVE FORWARD',
    previousStatement: null,
    nextStatement: null,
    colour: COLORS.motion,
}
```

**Toolbox Pattern:**
```typescript
{
    kind: 'pictobloxCategory',
    name: 'Motion',
    colour: COLORS.motion,
    contents: [
        { kind: 'block', type: 'junior_move_forward' },
        { kind: 'block', type: 'junior_move_backward' },
    ],
}
```

## Issues Identified

### 1. **Inconsistent Block Registration**
- Junior mode has blocks in `blocks.js` but also references `juniorBlocks.ts`
- `juniorBlocks.ts` defines a complete set of blocks that are NOT being used
- The actual blocks used are from `blocks.js` which uses a different pattern

### 2. **Missing Category Flyout Integration**
- Junior mode doesn't use `pictobloxCategory` or `registerPictoBloxCategory()`
- No flyout callback registration like embed mode has
- Categories are manually managed in React state

### 3. **Toolbox Update Issues**
- `workspaceRef.current.updateToolbox(toolboxXml)` uses XML strings
- Embed mode uses structured objects: `workspaceRef.current.updateToolbox(nextToolboxConfig)`
- This causes flyout to not persist properly when switching sprites

### 4. **Block Definition Duplication**
- `juniorBlocks.ts` has a complete set of junior blocks (NOT USED)
- `blocks.js` has another set of blocks (ACTUALLY USED)
- `looksBlocks.js` and `soundBlocks.js` have additional blocks
- No clear single source of truth

## Recommended Fixes

### Option 1: Migrate Junior to pictobloxCategory (Recommended)
**Pros:**
- Consistent with embed mode architecture
- Better flyout persistence
- Easier to maintain
- Supports dynamic categories (extensions)

**Steps:**
1. Create `juniorToolbox.ts` with proper pictobloxCategory structure
2. Register categories using `registerPictoBloxCategory()`
3. Update `useJuniorWorkspace` to use structured toolbox objects
4. Remove XML-based toolbox generation

### Option 2: Fix Current XML-Based System
**Pros:**
- Less refactoring required
- Keeps current architecture

**Steps:**
1. Consolidate block definitions (remove duplication)
2. Fix flyout persistence by storing flyout state properly
3. Improve category switching logic
4. Add proper flyout callback registration

## Current Block Files

### Actually Used (Junior Mode):
- `src/leapignite/server/blocks/blocks.js` - Motion, Events, Control, Pen, Sound
- `src/leapignite/server/blocks/looksBlocks.js` - Looks blocks
- `src/leapignite/server/blocks/soundBlocks.js` - Sound blocks

### Not Used (Junior Mode):
- `src/leapembed/server/blocks/juniorBlocks.ts` - Complete junior block set (UNUSED!)

### Used (Embed Mode):
- `src/leapembed/server/blocks/animationBlocks.ts` - Stage mode blocks
- `src/leapembed/server/blocks/arduinoBlocks.ts` - Arduino upload mode
- `src/leapembed/server/blocks/esp32Blocks.ts` - ESP32 upload mode

## Next Steps

1. **Decide on architecture** - pictobloxCategory vs XML-based
2. **Consolidate block definitions** - single source of truth
3. **Fix flyout persistence** - ensure flyout stays open when switching sprites
4. **Test category switching** - verify blocks appear correctly
5. **Document the pattern** - clear guidelines for adding new blocks
