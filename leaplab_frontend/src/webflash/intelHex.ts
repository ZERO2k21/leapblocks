/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 *
 * Intel HEX parser — converts .hex firmware (Intel HEX format) into a raw
 * byte image ready for flashing (STK500v1 page writes).
 * Handles type 00 (data), 01 (EOF) and 04 (extended linear address) records,
 * which covers AVR flash sizes beyond 64KB (e.g. ATmega2560).
 */

export interface HexImage {
    /** Flash byte address of the first byte in `data`. */
    startAddress: number;
    /** Raw flash bytes (padded to a page-aligned size). */
    data: Uint8Array;
    /** Highest written byte address (exclusive). */
    endAddress: number;
}

export function parseIntelHex(hexText: string): HexImage {
    const image = new Map<number, number>();
    let baseAddress = 0;
    let minAddress = Number.MAX_SAFE_INTEGER;
    let maxAddress = 0;

    for (const rawLine of hexText.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line.startsWith(':')) continue;

        const byteCount = parseInt(line.substring(1, 3), 16);
        const address = parseInt(line.substring(3, 7), 16);
        const recordType = parseInt(line.substring(7, 9), 16);
        if (line.length < 11 + byteCount * 2) continue;

        switch (recordType) {
            case 0x00: { // Data record
                const absAddress = baseAddress + address;
                for (let i = 0; i < byteCount; i++) {
                    const value = parseInt(line.substring(9 + i * 2, 11 + i * 2), 16);
                    image.set(absAddress + i, value);
                    if (absAddress + i < minAddress) minAddress = absAddress + i;
                    if (absAddress + i > maxAddress) maxAddress = absAddress + i;
                }
                break;
            }
            case 0x01: // EOF
                break;
            case 0x04: { // Extended linear address (upper 16 bits)
                const segment = parseInt(line.substring(9, 13), 16);
                baseAddress = segment << 16;
                break;
            }
            case 0x02: { // Extended segment address
                const segment = parseInt(line.substring(9, 13), 16);
                baseAddress = segment << 4;
                break;
            }
            default:
                break;
        }
    }

    if (maxAddress === 0 || minAddress === Number.MAX_SAFE_INTEGER) {
        return { startAddress: 0, data: new Uint8Array(0), endAddress: 0 };
    }

    // AVR flash always starts at byte 0 — page writes begin at 0 regardless.
    const startAddress = 0;
    const length = maxAddress + 1;
    const data = new Uint8Array(length);
    for (const [addr, value] of image.entries()) {
        data[addr] = value;
    }

    return { startAddress, data, endAddress: length };
}
