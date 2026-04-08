import { useForgeStore } from '../store/useForgeStore';
import { simulationRunner, PinState } from './SimulationRunner';
import { HD44780 } from './HD44780';
import { I2CBusManager } from './I2CBusManager';
import { PCF8574 } from './PCF8574';
import { DHT } from './DHT';

/**
 * CircuitEngine
 * Bridges the abstract ReactFlow graph (nodes/edges) with the low-level AVR SimulationRunner.
 * Handles signal propagation across wires.
 */
class CircuitEngine {
  private activeSubscriptions = new Map<string, () => void>();
  private lcdEmulators = new Map<string, HD44780>();
  private peripheralPinBuffers = new Map<string, Record<string, boolean>>(); 
  private i2cBusManager = new I2CBusManager();
  private dhtEmulators = new Map<string, DHT>();
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
    this.lcdEmulators.clear();
    this.peripheralPinBuffers.clear();
    this.i2cBusManager.clear();
    this.dhtEmulators.clear();

    const { nodes, edges, updateNodeData } = useForgeStore.getState();

    // 2.1 Register I2C Slaves
    nodes.forEach(node => {
      if (node.data?.type === 'lcd1602' || node.data?.type === 'lcd2004') {
        // Create an emulator for the display
        const cols = node.data?.type === 'lcd1602' ? 16 : 20;
        const rows = node.data?.type === 'lcd1602' ? 2 : 4;
        const emulator = new HD44780(cols, rows);
        this.lcdEmulators.set(node.id, emulator);

        // Does it have an I2C Backpack? 
        // For now, we auto-attach an I2C Backpack at 0x27 if it's the only display, 
        // or if it's explicitly marked as I2C in data. 
        // (LeapNode will eventually handle this distinction)
        if (node.data?.i2cAddress) {
          const backpack = new PCF8574(node.data.i2cAddress, emulator, (state) => {
            updateNodeData(node.id, { lcdState: state });
          });
          this.i2cBusManager.registerSlave(backpack);
        }
      }
    });

    // 2.2 Attach Bus Manager to Master
    if (simulationRunner.TWI) {
      simulationRunner.TWI.eventHandler = this.i2cBusManager;
    }

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
        const mapping = simulationRunner.convertArduinoPin(arduinoPinName);
        if (!mapping) return;
        const avrPin = mapping.avrPin;

        console.log(`[FORGE CIRCUIT] Wired Logic Route: Board[${arduinoPinName}] <==> ${avrPin} <==> Peripheral[${peripheralPinName}]`);

        // --- Custom Peripheral Emulation ---
        let trigStartCycles = 0;
        let pwmStartCycles = 0;

        // Ensure buffers exist for this peripheral
        if (!this.peripheralPinBuffers.has(peripheralId)) {
          this.peripheralPinBuffers.set(peripheralId, {});
        }

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
                    const _echoMapping = simulationRunner.convertArduinoPin(_boardPinName);
                    if (_echoMapping) {
                      const avrEchoPin = _echoMapping.avrPin;
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

            // Emulate Servo PWM Physics
            if (peripheralNode.data?.type === 'servo' && peripheralPinName === 'PWM') {
              if (isHigh) {
                pwmStartCycles = simulationRunner.getCycles();
              } else {
                const pulseCycles = simulationRunner.getCycles() - pwmStartCycles;
                const durationUs = pulseCycles / 16;
                // Standard Servo: 1ms (0 deg) to 2ms (180 deg)
                // We accept 400us to 2600us for robustness
                if (durationUs >= 400 && durationUs <= 2600) {
                  const angle = Math.max(0, Math.min(180, ((durationUs - 1000) / 1000) * 180));

                  // Optimization: Only update if angle significant change (> 1 degree)
                  const currentAngle = peripheralNode.data?.angle ?? 0;
                  if (Math.abs(currentAngle - angle) >= 0.5) {
                    updateNodeData(peripheralId, { angle });
                  }
                }
              }
            }

            // --- LCD Display Emulation ---
            if (peripheralNode.data?.type === 'lcd1602' || peripheralNode.data?.type === 'lcd2004') {
              const buffer = this.peripheralPinBuffers.get(peripheralId)!;
              const prevE = buffer['E'];
              buffer[peripheralPinName] = isHigh;

              // Register the emulator if not already present
              if (!this.lcdEmulators.has(peripheralId)) {
                const cols = peripheralNode.data?.type === 'lcd1602' ? 16 : 20;
                const rows = peripheralNode.data?.type === 'lcd1602' ? 2 : 4;
                this.lcdEmulators.set(peripheralId, new HD44780(cols, rows));
              }

              // Trigger on falling edge of E (Enable) pin
              if (prevE === true && isHigh === false && peripheralPinName === 'E') {
                const emulator = this.lcdEmulators.get(peripheralId)!;
                const rs = !!buffer['RS'];
                // Construct nibble from D4-D7
                let data = 0;
                if (buffer['D4']) data |= 0x10;
                if (buffer['D5']) data |= 0x20;
                if (buffer['D6']) data |= 0x40;
                if (buffer['D7']) data |= 0x80;

                emulator.processPulse(rs, data);
                
                // Sync LCD state back to node
                updateNodeData(peripheralId, {
                  lcdState: emulator.getState()
                });
              }
            }

            // --- DHT Sensor Emulation ---
            if (peripheralNode.data?.type === 'dht22' || peripheralNode.data?.type === 'dht11') {
              if (peripheralPinName === 'SDA' || peripheralPinName === 'DATA') {
                if (!this.dhtEmulators.has(peripheralId)) {
                  this.dhtEmulators.set(peripheralId, new DHT(avrPin, peripheralNode.data.type));
                }
                const emulator = this.dhtEmulators.get(peripheralId)!;
                emulator.processSignal(state);
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
    const mapping = simulationRunner.convertArduinoPin(boardPinName);
    if (mapping) {
      if (mapping.adcChannel !== undefined) {
        // --- Analog Mapping ---
        // Fetch the simulated sensor value from the node
        const peripheralNode = nodes.find(n => n.id === nodeId);
        const sensorValue = peripheralNode?.data?.sensorValues?.value ?? 0; // expected 0-100 or 0-1023?
        
        // For standard Leap sensors, we assume value is 0-1023 (raw ADC) or 0-100 (percentage)
        // Let's normalize it to 0-5V.
        // If the node data indicates it's an analog sensor, we use the value.
        // For now, assume value is 0-5.0V directly for simplicity, or 0-1023.
        const voltage = sensorValue > 5 ? (sensorValue / 1023) * 5.0 : sensorValue;
        simulationRunner.setAnalogInput(mapping.adcChannel, voltage);
        
        console.log(`[FORGE CIRCUIT] Analog Signal: Peripheral[${nodeId}] pin ${pinName} -> ${voltage.toFixed(2)}V on channel ${mapping.adcChannel}`);
      } else {
        // --- Digital Mapping ---
        simulationRunner.setVirtualInput(mapping.avrPin, isHigh);
      }
    }
  }
}

export const circuitEngine = new CircuitEngine();
