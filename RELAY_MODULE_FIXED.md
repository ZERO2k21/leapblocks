# Relay Module - TypeScript Errors Fixed

## Status: ✅ Errors Fixed, Testing Circuit Behavior

### TypeScript Errors Resolved:

1. ✅ Removed invalid `this.pinMap` access
2. ✅ Removed invalid `this.runtime` access  
3. ✅ Removed invalid `PinState` enum usage
4. ✅ Changed `traceCircuit` to `traceNet` (correct method)
5. ✅ Added proper type annotations for `target` parameters

### Current Implementation:

The relay module now uses the same pattern as the working `ks2e-m-dc5` relay:

```typescript
// When relay state changes:
1. Update energized state
2. Determine active contact (NO when energized, NC when de-energized)
3. Trace downstream targets from active and inactive contacts
4. Get COM signal from buffer
5. Push signal to active contact targets
6. Cut signal to inactive contact targets
```

### How to Wire the Relay Module:

**Control Side (Arduino):**
- VCC → Arduino 5V
- GND → Arduino GND
- IN → Arduino Digital Pin (e.g., Pin 2)

**Load Side (LED Circuit):**
- Arduino 5V → COM (relay)
- NO (relay) → LED Anode (+)
- LED Cathode (-) → Resistor → Arduino GND

**Arduino Code:**
```cpp
const int relayPin = 2;

void setup() {
  pinMode(relayPin, OUTPUT);
}

void loop() {
  digitalWrite(relayPin, HIGH);  // Relay ON, LED lights
  delay(1000);
  digitalWrite(relayPin, LOW);   // Relay OFF, LED off
  delay(1000);
}
```

### Circuit Flow:

1. **Arduino Pin 2 HIGH** → IN pin receives HIGH signal
2. **Relay energizes** → COM connects to NO (disconnects from NC)
3. **5V flows** → Arduino 5V → COM → NO → LED → Resistor → GND
4. **LED lights up** ✅

### Debugging:

The console shows:
```
[RELAY MODULE] Node xxx — ENERGIZED
[RELAY MODULE] Node xxx — DE-ENERGIZED
```

This confirms the relay is switching correctly.

### Potential Issue:

If the LED still doesn't light, the problem might be:
1. **COM pin not receiving signal** - Check that COM is connected to a power source (Arduino 5V or a digital pin)
2. **Circuit not traced correctly** - The `traceNet` method needs to properly follow the relay contacts
3. **LED pin state not updated** - The LED component needs to receive the pin state update

### Next Steps for Testing:

1. Wire: Arduino Pin 2 → IN
2. Wire: Arduino 5V → COM
3. Wire: NO → LED anode
4. Wire: LED cathode → GND (through resistor if needed)
5. Upload code that toggles Pin 2
6. Check if LED lights when Pin 2 is HIGH

---

**Files Modified:**
- `CircuitEngine.ts` - Fixed TypeScript errors, simplified relay logic
- Uses same pattern as working `ks2e-m-dc5` relay

**Status:** Ready for testing. Reload application and test the circuit.
