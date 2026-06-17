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
        tooltip: 'Play a MIDI note (0-127) for the specified number of beats',
        helpUrl: ''
    },
    {
        type: 'music_set_instrument',
        message0: 'set instrument %1',
        args0: [{
            type: 'field_dropdown',
            name: 'INST',
            options: [
                ['Piano', '1'],
                ['Electric Piano', '2'],
                ['Organ', '3'],
                ['Guitar', '4'],
                ['Electric Guitar', '5'],
                ['Bass', '6'],
                ['Cello', '7'],
                ['Violin', '8'],
                ['Saxophone', '9'],
                ['Trumpet', '10'],
                ['Flute', '11'],
                ['Clarinet', '12'],
                ['Synth Lead', '13'],
                ['Synth Pad', '14'],
                ['Marimba', '15'],
                ['Xylophone', '16'],
                ['Steel Drums', '17'],
                ['Harp', '18'],
                ['Choir', '19'],
                ['Music Box', '20'],
                ['Bell', '21']
            ]
        }],
        previousStatement: null,
        nextStatement: null,
        colour: '#c62828',
        tooltip: 'Set the current instrument sound',
        helpUrl: ''
    },
    {
        type: 'music_play_drum',
        message0: 'play drum %1 for %2 beats',
        args0: [
            {
                type: 'field_dropdown',
                name: 'DRUM',
                options: [
                    ['Snare', '1'],
                    ['Bass Drum', '2'],
                    ['Closed Hi-Hat', '3'],
                    ['Open Hi-Hat', '4'],
                    ['Crash', '5'],
                    ['Ride', '6'],
                    ['Clap', '7'],
                    ['Tom Low', '8'],
                    ['Tom Mid', '9'],
                    ['Tom High', '10'],
                    ['Cowbell', '11'],
                    ['Tambourine', '12'],
                    ['Shaker', '13'],
                    ['Cymbal', '14'],
                    ['Guiro', '15'],
                    ['Woodblock', '16'],
                    ['Triangle', '17'],
                    ['Agogo', '18']
                ]
            },
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
        type: 'music_rest',
        message0: 'rest for %1 beats',
        args0: [{ type: 'field_number', name: 'BEATS', value: 0.25, min: 0 }],
        previousStatement: null,
        nextStatement: null,
        colour: '#c62828',
        tooltip: 'Pause music playback for the specified beats',
        helpUrl: ''
    },
    {
        type: 'music_get_tempo',
        message0: 'tempo',
        output: 'Number',
        colour: '#7f0000',
        tooltip: 'Returns the current tempo in BPM',
        helpUrl: ''
    }
];

// Instrument waveform mapping (oscillator type + optional harmonics)
const INSTRUMENT_WAVE: Record<number, OscillatorType> = {
    1: 'sine',           // Piano
    2: 'triangle',       // Electric Piano
    3: 'sawtooth',       // Organ
    4: 'triangle',       // Guitar
    5: 'sawtooth',       // Electric Guitar
    6: 'sine',           // Bass
    7: 'sawtooth',       // Cello
    8: 'sawtooth',       // Violin
    9: 'sawtooth',       // Saxophone
    10: 'sawtooth',      // Trumpet
    11: 'sine',          // Flute
    12: 'triangle',      // Clarinet
    13: 'sawtooth',      // Synth Lead
    14: 'sine',          // Synth Pad
    15: 'sine',          // Marimba
    16: 'sine',          // Xylophone
    17: 'sine',          // Steel Drums
    18: 'sine',          // Harp
    19: 'sine',          // Choir
    20: 'sine',          // Music Box
    21: 'sine',          // Bell
};

// Drum sound synthesis parameters
interface DrumParams {
    type: 'noise' | 'tone' | 'click';
    freq?: number;
    decay: number;
    filterFreq?: number;
}

