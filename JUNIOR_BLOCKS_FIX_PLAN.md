# Junior (Ignite) Blocks Fix Plan

## Problem Summary

The junior (ignite) blocks and embed category flyout blocks have different architectures:

1. **Junior Mode** uses XML-based toolbox with custom category sidebar
2. **Embed Mode** uses `pictobloxCategory` with structured toolbox objects
3. **Flyout persistence** is broken when switching sprites in junior mode
4. **Block definitions** are duplicated across multiple files

## Root Causes

### 1. Toolbox Update Method Mismatch
```typescript
// Junior Mode (Current - BROKEN)
workspaceRef.current.updateToolbox(toolboxXml); // XML string

// Embed Mode (Working)
workspaceRef.current.updateToolbox(nextToolboxConfig); // Structured object
```

### 2. Flyout Restoration Logic
```typescript
// Junior Mode attempts to restore flyout after workspace load
const flyout = workspaceRef.current.getFlyout();
if (flyout) {
    const contents = currentToolboxContentsRef.current;
    if (contents && contents.length > 0) {
        flyout.show(contents); // This doesn't work with XML toolbox!
    }
}
```

### 3. Category Contents Storage
```typescript
// Stored as block type references
currentToolboxContentsRef.current = categoryBlocks[catId] || [];
// Example: [{ kind: "block", type: "move_right" }, ...]

// But flyout.show() expects XML or Blockly elements, not type references!
```

## Solution: Fix XML-Based Toolbox System

### Step 1: Fix Flyout Restoration

**File:** `src/leapignite/client/hooks/useJuniorWorkspace.tsx`

**Change the flyout restoration logic:**

```typescript
// BEFORE (Broken)
const flyout = workspaceRef.current.getFlyout();
if (flyout) {
    const contents = currentToolboxContentsRef.current;
    if (contents && contents.length > 0) {
        flyout.show(contents); // Wrong! contents is not XML
    }
}

// AFTER (Fixed)
const flyout = workspaceRef.current.getFlyout();
if (flyout && activeCategory) {
    // Regenerate the XML for the current category
    const toolboxXml = getToolboxXml(activeCategory, categoryBlocks);
    workspaceRef.current.updateToolbox(toolboxXml);
    resetFlyoutScale();
}
```

### Step 2: Store Active Category in Ref

**Add a ref to track the active category:**

```typescript
const activeCategoryRef = useRef<string>("events");

const handleCategoryClick = (catId: string) => {
    setActiveCategory(catId);
    activeCategoryRef.current = catId; // Store in ref for immediate access
    
    if (workspaceRef.current) {
        const toolboxXml = getToolboxXml(catId, categoryBlocks);
        workspaceRef.current.updateToolbox(toolboxXml);
        resetFlyoutScale();
        setTimeout(() => workspaceRef.current?.resize(), 50);
    }
};
```

### Step 3: Update loadSpriteWorkspace in JuniorApp

**File:** `src/leapignite/client/JuniorApp.tsx`

**Fix the flyout restoration after workspace load:**

```typescript
// BEFORE (Broken)
const flyout = workspaceRef.current.getFlyout();
if (flyout) {
    const contents = currentToolboxContentsRef.current;
    if (contents && contents.length > 0) {
        flyout.show(contents);
    }
}

// AFTER (Fixed)
// Re-apply the current toolbox to restore the flyout
if (wp.activeCategory) {
    const toolboxXml = wp.getToolboxXml(wp.activeCategory);
    workspaceRef.current.updateToolbox(toolboxXml);
    wp.resetFlyoutScale();
}
```

### Step 4: Expose getToolboxXml from Hook

**File:** `src/leapignite/client/hooks/useJuniorWorkspace.tsx`

**Return getToolboxXml from the hook:**

```typescript
return {
    activeCategory,
    categories,
    handleCategoryClick,
    resetFlyoutScale,
    getToolboxXml, // ADD THIS
    // ... rest of returns
};
```

### Step 5: Fix Category Blocks Reference

**Store category blocks in a ref for immediate access:**

```typescript
const categoryBlocksRef = useRef(categoryContents);

const handleAddExtension = (extId: string) => {
    // ... existing code ...
    
    const nextCategoryBlocks = { ...categoryBlocks, [id]: ext.getToolbox() };
    setCategoryBlocks(nextCategoryBlocks);
    categoryBlocksRef.current = nextCategoryBlocks; // Keep ref in sync
    
    // ... rest of code ...
};
```

## Implementation Steps

### Phase 1: Core Fixes (High Priority)
1. ✅ Add `activeCategoryRef` to track current category
2. ✅ Update `handleCategoryClick` to store in ref
3. ✅ Fix flyout restoration in `loadSpriteWorkspace`
4. ✅ Expose `getToolboxXml` from hook
5. ✅ Add `categoryBlocksRef` for immediate access

### Phase 2: Testing
1. Test sprite switching with flyout open
2. Test category switching
3. Test extension addition
4. Test workspace save/load
5. Test block dragging between sprites

### Phase 3: Cleanup (Low Priority)
1. Remove unused `juniorBlocks.ts` file
2. Consolidate block definitions
3. Add documentation
4. Remove duplicate code

## Alternative: Migrate to pictobloxCategory

If the XML-based fixes don't work well, consider migrating to `pictobloxCategory`:

### Pros:
- Consistent with embed mode
- Better flyout management
- Easier to maintain
- Supports dynamic categories

### Cons:
- More refactoring required
- Need to rewrite category UI
- Risk of breaking existing functionality

### Migration Steps:
1. Create `juniorToolbox.ts` with pictobloxCategory structure
2. Register categories using `registerPictoBloxCategory()`
3. Update workspace initialization to use structured toolbox
4. Remove custom category sidebar
5. Use Blockly's built-in category UI

## Files to Modify

### High Priority:
- `src/leapignite/client/hooks/useJuniorWorkspace.tsx` - Fix flyout restoration
- `src/leapignite/client/JuniorApp.tsx` - Update loadSpriteWorkspace

### Medium Priority:
- `src/leapignite/server/blocks/blocks.js` - Consolidate block definitions
- `src/leapignite/server/blocks/looksBlocks.js` - Review and consolidate
- `src/leapignite/server/blocks/soundBlocks.js` - Review and consolidate

### Low Priority:
- `src/leapembed/server/blocks/juniorBlocks.ts` - Remove if unused
- Documentation files

## Testing Checklist

- [ ] Flyout stays open when switching sprites
- [ ] Flyout shows correct blocks for active category
- [ ] Category switching works correctly
- [ ] Extension addition works
- [ ] Block dragging works
- [ ] Workspace save/load preserves blocks
- [ ] No console errors
- [ ] Performance is acceptable

## Success Criteria

1. Flyout persists when switching sprites
2. Category blocks display correctly
3. No duplicate block definitions
4. Clear documentation of architecture
5. All tests pass
