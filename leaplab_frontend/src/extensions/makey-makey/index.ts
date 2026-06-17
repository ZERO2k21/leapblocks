import { Extension, ExtensionInfo } from '../core/Extension';
import { MakeyMakeyRuntime } from './runtime';

export class MakeyMakeyExtension extends Extension {
    private runtime: MakeyMakeyRuntime;

    constructor(runtime?: MakeyMakeyRuntime) {
        super(runtime);
        this.runtime = runtime || new MakeyMakeyRuntime();
    }

    getInfo(): ExtensionInfo {
        return {
            id: 'makey_makey',
            name: 'Makey Makey',
            color1: '#00897B',
            blocks: [
                { opcode: 'makey_on_key', blockType: 'hat', text: 'when makey makey [KEY] pressed', arguments: { KEY: { type: 'dropdown', defaultValue: 'UP', menu: [['up', 'UP'], ['down', 'DOWN'], ['left', 'LEFT'], ['right', 'RIGHT'], ['space', 'SPACE'], ['click', 'CLICK'], ['w', 'W'], ['a', 'A'], ['s', 'S'], ['d', 'D']] } } },
                { opcode: 'makey_set_key', blockType: 'command', text: 'map makey makey [SIGNAL] to key [KEY]', arguments: { SIGNAL: { type: 'dropdown', defaultValue: 'UP', menu: [['up', 'UP'], ['down', 'DOWN'], ['left', 'LEFT'], ['right', 'RIGHT'], ['space', 'SPACE'], ['click', 'CLICK'], ['w', 'W'], ['a', 'A'], ['s', 'S'], ['d', 'D']] }, KEY: { type: 'string', defaultValue: 'space' } } },
                { opcode: 'makey_get_key', blockType: 'reporter', returnType: 'String', text: 'makey makey last key' },
            ]
        };
    }

    makey_on_key() {}
    makey_set_key(signal: string, key: string) { this.runtime.setKeyMap(signal, key); }
    makey_get_key() { return this.runtime.getLastKey(); }
}

export const makeyMakeyExtension = new MakeyMakeyExtension();
export { MakeyMakeyRuntime } from './runtime';
