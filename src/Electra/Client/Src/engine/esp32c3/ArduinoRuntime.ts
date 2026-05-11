/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 *
 * ArduinoRuntime — Browser-side Arduino API stub layer for ESP32-C3 simulation.
 *
 * Instead of running real RISC-V firmware, this executes transpiled JavaScript
 * that calls Arduino API functions.  Each function maps directly to the
 * CircuitEngine / SerialMonitor / WiFi log.
 *
 * Lifecycle:  runtime.start() → setup() → loop() → loop() → …
 *             runtime.stop()  → halts the loop
 */

import { useForgeStore } from '../../../utlis/store/useForgeStore';

export type PinMode = 'INPUT' | 'OUTPUT' | 'INPUT_PULLUP' | 'INPUT_PULLDOWN';
export type PinValue = 0 | 1;
export type PinChangeCallback = (pin: number, value: number, isAnalog: boolean) => void;
export type SerialCallback = (text: string) => void;

// ─── ESP32-C3 Pin Constants ────────────────────────────────────
const HIGH = 1;
const LOW = 0;
const INPUT = 0;
const OUTPUT = 1;
const INPUT_PULLUP = 2;
const INPUT_PULLDOWN = 3;

// LED_BUILTIN for ESP32-C3
const LED_BUILTIN = 8;

// ─── Arduino Runtime ───────────────────────────────────────────

export class ArduinoRuntime {
  // ── Pin state ────────────────────────────────────────────────
  private pinModes: Map<number, PinMode> = new Map();
  private pinValues: Map<number, number> = new Map();
  private analogInputs: Map<number, number> = new Map(); // ADC injected values (0-4095)

  // ── Timing ───────────────────────────────────────────────────
  private startTime: number = 0;  // millis() epoch
  private running: boolean = false;
  private rafHandle: number | null = null;

  // ── Serial ───────────────────────────────────────────────────
  private serialBaud: number = 0;
  private serialBuffer: string = '';
  private serialInputBuffer: number[] = []; // Input buffer for Serial.read()

  // ── Callbacks ────────────────────────────────────────────────
  private onPinChange: PinChangeCallback | null = null;
  private onSerial: SerialCallback | null = null;

  // ── Lifecycle functions (from transpiled code) ───────────────
  private setupFn: (() => Promise<void>) | null = null;
  private loopFn: (() => Promise<void>) | null = null;

  // ── Interrupt handlers ───────────────────────────────────────
  private interruptHandlers: Map<number, { callback: () => void; mode: number }> = new Map();

  // ── Delay control ────────────────────────────────────────────
  private _abortController: AbortController | null = null;
  private _lastMicrosCallTime: number = 0;
  private _microsSpinCount: number = 0;
  private _virtualTimeOffset: number = 0;

  // ── I2C bus bridge (set by CircuitEngine after syncCircuitGraph) ──────────
  private _i2cBus: {
    startTransmission(addr: number): void;
    write(val: number): void;
    endTransmission(): void;
    requestFrom(addr: number, qty: number): void;
    available(): number;
    read(): number;
  } | null = null;

  /** Wire ArduinoRuntime's Wire API to the real I2CBusManager */
  setI2CBus(bus: typeof this._i2cBus): void {
    this._i2cBus = bus;
  }

  /** Inject a real library class implementation to replace a stub in transpiled code.
   *  Must be called before loadTranspiledCode(). */
  private _injectedClasses: Map<string, any> = new Map();

  injectLibraryClass(name: string, cls: any): void {
    this._injectedClasses.set(name, cls);
  }

  constructor() { }

  // ─── Public API ──────────────────────────────────────────────

  /** Register callback for GPIO pin changes */
  onPinChanged(cb: PinChangeCallback): void { this.onPinChange = cb; }

  /** Register callback for serial output */
  onSerialOutput(cb: SerialCallback): void { this.onSerial = cb; }

  /** Inject analog input value (from CircuitEngine sensor sliders) */
  setAnalogInput(pin: number, value12bit: number): void {
    this.analogInputs.set(pin, value12bit & 0xFFF);
  }

  /** Send data to Serial input buffer (from Serial Monitor) */
  sendSerialInput(data: string): void {
    // Convert string to byte array and add to input buffer
    for (let i = 0; i < data.length; i++) {
      this.serialInputBuffer.push(data.charCodeAt(i));
    }
    console.log(`[ARDUINO RUNTIME] Serial input received: "${data}" (${this.serialInputBuffer.length} bytes in buffer)`);
  }

  /** Inject digital input (from CircuitEngine) */
  setDigitalInput(pin: number, high: boolean): void {
    const prev = this.pinValues.get(pin) ?? LOW;
    const curr = high ? HIGH : LOW;
    if (prev !== curr) {
      this.pinValues.set(pin, curr);
      const handler = this.interruptHandlers.get(pin);
      if (handler) {
        // Mode mapping: RISING: 1, FALLING: 2, CHANGE: 3
        if (handler.mode === 3 || (handler.mode === 1 && curr === HIGH) || (handler.mode === 2 && curr === LOW)) {
          handler.callback();
        }
      }
      if (this.onPinChange) {
        this.onPinChange(pin, curr, false);
      }
    }
  }

  /** Load transpiled JS and extract setup/loop */
  loadTranspiledCode(jsCode: string): void {
    const exports: Record<string, any> = {};

    // Build the Arduino API context that the transpiled code will use
    const context = this.buildContext(exports);

    // Merge any injected library classes (override stubs in transpiled code)
    const injectedNames: string[] = [];
    for (const [name, cls] of this._injectedClasses) {
      context[name] = cls;
      injectedNames.push(name);
    }
    console.log(`[ARDUINO RUNTIME] loadTranspiledCode: injected classes = [${injectedNames.join(', ')}]`);
    console.log(`[ARDUINO RUNTIME] context keys count = ${Object.keys(context).length}`);
    console.log(`[ARDUINO RUNTIME] Adafruit_SSD1306 in context = ${!!context['Adafruit_SSD1306']}`);

    // Evaluate the transpiled code in a sandbox with Arduino APIs available
    try {
      const fn = new Function(...Object.keys(context), jsCode);
      fn(...Object.values(context));
      console.log(`[ARDUINO RUNTIME] ✓ Code evaluated. setup=${!!exports.setup}, loop=${!!exports.loop}`);
    } catch (e) {
      console.error(`[ARDUINO RUNTIME] ✗ new Function() evaluation failed:`, e);
      // Dump full transpiled code so we can see exactly what broke
      console.error(`[ARDUINO RUNTIME] ── TRANSPILED CODE DUMP ──\n${jsCode}\n── END DUMP ──`);
      throw e;
    }

    this.setupFn = exports.setup || null;
    this.loopFn = exports.loop || null;
  }

