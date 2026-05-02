/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * Music Extension - Server (block definitions + Web Audio runtime + generators)
 */

import { javascriptGenerator } from '../../server/blockly/runtime';
import type { ExtensionDef } from '../../shared/extensionTypes';

// ─── Colors ───────────────────────────────────────────────────────────────────

const MUSIC_COLOR_1 = '#c62828';
const MUSIC_COLOR_2 = '#b71c1c';
const MUSIC_COLOR_3 = '#7f0000';

// ─── Block Definitions ────────────────────────────────────────────────────────

export const musicBlockDefs = [
    {
        type: 'music_play_note',
        message0: 'play note %1 for %2 beats',
        args0: [
            { type: 'field_number', name: 'NOTE', value: 60, min: 0, max: 127 },
            { type: 'field_number', name: 'BEATS', value: 0.25, min: 0 },
        ],
        previousStatement: null, nextStatement: null, colour: MUSIC_COLOR_1,
        tooltip: 'Play a MIDI note for the specified number of beats',
    },
    {
        type: 'music_set_instrument',
        message0: 'set instrument %1',
        args0: [{ type: 'field_number', name: 'INST', value: 1, min: 1, max: 21 }],
        previousStatement: null, nextStatement: null, colour: MUSIC_COLOR_1,
        tooltip: 'Set the current instrument (1-21)',
    },
    {
        type: 'music_play_drum',
        message0: 'play drum %1 for %2 beats',
        args0: [
            { type: 'field_number', name: 'DRUM', value: 1, min: 1, max: 18 },
            { type: 'field_number', name: 'BEATS', value: 0.25, min: 0 },
        ],
        previousStatement: null, nextStatement: null, colour: MUSIC_COLOR_2,
        tooltip: 'Play a drum sound for the specified beats',
    },
    {
        type: 'music_set_tempo',
        message0: 'set tempo %1 bpm',
        args0: [{ type: 'field_number', name: 'BPM', value: 60, min: 20, max: 500 }],
        previousStatement: null, nextStatement: null, colour: MUSIC_COLOR_2,
        tooltip: 'Set the musical tempo in beats per minute',
    },
    {
        type: 'music_change_tempo',
        message0: 'change tempo by %1',
        args0: [{ type: 'field_number', name: 'AMOUNT', value: 20 }],
        previousStatement: null, nextStatement: null, colour: MUSIC_COLOR_3,
        tooltip: 'Speed up or slow down the current tempo',
    },
    {
        type: 'music_get_tempo',
        message0: 'tempo',
        output: 'Number', colour: MUSIC_COLOR_3,
        tooltip: 'Returns the current tempo in BPM',
    },
    {
        type: 'music_rest',
        message0: 'rest for %1 beats',
        args0: [{ type: 'field_number', name: 'BEATS', value: 0.25, min: 0 }],
        previousStatement: null, nextStatement: null, colour: MUSIC_COLOR_1,
        tooltip: 'Pause music playback for the specified beats',
    },
];

// ─── Runtime ──────────────────────────────────────────────────────────────────

export class MusicRuntime {
    private audioContext: AudioContext | null = null;
    private currentInstrument = 1;
    private currentTempo = 60;
    private masterGain: GainNode | null = null;

    constructor() {
        this.initAudio();
    }

    private initAudio(): void {
        try {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = 0.5;
        } catch (error) {
            console.error('Failed to initialize audio context:', error);
        }
    }

    private midiToFrequency(note: number): number {
        return 440 * Math.pow(2, (note - 69) / 12);
    }

    async playNote(note: number, beats: number): Promise<void> {
        if (!this.audioContext || !this.masterGain) return;

        const frequency = this.midiToFrequency(note);
        const duration = (beats * 60) / this.currentTempo;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    setInstrument(inst: number): void {
        this.currentInstrument = Math.max(1, Math.min(21, inst));
    }

    async playDrum(drum: number, beats: number): Promise<void> {
        if (!this.audioContext || !this.masterGain) return;

        const duration = (beats * 60) / this.currentTempo;
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        source.buffer = buffer;
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        source.connect(gainNode);
        gainNode.connect(this.masterGain);
        source.start();
    }

    setTempo(bpm: number): void { this.currentTempo = Math.max(20, Math.min(500, bpm)); }
    changeTempoBy(amount: number): void { this.currentTempo = Math.max(20, this.currentTempo + amount); }
    getTempo(): number { return this.currentTempo; }

    async rest(beats: number): Promise<void> {
        const duration = (beats * 60) / this.currentTempo;
        await new Promise(resolve => setTimeout(resolve, duration * 1000));
    }
}

// ─── Register Blocks ──────────────────────────────────────────────────────────

export function registerMusicBlocks(Blockly: any): void {
    const newDefs = musicBlockDefs.filter((d: any) => !Blockly.Blocks[d.type]);
    if (newDefs.length > 0) {
        Blockly.common.defineBlocks(Blockly.common.createBlockDefinitionsFromJsonArray(newDefs));
    }
}

// ─── Register Generators ──────────────────────────────────────────────────────

export function registerMusicGenerators(_Blockly: any): void {
    const jsGen = javascriptGenerator;
    if (!jsGen) return;

    jsGen.forBlock['music_play_note'] = (b: any) => `if(window.runtime?.music) await window.runtime.music.playNote(${b.getFieldValue('NOTE')}, ${b.getFieldValue('BEATS')});\n`;
    jsGen.forBlock['music_set_instrument'] = (b: any) => `if(window.runtime?.music) window.runtime.music.setInstrument(${b.getFieldValue('INST')});\n`;
    jsGen.forBlock['music_play_drum'] = (b: any) => `if(window.runtime?.music) await window.runtime.music.playDrum(${b.getFieldValue('DRUM')}, ${b.getFieldValue('BEATS')});\n`;
    jsGen.forBlock['music_set_tempo'] = (b: any) => `if(window.runtime?.music) window.runtime.music.setTempo(${b.getFieldValue('BPM')});\n`;
    jsGen.forBlock['music_change_tempo'] = (b: any) => `if(window.runtime?.music) window.runtime.music.changeTempoBy(${b.getFieldValue('AMOUNT')});\n`;
    jsGen.forBlock['music_get_tempo'] = () => [`window.runtime?.music?.getTempo()||60`, 0];
    jsGen.forBlock['music_rest'] = (b: any) => `if(window.runtime?.music) await window.runtime.music.rest(${b.getFieldValue('BEATS')});\n`;
}

// ─── Toolbox ──────────────────────────────────────────────────────────────────

export function getMusicToolbox(): any[] {
    return [
        { kind: 'block', type: 'music_play_note' },
        { kind: 'block', type: 'music_set_instrument' },
        { kind: 'block', type: 'music_play_drum' },
        { kind: 'block', type: 'music_rest' },
        { kind: 'block', type: 'music_set_tempo' },
        { kind: 'block', type: 'music_change_tempo' },
        { kind: 'block', type: 'music_get_tempo' },
    ];
}

// ─── Extension Definition ─────────────────────────────────────────────────────

export const musicExtension: ExtensionDef = {
    id: 'music',
    name: 'Music',
    color: MUSIC_COLOR_1,
    icon: '🎵',
    registerBlocks: registerMusicBlocks,
    registerGenerators: registerMusicGenerators,
    getToolbox: getMusicToolbox,
};
