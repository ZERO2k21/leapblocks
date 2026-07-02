# Plan: Add "No Hand Detected" Support + Correct Program

## User's Desired Program

```
When green flag clicked:
  camera on
  analyze hand
  say "Hi!"
  wait 1 seconds

When hand sign Thumbs Up:
  say "HELLO" for 2 seconds

When hand sign No Hand:
  say "no hand detect" for 2 seconds
```

## Problem

The current system has **no "no hand detected" state**:
- `detectGesture()` is only called when landmarks exist (line 142 in HandPose.ts)
- When the hand disappears, `_lastSign` stays at the last gesture forever
- There's no "No Hand" option in the dropdown
- The polling can't match a "no hand" state

## Changes Needed (4 files)

### 1. Add `'no_hand'` detection in the loop

**File:** `leaplab_frontend/src/extensions/HandPose.ts` (line 142)

```typescript
// FROM:
if (results.landmarks && results.landmarks.length > 0) {
    this._landmarks = results.landmarks;
    this.processLandmarks();
}

// TO:
if (results.landmarks && results.landmarks.length > 0) {
    this._landmarks = results.landmarks;
    this.processLandmarks();
} else {
    // Hand disappeared from camera
    this._landmarks = [];
    if (this._lastSign !== 'no_hand') {
        this._lastSign = 'no_hand';
        this.triggerGesture('no_hand');
    }
}
```

### 2. Add `'No Hand'` to dropdown in HandPose.ts (line 418-422)

```typescript
options: [
    ['Peace', '2'],
    ['Open', '5'],
    ['Thumbs Up', 'thumbs_up'],
    ['No Hand', 'no_hand']      // NEW
]
```

### 3. Add `'No Hand'` to dropdown in extensionDefinitions.ts (line 556)

```typescript
options: [['Peace', '2'], ['Open', '5'], ['Thumbs Up', 'thumbs_up'], ['No Hand', 'no_hand']]
```

### 4. Add `'No Hand'` to dropdown in hand-pose/index.ts (line 14)

```typescript
{ type: 'field_dropdown', name: 'SIGN', options: [['Peace', '2'], ['Open', '5'], ['Thumbs Up', 'thumbs_up'], ['No Hand', 'no_hand']] }
```

### No changes needed in:
- `AnimationVM.ts` — polling already does `currentSign === script.triggerKey`, so `'no_hand'` matches naturally
- `animation-generator.ts` — compiler reads `SIGN` from field, stores as `triggerKey`

## How It Works After Fix

1. Green flag → camera on → analyze hand → say "Hi!" → wait 1s
2. User shows Thumbs Up → `getSign()` returns `'thumbs_up'` → matches `'thumbs_up'` → say "HELLO" for 2s
3. User removes hand from camera → `getSign()` returns `'no_hand'` → matches `'no_hand'` → say "no hand detect" for 2s
4. Edge detection ensures each state fires only once per transition

## Block Program Structure

```
┌─ When green flag clicked ──────────────┐
│  camera [on]                           │
│  analyze hand                          │
│  say [Hi!]                             │
│  wait (1) seconds                      │
└────────────────────────────────────────┘

┌─ When hand sign [Thumbs Up] ───────────┐
│  say [HELLO] for (2) seconds           │
└────────────────────────────────────────┘

┌─ When hand sign [No Hand] ─────────────┐
│  say [no hand detect] for (2) seconds  │
└────────────────────────────────────────┘
```
