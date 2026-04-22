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
  return (buf[off] | (buf[off + 1] << 8) | (buf[off + 2] << 16) | (buf[off + 3] << 24)) >>> 0;
}
function readU16LE(buf: Uint8Array, off: number): number {
  return (buf[off] | (buf[off + 1] << 8)) >>> 0;
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
   * Auto-detects:
   *   1. ELF32 (magic 0x7fELF)
   *   2. Merged flash image (4MB raw image built by buildMergedFlashImage)
   *      — app binary lives at offset 0x10000 inside the image
   *   3. Standalone ESP32 app image (magic 0xE9 at offset 0)
   */
  load(data: Uint8Array): LoadResult {
    console.log(`[FirmwareLoader] Loading firmware: ${data.length} bytes`);
    console.log(`[FirmwareLoader] First 16 bytes: ${Array.from(data.slice(0, 16)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')}`);

    if (data.length < 8) throw new Error('Firmware too small');

    const magic32 = readU32LE(data, 0);
    console.log(`[FirmwareLoader] Magic: 0x${magic32.toString(16)}`);

    if (magic32 === ELF_MAGIC) {
      console.log('[FirmwareLoader] Detected ELF32 format');
      return this.loadELF(data);
    }

    // Detect merged flash image: large file (≥ 512KB) with 0xE9 at offset 0
    // but the real app image is at offset 0x10000 (default ESP32 app partition).
    // The bootloader at offset 0 is tiny (~28KB) — if we see 0xE9 at 0 AND
    // also 0xE9 at 0x10000, this is a merged image.
    const APP_OFFSET = 0x10000;
    if (
      data[0] === ESP_IMAGE_MAGIC &&
      data.length > APP_OFFSET + 8 &&
      data[APP_OFFSET] === ESP_IMAGE_MAGIC
    ) {
      console.log(`[FirmwareLoader] Detected merged flash image (${data.length} bytes) — reading app at offset 0x${APP_OFFSET.toString(16)}`);
      return this.loadFlashImage(data.subarray(APP_OFFSET));
    }

    if (data[0] === ESP_IMAGE_MAGIC) {
      console.log('[FirmwareLoader] Detected standalone ESP32 app image format');
      return this.loadFlashImage(data);
    }

    throw new Error(`[FirmwareLoader] Unknown firmware format: magic=0x${data[0].toString(16)}`);
  }

  // ---------------------------------------------------------------------------
  // ESP32 Flash Image Parser
  // ---------------------------------------------------------------------------

  private loadFlashImage(data: Uint8Array): LoadResult {
    const segCount = data[1];
    const entry = readU32LE(data, 4);

    // esp_image_header_t layout (from ESP-IDF docs):
    //   Byte 0:    magic (0xE9)
    //   Byte 1:    segment_count
    //   Byte 2:    spi_mode
    //   Byte 3:    spi_speed_size
    //   Byte 4-7:  entry_addr (LE u32)
    //   Byte 8:    wp_pin (0xEE = disabled -> extended header present)
    //   Byte 9-11: drive_settings (3 bytes)
    //   Byte 12-13: chip_id (2 bytes)
    //   Byte 14:   min_chip_rev (1 byte)
    //   Byte 15-16: min_chip_rev_full (2 bytes)
    //   Byte 17-18: max_chip_rev_full (2 bytes)
    //   Byte 19-22: reserved (4 bytes)
    //   Byte 23:   hash_appended (1 byte)
    // Total esp_image_header_t = 24 bytes (with extended header)
    // Without extended header (byte 8 != 0xEE): only 8 bytes
    const extendedHeader = data[8] === 0xEE;
    const HEADER_SIZE = extendedHeader ? 24 : 8;
    let offset = HEADER_SIZE;

    console.log(`[FirmwareLoader] Header: ${extendedHeader ? 'extended (24 bytes)' : 'basic (8 bytes)'}, segments=${segCount}, entry=0x${entry.toString(16)}`);

    let segmentsLoaded = 0;
    let totalBytes = 0;

    for (let s = 0; s < segCount; s++) {
      if (offset + 8 > data.length) break;

      const loadAddr = readU32LE(data, offset);
      const segSize = readU32LE(data, offset + 4);
      offset += 8;

      if (offset + segSize > data.length) break;
      if (segSize === 0) { offset += segSize; continue; }

      const segData = data.subarray(offset, offset + segSize);
      offset += segSize;

      this.loadSegment(loadAddr, segData);
      segmentsLoaded++;
      totalBytes += segSize;

      console.log(
        `[FirmwareLoader] Segment ${s}: addr=0x${loadAddr.toString(16).padStart(8, '0')} ` +
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

    const entry = readU32LE(data, 0x18);
    const phOff = readU32LE(data, 0x1C); // program header offset
    const phEntSize = readU16LE(data, 0x2A);
    const phCount = readU16LE(data, 0x2C);

    let segmentsLoaded = 0;
    let totalBytes = 0;

    for (let i = 0; i < phCount; i++) {
      const phStart = phOff + i * phEntSize;
      const pType = readU32LE(data, phStart + 0x00);
      const offset = readU32LE(data, phStart + 0x04);
      const vaddr = readU32LE(data, phStart + 0x08);
      const paddr = readU32LE(data, phStart + 0x0C);
      const filesz = readU32LE(data, phStart + 0x10);
      const memsz = readU32LE(data, phStart + 0x14);

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
        `[FirmwareLoader] ELF PT_LOAD: addr=0x${loadAddr.toString(16).padStart(8, '0')} ` +
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
    const IRAM_BASE = RiscVCore.IRAM_BASE;   // 0x40380000
    const IRAM_END = IRAM_BASE + RiscVCore.IRAM_SIZE;
    const DRAM_BASE = RiscVCore.DRAM_BASE;   // 0x3FC80000
    const DRAM_END = DRAM_BASE + RiscVCore.DRAM_SIZE;

    // ESP32-C3 flash-mapped regions (MMU-mapped via cache):
    //   IROM: 0x42000000 – 0x42FFFFFF  (executable code in flash)
    //   DROM: 0x3C000000 – 0x3CFFFFFF  (read-only data in flash)
    // For simulation we load these into IRAM/DRAM respectively so the
    // soft-core can execute/read them without a real MMU.
    const IROM_BASE = 0x42000000;
    const IROM_END = 0x43000000;
    const DROM_BASE = 0x3C000000;
    const DROM_END = 0x3D000000;

    if (addr >= IRAM_BASE && addr < IRAM_END) {
      this.core.loadIRAM(data, addr - IRAM_BASE);
    } else if (addr >= DRAM_BASE && addr < DRAM_END) {
      this.core.loadDRAM(data, addr - DRAM_BASE);
    } else if (addr >= IROM_BASE && addr < IROM_END) {
      // Flash-mapped code: load into IRAM at the same relative offset
      // so PC-relative jumps into IROM still resolve correctly.
      // We map IROM base -> IRAM base for the simulator.
      const iramOffset = addr - IROM_BASE;
      if (iramOffset + data.length <= RiscVCore.IRAM_SIZE) {
        this.core.loadIRAM(data, iramOffset);
        console.log(`[FirmwareLoader] IROM segment 0x${addr.toString(16)} -> IRAM offset 0x${iramOffset.toString(16)}`);
      } else {
        console.warn(`[FirmwareLoader] IROM segment 0x${addr.toString(16)} too large for IRAM, truncating`);
        this.core.loadIRAM(data.subarray(0, RiscVCore.IRAM_SIZE - iramOffset), iramOffset);
      }
    } else if (addr >= DROM_BASE && addr < DROM_END) {
      // Flash-mapped data: load into DRAM
      const dramOffset = addr - DROM_BASE;
      if (dramOffset + data.length <= RiscVCore.DRAM_SIZE) {
        this.core.loadDRAM(data, dramOffset);
        console.log(`[FirmwareLoader] DROM segment 0x${addr.toString(16)} -> DRAM offset 0x${dramOffset.toString(16)}`);
      } else {
        console.warn(`[FirmwareLoader] DROM segment 0x${addr.toString(16)} too large for DRAM, truncating`);
        this.core.loadDRAM(data.subarray(0, RiscVCore.DRAM_SIZE - dramOffset), dramOffset);
      }
    } else if (addr >= 0x40000000 && addr < 0x40380000) {
      // ROM region — map to IRAM start for simulation purposes
      this.core.loadIRAM(data, 0);
    } else if (addr === 0x50000000 || (addr >= 0x50000000 && addr < 0x50002000)) {
      // RTC SLOW memory — small, ignore for simulation
      console.log(`[FirmwareLoader] RTC segment at 0x${addr.toString(16)} (${data.length} bytes) — skipped`);
    } else {
      console.warn(
        `[FirmwareLoader] Segment at 0x${addr.toString(16)} outside known regions (${data.length} bytes) — skipped`
      );
    }
  }
}
