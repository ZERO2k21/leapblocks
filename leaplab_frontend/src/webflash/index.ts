/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 *
 * WebFlasher — the browser-side upload path for LeapBlocks.
 *
 * In Electron the app flashes boards through the bundled PlatformIO pio.exe.
 * In the browser (web build) there is no local compiler, so this module:
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

// ── Web Serial monitor (browser serial monitor) ─────────────────────────────

let monitorPort: SerialPort | null = null;
let monitorReader: ReadableStreamDefaultReader<Uint8Array> | null = null;
let monitorOpenedPort = false;

/** Opens the granted port if it isn't open yet. */
async function openGrantedPort(baudRate: number): Promise<SerialPort | null> {
    const port = grantedPort;
    if (!port) {
        console.log('[webflash-monitor] openGrantedPort: no granted port');
        return null;
    }
    if (!port.readable) {
        try {
            console.log(`[webflash-monitor] opening port at ${baudRate} baud...`);
            await port.open({ baudRate });
            monitorOpenedPort = true;
            console.log('[webflash-monitor] port opened OK');
        } catch (err: any) {
            console.error(`[webflash-monitor] port.open failed: ${err?.message || err}`);
            throw err;
        }
        return port;
    }
    if (port.readable.locked) {
        // A previous upload (esptool-js / SerialStream) left the stream locked.
        // Close and reopen so the monitor can attach its own reader.
        console.log('[webflash-monitor] stream locked by previous reader — closing and reopening');
        try { await port.close(); } catch (err: any) {
            console.error(`[webflash-monitor] close locked port failed: ${err?.message || err}`);
        }
        if (!port.readable) {
            await port.open({ baudRate });
            monitorOpenedPort = true;
            console.log('[webflash-monitor] port reopened OK');
        }
    }
    return port;
}

/**
 * Starts streaming data from the granted Web Serial port, splitting the raw
 * bytes into lines. Resolves false (and reports via onStatus) when no port is
 * granted or it cannot be opened. End the loop with stopWebSerialMonitor().
 */
export async function startWebSerialMonitor(
    baudRate: number,
    onData: (line: string) => void,
    onStatus?: (message: string) => void,
): Promise<boolean> {
    try {
        const port = await openGrantedPort(baudRate);
        if (!port?.readable || !port?.writable) {
            console.log('[webflash-monitor] port has no readable/writable stream');
            onStatus?.('No Web Serial port granted — click Connect first.');
            return false;
        }
        monitorPort = port;
        const decoder = new TextDecoder();
        let buffer = '';
        monitorReader = port.readable.getReader();
        console.log('[webflash-monitor] reader attached — waiting for data...');
        (async () => {
            let received = 0;
            // Devices that print without newlines (or slow/failed baud reads)
            // would otherwise never render — flush partial output periodically.
            const flushPartial = () => {
                if (buffer) {
                    console.log(`[webflash-monitor] flush → ${JSON.stringify(buffer)}`);
                    onData(buffer);
                    buffer = '';
                }
            };
            const flushTimer = setInterval(flushPartial, 150);
            try {
                while (monitorReader) {
                    const { value, done } = await monitorReader.read();
                    if (done) {
                        console.log('[webflash-monitor] read loop done (stream closed by device)');
                        flushPartial();
                        break;
                    }
                    if (!value?.length) continue;
                    received += value.length;
                    const text = decoder.decode(value, { stream: true });
                    console.log(`[webflash-monitor] +${value.length} bytes (total ${received}): ${JSON.stringify(text)}`);
                    buffer += text;
                    let newline: number;
                    while ((newline = buffer.indexOf('\n')) >= 0) {
                        const line = buffer.slice(0, newline).replace(/\r$/, '');
                        buffer = buffer.slice(newline + 1);
                        console.log(`[webflash-monitor] line → ${JSON.stringify(line)}`);
                        onData(line);
                    }
                }
            } catch (err: any) {
                console.error(`[webflash-monitor] read loop error: ${err?.message || err}`);
                onStatus?.(`Serial monitor disconnected: ${err?.message || 'read error'}`);
            } finally {
                clearInterval(flushTimer);
                flushPartial();
                try { monitorReader?.releaseLock(); } catch { /* ignore */ }
                monitorReader = null;
                console.log('[webflash-monitor] read loop finished');
            }
        })();
        onStatus?.(`Serial monitor connected at ${baudRate} baud.`);
        return true;
    } catch (err: any) {
        console.error(`[webflash-monitor] start failed: ${err?.message || err}`);
        onStatus?.(`Failed to open serial port: ${err?.message || 'unknown error'}`);
        return false;
    }
}

