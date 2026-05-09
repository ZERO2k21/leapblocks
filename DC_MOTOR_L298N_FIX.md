# DC Motor + L298N Motor Driver - Fix Summary

## Problem (பிரச்சனை)

Arduino + L298N motor driver + DC motor + 12V battery connection-ல motor run ஆகல.

## Root Causes Found (கண்டுபிடிக்கப்பட்ட பிரச்சனைகள்)

### 1. Speed Value Mismatch ❌
**Issue**: CircuitEngine sets speed to `100` or `-100`, but DC motor element expects `0-1` range.

```typescript
// BEFORE (CircuitEngine.ts)
if (pos && !neg) speed = 100;        // ❌ Wrong range
else if (!pos && neg) speed = -100;  // ❌ Wrong range
```

**Impact**: Motor speed property was out of range, animation wouldn't work properly.

### 2. Direction Not Set ❌
**Issue**: CircuitEngine didn't set the `direction` property at all.

```typescript
// BEFORE
updateNodeData(target.nodeId, { pinStates: newPinStates, speed });
// Missing: direction property
```

**Impact**: Motor always rotated clockwise, reverse direction didn't work.

### 3. Speed Check Logic ❌
**Issue**: DC motor element only animated when `speed > 0`, so negative speeds were ignored.

```typescript
// BEFORE (dc-motor-element.ts)
if (this.speed > 0) {  // ❌ Negative speed ignored
  // animate...
}
```

**Impact**: Reverse direction (negative speed) wouldn't animate.

### 4. No Property Mapping ❌
**Issue**: LeapNode.tsx didn't map DC motor properties from data to element.

**Impact**: Even if CircuitEngine set the properties, they wouldn't reach the visual element.

## Fixes Applied (செய்த திருத்தங்கள்)

### Fix 1: Normalized Speed & Added Direction ✅

**File**: `src/Electra/Client/Src/engine/Arduino/CircuitEngine.ts`

```typescript
// AFTER
if (target.type === 'dc-motor') {
  const pos = !!newPinStates['pin_POS'];
  const neg = !!newPinStates['pin_NEG'];
  let speed = 0;
  let direction = 'cw';
  if (pos && !neg) {
    speed = 1.0; // ✅ Normalized to 0-1 range
    direction = 'cw'; // ✅ Clockwise
  } else if (!pos && neg) {
    speed = 1.0; // ✅ Normalized to 0-1 range
    direction = 'ccw'; // ✅ Counter-clockwise
  }
  updateNodeData(target.nodeId, { pinStates: newPinStates, speed, direction });
}
```

**Changes**:
- ✅ Speed normalized to `1.0` (0-1 range)
- ✅ Direction set to `'cw'` or `'ccw'`
- ✅ Both properties passed to updateNodeData

### Fix 2: Fixed Speed Check Logic ✅

**File**: `src/Electra/Client/utlis/elements/leap-elements/dc-motor-element.ts`

```typescript
// BEFORE
if (this.speed > 0) {  // ❌ Only positive
  const rotationDelta = (this.speed * delta * 0.5);
  this._rotation += (this.direction === 'cw' ? rotationDelta : -rotationDelta);
}

// AFTER
if (this.speed !== 0) {  // ✅ Any non-zero speed
  const absSpeed = Math.abs(this.speed);
  const rotationDelta = (absSpeed * delta * 0.5);
  this._rotation += (this.direction === 'cw' ? rotationDelta : -rotationDelta);
}
```

**Changes**:
- ✅ Changed `speed > 0` to `speed !== 0`
- ✅ Use absolute value for rotation calculation
- ✅ Direction controls rotation direction

### Fix 3: Fixed Render Check ✅

**File**: `src/Electra/Client/utlis/elements/leap-elements/dc-motor-element.ts`

```typescript
// BEFORE
const isRunning = this.speed > 0;  // ❌ Only positive

// AFTER
const isRunning = this.speed !== 0;  // ✅ Any non-zero speed
```

**Changes**:
- ✅ Vibration effect works for both directions

### Fix 4: Added Property Mapping ✅

**File**: `src/Electra/Client/Src/components/Nodes/LeapNode.tsx`

```typescript
// ADDED
} else if (data.type === 'dc-motor') {
  // DC Motor: speed and direction from CircuitEngine
  mappedProps.speed = data.speed ?? 0;
  mappedProps.direction = data.direction ?? 'cw';
}
```

**Changes**:
- ✅ Maps speed from node data to element
- ✅ Maps direction from node data to element

### Fix 5: Added Imperative Property Setter ✅

**File**: `src/Electra/Client/Src/components/Nodes/LeapNode.tsx`

```typescript
// ADDED
// Imperatively set dc-motor speed and direction as DOM properties.
useEffect(() => {
  if (!elementRef.current || data.type !== 'dc-motor') return;
  const el = elementRef.current;
  el.speed = data.speed ?? 0;
  el.direction = data.direction ?? 'cw';
}, [data.type, data.speed, data.direction]);
```

**Changes**:
- ✅ Directly sets DOM properties (bypasses React JSX string conversion)
- ✅ Updates when speed or direction changes

## How It Works Now (இப்போ எப்படி வேலை செய்யும்)

### Complete Flow:

```
Arduino Pin (HIGH/LOW)
  ↓
CircuitEngine detects pin change
  ↓
Traces to L298N motor driver
  ↓
L298N checks:
  - 12V power from battery? ✅
  - ENA/ENB enabled? ✅
  - IN1/IN2/IN3/IN4 signals? ✅
  ↓
Calculates motor outputs:
  - Motor A: OUT1 (a_pos), OUT2 (a_neg)
  - Motor B: OUT3 (b_pos), OUT4 (b_neg)
  ↓
Propagates to DC motor:
  - POS pin = OUT1 or OUT3
  - NEG pin = OUT2 or OUT4
  ↓
Sets DC motor properties:
  - speed = 1.0 (if POS && !NEG or !POS && NEG)
  - direction = 'cw' (if POS && !NEG) or 'ccw' (if !POS && NEG)
  ↓
LeapNode maps properties to element
  ↓
DC motor element animates:
  - Shaft rotates (cw or ccw)
  - Motor vibrates
  - Visual feedback
```

