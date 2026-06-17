/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
declare module "*.svg" {
    const content: string;
    export default content;
}

declare module "*.css" {
    const content: any;
    export default content;
}

declare module "*.css?inline" {
    const content: string;
    export default content;
}

declare module "*.jpeg" {
    const value: string;
    export default value;
}

declare module "*.jpg" {
    const value: string;
    export default value;
}

declare module "*.png" {
    const value: string;
    export default value;
}

declare module "*.gif" {
    const value: string;
    export default value;
}

declare module 'wav-encoder';

declare module '../Leap-audio/src/SoundBank' {
    export class SoundBank {
        constructor(audioContext: AudioContext);
        getSoundBuffer(name: string): Promise<AudioBuffer>;
        playSound(name: string): void;
        stopAllSounds(): void;
    }
}

declare module '../Leap-audio/src/ADPCMSoundDecoder' {
    export class ADPCMSoundDecoder {
        constructor(audioContext: AudioContext);
        decode(arrayBuffer: ArrayBuffer): Promise<AudioBuffer>;
    }
}

declare module '../Leap-audio/src/audio/audio-effects' {
    export default class AudioEffects {
        constructor(buffer: AudioBuffer, effectName: string, selectionStart?: number, selectionEnd?: number);
        process(callback: (buffer: AudioBuffer) => void): void;
    }
}

declare module '../Leap-audio/src/AudioEngine' {
    export class AudioEngine {
        constructor(audioContext?: AudioContext);
        loadSound(name: string, url: string): Promise<void>;
        playSound(name: string): void;
        stopAllSounds(): void;
    }
}
