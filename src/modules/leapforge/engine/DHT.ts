/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import { PinState, simulationRunner } from './SimulationRunner';

/**
 * DHT Emulator
 * Implements the one-wire timing protocol used by DHT11 and DHT22 sensors.
 */
export class DHT {
  private lastState: PinState = 'FLOATING';
  private lowStartCycles: number = 0;
  private isResponding: boolean = false;

  constructor(
    private pin: string,
    private type: 'dht11' | 'dht22' = 'dht22'
  ) { }

  /**
   * Called whenever the DATA pin changes state
   */
  public processSignal(state: PinState) {
    const now = simulationRunner.getCycles();
    const isHigh = state === 'HIGH' || state === 'FLOATING';

    if (this.lastState === 'HIGH' && state === 'LOW') {
      // MCU started pulling LOW
      this.lowStartCycles = now;
    } 
    else if (this.lastState === 'LOW' && isHigh) {
      // MCU released the line
      const durationMs = (now - this.lowStartCycles) / 16000;
      
      // DHT Start signal is min 1 ms (usually 18ms for DHT11, 1ms for DHT22)
      if (durationMs >= 1 && !this.isResponding) {
        this.startResponse();
      }
    }

    this.lastState = state;
  }

  private startResponse() {
    this.isResponding = true;
    
    // DHT Response sequence:
    // 1. Wait 20-40us (Simulation simplified to 40us)
    // 2. Pull LOW for 80us
    // 3. Pull HIGH for 80us
    // 4. Send 40 bits
    
    simulationRunner.scheduleEvent(40 * 16, () => {
      simulationRunner.setVirtualInput(this.pin, false); // Pull LOW
      
      simulationRunner.scheduleEvent(80 * 16, () => {
        simulationRunner.setVirtualInput(this.pin, true); // Pull HIGH
        
        simulationRunner.scheduleEvent(80 * 16, () => {
          this.sendData();
        });
      });
    });
  }

  private sendData() {
    // Current simulated environment values
    // In a real app, these come from the node's data.sensorValues
    // We'll pass them in via a setter later or fetch from store.
    const { nodes } = (window as any).useForgeStore?.getState() || { nodes: [] };
    const node = nodes.find((n: any) => n.data?.type === this.type);
    
    let humidity = node?.data?.sensorValues?.humidity ?? 50;
    let temperature = node?.data?.sensorValues?.temperature ?? 25;

    const data = new Uint8Array(5);
    if (this.type === 'dht22') {
      const h = Math.floor(humidity * 10);
      const t = Math.floor(temperature * 10);
      data[0] = (h >> 8) & 0xFF;
      data[1] = h & 0xFF;
      data[2] = (t >> 8) & 0xFF;
      data[3] = t & 0xFF;
    } else {
      data[0] = Math.floor(humidity);
      data[1] = 0;
      data[2] = Math.floor(temperature);
      data[3] = 0;
    }
    data[4] = (data[0] + data[1] + data[2] + data[3]) & 0xFF;

    this.sendBits(data);
  }

  private sendBits(data: Uint8Array) {
    let bitIndex = 0;
    const totalBits = 40;

    const sendNextBit = () => {
      if (bitIndex >= totalBits) {
        // Line released (Floating/High)
        simulationRunner.setVirtualInput(this.pin, true);
        this.isResponding = false;
        return;
      }

      const byteIdx = Math.floor(bitIndex / 8);
      const bitIdx = 7 - (bitIndex % 8);
      const isBit1 = (data[byteIdx] & (1 << bitIdx)) !== 0;

      // Bit Protocol:
      // 1. Pull LOW for 50us
      // 2. Pull HIGH for 26us (Bit 0) or 70us (Bit 1)
      
      simulationRunner.setVirtualInput(this.pin, false);
      simulationRunner.scheduleEvent(50 * 16, () => {
        simulationRunner.setVirtualInput(this.pin, true);
        const highDuration = isBit1 ? 70 : 26;
        
        simulationRunner.scheduleEvent(highDuration * 16, () => {
          bitIndex++;
          sendNextBit();
        });
      });
    };

    sendNextBit();
  }
}
