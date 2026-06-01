// SpeechRecognition.ts - Speech Recognition blocks using Web Speech API

import Blockly from '@blockly-runtime';
import type { ExtensionCategory } from './ExtensionManager';

// Block definitions
export const speechRecognitionBlocks = [
    {
        type: 'speech_start_listening',
        message0: 'start listening',
        previousStatement: null,
        nextStatement: null,
        colour: '#7b5ea7',
        tooltip: 'Start listening for speech input',
        helpUrl: ''
    },
    {
        type: 'speech_stop_listening',
        message0: 'stop listening',
        previousStatement: null,
        nextStatement: null,
        colour: '#7b5ea7',
        tooltip: 'Stop listening for speech input',
        helpUrl: ''
    },
    {
        type: 'speech_set_language',
        message0: 'set speech language to %1',
        args0: [{ type: 'field_input', name: 'LANGUAGE', text: 'en-US' }],
        previousStatement: null,
        nextStatement: null,
        colour: '#7b5ea7',
        tooltip: 'Set the recognition language (e.g. en-US, es-ES, fr-FR)',
        helpUrl: ''
    },
    {
        type: 'speech_get_last_result',
        message0: 'last speech result',
        output: 'String',
        colour: '#5e4299',
        tooltip: 'Get the last recognized speech text',
        helpUrl: ''
    },
    {
        type: 'speech_get_confidence',
        message0: 'speech confidence',
        output: 'Number',
        colour: '#5e4299',
        tooltip: 'Get the confidence of the last recognition (0-100)',
        helpUrl: ''
    },
    {
        type: 'speech_is_listening',
        message0: 'is listening',
        output: 'Boolean',
        colour: '#5e4299',
        tooltip: 'Returns true if speech recognition is active',
        helpUrl: ''
    },
    {
        type: 'speech_on_result',
        message0: 'when speech recognized %1',
        args0: [{ type: 'input_statement', name: 'BODY' }],
        previousStatement: null,
        nextStatement: null,
        colour: '#7b5ea7',
        tooltip: 'Event: triggered when speech is recognized',
        helpUrl: ''
    }
];

// Runtime implementation
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

// Register blocks
export function registerSpeechRecognitionBlocks() {
    const newBlocks = speechRecognitionBlocks.filter(block => !Blockly.Blocks[block.type]);
    if (newBlocks.length > 0) {
        Blockly.common.defineBlocks(Blockly.common.createBlockDefinitionsFromJsonArray(newBlocks));
    }
}

// JavaScript generators
export function registerSpeechRecognitionGenerators() {
    const jsGen = (window as any).Blockly?.JavaScript;
    if (!jsGen) return;

    jsGen['speech_start_listening'] = () =>
        'if(window.runtime?.speech) window.runtime.speech.startListening();\n';
    jsGen['speech_stop_listening'] = () =>
        'if(window.runtime?.speech) window.runtime.speech.stopListening();\n';
    jsGen['speech_set_language'] = (block: any) => {
        const lang = block.getFieldValue('LANGUAGE') || 'en-US';
        return `if(window.runtime?.speech) window.runtime.speech.setLanguage('${lang.replace(/'/g, "\\'")}');\n`;
    };
    jsGen['speech_get_last_result'] = () =>
        ['window.runtime?.speech?.getLastResult()||""', 0];
    jsGen['speech_get_confidence'] = () =>
        ['window.runtime?.speech?.getConfidence()||0', 0];
    jsGen['speech_is_listening'] = () =>
        ['window.runtime?.speech?.isListening()||false', 0];
    jsGen['speech_on_result'] = (block: any) => {
        const body = jsGen.statementToCode(block, 'BODY');
        return `if(window.runtime?.speech){window.runtime.speech.onResult((_sr_text, _sr_conf)=>{${body}});}\n`;
    };
}

// Extension configuration
export const speechRecognitionExtension: ExtensionCategory = {
    id: 'speech_recognition',
    name: 'Speech Recognition',
    colour: '#7b5ea7',
    icon: '🎤',
    blocks: speechRecognitionBlocks.map(block => ({
        kind: 'block',
        type: block.type
    }))
};
