/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 *
 * DHT22 / DHT11 One-Wire Emulator
 *
 * Protocol (DHT22):
 *   MCU pulls DATA LOW ≥ 0.8 ms → releases HIGH
 *   Sensor: wait 30 µs → ACK LOW 80 µs → ACK HIGH 80 µs → 40 bits
 *   Each bit: LOW 50 µs → HIGH 26 µs (0) or 70 µs (1)
 *
 * All 80+ protocol events are pre-computed as a flat list of absolute
 * CPU cycle timestamps and queued in one shot via scheduleAt().
 * This eliminates nested-callback timing drift that causes checksum failures.
 */

import { PinState, simulationRunner } from './SimulationRunner';
import { useForgeStore } from '../../../utlis/store/useForgeStore';

const CPU_MHZ = 16;
/** Convert microseconds → AVR clock cycles (integer) */
const us = (n: number) => Math.round(n * CPU_MHZ);

export class DHT {
  private lastState: PinState = 'FLOATING';
  private lowStartCycles = 0;
  private isResponding = false;

  /**
   * @param pin    AVR pin ID (e.g. "PD2")
   * @param type   'dht22' | 'dht11'
   * @param nodeId ReactFlow node ID — reads sensorValues from this node
   */
  constructor(
    private readonly pin: string,
    private readonly type: 'dht11' | 'dht22' = 'dht22',
    private readonly nodeId: string = '',
  ) {}

  /** Called by CircuitEngine on every DATA pin state change */
  public processSignal(state: PinState) {
    const now = simulationRunner.getCycles();

    if (this.lastState !== 'LOW' && state === 'LOW') {
      // Falling edge — MCU started pulling LOW
      this.lowStartCycles = now;
    } else if (this.lastState === 'LOW' && state !== 'LOW') {
      // Rising edge — MCU released the line, measure how long it was LOW
      const durationUs = (now - this.lowStartCycles) / CPU_MHZ;
      const minUs = this.type === 'dht11' ? 18000 : 800;

      if (durationUs >= minUs && !this.isResponding) {
        this.respond(now);
      }
    }

    this.lastState = state;
  }

  // ── Protocol implementation ─────────────────────────────────────────────

  private respond(risingEdgeCycles: number) {
    this.isResponding = true;
    const frame = this.buildFrame();

    // Pre-compute the full event timeline as absolute CPU cycle counts
    // t = cycles elapsed since the MCU released the line
    let t = risingEdgeCycles;

    // ACK sequence
    t += us(30);  simulationRunner.scheduleAt(t, () => simulationRunner.setVirtualInput(this.pin, false)); // ACK LOW
    t += us(80);  simulationRunner.scheduleAt(t, () => simulationRunner.setVirtualInput(this.pin, true));  // ACK HIGH
    t += us(80);  // data transmission starts here

    // 40 data bits, MSB first
    for (let i = 0; i < 40; i++) {
      const byteIdx = Math.floor(i / 8);
      const bitPos  = 7 - (i % 8);
      const isBit1  = (frame[byteIdx] & (1 << bitPos)) !== 0;

      simulationRunner.scheduleAt(t, () => simulationRunner.setVirtualInput(this.pin, false)); // bit LOW
      t += us(50);
      simulationRunner.scheduleAt(t, () => simulationRunner.setVirtualInput(this.pin, true));  // bit HIGH
      t += isBit1 ? us(70) : us(26);
    }

    // End-of-frame: brief LOW then release HIGH
    simulationRunner.scheduleAt(t, () => simulationRunner.setVirtualInput(this.pin, false));
    t += us(50);
    simulationRunner.scheduleAt(t, () => simulationRunner.setVirtualInput(this.pin, true));
    t += us(10);

    // Mark transmission complete
    simulationRunner.scheduleAt(t, () => { this.isResponding = false; });
  }

  // ── Data encoding ────────────────────────────────────────────────────────

  private buildFrame(): Uint8Array {
    const { temperature, humidity } = this.readSensorValues();
    const f = new Uint8Array(5);

    if (this.type === 'dht22') {
      const h = Math.round(Math.max(0, Math.min(100, humidity)) * 10);
      f[0] = (h >> 8) & 0xFF;
      f[1] =  h       & 0xFF;
      const tAbs = Math.round(Math.abs(temperature) * 10);
      f[2] = ((tAbs >> 8) & 0x7F) | (temperature < 0 ? 0x80 : 0x00);
      f[3] =  tAbs & 0xFF;
    } else {
      // DHT11: integer values only
      f[0] = Math.round(Math.max(0, Math.min(100, humidity)));
      f[1] = 0;
      f[2] = Math.round(Math.max(0, Math.min(50, temperature)));
      f[3] = 0;
    }
    f[4] = (f[0] + f[1] + f[2] + f[3]) & 0xFF;
    return f;
  }

  private readSensorValues() {
    const { nodes } = useForgeStore.getState();
    const node = this.nodeId
      ? nodes.find(n => n.id === this.nodeId)
      : nodes.find(n => n.data?.type === this.type);
    return {
      temperature: node?.data?.sensorValues?.temperature ?? 25,
      humidity:    node?.data?.sensorValues?.humidity    ?? 50,
    };
  }
}
