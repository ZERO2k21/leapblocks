/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
// SoundManager.ts - Handles sound playback for animation VM

import { ADPCMSoundDecoder } from '../Leap-audio/src/ADPCMSoundDecoder';
import type { Sprite } from '../stage/Sprite';

type PlaybackOptions = {
    cacheKey?: string;
    pan?: number;
    pitch?: number;
    volume?: number;
};

export class SoundManager {
    private static instance: SoundManager;
    private audioContext: AudioContext | null = null;
    private soundBuffers: Map<string, AudioBuffer> = new Map();
    private currentSources: AudioBufferSourceNode[] = [];
    private masterGain: GainNode | null = null;
    private volume: number = 1; // 0-1

    private constructor() { }

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

    private getBufferKey(src: string, cacheKey?: string): string {
        return cacheKey || src;
    }

    private getPlaybackRate(pitch = 0): number {
        const safePitch = Number.isFinite(pitch) ? pitch : 0;
        return Math.max(0.125, Math.min(8, Math.pow(2, safePitch / 120)));
    }

    private connectSource(source: AudioBufferSourceNode, options?: PlaybackOptions): void {
        if (!this.audioContext || !this.masterGain) return;

        const gainNode = this.audioContext.createGain();
        const playbackVolume = Math.max(0, Math.min(1, (options?.volume ?? 100) / 100));
        gainNode.gain.value = playbackVolume;

        source.playbackRate.value = this.getPlaybackRate(options?.pitch);
        source.connect(gainNode);

        let lastNode: AudioNode = gainNode;
        if (typeof this.audioContext.createStereoPanner === 'function') {
            const panner = this.audioContext.createStereoPanner();
            const pan = Math.max(-1, Math.min(1, (options?.pan ?? 0) / 100));
            panner.pan.value = pan;
            gainNode.connect(panner);
            lastNode = panner;
        }

        lastNode.connect(this.masterGain);
    }

    private trackSource(source: AudioBufferSourceNode, onEnded?: () => void): void {
        this.currentSources.push(source);
        source.onended = () => {
            const idx = this.currentSources.indexOf(source);
            if (idx > -1) this.currentSources.splice(idx, 1);
            onEnded?.();
        };
    }

    /**
     * Load a sound from a URL or data URL and cache it
     */
    async loadSound(name: string, src: string, cacheKey?: string): Promise<AudioBuffer | undefined> {
        const bufferKey = this.getBufferKey(src, cacheKey);
        if (this.soundBuffers.has(bufferKey)) {
            return this.soundBuffers.get(bufferKey);
        }

        this.init();
        if (!this.audioContext) return undefined;

        try {
            const response = await fetch(src);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            // Safety check: if we got HTML instead of audio (common 404 behavior), fail early
            const contentType = response.headers.get('Content-Type');
            if (contentType && contentType.includes('text/html')) {
                throw new Error('Received HTML instead of audio data. Path might be incorrect.');
            }

            const arrayBuffer = await response.arrayBuffer();
            if (arrayBuffer.byteLength === 0) throw new Error('Received empty audio data.');

            let audioBuffer: AudioBuffer;
            try {
                // Try standard browser decoding (wav, mp3, etc)
                // We use slice() because decodeAudioData might detach the buffer on some platforms
                audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer.slice(0));
            } catch (e) {
                // Fallback to Leap ADPCM decoder
                const decoder = new ADPCMSoundDecoder(this.audioContext);
                audioBuffer = await decoder.decode(arrayBuffer);
            }

            this.soundBuffers.set(bufferKey, audioBuffer);
            return audioBuffer;

        } catch (err) {
            console.error(`[SoundManager] Failed to load sound "${name}" from ${src}:`, err);
            return undefined;
        }
    }

    /**
     * Play a sound by its name. If the sound is not loaded, it will try to load it.
     * Returns a promise that resolves when playback starts (not when it ends)
     */
    async play(name: string, src: string, options?: PlaybackOptions): Promise<void> {
        this.init();
        if (!this.audioContext || !this.masterGain) return;

        const bufferKey = this.getBufferKey(src, options?.cacheKey);
        let buffer = this.soundBuffers.get(bufferKey);
        if (!buffer) {
            buffer = await this.loadSound(name, src, options?.cacheKey);
            if (!buffer) return;
        }

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        this.connectSource(source, options);
        source.start();
        this.trackSource(source);
    }

    /**
     * Play a sound and await until it finishes, unless aborted
     */
    async playAndWait(name: string, src: string, options?: PlaybackOptions, signal?: AbortSignal): Promise<void> {
        this.init();
        if (!this.audioContext || !this.masterGain) return;

        const bufferKey = this.getBufferKey(src, options?.cacheKey);
        let buffer = this.soundBuffers.get(bufferKey);
        if (!buffer) {
            buffer = await this.loadSound(name, src, options?.cacheKey);
            if (!buffer) return;
        }

        if (signal?.aborted) return;

        return new Promise((resolve) => {
            const source = this.audioContext!.createBufferSource();
            source.buffer = buffer as AudioBuffer;
            this.connectSource(source, options);
            source.start();

            const onAbort = () => {
                try { source.stop(); } catch (e) { /* ignore */ }
                resolve();
            };

            if (signal) signal.addEventListener('abort', onAbort, { once: true });

            this.trackSource(source, () => {
                if (signal) signal.removeEventListener('abort', onAbort);
                resolve();
            });
        });
    }

    async playSound(sprite: Sprite, name: string, wait = false, signal?: AbortSignal): Promise<void> {
        const sound = sprite.sounds.find((entry) => entry.name === name);
        if (!sound) return;

        const options: PlaybackOptions = {
            cacheKey: `${sprite.id}:${sound.src}`,
            pan: sprite.soundEffects.pan,
            pitch: sprite.soundEffects.pitch,
            volume: sprite.volume,
        };

        if (wait) {
            await this.playAndWait(name, sound.src, options, signal);
        } else {
            await this.play(name, sound.src, options);
        }
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
        this.loadSound(name, src).catch(() => { });
    }
}

export const soundManager: SoundManager = new Proxy({} as SoundManager, {
    get(_target, prop) {
        const instance = SoundManager.getInstance();
        const value = (instance as any)[prop];
        return typeof value === 'function' ? value.bind(instance) : value;
    },
    set(_target, prop, value) { (SoundManager.getInstance() as any)[prop] = value; return true; }
});
