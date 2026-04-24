/**
 * LeapForge Compile Server
 * ========================
 * Exposes two endpoints used by CompilerService.ts:
 *
 *   POST /compile    { code, board, libraries? }
 *     → Compiles Arduino sketch via arduino-cli
 *     → Returns { success, hexContent } for AVR
 *     → Returns { success, hexContent } for ESP32 (bin→hex)
 *
 *   POST /transpile  { code, board? }
 *     → Transpiles Arduino C++ to JavaScript for ArduinoRuntime
 *     → Returns { success, jsCode }
 *
 *   GET  /health
 *     → Returns server status
 *
 * Deploy: Railway / Render / Fly.io / any Node.js host
 * Local:  node server.js  (runs on PORT 3001 by default)
 */

'use strict';

const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const fs         = require('fs');
const os         = require('os');
const { spawn }  = require('child_process');
const { v4: uuidv4 } = require('uuid');

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// ─── arduino-cli path ─────────────────────────────────────────────────────────
// Priority: ARDUINO_CLI_PATH env var → bundled binary → system PATH
function getCliPath() {
  if (process.env.ARDUINO_CLI_PATH) return process.env.ARDUINO_CLI_PATH;

  // Bundled binary next to server.js (for Electron / self-hosted)
  const bundled = path.join(__dirname, 'arduino-cli', process.platform === 'win32' ? 'arduino-cli.exe' : 'arduino-cli');
  if (fs.existsSync(bundled)) return bundled;

  // Fallback: system PATH
  return process.platform === 'win32' ? 'arduino-cli.exe' : 'arduino-cli';
}

const CLI_PATH = getCliPath();

// arduino-cli config file — use bundled one if present, else let CLI use defaults
const CLI_CONFIG = (() => {
  const bundled = path.join(__dirname, 'arduino-cli.yaml');
  return fs.existsSync(bundled) ? bundled : null;
})();

// Libraries directory — bundled forge-lib/libraries if present
const FORGE_LIB_LIBRARIES = (() => {
  const bundled = path.join(__dirname, 'forge-lib', 'libraries');
  return fs.existsSync(bundled) ? bundled : null;
})();

console.log(`[SERVER] arduino-cli: ${CLI_PATH}`);
console.log(`[SERVER] config:      ${CLI_CONFIG || '(default)'}`);
console.log(`[SERVER] libraries:   ${FORGE_LIB_LIBRARIES || '(none)'}`);

// ─── arduino-cli runner ───────────────────────────────────────────────────────
function runCLI(args) {
  return new Promise((resolve) => {
    const cliArgs = CLI_CONFIG ? ['--config-file', CLI_CONFIG, ...args] : args;
    const proc = spawn(CLI_PATH, cliArgs, { env: { ...process.env } });
    let stdout = '', stderr = '';
    proc.stdout.on('data', d => { stdout += d.toString(); });
    proc.stderr.on('data', d => { stderr += d.toString(); });
    proc.on('close', code => resolve({ stdout, stderr, code }));
    proc.on('error', err  => resolve({ stdout: '', stderr: err.message, code: -1 }));
  });
}

// ─── ESP32 core installer ─────────────────────────────────────────────────────
let esp32CoreReady = false;

async function ensureESP32Core() {
  if (esp32CoreReady) return true;
  try {
    const { stdout, code } = await runCLI(['core', 'list', '--format', 'json']);
    if (code !== 0) throw new Error('core list failed');
    const cores = JSON.parse(stdout || '[]');
    const installed = Array.isArray(cores) && cores.some(c =>
      (c.id && c.id.startsWith('esp32:')) ||
      (c.platform?.id && c.platform.id.startsWith('esp32:'))
    );
    if (installed) { esp32CoreReady = true; return true; }

    console.log('[SERVER] Installing ESP32 core (first run)...');
    const { code: ic } = await runCLI([
      'core', 'install', 'esp32:esp32',
      '--additional-urls', 'https://dl.espressif.com/dl/package_esp32_index.json',
    ]);
    esp32CoreReady = ic === 0;
    return esp32CoreReady;
  } catch (e) {
    console.error('[SERVER] ensureESP32Core error:', e.message);
    return false;
  }
}

