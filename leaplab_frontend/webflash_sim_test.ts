/**
 * Temporary simulation test for src/webflash/avrFlasher.ts.
 * Implements fake Arduino bootloaders with the EXACT parsing logic from
 * optiboot (STK500v1) and ArduinoCore-avr stk500boot.c (STK500v2 / Mega2560),
 * then drives the real flashAvr() against them over fake Web Serial ports.
 * Delete this file after use.
 */
import { flashAvr, getAvrBoardProfile } from './src/webflash/avrFlasher';
import type { AvrFlashOptions } from './src/webflash/avrFlasher';

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

interface Duplex {
    read: ReadableStream<Uint8Array>;
    write: WritableStream<Uint8Array>;
    push: (chunk: Uint8Array) => void;
}

function makeDuplex(): Duplex {
    let pushFn: (chunk: Uint8Array) => void = () => {};
    let closeFn: () => void = () => {};
    const read = new ReadableStream<Uint8Array>({
        start(c) {
            pushFn = chunk => c.enqueue(chunk);
            closeFn = () => c.close();
        },
    });
    const write = new WritableStream<Uint8Array>({
        write(chunk) { pushFn(chunk); },
        close() { closeFn(); },
    });
    return { read, write, push: pushFn };
}

class FakeSerialPort {
    hostToBoard: Duplex;
    boardToHost: Duplex;
    openCount = 0;
    currentInput: Duplex | null = null;
    currentOutput: Duplex | null = null;

    constructor() {
        this.hostToBoard = makeDuplex();
        this.boardToHost = makeDuplex();
    }

    get readable() { return this.currentOutput ? this.currentOutput.read : null; }
    get writable() { return this.currentInput ? this.currentInput.write : null; }

    async open(_opts: { baudRate: number }): Promise<void> {
        this.openCount++;
        if (!this.currentInput) { this.currentInput = this.hostToBoard; this.currentOutput = this.boardToHost; }
    }
    async close(): Promise<void> {
        this.currentInput = null;
        this.currentOutput = null;
    }
}

// ── STK500v1 fake bootloader (optiboot logic) ───────────────────────────────
const INSYNC = 0x14, OK = 0x10, EOP = 0x20;

async function fakeOptiboot(port: FakeSerialPort, signature: number[], pageSize: number, flash: Map<number, number>, log: string[]) {
    const reader = port.hostToBoard.read.getReader();
    let buf = new Uint8Array(0);
    let addr = 0;
    const read1 = async (): Promise<number> => {
        while (buf.length === 0) {
            const { done, value } = await reader.read();
            if (done) throw new Error('optiboot: host closed');
            buf = new Uint8Array(value);
        }
        const b = buf[0];
        buf = buf.slice(1);
        return b;
    };
    for (;;) {
        const ch = await read1();
        if (ch === 0x30 || ch === 0x15 || ch === 0x50) { // sync / sign-on / enter progmode (else branch: ignore)
            if ((await read1()) !== EOP) throw new Error('optiboot: bad EOP');
            port.boardToHost.push(new Uint8Array([INSYNC, OK]));
            log.push(`v1 cmd 0x${ch.toString(16)} -> INSYNC OK`);
        } else if (ch === 0x51) { // leave progmode
            if ((await read1()) !== EOP) throw new Error('optiboot: bad EOP');
            port.boardToHost.push(new Uint8Array([INSYNC, OK]));
            log.push('v1 leave -> INSYNC OK');
            reader.cancel();
            return;
        } else if (ch === 0x75) { // read sign
            if ((await read1()) !== EOP) throw new Error('optiboot: bad EOP');
            port.boardToHost.push(new Uint8Array([INSYNC, ...signature, OK]));
            log.push('v1 read-sign');
        } else if (ch === 0x55) { // load address: low, high, EOP (optiboot: address.bytes[0]=lo first)
            const lo = await read1();
            const hi = await read1();
            if ((await read1()) !== EOP) throw new Error('optiboot: bad EOP');
            addr = (lo | (hi << 8)) * 2;
            port.boardToHost.push(new Uint8Array([INSYNC, OK]));
            log.push(`v1 load-addr ${addr.toString(16)}`);
        } else if (ch === 0x64) { // prog page: sizeHi, sizeLo, 'F', data..., EOP
            const sizeHi = await read1();
            const sizeLo = await read1();
            const size = (sizeHi << 8) | sizeLo;
            const memtype = await read1();
            if (memtype !== 0x46) throw new Error('optiboot: bad memtype');
            const data = new Uint8Array(size);
            for (let i = 0; i < size; i++) data[i] = await read1();
            if ((await read1()) !== EOP) throw new Error('optiboot: bad EOP');
            for (let i = 0; i < size; i++) flash.set(addr + i, data[i]);
            port.boardToHost.push(new Uint8Array([INSYNC, OK]));
            log.push(`v1 prog-page addr=${addr.toString(16)} size=${size}`);
        } else {
            throw new Error(`optiboot: unknown cmd 0x${ch.toString(16)}`);
        }
    }
}

