import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { VelxioEngine } from './VelxioEngine';
import { SimulationEngineError } from '../types';

describe('VelxioEngine', () => {
  let engine: VelxioEngine;
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('constructor and identity', () => {
    test('name is velxio', () => {
      engine = new VelxioEngine();
      expect(engine.name).toBe('velxio');
    });

    test('priority is 2', () => {
      engine = new VelxioEngine();
      expect(engine.priority).toBe(2);
    });
  });

  describe('isAvailable', () => {
    test('returns false when velxioUrl is not configured', async () => {
      engine = new VelxioEngine({});
      await expect(engine.isAvailable()).resolves.toBe(false);
    });

    test('returns true when health check succeeds', async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'ok', version: '1.0.0' }),
      });
      engine = new VelxioEngine({ velxioUrl: 'http://localhost:3080' });
      await expect(engine.isAvailable()).resolves.toBe(true);
    });

    test('returns false when health check fails', async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 503,
      });
      engine = new VelxioEngine({ velxioUrl: 'http://localhost:3080' });
      await expect(engine.isAvailable()).resolves.toBe(false);
    });

    test('returns false when fetch throws', async () => {
      (globalThis.fetch as any).mockRejectedValueOnce(new Error('connection refused'));
      engine = new VelxioEngine({ velxioUrl: 'http://localhost:3080' });
      await expect(engine.isAvailable()).resolves.toBe(false);
    });

    test('returns false on timeout', async () => {
      (globalThis.fetch as any).mockImplementationOnce(() => new Promise((_, reject) => {
        setTimeout(() => reject(new DOMException('AbortError', 'AbortError')), 50);
      }));
      engine = new VelxioEngine({ velxioUrl: 'http://localhost:3080', timeoutMs: 10 });
      await expect(engine.isAvailable()).resolves.toBe(false);
    });

    test('returns false when response status is not ok', async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'error' }),
      });
      engine = new VelxioEngine({ velxioUrl: 'http://localhost:3080' });
      await expect(engine.isAvailable()).resolves.toBe(false);
    });

    test('caches health check result within cache window', async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'ok' }),
      });
      engine = new VelxioEngine({ velxioUrl: 'http://localhost:3080' });
      await engine.isAvailable();
      await engine.isAvailable();
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    test('returns false on fetch error (existing code returns immediately)', async () => {
      (globalThis.fetch as any).mockRejectedValue(new Error('timeout'));
      engine = new VelxioEngine({ velxioUrl: 'http://localhost:3080', retries: 2, timeoutMs: 100 });
      await expect(engine.isAvailable()).resolves.toBe(false);
    });
  });

  describe('clearHealthCache', () => {
    test('forces next health check to re-fetch', async () => {
      (globalThis.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'ok' }),
      });
      engine = new VelxioEngine({ velxioUrl: 'http://localhost:3080' });
      await engine.isAvailable();
      engine.clearHealthCache();
      await engine.isAvailable();
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('compile', () => {
    test('sends code to /api/compile and returns CompiledFirmware', async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ binary: 'base64bin', entryPoint: 0x40380000, size: 1234 }),
      });
      engine = new VelxioEngine({ velxioUrl: 'http://localhost:3080' });

      const result = await engine.compile('void setup(){} void loop(){}', 'esp32c3');

      expect(result.binary).toBe('base64bin');
      expect(result.board).toBe('esp32c3');
      expect(result.engine).toBe('velxio');
    });

    test('throws SimulationEngineError when velxioUrl not configured', async () => {
      engine = new VelxioEngine({});
      await expect(engine.compile('code', 'esp32c3')).rejects.toThrow(SimulationEngineError);
      await expect(engine.compile('code', 'esp32c3')).rejects.toThrow('velxioUrl not configured');
    });

    test('throws SimulationEngineError on HTTP error', async () => {
      (globalThis.fetch as any).mockResolvedValue({ ok: false, status: 400, statusText: 'Bad Request', json: () => Promise.resolve({ error: 'invalid code' }), text: () => Promise.resolve('Bad Request') });
      engine = new VelxioEngine({ velxioUrl: 'http://localhost:3080' });
      await expect(engine.compile('bad code', 'esp32c3')).rejects.toThrow(/invalid code/);
    });

    test('throws SimulationEngineError when response missing binary', async () => {
      (globalThis.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });
      engine = new VelxioEngine({ velxioUrl: 'http://localhost:3080' });
      await expect(engine.compile('code', 'esp32c3')).rejects.toThrow(/missing binary/);
    });

    test('throws SimulationEngineError on timeout', async () => {
      (globalThis.fetch as any).mockImplementationOnce(() => new Promise((_, reject) => {
        setTimeout(() => reject(new DOMException('AbortError', 'AbortError')), 50);
      }));
      engine = new VelxioEngine({ velxioUrl: 'http://localhost:3080', timeoutMs: 10 });
      await expect(engine.compile('code', 'esp32c3')).rejects.toThrow('timed out');
    });

    test('includes board type in request body', async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ binary: 'bin' }),
      });
      engine = new VelxioEngine({ velxioUrl: 'http://localhost:3080' });
      await engine.compile('code', 'esp32s3');

      const callUrl = (globalThis.fetch as any).mock.calls[0][0];
      const callBody = JSON.parse((globalThis.fetch as any).mock.calls[0][1].body);
      expect(callUrl).toContain('/api/compile');
      expect(callBody.board).toBe('esp32s3');
    });
  });

  describe('run', () => {
    test('uses streaming first, then falls back to standard POST', async () => {
      const firmware = { binary: 'base64bin', board: 'esp32c3' as const, engine: 'velxio' };
      let callCount = 0;
      (globalThis.fetch as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('SSE not supported'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            serialOutput: ['hello'],
            pinStates: {},
            errors: [],
            duration: 100,
          }),
        });
      });
      engine = new VelxioEngine({ velxioUrl: 'http://localhost:3080' });
      const result = await engine.run(firmware);
      expect(result.engine).toBe('velxio');
      expect(result.serial).toEqual(['hello']);
    });

    test('streaming reads SSE events correctly', async () => {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('data: {"type":"serial","data":"LED ON"}\n'));
          controller.enqueue(encoder.encode('data: {"type":"gpio","pin":2,"value":1}\n'));
          controller.enqueue(encoder.encode('data: {"type":"error","message":"watchdog reset"}\n'));
          controller.enqueue(encoder.encode('data: [DONE]\n'));
          controller.close();
        },
      });
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        body: stream,
      });
      engine = new VelxioEngine({ velxioUrl: 'http://localhost:3080' });
      const result = await engine.run({ binary: 'bin', board: 'esp32c3', engine: 'velxio' });
      expect(result.serial).toEqual(['LED ON']);
      expect(result.pinStates).toEqual({ ESP2: 1 });
      expect(result.errors).toEqual(['watchdog reset']);
    });

    test('streaming handles halted event', async () => {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('data: {"type":"halted","exitCode":0}\n'));
          controller.close();
        },
      });
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        body: stream,
      });
      engine = new VelxioEngine({ velxioUrl: 'http://localhost:3080' });
      const result = await engine.run({ binary: 'bin', board: 'esp32c3', engine: 'velxio' });
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    test('streaming ignores malformed SSE lines', async () => {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('data: not json\n'));
          controller.enqueue(encoder.encode('not a data line\n'));
          controller.close();
        },
      });
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        body: stream,
      });
      engine = new VelxioEngine({ velxioUrl: 'http://localhost:3080' });
      const result = await engine.run({ binary: 'bin', board: 'esp32c3', engine: 'velxio' });
      expect(result.serial).toEqual([]);
      expect(result.errors).toEqual([]);
    });

    test('throws SimulationEngineError when velxioUrl not configured', async () => {
      engine = new VelxioEngine({});
      await expect(engine.run({ binary: 'bin', board: 'esp32c3', engine: 'velxio' })).rejects.toThrow(SimulationEngineError);
    });

    test('throws SimulationEngineError when no binary firmware', async () => {
      engine = new VelxioEngine({ velxioUrl: 'http://localhost:3080' });
      await expect(engine.run({ binary: '', board: 'esp32c3', engine: 'velxio' })).rejects.toThrow(SimulationEngineError);
      await expect(engine.run({ binary: '', board: 'esp32c3', engine: 'velxio' })).rejects.toThrow('No binary firmware');
    });
  });

  describe('getServiceInfo', () => {
    test('returns null when velxioUrl not configured', async () => {
      engine = new VelxioEngine({});
      await expect(engine.getServiceInfo()).resolves.toBeNull();
    });

    test('returns service info on success', async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'ok', version: '2.0.0', qemuAvailable: true, arduinoCliAvailable: true }),
      });
      engine = new VelxioEngine({ velxioUrl: 'http://localhost:3080' });
      const info = await engine.getServiceInfo();
      expect(info?.version).toBe('2.0.0');
      expect(info?.qemuAvailable).toBe(true);
    });

    test('returns null on fetch failure', async () => {
      (globalThis.fetch as any).mockRejectedValueOnce(new Error('timeout'));
      engine = new VelxioEngine({ velxioUrl: 'http://localhost:3080' });
      await expect(engine.getServiceInfo()).resolves.toBeNull();
    });

    test('returns null on non-ok response', async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({ ok: false, status: 500 });
      engine = new VelxioEngine({ velxioUrl: 'http://localhost:3080' });
      await expect(engine.getServiceInfo()).resolves.toBeNull();
    });
  });
});
