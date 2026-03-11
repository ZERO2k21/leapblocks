// SoundManager.ts - Handles sound playback for animation VM

import { ADPCMSoundDecoder } from '../scratch-audio/src/ADPCMSoundDecoder';

export class SoundManager {
    private static instance: SoundManager;
    private audioContext: AudioContext | null = null;
    private soundBuffers: Map<string, AudioBuffer> = new Map();
    private currentSources: AudioBufferSourceNode[] = [];
    private masterGain: GainNode | null = null;
    private volume: number = 1; // 0-1

    private constructor() {}

    static getInstance(): SoundManager {
        if (!SoundManager.instance) {
            SoundManager.instance = new SoundManager();
        }
        return SoundManager.instance;
    }

    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
        }
        // Resume context if suspended (browser autoplay policy)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    setVolume(vol: number) {
        this.volume = Math.max(0, Math.min(1, vol / 100)); // vol is 0-100
        if (this.masterGain) {
            this.masterGain.gain.value = this.volume;
        }
    }

    /**
     * Load a sound from a URL or data URL and cache it
     */
    async loadSound(name: string, src: string): Promise<AudioBuffer | undefined> {
        if (this.soundBuffers.has(name)) {
            return this.soundBuffers.get(name);
        }

        this.init();
        if (!this.audioContext) return undefined;

        try {
            const response = await fetch(src);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const arrayBuffer = await response.arrayBuffer();
            const decoder = new ADPCMSoundDecoder(this.audioContext);
            const audioBuffer = await decoder.decode(arrayBuffer);
            this.soundBuffers.set(name, audioBuffer);
            return audioBuffer;
        } catch (err) {
            console.warn(`[SoundManager] Failed to load sound: ${name}`, err);
            return undefined;
        }
    }

    /**
     * Play a sound by its name. If the sound is not loaded, it will try to load it.
     * Returns a promise that resolves when playback starts (not when it ends)
     */
    async play(name: string, src: string): Promise<void> {
        this.init();
        if (!this.audioContext || !this.masterGain) return;

        let buffer = this.soundBuffers.get(name);
        if (!buffer) {
            buffer = await this.loadSound(name, src);
            if (!buffer) return;
        }

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.masterGain!);
        source.start();
        this.currentSources.push(source);

        // Clean up after playback
        source.onended = () => {
            const idx = this.currentSources.indexOf(source);
            if (idx > -1) this.currentSources.splice(idx, 1);
        };
    }

    /**
     * Play a sound and await until it finishes
     */
    async playAndWait(name: string, src: string): Promise<void> {
        this.init();
        if (!this.audioContext || !this.masterGain) return;

        let buffer = this.soundBuffers.get(name);
        if (!buffer) {
            buffer = await this.loadSound(name, src);
            if (!buffer) return;
        }

        return new Promise((resolve) => {
            const source = this.audioContext!.createBufferSource();
            source.buffer = buffer;
            source.connect(this.masterGain!);
            source.start();
            source.onended = () => resolve();
        });
    }

    /**
     * Stop all currently playing sounds
     */
    stopAll() {
        for (const source of this.currentSources) {
            try {
                source.stop();
            } catch (e) {
                // ignore if already stopped
            }
        }
        this.currentSources = [];
    }

    /**
     * Preload a sound without playing it
     */
    preload(name: string, src: string) {
        this.loadSound(name, src).catch(() => {});
    }
}

export const soundManager = SoundManager.getInstance();
