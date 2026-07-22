/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import EchoEffect from './effects/echo-effect'
import RobotEffect from './effects/robot-effect'
import VolumeEffect from './effects/volume-effect'
import FadeEffect from './effects/fade-effect'
import MuteEffect from './effects/mute-effect'

const effectTypes = {
  ROBOT: 'robot',
  REVERSE: 'reverse',
  LOUDER: 'higher',
  SOFTER: 'lower',
  FASTER: 'faster',
  SLOWER: 'slower',
  ECHO: 'echo',
  FADEIN: 'fade in',
  FADEOUT: 'fade out',
  MUTE: 'mute',
} as const

type EffectName = (typeof effectTypes)[keyof typeof effectTypes]

class AudioEffects {
  static get effectTypes() {
    return effectTypes
  }

  trimStartSeconds: number
  trimEndSeconds: number
  adjustedTrimStartSeconds: number
  adjustedTrimEndSeconds: number
  playbackRate: number
  adjustedTrimStart: number
  adjustedTrimEnd: number
  audioContext: OfflineAudioContext
  buffer: AudioBuffer
  source: AudioBufferSourceNode
  name: EffectName

  constructor(buffer: AudioBuffer, name: EffectName, trimStart: number, trimEnd: number) {
    this.trimStartSeconds = (trimStart * buffer.length) / buffer.sampleRate
    this.trimEndSeconds = (trimEnd * buffer.length) / buffer.sampleRate
    this.adjustedTrimStartSeconds = this.trimStartSeconds
    this.adjustedTrimEndSeconds = this.trimEndSeconds

    const pitchRatio = Math.pow(2, 4 / 12)
    let sampleCount = buffer.length
    const affectedSampleCount = Math.floor((this.trimEndSeconds - this.trimStartSeconds) * buffer.sampleRate)
    let adjustedAffectedSampleCount = affectedSampleCount
    const unaffectedSampleCount = sampleCount - affectedSampleCount

    this.playbackRate = 1
    switch (name) {
    case effectTypes.ECHO:
      sampleCount = Math.max(sampleCount,
        Math.floor((this.trimEndSeconds + EchoEffect.TAIL_SECONDS) * buffer.sampleRate))
      break
    case effectTypes.FASTER:
      this.playbackRate = pitchRatio
      adjustedAffectedSampleCount = Math.floor(affectedSampleCount / this.playbackRate)
      sampleCount = unaffectedSampleCount + adjustedAffectedSampleCount
      break
    case effectTypes.SLOWER:
      this.playbackRate = 1 / pitchRatio
      adjustedAffectedSampleCount = Math.floor(affectedSampleCount / this.playbackRate)
      sampleCount = unaffectedSampleCount + adjustedAffectedSampleCount
      break
    }

    const durationSeconds = sampleCount / buffer.sampleRate
    this.adjustedTrimEndSeconds = this.trimStartSeconds +
      (adjustedAffectedSampleCount / buffer.sampleRate)
    this.adjustedTrimStart = this.adjustedTrimStartSeconds / durationSeconds
    this.adjustedTrimEnd = this.adjustedTrimEndSeconds / durationSeconds

    if (window.OfflineAudioContext) {
      this.audioContext = new window.OfflineAudioContext(1, sampleCount, buffer.sampleRate)
    } else {
      const sampleScale = 44100 / buffer.sampleRate
      this.audioContext = new (window as any).webkitOfflineAudioContext(1, sampleScale * sampleCount, 44100)
    }

    if (name === effectTypes.REVERSE) {
      const originalBufferData = buffer.getChannelData(0)
      const newBuffer = this.audioContext.createBuffer(1, buffer.length, buffer.sampleRate)
      const newBufferData = newBuffer.getChannelData(0)
      const bufferLength = buffer.length

      const startSamples = Math.floor(this.trimStartSeconds * buffer.sampleRate)
      const endSamples = Math.floor(this.trimEndSeconds * buffer.sampleRate)
      let counter = 0
      for (let i = 0; i < bufferLength; i++) {
        if (i >= startSamples && i < endSamples) {
          newBufferData[i] = originalBufferData[endSamples - counter - 1]
          counter++
        } else {
          newBufferData[i] = originalBufferData[i]
        }
      }
      this.buffer = newBuffer
    } else {
      this.buffer = buffer
    }

    this.source = this.audioContext.createBufferSource()
    this.source.buffer = this.buffer
    this.name = name
  }

  process(done: (renderedBuffer: AudioBuffer, adjustedTrimStart: number, adjustedTrimEnd: number) => void): void {
    let input: AudioNode | undefined
    let output: AudioNode | undefined

    switch (this.name) {
    case effectTypes.FASTER:
    case effectTypes.SLOWER:
      this.source.playbackRate.setValueAtTime(this.playbackRate, this.adjustedTrimStartSeconds)
      this.source.playbackRate.setValueAtTime(1.0, this.adjustedTrimEndSeconds)
      break
    case effectTypes.LOUDER:
      ({input, output} = new VolumeEffect(this.audioContext, 1.25,
        this.adjustedTrimStartSeconds, this.adjustedTrimEndSeconds))
      break
    case effectTypes.SOFTER:
      ({input, output} = new VolumeEffect(this.audioContext, 0.75,
        this.adjustedTrimStartSeconds, this.adjustedTrimEndSeconds))
      break
    case effectTypes.ECHO:
      ({input, output} = new EchoEffect(this.audioContext,
        this.adjustedTrimStartSeconds, this.adjustedTrimEndSeconds))
      break
    case effectTypes.ROBOT:
      ({input, output} = new RobotEffect(this.audioContext,
        this.adjustedTrimStartSeconds, this.adjustedTrimEndSeconds))
      break
    case effectTypes.FADEIN:
      ({input, output} = new FadeEffect(this.audioContext, true,
        this.adjustedTrimStartSeconds, this.adjustedTrimEndSeconds))
      break
    case effectTypes.FADEOUT:
      ({input, output} = new FadeEffect(this.audioContext, false,
        this.adjustedTrimStartSeconds, this.adjustedTrimEndSeconds))
      break
    case effectTypes.MUTE:
      ({input, output} = new MuteEffect(this.audioContext,
        this.adjustedTrimStartSeconds, this.adjustedTrimEndSeconds))
      break
    }

    if (input && output) {
      this.source.connect(input)
      output.connect(this.audioContext.destination)
    } else {
      this.source.connect(this.audioContext.destination)
    }

    this.source.start()

    this.audioContext.startRendering()
    this.audioContext.oncomplete = ({renderedBuffer}) => {
      done(renderedBuffer, this.adjustedTrimStart, this.adjustedTrimEnd)
    }
  }
}

export default AudioEffects
