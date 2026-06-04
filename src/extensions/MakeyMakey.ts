// MakeyMakey.ts - Makey Makey input via Web Serial API or keyboard fallback
//
// HOW IT WORKS:
// ─────────────────────────────────────────────────────────────────────────────
// 1. makey_on_key:   Hat block — triggers when a Makey Makey key is pressed
// 2. makey_set_key:  Maps a Makey Makey input to a virtual key name
// 3. makey_get_key:  Returns the last key name received from the Makey Makey
//
// SERIAL PROTOCOL:
// ─────────────────────────────────────────────────────────────────────────────
// Makey Makey sends newline-terminated strings: "UP\n", "DOWN\n", "SPACE\n", etc.
// Default baud: 9600. Data bits: 8, Stop bits: 1, Parity: none.
//
// KEYBOARD FALLBACK:
// ─────────────────────────────────────────────────────────────────────────────
// When serial is unavailable, arrow keys + space + click simulate Makey Makey
// inputs. This enables testing without hardware.
//
// WEB vs .exe:
// ─────────────────────────────────────────────────────────────────────────────
// Web: Uses navigator.serial (Web Serial API, Chrome/Edge only)
// .exe: Uses Electron serialport package (needs main process bridge)

import Blockly from '@blockly-runtime';
import { animationVM } from '../vm/AnimationVM';

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

    // Default Makey Makey key mappings (Makey Makey signal → virtual key)
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
        // Initialize default key map
        for (const [signal, key] of Object.entries(MakeyMakeyRuntime.DEFAULT_MAP)) {
            this._keyMap.set(signal, key);
        }
    }

    // ── Serial Connection ───────────────────────────────────────────────

    async connect(): Promise<boolean> {
        if (this._connected) return true;

        // Try Web Serial API first
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

        // Fallback to keyboard simulation
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

        // Notify callbacks
        this._keyCallbacks.forEach(cb => cb(mappedKey));

        // Trigger AnimationVM key event
        animationVM.triggerKey(mappedKey);

        console.log(`[MakeyMakey] Signal: ${signal} → Key: ${mappedKey}`);
    }

    // ── Keyboard Fallback ───────────────────────────────────────────────

    private startKeyboardFallback() {
        if (this._keyboardHandler) return;

        // Clean up any stale handlers registered from previous hot reloads (HMR leak prevention)
        if ((window as any).__makeyMakeyHandler) {
            try {
                window.removeEventListener('keydown', (window as any).__makeyMakeyHandler);
            } catch (err) {}
            (window as any).__makeyMakeyHandler = null;
        }

        this._keyboardHandler = (e: KeyboardEvent) => {
            // Don't intercept if focus is in an input, textarea, editable element, or Monaco Editor
            const isEditable = (el: any): boolean => {
                if (!el) return false;
                const tag = (el.tagName || '').toUpperCase();
                if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
                    return true;
                }
                if (el.isContentEditable) {
                    return true;
                }
                
                // Case-insensitive walk up parent tree for monaco / editor classes
                let current = el;
                while (current && current !== document.body) {
                    if (current.className && typeof current.className === 'string') {
                        const cls = current.className.toLowerCase();
                        if (
                            cls.includes('monaco') ||
                            cls.includes('inputarea') ||
                            cls.includes('view-line') ||
                            cls.includes('view-lines')
                        ) {
                            return true;
                        }
                    }
                    current = current.parentElement;
                }

                if (typeof el.closest === 'function') {
                    if (
                        el.closest('.monaco-editor') ||
                        el.closest('.monaco-editor-container') ||
                        el.closest('.monaco-mouse-cursor-text') ||
                        el.closest('.view-lines') ||
                        el.closest('.view-line') ||
                        el.closest('[class*="monaco-"]') ||
                        el.closest('.inputarea')
                    ) {
                        return true;
                    }
                }
                return false;
            };

            const target = e.target as HTMLElement;
            const activeEl = document.activeElement;

            if (e.key === ' ' || e.key === 'Spacebar') {
                console.log('[MakeyMakey Debug] Space key pressed.', {
                    target: target,
                    targetTagName: target?.tagName,
                    targetClassList: target?.classList ? Array.from(target.classList) : [],
                    activeElement: activeEl,
                    activeElementTagName: activeEl?.tagName,
                    activeElementClassList: activeEl?.classList ? Array.from(activeEl.classList) : [],
                    isTargetEditable: isEditable(target),
                    isActiveElementEditable: isEditable(activeEl)
                });
            }

            if (isEditable(target) || isEditable(activeEl)) {
                return;
            }

            // Map keyboard keys to Makey Makey signals
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
        (window as any).__makeyMakeyHandler = this._keyboardHandler;
        console.log('[MakeyMakey] Keyboard fallback started');
    }

    private stopKeyboardFallback() {
        if (this._keyboardHandler) {
            window.removeEventListener('keydown', this._keyboardHandler);
            if ((window as any).__makeyMakeyHandler === this._keyboardHandler) {
                (window as any).__makeyMakeyHandler = null;
            }
            this._keyboardHandler = null;
            console.log('[MakeyMakey] Keyboard fallback stopped');
        }
    }

    // ── Key Mapping ─────────────────────────────────────────────────────

    setKeyMap(makeySignal: string, virtualKey: string) {
        this._keyMap.set(makeySignal.toUpperCase(), virtualKey);
        console.log(`[MakeyMakey] Mapped ${makeySignal} → ${virtualKey}`);
    }

    getKeyMap(makeySignal: string): string {
        return this._keyMap.get(makeySignal.toUpperCase()) || makeySignal.toLowerCase();
    }

    // ── Callbacks ───────────────────────────────────────────────────────

    onKey(callback: KeyCallback) {
        this._keyCallbacks.push(callback);
    }

    removeKeyCallback(callback: KeyCallback) {
        this._keyCallbacks = this._keyCallbacks.filter(cb => cb !== callback);
    }

    // ── Reporters ───────────────────────────────────────────────────────

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

