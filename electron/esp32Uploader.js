'use strict';

/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { app } = require('electron');

// ── GPIO monitor header — same as esp32Compiler.js ───────────────────────
// Injected above the user sketch so the simulation runner can detect GPIO
// state changes via Serial lines of the form:  __LF_GPIO:<pin>:<value>
const GPIO_MONITOR_HEADER = `\
// ---- LeapForge GPIO monitor (auto-injected, do not remove) ----
static void __lf_digitalWrite(uint8_t pin, uint8_t val) {
  digitalWrite(pin, val);
  Serial.printf("__LF_GPIO:%d:%d\\n", pin, (int)val);
}
#define digitalWrite(p, v) __lf_digitalWrite((p), (v))
// ---- end LeapForge injection ----
`;

// ─────────────────────────────────────────────────────────────────────────────
// Resolve esptool.py path
//   Prod:  <resourcesPath>/esptool/esptool.py
//   Dev:   <repo>/resources/esptool/esptool.py
// ─────────────────────────────────────────────────────────────────────────────
function getEsptoolPath() {
    if (app.isPackaged) {
        return path.join(process.resourcesPath, 'esptool', 'esptool.py');
    }
    return path.join(__dirname, '../resources/esptool/esptool.py');
}

// ─────────────────────────────────────────────────────────────────────────────
// spawnAsync(cmd, args) → Promise<{ stdout, stderr, exitCode }>
//
// Thin promise wrapper around child_process.spawn.
// Never rejects — always resolves so callers can inspect exitCode.
// ─────────────────────────────────────────────────────────────────────────────
function spawnAsync(cmd, args) {
    return new Promise((resolve) => {
        const proc = spawn(cmd, args, { env: { ...process.env } });
        let stdout = '';
        let stderr = '';
        proc.stdout.on('data', d => { stdout += d.toString(); });
        proc.stderr.on('data', d => { stderr += d.toString(); });
        proc.on('close', exitCode => resolve({ stdout, stderr, exitCode }));
        proc.on('error', err => resolve({ stdout: '', stderr: err.message, exitCode: -1 }));
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// makeESP32Uploader({ runCLI, sendProgress })
//
//   runCLI       – runCLI() from electron/main.js
//                  signature: (args: string[]) => Promise<{ stdout, stderr, code }>
//                  NOTE: runCLI already injects --config-file internally.
//
//   sendProgress – (percent: number, message: string) => void
//                  Typically: mainWindow.webContents.send('upload-progress', percent, message)
//                  Matches the exact signature used by ArduinoUploader.
//
//   forgeLibDir  – optional override for the forge-lib directory path.
//                  Defaults to <this file's dir>/../forge-lib.
// ─────────────────────────────────────────────────────────────────────────────
function makeESP32Uploader({ runCLI, sendProgress, forgeLibDir } = {}) {
    const libDir = forgeLibDir || path.join(__dirname, '../forge-lib');

    // ── upload(code, port, fqbn) ─────────────────────────────────────────────
    async function upload(code, port, fqbn) {
        if (!port) {
            return {
                success: false,
                error: 'No serial port selected. Please select a COM port in the menu bar.',
            };
        }

        let tempDir = null;

        try {
            // ── Phase 1 (0–10%): Find esptool.py ──────────────────────────────────
            console.log('[ESP32 Upload] Phase 1: Locating esptool.py');
            sendProgress(0, 'Initializing ESP32 upload...');

            const esptoolPath = getEsptoolPath();
            sendProgress(5, 'Locating esptool.py...');

            if (!fs.existsSync(esptoolPath)) {
                const msg = `esptool.py not found at: ${esptoolPath}`;
                console.error('[ESP32 Upload] Phase 1 failed:', msg);
                sendProgress(5, `Error: ${msg}`);
                return { success: false, error: msg };
            }

            console.log('[ESP32 Upload] Phase 1: esptool.py found at:', esptoolPath);
            sendProgress(10, 'esptool.py located');

            // ── Phase 2 (10–25%): Write sketch to temp dir ────────────────────────
            console.log('[ESP32 Upload] Phase 2: Writing sketch to temp directory');
            sendProgress(10, 'Preparing sketch directory...');

            const timestamp = Date.now();
            tempDir = path.join(os.tmpdir(), `forge_esp32_upload_${timestamp}`);
            const sketchDir = path.join(tempDir, 'sketch');
            const sketchFile = path.join(sketchDir, 'sketch.ino');

            try {
                fs.mkdirSync(sketchDir, { recursive: true });
            } catch (err) {
                const msg = `Failed to create temp directory: ${err.message}`;
                console.error('[ESP32 Upload] Phase 2 failed:', msg);
                sendProgress(10, `Error: ${msg}`);
                return { success: false, error: msg };
            }

            sendProgress(15, 'Writing sketch file...');

            try {
                const injectedCode = GPIO_MONITOR_HEADER + '\n' + code;
                fs.writeFileSync(sketchFile, injectedCode, 'utf-8');
                console.log('[ESP32 Upload] Phase 2: Sketch written to:', sketchFile);
            } catch (err) {
                const msg = `Failed to write sketch file: ${err.message}`;
                console.error('[ESP32 Upload] Phase 2 failed:', msg);
                sendProgress(15, `Error: ${msg}`);
                return { success: false, error: msg };
            }

            sendProgress(25, 'Sketch saved successfully');

            // ── Phase 3 (25–65%): arduino-cli compile ─────────────────────────────
            console.log('[ESP32 Upload] Phase 3: Compiling with fqbn:', fqbn);
            sendProgress(25, 'Starting compilation...');
            sendProgress(30, 'Compiling code...');

            const compileArgs = [
                'compile',
                '--fqbn', fqbn,
                '--output-dir', tempDir,
                '--libraries', path.join(libDir, 'libraries'),
                sketchDir,
            ];

            const { stdout: compileOut, stderr: compileErr, code: exitCode } = await runCLI(compileArgs);

            console.log('[ESP32 Upload] Phase 3: Compile stdout:', compileOut);
            console.log('[ESP32 Upload] Phase 3: Compile stderr:', compileErr);

            if (exitCode !== 0) {
                const msg = `Compilation failed: ${compileErr || compileOut}`;
                console.error('[ESP32 Upload] Phase 3 failed:', msg);
                sendProgress(30, `Error: ${msg}`);
                return { success: false, error: msg };
            }

            // Locate the .bin output
            const files = fs.readdirSync(tempDir);
            const binFile = files.find(f => f.endsWith('.bin'));

            if (!binFile) {
                const msg = `Compiler produced no .bin output. Is espressif:esp32 core installed? Files: ${files.join(', ')}`;
                console.error('[ESP32 Upload] Phase 3 failed:', msg);
                sendProgress(60, `Error: ${msg}`);
                return { success: false, error: msg };
            }

            const binPath = path.join(tempDir, binFile);
            console.log('[ESP32 Upload] Phase 3: .bin found at:', binPath);
            sendProgress(65, 'Compilation successful');

            // ── Phase 4 (65–95%): esptool.py write_flash ──────────────────────────
            console.log('[ESP32 Upload] Phase 4: Flashing via esptool.py on port:', port);
            sendProgress(65, 'Preparing upload...');
            sendProgress(70, 'Uploading to board...');

            const esptoolArgs = [
                esptoolPath,
                '--chip', 'esp32',
                '--port', port,
                '--baud', '921600',
                'write_flash',
                '-z',
                '0x1000',
                binPath,
            ];

            sendProgress(75, 'Flashing firmware...');

            const { stdout: flashOut, stderr: flashErr, exitCode: flashCode } = await spawnAsync('python3', esptoolArgs);

            console.log('[ESP32 Upload] Phase 4: esptool stdout:', flashOut);
            console.log('[ESP32 Upload] Phase 4: esptool stderr:', flashErr);

            if (flashCode !== 0) {
                const msg = `Flash failed: ${flashErr || flashOut}`;
                console.error('[ESP32 Upload] Phase 4 failed:', msg);
                sendProgress(75, `Error: ${msg}`);
                return { success: false, error: msg };
            }

            sendProgress(95, 'Finalizing...');

            // ── Phase 5 (100%): Complete ───────────────────────────────────────────
            console.log('[ESP32 Upload] Phase 5: Upload complete');
            sendProgress(100, 'Upload complete!');

            return { success: true };

        } catch (err) {
            const msg = err.message || String(err);
            console.error('[ESP32 Upload] Unexpected error:', msg);
            sendProgress(0, `Error: ${msg}`);
            return { success: false, error: msg };
        } finally {
            // Best-effort cleanup — temp dir is no longer needed after a real flash
            if (tempDir) {
                try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) { }
            }
        }
    }

    return { upload };
}

module.exports = { makeESP32Uploader };
