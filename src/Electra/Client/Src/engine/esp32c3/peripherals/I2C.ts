/**
 * LeapBlocks – ESP32-C3 I2C Master Peripheral (MMIO)
 *
 * Implements the I2C_EXT0 (and I2C_EXT1) MMIO register interface.
 * I2C_EXT0 base: 0x6001_3000
 * I2C_EXT1 base: 0x6002_7000
 *
 * The peripheral intercepts I2C transactions and routes them to
 * virtual I2C devices (OLED SSD1306, LCD PCF8574, etc.) attached
 * to the emulated bus.
 *
 * Key registers:
 *   0x000  I2C_SCL_LOW_PERIOD   timing (ignored in emulation)
 *   0x01C  I2C_DATA             FIFO data register
 *   0x024  I2C_STATUS           state machine status
 *   0x028  I2C_TO               timeout
 *   0x02C  I2C_SLAVE_ADDR       target address for master ops
 *   0x058  I2C_COMD0 – COMD7    command buffer (0x058 – 0x074)
 *   0x060  I2C_RXFIFO_RD_BYTE   read from RX FIFO
 *   I2C_INT_* registers at 0x020, 0x04C, 0x048, 0x044
 *
 * Transaction model:
 *   Firmware writes command words to COMD0–COMD7 then sets START bit
 *   in I2C_CTR_REG (0x004). We process the command list immediately
 *   (zero-cycle, since the emulated I2C devices are synchronous).
 */

import { MemoryRegion } from '../cpu/RiscVCore';

type u32 = number;

// ---------------------------------------------------------------------------
// I2C device interface — implement this for each virtual device
// ---------------------------------------------------------------------------

export interface I2CDevice {
  /** 7-bit I2C address */
  readonly address: number;
  /** Called at start of a write transaction. Returns false to NACK. */
  onStart(isRead: boolean): boolean;
  /** Called for each data byte written by master */
  onWrite(byte: number): void;
  /** Called for each byte the master wants to read. Return the byte value. */
  onRead(): number;
  /** Called at STOP condition */
  onStop(): void;
}

// ---------------------------------------------------------------------------
// Register offsets
// ---------------------------------------------------------------------------
const I2C_SCL_LOW_PERIOD = 0x000;
const I2C_CTR_REG        = 0x004; // bit 5: START, bit 3: TX_LSB, bit 4: RX_LSB
const I2C_SR_REG         = 0x008; // status
const I2C_TO_REG         = 0x00C;
const I2C_SLAVE_ADDR_REG = 0x010;
const I2C_RXFIFO_ST_REG  = 0x014;
const I2C_FIFO_CONF_REG  = 0x018;
const I2C_DATA_REG       = 0x01C;
const I2C_INT_RAW_REG    = 0x020;
const I2C_INT_CLR_REG    = 0x024;
const I2C_INT_ENA_REG    = 0x028;
const I2C_INT_ST_REG     = 0x02C;
const I2C_SDA_HOLD_REG   = 0x030;
const I2C_SDA_SAMPLE_REG = 0x034;
const I2C_SCL_HIGH_PERIOD= 0x038;
const I2C_SCL_START_HOLD = 0x040;
const I2C_SCL_RSTART_SETUP=0x044;
const I2C_SCL_STOP_HOLD  = 0x048;
const I2C_SCL_STOP_SETUP = 0x04C;
const I2C_SCL_FILTER_CFG = 0x050;
const I2C_SDA_FILTER_CFG = 0x054;
const I2C_COMD_BASE      = 0x058; // COMD0–COMD7, 4 bytes each

// Command word opcode bits [13:11]
const I2C_CMD_RSTART = 0;
const I2C_CMD_WRITE  = 1;
const I2C_CMD_READ   = 2;
const I2C_CMD_STOP   = 3;
const I2C_CMD_END    = 4;

// INT bits
const I2C_INT_TRANS_COMPLETE = (1 << 7);
const I2C_INT_END_DETECT     = (1 << 3);

export class ESP32C3I2C implements MemoryRegion {
  readonly base: u32;
  readonly size: u32 = 0x1000;
  readonly i2cNo: number;

  private devices: Map<number, I2CDevice> = new Map();

  private ctr: u32 = 0;
  private slaveAddr: u32 = 0;
  private intRaw: u32 = 0;
  private intEna: u32 = 0;
  private cmdBuf: u32[] = new Array(8).fill(0);

  // TX FIFO — bytes to be sent (written by firmware before issuing cmds)
  private txFifo: number[] = [];
  // RX FIFO — bytes received from device, read back by firmware
  private rxFifo: number[] = [];

  private onIRQ: ((irq: number) => void) | null = null;

