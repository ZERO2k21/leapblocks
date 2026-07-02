# Fix: `hp_when_sign` Hat Block Not Triggering Sprite Actions

## Problem
The "when hand sign" hat block (e.g., "when hand sign Thumbs Up") is defined but never triggers the blocks attached below it. The Thumbs Up, Peace, and Open gestures are detected but the sprite doesn't respond.

## Root Causes (3 bugs)

### Bug 1: Not recognized as a hat block trigger in compiler
`compileTopBlock()` in `animation-generator.ts` doesn't have a case for `hp_when_sign`, so it returns `null` and the block is never compiled into a script.

### Bug 2: No polling mechanism for hand signs
Unlike key presses (DOM event) or green flag (button click), hand signs need continuous polling (live camera feed), but no `startHandSignPolling()` exists in `AnimationVM.ts`.

### Bug 3: Missing `hat: 'event'` in block definition
`extensionDefinitions.ts:554-558` doesn't include `hat: 'event'`, so Blockly doesn't render it as a hat block.

---

## Fix 1: Add `'hand_sign'` to trigger union

**File:** `leaplab_frontend/src/vm/AnimationVM.ts` (line 38)

**Change:**
```typescript
// FROM:
trigger: 'flag' | 'sprite_click' | 'key' | 'clone' | 'broadcast_receive' | 'backdrop_switch' | 'greater_than' | 'procedure' | 'physics_collision';

// TO:
trigger: 'flag' | 'sprite_click' | 'key' | 'clone' | 'broadcast_receive' | 'backdrop_switch' | 'greater_than' | 'hand_sign' | 'procedure' | 'physics_collision';
```

## Fix 2: Add polling state variables

**File:** `leaplab_frontend/src/vm/AnimationVM.ts` (after line 302)

**Add after `greaterThanFired`:**
```typescript
private handSignPollingId: ReturnType<typeof setInterval> | null = null;
private handSignFired: Set<string> = new Set();
```

## Fix 3: Add `startHandSignPolling()` and `stopHandSignPolling()` methods

**File:** `leaplab_frontend/src/vm/AnimationVM.ts` (after `stopGreaterThanPolling()` method, around line 2887)

**Add:**
```typescript
private startHandSignPolling(): void {
    this.stopHandSignPolling();
    this.handSignFired.clear();

    const allSprites = spriteManager.getAllSprites();
    const allScripts: CompiledScript[] = [];

    for (const sprite of allSprites) {
        const scripts = (sprite.scripts as CompiledScript[]) || [];
        for (const script of scripts) {
            if (script.trigger === 'hand_sign') {
                allScripts.push(script);
            }
        }
    }
    for (const script of this.stageScripts) {
        if (script.trigger === 'hand_sign') {
            allScripts.push(script);
        }
    }

    if (allScripts.length === 0) return;

    vmLog.info(`Starting hand_sign polling for ${allScripts.length} script(s)`);

    const signMap: Record<string, string> = { '2': 'Peace', '5': 'Open', 'thumbs_up': 'Thumbs Up' };

    this.handSignPollingId = setInterval(() => {
        if (!this.isRunning) return;

        for (const script of allScripts) {
            if (!script.triggerKey) continue;

            const targetName = signMap[script.triggerKey] || script.triggerKey;
            let currentSign = '';
            if (typeof window !== 'undefined' && (window as any).runtime?.handPose) {
                currentSign = (window as any).runtime.handPose.getSign() || '';
            }

            const conditionMet = currentSign === targetName;
            const hatId = script.hatBlockId || script.triggerKey;

            if (conditionMet && !this.handSignFired.has(hatId)) {
                this.handSignFired.add(hatId);
                this.setRunning(true);
                this.stopScriptByHat(script.spriteId, hatId);
                this.runScript(script).catch(err => {
                    vmLog.error('Error in hand_sign trigger script', err);
                });
            } else if (!conditionMet) {
                this.handSignFired.delete(hatId);
            }
        }
    }, 100);
}

private stopHandSignPolling(): void {
    if (this.handSignPollingId !== null) {
        clearInterval(this.handSignPollingId);
        this.handSignPollingId = null;
    }
    this.handSignFired.clear();
}
```

