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
  test('1. Velxio available → uses Velxio (priority=1), never calls TranspiledJS', async () => {
    const velxio = createMockEngine({ name: 'velxio', priority: 1, available: true });
    const transpiled = createMockEngine({ name: 'transpiled-js', priority: 2, available: true });

    const orchestrator = new SimulationOrchestrator([velxio, transpiled]);
    const result = await orchestrator.run('void setup(){} void loop(){}', 'esp32c3');

    expect(result.engine).toBe('velxio');
    expect(velxio.isAvailable).toHaveBeenCalledTimes(1);
    expect(velxio.compile).toHaveBeenCalledTimes(1);
    expect(velxio.run).toHaveBeenCalledTimes(1);
    expect(transpiled.isAvailable).not.toHaveBeenCalled();
  });

  test('2. Velxio unavailable → skips to TranspiledJS (priority=2)', async () => {
    const velxio = createMockEngine({ name: 'velxio', priority: 1, available: false });
    const transpiled = createMockEngine({ name: 'transpiled-js', priority: 2, available: true });

    const orchestrator = new SimulationOrchestrator([velxio, transpiled]);
    const result = await orchestrator.run('code', 'esp32c3');

    expect(result.engine).toBe('transpiled-js');
    expect(velxio.isAvailable).toHaveBeenCalledTimes(1);
    expect(velxio.compile).not.toHaveBeenCalled();
    expect(transpiled.compile).toHaveBeenCalledTimes(1);
    expect(transpiled.run).toHaveBeenCalledTimes(1);
  });

  test('3. Velxio fails at compile → falls to TranspiledJS', async () => {
    const velxio = createMockEngine({ name: 'velxio', priority: 1, available: true, compileFails: true });
    const transpiled = createMockEngine({ name: 'transpiled-js', priority: 2, available: true });

    const orchestrator = new SimulationOrchestrator([velxio, transpiled]);
    const result = await orchestrator.run('code', 'esp32c3');

    expect(result.engine).toBe('transpiled-js');
    expect(velxio.isAvailable).toHaveBeenCalledTimes(1);
    expect(velxio.compile).toHaveBeenCalledTimes(1);
    expect(velxio.run).not.toHaveBeenCalled();
    expect(transpiled.compile).toHaveBeenCalledTimes(1);
    expect(transpiled.run).toHaveBeenCalledTimes(1);
  });

  test('4. Velxio + TranspiledJS both fail → falls to RiscV', async () => {
    const velxio = createMockEngine({ name: 'velxio', priority: 1, available: true, runFails: true });
    const transpiled = createMockEngine({ name: 'transpiled-js', priority: 2, available: true, compileFails: true });
    const riscv = createMockEngine({ name: 'riscv', priority: 3, available: true });

    const orchestrator = new SimulationOrchestrator([velxio, transpiled, riscv]);
    const result = await orchestrator.run('code', 'esp32c3');

    expect(result.engine).toBe('riscv');
    expect(velxio.isAvailable).toHaveBeenCalledTimes(1);
    expect(velxio.compile).toHaveBeenCalledTimes(1);
    expect(velxio.run).toHaveBeenCalledTimes(1);
    expect(transpiled.compile).toHaveBeenCalledTimes(1);
    expect(riscv.compile).toHaveBeenCalledTimes(1);
    expect(riscv.run).toHaveBeenCalledTimes(1);
  });

  test('5. All three fail → throws "All simulation engines failed"', async () => {
    const velxio = createMockEngine({ name: 'velxio', priority: 1, available: true, compileFails: true });
    const transpiled = createMockEngine({ name: 'transpiled-js', priority: 2, available: true, compileFails: true });
    const riscv = createMockEngine({ name: 'riscv', priority: 3, available: true, compileFails: true });

    const orchestrator = new SimulationOrchestrator([velxio, transpiled, riscv]);

    await expect(orchestrator.run('code', 'esp32c3')).rejects.toThrow('All simulation engines failed');
  });

  test('6. SimulationResult always contains engine field showing which ran', async () => {
    const engines = [
      createMockEngine({ name: 'velxio', priority: 1, available: true }),
      createMockEngine({ name: 'transpiled-js', priority: 2, available: false }),
      createMockEngine({ name: 'riscv', priority: 3, available: false }),
    ];

    const orchestrator = new SimulationOrchestrator(engines);
    const result = await orchestrator.run('code', 'esp32c3');

    expect(result).toHaveProperty('engine');
    expect(result.engine).toBe('velxio');
    expect(result.serial).toBeDefined();
    expect(result.pinStates).toBeDefined();
    expect(result.errors).toBeDefined();
    expect(typeof result.durationMs).toBe('number');
  });

  test('7. Engine order is always [velxio, transpiled-js, riscv] regardless of constructor order', async () => {
    const riscv = createMockEngine({ name: 'riscv', priority: 3, available: true });
    const transpiled = createMockEngine({ name: 'transpiled-js', priority: 2, available: true });
    const velxio = createMockEngine({ name: 'velxio', priority: 1, available: true });

    // Pass engines in reverse priority order
    const orchestrator = new SimulationOrchestrator([riscv, transpiled, velxio]);

    const result = await orchestrator.run('code', 'esp32c3');

    // Velxio (priority 1) should still run first
    expect(result.engine).toBe('velxio');
    expect(velxio.isAvailable).toHaveBeenCalledTimes(1);
    expect(transpiled.isAvailable).not.toHaveBeenCalled();
    expect(riscv.isAvailable).not.toHaveBeenCalled();

    // Verify status order is sorted by priority
    const status = orchestrator.getEngineStatus();
    expect(status).toHaveLength(3);
    expect(status[0].name).toBe('velxio');
    expect(status[0].priority).toBe(1);
    expect(status[1].name).toBe('transpiled-js');
    expect(status[1].priority).toBe(2);
    expect(status[2].name).toBe('riscv');
    expect(status[2].priority).toBe(3);
  });
});
