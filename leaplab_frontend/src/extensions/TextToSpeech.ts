// TextToSpeech.ts - Text to Speech blocks using Web Speech API

import Blockly from '@blockly-runtime';
import type { ExtensionCategory } from './ExtensionManager';

// Block definitions
export const textToSpeechBlocks = [
    {
        type: 'tts_speak',
        message0: 'speak %1',
        args0: [{ type: 'input_value', name: 'MESSAGE', check: ['String', 'Number'] }],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        colour: '#4a90d9',
        tooltip: 'Speak the given text aloud',
        helpUrl: ''
    },
    {
        type: 'tts_set_voice',
        message0: 'set voice to %1',
        args0: [{ type: 'input_value', name: 'VOICE', check: 'String' }],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        colour: '#4a90d9',
        tooltip: 'Set the speech voice by name or language code',
        helpUrl: ''
    },
    {
        type: 'tts_set_rate',
        message0: 'set speech rate to %1',
        args0: [{ type: 'input_value', name: 'RATE', check: 'Number' }],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        colour: '#4a90d9',
        tooltip: 'Set the speech rate (0.1 - 10, default 1)',
        helpUrl: ''
    },
    {
        type: 'tts_set_volume',
        message0: 'set speech volume to %1',
        args0: [{ type: 'input_value', name: 'VOLUME', check: 'Number' }],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        colour: '#4a90d9',
        tooltip: 'Set the speech volume (0 - 1, default 1)',
        helpUrl: ''
    },
    {
        type: 'tts_set_pitch',
        message0: 'set speech pitch to %1',
        args0: [{ type: 'input_value', name: 'PITCH', check: 'Number' }],
        inputsInline: true,
        previousStatement: null,
        nextStatement: null,
        colour: '#4a90d9',
        tooltip: 'Set the speech pitch (0 - 2, default 1)',
        helpUrl: ''
    },
    {
        type: 'tts_stop',
        message0: 'stop speaking',
        previousStatement: null,
        nextStatement: null,
        colour: '#4a90d9',
        tooltip: 'Stop current speech',
        helpUrl: ''
    },
    {
        type: 'tts_is_speaking',
        message0: 'is speaking',
        output: 'Boolean',
        colour: '#2d6cb5',
        tooltip: 'Returns true if speech is in progress',
        helpUrl: ''
    },
    {
        type: 'tts_get_rate',
        message0: 'speech rate',
        output: 'Number',
        colour: '#2d6cb5',
        tooltip: 'Get the current speech rate',
        helpUrl: ''
    },
    {
        type: 'tts_get_volume',
        message0: 'speech volume',
        output: 'Number',
        colour: '#2d6cb5',
        tooltip: 'Get the current speech volume',
        helpUrl: ''
    }
];

// Runtime implementation
export class TTSRuntime {
    private synth: SpeechSynthesis;
    private currentVoice: SpeechSynthesisVoice | null = null;
    private _rate = 1;
    private _volume = 1;
    private _pitch = 1;
    private _speaking = false;
    private voicesLoaded = false;

    constructor() {
        this.synth = window.speechSynthesis || null as any;
        if (this.synth) {
            this._loadVoices();
            this.synth.onvoiceschanged = () => this._loadVoices();
        }
    }

    private _loadVoices() {
        if (!this.synth) return;
        const voices = this.synth.getVoices();
        if (voices.length > 0 && !this.voicesLoaded) {
            this.voicesLoaded = true;
            if (!this.currentVoice) {
                this.currentVoice = voices.find(v => v.lang.startsWith('en')) || voices[0] || null;
            }
        }
    }

    speak(message: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.synth) {
                console.warn('[TTS] Speech synthesis not available');
                resolve();
                return;
            }
            this.synth.cancel();
            const utterance = new SpeechSynthesisUtterance(String(message));
            if (this.currentVoice) utterance.voice = this.currentVoice;
            utterance.rate = this._rate;
            utterance.volume = this._volume;
            utterance.pitch = this._pitch;
            utterance.onstart = () => { this._speaking = true; };
            utterance.onend = () => { this._speaking = false; resolve(); };
            utterance.onerror = (e: SpeechSynthesisErrorEvent) => {
                this._speaking = false;
                if (e.error === 'canceled') { resolve(); } else { reject(e); }
            };
            this.synth.speak(utterance);
        });
    }

    setVoice(voiceName: string) {
        if (!this.synth) return;
        const voices = this.synth.getVoices();
        const match = voices.find(v => v.name === voiceName || v.lang === voiceName);
        if (match) this.currentVoice = match;
    }

    setRate(rate: number) { this._rate = Math.max(0.1, Math.min(10, Number(rate) || 1)); }
    setVolume(volume: number) { this._volume = Math.max(0, Math.min(1, Number(volume) || 1)); }
    setPitch(pitch: number) { this._pitch = Math.max(0, Math.min(2, Number(pitch) || 1)); }

    stop() { if (this.synth) this.synth.cancel(); this._speaking = false; }
    isSpeaking(): boolean { return this._speaking; }
    getVoices(): string[] {
        if (!this.synth) return [];
        return this.synth.getVoices().map(v => v.name);
    }
    getRate(): number { return this._rate; }
    getVolume(): number { return this._volume; }
    getPitch(): number { return this._pitch; }
}

