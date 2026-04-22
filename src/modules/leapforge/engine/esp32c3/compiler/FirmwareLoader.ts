/**
 * LeapBlocks – ESP32-C3 Firmware Loader
 *
 * Parses the ESP32 firmware image (either raw .bin flash image or ELF)
 * and loads code + data segments into the simulated IRAM / DRAM.
 *
 * ESP32 Flash Image Format
 * ────────────────────────
 * Byte 0:    Magic byte (0xE9)
 * Byte 1:    Segment count
 * Byte 2:    SPI flash mode
 * Byte 3:    SPI flash speed/size
 * Byte 4-7:  Entry point address (LE u32)
 * Byte 8-15: Extended header (ESP32 image v2)
 * …
 * For each segment:
 *   4 bytes: Load address
 *   4 bytes: Segment size
 *   N bytes: Data
 *
 * ELF32 support is detected by magic \x7fELF and handled separately.
 *
 * After loading the firmware, call getEntryPoint() to get the PC
 * start address for the CPU core.
 */

import { RiscVCore } from '../cpu/RiscVCore';

const ESP_IMAGE_MAGIC = 0xE9;
const ELF_MAGIC = 0x464C457F; // \x7fELF in LE u32

export interface LoadResult {
  entryPoint: number;
  segmentsLoaded: number;
  totalBytes: number;
}

// ---------------------------------------------------------------------------
// ELF32 types
// ---------------------------------------------------------------------------

const PT_LOAD = 1;

function readU32LE(buf: Uint8Array, off: number): number {
  return (buf[off] | (buf[off+1] << 8) | (buf[off+2] << 16) | (buf[off+3] << 24)) >>> 0;
}
function readU16LE(buf: Uint8Array, off: number): number {
  return (buf[off] | (buf[off+1] << 8)) >>> 0;
}

// ---------------------------------------------------------------------------
// Main loader
// ---------------------------------------------------------------------------

export class FirmwareLoader {
  private core: RiscVCore;

  constructor(core: RiscVCore) {
    this.core = core;
  }

  /**
   * Load firmware from a Uint8Array.
   * Auto-detects ESP32 flash image vs ELF32.
   */
  load(data: Uint8Array): LoadResult {
    if (data.length < 8) throw new Error('Firmware too small');

    const magic32 = readU32LE(data, 0);
    if (magic32 === ELF_MAGIC) {
      return this.loadELF(data);
    } else if (data[0] === ESP_IMAGE_MAGIC) {
      return this.loadFlashImage(data);
    } else {
      throw new Error(`[FirmwareLoader] Unknown firmware format: magic=0x${data[0].toString(16)}`);
    }
  }

  // ---------------------------------------------------------------------------
  // ESP32 Flash Image Parser
  // ---------------------------------------------------------------------------

  private loadFlashImage(data: Uint8Array): LoadResult {
    const segCount  = data[1];
    const entry     = readU32LE(data, 4);

    // Extended header detection (byte 8 = 0xEE → v2 with extended header)
    const extendedHeader = data[8] === 0xEE;
    let offset = extendedHeader ? 32 : 8; // v2 header is 32 bytes

    let segmentsLoaded = 0;
    let totalBytes = 0;

    for (let s = 0; s < segCount; s++) {
      if (offset + 8 > data.length) break;

      const loadAddr = readU32LE(data, offset);
      const segSize  = readU32LE(data, offset + 4);
      offset += 8;

      if (offset + segSize > data.length) break;
      if (segSize === 0) { offset += segSize; continue; }

      const segData = data.subarray(offset, offset + segSize);
      offset += segSize;

      this.loadSegment(loadAddr, segData);
      segmentsLoaded++;
      totalBytes += segSize;

      console.log(
        `[FirmwareLoader] Segment ${s}: addr=0x${loadAddr.toString(16).padStart(8,'0')} ` +
        `size=${segSize} bytes`
      );
    }

    console.log(
      `[FirmwareLoader] Flash image loaded: ${segmentsLoaded} segments, ` +
      `${totalBytes} bytes, entry=0x${entry.toString(16)}`
    );

    return { entryPoint: entry, segmentsLoaded, totalBytes };
  }

  // ---------------------------------------------------------------------------
  // ELF32 Parser (RISC-V little-endian)
  // ---------------------------------------------------------------------------

  private loadELF(data: Uint8Array): LoadResult {
    // ELF header
    const elfClass = data[4]; // 1 = 32-bit
    if (elfClass !== 1) throw new Error('[FirmwareLoader] Only ELF32 supported');

    const entry      = readU32LE(data, 0x18);
    const phOff      = readU32LE(data, 0x1C); // program header offset
    const phEntSize  = readU16LE(data, 0x2A);
    const phCount    = readU16LE(data, 0x2C);

    let segmentsLoaded = 0;
    let totalBytes = 0;

    for (let i = 0; i < phCount; i++) {
      const phStart = phOff + i * phEntSize;
      const pType   = readU32LE(data, phStart + 0x00);
      const offset  = readU32LE(data, phStart + 0x04);
      const vaddr   = readU32LE(data, phStart + 0x08);
      const paddr   = readU32LE(data, phStart + 0x0C);
      const filesz  = readU32LE(data, phStart + 0x10);
      const memsz   = readU32LE(data, phStart + 0x14);

      if (pType !== PT_LOAD || filesz === 0) continue;

      const segData = data.subarray(offset, offset + filesz);
      const loadAddr = paddr !== 0 ? paddr : vaddr;

      this.loadSegment(loadAddr, segData);

      // Zero-fill BSS (memsz > filesz)
      if (memsz > filesz) {
        const zeros = new Uint8Array(memsz - filesz);
        this.loadSegment(loadAddr + filesz, zeros);
      }

      segmentsLoaded++;
      totalBytes += filesz;

      console.log(
        `[FirmwareLoader] ELF PT_LOAD: addr=0x${loadAddr.toString(16).padStart(8,'0')} ` +
        `filesz=${filesz} memsz=${memsz}`
      );
    }

    console.log(
      `[FirmwareLoader] ELF loaded: ${segmentsLoaded} segments, ` +
      `${totalBytes} bytes, entry=0x${entry.toString(16)}`
    );

    return { entryPoint: entry, segmentsLoaded, totalBytes };
  }

  // ---------------------------------------------------------------------------
  // Route a segment to the correct memory region
  // ---------------------------------------------------------------------------

  private loadSegment(addr: number, data: Uint8Array): void {
    const IRAM_BASE = RiscVCore.IRAM_BASE;
    const IRAM_END  = IRAM_BASE + RiscVCore.IRAM_SIZE;
    const DRAM_BASE = RiscVCore.DRAM_BASE;
    const DRAM_END  = DRAM_BASE + RiscVCore.DRAM_SIZE;

    if (addr >= IRAM_BASE && addr < IRAM_END) {
      this.core.loadIRAM(data, addr - IRAM_BASE);
    } else if (addr >= DRAM_BASE && addr < DRAM_END) {
      this.core.loadDRAM(data, addr - DRAM_BASE);
    } else if (addr >= 0x40000000 && addr < 0x40060000) {
      // ROM region — map to IRAM start for simulation purposes
      this.core.loadIRAM(data, 0);
    } else {
      // Unknown region — try DRAM as fallback
      console.warn(
        `[FirmwareLoader] Segment at 0x${addr.toString(16)} outside known regions, ` +
        `loading into DRAM offset 0`
      );
      this.core.loadDRAM(data, 0);
    }
  }
}
