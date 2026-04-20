/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import { BrowserWindow, app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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
 *
 * Algorithm:
 *   1. Parse all ledcSetup(ch, freq, res) → build chMap[ch] = {freq, res}
 *   2. Parse all ledcAttachPin(pin, ch)   → build chMap[ch].pin = pin
 *   3. Remove ledcSetup() and ledcAttachPin() lines
 *   4. Insert ledcAttach(pin, freq, res) after the last ledcAttachPin for each channel
 *   5. Replace ledcWrite(ch, duty) → ledcWrite(pin, duty) using chMap
 */
function migrateESP32LedcAPI(code: string): string {
    // Step 1 & 2: collect channel metadata
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

    // If no old-style LEDC calls found, return unchanged
    if (chMap.size === 0) return code;

    console.log('[FORGE UPLOADER] Migrating LEDC API v2 → v3:', [...chMap.entries()]);

    let result = code;

    // Step 3: remove ledcSetup() and ledcAttachPin() lines entirely
    result = result.replace(/[ \t]*ledcSetup\s*\([^)]*\)\s*;[ \t]*\n?/g, '');
    result = result.replace(/[ \t]*ledcAttachPin\s*\([^)]*\)\s*;[ \t]*\n?/g, '');

    // Step 4: insert ledcAttach() calls in setup() — add them at the start of setup body
    // Find setup() body and prepend ledcAttach calls
    const attachCalls = [...chMap.entries()]
        .filter(([, v]) => v.pin)
        .map(([, v]) => `  ledcAttach(${v.pin}, ${v.freq}, ${v.res});`)
        .join('\n');

    if (attachCalls) {
        // Insert after the opening brace of setup()
        result = result.replace(
            /(void\s+setup\s*\(\s*\)\s*\{)/,
            `$1\n${attachCalls}`
        );
    }

    // Step 5: replace ledcWrite(channel, duty) → ledcWrite(pin, duty)
    result = result.replace(/ledcWrite\s*\(\s*(\w+)\s*,\s*([^)]+)\s*\)/g, (match, ch, duty) => {
        const entry = chMap.get(ch);
        if (entry?.pin) {
            return `ledcWrite(${entry.pin}, ${duty.trim()})`;
        }
        return match; // unknown channel — leave unchanged
    });

    return result;
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
        if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
        return p;
    }

    private getArduinoCliConfigPath(): string {
        return path.join(this.getForgeLibCachePath(), 'arduino-cli.yaml');
    }

    /**
     * Ensures the arduino-cli.yaml exists and points to our centralized forge-lib.
     */
    private ensureArduinoCliConfig() {
        const configPath = this.getArduinoCliConfigPath();
        const forgePath = this.getForgeLibCachePath();

        const configContent = `
directories:
  data: ${path.join(forgePath, 'data').replace(/\\/g, '/')}
  downloads: ${path.join(forgePath, 'staging').replace(/\\/g, '/')}
  user: ${forgePath.replace(/\\/g, '/')}
`;
        fs.writeFileSync(configPath, configContent.trim(), 'utf-8');
        return configPath;
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

    async upload(code: string, port: string, fqbn: string) {
        if (!port) {
            return {
                success: false,
                error: 'No serial port selected. Please select a COM port in the menu bar.',
            };
        }
        try {
            // ── Phase 1: Initialization (0–10%) ──
            this.sendProgress(0, 'Initializing upload...');

            this.sendProgress(2, 'Preparing environment...');
            const arduinoCliPath = await this.getArduinoCliPath();

            // ── Phase 2: Saving sketch (10–25%) ──
            this.sendProgress(10, 'Preparing sketch directory...');
            const sketchDir = path.join(os.tmpdir(), 'leapblocks_sketch');
            const sketchFile = path.join(sketchDir, 'leapblocks_sketch.ino');

            if (!fs.existsSync(sketchDir)) {
                fs.mkdirSync(sketchDir, { recursive: true });
            }

            this.sendProgress(15, 'Writing sketch file...');
            fs.writeFileSync(sketchFile, code, 'utf-8');
            this.sendProgress(20, 'Sketch saved successfully');

            // ── Phase 3: Compiling (25–65%) ──
            this.sendProgress(25, 'Starting compilation...');
            this.sendProgress(30, 'Compiling code...');
            try {
                const libsFolder = this.getLibrariesPath();
                let compileCmd = `"${arduinoCliPath}" compile --fqbn ${fqbn} --libraries "${libsFolder}" "${sketchDir}"`;
                await execAsync(compileCmd, { timeout: 120000 });
                this.sendProgress(60, 'Compilation successful');
            } catch (compileError: any) {
                return {
                    success: false,
                    error: `Compilation failed: ${compileError.stderr || compileError.message}`,
                };
            }

            // ── Phase 4: Uploading (65–95%) ──
            this.sendProgress(65, 'Preparing upload...');
            this.sendProgress(70, 'Uploading to board...');
            try {
                this.sendProgress(75, 'Flashing firmware...');
                await execAsync(`"${arduinoCliPath}" upload -p "${port}" --fqbn ${fqbn} "${sketchDir}"`, { timeout: 120000 });
                this.sendProgress(95, 'Finalizing...');
            } catch (uploadError: any) {
                return {
                    success: false,
                    error: `Upload failed: ${uploadError.stderr || uploadError.message}`,
                };
            }

            // ── Phase 5: Complete (100%) ──
            this.sendProgress(100, 'Upload complete!');
            console.log(`[FORGE UPLOADER] Upload to board ${fqbn} on ${port} successful.`);
            return { success: true };
        } catch (error: any) {
            console.error(`[FORGE UPLOADER] ${fqbn} upload failed:`, error.message);
            return { success: false, error: (error as Error).message };
        }
    }

    async compileForSimulation(code: string, fqbn: string): Promise<{ success: boolean; hexContent?: string; error?: string }> {
        const isESP32 = fqbn.startsWith('esp32:');
        try {
            const arduinoCliPath = await this.getArduinoCliPath();

            const sketchDir = path.join(os.tmpdir(), 'leapblocks_sketch');
            const sketchFile = path.join(sketchDir, 'leapblocks_sketch.ino');

            if (!fs.existsSync(sketchDir)) {
                fs.mkdirSync(sketchDir, { recursive: true });
            }

            // ── ESP32 sketch preprocessing ────────────────────────────────────
            // Replace AVR-only libraries and deprecated APIs with ESP32 core v3 equivalents
            let processedCode = code;
            if (isESP32) {
                // 0. Ensure ESP32 core is installed (uses both Espressif CDN + GitHub URLs)
                await this.ensureESP32Core(arduinoCliPath);

                // 1. Servo.h → ESP32Servo.h (AVR Servo incompatible with ESP32 core v3+)
                processedCode = processedCode.replace(
                    /#include\s*[<"]Servo\.h[>"]/g,
                    '#include <ESP32Servo.h>'
                );
                await this.ensureESP32Library(arduinoCliPath, 'ESP32Servo');

                // 2. LEDC API v2 → v3 migration
                // ESP32 core v3 removed ledcSetup() and ledcAttachPin().
                // New API: ledcAttach(pin, freq, resolution) + ledcWrite(pin, duty)
                //
                // Strategy: collect ledcSetup(ch, freq, res) and ledcAttachPin(pin, ch)
                // calls, build a ch→{pin,freq,res} map, then rewrite the whole sketch.
                processedCode = migrateESP32LedcAPI(processedCode);
            }

            fs.writeFileSync(sketchFile, processedCode, 'utf-8');

            try {
                const buildPath = path.join(sketchDir, 'build');
                if (!fs.existsSync(buildPath)) {
                    fs.mkdirSync(buildPath, { recursive: true });
                }

                const libsFolder = this.getLibrariesPath();

                // For ESP32: exclude the forge-lib libraries folder if it contains AVR-only libs
                // that conflict with ESP32 core. Use arduino-cli's built-in library resolution instead.
                const libsArg = (fs.existsSync(libsFolder) && !isESP32)
                    ? `--libraries "${libsFolder}"`
                    : '';

                const compileCmd = `"${arduinoCliPath}" compile --fqbn ${fqbn} --export-binaries --build-path "${buildPath}" ${libsArg} "${sketchDir}"`;

                console.log(`[FORGE UPLOADER] Running compile for simulation: ${compileCmd}`);
                await execAsync(compileCmd, { timeout: 120000 });

                const files = fs.readdirSync(buildPath);
                console.log(`[FORGE UPLOADER] Build output files: ${files.join(', ')}`);

                if (isESP32) {
                    const binFile = files.find(f => f === 'leapblocks_sketch.ino.bin')
                        ?? files.find(f => f.endsWith('.bin') && !f.includes('bootloader') && !f.includes('partition'));
                    if (binFile) {
                        const binBuf = fs.readFileSync(path.join(buildPath, binFile));
                        const hexContent = this.binToIntelHex(binBuf);
                        return { success: true, hexContent };
                    }
                    return { success: false, error: `ESP32 compiled but no .bin found. Files: ${files.join(', ')}` };
                } else {
                    const hexFilePath = path.join(buildPath, 'leapblocks_sketch.ino.hex');
                    if (fs.existsSync(hexFilePath)) {
                        const hexContent = fs.readFileSync(hexFilePath, 'utf-8');
                        return { success: true, hexContent };
                    }
                    const hexFile = files.find(f => f.endsWith('.hex'));
                    if (hexFile) {
                        const hexContent = fs.readFileSync(path.join(buildPath, hexFile), 'utf-8');
                        return { success: true, hexContent };
                    }
                    return { success: false, error: 'Compiled successfully, but no .hex file was found.' };
                }
            } catch (compileError: any) {
                return {
                    success: false,
                    error: `Compilation failed: ${compileError.stderr || compileError.message}`,
                };
            }
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }

    /**
     * Ensure an ESP32-compatible library is installed via arduino-cli.
     * Idempotent — safe to call on every compile.
     */
    private async ensureESP32Library(arduinoCliPath: string, libName: string): Promise<void> {
        const configPath = this.getArduinoCliConfigPath();
        // Ensure config has ESP32 board manager URLs before any library install
        await this.ensureESP32BoardManagerUrls(configPath);
        try {
            const { stdout } = await execAsync(
                `"${arduinoCliPath}" lib list --config-file "${configPath}" --format json`
            );
            const installed: any[] = JSON.parse(stdout || '[]');
            const found = installed.some((l: any) =>
                (l.library?.name ?? l.name ?? '').toLowerCase() === libName.toLowerCase()
            );
            if (found) return;

            console.log(`[FORGE UPLOADER] Installing ESP32 library: ${libName}`);
            await execAsync(
                `"${arduinoCliPath}" lib install "${libName}" --config-file "${configPath}"`,
                { timeout: 60000 }
            );
            console.log(`[FORGE UPLOADER] Installed: ${libName}`);
        } catch (err: any) {
            console.warn(`[FORGE UPLOADER] Library install warning (${libName}):`, err.message);
        }
    }

    /**
     * Ensure the arduino-cli.yaml has ESP32 board manager URLs.
     * Adds both Espressif CDN and GitHub fallback URLs.
     */
    private async ensureESP32BoardManagerUrls(configPath: string): Promise<void> {
        const ESP32_URLS = [
            'https://dl.espressif.com/dl/package_esp32_index.json',
            'https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json',
        ];
        try {
            let content = fs.existsSync(configPath) ? fs.readFileSync(configPath, 'utf-8') : '';
            const hasUrls = ESP32_URLS.some(u => content.includes(u));
            if (!hasUrls) {
                const urlBlock = `\nboard_manager:\n  additional_urls:\n${ESP32_URLS.map(u => `    - ${u}`).join('\n')}\n`;
                fs.writeFileSync(configPath, content.trimEnd() + urlBlock, 'utf-8');
                console.log('[FORGE UPLOADER] Added ESP32 board manager URLs to arduino-cli.yaml');
            }
        } catch (err: any) {
            console.warn('[FORGE UPLOADER] Could not update arduino-cli.yaml:', err.message);
        }
    }

    /**
     * Ensure ESP32 arduino core is installed. Uses both Espressif CDN and GitHub URLs.
     */
    private esp32CoreReady = false;
    async ensureESP32Core(arduinoCliPath: string): Promise<void> {
        if (this.esp32CoreReady) return;
        const configPath = this.getArduinoCliConfigPath();
        await this.ensureESP32BoardManagerUrls(configPath);

        const ESP32_URLS = [
            'https://dl.espressif.com/dl/package_esp32_index.json',
            'https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json',
        ];

        try {
            const { stdout } = await execAsync(
                `"${arduinoCliPath}" core list --config-file "${configPath}" --format json`
            );
            let cores: any[] = [];
            try { cores = JSON.parse(stdout || '[]'); } catch (_) { }
            const installed = cores.some((c: any) =>
                (c.id ?? c.platform?.id ?? '').startsWith('esp32:')
            );

            if (!installed) {
                console.log('[FORGE UPLOADER] ESP32 core not found — installing...');
                await execAsync(
                    `"${arduinoCliPath}" core update-index --config-file "${configPath}" --additional-urls ${ESP32_URLS.join(',')}`,
                    { timeout: 60000 }
                );
                let ok = false;
                for (const url of ESP32_URLS) {
                    try {
                        await execAsync(
                            `"${arduinoCliPath}" core install esp32:esp32 --config-file "${configPath}" --additional-urls ${url}`,
                            { timeout: 300000 }
                        );
                        ok = true;
                        console.log(`[FORGE UPLOADER] ESP32 core installed via ${url}`);
                        break;
                    } catch (e: any) {
                        console.warn(`[FORGE UPLOADER] Install attempt failed (${url}):`, e.message);
                    }
                }
                if (!ok) console.error('[FORGE UPLOADER] All ESP32 core install attempts failed.');
            } else {
                console.log('[FORGE UPLOADER] ESP32 core already installed.');
            }
            this.esp32CoreReady = true;
        } catch (err: any) {
            console.warn('[FORGE UPLOADER] ESP32 core check warning:', err.message);
            this.esp32CoreReady = true;
        }
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

    private async getArduinoCliPath(): Promise<string> {
        try {
            await execAsync('arduino-cli version');
            return 'arduino-cli';
        } catch {
            const possiblePaths = [
                path.join(process.cwd(), 'arduino-cli', 'arduino-cli.exe'),
                path.join(os.homedir(), 'AppData', 'Local', 'Arduino15', 'arduino-cli.exe'),
                'C:\\Program Files\\Arduino CLI\\arduino-cli.exe',
                'C:\\arduino-cli\\arduino-cli.exe',
            ];

            for (const p of possiblePaths) {
                if (fs.existsSync(p)) {
                    console.log(`[FORGE UPLOADER] Found arduino-cli at: ${p}`);
                    return p;
                }
            }
            console.error('[FORGE UPLOADER] ERROR: arduino-cli not found in any common path.');
            throw new Error('arduino-cli not found. Please install it.');
        }
    }

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

            const arduinoCliPath = await this.getArduinoCliPath();
            const configPath = this.ensureArduinoCliConfig();

            // USE maxBuffer and omit-releases-details to prevent crashes and keep it fast
            const cmd = `"${arduinoCliPath}" --config-file "${configPath}" lib search "${searchTerm}" --format json --omit-releases-details`;
            console.log(`[FORGE UPLOADER] Searching libraries with: ${cmd}`);
            const { stdout } = await execAsync(cmd, {
                maxBuffer: 10 * 1024 * 1024 // 10MB buffer to prevent overflow
            });

            const dataString = stdout.substring(stdout.indexOf('{'), stdout.lastIndexOf('}') + 1);
            const data = JSON.parse(dataString);
            if (!data.libraries) return { libraries: [] };

            // FLATTEN: Map complex nested JSON to simple ArduinoLib interface for UI
            const flattened = data.libraries.map((lib: any) => {
                const latest = lib.latest || (lib.releases ? lib.releases[Object.keys(lib.releases)[0]] : null);
                return {
                    name: lib.name,
                    author: latest?.author || 'Unknown Author',
                    version: latest?.version || 'Unknown',
                    sentence: latest?.sentence || 'No description available.',
                    website: latest?.website || ''
                };
            });

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
            const arduinoCliPath = await this.getArduinoCliPath();
            const configPath = this.ensureArduinoCliConfig();

            console.log(`[FORGE-LIB] Installing "${libName}" globally to forge-lib...`);

            // Throttled Index Update
            const manifest = this.getForgeLibManifest();
            if (!manifest.lastIndexUpdate || (Date.now() - manifest.lastIndexUpdate > 24 * 60 * 60 * 1000)) {
                await execAsync(`"${arduinoCliPath}" --config-file "${configPath}" lib update-index`);
                manifest.lastIndexUpdate = Date.now();
                this.updateForgeLibManifest(manifest);
            }

            // Install globally via config-file redirection
            await execAsync(`"${arduinoCliPath}" --config-file "${configPath}" lib install "${libName}"`);

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
            const arduinoCliPath = await this.getArduinoCliPath();
            const configPath = this.ensureArduinoCliConfig();

            console.log(`[FORGE-LIB] Uninstalling "${libName}" from forge-lib...`);
            await execAsync(`"${arduinoCliPath}" --config-file "${configPath}" lib uninstall "${libName}"`);

            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
}

