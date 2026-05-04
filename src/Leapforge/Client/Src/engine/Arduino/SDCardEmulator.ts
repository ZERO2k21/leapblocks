/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
/**
 * SDCardEmulator.ts
 * Emulates a microSD card via SPI protocol.
 *
 * Supports basic SD card commands:
 *   CMD0  - GO_IDLE_STATE (reset)
 *   CMD1  - SEND_OP_COND (MMC mode init)
 *   CMD8  - SEND_IF_COND (check voltage and check pattern)
 *   CMD55 - APP_CMD (prefix for ACMD commands)
 *   ACMD41 - APP_SEND_OP_COND (SD mode init)
 *   CMD58 - READ_OCR (read operating condition register)
 *   CMD17 - READ_SINGLE_BLOCK
 *   CMD24 - WRITE_SINGLE_BLOCK
 *   CMD25 - WRITE_MULTIPLE_BLOCK
 *   CMD18 - READ_MULTIPLE_BLOCK
 *
 * Simulates FAT32 filesystem with virtual files for Arduino sketches.
 */

const SD_BLOCK_SIZE = 512;
const SD_CAPACITY = 2 * 1024 * 1024; // 2MB simulated size

export type SDCardUpdateCallback = (state: { initialized: boolean; lastCommand?: number; error?: string }) => void;

export class SDCardEmulator {
  private initialized = false;
  private selectedByCS = false;
  private crcMode = false;
  private spiMode = false; // false=SD mode, true=SPI mode
  private responseMode = 'R1'; // R1, R2, R3, R7, Data
  
  // Virtual filesystem
  private fsBlocks = new Map<number, Uint8Array>();
  
  // Command state
  private currentCommand: number | null = null;
  private commandArgs: number[] = [];
  private commandState = 'idle'; // idle, command, response, data
  private responseBuffer: number[] = [];
  private responseIndex = 0;
  private dataBuffer: Uint8Array = new Uint8Array(0);
  private dataIndex = 0;
  private blockAddress = 0;
  private blockCount = 0;
  
  // Block addressing
  private highCapacity = false; // SDHC = true, standard SD = false
  
  private onUpdate: SDCardUpdateCallback;

  constructor(onUpdate: SDCardUpdateCallback = () => {}) {
    this.onUpdate = onUpdate;
    this._initializeVirtualFilesystem();
  }

  /**
   * Initialize virtual filesystem with some default content
   */
  private _initializeVirtualFilesystem(): void {
    // Create a simple FAT32-like structure
    // Block 0: MBR
    const mbrBlock = new Uint8Array(SD_BLOCK_SIZE);
    // Signature
    mbrBlock[510] = 0x55;
    mbrBlock[511] = 0xAA;
    this.fsBlocks.set(0, mbrBlock);

    // Block 1-10: FAT table (empty for simulation)
    for (let i = 1; i <= 10; i++) {
      this.fsBlocks.set(i, new Uint8Array(SD_BLOCK_SIZE));
    }

    // Create virtual files if needed
    this._createVirtualFiles();
    
    console.log('[SD CARD] Virtual filesystem initialized');
  }

  private _createVirtualFiles(): void {
    // Create some dummy files in virtual FAT (not fully implemented)
    // For now, just allocate space
  }

  /**
   * Called by SDCardSPISlave when a byte is sent from the master
   */
  writeCommand(cmd: number): void {
    // SD card expects commands in the format: 01xxxxxx (byte 1) + 6 command bits
    // For now, handle raw command byte
    if (cmd >= 0x40 && cmd <= 0x7F) {
      // Valid SD command (0x40-0x7F range is 01xxxxxx)
      this.currentCommand = cmd & 0x3F;
      this.commandArgs = [];
      this.responseMode = 'R1';
      console.log(`[SD CARD] CMD${this.currentCommand} received`);
      this._handleCommand(this.currentCommand);
    }
  }

  /**
   * Called by SDCardSPISlave when a byte is sent (multi-byte support)
   */
  writeByte(byte: number): number {
    // If we're in command phase (first 5 bytes are command + args)
    if (this.commandArgs.length < 4) {
      this.commandArgs.push(byte);
      if (this.commandArgs.length === 4) {
        // Command received, send response
        this.responseIndex = 0;
      }
    }
    // Return response byte
    return this._getResponseByte();
  }

