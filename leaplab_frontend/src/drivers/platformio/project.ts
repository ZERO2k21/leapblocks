/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 *
 * Generates a PlatformIO project (platformio.ini + src/main.ino) on disk.
 * Replaces arduino-cli's sketch + --config-file workflow.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface PioProjectOptions {
    /** PlatformIO board id, e.g. `uno`, `esp32-c3-devkitm-1`. */
    board: string;
    /** PlatformIO platform name, e.g. `atmelavr`, `espressif32`. */
    platform: string;
    /** Extra library directories (forge-lib/libraries). */
    libDirs?: string[];
    /** Extra lib_deps entries (e.g. `SoftwareSerial`). */
    libDeps?: string[];
    /** Merge bootloader+partitions+app into firmware.merged.bin (ESP32 simulation). */
    mergeBinaries?: boolean;
    /** Serial port for `-t upload`. */
    uploadPort?: string;
    /** Extra [env] lines, e.g. `build_flags = ...`. */
    extraEnv?: string[];
}

/**
 * Write a complete PlatformIO project into `projectDir` and return it.
 * The sketch always lands at <projectDir>/src/main.ino.
 */
export function createPioProject(projectDir: string, code: string, opts: PioProjectOptions): string {
    const srcDir = path.join(projectDir, 'src');
    fs.rmSync(srcDir, { recursive: true, force: true });
    fs.mkdirSync(srcDir, { recursive: true });
    fs.writeFileSync(path.join(srcDir, 'main.ino'), code, 'utf-8');

    const lines: string[] = [
        `[env:${opts.board}]`,
        `platform = ${opts.platform}`,
        'framework = arduino',
        `board = ${opts.board}`,
    ];

    if (opts.libDirs?.length) {
        lines.push('lib_extra_dirs =');
        for (const dir of opts.libDirs) {
            lines.push(`    ${dir.replace(/\\/g, '/')}`);
        }
    }

    if (opts.mergeBinaries) {
        lines.push('board_build.merge_binaries = yes');
    }

    if (opts.uploadPort) {
        lines.push(`upload_port = ${opts.uploadPort}`);
    }

    if (opts.extraEnv?.length) {
        lines.push(...opts.extraEnv);
    }

    fs.writeFileSync(path.join(projectDir, 'platformio.ini'), lines.join('\n') + '\n', 'utf-8');
    return projectDir;
}

/** Standard build output dir for a board env: <projectDir>/.pio/build/<board> */
export function getPioBuildDir(projectDir: string, board: string): string {
    return path.join(projectDir, '.pio', 'build', board);
}

/** List files in the build dir (empty array when the build never ran). */
export function listPioBuildFiles(projectDir: string, board: string): string[] {
    const buildDir = getPioBuildDir(projectDir, board);
    if (!fs.existsSync(buildDir)) return [];
    return fs.readdirSync(buildDir);
}