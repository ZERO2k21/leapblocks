/**
 * RiscVEngine.ts
 * Wraps the EXISTING RiscVCore.ts as a last-resort fallback engine.
 * DO NOT touch RiscVCore.ts — only wrap it.
 *
 * Priority 3 — tried THIRD (last resort), after Velxio and TranspiledJS.
 */

import type { RiscVCore } from '../../engine/esp32c3/cpu/RiscVCore';
import type { BoardType, CompiledFirmware, SimulationResult, ISimulationEngine } from '../types';
import { SimulationEngineError } from '../types';

export class RiscVEngine implements ISimulationEngine {
  name = 'riscv';
  priority = 3;

  constructor(
    private core: RiscVCore,
    private compileService?: (code: string, board: string) => Promise<{ success: boolean; binBase64?: string; error?: string }>,
  ) {}

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async compile(code: string, board: BoardType): Promise<CompiledFirmware> {
    if (!this.compileService) {
      throw new SimulationEngineError(this.name, 'compile', 'no compile service available');
    }

    const result = await this.compileService(code, board);

    if (!result.success || !result.binBase64) {
      throw new SimulationEngineError(
        this.name,
        'compile',
        result.error || 'compilation failed',
      );
    }

    return {
      binary: result.binBase64,
      board,
      engine: this.name,
    };
  }

  async run(firmware: CompiledFirmware): Promise<SimulationResult> {
    if (!firmware.binary) {
      throw new SimulationEngineError(this.name, 'run', 'no binary firmware available');
    }

    const { FirmwareLoader } = await import('../../engine/esp32c3/compiler/FirmwareLoader');

    const bytes = this.decodeBase64(firmware.binary);

    this.core.reset();
    const loader = new FirmwareLoader(this.core);
    const loadResult = loader.load(bytes);

    this.core.reset(loadResult.entryPoint);

    const CYCLES = 266_666;
    const executed = this.core.runCycles(CYCLES);

    const snapshot = this.core.snapshot();

    return {
      engine: 'riscv',
      serial: [],
      pinStates: {},
      errors: snapshot.halted ? ['CPU halted'] : [],
      durationMs: executed,
    };
  }

  private decodeBase64(base64: string): Uint8Array {
    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes;
  }
}