/** Stops the monitor read loop and closes the port if this module opened it. */
export async function stopWebSerialMonitor(): Promise<void> {
    console.log('[webflash-monitor] stopping monitor...');
    try { await monitorReader?.cancel(); } catch { /* ignore */ }
    try { monitorReader?.releaseLock(); } catch { /* ignore */ }
    monitorReader = null;
    if (monitorPort && monitorOpenedPort) {
        try { if (monitorPort.readable) await monitorPort.close(); } catch { /* ignore */ }
    }
    monitorPort = null;
    monitorOpenedPort = false;
    console.log('[webflash-monitor] stopped');
}

/** Writes a string to the granted Web Serial port (serial monitor TX). */
export async function sendWebSerial(data: string): Promise<boolean> {
    try {
        const port = grantedPort;
        if (!port?.writable) {
            console.log('[webflash-monitor] send failed: port not writable');
            return false;
        }
        const writer = port.writable.getWriter();
        await writer.write(new TextEncoder().encode(data));
        writer.releaseLock();
        console.log(`[webflash-monitor] sent ${JSON.stringify(data)}`);
        return true;
    } catch (err: any) {
        console.error(`[webflash-monitor] send error: ${err?.message || err}`);
        return false;
    }
}

// ── Compile on the LeapBlocks compiler server ───────────────────────────────

interface ServerCompileResult {
    success: boolean;
    hex?: string;
    binBase64?: string;
    bootloaderBase64?: string;
    partitionsBase64?: string;
    errors?: string | string[];
}

interface CompileAttempt {
    ok: boolean;
    httpStatus?: number;
    data?: any;
    networkError?: string;
}

async function postCompile(url: string, body: string, onLog?: (message: string) => void): Promise<CompileAttempt> {
    const t0 = Date.now();
    try {
        console.log(`[webflash] 🌐 POST ${url} (${body.length} bytes)...`);
        onLog?.(`[webflash] 🌐 Contacting compiler server (${url})...`);
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
        });
        const elapsed = Date.now() - t0;
        console.log(`[webflash] 📥 Response: HTTP ${res.status} (${elapsed}ms)`);
        onLog?.(`[webflash] 📥 Compiler replied: HTTP ${res.status} in ${elapsed}ms`);
        if (!res.ok) {
            const text = await res.text().catch(() => '(unreadable)');
            console.error(`[webflash] ❌ Compiler HTTP error ${res.status}:`, text);
            onLog?.(`[webflash] ❌ Compiler server error (HTTP ${res.status}): ${text.slice(0, 300)}`);
            return { ok: false, httpStatus: res.status };
        }
        const data = await res.json();
        return { ok: true, data };
    } catch (e: any) {
        const elapsed = Date.now() - t0;
        console.error(`[webflash] ❌ Network error reaching ${url} after ${elapsed}ms:`, e);
        onLog?.(`[webflash] ❌ Network error reaching compiler (${elapsed}ms): ${e?.message}`);
        return { ok: false, networkError: e?.message };
    }
}

/**
 * Compile on the LeapBlocks cloud compiler server — CLOUD ONLY.
 */
async function compileOnServer(options: WebUploadOptions): Promise<ServerCompileResult> {
    const isESP32 = isEsp32Fqbn(options.fqbn);
    const endpoint = isESP32 ? '/compile/esp32' : '/compile';
    const body = JSON.stringify({
        code: options.code,
        board: options.fqbn,
        libraries: options.libraries?.join(',') || '',
    });

    const url = `${CLOUD_COMPILER_URL}${endpoint}`;

    const lineCount = (options.code || '').split('\n').length;
    console.log(`[webflash] ═══════════ COMPILE ON SERVER ═══════════`);
    console.log(`[webflash] Board: ${options.fqbn} | Code: ${options.code?.length} chars, ${lineCount} lines`);
    console.log(`[webflash] Endpoint: ${url}`);
    options.onLog?.(`[webflash] 🔨 Compiling for ${options.fqbn} on the LeapBlocks server (${lineCount} lines)...`);

    const attempt = await postCompile(url, body, options.onLog);

    if (!attempt.ok) {
        if (attempt.networkError) {
            return { success: false, errors: `Network error reaching compiler server: ${attempt.networkError}. The cloud compiler may be starting up (cold start can take 1–3 minutes) — wait a moment and retry.` };
        }
        return { success: false, errors: `Compiler server error (HTTP ${attempt.httpStatus}).` };
    }

    const data = attempt.data;
    console.log(`[webflash] Server result: success=${data.success}, hasHex=${!!data.hex}, hasBinBase64=${!!data.binBase64}`);

    if (!data.success) {
        const errors = data.errors;
        const errMsg = Array.isArray(errors) ? errors.join('\n') : String(errors || 'Compilation failed.');
        console.error('[webflash] ❌ Compilation failed:', errMsg);
        options.onLog?.(`[webflash] ❌ Compilation failed:\n${errMsg}`);
        return {
            success: false,
            errors: errMsg,
        };
    }
    if (isESP32 && !data.binBase64) {
        return { success: false, errors: 'Server did not return a firmware binary for ESP32.' };
    }
    if (!isESP32 && !data.hex) {
        return { success: false, errors: 'Server did not return a HEX file for the AVR board.' };
    }

    if (data.hex) {
        options.onLog?.(`[webflash] ✓ Compiled successfully! Intel HEX received (${data.hex.length} chars).`);
    } else if (data.binBase64) {
        options.onLog?.(`[webflash] ✓ Compiled successfully! Firmware binary received (${Math.round((data.binBase64.length * 3) / 4)} bytes).`);
    }

    return { success: true, hex: data.hex, binBase64: data.binBase64, bootloaderBase64: data.bootloaderBase64, partitionsBase64: data.partitionsBase64 };
}

