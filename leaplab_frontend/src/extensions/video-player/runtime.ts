// Video Player Runtime - HTML5 video playback controls
// Handles source loading, playback, volume, speed, position, and loop

export class VideoPlayerRuntime {
    private videoEl: HTMLVideoElement | null = null;
    private containerEl: HTMLDivElement | null = null;
    private _loop = false;
    private _isShowing = false;

    setVideoElement(video: HTMLVideoElement | null, container?: HTMLDivElement | null) {
        this.videoEl = video;
        if (container) this.containerEl = container;
        if (video) video.loop = this._loop;
    }

    private ensureVideo(): HTMLVideoElement | null {
        if (this.videoEl) return this.videoEl;
        if (typeof document !== 'undefined') {
            const container = document.getElementById('video-playback-container');
            const video = document.getElementById('video-playback') as HTMLVideoElement;
            if (video) {
                this.videoEl = video;
                this.containerEl = container as HTMLDivElement;
                video.loop = this._loop;
                return video;
            }
        }
        return null;
    }

    setSource(url: string) {
        const video = this.ensureVideo();
        if (!video) return;
        video.src = url;
        video.load();
    }

    play() {
        const video = this.ensureVideo();
        if (!video) return;
        video.play().catch(() => {});
    }

    pause() {
        const video = this.ensureVideo();
        if (!video) return;
        video.pause();
    }

    stop() {
        const video = this.ensureVideo();
        if (!video) return;
        video.pause();
        video.currentTime = 0;
    }

    show() {
        this._isShowing = true;
        if (this.containerEl) this.containerEl.style.display = 'block';
    }

    hide() {
        this._isShowing = false;
        if (this.containerEl) this.containerEl.style.display = 'none';
    }

    setSpeed(speed: number) {
        const video = this.ensureVideo();
        if (!video) return;
        video.playbackRate = Math.max(0.25, Math.min(4, speed));
    }

    setVolume(percent: number) {
        const video = this.ensureVideo();
        if (!video) return;
        video.volume = Math.max(0, Math.min(1, percent / 100));
    }

    seek(timeSec: number) {
        const video = this.ensureVideo();
        if (!video) return;
        video.currentTime = Math.max(0, Math.min(video.duration || 0, timeSec));
    }

    setLoop(enabled: boolean) {
        this._loop = enabled;
        if (this.videoEl) this.videoEl.loop = enabled;
    }

    setPosition(xPercent: number, yPercent: number, sizePercent: number) {
        if (!this.containerEl) return;
        this.containerEl.style.left = `${xPercent}%`;
        this.containerEl.style.top = `${yPercent}%`;
        this.containerEl.style.width = `${sizePercent}%`;
        this.containerEl.style.height = `${sizePercent}%`;
        this.containerEl.style.transform = 'translate(-50%, -50%)';
    }

    getCurrentTime(): number {
        return this.videoEl?.currentTime ?? 0;
    }

    getDuration(): number {
        return this.videoEl?.duration ?? 0;
    }

    isPlaying(): boolean {
        return this.videoEl ? !this.videoEl.paused && !this.videoEl.ended : false;
    }

    isLoaded(): boolean {
        return this.videoEl ? this.videoEl.readyState >= 2 : false;
    }

    getPercent(): number {
        if (!this.videoEl || !this.videoEl.duration) return 0;
        return (this.videoEl.currentTime / this.videoEl.duration) * 100;
    }

    getSource(): string {
        return this.videoEl?.src ?? '';
    }

    destroy() {
        this.videoEl = null;
        this.containerEl = null;
    }
}
