/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import { SoundBank } from './SoundBank'
import { InstrumentPlayer } from './InstrumentPlayer'
import { SoundPlayer } from './SoundPlayer'

export class AudioEngine {
  audioContext: AudioContext
  masterGain: GainNode
  soundBank: SoundBank
  instrumentPlayer: InstrumentPlayer
  _activePlayers: Set<SoundPlayer>

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

    this.masterGain = this.audioContext.createGain()
    this.masterGain.connect(this.audioContext.destination)
    this.masterGain.gain.value = 1.0

    this.soundBank = new SoundBank(this.audioContext)
    this.instrumentPlayer = new InstrumentPlayer(this.audioContext, this.masterGain)

    this._activePlayers = new Set()
  }

  resume(): void {
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }
  }

  async playSound(soundId: string, targetId: string): Promise<SoundPlayer | null> {
    this.resume()

    const buffer = await this.soundBank.getSoundBuffer(soundId)
    if (!buffer) {
      console.warn(`Sound buffer not found for: ${soundId}`)
      return null
    }

    const player = new SoundPlayer(this.audioContext, buffer)
    player.connect(this.masterGain)

    this._activePlayers.add(player)
    player.onEnded(() => {
      this._activePlayers.delete(player)
    })

    player.play()
    return player
  }

  stopAllSounds(): void {
    this._activePlayers.forEach(player => {
      player.stop()
    })
    this._activePlayers.clear()

    this.instrumentPlayer.stopAllSounds()

    this.soundBank.stopMusic()
  }
}