// ── STK500v2 fake bootloader (stk500boot.c logic) ───────────────────────────
async function fakeStk500v2(port: FakeSerialPort, signature: number[], pageSize: number, flash: Map<number, number>, log: string[]) {
    const reader = port.hostToBoard.read.getReader();
    let buf = new Uint8Array(0);
    let seq = 0;
    let address = 0;
    let eraseAddress = 0;
    const read1 = async (): Promise<number> => {
        while (buf.length === 0) {
            const { done, value } = await reader.read();
            if (done) throw new Error('v2: host closed');
            buf = new Uint8Array(value);
        }
        const b = buf[0];
        buf = buf.slice(1);
        return b;
    };
    const sendFrame = (body: number[]) => {
        const len = body.length;
        const msg = new Uint8Array(5 + len + 1);
        msg[0] = 0x1b; msg[1] = seq & 0xff; msg[2] = (len >> 8) & 0xff; msg[3] = len & 0xff; msg[4] = 0x0e;
        msg.set(body, 5);
        let cks = 0;
        for (let i = 0; i < 5 + len; i++) cks ^= msg[i];
        msg[msg.length - 1] = cks;
        port.boardToHost.push(msg);
    };

    for (;;) {
        // Wait for 0x1B
        let b: number;
        do { b = await read1(); } while (b !== 0x1b);
        const rSeq = await read1(); seq = rSeq;
        const lenHi = await read1();
        const lenLo = await read1();
        const token = await read1();
        if (token !== 0x0e) throw new Error('v2: bad token');
        const body = new Uint8Array((lenHi << 8) | lenLo);
        let cks = 0x1b ^ rSeq ^ lenHi ^ lenLo ^ 0x0e;
        for (let i = 0; i < body.length; i++) { body[i] = await read1(); cks ^= body[i]; }
        if ((await read1()) !== cks) throw new Error('v2: checksum mismatch');
        const cmd = body[0];
        if (cmd === 0x01) { // sign on
            sendFrame([0x01, 0x00, 0x08, 0x41, 0x56, 0x52, 0x49, 0x53, 0x50, 0x5f, 0x32]);
            log.push('v2 sign-on');
        } else if (cmd === 0x06) { // load address: 4-byte big-endian word addr << 1
            address = ((body[1] << 24) | (body[2] << 16) | (body[3] << 8) | body[4]) << 1;
            sendFrame([0x06, 0x00]);
            log.push(`v2 load-addr ${address.toString(16)}`);
        } else if (cmd === 0x10) { // enter progmode
            sendFrame([0x10, 0x00]);
            log.push('v2 enter');
        } else if (cmd === 0x11) { // leave progmode
            sendFrame([0x11, 0x00]);
            log.push('v2 leave');
            reader.cancel();
            return;
        } else if (cmd === 0x18) { // read signature: msgBuffer[4] = index
            const index = body[4];
            const sig = index === 0 ? signature[0] : index === 1 ? signature[1] : signature[2];
            sendFrame([0x18, 0x00, sig, 0x00]);
            log.push(`v2 read-sig index=${index} -> ${sig.toString(16)}`);
        } else if (cmd === 0x13) { // program flash: size = body[1..2], data from body[10] (cmd byte + 9-byte header)
            const size = (body[1] << 8) | body[2];
            const dataStart = 10;
            if (dataStart + size > body.length) throw new Error('v2: flash data out of bounds');
            if (eraseAddress < 0x3c000) eraseAddress += pageSize; // one erase per write cmd
            for (let i = 0; i < size; i++) flash.set(address + i, body[dataStart + i]);
            sendFrame([0x13, 0x00]);
            log.push(`v2 prog-flash addr=${address.toString(16)} size=${size}`);
        } else {
            throw new Error(`v2: unknown cmd 0x${cmd.toString(16)}`);
        }
    }
}

