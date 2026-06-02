import { Extension, ExtensionInfo } from '../core/Extension';
import { SpeechRecognitionRuntime } from './runtime';

export class SpeechRecognitionExtension extends Extension {
    private runtime: SpeechRecognitionRuntime;

    constructor(runtime?: SpeechRecognitionRuntime) {
        super(runtime);
        this.runtime = runtime || new SpeechRecognitionRuntime();
    }

    getInfo(): ExtensionInfo {
        return {
            id: 'speech_recognition',
            name: 'Speech Recognition',
            color1: '#7b5ea7',
            blocks: [
                { opcode: 'speech_start_listening', blockType: 'command', text: 'start listening' },
                { opcode: 'speech_stop_listening', blockType: 'command', text: 'stop listening' },
                { opcode: 'speech_set_language', blockType: 'command', text: 'set speech language to [LANGUAGE]', arguments: { LANGUAGE: { type: 'string', defaultValue: 'en-US' } } },
                { opcode: 'speech_get_last_result', blockType: 'reporter', text: 'last speech result' },
                { opcode: 'speech_get_confidence', blockType: 'reporter', text: 'speech confidence' },
                { opcode: 'speech_is_listening', blockType: 'Boolean', text: 'is listening' },
                { opcode: 'speech_on_result', blockType: 'command', text: 'when speech recognized' },
            ]
        };
    }

    speech_start_listening() { this.runtime.startListening(); }
    speech_stop_listening() { this.runtime.stopListening(); }
    speech_set_language(language: string) { this.runtime.setLanguage(language); }
    speech_get_last_result() { return this.runtime.getLastResult(); }
    speech_get_confidence() { return this.runtime.getConfidence(); }
    speech_is_listening() { return this.runtime.isListening(); }
    speech_on_result() {}
}

export const speechRecognitionExtension = new SpeechRecognitionExtension();
export { SpeechRecognitionRuntime } from './runtime';
