import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { StepperEmulator, type StepperState } from './StepperEmulator';

describe('StepperEmulator', () => {
  let consoleLog: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLog.mockRestore();
  });

  test('tracks Arduino Stepper.h clockwise and counterclockwise 4-wire sequences', () => {
    const states: StepperState[] = [];
    const stepper = new StepperEmulator(
      state => states.push({ ...state, coilState: [...state.coilState] }),
      { stepsPerRev: 200 },
      'test-stepper',
    );

    let stepNumber = 0;
    const motorPins = [false, false, false, false];

    const digitalWrite = (pinIndex: number, value: boolean) => {
      motorPins[pinIndex] = value;

      // Test wiring matches the reported circuit:
      // Arduino pins 8,9,10,11 -> A-,A+,B+,B-.
      stepper.processCoils(
        motorPins[1],
        motorPins[2],
        motorPins[0],
        motorPins[3],
      );
    };

    const stepMotor = (thisStep: number) => {
      switch (thisStep) {
        case 0:
          digitalWrite(0, true);
          digitalWrite(1, false);
          digitalWrite(2, true);
          digitalWrite(3, false);
          break;
        case 1:
          digitalWrite(0, false);
          digitalWrite(1, true);
          digitalWrite(2, true);
          digitalWrite(3, false);
          break;
        case 2:
          digitalWrite(0, false);
          digitalWrite(1, true);
          digitalWrite(2, false);
          digitalWrite(3, true);
          break;
        case 3:
          digitalWrite(0, true);
          digitalWrite(1, false);
          digitalWrite(2, false);
          digitalWrite(3, true);
          break;
      }
    };

    const runStepperLibrarySteps = (stepsToMove: number) => {
      let stepsLeft = Math.abs(stepsToMove);
      const direction = stepsToMove > 0 ? 1 : 0;

      while (stepsLeft > 0) {
        if (direction === 1) {
          stepNumber++;
          if (stepNumber === 200) stepNumber = 0;
        } else {
          if (stepNumber === 0) stepNumber = 200;
          stepNumber--;
        }

        stepsLeft--;
        stepMotor(stepNumber % 4);
      }
    };

    runStepperLibrarySteps(200);
    const afterClockwise = stepper.getState().stepCount;
    expect(afterClockwise).toBeGreaterThan(0);

    const beforeCounterClockwiseStates = states.length;
    runStepperLibrarySteps(-200);

    expect(stepper.getState().stepCount).toBe(afterClockwise - 200);

    let previousCount = afterClockwise;
    for (const state of states.slice(beforeCounterClockwiseStates)) {
      expect(state.stepCount).toBeLessThanOrEqual(previousCount);
      previousCount = state.stepCount;
    }
  });

  test('preserves unwrapped STEP/DIR rotation across full revolutions', () => {
    const stepper = new StepperEmulator(() => {}, { stepsPerRev: 200 }, 'a4988-stepper');

    stepper.setDirection(true);
    for (let i = 0; i < 200; i++) {
      stepper.processStep(true);
      stepper.processStep(false);
    }

    const state = stepper.getState();
    expect(state.stepCount).toBe(200);
    expect(state.angle).toBeCloseTo(0, 5);
    expect(state.absoluteAngle).toBeCloseTo(360, 5);
  });
});
