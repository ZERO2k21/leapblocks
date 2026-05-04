/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 *
 * Compile flow (Electron):
 *   electronAPI.compileCode(code, fqbn)
 *     → IPC: compile-code
 *     → ArduinoUploader.compileForSimulation()
 *     → arduino-cli compile --libraries forge-lib/libraries/ ...
 *     → returns { success, hexContent }
 */
import { IS_ELECTRON, isElectron, CLOUD_COMPILER_URL } from '../../../../leapembed/server/config/platform';

export interface CompileRequest {
  code: string;
  board: string;
  libraries: string[];
}

export interface CompileResult {
  success: boolean;
  hexContent?: string;
  binPath?: string;   // returned for esp32:esp32:* FQBNs (upload path)
  error?: string;
}

export const compileCode = async (req: CompileRequest): Promise<CompileResult> => {
  // Use runtime check — IS_ELECTRON may be stale if preload loaded after module init
  if (IS_ELECTRON || isElectron()) {
    try {
      const result = await (window as any).electronAPI.compileCode(
        req.code,
        req.board,
        req.libraries?.join(',') || undefined,
      );
      return {
        success: result.success,
        hexContent: result.hexContent,
        binPath: result.binPath,
        error: result.error,
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  // Web: POST to local build server
  try {
    const res = await fetch(`${CLOUD_COMPILER_URL}/compile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!res.ok) return { success: false, error: `Server error: ${res.status}` };
    const data = await res.json();
    return {
      success: data.success,
      hexContent: data.hex,
      error: Array.isArray(data.errors) ? data.errors.join('\n') : data.errors,
    };
  } catch (err: any) {
    return { success: false, error: `Cloud compiler unreachable: ${err.message}` };
  }
};

// ─── ESP32 Transpile: Arduino C++ → JavaScript ──────────────────

export interface TranspileResult {
  success: boolean;
  jsCode?: string;
  error?: string;
}

/**
 * Transpile an Arduino sketch to JavaScript for browser-side simulation.
 * In Electron mode: uses the cloud server's /transpile endpoint.
 * In Web mode: also uses the cloud server's /transpile endpoint.
 * Falls back to client-side transpilation if server is unreachable.
 */
export const transpileCode = async (code: string, board: string = 'esp32:esp32:esp32c3'): Promise<TranspileResult> => {
  try {
    const res = await fetch(`${CLOUD_COMPILER_URL}/transpile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, board }),
    });
    if (!res.ok) {
      // Server error — fall back to client-side transpilation
      console.warn('[Transpiler] Server returned error, falling back to client-side');
      return clientSideTranspile(code);
    }
    const data = await res.json();
    if (data.success && data.jsCode) {
      return { success: true, jsCode: data.jsCode };
    }
    return {
      success: false,
      error: Array.isArray(data.errors) ? data.errors.join('\n') : (data.errors || 'Transpilation failed'),
    };
  } catch (err: any) {
    // Network error — fall back to client-side transpilation
    console.warn('[Transpiler] Server unreachable, falling back to client-side:', err.message);
    return clientSideTranspile(code);
  }
};

/**
 * Client-side Arduino-to-JS transpiler (fallback when server is unreachable).
 * This is a simplified inline version — the full transpiler runs on the server.
 */
