import { animationVM } from '../../vm/AnimationVM';

const DEFAULT_BAUD = 9600;

type KeyCallback = (keyName: string) => void;

export class MakeyMakeyRuntime {
    private port: any = null;
    private reader: any = null;
    private writer: any = null;
    private _connected = false;
    private _reading = false;
    private _lastKey: string = '';
    private _keyCallbacks: KeyCallback[] = [];
    private _keyMap: Map<string, string> = new Map();
    private _useKeyboardFallback = false;
    private _keyboardHandler: ((e: KeyboardEvent) => void) | null = null;
    private _buffer: string = '';

    private static DEFAULT_MAP: Record<string, string> = {
        'UP': 'up',
        'DOWN': 'down',
        'LEFT': 'left',
        'RIGHT': 'right',
        'SPACE': 'space',
        'CLICK': 'enter',
        'W': 'w',
        'A': 'a',
        'S': 's',
        'D': 'd',
    };

    constructor() {
        for (const [signal, key] of Object.entries(MakeyMakeyRuntime.DEFAULT_MAP)) {
            this._keyMap.set(signal, key);
        }
    }

    async connect(): Promise<boolean> {
        if (this._connected) return true;

        if (typeof navigator !== 'undefined' && 'serial' in navigator) {
            try {
                this.port = await (navigator as any).serial.requestPort();
                await this.port.open({ baudRate: DEFAULT_BAUD });
                this._connected = true;
                this._useKeyboardFallback = false;
                this.startReading();
                console.log('[MakeyMakey] Connected via Web Serial');
                return true;
            } catch (err: any) {
                console.warn('[MakeyMakey] Serial connection failed:', err.message);
            }
        }

        console.log('[MakeyMakey] Using keyboard fallback (no serial available)');
        this._useKeyboardFallback = true;
        this._connected = true;
        this.startKeyboardFallback();
        return true;
    }

    disconnect() {
        this.stopReading();
        this.stopKeyboardFallback();
        this.port = null;
        this.reader = null;
        this.writer = null;
        this._connected = false;
        this._buffer = '';
        console.log('[MakeyMakey] Disconnected');
    }

    private async startReading() {
        if (!this.port || this._reading) return;
        this._reading = true;

        try {
            const decoder = new TextDecoderStream();
            const readableStream = this.port.readable!.pipeThrough(decoder);
            this.reader = readableStream.getReader();

            while (this._reading) {
                const { value, done } = await this.reader.read();
                if (done) break;
                if (value) this.processData(value);
            }
        } catch (err: any) {
            console.warn('[MakeyMakey] Read error:', err.message);
        }
        this._reading = false;
    }

    private stopReading() {
        this._reading = false;
        if (this.reader) {
            this.reader.releaseLock();
            this.reader = null;
        }
    }

    private processData(data: string) {
        this._buffer += data;
        const lines = this._buffer.split('\n');
        this._buffer = lines.pop() || '';

        for (const line of lines) {
            const signal = line.trim().toUpperCase();
            if (signal) this.handleSignal(signal);
        }
    }

    private handleSignal(signal: string) {
        const mappedKey = this._keyMap.get(signal) || signal.toLowerCase();
        this._lastKey = mappedKey;

        this._keyCallbacks.forEach(cb => cb(mappedKey));
        animationVM.triggerKey(mappedKey);

        console.log(`[MakeyMakey] Signal: ${signal} → Key: ${mappedKey}`);
    }

    private startKeyboardFallback() {
        if (this._keyboardHandler) return;

        this._keyboardHandler = (e: KeyboardEvent) => {
            const keyMap: Record<string, string> = {
                'ArrowUp': 'UP',
                'ArrowDown': 'DOWN',
                'ArrowLeft': 'LEFT',
                'ArrowRight': 'RIGHT',
                ' ': 'SPACE',
                'Enter': 'CLICK',
                'w': 'W',
                'a': 'A',
                's': 'S',
                'd': 'D',
            };

            const signal = keyMap[e.key];
            if (signal) {
                e.preventDefault();
                this.handleSignal(signal);
            }
        };

        window.addEventListener('keydown', this._keyboardHandler);
        console.log('[MakeyMakey] Keyboard fallback started');
    }

    private stopKeyboardFallback() {
        if (this._keyboardHandler) {
            window.removeEventListener('keydown', this._keyboardHandler);
            this._keyboardHandler = null;
            console.log('[MakeyMakey] Keyboard fallback stopped');
        }
    }

    setKeyMap(makeySignal: string, virtualKey: string) {
        this._keyMap.set(makeySignal.toUpperCase(), virtualKey);
        console.log(`[MakeyMakey] Mapped ${makeySignal} → ${virtualKey}`);
    }

    getKeyMap(makeySignal: string): string {
        return this._keyMap.get(makeySignal.toUpperCase()) || makeySignal.toLowerCase();
    }

    onKey(callback: KeyCallback) {
        this._keyCallbacks.push(callback);
    }

    removeKeyCallback(callback: KeyCallback) {
        this._keyCallbacks = this._keyCallbacks.filter(cb => cb !== callback);
    }

    getLastKey(): string {
        return this._lastKey;
    }

    isConnected(): boolean {
        return this._connected;
    }

    isUsingFallback(): boolean {
        return this._useKeyboardFallback;
    }

    destroy() {
        this.disconnect();
        this._keyCallbacks = [];
        this._keyMap.clear();
    }
}