## Fix 4: Call polling from `triggerFlag()` and `stopAll()`

**File:** `leaplab_frontend/src/vm/AnimationVM.ts`

**In `triggerFlag()` (after line 702):**
```typescript
// After: this.startGreaterThanPolling();
this.startHandSignPolling();
```

**In `stopAll()` (after line 797):**
```typescript
// After: this.stopGreaterThanPolling();
this.stopHandSignPolling();
```

## Fix 5: Add `hp_when_sign` to `compileTopBlock()`

**File:** `leaplab_frontend/src/generators/animation-generator.ts` (before the `default:` case at line 1177)

**Add new case:**
```typescript
case 'hp_when_sign':
    trigger = 'hand_sign';
    triggerKey = block.getFieldValue('SIGN') || '2';
    compilerLog.info(`  Trigger: hand sign (${triggerKey})`);
    break;
```

**Also update the trigger type annotation on line 1108:**
```typescript
// FROM:
let trigger: 'flag' | 'sprite_click' | 'key' | 'clone' | 'broadcast_receive' | 'backdrop_switch' | 'greater_than' | 'procedure' | 'physics_collision';

// TO:
let trigger: 'flag' | 'sprite_click' | 'key' | 'clone' | 'broadcast_receive' | 'backdrop_switch' | 'greater_than' | 'hand_sign' | 'procedure' | 'physics_collision';
```

## Fix 6: Add `hat: 'event'` to block definition

**File:** `leaplab_frontend/src/extensions/extensionDefinitions.ts` (line 554-558)

**Change:**
```typescript
// FROM:
{
    type: 'hp_when_sign', message0: 'when hand sign %1',
    args0: [{ type: 'field_dropdown', name: 'SIGN', options: [['Peace', '2'], ['Open', '5'], ['Thumbs Up', 'thumbs_up']] }],
    nextStatement: true, colour: '#D43D41'
},

// TO:
{
    type: 'hp_when_sign', message0: 'when hand sign %1',
    args0: [{ type: 'field_dropdown', name: 'SIGN', options: [['Peace', '2'], ['Open', '5'], ['Thumbs Up', 'thumbs_up']] }],
    nextStatement: true, colour: '#D43D41',
    hat: 'event'
},
```

## Fix 7: Remove dead `hp_when_sign` case from `executeStep()`

**File:** `leaplab_frontend/src/vm/AnimationVM.ts` (lines 1613-1625)

**Remove:**
```typescript
case 'hp_when_sign' as any: {
    // Event-style block: check if current hand sign matches
    const targetSign = (step as any).sign || '2';
    if (typeof window !== 'undefined' && (window as any).runtime?.handPose) {
        const currentSign = (window as any).runtime.handPose.getSign();
        const signMap: Record<string, string> = { '2': 'Peace', '5': 'Open', 'thumbs_up': 'Thumbs Up' };
        const targetName = signMap[targetSign] || targetSign;
        if (currentSign === targetName) {
            vmLog.info(`Hand sign matched: ${targetName}`);
        }
    }
    break;
}
```

---

## Summary of Changes

| File | Lines | Change |
|---|---|---|
| `AnimationVM.ts` | 38 | Add `'hand_sign'` to trigger union |
| `AnimationVM.ts` | ~302 | Add `handSignPollingId` and `handSignFired` state variables |
| `AnimationVM.ts` | ~702 | Call `startHandSignPolling()` in `triggerFlag()` |
| `AnimationVM.ts` | ~797 | Call `stopHandSignPolling()` in `stopAll()` |
| `AnimationVM.ts` | ~2887 | Add `startHandSignPolling()` and `stopHandSignPolling()` methods |
| `AnimationVM.ts` | 1613-1625 | Remove dead `hp_when_sign` case from `executeStep()` |
| `animation-generator.ts` | 1108 | Add `'hand_sign'` to trigger type annotation |
| `animation-generator.ts` | ~1176 | Add `hp_when_sign` case in `compileTopBlock()` |
| `extensionDefinitions.ts` | 554-558 | Add `hat: 'event'` to `hp_when_sign` definition |

