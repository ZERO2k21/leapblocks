/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import { BrowserWindow, app } from 'electron';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export class PythonManager {
    private mainWindow: BrowserWindow | null = null;
    private currentProcess: ChildProcessWithoutNullStreams | null = null;
    private replProcess: ChildProcessWithoutNullStreams | null = null;

    constructor(mainWindow: BrowserWindow | null) {
        this.mainWindow = mainWindow;
    }

    public setWindow(window: BrowserWindow | null) {
        this.mainWindow = window;
    }

    public async runCode(code: string) {
        this.stopProcess(this.currentProcess);
        
        // Write code to a temp file
        const tempPath = path.join(app.getPath('temp'), 'leapblocks_temp.py');
        fs.writeFileSync(tempPath, code);

        // Run with unbuffered output (-u) so print() streams immediately
        this.currentProcess = spawn('python', ['-u', tempPath]);
        this.pipeProcess(this.currentProcess, 'python-output', 'python-error', 'python-exit');
    }

    public async startRepl() {
        this.stopProcess(this.replProcess);
        
        // Python -i runs interactive REPL
        // We use -u for unbuffered output to ensure instant streaming
        this.replProcess = spawn('python', ['-i', '-u']);
        this.pipeProcess(this.replProcess, 'python-repl-output', 'python-repl-error', 'python-repl-exit');
    }

    public sendInput(input: string) {
        if (this.currentProcess && this.currentProcess.stdin) {
            this.currentProcess.stdin.write(input + '\n');
        }
    }

    public sendRepl(input: string) {
        if (this.replProcess && this.replProcess.stdin) {
            this.replProcess.stdin.write(input + '\n');
        }
    }

    public stopAll() {
        this.stopProcess(this.currentProcess);
        this.stopProcess(this.replProcess);
    }

    public async installPipPackage(packageName: string) {
        const p = spawn('python', ['-m', 'pip', 'install', packageName]);
        this.pipeProcess(p, 'python-pip-output', 'python-pip-error', 'python-pip-exit');
    }

    private stopProcess(proc: ChildProcessWithoutNullStreams | null) {
        if (proc) {
            try {
                // Kill process tree on Windows using taskkill to stop infinite loops safely
                if (process.platform === 'win32') {
                    spawn('taskkill', ['/pid', proc.pid?.toString() || '', '/f', '/t']);
                } else {
                    proc.kill('SIGKILL');
                }
            } catch (e) {
                console.error("Failed to kill python process:", e);
            }
        }
    }

    private pipeProcess(proc: ChildProcessWithoutNullStreams, outEvent: string, errEvent: string, exitEvent: string) {
        proc.stdout.on('data', (data) => {
            this.mainWindow?.webContents.send(outEvent, data.toString());
        });

        proc.stderr.on('data', (data) => {
            this.mainWindow?.webContents.send(errEvent, data.toString());
        });

        proc.on('close', (code) => {
            this.mainWindow?.webContents.send(exitEvent, code);
        });

        proc.on('error', (err) => {
            console.error(`[PythonManager] Process error:`, err.message);
            this.mainWindow?.webContents.send(errEvent, `Failed to start Python: ${err.message}`);
            this.mainWindow?.webContents.send(exitEvent, null);
        });
    }
}
