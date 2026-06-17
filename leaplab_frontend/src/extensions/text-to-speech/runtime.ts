export class TTSRuntime {
    private synth: SpeechSynthesis;
    private currentVoice: SpeechSynthesisVoice | null = null;
    private _rate = 1;
    private _volume = 1;
    private _pitch = 1;
    private _speaking = false;
    private voicesLoaded = false;

    constructor() {
        this.synth = window.speechSynthesis || null as any;
        if (this.synth) {
            this._loadVoices();
            this.synth.onvoiceschanged = () => this._loadVoices();
        }
    }

    private _loadVoices() {
        if (!this.synth) return;
        const voices = this.synth.getVoices();
        if (voices.length > 0 && !this.voicesLoaded) {
            this.voicesLoaded = true;
            if (!this.currentVoice) {
                this.currentVoice = voices.find(v => v.lang.startsWith('en')) || voices[0] || null;
            }
        }
    }

    speak(message: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.synth) {
                console.warn('[TTS] Speech synthesis not available');
                resolve();
                return;
            }
            this.synth.cancel();
            const utterance = new SpeechSynthesisUtterance(String(message));
            if (this.currentVoice) utterance.voice = this.currentVoice;
            utterance.rate = this._rate;
            utterance.volume = this._volume;
            utterance.pitch = this._pitch;
            utterance.onstart = () => { this._speaking = true; };
            utterance.onend = () => { this._speaking = false; resolve(); };
            utterance.onerror = (e: SpeechSynthesisErrorEvent) => {
                this._speaking = false;
                if (e.error === 'canceled') { resolve(); } else { reject(e); }
            };
            this.synth.speak(utterance);
        });
    }

    setVoice(voiceName: string) {
        if (!this.synth) return;
        const voices = this.synth.getVoices();
        const match = voices.find(v => v.name === voiceName || v.lang === voiceName);
        if (match) this.currentVoice = match;
    }

    setRate(rate: number) { this._rate = Math.max(0.1, Math.min(10, Number(rate) || 1)); }
    setVolume(volume: number) { this._volume = Math.max(0, Math.min(1, Number(volume) || 1)); }
    setPitch(pitch: number) { this._pitch = Math.max(0, Math.min(2, Number(pitch) || 1)); }

    stop() { if (this.synth) this.synth.cancel(); this._speaking = false; }
    isSpeaking(): boolean { return this._speaking; }
    getVoices(): string[] {
        if (!this.synth) return [];
        return this.synth.getVoices().map(v => v.name);
    }
    getRate(): number { return this._rate; }
    getVolume(): number { return this._volume; }
    getPitch(): number { return this._pitch; }
}
