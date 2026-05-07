# ✅ Working Relay + LED Circuit

## Using KS2E-M-DC5 Relay (The one that works!)

### Correct Wiring:

**Control Side:**
1. Arduino **5V** → Relay **COIL2** (power for relay coil)
2. Arduino **Pin 2** → Relay **COIL1** (control signal)

**Load Side (LED Circuit):**
3. Arduino **5V** → Relay **P1** (power source for LED)
4. Relay **NO1** → LED **Anode** (+)
5. LED **Cathode** (-) → **GND**

### How It Works:

- **COIL1 LOW**: P1 connects to NC1 (LED off)
- **COIL1 HIGH**: P1 connects to NO1 (LED on)

### Arduino Code:

```cpp
const int relayPin = 2;

void setup() {
  pinMode(relayPin, OUTPUT);
}

void loop() {
  digitalWrite(relayPin, HIGH);  // Relay energized, LED ON
  delay(1000);
  digitalWrite(relayPin, LOW);   // Relay de-energized, LED OFF
  delay(1000);
}
```

### Pin Explanation:

**KS2E-M-DC5 Relay Pins:**
- **COIL1**: Control signal (connect to Arduino digital pin)
- **COIL2**: Coil ground/power (connect to 5V or GND depending on relay type)
- **P1, P2**: Pole pins (common terminals) - connect power source here
- **NO1, NO2**: Normally Open contacts - connect load here
- **NC1, NC2**: Normally Closed contacts - connect load here

### Why Your Circuit Might Not Work:

1. **Wrong pin connections**: Make sure you're using P1 (pole) and NO1 (normally open), not COM/NO
2. **COIL2 not connected**: COIL2 needs to be connected to 5V for the relay to work
3. **LED polarity**: Make sure LED anode (+) is connected to NO1, cathode (-) to GND

### Test Steps:

1. **Check relay switching**: You should see the relay indicator light up when Pin 2 is HIGH
2. **Check power at P1**: P1 should always have 5V
3. **Check NO1 connection**: When relay is energized, NO1 should have 5V
4. **Check LED**: LED should light when NO1 has 5V

### Common Mistakes:

❌ **Wrong**: Arduino Pin 2 → P1 (pole pin)
✅ **Correct**: Arduino Pin 2 → COIL1 (control pin)

❌ **Wrong**: Arduino 5V → NO1 (normally open)
✅ **Correct**: Arduino 5V → P1 (pole pin)

❌ **Wrong**: COIL2 not connected
✅ **Correct**: COIL2 → Arduino 5V

### Visual Wiring Diagram:

```
Arduino Uno          KS2E-M-DC5 Relay          LED
-----------          ----------------          ---
    5V    ---------> COIL2
    5V    ---------> P1
   Pin 2  ---------> COIL1
                     NO1    ----------------> Anode (+)
                                              Cathode (-) --> GND
```

### If Still Not Working:

1. **Check console logs**: Look for `[RELAY]` messages
2. **Verify wiring**: Double-check each connection
3. **Test LED separately**: Connect LED directly to 5V to verify it works
4. **Test relay separately**: Check if relay indicator lights up

### Alternative: Simple Direct Connection (No Relay)

If relay is too complex, test LED first:

```
Arduino Pin 2 → LED Anode (+) → LED Cathode (-) → GND
```

Code:
```cpp
void setup() {
  pinMode(2, OUTPUT);
}

void loop() {
  digitalWrite(2, HIGH);
  delay(1000);
  digitalWrite(2, LOW);
  delay(1000);
}
```

This should make the LED blink. If this works, then add the relay back.

---

## Summary

The **ks2e-m-dc5 relay works correctly** in Electra. The issue is likely incorrect wiring. Make sure:

1. ✅ COIL1 = control signal (Arduino Pin 2)
2. ✅ COIL2 = power (Arduino 5V)
3. ✅ P1 = power source (Arduino 5V)
4. ✅ NO1 = LED anode
5. ✅ LED cathode = GND

Follow this exact wiring and the LED will light up! 🎉
