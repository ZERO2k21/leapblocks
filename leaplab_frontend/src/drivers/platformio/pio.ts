/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 *
 * PlatformIO CLI wrapper — the single spawn point for `pio`.
 * PlatformIO Core is Apache-2.0 licensed and safe for commercial use.
 */

import { spawn } from 'child_process';

export interface PioResult {
    stdout: string;
    stderr: string;
    code: number;
}

export interface PioRunOptions {
    /** Explicit binary path (Electron bundled pio.exe). Default: PIO_CLI_PATH env or `pio` on PATH. */
    binPath?: string;
    /** Working directory (usually the generated project dir). */
    cwd?: string;
    /** Kill the process after this many ms. */
    timeoutMs?: number;
    /** Extra environment variables. */
    env?: Record<string, string>;
}

/** Resolve the pio binary for server-side (non-Electron) use. */
export function resolvePioBinary(): string {
    return process.env.PIO_CLI_PATH || 'pio';
}

export function runPio(args: string[], options: PioRunOptions = {}): Promise<PioResult> {
    const binPath = options.binPath || resolvePioBinary();
    const timeoutMs = options.timeoutMs ?? 120_000;

    return new Promise((resolve) => {
        let stdout = '', stderr = '';
        let settled = false;
        const done = (result: PioResult) => { if (!settled) { settled = true; resolve(result); } };

        let proc;
        try {
            proc = spawn(binPath, args, {
                cwd: options.cwd,
                env: { ...process.env, ...options.env },
                windowsHide: true,
            });
        } catch (err: any) {
            done({ stdout: '', stderr: err?.message || 'Failed to spawn pio', code: -1 });
            return;
        }

        const timer = setTimeout(() => {
            if (proc.pid) {
                if (process.platform === 'win32') {
                    try {
                        const { execSync } = require('child_process');
                        execSync(`taskkill /F /T /PID ${proc.pid}`, { stdio: 'ignore' });
                    } catch {
                        try { proc.kill('SIGTERM'); } catch { /* already dead */ }
                    }
                } else {
                    try { proc.kill('SIGTERM'); } catch { /* already dead */ }
                }
            }
            done({ stdout, stderr: `[TIMEOUT] Process killed after ${timeoutMs}ms\n${stderr}`, code: -1 });
        }, timeoutMs);
        timer.unref?.();

        proc.stdout.on('data', (d: Buffer) => { stdout += d.toString(); });
        proc.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });
        proc.on('close', (code) => {
            clearTimeout(timer);
            done({ stdout, stderr, code: code ?? -1 });
        });
        proc.on('error', (err) => {
            clearTimeout(timer);
            done({ stdout: '', stderr: err.message, code: -1 });
        });
    });
}

/** `pio --version` — returns the version string or null. */
export async function pioVersion(binPath?: string): Promise<string | null> {
    const { stdout, code } = await runPio(['--version'], { binPath, timeoutMs: 30_000 });
    if (code !== 0) return null;
    const match = stdout.match(/PlatformIO Core, version\s+([^\s]+)/i) || stdout.match(/version\s+([^\s]+)/i);
    return match ? match[1] : stdout.trim().split('\n')[0] || null;
}

/**
 * Ensure a platform (e.g. `atmelavr`, `espressif32`) is installed.
 * `pio platform install` is idempotent — exits 0 when already installed.
 * Note: `pio run` also auto-installs platforms declared in platformio.ini.
 */
export async function platformEnsure(name: string, options: PioRunOptions = {}): Promise<boolean> {
    const { code, stderr } = await runPio(['platform', 'install', name], {
        ...options,
        timeoutMs: options.timeoutMs ?? 1_800_000,
    });
    if (code !== 0) {
        console.warn(`[PIO] platform install ${name} failed:`, stderr.slice(-1000));
    }
    return code === 0;
}

/**
 * Install an Arduino library into a custom storage dir (forge-lib/libraries).
 * Keeps the existing forge-lib library cache layout intact.
 */
export async function pkgInstallLibrary(name: string, storageDir?: string, options: PioRunOptions = {}): Promise<boolean> {
    const args = ['pkg', 'install', '--library', name];
    if (storageDir) args.push('--storage-dir', storageDir);
    const { code, stderr } = await runPio(args, { ...options, timeoutMs: options.timeoutMs ?? 180_000 });
    if (code !== 0) {
        console.warn(`[PIO] pkg install "${name}" failed:`, stderr.slice(-800));
    }
    return code === 0;
}

/** Best-effort global uninstall; the caller also removes the forge-lib folder. */
export async function pkgUninstallLibrary(name: string, options: PioRunOptions = {}): Promise<void> {
    const { code, stderr } = await runPio(['pkg', 'uninstall', '--global', name], {
        ...options,
        timeoutMs: 120_000,
    });
    if (code !== 0) {
        console.warn(`[PIO] pkg uninstall "${name}" warning:`, stderr.slice(-500));
    }
}