## Testing (சோதனை)

### Test Circuit:

```
Arduino UNO
  ├─ Pin 9 → L298N IN1
  ├─ Pin 10 → L298N IN2
  └─ GND → L298N GND

L298N Motor Driver
  ├─ 12V ← Battery POS
  ├─ GND ← Battery NEG
  ├─ OUT1 → DC Motor POS
  └─ OUT2 → DC Motor NEG

12V Battery
  ├─ POS → L298N 12V
  └─ NEG → L298N GND
```

### Test Code:

```cpp
// Motor A forward
void setup() {
  pinMode(9, OUTPUT);
  pinMode(10, OUTPUT);
}

void loop() {
  // Forward
  digitalWrite(9, HIGH);
  digitalWrite(10, LOW);
  delay(2000);
  
  // Stop
  digitalWrite(9, LOW);
  digitalWrite(10, LOW);
  delay(1000);
  
  // Reverse
  digitalWrite(9, LOW);
  digitalWrite(10, HIGH);
  delay(2000);
  
  // Stop
  digitalWrite(9, LOW);
  digitalWrite(10, LOW);
  delay(1000);
}
```

### Expected Behavior:

1. **Forward (IN1=HIGH, IN2=LOW)**:
   - ✅ Motor shaft rotates clockwise
   - ✅ Motor vibrates
   - ✅ Speed = 1.0, Direction = 'cw'

2. **Stop (IN1=LOW, IN2=LOW)**:
   - ✅ Motor stops
   - ✅ No vibration
   - ✅ Speed = 0

3. **Reverse (IN1=LOW, IN2=HIGH)**:
   - ✅ Motor shaft rotates counter-clockwise
   - ✅ Motor vibrates
   - ✅ Speed = 1.0, Direction = 'ccw'

## Files Modified (மாற்றப்பட்ட கோப்புகள்)

### 1. CircuitEngine.ts
**Path**: `src/Electra/Client/Src/engine/Arduino/CircuitEngine.ts`
**Changes**:
- Normalized speed to 0-1 range
- Added direction property ('cw' or 'ccw')
- Fixed DC motor signal propagation

### 2. dc-motor-element.ts
**Path**: `src/Electra/Client/utlis/elements/leap-elements/dc-motor-element.ts`
**Changes**:
- Fixed speed check (`speed !== 0` instead of `speed > 0`)
- Use absolute speed value for animation
- Fixed isRunning check

### 3. LeapNode.tsx
**Path**: `src/Electra/Client/Src/components/Nodes/LeapNode.tsx`
**Changes**:
- Added DC motor property mapping
- Added imperative property setter (useEffect)

## Motor Control Logic (மோட்டார் கட்டுப்பாடு)

### L298N Truth Table:

| ENA | IN1 | IN2 | Motor A Action |
|-----|-----|-----|----------------|
| 0   | X   | X   | Stop           |
| 1   | 0   | 0   | Stop           |
| 1   | 1   | 0   | Forward (CW)   |
| 1   | 0   | 1   | Reverse (CCW)  |
| 1   | 1   | 1   | Brake          |

### DC Motor States:

| POS | NEG | Speed | Direction | Result |
|-----|-----|-------|-----------|--------|
| 0   | 0   | 0     | -         | Stop   |
| 1   | 0   | 1.0   | cw        | Forward|
| 0   | 1   | 1.0   | ccw       | Reverse|
| 1   | 1   | 0     | -         | Brake  |

## Common Issues & Solutions (சாதாரண பிரச்சனைகள்)

### Issue 1: Motor Still Not Running
**Check**:
- ✅ 12V battery connected to L298N 12V and GND?
- ✅ L298N GND connected to Arduino GND?
- ✅ ENA/ENB jumpers in place (or connected to HIGH)?
- ✅ IN1/IN2 pins connected to Arduino digital pins?
- ✅ DC motor connected to OUT1 and OUT2?

### Issue 2: Motor Runs But Wrong Direction
**Solution**: Swap OUT1 and OUT2 connections on DC motor

### Issue 3: Motor Weak or Slow
**Check**:
- ✅ 12V battery fully charged?
- ✅ Motor rated for 12V?
- ✅ ENA pin HIGH (jumper in place)?

### Issue 4: Motor Doesn't Stop
**Check**:
- ✅ Both IN1 and IN2 set to LOW in code?
- ✅ No floating pins?

## Performance Notes (செயல்திறன் குறிப்புகள்)

### Animation Performance:
- Uses `requestAnimationFrame` for smooth 60fps animation
- Rotation calculated based on delta time
- Minimal CPU usage

### Visual Feedback:
- ✅ Shaft rotation (visible cross pattern)
- ✅ Vibration effect when running
- ✅ Direction-aware rotation

## Summary (சுருக்கம்)

### Before (முன்பு) ❌:
- Speed value wrong (100/-100 instead of 0-1)
- Direction not set
- Negative speed ignored
- No property mapping
- Motor wouldn't run

### After (இப்போ) ✅:
- Speed normalized (0-1 range)
- Direction properly set ('cw'/'ccw')
- Both directions work
- Properties mapped correctly
- Motor runs perfectly!

**Motor இப்போ சரியா run ஆகும்!** 🎯

---

**Date**: 2026-05-09
**Status**: ✅ Fixed
**Tested**: ✅ Working