export const makeyMakeyBlocks = [
    {
        type: 'makey_on_key',
        message0: 'when makey makey %1 pressed',
        args0: [{
            type: 'field_dropdown',
            name: 'KEY',
            options: [
                ['up', 'UP'],
                ['down', 'DOWN'],
                ['left', 'LEFT'],
                ['right', 'RIGHT'],
                ['space', 'SPACE'],
                ['click', 'CLICK'],
                ['w', 'W'],
                ['a', 'A'],
                ['s', 'S'],
                ['d', 'D'],
            ]
        }],
        nextStatement: null,
        colour: '#00897B',
        tooltip: 'When a Makey Makey key is pressed',
        hat: 'event',
        helpUrl: ''
    },
    {
        type: 'makey_set_key',
        message0: 'map makey makey %1 to key %2',
        args0: [
            {
                type: 'field_dropdown',
                name: 'SIGNAL',
                options: [
                    ['up', 'UP'],
                    ['down', 'DOWN'],
                    ['left', 'LEFT'],
                    ['right', 'RIGHT'],
                    ['space', 'SPACE'],
                    ['click', 'CLICK'],
                    ['w', 'W'],
                    ['a', 'A'],
                    ['s', 'S'],
                    ['d', 'D'],
                ]
            },
            { type: 'field_input', name: 'KEY', text: 'space' }
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#00897B',
        tooltip: 'Map a Makey Makey input to a virtual key name',
        helpUrl: ''
    },
    {
        type: 'makey_get_key',
        message0: 'makey makey last key',
        output: 'String',
        colour: '#00695C',
        tooltip: 'Returns the last key name received from Makey Makey',
        helpUrl: ''
    },
];

export function registerMakeyMakeyBlocks() {
    const newBlocks = makeyMakeyBlocks.filter(block => !Blockly.Blocks[block.type]);
    if (newBlocks.length > 0) {
        Blockly.common.defineBlocks(Blockly.common.createBlockDefinitionsFromJsonArray(newBlocks));
    }
}

export const makeyMakeyExtension = {
    id: 'makey_makey',
    name: 'Makey Makey',
    colour: '#00897B',
    icon: '🔌',
    blocks: makeyMakeyBlocks.map(block => ({
        kind: 'block',
        type: block.type
    }))
};
