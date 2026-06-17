export class OCRRuntime {
    private worker: any = null;
    private workerReady = false;
    private workerLoading = false;
    private lastResult = '';
    private lastConfidence = 0;
    private isProcessing = false;
    private videoEl: HTMLVideoElement | null = null;
    private canvas: HTMLCanvasElement | null = null;
    private cameraStream: MediaStream | null = null;
    private cameraStarted = false;

    setVideoElement(video: HTMLVideoElement | null) {
        this.videoEl = video;
    }

    private async ensureCamera(): Promise<boolean> {
        if (this.videoEl && this.videoEl.readyState >= 2 && this.cameraStarted) {
            return true;
        }

        try {
            if (!this.cameraStream) {
                this.cameraStream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 640, height: 480, facingMode: 'environment' }
                });
            }

            if (this.videoEl) {
                if (!this.videoEl.srcObject) {
                    this.videoEl.srcObject = this.cameraStream;
                }
                await this.videoEl.play();
                this.cameraStarted = true;

                await new Promise<void>((resolve) => {
                    const checkReady = () => {
                        if (this.videoEl && this.videoEl.readyState >= 2) {
                            resolve();
                        } else {
                            requestAnimationFrame(checkReady);
                        }
                    };
                    checkReady();
                });

                return true;
            } else {
                const video = document.createElement('video');
                video.srcObject = this.cameraStream;
                video.autoplay = true;
                video.playsInline = true;
                video.style.position = 'fixed';
                video.style.top = '0';
                video.style.left = '0';
                video.style.width = '1px';
                video.style.height = '1px';
                video.style.opacity = '0.01';
                video.style.pointerEvents = 'none';
                document.body.appendChild(video);
                await video.play();
                this.videoEl = video;
                this.cameraStarted = true;

                await new Promise<void>((resolve) => {
                    const checkReady = () => {
                        if (video.readyState >= 2) {
                            resolve();
                        } else {
                            requestAnimationFrame(checkReady);
                        }
                    };
                    checkReady();
                });

                return true;
            }
        } catch (err: any) {
            console.error('[OCR] Failed to start camera:', err.message);
            return false;
        }
    }

    private async ensureWorker(): Promise<boolean> {
        if (this.workerReady && this.worker) return true;
        if (this.workerLoading) {
            return new Promise((resolve) => {
                const check = setInterval(() => {
                    if (this.workerReady) { clearInterval(check); resolve(true); }
                    if (!this.workerLoading) { clearInterval(check); resolve(false); }
                }, 100);
            });
        }

        this.workerLoading = true;
        try {
            const Tesseract = await import('tesseract.js');
            this.worker = await Tesseract.createWorker('eng', 1, {
                logger: (m: any) => {
                    if (m.status === 'recognizing text') {
                        console.log(`[OCR] Progress: ${Math.round((m.progress || 0) * 100)}%`);
                    }
                }
            });
            this.workerReady = true;
            console.log('[OCR] Tesseract.js worker ready');
            return true;
        } catch (err) {
            console.warn('[OCR] Tesseract.js not available, OCR will return empty results:', err);
            this.workerLoading = false;
            return false;
        }
    }

    private getCanvas(): HTMLCanvasElement {
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
        }
        return this.canvas;
    }

    private captureFrameFromVideo(): string | null {
        if (!this.videoEl || this.videoEl.readyState < 2) return null;
        const canvas = this.getCanvas();
        canvas.width = this.videoEl.videoWidth || 640;
        canvas.height = this.videoEl.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        ctx.drawImage(this.videoEl, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/png');
    }

    async recognizeFromCamera(): Promise<string> {
        if (this.isProcessing) return this.lastResult;
        this.isProcessing = true;
        try {
            const cameraReady = await this.ensureCamera();
            if (!cameraReady) {
                console.warn('[OCR] Camera not available');
                this.lastResult = '';
                this.lastConfidence = 0;
                return '';
            }

            const imageData = this.captureFrameFromVideo();
            if (!imageData) {
                console.warn('[OCR] No camera frame available');
                this.lastResult = '';
                this.lastConfidence = 0;
                return '';
            }
            return await this._recognizeImage(imageData);
        } finally {
            this.isProcessing = false;
        }
    }

    async recognizeFromImage(source: string): Promise<string> {
        if (this.isProcessing) return this.lastResult;
        this.isProcessing = true;
        try {
            if (source === 'uploaded' || source === 'backdrop') {
                const stageCanvas = document.querySelector('canvas') as HTMLCanvasElement;
                if (stageCanvas) {
                    const imageData = stageCanvas.toDataURL('image/png');
                    return await this._recognizeImage(imageData);
                }
            } else if (source === 'url') {
                const img = document.querySelector('#stage img') as HTMLImageElement;
                if (img) {
                    return await this._recognizeImage(img.src);
                }
            }
            console.warn('[OCR] No image source available');
            this.lastResult = '';
            this.lastConfidence = 0;
            return '';
        } finally {
            this.isProcessing = false;
        }
    }

    private async _recognizeImage(imageSource: string): Promise<string> {
        const ready = await this.ensureWorker();
        if (!ready || !this.worker) {
            this.lastResult = '';
            this.lastConfidence = 0;
            return '';
        }

        try {
            const result = await this.worker.recognize(imageSource);
            this.lastResult = (result.data.text || '').trim();
            this.lastConfidence = Math.round(result.data.confidence || 0);
            console.log(`[OCR] Recognized: "${this.lastResult}" (confidence: ${this.lastConfidence}%)`);
            return this.lastResult;
        } catch (err) {
            console.error('[OCR] Recognition failed:', err);
            this.lastResult = '';
            this.lastConfidence = 0;
            return '';
        }
    }

    getLastResult(): string { return this.lastResult; }
    getConfidence(): number { return this.lastConfidence; }
    getWordCount(): number {
        if (!this.lastResult) return 0;
        return this.lastResult.split(/\s+/).filter(w => w.length > 0).length;
    }
    contains(phrase: string): boolean {
        if (!this.lastResult || !phrase) return false;
        return this.lastResult.toLowerCase().includes(phrase.toLowerCase());
    }
    getIsProcessing(): boolean { return this.isProcessing; }

    cameraOff(): void {
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
            this.cameraStream = null;
        }
        this.cameraStarted = false;
        console.log('[OCR] Camera stopped');
    }

    destroy(): void {
        this.cameraOff();
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
            this.workerReady = false;
        }
    }
}
