export class SpeechRecognitionRuntime {
    private recognition: any = null;
    private _isListening = false;
    private _lastResult = '';
    private _confidence = 0;
    private _language = 'en-US';
    private _resultCallbacks: Array<(text: string, confidence: number) => void> = [];
    private _retryTimeout: ReturnType<typeof setTimeout> | null = null;
    private _lastStartTime = 0;
    private static readonly MIN_START_INTERVAL = 500;
    private static readonly RETRY_DELAY = 1000;
    private static readonly MAX_RETRIES = 3;
    private _retryCount = 0;

    constructor() {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const isSecure = window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
            if (!isSecure) {
                console.warn('[SpeechRecognition] WARNING: Page is NOT secure (HTTP). Web Speech API requires HTTPS or localhost. Speech recognition may fail with "network" error.');
                console.warn('[SpeechRecognition] Current URL:', location.href);
            }
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = false;
            this.recognition.lang = this._language;

            this.recognition.onresult = (event: any) => {
                let finalText = '';
                let lastConfidence = 0;
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    if (event.results[i].isFinal) {
                        finalText += event.results[i][0].transcript;
                        lastConfidence = event.results[i][0].confidence;
                    }
                }
                if (finalText) {
                    this._lastResult = finalText.trim();
                    this._confidence = Math.round(lastConfidence * 100);
                    this._retryCount = 0;
                    this._resultCallbacks.forEach(cb => cb(this._lastResult, this._confidence));
                }
            };

            this.recognition.onerror = (event: any) => {
                console.warn('[SpeechRecognition] Error:', event.error);
                if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                    this._isListening = false;
                    this._retryCount = 0;
                } else if (event.error === 'network') {
                    this._isListening = false;
                    if (this._retryCount < SpeechRecognitionRuntime.MAX_RETRIES) {
                        this._retryCount++;
                        console.info(`[SpeechRecognition] Retrying in ${SpeechRecognitionRuntime.RETRY_DELAY}ms (attempt ${this._retryCount}/${SpeechRecognitionRuntime.MAX_RETRIES})`);
                        this._retryTimeout = setTimeout(() => {
                            this._retryTimeout = null;
                            this.startListening();
                        }, SpeechRecognitionRuntime.RETRY_DELAY);
                    } else {
                        console.warn('[SpeechRecognition] Max retries reached for network error');
                        this._retryCount = 0;
                    }
                } else if (event.error === 'aborted') {
                    this._isListening = false;
                }
            };

            this.recognition.onend = () => {
                this._isListening = false;
            };
        }
    }

    isAvailable(): boolean {
        return this.recognition !== null;
    }

    startListening() {
        if (!this.recognition) {
            console.warn('[SpeechRecognition] Not available in this browser');
            return;
        }
        if (this._isListening) return;
        const now = Date.now();
        if (now - this._lastStartTime < SpeechRecognitionRuntime.MIN_START_INTERVAL) return;
        try {
            this.recognition.lang = this._language;
            this.recognition.start();
            this._isListening = true;
            this._lastStartTime = now;
        } catch (e) {
            console.warn('[SpeechRecognition] Failed to start:', e);
        }
    }

    stopListening() {
        if (!this.recognition) return;
        if (this._retryTimeout) {
            clearTimeout(this._retryTimeout);
            this._retryTimeout = null;
        }
        this._retryCount = 0;
        try {
            this.recognition.stop();
        } catch (e) { /* ignore */ }
        this._isListening = false;
    }

    setLanguage(lang: string) {
        this._language = lang;
        if (this.recognition) {
            this.recognition.lang = lang;
        }
    }

    isListening(): boolean { return this._isListening; }
    getLastResult(): string { return this._lastResult; }
    getConfidence(): number { return this._confidence; }
    getLanguage(): string { return this._language; }

    onResult(callback: (text: string, confidence: number) => void) {
        this._resultCallbacks.push(callback);
    }

    removeResultCallback(callback: (text: string, confidence: number) => void) {
        this._resultCallbacks = this._resultCallbacks.filter(cb => cb !== callback);
    }
}
