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

    private getPythonExecutable(): string {
        if (process.resourcesPath) {
            const bundled = path.join(process.resourcesPath, 'python', 'python.exe');
            if (fs.existsSync(bundled)) {
                return bundled;
            }
        }
        return 'python';
    }

    public setWindow(window: BrowserWindow | null) {
        this.mainWindow = window;
    }

    public async checkPython(): Promise<{ available: boolean; version?: string; error?: string }> {
        return new Promise((resolve) => {
            const proc = spawn(this.getPythonExecutable(), ['--version']);
            let output = '';
            let errorOutput = '';

            proc.stdout.on('data', (data) => {
                output += data.toString();
            });

            proc.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            proc.on('close', (code) => {
                if (code === 0) {
                    resolve({ available: true, version: output.trim() || errorOutput.trim() });
                } else {
                    resolve({ available: false, error: errorOutput || 'Python exited with code ' + code });
                }
            });

            proc.on('error', (err) => {
                resolve({ available: false, error: err.message });
            });
        });
    }

    public async runCode(code: string, projectFiles?: Record<string, string>) {
        this.stopProcess(this.currentProcess);

        const workDir = path.join(app.getPath('temp'), 'leapblocks_project');
        if (!fs.existsSync(workDir)) {
            fs.mkdirSync(workDir, { recursive: true });
        }

        const tempPath = path.join(workDir, 'main.py');
        fs.writeFileSync(tempPath, code);

        if (projectFiles) {
            for (const [name, content] of Object.entries(projectFiles)) {
                if (name !== 'main.py') {
                    const filePath = path.join(workDir, name);
                    const dir = path.dirname(filePath);
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir, { recursive: true });
                    }
                    fs.writeFileSync(filePath, content);
                }
            }
        }

        const filesBefore = this.snapshotDirectory(workDir);

        try {
            this.currentProcess = spawn(this.getPythonExecutable(), ['-u', tempPath], { cwd: workDir });
            this.pipeProcess(this.currentProcess, 'python-output', 'python-error', 'python-exit', workDir, filesBefore);
        } catch (err) {
            this.mainWindow?.webContents.send('python-error', `Failed to start Python: ${(err as Error).message}`);
            this.mainWindow?.webContents.send('python-exit', null);
        }
    }

    public async startRepl() {
        this.stopProcess(this.replProcess);

        this.replProcess = spawn(this.getPythonExecutable(), ['-i', '-u']);
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
        const p = spawn(this.getPythonExecutable(), ['-m', 'pip', 'install', packageName]);
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

    private snapshotDirectory(dir: string): Map<string, { mtime: number; size: number }> {
        const snapshot = new Map<string, { mtime: number; size: number }>();
        try {
            const walk = (d: string, prefix: string) => {
                const entries = fs.readdirSync(d, { withFileTypes: true });
                for (const entry of entries) {
                    const fullPath = path.join(d, entry.name);
                    const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
                    if (entry.isDirectory()) {
                        walk(fullPath, relPath);
                    } else if (entry.isFile()) {
                        const stat = fs.statSync(fullPath);
                        snapshot.set(relPath, { mtime: stat.mtimeMs, size: stat.size });
                    }
                }
            };
            walk(dir, '');
        } catch (_) { /* noop */ }
        return snapshot;
    }

    private collectModifiedFiles(dir: string, filesBefore: Map<string, { mtime: number; size: number }>): Record<string, string> {
        const modified: Record<string, string> = {};
        try {
            const walk = (d: string, prefix: string) => {
                const entries = fs.readdirSync(d, { withFileTypes: true });
                for (const entry of entries) {
                    const fullPath = path.join(d, entry.name);
                    const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
                    if (entry.isDirectory()) {
                        walk(fullPath, relPath);
                    } else if (entry.isFile()) {
                        if (relPath === 'main.py') continue;
                        const stat = fs.statSync(fullPath);
                        const before = filesBefore.get(relPath);
                        if (!before || before.mtime !== stat.mtimeMs || before.size !== stat.size) {
                            try {
                                modified[relPath] = fs.readFileSync(fullPath, 'utf-8');
                            } catch (_) { /* noop */ }
                        }
                    }
                }
            };
            walk(dir, '');
        } catch (_) { /* noop */ }
        return modified;
    }

    private pipeProcess(proc: ChildProcessWithoutNullStreams, outEvent: string, errEvent: string, exitEvent: string, workDir?: string, filesBefore?: Map<string, { mtime: number; size: number }>) {
        proc.stdout.on('data', (data) => {
            this.mainWindow?.webContents.send(outEvent, data.toString());
        });

        proc.stderr.on('data', (data) => {
            this.mainWindow?.webContents.send(errEvent, data.toString());
        });

        proc.on('close', (code) => {
            if (workDir && filesBefore && exitEvent === 'python-exit') {
                const modifiedFiles = this.collectModifiedFiles(workDir, filesBefore);
                if (Object.keys(modifiedFiles).length > 0) {
                    this.mainWindow?.webContents.send('python-files-updated', modifiedFiles);
                }
            }
            this.mainWindow?.webContents.send(exitEvent, code);
        });

        proc.on('error', (err) => {
            console.error(`[PythonManager] Process error:`, err.message);
            this.mainWindow?.webContents.send(errEvent, `Failed to start Python: ${err.message}`);
            this.mainWindow?.webContents.send(exitEvent, null);
        });
    }
}
