/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import { CPU } from 'avr8js';
import { useForgeStore } from '../../utils/store/useForgeStore';

export class PinBridge {
  private cpu: CPU;
  private nodeId: string;
  private nextPins: Record<string, boolean> = {};
  private nextData: Record<string, any> = {};

  constructor(cpu: CPU, nodeId: string) {
    this.cpu = cpu;
    this.nodeId = nodeId;
    this.setupHooks();
  }

  private setupHooks() {
    // 1. Digital Pins (8-13) - PORTB
    this.cpu.writeHooks[0x25] = (value: number) => {
      console.log(`[PinBridge] PORTB Update: 0x${value.toString(16)}`);
      this.updateDigitalPins(8, 13, value);
    };

    // 2. Digital Pins (0-7) - PORTD 
    this.cpu.writeHooks[0x2b] = (value: number) => {
      this.updateDigitalPins(0, 7, value);
    };

    // 3. Analog/Digital (A0-A5) - PORTC
    this.cpu.writeHooks[0x28] = (value: number) => {
      this.updateDigitalPins(14, 19, value);
    };
  }

  private updateDigitalPins(start: number, end: number, portValue: number) {
    for (let i = start; i <= end; i++) {
        const bit = i - start;
        const isHigh = (portValue & (1 << bit)) !== 0;
        
        // Map 14-19 to A0-A5 for consistency with PinMap
        let pinName = i.toString();
        if (i >= 14 && i <= 19) {
          pinName = `A${i - 14}`;
        }

        const stateKey = `pin_${pinName}`;
        this.nextPins[stateKey] = isHigh;

        // Sync internal LED13
        if (pinName === '13') {
          this.nextData.led13 = isHigh;
        }

        // Cache propagation targets (we'll sync them in sync())
        // For now, we'll propagate immediately but could batch this too if needed
    }
  }

  public sync() {
    const { updateNodeData, edges, nodes } = useForgeStore.getState();
    
    // 1. Update the Arduino itself
    updateNodeData(this.nodeId, { pinStates: { ...this.nextPins }, ...this.nextData });

    // 2. Propagate to connected nodes
    Object.entries(this.nextPins).forEach(([key, isHigh]) => {
      const pinName = key.replace('pin_', '');
      const relevantEdges = edges.filter(e => 
        (e.source === this.nodeId && e.sourceHandle === pinName) ||
        (e.target === this.nodeId && e.targetHandle === pinName)
      );

      relevantEdges.forEach(edge => {
        const targetId = edge.source === this.nodeId ? edge.target : edge.source;
        const targetNode = nodes.find(n => n.id === targetId);
        if (targetNode?.data?.type === 'led') {
          if (edge.targetHandle === 'A' || edge.sourceHandle === 'A') {
              updateNodeData(targetId, { value: isHigh });
          }
        }
      });
    });
  }
}
