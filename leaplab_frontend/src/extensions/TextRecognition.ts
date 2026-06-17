// TextRecognition.ts - OCR from camera or image using Tesseract.js

import Blockly from '@blockly-runtime';
import type { ExtensionCategory } from './ExtensionManager';

// Block definitions
export const textRecognitionBlocks = [
    {
        type: 'ocr_from_camera',
        message0: 'capture text from camera',
        previousStatement: null,
        nextStatement: null,
        colour: '#2196F3',
        tooltip: 'Run OCR on the current camera frame',
        helpUrl: ''
    },
    {
        type: 'ocr_from_image',
        message0: 'capture text from image %1',
        args0: [{
            type: 'field_dropdown',
            name: 'SOURCE',
            options: [
                ['uploaded image', 'uploaded'],
                ['stage backdrop', 'backdrop'],
                ['url', 'url']
            ]
        }],
        previousStatement: null,
        nextStatement: null,
        colour: '#2196F3',
        tooltip: 'Run OCR on an image source',
        helpUrl: ''
    },
    {
        type: 'ocr_get_text',
        message0: 'recognized text',
        output: 'String',
        colour: '#1565C0',
        tooltip: 'Returns the last recognized text',
        helpUrl: ''
    },
    {
        type: 'ocr_get_word_count',
        message0: 'word count',
        output: 'Number',
        colour: '#1565C0',
        tooltip: 'Returns the number of words in the last recognized text',
        helpUrl: ''
    },
    {
        type: 'ocr_contains',
        message0: 'text contains %1',
        args0: [{
            type: 'field_input',
            name: 'PHRASE',
            text: 'hello'
        }],
        output: 'Boolean',
        colour: '#1565C0',
        tooltip: 'Returns true if the recognized text contains the given phrase',
        helpUrl: ''
    }
];

// Runtime implementation
export class OCRRuntime {
    private worker: any = null;
    private workerReady = false;
    private workerLoading = false;
    private lastResult = '';
    private lastConfidence = 0;
    private isProcessing = false;
    private videoEl: HTMLVideoElement | null = null;
    private canvas: HTMLCanvasElement | null = null;

    setVideoElement(video: HTMLVideoElement | null) {
        this.videoEl = video;
    }

    private async ensureWorker(): Promise<boolean> {
        if (this.workerReady && this.worker) return true;
        if (this.workerLoading) {
            // Wait for ongoing load
            return new Promise((resolve) => {
                const check = setInterval(() => {
                    if (this.workerReady) { clearInterval(check); resolve(true); }
                    if (!this.workerLoading) { clearInterval(check); resolve(false); }
                }, 100);
            });
        }

        this.workerLoading = true;
        try {
            // Dynamic import of tesseract.js — lazy loaded on first use
            const Tesseract = await import('tesseract.js');
            this.worker = await Tesseract.createWorker('eng', 1, {
                logger: (m: any) => {
                    if (m.status === 'recognizing text') {
                        console.log(`[OCR] Progress: ${Math.round((m.progress || 0) * 100)}%`);
                    }
                }
            });
            this.workerReady = true;
            console.log('[OCR] Tesseract.js worker ready');
            return true;
        } catch (err) {
            console.warn('[OCR] Tesseract.js not available, OCR will return empty results:', err);
            this.workerLoading = false;
            return false;
        }
    }