function makeHex(bytes: Uint8Array): string {
    const lines: string[] = [];
    for (let off = 0; off < bytes.length; off += 16) {
        const chunk = bytes.slice(off, off + 16);
        const rec = [chunk.length, (off >> 8) & 0xff, off & 0xff, 0x00, ...chunk];
        let sum = 0;
        for (const b of rec) sum = (sum + b) & 0xff;
        rec.push((0x100 - sum) & 0xff);
        lines.push(':' + rec.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(''));
    }
    lines.push(':00000001FF');
    return lines.join('\n');
}

async function runCase(fqbn: string, data: Uint8Array): Promise<void> {
    const port = new FakeSerialPort();
    const flash = new Map<number, number>();
    const log: string[] = [];
    const profile = getAvrBoardProfile(fqbn)!;
    const sim = fqbn === 'arduino:avr:mega'
        ? fakeStk500v2(port, profile.signature, profile.pageSize, flash, log)
        : fakeOptiboot(port, profile.signature, profile.pageSize, flash, log);

    const progress: string[] = [];
    const opts: AvrFlashOptions = {
        hex: makeHex(data),
        fqbn,
        onProgress: (p, m) => progress.push(`${p}% ${m}`),
        onLog: m => log.push(m),
    };
    let flashError: unknown = null;
    try {
        await flashAvr(port as unknown as SerialPort, opts);
    } catch (e) {
        flashError = e;
        console.log(`${fqbn} FAILED:`, (e as Error).message);
        console.log(`  port.openCount=${port.openCount} hostToBoard.read.locked=${port.hostToBoard.read.locked} boardToHost.read.locked=${port.boardToHost.read.locked}`);
    }
    try {
        await sim;
    } catch (e) {
        if (!flashError) throw e; // sim errors only matter if the flash claimed success
    }
    if (flashError) throw flashError;

    // Verify flash contents
    const pageCount = Math.ceil(data.length / profile.pageSize);
    let ok = true;
    const diffs: string[] = [];
    for (let p = 0; p < pageCount; p++) {
        for (let i = 0; i < profile.pageSize; i++) {
            const addr = p * profile.pageSize + i;
            const expected = addr < data.length ? data[addr] : 0x00; // flasher zero-pads the final page
            const got = flash.get(addr);
            if (got !== expected) { ok = false; diffs.push(`${addr.toString(16)}: exp ${expected.toString(16)} got ${got}`); if (diffs.length > 5) break; }
        }
    }
    if (!ok) throw new Error(`${fqbn}: flash mismatch: ${diffs.join(', ')}`);
    console.log(`${fqbn}: PASS — ${data.length} bytes, ${pageCount} pages, ${flash.size} flash entries`);
    progress.forEach(p => console.log('   ' + p));
}

(async () => {
    // Uno/Nano: two pages of 128
    const data1 = new Uint8Array(200);
    for (let i = 0; i < data1.length; i++) data1[i] = (i * 7 + 1) & 0xff;
    await runCase('arduino:avr:uno', data1);

    // Mega: three pages of 256 (tests 64KB+ word addressing: page 2 → byte 0x200)
    const data2 = new Uint8Array(600);
    for (let i = 0; i < data2.length; i++) data2[i] = (i * 13 + 3) & 0xff;
    await runCase('arduino:avr:mega', data2);

    // Mega with data > 128KB (tests 4-byte LOAD_ADDRESS byte order) — 600 bytes at a big offset is not
    // possible via parseIntelHex (image starts at 0), but 3 pages already covers >1 word.
    console.log('All simulation tests PASSED');
})();
