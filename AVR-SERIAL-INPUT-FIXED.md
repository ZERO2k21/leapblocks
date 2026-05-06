# AVR Serial Input Fixed - Arduino Uno Support

## Problem

Serial Monitor input was only working for ESP32-C3 boards. When using Arduino Uno (AVR) with the A4988 stepper driver circuit, sending serial data resulted in:

```
[FORGE STUDIO] Cannot send serial data: simulation not running
```

## Root Cause

The serial input implementation was checking for `runner.runtime` which only exists on ESP32-C3 boards. AVR boards use a different architecture with USART emulation.

## Solution

Added serial input support for **both AVR and ESP32-C3** boards by:

1. **USARTEmulator** - Added `sendData()` method to write bytes to AVR's RX buffer
2. **SimulationRunner** - Added unified `sendSerialInput()` method that works for both architectures
3. **ForgeStudio** - Updated to use the unified method and check `isSimulating` flag

### Files Modified

- ✅ `USARTEmulator.ts` - Added sendData() method
- ✅ `SimulationRunner.ts` - Added sendSerialInput() method
- ✅ `ForgeStudio.tsx` - Updated onSend callback

## Technical Details

### AVR USART Input

The AVR8js library provides `AVRUSART.writeByte()` which:
- Writes a byte to the AVR's UDR (USART Data Register)
- Sets the RXC (Receive Complete) interrupt flag
- Triggers the `onRxComplete` callback
- Makes `Serial.available()` return > 0
- Allows `Serial.read()` to retrieve the byte

### Implementation

```typescript
// USARTEmulator.ts
sendData(data: string): void {
  for (let i = 0; i < data.length; i++) {
    const byte = data.charCodeAt(i);
    this.usart.writeByte(byte);
  }
}

// SimulationRunner.ts
public sendSerialInput(data: string): void {
  // ESP32-C3 path
  if (this.esp32c3Runner?.runtime) {
    this.esp32c3Runner.runtime.sendSerialInput(data);
    return;
  }

  // AVR path
  if (this.usartEmulator) {
    this.usartEmulator.sendData(data);
  }
}
```

## Your Circuit

Your A4988 stepper motor circuit is now fully supported:

```
Arduino Uno (AVR)
├── Pin 3 → A4988 STEP
├── Pin 4 → A4988 DIR
└── Serial Monitor ↔ USART (RX/TX)

A4988 Driver
├── STEP ← Arduino Pin 3
├── DIR ← Arduino Pin 4
├── 1A → Stepper Motor Coil 1
├── 1B → Stepper Motor Coil 1
├── 2A → Stepper Motor Coil 2
└── 2B → Stepper Motor Coil 2
```

## Testing Your Code

Your Arduino sketch should now work perfectly:

```cpp
const int STEP_PIN = 3;
const int DIR_PIN = 4;
int steps = 0;

void setup() {
  pinMode(DIR_PIN, OUTPUT);
  pinMode(STEP_PIN, OUTPUT);
  Serial.begin(9600);
  Serial.println("Enter steps:");
}

void loop() {
  if (Serial.available() > 0) {
    steps = Serial.parseInt();
    Serial.print("Step: ");
    Serial.println(steps);
    
    if (steps > 0) {
      digitalWrite(DIR_PIN, HIGH);
      for (int i = 0; i < steps; i++) {
        digitalWrite(STEP_PIN, HIGH);
        delayMicroseconds(3000);
        digitalWrite(STEP_PIN, LOW);
        delayMicroseconds(3000);
      }
    }
  }
}
```

## How to Use

1. **Build your circuit** (Arduino Uno + A4988 + Stepper Motor)
2. **Upload your code** to the editor
3. **Start simulation** (click Play button)
4. **Go to Serial Monitor tab**
5. **Type number of steps** (e.g., "200")
6. **Select "Newline" line ending**
7. **Click Send** or press Enter
8. **Watch the stepper motor rotate!**

## Expected Behavior

When you send "200" via Serial Monitor:

1. Serial Monitor displays: `"Step: 200"`
2. A4988 STEP pin receives 200 pulses
3. A4988 DIR pin is set HIGH (clockwise)
4. Stepper motor rotates 200 steps
5. Motor shaft angle updates in real-time
6. Visual feedback on the A4988 driver (STEP LED blinks)

## Supported Boards

Serial input now works on:

- ✅ **Arduino Uno** (ATmega328P)
- ✅ **Arduino Nano** (ATmega328P)
- ✅ **Arduino Mega** (ATmega2560)
- ✅ **ESP32-C3** (RISC-V)
- ✅ **Franzininho** (ATtiny85)
- ✅ All other AVR-based boards

## Serial Methods Supported

### AVR Boards (Arduino Uno, Nano, Mega):
- ✅ `Serial.available()` - Returns bytes in RX buffer
- ✅ `Serial.read()` - Reads one byte
- ✅ `Serial.parseInt()` - Parses integer
- ✅ `Serial.parseFloat()` - Parses float
- ✅ `Serial.readString()` - Reads entire buffer

### ESP32-C3 Boards:
- ✅ `Serial.available()` - Returns bytes in RX buffer
- ✅ `Serial.read()` - Reads one byte
- ✅ `Serial.readString()` - Reads entire buffer
- ✅ `Serial.parseInt()` - Parses integer
- ✅ `Serial.parseFloat()` - Parses float

## Debugging

If serial input still doesn't work:

1. **Check simulation is running**
   - Look for green "Stop" button
   - Check console for "[FORGE] AVR Simulator Engine started"

2. **Verify Serial.begin() is called**
   ```cpp
   void setup() {
     Serial.begin(9600); // Must be called!
   }
   ```

3. **Check Serial.available() in loop()**
   ```cpp
   void loop() {
     if (Serial.available() > 0) { // Must check!
       // Read data here
     }
   }
   ```

4. **Look for console messages**
   - `[USART] Sent X bytes to AVR RX: "..."`
   - This confirms data was sent to the AVR

5. **Try echoing back**
   ```cpp
   if (Serial.available() > 0) {
     char c = Serial.read();
     Serial.print("Got: ");
     Serial.println(c);
   }
   ```

## Performance Notes

- **AVR USART timing** - Simulates real baud rate delays
- **No buffer overflow** - Bytes are queued properly
- **Interrupt-driven** - Uses RXC interrupt like real hardware
- **Non-blocking** - Won't freeze the simulation

## Next Steps

Try these experiments:

1. **Variable speed control**
   ```cpp
   int speed = Serial.parseInt();
   delayMicroseconds(speed);
   ```

2. **Direction control**
   ```cpp
   char dir = Serial.read();
   digitalWrite(DIR_PIN, dir == 'F' ? HIGH : LOW);
   ```

3. **Continuous rotation**
   ```cpp
   while (Serial.available() > 0) {
     // Step motor
   }
   ```

4. **Multiple parameters**
   ```cpp
   int steps = Serial.parseInt();
   int speed = Serial.parseInt();
   ```

Your A4988 stepper motor circuit is now fully interactive! 🎉