function clientSideTranspile(code: string): TranspileResult {
  try {
    let js = code;
    // Remove comments
    js = js.replace(/\/\/.*$/gm, '');
    js = js.replace(/\/\*[\s\S]*?\*\//g, '');
    // Remove #include
    js = js.replace(/^\s*#include\s*[<"].*?[>"]\s*$/gm, '');
    // Strip C++ const / volatile qualifiers (before type processing)
    // Only strip when followed by a known C++ type so #define-generated `const X = Y;` is preserved
    js = js.replace(/\b(const|volatile)\s+(?=(void|int|long|short|unsigned|uint8_t|uint16_t|uint32_t|int8_t|int16_t|int32_t|size_t|byte|char|float|double|boolean|bool)\b)/g, '');
    // Strip standalone volatile (not followed by type)
    js = js.replace(/\bvolatile\s+/g, '');
    // Strip ESP32/AVR function attributes that appear between return type and function name
    // e.g. void IRAM_ATTR myFunc() → void myFunc()
    // e.g. void ICACHE_RAM_ATTR myFunc() → void myFunc()
    js = js.replace(/\b(IRAM_ATTR|ICACHE_RAM_ATTR|DRAM_ATTR|PROGMEM_ATTR|__attribute__\s*\(\([^)]*\)\))\s+/g, '');
    // Replace Arduino macros that are identity functions on ESP32
    // digitalPinToInterrupt(pin) → pin  (on ESP32, pin == interrupt number)
    js = js.replace(/\bdigitalPinToInterrupt\s*\(/g, '(');
    // C++ scope resolution operator :: → JS dot notation (e.g. DHTesp::DHT22 → DHTesp.DHT22)
    js = js.replace(/::/g, '.');
    // Strip C++ address-of operator & in function arguments: fn(&a, &b) → fn(a, b)
    js = js.replace(/([,(]\s*)&(\w)/g, '$1$2');
    // Handle lowercase custom struct types: sensors_event_t a, g, temp; → let a = {}; let g = {}; let temp = {};
    js = js.replace(/^\s*(sensors_event_t|event_t)\s+(\w+(?:\s*,\s*\w+)*)\s*;/gm,
      (_m: string, _type: string, vars: string) => {
        return vars.split(',').map((v: string) => `let ${v.trim()} = {};`).join('\n');
      });
    // Strip C++ array dimensions from variable declarations BEFORE type stripping
    // Handles both numeric: char keys[4][4] and named: char keys[ROWS][COLS]
    // e.g. char keys[ROWS][COLS] = ... → char keys = ...
    // e.g. byte rowPins[ROWS] = ...    → byte rowPins = ...
    js = js.replace(/(\b(?:int|long|short|unsigned\s+\w+|uint8_t|uint16_t|uint32_t|int8_t|int16_t|int32_t|size_t|byte|char|float|double|boolean|bool)\s+\w+)(\s*\[[\w\d]+\])+(\s*=)/g, '$1$3');
    js = js.replace(/(\b(?:int|long|short|unsigned\s+\w+|uint8_t|uint16_t|uint32_t|int8_t|int16_t|int32_t|size_t|byte|char|float|double|boolean|bool)\s+\w+)(\s*\[[\w\d]+\])+(\s*;)/g, '$1$3');
    // Convert C++ nested brace array initializers to JS nested arrays
    // e.g. = {{'1','2'},{'3','4'}} → = [['1','2'],['3','4']]
    // First convert inner braces that contain char literals or identifiers
    js = js.replace(/\{(\s*'[^']*'(?:\s*,\s*'[^']*')*\s*)\}/g, '[$1]');
    // Then convert outer braces that now contain arrays or identifiers
    js = js.replace(/=\s*\{(\s*(?:\[.*?\]|\w+)(?:\s*,\s*(?:\[.*?\]|\w+))*\s*)\}/g, '= [$1]');
    // Convert remaining single-level brace initializers: = {1, 2, 3} → = [1, 2, 3]
    js = js.replace(/=\s*\{([^{}]*)\}/g, '= [$1]');
    // e.g. Adafruit_SSD1306 oled(128, 64, &Wire, -1); → var oled = new Adafruit_SSD1306(128, 64);
    // Must happen BEFORE function-type stripping so it doesn't match function signatures
    js = js.replace(
      /^\s*([A-Z][A-Za-z0-9_]*)\s+(\w+)\s*\(([^;]*)\)\s*;/gm,
      (_m: string, className: string, varName: string, args: string) => {
        const cleanArgs = args
          .split(',')
          .map((a: string) => a.trim().replace(/^&/, '').replace(/^\(.*?\)/, '').trim())
          .filter((a: string) => a.length > 0)
          .join(', ');
        return `var ${varName} = new ${className}(${cleanArgs});`;
      }
    );
    // C++ copy-initialization: ClassName varName = ClassName(args);  OR  ClassName varName = ClassName(args);
    // e.g. Adafruit_ILI9341 tft = Adafruit_ILI9341(TFT_CS, TFT_DC);
    // e.g. Keypad keypad = Keypad(makeKeymap(keys), rowPins, colPins, ROWS, COLS);
    js = js.replace(
      /^\s*([A-Z][A-Za-z0-9_]*)\s+(\w+)\s*=\s*(?:new\s+)?([A-Z][A-Za-z0-9_]*)\s*\(([^;]*)\)\s*;/gm,
      (_m: string, _className: string, varName: string, ctorName: string, args: string) => {
        const cleanArgs = args
          .split(',')
          .map((a: string) => a.trim().replace(/^&/, '').replace(/^\(.*?\)/, '').trim())
          .filter((a: string) => a.length > 0)
          .join(', ');
        return `var ${varName} = new ${ctorName}(${cleanArgs});`;
      }
    );
    // C++ copy-initialization with lowercase function: ClassName varName = functionName(args);
    // e.g. Keypad keypad = makeKeymap(keys, rowPins, colPins, ROWS, COLS);
    js = js.replace(
      /^\s*([A-Z][A-Za-z0-9_]*)\s+(\w+)\s*=\s*([a-z][A-Za-z0-9_]*)\s*\(([^;]*)\)\s*;/gm,
      (_m: string, _className: string, varName: string, fnName: string, args: string) => {
        const cleanArgs = args
          .split(',')
          .map((a: string) => a.trim().replace(/^&/, '').trim())
          .filter((a: string) => a.length > 0)
          .join(', ');
        return `var ${varName} = ${fnName}(${cleanArgs});`;
      }
    );
    // C++ default-construction: ClassName varName;
    js = js.replace(
      /^\s*([A-Z][A-Za-z0-9_]*)\s+(\w+)\s*;/gm,
      (_m: string, className: string, varName: string) => `var ${varName} = new ${className}();`
    );
    // Fallback: Class-type variable with arbitrary RHS assignment
    // e.g. TempAndHumidity data = dhtSensor.getTempAndHumidity();
    js = js.replace(/^\s*([A-Z][A-Za-z0-9_]*)\s+(\w+)\s*=/gm, 'let $2 =');
    // #define → const
    js = js.replace(/^\s*#define\s+(\w+)\s+(.+)$/gm, (_m, n, v) => `const ${n} = ${v.trim()};`);
    // Type conversions
    js = js.replace(/\b(void|int|long|short|unsigned\s+\w+|uint8_t|uint16_t|uint32_t|int8_t|int16_t|int32_t|size_t|byte|char|float|double|boolean|bool)\s+(\w+)\s*\(([^)]*)\)\s*\{/g,
      (_m, _t, name, params) => {
        // Filter out 'void' params (C++ uses 'void' to mean no params) and extract param names
        const jsParams = params.split(',')
          .map((p: string) => p.trim().split(/\s+/).pop())
          .filter((p: any) => p && p !== 'void')
          .join(', ');
        // All functions get async so that await __delay / await __delayMicroseconds / await pulseIn work everywhere
        const prefix = 'async ';
        const jsName = name === 'setup' ? '__setup' : name === 'loop' ? '__loop' : name;
        return `${prefix}function ${jsName}(${jsParams}) {`;
      });
    // Split comma-separated variable declarations into individual ones BEFORE type stripping.
    // e.g.  "long duration_us, distance_cm;"  →  "long duration_us;\nlong distance_cm;"
    js = js.replace(/^(\s*)((?:unsigned\s+long|unsigned\s+int|int|long|short|uint8_t|uint16_t|uint32_t|int8_t|int16_t|int32_t|size_t|byte|char|float|double|boolean|bool))\s+(\w+(?:\s*,\s*\w+)+)\s*;/gm,
      (_m: string, indent: string, type: string, vars: string) => {
        return vars.split(',').map((v: string) => `${indent}${type} ${v.trim()};`).join('\n');
      });
    // Variable types
    js = js.replace(/\b(int|long|short|unsigned\s+\w+|uint8_t|uint16_t|uint32_t|int8_t|int16_t|int32_t|size_t|byte|char|float|double|boolean|bool)\s+([a-zA-Z0-9_]+)\s*=/g,
      (_m, _t, n) => `let ${n} =`);
    js = js.replace(/\b(int|long|short|unsigned\s+\w+|uint8_t|uint16_t|uint32_t|int8_t|int16_t|int32_t|size_t|byte|char|float|double|boolean|bool)\s+([a-zA-Z0-9_]+)\s*;/g,
      (_m, _t, n) => `let ${n} = 0;`);
    // for loop types
    js = js.replace(/for\s*\(\s*(int|byte|uint8_t|uint16_t|uint32_t|size_t|long|short)\s+/g, 'for (let ');
    // delay → await __delay
    js = js.replace(/\bdelay\s*\(/g, 'await __delay(');
    js = js.replace(/\bdelayMicroseconds\s*\(/g, 'await __delayMicroseconds(');
    // Arduino utilities
    js = js.replace(/\bmap\s*\(/g, '__arduino_map(');
    js = js.replace(/\bconstrain\s*\(/g, '__arduino_constrain(');
    js = js.replace(/\brandom\s*\(/g, '__arduino_random(');
    js = js.replace(/\babs\s*\(/g, 'Math.abs(');
    js = js.replace(/\bmin\s*\(/g, 'Math.min(');
    js = js.replace(/\bmax\s*\(/g, 'Math.max(');
    js = js.replace(/\bisnan\s*\(/g, 'Number.isNaN(');
    // F() macro — in Arduino it stores strings in flash; in JS just return the string
    js = js.replace(/\bF\s*\(\s*"([^"]*)"\s*\)/g, '"$1"');
    // Remove C++ type casts: (uint16_t)val → val
    js = js.replace(/\(\s*(uint8_t|uint16_t|uint32_t|int8_t|int16_t|int32_t|unsigned\s+\w+|int|long|short|float|double|byte|char|size_t)\s*\)/g, '');
    // `unsigned long` variable declarations (not caught by the main type regex)
    js = js.replace(/\bunsigned\s+long\s+([a-zA-Z0-9_]+)\s*=/g, 'let $1 =');
    js = js.replace(/\bunsigned\s+long\s+([a-zA-Z0-9_]+)\s*;/g, 'let $1 = 0;');
    // for loop with unsigned
    js = js.replace(/for\s*\(\s*unsigned\s+\w+\s+/g, 'for (let ');
    // `yield` in delay contexts (rare but needed for async correctness)
    // Remove remaining stray `static` keyword
    js = js.replace(/\bstatic\s+/g, '');
    // Convert C++ halt patterns to a catchable exception so the browser doesn't freeze
    // for(;;);  or  for(;;) {}  or  while(1);  or  while(true) {}
    js = js.replace(/\bfor\s*\(\s*;\s*;\s*\)\s*;/g, 'throw new Error("__ARDUINO_HALT__");');
    js = js.replace(/\bfor\s*\(\s*;\s*;\s*\)\s*\{\s*\}/g, 'throw new Error("__ARDUINO_HALT__");');
    js = js.replace(/\bwhile\s*\(\s*(1|true)\s*\)\s*;/g, 'throw new Error("__ARDUINO_HALT__");');
    js = js.replace(/\bwhile\s*\(\s*(1|true)\s*\)\s*\{\s*\}/g, 'throw new Error("__ARDUINO_HALT__");');

    const wrapped = `
// Auto-generated by LeapForge Client Transpiler
// ── Library stubs ────────────────────────────────────────────────────────────
// var declarations are hoisted but do NOT shadow injected parameters —
// a parameter binding takes precedence over a var in the same function scope.
// So if ArduinoRuntime injected Adafruit_SSD1306 as a parameter, the var
// declaration below is a no-op and the real class is used.
var Adafruit_SSD1306 = (typeof Adafruit_SSD1306 !== 'undefined' && Adafruit_SSD1306) || class { constructor(){} begin(){return true;} clearDisplay(){} display(){} setTextSize(){} setTextColor(){} setCursor(){} print(){} println(){} drawPixel(){} fillRect(){} drawRect(){} drawCircle(){} fillCircle(){} setRotation(){} invertDisplay(){} startscrollright(){} stopscroll(){} };
var Adafruit_GFX = (typeof Adafruit_GFX !== 'undefined' && Adafruit_GFX) || class { constructor(){} };
var LiquidCrystal_I2C = (typeof LiquidCrystal_I2C !== 'undefined' && LiquidCrystal_I2C) || class { constructor(){} begin(){} print(){} println(){} setCursor(){} clear(){} backlight(){} noBacklight(){} };
var LiquidCrystal = (typeof LiquidCrystal !== 'undefined' && LiquidCrystal) || class { constructor(){} begin(){} print(){} println(){} setCursor(){} clear(){} };
var Servo = (typeof Servo !== 'undefined' && Servo) || class { constructor(){this._angle=90;} attach(){} write(a){this._angle=a;} read(){return this._angle;} detach(){} };
var DHT = (typeof DHT !== 'undefined' && DHT) || class { constructor(){} begin(){} readTemperature(){return 25.0;} readHumidity(){return 50.0;} };
var DHTesp = (typeof DHTesp !== 'undefined' && DHTesp) || class { constructor(){} setup(){} getTempAndHumidity(){ return { temperature: 25.0, humidity: 50.0 }; } getStatus(){ return 0; } getStatusString(){ return 'OK'; } };
var TempAndHumidity = (typeof TempAndHumidity !== 'undefined' && TempAndHumidity) || class { constructor(){ this.temperature = 0; this.humidity = 0; } };
var Adafruit_MPU6050 = (typeof Adafruit_MPU6050 !== 'undefined' && Adafruit_MPU6050) || class { constructor(){} begin(){return true;} setAccelerometerRange(){} setGyroRange(){} setFilterBandwidth(){} getEvent(a,g,t){ if(a) a.acceleration={x:0,y:0,z:9.8}; if(g) g.gyro={x:0,y:0,z:0}; if(t) t.temperature=25.0; return true; } };
var Adafruit_Sensor = (typeof Adafruit_Sensor !== 'undefined' && Adafruit_Sensor) || class { constructor(){} };
var IRrecv = (typeof IRrecv !== 'undefined' && IRrecv) || class { constructor(){} enableIRIn(){} decode(){return false;} resume(){} };
var decode_results = (typeof decode_results !== 'undefined' && decode_results) || class { constructor(){} };
var SoftwareSerial = (typeof SoftwareSerial !== 'undefined' && SoftwareSerial) || class { constructor(){} begin(){} print(){} println(){} available(){return 0;} read(){return -1;} };
var Stepper = (typeof Stepper !== 'undefined' && Stepper) || class {
  constructor(stepsPerRev, pin1, pin2, pin3, pin4) {
    this._stepsPerRev = stepsPerRev || 200;
    this._pin1 = pin1; this._pin2 = pin2;
    this._pin3 = pin3 !== undefined ? pin3 : -1;
    this._pin4 = pin4 !== undefined ? pin4 : -1;
    this._stepMode = (pin3 !== undefined && pin4 !== undefined) ? '4wire' : '2wire';
    this._stepNum = 0; this._stepDelay = 10;
  }
  setSpeed(rpm) { if (rpm > 0) this._stepDelay = Math.max(1, Math.round(60000 / (this._stepsPerRev * rpm))); }
  async step(steps) {
    const dir = steps >= 0 ? 1 : -1;
    const count = Math.abs(steps);
    const HIGH = 1, LOW = 0;
    for (let i = 0; i < count; i++) {
      this._stepNum = ((this._stepNum + dir) % 4 + 4) % 4;
      if (this._stepMode === '2wire') {
        digitalWrite(this._pin2, dir > 0 ? HIGH : LOW);
        digitalWrite(this._pin1, HIGH); digitalWrite(this._pin1, LOW);
      } else {
        const seq = [[HIGH,LOW,LOW,HIGH],[HIGH,HIGH,LOW,LOW],[LOW,HIGH,HIGH,LOW],[LOW,LOW,HIGH,HIGH]];
        const s = seq[this._stepNum];
        const pins = [this._pin1, this._pin2, this._pin3, this._pin4];
        for (let p = 0; p < 4; p++) { if (pins[p] >= 0) digitalWrite(pins[p], s[p]); }
      }
      await new Promise(r => setTimeout(r, this._stepDelay));
    }
  }
};
var AccelStepper = (typeof AccelStepper !== 'undefined' && AccelStepper) || class {
  static get DRIVER() { return 1; }
  static get FULL2WIRE() { return 2; }
  static get FULL4WIRE() { return 4; }
  static get HALF4WIRE() { return 8; }
  constructor(iface, stepPin, dirPin, pin3, pin4) {
    this._iface = iface || 1; this._stepPin = stepPin; this._dirPin = dirPin;
    this._pin3 = pin3 !== undefined ? pin3 : -1; this._pin4 = pin4 !== undefined ? pin4 : -1;
    this._currentPos = 0; this._targetPos = 0; this._speed = 0;
    this._maxSpeed = 1; this._dirInvert = false; this._enablePin = -1;
  }
  setMaxSpeed(s) { this._maxSpeed = Math.abs(s); }
  setAcceleration(_a) {}
  setSpeed(s) { this._speed = s; }
  setPinsInverted(d) { this._dirInvert = d; }
  setEnablePin(p) { this._enablePin = p; }
  enableOutputs() { if (this._enablePin >= 0) digitalWrite(this._enablePin, 0); }
  disableOutputs() { if (this._enablePin >= 0) digitalWrite(this._enablePin, 1); }
  moveTo(pos) { this._targetPos = pos; }
  move(rel) { this._targetPos = this._currentPos + rel; }
  currentPosition() { return this._currentPos; }
  targetPosition() { return this._targetPos; }
  distanceToGo() { return this._targetPos - this._currentPos; }
  setCurrentPosition(pos) { this._currentPos = pos; this._targetPos = pos; }
  stop() { this._targetPos = this._currentPos; }
  speed() { return this._speed; }
  maxSpeed() { return this._maxSpeed; }
  isRunning() { return this._currentPos !== this._targetPos; }
  _doStep(dir) {
    const isForward = dir > 0;
    const dirVal = (isForward !== this._dirInvert) ? 1 : 0;
    digitalWrite(this._dirPin, dirVal);
    digitalWrite(this._stepPin, 1); digitalWrite(this._stepPin, 0);
    this._currentPos += dir;
  }
  run() {
    if (this._currentPos === this._targetPos) return false;
    this._doStep(this._targetPos > this._currentPos ? 1 : -1);
    return this._currentPos !== this._targetPos;
  }
  runSpeed() {
    if (this._speed === 0) return false;
    this._doStep(this._speed > 0 ? 1 : -1);
    return true;
  }
  async runToPosition() { 
    while (this._currentPos !== this._targetPos) {
      this._doStep(this._targetPos > this._currentPos ? 1 : -1);
      const speed = this._speed !== 0 ? Math.abs(this._speed) : this._maxSpeed;
      const delayMs = speed > 0 ? Math.max(1, Math.round(1000 / speed)) : 10;
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  runSpeedToPosition() { return this.run(); }
  async runToNewPosition(pos) { this.moveTo(pos); await this.runToPosition(); }
};
var MFRC522 = (typeof MFRC522 !== 'undefined' && MFRC522) || class { constructor(){} PCD_Init(){} PICC_IsNewCardPresent(){return false;} PICC_ReadCardSerial(){return false;} };
var Keypad = (typeof Keypad !== 'undefined' && Keypad) || class {
  constructor(_keymap, _rowPins, _colPins, _rows, _cols) {
    this._keymap = _keymap || [];
    this._rowPins = _rowPins || [];
    this._colPins = _colPins || [];
    this._rows = _rows || 4;
    this._cols = _cols || 4;
    this._pressedKey = null;
  }
  getKey() {
    const k = this._pressedKey;
    this._pressedKey = null;
    return k;
  }
  isPressed(key) { return this._pressedKey === key; }
  getState() { return 0; }
  addEventListener() {}
  _simulatePress(key) { this._pressedKey = key; }
};
var makeKeymap = (typeof makeKeymap !== 'undefined' && makeKeymap) || function(keymap, rowPins, colPins, rows, cols) {
  return new Keypad(keymap, rowPins, colPins, rows, cols);
};
var U8g2_SSD1306_128X64_NONAME_F_HW_I2C = (typeof U8g2_SSD1306_128X64_NONAME_F_HW_I2C !== 'undefined' && U8g2_SSD1306_128X64_NONAME_F_HW_I2C) || class { constructor(){} begin(){} clearBuffer(){} sendBuffer(){} setFont(){} drawStr(){} setCursor(){} print(){} println(){} };
var HX711 = (typeof HX711 !== 'undefined' && HX711) || class { constructor(){} begin(){} set_scale(){} tare(){} get_units(){return 0;} read(){return 0;} is_ready(){return true;} power_down(){} power_up(){} };
var RTC_DS1307 = (typeof RTC_DS1307 !== 'undefined' && RTC_DS1307) || class { constructor(){} begin(){return true;} adjust(){} now(){ return new DateTime(); } isrunning(){return true;} };
var DateTime = (typeof DateTime !== 'undefined' && DateTime) || class { constructor(y,m,d,hh,mm,ss){ this._d = y!==undefined ? new Date(y,(m||1)-1,d||1,hh||0,mm||0,ss||0) : new Date(); } year(){return this._d.getFullYear();} month(){return this._d.getMonth()+1;} day(){return this._d.getDate();} hour(){return this._d.getHours();} minute(){return this._d.getMinutes();} second(){return this._d.getSeconds();} dayOfWeek(){return this._d.getDay()||7;} unixtime(){return Math.floor(this._d.getTime()/1000);} toString(){const p=function(n){return String(n).padStart(2,'0');}; return this.year()+'-'+p(this.month())+'-'+p(this.day())+' '+p(this.hour())+':'+p(this.minute())+':'+p(this.second());} };
var Adafruit_NeoPixel = (typeof Adafruit_NeoPixel !== 'undefined' && Adafruit_NeoPixel) || class { constructor(){} begin(){} show(){} setPixelColor(){} setBrightness(){} clear(){} numPixels(){return 0;} Color(r,g,b){return (r<<16)|(g<<8)|b;} };
var Adafruit_ILI9341 = (typeof Adafruit_ILI9341 !== 'undefined' && Adafruit_ILI9341) || class { constructor(){} begin(){} setRotation(){} fillScreen(){} setCursor(){} setTextColor(){} setTextSize(){} print(){} println(){} drawPixel(){} drawLine(){} drawRect(){} fillRect(){} drawCircle(){} fillCircle(){} drawTriangle(){} fillTriangle(){} drawRoundRect(){} fillRoundRect(){} width(){return 320;} height(){return 240;} invertDisplay(){} };
var MPU6050_RANGE_2_G   = (typeof MPU6050_RANGE_2_G   !== 'undefined') ? MPU6050_RANGE_2_G   : 0;
var MPU6050_RANGE_4_G   = (typeof MPU6050_RANGE_4_G   !== 'undefined') ? MPU6050_RANGE_4_G   : 1;
var MPU6050_RANGE_8_G   = (typeof MPU6050_RANGE_8_G   !== 'undefined') ? MPU6050_RANGE_8_G   : 2;
var MPU6050_RANGE_16_G  = (typeof MPU6050_RANGE_16_G  !== 'undefined') ? MPU6050_RANGE_16_G  : 3;
var MPU6050_RANGE_250_DEG  = (typeof MPU6050_RANGE_250_DEG  !== 'undefined') ? MPU6050_RANGE_250_DEG  : 0;
var MPU6050_RANGE_500_DEG  = (typeof MPU6050_RANGE_500_DEG  !== 'undefined') ? MPU6050_RANGE_500_DEG  : 1;
var MPU6050_RANGE_1000_DEG = (typeof MPU6050_RANGE_1000_DEG !== 'undefined') ? MPU6050_RANGE_1000_DEG : 2;
var MPU6050_RANGE_2000_DEG = (typeof MPU6050_RANGE_2000_DEG !== 'undefined') ? MPU6050_RANGE_2000_DEG : 3;
var MPU6050_BAND_260_HZ = (typeof MPU6050_BAND_260_HZ !== 'undefined') ? MPU6050_BAND_260_HZ : 0;
var MPU6050_BAND_184_HZ = (typeof MPU6050_BAND_184_HZ !== 'undefined') ? MPU6050_BAND_184_HZ : 1;
var MPU6050_BAND_94_HZ  = (typeof MPU6050_BAND_94_HZ  !== 'undefined') ? MPU6050_BAND_94_HZ  : 2;
var MPU6050_BAND_44_HZ  = (typeof MPU6050_BAND_44_HZ  !== 'undefined') ? MPU6050_BAND_44_HZ  : 3;
var MPU6050_BAND_21_HZ  = (typeof MPU6050_BAND_21_HZ  !== 'undefined') ? MPU6050_BAND_21_HZ  : 4;
var MPU6050_BAND_10_HZ  = (typeof MPU6050_BAND_10_HZ  !== 'undefined') ? MPU6050_BAND_10_HZ  : 5;
var MPU6050_BAND_5_HZ   = (typeof MPU6050_BAND_5_HZ   !== 'undefined') ? MPU6050_BAND_5_HZ   : 6;
var SSD1306_SWITCHCAPVCC = (typeof SSD1306_SWITCHCAPVCC !== 'undefined') ? SSD1306_SWITCHCAPVCC : 0x02;
var SSD1306_EXTERNALVCC  = (typeof SSD1306_EXTERNALVCC  !== 'undefined') ? SSD1306_EXTERNALVCC  : 0x01;
var BLACK   = (typeof BLACK   !== 'undefined') ? BLACK   : 0;
var WHITE   = (typeof WHITE   !== 'undefined') ? WHITE   : 1;
var INVERSE = (typeof INVERSE !== 'undefined') ? INVERSE : 2;
var RED     = (typeof RED     !== 'undefined') ? RED     : 0xF800;
var GREEN   = (typeof GREEN   !== 'undefined') ? GREEN   : 0x07E0;
var BLUE    = (typeof BLUE    !== 'undefined') ? BLUE    : 0x001F;
var CYAN    = (typeof CYAN    !== 'undefined') ? CYAN    : 0x07FF;
var MAGENTA = (typeof MAGENTA !== 'undefined') ? MAGENTA : 0xF81F;
var YELLOW  = (typeof YELLOW  !== 'undefined') ? YELLOW  : 0xFFE0;
var ORANGE  = (typeof ORANGE  !== 'undefined') ? ORANGE  : 0xFC00;
var DHT11   = (typeof DHT11   !== 'undefined') ? DHT11   : 11;
var DHT22   = (typeof DHT22   !== 'undefined') ? DHT22   : 22;
var DHT21   = (typeof DHT21   !== 'undefined') ? DHT21   : 21;
var AM2301  = (typeof AM2301  !== 'undefined') ? AM2301  : 21;
var DEC     = (typeof DEC     !== 'undefined') ? DEC     : 10;
var HEX     = (typeof HEX     !== 'undefined') ? HEX     : 16;
var OCT     = (typeof OCT     !== 'undefined') ? OCT     : 8;
if (typeof BIN     === 'undefined') BIN     = 2;
if (typeof PI      === 'undefined') PI      = Math.PI;
if (typeof HALF_PI === 'undefined') HALF_PI = Math.PI / 2;
if (typeof TWO_PI  === 'undefined') TWO_PI  = Math.PI * 2;
if (typeof DEG_TO_RAD === 'undefined') DEG_TO_RAD = Math.PI / 180;
if (typeof RAD_TO_DEG === 'undefined') RAD_TO_DEG = 180 / Math.PI;
if (typeof LSBFIRST === 'undefined') LSBFIRST = 0;
if (typeof MSBFIRST === 'undefined') MSBFIRST = 1;
// ── ILI9341 color constants ───────────────────────────────────────────────────
if (typeof ILI9341_BLACK === 'undefined')       ILI9341_BLACK       = 0x0000;
if (typeof ILI9341_NAVY === 'undefined')        ILI9341_NAVY        = 0x000F;
if (typeof ILI9341_DARKGREEN === 'undefined')   ILI9341_DARKGREEN   = 0x03E0;
if (typeof ILI9341_DARKCYAN === 'undefined')    ILI9341_DARKCYAN    = 0x03EF;
if (typeof ILI9341_MAROON === 'undefined')      ILI9341_MAROON      = 0x7800;
if (typeof ILI9341_PURPLE === 'undefined')      ILI9341_PURPLE      = 0x780F;
if (typeof ILI9341_OLIVE === 'undefined')       ILI9341_OLIVE       = 0x7BE0;
if (typeof ILI9341_LIGHTGREY === 'undefined')   ILI9341_LIGHTGREY   = 0xC618;
if (typeof ILI9341_DARKGREY === 'undefined')    ILI9341_DARKGREY    = 0x7BEF;
if (typeof ILI9341_BLUE === 'undefined')        ILI9341_BLUE        = 0x001F;
if (typeof ILI9341_GREEN === 'undefined')       ILI9341_GREEN       = 0x07E0;
if (typeof ILI9341_CYAN === 'undefined')        ILI9341_CYAN        = 0x07FF;
if (typeof ILI9341_RED === 'undefined')         ILI9341_RED         = 0xF800;
if (typeof ILI9341_MAGENTA === 'undefined')     ILI9341_MAGENTA     = 0xF81F;
if (typeof ILI9341_YELLOW === 'undefined')      ILI9341_YELLOW      = 0xFFE0;
if (typeof ILI9341_WHITE === 'undefined')       ILI9341_WHITE       = 0xFFFF;
if (typeof ILI9341_ORANGE === 'undefined')      ILI9341_ORANGE      = 0xFD20;
if (typeof ILI9341_GREENYELLOW === 'undefined') ILI9341_GREENYELLOW = 0xAFE5;
if (typeof ILI9341_PINK === 'undefined')        ILI9341_PINK        = 0xFC18;
${js}
if (typeof __setup === 'function') { __exports.setup = __setup; }
if (typeof __loop === 'function') { __exports.loop = __loop; }
`;
    return { success: true, jsCode: wrapped };
  } catch (e: any) {
    return { success: false, error: `Client transpiler error: ${e.message}` };
  }
}

