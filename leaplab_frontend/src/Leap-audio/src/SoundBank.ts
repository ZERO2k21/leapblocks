/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import { ADPCMSoundDecoder } from './ADPCMSoundDecoder'

interface RecordedSound {
  samples: number[]
  sampleRate: number
}

export class SoundBank {
  audioContext: AudioContext
  soundBuffers: Map<string, AudioBuffer>
  decoder: ADPCMSoundDecoder
  assets: Record<string, string>
  recordedSounds: Record<string, RecordedSound>
  musicSource: AudioBufferSourceNode | null
  musicGain: GainNode

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext
    this.soundBuffers = new Map()
    this.decoder = new ADPCMSoundDecoder(this.audioContext)

    this.assets = {
      grunt: "assets/sounds/grunt.mp3",
      bark: "assets/sounds/dog.mp3.mp3",
      meow: "assets/sounds/cat.mp3.mp3",
      laugh: "assets/sounds/laugh.mp3",
      robot: "assets/sounds/robot.mp3.mp3",
    }

    this.recordedSounds = {}

    this.musicSource = null
    this.musicGain = this.audioContext.createGain()
    this.musicGain.connect(this.audioContext.destination)
  }

  async getSoundBuffer(soundId: string): Promise<AudioBuffer | undefined> {
    if (this.soundBuffers.has(soundId)) {
      return this.soundBuffers.get(soundId)
    }

    if (this.recordedSounds[soundId]) {
      const { samples, sampleRate } = this.recordedSounds[soundId]
      const float32 = new Float32Array(samples)
      const audioBuffer = new AudioBuffer({
        length: float32.length,
        numberOfChannels: 1,
        sampleRate: sampleRate,
      })
      audioBuffer.getChannelData(0).set(float32)
      this.soundBuffers.set(soundId, audioBuffer)
      return audioBuffer
    }

    if (this.assets[soundId]) {
      try {
        const assetPath = this.assets[soundId]
        const path = assetPath.startsWith("/") ||
          assetPath.startsWith("blob:") ||
          assetPath.startsWith("data:") ||
          /^[a-z]+:\/\//i.test(assetPath)
          ? assetPath
          : "/" + assetPath
        const response = await fetch(path)
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer()
          const audioBuffer = await this.decoder.decode(arrayBuffer)
          this.soundBuffers.set(soundId, audioBuffer)
          return audioBuffer
        }
      } catch (err) {
        console.warn(`File fetch failed for ${soundId}. Generating synthesis fallback.`, err)
      }
    }

    const buffer = await this.generateFallbackBuffer(soundId)
    if (buffer) {
      this.soundBuffers.set(soundId, buffer)
    }
    return buffer
  }

  async playMusic(name: string): Promise<void> {
    this.stopMusic()

    try {
      const path = `/assets/music/${name}.mp3`
      const response = await fetch(path)
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer()
        const audioBuffer = await this.decoder.decode(arrayBuffer)

        this.musicSource = this.audioContext.createBufferSource()
        this.musicSource.buffer = audioBuffer
        this.musicSource.loop = true
        this.musicSource.connect(this.musicGain)
        this.musicSource.start(0)
        return
      }
    } catch (err) {
      console.warn(`Music file fetch failed for ${name}. Generating synthesis fallback.`, err)
    }

    const buffer = await this.generateMusicBuffer(name)
    if (buffer) {
      this.musicSource = this.audioContext.createBufferSource()
      this.musicSource.buffer = buffer
      this.musicSource.loop = true
      this.musicSource.connect(this.musicGain)
      this.musicSource.start(0)
    }
  }

  stopMusic(): void {
    if (this.musicSource) {
      try { this.musicSource.stop() } catch (e) { /* already stopped */ }
      this.musicSource = null
    }
  }

  restoreRecordedSound(name: string, samples: number[], sampleRate: number): void {
    this.recordedSounds[name] = { samples, sampleRate }
    const float32 = new Float32Array(samples)
    const wavBlob = this._encodeWavBlob(float32, sampleRate)
    this.assets[name] = URL.createObjectURL(wavBlob)
  }

  _encodeWavBlob(samples: Float32Array, sampleRate: number): Blob {
    const numChannels = 1
    const bitsPerSample = 16
    const bytesPerSample = bitsPerSample / 8
    const blockAlign = numChannels * bytesPerSample
    const byteRate = sampleRate * blockAlign
    const dataSize = samples.length * bytesPerSample
    const headerSize = 44
    const totalSize = headerSize + dataSize

    const buffer = new ArrayBuffer(totalSize)
    const view = new DataView(buffer)

    const writeString = (off: number, str: string) => {
      for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i))
    }

    writeString(0, 'RIFF')
    view.setUint32(4, totalSize - 8, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, numChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, byteRate, true)
    view.setUint16(32, blockAlign, true)
    view.setUint16(34, bitsPerSample, true)
    writeString(36, 'data')
    view.setUint32(40, dataSize, true)

    let off = 44
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]))
      view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
      off += 2
    }

    return new Blob([buffer], {type: 'audio/wav'})
  }

  generateFallbackBuffer(name: string): Promise<AudioBuffer> {
    const renderContext = new OfflineAudioContext(1, this.audioContext.sampleRate * 1.5, this.audioContext.sampleRate)
    const t = 0
    let dur = 0.5

    if (name === "pop") {
      dur = 0.1
      const osc = renderContext.createOscillator()
      const gain = renderContext.createGain()
      osc.frequency.setValueAtTime(400, t)
      osc.frequency.exponentialRampToValueAtTime(800, t + dur)
      gain.gain.setValueAtTime(0.5, t)
      gain.gain.exponentialRampToValueAtTime(0.01, t + dur)
      osc.connect(gain)
      gain.connect(renderContext.destination)
      osc.start(t)
      osc.stop(t + dur)

    } else if (name === "boing") {
      dur = 0.5
      const osc = renderContext.createOscillator()
      const gain = renderContext.createGain()
      osc.type = "square"
      osc.frequency.setValueAtTime(150, t)
      osc.frequency.exponentialRampToValueAtTime(400, t + 0.1)
      osc.frequency.exponentialRampToValueAtTime(150, t + dur)
      gain.gain.setValueAtTime(0.3, t)
      gain.gain.exponentialRampToValueAtTime(0.01, t + dur)
      osc.connect(gain)
      gain.connect(renderContext.destination)
      osc.start(t)
      osc.stop(t + dur)

    } else if (name === "clap") {
      dur = 0.2
      const bufferSize = renderContext.sampleRate * dur
      const buffer = renderContext.createBuffer(1, bufferSize, renderContext.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
      const noise = renderContext.createBufferSource()
      noise.buffer = buffer
      const filter = renderContext.createBiquadFilter()
      filter.type = "bandpass"
      filter.frequency.setValueAtTime(1000, t)
      filter.Q.value = 1
      const gain = renderContext.createGain()
      gain.gain.setValueAtTime(0.8, t)
      gain.gain.exponentialRampToValueAtTime(0.01, t + dur)
      noise.connect(filter)
      filter.connect(gain)
      gain.connect(renderContext.destination)
      noise.start(t)

    } else if (name === "meow") {
      dur = 0.5
      const osc1 = renderContext.createOscillator()
      const osc2 = renderContext.createOscillator()
      const gain = renderContext.createGain()

      osc1.frequency.setValueAtTime(600, t)
      osc1.frequency.exponentialRampToValueAtTime(800, t + 0.1)
      osc1.frequency.exponentialRampToValueAtTime(600, t + dur)

      osc2.frequency.setValueAtTime(610, t)
      osc2.frequency.exponentialRampToValueAtTime(810, t + 0.1)
      osc2.frequency.exponentialRampToValueAtTime(610, t + dur)

      gain.gain.setValueAtTime(0.3, t)
      gain.gain.exponentialRampToValueAtTime(0.01, t + dur)

      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(renderContext.destination)

      osc1.start(t)
      osc2.start(t)
      osc1.stop(t + dur)
      osc2.stop(t + dur)

    } else if (name === "bark") {
      dur = 0.2
      const osc = renderContext.createOscillator()
      const gain = renderContext.createGain()
      osc.type = "sawtooth"
      osc.frequency.setValueAtTime(200, t)
      osc.frequency.exponentialRampToValueAtTime(100, t + dur)
      gain.gain.setValueAtTime(0.5, t)
      gain.gain.exponentialRampToValueAtTime(0.01, t + dur)
      osc.connect(gain)
      gain.connect(renderContext.destination)
      osc.start(t)
      osc.stop(t + dur)

    } else if (name === "grunt") {
      dur = 0.3
      const osc = renderContext.createOscillator()
      const gain = renderContext.createGain()
      osc.type = "square"
      osc.frequency.setValueAtTime(100, t)
      osc.frequency.linearRampToValueAtTime(50, t + dur)
      gain.gain.setValueAtTime(0.4, t)
      gain.gain.exponentialRampToValueAtTime(0.01, t + dur)
      osc.connect(gain)
      gain.connect(renderContext.destination)
      osc.start(t)
      osc.stop(t + dur)

    } else if (name === "laugh") {
      dur = 0.5
      const osc = renderContext.createOscillator()
      const gain = renderContext.createGain()
      osc.type = "sine"
      osc.frequency.setValueAtTime(440, t)
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.1)
      osc.frequency.exponentialRampToValueAtTime(440, t + 0.2)
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.3)
      osc.frequency.exponentialRampToValueAtTime(440, t + 0.4)
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.5)
      gain.gain.setValueAtTime(0.3, t)
      gain.gain.exponentialRampToValueAtTime(0.01, t + dur)
      osc.connect(gain)
      gain.connect(renderContext.destination)
      osc.start(t)
      osc.stop(t + dur)

    } else {
      console.warn("Sound synthesis definition not found for:", name, ". Returning silent buffer.")
      const silentBuffer = renderContext.createBuffer(1, 1, renderContext.sampleRate)
      return Promise.resolve(silentBuffer)
    }

    return renderContext.startRendering()
  }

  async generateMusicBuffer(name: string): Promise<AudioBuffer> {
    const sampleRate = this.audioContext.sampleRate
    const loopDuration = 4.0
    const renderContext = new OfflineAudioContext(2, sampleRate * loopDuration, sampleRate)
    const t = 0

    const kick = (time: number) => {
      const osc = renderContext.createOscillator()
      const gain = renderContext.createGain()
      osc.frequency.setValueAtTime(150, time)
      osc.frequency.exponentialRampToValueAtTime(40, time + 0.1)
      gain.gain.setValueAtTime(0.5, time)
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2)
      osc.connect(gain)
      gain.connect(renderContext.destination)
      osc.start(time)
      osc.stop(time + 0.2)
    }

    const hat = (time: number) => {
      const bufferSize = sampleRate * 0.05
      const buffer = renderContext.createBuffer(1, bufferSize, sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
      const noise = renderContext.createBufferSource()
      noise.buffer = buffer
      const filter = renderContext.createBiquadFilter()
      filter.type = "highpass"
      filter.frequency.value = 5000
      const gain = renderContext.createGain()
      gain.gain.setValueAtTime(0.1, time)
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05)
      noise.connect(filter)
      filter.connect(gain)
      gain.connect(renderContext.destination)
      noise.start(time)
    }

    const synthNote = (time: number, freq: number, dur = 0.2) => {
      const osc = renderContext.createOscillator()
      const gain = renderContext.createGain()
      osc.type = "triangle"
      osc.frequency.setValueAtTime(freq, time)
      gain.gain.setValueAtTime(0.2, time)
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur)
      osc.connect(gain)
      gain.connect(renderContext.destination)
      osc.start(time)
      osc.stop(time + dur)
    }

    if (name === "music_1") {
      for (let i = 0; i < 8; i++) {
        kick(i * 0.5)
        hat(i * 0.5 + 0.25)
        synthNote(i * 0.5, 440)
        synthNote(i * 0.5 + 0.25, 554.37)
      }
    } else if (name === "music_2") {
      for (let i = 0; i < 16; i++) {
        if (i % 4 === 0) kick(i * 0.25)
        hat(i * 0.25)
        if (i % 8 === 2) synthNote(i * 0.25, 220, 0.4)
        if (i % 8 === 6) synthNote(i * 0.25, 330, 0.4)
      }
    } else {
      for (let i = 0; i < 4; i++) {
        kick(i * 1.0)
        synthNote(i * 1.0, 261.63)
        synthNote(i * 1.0 + 0.5, 329.63)
        synthNote(i * 1.0 + 0.75, 392.00)
      }
    }

    return renderContext.startRendering()
  }
}
