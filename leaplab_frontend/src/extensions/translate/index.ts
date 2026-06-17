import { Extension, ExtensionInfo } from '../core/Extension';
import { TranslateRuntime } from './runtime';

export class TranslateExtension extends Extension {
    private runtime: TranslateRuntime;

    constructor(runtime?: TranslateRuntime) {
        super(runtime);
        this.runtime = runtime || new TranslateRuntime();
    }

    getInfo(): ExtensionInfo {
        return {
            id: 'translate',
            name: 'Translate',
            color1: '#1976D2',
            blocks: [
                { opcode: 'translate_text', blockType: 'command', text: 'translate [TEXT] to [TARGET_LANG]', arguments: { TEXT: { type: 'string', defaultValue: 'Hello' }, TARGET_LANG: { type: 'dropdown', defaultValue: 'en', menu: [['English', 'en'], ['Spanish', 'es'], ['French', 'fr'], ['German', 'de'], ['Italian', 'it'], ['Portuguese', 'pt'], ['Russian', 'ru'], ['Japanese', 'ja'], ['Chinese (Simplified)', 'zh-CN'], ['Korean', 'ko'], ['Arabic', 'ar'], ['Hindi', 'hi'], ['Dutch', 'nl'], ['Swedish', 'sv'], ['Turkish', 'tr'], ['Polish', 'pl'], ['Thai', 'th'], ['Vietnamese', 'vi'], ['Indonesian', 'id'], ['Greek', 'el']] } } },
                { opcode: 'translate_set_source', blockType: 'command', text: 'set source language to [SOURCE_LANG]', arguments: { SOURCE_LANG: { type: 'dropdown', defaultValue: 'auto', menu: [['Auto Detect', 'auto'], ['English', 'en'], ['Spanish', 'es'], ['French', 'fr'], ['German', 'de'], ['Italian', 'it'], ['Portuguese', 'pt'], ['Russian', 'ru'], ['Japanese', 'ja'], ['Chinese (Simplified)', 'zh-CN'], ['Korean', 'ko'], ['Arabic', 'ar'], ['Hindi', 'hi'], ['Dutch', 'nl'], ['Swedish', 'sv'], ['Turkish', 'tr'], ['Polish', 'pl'], ['Thai', 'th'], ['Vietnamese', 'vi'], ['Indonesian', 'id']] } } },
                { opcode: 'translate_set_target', blockType: 'command', text: 'set target language to [TARGET_LANG]', arguments: { TARGET_LANG: { type: 'dropdown', defaultValue: 'en', menu: [['English', 'en'], ['Spanish', 'es'], ['French', 'fr'], ['German', 'de'], ['Italian', 'it'], ['Portuguese', 'pt'], ['Russian', 'ru'], ['Japanese', 'ja'], ['Chinese (Simplified)', 'zh-CN'], ['Korean', 'ko'], ['Arabic', 'ar'], ['Hindi', 'hi'], ['Dutch', 'nl'], ['Swedish', 'sv'], ['Turkish', 'tr'], ['Polish', 'pl'], ['Thai', 'th'], ['Vietnamese', 'vi'], ['Indonesian', 'id']] } } },
                { opcode: 'translate_last_result', blockType: 'reporter', returnType: 'String', text: 'last translation' },
            ]
        };
    }

    translate_text(text: string, targetLang: string) { return this.runtime.translate(text, targetLang); }
    translate_set_source(sourceLang: string) { this.runtime.setSourceLanguage(sourceLang); }
    translate_set_target(targetLang: string) { this.runtime.setTargetLanguage(targetLang); }
    translate_last_result() { return this.runtime.getLastResult(); }
}

export const translateExtension = new TranslateExtension();
export { TranslateRuntime } from './runtime';
