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
            let arduinoCliPath = 'arduino-cli';

            this.sendProgress(5, 'Checking for arduino-cli...');

            try {
                await execAsync('arduino-cli version');
                this.sendProgress(8, 'Arduino CLI found in PATH');
            } catch {
                this.sendProgress(6, 'Searching for arduino-cli...');
                const possiblePaths = [
                    path.join(process.cwd(), 'arduino-cli', 'arduino-cli.exe'),
                    path.join(os.homedir(), 'AppData', 'Local', 'Arduino15', 'arduino-cli.exe'),
                    'C:\\Program Files\\Arduino CLI\\arduino-cli.exe',
                    'C:\\arduino-cli\\arduino-cli.exe',
                ];

                let found = false;
                for (const p of possiblePaths) {
                    if (fs.existsSync(p)) {
                        arduinoCliPath = p;
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    return {
                        success: false,
                        error: 'arduino-cli not found. Please install it.',
                    };
                }
                this.sendProgress(8, 'Arduino CLI located');
            }

            // ── Phase 2: Saving sketch (10–25%) ──
            this.sendProgress(10, 'Preparing sketch directory...');
            const sketchDir = path.join(process.cwd(), 'leapblocks_sketch');
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
                await execAsync(`"${arduinoCliPath}" compile --fqbn ${fqbn} "${sketchDir}"`, { timeout: 120000 });
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
}
