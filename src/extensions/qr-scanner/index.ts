import { Extension, ExtensionInfo } from '../core/Extension';
import { QRScannerRuntime } from './runtime';

export class QRScannerExtension extends Extension {
    private runtime: QRScannerRuntime;

    constructor(runtime?: QRScannerRuntime) {
        super(runtime);
        this.runtime = runtime || new QRScannerRuntime();
    }

    getInfo(): ExtensionInfo {
        return {
            id: 'qr_scanner',
            name: 'QR Code Scanner',
            color1: '#6A1B9A',
            blocks: [
                { opcode: 'qr_scan_camera', blockType: 'command', text: 'scan QR from camera' },
                { opcode: 'qr_scan_image', blockType: 'command', text: 'scan QR from image [SOURCE]', arguments: { SOURCE: { type: 'string', defaultValue: '' } } },
                { opcode: 'qr_get_text', blockType: 'reporter', text: 'QR text' },
                { opcode: 'qr_get_count', blockType: 'reporter', text: 'QR scan count' },
            ]
        };
    }

    qr_scan_camera() { return this.runtime.scanCamera(); }
    qr_scan_image(source: string) { return this.runtime.scanImage(source); }
    qr_get_text() { return this.runtime.getText(); }
    qr_get_count() { return this.runtime.getCount(); }
}

export const qrScannerExtension = new QRScannerExtension();
export { QRScannerRuntime } from './runtime';
