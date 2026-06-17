// QRScanner.ts - QR code scanning from camera or static images
//
// HOW IT WORKS:
// ─────────────────────────────────────────────────────────────────────────────
// 1. qr_scan_camera:  Captures a frame from the live camera video, decodes QR
// 2. qr_scan_image:   Decodes a QR code from an <img> or <canvas> source URL
// 3. qr_get_text:     Returns the last decoded QR text
// 4. qr_get_count:    Returns total number of successful scans this session
//
// TECHNICAL:
// ─────────────────────────────────────────────────────────────────────────────
// - Uses jsQR library for QR decoding (pure JS, no native deps)
// - Falls back to BarcodeDetector API in Chrome when available
// - Frame capture via hidden canvas (same pattern as VideoSensing)
// - Results are cached until next scan

import Blockly from '@blockly-runtime';
import jsQR from 'jsqr';

export class QRScannerRuntime {
    private videoEl: HTMLVideoElement | null = null;
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private _lastText: string = '';
    private _lastRaw: string = '';
    private _scanCount: number = 0;
    private _scanning: boolean = false;
    private barcodeDetector: any = null;
    private useNativeAPI: boolean = false;

    constructor() {
        if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
            this.barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
            this.useNativeAPI = true;
        }
    }

    setVideoElement(video: HTMLVideoElement | null) {
        this.videoEl = video;
    }

    private ensureCanvas(): HTMLCanvasElement | null {
        if (this.canvas) return this.canvas;
        if (typeof document === 'undefined') return null;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        return this.canvas;
    }

    async scanCamera(): Promise<string> {
        if (this._scanning) return this._lastText;
        if (!this.videoEl) {
            console.warn('[QRScanner] No video element');
            return '';
        }
        if (this.videoEl.readyState < 2) {
            console.warn('[QRScanner] Video not ready');
            return '';
        }

        this._scanning = true;
        try {
            const canvas = this.ensureCanvas();
            if (!canvas || !this.ctx) return '';

            canvas.width = this.videoEl.videoWidth || 640;
            canvas.height = this.videoEl.videoHeight || 480;
            this.ctx.drawImage(this.videoEl, 0, 0, canvas.width, canvas.height);

            const imageData = this.ctx.getImageData(0, 0, canvas.width, canvas.height);
            const result = await this.decodeImageData(imageData);

            if (result) {
                this._lastText = result;
                this._scanCount++;
                console.log('[QRScanner] Camera scan:', result);
            }
            return this._lastText;
        } finally {
            this._scanning = false;
        }
    }

    async scanImage(source: string): Promise<string> {
        if (!source) {
            console.warn('[QRScanner] No image source');
            return '';
        }

        try {
            if (this.useNativeAPI && this.barcodeDetector) {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                await new Promise<void>((resolve, reject) => {
                    img.onload = () => resolve();
                    img.onerror = () => reject(new Error('Failed to load image'));
                    img.src = source;
                });
                const barcodes = await this.barcodeDetector.detect(img);
                if (barcodes.length > 0) {
                    this._lastText = barcodes[0].rawValue;
                    this._scanCount++;
                    console.log('[QRScanner] Image scan (native):', this._lastText);
                    return this._lastText;
                }
            }

            const canvas = this.ensureCanvas();
            if (!canvas || !this.ctx) return '';

            const img = new Image();
            img.crossOrigin = 'anonymous';
            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = source;
            });

            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            this.ctx.drawImage(img, 0, 0);

            const imageData = this.ctx.getImageData(0, 0, canvas.width, canvas.height);
            const result = await this.decodeImageData(imageData);

            if (result) {
                this._lastText = result;
                this._scanCount++;
                console.log('[QRScanner] Image scan:', result);
            }
            return this._lastText;
        } catch (err) {
            console.warn('[QRScanner] Scan failed:', err);
            return '';
        }
    }

    private async decodeImageData(imageData: ImageData): Promise<string | null> {
        if (this.useNativeAPI && this.barcodeDetector) {
            try {
                const canvas = this.ensureCanvas();
                if (canvas) {
                    const barcodes = await this.barcodeDetector.detect(canvas);
                    if (barcodes.length > 0) return barcodes[0].rawValue;
                }
            } catch {
                // Fall through to jsQR
            }
        }

        if (typeof jsQR === 'function') {
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert',
            });
            if (code) return code.data;
        }

        return null;
    }

    getText(): string {
        return this._lastText;
    }

    getCount(): number {
        return this._scanCount;
    }

    reset() {
        this._lastText = '';
        this._lastRaw = '';
        this._scanCount = 0;
    }
}

export const qrScannerBlocks = [
    {
        type: 'qr_scan_camera',
        message0: 'scan QR from camera',
        previousStatement: null,
        nextStatement: null,
        colour: '#6A1B9A',
        tooltip: 'Capture a frame from the camera and scan for a QR code',
        helpUrl: ''
    },
    {
        type: 'qr_scan_image',
        message0: 'scan QR from image %1',
        args0: [{ type: 'field_input', name: 'SOURCE', text: '' }],
        previousStatement: null,
        nextStatement: null,
        colour: '#6A1B9A',
        tooltip: 'Scan a QR code from an image URL or data URI',
        helpUrl: ''
    },
    {
        type: 'qr_get_text',
        message0: 'QR text',
        output: 'String',
        colour: '#4A148C',
        tooltip: 'Returns the text from the last scanned QR code',
        helpUrl: ''
    },
    {
        type: 'qr_get_count',
        message0: 'QR scan count',
        output: 'Number',
        colour: '#4A148C',
        tooltip: 'Total number of successful QR scans this session',
        helpUrl: ''
    },
];

export function registerQRScannerBlocks() {
    const newBlocks = qrScannerBlocks.filter(block => !Blockly.Blocks[block.type]);
    if (newBlocks.length > 0) {
        Blockly.common.defineBlocks(Blockly.common.createBlockDefinitionsFromJsonArray(newBlocks));
    }
}

export const qrScannerExtension = {
    id: 'qr_scanner',
    name: 'QR Code Scanner',
    colour: '#6A1B9A',
    icon: '📷',
    blocks: qrScannerBlocks.map(block => ({
        kind: 'block',
        type: block.type
    }))
};
