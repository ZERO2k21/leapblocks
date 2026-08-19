import { describe, it, expect } from 'vitest';
import { A4988Element } from './a4988-element';

describe('A4988Element', () => {
    it('should be defined', () => {
        const el = document.createElement('leap-a4988');
        expect(el).toBeInstanceOf(A4988Element);
    });

    it('should have correct pin info', () => {
        const el = document.createElement('leap-a4988') as A4988Element;
        const pins = el.pinInfo;

        expect(pins).toHaveLength(16);
        expect(pins[0].name).toBe('ENABLE');
        expect(pins[6].name).toBe('STEP');
        expect(pins[7].name).toBe('DIR');
        expect(pins[8].name).toBe('VDD');
        expect(pins[10].name).toBe('2B');
        expect(pins[12].name).toBe('1A');
    });

    it('should render with default properties', () => {
        const el = document.createElement('leap-a4988') as A4988Element;
        document.body.appendChild(el);

        expect(el.enable).toBe(false);
        expect(el.ms1).toBe(false);
        expect(el.ms2).toBe(false);
        expect(el.ms3).toBe(false);
        expect(el.reset).toBe(true);
        expect(el.sleep).toBe(true);
        expect(el.step).toBe(false);
        expect(el.dir).toBe(false);

        document.body.removeChild(el);
    });

    it('should update properties', () => {
        const el = document.createElement('leap-a4988') as A4988Element;
        document.body.appendChild(el);

        el.enable = true;
        el.step = true;
        el.dir = true;
        el.ms1 = true;

        expect(el.enable).toBe(true);
        expect(el.step).toBe(true);
        expect(el.dir).toBe(true);
        expect(el.ms1).toBe(true);

        document.body.removeChild(el);
    });
});
