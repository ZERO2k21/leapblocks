import { describe, expect, test } from 'vitest';

import { ArduinoRuntime } from '../ArduinoRuntime';

const wrapSketch = (body: string) => `
${body}
if (typeof __setup === 'function') { __exports.setup = __setup; }
if (typeof __loop === 'function') { __exports.loop = __loop; }
`;

describe('ArduinoRuntime IRremote support', () => {
  test('supports Wokwi-style IrReceiver decoding and HEX serial output', async () => {
    const runtime = new ArduinoRuntime();
    let output = '';

    runtime.onSerialOutput(text => {
      output += text;
    });

    runtime.loadTranspiledCode(wrapSketch(`
      function __setup() {
        IrReceiver.begin(2, ENABLE_LED_FEEDBACK);
      }

      function __loop() {
        if (IrReceiver.decode()) {
          Serial.print(IrReceiver.decodedIRData.address);
          Serial.print(':');
          Serial.println(IrReceiver.decodedIRData.command, HEX);
          IrReceiver.resume();
        }
      }
    `));

    await (runtime as any).setupFn();
    runtime.injectIRSignal(2, { address: 0, command: 48 });
    await (runtime as any).loopFn();

    expect(output).toBe('0:30\n');
  });

  test('supports legacy IRrecv/decode_results decoding', async () => {
    const runtime = new ArduinoRuntime();
    let output = '';

    runtime.onSerialOutput(text => {
      output += text;
    });

    runtime.loadTranspiledCode(wrapSketch(`
      const receiver = new IRrecv(5);
      const results = new decode_results();

      function __setup() {
        receiver.enableIRIn();
      }

      function __loop() {
        if (receiver.decode(results)) {
          Serial.println(results.value, HEX);
          receiver.resume();
        }
      }
    `));

    await (runtime as any).setupFn();
    runtime.injectIRSignal(5, { address: 0, command: 162 });
    await (runtime as any).loopFn();

    expect(output).toBe('FFA25D\n');
  });
});
