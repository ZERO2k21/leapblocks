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
            this.sendProgress(5, 'Checking for arduino-cli...');
            let arduinoCliPath = 'arduino-cli';

            // Check if arduino-cli is in PATH
            try {
                await execAsync('arduino-cli version');
            } catch {
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
            }

            this.sendProgress(15, 'Saving sketch...');
            // Use a local directory instead of system temp to improve library discovery
            const sketchDir = path.join(process.cwd(), 'leapblocks_sketch');
            const sketchFile = path.join(sketchDir, 'leapblocks_sketch.ino');

            if (!fs.existsSync(sketchDir)) {
                fs.mkdirSync(sketchDir, { recursive: true });
            }
            fs.writeFileSync(sketchFile, code, 'utf-8');

            this.sendProgress(40, 'Compiling...');
            try {
                await execAsync(`"${arduinoCliPath}" compile --fqbn ${fqbn} "${sketchDir}"`, { timeout: 120000 });
            } catch (compileError: any) {
                return {
                    success: false,
                    error: `Compilation failed: ${compileError.stderr || compileError.message}`,
                };
            }

            this.sendProgress(70, 'Uploading to board...');
            try {
                await execAsync(`"${arduinoCliPath}" upload -p "${port}" --fqbn ${fqbn} "${sketchDir}"`, { timeout: 120000 });
            } catch (uploadError: any) {
                return {
                    success: false,
                    error: `Upload failed: ${uploadError.stderr || uploadError.message}`,
                };
            }

            this.sendProgress(100, 'Upload complete!');
            return { success: true };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    }
}
