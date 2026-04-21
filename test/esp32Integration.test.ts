/**
 * ESP32 pipeline integration tests
 *
 * Tests 1–5 cover the full ESP32 compile → parse → board-config pipeline.
 * No real QEMU process is started. arduino-cli is mocked via a fake runCLI.
 *
 * Run with:  npx vitest --run --project unit
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers shared across tests
// ─────────────────────────────────────────────────────────────────────────────

/** Subclass that exposes private methods for testing */
class TestableRunner {
    // We import ESP32SimulationRunner lazily inside each test group so the
    // window.electronAPI mock is in place before the module is evaluated.
    // This helper is just a type alias — see makeRunner() below.
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 1 — Compile pipeline
// ─────────────────────────────────────────────────────────────────────────────

describe('T1 — compileESP32 produces a .bin file', () => {
    let tempDir: string;

    beforeEach(() => {
        tempDir = '';
    });

    afterEach(() => {
        // Clean up any temp dirs created during the test
        if (tempDir && fs.existsSync(tempDir)) {
            try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) { }
        }
    });

    it('compileESP32 returns success:true and a valid .bin path', async () => {
        // ── Arrange ──────────────────────────────────────────────────────────────
        // Import the factory (CommonJS module — works fine in Vitest Node env)
        const { makeESP32Compiler } = await import('../electron/esp32Compiler.js');

        // Fake runCLI: writes a dummy .bin into the output dir and returns exit 0
        const fakeRunCLI = vi.fn(async (args: string[]) => {
            // Extract --output-dir value from args
            const outDirIdx = args.indexOf('--output-dir');
            const outDir = outDirIdx !== -1 ? args[outDirIdx + 1] : null;
            if (outDir) {
                tempDir = outDir; // capture for cleanup
                // Write a fake .bin so the compiler finds it
                fs.writeFileSync(path.join(outDir, 'sketch.ino.bin'), Buffer.from([0xDE, 0xAD, 0xBE, 0xEF]));
            }
            return { stdout: 'Sketch uses 123456 bytes', stderr: '', code: 0 };
        });

        const { compileESP32 } = makeESP32Compiler({ runCLI: fakeRunCLI });

        const sketchCode = `
void setup() { pinMode(13, OUTPUT); }
void loop()  { digitalWrite(13, HIGH); delay(500); digitalWrite(13, LOW); delay(500); }
`;

        // ── Act ───────────────────────────────────────────────────────────────────
        const result = await compileESP32(sketchCode, 'espressif:esp32:esp32');

        // ── Assert ────────────────────────────────────────────────────────────────
        expect(result.success).toBe(true);
        if (!result.success) return; // narrow type

        // binPath must exist on disk
        expect(fs.existsSync(result.binPath)).toBe(true);

        // binPath must end with .bin
        expect(result.binPath).toMatch(/\.bin$/);

        // The sketch.ino written to disk must contain the GPIO monitor header
        // Find the sketch dir from the binPath (parent is tempDir, sketch/ is inside)
        const writtenTempDir = path.dirname(result.binPath);
        const sketchFile = path.join(writtenTempDir, 'sketch', 'sketch.ino');
        expect(fs.existsSync(sketchFile)).toBe(true);

        const written = fs.readFileSync(sketchFile, 'utf-8');
        expect(written).toContain('__LF_GPIO');
        expect(written).toContain('__lf_digitalWrite');
        expect(written).toContain('#define digitalWrite(p,v)');
        // Header must appear BEFORE user code
        const headerIdx = written.indexOf('__lf_digitalWrite');
        const userCodeIdx = written.indexOf('void setup()');
        expect(headerIdx).toBeLessThan(userCodeIdx);
    });

    it('compileESP32 returns success:false when arduino-cli exits non-zero', async () => {
        const { makeESP32Compiler } = await import('../electron/esp32Compiler.js');

        const fakeRunCLI = vi.fn(async () => ({
            stdout: '',
            stderr: 'error: unknown type name "uint8_t"',
            code: 1,
        }));

        const { compileESP32 } = makeESP32Compiler({ runCLI: fakeRunCLI });

        const result = await compileESP32('bad code', 'espressif:esp32:esp32');

        expect(result.success).toBe(false);
        if (result.success) return;
        expect(result.error).toContain('uint8_t');
    });

    it('compileESP32 returns success:false when no .bin is produced', async () => {
        const { makeESP32Compiler } = await import('../electron/esp32Compiler.js');

        // runCLI succeeds but writes nothing
        const fakeRunCLI = vi.fn(async () => ({
            stdout: 'done',
            stderr: '',
            code: 0,
        }));

        const { compileESP32 } = makeESP32Compiler({ runCLI: fakeRunCLI });
        const result = await compileESP32('void setup(){} void loop(){}', 'espressif:esp32:esp32');

        expect(result.success).toBe(false);
        if (result.success) return;
        expect(result.error).toMatch(/no \.bin/i);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Shared runner factory for Tests 2–4
// window.electronAPI is never called by the methods under test (addPinListener,
// addSerialListener, onSerialData, parseSerialLine) so no mock is needed.
// ─────────────────────────────────────────────────────────────────────────────

async function makeRunner() {
    const { ESP32SimulationRunner } = await import('../src/simulation/ESP32SimulationRunner');

    // Subclass to expose private methods
    class TRunner extends ESP32SimulationRunner {
        public callOnSerialData(data: string) {
            // @ts-expect-error — private
            this.onSerialData(data);
        }
    }

    const runner = new TRunner();
    const pinEvents: Array<{ pin: number; high: boolean }> = [];
    const serialChars: string[] = [];

    return { runner, pinEvents, serialChars };
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 2 — GPIO protocol parser
// ─────────────────────────────────────────────────────────────────────────────

describe('T2 — parseSerialLine routes GPIO lines to pinListeners', () => {
    it('routes __LF_GPIO:13:1 to pin 13 listener as high=true', async () => {
        const { runner, pinEvents } = await makeRunner();
        runner.addPinListener(13, (high) => pinEvents.push({ pin: 13, high }));

        runner.callOnSerialData('__LF_GPIO:13:1\n');

        expect(pinEvents).toEqual([{ pin: 13, high: true }]);
    });

    it('routes __LF_GPIO:13:0 to pin 13 listener as high=false', async () => {
        const { runner, pinEvents } = await makeRunner();
        runner.addPinListener(13, (high) => pinEvents.push({ pin: 13, high }));

        runner.callOnSerialData('__LF_GPIO:13:0\n');

        expect(pinEvents).toEqual([{ pin: 13, high: false }]);
    });

    it('fires listener for each GPIO line in a multi-line chunk', async () => {
        const { runner, pinEvents } = await makeRunner();
        runner.addPinListener(13, (high) => pinEvents.push({ pin: 13, high }));

        runner.callOnSerialData('__LF_GPIO:13:1\n__LF_GPIO:13:0\n');

        expect(pinEvents).toEqual([
            { pin: 13, high: true },
            { pin: 13, high: false },
        ]);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 3 — Serial monitor isolation
// ─────────────────────────────────────────────────────────────────────────────

describe('T3 — normal serial lines reach serialListeners, not pinListeners', () => {
    it('forwards "Hello World" to serialListener char-by-char', async () => {
        const { runner, serialChars } = await makeRunner();
        runner.addSerialListener((ch) => serialChars.push(ch));

        runner.callOnSerialData('Hello World\n');

        expect(serialChars.join('')).toBe('Hello World\n');
    });

    it('does NOT fire pinListener for normal serial output', async () => {
        const { runner, pinEvents, serialChars } = await makeRunner();
        runner.addPinListener(13, (high) => pinEvents.push({ pin: 13, high }));
        runner.addSerialListener((ch) => serialChars.push(ch));

        runner.callOnSerialData('Hello World\n');

        expect(pinEvents).toHaveLength(0);
        expect(serialChars.join('')).toBe('Hello World\n');
    });

    it('strips GPIO lines completely — they never reach serialListener', async () => {
        const { runner, serialChars } = await makeRunner();
        runner.addSerialListener((ch) => serialChars.push(ch));

        runner.callOnSerialData('__LF_GPIO:13:1\n');

        expect(serialChars).toHaveLength(0);
    });

    it('mixed chunk: GPIO line stripped, normal line forwarded', async () => {
        const { runner, pinEvents, serialChars } = await makeRunner();
        runner.addPinListener(13, (high) => pinEvents.push({ pin: 13, high }));
        runner.addSerialListener((ch) => serialChars.push(ch));

        runner.callOnSerialData('__LF_GPIO:13:1\nTemperature: 25C\n');

        expect(pinEvents).toEqual([{ pin: 13, high: true }]);
        expect(serialChars.join('')).toBe('Temperature: 25C\n');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 4 — Partial buffer
// ─────────────────────────────────────────────────────────────────────────────

describe('T4 — handles partial lines across multiple onSerialData calls', () => {
    it('holds partial GPIO line until newline arrives', async () => {
        const { runner, pinEvents } = await makeRunner();
        runner.addPinListener(13, (high) => pinEvents.push({ pin: 13, high }));

        // First chunk — no newline yet
        runner.callOnSerialData('__LF_GPIO:13');
        expect(pinEvents).toHaveLength(0); // not yet complete

        // Second chunk — completes the line
        runner.callOnSerialData(':1\n');
        expect(pinEvents).toEqual([{ pin: 13, high: true }]);
    });

    it('holds partial normal line until newline arrives', async () => {
        const { runner, serialChars } = await makeRunner();
        runner.addSerialListener((ch) => serialChars.push(ch));

        runner.callOnSerialData('Hel');
        expect(serialChars).toHaveLength(0); // buffered

        runner.callOnSerialData('lo\n');
        expect(serialChars.join('')).toBe('Hello\n');
    });

    it('handles multiple partial chunks before newline', async () => {
        const { runner, pinEvents } = await makeRunner();
        runner.addPinListener(2, (high) => pinEvents.push({ pin: 2, high }));

        runner.callOnSerialData('__LF');
        runner.callOnSerialData('_GPIO');
        runner.callOnSerialData(':2:0');
        expect(pinEvents).toHaveLength(0);

        runner.callOnSerialData('\n');
        expect(pinEvents).toEqual([{ pin: 2, high: false }]);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 5 — convertESP32Pin (via ESP32BoardConfig directly)
// CircuitEngine.convertESP32Pin is a thin wrapper around ESP32_BOARD_CONFIG.
// We test the config data and the wrapper logic directly to avoid pulling in
// the full CircuitEngine dependency tree (React, Zustand, avr8js).
// ─────────────────────────────────────────────────────────────────────────────

describe('T5 — convertESP32Pin maps Arduino labels to GPIO numbers', () => {
    // Replicate the exact logic from CircuitEngine.convertESP32Pin
    // so we can test it without importing CircuitEngine.
    async function convertESP32Pin(label: string) {
        const { ESP32_BOARD_CONFIG } = await import('../src/simulation/ESP32BoardConfig');
        const gpioNum = ESP32_BOARD_CONFIG.gpio[label];
        if (gpioNum === undefined) {
            throw new Error(`Unknown ESP32 pin label: "${label}"`);
        }
        const adcChannel = ESP32_BOARD_CONFIG.adc[label];
        const i2c = ESP32_BOARD_CONFIG.i2c;
        return {
            gpioNum,
            adcChannel,
            isI2CSDA: gpioNum === i2c.sda,
            isI2CSCL: gpioNum === i2c.scl,
        };
    }

    it('pin "13" maps to gpioNum 13 with no ADC channel', async () => {
        const info = await convertESP32Pin('13');
        expect(info).toEqual({ gpioNum: 13, adcChannel: undefined, isI2CSDA: false, isI2CSCL: false });
    });

    it('pin "36" maps to gpioNum 36 with adcChannel 0 (ADC1_CH0 / VP)', async () => {
        const info = await convertESP32Pin('36');
        expect(info).toMatchObject({ gpioNum: 36, adcChannel: 0 });
    });

    it('pin "21" is the default I2C SDA line', async () => {
        const info = await convertESP32Pin('21');
        expect(info).toMatchObject({ gpioNum: 21, isI2CSDA: true, isI2CSCL: false });
    });

    it('pin "22" is the default I2C SCL line', async () => {
        const info = await convertESP32Pin('22');
        expect(info).toMatchObject({ gpioNum: 22, isI2CSDA: false, isI2CSCL: true });
    });

    it('pin "32" maps to gpioNum 32 with adcChannel 4 (ADC1_CH4)', async () => {
        const info = await convertESP32Pin('32');
        expect(info).toMatchObject({ gpioNum: 32, adcChannel: 4 });
    });

    it('pin "33" maps to gpioNum 33 with adcChannel 5 (ADC1_CH5)', async () => {
        const info = await convertESP32Pin('33');
        expect(info).toMatchObject({ gpioNum: 33, adcChannel: 5 });
    });

    it('unknown label "99" throws an error', async () => {
        await expect(convertESP32Pin('99')).rejects.toThrow('Unknown ESP32 pin label: "99"');
    });

    it('unknown label "INVALID" throws an error', async () => {
        await expect(convertESP32Pin('INVALID')).rejects.toThrow('Unknown ESP32 pin label: "INVALID"');
    });

    it('ESP32_BOARDS set contains the expected FQBN strings', async () => {
        const { ESP32_BOARDS } = await import('../src/simulation/ESP32BoardConfig');
        expect(ESP32_BOARDS.has('espressif:esp32:esp32')).toBe(true);
        expect(ESP32_BOARDS.has('espressif:esp32:esp32s3')).toBe(true);
        expect(ESP32_BOARDS.has('arduino:avr:uno')).toBe(false);
    });
});
