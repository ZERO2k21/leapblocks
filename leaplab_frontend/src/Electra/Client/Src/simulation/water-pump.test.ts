import { describe, test, expect } from 'vitest';
import { LEAP_PINS } from '../engine/Arduino/PinHarness';
import { getComponentPins } from '../lib/PinMap';

describe('Water Pump Component Setup & Pin Harness', () => {
  test('LEAP_PINS includes water-pump definition', () => {
    expect(LEAP_PINS['water-pump']).toBeDefined();
    expect(LEAP_PINS['water-pump'].pins).toHaveLength(2);
    expect(LEAP_PINS['water-pump'].pins[0].name).toBe('POS');
    expect(LEAP_PINS['water-pump'].pins[1].name).toBe('NEG');
  });

  test('getComponentPins returns percent-based pin coordinates for water-pump', () => {
    const pins = getComponentPins('water-pump');
    expect(pins).toHaveLength(2);
    expect(pins[0].name).toBe('POS');
    expect(pins[1].name).toBe('NEG');
    expect(pins[0].x).toBeGreaterThan(0);
    expect(pins[0].y).toBeGreaterThan(0);
  });
});
