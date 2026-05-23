# Block System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        BLOCKLY RUNTIME                          │
│                    (Shared by all modes)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                           │
        ▼                                           ▼
┌──────────────────┐                      ┌──────────────────┐
│   IGNITE MODE    │                      │   EMBED MODE     │
│   (Junior UI)    │                      │  (Full Scratch)  │
└──────────────────┘                      └──────────────────┘
        │                                           │
        │                                           │
        ▼                                           ▼
┌──────────────────┐                      ┌──────────────────┐
│  Ignite Blocks   │                      │   Embed Blocks   │
│  blocks.js       │                      │  Multiple files  │
│                  │                      │                  │
│  • field_dropdown│                      │  • Stage Mode    │
│  • Emoji-based   │                      │  • Upload Mode   │
│  • Simplified    │                      │  • Hardware Mode │
└──────────────────┘                      └──────────────────┘
```

## Embed Mode Block Registration Flow

### BEFORE FIX (❌ Broken)

```
1. registerleapBlocks()
   └─> looks_say (field_input) ✓ registered
   
2. animationBlocks
   └─> looks_say (input_value) ✗ SKIPPED (already exists)
   
3. Toolbox tries to create looks_say with shadow connection
   └─> ❌ ERROR: MissingConnection (block has field_input, not input_value)
```

### AFTER FIX (✅ Working)

```
1. registerAnimationLooksBlocks()
   └─> looks_say (input_value) ✓ registered FIRST
   
2. animationBlocks
   └─> looks_say_for_secs (input_value) ✓ registered
   └─> other animation blocks ✓ registered
   
3. registerleapBlocks()
   └─> looks_say (field_input) ✗ SKIPPED (already exists)
   └─> looks_sayforsecs (field_input) ✓ registered (different name)
   
4. Toolbox creates looks_say with shadow connection
   └─> ✅ SUCCESS: Block has input_value connection
```

## Block Definition Comparison

### Animation Blocks (Stage Mode)

```typescript
// looks_say with input_value
{
  type: 'looks_say',
  message0: '🗣️ say %1',
  args0: [{ type: 'input_value', name: 'MESSAGE' }],
  // ↑ Creates a CONNECTION for shadow blocks
}
```

**Toolbox Usage:**
```typescript
{
  kind: 'block',
  type: 'looks_say',
  inputs: {
    MESSAGE: { 
      shadow: { type: 'text', fields: { TEXT: 'Hello!' } } 
    }
  }
}
```

**Result:** `[say [Hello!]]` - Text block connects to say block

---

### Leap Blocks (Hardware Mode)

```typescript
// looks_say with field_input
{
  type: 'looks_say',
  message0: 'say %1',
  args0: [{ type: 'field_input', name: 'MESSAGE', text: 'Hello!' }],
  // ↑ Creates a TEXT FIELD (no connection)
}
```

**Toolbox Usage:**
```typescript
{
  kind: 'block',
  type: 'looks_say'
}
```

**Result:** `[say Hello!]` - Text field embedded in block

---

### Ignite Blocks (Junior Mode)

```javascript
// looks_say with field_dropdown
Blockly.Blocks['looks_say'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("💬 Say")
      .appendField(new Blockly.FieldDropdown(EMOJI_OPTIONS), "MSG");
    // ↑ Creates a DROPDOWN (no connection)
  }
};
```

**Result:** `[💬 Say 🙂▼]` - Dropdown with emoji options

## File Structure

```
src/
├── leapignite/                    # Junior/Simplified System
│   ├── client/
│   │   └── hooks/
│   │       └── useJuniorWorkspace.tsx
│   └── server/
│       └── blocks/
│           ├── blocks.js          # Ignite-specific blocks
│           ├── looksBlocks.js
│           └── soundBlocks.js
│
└── leapembed/                     # Full Scratch-like System
    ├── client/
    │   └── hooks/
    │       └── useBlocklyInit.ts  # ← MODIFIED (registration order)
    └── server/
        ├── blockly/
        │   └── runtime.ts         # ← MODIFIED (error handling)
        └── blocks/
            ├── animationBlocksOnly.ts  # ← NEW (explicit definitions)
            ├── animationBlocks.ts      # Stage mode blocks
            ├── leapBlocks.ts           # Hardware mode blocks
            ├── arduinoBlocks.ts        # Arduino-specific
            └── esp32Blocks.ts          # ESP32-specific
```

## Mode-Specific Block Usage

### Stage Mode (Animation)
- ✅ Uses `animationBlocksOnly.ts` + `animationBlocks.ts`
- ✅ Blocks have `input_value` connections
- ✅ Supports shadow blocks in toolbox
- ✅ Full Scratch-like experience

### Upload Mode (Hardware)
- ✅ Uses `arduinoBlocks.ts` or `esp32Blocks.ts`
- ✅ Uses `leapBlocks.ts` for shared blocks
- ✅ Blocks have `field_input` for simplicity
- ✅ Hardware-specific code generation

### Junior Mode (Ignite)
- ✅ Uses `leapignite/server/blocks/blocks.js`
- ✅ Completely independent system
- ✅ Simplified UI with emojis
- ✅ No conflicts with Embed

## Key Design Principles

1. **Separation of Concerns**
   - Each mode has its own block definitions
   - No shared mutable state between modes

2. **Registration Order Matters**
   - First registered definition wins
   - Animation blocks register before leap blocks

3. **Explicit Over Implicit**
   - `animationBlocksOnly.ts` explicitly defines conflicting blocks
   - No reliance on implicit filtering

4. **Graceful Degradation**
   - Error handling prevents crashes
   - Console warnings for debugging

5. **Backward Compatibility**
   - Existing workspaces still load
   - No breaking changes to APIs

---

**Visual Legend:**
- ✓ = Successfully registered
- ✗ = Skipped (already exists)
- ❌ = Error/Broken
- ✅ = Working correctly
