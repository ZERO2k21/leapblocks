# ESP32 Circuit Simulation Analysis

## Current Status

The ESP32-C3 simulation **DOES** integrate with the circuit engine. Here's what's working:

### ✅ Working Circuit Integration

1. **Pin Listeners** - ESP32 GPIO outputs are wired to circuit components
   - Location: `CircuitEngine.ts` lines 1270-1500
   - ESP32 pins are converted using `convertESP32Pin()` 
   - Pin state changes trigger component updates (LEDs, motors, servos, etc.)

2. **Analog Input** - Sensors can inject values into ESP32 ADC
   - Method: `setESP32C3AnalogInput(gpioNum, voltage)`
   - Converts 0-3.3V to 12-bit ADC (0-4095)
   - Location: `SimulationRunner.ts` line 716

3. **Digital Input** - Buttons/switches can inject digital signals
   - Method: `setESP32C3GPIOInput(gpioNum, high)`
   - Location: `SimulationRunner.ts` line 729

4. **Component Support**
   - ✅ LEDs (with PWM brightness 0-255)
   - ✅ Servos (angle 0-180)
   - ✅ DC Motors
   - ✅ Buzzers (with PWM)
   - ✅ RGB LEDs
   - ✅ 7-Segment Displays
   - ✅ Stepper Motors
   - ✅ HC-SR04 Ultrasonic (with setTimeout)
   - ✅ DHT11/DHT22 Temperature Sensors
   - ✅ NeoPixel LEDs
   - ✅ I2C Devices (SSD1306 OLED, MPU6050, DS1307, LCD I2C)
   - ✅ SPI Devices (ILI9341 TFT)

5. **Sensor Input Support**
   - ✅ Buttons
   - ✅ Potentiometers
   - ✅ LDR (Light sensors)
   - ✅ Temperature sensors (LM35, TMP36)
   - ✅ PIR Motion sensors
   - ✅ Heart-beat sensors
   - ✅ Gas sensors (MQ-2, MQ-135)
   - ✅ Tilt switches
   - ✅ Rotary encoders
   - ✅ Membrane keypads
   - ✅ IR receivers

### 🔍 Potential Issues

Based on the code analysis, here are areas that might cause circuit simulation problems:

## Issue 1: Board Type Detection

**Problem:** Circuit wiring only happens for boards with type `'esp32-c3'`

```typescript
// Line 1272-1275
const boardNodes = nodes.filter(n =>
  n.data?.type === 'arduino-uno' ||
  n.data?.type === 'esp32-c3'
);
```

**Fix Required:** Verify that the ESP32 board node has `data.type === 'esp32-c3'`

## Issue 2: Pin Mapping Validation

**Problem:** If `convertESP32Pin()` returns null, the component is silently skipped

```typescript
// Line 1299-1300
const esp32Mapping = simulationRunner.convertESP32Pin(arduinoPinName);
if (!esp32Mapping) return; // SILENTLY SKIPS!
```

**Fix Required:** Add console warnings when pin mapping fails

## Issue 3: Ground Connection Validation

**Problem:** Components require GND connection to work, but validation might be too strict

```typescript
// Line 1378-1387
const requiresGround = ['led', 'rgb-led', 'buzzer'].includes(target.type);
const hasGround = this.hasGroundConnection(target.nodeId);

if (requiresGround && !hasGround) {
  console.warn(`[CIRCUIT] ⚠ Component ${target.nodeId} missing GND connection`);
  updateNodeData(target.nodeId, { damaged: true, value: false });
  return;
}
```

**Fix Required:** Verify GND connection detection logic is working correctly

## Issue 4: Transpiled vs RISC-V Path

**Problem:** Two simulation paths exist, and circuit integration might differ

- **Transpiled Path** (recommended): Uses `ArduinoRuntime.ts`
- **RISC-V Path** (experimental): Uses `RiscVCore.ts`

**Current Status:** Both paths should work, but transpiled is preferred

## Issue 5: Missing Console Logs

**Problem:** Not enough diagnostic output to debug circuit issues

**Fix Required:** Add more detailed logging for:
- Pin state changes
- Component updates
- Wire connections
- Sensor inputs

## Recommended Fixes

### Fix 1: Add Diagnostic Logging

Add this to `CircuitEngine.ts` in the `syncCircuitGraph()` method:

```typescript
console.log(`[ESP32 CIRCUIT] Wiring ESP32 board: ${board.id}`);
console.log(`[ESP32 CIRCUIT] Connected edges: ${connectedEdges.length}`);
console.log(`[ESP32 CIRCUIT] Board type: ${board.data?.type}`);
```

### Fix 2: Validate Pin Mappings

Replace silent failures with warnings:

```typescript
const esp32Mapping = simulationRunner.convertESP32Pin(arduinoPinName);
if (!esp32Mapping) {
  console.warn(`[ESP32 CIRCUIT] ⚠ Failed to map pin: ${arduinoPinName}`);
  return;
}
```

### Fix 3: Add Circuit Status Indicator

Add a method to check if circuit is properly wired:

```typescript
public getESP32CircuitStatus(): {
  boardDetected: boolean;
  componentsWired: number;
  sensorsWired: number;
  issues: string[];
} {
  // Implementation
}
```

### Fix 4: Test Each Component Type

Create test cases for each component:

1. LED blink test
2. Servo sweep test
3. Button input test
4. Potentiometer analog input test
5. OLED display test
6. Ultrasonic sensor test

## Testing Checklist

- [ ] Verify ESP32 board node has `type: 'esp32-c3'`
- [ ] Check console for pin mapping errors
- [ ] Verify GND connections are detected
- [ ] Test LED with digitalWrite()
- [ ] Test PWM with analogWrite()
- [ ] Test button with digitalRead()
- [ ] Test potentiometer with analogRead()
- [ ] Test servo with Servo.write()
- [ ] Test OLED with Adafruit_SSD1306
- [ ] Test serial output with Serial.println()

## Conclusion

The ESP32 circuit simulation **IS IMPLEMENTED** and should work. If it's not working, the issue is likely:

1. **Board type mismatch** - Node type is not `'esp32-c3'`
2. **Pin mapping failure** - Pin names don't match expected format
3. **Missing GND connections** - Components are marked as damaged
4. **Simulation not started** - `syncCircuitGraph()` not called
5. **Wrong simulation path** - Using RISC-V instead of transpiled

**Next Steps:**
1. Check browser console for errors
2. Verify board node type
3. Add diagnostic logging
4. Test with simple LED blink sketch
