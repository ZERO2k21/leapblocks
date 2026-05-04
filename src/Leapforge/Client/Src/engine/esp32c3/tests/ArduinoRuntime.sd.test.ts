import { describe, expect, test } from 'vitest';

import { createSDLibraryBridge } from '../../Arduino/SDLibraryBridge';
import { ArduinoRuntime } from '../ArduinoRuntime';

const wrapSketch = (body: string) => `
${body}
if (typeof __setup === 'function') { __exports.setup = __setup; }
if (typeof __loop === 'function') { __exports.loop = __loop; }
`;

describe('ArduinoRuntime SD support', () => {
  test('provides a default SD shim when no bridge has been injected yet', async () => {
    const runtime = new ArduinoRuntime();
    let output = '';

    runtime.onSerialOutput(text => {
      output += text;
    });

    runtime.loadTranspiledCode(wrapSketch(`
      function __setup() {
        Serial.println(SD.begin() ? "mounted" : "missing");
      }
    `));

    await (runtime as any).setupFn();

    expect(output).toBe('missing\n');
  });

  test('supports Arduino-style SD.begin() static calls in transpiled sketches', async () => {
    const runtime = new ArduinoRuntime();
    let output = '';
    const { SD } = createSDLibraryBridge(new Map([['card-1', {} as any]]));

    runtime.injectLibraryClass('SD', SD);
    runtime.onSerialOutput(text => {
      output += text;
    });

    runtime.loadTranspiledCode(wrapSketch(`
      function __setup() {
        Serial.println(SD.begin() ? "mounted" : "missing");
        var file = SD.open("/log.txt");
        Serial.println(file.isOpen());
        Serial.println(file.print("abc"));
      }
    `));

    await (runtime as any).setupFn();

    expect(output).toBe('mounted\ntrue\n3\n');
  });

  test('supports instance-based SD access for default-constructed shims', async () => {
    const runtime = new ArduinoRuntime();
    let output = '';
    const { SD } = createSDLibraryBridge(new Map());

    runtime.injectLibraryClass('SD', SD);
    runtime.onSerialOutput(text => {
      output += text;
    });

    runtime.loadTranspiledCode(wrapSketch(`
      var sd = new SD();

      function __setup() {
        Serial.println(sd.begin() ? "mounted" : "missing");
        Serial.println(sd.cardSize());
      }
    `));

    await (runtime as any).setupFn();

    expect(output).toBe('missing\n4096\n');
  });
});
