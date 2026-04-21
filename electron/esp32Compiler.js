'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

// ── GPIO monitor header injected above every user sketch ──────────────────
// Wraps digitalWrite() so the simulation runner can detect pin state changes
// via Serial output lines of the form:  __LF_GPIO:<pin>:<value>
// Wire format emitted at runtime:  __LF_GPIO:{pin}:{value}\n
//   pin   = uint8 GPIO number (0–39)
//   value = 0 or 1
// Example: __LF_GPIO:13:1\n  → GPIO 13 went HIGH
//
// IMPORTANT: the #define MUST appear after the function definition so the
// wrapper itself can call the real digitalWrite() without infinite recursion.
const GPIO_MONITOR_HEADER = `\
// ---- LeapForge GPIO monitor (auto-injected, do not remove) ----
static void __lf_digitalWrite(uint8_t pin, uint8_t val) {
  digitalWrite(pin, val);
  Serial.printf("__LF_GPIO:%d:%d\\n", pin, (int)val);
}
#define digitalWrite(p,v) __lf_digitalWrite((p),(v))
// ---- end LeapForge injection ----
`;

// ─────────────────────────────────────────────────────────────────────────────
// makeESP32Compiler({ runCLI, forgeLibDir })
//
//   runCLI     – the same runCLI() from electron/main.js
//                signature: (args: string[]) => Promise<{ stdout, stderr, code }>
//                NOTE: runCLI already injects --config-file internally.
//
//   forgeLibDir – absolute path to the forge-lib directory.
//                 Defaults to <this file's dir>/../forge-lib so callers that
//                 don't supply it still work correctly.
// ─────────────────────────────────────────────────────────────────────────────
function makeESP32Compiler({ runCLI, forgeLibDir } = {}) {
    const libDir = forgeLibDir || path.join(__dirname, '../forge-lib');

    async function compileESP32(code, fqbn) {
        const timestamp = Date.now();
        const tempDir = path.join(os.tmpdir(), `forge_esp32_${timestamp}`);
        const sketchDir = path.join(tempDir, 'sketch');
        const sketchFile = path.join(sketchDir, 'sketch.ino');

        // ── 1. Create temp directory structure ──────────────────────────────────
        try {
            fs.mkdirSync(sketchDir, { recursive: true });
        } catch (err) {
            return { success: false, error: `Failed to create temp directory: ${err.message}` };
        }

        // ── 2. Write injected sketch to disk ────────────────────────────────────
        try {
            const injectedCode = GPIO_MONITOR_HEADER + '\n' + code;
            fs.writeFileSync(sketchFile, injectedCode, 'utf-8');
            console.log('[ESP32 Compiler] Writing sketch to:', sketchFile);
        } catch (err) {
            return { success: false, error: `Failed to write sketch file: ${err.message}` };
        }

        // ── 3. Run arduino-cli compile ───────────────────────────────────────────
        try {
            console.log('[ESP32 Compiler] Running arduino-cli with fqbn:', fqbn);

            const args = [
                'compile',
                '--fqbn', fqbn,
                '--output-dir', tempDir,          // parent dir — arduino-cli writes .bin here
                '--libraries', path.join(libDir, 'libraries'),
                sketchDir                           // path to sketch/ folder containing sketch.ino
            ];

            const { stdout, stderr, code: exitCode } = await runCLI(args);

            console.log('[ESP32 Compiler] Compile stdout:', stdout);
            console.log('[ESP32 Compiler] Compile stderr:', stderr);

            // ── 4. Handle compile failure ──────────────────────────────────────────
            if (exitCode !== 0) {
                return { success: false, error: stderr || stdout };
            }

            // ── 5. Locate the .bin output ──────────────────────────────────────────
            const files = fs.readdirSync(tempDir);
            const binFile = files.find(f => f.endsWith('.bin'));

            if (!binFile) {
                return {
                    success: false,
                    error: 'Compiler produced no .bin output. Is esp32:esp32 core installed?'
                };
            }

            const binPath = path.join(tempDir, binFile);
            console.log('[ESP32 Compiler] Found .bin at:', binPath);

            // tempDir is intentionally NOT deleted here — qemuManager.js needs the
            // .bin file to still exist when QEMU starts.  Call cleanupESP32Build()
            // from main.js AFTER qemuManager.stopQemu().
            return { success: true, binPath };

        } catch (err) {
            return { success: false, error: err.message };
        }
    }

    return { compileESP32 };
}

// ─────────────────────────────────────────────────────────────────────────────
// cleanupESP32Build(tempDir)
//
// Removes the temp directory created by compileESP32().
// Call this from main.js AFTER QEMU has stopped and the .bin is no longer needed.
// Safe to call multiple times — errors are silently swallowed.
// ─────────────────────────────────────────────────────────────────────────────
function cleanupESP32Build(tempDir) {
    try {
        fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (_) {
        // intentionally silent — cleanup is best-effort
    }
}

module.exports = { makeESP32Compiler, cleanupESP32Build };