// ─── LEDC API migration (v2 → v3) ────────────────────────────────────────────
function migrateESP32LedcAPI(code) {
  const chMap = new Map();
  for (const m of code.matchAll(/ledcSetup\s*\(\s*(\w+)\s*,\s*([^,]+?)\s*,\s*([^)]+?)\s*\)/g)) {
    const [, ch, freq, res] = m;
    const e = chMap.get(ch) ?? { freq: freq.trim(), res: res.trim(), pin: '' };
    e.freq = freq.trim(); e.res = res.trim(); chMap.set(ch, e);
  }
  for (const m of code.matchAll(/ledcAttachPin\s*\(\s*([^,]+?)\s*,\s*(\w+)\s*\)/g)) {
    const [, pin, ch] = m;
    const e = chMap.get(ch) ?? { freq: '5000', res: '8', pin: '' };
    e.pin = pin.trim(); chMap.set(ch, e);
  }
  if (chMap.size === 0) return code;
  let result = code;
  result = result.replace(/[ \t]*ledcSetup\s*\([^)]*\)\s*;[ \t]*\n?/g, '');
  result = result.replace(/[ \t]*ledcAttachPin\s*\([^)]*\)\s*;[ \t]*\n?/g, '');
  const attachCalls = [...chMap.entries()]
    .filter(([, v]) => v.pin)
    .map(([, v]) => `  ledcAttach(${v.pin}, ${v.freq}, ${v.res});`)
    .join('\n');
  if (attachCalls) result = result.replace(/(void\s+setup\s*\(\s*\)\s*\{)/, `$1\n${attachCalls}`);
  result = result.replace(/ledcWrite\s*\(\s*(\w+)\s*,\s*([^)]+)\s*\)/g, (match, ch, duty) => {
    const e = chMap.get(ch);
    return e?.pin ? `ledcWrite(${e.pin}, ${duty.trim()})` : match;
  });
  return result;
}

// ─── bin → Intel HEX ─────────────────────────────────────────────────────────
function binToIntelHex(buf) {
  const RECORD_SIZE = 16;
  let hex = '';
  for (let offset = 0; offset < buf.length; offset += RECORD_SIZE) {
    const chunk = buf.slice(offset, Math.min(offset + RECORD_SIZE, buf.length));
    const len  = chunk.length;
    const addr = offset & 0xFFFF;
    if (offset > 0 && (offset & 0xFFFF) === 0) {
      const seg = (offset >> 16) & 0xFFFF;
      const hi = (seg >> 8) & 0xFF, lo = seg & 0xFF;
      const ck = (0x100 - ((2 + 4 + hi + lo) & 0xFF)) & 0xFF;
      hex += `:02000004${hi.toString(16).padStart(2,'0').toUpperCase()}${lo.toString(16).padStart(2,'0').toUpperCase()}${ck.toString(16).padStart(2,'0').toUpperCase()}\n`;
    }
    let sum = len + ((addr >> 8) & 0xFF) + (addr & 0xFF);
    let data = '';
    for (let i = 0; i < len; i++) { sum += chunk[i]; data += chunk[i].toString(16).padStart(2,'0').toUpperCase(); }
    const checksum = (0x100 - (sum & 0xFF)) & 0xFF;
    hex += `:${len.toString(16).padStart(2,'0').toUpperCase()}${addr.toString(16).padStart(4,'0').toUpperCase()}00${data}${checksum.toString(16).padStart(2,'0').toUpperCase()}\n`;
  }
  hex += ':00000001FF\n';
  return hex;
}

