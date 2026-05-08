# Circuit Simulation Fixes

## Overview
This document describes the fixes implemented to address Arduino/ESP32 board persistence and GND/VCC connection requirements in the electronics simulation.

## Issues Fixed

### 1. Board Persistence (Arduino Uno & ESP32-C3)
**Problem**: When switching between simulations, Arduino Uno and ESP32-C3 boards were being deleted from the canvas.

**Solution**: Modified `useForgeStore.ts` to prevent deletion of protected board nodes:
- Added protection check in `removeNode()` function
- Arduino Uno and ESP32-C3 are now marked as "protected boards"
- Attempting to delete these boards will log a warning and block the deletion
- Other board types can still be removed normally

**Code Location**: `src/Electra/Client/utlis/store/useForgeStore.ts`

```typescript
// CRITICAL FIX: Prevent deletion of Arduino Uno and ESP32-C3 board nodes
const isProtectedBoard = removedNode?.data?.type === 'arduino-uno' || 
                         removedNode?.data?.type === 'esp32-c3';

if (isBoardNode && isProtectedBoard) {
  console.warn(`[FORGE STORE] ⚠ Cannot remove ${removedNode.data.type} board - it is required for simulation`);
  return; // Block deletion
}
```

### 2. GND Connection Requirement
**Problem**: Components (LEDs, buzzers, etc.) would simulate incorrectly without proper GND connections, violating basic circuit principles.

**Solution**: Implemented ground connection validation in `CircuitEngine.ts`:
- Added `hasGroundConnection()` helper function to validate GND wiring
- Added `hasPowerConnection()` helper function to validate VCC wiring
- Components requiring ground (LED, RGB-LED, Buzzer) are now validated before simulation
- Components without proper GND are marked as "damaged" and won't function
- Console warnings alert users to missing GND connections

**Code Location**: `src/Electra/Client/Src/engine/Arduino/CircuitEngine.ts`

```typescript
// Validate GND connection for components that require it
const requiresGround = ['led', 'rgb-led', 'buzzer'].includes(target.type);
const hasGround = this.hasGroundConnection(target.nodeId);

if (requiresGround && !hasGround) {
  console.warn(`[CIRCUIT] ⚠ Component ${target.nodeId} missing GND connection`);
  updateNodeData(target.nodeId, { 
    damaged: true,
    value: false,
    brightness: 0
  });
  return;
}
```

### 3. Terminal Glow Visualization
**Problem**: Terminals didn't provide clear visual feedback about power state and connections.

**Solution**: Enhanced terminal visualization in `LeapNode.tsx`:
- **VCC/5V pins**: Glow bright red when connected (always powered)
- **GND pins**: Glow blue when connected (ground reference)
- **Signal pins HIGH**: Glow red when receiving HIGH signal
- **Signal pins LOW**: Show green when connected but LOW
- **Unconnected pins**: Remain dim gray
- Added box-shadow glow effects for better visibility
- Increased pin size when connected (5px vs 3px)

**Code Location**: `src/Electra/Client/Src/components/Nodes/LeapNode.tsx`

```typescript
// Enhanced pin color logic with power visualization
if (isPowerPin) {
  pinColor = '#ef4444';
  pinOpacity = 1.0;
  pinGlow = '0 0 8px #ef4444, 0 0 12px #ef4444';
} else if (isGroundPin) {
  pinColor = '#3b82f6';
  pinOpacity = 0.9;
  pinGlow = '0 0 6px #3b82f6';
} else if (isSimulating && isPinHigh) {
  pinColor = '#ef4444';
  pinOpacity = 1.0;
  pinGlow = '0 0 8px #ef4444, 0 0 12px #ef4444';
}
```

### 4. LED Visual Feedback
**Problem**: LEDs didn't show visual indication when damaged or missing GND.

**Solution**: Enhanced LED element rendering in `led-element.ts`:
- Added red warning glow for damaged LEDs (missing GND)
- Grayscale filter applied to non-functional LEDs
- Clear visual distinction between working and non-working components

