/**
 * scripts/download-qemu.js
 *
 * Downloads the Espressif QEMU fork (qemu-system-xtensa) for the current
 * platform into resources/ so qemuManager.js can find it at dev time.
 *
 * Run manually:  node scripts/download-qemu.js
 * Auto-runs via: npm install  (postinstall hook in package.json)
 *
 * Source: https://github.com/espressif/qemu/releases
 * This is the only QEMU build that includes the esp32 machine target.
 */

'use strict';

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const RESOURCES_DIR = path.join(__dirname, '../resources');
const PLATFORM = process.platform;

// ── Pinned release — update this when a new version is needed ────────────────
const QEMU_RELEASE_TAG = 'esp-develop-9.2.2-20260417';
const BASE = `https://github.com/espressif/qemu/releases/download/${QEMU_RELEASE_TAG}`;

const RELEASES = {
    win32: {
        url: `${BASE}/qemu-xtensa-softmmu-esp_develop_9.2.2_20260417-x86_64-w64-mingw32.tar.xz`,
        tarEntry: 'qemu/bin/qemu-system-xtensa.exe',
        outName: 'qemu-system-xtensa.exe',
    },
    linux: {
        url: `${BASE}/qemu-xtensa-softmmu-esp_develop_9.2.2_20260417-x86_64-linux-gnu.tar.xz`,
        tarEntry: 'qemu/bin/qemu-system-xtensa',
        outName: 'qemu-system-xtensa',
    },
    darwin: {
        url: `${BASE}/qemu-xtensa-softmmu-esp_develop_9.2.2_20260417-x86_64-apple-darwin.tar.xz`,
        tarEntry: 'qemu/bin/qemu-system-xtensa',
        outName: 'qemu-system-xtensa',
    },
};

// ─────────────────────────────────────────────────────────────────────────────

function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        console.log(`[QEMU Setup] Downloading:\n  ${url}`);
        const file = fs.createWriteStream(destPath);
        let downloaded = 0;
        let lastPct = -1;

        const handleResponse = (res) => {
            if ([301, 302, 307, 308].includes(res.statusCode)) {
                file.close();
                try { fs.unlinkSync(destPath); } catch (_) { }
                console.log(`[QEMU Setup] Redirect → ${res.headers.location}`);
                downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
                return;
            }
            if (res.statusCode !== 200) {
                file.close();
                try { fs.unlinkSync(destPath); } catch (_) { }
                reject(new Error(`HTTP ${res.statusCode}`));
                return;
            }
            const total = parseInt(res.headers['content-length'] || '0', 10);
            res.on('data', (chunk) => {
                downloaded += chunk.length;
                if (total > 0) {
                    const pct = Math.floor((downloaded / total) * 100);
                    if (pct !== lastPct && pct % 10 === 0) {
                        process.stdout.write(`\r[QEMU Setup] ${pct}% — ${(downloaded / 1024 / 1024).toFixed(1)} / ${(total / 1024 / 1024).toFixed(1)} MB`);
                        lastPct = pct;
                    }
                }
            });
            res.pipe(file);
            file.on('finish', () => { file.close(); process.stdout.write('\n'); resolve(destPath); });
        };

        const protocol = url.startsWith('https') ? https : http;
        const req = protocol.get(url, handleResponse);
        req.on('error', (err) => { file.close(); try { fs.unlinkSync(destPath); } catch (_) { } reject(err); });
        req.setTimeout(300_000, () => { req.destroy(); reject(new Error('Download timed out')); });
    });
}

function extractTarEntry(archivePath, entryName, outPath) {
    console.log(`[QEMU Setup] Extracting: ${entryName}`);
    const result = spawnSync('tar', ['xf', archivePath, '--to-stdout', entryName], {
        encoding: 'buffer',
        timeout: 120_000,
        maxBuffer: 200 * 1024 * 1024,
    });
    if (result.status !== 0) {
        throw new Error(`tar failed (exit ${result.status}): ${result.stderr.toString().slice(0, 500)}`);
    }
    fs.writeFileSync(outPath, result.stdout);
    if (PLATFORM !== 'win32') fs.chmodSync(outPath, 0o755);
    console.log(`[QEMU Setup] Extracted → ${outPath}`);
}

async function main() {
    const config = RELEASES[PLATFORM];
    if (!config) {
        console.error(`[QEMU Setup] Unsupported platform: ${PLATFORM}`);
        process.exit(1);
    }

    if (!fs.existsSync(RESOURCES_DIR)) {
        fs.mkdirSync(RESOURCES_DIR, { recursive: true });
    }

    const outBin = path.join(RESOURCES_DIR, config.outName);

    // Already present and large enough?
    if (fs.existsSync(outBin)) {
        const size = fs.statSync(outBin).size;
        if (size > 1024 * 1024) {
            console.log(`[QEMU Setup] ✓ Already installed: ${outBin} (${(size / 1024 / 1024).toFixed(1)} MB)`);
            return;
        }
        console.log(`[QEMU Setup] Existing file too small (${size} bytes) — re-downloading`);
        fs.unlinkSync(outBin);
    }

    const archivePath = path.join(RESOURCES_DIR, 'qemu-download.tar.xz');
    try { fs.unlinkSync(archivePath); } catch (_) { }

    try {
        await downloadFile(config.url, archivePath);
        extractTarEntry(archivePath, config.tarEntry, outBin);

        const size = fs.statSync(outBin).size;
        if (size < 1024 * 1024) throw new Error(`Binary too small after extraction: ${size} bytes`);

        console.log(`[QEMU Setup] ✓ qemu-system-xtensa installed: ${outBin} (${(size / 1024 / 1024).toFixed(1)} MB)`);
    } finally {
        try { fs.unlinkSync(archivePath); } catch (_) { }
    }
}

main().catch((err) => {
    console.error('[QEMU Setup] FATAL:', err.message);
    process.exit(1);
});
