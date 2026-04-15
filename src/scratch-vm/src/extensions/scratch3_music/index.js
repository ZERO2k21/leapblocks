/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
export class Scratch3MusicBlocks {
    constructor(runtime) {
        this.runtime = runtime;
    }

    /**
     * Play a specific note for a duration
     * @param {object} args 
     * @param {object} util 
     */
    playNoteForDuration(args, util) {
        const note = args.NOTE || "C";
        const octave = args.OCTAVE || 4;
        const duration = args.DURATION || 0.5;

        this.runtime.audioEngine.instrumentPlayer.playNoteForDuration(note, octave, duration);
    }

    /**
     * Set the current instrument 
     * @param {object} args 
     * @param {object} util 
     */
    setInstrument(args, util) {
        const instrumentName = args.INSTRUMENT || "piano";
        this.runtime.audioEngine.instrumentPlayer.setInstrument(instrumentName);
    }

    /**
     * Play a looping background music track
     * @param {object} args 
     * @param {object} util 
     */
    playMusic(args, util) {
        const musicName = args.MUSIC;
        this.runtime.audioEngine.soundBank.playMusic(musicName);
    }

    /**
     * Stop music playback
     * @param {object} args 
     * @param {object} util 
     */
    stopMusic(args, util) {
        this.runtime.audioEngine.soundBank.stopMusic();
    }
}
