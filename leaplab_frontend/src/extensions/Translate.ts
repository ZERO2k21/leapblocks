// Translate.ts - Text translation blocks using MyMemory API (free, no key required)

import Blockly from '@blockly-runtime';
import type { ExtensionCategory } from './ExtensionManager';

// Block definitions
export const translateBlocks = [
    {
        type: 'translate_text',
        message0: 'translate %1 to %2',
        args0: [
            { type: 'field_input', name: 'TEXT', text: 'Hello' },
            {
                type: 'field_dropdown',
                name: 'TARGET_LANG',
                options: [
                    ['English', 'en'],
                    ['Spanish', 'es'],
                    ['French', 'fr'],
                    ['German', 'de'],
                    ['Italian', 'it'],
                    ['Portuguese', 'pt'],
                    ['Russian', 'ru'],
                    ['Japanese', 'ja'],
                    ['Chinese (Simplified)', 'zh-CN'],
                    ['Korean', 'ko'],
                    ['Arabic', 'ar'],
                    ['Hindi', 'hi'],
                    ['Dutch', 'nl'],
                    ['Swedish', 'sv'],
                    ['Turkish', 'tr'],
                    ['Polish', 'pl'],
                    ['Thai', 'th'],
                    ['Vietnamese', 'vi'],
                    ['Indonesian', 'id'],
                    ['Greek', 'el'],
                    ['Czech', 'cs'],
                    ['Romanian', 'ro'],
                    ['Hungarian', 'hu'],
                    ['Finnish', 'fi'],
                    ['Danish', 'da'],
                    ['Norwegian', 'no'],
                    ['Ukrainian', 'uk'],
                    ['Bengali', 'bn'],
                    ['Tamil', 'ta'],
                    ['Telugu', 'te']
                ]
            }
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#1976D2',
        tooltip: 'Translate the given text to the target language',
        helpUrl: ''
    },
    {
        type: 'translate_set_source',
        message0: 'set source language to %1',
        args0: [{
            type: 'field_dropdown',
            name: 'SOURCE_LANG',
            options: [
                ['Auto Detect', 'auto'],
                ['English', 'en'],
                ['Spanish', 'es'],
                ['French', 'fr'],
                ['German', 'de'],
                ['Italian', 'it'],
                ['Portuguese', 'pt'],
                ['Russian', 'ru'],
                ['Japanese', 'ja'],
                ['Chinese (Simplified)', 'zh-CN'],
                ['Korean', 'ko'],
                ['Arabic', 'ar'],
                ['Hindi', 'hi'],
                ['Dutch', 'nl'],
                ['Swedish', 'sv'],
                ['Turkish', 'tr'],
                ['Polish', 'pl'],
                ['Thai', 'th'],
                ['Vietnamese', 'vi'],
                ['Indonesian', 'id']
            ]
        }],
        previousStatement: null,
        nextStatement: null,
        colour: '#1976D2',
        tooltip: 'Set the source language for translation',
        helpUrl: ''
    },
    {
        type: 'translate_set_target',
        message0: 'set target language to %1',
        args0: [{
            type: 'field_dropdown',
            name: 'TARGET_LANG',
            options: [
                ['English', 'en'],
                ['Spanish', 'es'],
                ['French', 'fr'],
                ['German', 'de'],
                ['Italian', 'it'],
                ['Portuguese', 'pt'],
                ['Russian', 'ru'],
                ['Japanese', 'ja'],
                ['Chinese (Simplified)', 'zh-CN'],
                ['Korean', 'ko'],
                ['Arabic', 'ar'],
                ['Hindi', 'hi'],
                ['Dutch', 'nl'],
                ['Swedish', 'sv'],
                ['Turkish', 'tr'],
                ['Polish', 'pl'],
                ['Thai', 'th'],
                ['Vietnamese', 'vi'],
                ['Indonesian', 'id']
            ]
        }],
        previousStatement: null,
        nextStatement: null,
        colour: '#1976D2',
        tooltip: 'Set the default target language for translations',
        helpUrl: ''
    },
    {
        type: 'translate_last_result',
        message0: 'last translation',
        output: 'String',
        colour: '#0D47A1',
        tooltip: 'Returns the last translated text',
        helpUrl: ''
    }
];

// Language code → full name mapping (for display)
const LANGUAGE_NAMES: Record<string, string> = {
    auto: 'Auto Detect',
    en: 'English', es: 'Spanish', fr: 'French', de: 'German',
    it: 'Italian', pt: 'Portuguese', ru: 'Russian', ja: 'Japanese',
    'zh-CN': 'Chinese', ko: 'Korean', ar: 'Arabic', hi: 'Hindi',
    nl: 'Dutch', sv: 'Swedish', tr: 'Turkish', pl: 'Polish',
    th: 'Thai', vi: 'Vietnamese', id: 'Indonesian', el: 'Greek',
    cs: 'Czech', ro: 'Romanian', hu: 'Hungarian', fi: 'Finnish',
    da: 'Danish', no: 'Norwegian', uk: 'Ukrainian', bn: 'Bengali',
    ta: 'Tamil', te: 'Telugu'
};

// Cache entry type
interface CacheEntry {
    translatedText: string;
    timestamp: number;
}

// Runtime implementation
export class TranslateRuntime {
    private sourceLang = 'auto';
    private targetLang = 'en';
    private lastResult = '';
    private cache: Map<string, CacheEntry> = new Map();
    private cacheTTL = 30 * 60 * 1000; // 30 minutes
    private isTranslating = false;

    /**
     * Translate text using MyMemory API (free, no key required).
     * Works in both browser and Electron/local .exe via fetch.
     * Falls back gracefully if offline.
     */
    async translate(text: string, targetLang?: string): Promise<string> {
        if (!text || !text.trim()) {
            this.lastResult = '';
            return '';
        }

        const target = targetLang || this.targetLang;
        const source = this.sourceLang === 'auto' ? '' : this.sourceLang;
        const cacheKey = `${source}|${target}|${text}`;

        // Check cache
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
            this.lastResult = cached.translatedText;
            return this.lastResult;
        }

        if (this.isTranslating) return this.lastResult;
        this.isTranslating = true;

        try {
            const langPair = source ? `${source}|${target}` : `autodetect|${target}`;
            const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;

            const resp = await fetch(url);
            if (!resp.ok) {
                console.warn(`[Translate] API error: ${resp.status}`);
                return this.lastResult;
            }

            const json = await resp.json();

            if (json.responseStatus === 200 && json.responseData?.translatedText) {
                let translated = json.responseData.translatedText;

                // MyMemory sometimes returns the original text in uppercase when it can't translate
                if (translated.toUpperCase() === text.toUpperCase() && source !== 'en' && target !== 'en') {
                    // Might be untranslated — still return it
                }

                this.lastResult = translated;
                this.cache.set(cacheKey, { translatedText: translated, timestamp: Date.now() });
                console.log(`[Translate] "${text}" → "${translated}" (${langPair})`);
            } else {
                console.warn('[Translate] No translation in response:', json);
            }
        } catch (err) {
            console.error('[Translate] Fetch failed (offline?):', err);
        } finally {
            this.isTranslating = false;
        }

        return this.lastResult;
    }

    setSourceLanguage(lang: string) {
        this.sourceLang = lang;
    }

    setTargetLanguage(lang: string) {
        this.targetLang = lang;
    }

    getSourceLanguage(): string { return this.sourceLang; }
    getTargetLanguage(): string { return this.targetLang; }
    getLastResult(): string { return this.lastResult; }
    getLanguageName(code: string): string { return LANGUAGE_NAMES[code] || code; }

    clearCache() { this.cache.clear(); }
}

