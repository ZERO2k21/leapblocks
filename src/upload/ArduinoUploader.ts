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
     * Returns the path to the shared forge-lib cache directory.
     * Located at: {userData}/forge-lib/
     */
    getForgeLibCachePath(): string {
        const cachePath = path.join(app.getPath('userData'), 'forge-lib');
        if (!fs.existsSync(cachePath)) {
            fs.mkdirSync(cachePath, { recursive: true });
        }
        return cachePath;
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

    async upload(code: string, port: string, fqbn: string, libraryPath?: string) {
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
                let compileCmd = `"${arduinoCliPath}" compile --fqbn ${fqbn} "${sketchDir}"`;
                if (libraryPath && fs.existsSync(libraryPath)) {
                    compileCmd += ` --libraries "${libraryPath}"`;
                }
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

    async compileForSimulation(code: string, fqbn: string, libraryPath?: string): Promise<{ success: boolean; hexContent?: string; error?: string }> {
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

                let compileCmd = `"${arduinoCliPath}" compile --fqbn ${fqbn} --export-binaries --build-path "${buildPath}" "${sketchDir}"`;
                if (libraryPath && fs.existsSync(libraryPath)) {
                    compileCmd += ` --libraries "${libraryPath}"`;
                }

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
                console.log('[FORGE UPLOADER] Returning FEATURED_LIBRARIES');
                return { libraries: FEATURED_LIBRARIES };
            }

            const cache = this.getSearchCache();
            if (cache[searchTerm]) {
                console.log(`[FORGE UPLOADER] Cache HIT for search: "${searchTerm}"`);
                return { libraries: cache[searchTerm] };
            }

            const arduinoCliPath = await this.getArduinoCliPath();

            // USE maxBuffer and omit-releases-details to prevent crashes and keep it fast
            const cmd = `"${arduinoCliPath}" lib search "${searchTerm}" --format json --omit-releases-details`;
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

    async installLibrary(libName: string, projectPath: string) {
        try {
            const arduinoCliPath = await this.getArduinoCliPath();
            const libsDir = path.join(projectPath, 'libs');
            const fsExtra = require('fs-extra');

            if (!fs.existsSync(libsDir)) {
                fs.mkdirSync(libsDir, { recursive: true });
            }

            // ── Step 1: Check forge-lib cache first ───────────────────────
            const cachePath = this.getForgeLibCachePath();
            const cachedLibPath = path.join(cachePath, libName);

            if (fs.existsSync(cachedLibPath)) {
                console.log(`[FORGE-LIB] Cache HIT for "${libName}" — copying from cache`);
                const destPath = path.join(libsDir, libName);
                await fsExtra.copy(cachedLibPath, destPath, { overwrite: true });
                return { success: true, cached: true };
            }

            console.log(`[FORGE-LIB] Cache MISS for "${libName}" — downloading via arduino-cli`);

            // ── Step 2: Download via arduino-cli (existing flow) ──────────
            // Throttled Index Update: Only run once every 24 hours
            const manifest = this.getForgeLibManifest();
            const now = Date.now();
            const oneDayMs = 24 * 60 * 60 * 1000;
            
            if (!manifest.lastIndexUpdate || (now - manifest.lastIndexUpdate > oneDayMs)) {
                console.log('[FORGE-LIB] Updating library index (Throttled)...');
                await execAsync(`"${arduinoCliPath}" lib update-index`);
                manifest.lastIndexUpdate = now;
                this.updateForgeLibManifest(manifest);
            } else {
                console.log('[FORGE-LIB] Skipping library index update (Already updated recently).');
            }

            // Create a temporary staging area for the installation
            const tempUserDir = path.join(os.tmpdir(), `leapblocks_install_${Date.now()}`);
            if (!fs.existsSync(tempUserDir)) fs.mkdirSync(tempUserDir, { recursive: true });

            try {
                // Install the library into the temporary user directory
                const env = { ...process.env, ARDUINO_DIRECTORIES_USER: tempUserDir };
                await execAsync(`"${arduinoCliPath}" lib install "${libName}"`, { env });

                // Find the installed library folder
                const installedLibsPath = path.join(tempUserDir, 'libraries');
                if (!fs.existsSync(installedLibsPath)) {
                    throw new Error('Library installation failed: directory not created');
                }

                const libFolders = fs.readdirSync(installedLibsPath);

                // Move all downloaded libraries to the project libs/ folder
                // AND copy them into the forge-lib cache
                for (const folder of libFolders) {
                    const sourcePath = path.join(installedLibsPath, folder);
                    const destPath = path.join(libsDir, folder);
                    const cacheDestPath = path.join(cachePath, folder);

                    // Move to project
                    await fsExtra.copy(sourcePath, destPath, { overwrite: true });

                    // Save to forge-lib cache
                    await fsExtra.copy(sourcePath, cacheDestPath, { overwrite: true });
                    console.log(`[FORGE-LIB] Cached "${folder}" to forge-lib/`);
                }

                // ── Step 3: Update manifest.json ──────────────────────────
                const manifest = this.getForgeLibManifest();
                for (const folder of libFolders) {
                    // Try to read version from library.properties if available
                    let version = 'unknown';
                    const propsPath = path.join(cachePath, folder, 'library.properties');
                    if (fs.existsSync(propsPath)) {
                        const propsContent = fs.readFileSync(propsPath, 'utf-8');
                        const versionMatch = propsContent.match(/^version\s*=\s*(.+)$/m);
                        if (versionMatch) version = versionMatch[1].trim();
                    }

                    // Upsert entry in manifest
                    const existingIdx = manifest.libraries.findIndex(
                        (e) => e.name.toLowerCase() === folder.toLowerCase()
                    );
                    const entry = {
                        name: folder,
                        version,
                        cachedAt: new Date().toISOString(),
                    };
                    if (existingIdx >= 0) {
                        manifest.libraries[existingIdx] = entry;
                    } else {
                        manifest.libraries.push(entry);
                    }
                }
                this.updateForgeLibManifest(manifest);

                return { success: true, cached: false };
            } finally {
                // Cleanup temp directory
                await fsExtra.remove(tempUserDir);
            }
        } catch (error: any) {
            console.error('Library installation failed:', error);
            return { success: false, error: error.message };
        }
    }

    async listProjectLibraries(projectPath: string) {
        const libsDir = path.join(projectPath, 'libs');
        if (!fs.existsSync(libsDir)) return [];

        try {
            const dirs = fs.readdirSync(libsDir, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);
            return dirs;
        } catch (error) {
            return [];
        }
    }

    async uninstallLibrary(libName: string, projectPath: string) {
        try {
            const libsDir = path.join(projectPath, 'libs');
            const libPath = path.join(libsDir, libName);

            if (fs.existsSync(libPath)) {
                // Recursively delete the library folder
                fs.rmSync(libPath, { recursive: true, force: true });
                return { success: true };
            }
            return { success: false, error: 'Library folder not found' };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
}

