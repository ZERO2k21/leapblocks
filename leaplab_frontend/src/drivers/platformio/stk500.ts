/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 *
 * Clean-room STK500v1 serial bootloader programmer.
 *
 * Implements the public STK500v1 protocol (the same protocol spoken by the
 * Arduino bootloaders optiboot / AtmegaBOOT) so AVR firmware can be flashed
 * without avrdude — avrdude is GPL-2.0+, this implementation is original code
 * and carries no GPL obligations. No external tools are invoked.
 */

import { SerialPort } from 'serialport';
import type { HexImage } from '../../webflash/intelHex';

const STK_GET_SYNC = 0x30;
const STK_SET_DEVICE = 0x42;
const STK_SET_DEVICE_EXT = 0x45;
const STK_ENTER_PROGMODE = 0x46;
const STK_LEAVE_PROGMODE = 0x51;
const STK_LOAD_ADDRESS = 0x55;
const STK_PROG_PAGE = 0x64;
const STK_READ_PAGE = 0x74;
const CRC_EOP = 0x20;
const STK_INSYNC = 0x14;
const STK_OK = 0x10;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class Stk500V1 {
    private sp: SerialPort;
    /** Bytes received from the bootloader but not yet consumed by a read. */
    private fifo: number[] = [];
    /** The single outstanding read (reads are strictly sequential). */
    private pending: { need: number; resolve: (b: Buffer) => void } | null = null;

    constructor(
        private portPath: string,
        private baud: number,
        private onEvent?: (msg: string) => void
    ) {
        this.sp = new SerialPort({
            path: portPath,
            baudRate: baud,
            autoOpen: false,
            // Keep both lines neutral — asserting DTR/RTS on open would
            // re-trigger the board reset and kill the bootloader window.
            dtr: false,
            rts: false,
        });
        // One permanent listener — every byte the bootloader sends is kept
        // in the FIFO until a read consumes it. Never discard mid-chunk.
        this.sp.on('data', (d: Buffer) => this.onData(d));
    }

    private onData(d: Buffer): void {
        for (const b of d) this.fifo.push(b);
        if (this.pending && this.fifo.length >= this.pending.need) {
            const p = this.pending;
            this.pending = null;
            p.resolve(Buffer.from(this.fifo.splice(0, p.need)));
        }
    }

    private event(msg: string): void {
        console.log(`[FORGE UPLOADER] ${msg}`);
        this.onEvent?.(msg);
    }

    open(): Promise<void> {
        return new Promise((resolve, reject) => this.sp.open((e) => (e ? reject(e) : resolve())));
    }

    close(): Promise<void> {
        return new Promise((resolve) => {
            try {
                this.sp.close(() => resolve());
            } catch {
                resolve();
            }
        });
    }

    private write(buf: Buffer): Promise<void> {
        return new Promise((resolve, reject) => this.sp.write(buf, (e) => (e ? reject(e) : resolve())));
    }

    /**
     * Read exactly `n` bytes from the receive FIFO. No byte is ever dropped:
     * anything already received stays queued for later reads. Resolves with
     * fewer than `n` bytes only on timeout (callers must check the length).
     */
    private readBytes(n: number, timeoutMs: number): Promise<Buffer> {
        if (this.fifo.length >= n) {
            return Promise.resolve(Buffer.from(this.fifo.splice(0, n)));
        }
        return new Promise((resolve) => {
            const timer = setTimeout(() => {
                if (this.pending?.need === n) this.pending = null;
                resolve(Buffer.from(this.fifo.splice(0, this.fifo.length)));
            }, timeoutMs);
            this.pending = {
                need: n,
                resolve: (b: Buffer) => {
                    clearTimeout(timer);
                    resolve(b);
                },
            };
        });
    }

    /** Discard any received-but-unread bytes (line noise / stale data). */
    private async flush(waitMs: number): Promise<void> {
        this.fifo.length = 0;
        await sleep(waitMs);
        this.fifo.length = 0;
    }

    /** STK_GET_SYNC handshake — retries within the bootloader's watchdog window. */
    async sync(): Promise<boolean> {
        // Like avrdude: send a couple of syncs and drain line noise first,
        // then retry the real handshake.
        for (let i = 0; i < 2; i++) {
            await this.write(Buffer.from([STK_GET_SYNC, CRC_EOP]));
            await this.flush(30);
        }
        for (let attempt = 0; attempt < 8; attempt++) {
            await this.flush(10);
            await this.write(Buffer.from([STK_GET_SYNC, CRC_EOP]));
            const r = await this.readBytes(2, 400);
            const ok = r.length === 2 && r[0] === STK_INSYNC && r[1] === STK_OK;
            this.event(`sync attempt ${attempt + 1}/8: sent 30 20 → got ${r.length === 0 ? 'nothing (timeout)' : r.toString('hex')}${ok ? ' ✓' : ''}`);
            if (ok) return true;
            await sleep(40);
        }
        return false;
    }

    /** Send a command + CRC_EOP and expect an INSYNC/OK pair. */
    private async command(cmd: number[], extra: number[], label: string): Promise<void> {
        await this.write(Buffer.from([...cmd, ...extra, CRC_EOP]));
        const r = await this.readBytes(2, 800);
        const ok = r.length === 2 && r[0] === STK_INSYNC && r[1] === STK_OK;
        this.event(`${label}: sent ${Buffer.from([...cmd, ...extra, CRC_EOP]).toString('hex')} → got ${r.length === 0 ? 'nothing (timeout)' : r.toString('hex')}${ok ? ' ✓' : ' ✗'}`);
        if (!ok) {
            throw new Error(`${label}: bad response ${r.toString('hex')}`);
        }
    }

    /** Bring the bootloader into programming mode (ATmega328P device params). */
    async enterProgramMode(): Promise<void> {
        if (!(await this.sync())) throw new Error('bootloader did not answer the STK500 sync');
        await this.command(
            [STK_SET_DEVICE],
            [
                0x86, 0x00, 0x00, 0x01, 0x01, 0x01, 0x01, 0x03, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            ],
            'set_device'
        );
        await this.command([STK_SET_DEVICE_EXT], [0x05, 0x04, 0xd7, 0xc2, 0x00], 'set_device_ext');
        await this.command([STK_ENTER_PROGMODE], [], 'enter_progmode');
    }

    /**
     * Address is a 16-bit word address (byte address >> 1), per STK500v1.
     * IMPORTANT: the Arduino bootloaders (optiboot, stk500boot, AtmegaBOOT)
     * read the LOW byte first, then the HIGH byte — the opposite of what the
     * original STK500 hardware expects. avrdude sends low-first too.
     */
    async loadAddress(wordAddr: number): Promise<void> {
        await this.command([STK_LOAD_ADDRESS, wordAddr & 0xff, (wordAddr >> 8) & 0xff], [], 'load_address');
    }

    /** Program one page (<= 256 bytes) of flash. */
    async programPage(byteAddr: number, page: Buffer): Promise<void> {
        const len = page.length;
        await this.write(
            Buffer.from([STK_PROG_PAGE, (len >> 8) & 0xff, len & 0xff, 0x46, ...page, CRC_EOP])
        );
        const r = await this.readBytes(2, 1500);
        const ok = r.length === 2 && r[0] === STK_INSYNC && r[1] === STK_OK;
        this.event(`program_page @0x${byteAddr.toString(16)} (${len}B) → ${r.length === 0 ? 'nothing (timeout)' : r.toString('hex')}${ok ? ' ✓' : ' ✗'}`);
        if (!ok) {
            throw new Error(`program_page @0x${byteAddr.toString(16)}: bad response ${r.toString('hex')}`);
        }
    }

    /** Read back a page of flash (STK_READ_PAGE) — used to verify writes. */
    async readPage(byteAddr: number, len: number): Promise<Buffer> {
        await this.flush(30);
        await this.write(Buffer.from([STK_READ_PAGE, (len >> 8) & 0xff, len & 0xff, 0x46, CRC_EOP]));
        const head = await this.readBytes(1, 800);
        if (head.length !== 1 || head[0] !== STK_INSYNC) {
            this.event(`read_page @0x${byteAddr.toString(16)}: no INSYNC (${head.toString('hex')})`);
            throw new Error(`read_page @0x${byteAddr.toString(16)}: no INSYNC (${head.toString('hex')})`);
        }
        const data = await this.readBytes(len, 800);
        const tail = await this.readBytes(1, 800);
        const ok = tail.length === 1 && tail[0] === STK_OK;
        this.event(`read_page @0x${byteAddr.toString(16)}: ${len}B, got ${data.length}B + ${ok ? 'OK' : `bad tail ${tail.toString('hex')}`}`);
        if (!ok) {
            throw new Error(`read_page @0x${byteAddr.toString(16)}: no OK (${tail.toString('hex')})`);
        }
        return data;
    }

    /**
     * Leave programming mode. The bootloader then starts the application
     * (optiboot jumps to it immediately; others run it after their sync
     * timeout or the next reset). Tolerant — some bootloaders reset the
     * chip before replying.
     */
    async leaveProgramMode(): Promise<void> {
        try {
            await this.write(Buffer.from([STK_LEAVE_PROGMODE, CRC_EOP]));
            const r = await this.readBytes(2, 800);
            this.event(`leave_progmode → ${r.length === 0 ? 'nothing (bootloader may have reset already)' : r.toString('hex')}`);
        } catch {
            this.event('leave_progmode → nothing (bootloader reset the MCU before replying)');
        }
    }
}