// ── Main upload entry point ─────────────────────────────────────────────────

/**
 * Compiles the sketch on the compiler server and flashes it to the board
 * through the browser. Requires Web Serial (Chrome / Edge / Opera) and a port
 * granted via `requestPort()` (or `navigator.serial.requestPort` is invoked
 * automatically — call this from a user gesture).
 */
export async function uploadToBoard(options: WebUploadOptions): Promise<{ success: boolean; error?: string }> {
    const uploadStartTime = Date.now();
    try {
        console.log(`[webflash] 🚀 uploadToBoard initiated: fqbn=${options.fqbn}, codeLength=${options.code?.length}`);
        options.onLog?.(`[webflash] 🚀 Starting upload process for ${options.fqbn}...`);

        if (!isWebSerialSupported()) {
            console.error('[webflash] Web Serial NOT supported');
            options.onLog?.('[webflash] ❌ Web Serial is not supported in this browser.');
            return {
                success: false,
                error: 'Web Serial is not supported in this browser. Use Chrome or Edge — or install LeapBlocks Desktop.',
            };
        }
        console.log('[webflash] Web Serial supported ✓');

        let port = grantedPort;
        if (!port) {
            console.log('[webflash] No granted port — requesting user port selection...');
            options.onLog?.('[webflash] 🔌 Please select your board in the browser port picker...');
            const picked = await requestPort();
            if (!picked?.port) {
                console.log('[webflash] User cancelled picker');
                options.onLog?.('[webflash] ⚠ Port selection cancelled.');
                return { success: false, error: 'No port selected. Please connect your board and pick its port.' };
            }
            port = picked.port;
            options.onLog?.(`[webflash] 🔌 Port granted: ${picked.manufacturer || 'Serial device'}`);
            console.log('[webflash] Picker granted port ✓');
        } else {
            console.log('[webflash] Using previously granted port ✓');
            options.onLog?.('[webflash] 🔌 Using active serial port connection');
        }

        // 1. Compile on the server.
        options.onProgress?.(10, 'Compiling on LeapBlocks cloud server...');
        console.log('[webflash] Step 1/2: Sending sketch to compiler...');
        const compiled = await compileOnServer(options);
        if (!compiled.success) {
            return { success: false, error: `Compilation failed:\n${compiled.errors}` };
        }

        // 2. Flash from the browser.
        options.onProgress?.(35, 'Flashing firmware to board via Web Serial...');
        console.log('[webflash] Step 2/2: Flashing firmware to board...');
        options.onLog?.(`[webflash] ⚡ Initiating flashing sequence...`);

        if (isEsp32Fqbn(options.fqbn)) {
            await flashEsp32(port, {
                binBase64: compiled.binBase64!,
                bootloaderBase64: compiled.bootloaderBase64,
                partitionsBase64: compiled.partitionsBase64,
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
                error: `Board ${options.fqbn} is not supported for web upload yet. Supported: Arduino Uno, Nano, Mega, ESP32.`,
            };
        }

        const elapsedSec = ((Date.now() - uploadStartTime) / 1000).toFixed(1);
        console.log(`[webflash] 🎉 Upload complete in ${elapsedSec}s!`);
        options.onLog?.(`[webflash] 🎉 Upload complete and verified in ${elapsedSec}s!`);

        return { success: true };
    } catch (err: any) {
        console.error('[webflash] ❌ Upload failed with error:', err);
        options.onLog?.(`[webflash] ❌ Upload failed: ${err?.message || err}`);
        return {
            success: false,
            error: err?.message || 'Upload failed with an unknown error.',
        };
    }
}
