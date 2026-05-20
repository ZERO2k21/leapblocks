# ESP32C3SimulationRunner API Integration Fix

## Issue Summary
TypeScript errors in `SimulationRunner.ts` due to API mismatch between the caller and the new `ESP32C3SimulationRunner` class.

## Errors Fixed

### 1. Method Name: `start()` → `run()`
**Error**: Property 'start' does not exist on type 'ESP32C3SimulationRunner'  
**Location**: Line 196

**Fix**:
```typescript
// Before
this.esp32c3Runner.start();

// After
this.esp32c3Runner.run();
```

### 2. Method Name: `setAnalogInput()` → `injectInput()`
**Error**: Property 'setAnalogInput' does not exist on type 'ESP32C3SimulationRunner'  
**Location**: Line 592

**Fix**:
```typescript
// Before
setESP32C3AnalogInput(gpioNum: number, voltage: number): void {
  if (!this.esp32c3Runner) return;
  const adcChannelMap: Record<number, number> = {
    0: 0, 1: 1, 2: 2, 3: 3, 4: 4
  };
  const channel = adcChannelMap[gpioNum];
  if (channel !== undefined) {
    this.esp32c3Runner.setAnalogInput(channel, voltage);
  }
}

// After
setESP32C3AnalogInput(gpioNum: number, voltage: number): void {
  if (!this.esp32c3Runner) return;
  // Convert voltage (0-5V) to 12-bit ADC value (0-4095)
  const adcValue = Math.round((voltage / 5.0) * 4095);
  const pinName = `ESP${gpioNum}`;
  this.esp32c3Runner.injectInput(pinName, adcValue, true);
}
```

### 3. Method Name: `setGPIOInput()` → `injectInput()`
**Error**: Property 'setGPIOInput' does not exist on type 'ESP32C3SimulationRunner'  
**Location**: Line 601

**Fix**:
```typescript
// Before
setESP32C3GPIOInput(gpioNum: number, high: boolean): void {
  if (!this.esp32c3Runner) return;
  this.esp32c3Runner.setGPIOInput(gpioNum, high);
}

// After
setESP32C3GPIOInput(gpioNum: number, high: boolean): void {
  if (!this.esp32c3Runner) return;
  const pinName = `ESP${gpioNum}`;
  this.esp32c3Runner.injectInput(pinName, high, false);
}
```

### 4. Parameter Type: `number` → `string` for pin name
**Error**: Argument of type 'number' is not assignable to parameter of type 'string'  
**Location**: Line 609

**Fix**:
```typescript
// Before
addESP32C3PinListener(gpioNum: number, callback: (high: boolean) => void): void {
  if (!this.esp32c3Runner) return;
  this.esp32c3Runner.addPinListener(gpioNum, callback);
}

// After
addESP32C3PinListener(gpioNum: number, callback: (high: boolean) => void): void {
  if (!this.esp32c3Runner) return;
  const pinName = `ESP${gpioNum}`;
  // Wrap the callback to convert PinState to boolean
  this.esp32c3Runner.addPinListener(pinName, (pin, state) => {
    const high = state === 'HIGH' || (typeof state === 'number' && state > 0);
    callback(high);
  });
}
```

## ESP32C3SimulationRunner API Reference

### Lifecycle Methods
- `async init(firmware: Uint8Array, entryPoint?: number): Promise<void>` - Initialize with firmware
- `run(): void` - Start simulation loop
- `stop(): void` - Stop simulation
- `reset(): void` - Reset CPU and peripherals

### Pin Management
- `injectInput(pin: string, value: boolean | number, isAnalog: boolean): void` - Inject input to GPIO
  - `pin`: Format `"ESP{n}"` (e.g., `"ESP2"`, `"ESP13"`)
  - `value`: `boolean` for digital, `0-4095` for analog (12-bit ADC)
  - `isAnalog`: `true` for ADC input, `false` for digital GPIO

### Listeners
- `addPinListener(pin: string, cb: (pin: string, state: PinState) => void): void`
  - `PinState` = `'HIGH' | 'LOW' | number` (number for PWM 0-255)
- `addSerialListener(cb: (line: string) => void): void`

### Pin Name Format
- **GPIO Number → Pin Name**: `gpioToPinName(2)` → `"ESP2"`
- **Pin Name → GPIO Number**: `pinNameToGpio("ESP2")` → `2`

## Integration Pattern

### Digital Input (Button, Switch)
```typescript
const gpioNum = 2;
const pinName = `ESP${gpioNum}`;
runner.injectInput(pinName, true, false);  // HIGH
runner.injectInput(pinName, false, false); // LOW
```

### Analog Input (Potentiometer, Sensor)
```typescript
const gpioNum = 4;
const voltage = 3.3; // 0-5V
const adcValue = Math.round((voltage / 5.0) * 4095); // 0-4095
const pinName = `ESP${gpioNum}`;
runner.injectInput(pinName, adcValue, true);
```

### Pin Output Listener (LED, Motor)
```typescript
const gpioNum = 2;
const pinName = `ESP${gpioNum}`;
runner.addPinListener(pinName, (pin, state) => {
  if (state === 'HIGH') {
    console.log(`${pin} is HIGH`);
  } else if (state === 'LOW') {
    console.log(`${pin} is LOW`);
  } else {
    console.log(`${pin} PWM value: ${state}`);
  }
});
```

## Voltage to ADC Conversion

ESP32-C3 has a 12-bit ADC (0-4095 range):
- **0V** → `0`
- **1.65V** → `1365` (33% of 4095)
- **3.3V** → `2730` (66% of 4095)
- **5V** → `4095` (100% of 4095)

Formula: `adcValue = (voltage / 5.0) * 4095`

## Files Modified
- `src/modules/leapforge/engine/SimulationRunner.ts` - Fixed API calls to match ESP32C3SimulationRunner

## Status
✅ All TypeScript errors resolved  
✅ API integration complete  
✅ Ready for testing

## Next Steps
1. Restart Electron app to load new build
2. Test ESP32-C3 simulation with LED blink
3. Test analog input (potentiometer)
4. Test digital input (button)
5. Verify serial output in console

---
**Date**: April 22, 2026  
**Issue Type**: API mismatch  
**Resolution**: Updated method calls and parameter types
