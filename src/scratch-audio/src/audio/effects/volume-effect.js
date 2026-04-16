/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
class VolumeEffect {
    constructor (audioContext, volume, startSeconds, endSeconds) {
        this.audioContext = audioContext;

        this.input = this.audioContext.createGain();
        this.output = this.audioContext.createGain();

        this.gain = this.audioContext.createGain();

        // Smoothly ramp the gain up before the start time, and down after the end time.
        this.rampLength = 0.01;
        this.gain.gain.setValueAtTime(1.0, Math.max(0, startSeconds - this.rampLength));
        this.gain.gain.exponentialRampToValueAtTime(volume, startSeconds);
        this.gain.gain.setValueAtTime(volume, endSeconds);
        this.gain.gain.exponentialRampToValueAtTime(1.0, endSeconds + this.rampLength);

        this.input.connect(this.gain);
        this.gain.connect(this.output);
    }
}

export default VolumeEffect;
