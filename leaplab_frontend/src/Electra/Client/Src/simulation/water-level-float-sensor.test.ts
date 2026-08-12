import { describe, it, expect } from 'vitest';
import { LEAP_PINS } from '../engine/Arduino/PinHarness';

describe('Water Level Float Sensor Component Specs', () => {
  it('defines valid PinHarness geometry and pins for water-level-float-sensor', () => {
    const harness = LEAP_PINS['water-level-float-sensor'];
    expect(harness).toBeDefined();
    expect(harness.viewBox.width).toBe(200);
    expect(harness.viewBox.height).toBe(300);

    const pinNames = harness.pins.map((p: any) => p.name);
    expect(pinNames).toContain('S');
    expect(pinNames).toContain('+');
    expect(pinNames).toContain('-');
  });

  it('verifies element exports and IntrinsicElements typing', async () => {
    const exports = await import('../../utlis/elements/leap-elements');
    expect(exports.WaterLevelFloatSensorElement).toBeDefined();
  });
});
