/**
 * Stub for ADPCM decoder to match Scratch 3 audio engine architecture.
 * In a modern web environment, AudioContext handles decoding natively.
 */
export class ADPCMSoundDecoder {
    constructor(audioContext) {
        this.audioContext = audioContext;
    }

    /**
     * Decode ADPCM sound data.
     * @param {ArrayBuffer} audioData 
     * @returns {Promise<AudioBuffer>}
     */
    async decode(audioData) {
        // We use native decoding fallback for all modern paths
        return this.audioContext.decodeAudioData(audioData);
    }
}
