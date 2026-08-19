/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 *
 * FQBN → PlatformIO board/platform mapping.
 * Replaces arduino-cli FQBN strings with PlatformIO board identifiers.
 */

export interface PioBoardTarget {
    board: string;
    platform: string;
}

const FQBN_TO_PIO: Record<string, PioBoardTarget> = {
    'arduino:avr:uno': { board: 'uno', platform: 'atmelavr' },
    'arduino:avr:nano': { board: 'nanoatmega328', platform: 'atmelavr' },
    'arduino:avr:mega': { board: 'megaatmega2560', platform: 'atmelavr' },
    'arduino:avr:leonardo': { board: 'leonardo', platform: 'atmelavr' },
    'esp32:esp32:esp32': { board: 'esp32dev', platform: 'espressif32' },
    'esp32:esp32:esp32c3': { board: 'esp32-c3-devkitm-1', platform: 'espressif32' },
    'esp32:esp32:esp32s2': { board: 'esp32-s2-saola-1', platform: 'espressif32' },
    'esp32:esp32:esp32s3': { board: 'esp32-s3-devkitc-1', platform: 'espressif32' },
    'esp32:esp32:esp32c6': { board: 'esp32-c6-devkitc-1', platform: 'espressif32' },
    'esp32:esp32:esp32h2': { board: 'esp32-h2-devkitm-1', platform: 'espressif32' },
    'esp32:esp32:esp32p4': { board: 'esp32-p4-devkitm-1', platform: 'espressif32' },
};

export function isEsp32Fqbn(fqbn: string): boolean {
    return typeof fqbn === 'string' && fqbn.startsWith('esp32:');
}

/**
 * Resolve a PlatformIO board + platform for a given arduino-cli FQBN.
 * Throws when the FQBN is unknown.
 */
export function fqbnToPioTarget(fqbn: string): PioBoardTarget {
    const target = FQBN_TO_PIO[fqbn];
    if (target) return target;

    // Generic esp32:esp32:* variants → closest supported devkit.
    if (isEsp32Fqbn(fqbn)) {
        const variant = fqbn.split(':').pop() || 'esp32';
        const fallback: Record<string, PioBoardTarget> = {
            esp32: { board: 'esp32dev', platform: 'espressif32' },
            esp32c3: { board: 'esp32-c3-devkitm-1', platform: 'espressif32' },
            esp32s2: { board: 'esp32-s2-saola-1', platform: 'espressif32' },
            esp32s3: { board: 'esp32-s3-devkitc-1', platform: 'espressif32' },
            esp32c6: { board: 'esp32-c6-devkitc-1', platform: 'espressif32' },
            esp32h2: { board: 'esp32-h2-devkitm-1', platform: 'espressif32' },
            esp32p4: { board: 'esp32-p4-devkitm-1', platform: 'espressif32' },
        };
        const hit = fallback[variant];
        if (hit) return hit;
    }

    throw new Error(`Unsupported board FQBN for PlatformIO: ${fqbn}`);
}