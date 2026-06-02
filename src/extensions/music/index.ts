import { Extension, ExtensionInfo } from '../core/Extension';
import { MusicRuntime } from './runtime';

export class MusicExtension extends Extension {
    private runtime: MusicRuntime;

    constructor(runtime?: MusicRuntime) {
        super(runtime);
        this.runtime = runtime || new MusicRuntime();
    }

    getInfo(): ExtensionInfo {
        return {
            id: 'music',
            name: 'Music',
            color1: '#c62828',
            blocks: [
                { opcode: 'music_play_note', blockType: 'command', text: 'play note [NOTE] for [BEATS] beats', arguments: { NOTE: { type: 'number', defaultValue: 60 }, BEATS: { type: 'number', defaultValue: 0.25 } } },
                { opcode: 'music_set_instrument', blockType: 'command', text: 'set instrument [INST]', arguments: { INST: { type: 'number', defaultValue: 1 } } },
                { opcode: 'music_play_drum', blockType: 'command', text: 'play drum [DRUM] for [BEATS] beats', arguments: { DRUM: { type: 'number', defaultValue: 1 }, BEATS: { type: 'number', defaultValue: 0.25 } } },
                { opcode: 'music_set_tempo', blockType: 'command', text: 'set tempo [BPM] bpm', arguments: { BPM: { type: 'number', defaultValue: 60 } } },
                { opcode: 'music_change_tempo', blockType: 'command', text: 'change tempo by [AMOUNT]', arguments: { AMOUNT: { type: 'number', defaultValue: 20 } } },
                { opcode: 'music_get_tempo', blockType: 'reporter', text: 'tempo' },
                { opcode: 'music_rest', blockType: 'command', text: 'rest for [BEATS] beats', arguments: { BEATS: { type: 'number', defaultValue: 0.25 } } },
            ]
        };
    }

    music_play_note(note: number, beats: number) { this.runtime.playNote(note, beats); }
    music_set_instrument(inst: number) { this.runtime.setInstrument(inst); }
    music_play_drum(drum: number, beats: number) { this.runtime.playDrum(drum, beats); }
    music_set_tempo(bpm: number) { this.runtime.setTempo(bpm); }
    music_change_tempo(amount: number) { this.runtime.changeTempoBy(amount); }
    music_get_tempo() { return this.runtime.getTempo(); }
    music_rest(beats: number) { this.runtime.rest(beats); }
}

export const musicExtension = new MusicExtension();
export { MusicRuntime } from './runtime';