**Code Location**: `src/Electra/Client/utlis/elements/leap-elements/led-element.ts`

```typescript
const grayscaleFilter = this.damaged ? 'grayscale(100%) opacity(0.5)' : '';
const warningGlow = this.damaged ? '0 0 10px #ff6b6b' : '';
```

## Testing

### Test Case 1: Board Persistence
1. Add Arduino Uno to canvas
2. Add components and wire them
3. Try to delete the Arduino Uno board
4. **Expected**: Board cannot be deleted, warning appears in console
5. Repeat with ESP32-C3

### Test Case 2: LED with GND
1. Add Arduino Uno and LED to canvas
2. Connect Arduino Pin 13 → LED Anode
3. Connect LED Cathode → Arduino GND
4. Upload blink sketch
5. **Expected**: LED blinks normally, cathode pin glows blue (GND), anode glows red when HIGH

### Test Case 3: LED without GND
1. Add Arduino Uno and LED to canvas
2. Connect Arduino Pin 13 → LED Anode
3. **Do NOT connect** LED Cathode to GND
4. Upload blink sketch
5. **Expected**: 
   - LED appears grayscale with red warning glow
   - LED does not light up
   - Console shows warning: "Component missing GND connection"

### Test Case 4: Terminal Glow
1. Add Arduino Uno to canvas
2. Observe pin colors:
   - **Unconnected pins**: Dim gray
   - **Connect wire to 5V pin**: Glows bright red
   - **Connect wire to GND pin**: Glows blue
   - **Connect wire to digital pin**: Glows green (LOW) or red (HIGH during simulation)

## Pin Name Recognition

The system recognizes the following pin names:

**Ground Pins**: GND, GROUND, V-, VSS, C, Cathode, NEG, -
**Power Pins**: VCC, 5V, 3V3, 3.3V, VIN, POWER, V+, A, Anode, POS, +

Pin name matching is case-insensitive and uses substring matching.

## Component Requirements

| Component | Requires GND | Requires VCC | Notes |
|-----------|--------------|--------------|-------|
| LED | ✅ Yes | ✅ Yes | Must have complete circuit |
| RGB LED | ✅ Yes | ✅ Yes | Each channel needs ground |
| Buzzer | ✅ Yes | ✅ Yes | Piezo needs ground reference |
| Servo | ❌ No | ✅ Yes | Complex peripheral, validated separately |
| LCD | ❌ No | ✅ Yes | Complex peripheral, validated separately |
| Sensors | ❌ No | ✅ Yes | Complex peripherals, validated separately |

## Benefits

1. **Realistic Circuit Behavior**: Components now behave like real electronics
2. **Educational Value**: Users learn proper circuit wiring principles
3. **Clear Visual Feedback**: Immediate indication of wiring issues
4. **Board Stability**: Critical boards cannot be accidentally deleted
5. **Debugging Aid**: Console warnings help identify wiring problems

## Future Enhancements

Potential improvements for future versions:
- Voltage drop calculation across resistors
- Current limiting validation
- Short circuit detection
- Automatic circuit validation before simulation
- Interactive wiring hints/suggestions
- Circuit diagram export with validation report

## Compatibility

These fixes are backward compatible with existing projects. Circuits that were working before will continue to work. Circuits with improper wiring will now show warnings and visual feedback.

## Console Messages

New console messages to watch for:
- `[FORGE STORE] ⚠ Cannot remove arduino-uno board - it is required for simulation`
- `[CIRCUIT] ⚠ Component {id} (led) missing GND connection - simulation disabled`
- `[CIRCUIT LED] Setting LED brightness to {value}, hasGround={true/false}`

## Related Files

- `src/Electra/Client/utlis/store/useForgeStore.ts` - Board management
- `src/Electra/Client/Src/engine/Arduino/CircuitEngine.ts` - Circuit validation
- `src/Electra/Client/Src/components/Nodes/LeapNode.tsx` - Terminal visualization
- `src/Electra/Client/utlis/elements/leap-elements/led-element.ts` - LED rendering

---

**Last Updated**: 2026-05-08
**Version**: 1.0.0