    private getCanvas(): HTMLCanvasElement {
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
        }
        return this.canvas;
    }

    private captureFrameFromVideo(): string | null {
        if (!this.videoEl || this.videoEl.readyState < 2) return null;
        const canvas = this.getCanvas();
        canvas.width = this.videoEl.videoWidth || 640;
        canvas.height = this.videoEl.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        ctx.drawImage(this.videoEl, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/png');
    }

    async recognizeFromCamera(): Promise<string> {
        if (this.isProcessing) return this.lastResult;
        this.isProcessing = true;
        try {
            const imageData = this.captureFrameFromVideo();
            if (!imageData) {
                console.warn('[OCR] No camera frame available');
                this.lastResult = '';
                this.lastConfidence = 0;
                return '';
            }
            return await this._recognizeImage(imageData);
        } finally {
            this.isProcessing = false;
        }
    }

    async recognizeFromImage(source: string): Promise<string> {
        if (this.isProcessing) return this.lastResult;
        this.isProcessing = true;
        try {
            if (source === 'uploaded' || source === 'backdrop') {
                // Try to capture from the stage canvas
                const stageCanvas = document.querySelector('canvas') as HTMLCanvasElement;
                if (stageCanvas) {
                    const imageData = stageCanvas.toDataURL('image/png');
                    return await this._recognizeImage(imageData);
                }
            } else if (source === 'url') {
                // For URL input, the user should connect a text block with the URL
                // For now, try to find an image element on stage
                const img = document.querySelector('#stage img') as HTMLImageElement;
                if (img) {
                    return await this._recognizeImage(img.src);
                }
            }
            console.warn('[OCR] No image source available');
            this.lastResult = '';
            this.lastConfidence = 0;
            return '';
        } finally {
            this.isProcessing = false;
        }
    }

    private async _recognizeImage(imageSource: string): Promise<string> {
        const ready = await this.ensureWorker();
        if (!ready || !this.worker) {
            this.lastResult = '';
            this.lastConfidence = 0;
            return '';
        }

        try {
            const result = await this.worker.recognize(imageSource);
            this.lastResult = (result.data.text || '').trim();
            this.lastConfidence = Math.round(result.data.confidence || 0);
            console.log(`[OCR] Recognized: "${this.lastResult}" (confidence: ${this.lastConfidence}%)`);
            return this.lastResult;
        } catch (err) {
            console.error('[OCR] Recognition failed:', err);
            this.lastResult = '';
            this.lastConfidence = 0;
            return '';
        }
    }

    getLastResult(): string { return this.lastResult; }
    getConfidence(): number { return this.lastConfidence; }
    getWordCount(): number {
        if (!this.lastResult) return 0;
        return this.lastResult.split(/\s+/).filter(w => w.length > 0).length;
    }
    contains(phrase: string): boolean {
        if (!this.lastResult || !phrase) return false;
        return this.lastResult.toLowerCase().includes(phrase.toLowerCase());
    }
    getIsProcessing(): boolean { return this.isProcessing; }
}

// Register blocks
export function registerTextRecognitionBlocks() {
    const newBlocks = textRecognitionBlocks.filter(block => !Blockly.Blocks[block.type]);
    if (newBlocks.length > 0) {
        Blockly.common.defineBlocks(Blockly.common.createBlockDefinitionsFromJsonArray(newBlocks));
    }
}

// JavaScript generators
export function registerTextRecognitionGenerators() {
    const jsGen = (window as any).Blockly?.JavaScript;
    if (!jsGen) return;

    jsGen['ocr_from_camera'] = () =>
        'if(window.runtime?.ocr) await window.runtime.ocr.recognizeFromCamera();\n';
    jsGen['ocr_from_image'] = (block: any) => {
        const source = block.getFieldValue('SOURCE') || 'uploaded';
        return `if(window.runtime?.ocr) await window.runtime.ocr.recognizeFromImage('${source}');\n`;
    };
    jsGen['ocr_get_text'] = () =>
        ['window.runtime?.ocr?.getLastResult()||""', 0];
    jsGen['ocr_get_word_count'] = () =>
        ['window.runtime?.ocr?.getWordCount()||0', 0];
    jsGen['ocr_contains'] = (block: any) => {
        const phrase = block.getFieldValue('PHRASE') || '';
        return [`window.runtime?.ocr?.contains('${phrase.replace(/'/g, "\\'")}')||false`, 0];
    };
}

// Extension configuration
export const textRecognitionExtension: ExtensionCategory = {
    id: 'text_recognition',
    name: 'Text Recognition',
    colour: '#2196F3',
    icon: '📝',
    blocks: textRecognitionBlocks.map(block => ({
        kind: 'block',
        type: block.type
    }))
};
