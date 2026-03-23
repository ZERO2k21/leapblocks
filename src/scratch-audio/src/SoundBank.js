import { ADPCMSoundDecoder } from './ADPCMSoundDecoder';

export class SoundBank {
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.soundBuffers = new Map(); // assetName -> AudioBuffer
        this.decoder = new ADPCMSoundDecoder(this.audioContext);

        // Setup initial assets mapping directly to leapblocks assets
        this.assets = {
            grunt: "/assets/sounds/grunt.mp3",
            bark: "/assets/sounds/dog.mp3.mp3",
            meow: "/assets/sounds/cat.mp3.mp3",
            laugh: "/assets/sounds/laugh.mp3",
            robot: "/assets/sounds/robot.mp3.mp3"
        };

        // For music loop tracking
        this.musicSource = null;
        this.musicGain = this.audioContext.createGain();
        this.musicGain.connect(this.audioContext.destination);
    }

    /**
     * Fetch, decode, and return an AudioBuffer for a given sound ID.
     */
    async getSoundBuffer(soundId) {
        if (this.soundBuffers.has(soundId)) {
            return this.soundBuffers.get(soundId);
        }

        // Try to load physical file if it exists in assets map
        if (this.assets[soundId]) {
            try {
                const assetPath = this.assets[soundId];
                const path = assetPath.startsWith("/") ||
                    assetPath.startsWith("blob:") ||
                    assetPath.startsWith("data:") ||
                    /^[a-z]+:\/\//i.test(assetPath)
                    ? assetPath
                    : "/" + assetPath;
                const response = await fetch(path);
                if (response.ok) {
                    const arrayBuffer = await response.arrayBuffer();
                    const audioBuffer = await this.decoder.decode(arrayBuffer);
                    this.soundBuffers.set(soundId, audioBuffer);
                    return audioBuffer;
                }
            } catch (err) {
                console.warn(`File fetch failed for ${soundId}. Generating synthesis fallback.`, err);
            }
        }

        // Fallback to synthesizing a buffer
        const buffer = await this.generateFallbackBuffer(soundId);
        if (buffer) {
            this.soundBuffers.set(soundId, buffer);
        }
        return buffer;
    }

    // --- MUSIC MANAGER --- //
    // Similar to sounds, but creates an active loop
    async playMusic(name) {
        this.stopMusic();

        try {
            const path = `/assets/music/${name}.mp3`;
            const response = await fetch(path);
            if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.decoder.decode(arrayBuffer);

                this.musicSource = this.audioContext.createBufferSource();
                this.musicSource.buffer = audioBuffer;
                this.musicSource.loop = true;
                this.musicSource.connect(this.musicGain);
                this.musicSource.start(0);
                return;
            }
        } catch (err) {
            console.warn(`Music file fetch failed for ${name}. Generating synthesis fallback.`, err);
        }

        // Fallback to synthesizing a music loop
        const buffer = await this.generateMusicBuffer(name);
        if (buffer) {
            this.musicSource = this.audioContext.createBufferSource();
            this.musicSource.buffer = buffer;
            this.musicSource.loop = true;
            this.musicSource.connect(this.musicGain);
            this.musicSource.start(0);
        }
    }

    stopMusic() {
        if (this.musicSource) {
            try { this.musicSource.stop(); } catch (e) { }
            this.musicSource = null;
        }
    }

    // --- ENHANCED SYNTHESIS (Offline Rendering) --- //
    /**
     * Creates an OfflineAudioContext to render the synthesis into an AudioBuffer.
     */
    generateFallbackBuffer(name) {
        const renderContext = new OfflineAudioContext(1, this.audioContext.sampleRate * 1.5, this.audioContext.sampleRate);
        const t = 0; // render start at 0
        let dur = 0.5;

        if (name === "pop") {
            dur = 0.1;
            const osc = renderContext.createOscillator();
            const gain = renderContext.createGain();
            osc.frequency.setValueAtTime(400, t);
            osc.frequency.exponentialRampToValueAtTime(800, t + dur);
            gain.gain.setValueAtTime(0.5, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + dur);
            osc.connect(gain);
            gain.connect(renderContext.destination);
            osc.start(t);
            osc.stop(t + dur);

        } else if (name === "boing") {
            dur = 0.5;
            const osc = renderContext.createOscillator();
            const gain = renderContext.createGain();
            osc.type = "square";
            osc.frequency.setValueAtTime(150, t);
            osc.frequency.exponentialRampToValueAtTime(400, t + 0.1);
            osc.frequency.exponentialRampToValueAtTime(150, t + dur);
            gain.gain.setValueAtTime(0.3, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + dur);
            osc.connect(gain);
            gain.connect(renderContext.destination);
            osc.start(t);
            osc.stop(t + dur);

        } else if (name === "clap") {
            dur = 0.2;
            const bufferSize = renderContext.sampleRate * dur;
            const buffer = renderContext.createBuffer(1, bufferSize, renderContext.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
            const noise = renderContext.createBufferSource();
            noise.buffer = buffer;
            const filter = renderContext.createBiquadFilter();
            filter.type = "bandpass";
            filter.frequency.setValueAtTime(1000, t);
            filter.Q.value = 1;
            const gain = renderContext.createGain();
            gain.gain.setValueAtTime(0.8, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + dur);
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(renderContext.destination);
            noise.start(t);

        } else if (name === "meow") {
            dur = 0.5;
            const osc1 = renderContext.createOscillator();
            const osc2 = renderContext.createOscillator();
            const gain = renderContext.createGain();

            // Meow-like frequency curve
            osc1.frequency.setValueAtTime(600, t);
            osc1.frequency.exponentialRampToValueAtTime(800, t + 0.1);
            osc1.frequency.exponentialRampToValueAtTime(600, t + dur);

            osc2.frequency.setValueAtTime(610, t);
            osc2.frequency.exponentialRampToValueAtTime(810, t + 0.1);
            osc2.frequency.exponentialRampToValueAtTime(610, t + dur);

            gain.gain.setValueAtTime(0.3, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + dur);

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(renderContext.destination);

            osc1.start(t);
            osc2.start(t);
            osc1.stop(t + dur);
            osc2.stop(t + dur);

        } else if (name === "bark") {
            dur = 0.2;
            const osc = renderContext.createOscillator();
            const gain = renderContext.createGain();
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(200, t);
            osc.frequency.exponentialRampToValueAtTime(100, t + dur);
            gain.gain.setValueAtTime(0.5, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + dur);
            osc.connect(gain);
            gain.connect(renderContext.destination);
            osc.start(t);
            osc.stop(t + dur);

        } else if (name === "grunt") {
            dur = 0.3;
            const osc = renderContext.createOscillator();
            const gain = renderContext.createGain();
            osc.type = "square";
            osc.frequency.setValueAtTime(100, t);
            osc.frequency.linearRampToValueAtTime(50, t + dur);
            gain.gain.setValueAtTime(0.4, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + dur);
            osc.connect(gain);
            gain.connect(renderContext.destination);
            osc.start(t);
            osc.stop(t + dur);

        } else if (name === "laugh") {
            dur = 0.5;
            const osc = renderContext.createOscillator();
            const gain = renderContext.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(440, t);
            osc.frequency.exponentialRampToValueAtTime(880, t + 0.1);
            osc.frequency.exponentialRampToValueAtTime(440, t + 0.2);
            osc.frequency.exponentialRampToValueAtTime(880, t + 0.3);
            osc.frequency.exponentialRampToValueAtTime(440, t + 0.4);
            osc.frequency.exponentialRampToValueAtTime(880, t + 0.5);
            gain.gain.setValueAtTime(0.3, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + dur);
            osc.connect(gain);
            gain.connect(renderContext.destination);
            osc.start(t);
            osc.stop(t + dur);

        } else {
            console.warn("Sound synthesis definition not found for:", name, ". Returning silent buffer.");
            // Create a very short silent buffer as absolute fallback
            const silentBuffer = renderContext.createBuffer(1, 1, renderContext.sampleRate);
            return Promise.resolve(silentBuffer);
        }

        // We can't immediately wait for OfflineRender in a sync return format,
        // Wait, OfflineAudioContext.startRendering() is async.
        // We will need to return a Promise that resolves the Buffer.
        return renderContext.startRendering();
    }

    /**
     * Synthesizes a background music loop based on the theme name.
     */
    async generateMusicBuffer(name) {
        const sampleRate = this.audioContext.sampleRate;
        const loopDuration = 4.0; // 4 seconds loop
        const renderContext = new OfflineAudioContext(2, sampleRate * loopDuration, sampleRate);
        const t = 0;

        // Simple Rhythmic Patterns
        const kick = (time) => {
            const osc = renderContext.createOscillator();
            const gain = renderContext.createGain();
            osc.frequency.setValueAtTime(150, time);
            osc.frequency.exponentialRampToValueAtTime(40, time + 0.1);
            gain.gain.setValueAtTime(0.5, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
            osc.connect(gain);
            gain.connect(renderContext.destination);
            osc.start(time);
            osc.stop(time + 0.2);
        };

        const hat = (time) => {
            const bufferSize = sampleRate * 0.05;
            const buffer = renderContext.createBuffer(1, bufferSize, sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
            const noise = renderContext.createBufferSource();
            noise.buffer = buffer;
            const filter = renderContext.createBiquadFilter();
            filter.type = "highpass";
            filter.frequency.value = 5000;
            const gain = renderContext.createGain();
            gain.gain.setValueAtTime(0.1, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(renderContext.destination);
            noise.start(time);
        };

        const synthNote = (time, freq, dur = 0.2) => {
            const osc = renderContext.createOscillator();
            const gain = renderContext.createGain();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(freq, time);
            gain.gain.setValueAtTime(0.2, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
            osc.connect(gain);
            gain.connect(renderContext.destination);
            osc.start(time);
            osc.stop(time + dur);
        };

        if (name === "music_1") {
            // "Digital Pulse"
            for (let i = 0; i < 8; i++) {
                kick(i * 0.5);
                hat(i * 0.5 + 0.25);
                synthNote(i * 0.5, 440);
                synthNote(i * 0.5 + 0.25, 554.37); // C#
            }
        } else if (name === "music_2") {
            // "Techno Loop"
            for (let i = 0; i < 16; i++) {
                if (i % 4 === 0) kick(i * 0.25);
                hat(i * 0.25);
                if (i % 8 === 2) synthNote(i * 0.25, 220, 0.4);
                if (i % 8 === 6) synthNote(i * 0.25, 330, 0.4);
            }
        } else {
            // "Default Melodic"
            for (let i = 0; i < 4; i++) {
                kick(i * 1.0);
                synthNote(i * 1.0, 261.63); // C4
                synthNote(i * 1.0 + 0.5, 329.63); // E4
                synthNote(i * 1.0 + 0.75, 392.00); // G4
            }
        }

        return renderContext.startRendering();
    }
}
