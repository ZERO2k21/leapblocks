/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
export class SoundPlayer {
  audioContext: AudioContext
  buffer: AudioBuffer
  outputNode: AudioNode | null
  source: AudioBufferSourceNode
  playbackRate: number
  gainNode: GainNode
  volume: number
  _onEndedCallback: (() => void) | null

  constructor(audioContext: AudioContext, buffer: AudioBuffer) {
    this.audioContext = audioContext
    this.buffer = buffer
    this.outputNode = null

    this.source = this.audioContext.createBufferSource()
    this.source.buffer = this.buffer

    this.playbackRate = 1.0

    this.gainNode = this.audioContext.createGain()
    this.volume = 1.0

    this._onEndedCallback = null
    this.source.onended = () => {
      if (this._onEndedCallback) {
        this._onEndedCallback()
      }
    }
  }

  connect(destination: AudioNode): void {
    this.source.connect(this.gainNode)
    this.gainNode.connect(destination)
    this.outputNode = destination
  }

  setPitch(value: number): void {
    this.playbackRate = value
    this.source.playbackRate.value = this.playbackRate
  }

  setVolume(value: number): void {
    this.volume = value
    this.gainNode.gain.value = this.volume
  }

  play(): void {
    if (!this.outputNode) {
      console.warn("SoundPlayer not connected to destination before play")
    }
    this.source.start(0)
  }

  stop(): void {
    try {
      this.source.stop()
    } catch (e) {
      // Already stopped or not started
    }
  }

  onEnded(callback: () => void): void {
    this._onEndedCallback = callback
  }
}
