const SAMPLE_WIDTH = 80;
const SAMPLE_HEIGHT = 60;

export class VideoSensingRuntime {
    private videoEl: HTMLVideoElement | null = null;
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private prevFrame: Uint8ClampedArray | null = null;
    private _sensitivity: number = 30;
    private lastMotionLevel: number = 0;
    private lastDirection: number = 0;
    private _enabled: boolean = false;
    private _intervalId: ReturnType<typeof setInterval> | null = null;

    setVideoElement(video: HTMLVideoElement | null) {
        this.videoEl = video;
        if (video && typeof document !== 'undefined') {
            this.ensureCanvas();
        }
    }

    private ensureCanvas() {
        if (this.canvas) return;
        if (typeof document === 'undefined') return;
        this.canvas = document.createElement('canvas');
        this.canvas.width = SAMPLE_WIDTH;
        this.canvas.height = SAMPLE_HEIGHT;
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    }

    setSensitivity(value: number) {
        this._sensitivity = Math.max(1, Math.min(100, value));
    }

    getSensitivity(): number {
        return this._sensitivity;
    }

    start() {
        if (this._enabled) return;
        this._enabled = true;
        this._intervalId = setInterval(() => this.captureFrame(), 100);
    }

    stop() {
        this._enabled = false;
        if (this._intervalId) {
            clearInterval(this._intervalId);
            this._intervalId = null;
        }
    }

    private captureFrame() {
        if (!this.videoEl || !this.ctx || !this.canvas) return;
        if (this.videoEl.readyState < 2) return;

        this.ctx.drawImage(this.videoEl, 0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
        const currentFrame = this.ctx.getImageData(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);

        if (this.prevFrame) {
            this.computeMotion(currentFrame.data, this.prevFrame);
        }

        this.prevFrame = new Uint8ClampedArray(currentFrame.data);
    }

    private computeMotion(current: Uint8ClampedArray, prev: Uint8ClampedArray) {
        const pixelCount = SAMPLE_WIDTH * SAMPLE_HEIGHT;
        let totalDiff = 0;
        let diffBuffer = new Float32Array(pixelCount);

        for (let i = 0; i < pixelCount; i++) {
            const idx = i * 4;
            const rDiff = Math.abs(current[idx] - prev[idx]);
            const gDiff = Math.abs(current[idx + 1] - prev[idx + 1]);
            const bDiff = Math.abs(current[idx + 2] - prev[idx + 2]);
            const pixelDiff = (rDiff + gDiff + bDiff) / 3;
            diffBuffer[i] = pixelDiff;
            totalDiff += pixelDiff;
        }

        this.lastMotionLevel = Math.round((totalDiff / pixelCount / 255) * 100 * 10);
        if (this.lastMotionLevel > 100) this.lastMotionLevel = 100;

        let leftMotion = 0, rightMotion = 0, topMotion = 0, bottomMotion = 0;
        const halfW = SAMPLE_WIDTH / 2;
        const halfH = SAMPLE_HEIGHT / 2;

        for (let y = 0; y < SAMPLE_HEIGHT; y++) {
            for (let x = 0; x < SAMPLE_WIDTH; x++) {
                const val = diffBuffer[y * SAMPLE_WIDTH + x];
                if (x < halfW) leftMotion += val; else rightMotion += val;
                if (y < halfH) topMotion += val; else bottomMotion += val;
            }
        }

        const dx = rightMotion - leftMotion;
        const dy = topMotion - bottomMotion;
        this.lastDirection = Math.round(((Math.atan2(dy, dx) * 180 / Math.PI) + 360) % 360);
    }

    isMotionDetected(): boolean {
        return this.lastMotionLevel >= this._sensitivity;
    }

    getMotionLevel(): number {
        return this.lastMotionLevel;
    }

    getDirection(): number {
        return this.lastDirection;
    }

    isEnabled(): boolean {
        return this._enabled;
    }

    destroy() {
        this.stop();
        this.canvas = null;
        this.ctx = null;
        this.prevFrame = null;
    }
}
