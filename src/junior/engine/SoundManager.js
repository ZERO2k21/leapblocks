export class SoundManager {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.connect(this.audioContext.destination);
        this.masterGain.gain.value = 1.0;

        this.instrument = "piano";
        this.recordings = {}; // Map of name -> blobURL
        this.assets = {
            grunt: "/assets/sounds/grunt.mp3",
            bark: "/assets/sounds/bark.mp3",
            meow: "/assets/sounds/meow.mp3",
            laugh: "/assets/sounds/laugh.mp3",
            robot: "/assets/sounds/robot.mp3"
        };
        this.activeSources = [];
        this.musicSource = null;
        this.musicGain = this.audioContext.createGain();
        this.musicGain.connect(this.audioContext.destination);
    }

    resume() {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    // --- MUSIC PLAYBACK ---
    async playMusic(name) {
        this.resume();
        this.stopMusic(); // Stop previous music

        try {
            const response = await fetch(`/assets/music/${name}.mp3`);
            if (!response.ok) throw new Error("Music file not found");

            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

            this.musicSource = this.audioContext.createBufferSource();
            this.musicSource.buffer = audioBuffer;
            this.musicSource.loop = true;
            this.musicSource.connect(this.musicGain);
            this.musicSource.start(0);
        } catch (err) {
            console.error("Error playing music:", err);
        }
    }

    stopMusic() {
        if (this.musicSource) {
            try { this.musicSource.stop(); } catch (e) { }
            this.musicSource = null;
        }
    }

    // --- SYNTHESIZED SOUNDS (No external assets needed for basic demo) ---
    playTone(freq, type = "sine", duration = 0.5, envelope = null) {
        this.resume();
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const t = this.audioContext.currentTime;

        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);

        // Default ADSR if none provided
        const adsr = envelope || {
            attack: 0.05,
            decay: 0.1,
            sustain: 0.3,
            release: duration - 0.15
        };

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.5, t + adsr.attack);
        gain.gain.exponentialRampToValueAtTime(adsr.sustain, t + adsr.attack + adsr.decay);
        gain.gain.setValueAtTime(adsr.sustain, t + duration - adsr.release);
        gain.gain.exponentialRampToValueAtTime(0.01, t + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(t + duration);
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
        let envelope = null;

        if (this.instrument === "piano") {
            type = "sine";
            envelope = { attack: 0.01, decay: 0.1, sustain: 0.4, release: 0.2 };
        } else if (this.instrument === "guitar") {
            type = "sawtooth";
            envelope = { attack: 0.02, decay: 0.2, sustain: 0.2, release: 0.3 };
        } else if (this.instrument === "violin") {
            type = "triangle";
            envelope = { attack: 0.1, decay: 0.1, sustain: 0.5, release: 0.1 };
        } else if (this.instrument === "square") {
            type = "square";
        }

        this.playTone(freq, type, duration, envelope);
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

        // Check assets map for file paths
        if (this.assets[name]) {
            return new Promise((resolve) => {
                const audio = new Audio(this.assets[name].startsWith("/") ? this.assets[name] : "/" + this.assets[name]);

                audio.play()
                    .then(() => resolve())
                    .catch((err) => {
                        console.warn(`Audio play failed for ${name}, falling back to synthesis:`, err);
                        this.synthesizeFallback(name);
                        resolve();
                    });
            });
        }

        this.synthesizeFallback(name);
    }

    synthesizeFallback(name) {
        // Enhanced Synthesis for realism
        if (name === "grunt") {
            this.synthesizeGrunt();
        } else if (name === "bark") {
            this.synthesizeBark();
        } else if (name === "meow") {
            this.synthesizeMeow();
        } else if (name === "pop") {
            this.synthesizePop();
        } else if (name === "boing") {
            this.synthesizeBoing();
        } else if (name === "chirp") {
            this.synthesizeChirp();
        } else if (name === "clap") {
            this.synthesizeClap();
        } else if (name === "snore") {
            this.synthesizeSnore();
        } else if (name === "robot") {
            this.synthesizeRobot();
        } else {
            console.warn("Sound not found:", name);
        }
    }

    // --- REALISTIC SYNTHESIS METHODS ---

    synthesizeRobot() {
        const t = this.audioContext.currentTime;
        const dur = 0.5;
        const osc = this.audioContext.createOscillator();
        const mod = this.audioContext.createOscillator();
        const modGain = this.audioContext.createGain();
        const gain = this.audioContext.createGain();

        osc.type = "square";
        osc.frequency.setValueAtTime(100, t);

        mod.type = "sine";
        mod.frequency.setValueAtTime(50, t);
        modGain.gain.setValueAtTime(100, t);

        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + dur);

        mod.connect(modGain);
        modGain.connect(osc.frequency);
        osc.connect(gain);
        gain.connect(this.masterGain);

        mod.start(t);
        osc.start(t);
        mod.stop(t + dur);
        osc.stop(t + dur);
    }

    synthesizePop() {
        const t = this.audioContext.currentTime;
        const dur = 0.1;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.exponentialRampToValueAtTime(800, t + dur);

        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + dur);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + dur);
    }

    synthesizeBoing() {
        const t = this.audioContext.currentTime;
        const dur = 0.5;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = "square";
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(400, t + 0.1);
        osc.frequency.exponentialRampToValueAtTime(150, t + dur);

        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + dur);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + dur);
    }

    synthesizeChirp() {
        const t = this.audioContext.currentTime;
        const dur = 0.15;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(2000, t);
        osc.frequency.exponentialRampToValueAtTime(4000, t + dur);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + dur);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + dur);
    }

    synthesizeClap() {
        const t = this.audioContext.currentTime;
        const dur = 0.2;
        const bufferSize = this.audioContext.sampleRate * dur;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;

        const filter = this.audioContext.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(1000, t);
        filter.Q.value = 1;

        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(0.8, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + dur);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        noise.start(t);
    }

    synthesizeSnore() {
        const t = this.audioContext.currentTime;
        const dur = 1.0;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(60, t);

        // Low frequency vibration
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();
        lfo.frequency.value = 5;
        lfoGain.gain.value = 10;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(200, t);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 0.3);
        gain.gain.linearRampToValueAtTime(0, t + dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        lfo.start(t);
        osc.start(t);
        lfo.stop(t + dur);
        osc.stop(t + dur);
    }

    synthesizeGrunt() {
        const t = this.audioContext.currentTime;
        const dur = 0.4;

        // Low frequency "thump" with FM
        const osc = this.audioContext.createOscillator();
        const mod = this.audioContext.createOscillator();
        const modGain = this.audioContext.createGain();
        const gain = this.audioContext.createGain();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(80, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + dur);

        mod.type = "sine";
        mod.frequency.setValueAtTime(50, t);
        modGain.gain.setValueAtTime(40, t);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.8, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, t + dur);

        mod.connect(modGain);
        modGain.connect(osc.frequency);
        osc.connect(gain);

        // Low pass filter to remove harshness
        const filter = this.audioContext.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(400, t);
        filter.frequency.exponentialRampToValueAtTime(100, t + dur);

        gain.connect(filter);
        filter.connect(this.masterGain);

        mod.start(t);
        osc.start(t);
        mod.stop(t + dur);
        osc.stop(t + dur);
    }

    synthesizeBark() {
        const t = this.audioContext.currentTime;
        const dur = 0.2;

        // Fast pitch drop + Noise burst
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + dur);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(1.0, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, t + dur);

        filter.type = "bandpass";
        filter.frequency.setValueAtTime(800, t);
        filter.Q.value = 1;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        // Add a bit of noise for texture
        const bufferSize = this.audioContext.sampleRate * dur;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = this.audioContext.createGain();
        noiseGain.gain.setValueAtTime(0.3, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, t + dur);

        noise.connect(noiseGain);
        noiseGain.connect(this.masterGain);

        osc.start(t);
        noise.start(t);
        osc.stop(t + dur);
    }

    synthesizeMeow() {
        const t = this.audioContext.currentTime;
        const dur = 0.6;

        // "Mee-ow" sweep: Low -> High -> Low
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.exponentialRampToValueAtTime(700, t + 0.2);
        osc.frequency.exponentialRampToValueAtTime(300, t + dur);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.6, t + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, t + dur);

        // Resonant filter for "vocal" quality
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(2000, t);
        filter.frequency.exponentialRampToValueAtTime(1000, t + dur);
        filter.Q.value = 5;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + dur);
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
