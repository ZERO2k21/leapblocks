export type BoardType = 'esp32c3' | 'esp32' | 'esp32s3';

export interface CompiledFirmware {
  binary?: string;
  transpiledCode?: string;
  board: BoardType;
  engine: string;
}

export interface SimulationResult {
  engine: 'velxio' | 'transpiled-js' | 'riscv';
  serial: string[];
  pinStates: Record<number, boolean | number>;
  errors: string[];
  durationMs: number;
}

export class SimulationEngineError extends Error {
  constructor(
    public engine: string,
    public phase: 'compile' | 'run' | 'health',
    public detail: string,
  ) {
    super(`[${engine}][${phase}] ${detail}`);
    this.name = 'SimulationEngineError';
  }
}

export interface ISimulationEngine {
  name: string;
  priority: number;
  isAvailable(): Promise<boolean>;
  compile(code: string, board: BoardType): Promise<CompiledFirmware>;
  run(firmware: CompiledFirmware): Promise<SimulationResult>;
}
