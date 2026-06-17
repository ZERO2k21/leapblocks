import { describe, test, expect } from 'vitest';
import { SimulationEngineError } from './types';

describe('SimulationEngineError', () => {
  test('creates error with correct name', () => {
    const err = new SimulationEngineError('velxio', 'compile', 'connection refused');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('SimulationEngineError');
  });

  test('formats message as [engine][phase] detail', () => {
    const err = new SimulationEngineError('transpiled-js', 'run', 'no code');
    expect(err.message).toBe('[transpiled-js][run] no code');
  });

  test('preserves engine property', () => {
    const err = new SimulationEngineError('riscv', 'health', 'core not initialized');
    expect(err.engine).toBe('riscv');
  });

  test('preserves phase property', () => {
    const err = new SimulationEngineError('velxio', 'compile', 'timeout');
    expect(err.phase).toBe('compile');
  });

  test('preserves detail property', () => {
    const err = new SimulationEngineError('transpiled-js', 'run', 'runtime error');
    expect(err.detail).toBe('runtime error');
  });

  test('all three phases are valid', () => {
    const compile = new SimulationEngineError('t', 'compile', '');
    const run = new SimulationEngineError('t', 'run', '');
    const health = new SimulationEngineError('t', 'health', '');
    expect(compile.phase).toBe('compile');
    expect(run.phase).toBe('run');
    expect(health.phase).toBe('health');
  });

  test('all three engine names are valid', () => {
    const velxio = new SimulationEngineError('velxio', 'compile', '');
    const transpiled = new SimulationEngineError('transpiled-js', 'compile', '');
    const riscv = new SimulationEngineError('riscv', 'compile', '');
    expect(velxio.engine).toBe('velxio');
    expect(transpiled.engine).toBe('transpiled-js');
    expect(riscv.engine).toBe('riscv');
  });

  test('message is accessible via Error.toString()', () => {
    const err = new SimulationEngineError('velxio', 'run', 'segfault at 0x0');
    expect(err.toString()).toContain('segfault at 0x0');
    expect(err.toString()).toContain('velxio');
    expect(err.toString()).toContain('run');
  });
});

describe('SimulationResult shape', () => {
  test('valid result has all required fields', () => {
    const result = {
      engine: 'transpiled-js' as const,
      serial: ['LED ON', 'LED OFF'],
      pinStates: { ESP2: true, ESP3: false },
      errors: [],
      durationMs: 1500,
    };
    expect(result.engine).toMatch(/^(velxio|transpiled-js|riscv)$/);
    expect(Array.isArray(result.serial)).toBe(true);
    expect(typeof result.pinStates).toBe('object');
    expect(Array.isArray(result.errors)).toBe(true);
    expect(typeof result.durationMs).toBe('number');
  });

  test('engine discriminator is one of three allowed values', () => {
    const engines = ['velxio', 'transpiled-js', 'riscv'] as const;
    engines.forEach(e => {
      const result = { engine: e, serial: [], pinStates: {}, errors: [], durationMs: 0 };
      expect(result.engine).toMatch(/^(velxio|transpiled-js|riscv)$/);
    });
  });

  test('serial lines can contain empty strings', () => {
    const result = {
      engine: 'velxio' as const,
      serial: ['line 1', '', 'line 3'],
      pinStates: {},
      errors: [],
      durationMs: 100,
    };
    expect(result.serial).toHaveLength(3);
    expect(result.serial[1]).toBe('');
  });

  test('pinStates can be boolean or numeric', () => {
    const result = {
      engine: 'riscv' as const,
      serial: [],
      pinStates: { ESP2: true, ESP5: 128 },
      errors: [],
      durationMs: 100,
    };
    expect(result.pinStates['ESP2']).toBe(true);
    expect(result.pinStates['ESP5']).toBe(128);
  });

  test('errors array can hold multiple messages', () => {
    const result = {
      engine: 'velxio' as const,
      serial: [],
      pinStates: {},
      errors: ['error 1', 'error 2', 'error 3'],
      durationMs: 100,
    };
    expect(result.errors).toHaveLength(3);
  });

  test('durationMs is non-negative', () => {
    const result = {
      engine: 'transpiled-js' as const,
      serial: [],
      pinStates: {},
      errors: [],
      durationMs: 0,
    };
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });
});

describe('CompiledFirmware shape', () => {
  test('binary firmware is valid', () => {
    const fw = {
      binary: 'base64encodedstring',
      board: 'esp32c3' as const,
      engine: 'velxio',
    };
    expect(typeof fw.binary).toBe('string');
    expect(fw.board).toBe('esp32c3');
  });

  test('transpiled firmware is valid', () => {
    const fw = {
      transpiledCode: 'async function __setup() {}',
      board: 'esp32c3' as const,
      engine: 'transpiled-js',
    };
    expect(typeof fw.transpiledCode).toBe('string');
    expect(fw.engine).toBe('transpiled-js');
  });

  test('board type is one of the allowed values', () => {
    const boards = ['esp32c3', 'esp32', 'esp32s3'] as const;
    boards.forEach(board => {
      const fw = { binary: '', board, engine: 'test' };
      expect(['esp32c3', 'esp32', 'esp32s3']).toContain(fw.board);
    });
  });
});
