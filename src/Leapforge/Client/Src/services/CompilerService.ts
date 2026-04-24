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
import { IS_ELECTRON, isElectron, CLOUD_COMPILER_URL } from '../../../../config/platform';

export interface CompileRequest {
  code: string;
  board: string;
  libraries: string[];
}

export interface CompileResult {
  success: boolean;
  hexContent?: string;
  binPath?: string;   // returned for esp32:esp32:* FQBNs (QEMU path)
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
    // Convert class-type variable declarations to JS instantiations
    // e.g. Adafruit_SSD1306 oled(128, 64, &Wire, -1); → var oled = new Adafruit_SSD1306(128, 64);
    // Must happen BEFORE function-type stripping so it doesn't match function signatures
    js = js.replace(
      /^\s*([A-Z][A-Za-z0-9_]*)\s+(\w+)\s*\(([^)]*)\)\s*;/gm,
      (_m: string, className: string, varName: string, args: string) => {
        const cleanArgs = args
          .split(',')
          .map((a: string) => a.trim().replace(/^&/, '').replace(/^\(.*?\)/, '').trim())
          .filter((a: string) => a.length > 0)
          .join(', ');
        return `var ${varName} = new ${className}(${cleanArgs});`;
      }
    );
    // C++ copy-initialization: ClassName varName = ClassName(args);
    // e.g. Adafruit_ILI9341 tft = Adafruit_ILI9341(TFT_CS, TFT_DC);
    js = js.replace(
      /^\s*([A-Z][A-Za-z0-9_]*)\s+(\w+)\s*=\s*(?:new\s+)?([A-Z][A-Za-z0-9_]*)\s*\(([^)]*)\)\s*;/gm,
      (_m: string, _className: string, varName: string, ctorName: string, args: string) => {
        const cleanArgs = args
          .split(',')
          .map((a: string) => a.trim().replace(/^&/, '').replace(/^\(.*?\)/, '').trim())
          .filter((a: string) => a.length > 0)
          .join(', ');
        return `var ${varName} = new ${ctorName}(${cleanArgs});`;
      }
    );
    // C++ default-construction: ClassName varName;
    js = js.replace(
      /^\s*([A-Z][A-Za-z0-9_]*)\s+(\w+)\s*;/gm,
      (_m: string, className: string, varName: string) => `var ${varName} = new ${className}();`
    );
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
        const prefix = (name === 'setup' || name === 'loop') ? 'async ' : '';
        const jsName = name === 'setup' ? '__setup' : name === 'loop' ? '__loop' : name;
        return `${prefix}function ${jsName}(${jsParams}) {`;
      });
    // Variable types
    js = js.replace(/\b(int|long|short|unsigned\s+\w+|uint8_t|uint16_t|uint32_t|int8_t|int16_t|int32_t|size_t|byte|char|float|double|boolean|bool)\s+(\w+)\s*=/g,
      (_m, _t, n) => `let ${n} =`);
    js = js.replace(/\b(int|long|short|unsigned\s+\w+|uint8_t|uint16_t|uint32_t|int8_t|int16_t|int32_t|size_t|byte|char|float|double|boolean|bool)\s+(\w+)\s*;/g,
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
    // F() macro — in Arduino it stores strings in flash; in JS just return the string
    js = js.replace(/\bF\s*\(\s*"([^"]*)"\s*\)/g, '"$1"');
    // Remove C++ type casts: (uint16_t)val → val
    js = js.replace(/\(\s*(uint8_t|uint16_t|uint32_t|int8_t|int16_t|int32_t|unsigned\s+\w+|int|long|short|float|double|byte|char|size_t)\s*\)/g, '');
    // `unsigned long` variable declarations (not caught by the main type regex)
    js = js.replace(/\bunsigned\s+long\s+(\w+)\s*=/g, 'let $1 =');
    js = js.replace(/\bunsigned\s+long\s+(\w+)\s*;/g, 'let $1 = 0;');
    // for loop with unsigned
    js = js.replace(/for\s*\(\s*unsigned\s+\w+\s+/g, 'for (let ');
    // `yield` in delay contexts (rare but needed for async correctness)
    // Remove remaining stray `static` keyword
    js = js.replace(/\bstatic\s+/g, '');

    const wrapped = `
// Auto-generated by LeapForge Client Transpiler
// ── Library stubs ────────────────────────────────────────────────────────────
// IMPORTANT: These use function-scoped assignment (not var declarations) so they
// do NOT shadow injected parameters from ArduinoRuntime.buildContext().
// If ArduinoRuntime already injected a real class (e.g. Adafruit_SSD1306),
// the parameter takes precedence and these assignments are skipped.
if (typeof Adafruit_SSD1306 === 'undefined') Adafruit_SSD1306 = class { constructor(){} begin(){return true;} clearDisplay(){} display(){} setTextSize(){} setTextColor(){} setCursor(){} print(){} println(){} drawPixel(){} fillRect(){} drawRect(){} drawCircle(){} fillCircle(){} setRotation(){} invertDisplay(){} startscrollright(){} stopscroll(){} };
if (typeof Adafruit_GFX === 'undefined') Adafruit_GFX = class { constructor(){} };
if (typeof LiquidCrystal_I2C === 'undefined') LiquidCrystal_I2C = class { constructor(){} begin(){} print(){} println(){} setCursor(){} clear(){} backlight(){} noBacklight(){} };
if (typeof LiquidCrystal === 'undefined') LiquidCrystal = class { constructor(){} begin(){} print(){} println(){} setCursor(){} clear(){} };
if (typeof Servo === 'undefined') Servo = class { constructor(){this._angle=90;} attach(){} write(a){this._angle=a;} read(){return this._angle;} detach(){} };
if (typeof DHT === 'undefined') DHT = class { constructor(){} begin(){} readTemperature(){return 25.0;} readHumidity(){return 50.0;} };
if (typeof IRrecv === 'undefined') IRrecv = class { constructor(){} enableIRIn(){} decode(){return false;} resume(){} };
if (typeof decode_results === 'undefined') decode_results = class { constructor(){} };
if (typeof SoftwareSerial === 'undefined') SoftwareSerial = class { constructor(){} begin(){} print(){} println(){} available(){return 0;} read(){return -1;} };
if (typeof Stepper === 'undefined') Stepper = class { constructor(){} setSpeed(){} step(){} };
if (typeof MFRC522 === 'undefined') MFRC522 = class { constructor(){} PCD_Init(){} PICC_IsNewCardPresent(){return false;} PICC_ReadCardSerial(){return false;} };
if (typeof Keypad === 'undefined') Keypad = class { constructor(){} getKey(){return null;} };
if (typeof makeKeymap === 'undefined') makeKeymap = (k) => k;
if (typeof U8g2_SSD1306_128X64_NONAME_F_HW_I2C === 'undefined') U8g2_SSD1306_128X64_NONAME_F_HW_I2C = class { constructor(){} begin(){} clearBuffer(){} sendBuffer(){} setFont(){} drawStr(){} setCursor(){} print(){} println(){} };
if (typeof HX711 === 'undefined') HX711 = class { constructor(){} begin(){} set_scale(){} tare(){} get_units(){return 0;} read(){return 0;} is_ready(){return true;} power_down(){} power_up(){} };
if (typeof Adafruit_NeoPixel === 'undefined') Adafruit_NeoPixel = class { constructor(){} begin(){} show(){} setPixelColor(){} setBrightness(){} clear(){} numPixels(){return 0;} Color(r,g,b){return (r<<16)|(g<<8)|b;} };
if (typeof Adafruit_ILI9341 === 'undefined') Adafruit_ILI9341 = class { constructor(){} begin(){} setRotation(){} fillScreen(){} setCursor(){} setTextColor(){} setTextSize(){} print(){} println(){} drawPixel(){} drawLine(){} drawRect(){} fillRect(){} drawCircle(){} fillCircle(){} drawTriangle(){} fillTriangle(){} drawRoundRect(){} fillRoundRect(){} width(){return 320;} height(){return 240;} invertDisplay(){} };
if (typeof SSD1306_SWITCHCAPVCC === 'undefined') SSD1306_SWITCHCAPVCC = 0x02;
if (typeof SSD1306_EXTERNALVCC === 'undefined')  SSD1306_EXTERNALVCC  = 0x01;
if (typeof BLACK   === 'undefined') BLACK   = 0;
if (typeof WHITE   === 'undefined') WHITE   = 1;
if (typeof INVERSE === 'undefined') INVERSE = 2;
if (typeof RED     === 'undefined') RED     = 0xF800;
if (typeof GREEN   === 'undefined') GREEN   = 0x07E0;
if (typeof BLUE    === 'undefined') BLUE    = 0x001F;
if (typeof CYAN    === 'undefined') CYAN    = 0x07FF;
if (typeof MAGENTA === 'undefined') MAGENTA = 0xF81F;
if (typeof YELLOW  === 'undefined') YELLOW  = 0xFFE0;
if (typeof ORANGE  === 'undefined') ORANGE  = 0xFC00;
if (typeof DHT11   === 'undefined') DHT11   = 11;
if (typeof DHT22   === 'undefined') DHT22   = 22;
if (typeof DHT21   === 'undefined') DHT21   = 21;
if (typeof AM2301  === 'undefined') AM2301  = 21;
if (typeof DEC     === 'undefined') DEC     = 10;
if (typeof HEX     === 'undefined') HEX     = 16;
if (typeof OCT     === 'undefined') OCT     = 8;
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

