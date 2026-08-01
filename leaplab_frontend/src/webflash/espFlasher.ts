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
    /**
     * Base64-encoded bootloader binary (sketch.ino.bootloader.bin from the
     * compiler server). Flashed at 0x1000 so the board boots regardless of
     * what was on the flash before (e.g. OTA partition layouts).
     */
    bootloaderBase64?: string;
    /**
     * Base64-encoded partition table (sketch.ino.partitions.bin). Flashed at
     * 0x8000, keeping the app offset consistent with the compiled layout.
     */
    partitionsBase64?: string;
    /** Flash offset for the application image (Arduino ESP32 layout: 0x10000). */
    appOffset?: number;
    bootloaderOffset?: number;
    partitionsOffset?: number;
    /**
     * Serial baud rate. Defaults to 115200 (ROM rate) so esptool-js skips its
     * mid-upload disconnect/reconnect (changeBaud), which races with Windows'
     * COM port release and kills the flash. Pass 460800 for faster flashing.
     */
    baudrate?: number;
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

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function flashEsp32(port: SerialPort, options: EspFlashOptions): Promise<void> {
    const appOffset = options.appOffset ?? 0x10000;
    const bootloaderOffset = options.bootloaderOffset ?? 0x1000;
    const partitionsOffset = options.partitionsOffset ?? 0x8000;
    const firmware = base64ToBytes(options.binBase64);
    if (!firmware.length) throw new Error('Firmware binary is empty.');
    const bootloader = options.bootloaderBase64 ? base64ToBytes(options.bootloaderBase64) : null;
    const partitions = options.partitionsBase64 ? base64ToBytes(options.partitionsBase64) : null;

    const baudrate = options.baudrate ?? 115200;
    const fileArray: { data: Uint8Array; address: number }[] = [
        ...(bootloader?.length ? [{ data: bootloader, address: bootloaderOffset }] : []),
        ...(partitions?.length ? [{ data: partitions, address: partitionsOffset }] : []),
        { data: firmware, address: appOffset },
    ];
    options.onLog?.(
        `Flashing ESP32: bootloader ${bootloader?.length ?? 0}B @0x${bootloaderOffset.toString(16)}, ` +
        `partitions ${partitions?.length ?? 0}B @0x${partitionsOffset.toString(16)}, ` +
        `app ${firmware.length}B @0x${appOffset.toString(16)} at ${baudrate} baud...`
    );

    const terminal: IEspLoaderTerminal = {
        clean: () => { /* no-op */ },
        writeLine: (data: string) => options.onLog?.(data),
        write: (data: string) => options.onLog?.(data),
    };

    let lastError: unknown = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
        if (attempt > 1) options.onLog?.(`Retrying connection (attempt ${attempt}/3)...`);

        const transport = new Transport(port, false);
        transport.setDeviceLostCallback(() => {
            options.onLog?.('Device disconnected — USB connection dropped. Try a different cable/port (data cable, not charge-only).');
        });

        try {
            const loader = new ESPLoader({
                transport,
                baudrate,
                terminal,
            });

            // Connect, detect the chip and load the stub flasher. esptool-js
            // retries the DTR/RTS reset sequence up to 7 times internally.
            await loader.main('default_reset');
            options.onLog?.(`Connected: ${loader.chip.CHIP_NAME}`);

            await loader.writeFlash({
                fileArray,
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

            // Release the port's streams (esptool-js leaves the readable stream
            // locked) so the serial monitor / next upload can reopen it.
            try {
                await transport.disconnect();
            } catch { /* port may already be gone — ignore */ }
            return;
        } catch (err: any) {
            lastError = err;
            options.onLog?.(`Attempt ${attempt} failed: ${err?.message ?? err}`);
            try {
                await transport.disconnect();
            } catch {
                // Port may already be gone — ignore.
            }
            // Give the OS time to fully release the COM port before retrying.
            await sleep(2000);
        }
    }

    throw new Error(
        `Could not enter the bootloader. If the auto-reset isn't working on this board: hold the BOOT button, press and release EN/RESET, then release BOOT (manual download mode) and retry. Also check the USB cable is a data cable and try another USB port. (${lastError instanceof Error ? lastError.message : String(lastError)})`
    );
}