export interface Stk500FlashOptions {
    port: string;
    baud: number;
    image: HexImage;
    pageSize: number;
    onPage?: (page: number, total: number) => void;
    onEvent?: (msg: string) => void;
}

/**
 * Flash an AVR device via its STK500v1 bootloader. The image is written
 * page-aligned from byte 0 (AVR flash always starts there), read back and
 * verified page by page, then the bootloader is told to start the app.
 */
export async function flashHexViaStk500(opts: Stk500FlashOptions): Promise<void> {
    const { port, baud, image, pageSize, onPage, onEvent } = opts;
    const imageBytes = image.data.length;
    const totalPages = Math.ceil(imageBytes / pageSize);

    const programmer = new Stk500V1(port, baud, onEvent);
    await programmer.open();
    try {
        await programmer.enterProgramMode();
        for (let p = 0; p < totalPages; p++) {
            const byteAddr = p * pageSize;
            const page = Buffer.alloc(pageSize);
            for (let i = 0; i < pageSize; i++) {
                page[i] = byteAddr + i < imageBytes ? image.data[byteAddr + i] : 0xff;
            }
            await programmer.loadAddress(byteAddr >> 1);
            await programmer.programPage(byteAddr, page);
            try {
                const readBack = await programmer.readPage(byteAddr, pageSize);
                for (let i = 0; i < pageSize; i++) {
                    if (readBack[i] !== page[i]) {
                        throw new Error(
                            `VERIFY FAILED @0x${(byteAddr + i).toString(16)}: wrote ${page[i].toString(16)}, read ${readBack[i].toString(16)}`
                        );
                    }
                }
            } catch (err: any) {
                if (err?.message?.startsWith('VERIFY FAILED')) throw err;
                console.warn('[FORGE UPLOADER] read-back not supported, skipping verify:', err?.message);
            }
            onPage?.(p + 1, totalPages);
        }
        await programmer.leaveProgramMode();
    } finally {
        await programmer.close();
    }
}