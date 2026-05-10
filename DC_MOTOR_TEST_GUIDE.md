# DC Motor + L298N - Testing Guide

## Quick Test (விரைவு சோதனை)

### Circuit Setup:

```
Arduino UNO
  ├─ Pin 9 → L298N IN1
  ├─ Pin 10 → L298N IN2
  └─ GND → L298N GND

L298N Motor Driver
  ├─ 12V ← Battery POS
  ├─ GND ← Battery NEG & Arduino GND
  ├─ ENA ← Jumper (or HIGH)
  ├─ OUT1 → DC Motor POS
  └─ OUT2 → DC Motor NEG

12V Battery
  ├─ POS → L298N 12V
  └─ NEG → L298N GND
```

### Test Code:

```cpp
// Simple Motor Test
void setup() {
  pinMode(9, OUTPUT);   // IN1
  pinMode(10, OUTPUT);  // IN2
}

void loop() {
  // Forward 2 seconds
  digitalWrite(9, HIGH);
  digitalWrite(10, LOW);
  delay(2000);
  
  // Stop 1 second
  digitalWrite(9, LOW);
  digitalWrite(10, LOW);
  delay(1000);
  
  // Reverse 2 seconds
  digitalWrite(9, LOW);
  digitalWrite(10, HIGH);
  delay(2000);
  
  // Stop 1 second
  digitalWrite(9, LOW);
  digitalWrite(10, LOW);
  delay(1000);
}
```

## Expected Results (எதிர்பார்க்கப்படும் முடிவுகள்)

### Forward (முன்னோக்கி):
- ✅ Motor shaft rotates clockwise
- ✅ Yellow gearbox shaft spins
- ✅ Motor vibrates slightly
- ✅ Console: `speed: 1.0, direction: 'cw'`

### Stop (நிறுத்து):
- ✅ Motor stops immediately
- ✅ No vibration
- ✅ Shaft stops rotating
- ✅ Console: `speed: 0`

### Reverse (பின்னோக்கி):
- ✅ Motor shaft rotates counter-clockwise
- ✅ Yellow gearbox shaft spins opposite direction
- ✅ Motor vibrates slightly
- ✅ Console: `speed: 1.0, direction: 'ccw'`

## Troubleshooting (சிக்கல் தீர்வு)

### Motor Not Running At All ❌

**Check**:
1. Battery connected to L298N 12V terminal?
2. Battery GND connected to L298N GND?
3. Arduino GND connected to L298N GND? (Common ground!)
4. ENA jumper in place?
5. Wires properly connected?

**Console Check**:
```javascript
// Open browser console (F12)
// Look for:
[CIRCUIT] L298N has12VPower: true
[CIRCUIT] L298N ena: true, in1: true, in2: false
[CIRCUIT] DC Motor speed: 1.0, direction: 'cw'
```

### Motor Runs Wrong Direction ❌

**Solution**: Swap OUT1 and OUT2 wires on DC motor

### Motor Weak/Slow ❌

**Check**:
1. Battery voltage (should be 12V)
2. Battery charged?
3. Motor rated for 12V?
4. ENA jumper in place?

### Motor Doesn't Stop ❌

**Check**:
1. Both IN1 and IN2 LOW in code?
2. No floating pins?
3. Code logic correct?

### Visual Not Updating ❌

**Check**:
1. Browser console for errors
2. Refresh page
3. Check if simulation running

## Advanced Test (மேம்பட்ட சோதனை)

### PWM Speed Control:

```cpp
// Variable Speed Test
void setup() {
  pinMode(9, OUTPUT);   // IN1
  pinMode(10, OUTPUT);  // IN2
  pinMode(11, OUTPUT);  // ENA (PWM)
}

void loop() {
  // Forward - Slow
  digitalWrite(9, HIGH);
  digitalWrite(10, LOW);
  analogWrite(11, 128);  // 50% speed
  delay(2000);
  
  // Forward - Fast
  analogWrite(11, 255);  // 100% speed
  delay(2000);
  
  // Stop
  digitalWrite(9, LOW);
  digitalWrite(10, LOW);
  delay(1000);
}
```

**Note**: Current implementation shows full speed (1.0) regardless of PWM. PWM support can be added later.

## Both Motors Test (இரண்டு மோட்டார்கள்)

### Circuit:

```
Arduino UNO
  ├─ Pin 9 → L298N IN1 (Motor A)
  ├─ Pin 10 → L298N IN2 (Motor A)
  ├─ Pin 11 → L298N IN3 (Motor B)
  └─ Pin 12 → L298N IN4 (Motor B)

L298N
  ├─ OUT1, OUT2 → DC Motor A
  └─ OUT3, OUT4 → DC Motor B
```

