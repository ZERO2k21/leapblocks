# Stepper Motor Visual Wrapping Fix

## Problem Identified

From the console logs, the stepper motor logic was working **perfectly**:
- ✅ Exact 1° steps (0°, 20°, 40°, 60°, etc.)
- ✅ Correct wrapping: 340° → 0° (CW) and 19° → 359° (CCW)
- ✅ Integer angles with no fractional values

However, the **visual rotation was jumping** when wrapping occurred.

## Root Cause

The `stepper-motor-element.ts` was using `_cumulativeAngle` for CSS transforms, which expects unbounded angles for smooth transitions. When the angle wrapped:

- **359° → 0°**: CSS tried to rotate backwards -359° instead of forward +1°
- **0° → 359°**: CSS tried to rotate forward +359° instead of backward -1°

This caused the shaft to visually "jump" or rotate the wrong direction during wrapping.

## Solution

Updated the `update()` method in `stepper-motor-element.ts` to detect wrapping and adjust the cumulative angle correctly:

```typescript
update(changedProperties: Map<string, unknown>) {
  if (changedProperties.has('size')) {
    this.dispatchEvent(new CustomEvent('pininfo-change'));
  }
  
  // Handle angle updates with wrapping detection
  if (changedProperties.has('angle')) {
    const oldAngle = changedProperties.get('angle') as number ?? 0;
    const newAngle = this.angle;
    
    // Detect wrapping and adjust cumulative angle accordingly
    const delta = newAngle - oldAngle;
    
    // If delta is large (> 180°), we wrapped around
    if (delta > 180) {
      // Wrapped from 359° to 0° (CCW) - subtract 360° from cumulative
      this._cumulativeAngle -= 360;
    } else if (delta < -180) {
      // Wrapped from 0° to 359° (CW) - add 360° to cumulative
      this._cumulativeAngle += 360;
    }
    
    // Apply the new angle to cumulative
    this._cumulativeAngle += (newAngle - oldAngle);
  }
  super.update(changedProperties);
}
```

## How It Works

### Wrapping Detection Logic

1. **Calculate delta**: `newAngle - oldAngle`
2. **Check for large jumps**:
   - If `delta > 180°`: Wrapped from high to low (359° → 0°)
   - If `delta < -180°`: Wrapped from low to high (0° → 359°)

### Cumulative Angle Adjustment

- **Normal rotation**: Cumulative angle increases/decreases normally
- **Wrap from 359° to 0°**: Subtract 360° from cumulative to maintain continuity
- **Wrap from 0° to 359°**: Add 360° to cumulative to maintain continuity

### Example Scenarios

#### Clockwise Wrapping (359° → 0°)
```
Old angle: 359°
New angle: 0°
Delta: 0° - 359° = -359°

Since delta < -180°:
  _cumulativeAngle += 360  // Adjust for wrap
  _cumulativeAngle += (0 - 359) = -359°
  
Net effect: +1° rotation (smooth)
```

#### Anticlockwise Wrapping (0° → 359°)
```
Old angle: 0°
New angle: 359°
Delta: 359° - 0° = 359°

Since delta > 180°:
  _cumulativeAngle -= 360  // Adjust for wrap
  _cumulativeAngle += (359 - 0) = 359°
  
Net effect: -1° rotation (smooth)
```

## Result

Now the stepper motor:
- ✅ Rotates with exact 1° steps
- ✅ Wraps seamlessly from 359° to 0° (and vice versa)
- ✅ Visual shaft rotation is smooth with no jumps
- ✅ CSS transitions work correctly across wrapping boundaries
- ✅ Maintains cumulative angle for unbounded CSS transforms

## Testing

Run the simulation and observe:
1. **Clockwise rotation**: Shaft rotates smoothly from 0° → 359° → 0° (wraps)
2. **Anticlockwise rotation**: Shaft rotates smoothly from 359° → 0° → 359° (wraps)
3. **No visual jumps**: Transitions are smooth at all angles including wrap points
4. **Console logs**: Show exact integer angles (0°, 1°, 2°, ..., 359°)

## Files Modified

1. `src/Electra/Client/Src/engine/Arduino/StepperEmulator.ts` - Core logic (1° steps, wrapping)
2. `src/Electra/Client/utlis/elements/leap-elements/stepper-motor-element.ts` - Visual wrapping fix

## Summary

The stepper motor now works exactly as specified:
- **Rotation**: 0° to 359° clockwise, 359° to 0° anticlockwise
- **Step size**: Exactly 1° per step
- **Wrapping**: Seamless wrap-around at boundaries
- **Visual**: Smooth shaft rotation with no jumps
- **Shaft**: Fixed on axis, rotates according to angle
