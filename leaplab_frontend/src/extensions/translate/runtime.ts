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

interface CacheEntry {
    translatedText: string;
    timestamp: number;
}

export class TranslateRuntime {
    private sourceLang = 'auto';
    private targetLang = 'en';
    private lastResult = '';
    private cache: Map<string, CacheEntry> = new Map();
    private cacheTTL = 30 * 60 * 1000;
    private isTranslating = false;

    async translate(text: string, targetLang?: string): Promise<string> {
        if (!text || !text.trim()) {
            this.lastResult = '';
            return '';
        }

        const target = targetLang || this.targetLang;
        const source = this.sourceLang === 'auto' ? '' : this.sourceLang;
        const cacheKey = `${source}|${target}|${text}`;

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

    setSourceLanguage(lang: string) { this.sourceLang = lang; }
    setTargetLanguage(lang: string) { this.targetLang = lang; }

    getSourceLanguage(): string { return this.sourceLang; }
    getTargetLanguage(): string { return this.targetLang; }
    getLastResult(): string { return this.lastResult; }
    getLanguageName(code: string): string { return LANGUAGE_NAMES[code] || code; }

    clearCache() { this.cache.clear(); }
}
