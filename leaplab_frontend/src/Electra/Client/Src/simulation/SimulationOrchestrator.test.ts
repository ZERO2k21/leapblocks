import { describe, test, expect, vi } from 'vitest';
import { SimulationOrchestrator } from './SimulationOrchestrator';
import type { ISimulationEngine, BoardType, CompiledFirmware, SimulationResult } from './types';

// ---------------------------------------------------------------------------
// Mock engine factory
// ---------------------------------------------------------------------------

interface MockEngineOptions {
  name: string;
  priority: number;
  available?: boolean;
  compileFails?: boolean;
  runFails?: boolean;
}

function createMockEngine(opts: MockEngineOptions): ISimulationEngine {
  const available = opts.available ?? true;

  return {
    name: opts.name,
    priority: opts.priority,

    isAvailable: vi.fn().mockResolvedValue(available),

    compile: vi.fn().mockImplementation(async (_code: string, board: BoardType): Promise<CompiledFirmware> => {
      if (opts.compileFails) {
        throw new Error(`[${opts.name}] compile failed`);
      }
      return {
        binary: 'mock-binary',
        board,
        engine: opts.name,
      };
    }),

    run: vi.fn().mockImplementation(async (): Promise<SimulationResult> => {
      if (opts.runFails) {
        throw new Error(`[${opts.name}] run failed`);
      }
      return {
        engine: opts.name as 'velxio' | 'transpiled-js' | 'riscv',
        serial: [],
        pinStates: {},
        errors: [],
        durationMs: 100,
      };
    }),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SimulationOrchestrator', () => {
  test('1. TranspiledJS available → uses TranspiledJS (priority=1), never calls Velxio', async () => {
    const transpiled = createMockEngine({ name: 'transpiled-js', priority: 1, available: true });
    const velxio = createMockEngine({ name: 'velxio', priority: 2, available: true });

    const orchestrator = new SimulationOrchestrator([velxio, transpiled]);
    const result = await orchestrator.run('void setup(){} void loop(){}', 'esp32c3');

    expect(result.engine).toBe('transpiled-js');
    expect(transpiled.isAvailable).toHaveBeenCalledTimes(1);
    expect(transpiled.compile).toHaveBeenCalledTimes(1);
    expect(transpiled.run).toHaveBeenCalledTimes(1);
    expect(velxio.isAvailable).not.toHaveBeenCalled();
  });

  test('2. TranspiledJS unavailable → skips to Velxio (priority=2)', async () => {
    const transpiled = createMockEngine({ name: 'transpiled-js', priority: 1, available: false });
    const velxio = createMockEngine({ name: 'velxio', priority: 2, available: true });

    const orchestrator = new SimulationOrchestrator([velxio, transpiled]);
    const result = await orchestrator.run('code', 'esp32c3');

    expect(result.engine).toBe('velxio');
    expect(transpiled.isAvailable).toHaveBeenCalledTimes(1);
    expect(transpiled.compile).not.toHaveBeenCalled();
    expect(velxio.compile).toHaveBeenCalledTimes(1);
    expect(velxio.run).toHaveBeenCalledTimes(1);
  });

  test('3. TranspiledJS fails at compile → falls to Velxio', async () => {
    const transpiled = createMockEngine({ name: 'transpiled-js', priority: 1, available: true, compileFails: true });
    const velxio = createMockEngine({ name: 'velxio', priority: 2, available: true });

    const orchestrator = new SimulationOrchestrator([velxio, transpiled]);
    const result = await orchestrator.run('code', 'esp32c3');

    expect(result.engine).toBe('velxio');
    expect(transpiled.isAvailable).toHaveBeenCalledTimes(1);
    expect(transpiled.compile).toHaveBeenCalledTimes(1);
    expect(transpiled.run).not.toHaveBeenCalled();
    expect(velxio.compile).toHaveBeenCalledTimes(1);
    expect(velxio.run).toHaveBeenCalledTimes(1);
  });

  test('4. TranspiledJS + Velxio both fail → falls to RiscV', async () => {
    const transpiled = createMockEngine({ name: 'transpiled-js', priority: 1, available: true, runFails: true });
    const velxio = createMockEngine({ name: 'velxio', priority: 2, available: true, compileFails: true });
    const riscv = createMockEngine({ name: 'riscv', priority: 3, available: true });

    const orchestrator = new SimulationOrchestrator([transpiled, velxio, riscv]);
    const result = await orchestrator.run('code', 'esp32c3');

    expect(result.engine).toBe('riscv');
    expect(transpiled.isAvailable).toHaveBeenCalledTimes(1);
    expect(transpiled.compile).toHaveBeenCalledTimes(1);
    expect(transpiled.run).toHaveBeenCalledTimes(1);
    expect(velxio.compile).toHaveBeenCalledTimes(1);
    expect(riscv.compile).toHaveBeenCalledTimes(1);
    expect(riscv.run).toHaveBeenCalledTimes(1);
  });

  test('5. All three fail → throws "All simulation engines failed"', async () => {
    const transpiled = createMockEngine({ name: 'transpiled-js', priority: 1, available: true, compileFails: true });
    const velxio = createMockEngine({ name: 'velxio', priority: 2, available: true, compileFails: true });
    const riscv = createMockEngine({ name: 'riscv', priority: 3, available: true, compileFails: true });

    const orchestrator = new SimulationOrchestrator([transpiled, velxio, riscv]);

    await expect(orchestrator.run('code', 'esp32c3')).rejects.toThrow('All simulation engines failed');
  });

  test('6. SimulationResult always contains engine field showing which ran', async () => {
    const engines = [
      createMockEngine({ name: 'transpiled-js', priority: 1, available: true }),
      createMockEngine({ name: 'velxio', priority: 2, available: false }),
      createMockEngine({ name: 'riscv', priority: 3, available: false }),
    ];

    const orchestrator = new SimulationOrchestrator(engines);
    const result = await orchestrator.run('code', 'esp32c3');

    expect(result).toHaveProperty('engine');
    expect(result.engine).toBe('transpiled-js');
    expect(result.serial).toBeDefined();
    expect(result.pinStates).toBeDefined();
    expect(result.errors).toBeDefined();
    expect(typeof result.durationMs).toBe('number');
  });

  test('7. Engine order is always [transpiled-js, velxio, riscv] regardless of constructor order', async () => {
    const riscv = createMockEngine({ name: 'riscv', priority: 3, available: true });
    const velxio = createMockEngine({ name: 'velxio', priority: 2, available: true });
    const transpiled = createMockEngine({ name: 'transpiled-js', priority: 1, available: true });

    // Pass engines in reverse priority order
    const orchestrator = new SimulationOrchestrator([riscv, velxio, transpiled]);

    const result = await orchestrator.run('code', 'esp32c3');

    // TranspiledJS (priority 1) should still run first
    expect(result.engine).toBe('transpiled-js');
    expect(transpiled.isAvailable).toHaveBeenCalledTimes(1);
    expect(velxio.isAvailable).not.toHaveBeenCalled();
    expect(riscv.isAvailable).not.toHaveBeenCalled();

    // Verify status order is sorted by priority
    const status = orchestrator.getEngineStatus();
    expect(status).toHaveLength(3);
    expect(status[0].name).toBe('transpiled-js');
    expect(status[0].priority).toBe(1);
    expect(status[1].name).toBe('velxio');
    expect(status[1].priority).toBe(2);
    expect(status[2].name).toBe('riscv');
    expect(status[2].priority).toBe(3);
  });
});
