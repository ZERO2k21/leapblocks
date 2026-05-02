/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import { TWIEventHandler } from '../lib/avr8js/avr8js';
import { simulationRunner } from './SimulationRunner';

/**
 * Interface for virtual I2C slave devices in the LeapForge engine.
 */
export interface I2CSlave {
  i2cAddress: number;
  onStart(repeated: boolean): void;
  onStop(): void;
  onConnect(write: boolean): boolean; // returns true for ACK, false for NACK
  onWrite(value: number): boolean;    // returns true for ACK, false for NACK
  onRead(ack: boolean): number;       // returns data byte to send to master
}

/**
 * I2CBusManager
 * Manages all virtual I2C devices connected to the AVR TWI bus.
 */
export class I2CBusManager implements TWIEventHandler {
  private slaves = new Map<number, I2CSlave>();
  private activeSlave: I2CSlave | null = null;

  constructor() { }

  public registerSlave(slave: I2CSlave) {
    this.slaves.set(slave.i2cAddress, slave);
    console.log(`[I2C BUS] Registered slave at address 0x${slave.i2cAddress.toString(16)}`);
  }

  public clear() {
    this.slaves.clear();
    this.activeSlave = null;
  }

  // --- TWIEventHandler Implementation ---

  start(repeated: boolean): void {
    this.activeSlave = null;
    simulationRunner.TWI?.completeStart();
  }

  stop(): void {
    if (this.activeSlave) {
      this.activeSlave.onStop();
    }
    this.activeSlave = null;
    simulationRunner.TWI?.completeStop();
  }

  connectToSlave(addr: number, write: boolean): void {
    // addr is the 7-bit address
    const slave = this.slaves.get(addr);
    if (slave) {
      const ack = slave.onConnect(write);
      if (ack) {
        this.activeSlave = slave;
        slave.onStart(false); // Notify slave session start
      }
      simulationRunner.TWI?.completeConnect(ack);
    } else {
      simulationRunner.TWI?.completeConnect(false); // NACK
    }
  }

  writeByte(value: number): void {
    if (this.activeSlave) {
      const ack = this.activeSlave.onWrite(value);
      simulationRunner.TWI?.completeWrite(ack);
    } else {
      simulationRunner.TWI?.completeWrite(false); // NACK if no slave active
    }
  }

  readByte(ack: boolean): void {
    if (this.activeSlave) {
      const value = this.activeSlave.onRead(ack);
      simulationRunner.TWI?.completeRead(value);
    } else {
      simulationRunner.TWI?.completeRead(0xFF); // NACK
    }
  }
}
