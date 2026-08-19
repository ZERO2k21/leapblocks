/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 *
 * Firmware toolchain driver backed by PlatformIO Core (Apache-2.0).
 * Replaces the GPL-3.0 arduino-cli binary. Public API is unchanged so
 * IPC callers (src/index.ts) and renderers need no modifications.
 */
import { BrowserWindow, app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { spawn } from 'child_process';
import { getPioPathIfAvailable, ensurePlatformIO, getBundledPioEnv, getBundledLibrariesSeedPath } from './ensurePlatformIO';
import { runPio, platformEnsure, pkgInstallLibrary, pkgUninstallLibrary, PioResult, PioRunOptions } from './pio';
import { fqbnToPioTarget, isEsp32Fqbn, PioBoardTarget } from './boardMap';
import { createPioProject, getPioBuildDir, listPioBuildFiles } from './project';
import { searchRegistry, RegistryLibrary } from './registry';

// ── forge-lib manifest types ──────────────────────────────────────────────
interface ForgeLibManifestEntry {
    name: string;
    version: string;
    cachedAt: string;  // ISO timestamp
}

interface ForgeLibManifest {
    version: '1.0';
    libraries: ForgeLibManifestEntry[];
    lastIndexUpdate?: number; // timestamp
}

const FEATURED_LIBRARIES = [
    { name: "WiFi", author: "Arduino", version: "1.2.7", sentence: "Enables network connection (local and Internet) using the Arduino WiFi Shield.", website: "http://www.arduino.cc/en/Reference/WiFi" },
    { name: "LiquidCrystal", author: "Arduino", version: "1.0.7", sentence: "Allows communication with alphabetical and numerical liquid crystal displays (LCDs).", website: "http://www.arduino.cc/en/Reference/LiquidCrystal" },
    { name: "Servo", author: "Arduino", version: "1.2.1", sentence: "Allows Arduino boards to control a variety of servo motors.", website: "http://www.arduino.cc/en/Reference/Servo" },
    { name: "DHT sensor library", author: "Adafruit", version: "1.4.6", sentence: "Arduino library for DHT11, DHT22, etc Temperature & Humidity Sensors.", website: "https://github.com/adafruit/DHT-sensor-library" },
    { name: "Adafruit NeoPixel", author: "Adafruit", version: "1.12.0", sentence: "Arduino library for controlling Adafruit NeoPixel strips and arrays.", website: "https://github.com/adafruit/Adafruit_NeoPixel" },
    { name: "LiquidCrystal I2C", author: "Frank de Brabander", version: "1.1.2", sentence: "A library for I2C LCD displays.", website: "https://github.com/johnrickman/LiquidCrystal_I2C" },
    { name: "Keypad", author: "Mark Stanley, Alexander Brevig", version: "3.1.1", sentence: "A library for using matrix style keypads with Arduino.", website: "http://playground.arduino.cc/Code/Keypad" },
    { name: "Wire", author: "Arduino", version: "1.0", sentence: "Allows communication with I2C / TWI devices.", website: "http://www.arduino.cc/en/Reference/Wire" }
];

/**
 * Migrate ESP32 LEDC API from core v2 (ledcSetup/ledcAttachPin) to core v3 (ledcAttach/ledcWrite).
 *
 * v2 pattern:
 *   ledcSetup(channel, freq, resolution);
 *   ledcAttachPin(pin, channel);
 *   ledcWrite(channel, duty);
 *
 * v3 pattern:
 *   ledcAttach(pin, freq, resolution);
 *   ledcWrite(pin, duty);
 */
function migrateESP32LedcAPI(code: string): string {
    const chMap = new Map<string, { freq: string; res: string; pin: string }>();

    for (const m of code.matchAll(/ledcSetup\s*\(\s*(\w+)\s*,\s*([^,]+?)\s*,\s*([^)]+?)\s*\)/g)) {
        const [, ch, freq, res] = m;
        const entry = chMap.get(ch) ?? { freq: freq.trim(), res: res.trim(), pin: '' };
        entry.freq = freq.trim();
        entry.res = res.trim();
        chMap.set(ch, entry);
    }
    for (const m of code.matchAll(/ledcAttachPin\s*\(\s*([^,]+?)\s*,\s*(\w+)\s*\)/g)) {
        const [, pin, ch] = m;
        const entry = chMap.get(ch) ?? { freq: '5000', res: '8', pin: '' };
        entry.pin = pin.trim();
        chMap.set(ch, entry);
    }

    if (chMap.size === 0) return code;

    console.log('[FORGE UPLOADER] Migrating LEDC API v2 → v3:', [...chMap.entries()]);

    let result = code;
    result = result.replace(/[ \t]*ledcSetup\s*\([^)]*\)\s*;[ \t]*\n?/g, '');
    result = result.replace(/[ \t]*ledcAttachPin\s*\([^)]*\)\s*;[ \t]*\n?/g, '');

    const attachCalls = [...chMap.entries()]
        .filter(([, v]) => v.pin)
        .map(([, v]) => `  ledcAttach(${v.pin}, ${v.freq}, ${v.res});`)
        .join('\n');

    if (attachCalls) {
        result = result.replace(
            /(void\s+setup\s*\(\s*\)\s*\{)/,
            `$1\n${attachCalls}`
        );
    }

    result = result.replace(/ledcWrite\s*\(\s*(\w+)\s*,\s*([^)]+)\s*\)/g, (match, ch, duty) => {
        const entry = chMap.get(ch);
        if (entry?.pin) {
            return `ledcWrite(${entry.pin}, ${duty.trim()})`;
        }
        return match;
    });

    return result;
}

