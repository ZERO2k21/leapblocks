/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 *
 * Helper to read/write data types from WASM linear memory.
 * ESP32 is little-endian 32-bit.
 */

export class WASMMemoryHelper {
    private mem: WebAssembly.Memory;

    constructor(memory: WebAssembly.Memory) {
        this.mem = memory;
    }

    get buffer(): ArrayBuffer {
        return this.mem.buffer;
    }

    view(): DataView {
        return new DataView(this.mem.buffer);
    }

    u8(addr: number): number {
        return this.view().getUint8(addr);
    }

    u32(addr: number): number {
        return this.view().getUint32(addr, true); // little-endian
    }

    i32(addr: number): number {
        return this.view().getInt32(addr, true);
    }

    writeU32(addr: number, val: number): void {
        this.view().setUint32(addr, val, true);
    }

    writeU8(addr: number, val: number): void {
        this.view().setUint8(addr, val);
    }

    /**
     * Read a null-terminated C string from WASM memory.
     * max = safety limit to avoid runaway reads.
     */
    readCString(addr: number, max = 512): string {
        const bytes: number[] = [];
        for (let i = 0; i < max; i++) {
            const b = this.u8(addr + i);
            if (b === 0) break;
            bytes.push(b);
        }
        return new TextDecoder().decode(new Uint8Array(bytes));
    }

    /**
     * Write a null-terminated C string into WASM memory.
     * Returns bytes written (including null terminator).
     */
    writeCString(addr: number, str: string): number {
        const encoded = new TextEncoder().encode(str);
        const view = new Uint8Array(this.mem.buffer);
        view.set(encoded, addr);
        view[addr + encoded.length] = 0;
        return encoded.length + 1;
    }

    /** Copy raw bytes into WASM memory at addr. */
    writeBytes(addr: number, data: Uint8Array): void {
        new Uint8Array(this.mem.buffer).set(data, addr);
    }

    /** Read `len` bytes from WASM memory at addr. */
    readBytes(addr: number, len: number): Uint8Array {
        return new Uint8Array(this.mem.buffer.slice(addr, addr + len));
    }

    /**
     * Allocate a response buffer in the WASM heap using the exported malloc.
     * Returns the pointer. Caller must free via exports.free(ptr).
     */
    malloc(exports: any, size: number): number {
        return exports.malloc(size);
    }
}
