# ESP32 LED Not Glowing - Debug Checklist

## ✅ What's Working
- QEMU starts successfully (no exit code 1)
- Serial port connects (127.0.0.1:5555)
- QMP monitor connects and sends 'cont'
- CPU is running

## 🔍 Debug Steps

### 1. Check Serial Output for GPIO Lines
**Open browser console (F12) and look for:**
```
[ESP32Runner] Serial line: "__LF_GPIO:2:1"
[ESP32Runner] GPIO detected: pin=2, high=true, listeners=1
```

**If you DON'T see `__LF_GPIO` lines:**
- GPIO monitor header wasn't injected
- Check: `[ESP32 Compiler] Writing sketch to: ...`
- Verify the injected code contains the wrapper function

### 2. Check Pin Listener Registration
**Look for these console logs:**
```
[FORGE CIRCUIT] syncCircuitGraph: qemuRunner exists? true, isESP32Board? true
[FORGE CIRCUIT] QEMU GPIO listener registered: pin D2 → GPIO2 → peripheral led-xxx[Anode], pType=led
[ESP32Runner] Pin listener added: GPIO2, total listeners: 1
```

**If qemuRunner is null:**
- ESP32SimulationRunner wasn't created before syncCircuitGraph
- Check: `[FORGE STORE] QEMU ESP32 path — creating ESP32SimulationRunner before syncCircuitGraph...`

### 3. Check Wire Connection
**Verify in the UI:**
- ESP32 board pin D2 is wired to LED Anode
- LED Cathode is wired to GND
- Wire color should be green (valid connection)

### 4. Test Sketch
**Use this minimal test sketch:**
```cpp
void setup() {
  Serial.begin(115200);
  pinMode(2, OUTPUT);
  Serial.println("ESP32 LED Test Started");
}

void loop() {
  Serial.println("LED ON");
  digitalWrite(2, HIGH);
  delay(1000);
  
  Serial.println("LED OFF");
  digitalWrite(2, LOW);
  delay(1000);
}
```

**Expected serial output:**
```
ESP32 LED Test Started
LED ON
__LF_GPIO:2:1
LED OFF
__LF_GPIO:2:0
LED ON
__LF_GPIO:2:1
...
```

### 5. Check Compiled Binary
**Verify GPIO monitor was injected:**
```bash
# In temp directory (shown in console):
# C:\Users\...\AppData\Local\Temp\forge_esp32_xxx\sketch\sketch.ino

# Should contain at top:
// ---- LeapForge GPIO monitor (auto-injected, do not remove) ----
static void __lf_digitalWrite(uint8_t pin, uint8_t val) {
  digitalWrite(pin, val);
  Serial.printf("__LF_GPIO:%d:%d\n", pin, (int)val);
}
#define digitalWrite(p,v) __lf_digitalWrite((p),(v))
// ---- end LeapForge injection ----
```

## 🐛 Common Issues

### Issue 1: No `__LF_GPIO` lines in serial
**Cause**: GPIO monitor not injected or Serial not initialized

**Fix**:
1. Add `Serial.begin(115200);` in `setup()`
2. Verify injection in `esp32Compiler.js`
3. Check temp sketch file contains wrapper

### Issue 2: GPIO lines appear but LED doesn't glow
**Cause**: Pin listener not registered or wrong GPIO number

**Fix**:
1. Check console for: `[ESP32Runner] GPIO detected: pin=X`
2. Verify X matches your wired pin (D2 = GPIO2)
3. Check: `[ESP32Runner] Pin listener added: GPIOX, total listeners: 1`

### Issue 3: Listener registered but callback not firing
**Cause**: Regex not matching or line parsing issue

**Fix**:
1. Check exact serial line format: `[ESP32Runner] Serial line: "..."`
2. Verify regex: `/^__LF_GPIO:(\d+):(\d)$/`
3. Check for extra whitespace or characters

### Issue 4: Callback fires but LED doesn't update
**Cause**: updateNodeData not reaching React component

**Fix**:
1. Check: `[FORGE CIRCUIT] QEMU GPIO listener registered: ... pType=led`
2. Verify `pType` matches your peripheral type
3. Check Zustand store updates in React DevTools

## 📊 Expected Console Log Flow

```
[FORGE STORE] startSimulation triggered. Hex length: 14
[FORGE STORE] QEMU ESP32 path — creating ESP32SimulationRunner before syncCircuitGraph...
[FORGE STORE] ESP32 serial listener wired to store.appendSerial
[FORGE CIRCUIT] syncCircuitGraph triggered. Re-evaluating electrical routing table...
[FORGE CIRCUIT] syncCircuitGraph: qemuRunner exists? true, isESP32Board? true
[FORGE CIRCUIT] QEMU GPIO listener registered: pin D2 → GPIO2 → peripheral led-xxx[Anode], pType=led
[ESP32Runner] Pin listener added: GPIO2, total listeners: 1
[FORGE STORE] Firing simulationRunner.start()
[ESP32Runner] QEMU started, binPath: C:\...\sketch.ino.merged.bin
[QEMU] ✓ Binary found: ...
[QEMU] Using ports: serial=5555, monitor=5556
[Serial] Connected to 127.0.0.1:5555
[QEMU] QMP connected — sending cont to resume CPU...
[QEMU] CPU running — sketch started
[ESP32Runner] Serial line: "ESP32 LED Test Started"
[ESP32Runner] Serial line: "LED ON"
[ESP32Runner] Serial line: "__LF_GPIO:2:1"
[ESP32Runner] GPIO detected: pin=2, high=true, listeners=1
[ESP32Runner] Serial line: "LED OFF"
[ESP32Runner] Serial line: "__LF_GPIO:2:0"
[ESP32Runner] GPIO detected: pin=2, high=false, listeners=1
```

## 🔧 Quick Fixes

### Rebuild with logging enabled:
1. Stop simulation
2. Clear browser console (Ctrl+L)
3. Start simulation
4. Watch console for the expected log flow above
5. Identify where the flow breaks

### Force GPIO monitor injection:
Check `electron/esp32Compiler.js` line 62:
```javascript
const injectedCode = GPIO_MONITOR_HEADER + '\n' + code;
```

### Verify QEMU runner creation:
Check `src/modules/leapforge/store/useForgeStore.ts` line 159:
```typescript
simulationRunner.initCPU(''); // creates esp32Runner
```

### Check pin mapping:
ESP32 DevKit V1 pin D2 = GPIO2
```typescript
convertESP32Pin('D2') → { avrPin: 'ESP2' }
```

## 📝 Next Steps

1. **Run simulation with console open (F12)**
2. **Copy all console logs** starting from "startSimulation triggered"
3. **Compare with expected flow** above
4. **Identify the missing log line** - that's where the issue is
5. **Share the logs** for further diagnosis

---

**Current Status**: QEMU starts successfully, need to verify GPIO protocol is working.