  /**
   * Called by SDCardSPISlave when reading response data
   */
  readByte(): number {
    return this._getResponseByte();
  }

  private _getResponseByte(): number {
    // Send queued response bytes
    if (this.responseIndex < this.responseBuffer.length) {
      return this.responseBuffer[this.responseIndex++];
    }
    
    // If sending data block, return data byte
    if (this.dataIndex < this.dataBuffer.length) {
      return this.dataBuffer[this.dataIndex++];
    }

    // Default: return 0xFF (idle/no response)
    return 0xFF;
  }

  /**
   * Handle SD card commands
   */
  private _handleCommand(cmd: number): void {
    switch (cmd) {
      case 0: // CMD0 - GO_IDLE_STATE
        this.initialized = false;
        this.spiMode = true;
        this._sendR1Response(0x01); // In idle state
        this.onUpdate({ initialized: false, lastCommand: 0 });
        break;

      case 1: // CMD1 - SEND_OP_COND (MMC init)
        this._sendR1Response(0x00); // Not in idle state
        this.initialized = true;
        this.onUpdate({ initialized: true, lastCommand: 1 });
        break;

      case 8: // CMD8 - SEND_IF_COND
        // Check voltage range and echo pattern
        const arg = (this.commandArgs[0] << 24) | (this.commandArgs[1] << 16) | 
                    (this.commandArgs[2] << 8) | this.commandArgs[3];
        if (this.spiMode) {
          this._sendR7Response(0x00, arg); // Echo back the argument
        } else {
          this._sendR1Response(0x04); // Illegal command in non-SPI mode
        }
        break;

      case 9: // CMD9 - SEND_CSD (Card-Specific Data)
        this._sendR1Response(0x00);
        // Send 16-byte CSD
        const csdData = new Uint8Array(16);
        csdData[0] = 0x00; // Version, not last or this is last?
        csdData[1] = 0x26; // TAAC
        csdData[2] = 0x00; // NSAC
        csdData[3] = 0x32; // TRAN_SPEED
        this._sendDataBlock(csdData);
        break;

      case 10: // CMD10 - SEND_CID (Card Identification)
        this._sendR1Response(0x00);
        // Send 16-byte CID
        const cidData = new Uint8Array(16);
        cidData[0] = 0x7F; // Manufacturer ID
        for (let i = 1; i < 16; i++) cidData[i] = 0x00;
        this._sendDataBlock(cidData);
        break;

      case 17: // CMD17 - READ_SINGLE_BLOCK
        this.blockAddress = (this.commandArgs[0] << 24) | (this.commandArgs[1] << 16) |
                            (this.commandArgs[2] << 8) | this.commandArgs[3];
        if (!this.highCapacity) this.blockAddress *= 512; // Convert to byte address
        this._sendR1Response(0x00);
        this._readBlock(this.blockAddress);
        break;

      case 18: // CMD18 - READ_MULTIPLE_BLOCK
        this.blockAddress = (this.commandArgs[0] << 24) | (this.commandArgs[1] << 16) |
                            (this.commandArgs[2] << 8) | this.commandArgs[3];
        if (!this.highCapacity) this.blockAddress *= 512;
        this._sendR1Response(0x00);
        this.blockCount = 1;
        this._readBlock(this.blockAddress);
        break;

      case 24: // CMD24 - WRITE_SINGLE_BLOCK
        this.blockAddress = (this.commandArgs[0] << 24) | (this.commandArgs[1] << 16) |
                            (this.commandArgs[2] << 8) | this.commandArgs[3];
        if (!this.highCapacity) this.blockAddress *= 512;
        this._sendR1Response(0x00);
        this.dataBuffer = new Uint8Array(SD_BLOCK_SIZE);
        this.dataIndex = 0;
        break;

      case 25: // CMD25 - WRITE_MULTIPLE_BLOCK
        this.blockAddress = (this.commandArgs[0] << 24) | (this.commandArgs[1] << 16) |
                            (this.commandArgs[2] << 8) | this.commandArgs[3];
        if (!this.highCapacity) this.blockAddress *= 512;
        this._sendR1Response(0x00);
        this.blockCount = 1;
        break;

      case 41: // ACMD41 - APP_SEND_OP_COND
        // Check if HCS bit is set
        const hcsSet = (this.commandArgs[0] & 0x40) !== 0;
        this.highCapacity = hcsSet;
        // Return response with ready bit set (0 = not ready, bit should be set)
        this._sendR1Response(0x00); // Busy, not ready yet (real SD takes time)
        setTimeout(() => {
          // After a brief moment, card is ready
          this.initialized = true;
          this.onUpdate({ initialized: true, lastCommand: 41 });
        }, 10);
        break;

      case 55: // CMD55 - APP_CMD
        // Next command will be an ACMD
        this._sendR1Response(0x00);
        break;

      case 58: // CMD58 - READ_OCR
        this._sendR1Response(0x00);
        // Send 4-byte OCR (Operating Condition Register)
        const ocr = new Uint8Array(4);
        ocr[0] = 0x80; // Card ready
        ocr[1] = 0xFF; // Voltage range
        ocr[2] = 0x80;
        ocr[3] = 0x00;
        this._sendDataBlock(ocr);
        break;

      case 59: // CMD59 - CRC_ON_OFF
        const crcOn = (this.commandArgs[0] & 0x01) !== 0;
        this.crcMode = crcOn;
        this._sendR1Response(0x00);
        break;

      default:
        console.warn(`[SD CARD] Unhandled CMD${cmd}`);
        this._sendR1Response(0x04); // Illegal command response
        break;
    }
  }

