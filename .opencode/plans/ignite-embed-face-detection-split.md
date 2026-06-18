# Plan: Separate Ignite vs Embed Block Sets for face_detection Extension

## Problem
Both Ignite (Junior) and Embed (Intermediate) share the same 21-block face_detection definition. Ignite shows too many complex blocks (landmarks, face recognition training/testing) not suitable for younger users.

## Solution
Add optional `registerIgniteBlocks`/`getIgniteToolbox` methods to the `ExtensionDef` interface, and a `getIgniteExtension()` helper that uses simplified blocks when available.

---

## File Changes

### 1. `src/extensions/extensionDefinitions.ts`

#### A. Update `ExtensionDef` interface (lines 3-11)
Add two optional methods:
```typescript
export interface ExtensionDef {
    id: string;
    name: string;
    color: string;
    icon: string;
    registerBlocks: (Blockly: any) => void;
    registerGenerators: (Blockly: any) => void;
    getToolbox: () => any[];
    registerIgniteBlocks?: (Blockly: any) => void;
    getIgniteToolbox?: () => any[];
}
```

#### B. Add Ignite block definitions inside `face_detection` entry (after line 229, before `registerGenerators`)
Add these two methods to the `face_detection` EXTENSIONS object:

```typescript
registerIgniteBlocks: (Blockly: any) => {
    const igniteBlockDefs = [
        {
            type: 'fd_analyse_image',
            message0: 'analyse image from %1',
            args0: [{ type: 'field_dropdown', name: 'SOURCE', options: [['camera', 'camera'], ['image', 'image']] }],
            previousStatement: null, nextStatement: null, colour: '#D43D41'
        },
        { type: 'fd_face_count', message0: 'face count', output: 'Number', colour: '#b71c1c' },
        { type: 'fd_emotion', message0: 'emotion', output: 'String', colour: '#b71c1c' },
        {
            type: 'fd_is_expression',
            message0: 'is expression of face %1 %2',
            args0: [
                { type: 'field_number', name: 'N', value: 1, min: 1 },
                { type: 'field_dropdown', name: 'EXPRESSION', options: [['happy', 'happy'], ['sad', 'sad'], ['angry', 'angry'], ['surprised', 'surprised'], ['neutral', 'neutral']] }
            ],
            output: 'Boolean', colour: '#b71c1c'
        },
        {
            type: 'fd_face_x',
            message0: 'face %1 x position',
            args0: [{ type: 'field_number', name: 'N', value: 1 }],
            output: 'Number', colour: '#b71c1c'
        },
        {
            type: 'fd_face_y',
            message0: 'face %1 y position',
            args0: [{ type: 'field_number', name: 'N', value: 1 }],
            output: 'Number', colour: '#b71c1c'
        },
        {
            type: 'fd_camera',
            message0: 'camera %1',
            args0: [{ type: 'field_dropdown', name: 'ACTION', options: [['on', 'on'], ['off', 'off'], ['flip', 'flip']] }],
            previousStatement: null, nextStatement: null, colour: '#D43D41'
        },
    ];
    const newDefs = igniteBlockDefs.filter((d: any) => !Blockly.Blocks[d.type]);
    if (newDefs.length > 0) {
        Blockly.common.defineBlocks(Blockly.common.createBlockDefinitionsFromJsonArray(newDefs));
    }
},
getIgniteToolbox: () => [
    { kind: 'block', type: 'fd_analyse_image' },
    { kind: 'block', type: 'fd_face_count' },
    { kind: 'block', type: 'fd_emotion' },
    { kind: 'block', type: 'fd_is_expression' },
    { kind: 'block', type: 'fd_face_x' },
    { kind: 'block', type: 'fd_face_y' },
    { kind: 'block', type: 'fd_camera' },
],
```

#### C. Add `getIgniteExtension()` export function (after line 1836)
```typescript
export function getIgniteExtension(id: string) {
    const ext = EXTENSIONS[id];
    if (ext && ext.registerIgniteBlocks && ext.getIgniteToolbox) {
        return {
            ...ext,
            registerBlocks: ext.registerIgniteBlocks,
            getToolbox: ext.getIgniteToolbox,
        };
    }
    return ext;
}
```

### 2. `src/leapignite/client/hooks/useJuniorWorkspace.jsx`

#### A. Update import (line 18)
```jsx
// BEFORE:
import { EXTENSIONS, registerExtensions } from "../../../extensions/extensionDefinitions";

// AFTER:
import { EXTENSIONS, registerExtensions, getIgniteExtension } from "../../../extensions/extensionDefinitions";
```

#### B. Update `handleAddExtension` (line 231)
```jsx
// BEFORE:
const ext = EXTENSIONS[id];

// AFTER:
const ext = getIgniteExtension(id) || EXTENSIONS[id];
```

---

## What stays unchanged
- `IntermediateApp.tsx` — Still uses `EXTENSIONS[id]` directly (full 21 blocks)
- `RuntimeBridge.ts` — Shared runtime, no change needed
- `IgniteExtensionLibrary.jsx` — No change (just posts ADD_EXTENSION message)
- `JuniorExtensionLibrary.jsx` — No change
- Extension card UIs — No change

## Verification
- Run `npx tsc --noEmit` to type-check
- Ignite should show 7 blocks for face_detection
- Embed should show all 21 blocks for face_detection