function preprocessOledCode(code: string): string {
    let processed = code;
    const oledVarMatch = processed.match(/Adafruit_SSD1306\s+(\w+)\b/);
    if (oledVarMatch) {
        const varName = oledVarMatch[1];
        const hasSetTextColor = new RegExp(`${varName}\\.setTextColor\\b`).test(processed);
        if (!hasSetTextColor) {
            const beginRegex = new RegExp(`(${varName}\\.begin\\s*\\([^)]+\\)\\s*;)`);
            if (beginRegex.test(processed)) {
                processed = processed.replace(beginRegex, `$1\n  ${varName}.setTextColor(1);`);
                console.log(`[FORGE PREPROCESS] Injected ${varName}.setTextColor(1); after begin()`);
            }
        }
    }
    return processed;
}

export class ArduinoUploader {
    private mainWindow: BrowserWindow | null = null;

    constructor(window: BrowserWindow | null) {
        this.mainWindow = window;
    }

    setWindow(window: BrowserWindow | null) {
        this.mainWindow = window;
    }

    private sendProgress(progress: number, message: string) {
        if (this.mainWindow) {
            this.mainWindow.webContents.send('upload-progress', progress, message);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PLATFORMIO RESOLUTION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Resolve the bundled pio binary. Never uses system Python / PATH.
     */
    private async getPioPath(): Promise<string> {
        const available = getPioPathIfAvailable();
        if (available) {
            console.log(`[FORGE UPLOADER] pio found at: ${available}`);
            return available;
        }

        console.log('[FORGE UPLOADER] Bundled pio not found. Resolving from cache...');
        try {
            const pioPath = await ensurePlatformIO((msg) => {
                console.log(`[FORGE UPLOADER] ${msg}`);
            });
            console.log(`[FORGE UPLOADER] pio ready at: ${pioPath}`);
            return pioPath;
        } catch (err: any) {
            console.error('[FORGE UPLOADER] Failed to obtain pio:', err.message);
            throw new Error(
                'PlatformIO is required but could not be found.\n' +
                'The bundled binary is missing. Please reinstall LeapBlocks.'
            );
        }
    }

    /**
     * Build one temp PlatformIO project for an fqbn and run `pio run`.
     * Returns the build output dir on success.
     */
    private pioOptions(extra: PioRunOptions = {}): PioRunOptions {
        // The bundled exe needs the embeddable Python for scons/esptool.
        const env = getBundledPioEnv();
        return { ...extra, env: { ...env, ...extra.env } };
    }

    private async runPioBuild(
        code: string,
        fqbn: string,
        projectDir: string,
        opts: { mergeBinaries?: boolean; uploadPort?: string; timeoutMs?: number } = {},
    ): Promise<{ target: PioBoardTarget; projectDir: string; buildDir: string }> {
        const pioPath = await this.getPioPath();
        const target = fqbnToPioTarget(fqbn);
        const libsFolder = this.getLibrariesPath();

        createPioProject(projectDir, code, {
            board: target.board,
            platform: target.platform,
            libDirs: fs.existsSync(libsFolder) ? [libsFolder] : [],
            mergeBinaries: opts.mergeBinaries,
            uploadPort: opts.uploadPort,
        });

        const args = ['run', '-d', projectDir, '-j', '2'];
        if (opts.uploadPort) args.splice(args.indexOf('-d') + 2, 0, '-t', 'upload');

        console.log(`[FORGE UPLOADER] Running: pio ${args.join(' ')} (${fqbn} → ${target.board})`);
        const result = await runPio(args, this.pioOptions({ binPath: pioPath, timeoutMs: opts.timeoutMs ?? 180_000 }));
        if (result.code !== 0) {
            throw new Error(this.formatPioError(result));
        }
        return { target, projectDir, buildDir: getPioBuildDir(projectDir, target.board) };
    }

    private formatPioError(result: PioResult): string {
        const stderr = (result.stderr || '').trim();
        const stdout = (result.stdout || '').trim();
        const body = stderr || stdout || `pio exited with code ${result.code}`;
        // PlatformIO prints the compiler errors last — keep the useful tail.
        return body.length > 4000 ? body.slice(-4000) : body;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ESP32 PLATFORM / LIBRARY ENSURING
    // ═══════════════════════════════════════════════════════════════════════

    private esp32PlatformReady = false;

    /**
     * Ensure the espressif32 platform is installed (idempotent).
     * AVR platforms auto-install on first `pio run` (declared in platformio.ini).
     */
    async ensureEsp32Platform(): Promise<boolean> {
        if (this.esp32PlatformReady) return true;

        const send = (msg: string) => {
            console.log(`[FORGE UPLOADER] ${msg}`);
            if (this.mainWindow?.webContents) {
                this.mainWindow.webContents.send('serial-data', `[ESP32 SETUP] ${msg}\n`);
            }
        };

        try {
            const pioPath = await this.getPioPath();
            send('Checking for ESP32 platform installation...');
            send('Installing espressif32 platform (this may take 2-5 minutes)...');
            const ok = await platformEnsure('espressif32', this.pioOptions({ binPath: pioPath, timeoutMs: 1_800_000 }));
            if (!ok) {
                send('ERROR: Failed to install espressif32 platform');
                return false;
            }
            send('✓ ESP32 platform ready');
            this.esp32PlatformReady = true;
            return true;
        } catch (err: any) {
            send(`ERROR: ${err.message}`);
            return false;
        }
    }

    /**
     * Ensure an ESP32-compatible library is installed into forge-lib/libraries.
     * Idempotent — safe to call on every compile.
     */
    private async ensureEsp32Library(libName: string): Promise<void> {
        try {
            const pioPath = await this.getPioPath();
            const libsFolder = this.getLibrariesPath();
            if (fs.existsSync(path.join(libsFolder, libName))) return;

            console.log(`[FORGE UPLOADER] Installing ESP32 library: ${libName}`);
await pkgInstallLibrary(libName, libsFolder, this.pioOptions({ binPath: pioPath }));
            console.log(`[FORGE UPLOADER] Installed: ${libName}`);
        } catch (err: any) {
            console.warn(`[FORGE UPLOADER] Library install warning (${libName}):`, err.message);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // FORGE-LIB CACHE
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Returns the path to the centralized forge-lib marketplace directory.
     * Located at: [AppRoot]/forge-lib/
     */
    getForgeLibCachePath(): string {
        const appRoot = app.isPackaged
            ? path.dirname(app.getPath('exe'))
            : process.cwd();
        const cachePath = path.join(appRoot, 'forge-lib');
        if (!fs.existsSync(cachePath)) {
            fs.mkdirSync(cachePath, { recursive: true });
        }
        return cachePath;
    }

    private getLibrariesPath(): string {
        const p = path.join(this.getForgeLibCachePath(), 'libraries');
        if (!fs.existsSync(p)) {
            fs.mkdirSync(p, { recursive: true });
            const seed = getBundledLibrariesSeedPath();
            if (seed) {
                for (const entry of fs.readdirSync(seed, { withFileTypes: true })) {
                    const src = path.join(seed, entry.name);
                    const dst = path.join(p, entry.name);
                    fs.cpSync(src, dst, { recursive: true, force: true });
                }
                console.log(`[FORGE-LIB] Seeded forge-lib/libraries from bundled libraries (${fs.readdirSync(p).length} libs)`);
            }
        }
        return p;
    }

    /**
     * Read the forge-lib/manifest.json file.
     */
    getForgeLibManifest(): ForgeLibManifest {
        const manifestPath = path.join(this.getForgeLibCachePath(), 'manifest.json');
        if (fs.existsSync(manifestPath)) {
            try {
                const raw = fs.readFileSync(manifestPath, 'utf-8');
                return JSON.parse(raw) as ForgeLibManifest;
            } catch {
                // Corrupted manifest — reset it
            }
        }
        return { version: '1.0', libraries: [] };
    }

    /**
     * Write updated manifest to forge-lib/manifest.json.
     */
    private updateForgeLibManifest(manifest: ForgeLibManifest): void {
        const manifestPath = path.join(this.getForgeLibCachePath(), 'manifest.json');
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
    }

    /**
     * Get cache info (path + manifest) for the renderer.
     */
    getForgeLibCacheInfo(): { cachePath: string; manifest: ForgeLibManifest } {
        return {
            cachePath: this.getForgeLibCachePath(),
            manifest: this.getForgeLibManifest(),
        };
    }

    private getSearchCachePath(): string {
        return path.join(this.getForgeLibCachePath(), 'search_cache.json');
    }

    private getSearchCache(): Record<string, any[]> {
        const p = this.getSearchCachePath();
        if (fs.existsSync(p)) {
            try { return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch { return {}; }
        }
        return {};
    }

    private saveSearchCache(cache: Record<string, any[]>) {
        fs.writeFileSync(this.getSearchCachePath(), JSON.stringify(cache, null, 2), 'utf-8');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UPLOAD
    // ═══════════════════════════════════════════════════════════════════════

    async upload(code: string, port: string, fqbn: string) {
        if (!port) {
            return {
                success: false,
                error: 'No serial port selected. Please select a COM port in the menu bar.',
            };
        }
        try {
            this.sendProgress(0, 'Initializing upload...');
            this.sendProgress(2, 'Preparing environment...');

            const projectDir = path.join(os.tmpdir(), 'leapblocks_upload');
            if (!fs.existsSync(projectDir)) {
                fs.mkdirSync(projectDir, { recursive: true });
            }

            this.sendProgress(15, 'Writing sketch file...');
            this.sendProgress(20, 'Sketch saved successfully');

            this.sendProgress(25, 'Starting compilation...');
            this.sendProgress(30, 'Compiling code...');
            try {
                await this.runPioBuild(code, fqbn, projectDir, {
                    uploadPort: port,
                    timeoutMs: 300_000,
                });
                this.sendProgress(60, 'Compilation successful');
            } catch (compileError: any) {
                return {
                    success: false,
                    error: `Compilation failed: ${compileError.message}`,
                };
            }

            this.sendProgress(65, 'Preparing upload...');
            this.sendProgress(70, 'Uploading to board...');
            try {
                this.sendProgress(75, 'Flashing firmware...');
                await this.runPioUpload(code, fqbn, projectDir, port);
                this.sendProgress(95, 'Finalizing...');
            } catch (uploadError: any) {
                return {
                    success: false,
                    error: `Upload failed: ${uploadError.message}`,
                };
            }

            this.sendProgress(100, 'Upload complete!');
            console.log(`[FORGE UPLOADER] Upload to board ${fqbn} on ${port} successful.`);
            return { success: true };
        } catch (error: any) {
            console.error(`[FORGE UPLOADER] ${fqbn} upload failed:`, error.message);
            return { success: false, error: (error as Error).message };
        }
    }

    private async runPioUpload(code: string, fqbn: string, projectDir: string, port: string) {
        const pioPath = await this.getPioPath();
        const target = fqbnToPioTarget(fqbn);
        const libsFolder = this.getLibrariesPath();

        createPioProject(projectDir, code, {
            board: target.board,
            platform: target.platform,
            libDirs: fs.existsSync(libsFolder) ? [libsFolder] : [],
            uploadPort: port,
        });

        const args = ['run', '-t', 'upload', '-d', projectDir];
        console.log(`[FORGE UPLOADER] Running: pio ${args.join(' ')} (${fqbn} → ${target.board}, port ${port})`);
        const result = await runPio(args, this.pioOptions({ binPath: pioPath, timeoutMs: 300_000 }));
        if (result.code !== 0) {
            throw new Error(this.formatPioError(result));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SIMULATION COMPILATION
    // ═══════════════════════════════════════════════════════════════════════

    async compileForSimulation(code: string, fqbn: string): Promise<{ success: boolean; hexContent?: string; error?: string }> {
        const isESP32 = isEsp32Fqbn(fqbn);
        try {
            const projectDir = path.join(os.tmpdir(), 'leapblocks_sketch');
            if (!fs.existsSync(projectDir)) {
                fs.mkdirSync(projectDir, { recursive: true });
            }

            // ── ESP32 sketch preprocessing ────────────────────────────────────
            let processedCode = preprocessOledCode(code);
            if (isESP32) {
                const coreOk = await this.ensureEsp32Platform();
                if (!coreOk) {
                    return { success: false, error: 'ESP32 platform installation failed. Please check your connection and try again.' };
                }
                processedCode = processedCode.replace(
                    /#include\s*[<"]Servo\.h[>"]/g,
                    '#include <ESP32Servo.h>'
                );
                await this.ensureEsp32Library('ESP32Servo');
                processedCode = migrateESP32LedcAPI(processedCode);
            }

            try {
                const { target, buildDir } = await this.runPioBuild(processedCode, fqbn, projectDir);
                const files = listPioBuildFiles(projectDir, target.board);
                console.log(`[FORGE UPLOADER] Build output files: ${files.join(', ')}`);

                if (isESP32) {
                    const binFile = files.find(f => f === 'firmware.bin');
                    if (binFile) {
                        const binBuf = fs.readFileSync(path.join(buildDir, binFile));
                        const hexContent = this.binToIntelHex(binBuf);
                        return { success: true, hexContent };
                    }
                    return { success: false, error: `ESP32 compiled but no firmware.bin found. Files: ${files.join(', ')}` };
                } else {
                    const hexFilePath = path.join(buildDir, 'firmware.hex');
                    if (fs.existsSync(hexFilePath)) {
                        const hexContent = fs.readFileSync(hexFilePath, 'utf-8');
                        return { success: true, hexContent };
                    }
                    const hexFile = files.find(f => f.endsWith('.hex'));
                    if (hexFile) {
                        const hexContent = fs.readFileSync(path.join(buildDir, hexFile), 'utf-8');
                        return { success: true, hexContent };
                    }
                    return { success: false, error: 'Compiled successfully, but no .hex file was found.' };
                }
            } catch (compileError: any) {
                return {
                    success: false,
                    error: `Compilation failed: ${compileError.message}`,
                };
            }
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ESP32 SIMULATION COMPILATION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Compiles a sketch for the ESP32-C3 RISC-V emulator.
     * Produces a single merged flash image (bootloader + partitions + app).
     */
    async compileESP32ForSimulation(code: string, fqbn: string): Promise<{ success: boolean; binPath?: string; error?: string }> {
        const coreOk = await this.ensureEsp32Platform();
        if (!coreOk) {
            return {
                success: false,
                error: 'ESP32 platform installation failed. Please check your connection and try again.',
            };
        }

        const tempDir = path.join(os.tmpdir(), `forge_esp32_${Date.now()}`);
        const projectDir = path.join(tempDir, 'project');

        try {
            if (this.mainWindow?.webContents) {
                this.mainWindow.webContents.send('serial-data', '[SYSTEM] Checking ESP32 platform installation...\n');
            }

            // Inject GPIO monitor header so ESP32-C3 serial output carries __LF_ tagged lines
            const GPIO_MONITOR_HEADER = `\
// ---- Electra monitor (auto-injected, do not remove) ----
#include <Wire.h>
#include <WiFi.h>

// ── GPIO ──────────────────────────────────────────────────────────────────
static void __lf_digitalWrite(uint8_t pin, uint8_t val) {
  digitalWrite(pin, val);
  Serial.printf("__LF_GPIO:%d:%d\\n", pin, (int)val);
}
#define digitalWrite(p,v) __lf_digitalWrite((p),(v))

// ── PWM / analogWrite ─────────────────────────────────────────────────────
static void __lf_analogWrite(uint8_t pin, uint32_t val) {
  analogWrite(pin, val);
  Serial.printf("__LF_PWM:%d:%d\\n", pin, (int)val);
}
#define analogWrite(p,v) __lf_analogWrite((p),(v))

// ── I2C / Wire ────────────────────────────────────────────────────────────
static uint8_t  __lf_i2c_addr = 0;
static uint8_t  __lf_i2c_buf[256];
static int      __lf_i2c_len  = 0;

struct __LFWireClass {
  void begin() { Wire.begin(); }
  void begin(uint8_t sda, uint8_t scl) { Wire.begin(sda, scl); }
  void setClock(uint32_t freq) { Wire.setClock(freq); }
  void beginTransmission(uint8_t addr) {
    __lf_i2c_addr = addr; __lf_i2c_len = 0;
    Wire.beginTransmission(addr);
    Serial.printf("__LF_I2C_S:%d\\n", (int)addr);
  }
  size_t write(uint8_t b) {
    __lf_i2c_buf[__lf_i2c_len < 256 ? __lf_i2c_len++ : 255] = b;
    Wire.write(b);
    Serial.printf("__LF_I2C_B:%d\\n", (int)b);
    return 1;
  }
  size_t write(const uint8_t* data, size_t len) {
    for (size_t i = 0; i < len; i++) write(data[i]);
    return len;
  }
  uint8_t endTransmission(bool stop = true) {
    uint8_t r = Wire.endTransmission(stop);
    Serial.printf("__LF_I2C_E:%d\\n", (int)r);
    return r;
  }
  uint8_t requestFrom(uint8_t addr, uint8_t qty, bool stop = true) {
    return Wire.requestFrom(addr, qty, stop);
  }
  int available() { return Wire.available(); }
  int read()      { return Wire.read(); }
  void onReceive(void (*fn)(int)) { Wire.onReceive(fn); }
  void onRequest(void (*fn)())    { Wire.onRequest(fn); }
} __lf_wire;
#define Wire __lf_wire

// ── WiFi events ───────────────────────────────────────────────────────────
static void __lf_wifi_event(WiFiEvent_t event) {
  switch (event) {
    case ARDUINO_EVENT_WIFI_STA_CONNECTED:
      Serial.printf("__LF_WIFI:connected\\n"); break;
    case ARDUINO_EVENT_WIFI_STA_DISCONNECTED:
      Serial.printf("__LF_WIFI:disconnected\\n"); break;
    case ARDUINO_EVENT_WIFI_STA_GOT_IP:
      Serial.printf("__LF_WIFI:ip:%s\\n", WiFi.localIP().toString().c_str()); break;
    default: break;
  }
}
static void __lf_setup_wifi() { WiFi.onEvent(__lf_wifi_event); }
// ---- end Electra injection ----
`;
            // Preprocess code
            let processedCode = code.replace(/#include\s*[<"]Servo\.h[>"]/g, '#include <ESP32Servo.h>');
            processedCode = migrateESP32LedcAPI(processedCode);
            processedCode = preprocessOledCode(processedCode);
            // Add a comment-only helper for common Stepper.h wiring mistakes (28BYJ-48).
            if (/\bStepper\s+(myStepper|stepper)\b/.test(processedCode)) {
                const stepperCtorPattern = /^([ \t]*Stepper\s+(?:myStepper|stepper)\s*\(\s*[^,\n]+,\s*[^,\n]+,\s*[^,\n]+,\s*[^,\n]+,\s*[^)\n]+\)\s*;.*)$/m;
                processedCode = processedCode.replace(
                    stepperCtorPattern,
                    `// LeapForge: 28BYJ-48 with Stepper.h requires pin order IN1,IN3,IN2,IN4\n// Stepper myStepper(2048, pin1, pin3, pin2, pin4)\n$1`
                );
            }
            processedCode = processedCode.replace(/(void\s+setup\s*\(\s*\)\s*\{)/, '$1\n  __lf_setup_wifi();');
            const sketchCode = GPIO_MONITOR_HEADER + '\n' + processedCode;

            const { target, buildDir } = await this.runPioBuild(sketchCode, fqbn, projectDir, {
                mergeBinaries: true,
                timeoutMs: 300_000,
            });

            const files = listPioBuildFiles(projectDir, target.board);

            // PIO (espressif32) emits firmware.merged.bin when board_build.merge_binaries = yes
            const mergedReady = files.find(f => f === 'firmware.merged.bin');
            let finalBinPath: string;

            if (mergedReady) {
                finalBinPath = path.join(buildDir, mergedReady);
            } else {
                const binFile = files.find(f => f === 'firmware.bin')
                    ?? files.find(f => f.endsWith('.bin') && !f.includes('bootloader') && !f.includes('partition'));

                if (!binFile) {
                    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) { }
                    return { success: false, error: `ESP32 compiled but no .bin found. Files: ${files.join(', ')}` };
                }

                const appBinPath = path.join(buildDir, binFile);
                const mergedPath = path.join(tempDir, 'flash_image.bin');
                try {
                    this.buildMergedFlashImage(buildDir, appBinPath, mergedPath);
                } catch (mergeErr: any) {
                    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) { }
                    return { success: false, error: `Flash image merge failed: ${mergeErr.message}` };
                }
                finalBinPath = mergedPath;
            }

            return { success: true, binPath: finalBinPath };
        } catch (err: any) {
            try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) { }
            return { success: false, error: err.message };
        }
    }

    /**
     * Merges the three ESP32 flash regions into a single raw image for ESP32-C3 simulation.
     */
    private buildMergedFlashImage(
        buildDir: string,
        appBinPath: string,
        outPath: string,
    ): void {
        const FLASH_SIZE = 4 * 1024 * 1024; // 4 MB
        const BOOTLOADER_OFFSET = 0x1000;
        const PARTITIONS_OFFSET = 0x8000;
        const APP_OFFSET = 0x10000;

        const image = Buffer.alloc(FLASH_SIZE, 0xff);

        // ── Bootloader ──
        const bootPath = path.join(buildDir, 'bootloader.bin');
        if (fs.existsSync(bootPath)) {
            const bootBin = fs.readFileSync(bootPath);
            if (BOOTLOADER_OFFSET + bootBin.length > PARTITIONS_OFFSET) {
                throw new Error(`Bootloader too large: ${bootBin.length} bytes overflows partition table region`);
            }
            bootBin.copy(image, BOOTLOADER_OFFSET);
            console.log(`[FORGE UPLOADER] Bootloader @ 0x${BOOTLOADER_OFFSET.toString(16)}: ${bootBin.length} bytes`);
        } else {
            console.log(`[FORGE UPLOADER] No bootloader.bin found — region left as 0xFF (erased)`);
        }

        // ── Partition table ──
        const partPath = path.join(buildDir, 'partitions.bin');
        if (fs.existsSync(partPath)) {
            const partBin = fs.readFileSync(partPath);
            if (PARTITIONS_OFFSET + partBin.length > APP_OFFSET) {
                throw new Error(`Partition table too large: ${partBin.length} bytes overflows app region`);
            }
            partBin.copy(image, PARTITIONS_OFFSET);
            console.log(`[FORGE UPLOADER] Partitions @ 0x${PARTITIONS_OFFSET.toString(16)}: ${partBin.length} bytes`);
        } else {
            console.log(`[FORGE UPLOADER] No partitions.bin found — region left as 0xFF (erased)`);
        }

        // ── Application binary ──
        const appBin = fs.readFileSync(appBinPath);
        if (APP_OFFSET + appBin.length > FLASH_SIZE) {
            throw new Error(`App binary too large: ${appBin.length} bytes exceeds 4 MB flash`);
        }
        appBin.copy(image, APP_OFFSET);
        console.log(`[FORGE UPLOADER] App @ 0x${APP_OFFSET.toString(16)}: ${appBin.length} bytes`);

        fs.writeFileSync(outPath, image);
        console.log(`[FORGE UPLOADER] ✓ Merged flash image: ${outPath} (${(FLASH_SIZE / 1024 / 1024).toFixed(0)} MB)`);
    }

    /** Convert a raw binary Buffer to Intel HEX format for the ESP32Engine parser */
    private binToIntelHex(buf: Buffer): string {
        const RECORD_SIZE = 16;
        let hex = '';
        for (let offset = 0; offset < buf.length; offset += RECORD_SIZE) {
            const chunk = buf.slice(offset, Math.min(offset + RECORD_SIZE, buf.length));
            const len = chunk.length;
            const addr = offset & 0xFFFF;
            // Extended Linear Address record every 64KB boundary
            if (offset > 0 && (offset & 0xFFFF) === 0) {
                const seg = (offset >> 16) & 0xFFFF;
                const segHi = (seg >> 8) & 0xFF;
                const segLo = seg & 0xFF;
                const segChk = (0x100 - ((2 + 0 + 4 + segHi + segLo) & 0xFF)) & 0xFF;
                hex += `:02000004${segHi.toString(16).padStart(2, '0').toUpperCase()}${segLo.toString(16).padStart(2, '0').toUpperCase()}${segChk.toString(16).padStart(2, '0').toUpperCase()}\n`;
            }
            let sum = len + ((addr >> 8) & 0xFF) + (addr & 0xFF);
            let data = '';
            for (let i = 0; i < len; i++) {
                sum += chunk[i];
                data += chunk[i].toString(16).padStart(2, '0').toUpperCase();
            }
            const chk = (0x100 - (sum & 0xFF)) & 0xFF;
            hex += `:${len.toString(16).padStart(2, '0').toUpperCase()}${addr.toString(16).padStart(4, '0').toUpperCase()}00${data}${chk.toString(16).padStart(2, '0').toUpperCase()}\n`;
        }
        hex += ':00000001FF\n';
        return hex;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // LIBRARY MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════

    async searchLibraries(query: string) {
        try {
            const searchTerm = query.trim().toLowerCase();

            // ── Phase 1: Check Featured/Cache ─────────────────────────────
            if (!searchTerm) {
                return { libraries: FEATURED_LIBRARIES };
            }

            const cache = this.getSearchCache();
            if (cache[searchTerm]) {
                console.log(`[FORGE UPLOADER] Cache HIT for search: "${searchTerm}"`);
                return { libraries: cache[searchTerm] };
            }

            // ── Phase 2: PlatformIO Registry API ──────────────────────────
            console.log(`[FORGE UPLOADER] Searching PlatformIO registry for: "${searchTerm}"`);
            const results = await searchRegistry(searchTerm);
            const flattened = results.map((lib: RegistryLibrary) => ({
                name: lib.name,
                author: lib.author,
                version: lib.version,
                sentence: lib.sentence,
                website: lib.website || '',
            }));

            // Save to cache
            cache[searchTerm] = flattened;
            this.saveSearchCache(cache);

            return { libraries: flattened };
        } catch (error: any) {
            console.error('Library search failed:', error);
            return { libraries: [] };
        }
    }

    async installLibrary(libName: string) {
        try {
            const pioPath = await this.getPioPath();
            const libsFolder = this.getLibrariesPath();

            console.log(`[FORGE-LIB] Installing "${libName}" to forge-lib/libraries...`);

            const ok = await pkgInstallLibrary(libName, libsFolder, this.pioOptions({ binPath: pioPath }));
            if (!ok) return { success: false, error: `pio pkg install failed for "${libName}"` };

            // Record in manifest
            const manifest = this.getForgeLibManifest();
            if (!manifest.libraries.some((l) => l.name === libName)) {
                manifest.libraries.push({
                    name: libName,
                    version: 'latest',
                    cachedAt: new Date().toISOString(),
                });
                this.updateForgeLibManifest(manifest);
            }

            return { success: true };
        } catch (error: any) {
            console.error('Library installation failed:', error);
            return { success: false, error: error.message };
        }
    }

    async getInstalledLibraries(): Promise<any[]> {
        const libsDir = this.getLibrariesPath();
        if (!fs.existsSync(libsDir)) return [];

        try {
            const folders = fs.readdirSync(libsDir, { withFileTypes: true })
                .filter(d => d.isDirectory())
                .map(d => d.name);

            const results = [];
            for (const folder of folders) {
                const propsPath = path.join(libsDir, folder, 'library.properties');
                if (fs.existsSync(propsPath)) {
                    const content = fs.readFileSync(propsPath, 'utf-8');
                    results.push({
                        name: folder,
                        author: content.match(/^author\s*=\s*(.+)$/m)?.[1]?.trim() || 'Unknown',
                        version: content.match(/^version\s*=\s*(.+)$/m)?.[1]?.trim() || 'Unknown',
                        description: content.match(/^sentence\s*=\s*(.+)$/m)?.[1]?.trim() || 'No description',
                        isInstalled: true
                    });
                }
            }
            return results;
        } catch (error) {
            return [];
        }
    }

    async uninstallLibrary(libName: string) {
        try {
            const pioPath = await this.getPioPath();
            const libsFolder = this.getLibrariesPath();

            console.log(`[FORGE-LIB] Uninstalling "${libName}" from forge-lib...`);

            // Primary: remove the installed folder (source of truth for the UI).
            const libDir = path.join(libsFolder, libName);
            if (fs.existsSync(libDir)) {
                fs.rmSync(libDir, { recursive: true, force: true });
            } else {
                // Fallback: remove any folder whose library.properties matches.
                for (const folder of fs.readdirSync(libsFolder, { withFileTypes: true })
                    .filter(d => d.isDirectory()).map(d => d.name)) {
                    const propsPath = path.join(libsFolder, folder, 'library.properties');
                    if (fs.existsSync(propsPath)) {
                        const propsName = fs.readFileSync(propsPath, 'utf-8').match(/^name\s*=\s*(.+)$/m)?.[1]?.trim();
                        if (propsName === libName) {
                            fs.rmSync(path.join(libsFolder, folder), { recursive: true, force: true });
                            break;
                        }
                    }
                }
            }

            // Best-effort: remove any registry copy.
            await pkgUninstallLibrary(libName, this.pioOptions({ binPath: pioPath }));

            const manifest = this.getForgeLibManifest();
            manifest.libraries = manifest.libraries.filter((l) => l.name !== libName);
            this.updateForgeLibManifest(manifest);

            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
}