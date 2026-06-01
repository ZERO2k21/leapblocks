import { describe, test, expect, vi, beforeEach } from 'vitest';
import { TranspiledJSEngine } from './TranspiledJSEngine';
import { SimulationEngineError } from '../types';

function createMockRunner() {
  return {
    stop: vi.fn(),
    initTranspiled: vi.fn().mockResolvedValue(undefined),
    runTranspiled: vi.fn().mockResolvedValue(undefined),
  };
}

function createMockTranspiler(success = true, jsCode = 'async function __setup(){}') {
  return vi.fn().mockResolvedValue({ success, jsCode, error: success ? undefined : 'transpile failed' });
}

describe('TranspiledJSEngine', () => {
  let runner: ReturnType<typeof createMockRunner>;

  beforeEach(() => {
    runner = createMockRunner();
  });

  test('isAvailable always returns true', async () => {
    const engine = new TranspiledJSEngine(runner as any, createMockTranspiler());
    await expect(engine.isAvailable()).resolves.toBe(true);
  });

  test('name is transpiled-js', () => {
    const engine = new TranspiledJSEngine(runner as any, createMockTranspiler());
    expect(engine.name).toBe('transpiled-js');
  });

  test('priority is 1', () => {
    const engine = new TranspiledJSEngine(runner as any, createMockTranspiler());
    expect(engine.priority).toBe(1);
  });

  test('compile calls transpiler and returns CompiledFirmware', async () => {
    const transpile = createMockTranspiler(true, 'async function __setup(){ pinMode(13, 1); }');
    const engine = new TranspiledJSEngine(runner as any, transpile);

    const result = await engine.compile('void setup() { pinMode(13, OUTPUT); }', 'esp32c3');

    expect(transpile).toHaveBeenCalledWith('void setup() { pinMode(13, OUTPUT); }', 'esp32c3');
    expect(result.transpiledCode).toBe('async function __setup(){ pinMode(13, 1); }');
    expect(result.board).toBe('esp32c3');
    expect(result.engine).toBe('transpiled-js');
  });

  test('compile throws SimulationEngineError when transpiler not provided', async () => {
    const engine = new TranspiledJSEngine(runner as any);

    await expect(engine.compile('code', 'esp32c3')).rejects.toThrow(SimulationEngineError);
    await expect(engine.compile('code', 'esp32c3')).rejects.toThrow('no transpiler available');
  });

  test('compile throws SimulationEngineError on transpile failure', async () => {
    const transpile = createMockTranspiler(false);
    const engine = new TranspiledJSEngine(runner as any, transpile);

    await expect(engine.compile('code', 'esp32c3')).rejects.toThrow(SimulationEngineError);
    await expect(engine.compile('code', 'esp32c3')).rejects.toThrow('transpile failed');
  });

  test('compile throws SimulationEngineError on empty jsCode', async () => {
    const transpile = createMockTranspiler(true, '');
    const engine = new TranspiledJSEngine(runner as any, transpile);

    await expect(engine.compile('code', 'esp32c3')).rejects.toThrow(SimulationEngineError);
  });

  test('run calls runner lifecycle in correct order', async () => {
    const transpile = createMockTranspiler(true, 'async function __setup(){}');
    const engine = new TranspiledJSEngine(runner as any, transpile);

    await engine.compile('void setup(){} void loop(){}', 'esp32c3');
    const result = await engine.run({ transpiledCode: 'async function __setup(){}', board: 'esp32c3', engine: 'transpiled-js' });

    expect(runner.stop).toHaveBeenCalledTimes(1);
    expect(runner.initTranspiled).toHaveBeenCalledWith('async function __setup(){}');
    expect(runner.runTranspiled).toHaveBeenCalledTimes(1);
    expect(result.engine).toBe('transpiled-js');
  });

  test('run uses setTranspiledCode when available', async () => {
    const engine = new TranspiledJSEngine(runner as any, createMockTranspiler(true, 'const x = 1;'));

    engine.setTranspiledCode('const x = 1;');
    const result = await engine.run({ transpiledCode: '', board: 'esp32c3', engine: 'transpiled-js' });

    expect(runner.initTranspiled).toHaveBeenCalledWith('const x = 1;');
    expect(result.engine).toBe('transpiled-js');
  });

  test('run throws SimulationEngineError when no transpiled code available', async () => {
    const engine = new TranspiledJSEngine(runner as any, createMockTranspiler());

    await expect(engine.run({ transpiledCode: '', board: 'esp32c3', engine: 'transpiled-js' })).rejects.toThrow(SimulationEngineError);
    await expect(engine.run({ transpiledCode: '', board: 'esp32c3', engine: 'transpiled-js' })).rejects.toThrow('no transpiled code available');
  });

  test('run throws when initTranspiled rejects', async () => {
    runner.initTranspiled.mockRejectedValue(new Error('init failed'));
    const engine = new TranspiledJSEngine(runner as any, createMockTranspiler(true, 'code'));

    await engine.compile('code', 'esp32c3');
    await expect(engine.run({ transpiledCode: 'code', board: 'esp32c3', engine: 'transpiled-js' })).rejects.toThrow('init failed');
  });

  test('handles null transpiler gracefully in compile', async () => {
    const engine = new TranspiledJSEngine(runner as any, undefined);

    await expect(engine.compile('code', 'esp32c3')).rejects.toThrow(SimulationEngineError);
  });

  test('setTranspiledCode stores code internally for later use', () => {
    const engine = new TranspiledJSEngine(runner as any);
    engine.setTranspiledCode('custom code');
    expect((engine as any).transpiledCode).toBe('custom code');
  });
});