const DRUM_PARAMS: Record<number, DrumParams> = {
    1: { type: 'noise', decay: 0.15, filterFreq: 3000 },    // Snare
    2: { type: 'tone', freq: 60, decay: 0.3 },              // Bass Drum
    3: { type: 'noise', decay: 0.05, filterFreq: 8000 },    // Closed Hi-Hat
    4: { type: 'noise', decay: 0.3, filterFreq: 6000 },     // Open Hi-Hat
    5: { type: 'noise', decay: 0.5, filterFreq: 5000 },     // Crash
    6: { type: 'noise', decay: 0.4, filterFreq: 10000 },    // Ride
    7: { type: 'noise', decay: 0.1, filterFreq: 2000 },     // Clap
    8: { type: 'tone', freq: 80, decay: 0.3 },              // Tom Low
    9: { type: 'tone', freq: 120, decay: 0.25 },            // Tom Mid
    10: { type: 'tone', freq: 180, decay: 0.2 },            // Tom High
    11: { type: 'tone', freq: 800, decay: 0.15 },           // Cowbell
    12: { type: 'noise', decay: 0.08, filterFreq: 7000 },   // Tambourine
    13: { type: 'noise', decay: 0.06, filterFreq: 9000 },   // Shaker
    14: { type: 'noise', decay: 0.3, filterFreq: 4000 },    // Cymbal
    15: { type: 'noise', decay: 0.08, filterFreq: 3000 },   // Guiro
    16: { type: 'tone', freq: 600, decay: 0.05 },           // Woodblock
    17: { type: 'tone', freq: 1200, decay: 0.4 },           // Triangle
    18: { type: 'tone', freq: 400, decay: 0.15 },           // Agogo
};

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
            console.error('[Music] Failed to initialize audio context:', error);
        }
    }

    private ensureContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    private midiToFrequency(note: number): number {
        return 440 * Math.pow(2, (note - 69) / 12);
    }

    async playNote(note: number, beats: number) {
        if (!this.audioContext || !this.masterGain) return;
        this.ensureContext();

        const frequency = this.midiToFrequency(note);
        const duration = Math.max(0.05, (beats * 60) / this.currentTempo);
        const waveform = INSTRUMENT_WAVE[this.currentInstrument] || 'sine';

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = waveform;
        oscillator.frequency.value = frequency;

        // Slight detune for richer sound on sustained instruments
        if (['sawtooth', 'triangle'].includes(waveform)) {
            oscillator.detune.value = Math.random() * 4 - 2;
        }

        const now = this.audioContext.currentTime;
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);

        oscillator.start(now);
        oscillator.stop(now + duration);

        await new Promise(resolve => setTimeout(resolve, duration * 1000));
    }

    setInstrument(inst: number) {
        this.currentInstrument = Math.max(1, Math.min(21, inst));
    }

    async playDrum(drum: number, beats: number) {
        if (!this.audioContext || !this.masterGain) return;
        this.ensureContext();

        const duration = Math.max(0.05, (beats * 60) / this.currentTempo);
        const params = DRUM_PARAMS[drum] || DRUM_PARAMS[1]; // Default to snare
        const now = this.audioContext.currentTime;

        if (params.type === 'tone' && params.freq) {
            // Tonal drum: short sine burst at frequency
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.type = 'sine';
            osc.frequency.value = params.freq;
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + params.decay);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now);
            osc.stop(now + params.decay);
        } else {
            // Noise-based drum: filtered white noise burst
            const bufferSize = Math.floor(this.audioContext.sampleRate * params.decay);
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;

            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = params.filterFreq || 3000;

            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + params.decay);

            source.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);
            source.start(now);
        }

        await new Promise(resolve => setTimeout(resolve, duration * 1000));
    }

    setTempo(bpm: number) {
        this.currentTempo = Math.max(20, Math.min(500, bpm));
    }

    changeTempoBy(amount: number) {
        this.currentTempo = Math.max(20, Math.min(500, this.currentTempo + amount));
    }

    getTempo(): number {
        return this.currentTempo;
    }

    async rest(beats: number) {
        const duration = (beats * 60) / this.currentTempo;
        await new Promise(resolve => setTimeout(resolve, duration * 1000));
    }

    getInstrument(): number {
        return this.currentInstrument;
    }
}

// Register blocks
export function registerMusicBlocks() {
    const newBlocks = musicBlocks.filter(block => !Blockly.Blocks[block.type]);
    if (newBlocks.length > 0) {
        Blockly.common.defineBlocks(Blockly.common.createBlockDefinitionsFromJsonArray(newBlocks));
    }
}

// JavaScript generators
export function registerMusicGenerators() {
    const jsGen = (window as any).Blockly?.JavaScript;
    if (!jsGen) return;

    jsGen['music_play_note'] = (block: any) => {
        const note = block.getFieldValue('NOTE');
        const beats = block.getFieldValue('BEATS');
        return `if(window.runtime?.music) await window.runtime.music.playNote(${note}, ${beats});\n`;
    };
    jsGen['music_set_instrument'] = (block: any) => {
        const inst = block.getFieldValue('INST');
        return `if(window.runtime?.music) window.runtime.music.setInstrument(${inst});\n`;
    };
    jsGen['music_play_drum'] = (block: any) => {
        const drum = block.getFieldValue('DRUM');
        const beats = block.getFieldValue('BEATS');
        return `if(window.runtime?.music) await window.runtime.music.playDrum(${drum}, ${beats});\n`;
    };
    jsGen['music_set_tempo'] = (block: any) => {
        const bpm = block.getFieldValue('BPM');
        return `if(window.runtime?.music) window.runtime.music.setTempo(${bpm});\n`;
    };
    jsGen['music_change_tempo'] = (block: any) => {
        const amount = block.getFieldValue('AMOUNT');
        return `if(window.runtime?.music) window.runtime.music.changeTempoBy(${amount});\n`;
    };
    jsGen['music_get_tempo'] = () => ['window.runtime?.music?.getTempo()||60', 0];
    jsGen['music_rest'] = (block: any) => {
        const beats = block.getFieldValue('BEATS');
        return `if(window.runtime?.music) await window.runtime.music.rest(${beats});\n`;
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
