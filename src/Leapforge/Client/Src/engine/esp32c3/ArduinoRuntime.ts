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

  /** Inject digital input (from CircuitEngine) */
  setDigitalInput(pin: number, high: boolean): void {
    this.pinValues.set(pin, high ? HIGH : LOW);
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
        return self.analogInputs.get(pin) ?? 0;
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

      // ── Interrupts ─────────────────────────────────────────
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
        available(): number { return 0; },
        read(): number { return -1; },
        readString(): string { return ''; },
        parseInt(): number { return 0; },
        parseFloat(): number { return 0.0; },
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
        return Math.floor(performance.now() - self.startTime);
      },
      micros(): number {
        return Math.floor((performance.now() - self.startTime) * 1000);
      },
      async __delay(ms: number): Promise<void> {
        if (!self.running) throw new Error('__ARDUINO_HALT__');
        const target = performance.now() + ms;
        // For short delays (<20ms), spin; for longer, yield to the event loop
        if (ms <= 16) {
          while (performance.now() < target && self.running) { /* spin */ }
        } else {
          // Yield in chunks to keep UI responsive
          while (performance.now() < target && self.running) {
            await new Promise<void>(resolve => {
              const remaining = target - performance.now();
              setTimeout(resolve, Math.min(remaining, 16));
            });
          }
        }
        if (!self.running) throw new Error('__ARDUINO_HALT__');
      },
      async __delayMicroseconds(us: number): Promise<void> {
        if (us > 10000) {
          await new Promise<void>(resolve => setTimeout(resolve, us / 1000));
        }
        // For short µs delays, just continue (browser can't do sub-ms timing)
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

      // ── WiFi stubs ─────────────────────────────────────────
      WiFi: {
        begin(ssid: string, _password?: string): void {
          self.onSerial?.(`[WiFi] Connecting to ${ssid}...\n`);
          self.onSerial?.(`[WiFi] Connected! IP: 192.168.1.100\n`);
        },
        status(): number { return 3; }, // WL_CONNECTED
        localIP(): string { return '192.168.1.100'; },
        macAddress(): string { return 'AA:BB:CC:DD:EE:FF'; },
        RSSI(): number { return -50; },
        disconnect(): void { self.onSerial?.('[WiFi] Disconnected\n'); },
        mode(_mode: number): void { },
        softAP(ssid: string): void { self.onSerial?.(`[WiFi] AP started: ${ssid}\n`); },
        softAPIP(): string { return '192.168.4.1'; },
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
      console: {
        log: (...args: any[]) => self.onSerial?.(args.join(' ') + '\n'),
      },
    };
  }
}
