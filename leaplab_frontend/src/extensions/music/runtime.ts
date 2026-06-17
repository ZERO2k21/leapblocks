const INSTRUMENT_WAVE: Record<number, OscillatorType> = {
    1: 'sine',
    2: 'triangle',
    3: 'sawtooth',
    4: 'triangle',
    5: 'sawtooth',
    6: 'sine',
    7: 'sawtooth',
    8: 'sawtooth',
    9: 'sawtooth',
    10: 'sawtooth',
    11: 'sine',
    12: 'triangle',
    13: 'sawtooth',
    14: 'sine',
    15: 'sine',
    16: 'sine',
    17: 'sine',
    18: 'sine',
    19: 'sine',
    20: 'sine',
    21: 'sine',
};

interface DrumParams {
    type: 'noise' | 'tone' | 'click';
    freq?: number;
    decay: number;
    filterFreq?: number;
}

const DRUM_PARAMS: Record<number, DrumParams> = {
    1: { type: 'noise', decay: 0.15, filterFreq: 3000 },
    2: { type: 'tone', freq: 60, decay: 0.3 },
    3: { type: 'noise', decay: 0.05, filterFreq: 8000 },
    4: { type: 'noise', decay: 0.3, filterFreq: 6000 },
    5: { type: 'noise', decay: 0.5, filterFreq: 5000 },
    6: { type: 'noise', decay: 0.4, filterFreq: 10000 },
    7: { type: 'noise', decay: 0.1, filterFreq: 2000 },
    8: { type: 'tone', freq: 80, decay: 0.3 },
    9: { type: 'tone', freq: 120, decay: 0.25 },
    10: { type: 'tone', freq: 180, decay: 0.2 },
    11: { type: 'tone', freq: 800, decay: 0.15 },
    12: { type: 'noise', decay: 0.08, filterFreq: 7000 },
    13: { type: 'noise', decay: 0.06, filterFreq: 9000 },
    14: { type: 'noise', decay: 0.3, filterFreq: 4000 },
    15: { type: 'noise', decay: 0.08, filterFreq: 3000 },
    16: { type: 'tone', freq: 600, decay: 0.05 },
    17: { type: 'tone', freq: 1200, decay: 0.4 },
    18: { type: 'tone', freq: 400, decay: 0.15 },
};

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
        const params = DRUM_PARAMS[drum] || DRUM_PARAMS[1];
        const now = this.audioContext.currentTime;

        if (params.type === 'tone' && params.freq) {
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
