/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
export class InstrumentPlayer {
    constructor(audioContext, outputNode) {
        this.audioContext = audioContext;
        this.outputNode = outputNode;
        this.activeSources = [];
        this.instrument = "piano"; // default
    }

    setInstrument(name) {
        this.instrument = name.toLowerCase();
    }

    /**
     * Convert note string (e.g 'C', 'D#') and octave to frequency.
     */
    getNoteFrequency(note, octave) {
        const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        const index = notes.indexOf(note.toUpperCase());
        if (index === -1) return 440;

        const semitoneFromA4 = (index - 9) + (octave - 4) * 12;
        return 440 * Math.pow(2, semitoneFromA4 / 12);
    }

    /**
     * Start playing a specific musical note.
     */
    playNoteForDuration(note, octave, duration = 0.5) {
        if (this.instrument === "drums") {
            this.playDrum(note);
            return;
        }

        const freq = this.getNoteFrequency(note, octave);
        let type = "sine";
        let envelope = null;

        // Map instrument names to oscillator shapes and ADSR envelopes
        if (this.instrument === "piano") {
            type = "sine";
            envelope = { attack: 0.01, decay: 0.1, sustain: 0.4, release: 0.2 };
        } else if (this.instrument === "guitar") {
            type = "sawtooth";
            envelope = { attack: 0.02, decay: 0.2, sustain: 0.2, release: 0.3 };
        } else if (this.instrument === "violin") {
            type = "triangle";
            envelope = { attack: 0.1, decay: 0.1, sustain: 0.5, release: 0.1 };
        } else if (this.instrument === "organ") {
            type = "square";
            envelope = { attack: 0.05, decay: 0.1, sustain: 0.6, release: 0.2 };
        } else if (this.instrument === "flute") {
            type = "sine";
            // Breathy attack
            envelope = { attack: 0.15, decay: 0.1, sustain: 0.4, release: 0.3 };
        } else if (this.instrument === "electric_guitar") {
            type = "sawtooth";
            // More sustain/bite
            envelope = { attack: 0.01, decay: 0.05, sustain: 0.7, release: 0.4 };
        }

        this._playOscillator(freq, type, duration, envelope);
    }

    _playOscillator(freq, type, duration, envelope) {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const t = this.audioContext.currentTime;

        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);

        const adsr = envelope || {
            attack: 0.05,
            decay: 0.1,
            sustain: 0.3,
            release: duration - 0.15 > 0 ? duration - 0.15 : 0.05
        };

        // Apply ADSR Envelope
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.5, t + adsr.attack);
        gain.gain.exponentialRampToValueAtTime(adsr.sustain, t + adsr.attack + adsr.decay);
        gain.gain.setValueAtTime(adsr.sustain, Math.max(t + duration - adsr.release, t));
        gain.gain.exponentialRampToValueAtTime(0.01, t + duration);

        osc.connect(gain);
        gain.connect(this.outputNode);

        osc.start(t);
        osc.stop(t + duration);
        this.activeSources.push(osc);

        osc.onended = () => {
            this.activeSources = this.activeSources.filter(s => s !== osc);
        };
    }

    playDrum(n) {
        const t = this.audioContext.currentTime;
        const note = n.toUpperCase();

        if (note === "C") { // Kick
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.frequency.setValueAtTime(150, t);
            osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.5);
            gain.gain.setValueAtTime(1, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
            osc.connect(gain);
            gain.connect(this.outputNode);
            osc.start(t);
            osc.stop(t + 0.5);

        } else if (note === "D") { // Snare
            const bufferSize = this.audioContext.sampleRate * 0.2;
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
            const noise = this.audioContext.createBufferSource();
            noise.buffer = buffer;
            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0.8, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
            noise.connect(gain);
            gain.connect(this.outputNode);
            noise.start(t);
        }
    }

    stopAllSounds() {
        this.activeSources.forEach(osc => {
            try { osc.stop(); } catch (e) { }
        });
        this.activeSources = [];
    }
}
