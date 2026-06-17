import { Extension, ExtensionInfo } from '../core/Extension';
import { TTSRuntime } from './runtime';

export class TextToSpeechExtension extends Extension {
    private runtime: TTSRuntime;

    constructor(runtime?: TTSRuntime) {
        super(runtime);
        this.runtime = runtime || new TTSRuntime();
    }

    getInfo(): ExtensionInfo {
        return {
            id: 'text_to_speech',
            name: 'Text to Speech',
            color1: '#4a90d9',
            blocks: [
                { opcode: 'tts_speak', blockType: 'command', text: 'speak [MESSAGE]', arguments: { MESSAGE: { type: 'string', defaultValue: 'Hello world' } } },
                { opcode: 'tts_set_voice', blockType: 'command', text: 'set voice to [VOICE]', arguments: { VOICE: { type: 'string', defaultValue: '' } } },
                { opcode: 'tts_set_rate', blockType: 'command', text: 'set speech rate to [RATE]', arguments: { RATE: { type: 'number', defaultValue: 1 } } },
                { opcode: 'tts_set_volume', blockType: 'command', text: 'set speech volume to [VOLUME]', arguments: { VOLUME: { type: 'number', defaultValue: 1 } } },
                { opcode: 'tts_set_pitch', blockType: 'command', text: 'set speech pitch to [PITCH]', arguments: { PITCH: { type: 'number', defaultValue: 1 } } },
                { opcode: 'tts_stop', blockType: 'command', text: 'stop speaking' },
                { opcode: 'tts_is_speaking', blockType: 'Boolean', text: 'is speaking' },
                { opcode: 'tts_get_rate', blockType: 'reporter', text: 'speech rate' },
                { opcode: 'tts_get_volume', blockType: 'reporter', text: 'speech volume' },
            ]
        };
    }

    tts_speak(message: string) { return this.runtime.speak(message); }
    tts_set_voice(voice: string) { this.runtime.setVoice(voice); }
    tts_set_rate(rate: number) { this.runtime.setRate(rate); }
    tts_set_volume(volume: number) { this.runtime.setVolume(volume); }
    tts_set_pitch(pitch: number) { this.runtime.setPitch(pitch); }
    tts_stop() { this.runtime.stop(); }
    tts_is_speaking() { return this.runtime.isSpeaking(); }
    tts_get_rate() { return this.runtime.getRate(); }
    tts_get_volume() { return this.runtime.getVolume(); }
}

export const textToSpeechExtension = new TextToSpeechExtension();
export { TTSRuntime } from './runtime';
