import { useForgeStore } from '../store/useForgeStore';
import { simulationRunner, PinState } from './SimulationRunner';

/**
 * CircuitEngine
 * Bridges the abstract ReactFlow graph (nodes/edges) with the low-level AVR SimulationRunner.
 * Handles signal propagation across wires.
 */
class CircuitEngine {
  private activeSubscriptions = new Map<string, () => void>();
  private isInitialized = false;

  constructor() { }

  public init() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    console.log('[FORGE CIRCUIT] Engine connected to Zustand Store');

    // Listen to changes in the visual circuit board
    let previousEdgesCount = -1;
    useForgeStore.subscribe((state) => {
      // If edges changed while simulating, resync
      if (state.edges.length !== previousEdgesCount) {
        previousEdgesCount = state.edges.length;
        if (state.isSimulating) {
          this.syncCircuitGraph();
        }
      }
    });
  }

  /**
   * Called whenever wires are drawn/removed. Rebuilds the routing table.
   */
  public syncCircuitGraph() {
    console.log('[FORGE CIRCUIT] syncCircuitGraph triggered. Re-evaluating electrical routing table...');
    // 1. Clear all old AVR listeners hooked by the circuit engine
    this.activeSubscriptions.forEach((unsubscribe) => unsubscribe());
    this.activeSubscriptions.clear();

    const { nodes, edges, updateNodeData } = useForgeStore.getState();

    // 2. Map board nodes (Arduino) and their connected peripherals
    const boardNodes = nodes.filter(n => n.data?.type === 'arduino-uno' || n.data?.type === 'arduino-nano' || n.data?.type === 'boards');

    boardNodes.forEach(board => {
      // Find all wires connected to this Arduino
      const connectedEdges = edges.filter(e => e.source === board.id || e.target === board.id);

      connectedEdges.forEach(edge => {
        // Determine the flow direction (Assuming Board -> Peripheral for now, Phase 3 propagation)
        // If the Arduino is the source of the edge (e.g., standard digital output)
        const isOutput = edge.source === board.id;
        const arduinoPinName = isOutput ? edge.sourceHandle : edge.targetHandle;
        const peripheralId = isOutput ? edge.target : edge.source;
        const peripheralPinName = isOutput ? edge.targetHandle : edge.sourceHandle;

        if (!arduinoPinName || !peripheralPinName) return;

        // Convert Arduino pin (e.g., "13") to AVR pin (e.g., "PB5")
        const avrPin = simulationRunner.convertArduinoPin(arduinoPinName);
        if (!avrPin) return;

        console.log(`[FORGE CIRCUIT] Wired Logic Route: Board[${arduinoPinName}] <==> ${avrPin} <==> Peripheral[${peripheralPinName}]`);

        // --- Custom Peripheral Emulation ---
        let trigStartCycles = 0;

        // Create a dedicated listener that pushes the HIGH/LOW state across the wire to the target node
        const listener = (state: PinState) => {
          const isHigh = state === 'HIGH';
          // console.log(`[FORGE CIRCUIT] Pushing ${isHigh ? 'HIGH' : 'LOW'} to Node ${peripheralId} (Pin ${peripheralPinName})`);

          const currentStateStore = useForgeStore.getState();
          const peripheralNode = currentStateStore.nodes.find(n => n.id === peripheralId);

          if (peripheralNode) {
            // Emulate HC-SR04 Hardware Physics
            if (peripheralNode.data?.type === 'hc-sr04' && peripheralPinName === 'TRIG') {
              if (isHigh) {
                trigStartCycles = simulationRunner.getCycles();
              } else {
                const pulseCycles = simulationRunner.getCycles() - trigStartCycles;
                const durationUs = pulseCycles / 16; // 16MHz
                // Valid TRIG pulse is min 10us (real), but we'll accept 2us in simulation for robustness
                if (durationUs >= 2) {
                  const distStr = peripheralNode.data?.sensorValues?.distance;
                  const distParam = distStr !== undefined ? parseFloat(distStr) : 100;

                  const echoPulseUs = distParam * 58;
                  const echoPulseCycles = Math.floor(echoPulseUs * 16);

                  const echoWire = currentStateStore.edges.find(e => (e.source === peripheralId && e.sourceHandle === 'ECHO') || (e.target === peripheralId && e.targetHandle === 'ECHO'));
                  if (echoWire) {
                    const _boardPinName = echoWire.source === peripheralId ? echoWire.targetHandle : echoWire.sourceHandle;
                    // @ts-ignore
                    const avrEchoPin = simulationRunner.convertArduinoPin(_boardPinName);
                    if (avrEchoPin) {
                      // console.log(`[FORGE CIRCUIT] HC-SR04 detected TRIG pulse (${durationUs.toFixed(1)}us). Scheduling ECHO pulse for ${distParam}cm (${echoPulseUs}us)`);

                      // robust timing: increased to 500 cycles 
                      // to ensure Arduino has fully entered the pulseIn polling loop
                      simulationRunner.scheduleEvent(500, () => {
                        simulationRunner.setVirtualInput(avrEchoPin, true);
                        // Then scheduled ECHO LOW after the distance duration
                        simulationRunner.scheduleEvent(echoPulseCycles, () => {
                          simulationRunner.setVirtualInput(avrEchoPin, false);
                        });
                      });
                    }
                  }
                }
              }
            }

            // Update the target peripheral's UI state so standard Leap Elements react
            const currentPinStates = peripheralNode.data?.pinStates || {};

            // Optimization: Only dispatch to React if value actually changed
            if (currentPinStates[`pin_${peripheralPinName}`] !== isHigh) {
              updateNodeData(peripheralId, {
                pinStates: {
                  ...currentPinStates,
                  [`pin_${peripheralPinName}`]: isHigh
                }
              });
            }
          }
        };

        // Attach to the simulation runner
        simulationRunner.addListener(avrPin, listener);

        // Store the unsubscribe thunk to clean up if the wire is deleted
        this.activeSubscriptions.set(edge.id, () => {
          simulationRunner.removeListener(avrPin, listener);
        });
      });
    });
  }

  /**
   * Called by interactive UI nodes (e.g. Buttons) to push signals backwards into the board
   */
  public pushInputSignal(nodeId: string, pinName: string, isHigh: boolean) {
    console.log(`[FORGE CIRCUIT] Peripheral Node ${nodeId} requesting inject on pin ${pinName} to ${isHigh ? 'HIGH' : 'LOW'}`);
    const { edges, nodes } = useForgeStore.getState();

    // Find the wire attached to this input peripheral pin
    const wire = edges.find(e =>
      (e.source === nodeId && e.sourceHandle === pinName) ||
      (e.target === nodeId && e.targetHandle === pinName)
    );

    if (!wire) return; // Not wired to anything

    const boardNodeId = wire.source === nodeId ? wire.target : wire.source;
    const boardPinName = wire.source === nodeId ? wire.targetHandle : wire.sourceHandle;

    if (!boardPinName) return;
    const boardNode = nodes.find(n => n.id === boardNodeId);
    if (!boardNode) return;

    // Convert back to AVR mapping
    const avrPin = simulationRunner.convertArduinoPin(boardPinName);
    if (avrPin) {
      // Inject physical state change at the CPU level
      simulationRunner.setVirtualInput(avrPin, isHigh);
    }
  }
}

export const circuitEngine = new CircuitEngine();
