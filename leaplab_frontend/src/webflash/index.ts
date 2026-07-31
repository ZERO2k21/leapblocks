/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 *
 * WebFlasher — the browser-side upload path for LeapBlocks.
 *
 * In Electron the app flashes boards through the bundled arduino-cli. In the
 * browser (web build) there is no local compiler, so this module:
 *
 *   1. POSTs the sketch to the compiler server (CLOUD_COMPILER_URL),
 *      which returns an Intel HEX (AVR) or a base64 firmware .bin (ESP32).
 *   2. Flashes the firmware straight from the browser via the Web Serial API:
 *        - AVR (Uno / Nano / Mega): STK500v1 protocol (see avrFlasher.ts)
 *        - ESP32 (C3): esptool-js (see espFlasher.ts)
 *
 * No drivers or desktop installation required — works in Chrome / Edge / Opera.
 */

import { CLOUD_COMPILER_URL } from '../config/platform';
import { flashAvr, getAvrBoardProfile } from './avrFlasher';
import { flashEsp32, isEsp32Fqbn } from './espFlasher';

export interface WebPortInfo {
    path: string;
    manufacturer?: string;
    port?: SerialPort;
}

export interface WebUploadOptions {
    code: string;
    fqbn: string;
    libraries?: string[];
    onProgress?: (progress: number, message: string) => void;
    onLog?: (message: string) => void;
}

// ── Port / capability helpers ───────────────────────────────────────────────

export function isWebSerialSupported(): boolean {
    try {
        return typeof navigator !== 'undefined' && !!navigator.serial;
    } catch {
        return false;
    }
}

/** The port the user granted access to (last requestPort / reconnect). */
let grantedPort: SerialPort | null = null;

export function getGrantedPort(): SerialPort | null {
    return grantedPort;
}

/**
 * Opens the browser's device picker. Must be called from a user gesture
 * (button click). Resolves to null if the user cancels.
 */
export async function requestPort(): Promise<WebPortInfo | null> {
    if (!isWebSerialSupported()) return null;
    const port = await navigator.serial.requestPort();
    grantedPort = port;
    return { path: 'WEB_SERIAL', manufacturer: describePort(port), port };
}

/** Ports the user has already granted access to in this browser session. */
export async function listPorts(): Promise<WebPortInfo[]> {
    if (!isWebSerialSupported()) return [];
    try {
        const granted = await navigator.serial.getPorts();
        return granted.map((port, index) => ({
            path: `WEB_SERIAL:${index}`,
            manufacturer: describePort(port),
            port,
        }));
    } catch {
        return [];
    }
}

function describePort(port: SerialPort): string {
    try {
        const info = port.getInfo();
        if (info?.usbVendorId || info?.usbProductId) {
            return `USB device (${info.usbVendorId?.toString(16).padStart(4, '0')}:${info.usbProductId?.toString(16).padStart(4, '0')})`;
        }
    } catch {
        // getInfo() is experimental — fall through.
    }
    return 'Web Serial device';
}

// ── Compile on the LeapBlocks compiler server ───────────────────────────────

interface ServerCompileResult {
    success: boolean;
    hex?: string;
    binBase64?: string;
    errors?: string | string[];
}

async function compileOnServer(options: WebUploadOptions): Promise<ServerCompileResult> {
    const isESP32 = isEsp32Fqbn(options.fqbn);
    const endpoint = isESP32 ? '/compile/esp32' : '/compile';
    const body = JSON.stringify({
        code: options.code,
        board: options.fqbn,
        libraries: options.libraries?.join(',') || '',
    });

    options.onLog?.(`Compiling for ${options.fqbn} on the LeapBlocks server...`);
    const res = await fetch(`${CLOUD_COMPILER_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
    });
    if (!res.ok) {
        return { success: false, errors: `Compiler server error (HTTP ${res.status}).` };
    }
    const data = await res.json();
    if (!data.success) {
        const errors = data.errors;
        return {
            success: false,
            errors: Array.isArray(errors) ? errors.join('\n') : String(errors || 'Compilation failed.'),
        };
    }
    if (isESP32 && !data.binBase64) {
        return { success: false, errors: 'Server did not return a firmware binary for ESP32.' };
    }
    if (!isESP32 && !data.hex) {
        return { success: false, errors: 'Server did not return a HEX file for the AVR board.' };
    }
    return { success: true, hex: data.hex, binBase64: data.binBase64 };
}

// ── Main upload entry point ─────────────────────────────────────────────────

/**
 * Compiles the sketch on the compiler server and flashes it to the board
 * through the browser. Requires Web Serial (Chrome / Edge / Opera) and a port
 * granted via `requestPort()` (or `navigator.serial.requestPort` is invoked
 * automatically — call this from a user gesture).
 */
export async function uploadToBoard(options: WebUploadOptions): Promise<{ success: boolean; error?: string }> {
    try {
        if (!isWebSerialSupported()) {
            return {
                success: false,
                error: 'Web Serial is not supported in this browser. Use Chrome or Edge — or install LeapBlocks Desktop.',
            };
        }

        let port = grantedPort;
        if (!port) {
            const picked = await requestPort();
            if (!picked?.port) {
                return { success: false, error: 'No port selected. Please connect your board and pick its port.' };
            }
            port = picked.port;
        }

        // 1. Compile on the server.
        options.onProgress?.(5, 'Compiling on the LeapBlocks server...');
        const compiled = await compileOnServer(options);
        if (!compiled.success) {
            return { success: false, error: `Compilation failed:\n${compiled.errors}` };
        }

        // 2. Flash from the browser.
        if (isEsp32Fqbn(options.fqbn)) {
            await flashEsp32(port, {
                binBase64: compiled.binBase64!,
                onProgress: options.onProgress,
                onLog: options.onLog,
            });
        } else if (getAvrBoardProfile(options.fqbn)) {
            await flashAvr(port, {
                hex: compiled.hex!,
                fqbn: options.fqbn,
                onProgress: options.onProgress,
                onLog: options.onLog,
            });
        } else {
            return {
                success: false,
                error: `Board ${options.fqbn} is not supported for web upload yet. Supported: Arduino Uno, Nano, Mega, ESP32-C3.`,
            };
        }

        return { success: true };
    } catch (err: any) {
        return {
            success: false,
            error: err?.message || 'Upload failed with an unknown error.',
        };
    }
}