  constructor(i2cNo: number) {
    this.i2cNo = i2cNo;
    this.base = i2cNo === 0 ? 0x60013000 : 0x60027000;
  }

  registerDevice(device: I2CDevice): void {
    this.devices.set(device.address, device);
  }

  onInterrupt(cb: (irq: number) => void): void { this.onIRQ = cb; }

  // ---------------------------------------------------------------------------
  // Transaction execution — called when firmware sets START bit in CTR
  // ---------------------------------------------------------------------------

  private executeCommands(): void {
    let addrWithRW = this.slaveAddr & 0xFF;
    const addr7 = (addrWithRW >> 1) & 0x7F;
    let device = this.devices.get(addr7);

    for (let i = 0; i < 8; i++) {
      const cmd = this.cmdBuf[i];
      const op  = (cmd >> 11) & 0x7;
      const len = cmd & 0xFF;

      switch (op) {
        case I2C_CMD_RSTART: {
          // (Re)START — direction determined by address byte in TX FIFO
          if (this.txFifo.length > 0) {
            addrWithRW = this.txFifo.shift()!;
          }
          const newAddr7 = (addrWithRW >> 1) & 0x7F;
          device = this.devices.get(newAddr7);
          const isRead = !!(addrWithRW & 0x1);
          device?.onStart(isRead);
          break;
        }
        case I2C_CMD_WRITE: {
          for (let b = 0; b < len; b++) {
            const byte = this.txFifo.shift() ?? 0;
            if (device) {
              device.onWrite(byte);
            }
            // NACK: if no device, silently drop bytes (bus stays idle)
          }
          break;
        }
        case I2C_CMD_READ: {
          for (let b = 0; b < len; b++) {
            if (device) {
              this.rxFifo.push(device.onRead());
            } else {
              this.rxFifo.push(0xFF); // NACK: return 0xFF (bus pulled high)
            }
          }
          break;
        }
        case I2C_CMD_STOP: {
          device?.onStop();
          break;
        }
        case I2C_CMD_END: {
          // End of command buffer — exit loop
          i = 8; // force loop exit
          break;
        }
      }
      if (op === I2C_CMD_END) break;
    }

    // Mark transaction complete
    this.intRaw |= I2C_INT_TRANS_COMPLETE | I2C_INT_END_DETECT;
    if ((this.intRaw & this.intEna) && this.onIRQ) {
      this.onIRQ(this.i2cNo === 0 ? 13 : 14);
    }

    // Clear START bit
    this.ctr &= ~(1 << 5);
  }

  // ---------------------------------------------------------------------------
  // MemoryRegion
  // ---------------------------------------------------------------------------

  read8(addr: u32): u32  { return this.read32(addr) & 0xFF; }
  read16(addr: u32): u32 { return this.read32(addr) & 0xFFFF; }

  read32(addr: u32): u32 {
    const off = (addr - this.base) >>> 0;
    switch (off) {
      case I2C_CTR_REG:       return this.ctr;
      case I2C_SR_REG:        return 0; // idle
      case I2C_DATA_REG:      return this.rxFifo.shift() ?? 0;
      case I2C_INT_RAW_REG:   return this.intRaw;
      case I2C_INT_ST_REG:    return this.intRaw & this.intEna;
      case I2C_INT_ENA_REG:   return this.intEna;
      case I2C_SLAVE_ADDR_REG:return this.slaveAddr;
      case I2C_RXFIFO_ST_REG: return this.rxFifo.length & 0x3F;
      default: {
        if (off >= I2C_COMD_BASE && off < I2C_COMD_BASE + 32) {
          return this.cmdBuf[(off - I2C_COMD_BASE) >> 2];
        }
        return 0;
      }
    }
  }

  write8(addr: u32, val: u32): void  { this.write32(addr, val); }
  write16(addr: u32, val: u32): void { this.write32(addr, val); }

  write32(addr: u32, val: u32): void {
    const off = (addr - this.base) >>> 0;
    switch (off) {
      case I2C_CTR_REG: {
        this.ctr = val;
        // START bit set → execute command buffer
        if (val & (1 << 5)) this.executeCommands();
        break;
      }
      case I2C_DATA_REG:
        this.txFifo.push(val & 0xFF);
        break;
      case I2C_INT_ENA_REG:
        this.intEna = val;
        break;
      case I2C_INT_CLR_REG:
        this.intRaw &= ~val;
        break;
      case I2C_SLAVE_ADDR_REG:
        this.slaveAddr = val;
        break;
      default: {
        if (off >= I2C_COMD_BASE && off < I2C_COMD_BASE + 32) {
          this.cmdBuf[(off - I2C_COMD_BASE) >> 2] = val;
        }
        break;
      }
    }
  }
}
