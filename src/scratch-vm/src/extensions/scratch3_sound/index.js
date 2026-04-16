export class leap3SoundBlocks {
    constructor(runtime) {
        this.runtime = runtime;
    }

    /**
     * Play a sound and wait for it to finish, or just play it.
     * In leap, this usually takes a SOUND_MENU arg.
     * @param {object} args - The block arguments.
     * @param {object} util - The block utility.
     */
    playSound(args, util) {
        const soundName = args.SOUND_MENU || args.SOUND;
        const targetId = util?.target?.id || "global";

        return this.runtime.audioEngine.playSound(soundName, targetId);
    }

    /**
     * Stop all sounds on the global audio engine.
     */
    stopAllSounds(args, util) {
        this.runtime.audioEngine.stopAllSounds();
    }

    // Advanced block placeholders (pitch/volume)
    changeEffectBy(args, util) {
        // e.g. change pitch by 10
        // this requires target tracking in the VM which we can stub or ignore for now
    }

    setEffectTo(args, util) {
        // e.g. set volume to 50%
    }
}