## Fix 8: Remove broken signMap from polling comparison

**File:** `leaplab_frontend/src/vm/AnimationVM.ts` (inside `startHandSignPolling()`)

### Bug
The `signMap` converts `script.triggerKey` (e.g. `'thumbs_up'`) to a display name (`'Thumbs Up'`), then compares against `getSign()` which returns the raw value (`'thumbs_up'`). This comparison is **always false**.

### The mismatch
| Source | Returns |
|---|---|
| `detectGesture()` / `getSign()` | `'thumbs_up'` (raw) |
| `signMap['thumbs_up']` | `'Thumbs Up'` (display name) |
| Comparison | `'thumbs_up' === 'Thumbs Up'` → **always false** |

### Why signMap is unnecessary
The block dropdown values (`'2'`, `'5'`, `'thumbs_up'`) already match what `detectGesture()` returns directly. No mapping needed.

### Change
```typescript
// FROM (broken):
const signMap: Record<string, string> = { '2': 'Peace', '5': 'Open', 'thumbs_up': 'Thumbs Up' };

this.handSignPollingId = setInterval(() => {
    if (!this.isRunning) return;

    for (const script of allScripts) {
        if (!script.triggerKey) continue;

        const targetName = signMap[script.triggerKey] || script.triggerKey;
        let currentSign = '';
        if (typeof window !== 'undefined' && (window as any).runtime?.handPose) {
            currentSign = (window as any).runtime.handPose.getSign() || '';
        }

        const conditionMet = currentSign === targetName;
        const hatId = script.hatBlockId || script.triggerKey;

// TO (fixed):
this.handSignPollingId = setInterval(() => {
    if (!this.isRunning) return;

    for (const script of allScripts) {
        if (!script.triggerKey) continue;

        // detectGesture() returns raw values: '2', '5', 'thumbs_up', 'none'
        // script.triggerKey comes from the dropdown and matches these values directly
        let currentSign = '';
        if (typeof window !== 'undefined' && (window as any).runtime?.handPose) {
            currentSign = (window as any).runtime.handPose.getSign() || '';
        }

        const conditionMet = currentSign === script.triggerKey;
        const hatId = script.hatBlockId || script.triggerKey;
```

---

## Summary of Changes

| File | Lines | Change |
|---|---|---|
| `AnimationVM.ts` | 38 | Add `'hand_sign'` to trigger union |
| `AnimationVM.ts` | ~302 | Add `handSignPollingId` and `handSignFired` state variables |
| `AnimationVM.ts` | ~702 | Call `startHandSignPolling()` in `triggerFlag()` |
| `AnimationVM.ts` | ~797 | Call `stopHandSignPolling()` in `stopAll()` |
| `AnimationVM.ts` | ~2887 | Add `startHandSignPolling()` and `stopHandSignPolling()` methods |
| `AnimationVM.ts` | ~2911 | **Remove broken signMap**, compare `currentSign === script.triggerKey` directly |
| `AnimationVM.ts` | 1613-1625 | Remove dead `hp_when_sign` case from `executeStep()` |
| `animation-generator.ts` | 1108 | Add `'hand_sign'` to trigger type annotation |
| `animation-generator.ts` | ~1176 | Add `hp_when_sign` case in `compileTopBlock()` |
| `extensionDefinitions.ts` | 554-558 | Add `hat: 'event'` to `hp_when_sign` definition |

## How It Works After Fix

1. User places "when hand sign Thumbs Up" hat block with "say Hi!" below it
2. Green flag clicked → `triggerFlag()` runs flag scripts AND starts `startHandSignPolling()`
3. Polling runs every 100ms, checking `handPose.getSign()` which returns `'thumbs_up'`
4. `script.triggerKey` is `'thumbs_up'` (from dropdown) — comparison `'thumbs_up' === 'thumbs_up'` → **true**
5. Polling calls `stopScriptByHat()` then `runScript()` → executes "say Hi!" block
6. Robot sprite displays speech bubble for 2 seconds
7. When gesture changes, edge detection resets and can fire again on next detection
