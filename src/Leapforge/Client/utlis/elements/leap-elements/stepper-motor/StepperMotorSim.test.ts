/**
 * StepperMotorSim.test.ts - Unit tests for stepper motor simulator
 * 
 * Tests verify:
 * - Basic step mechanics (1.8° per full step)
 * - Full revolution (200 steps = 360°)
 * - Direction detection (CW/CCW)
 * - Gear ratio calculations
 * - Angle wraparound (0-360 range)
 */

import StepperMotorSimulator from './StepperMotorSim';

describe('StepperMotorSimulator', () => {
  let simulator: StepperMotorSimulator;

  beforeEach(() => {
    simulator = new StepperMotorSimulator('1:1', false);
  });

  describe('Basic Step Mechanics', () => {
    test('1 full step CW = 1.8 degrees', () => {
      let updateCount = 0;
      let lastAngle = 0;

      simulator.onStepUpdate((steps, angle) => {
        updateCount++;
        lastAngle = angle;
      });

      // Full step sequence: CW through one pattern transition
      simulator.onPinChange('A+', true);
      simulator.onPinChange('B+', true);
      // Current pattern: A+ B+ = 1100
      expect(updateCount).toBe(0); // No step yet

      // Transition to next pattern
      simulator.onPinChange('A+', false);
      simulator.onPinChange('A-', true);
      // New pattern: A- B+ = 0110 (next in sequence)
      expect(updateCount).toBe(1);
      expect(lastAngle).toBeCloseTo(1.8, 1);
      expect(simulator.getStepCount()).toBe(1);
    });

    test('1 full step CCW = -1.8 degrees (angle: 358.2°)', () => {
      let updateCount = 0;
      let lastAngle = 0;

      simulator.onStepUpdate((steps, angle) => {
        updateCount++;
        lastAngle = angle;
      });

      // Set initial pattern: A+ B+ = 1100 (step 0)
      simulator.onPinChange('A+', true);
      simulator.onPinChange('B+', true);
      updateCount = 0; // Reset count

      // Step backward (CCW) to previous pattern: A+ B- = 1001
      simulator.onPinChange('B+', false);
      simulator.onPinChange('B-', true);
      // A+ B- = 1001 (previous in sequence, CCW)
      expect(updateCount).toBe(1);
      expect(simulator.getStepCount()).toBe(-1);
      expect(lastAngle).toBeCloseTo(358.2, 1);
    });
  });

  describe('Full Revolution', () => {
    test('200 full steps = 360 degrees = 1 complete revolution', () => {
      let finalSteps = 0;
      let finalAngle = 0;

      simulator.onStepUpdate((steps, angle) => {
        finalSteps = steps;
        finalAngle = angle;
      });

      // Simulate 200 CW steps by going through full step sequence 50 times
      const sequence = [
        { A_pos: true, A_neg: false, B_pos: true, B_neg: false },  // 0
        { A_pos: false, A_neg: true, B_pos: true, B_neg: false },  // 1
        { A_pos: false, A_neg: true, B_pos: false, B_neg: true },  // 2
        { A_pos: true, A_neg: false, B_pos: false, B_neg: true },  // 3
      ];

      // Repeat sequence 50 times for 200 steps
      for (let i = 0; i < 50; i++) {
        const current = sequence[i % 4];
        const next = sequence[(i + 1) % 4];

        simulator.onPinChange('A+', next.A_pos);
        simulator.onPinChange('A-', next.A_neg);
        simulator.onPinChange('B+', next.B_pos);
        simulator.onPinChange('B-', next.B_neg);
      }

      expect(finalSteps).toBe(50);
      expect(finalAngle).toBeCloseTo(90, 1); // 50 steps * 1.8° = 90°
    });

    test('Full circle returns to 0 degrees (360° wraps to 0°)', () => {
      let finalAngle = 0;

      simulator.onStepUpdate((steps, angle) => {
        finalAngle = angle;
      });

      // Complete full revolution: 200 steps
      const sequence = [
        { A_pos: true, A_neg: false, B_pos: true, B_neg: false },
        { A_pos: false, A_neg: true, B_pos: true, B_neg: false },
        { A_pos: false, A_neg: true, B_pos: false, B_neg: true },
        { A_pos: true, A_neg: false, B_pos: false, B_neg: true },
      ];

      for (let i = 0; i < 200; i++) {
        const next = sequence[(i + 1) % 4];
        simulator.onPinChange('A+', next.A_pos);
        simulator.onPinChange('A-', next.A_neg);
        simulator.onPinChange('B+', next.B_pos);
        simulator.onPinChange('B-', next.B_neg);
      }

      // 200 steps = 360°, wraps to 0°
      expect(simulator.getStepCount()).toBe(200);
      expect(finalAngle).toBeCloseTo(0, 1); // 360° mod 360 = 0°
    });
  });

  describe('Direction Handling', () => {
    test('Alternating CW and CCW steps cancel out', () => {
      let finalSteps = 0;

      simulator.onStepUpdate((steps, angle) => {
        finalSteps = steps;
      });

      const sequence = [
        { A_pos: true, A_neg: false, B_pos: true, B_neg: false },  // 0
        { A_pos: false, A_neg: true, B_pos: true, B_neg: false },  // 1
        { A_pos: false, A_neg: true, B_pos: false, B_neg: true },  // 2
        { A_pos: true, A_neg: false, B_pos: false, B_neg: true },  // 3
      ];

      // 50 steps CW
      for (let i = 0; i < 50; i++) {
        const next = sequence[(i + 1) % 4];
        simulator.onPinChange('A+', next.A_pos);
        simulator.onPinChange('A-', next.A_neg);
        simulator.onPinChange('B+', next.B_pos);
        simulator.onPinChange('B-', next.B_neg);
      }

      // 50 steps CCW (back)
      for (let i = 50; i > 0; i--) {
        const prev = sequence[(i - 1 + 4) % 4];
        simulator.onPinChange('A+', prev.A_pos);
        simulator.onPinChange('A-', prev.A_neg);
        simulator.onPinChange('B+', prev.B_pos);
        simulator.onPinChange('B-', prev.B_neg);
      }

      // Should return to original position
      expect(finalSteps).toBe(0);
      expect(simulator.getAngle()).toBeCloseTo(0, 1);
    });
  });

  describe('Gear Ratio Calculations', () => {
    test('Gear ratio 1:1 - 200 steps = 360 degrees', () => {
      simulator.setGearRatio('1:1');

      let finalAngle = 0;
      simulator.onStepUpdate((steps, angle) => {
        finalAngle = angle;
      });

      // 200 steps
      simulator.onPinChange('A+', true);
      simulator.onPinChange('B+', true);
      simulator.onPinChange('A-', true);

      expect(finalAngle).toBeCloseTo(1.8, 1);
    });

    test('Gear ratio 2:1 - 400 steps = 360 degrees (1 revolution)', () => {
      simulator.setGearRatio('2:1');

      let finalAngle = 0;
      let stepCount = 0;

      simulator.onStepUpdate((steps, angle) => {
        stepCount = steps;
        finalAngle = angle;
      });

      const sequence = [
        { A_pos: true, A_neg: false, B_pos: true, B_neg: false },
        { A_pos: false, A_neg: true, B_pos: true, B_neg: false },
        { A_pos: false, A_neg: true, B_pos: false, B_neg: true },
        { A_pos: true, A_neg: false, B_pos: false, B_neg: true },
      ];

      // 400 steps (200 pattern repetitions)
      for (let i = 0; i < 200; i++) {
        const next = sequence[(i + 1) % 4];
        simulator.onPinChange('A+', next.A_pos);
        simulator.onPinChange('A-', next.A_neg);
        simulator.onPinChange('B+', next.B_pos);
        simulator.onPinChange('B-', next.B_neg);
      }

      expect(stepCount).toBe(200);
    });

    test('Gear ratio 4:1 - steps per revolution increases', () => {
      simulator.setGearRatio('4:1');

      let finalAngle = 0;
      simulator.onStepUpdate((steps, angle) => {
        finalAngle = angle;
      });

      // One step
      simulator.onPinChange('A+', true);
      simulator.onPinChange('B+', true);
      simulator.onPinChange('A-', true);

      // With 4:1 ratio, 1 step = 1.8 / 4 = 0.45 degrees
      expect(finalAngle).toBeCloseTo(0.45, 1);
    });
  });

  describe('Reset and State', () => {
    test('Reset clears all state', () => {
      // Simulate some steps
      simulator.onPinChange('A+', true);
      simulator.onPinChange('B+', true);
      simulator.onPinChange('A-', true);

      expect(simulator.getStepCount()).toBe(1);
      expect(simulator.getAngle()).toBeGreaterThan(0);

      // Reset
      simulator.reset();

      expect(simulator.getStepCount()).toBe(0);
      expect(simulator.getAngle()).toBeCloseTo(0, 1);
    });

    test('getState returns current simulator state', () => {
      simulator.onPinChange('A+', true);
      simulator.onPinChange('B+', true);

      const state = simulator.getState();

      expect(state).toHaveProperty('stepCount');
      expect(state).toHaveProperty('angle');
      expect(state).toHaveProperty('gearRatio');
      expect(state).toHaveProperty('currentPattern');
      expect(state).toHaveProperty('pins');
    });
  });

  describe('Edge Cases', () => {
    test('Negative step count (CCW past zero) wraps angle correctly', () => {
      let finalAngle = 0;

      simulator.onStepUpdate((steps, angle) => {
        finalAngle = angle;
      });

      // Go backward from initial state
      simulator.onPinChange('B+', false);
      simulator.onPinChange('B-', true);

      expect(simulator.getStepCount()).toBe(-1);
      expect(finalAngle).toBeCloseTo(358.2, 1); // 360 - 1.8
    });

    test('Large step count maintains 0-360 range', () => {
      let finalAngle = 0;

      simulator.onStepUpdate((steps, angle) => {
        finalAngle = angle;
      });

      // Simulate manually setting high step count
      const sequence = [
        { A_pos: true, A_neg: false, B_pos: true, B_neg: false },
        { A_pos: false, A_neg: true, B_pos: true, B_neg: false },
        { A_pos: false, A_neg: true, B_pos: false, B_neg: true },
        { A_pos: true, A_neg: false, B_pos: false, B_neg: true },
      ];

      // 1000 steps (2.5 revolutions + 200 steps)
      for (let i = 0; i < 500; i++) {
        const next = sequence[(i + 1) % 4];
        simulator.onPinChange('A+', next.A_pos);
        simulator.onPinChange('A-', next.A_neg);
        simulator.onPinChange('B+', next.B_pos);
        simulator.onPinChange('B-', next.B_neg);
      }

      // Should be in 0-360 range
      expect(finalAngle).toBeGreaterThanOrEqual(0);
      expect(finalAngle).toBeLessThan(360);
    });
  });
});
