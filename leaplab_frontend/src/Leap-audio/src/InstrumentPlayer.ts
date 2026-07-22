/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */

interface ADSR {
  attack: number
  decay: number
  sustain: number
  release: number
}

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

export class InstrumentPlayer {
  audioContext: AudioContext
  outputNode: AudioNode
  activeSources: OscillatorNode[]
  instrument: string

  constructor(audioContext: AudioContext, outputNode: AudioNode) {
    this.audioContext = audioContext
    this.outputNode = outputNode
    this.activeSources = []
    this.instrument = "piano"
  }

  setInstrument(name: string): void {
    this.instrument = name.toLowerCase()
  }

  getNoteFrequency(note: string, octave: number): number {
    const index = NOTES.indexOf(note.toUpperCase())
    if (index === -1) return 440

    const semitoneFromA4 = (index - 9) + (octave - 4) * 12
    return 440 * Math.pow(2, semitoneFromA4 / 12)
  }

  playNoteForDuration(note: string, octave: number, duration = 0.5): void {
    if (this.instrument === "drums") {
      this.playDrum(note)
      return
    }

    const freq = this.getNoteFrequency(note, octave)
    let type: OscillatorType = "sine"
    let envelope: ADSR | null = null

    if (this.instrument === "piano") {
      type = "sine"
      envelope = { attack: 0.01, decay: 0.1, sustain: 0.4, release: 0.2 }
    } else if (this.instrument === "guitar") {
      type = "sawtooth"
      envelope = { attack: 0.02, decay: 0.2, sustain: 0.2, release: 0.3 }
    } else if (this.instrument === "violin") {
      type = "triangle"
      envelope = { attack: 0.1, decay: 0.1, sustain: 0.5, release: 0.1 }
    } else if (this.instrument === "organ") {
      type = "square"
      envelope = { attack: 0.05, decay: 0.1, sustain: 0.6, release: 0.2 }
    } else if (this.instrument === "flute") {
      type = "sine"
      envelope = { attack: 0.15, decay: 0.1, sustain: 0.4, release: 0.3 }
    } else if (this.instrument === "electric_guitar") {
      type = "sawtooth"
      envelope = { attack: 0.01, decay: 0.05, sustain: 0.7, release: 0.4 }
    }

    this._playOscillator(freq, type, duration, envelope)
  }

  _playOscillator(freq: number, type: OscillatorType, duration: number, envelope: ADSR | null): void {
    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()
    const t = this.audioContext.currentTime

    osc.type = type
    osc.frequency.setValueAtTime(freq, t)

    const adsr = envelope || {
      attack: 0.05,
      decay: 0.1,
      sustain: 0.3,
      release: duration - 0.15 > 0 ? duration - 0.15 : 0.05,
    }

    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.5, t + adsr.attack)
    gain.gain.exponentialRampToValueAtTime(adsr.sustain, t + adsr.attack + adsr.decay)
    gain.gain.setValueAtTime(adsr.sustain, Math.max(t + duration - adsr.release, t))
    gain.gain.exponentialRampToValueAtTime(0.01, t + duration)

    osc.connect(gain)
    gain.connect(this.outputNode)

    osc.start(t)
    osc.stop(t + duration)
    this.activeSources.push(osc)

    osc.onended = () => {
      this.activeSources = this.activeSources.filter(s => s !== osc)
    }
  }

  playDrum(n: string): void {
    const t = this.audioContext.currentTime
    const note = n.toUpperCase()

    if (note === "C") {
      const osc = this.audioContext.createOscillator()
      const gain = this.audioContext.createGain()
      osc.frequency.setValueAtTime(150, t)
      osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.5)
      gain.gain.setValueAtTime(1, t)
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5)
      osc.connect(gain)
      gain.connect(this.outputNode)
      osc.start(t)
      osc.stop(t + 0.5)

    } else if (note === "D") {
      const bufferSize = this.audioContext.sampleRate * 0.2
      const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
      const noise = this.audioContext.createBufferSource()
      noise.buffer = buffer
      const gain = this.audioContext.createGain()
      gain.gain.setValueAtTime(0.8, t)
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2)
      noise.connect(gain)
      gain.connect(this.outputNode)
      noise.start(t)
    }
  }

  stopAllSounds(): void {
    this.activeSources.forEach(osc => {
      try { osc.stop() } catch (e) { /* already stopped */ }
    })
    this.activeSources = []
  }
}
