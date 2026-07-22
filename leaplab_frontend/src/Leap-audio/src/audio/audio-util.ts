/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import WavEncoder from 'wav-encoder'

export interface SoundBuffer {
  samples: Float32Array
  sampleRate: number
}

const SOUND_BYTE_LIMIT = 10 * 1000 * 1000

const computeRMS = function (samples: Float32Array | number[], scaling = 0.55): number {
  if (samples.length === 0) return 0
  let sum = 0
  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i]
    sum += Math.pow(sample, 2)
  }
  const rms = Math.sqrt(sum / samples.length)
  const val = rms / scaling
  return Math.sqrt(val)
}

const computeChunkedRMS = function (samples: Float32Array, chunkSize = 1024): number[] {
  const sampleCount = samples.length
  const chunkLevels: number[] = []
  for (let i = 0; i < sampleCount; i += chunkSize) {
    const maxIndex = Math.min(sampleCount, i + chunkSize)
    chunkLevels.push(computeRMS(samples.slice(i, maxIndex)))
  }
  return chunkLevels
}

const encodeAndAddSoundToVM = function (
  vm: any,
  samples: Float32Array,
  sampleRate: number,
  name: string,
  callback?: () => void
): void {
  WavEncoder.encode({
    sampleRate: sampleRate,
    channelData: [samples],
  }).then((wavBuffer: ArrayBuffer) => {
    const vmSound: Record<string, any> = {
      format: '',
      dataFormat: 'wav',
      rate: sampleRate,
      sampleCount: samples.length,
    }

    const storage = vm.runtime.storage
    vmSound.asset = storage.createAsset(
      storage.AssetType.Sound,
      storage.DataFormat.WAV,
      new Uint8Array(wavBuffer),
      null,
      true
    )
    vmSound.assetId = vmSound.asset.assetId

    vmSound.md5 = `${vmSound.assetId}.${vmSound.dataFormat}`
    vmSound.name = name

    vm.addSound(vmSound).then(() => {
      if (callback) callback()
    })
  })
}

const downsampleIfNeeded = (buffer: SoundBuffer, resampler: (buffer: SoundBuffer, targetSampleRate: number) => Promise<SoundBuffer>): Promise<SoundBuffer> => {
  const {samples, sampleRate} = buffer
  const duration = samples.length / sampleRate
  const encodedByteLength = samples.length * 2
  if (encodedByteLength < SOUND_BYTE_LIMIT) {
    return Promise.resolve({samples, sampleRate})
  }
  if (duration * 22050 * 2 < SOUND_BYTE_LIMIT) {
    return resampler({samples, sampleRate}, 22050)
  }
  return Promise.reject(new Error('Sound too large to save, refusing to edit'))
}

const dropEveryOtherSample = (buffer: SoundBuffer): SoundBuffer => {
  const newLength = Math.floor(buffer.samples.length / 2)
  const newSamples = new Float32Array(newLength)
  for (let i = 0; i < newLength; i++) {
    newSamples[i] = buffer.samples[i * 2]
  }
  return {
    samples: newSamples,
    sampleRate: buffer.sampleRate / 2,
  }
}

export {
  computeRMS,
  computeChunkedRMS,
  encodeAndAddSoundToVM,
  downsampleIfNeeded,
  dropEveryOtherSample,
}
