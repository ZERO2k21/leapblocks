/**
 * Unit test stubs for ESP32SimulationRunner.parseSerialLine()
 *
 * parseSerialLine is private, so we test it via the public onSerialData path
 * by subclassing and exposing the method, or by driving the full data flow.
 *
 * Run with:  npx vitest --run  (or jest, depending on project config)
 */

import { ESP32SimulationRunner } from '../ESP32SimulationRunner';

// ── Test harness ──────────────────────────────────────────────────────────────
// Subclass to expose the private method for unit testing without mocking IPC.
class TestableRunner extends ESP32SimulationRunner {
    // Expose private method
    public testParseSerialLine(line: string): void {
        // @ts-expect-error — accessing private for testing
        this.parseSerialLine(line);
    }
}

function makeRunner() {
    const runner = new TestableRunner();
    const pinEvents: Array<{ pin: number; high: boolean }> = [];
    const serialChars: string[] = [];
    return { runner, pinEvents, serialChars };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Register a listener on a specific GPIO and collect events */
function watchPin(
    runner: TestableRunner,
    pin: number,
    events: Array<{ pin: number; high: boolean }>
) {
    runner.addPinListener(pin, (high) => events.push({ pin, high }));
}

/** Register a serial listener and collect chars */
function watchSerial(runner: TestableRunner, chars: string[]) {
    runner.addSerialListener((ch) => chars.push(ch));
}

// ─────────────────────────────────────────────────────────────────────────────
// VALID GPIO LINES
// ─────────────────────────────────────────────────────────────────────────────

describe('parseSerialLine — valid GPIO lines', () => {
    test('GPIO 13 HIGH fires pin listener', () => {
        const { runner, pinEvents } = makeRunner();
        watchPin(runner, 13, pinEvents);

        runner.testParseSerialLine('__LF_GPIO:13:1');

        expect(pinEvents).toEqual([{ pin: 13, high: true }]);
    });

    test('GPIO 13 LOW fires pin listener', () => {
        const { runner, pinEvents } = makeRunner();
        watchPin(runner, 13, pinEvents);

        runner.testParseSerialLine('__LF_GPIO:13:0');

        expect(pinEvents).toEqual([{ pin: 13, high: false }]);
    });

    test('GPIO 0 (boundary) is accepted', () => {
        const { runner, pinEvents } = makeRunner();
        watchPin(runner, 0, pinEvents);

        runner.testParseSerialLine('__LF_GPIO:0:1');

        expect(pinEvents).toHaveLength(1);
        expect(pinEvents[0]).toEqual({ pin: 0, high: true });
    });

    test('GPIO 39 (boundary) is accepted', () => {
        const { runner, pinEvents } = makeRunner();
        watchPin(runner, 39, pinEvents);

        runner.testParseSerialLine('__LF_GPIO:39:0');

        expect(pinEvents).toHaveLength(1);
        expect(pinEvents[0]).toEqual({ pin: 39, high: false });
    });

    test('GPIO line does NOT reach serial listeners', () => {
        const { runner, serialChars } = makeRunner();
        watchSerial(runner, serialChars);

        runner.testParseSerialLine('__LF_GPIO:2:1');

        expect(serialChars).toHaveLength(0);
    });

    test('no listener registered for pin — does not crash', () => {
        const { runner } = makeRunner();
        expect(() => runner.testParseSerialLine('__LF_GPIO:5:1')).not.toThrow();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// EDGE CASES — MALFORMED / OUT-OF-RANGE
// ─────────────────────────────────────────────────────────────────────────────

describe('parseSerialLine — malformed GPIO lines discarded silently', () => {
    test('pin 40 (out of range) is discarded', () => {
        const { runner, pinEvents } = makeRunner();
        watchPin(runner, 40, pinEvents);

        runner.testParseSerialLine('__LF_GPIO:40:1');

        expect(pinEvents).toHaveLength(0);
    });

    test('negative pin string is discarded (regex rejects non-digit)', () => {
        const { runner, pinEvents, serialChars } = makeRunner();
        watchSerial(runner, serialChars);

        // Negative sign is not \d — regex won't match, falls to malformed branch
        runner.testParseSerialLine('__LF_GPIO:-1:1');

        expect(pinEvents).toHaveLength(0);
        // Malformed __LF_GPIO line must NOT reach serial monitor
        expect(serialChars).toHaveLength(0);
    });

    test('value "2" (not 0 or 1) is treated as LOW', () => {
        const { runner, pinEvents } = makeRunner();
        watchPin(runner, 5, pinEvents);

        runner.testParseSerialLine('__LF_GPIO:5:2');

        // Regex /^__LF_GPIO:(\d+):(\d)$/ matches any single digit.
        // Value "2" !== "1" → high = false (treated as LOW per spec).
        expect(pinEvents).toEqual([{ pin: 5, high: false }]);
    });

    test('missing value field is discarded', () => {
        const { runner, pinEvents, serialChars } = makeRunner();
        watchSerial(runner, serialChars);

        runner.testParseSerialLine('__LF_GPIO:13:');

        expect(pinEvents).toHaveLength(0);
        expect(serialChars).toHaveLength(0);
    });

    test('extra colon / trailing garbage is discarded', () => {
        const { runner, pinEvents, serialChars } = makeRunner();
        watchSerial(runner, serialChars);

        runner.testParseSerialLine('__LF_GPIO:13:1:extra');

        expect(pinEvents).toHaveLength(0);
        expect(serialChars).toHaveLength(0);
    });

    test('leading whitespace causes regex mismatch — discarded', () => {
        const { runner, pinEvents, serialChars } = makeRunner();
        watchSerial(runner, serialChars);

        runner.testParseSerialLine(' __LF_GPIO:13:1');

        // Does not start with "__LF_GPIO:" so it goes to serial path
        // (whitespace prefix makes it a normal serial line)
        expect(pinEvents).toHaveLength(0);
        expect(serialChars.join('')).toBe(' __LF_GPIO:13:1\n');
    });

    test('multi-digit value field is rejected by regex', () => {
        const { runner, pinEvents, serialChars } = makeRunner();
        watchSerial(runner, serialChars);

        runner.testParseSerialLine('__LF_GPIO:13:10');

        expect(pinEvents).toHaveLength(0);
        expect(serialChars).toHaveLength(0);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY LINES
// ─────────────────────────────────────────────────────────────────────────────

describe('parseSerialLine — empty lines', () => {
    test('empty string is discarded silently', () => {
        const { runner, serialChars } = makeRunner();
        watchSerial(runner, serialChars);

        runner.testParseSerialLine('');

        expect(serialChars).toHaveLength(0);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// NORMAL SERIAL OUTPUT
// ─────────────────────────────────────────────────────────────────────────────

describe('parseSerialLine — normal serial lines', () => {
    test('plain text forwarded char-by-char with trailing newline', () => {
        const { runner, serialChars } = makeRunner();
        watchSerial(runner, serialChars);

        runner.testParseSerialLine('Hello');

        expect(serialChars.join('')).toBe('Hello\n');
    });

    test('does not fire any pin listeners', () => {
        const { runner, pinEvents } = makeRunner();
        watchPin(runner, 2, pinEvents);

        runner.testParseSerialLine('GPIO2 is fine');

        expect(pinEvents).toHaveLength(0);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BUFFER INTEGRATION — partial lines held until \n arrives
// ─────────────────────────────────────────────────────────────────────────────

describe('onSerialData — partial line buffering', () => {
    test('partial GPIO line held in buffer until newline arrives', () => {
        const { runner, pinEvents } = makeRunner();
        watchPin(runner, 4, pinEvents);

        // Simulate two chunks: first without \n, second completes the line
        // @ts-expect-error — accessing private for testing
        runner.onSerialData('__LF_GPIO:4');
        expect(pinEvents).toHaveLength(0); // not yet complete

        // @ts-expect-error
        runner.onSerialData(':1\n');
        expect(pinEvents).toEqual([{ pin: 4, high: true }]);
    });

    test('multiple lines in one chunk all processed', () => {
        const { runner, pinEvents } = makeRunner();
        watchPin(runner, 2, pinEvents);
        watchPin(runner, 5, pinEvents);

        // @ts-expect-error
        runner.onSerialData('__LF_GPIO:2:1\n__LF_GPIO:5:0\n');

        expect(pinEvents).toEqual([
            { pin: 2, high: true },
            { pin: 5, high: false },
        ]);
    });
});
