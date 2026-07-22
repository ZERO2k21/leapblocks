/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
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
  15289, 16818, 18500, 20350, 22385, 24623, 27086, 29794, 32767,
]

const INDEX_TABLE = [
  -1, -1, -1, -1, 2, 4, 6, 8,
  -1, -1, -1, -1, 2, 4, 6, 8,
]

interface ADPCMState {
  predictor: number
  stepIndex: number
}

export class ADPCMSoundDecoder {
  audioContext: AudioContext

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext
  }

  async decode(audioData: ArrayBuffer): Promise<AudioBuffer> {
    try {
      const copy = audioData.slice(0)
      return await this.audioContext.decodeAudioData(copy)
    } catch (e) {
      console.log('Native decoding failed, attempting software ADPCM decode...')
      return this._decodeSoftware(audioData)
    }
  }

  _decodeSoftware(audioData: ArrayBuffer): AudioBuffer {
    const view = new DataView(audioData)
    const length = view.byteLength

    if (length < 12) throw new Error('File too short')
    if (view.getUint32(0, true) !== 0x46464952) throw new Error('Not a RIFF file')
    if (view.getUint32(8, true) !== 0x45564157) throw new Error('Not a WAVE file')

    let offset = 12
    let format = 0
    let channels = 0
    let sampleRate = 0
    let blockAlign = 0
    let bitsPerSample = 0
    let dataOffset = 0
    let dataLength = 0

    while (offset + 8 <= length) {
      const chunkId = view.getUint32(offset, true)
      const chunkSize = view.getUint32(offset + 4, true)
      offset += 8

      if (chunkId === 0x20746d66) {
        if (chunkSize < 14) throw new Error('fmt chunk too small')
        format = view.getUint16(offset, true)
        channels = view.getUint16(offset + 2, true)
        sampleRate = view.getUint32(offset + 4, true)
        if (chunkSize >= 16) {
          blockAlign = view.getUint16(offset + 12, true)
          bitsPerSample = view.getUint16(offset + 14, true)
        }
      } else if (chunkId === 0x61746164) {
        dataOffset = offset
        dataLength = chunkSize
      }

      offset += chunkSize
      if (chunkSize % 2 !== 0) offset++
    }

    if (format !== 0x11) {
      throw new Error(`Unsupported WAV format: 0x${format.toString(16)}`)
    }

    if (dataOffset === 0 || dataLength === 0) {
      throw new Error('Data chunk not found')
    }

    if (dataOffset + dataLength > length) {
      console.warn('Data chunk truncated, adjusting length')
      dataLength = length - dataOffset
    }

    const samplesPerBlock = ((blockAlign / channels) - 4) * 8 / bitsPerSample + 1
    const totalBlocks = Math.floor(dataLength / blockAlign)
    const totalSamples = totalBlocks * samplesPerBlock

    const decodedData = new Float32Array(totalSamples)
    let sampleIndex = 0

    const states: ADPCMState[] = Array.from({length: channels}, () => ({
      predictor: 0,
      stepIndex: 0,
    }))

    for (let b = 0; b < totalBlocks; b++) {
      let blockOffset = dataOffset + (b * blockAlign)

      for (let c = 0; c < channels; c++) {
        states[c].predictor = view.getInt16(blockOffset, true)
        states[c].stepIndex = Math.min(88, Math.max(0, view.getUint8(blockOffset + 2)))
        decodedData[sampleIndex + (c * samplesPerBlock)] = states[c].predictor / 32768
        blockOffset += 4
      }

      const samplesInPayload = samplesPerBlock - 1

      for (let i = 0; i < samplesInPayload; i += 8) {
        for (let c = 0; c < channels; c++) {
          for (let j = 0; j < 4; j++) {
            const byte = view.getUint8(blockOffset++)

            let sample = this._decodeSample(byte & 0x0F, states[c])
            decodedData[sampleIndex + (i + j * 2 + 1) * channels + c] = sample

            sample = this._decodeSample((byte >> 4) & 0x0F, states[c])
            decodedData[sampleIndex + (i + j * 2 + 2) * channels + c] = sample
          }
        }
      }
      sampleIndex += samplesPerBlock * channels
    }

    const audioBuffer = this.audioContext.createBuffer(channels, totalSamples, sampleRate)
    if (channels === 1) {
      audioBuffer.getChannelData(0).set(decodedData)
    } else {
      for (let c = 0; c < channels; c++) {
        const channelData = audioBuffer.getChannelData(c)
        for (let i = 0; i < totalSamples; i++) {
          channelData[i] = decodedData[i * channels + c]
        }
      }
    }
    return audioBuffer
  }

  _decodeSample(nibble: number, state: ADPCMState): number {
    const stepSize = STEP_SIZE_TABLE[state.stepIndex]
    state.stepIndex += INDEX_TABLE[nibble]
    if (state.stepIndex < 0) state.stepIndex = 0
    if (state.stepIndex > 88) state.stepIndex = 88

    let diff = stepSize >> 3
    if (nibble & 0x04) diff += stepSize
    if (nibble & 0x02) diff += stepSize >> 1
    if (nibble & 0x01) diff += stepSize >> 2

    if (nibble & 0x08) {
      state.predictor -= diff
    } else {
      state.predictor += diff
    }

    if (state.predictor > 32767) state.predictor = 32767
    if (state.predictor < -32768) state.predictor = -32768

    return state.predictor / 32768
  }
}
