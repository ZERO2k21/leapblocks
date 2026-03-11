/**
 * IMA ADPCM decoder for Scratch 3.0 sounds.
 * ADPCM is a 4-bit compression format used in many legacy Scratch assets.
 * Browsers do not always support this natively in decodeAudioData.
 */

const STEP_SIZE_TABLE = [
    7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 
    19, 21, 23, 25, 28, 31, 34, 37, 41, 45, 
    50, 55, 60, 66, 73, 80, 88, 97, 107, 118, 
    130, 143, 157, 173, 190, 209, 230, 253, 279, 307, 
    337, 371, 408, 449, 494, 544, 598, 658, 724, 796, 
    876, 963, 1060, 1166, 1282, 1411, 1552, 1707, 1878, 2066, 
    2272, 2499, 2749, 3024, 3327, 3660, 4026, 4428, 4871, 5358, 
    5894, 6484, 7132, 7845, 8630, 9493, 10442, 11487, 12635, 13899, 
    15289, 16818, 18500, 20350, 22385, 24623, 27086, 29794, 32767
];

const INDEX_TABLE = [
    -1, -1, -1, -1, 2, 4, 6, 8,
    -1, -1, -1, -1, 2, 4, 6, 8
];

export class ADPCMSoundDecoder {
    constructor(audioContext) {
        this.audioContext = audioContext;
    }

    /**
     * Decode ADPCM sound data.
     * @param {ArrayBuffer} audioData - The encoded WAV file data.
     * @returns {Promise<AudioBuffer>}
     */
    async decode(audioData) {
        try {
            // Try native decoding first (fastest)
            // Note: We MUST use a copy of the buffer because decodeAudioData detaches it
            const copy = audioData.slice(0);
            return await this.audioContext.decodeAudioData(copy);
        } catch (e) {
            // Fallback to software decoding for ADPCM
            console.log('Native decoding failed, attempting software ADPCM decode...');
            return this._decodeSoftware(audioData);
        }
    }

    _decodeSoftware(audioData) {
        const view = new DataView(audioData);
        
        // Basic WAV header check
        if (view.getUint32(0, true) !== 0x46464952) throw new Error('Not a RIFF file'); // "RIFF"
        if (view.getUint32(8, true) !== 0x45564157) throw new Error('Not a WAVE file'); // "WAVE"

        let offset = 12;
        let format = 0;
        let channels = 0;
        let sampleRate = 0;
        let blockAlign = 0;
        let bitsPerSample = 0;
        let dataOffset = 0;
        let dataLength = 0;

        while (offset < view.byteLength) {
            const chunkId = view.getUint32(offset, true);
            const chunkSize = view.getUint32(offset + 4, true);
            offset += 8;

            if (chunkId === 0x20746d66) { // "fmt "
                format = view.getUint16(offset, true);
                channels = view.getUint16(offset + 2, true);
                sampleRate = view.getUint32(offset + 4, true);
                blockAlign = view.getUint16(offset + 12, true);
                bitsPerSample = view.getUint16(offset + 14, true);
            } else if (chunkId === 0x61746164) { // "data"
                dataOffset = offset;
                dataLength = chunkSize;
            }
            offset += chunkSize;
            if (chunkSize % 2 !== 0) offset++; // Padding byte
        }

        if (format !== 0x11) { // 0x11 is IMA ADPCM
            throw new Error(`Unsupported WAV format: 0x${format.toString(16)}`);
        }

        const samplesPerBlock = ((blockAlign / channels) - 4) * 8 / bitsPerSample + 1;
        const totalBlocks = Math.floor(dataLength / blockAlign);
        const totalSamples = totalBlocks * samplesPerBlock;
        
        const decodedData = new Float32Array(totalSamples);
        let sampleIndex = 0;

        // Decoders states for each channel
        const states = Array.from({ length: channels }, () => ({
            predictor: 0,
            stepIndex: 0
        }));

        for (let b = 0; b < totalBlocks; b++) {
            let blockOffset = dataOffset + (b * blockAlign);

            // Each block has a preamble per channel
            for (let c = 0; c < channels; c++) {
                states[c].predictor = view.getInt16(blockOffset, true);
                states[c].stepIndex = Math.min(88, Math.max(0, view.getUint8(blockOffset + 2)));
                // byte 3 is reserved
                decodedData[sampleIndex + (c * samplesPerBlock)] = states[c].predictor / 32768;
                blockOffset += 4;
            }

            // Decode the rest of the block
            const samplesInPayload = samplesPerBlock - 1;
            // IMA ADPCM packed bytes: 4 bytes per channel (8 samples of 4-bits)
            const bytesPerChannelPayload = 4; 
            
            // This loop assumes 4-bit IMA ADPCM
            for (let i = 0; i < samplesInPayload; i += 8) {
                for (let c = 0; c < channels; c++) {
                    for (let j = 0; j < 4; j++) {
                        const byte = view.getUint8(blockOffset++);
                        
                        // Lower nibble
                        let sample = this._decodeSample(byte & 0x0F, states[c]);
                        decodedData[sampleIndex + (i + j * 2 + 1) * channels + c] = sample;
                        
                        // Upper nibble
                        sample = this._decodeSample((byte >> 4) & 0x0F, states[c]);
                        decodedData[sampleIndex + (i + j * 2 + 2) * channels + c] = sample;
                    }
                }
            }
            sampleIndex += samplesPerBlock * channels;
        }

        const audioBuffer = this.audioContext.createBuffer(channels, totalSamples, sampleRate);
        if (channels === 1) {
            audioBuffer.getChannelData(0).set(decodedData);
        } else {
            // De-interleave if needed (though Scratch ADPCM is almost always mono)
            for (let c = 0; c < channels; c++) {
                const channelData = audioBuffer.getChannelData(c);
                for (let i = 0; i < totalSamples; i++) {
                    channelData[i] = decodedData[i * channels + c];
                }
            }
        }
        return audioBuffer;
    }

    _decodeSample(nibble, state) {
        const stepSize = STEP_SIZE_TABLE[state.stepIndex];
        state.stepIndex += INDEX_TABLE[nibble];
        if (state.stepIndex < 0) state.stepIndex = 0;
        if (state.stepIndex > 88) state.stepIndex = 88;

        let diff = stepSize >> 3;
        if (nibble & 0x04) diff += stepSize;
        if (nibble & 0x02) diff += stepSize >> 1;
        if (nibble & 0x01) diff += stepSize >> 2;

        if (nibble & 0x08) {
            state.predictor -= diff;
        } else {
            state.predictor += diff;
        }

        if (state.predictor > 32767) state.predictor = 32767;
        if (state.predictor < -32768) state.predictor = -32768;

        return state.predictor / 32768;
    }
}

