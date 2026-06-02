import { Extension, ExtensionInfo } from '../core/Extension';
import { OCRRuntime } from './runtime';

export class TextRecognitionExtension extends Extension {
    private runtime: OCRRuntime;

    constructor(runtime?: OCRRuntime) {
        super(runtime);
        this.runtime = runtime || new OCRRuntime();
    }

    getInfo(): ExtensionInfo {
        return {
            id: 'text_recognition',
            name: 'Text Recognition',
            color1: '#2196F3',
            blocks: [
                { opcode: 'ocr_from_camera', blockType: 'command', text: 'capture text from camera' },
                { opcode: 'ocr_from_image', blockType: 'command', text: 'capture text from image [SOURCE]', arguments: { SOURCE: { type: 'dropdown', defaultValue: 'uploaded', menu: [['uploaded image', 'uploaded'], ['stage backdrop', 'backdrop'], ['url', 'url']] } } },
                { opcode: 'ocr_get_text', blockType: 'reporter', text: 'recognized text' },
                { opcode: 'ocr_get_word_count', blockType: 'reporter', text: 'word count' },
                { opcode: 'ocr_contains', blockType: 'Boolean', text: 'text contains [PHRASE]', arguments: { PHRASE: { type: 'string', defaultValue: 'hello' } } },
            ]
        };
    }

    ocr_from_camera() { return this.runtime.recognizeFromCamera(); }
    ocr_from_image(source: string) { return this.runtime.recognizeFromImage(source); }
    ocr_get_text() { return this.runtime.getLastResult(); }
    ocr_get_word_count() { return this.runtime.getWordCount(); }
    ocr_contains(phrase: string) { return this.runtime.contains(phrase); }
}

export const textRecognitionExtension = new TextRecognitionExtension();
export { OCRRuntime } from './runtime';