  /** Start the simulation */
  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    this.startTime = performance.now();
    this._abortController = new AbortController();

    console.log('[ArduinoRuntime] Starting simulation...');

    // Run setup()
    if (this.setupFn) {
      try {
        await this.setupFn();
      } catch (e: any) {
        if (e.message === '__ARDUINO_HALT__') return;
        console.error('[ArduinoRuntime] setup() error:', e);
        this.onSerial?.(`[ERROR in setup()]: ${e.message}\n`);
        this.running = false;
        return;
      }
    }

    // Start loop()
    this.runLoop();
  }

  /** Stop the simulation */
  stop(): void {
    this.running = false;
    this._abortController?.abort();
    this._abortController = null;
    if (this.rafHandle !== null) {
      cancelAnimationFrame(this.rafHandle);
      this.rafHandle = null;
    }
    this.pinModes.clear();
    this.pinValues.clear();
    this.analogInputs.clear();
    this.serialBaud = 0;
    this.serialBuffer = '';
    this.interruptHandlers.clear();
    this._virtualTimeOffset = 0;
    this._microsSpinCount = 0;
    this._lastMicrosCallTime = 0;
    console.log('[ArduinoRuntime] Simulation stopped.');
  }

  get isRunning(): boolean { return this.running; }

  // ─── Private: Loop runner ────────────────────────────────────

  private async runLoop(): Promise<void> {
    if (!this.running || !this.loopFn) return;

    try {
      await this.loopFn();
    } catch (e: any) {
      if (e.message === '__ARDUINO_HALT__') return;
      console.error('[ArduinoRuntime] loop() error:', e);
      this.onSerial?.(`[ERROR in loop()]: ${e.message}\n`);
      this.running = false;
      return;
    }

    if (this.running) {
      // Schedule next loop iteration on the next animation frame
      this.rafHandle = requestAnimationFrame(() => this.runLoop());
    }
  }

  // ─── Build Arduino API Context ───────────────────────────────

  private buildContext(exports: Record<string, any>): Record<string, any> {
    const self = this;

    return {
      // ── Export mechanism ────────────────────────────────────
      __exports: exports,

      // ── Constants ──────────────────────────────────────────
      HIGH, LOW, INPUT, OUTPUT, INPUT_PULLUP, INPUT_PULLDOWN,
      LED_BUILTIN,
      A0: 0, A1: 1, A2: 2, A3: 3, A4: 4, A5: 5,
      // ESP32-C3 specific
      D0: 0, D1: 1, D2: 2, D3: 3, D4: 4, D5: 5,
      D6: 6, D7: 7, D8: 8, D9: 9, D10: 10,
      D13: 13, D18: 18, D19: 19,
      // Interrupt modes
      RISING: 1, FALLING: 2, CHANGE: 3,

      // ── Adafruit SSD1306 / display constants ───────────────
      SSD1306_SWITCHCAPVCC: 0x02,
      SSD1306_EXTERNALVCC: 0x01,
      SSD1306_MEMORYMODE: 0x20,
      SSD1306_COLUMNADDR: 0x21,
      SSD1306_PAGEADDR: 0x22,
      SSD1306_SETCONTRAST: 0x81,
      SSD1306_DISPLAYALLON_RESUME: 0xA4,
      SSD1306_DISPLAYALLON: 0xA5,
      SSD1306_NORMALDISPLAY: 0xA6,
      SSD1306_INVERTDISPLAY: 0xA7,
      SSD1306_DISPLAYOFF: 0xAE,
      SSD1306_DISPLAYON: 0xAF,
      SSD1306_SETDISPLAYOFFSET: 0xD3,
      SSD1306_SETCOMPINS: 0xDA,
      SSD1306_SETVCOMDETECT: 0xDB,
      SSD1306_SETDISPLAYCLOCKDIV: 0xD5,
      SSD1306_SETPRECHARGE: 0xD9,
      SSD1306_SETMULTIPLEX: 0xA8,
      SSD1306_SETLOWCOLUMN: 0x00,
      SSD1306_SETHIGHCOLUMN: 0x10,
      SSD1306_SETSTARTLINE: 0x40,
      SSD1306_COMSCANINC: 0xC0,
      SSD1306_COMSCANDEC: 0xC8,
      SSD1306_SEGREMAP: 0xA0,
      SSD1306_CHARGEPUMP: 0x8D,
      SSD1306_128_64: 1,
      SSD1306_128_32: 2,
      SSD1306_96_16: 3,

      // ── Adafruit GFX / color constants ─────────────────────
      BLACK: 0,
      WHITE: 1,
      INVERSE: 2,
      RED: 0xF800,
      GREEN: 0x07E0,
      BLUE: 0x001F,
      CYAN: 0x07FF,
      MAGENTA: 0xF81F,
      YELLOW: 0xFFE0,
      ORANGE: 0xFC00,

      // ── DHT sensor constants ────────────────────────────────
      DHT11: 11,
      DHT22: 22,
      DHT21: 21,
      AM2301: 21,

      // ── Wire / I2C constants ────────────────────────────────
      WIRE_HAS_END: 1,

      // ── Serial constants ────────────────────────────────────
      SERIAL_8N1: 0x06,
      SERIAL_8N2: 0x0E,
      SERIAL_8E1: 0x26,
      SERIAL_8O1: 0x36,
      DEC: 10,
      HEX: 16,
      OCT: 8,
      BIN: 2,

      // ── Misc Arduino constants ──────────────────────────────
      PI: Math.PI,
      HALF_PI: Math.PI / 2,
      TWO_PI: Math.PI * 2,
      DEG_TO_RAD: Math.PI / 180,
      RAD_TO_DEG: 180 / Math.PI,
      EULER: Math.E,
      LSBFIRST: 0,
      MSBFIRST: 1,
      INPUT_ANALOG: 4,
      OUTPUT_OPEN_DRAIN: 5,
      WAKEUP_PULLUP: 0,
      WAKEUP_PULLDOWN: 1,

      // ── ESP32 function attribute macros (no-ops in JS) ─────
      IRAM_ATTR: undefined,
      ICACHE_RAM_ATTR: undefined,
      DRAM_ATTR: undefined,

      // ── WiFi status constants (from ESP32 WiFi library) ──────
      WL_NO_SHIELD: 255,
      WL_IDLE_STATUS: 0,
      WL_NO_SSID_AVAIL: 1,
      WL_SCAN_COMPLETED: 2,
      WL_CONNECTED: 3,
      WL_CONNECT_FAILED: 4,
      WL_CONNECTION_LOST: 5,
      WL_DISCONNECTED: 6,
      WIFI_STA: 1,
      WIFI_AP: 2,
      WIFI_AP_STA: 3,

      // ── Additional Arduino utility functions ───────────────
      // shiftIn / shiftOut — used by some sensor libraries
      shiftIn(_dataPin: number, _clockPin: number, _bitOrder: number): number { return 0; },
      shiftOut(_dataPin: number, _clockPin: number, _bitOrder: number, _val: number): void { },
      // pulseInLong — same as pulseIn but for longer pulses
      pulseInLong(pin: number, state: number, timeout?: number): number {
        return 0; // stub — real timing not available in browser
      },
      // noInterrupts / interrupts — no-ops in browser simulation
      noInterrupts(): void { },
      interrupts(): void { },
      // yield — cooperative multitasking hint, no-op in async JS
      yield(): void { },
      // ESP32-specific
      esp_get_free_heap_size(): number { return 200000; },
      esp_get_minimum_free_heap_size(): number { return 100000; },
      ESP: {
        restart(): void { console.log('[ESP32] restart() called'); },
        getFreeHeap(): number { return 200000; },
        getChipRevision(): number { return 3; },
        getCpuFreqMHz(): number { return 160; },
        getFlashChipSize(): number { return 4194304; },
      },

      // ── GPIO ───────────────────────────────────────────────
      pinMode(pin: number, mode: number): void {
        const modeStr: PinMode =
          mode === OUTPUT ? 'OUTPUT' :
            mode === INPUT_PULLUP ? 'INPUT_PULLUP' :
              mode === INPUT_PULLDOWN ? 'INPUT_PULLDOWN' : 'INPUT';
        self.pinModes.set(pin, modeStr);
        if (mode === OUTPUT) {
          self.pinValues.set(pin, LOW);
        }
      },

      digitalWrite(pin: number, value: number): void {
        const prev = self.pinValues.get(pin) ?? LOW;
        const curr = value ? HIGH : LOW;
        self.pinValues.set(pin, curr);
        if (prev !== curr && self.onPinChange) {
          self.onPinChange(pin, curr, false);
        }
      },

      digitalRead(pin: number): number {
        return self.pinValues.get(pin) ?? LOW;
      },

      analogRead(pin: number): number {
        // First check internal map (set by setAnalogInput)
        const cached = self.analogInputs.get(pin);
        if (cached !== undefined) return cached;

        // Read live from store — find analog sensors and compute ADC
        try {
          const { nodes } = useForgeStore.getState();
          for (const n of nodes) {
            const t = n.data?.type;
            const sv = n.data?.sensorValues;
            if (!sv) continue;

            // NTC temperature sensor → exact inverse of common sketch formula:
            //   celsius = 1/(log(1/(1023./adc - 1))/BETA + 1/298.15) - 273.15
            // Inverse:  adc = 1023 * ratio / (1 + ratio)
            //   where ratio = exp(BETA * (1/(tempC+273.15) - 1/298.15))
            if (t === 'ntc-temperature-sensor') {
              const tempC = sv.value ?? 25;
              const BETA = 3950;
              const x = BETA * (1 / (tempC + 273.15) - 1 / 298.15);
              const ratio = Math.exp(x);
              return Math.round(1023 * ratio / (1 + ratio));
            }

            // Potentiometer / generic analog sensor → 0-1023
            if (t === 'potentiometer' || t === 'mq2' || t === 'resistor') {
              return Math.round(((sv.value ?? 0) / 100) * 1023);
            }

            // Photoresistor (LDR)
            if (t === 'photoresistor-sensor') {
              const lux = sv.value ?? 500;
              const R_ldr = 500000 / Math.max(1, lux);
              const voltage = 5.0 * 10000 / (R_ldr + 10000);
              return Math.round((voltage / 5.0) * 1023);
            }

            // Heart rate sensor → simulated pulse waveform based on BPM
            if (t === 'heart-beat-sensor') {
              const bpm = sv.bpm ?? 72;
              const beatIntervalMs = 60000 / bpm;
              const elapsed = performance.now() % beatIntervalMs;
              const phase = elapsed / beatIntervalMs;
              // Simulate a pulse: short spike (10% of cycle), rest is baseline
              if (phase < 0.1) {
                // During beat — sinusoidal spike 512→900→512
                const beatPhase = phase / 0.1; // 0→1
                return Math.round(512 + 388 * Math.sin(beatPhase * Math.PI));
              }
              // Between beats — baseline with slight noise
              return Math.round(480 + Math.random() * 40);
            }

            // Flame sensor → inverse intensity (higher flame = lower voltage)
            if (t === 'flame-sensor') {
              const intensity = sv.value ?? 0;
              return Math.round((1 - intensity / 100) * 1023);
            }

            // Gas sensor (MQ series)
            if (t === 'gas-sensor') {
              return Math.round(((sv.value ?? 0) / 100) * 1023);
            }

            // Sound sensor
            if (t === 'big-sound-sensor' || t === 'small-sound-sensor') {
              return Math.round(((sv.value ?? 0) / 100) * 1023);
            }
          }
        } catch (e) { /* store not available */ }

        return 0;
      },

      analogWrite(pin: number, value: number): void {
        const clamped = Math.max(0, Math.min(255, value));
        self.pinValues.set(pin, clamped);
        if (self.onPinChange) {
          self.onPinChange(pin, clamped, true);
        }
      },

      // ESP32-specific
      ledcSetup(channel: number, _freq: number, _resolution: number): number {
        return channel;
      },
      ledcAttachPin(_pin: number, _channel: number): void { },
      ledcWrite(channel: number, duty: number): void {
        // Route channel 0 to the attached pin (simplified)
        self.pinValues.set(channel, duty);
        if (self.onPinChange) {
          self.onPinChange(channel, duty, true);
        }
      },
      dacWrite(pin: number, value: number): void {
        self.pinValues.set(pin, value);
        if (self.onPinChange) {
          self.onPinChange(pin, value, true);
        }
      },
      touchRead(_pin: number): number { return 50; },
      analogReadResolution(_bits: number): void { /* ESP32 ADC resolution — no-op in sim */ },
      analogWriteResolution(_bits: number): void { /* PWM resolution — no-op */ },
      analogSetAttenuation(_atten: number): void { /* ESP32 ADC attenuation — no-op */ },
      analogSetPinAttenuation(_pin: number, _atten: number): void { },

      // ── C math functions (not in Math.*) ────────────────────
      log: Math.log,       // natural logarithm — used by NTC thermistor formulas
      log10: Math.log10,
      log2: Math.log2,
      exp: Math.exp,
      pow: Math.pow,
      sqrt: Math.sqrt,
      ceil: Math.ceil,
      floor: Math.floor,
      round: Math.round,

      // ── Interrupts ─────────────────────────────────────────
      // digitalPinToInterrupt: on ESP32 all GPIO pins support interrupts,
      // so this is an identity function (pin number = interrupt number)
      digitalPinToInterrupt(pin: number): number { return pin; },
      attachInterrupt(pin: number, callback: () => void, mode: number): void {
        self.interruptHandlers.set(pin, { callback, mode });
      },
      detachInterrupt(pin: number): void {
        self.interruptHandlers.delete(pin);
      },

      // ── Serial ─────────────────────────────────────────────
      Serial: {
        begin(baud: number): void { self.serialBaud = baud; },
        print(val: any): void {
          const text = String(val);
          self.serialBuffer += text;
          self.onSerial?.(text);
        },
        println(val: any = ''): void {
          const text = String(val) + '\n';
          self.serialBuffer += text;
          self.onSerial?.(text);
        },
        write(val: any): void {
          const text = typeof val === 'number' ? String.fromCharCode(val) : String(val);
          self.serialBuffer += text;
          self.onSerial?.(text);
        },
        available(): number {
          return self.serialInputBuffer.length;
        },
        read(): number {
          return self.serialInputBuffer.length > 0 ? self.serialInputBuffer.shift()! : -1;
        },
        readString(): string {
          if (self.serialInputBuffer.length === 0) return '';
          const str = String.fromCharCode(...self.serialInputBuffer);
          self.serialInputBuffer = [];
          return str;
        },
        parseInt(): number {
          const str = this.readString();
          const num = parseInt(str, 10);
          return isNaN(num) ? 0 : num;
        },
        parseFloat(): number {
          const str = this.readString();
          const num = parseFloat(str);
          return isNaN(num) ? 0.0 : num;
        },
        flush(): void { },
        end(): void { },
      },

      // Serial1 / Serial2 stubs
      Serial1: {
        begin(_baud: number): void { },
        print(val: any): void { self.onSerial?.(`[S1] ${val}`); },
        println(val: any = ''): void { self.onSerial?.(`[S1] ${val}\n`); },
        write(_val: any): void { },
        available(): number { return 0; },
        read(): number { return -1; },
        readString(): string { return ''; },
        flush(): void { },
        end(): void { },
      },

      // ── Timing ─────────────────────────────────────────────
      millis(): number {
        return Math.floor(this.micros() / 1000);
      },
      micros(): number {
        const now = performance.now();
        // If micros() is called repeatedly in the exact same millisecond (tight spin loop)
        // artificially advance virtual time to prevent triggering the infinite loop protector
        if (now === self._lastMicrosCallTime) {
          self._microsSpinCount++;
          // After 50 tight iterations, advance time by 1ms to break spin-locks
          if (self._microsSpinCount > 50) {
            self._virtualTimeOffset += 1;
            self._microsSpinCount = 0;
          }
        } else {
          self._lastMicrosCallTime = now;
          self._microsSpinCount = 0;
        }
        return Math.floor((now + self._virtualTimeOffset - self.startTime) * 1000);
      },
      async __delay(ms: number): Promise<void> {
        if (!self.running) throw new Error('__ARDUINO_HALT__');
        const target = performance.now() + ms;
        // Always yield to the event loop to keep the UI responsive, even for short delays.
        // Spin-locking blocks requestAnimationFrame, causing visual teleportation of components.
        while (performance.now() < target && self.running) {
          await new Promise<void>(resolve => {
            const remaining = target - performance.now();
            setTimeout(resolve, Math.max(1, Math.min(remaining, 16)));
          });
        }
        if (!self.running) throw new Error('__ARDUINO_HALT__');
      },
      async __delayMicroseconds(us: number): Promise<void> {
        if (us > 10000) {
          await new Promise<void>(resolve => setTimeout(resolve, us / 1000));
        }
        // For short µs delays, just continue (browser can't do sub-ms timing)
      },

      // ── pulseIn — measures pulse duration on a pin (used by ultrasonic sensors) ──
      pulseIn(pin: number, state: number, _timeout?: number): number {
        // For HC-SR04 ultrasonic sensors: calculate duration from the sensor's distance value
        // distance_cm = 0.017 * duration_us  →  duration_us = distance_cm / 0.017
        try {
          const { nodes } = useForgeStore.getState();
          for (const n of nodes) {
            if (n.data?.type === 'hc-sr04' || n.data?.type === 'ultrasonic') {
              const distanceCm = n.data?.distance ?? n.data?.sensorValues?.distance ?? 6;
              // Standard HC-SR04: 58 microseconds per cm
              const duration_us = distanceCm * 58;
              return Math.round(duration_us);
            }
          }
        } catch (e) { /* store not available */ }
        // Default: simulate ~17cm distance (1000µs round-trip)
        return 1000;
      },

      // ── Math/Utility helpers ───────────────────────────────
      __arduino_map(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
        return Math.round((value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin);
      },
      __arduino_constrain(val: number, low: number, high: number): number {
        return Math.max(low, Math.min(high, val));
      },
      __arduino_random(...args: number[]): number {
        if (args.length === 1) return Math.floor(Math.random() * args[0]);
        if (args.length === 2) return Math.floor(Math.random() * (args[1] - args[0])) + args[0];
        return Math.floor(Math.random() * 32768);
      },
      __arduino_randomSeed(_seed: number): void { /* JS Math.random can't be seeded */ },
      __arduino_sq(x: number): number { return x * x; },
      __arduino_bitRead(val: number, bit: number): number { return (val >> bit) & 1; },
      __arduino_bitWrite(val: number, bit: number, bitVal: number): number {
        return bitVal ? (val | (1 << bit)) : (val & ~(1 << bit));
      },
      __arduino_bitSet(val: number, bit: number): number { return val | (1 << bit); },
      __arduino_bitClear(val: number, bit: number): number { return val & ~(1 << bit); },
      __arduino_bit(n: number): number { return 1 << n; },
      __arduino_lowByte(val: number): number { return val & 0xFF; },
      __arduino_highByte(val: number): number { return (val >> 8) & 0xFF; },

      // ── WiFi simulation ─────────────────────────────────────────
      WiFi: {
        _status: 0, // WL_IDLE_STATUS initially
        _ssid: '',
        _ip: '192.168.1.100',

        begin(ssid: string, _password?: string): void {
          this._ssid = ssid;
          this._status = 0; // WL_IDLE_STATUS

          // Only 'electra' SSID connects in the Electra simulation
          if (ssid.toLowerCase() === 'electra') {
            // Simulate connection sequence
            setTimeout(() => {
              this._status = 3; // WL_CONNECTED
              self.onSerial?.('__LF_WIFI:connected\n');
            }, 500);

            setTimeout(() => {
              self.onSerial?.(`__LF_WIFI:ip:${this._ip}\n`);
            }, 1000);
          } else {
            // Wrong SSID — show helpful message
            setTimeout(() => {
              this._status = 4; // WL_CONNECT_FAILED
              self.onSerial?.(`\n[WiFi] Connection failed: SSID "${ssid}" not found.\n`);
              self.onSerial?.(`[WiFi] Use SSID "electra" and password "electra" to connect to the internet in Electra simulation.\n`);
              self.onSerial?.('__LF_WIFI:connect_failed\n');
            }, 500);
          }
        },

        status(): number {
          return this._status;
        },

        localIP(): any {
          // Return an IPAddress-like object with toString()
          return {
            _a: 192, _b: 168, _c: 1, _d: 100,
            toString() { return `${this._a}.${this._b}.${this._c}.${this._d}`; }
          };
        },

        SSID(): string { return this._ssid; },
        macAddress(): string { return 'AA:BB:CC:DD:EE:FF'; },
        RSSI(): number { return -50; },

        disconnect(): void {
          this._status = 6; // WL_DISCONNECTED
          self.onSerial?.('__LF_WIFI:disconnected\n');
        },

        mode(_mode: number): void { },
        softAP(ssid: string): void {
          this._ssid = ssid;
          self.onSerial?.(`[WiFi] AP started: ${ssid}\n`);
        },
        softAPIP(): any {
          return {
            _a: 192, _b: 168, _c: 4, _d: 1,
            toString() { return `${this._a}.${this._b}.${this._c}.${this._d}`; }
          };
        },
      },

      // ── WiFiClient (for TCP connections — sends real HTTP requests) ──
      WiFiClient: class {
        private _connected: boolean = false;
        private _host: string = '';
        private _port: number = 80;
        private _requestBuffer: string = '';
        private _responseBuffer: string = '';
        private _fetching: boolean = false;
        private _fetchDone: boolean = false;

        connect(host: string, port: number): boolean {
          this._host = host;
          this._port = port;
          this._connected = true;
          this._requestBuffer = '';
          this._responseBuffer = '';
          this._fetching = false;
          this._fetchDone = false;
          self.onSerial?.(`__LF_WIFI:tcp_connect:${host}:${port}\n`);
          return true;
        }

        connected(): boolean {
          // Once fetch is done and response is fully consumed, mark disconnected
          if (this._fetchDone && this._responseBuffer.length === 0) {
            this._connected = false;
          }
          return this._connected;
        }

        stop(): void {
          // Fire any buffered but unsent request (fire-and-forget)
          if (this._requestBuffer.length > 0 && !this._fetching && !this._fetchDone) {
            this._fireRequest();
          }
          this._connected = false;
        }

        print(data: any): void {
          this._requestBuffer += String(data);
          this._tryFlush();
        }

        println(data: any = ''): void {
          this._requestBuffer += String(data) + '\r\n';
          this._tryFlush();
        }

        write(val: any): void {
          const text = typeof val === 'number' ? String.fromCharCode(val) : String(val);
          this._requestBuffer += text;
          this._tryFlush();
        }

        available(): number {
          return this._responseBuffer.length;
        }

        read(): number {
          if (this._responseBuffer.length === 0) return -1;
          const char = this._responseBuffer.charCodeAt(0);
          this._responseBuffer = this._responseBuffer.substring(1);
          return char;
        }

        readString(): string {
          const str = this._responseBuffer;
          this._responseBuffer = '';
          return str;
        }

        flush(): void { }

        /** Detect end of HTTP headers (\r\n\r\n) and trigger fetch */
        private _tryFlush(): void {
          if (this._fetching || this._fetchDone) return;
          if (!this._requestBuffer.includes('\r\n\r\n')) return;
          this._fireRequest();
        }

        /** Parse raw HTTP request text and send via fetch */
        private async _fireRequest(): Promise<void> {
          if (this._fetching) return;
          this._fetching = true;

          try {
            const lines = this._requestBuffer.split('\r\n');
            const requestLine = lines[0] || 'GET / HTTP/1.1';
            const parts = requestLine.split(' ');
            const method = parts[0] || 'GET';
            const path = parts[1] || '/';

            const protocol = this._port === 443 ? 'https' : 'http';
            const url = `${protocol}://${this._host}${path}`;

            // Parse headers
            const headers: Record<string, string> = {};
            let bodyStartIdx = -1;
            for (let i = 1; i < lines.length; i++) {
              if (lines[i] === '') { bodyStartIdx = i + 1; break; }
              const colonIdx = lines[i].indexOf(':');
              if (colonIdx > 0) {
                const key = lines[i].substring(0, colonIdx).trim();
                const val = lines[i].substring(colonIdx + 1).trim();
                if (key.toLowerCase() !== 'host') headers[key] = val;
              }
            }

            let body: string | undefined;
            if (bodyStartIdx > 0 && bodyStartIdx < lines.length) {
              body = lines.slice(bodyStartIdx).join('\r\n').trim() || undefined;
            }

            self.onSerial?.(`__LF_WIFI:http_request:${method} ${url}\n`);

            const response = await fetch(url, {
              method,
              headers,
              body: (method !== 'GET' && method !== 'HEAD') ? body : undefined,
            });

            // Build HTTP response string for sketch to read
            let responseText = `HTTP/1.1 ${response.status} ${response.statusText}\r\n`;
            response.headers.forEach((value, key) => {
              responseText += `${key}: ${value}\r\n`;
            });
            responseText += '\r\n';
            responseText += await response.text();

            this._responseBuffer = responseText;
            self.onSerial?.(`__LF_WIFI:http_response:${response.status}\n`);
          } catch (error: any) {
            console.error('[WiFiClient] Request failed:', error);
            self.onSerial?.(`__LF_WIFI:http_error:${error.message}\n`);
            this._responseBuffer = 'HTTP/1.1 0 Connection Failed\r\n\r\n';
          } finally {
            this._fetching = false;
            this._fetchDone = true;
            this._requestBuffer = '';
          }
        }
      },

      // ── HTTPClient (for real HTTP requests via fetch) ───────────────
      HTTPClient: class {
        private _url: string = '';
        private _headers: Map<string, string> = new Map();
        private _responseCode: number = 0;
        private _responseBody: string = '';
        private _timeout: number = 5000;

        begin(url: string): boolean {
          this._url = url;
          this._headers.clear();
          this._responseCode = 0;
          this._responseBody = '';
          self.onSerial?.(`__LF_WIFI:http_begin:${url}\n`);
          return true;
        }

        addHeader(name: string, value: string): void {
          this._headers.set(name, value);
        }

        setTimeout(timeout: number): void {
          this._timeout = timeout;
        }

        async GET(): Promise<number> {
          return await this._makeRequest('GET');
        }

        async POST(payload: string): Promise<number> {
          return await this._makeRequest('POST', payload);
        }

        async PUT(payload: string): Promise<number> {
          return await this._makeRequest('PUT', payload);
        }

        async DELETE(): Promise<number> {
          return await this._makeRequest('DELETE');
        }

        async PATCH(payload: string): Promise<number> {
          return await this._makeRequest('PATCH', payload);
        }

        private async _makeRequest(method: string, body?: string): Promise<number> {
          try {
            const headers: Record<string, string> = {};
            this._headers.forEach((value, key) => {
              headers[key] = value;
            });

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this._timeout);

            self.onSerial?.(`__LF_WIFI:http_request:${method} ${this._url}\n`);

            const response = await fetch(this._url, {
              method,
              headers,
              body: body,
              signal: controller.signal,
            });

            clearTimeout(timeoutId);

            this._responseCode = response.status;
            this._responseBody = await response.text();

            self.onSerial?.(`__LF_WIFI:http_response:${this._responseCode}\n`);

            return this._responseCode;
          } catch (error: any) {
            console.error('[HTTPClient] Request failed:', error);
            if (error.name === 'AbortError') {
              this._responseCode = -1; // Timeout
              self.onSerial?.(`__LF_WIFI:http_error:Request timed out\n`);
            } else {
              this._responseCode = -2; // Connection failed
              self.onSerial?.(`__LF_WIFI:http_error:${error.message}\n`);
            }
            this._responseBody = '';
            return this._responseCode;
          }
        }

        getString(): string {
          return this._responseBody;
        }

        getSize(): number {
          return this._responseBody.length;
        }

        end(): void {
          this._url = '';
          this._headers.clear();
          this._responseCode = 0;
          this._responseBody = '';
        }
      },


      // ── ThingSpeak library (makes real HTTP requests via fetch) ────────
      ThingSpeak: {
        _fields: new Map<number, string>(),
        _client: null as any,

        begin(_client: any): void {
          this._client = _client;
          this._fields.clear();
          self.onSerial?.('__LF_WIFI:thingspeak_init\\n');
        },

        setField(field: number, value: any): number {
          this._fields.set(field, String(value));
          return 200;
        },

        async writeFields(channelNumber: number | string, apiKey: string): Promise<number> {
          try {
            let url = `https://api.thingspeak.com/update?api_key=${apiKey}`;
            this._fields.forEach((value: string, field: number) => {
              url += `&field${field}=${encodeURIComponent(value)}`;
            });

            self.onSerial?.(`__LF_WIFI:thingspeak_write:channel=${channelNumber}\\n`);

            const response = await fetch(url);
            const result = await response.text();
            const entryId = parseInt(result.trim(), 10);

            self.onSerial?.(`__LF_WIFI:thingspeak_response:${entryId}\\n`);
            this._fields.clear();

            return entryId > 0 ? 200 : -1;
          } catch (error: any) {
            console.error('[ThingSpeak] writeFields failed:', error);
            self.onSerial?.(`__LF_WIFI:thingspeak_error:${error.message}\\n`);
            return -1;
          }
        },

        async writeField(channelNumber: number | string, field: number, value: any, apiKey: string): Promise<number> {
          this._fields.clear();
          this._fields.set(field, String(value));
          return await this.writeFields(channelNumber, apiKey);
        },

        async readFloatField(channelNumber: number | string, field: number, apiKey?: string): Promise<number> {
          try {
            let url = `https://api.thingspeak.com/channels/${channelNumber}/fields/${field}/last.txt`;
            if (apiKey) url += `?api_key=${apiKey}`;
            const response = await fetch(url);
            const text = await response.text();
            return parseFloat(text.trim()) || 0;
          } catch {
            return 0;
          }
        },

        async readLongField(channelNumber: number | string, field: number, apiKey?: string): Promise<number> {
          const val = await this.readFloatField(channelNumber, field, apiKey);
          return Math.trunc(val);
        },

        getLastReadStatus(): number { return 200; },
      },

      // ── Tone ───────────────────────────────────────────────
      tone(_pin: number, _frequency: number, _duration?: number): void { },
      noTone(_pin: number): void { },

      // ── SPI/Wire stubs ─────────────────────────────────────
      SPI: {
        begin(): void { },
        transfer(val: number): number { return val; },
        beginTransaction(_settings: any): void { },
        endTransaction(): void { },
        end(): void { },
      },
      Wire: {
        begin(_addr?: number): void { },
        beginTransmission(addr: number): void {
          if (self._i2cBus) self._i2cBus.startTransmission(addr);
        },
        write(val: any): number {
          if (self._i2cBus) {
            // Handle both single bytes and arrays/strings
            if (typeof val === 'number') {
              self._i2cBus.write(val & 0xFF);
            } else if (typeof val === 'string') {
              for (let i = 0; i < val.length; i++) self._i2cBus.write(val.charCodeAt(i) & 0xFF);
            } else if (val && typeof val.length === 'number') {
              for (let i = 0; i < val.length; i++) self._i2cBus.write(val[i] & 0xFF);
            }
          }
          return 1;
        },
        endTransmission(_stop?: boolean): number {
          if (self._i2cBus) self._i2cBus.endTransmission();
          return 0;
        },
        requestFrom(addr: number, qty: number): number {
          if (self._i2cBus) self._i2cBus.requestFrom(addr, qty);
          return qty;
        },
        available(): number {
          return self._i2cBus ? self._i2cBus.available() : 0;
        },
        read(): number {
          return self._i2cBus ? self._i2cBus.read() : 0;
        },
        end(): void { },
      },

      // ── Servo stub ─────────────────────────────────────────
      Servo: class {
        _pin = 0;
        _angle = 90;
        attach(pin: number): void { this._pin = pin; }
        write(angle: number): void {
          this._angle = angle;
          self.onPinChange?.(this._pin, angle, true);
        }
        read(): number { return this._angle; }
        detach(): void { }
      },

      // ── Builtin JS APIs (needed by transpiled code) ────────
      Math, String, Array, Number, parseInt, parseFloat,
      isnan: Number.isNaN,
      console: {
        log: (...args: any[]) => self.onSerial?.(args.join(' ') + '\n'),
      },

      // ── DHT / DHTesp sensor classes (read live from store) ──
      DHT: class {
        _type = 22;
        constructor(_pin?: number, _type?: number) { if (_type) this._type = _type; }
        begin(): void { }
        readTemperature(): number {
          try {
            const { nodes } = useForgeStore.getState();
            for (const n of nodes) {
              if (n.data?.type === 'dht22' || n.data?.type === 'dht11') {
                return n.data?.sensorValues?.temperature ?? 25.0;
              }
            }
          } catch (e) { /* store not available */ }
          return 25.0;
        }
        readHumidity(): number {
          try {
            const { nodes } = useForgeStore.getState();
            for (const n of nodes) {
              if (n.data?.type === 'dht22' || n.data?.type === 'dht11') {
                return n.data?.sensorValues?.humidity ?? 50.0;
              }
            }
          } catch (e) { /* store not available */ }
          return 50.0;
        }
      },
      DHTesp: class {
        static DHT22 = 22;
        static DHT11 = 11;
        setup(_pin?: number, _type?: number): void { }
        getTempAndHumidity(): { temperature: number; humidity: number } {
          try {
            const { nodes } = useForgeStore.getState();
            for (const n of nodes) {
              if (n.data?.type === 'dht22' || n.data?.type === 'dht11') {
                return {
                  temperature: n.data?.sensorValues?.temperature ?? 25.0,
                  humidity: n.data?.sensorValues?.humidity ?? 50.0,
                };
              }
            }
          } catch (e) { /* store not available */ }
          return { temperature: 25.0, humidity: 50.0 };
        }
        getStatus(): number { return 0; }
        getStatusString(): string { return 'OK'; }
      },

      // ── MPU6050 sensor class (read live from store) ─────────
      Adafruit_MPU6050: class {
        begin(): boolean { return true; }
        setAccelerometerRange(_r: number): void { }
        setGyroRange(_r: number): void { }
        setFilterBandwidth(_b: number): void { }
        getEvent(accelEvt: any, gyroEvt: any, tempEvt: any): boolean {
          let ax = 0, ay = 0, az = 9.8, gx = 0, gy = 0, gz = 0, t = 25;
          try {
            const { nodes } = useForgeStore.getState();
            for (const n of nodes) {
              if (n.data?.type === 'mpu6050') {
                const sv = n.data?.sensorValues ?? {};
                ax = sv.accelX ?? 0;
                ay = sv.accelY ?? 0;
                az = sv.accelZ ?? 9.8;
                gx = sv.gyroX ?? 0;
                gy = sv.gyroY ?? 0;
                gz = sv.gyroZ ?? 0;
                t = sv.temp ?? 25;
                break;
              }
            }
          } catch (e) { /* store not available */ }
          if (accelEvt) accelEvt.acceleration = { x: ax, y: ay, z: az };
          if (gyroEvt) gyroEvt.gyro = { x: gx, y: gy, z: gz };
          if (tempEvt) tempEvt.temperature = t;
          return true;
        }
      },
      sensors_event_t: class {
        acceleration = { x: 0, y: 0, z: 0 };
        gyro = { x: 0, y: 0, z: 0 };
        temperature = 0;
      },

      // ── MPU6050 constants ───────────────────────────────────
      MPU6050_RANGE_2_G: 0, MPU6050_RANGE_4_G: 1, MPU6050_RANGE_8_G: 2, MPU6050_RANGE_16_G: 3,
      MPU6050_RANGE_250_DEG: 0, MPU6050_RANGE_500_DEG: 1, MPU6050_RANGE_1000_DEG: 2, MPU6050_RANGE_2000_DEG: 3,
      MPU6050_BAND_260_HZ: 0, MPU6050_BAND_184_HZ: 1, MPU6050_BAND_94_HZ: 2, MPU6050_BAND_44_HZ: 3,
      MPU6050_BAND_21_HZ: 4, MPU6050_BAND_10_HZ: 5, MPU6050_BAND_5_HZ: 6,

      // ── HX711 load cell amplifier (read live from store) ────
      HX711: class {
        _dout = 0;
        _sck = 0;
        _scale = 1;
        _offset = 0;
        constructor() { }
        begin(dout: number, sck: number): void {
          this._dout = dout;
          this._sck = sck;
        }
        set_scale(scale: number): void {
          this._scale = scale || 1;
        }
        tare(_times?: number): void {
          this._offset = this._readRaw();
        }
        get_units(_times?: number): number {
          return (this._readRaw() - this._offset) / this._scale;
        }
        read(): number {
          return this._readRaw();
        }
        is_ready(): boolean {
          return true;
        }
        power_down(): void { }
        power_up(): void { }
        private _readRaw(): number {
          try {
            const { nodes } = useForgeStore.getState();
            for (const n of nodes) {
              if (n.data?.type === 'hx711') {
                const w = n.data?.sensorValues?.weight ?? 0;
                // Return raw ADC proportional to weight * scale,
                // so get_units() / scale = weight in grams (matches slider)
                return Math.round(w * this._scale);
              }
            }
          } catch (e) { /* store not available */ }
          return 0;
        }
      },

      // ── RTC_DS1307 real-time clock (I2C @ 0x68 — bridged via CircuitEngine) ──
      RTC_DS1307: class {
        private _addr = 0x68;
        begin(): boolean {
          if (self._i2cBus) {
            self._i2cBus.startTransmission(this._addr);
            self._i2cBus.endTransmission();
          }
          return true;
        }
        adjust(dt: any): void {
          // Write time registers (0x00-0x06) in BCD
          const regs = [
            this._toBCD(dt.second() ?? 0),
            this._toBCD(dt.minute() ?? 0),
            this._toBCD(dt.hour() ?? 12),
            this._toBCD(dt.dayOfWeek() ?? 1),
            this._toBCD(dt.day() ?? 1),
            this._toBCD(dt.month() ?? 1),
            this._toBCD(dt.year() % 100),
          ];
          if (self._i2cBus) {
            self._i2cBus.startTransmission(this._addr);
            self._i2cBus.write(0x00); // register pointer
            for (const r of regs) self._i2cBus.write(r);
            self._i2cBus.endTransmission();
          }
        }
        now(): any {
          const dt = self._i2cBus
            ? this._readFromI2C()
            : new Date();
          // Return a duck-typed DateTime-compatible object
          return {
            year: () => dt.getFullYear(),
            month: () => dt.getMonth() + 1,
            day: () => dt.getDate(),
            hour: () => dt.getHours(),
            minute: () => dt.getMinutes(),
            second: () => dt.getSeconds(),
            dayOfWeek: () => dt.getDay() || 7,
            unixtime: () => Math.floor(dt.getTime() / 1000),
            toString: () => {
              const pad = (n: number) => String(n).padStart(2, '0');
              return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`;
            }
          };
        }
        private _readFromI2C(): Date {
          if (!self._i2cBus) return new Date();
          self._i2cBus.startTransmission(this._addr);
          self._i2cBus.write(0x00);
          self._i2cBus.endTransmission();
          self._i2cBus.requestFrom(this._addr, 7);
          const sec = this._fromBCD(self._i2cBus.read());
          const min = this._fromBCD(self._i2cBus.read());
          const hour = this._fromBCD(self._i2cBus.read() & 0x3F);
          const _dow = self._i2cBus.read();
          const day = this._fromBCD(self._i2cBus.read());
          const mon = this._fromBCD(self._i2cBus.read());
          const year = this._fromBCD(self._i2cBus.read()) + 2000;
          return new Date(year, mon - 1, day, hour, min, sec);
        }
        isrunning(): boolean { return true; }
        private _toBCD(v: number): number {
          return ((Math.floor(v / 10) & 0x0F) << 4) | (v % 10);
        }
        private _fromBCD(v: number): number {
          return ((v >> 4) * 10) + (v & 0x0F);
        }
      },
      DateTime: class DateTime {
        private _date: Date;
        constructor(y?: number, m?: number, d?: number, hh?: number, mm?: number, ss?: number) {
          if (y !== undefined) {
            this._date = new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0, ss ?? 0);
          } else {
            this._date = new Date();
          }
        }
        year(): number { return this._date.getFullYear(); }
        month(): number { return this._date.getMonth() + 1; }
        day(): number { return this._date.getDate(); }
        hour(): number { return this._date.getHours(); }
        minute(): number { return this._date.getMinutes(); }
        second(): number { return this._date.getSeconds(); }
        dayOfWeek(): number { return this._date.getDay() || 7; } // 1=Mon ... 7=Sun
        unixtime(): number { return Math.floor(this._date.getTime() / 1000); }
        toString(): string {
          const pad = (n: number) => String(n).padStart(2, '0');
          return `${this.year()}-${pad(this.month())}-${pad(this.day())} ${pad(this.hour())}:${pad(this.minute())}:${pad(this.second())}`;
        }
      },

      // ── Keypad library (matrix membrane keypad) ──
      // Reads from the CircuitEngine keypad emulator via node data pressedKey state.
      Keypad: class {
        private _rowPins: number[];
        private _colPins: number[];
        private _keys: string[][];
        private _rows: number;
        private _cols: number;
        // Edge-trigger tracking: only fire once per press, not every loop() frame
        private _lastReportedKey: string | null = null;
        private _lastRawKey: string | null = null;

        constructor(userKeymap: any, rowPins: number[], colPins: number[], rows: number, cols: number) {
          this._rowPins = rowPins || [];
          this._colPins = colPins || [];
          this._rows = rows || 4;
          this._cols = cols || 4;
          this._keys = [];
          // userKeymap can be a flat string, 2D array, or the keys array itself
          if (Array.isArray(userKeymap)) {
            // Already a 2D array
            this._keys = userKeymap;
          } else if (typeof userKeymap === 'string') {
            for (let r = 0; r < this._rows; r++) {
              const row: string[] = [];
              for (let c = 0; c < this._cols; c++) {
                row.push(userKeymap[r * this._cols + c] ?? '?');
              }
              this._keys.push(row);
            }
          } else {
            this._keys = [['1', '2', '3', 'A'], ['4', '5', '6', 'B'], ['7', '8', '9', 'C'], ['*', '0', '#', 'D']];
          }
        }

        private _getRawKey(): string | null {
          try {
            const { nodes } = useForgeStore.getState();
            for (const n of nodes) {
              if (n.data?.type === 'membrane-keypad') {
                return n.data?.pressedKey ?? null;
              }
            }
          } catch (e) { /* store not available */ }
          return null;
        }

        getKey(): string | null {
          const raw = this._getRawKey();
          // Detect key-down edge: raw changed from null/different → new key
          if (raw !== null && raw !== this._lastRawKey) {
            this._lastRawKey = raw;
            this._lastReportedKey = raw;
            return raw;
          }
          // Key released: reset so next press is detected
          if (raw === null) {
            this._lastRawKey = null;
            this._lastReportedKey = null;
          }
          // Same key still held or no key: return null (no repeat)
          return null;
        }

        isPressed(key: string): boolean {
          return this._getRawKey() === key;
        }

        getState(): number {
          const key = this._getRawKey();
          if (!key) return 0;
          for (let r = 0; r < this._rows; r++) {
            for (let c = 0; c < this._cols; c++) {
              if (this._keys[r]?.[c] === key) return 1 << c;
            }
          }
          return 0;
        }

        waitForKey(): string { return this.getKey() ?? ''; }
        keyStateChanged(): boolean {
          const raw = this._getRawKey();
          return raw !== this._lastRawKey;
        }
        setHoldTime(_ms: number): void { }
        setDebounceTime(_ms: number): void { }
        addEventListener(_listener: any): void { }
      },
    };
  }
}
