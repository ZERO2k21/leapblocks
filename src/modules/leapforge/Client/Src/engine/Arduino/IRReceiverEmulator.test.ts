import { afterEach, describe, expect, test } from 'vitest';

import { IRReceiverEmulator } from './IRReceiverEmulator';
import { simulationRunner } from './SimulationRunner';

describe('IRReceiverEmulator', () => {
  afterEach(() => {
    simulationRunner.reset();
  });

  test('schedules AVR pulses relative to the current CPU cycle and idles the line HIGH', () => {
    simulationRunner.setBoard('arduino-uno');
    simulationRunner.initCPU();

    const runner = simulationRunner as any;
    runner.cpu.cycles = 123456;

    const emulator = new IRReceiverEmulator('PD2', 'receiver-1');
    expect(simulationRunner.getPinState('PD2')).toBe('HIGH');

    emulator.transmit(0x30, 0x00);

    const scheduledEvents = runner.scheduledEvents as Array<{ targetCycles: number }>;
    expect(scheduledEvents.length).toBeGreaterThan(10);
    expect(scheduledEvents[0].targetCycles).toBe(123456);
    expect(scheduledEvents[1].targetCycles).toBeGreaterThan(scheduledEvents[0].targetCycles);
  });
});
