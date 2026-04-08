import { useForgeStore } from '../store/useForgeStore';
import { simulationRunner, PinState } from './SimulationRunner';

/**
 * CircuitEngine
 * Bridges the abstract ReactFlow graph (nodes/edges) with the low-level AVR SimulationRunner.
 * Handles signal propagation across wires and emulates peripheral hardware.
 */
class CircuitEngine {
  private activeSubscriptions = new Map<string, () => void>();
  private isInitialized = false;
  
  // Registry for peripheral-specific states (LCD buffers, Sonic timing, etc.)
  private peripheralStates = new Map<string, any>();

  constructor() { }

  public init() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    console.log('[FORGE CIRCUIT] Engine connected to Zustand Store');

    useForgeStore.subscribe((state, prevState) => {
      // Re-sync if edges changed while simulating
      if (state.edges.length !== prevState.edges.length && state.isSimulating) {
        this.syncCircuitGraph();
      }
    });
  }

  /**
   * Rebuilds the routing table between Arduino and Peripherals
   */
  public syncCircuitGraph() {
    console.log('[FORGE CIRCUIT] syncCircuitGraph triggered. Re-evaluating routing...');
    this.activeSubscriptions.forEach((unsubscribe) => unsubscribe());
    this.activeSubscriptions.clear();
    this.peripheralStates.clear(); // Reset emulation states on new sync

    const { nodes, edges, updateNodeData } = useForgeStore.getState();
    const boardNodes = nodes.filter(n => n.data?.type === 'arduino-uno' || n.data?.type === 'arduino-nano' || n.data?.type === 'boards');

    boardNodes.forEach(board => {
      const connectedEdges = edges.filter(e => e.source === board.id || e.target === board.id);

      connectedEdges.forEach(edge => {
        const isOutput = edge.source === board.id;
        const arduinoPinName = isOutput ? edge.sourceHandle : edge.targetHandle;
        const peripheralId = isOutput ? edge.target : edge.source;
        const peripheralPinName = isOutput ? edge.targetHandle : edge.sourceHandle;

        if (!arduinoPinName || !peripheralPinName) return;

        const avrPin = simulationRunner.convertArduinoPin(arduinoPinName);
        if (!avrPin) return;

        const listener = (state: PinState) => {
          const isHigh = state === 'HIGH';
          const currentStateStore = useForgeStore.getState();
          const peripheralNode = currentStateStore.nodes.find(n => n.id === peripheralId);

          if (peripheralNode) {
            this.handleEmulation(peripheralNode, peripheralPinName, isHigh);

            // Update node UI state
            const currentPinStates = peripheralNode.data?.pinStates || {};
            if (currentPinStates[`pin_${peripheralPinName}`] !== isHigh) {
              updateNodeData(peripheralId, {
                pinStates: { ...currentPinStates, [`pin_${peripheralPinName}`]: isHigh }
              });
            }
          }
        };

        simulationRunner.addListener(avrPin, listener);
        this.activeSubscriptions.set(edge.id, () => {
          simulationRunner.removeListener(avrPin, listener);
        });
      });
    });
  }

  /**
   * Routes signals to specialized hardware emulators
   */
  private handleEmulation(node: any, pin: string, isHigh: boolean) {
    const type = node.data?.type;

    if (type === 'hc-sr04') {
      this.emulateHCSR04(node, pin, isHigh);
    } else if (type === 'lcd1602' || type === 'lcd2004') {
      this.emulateLCD(node, pin, isHigh);
    }
  }

  /**
   * --- HC-SR04 Emulator ---
   */
  private emulateHCSR04(node: any, pin: string, isHigh: boolean) {
    if (pin !== 'TRIG') return;

    let state = this.getPeripheralState(node.id, { trigStartCycles: 0 });

    if (isHigh) {
      state.trigStartCycles = simulationRunner.getCycles();
    } else {
      const pulseCycles = simulationRunner.getCycles() - state.trigStartCycles;
      const durationUs = pulseCycles / 16;
      if (durationUs >= 2) {
        const distance = node.data?.sensorValues?.distance ?? 100;
        const echoPulseCycles = Math.floor(distance * 58 * 16);

        // Find Echo wire
        const { edges } = useForgeStore.getState();
        const echoWire = edges.find(e => (e.source === node.id && e.sourceHandle === 'ECHO') || (e.target === node.id && e.targetHandle === 'ECHO'));
        
        if (echoWire) {
          const boardPin = echoWire.source === node.id ? echoWire.targetHandle : echoWire.sourceHandle;
          const avrEchoPin = simulationRunner.convertArduinoPin(boardPin!);
          if (avrEchoPin) {
            simulationRunner.scheduleEvent(500, () => {
              simulationRunner.setVirtualInput(avrEchoPin, true);
              simulationRunner.scheduleEvent(echoPulseCycles, () => {
                simulationRunner.setVirtualInput(avrEchoPin, false);
              });
            });
          }
        }
      }
    }
  }

  /**
   * --- LCD 1602 (HD44780) Emulator ---
   */
  private emulateLCD(node: any, pin: string, isHigh: boolean) {
    let lcd = this.getPeripheralState(node.id, {
      rs: false,
      en: false,
      buffer: new Uint8Array(32).fill(32),
      cursor: 0,
      nibbleMode: false,
      highNibble: -1
    });

    if (pin === 'RS') lcd.rs = isHigh;
    if (pin === 'E') {
      const fallingEdge = lcd.en && !isHigh;
      lcd.en = isHigh;

      if (fallingEdge) {
        const currentPinStates = node.data?.pinStates || {};
        const nibble = ( (currentPinStates['pin_D7'] ? 1 : 0) << 3 ) |
                       ( (currentPinStates['pin_D6'] ? 1 : 0) << 2 ) |
                       ( (currentPinStates['pin_D5'] ? 1 : 0) << 1 ) |
                       ( (currentPinStates['pin_D4'] ? 1 : 0) );

        if (!lcd.nibbleMode) {
          if (nibble === 0x02) {
            lcd.nibbleMode = true; // Switched by command 0x20
          }
          this.processLcdByte(node.id, lcd, nibble << 4);
        } else {
          if (lcd.highNibble === -1) {
            lcd.highNibble = nibble;
          } else {
            const fullByte = (lcd.highNibble << 4) | nibble;
            lcd.highNibble = -1;
            this.processLcdByte(node.id, lcd, fullByte);
          }
        }
      }
    }
  }

  private processLcdByte(id: string, lcd: any, byte: number) {
    const { updateNodeData } = useForgeStore.getState();
    if (lcd.rs) {
      lcd.buffer[lcd.cursor] = byte;
      lcd.cursor++;
      if (lcd.cursor === 16) lcd.cursor = 0x40; // Simulated wrap
      updateNodeData(id, { characters: Array.from(lcd.buffer) });
    } else {
      // Command Set
      if (byte === 0x01) { // Clear
        lcd.buffer.fill(32);
        lcd.cursor = 0;
        updateNodeData(id, { characters: Array.from(lcd.buffer) });
      } else if (byte === 0x02) { // Home
        lcd.cursor = 0;
      } else if ((byte & 0x80) === 0x80) { // Set DDRAM Address
        const addr = byte & 0x7F;
        lcd.cursor = (addr < 0x10) ? addr : (addr >= 0x40 && addr < 0x50) ? 16 + (addr - 0x40) : lcd.cursor;
      }
    }
  }

  private getPeripheralState(id: string, defaults: any) {
    if (!this.peripheralStates.has(id)) {
      this.peripheralStates.set(id, defaults);
    }
    return this.peripheralStates.get(id);
  }

  public pushInputSignal(nodeId: string, pinName: string, isHigh: boolean) {
    const { edges } = useForgeStore.getState();
    const wire = edges.find(e => (e.source === nodeId && e.sourceHandle === pinName) || (e.target === nodeId && e.targetHandle === pinName));
    if (!wire) return;

    const boardPin = wire.source === nodeId ? wire.targetHandle : wire.sourceHandle;
    const avrPin = simulationRunner.convertArduinoPin(boardPin!);
    if (avrPin) simulationRunner.setVirtualInput(avrPin, isHigh);
  }
}

export const circuitEngine = new CircuitEngine();