### Code:

```cpp
void setup() {
  pinMode(9, OUTPUT);   // IN1
  pinMode(10, OUTPUT);  // IN2
  pinMode(11, OUTPUT);  // IN3
  pinMode(12, OUTPUT);  // IN4
}

void loop() {
  // Both forward
  digitalWrite(9, HIGH);
  digitalWrite(10, LOW);
  digitalWrite(11, HIGH);
  digitalWrite(12, LOW);
  delay(2000);
  
  // Both reverse
  digitalWrite(9, LOW);
  digitalWrite(10, HIGH);
  digitalWrite(11, LOW);
  digitalWrite(12, HIGH);
  delay(2000);
  
  // Turn left (A reverse, B forward)
  digitalWrite(9, LOW);
  digitalWrite(10, HIGH);
  digitalWrite(11, HIGH);
  digitalWrite(12, LOW);
  delay(1000);
  
  // Turn right (A forward, B reverse)
  digitalWrite(9, HIGH);
  digitalWrite(10, LOW);
  digitalWrite(11, LOW);
  digitalWrite(12, HIGH);
  delay(1000);
  
  // Stop
  digitalWrite(9, LOW);
  digitalWrite(10, LOW);
  digitalWrite(11, LOW);
  digitalWrite(12, LOW);
  delay(1000);
}
```

## Console Debugging (கன்சோல் பிழைத்திருத்தம்)

### Enable Debug Logs:

Open browser console (F12) and look for:

```
[CIRCUIT] Pin change: Arduino Pin 9 → HIGH
[CIRCUIT] Traced to L298N: node-123
[CIRCUIT] L298N has12VPower: true
[CIRCUIT] L298N ena: true, in1: true, in2: false
[CIRCUIT] L298N Motor A: a_pos=true, a_neg=false
[CIRCUIT] Propagating OUT1 → DC Motor: node-456
[CIRCUIT] DC Motor POS=true, NEG=false
[CIRCUIT] DC Motor speed: 1.0, direction: 'cw'
```

### Check Node Data:

```javascript
// In browser console
const nodes = window.__FORGE_STORE__.getState().nodes;
const dcMotor = nodes.find(n => n.data.type === 'dc-motor');
console.log('DC Motor:', dcMotor.data);
// Should show: { speed: 1.0, direction: 'cw', pinStates: {...} }
```

## Performance Check (செயல்திறன் சோதனை)

### Animation Smoothness:
- ✅ 60 FPS rotation
- ✅ No stuttering
- ✅ Smooth direction changes

### CPU Usage:
- ✅ Low CPU usage (<5%)
- ✅ No memory leaks
- ✅ Efficient requestAnimationFrame

## Success Criteria (வெற்றி அளவுகோல்)

### ✅ All Must Pass:
1. Motor rotates when IN1=HIGH, IN2=LOW
2. Motor stops when IN1=LOW, IN2=LOW
3. Motor reverses when IN1=LOW, IN2=HIGH
4. Visual shaft rotates correctly
5. Vibration effect shows when running
6. Direction changes smoothly
7. No console errors
8. Battery power detected correctly

## Common Mistakes (சாதாரண தவறுகள்)

### ❌ Mistake 1: No Common Ground
```
Arduino GND ─┐
             ├─ Must be connected!
L298N GND ───┘
```

### ❌ Mistake 2: No 12V Power
```
Battery POS → L298N 12V  ✅
Battery NEG → L298N GND  ✅
```

### ❌ Mistake 3: ENA Not Enabled
```
ENA jumper must be in place OR
ENA pin connected to HIGH
```

### ❌ Mistake 4: Wrong Pin Connections
```
Arduino Pin 9 → L298N IN1  ✅ (not IN2!)
Arduino Pin 10 → L298N IN2 ✅ (not IN1!)
```

## Summary (சுருக்கம்)

### Quick Checklist:
- [ ] Battery connected (12V, GND)
- [ ] Common ground (Arduino GND = L298N GND)
- [ ] ENA jumper in place
- [ ] IN1, IN2 connected to Arduino
- [ ] DC motor connected to OUT1, OUT2
- [ ] Code uploaded
- [ ] Simulation running

**If all checked, motor should run!** ✅

---

**Test Status**: Ready to Test
**Expected Result**: Motor runs forward, stops, reverses, stops (loop)

