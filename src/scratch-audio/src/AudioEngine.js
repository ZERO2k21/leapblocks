/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import { SoundBank } from './SoundBank.js';
import { InstrumentPlayer } from './InstrumentPlayer.js';
import { SoundPlayer } from './SoundPlayer.js';

export class AudioEngine {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Master volume control
        this.masterGain = this.audioContext.createGain();
        this.masterGain.connect(this.audioContext.destination);
        this.masterGain.gain.value = 1.0;

        // Components
        this.soundBank = new SoundBank(this.audioContext);
        this.instrumentPlayer = new InstrumentPlayer(this.audioContext, this.masterGain);

        // Track active players for this engine
        this._activePlayers = new Set();
    }

    /**
     * Resume the audio context if it was suspended by the browser.
     */
    resume() {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    /**
     * Play a sound by its ID.
     * @param {string} soundId - The ID of the sound to play (e.g., asset name or id).
     * @param {string} targetId - The ID of the target (sprite) playing the sound.
     * @returns {Promise<SoundPlayer|null>} A promise resolving to the SoundPlayer playing the sound.
     */
    async playSound(soundId, targetId) {
        this.resume();

        // 1. Get the AudioBuffer from the SoundBank
        const buffer = await this.soundBank.getSoundBuffer(soundId);
        if (!buffer) {
            console.warn(`Sound buffer not found for: ${soundId}`);
            return null;
        }

        // 2. Create a new SoundPlayer for this playback
        const player = new SoundPlayer(this.audioContext, buffer);
        player.connect(this.masterGain);

        // 3. Track the player so we can stop it later
        this._activePlayers.add(player);
        player.onEnded(() => {
            this._activePlayers.delete(player);
        });

        // 4. Start playback
        player.play();
        return player;
    }

    /**
     * Stop all sounds currently playing in the engine.
     */
    stopAllSounds() {
        // Stop all buffered sound players
        this._activePlayers.forEach(player => {
            player.stop();
        });
        this._activePlayers.clear();

        // Stop all oscillator instruments
        this.instrumentPlayer.stopAllSounds();

        // Also stop any global music looping if managed by soundBank
        this.soundBank.stopMusic();
    }
}
