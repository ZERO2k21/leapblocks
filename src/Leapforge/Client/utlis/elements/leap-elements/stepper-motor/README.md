# Stepper Motor Component (NEMA Standard)

Wokwi-compatible bipolar stepper motor component for LeapLab Leapforge simulator.

## Features

- **NEMA Standard Sizes**: 8, 11, 14, 17, 23, 34
- **4-Wire Coil Driving**: A+, A-, B+, B- pins for full control
- **Configurable Gear Ratios**: 1:1, 2:1, 4:1, 8:1, 16:1, 32:1
- **Display Modes**: Step count, angle in degrees, or no display
- **Rotation Indicator**: Custom colored arrow showing shaft position
- **Full Physics Simulation**: 200 steps/rev (1.8°/step) NEMA standard
- **Smooth Animation**: 50ms rotation transitions
- **Direction Detection**: Automatic CW/CCW from pin patterns

## Architecture

### Files

- `component.json` - Component definition and metadata
- `StepperMotor.tsx` - React component with SVG rendering
- `StepperMotor.css` - Animations and visual effects
- `StepperMotorSim.ts` - Physics simulation engine
- `StepperMotorSim.test.ts` - Unit tests
- `index.ts` - Module exports

### Component Structure

```
stepper-motor/
├── component.json          (Component definition)
├── StepperMotor.tsx        (React visual component)
├── StepperMotor.css        (Animations)
├── StepperMotorSim.ts      (Simulation engine)
├── StepperMotorSim.test.ts (Unit tests)
└── index.ts                (Exports)
```

## Usage

### React Component

```typescript
import StepperMotor from '@/Leapforge/Client/utlis/elements/leap-elements/stepper-motor';

export function MyCircuit() {
  const [pinStates, setPinStates] = useState({
    'A-': false,
    'A+': false,
    'B+': false,
    'B-': false,
  });

  return (
    <StepperMotor
      id="stepper1"
      size="17"
      display="angle"
      gearRatio="1:1"
      arrow="orange"
      pinStates={pinStates}
      onPinClick={(pin) => console.log('Clicked pin:', pin)}
    />
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | string | required | Component instance ID |
| `size` | '8'\|'11'\|'14'\|'17'\|'23'\|'34' | '23' | NEMA motor size |
| `display` | 'steps'\|'angle'\|'none' | 'steps' | What to display in motor center |
| `gearRatio` | string | '1:1' | Gear ratio (affects rotation speed) |
| `arrow` | string | '' | Arrow color (empty = no arrow) |
| `pinStates` | object | required | Current pin states (4 boolean values) |
| `onPinClick` | function | - | Callback when pin is clicked |

### Diagram JSON

```json
{
  "parts": [
    {
      "type": "leaplab-stepper-motor",
      "id": "stepper1",
      "top": 100,
      "left": 200,
      "attrs": {
        "size": "17",
        "display": "angle",
        "gearRatio": "1:1",
        "arrow": "orange"
      }
    }
  ],
  "connections": [
    ["stepper1:A-", "driver1:1B", "red", []],
    ["stepper1:A+", "driver1:1A", "green", []],
    ["stepper1:B+", "driver1:2A", "blue", []],
    ["stepper1:B-", "driver1:2B", "black", []]
  ]
}
```

## Simulation Details

### Stepper Motor Physics

- **Steps per Revolution**: 200 (NEMA standard)
- **Degrees per Step**: 1.8°
- **Half-stepping**: 0.9° per step (8 patterns)
- **Gear Ratio**: Multiplies steps per revolution
  - 1:1 → 200 steps/rev
  - 2:1 → 400 steps/rev
  - 4:1 → 800 steps/rev

### Pin Configuration

Pins follow Arduino Stepper.h convention:

| Pin | Function | Signal |
|-----|----------|--------|
| A+ | Coil A positive | High = Coil A forward |
| A- | Coil A negative | High = Coil A reverse |
| B+ | Coil B positive | High = Coil B forward |
| B- | Coil B negative | High = Coil B reverse |

### Full-Step Sequence (CW)

```
Step 0: A+ HIGH, B+ HIGH
Step 1: A- HIGH, B+ HIGH
Step 2: A- HIGH, B- HIGH
Step 3: A+ HIGH, B- HIGH
(repeat)
```

### Direction Detection

- **Clockwise (CW)**: Pattern 0 → 1 → 2 → 3 → 0 (forward)
- **Counter-Clockwise (CCW)**: Pattern 0 → 3 → 2 → 1 → 0 (backward)

## Visual Design

### NEMA Size Scaling

| Size | Radius | Total | Use Case |
|------|--------|-------|----------|
| 8 | 28px | 76px | Compact, low torque |
| 11 | 34px | 88px | Small projects |
| 14 | 40px | 100px | Standard small motor |
| 17 | 46px | 112px | **Most common** |
| 23 | 52px | 124px | High torque |
| 34 | 62px | 144px | Large projects |

## Integration

### Register with Component System

```typescript
import { registerStepperMotor } from '@/Leapforge/Client/utlis/elements/leap-elements/stepper-motor';

// In your component registry initialization:
registerStepperMotor(componentRegistry);
```

### CircuitEngine Integration

The stepper motor is integrated with CircuitEngine via the StepperEmulator class. Pin state changes from the AVR simulator flow to the StepperMotorSimulator, which calculates the motor's rotation and angle.

**Required Update**: The CircuitEngine's processCoils call must use the correct pin order (A+, A-, B+, B-).

## Testing

Run the included test suite:

```bash
npm test StepperMotorSim.test.ts
```

Tests cover:
- ✅ 1 full step = 1.8°
- ✅ 200 full steps = 360°
- ✅ CW/CCW direction detection
- ✅ Gear ratio calculations
- ✅ Angle wraparound (0-360°)
- ✅ State reset and retrieval
