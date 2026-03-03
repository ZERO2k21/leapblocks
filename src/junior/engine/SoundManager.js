export class SoundManager {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.connect(this.audioContext.destination);
        this.masterGain.gain.value = 1.0;

        this.instrument = "piano";
        this.recordings = {}; // Map of name -> blobURL
        this.assets = {
            grunt: "sounds/grunt.mp3", // Placeholder paths - we will synthesize fallback
            bark: "sounds/bark.mp3",
            meow: "sounds/meow.mp3",
            laugh: "sounds/laugh.mp3"
        };
        this.activeSources = [];
    }

    resume() {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    // --- SYNTHESIZED SOUNDS (No external assets needed for basic demo) ---
    playTone(freq, type = "sine", duration = 0.5) {
        this.resume();
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.audioContext.currentTime);

        gain.gain.setValueAtTime(0.5, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.audioContext.currentTime + duration);
        this.activeSources.push(osc);

        // Cleanup
        osc.onended = () => {
            this.activeSources = this.activeSources.filter(s => s !== osc);
        };
    }

    playNote(note, octave, duration = 0.5) {
        if (this.instrument === "drums") {
            this.playDrum(note);
            return;
        }

        const freq = this.getNoteFrequency(note, octave);
        let type = "sine";
        if (this.instrument === "guitar") type = "sawtooth";
        if (this.instrument === "violin") type = "triangle";
        if (this.instrument === "square") type = "square";

        this.playTone(freq, type, duration);
    }

    playDrum(n) {
        this.resume();
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
            gain.connect(this.masterGain);
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
            gain.connect(this.masterGain);
            noise.start(t);
        } else { // HiHat
            const bufferSize = this.audioContext.sampleRate * 0.1;
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
            const noise = this.audioContext.createBufferSource();
            noise.buffer = buffer;
            const filter = this.audioContext.createBiquadFilter();
            filter.type = "highpass";
            filter.frequency.value = 5000;
            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0.6, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);
            noise.start(t);
        }
    }

    getNoteFrequency(note, octave) { // Line 60 matches
        const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        const index = notes.indexOf(note.toUpperCase());
        if (index === -1) return 440;

        // A4 = 440Hz. A is index 9.
        // Formula: f = 440 * 2^((n - 49)/12) where n is semitone from A4
        // A4 is 4th octave.
        // Let's base on C4 roughly 261.63
        // keyNumber = (octave + 1) * 12 + index
        // A4 keyNumber is 5 * 12 + 9 = 69 ?? No. MIDI 69 is A4.
        const semitoneFromA4 = (index - 9) + (octave - 4) * 12;
        return 440 * Math.pow(2, semitoneFromA4 / 12);
    }

    // --- ASSETS & RECORDINGS ---
    async playAsset(name) {
        this.resume();
        // Check recordings first
        if (this.recordings[name]) {
            const audio = new Audio(this.recordings[name]);
            audio.play();
            return;
        }

        // Fallback or placeholders for demo assets if files missing
        // For now, simulate asset with synthesis to avoid 404s
        if (name === "grunt") this.playTone(150, "sawtooth", 0.3);
        else if (name === "bark") this.playTone(300, "square", 0.2);
        else if (name === "meow") this.playTone(600, "triangle", 0.4);
        else console.warn("Sound not found:", name);
    }

    // --- RECORDING ---
    async startRecording() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(this.stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.start();
            return true;
        } catch (err) {
            console.error("Error accessing microphone:", err);
            return false;
        }
    }

    stopRecording(name = "My Recording") {
        return new Promise((resolve) => {
            if (!this.mediaRecorder) { resolve(null); return; }

            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/mp3' }); // or webm
                const audioUrl = URL.createObjectURL(audioBlob);

                // Save
                this.recordings[name] = audioUrl;

                // Cleanup
                this.stream.getTracks().forEach(track => track.stop());
                this.stream = null;
                this.mediaRecorder = null;

                resolve(audioUrl);
            };

            this.mediaRecorder.stop();
        });
    }

    addRecording(name, blob) {
        // Redundant with stopRecording logic but useful for loading existing blobs
        const url = URL.createObjectURL(blob);
        this.recordings[name] = url;
    }

    stopAll() {
        this.activeSources.forEach(s => {
            try { s.stop(); } catch (e) { }
        });
        this.activeSources = [];
    }

    setInstrument(name) {
        this.instrument = name.toLowerCase();
    }
}

export const soundManager = new SoundManager();
