declare module "*.svg" {
    const content: string;
    export default content;
}

declare module "*.css" {
    const content: any;
    export default content;
}

declare module 'wav-encoder';

declare module '../scratch-audio/src/SoundBank' {
    export class SoundBank {
        constructor(audioContext: AudioContext);
        getSoundBuffer(name: string): Promise<AudioBuffer>;
        playSound(name: string): void;
        stopAllSounds(): void;
    }
}

declare module '../scratch-audio/src/ADPCMSoundDecoder' {
    export class ADPCMSoundDecoder {
        constructor(audioContext: AudioContext);
        decode(arrayBuffer: ArrayBuffer): Promise<AudioBuffer>;
    }
}

declare module '../scratch-audio/src/audio/audio-effects' {
    export default class AudioEffects {
        constructor(buffer: AudioBuffer, effectName: string, selectionStart?: number, selectionEnd?: number);
        process(callback: (buffer: AudioBuffer) => void): void;
    }
}

declare module '../scratch-audio/src/AudioEngine' {
    export class AudioEngine {
        constructor(audioContext?: AudioContext);
        loadSound(name: string, url: string): Promise<void>;
        playSound(name: string): void;
        stopAllSounds(): void;
    }
}
