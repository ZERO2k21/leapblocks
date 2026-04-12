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
        try {
            const arduinoCliPath = await this.getArduinoCliPath();

            const sketchDir = path.join(os.tmpdir(), 'leapblocks_sketch');
            const sketchFile = path.join(sketchDir, 'leapblocks_sketch.ino');

            if (!fs.existsSync(sketchDir)) {
                fs.mkdirSync(sketchDir, { recursive: true });
            }

            fs.writeFileSync(sketchFile, code, 'utf-8');

            try {
                const buildPath = path.join(sketchDir, 'build');
                if (!fs.existsSync(buildPath)) {
                    fs.mkdirSync(buildPath, { recursive: true });
                }

                const libsFolder = this.getLibrariesPath();
                let compileCmd = `"${arduinoCliPath}" compile --fqbn ${fqbn} --export-binaries --build-path "${buildPath}" --libraries "${libsFolder}" "${sketchDir}"`;

                console.log(`[FORGE UPLOADER] Running compile for simulation: ${compileCmd}`);
                await execAsync(compileCmd, { timeout: 120000 });

                // The hex file is usually named sketch_name.ino.hex OR sketch_name.ino.with_bootloader.hex
                const hexFilePath = path.join(buildPath, 'leapblocks_sketch.ino.hex');
                if (fs.existsSync(hexFilePath)) {
                    const hexContent = fs.readFileSync(hexFilePath, 'utf-8');
                    return { success: true, hexContent };
                } else {
                    // Try finding any .hex file in the build path
                    const files = fs.readdirSync(buildPath);
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

