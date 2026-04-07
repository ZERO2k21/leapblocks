/**
 * SimulationRunner - The heart of the circuit simulation.
 * Decouples logic execution from UI rendering.
 * Provides a high-frequency tick loop and pin-state management.
 */

export type PinState = 'HIGH' | 'LOW' | 'FLOATING';

export type PinListener = (state: PinState) => void;

class SimulationRunner {
  private pinStates: Map<string, PinState> = new Map();
  private listeners: Map<string, Set<PinListener>> = new Map();
  private isRunning: boolean = false;
  private intervalId: any = null;

  // Configuration
  private tickRateHz: number = 1000; // 1kHz simulation for now
  private batchSize: number = 50;   // Instructions per batch to avoid UI lag

  constructor() {}

  /**
   * Start the simulation loop
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log(`[FORGE] Simulation started at ${this.tickRateHz}Hz`);
    
    this.intervalId = setInterval(() => {
      this.tick();
    }, 1000 / this.tickRateHz);
  }

  /**
   * Stop the simulation
   */
  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('[FORGE] Simulation stopped');
  }

  /**
   * A single simulation tick
   */
  private tick() {
    // Perform batches of logic updates here
    // In Phase 1, we just simulate a heartbeat for testing
    const now = Date.now();
    const mockState = now % 2000 < 1000 ? 'HIGH' : 'LOW';
    this.setPinState('PIN_13', mockState);
  }

  /**
   * Update the value of a physical/virtual pin
   */
  setPinState(pinId: string, state: PinState) {
    const currentState = this.pinStates.get(pinId);
    if (currentState === state) return;

    this.pinStates.set(pinId, state);
    this.notifyListeners(pinId, state);
  }

  getPinState(pinId: string): PinState {
    return this.pinStates.get(pinId) || 'FLOATING';
  }

  /**
   * Listen for changes on a specific pin (e.g., LED watching a pin)
   */
  addListener(pinId: string, listener: PinListener) {
    if (!this.listeners.has(pinId)) {
      this.listeners.set(pinId, new Set());
    }
    this.listeners.get(pinId)!.add(listener);
    
    // Initial call
    listener(this.getPinState(pinId));
  }

  removeListener(pinId: string, listener: PinListener) {
    const set = this.listeners.get(pinId);
    if (set) {
      set.delete(listener);
    }
  }

  private notifyListeners(pinId: string, state: PinState) {
    const set = this.listeners.get(pinId);
    if (set) {
      set.forEach(l => l(state));
    }
  }
}

// Export a singleton instance
export const simulationRunner = new SimulationRunner();
