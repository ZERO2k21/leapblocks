# ESP32 Circuit Simulation - Quick Debug Guide

## 🚀 Quick Start

### Step 1: Open Browser Console
Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)

### Step 2: Run Diagnostics
```javascript
ESP32Diagnostics.runDiagnostics()
```

### Step 3: Check Output
Look for:
- ✅ "Board detected: true"
- ✅ "Components wired: X" (should be > 0)
- ✅ "Wire count: X" (should be > 0)
- ❌ Any warnings or errors

## 🔍 Common Issues & Fixes

### Issue 1: "No ESP32-C3 board found"

**Cause:** Board node type is incorrect

**Fix:**
1. Check board component in circuit
2. Verify it's labeled as "ESP32-C3"
3. Check node data: `nodes.find(n => n.data?.type === 'esp32-c3')`

### Issue 2: "Wire count: 0"

**Cause:** No wires connected to board

**Fix:**
1. Draw wires from board pins to components
2. Ensure wires are properly connected (not just hovering)
3. Check ReactFlow edges: `edges.filter(e => e.source === boardId || e.target === boardId)`

### Issue 3: "ESP32-C3 simulation runner not initialized"

**Cause:** Simulation not started or wrong board selected

**Fix:**
1. Click "Compile & Run" button
2. Verify board is selected in dropdown
3. Check: `simulationRunner.isESP32C3Board`

### Issue 4: LED not lighting up

**Cause:** Missing GND connection or wrong pin

**Fix:**
1. Connect LED cathode (-) to GND
2. Connect LED anode (+) to GPIO pin
3. Test: `ESP32Diagnostics.testLED(2, 2000)`

### Issue 5: Button not working

**Cause:** Wrong pin mode or missing pull-up

**Fix:**
1. Use `pinMode(pin, INPUT_PULLUP)` in code
2. Button should connect pin to GND when pressed
3. Test: `ESP32Diagnostics.simulateButtonPress(5, 100)`

### Issue 6: Analog sensor always reads 0

**Cause:** Not connected to ADC pin or wrong voltage

**Fix:**
1. Use GPIO 0-4 for analog (ADC1_CH0-4)
2. Check sensor voltage range (0-3.3V)
3. Test: `ESP32Diagnostics.testAnalogInput(4, 2.5)`

## 🧪 Quick Tests

### Test 1: LED Blink (2 seconds)
```javascript
ESP32Diagnostics.testLED(2, 2000)
```
**Expected:** Console shows "💡 Setting ESP2 to HIGH" and "⚫ Setting ESP2 to LOW"

### Test 2: Monitor Pin Changes (10 seconds)
```javascript
ESP32Diagnostics.monitorPin(2, 10000)
```
**Expected:** Console shows pin state changes as they occur

### Test 3: Analog Input Test
```javascript
ESP32Diagnostics.testAnalogInput(4, 2.5)
```
**Expected:** Console shows "✅ Injected 2.5V into GPIO4"

### Test 4: Button Press Simulation
```javascript
ESP32Diagnostics.simulateButtonPress(5, 100)
```
**Expected:** Console shows "⬇️ Button pressed" and "⬆️ Button released"

### Test 5: Print All Pin States
```javascript
ESP32Diagnostics.printPinStates()
```
**Expected:** Console shows state of all GPIO pins (0-21)

## 📊 Console Log Patterns

### ✅ Good Logs (Everything Working)

```
[CIRCUIT ENGINE] Found 1 board(s) to wire: ["node-123 (esp32-c3)"]
[CIRCUIT ENGINE] Board node-123 (esp32-c3) has 3 connected edges
[ESP32 CIRCUIT] ✓ Wired: Board[2→ESP2] <==> Peripheral[node-456/A]
[ESP32 CIRCUIT] ✓ Wired: Board[4→ESP4] <==> Peripheral[node-789/OUT]
[ESP32 CIRCUIT] Servo node-456 angle: 90°
[ESP32 CIRCUIT] led node-789 PWM: 128/255 (intensity: 0.50)
```

### ❌ Bad Logs (Issues Found)

```
[ESP32 CIRCUIT] ⚠ Failed to map ESP32 pin: "X" - skipping wire
[CIRCUIT] ⚠ Component node-456 (led) missing GND connection
[FORGE CIRCUIT] Input: no wire found for node node-789 pin OUT
```

## 🎯 Pin Mapping Reference

### Digital Pins (GPIO)
```
Pin Label → GPIO Number
"2"  → ESP2  (GPIO2)
"4"  → ESP4  (GPIO4)
"13" → ESP13 (GPIO13)
"21" → ESP21 (GPIO21)
"D2" → ESP2  (GPIO2)
"D4" → ESP4  (GPIO4)
```

