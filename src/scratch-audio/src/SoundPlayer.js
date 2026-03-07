export class SoundPlayer {
    /**
     * @param {AudioContext} audioContext
     * @param {AudioBuffer} buffer 
     */
    constructor(audioContext, buffer) {
        this.audioContext = audioContext;
        this.buffer = buffer;
        this.outputNode = null;

        // Create the source node
        this.source = this.audioContext.createBufferSource();
        this.source.buffer = this.buffer;

        // Pitch node mapped as playbackRate
        this.playbackRate = 1.0;

        // Volume node mapped as gain
        this.gainNode = this.audioContext.createGain();
        this.volume = 1.0; // 0 to 1

        this._onEndedCallback = null;
        this.source.onended = () => {
            if (this._onEndedCallback) {
                this._onEndedCallback();
            }
        };
    }

    connect(destination) {
        this.source.connect(this.gainNode);
        this.gainNode.connect(destination);
        this.outputNode = destination;
    }

    /**
     * Set playback effects natively (e.g pitch and volume matching Scratch).
     */
    setPitch(value) {
        this.playbackRate = value;
        this.source.playbackRate.value = this.playbackRate;
    }

    setVolume(value) {
        this.volume = value;
        this.gainNode.gain.value = this.volume;
    }

    play() {
        if (!this.outputNode) {
            console.warn("SoundPlayer not connected to destination before play");
        }
        this.source.start(0);
    }

    stop() {
        try {
            this.source.stop();
        } catch (e) {
            // Already stopped or not started
        }
    }

    onEnded(callback) {
        this._onEndedCallback = callback;
    }
}
