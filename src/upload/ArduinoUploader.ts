import { BrowserWindow } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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
            return { success: true };
        } catch (error) {
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
                    return p;
                }
            }
            throw new Error('arduino-cli not found. Please install it.');
        }
    }

    async searchLibraries(query: string) {
        try {
            const arduinoCliPath = await this.getArduinoCliPath();
            // If query is empty, use a broad default search term to show "Featured" libraries
            const searchTerm = query.trim() || 'arduino';
            
            // USE maxBuffer and omit-releases-details to prevent crashes and keep it fast
            const { stdout } = await execAsync(`"${arduinoCliPath}" lib search "${searchTerm}" --format json --omit-releases-details`, { 
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

            if (!fs.existsSync(libsDir)) {
                fs.mkdirSync(libsDir, { recursive: true });
            }

            // Arduino-cli lib download downloads to a default staging area.
            // We want to extract it to projectPath/libs.
            // A simpler way with arduino-cli is:
            // 1. Download the zip
            // 2. Extract to destination

            // First, update index to find the zip
            await execAsync(`"${arduinoCliPath}" lib update-index`);

            // Download to a temporary location
            const tempDir = path.join(os.tmpdir(), 'leapblocks_lib_dl');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

            await execAsync(`"${arduinoCliPath}" lib download "${libName}" --dest-dir "${tempDir}"`);

            // Find the downloaded zip
            const files = fs.readdirSync(tempDir);
            const zipFile = files.find(f => f.endsWith('.zip'));

            if (!zipFile) throw new Error('Downloaded library zip not found');

            const zipPath = path.join(tempDir, zipFile);

            // Extract using adm-zip
            const AdmZip = require('adm-zip');
            const zip = new AdmZip(zipPath);
            zip.extractAllTo(libsDir, true);

            // Cleanup zip
            fs.unlinkSync(zipPath);

            return { success: true };
        } catch (error: any) {
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

