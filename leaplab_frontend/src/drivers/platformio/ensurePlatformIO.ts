/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 *
 * PlatformIO binary resolution for the Electron app.
 * LeapBlocks ONLY uses the bundled pio.exe (built from PlatformIO Core,
 * Apache-2.0) — it never uses system-installed Python or `pio` from PATH.
 *
 * Candidate locations:
 *   packaged:  <resourcesPath>/platformio/pio.exe
 *   dev:       <appRoot>/src/drivers/platformio/pio.exe
 *   cached:    <userData>/platformio/pio.exe
 */

import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

const BINARY_NAME = process.platform === 'win32' ? 'pio.exe' : 'pio';

function getBundledPath(): string | null {
    const candidates: string[] = [];

    if ((process as any).resourcesPath) {
        candidates.push(path.join((process as any).resourcesPath, 'platformio', BINARY_NAME));
    }
    try {
        if (app?.getAppPath()) {
            candidates.push(path.join(app.getAppPath(), 'src', 'drivers', 'platformio', BINARY_NAME));
        }
    } catch { /* not in electron */ }
    candidates.push(path.join(__dirname, BINARY_NAME));

    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) return candidate;
    }
    return null;
}

function getCachedPath(): string | null {
    try {
        const userData = app?.getPath?.('userData');
        if (!userData) return null;
        const cached = path.join(userData, 'platformio', BINARY_NAME);
        return fs.existsSync(cached) ? cached : null;
    } catch {
        return null;
    }
}

/** Fast check — returns the resolved pio binary or null. */
export function getPioPathIfAvailable(): string | null {
    return getBundledPath() || getCachedPath();
}

/**
 * Environment required by the bundled pio.exe: PlatformIO re-executes
 * scons/esptool with PYTHONEXEPATH (see platformio.proc.get_pythonexe_path),
 * and those subprocesses import platformio/click/esptool from the bundled
 * embeddable Python's site-packages via PYTHONPATH. Only set when the
 * bundled binary + python are present.
 */
export function getBundledPioEnv(): Record<string, string> {
    const env: Record<string, string> = {};
    const bundled = getBundledPath();
    if (!bundled) return env;

    const dir = path.dirname(bundled);
    const pyExe = path.join(dir, 'python', 'python.exe');
    if (!fs.existsSync(pyExe)) return env;

    env.PYTHONEXEPATH = pyExe;
    const sitePackages = path.join(dir, 'python', 'Lib', 'site-packages');
    if (fs.existsSync(sitePackages)) {
        env.PYTHONPATH = [sitePackages, process.env.PYTHONPATH].filter(Boolean).join(path.delimiter);
    }
    return env;
}

/**
 * Bundled library seed shipped next to pio.exe (the offline marketplace set).
 * Returns the directory or null when not bundled.
 */
export function getBundledLibrariesSeedPath(): string | null {
    const bundled = getBundledPath();
    if (!bundled) return null;
    const seed = path.join(path.dirname(bundled), 'libraries');
    return fs.existsSync(seed) ? seed : null;
}

/**
 * Resolve the pio binary. Bundled first, then cached userData copy.
 * No automatic download — the binary ships inside the app (see scripts/build-pio.ps1).
 */
export async function ensurePlatformIO(log?: (message: string) => void): Promise<string> {
    const bundled = getBundledPath();
    if (bundled) {
        log?.(`Using bundled pio: ${bundled}`);
        return bundled;
    }

    const cached = getCachedPath();
    if (cached) {
        log?.(`Using cached pio: ${cached}`);
        return cached;
    }

    throw new Error(
        'PlatformIO (pio) is required but could not be found.\n' +
        'The bundled binary is missing. Please reinstall LeapBlocks, ' +
        'or run scripts/build-pio.ps1 and copy the output to src/drivers/platformio/.'
    );
}