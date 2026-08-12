import { describe, it, expect } from 'vitest';
import { WaterPumpElement } from './water-pump-element';

describe('WaterPumpElement', () => {
  it('should instantiate and have default properties', () => {
    const pump = new WaterPumpElement();
    expect(pump.speed).toBe(0);
    expect(pump.running).toBe(false);
    expect(pump.direction).toBe('cw');
  });

  it('should report correct pinInfo with POS and NEG terminals', () => {
    const pump = new WaterPumpElement();
    const pins = pump.pinInfo;
    expect(pins).toHaveLength(2);
    expect(pins[0].name).toBe('POS');
    expect(pins[1].name).toBe('NEG');
  });
});
