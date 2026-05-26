/**
 * SimulationOrchestrator.ts
 *
 * Replaces the direct engine calls in ESP32C3SimulationRunner with a
 * priority-ordered engine chain. This is the ONLY file that decides
 * which engine runs. No other file needs to know about engine priority.
 */

import type { ISimulationEngine, SimulationResult, BoardType } from './types';

export class SimulationOrchestrator {
  private engines: ISimulationEngine[];

  constructor(engines: ISimulationEngine[]) {
    this.engines = [...engines].sort((a, b) => a.priority - b.priority);
  }

  async run(code: string, board: BoardType): Promise<SimulationResult> {
    const errors: string[] = [];

    for (const engine of this.engines) {
      try {
        const available = await engine.isAvailable();
        if (!available) {
          console.info(`[Orchestrator] ${engine.name} unavailable, trying next`);
          continue;
        }

        console.info(`[Orchestrator] Using engine: ${engine.name}`);
        const firmware = await engine.compile(code, board);
        const result = await engine.run(firmware);

        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(msg);
        console.warn(`[Orchestrator] ${engine.name} failed: ${msg}, trying next`);
      }
    }

    throw new Error(
      `All simulation engines failed:\n${errors.join('\n')}`,
    );
  }

  getEngineStatus(): Array<{ name: string; priority: number }> {
    return this.engines.map(e => ({ name: e.name, priority: e.priority }));
  }
}
