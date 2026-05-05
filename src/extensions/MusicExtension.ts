// MusicExtension.ts - Music blocks with Web Audio API

import Blockly from '@blockly-runtime';
import type { ExtensionCategory } from './ExtensionManager';

// Block definitions
export const musicBlocks = [
    {
        type: 'music_play_note',
        message0: 'play note %1 for %2 beats',
        args0: [
            { type: 'field_number', name: 'NOTE', value: 60, min: 0, max: 127 },
            { type: 'field_number', name: 'BEATS', value: 0.25, min: 0 }
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#c62828',
        tooltip: 'Play a MIDI note for the specified number of beats',
        helpUrl: ''
    },
    {
        type: 'music_set_instrument',
        message0: 'set instrument %1',
        args0: [{ type: 'field_number', name: 'INST', value: 1, min: 1, max: 21 }],
        previousStatement: null,
        nextStatement: null,
        colour: '#c62828',
        tooltip: 'Set the current instrument (1-21)',
        helpUrl: ''
    },
    {
        type: 'music_play_drum',
        message0: 'play drum %1 for %2 beats',
        args0: [
            { type: 'field_number', name: 'DRUM', value: 1, min: 1, max: 18 },
            { type: 'field_number', name: 'BEATS', value: 0.25, min: 0 }
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#b71c1c',
        tooltip: 'Play a drum sound for the specified beats',
        helpUrl: ''
    },
    {
        type: 'music_set_tempo',
        message0: 'set tempo %1 bpm',
        args0: [{ type: 'field_number', name: 'BPM', value: 60, min: 20, max: 500 }],
        previousStatement: null,
        nextStatement: null,
        colour: '#b71c1c',
        tooltip: 'Set the musical tempo in beats per minute',
        helpUrl: ''
    },
    {
        type: 'music_change_tempo',
        message0: 'change tempo by %1',
        args0: [{ type: 'field_number', name: 'AMOUNT', value: 20 }],
        previousStatement: null,
        nextStatement: null,
        colour: '#7f0000',
        tooltip: 'Speed up or slow down the current tempo',
        helpUrl: ''
    },
    {
        type: 'music_get_tempo',
        message0: 'tempo',
        output: 'Number',
        colour: '#7f0000',
        tooltip: 'Returns the current tempo in BPM',
        helpUrl: ''
    },
    {
        type: 'music_rest',
        message0: 'rest for %1 beats',
        args0: [{ type: 'field_number', name: 'BEATS', value: 0.25, min: 0 }],
        previousStatement: null,
        nextStatement: null,
        colour: '#c62828',
        tooltip: 'Pause music playback for the specified beats',
        helpUrl: ''
    }
];

// Runtime implementation
export class MusicRuntime {
    private audioContext: AudioContext | null = null;
    private currentInstrument = 1;
    private currentTempo = 60;
    private masterGain: GainNode | null = null;

    constructor() {
        this.initAudio();
    }

    private initAudio() {
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

    async playNote(note: number, beats: number) {
        if (!this.audioContext || !this.masterGain) return;

        const frequency = this.midiToFrequency(note);
        const duration = (beats * 60) / this.currentTempo;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'sine'; // Can be changed based on instrument
        oscillator.frequency.value = frequency;

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);

        console.log(`🎵 Playing note ${note} (${frequency.toFixed(2)}Hz) for ${beats} beats`);
    }

    setInstrument(inst: number) {
        this.currentInstrument = Math.max(1, Math.min(21, inst));
        console.log(`🎹 Instrument set to ${this.currentInstrument}`);
    }

    async playDrum(drum: number, beats: number) {
        if (!this.audioContext || !this.masterGain) return;

        const duration = (beats * 60) / this.currentTempo;

        // Simple drum sound using noise
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;

        const gainNode = this.audioContext.createGain();
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        source.connect(gainNode);
        gainNode.connect(this.masterGain);

        source.start();

        console.log(`🥁 Playing drum ${drum} for ${beats} beats`);
    }

    setTempo(bpm: number) {
        this.currentTempo = Math.max(20, Math.min(500, bpm));
        console.log(`⏱️ Tempo set to ${this.currentTempo} BPM`);
    }

    changeTempoBy(amount: number) {
        this.currentTempo = Math.max(20, this.currentTempo + amount);
        console.log(`⏱️ Tempo changed by ${amount} → ${this.currentTempo} BPM`);
    }

    getTempo(): number {
        return this.currentTempo;
    }

    async rest(beats: number) {
        const duration = (beats * 60) / this.currentTempo;
        await new Promise(resolve => setTimeout(resolve, duration * 1000));
        console.log(`⏸️ Rest for ${beats} beats`);
    }
}

// Register blocks
export function registerMusicBlocks() {
    const newBlocks = musicBlocks.filter(block => !Blockly.Blocks[block.type]);
    if (newBlocks.length > 0) {
        Blockly.defineBlocksWithJsonArray(newBlocks);
    }
}

// JavaScript generators
export function registerMusicGenerators() {
    const jsGen = (window as any).Blockly?.JavaScript;
    if (!jsGen) return;

    jsGen['music_play_note'] = (block: any) => {
        const note = block.getFieldValue('NOTE');
        const beats = block.getFieldValue('BEATS');
        return `await window.runtime.music.playNote(${note}, ${beats});\n`;
    };
    jsGen['music_set_instrument'] = (block: any) => {
        const inst = block.getFieldValue('INST');
        return `window.runtime.music.setInstrument(${inst});\n`;
    };
    jsGen['music_play_drum'] = (block: any) => {
        const drum = block.getFieldValue('DRUM');
        const beats = block.getFieldValue('BEATS');
        return `await window.runtime.music.playDrum(${drum}, ${beats});\n`;
    };
    jsGen['music_set_tempo'] = (block: any) => {
        const bpm = block.getFieldValue('BPM');
        return `window.runtime.music.setTempo(${bpm});\n`;
    };
    jsGen['music_change_tempo'] = (block: any) => {
        const amount = block.getFieldValue('AMOUNT');
        return `window.runtime.music.changeTempoBy(${amount});\n`;
    };
    jsGen['music_get_tempo'] = () => ['window.runtime.music.getTempo()', 0];
    jsGen['music_rest'] = (block: any) => {
        const beats = block.getFieldValue('BEATS');
        return `await window.runtime.music.rest(${beats});\n`;
    };
}

// Extension configuration
export const musicExtension: ExtensionCategory = {
    id: 'music',
    name: 'Music',
    colour: '#c62828',
    icon: '🎹',
    blocks: musicBlocks.map(block => ({
        kind: 'block',
        type: block.type
    }))
};
