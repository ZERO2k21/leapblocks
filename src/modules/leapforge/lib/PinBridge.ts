import { CPU } from 'avr8js';
import { useForgeStore } from '../store/useForgeStore';

export class PinBridge {
  private cpu: CPU;
  private nodeId: string;

  constructor(cpu: CPU, nodeId: string) {
    this.cpu = cpu;
    this.nodeId = nodeId;
    this.setupHooks();
  }

  private setupHooks() {
    // 1. Digital Pins (8-13) - PORTB
    this.cpu.writeHooks[0x25] = (value: number) => {
      this.updateDigitalPins(8, 13, value);
    };

    // 2. Digital Pins (0-7) - PORTD 
    this.cpu.writeHooks[0x2b] = (value: number) => {
      this.updateDigitalPins(0, 7, value);
    };

    // 3. Analog/Digital (A0-A5) - PORTC
    this.cpu.writeHooks[0x28] = (value: number) => {
      this.updateDigitalPins(14, 19, value); // Maps A0..A5 to 14..19
    };
  }

  private updateDigitalPins(start: number, end: number, portValue: number) {
    const { updateNodeData } = useForgeStore.getState();
    const pins: Record<string, boolean> = {};

    for (let i = start; i <= end; i++) {
        const bit = i - start;
        pins[`pin_${i}`] = (portValue & (1 << bit)) !== 0;
    }

    // Update the Zustand store for the specific Arduino node
    updateNodeData(this.nodeId, { pinStates: pins });
  }

  // Called from UI to update CPU inputs (e.g., button press)
  public setPinInput(pin: number, high: boolean) {
    // Implement PINx register logic if needed for reading inputs
  }
}
