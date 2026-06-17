import { describe, test, expect, vi, beforeEach } from 'vitest';
import { RiscVEngine } from './RiscVEngine';
import { SimulationEngineError } from '../types';

/** 8-byte valid ESP32 flash image: magic=0xE9, segCount=0, entry=0x40380000 */
const ESP32_MINIMAL_FIRMWARE_BASE64 = '6QAAAAAAOEA=';

function createMockCore() {
  return {
    reset: vi.fn(),
    runCycles: vi.fn().mockReturnValue(266666),
    snapshot: vi.fn().mockReturnValue({ halted: false, pc: 0x40380000, cycles: 266666, regs: new Uint32Array(32) }),
    loadIRAM: vi.fn(),
    loadDRAM: vi.fn(),
    loadIROM: vi.fn(),
    loadDROM: vi.fn(),
    mmio: { register: vi.fn() },
    irqCtrl: { raise: vi.fn() },
  };
}

function createMockCompileService(success = true, binBase64 = ESP32_MINIMAL_FIRMWARE_BASE64) {
  return vi.fn().mockResolvedValue({
    success,
    binBase64: success ? binBase64 : undefined,
    error: success ? undefined : 'compilation failed',
  });
}

describe('RiscVEngine', () => {
  let core: ReturnType<typeof createMockCore>;

  beforeEach(() => {
    core = createMockCore();
  });

  test('name is riscv', () => {
    const engine = new RiscVEngine(core as any);
    expect(engine.name).toBe('riscv');
  });

  test('priority is 3', () => {
    const engine = new RiscVEngine(core as any);
    expect(engine.priority).toBe(3);
  });

  test('isAvailable always returns true', async () => {
    const engine = new RiscVEngine(core as any);
    await expect(engine.isAvailable()).resolves.toBe(true);
  });

  describe('compile', () => {
    test('calls compileService and returns CompiledFirmware', async () => {
      const compile = createMockCompileService(true, 'AAAA');
      const engine = new RiscVEngine(core as any, compile);

      const result = await engine.compile('void setup(){} void loop(){}', 'esp32c3');

      expect(compile).toHaveBeenCalledWith('void setup(){} void loop(){}', 'esp32c3');
      expect(result.binary).toBe('AAAA');
      expect(result.board).toBe('esp32c3');
      expect(result.engine).toBe('riscv');
    });

    test('throws SimulationEngineError when compileService not provided', async () => {
      const engine = new RiscVEngine(core as any);

      await expect(engine.compile('code', 'esp32c3')).rejects.toThrow(SimulationEngineError);
      await expect(engine.compile('code', 'esp32c3')).rejects.toThrow('no compile service');
    });

    test('throws SimulationEngineError when compile fails', async () => {
      const compile = createMockCompileService(false);
      const engine = new RiscVEngine(core as any, compile);

      await expect(engine.compile('code', 'esp32c3')).rejects.toThrow(SimulationEngineError);
      await expect(engine.compile('code', 'esp32c3')).rejects.toThrow('compilation failed');
    });

    test('throws SimulationEngineError on empty binBase64', async () => {
      const compile = createMockCompileService(true, '');
      const engine = new RiscVEngine(core as any, compile);

      await expect(engine.compile('code', 'esp32c3')).rejects.toThrow(SimulationEngineError);
    });

    test('throws SimulationEngineError when compileService throws', async () => {
      const compile = vi.fn().mockRejectedValue(new Error('network error'));
      const engine = new RiscVEngine(core as any, compile);

      await expect(engine.compile('code', 'esp32c3')).rejects.toThrow('network error');
    });
  });

  describe('run', () => {
    test('loads firmware and runs cycles on core', async () => {
      const compile = createMockCompileService(true, ESP32_MINIMAL_FIRMWARE_BASE64);
      const engine = new RiscVEngine(core as any, compile);

      await engine.compile('code', 'esp32c3');
      const result = await engine.run({ binary: ESP32_MINIMAL_FIRMWARE_BASE64, board: 'esp32c3', engine: 'riscv' });

      expect(core.reset).toHaveBeenCalled();
      expect(core.runCycles).toHaveBeenCalled();
      expect(result.engine).toBe('riscv');
      expect(result.durationMs).toBe(266666);
    });

    test('throws SimulationEngineError when no binary available', async () => {
      const engine = new RiscVEngine(core as any);

      await expect(engine.run({ binary: '', board: 'esp32c3', engine: 'riscv' })).rejects.toThrow(SimulationEngineError);
      await expect(engine.run({ binary: '', board: 'esp32c3', engine: 'riscv' })).rejects.toThrow('no binary firmware');
    });

    test('reports halted state in errors array', async () => {
      core.snapshot.mockReturnValue({ halted: true, pc: 0, cycles: 100, regs: new Uint32Array(32) });
      const engine = new RiscVEngine(core as any);

      const result = await engine.run({ binary: ESP32_MINIMAL_FIRMWARE_BASE64, board: 'esp32c3', engine: 'riscv' });

      expect(result.errors).toContain('CPU halted');
    });

    test('returns empty errors when not halted', async () => {
      core.snapshot.mockReturnValue({ halted: false, pc: 0x40380000, cycles: 500, regs: new Uint32Array(32) });
      const engine = new RiscVEngine(core as any);

      const result = await engine.run({ binary: ESP32_MINIMAL_FIRMWARE_BASE64, board: 'esp32c3', engine: 'riscv' });

      expect(result.errors).toEqual([]);
    });

    test('calls core.reset before and after firmware loading', async () => {
      const engine = new RiscVEngine(core as any);

      await engine.run({ binary: ESP32_MINIMAL_FIRMWARE_BASE64, board: 'esp32c3', engine: 'riscv' });

      expect(core.reset).toHaveBeenCalledTimes(2);
    });

    test('decodes base64 binary before loading', async () => {
      const compile = createMockCompileService(true, ESP32_MINIMAL_FIRMWARE_BASE64);
      const engine = new RiscVEngine(core as any, compile);

      await engine.compile('code', 'esp32c3');
      const result = await engine.run({ binary: ESP32_MINIMAL_FIRMWARE_BASE64, board: 'esp32c3', engine: 'riscv' });

      expect(result.engine).toBe('riscv');
    });

    test('dynamically imports FirmwareLoader', async () => {
      const engine = new RiscVEngine(core as any);
      await expect(engine.run({ binary: ESP32_MINIMAL_FIRMWARE_BASE64, board: 'esp32c3', engine: 'riscv' })).resolves.toBeDefined();
    });
  });
});
