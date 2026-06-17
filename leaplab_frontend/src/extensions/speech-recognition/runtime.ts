export class SpeechRecognitionRuntime {
    private recognition: any = null;
    private _isListening = false;
    private _lastResult = '';
    private _confidence = 0;
    private _language = 'en-US';
    private _resultCallbacks: Array<(text: string, confidence: number) => void> = [];

    constructor() {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
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
                    this._resultCallbacks.forEach(cb => cb(this._lastResult, this._confidence));
                }
            };

            this.recognition.onerror = (event: any) => {
                console.warn('[SpeechRecognition] Error:', event.error);
                if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
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
        try {
            this.recognition.lang = this._language;
            this.recognition.start();
            this._isListening = true;
        } catch (e) {
            console.warn('[SpeechRecognition] Failed to start:', e);
        }
    }

    stopListening() {
        if (!this.recognition) return;
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
