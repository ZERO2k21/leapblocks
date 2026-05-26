/**
 * TranspiledJSEngine.ts
 * Wraps the EXISTING ArduinoRuntime.ts + transpiler.ts as a fallback engine.
 * DO NOT copy or duplicate ArduinoRuntime logic — only wrap it.
 *
 * Priority 2 — tried SECOND, after VelxioEngine fails.
 */

import type { ESP32C3SimulationRunner } from '../../engine/esp32c3/ESP32C3SimulationRunner';
import type { BoardType, CompiledFirmware, SimulationResult, ISimulationEngine } from '../types';
import { SimulationEngineError } from '../types';

export class TranspiledJSEngine implements ISimulationEngine {
  name = 'transpiled-js';
  priority = 2;

  private transpiledCode: string | null = null;

  constructor(
    private runner: ESP32C3SimulationRunner,
    private transpile?: (code: string, board?: string) => Promise<{ success: boolean; jsCode?: string; error?: string }>,
  ) {}

  private get hasTranspiler(): boolean {
    return typeof this.transpile === 'function';
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  setTranspiledCode(code: string): void {
    this.transpiledCode = code;
  }

  async compile(code: string, board: BoardType): Promise<CompiledFirmware> {
    if (!this.hasTranspiler) {
      throw new SimulationEngineError(this.name, 'compile', 'no transpiler available');
    }

    const result = await this.transpile!(code, board);

    if (!result.success || !result.jsCode) {
      throw new SimulationEngineError(
        this.name,
        'compile',
        result.error || 'transpilation failed',
      );
    }

    this.transpiledCode = result.jsCode;

    return {
      transpiledCode: result.jsCode,
      board,
      engine: this.name,
    };
  }

  async run(firmware: CompiledFirmware): Promise<SimulationResult> {
    const code = this.transpiledCode ?? firmware.transpiledCode;

    if (!code) {
      throw new SimulationEngineError(this.name, 'run', 'no transpiled code available');
    }

    this.runner.stop();
    await this.runner.initTranspiled(code);
    await this.runner.runTranspiled();

    return {
      engine: 'transpiled-js',
      serial: [],
      pinStates: {},
      errors: [],
      durationMs: 0,
    };
  }
}
