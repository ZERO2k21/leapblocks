/**
 * ScriptRunner.ts
 * A basic Arduino-style script interpreter for LeapForge.
 * Parses simple C++ style commands and updates the simulation state.
 */

import { useForgeStore } from '../store/useForgeStore';

export class ScriptRunner {
  private intervalId: NodeJS.Timeout | null = null;
  private currentLine = 0;
  private lines: string[] = [];
  private isRunning = false;

  constructor(private code: string) {
    this.lines = code
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('//'));
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.currentLine = 0;
    this.executeNext();
  }

  stop() {
    this.isRunning = false;
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
  }

  private executeNext() {
    if (!this.isRunning || this.currentLine >= this.lines.length) {
      this.currentLine = 0; // Loop simple programs
    }

    const line = this.lines[this.currentLine];
    const delayMatch = line.match(/delay\((\d+)\)/);
    const writeMatch = line.match(/digitalWrite\((\d+),\s*(\w+)\)/);

    let waitTime = 10; // Default tiny wait

    if (writeMatch) {
      const pin = parseInt(writeMatch[1]);
      const state = writeMatch[2] === 'HIGH';
      this.handleDigitalWrite(pin, state);
    }

    if (delayMatch) {
      waitTime = parseInt(delayMatch[1]);
    }

    this.currentLine++;
    this.intervalId = setTimeout(() => this.executeNext(), waitTime);
  }

  private handleDigitalWrite(pin: number, state: boolean) {
    const { nodes, updateNodeData } = useForgeStore.getState();
    
    // Find a node that represents an LED or component connected to this pin
    // For Phase 2, we assume a simple mapping: 'led-13' is Pin 13
    const targetId = `led-${pin}`;
    const node = nodes.find(n => n.id === targetId || n.data.pin === pin);
    
    if (node) {
      updateNodeData(node.id, { value: state });
    }
  }
}

export default ScriptRunner;
