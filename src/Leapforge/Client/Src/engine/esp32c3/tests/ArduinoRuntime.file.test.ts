import { describe, expect, test } from 'vitest';

import { ArduinoRuntime } from '../ArduinoRuntime';

const wrapSketch = (body: string) => `
${body}
if (typeof __setup === 'function') { __exports.setup = __setup; }
if (typeof __loop === 'function') { __exports.loop = __loop; }
`;

describe('ArduinoRuntime File support', () => {
  test('shadows the browser File constructor for transpiled Arduino sketches', async () => {
    const runtime = new ArduinoRuntime();
    let output = '';

    runtime.onSerialOutput(text => {
      output += text;
    });

    expect(() => {
      runtime.loadTranspiledCode(wrapSketch(`
        var logFile = new File();

        function __setup() {
          Serial.println(logFile.isOpen());
          logFile.print("abc");
          Serial.println(logFile.available());
        }
      `));
    }).not.toThrow();

    await (runtime as any).setupFn();

    expect(output).toBe('true\n3\n');
  });
});