### Analog Pins (ADC)
```
Pin Label → GPIO Number → ADC Channel
"A0" → ESP0 (GPIO0) → ADC1_CH0
"A1" → ESP1 (GPIO1) → ADC1_CH1
"A2" → ESP2 (GPIO2) → ADC1_CH2
"A3" → ESP3 (GPIO3) → ADC1_CH3
"A4" → ESP4 (GPIO4) → ADC1_CH4
"0"  → ESP0 (GPIO0) → ADC1_CH0
"1"  → ESP1 (GPIO1) → ADC1_CH1
"2"  → ESP2 (GPIO2) → ADC1_CH2
"3"  → ESP3 (GPIO3) → ADC1_CH3
"4"  → ESP4 (GPIO4) → ADC1_CH4
```

### Special Pins
```
"VP"  → ESP36 (GPIO36) - Analog only
"VN"  → ESP39 (GPIO39) - Analog only
"RX2" → ESP16 (GPIO16) - UART2 RX
"TX2" → ESP17 (GPIO17) - UART2 TX
```

## 🔧 Advanced Debugging

### Check Board Type
```javascript
const { nodes } = useForgeStore.getState();
const board = nodes.find(n => n.data?.type === 'esp32-c3');
console.log('Board:', board);
```

### Check Wire Connections
```javascript
const { edges } = useForgeStore.getState();
const boardEdges = edges.filter(e => 
  e.source === 'YOUR_BOARD_ID' || e.target === 'YOUR_BOARD_ID'
);
console.log('Wires:', boardEdges);
```

### Check Simulation Status
```javascript
console.log('Is ESP32:', simulationRunner.isESP32C3Board);
console.log('Is running:', simulationRunner.isRunning);
console.log('Runner:', simulationRunner.ESP32C3Runner);
console.log('Runtime:', simulationRunner.ESP32C3Runner?.runtime);
```

### Check Pin Mapping
```javascript
const mapping = simulationRunner.convertESP32Pin('2');
console.log('Pin 2 maps to:', mapping);
// Expected: { avrPin: "ESP2", adcChannel: 2, ... }
```

### Monitor All Pin Changes
```javascript
// Add wildcard listener
simulationRunner.ESP32C3Runner?.addPinListener('*', (pin, state) => {
  console.log(`Pin ${pin} changed to:`, state);
});
```

## 📝 Minimal Test Sketch

Use this to verify basic circuit functionality:

```cpp
// Test LED on GPIO2
void setup() {
  pinMode(2, OUTPUT);
  Serial.begin(115200);
  Serial.println("ESP32 Circuit Test");
}

void loop() {
  digitalWrite(2, HIGH);
  Serial.println("LED ON");
  delay(1000);
  
  digitalWrite(2, LOW);
  Serial.println("LED OFF");
  delay(1000);
}
```

**Expected Results:**
1. Serial monitor shows "LED ON" / "LED OFF" messages
2. Console shows `[ESP32 CIRCUIT]` logs
3. LED component in circuit lights up/dims

## 🆘 Still Not Working?

### Checklist:
- [ ] Browser console is open (F12)
- [ ] No JavaScript errors in console
- [ ] Board type is `'esp32-c3'` (not `'esp32'`)
- [ ] Wires are connected in circuit
- [ ] Simulation is running (green play button)
- [ ] Code has been compiled successfully
- [ ] Components have GND connections

### Get Help:
1. Run: `ESP32Diagnostics.runDiagnostics()`
2. Copy console output
3. Take screenshot of circuit
4. Share code being tested
5. Report specific error messages

## 💡 Pro Tips

1. **Always check console first** - Most issues show warnings
2. **Use diagnostic tools** - They're designed to find problems
3. **Test incrementally** - Start with LED, then add complexity
4. **Verify connections** - GND is required for most components
5. **Check pin numbers** - ESP32 uses GPIO numbers, not Arduino pins
6. **Monitor pin states** - Use `monitorPin()` to see changes in real-time
7. **Test without code** - Use `testLED()` to verify circuit wiring

## 🎓 Learning Resources

### Understanding Pin States
- `'HIGH'` / `'LOW'` - Digital output
- `0-255` - PWM output (analogWrite)
- `0-180` - Servo angle (Servo.write)
- `0-4095` - ADC input (analogRead)

### Understanding Voltage Levels
- ESP32 uses **3.3V logic** (not 5V like Arduino)
- ADC range: 0-3.3V → 0-4095 (12-bit)
- Digital HIGH: > 2.0V
- Digital LOW: < 0.8V

### Understanding Pull-ups
- `INPUT_PULLUP` - Pin pulled HIGH by default
- Button connects pin to GND when pressed
- `digitalRead()` returns LOW when pressed

---

**Last Updated:** 2026-05-23  
**Version:** 1.0  
**Status:** Production Ready ✅