// ─── Client-side transpiler (AST-aware, handles class types) ─────────────────
function transpileArduinoToJS(code) {
  let js = code;

  // 1. Strip comments
  js = js.replace(/\/\/.*$/gm, '');
  js = js.replace(/\/\*[\s\S]*?\*\//g, '');

  // 2. Strip #include directives
  js = js.replace(/^\s*#include\s*[<"].*?[>"]\s*$/gm, '');

  // 3. #define → const (simple value defines only)
  js = js.replace(/^\s*#define\s+(\w+)\s+(.+)$/gm, (_m, n, v) => `const ${n} = ${v.trim()};`);

  // 4. Remove class-type variable declarations (e.g. Adafruit_SSD1306 oled(...);)
  //    These are constructor calls that have no JS equivalent after #includes are stripped.
  //    Pattern: UpperCamelCase type followed by identifier and optional constructor args
  js = js.replace(/^\s*[A-Z][A-Za-z0-9_]*(?:<[^>]*>)?\s+\w+\s*\([^)]*\)\s*;/gm, '// [class instance removed]');
  js = js.replace(/^\s*[A-Z][A-Za-z0-9_]*(?:<[^>]*>)?\s+\w+\s*;/gm, '// [class variable removed]');

  // 5. Function declarations: typed → async function (for setup/loop) or plain function
  const TYPES = '(?:void|int|long|unsigned\\s+\\w+|uint8_t|uint16_t|uint32_t|int8_t|int16_t|int32_t|size_t|byte|char|float|double|boolean|bool|String|string)';
  js = js.replace(
    new RegExp(`\\b${TYPES}\\s+(\\w+)\\s*\\(([^)]*)\\)\\s*\\{`, 'g'),
    (_m, name, params) => {
      const jsParams = params.split(',')
        .map(p => p.trim().split(/\s+/).pop())
        .filter(Boolean).join(', ');
      const isLifecycle = name === 'setup' || name === 'loop';
      const prefix = isLifecycle ? 'async ' : '';
      const jsName = name === 'setup' ? '__setup' : name === 'loop' ? '__loop' : name;
      return `${prefix}function ${jsName}(${jsParams}) {`;
    }
  );

  // 6. Variable declarations: typed → let
  js = js.replace(
    new RegExp(`\\b${TYPES}\\s+(\\w+)\\s*=`, 'g'),
    (_m, n) => `let ${n} =`
  );
  js = js.replace(
    new RegExp(`\\b${TYPES}\\s+(\\w+)\\s*;`, 'g'),
    (_m, n) => `let ${n} = 0;`
  );

  // 7. for-loop typed iterator
  js = js.replace(/for\s*\(\s*(?:int|byte|uint8_t|uint16_t|uint32_t|size_t|long|short)\s+/g, 'for (let ');

  // 8. Arduino API rewrites
  js = js.replace(/\bdelay\s*\(/g, 'await __delay(');
  js = js.replace(/\bdelayMicroseconds\s*\(/g, 'await __delayMicroseconds(');
  js = js.replace(/\bmap\s*\(/g, '__arduino_map(');
  js = js.replace(/\bconstrain\s*\(/g, '__arduino_constrain(');
  js = js.replace(/\brandom\s*\(/g, '__arduino_random(');
  js = js.replace(/\babs\s*\(/g, 'Math.abs(');
  js = js.replace(/\bmin\s*\(/g, 'Math.min(');
  js = js.replace(/\bmax\s*\(/g, 'Math.max(');
  js = js.replace(/\bsq\s*\(/g, '__arduino_sq(');
  js = js.replace(/\bbitRead\s*\(/g, '__arduino_bitRead(');
  js = js.replace(/\bbitWrite\s*\(/g, '__arduino_bitWrite(');
  js = js.replace(/\bbitSet\s*\(/g, '__arduino_bitSet(');
  js = js.replace(/\bbitClear\s*\(/g, '__arduino_bitClear(');
  js = js.replace(/\blowByte\s*\(/g, '__arduino_lowByte(');
  js = js.replace(/\bhighByte\s*\(/g, '__arduino_highByte(');
  js = js.replace(/\brandomSeed\s*\(/g, '__arduino_randomSeed(');

  // 9. String type → string (JS has no String type keyword)
  js = js.replace(/\bString\s+(\w+)/g, 'let $1');

  // 10. Cast expressions: (int), (float), (byte) etc.
  js = js.replace(/\((?:int|float|double|byte|char|long|uint8_t|uint16_t|uint32_t)\)\s*/g, '');

  // 11. Boolean literals
  js = js.replace(/\btrue\b/g, 'true');
  js = js.replace(/\bfalse\b/g, 'false');
  js = js.replace(/\bNULL\b/g, 'null');

  // 12. Wrap and export
  const wrapped = `
// ── LeapForge Transpiled Sketch ──────────────────────────────────────────────
// Auto-generated by LeapForge Compile Server transpiler

// ── Library stubs (for stripped #include dependencies) ──────────────────────
const Adafruit_SSD1306 = class {
  constructor() { this._buf = new Uint8Array(128 * 8); }
  begin() { return true; } clearDisplay() { this._buf.fill(0); }
  display() {} setTextSize() {} setTextColor() {} setCursor() {}
  print(v) { console.log('[OLED]', v); } println(v) { console.log('[OLED]', v); }
  drawPixel(x, y, c) { if (x >= 0 && x < 128 && y >= 0 && y < 64) { const page = Math.floor(y / 8); const bit = y % 8; if (c) this._buf[page * 128 + x] |= (1 << bit); else this._buf[page * 128 + x] &= ~(1 << bit); } }
  fillRect() {} drawRect() {} drawCircle() {} fillCircle() {}
  setRotation() {} invertDisplay() {} startscrollright() {} stopscroll() {}
  getBuffer() { return this._buf; }
};
const Adafruit_GFX = class { constructor() {} };
const LiquidCrystal_I2C = class {
  constructor() {} begin() {} print(v) { console.log('[LCD]', v); }
  println(v) { console.log('[LCD]', v); } setCursor() {} clear() {}
  backlight() {} noBacklight() {}
};
const LiquidCrystal = class {
  constructor() {} begin() {} print(v) { console.log('[LCD]', v); }
  println(v) { console.log('[LCD]', v); } setCursor() {} clear() {}
};
const DHT = class {
  constructor() {} begin() {}
  readTemperature() { return 25.0; } readHumidity() { return 50.0; }
  isnan(v) { return isNaN(v); }
};
const IRrecv = class { constructor() {} enableIRIn() {} decode() { return false; } resume() {} };
const decode_results = class { constructor() { this.value = 0; } };
const SoftwareSerial = class {
  constructor() {} begin() {} print(v) { Serial.print(v); }
  println(v) { Serial.println(v); } available() { return 0; } read() { return -1; }
};
const Stepper = class { constructor() {} setSpeed() {} step() {} };
const MFRC522 = class {
  constructor() {} PCD_Init() {}
  PICC_IsNewCardPresent() { return false; } PICC_ReadCardSerial() { return false; }
};
const Keypad = class { constructor() {} getKey() { return null; } };
const makeKeymap = (k) => k;
const U8g2_SSD1306_128X64_NONAME_F_HW_I2C = class {
  constructor() {} begin() {} clearBuffer() {} sendBuffer() {}
  setFont() {} drawStr() {} setCursor() {} print() {} println() {}
};
const TFT_eSPI = class {
  constructor() {} init() {} fillScreen() {} setTextColor() {}
  setTextSize() {} setCursor() {} print() {} println() {}
  drawPixel() {} fillRect() {} drawRect() {}
};
const Servo = class {
  constructor() { this._pin = 0; this._angle = 90; }
  attach(pin) { this._pin = pin; }
  write(a) { this._angle = a; if (typeof __onServoWrite === 'function') __onServoWrite(this._pin, a); }
  read() { return this._angle; } detach() {}
};
const NeoPixel = class {
  constructor(n, pin) { this._n = n; this._pin = pin; this._pixels = new Uint32Array(n); }
  begin() {} show() {} setPixelColor(i, r, g, b) { if (i < this._n) this._pixels[i] = (r << 16) | (g << 8) | b; }
  Color(r, g, b) { return (r << 16) | (g << 8) | b; } clear() { this._pixels.fill(0); }
};
const Adafruit_NeoPixel = NeoPixel;
const isnan = (v) => isNaN(v);
const isinf = (v) => !isFinite(v);
const F = (s) => s;
const PROGMEM = '';
const pgm_read_byte = (p) => p;

${js}

if (typeof __setup === 'function') { __exports.setup = __setup; }
if (typeof __loop  === 'function') { __exports.loop  = __loop;  }
`;

  return wrapped;
}

// ─── POST /compile ────────────────────────────────────────────────────────────
app.post('/compile', async (req, res) => {
  const { code, board = 'arduino:avr:uno', libraries = '' } = req.body;
  if (!code) return res.status(400).json({ success: false, errors: 'No code provided' });

  const isESP32 = board.startsWith('esp32:');
  const tempId  = uuidv4();
  const tempDir = path.join(os.tmpdir(), `leapforge_${tempId}`);
  const sketchDir  = path.join(tempDir, 'sketch');
  const sketchPath = path.join(sketchDir, 'sketch.ino');

  try {
    fs.mkdirSync(sketchDir, { recursive: true });

    // Pre-process ESP32 code
    let processedCode = code;
    if (isESP32) {
      processedCode = processedCode.replace(/#include\s*[<"]Servo\.h[>"]/g, '#include <ESP32Servo.h>');
      processedCode = migrateESP32LedcAPI(processedCode);
      const coreOk = await ensureESP32Core();
      if (!coreOk) {
        return res.json({ success: false, errors: 'ESP32 core not available on this server' });
      }
    }

    fs.writeFileSync(sketchPath, processedCode);

    const cliArgs = ['compile', '--fqbn', board, '--output-dir', tempDir];

    // Add libraries path if available and not ESP32 (AVR-only libs conflict)
    if (!isESP32 && FORGE_LIB_LIBRARIES) {
      cliArgs.push('--libraries', FORGE_LIB_LIBRARIES);
    }
    // Add user-specified libraries
    if (libraries) {
      const libPath = path.resolve(libraries);
      if (fs.existsSync(libPath)) cliArgs.push('--libraries', libPath);
    }

    cliArgs.push(sketchDir);

    const { stdout, stderr, code: exitCode } = await runCLI(cliArgs);

    if (exitCode !== 0) {
      return res.json({ success: false, errors: stderr || stdout || `Exit code ${exitCode}` });
    }

    const files = fs.readdirSync(tempDir);

    if (isESP32) {
      const binFile = files.find(f => f === 'sketch.ino.bin')
        ?? files.find(f => f.endsWith('.bin') && !f.includes('bootloader') && !f.includes('partition'));
      if (!binFile) {
        return res.json({ success: false, errors: `No .bin found. Files: ${files.join(', ')}` });
      }
      const hexContent = binToIntelHex(fs.readFileSync(path.join(tempDir, binFile)));
      return res.json({ success: true, hex: hexContent });
    } else {
      const hexFile = files.find(f => f.endsWith('.hex'));
      if (!hexFile) {
        return res.json({ success: false, errors: `No .hex found. Files: ${files.join(', ')}` });
      }
      const hexContent = fs.readFileSync(path.join(tempDir, hexFile), 'utf-8');
      return res.json({ success: true, hex: hexContent });
    }
  } catch (err) {
    return res.json({ success: false, errors: err.message });
  } finally {
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}
  }
});

// ─── POST /transpile ──────────────────────────────────────────────────────────
app.post('/transpile', async (req, res) => {
  const { code, board = 'esp32:esp32:esp32c3' } = req.body;
  if (!code) return res.status(400).json({ success: false, errors: 'No code provided' });

  try {
    const jsCode = transpileArduinoToJS(code);
    return res.json({ success: true, jsCode });
  } catch (err) {
    return res.json({ success: false, errors: err.message });
  }
});

// ─── GET /health ──────────────────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  let cliVersion = 'unknown';
  try {
    const { stdout } = await runCLI(['version', '--format', 'json']);
    const parsed = JSON.parse(stdout || '{}');
    cliVersion = parsed.VersionString || parsed.version || stdout.trim().split('\n')[0];
  } catch (_) {}

  res.json({
    status: 'ok',
    port: PORT,
    uptime: Math.floor(process.uptime()),
    arduinoCli: cliVersion,
    esp32CoreReady,
    endpoints: ['/compile', '/transpile', '/health'],
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[LeapForge Compile Server] Running on http://localhost:${PORT}`);
  console.log(`[LeapForge Compile Server] arduino-cli: ${CLI_PATH}`);
  // Warm up ESP32 core check in background
  ensureESP32Core().then(ok => {
    console.log(`[LeapForge Compile Server] ESP32 core: ${ok ? '✓ ready' : '✗ not installed'}`);
  });
});
