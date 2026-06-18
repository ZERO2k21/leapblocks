# Plan: Make Face Detection Blocks Combine with Other Ignite Blocks

## Problem Analysis

The face detection extension blocks are showing in Ignite but the **reporter blocks** (`face count`, `emotion`, `face x/y`, `is expression`) are floating unconnected because:

1. **No value input slots exist** in any Ignite blocks — `say_text` uses `FieldTextInput` (hardcoded text), not a value input
2. **No conditional blocks exist** — there's no `If [boolean]` block where `is expression` could plug in
3. **No number-input blocks** — there's no `go to x [number] y [number]` where `face x/y` could plug in

All current Ignite blocks use `appendDummyInput()` with `FieldDropdown` or `FieldTextInput` — none use `appendValueInput()` which is what reporter blocks need to connect to.

## Solution

Add 3 new "bridge" blocks to the face_detection Ignite block set that accept value inputs. These are the blocks that let reporters plug in:

### New Blocks to Add

#### 1. `fd_say_expression` — "Say [expression]" (command)
- Has `appendValueInput("EXPRESSION")` that accepts ANY reporter (String, Number)
- Generator: `say(target, String(expression));`
- This lets users snap `emotion`, `face count`, `face x position` etc. into the Say block

#### 2. `fd_go_to_face` — "Go to face [N] position" (command)
- Has `appendValueInput("N")` for face number (accepts `face x position` / `face y position`)
- Actually simpler: two separate blocks `fd_move_to_face_x` and `fd_move_to_face_y`
- Or better: a single "go to x [value] y [value]" block with two `appendValueInput` slots

#### 3. `fd_if_expression` — "If [boolean] then" (command, C-shaped)
- Has `appendValueInput("CONDITION")` that accepts Boolean reporters like `is expression`
- Has `appendStatementInput("DO")` for inner blocks
- Generator: `if (condition) { ... }`
- This is the critical block — without it, Boolean reporters are useless

### Files to Modify

#### 1. `src/extensions/extensionDefinitions.ts`
Update `IGNITE_FACE_DETECTION_BLOCKS` array and `getIgniteToolbox` to include the 3 new bridge blocks.

Add to `registerIgniteBlocks`:
```javascript
// Say [expression] — accepts any reporter as input
{
    type: 'fd_say_expression',
    message0: '💬 say %1',
    args0: [{ type: 'input_value', name: 'EXPRESSION', check: ['String', 'Number'] }],
    previousStatement: null, nextStatement: null, colour: '#D43D41'
},

// Go to x [value] y [value] — accepts number reporters
{
    type: 'fd_go_to_face',
    message0: 'go to x %1 y %2',
    args0: [
        { type: 'input_value', name: 'X', check: 'Number' },
        { type: 'input_value', name: 'Y', check: 'Number' }
    ],
    previousStatement: null, nextStatement: null, colour: '#D43D41'
},

// If [boolean] then — C-shaped, accepts boolean reporters
{
    type: 'fd_if_expression',
    message0: 'if %1 then',
    args0: [{ type: 'input_value', name: 'CONDITION', check: 'Boolean' }],
    previousStatement: null, nextStatement: null,
    colour: '#D43D41'
},
```

Add generators:
```javascript
jsGen.forBlock['fd_say_expression'] = (b) => {
    const expr = javascriptGenerator.valueToCode(b, 'EXPRESSION', javascriptGenerator.ORDER_NONE) || "''";
    return `say(${getTarget()}, String(${expr}));\n`;
};
jsGen.forBlock['fd_go_to_face'] = (b) => {
    const x = javascriptGenerator.valueToCode(b, 'X', javascriptGenerator.ORDER_NONE) || '0';
    const y = javascriptGenerator.valueToCode(b, 'Y', javascriptGenerator.ORDER_NONE) || '0';
    return `goToLocation(${getTarget()}, ${x}, ${y});\n`;
};
jsGen.forBlock['fd_if_expression'] = (b) => {
    const cond = javascriptGenerator.valueToCode(b, 'CONDITION', javascriptGenerator.ORDER_NONE) || 'false';
    const body = javascriptGenerator.statementToCode(b, 'DO');
    return `if (${cond}) {\n${body}\n}\n`;
};
```

Wait — generators are already in `registerGenerators` for the full extension. The Ignite blocks share the same opcodes, so generators are already registered. We just need the BLOCK DEFINITIONS (shape) in `registerIgniteBlocks`.

Actually, looking more carefully: the new bridge blocks (`fd_say_expression`, `fd_go_to_face`, `fd_if_expression`) are **new block types** that don't exist in the full Embed extension. They need their OWN generators too.

So we need to add generators inside `registerIgniteBlocks` or add them to `registerGenerators` with guards.

Best approach: Add the generators inside the `registerIgniteBlocks` function since they're Ignite-only.

#### 2. `src/leapignite/client/hooks/useJuniorWorkspace.jsx`
Update `getToolboxXml` to handle `input_value` connections — but actually, Blockly XML already handles this natively. The `<block type="fd_say_expression">` with `<value name="EXPRESSION"><block type="fd_emotion"/></value>` would work. But since we're generating XML from the toolbox, we just list the block types and Blockly handles the rest.

Actually, we also need to make sure `getToolboxXml` passes value inputs properly. Looking at the current code:

```jsx
xml += `<block type="${b.type}">`;
```

This just creates `<block type="..."></block>` without any value inputs. For blocks with value inputs, Blockly needs `<value>` children. But the toolbox just shows blocks in the flyout — when the user drags them out, they can snap reporters in. So the toolbox XML doesn't need to pre-populate values.

The key issue is that `getToolboxXml` currently generates simple blocks. The value inputs will work automatically because Blockly handles the connection types internally.

### Block Shape Summary

| New Block | Shape | Accepts | Purpose |
|---|---|---|---|
| `fd_say_expression` | Statement (C-shaped) | `input_value` String/Number | Say dynamic text from face data |
| `fd_go_to_face` | Statement | `input_value` Number x2 | Move to face position |
| `fd_if_expression` | Statement (C-shaped) | `input_value` Boolean + `input_statement` | Conditional based on face data |

### Example Testing Programs for Ignite

#### Program 1: Say the emotion
```
[Start]
  [Forever]
    [analyse image from camera]
    [💬 say [emotion]]     ← emotion reporter plugs into Say
```

#### Program 2: Follow the face
```
[Start]
  [Forever]
    [analyse image from camera]
    [go to x [face 1 x position] y [face 1 y position]]  ← reporters plug into Go To
```

#### Program 3: React to happy face
```
[Start]
  [Forever]
    [analyse image from camera]
    [if [is expression of face 1 happy] then]   ← Boolean reporter plugs into If
      [💬 say "Happy!"]
      [🔊 Play Note]
```

#### Program 4: Count and display
```
[Start]
  [Forever]
    [analyse image from camera]
    [💬 say [face count]]    ← number reporter plugs into Say
```

### What Stays Unchanged
- `IntermediateApp.tsx` — Embed uses full 21 blocks (unchanged)
- All existing Ignite blocks — untouched
- Face detection runtime — untouched (all blocks call same `window.runtime.face.*`)
- Extension library UIs — untouched

### Verification
- Build check with `npx tsc --noEmit`
- Manual test: Add face detection extension in Ignite, verify 10 blocks show in flyout
- Drag `analyse image from camera` → `Forever` → `Start` — verify it works
- Drag `💬 say` block, snap `emotion` reporter into it — verify it shows emotion text
- Drag `if [boolean] then` block, snap `is expression of face 1 happy` into condition — verify it works
