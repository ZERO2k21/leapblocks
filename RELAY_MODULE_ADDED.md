# ✅ Relay Module Component Added

## Overview

A new **Single-Channel 5V Relay Module** component has been added to Electra. This is a standard relay module commonly used with Arduino to control high-power devices.

## Component Details

### Visual Design
- Red PCB board with blue relay module area
- LED indicator (lights up when energized)
- Clear pin labels on both sides
- Shows active contact (NO/NC) at the bottom

### Pins

#### Control Pins (Left Side)
1. **VCC** - Power supply (5V from Arduino)
2. **GND** - Ground connection
3. **IN** - Signal input (HIGH = relay ON, LOW = relay OFF)

#### Switch Terminals (Right Side)
4. **NO** (Normally Open) - Closed when relay is energized
5. **COM** (Common) - Common terminal for the switch
6. **NC** (Normally Closed) - Open when relay is energized

## How It Works

### Relay Operation

**When IN pin is LOW (0V):**
- Relay is de-energized
- COM connects to NC (Normally Closed)
- LED is OFF
- Default state

**When IN pin is HIGH (5V):**
- Relay is energized
- COM connects to NO (Normally Open)
- LED lights up (red)
- Switched state

### Circuit Behavior

The relay acts as an **electrically isolated switch**:
- The control side (VCC, GND, IN) operates at low voltage (5V)
- The switch side (NO, COM, NC) can handle high voltage/current
- An electromagnet inside moves the switch when energized

### Typical Use Cases

1. **Control AC Appliances** - Turn on/off lights, fans, motors
2. **High Current Switching** - Control devices that draw more current than Arduino can provide
3. **Electrical Isolation** - Separate low-voltage control from high-voltage load
4. **Automation** - Home automation, IoT projects

## Example Arduino Code

```cpp
// Relay Module Example
const int relayPin = 7;  // IN pin connected to Arduino pin 7

void setup() {
  pinMode(relayPin, OUTPUT);
  digitalWrite(relayPin, LOW);  // Relay OFF initially
}

void loop() {
  // Turn relay ON
  digitalWrite(relayPin, HIGH);
  delay(2000);  // Wait 2 seconds
  
  // Turn relay OFF
  digitalWrite(relayPin, LOW);
  delay(2000);  // Wait 2 seconds
}
```

## Wiring Example

### Basic LED Control

**Control Side:**
- VCC → Arduino 5V
- GND → Arduino GND
- IN → Arduino Digital Pin (e.g., Pin 7)

**Load Side:**
- Connect power supply (+) to NO
- Connect LED (+) to COM
- Connect LED (-) to power supply (-)

When Arduino pin 7 is HIGH, the relay closes and the LED turns on.

## Technical Specifications

- **Operating Voltage**: 5V DC
- **Coil Current**: ~70mA
- **Contact Rating**: Typically 10A @ 250VAC, 10A @ 30VDC
- **Switching Time**: ~10ms
- **LED Indicator**: Red (ON when energized)
- **Isolation**: Optical isolation between control and load

## Files Modified

### 1. Web Component
- **Created**: `relay-module-element.ts` - SVG-based relay module component

### 2. Component Registration
- **Modified**: `leap-elements/index.ts` - Exported RelayModuleElement
- **Modified**: `react-types.ts` - Added TypeScript types

### 3. UI Components
- **Modified**: `PartPicker.tsx` - Added to "Add Component" dialog
- **Modified**: `Sidebar.tsx` - Added to outputs category

### 4. Pin Configuration
- **Modified**: `PinHarness.json` - Added pin positions
- **Modified**: `PinHarness.ts` - Added pin harness

### 5. Circuit Engine
- **Modified**: `CircuitEngine.ts` - Added relay switching logic
- **Modified**: `LeapNode.tsx` - Added energized state handling
- **Modified**: `CircuitAnalysisPanel.tsx` - Added power analysis
- **Modified**: `PinMap.ts` - Added to SVG component list

## Simulation Behavior

The relay module is fully simulated in Electra:

1. **Visual Feedback**:
   - LED indicator shows energized state
   - Active contact label (NO/NC) updates
   - Contact line animates to show switching

2. **Circuit Behavior**:
   - When IN is HIGH: COM connects to NO
   - When IN is LOW: COM connects to NC
   - Signal propagation through active contact
   - Proper isolation between control and load

3. **Real-time Updates**:
   - Instant response to pin state changes
   - Smooth animations (80ms transition)
   - LED state synchronized with relay state

## Differences from KS2E-M-DC5

Electra now has **two relay components**:

| Feature | relay-module | ks2e-m-dc5 |
|---------|-------------|------------|
| **Type** | Single-channel SPDT | Dual-channel DPDT |
| **Control Pins** | VCC, GND, IN | COIL1, COIL2 |
| **Switch Terminals** | NO, COM, NC | NO1, NC1, P1, NO2, NC2, P2 |
| **Channels** | 1 | 2 |
| **Visual** | Red PCB with blue module | Yellow/orange body |
| **Use Case** | Simple on/off switching | Complex dual switching |

## Safety Notes

⚠️ **Important Safety Information**:

1. **High Voltage Warning**: The switch terminals can handle high voltage. Use proper insulation and safety measures.

2. **Current Limits**: Do not exceed the relay's current rating (typically 10A). Use appropriate wire gauge.

3. **Inductive Loads**: When switching motors or solenoids, use a flyback diode to protect the relay.

4. **Proper Wiring**: Always connect VCC to 5V and GND to ground. Incorrect wiring can damage the relay or Arduino.

5. **Isolation**: While the relay provides electrical isolation, always follow electrical safety codes for your region.

## Educational Value

This component helps students learn:

1. **Relay Operation** - How electromagnetic relays work
2. **Switching Circuits** - NO vs NC contacts
3. **Electrical Isolation** - Separating control from load
4. **Power Electronics** - Controlling high-power devices safely
5. **Real-world Applications** - Home automation, industrial control

## References

Content rephrased for compliance with licensing restrictions. Information sourced from:
- Arduino relay module documentation
- Electronics tutorials on relay operation
- Relay module datasheets and specifications

---

**Status**: ✅ COMPLETE - Relay module fully integrated and ready to use!

**Next Steps**: Reload the Electra application to see the new relay module in the component library.