// Register blocks
export function registerTextToSpeechBlocks() {
    const newBlocks = textToSpeechBlocks.filter(block => !Blockly.Blocks[block.type]);
    if (newBlocks.length > 0) {
        Blockly.common.defineBlocks(Blockly.common.createBlockDefinitionsFromJsonArray(newBlocks));
    }
}

// JavaScript generators
export function registerTextToSpeechGenerators() {
    const jsGen = (window as any).Blockly?.JavaScript;
    if (!jsGen) return;

    jsGen['tts_speak'] = (block: any) => {
        const msg = jsGen.valueToCode(block, 'MESSAGE', jsGen.ORDER_ATOMIC || 0) || "''";
        return `if(window.runtime?.tts) await window.runtime.tts.speak(${msg});\n`;
    };
    jsGen['tts_set_voice'] = (block: any) => {
        const voice = jsGen.valueToCode(block, 'VOICE', jsGen.ORDER_ATOMIC || 0) || "''";
        return `if(window.runtime?.tts) window.runtime.tts.setVoice(${voice});\n`;
    };
    jsGen['tts_set_rate'] = (block: any) => {
        const rate = jsGen.valueToCode(block, 'RATE', jsGen.ORDER_ATOMIC || 0) || '1';
        return `if(window.runtime?.tts) window.runtime.tts.setRate(${rate});\n`;
    };
    jsGen['tts_set_volume'] = (block: any) => {
        const volume = jsGen.valueToCode(block, 'VOLUME', jsGen.ORDER_ATOMIC || 0) || '1';
        return `if(window.runtime?.tts) window.runtime.tts.setVolume(${volume});\n`;
    };
    jsGen['tts_set_pitch'] = (block: any) => {
        const pitch = jsGen.valueToCode(block, 'PITCH', jsGen.ORDER_ATOMIC || 0) || '1';
        return `if(window.runtime?.tts) window.runtime.tts.setPitch(${pitch});\n`;
    };
    jsGen['tts_stop'] = () =>
        'if(window.runtime?.tts) window.runtime.tts.stop();\n';
    jsGen['tts_is_speaking'] = () =>
        ['window.runtime?.tts?.isSpeaking()||false', 0];
    jsGen['tts_get_rate'] = () =>
        ['window.runtime?.tts?.getRate()||1', 0];
    jsGen['tts_get_volume'] = () =>
        ['window.runtime?.tts?.getVolume()||1', 0];
}

// Extension configuration
export const textToSpeechExtension: ExtensionCategory = {
    id: 'text_to_speech',
    name: 'Text to Speech',
    colour: '#4a90d9',
    icon: '🔊',
    blocks: [
        {
            kind: 'block',
            type: 'tts_speak',
            inputs: {
                MESSAGE: {
                    shadow: {
                        type: 'text',
                        fields: { TEXT: 'Hello world' }
                    }
                }
            }
        },
        { kind: 'block', type: 'tts_stop' },
        {
            kind: 'block',
            type: 'tts_set_voice',
            inputs: {
                VOICE: {
                    shadow: {
                        type: 'text',
                        fields: { TEXT: '' }
                    }
                }
            }
        },
        {
            kind: 'block',
            type: 'tts_set_rate',
            inputs: {
                RATE: {
                    shadow: {
                        type: 'math_number',
                        fields: { NUM: 1 }
                    }
                }
            }
        },
        {
            kind: 'block',
            type: 'tts_set_volume',
            inputs: {
                VOLUME: {
                    shadow: {
                        type: 'math_number',
                        fields: { NUM: 1 }
                    }
                }
            }
        },
        {
            kind: 'block',
            type: 'tts_set_pitch',
            inputs: {
                PITCH: {
                    shadow: {
                        type: 'math_number',
                        fields: { NUM: 1 }
                    }
                }
            }
        },
        { kind: 'block', type: 'tts_is_speaking' },
        { kind: 'block', type: 'tts_get_rate' },
        { kind: 'block', type: 'tts_get_volume' }
    ]
};
