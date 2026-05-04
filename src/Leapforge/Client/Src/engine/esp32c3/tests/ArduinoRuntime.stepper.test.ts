import { describe, expect, test } from 'vitest';

import { ArduinoRuntime } from '../ArduinoRuntime';

const wrapSketch = (body: string) => `
${body}
if (typeof __setup === 'function') { __exports.setup = __setup; }
if (typeof __loop === 'function') { __exports.loop = __loop; }
`;

describe('ArduinoRuntime Stepper support', () => {
  test('drives two independent 4-wire Stepper instances like the Wokwi biaxial example', async () => {
    const runtime = new ArduinoRuntime();

    runtime.loadTranspiledCode(wrapSketch(`
      const outer = new Stepper(200, 2, 3, 4, 5);
      const inner = new Stepper(200, 8, 9, 10, 11);

      function __setup() {
        outer.setSpeed(20);
        inner.setSpeed(90);
        outer.step(1);
        inner.step(2);
      }
    `));

    await (runtime as any).setupFn();

    const pinModes = (runtime as any).pinModes as Map<number, string>;
    const pinValues = (runtime as any).pinValues as Map<number, number>;

    expect(pinModes.get(2)).toBe('OUTPUT');
    expect(pinModes.get(11)).toBe('OUTPUT');

    expect([
      pinValues.get(2),
      pinValues.get(3),
      pinValues.get(4),
      pinValues.get(5),
    ]).toEqual([0, 1, 1, 0]);

    expect([
      pinValues.get(8),
      pinValues.get(9),
      pinValues.get(10),
      pinValues.get(11),
    ]).toEqual([0, 1, 0, 1]);
  });

  test('supports reverse 4-wire stepping', async () => {
    const runtime = new ArduinoRuntime();

    runtime.loadTranspiledCode(wrapSketch(`
      const motor = new Stepper(200, 2, 3, 4, 5);

      function __setup() {
        motor.step(-1);
      }
    `));

    await (runtime as any).setupFn();

    const pinValues = (runtime as any).pinValues as Map<number, number>;

    expect([
      pinValues.get(2),
      pinValues.get(3),
      pinValues.get(4),
      pinValues.get(5),
    ]).toEqual([1, 0, 0, 1]);
  });
});
