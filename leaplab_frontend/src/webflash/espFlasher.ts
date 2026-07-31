/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 *
 * ESP32 flasher — wraps esptool-js (Espressif's esptool ported to the browser)
 * to flash firmware over the Web Serial API. esptool-js handles the SLIP
 * framing, ROM bootloader sync, stub loading and flash programming itself.
 */

import { ESPLoader, Transport } from 'esptool-js';
import type { IEspLoaderTerminal } from 'esptool-js';

export interface EspFlashOptions {
    /** Base64-encoded firmware binary (the compiled .bin from the compiler server). */
    binBase64: string;
    /** Flash offset for the application image (ESP32-C3 Arduino layout: 0x10000). */
    appOffset?: number;
    onProgress?: (progress: number, message: string) => void;
    onLog?: (message: string) => void;
}

export function isEsp32Fqbn(fqbn: string): boolean {
    return fqbn.startsWith('esp32:');
}

function base64ToBytes(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

export async function flashEsp32(port: SerialPort, options: EspFlashOptions): Promise<void> {
    const appOffset = options.appOffset ?? 0x10000;
    const firmware = base64ToBytes(options.binBase64);
    if (!firmware.length) throw new Error('Firmware binary is empty.');

    options.onLog?.(`Flashing ESP32 (${firmware.length} bytes @ 0x${appOffset.toString(16)})...`);

    const terminal: IEspLoaderTerminal = {
        clean: () => { /* no-op */ },
        writeLine: (data: string) => options.onLog?.(data),
        write: (data: string) => options.onLog?.(data),
    };

    const transport = new Transport(port, false);
    transport.setDeviceLostCallback(() => {
        options.onLog?.('Device disconnected — check the USB cable.');
    });

    try {
        const loader = new ESPLoader({
            transport,
            baudrate: 460800,
            terminal,
        });

        // Connect, detect the chip and load the stub flasher.
        await loader.main('default_reset');
        options.onLog?.(`Connected: ${loader.chip.CHIP_NAME}`);

        await loader.writeFlash({
            fileArray: [
                {
                    data: firmware,
                    address: appOffset,
                },
            ],
            flashMode: 'dio',
            flashFreq: '40m',
            flashSize: '4MB',
            eraseAll: false,
            compress: true,
            reportProgress: (fileIndex: number, written: number, total: number) => {
                if (!total) return;
                const percent = Math.min(99, Math.round((written / total) * 100));
                options.onProgress?.(percent, `Flashing ${written}/${total} bytes...`);
            },
        });

        options.onProgress?.(100, 'Upload complete!');
        options.onLog?.('✓ Firmware flashed successfully.');

        // Hard reset so the new firmware boots.
        try {
            await loader.after('hard_reset');
        } catch (err: any) {
            options.onLog?.(`Note: reset after flash skipped (${err?.message ?? 'unknown error'}). Press the board's RESET button.`);
        }
    } finally {
        try {
            await transport.disconnect();
        } catch {
            // Port may already be gone — ignore.
        }
    }
}