  private _sendR1Response(status: number): void {
    this.responseBuffer = [status];
    this.responseIndex = 0;
  }

  private _sendR3Response(status: number, ocr: number): void {
    this.responseBuffer = [
      status,
      (ocr >> 24) & 0xFF,
      (ocr >> 16) & 0xFF,
      (ocr >> 8) & 0xFF,
      ocr & 0xFF,
    ];
    this.responseIndex = 0;
  }

  private _sendR7Response(status: number, echo: number): void {
    this.responseBuffer = [
      status,
      (echo >> 24) & 0xFF,
      (echo >> 16) & 0xFF,
      (echo >> 8) & 0xFF,
      echo & 0xFF,
    ];
    this.responseIndex = 0;
  }

  private _readBlock(blockAddr: number): void {
    // Fetch block from virtual filesystem or return zeros
    const block = this.fsBlocks.get(blockAddr / SD_BLOCK_SIZE) || new Uint8Array(SD_BLOCK_SIZE);
    
    // Add data token (0xFE) and CRC
    const dataWithToken = new Uint8Array(SD_BLOCK_SIZE + 3);
    dataWithToken[0] = 0xFE; // Data start token
    dataWithToken.set(block, 1);
    dataWithToken[SD_BLOCK_SIZE + 1] = 0x00; // CRC
    dataWithToken[SD_BLOCK_SIZE + 2] = 0x00;
    
    this.dataBuffer = dataWithToken;
    this.dataIndex = 0;
  }

  private _sendDataBlock(data: Uint8Array): void {
    // Wrap data with start token and CRC
    const dataWithToken = new Uint8Array(data.length + 3);
    dataWithToken[0] = 0xFE; // Data start token
    dataWithToken.set(data, 1);
    dataWithToken[data.length + 1] = 0x00; // CRC
    dataWithToken[data.length + 2] = 0x00;
    
    this.dataBuffer = dataWithToken;
    this.dataIndex = 0;
  }

  /** Called when CS goes LOW (chip selected) */
  setCS(active: boolean): void {
    this.selectedByCS = active;
    if (!active) {
      // Deselected, reset state
      this.responseIndex = 0;
      this.dataIndex = 0;
    }
  }

  /** Get current card state */
  getState(): { initialized: boolean; highCapacity: boolean; capacity: number } {
    return {
      initialized: this.initialized,
      highCapacity: this.highCapacity,
      capacity: SD_CAPACITY,
    };
  }
}
