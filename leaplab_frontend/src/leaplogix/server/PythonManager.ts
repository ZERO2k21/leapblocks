/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import { BrowserWindow, app } from 'electron';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { ensurePython } from '../../utils/ensurePython';
import { logToFile } from '../../utils/fileLogger';

export class PythonManager {
    private mainWindow: BrowserWindow | null = null;
    private currentProcess: ChildProcessWithoutNullStreams | null = null;
    private replProcess: ChildProcessWithoutNullStreams | null = null;
    private shellProcess: ChildProcessWithoutNullStreams | null = null;
    private resolvedPythonPath: string | null = null;

    constructor(mainWindow: BrowserWindow | null) {
        this.mainWindow = mainWindow;
    }

    /**
     * Resolve the Python executable. Uses a fast check first (no download),
     * then falls back to ensurePython() which downloads on demand.
     * The resolved path is cached so subsequent calls are instant.
     */
    private async resolvePython(): Promise<string> {
        // Fast path: already resolved in this session
        if (this.resolvedPythonPath && fs.existsSync(this.resolvedPythonPath)) {
            return this.resolvedPythonPath;
        }

        // Use ensurePython() for ALL resolution — it checks system PATH,
        // cached download (with pip verification), and downloads if needed.
        // This ensures pip is always verified before returning.
        this.mainWindow?.webContents.send('python-download-progress', {
            status: 'checking',
            message: 'Checking Python availability...',
        });

        try {
            const pyPath = await ensurePython((msg) => {
                this.mainWindow?.webContents.send('python-download-progress', {
                    status: 'downloading',
                    message: msg,
                });
            });
            this.resolvedPythonPath = pyPath;
            this.mainWindow?.webContents.send('python-download-progress', {
                status: 'ready',
                message: 'Python ready',
            });
            return pyPath;
        } catch (err: any) {
            this.mainWindow?.webContents.send('python-download-progress', {
                status: 'error',
                message: err.message || 'Failed to install Python',
            });
            // Last resort: try bare 'python' and hope for the best
            return 'python';
        }
    }

    /**
     * Synchronous getter — returns the resolved path or falls back to 'python'.
     * Use only when an async resolvePython() is not practical.
     */
    private getPythonExecutableSync(): string {
        if (this.resolvedPythonPath && fs.existsSync(this.resolvedPythonPath)) {
            return this.resolvedPythonPath;
        }
        if (process.resourcesPath) {
            const bundled = path.join(process.resourcesPath, 'python', 'python.exe');
            if (fs.existsSync(bundled)) return bundled;
        }
        return 'python';
    }

    public setWindow(window: BrowserWindow | null) {
        this.mainWindow = window;
    }

    public async checkPython(): Promise<{ available: boolean; version?: string; error?: string }> {
        const pyExe = await this.resolvePython();
        return new Promise((resolve) => {
            const proc = spawn(pyExe, ['--version']);
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
        const pyExe = await this.resolvePython();

        try {
            this.currentProcess = spawn(pyExe, ['-u', tempPath], { cwd: workDir });
            this.pipeProcess(this.currentProcess, 'python-output', 'python-error', 'python-exit', workDir, filesBefore);
        } catch (err) {
            this.mainWindow?.webContents.send('python-error', `Failed to start Python: ${(err as Error).message}`);
            this.mainWindow?.webContents.send('python-exit', null);
        }
    }

    public async startRepl() {
        this.stopProcess(this.replProcess);
        const pyExe = await this.resolvePython();
        this.replProcess = spawn(pyExe, ['-i', '-u']);
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
        this.stopProcess(this.shellProcess);
        this.shellProcess = null;
    }

    public async installPipPackage(packageName: string) {
        const pyExe = await this.resolvePython();
        const p = spawn(pyExe, ['-m', 'pip', 'install', packageName]);
        this.pipeProcess(p, 'python-pip-output', 'python-pip-error', 'python-pip-exit');
    }

    public async runShellCommand(command: string) {
        this.stopProcess(this.shellProcess);

        const pyExe = await this.resolvePython();
        const pyDir = path.dirname(pyExe);
        const workDir = path.join(app.getPath('temp'), 'leapblocks_project');
        if (!fs.existsSync(workDir)) {
            fs.mkdirSync(workDir, { recursive: true });
        }

        const isWin = process.platform === 'win32';
        const shell = isWin ? 'cmd.exe' : 'bash';
        const shellArgs = isWin ? ['/c', command] : ['-c', command];

        const env = {
            ...process.env,
            PATH: `${pyDir};${pyDir}\\Scripts;${process.env.PATH || ''}`,
            PYTHONIOENCODING: 'utf-8',
        };

        try {
            this.shellProcess = spawn(shell, shellArgs, { cwd: workDir, env, shell: false });
            this.shellProcess.stdout.on('data', (data) => {
                const text = data.toString();
                this.mainWindow?.webContents.send('python-shell-output', text);
                logToFile('python-shell-output', text);
            });
            this.shellProcess.stderr.on('data', (data) => {
                const text = data.toString();
                this.mainWindow?.webContents.send('python-shell-error', text);
                logToFile('python-shell-error', text);
            });
            this.shellProcess.on('close', (code) => {
                this.mainWindow?.webContents.send('python-shell-exit', code);
                logToFile('python-shell-exit', `exit code: ${code}`);
            });
            this.shellProcess.on('error', (err) => {
                console.error(`[PythonManager] Shell error:`, err.message);
                this.mainWindow?.webContents.send('python-shell-error', `Failed to start shell: ${err.message}`);
                this.mainWindow?.webContents.send('python-shell-exit', null);
                logToFile('python-shell-error', `Failed to start shell: ${err.message}`);
            });
        } catch (err) {
            this.mainWindow?.webContents.send('python-shell-error', `Failed to start shell: ${(err as Error).message}`);
            this.mainWindow?.webContents.send('python-shell-exit', null);
            logToFile('python-shell-error', `Failed to start shell: ${(err as Error).message}`);
        }
    }

    public stopShell() {
        this.stopProcess(this.shellProcess);
        this.shellProcess = null;
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
            const text = data.toString();
            this.mainWindow?.webContents.send(outEvent, text);
            logToFile(outEvent, text);
        });

        proc.stderr.on('data', (data) => {
            const text = data.toString();
            this.mainWindow?.webContents.send(errEvent, text);
            logToFile(errEvent, text);
        });

        proc.on('close', (code) => {
            if (workDir && filesBefore && exitEvent === 'python-exit') {
                const modifiedFiles = this.collectModifiedFiles(workDir, filesBefore);
                if (Object.keys(modifiedFiles).length > 0) {
                    this.mainWindow?.webContents.send('python-files-updated', modifiedFiles);
                }
            }
            this.mainWindow?.webContents.send(exitEvent, code);
            logToFile(exitEvent, `exit code: ${code}`);
        });

        proc.on('error', (err) => {
            console.error(`[PythonManager] Process error:`, err.message);
            this.mainWindow?.webContents.send(errEvent, `Failed to start Python: ${err.message}`);
            this.mainWindow?.webContents.send(exitEvent, null);
            logToFile(errEvent, `Failed to start Python: ${err.message}`);
        });
    }
}
