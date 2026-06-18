# Fix: Register Ignite-specific block definitions before toolbox references them

## Problem
`TypeError: Invalid block definition for type: fd_say_expression`

The 3 bridge blocks (`fd_say_expression`, `fd_go_to_face`, `fd_if_expression`) are defined in `registerIgniteBlocks` but never called. `registerExtensions()` only calls `registerBlocks` (full blocks), not `registerIgniteBlocks`. So when `getIgniteToolbox()` puts them in the XML, Blockly can't find the definitions.

## Fix

**File:** `src/leapignite/client/hooks/useJuniorWorkspace.jsx` line 241

After `registerExtensions(Blockly, [id]);`, add:

```javascript
if (EXTENSIONS[id]?.registerIgniteBlocks) {
    EXTENSIONS[id].registerIgniteBlocks(Blockly);
}
```

This ensures Ignite-specific block shapes are registered before the toolbox references them.