// Register blocks
export function registerTranslateBlocks() {
    const newBlocks = translateBlocks.filter(block => !Blockly.Blocks[block.type]);
    if (newBlocks.length > 0) {
        Blockly.common.defineBlocks(Blockly.common.createBlockDefinitionsFromJsonArray(newBlocks));
    }
}

// JavaScript generators
export function registerTranslateGenerators() {
    const jsGen = (window as any).Blockly?.JavaScript;
    if (!jsGen) return;

    jsGen['translate_text'] = (block: any) => {
        const text = block.getFieldValue('TEXT') || '';
        const lang = block.getFieldValue('TARGET_LANG') || 'en';
        return `if(window.runtime?.translate) await window.runtime.translate.translate('${text.replace(/'/g, "\\'")}', '${lang}');\n`;
    };
    jsGen['translate_set_source'] = (block: any) => {
        const lang = block.getFieldValue('SOURCE_LANG') || 'auto';
        return `if(window.runtime?.translate) window.runtime.translate.setSourceLanguage('${lang}');\n`;
    };
    jsGen['translate_set_target'] = (block: any) => {
        const lang = block.getFieldValue('TARGET_LANG') || 'en';
        return `if(window.runtime?.translate) window.runtime.translate.setTargetLanguage('${lang}');\n`;
    };
    jsGen['translate_last_result'] = () =>
        ['window.runtime?.translate?.getLastResult()||""', 0];
}

// Extension configuration
export const translateExtension: ExtensionCategory = {
    id: 'translate',
    name: 'Translate',
    colour: '#1976D2',
    icon: '🌍',
    blocks: translateBlocks.map(block => ({
        kind: 'block',
        type: block.type
    }))
};
