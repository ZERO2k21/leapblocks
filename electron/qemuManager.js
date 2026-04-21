'use strict';

const net = require('net');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const { spawn, spawnSync } = require('child_process');
const { app } = require('electron');

// ─────────────────────────────────────────────────────────────────────────────
// Module-level state — one QEMU instance at a time
// ─────────────────────────────────────────────────────────────────────────────
let qemuProcess = null;
let serialSocket = null;
let qmpSocket = null;

// ─────────────────────────────────────────────────────────────────────────────
// QEMU binary download config
//
// Source: Espressif's official QEMU fork — the only build that includes the
// esp32 machine target with correct peripheral emulation.
// https://github.com/espressif/qemu/releases
// ─────────────────────────────────────────────────────────────────────────────
const QEMU_RELEASE_TAG = 'esp-develop-9.2.2-20260417';
const QEMU_RELEASE_BASE = `https://github.com/espressif/qemu/releases/download/${QEMU_RELEASE_TAG}`;

const QEMU_DOWNLOAD_CONFIG = {
    win32: {
        url: `${QEMU_RELEASE_BASE}/qemu-xtensa-softmmu-esp_develop_9.2.2_20260417-x86_64-w64-mingw32.tar.xz`,
        archiveExt: '.tar.xz',
        entryName: 'qemu/bin/qemu-system-xtensa.exe',
        outName: 'qemu-system-xtensa.exe',
    },
    linux: {
        url: `${QEMU_RELEASE_BASE}/qemu-xtensa-softmmu-esp_develop_9.2.2_20260417-x86_64-linux-gnu.tar.xz`,
        archiveExt: '.tar.xz',
        entryName: 'qemu/bin/qemu-system-xtensa',
        outName: 'qemu-system-xtensa',
    },
    darwin: {
        url: `${QEMU_RELEASE_BASE}/qemu-xtensa-softmmu-esp_develop_9.2.2_20260417-x86_64-apple-darwin.tar.xz`,
        archiveExt: '.tar.xz',
        entryName: 'qemu/bin/qemu-system-xtensa',
        outName: 'qemu-system-xtensa',
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// Resolve the qemu-system-xtensa binary path
//   Prod:  <resourcesPath>/qemu-system-xtensa[.exe]
//   Dev:   <repo>/resources/qemu-system-xtensa[.exe]
// ─────────────────────────────────────────────────────────────────────────────
function getQemuBinPath() {
    const config = QEMU_DOWNLOAD_CONFIG[process.platform];
    const binName = config ? config.outName : 'qemu-system-xtensa';

    if (app.isPackaged) {
        return path.join(process.resourcesPath, binName);
    }
    return path.join(__dirname, '../resources', binName);
}

function getResourcesDir() {
    if (app.isPackaged) return process.resourcesPath;
    return path.join(__dirname, '../resources');
}

// ─────────────────────────────────────────────────────────────────────────────
// downloadFile(url, destPath, onProgress)
//
// Downloads url → destPath, following redirects.
// onProgress(downloaded, total) called periodically.
// ─────────────────────────────────────────────────────────────────────────────
function downloadFile(url, destPath, onProgress) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destPath);
        let downloaded = 0;

        const handleResponse = (res) => {
            // Follow redirects (301, 302, 307, 308)
            if ([301, 302, 307, 308].includes(res.statusCode)) {
                file.close();
                try { fs.unlinkSync(destPath); } catch (_) { }
                const redirectUrl = res.headers.location;
                console.log(`[QEMU] Redirect → ${redirectUrl}`);
                downloadFile(redirectUrl, destPath, onProgress).then(resolve).catch(reject);
                return;
            }

            if (res.statusCode !== 200) {
                file.close();
                try { fs.unlinkSync(destPath); } catch (_) { }
                reject(new Error(`HTTP ${res.statusCode} downloading QEMU from ${url}`));
                return;
            }

            const total = parseInt(res.headers['content-length'] || '0', 10);

            res.on('data', (chunk) => {
                downloaded += chunk.length;
                if (onProgress && total > 0) onProgress(downloaded, total);
            });

            res.pipe(file);

            file.on('finish', () => {
                file.close();
                resolve(destPath);
            });
        };

        const protocol = url.startsWith('https') ? https : http;
        const req = protocol.get(url, handleResponse);

        req.on('error', (err) => {
            file.close();
            try { fs.unlinkSync(destPath); } catch (_) { }
            reject(err);
        });

        // 5-minute timeout for large downloads
        req.setTimeout(300_000, () => {
            req.destroy();
            reject(new Error('QEMU download timed out after 5 minutes'));
        });
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// extractQemuBinary(archivePath, config, outPath)
//
// Extracts the qemu-system-xtensa binary from the downloaded archive.
// ─────────────────────────────────────────────────────────────────────────────
function extractQemuBinary(archivePath, config, outPath) {
    if (config.archiveExt === '.zip') {
        // Windows: use PowerShell's built-in ZIP support (no 7-zip needed)
        const ps = `
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead('${archivePath.replace(/\\/g, '\\\\')}')
$entry = $zip.Entries | Where-Object { $_.Name -eq '${config.entryName}' } | Select-Object -First 1
if (-not $entry) {
  Write-Error "qemu-system-xtensa.exe not found in archive"
  exit 1
}
$stream = $entry.Open()
$out = [System.IO.File]::Create('${outPath.replace(/\\/g, '\\\\')}')
$stream.CopyTo($out)
$out.Close()
$stream.Close()
$zip.Dispose()
Write-Host "Extracted OK"
`;
        const result = spawnSync('powershell', ['-NoProfile', '-NonInteractive', '-Command', ps], {
            encoding: 'utf8',
            timeout: 60_000,
        });
        if (result.status !== 0) {
            throw new Error(`PowerShell ZIP extract failed:\n${result.stderr || result.stdout}`);
        }
    } else {
        // Linux / macOS: tar xf archive --to-stdout entry > outPath
        const result = spawnSync('tar', ['xf', archivePath, '--to-stdout', config.entryName], {
            encoding: 'buffer',
            timeout: 60_000,
            maxBuffer: 100 * 1024 * 1024, // 100 MB
        });
        if (result.status !== 0) {
            throw new Error(`tar extract failed:\n${result.stderr.toString()}`);
        }
        fs.writeFileSync(outPath, result.stdout);
        fs.chmodSync(outPath, 0o755);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ensureQemu(mainWindow) → Promise<string>
//
// Checks whether qemu-system-xtensa is present in resources/.
// If not, downloads and extracts it from Espressif's GitHub releases.
// Sends progress messages to the renderer via 'serial-data' IPC.
// Returns the resolved binary path on success, throws on failure.
// ─────────────────────────────────────────────────────────────────────────────
async function ensureQemu(mainWindow) {
    const config = QEMU_DOWNLOAD_CONFIG[process.platform];
    if (!config) {
        throw new Error(`[QEMU] Unsupported platform: ${process.platform}`);
    }

    const binPath = getQemuBinPath();
    const resourcesDir = getResourcesDir();

    const send = (msg) => {
        console.log(msg);
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('serial-data', msg + '\n');
        }
    };

    // ── Already installed? ────────────────────────────────────────────────────
    if (fs.existsSync(binPath)) {
        const size = fs.statSync(binPath).size;
        if (size > 1024 * 1024) { // > 1 MB = real binary, not a stub
            send(`[QEMU] ✓ Binary found: ${binPath} (${(size / 1024 / 1024).toFixed(1)} MB)`);
            return binPath;
        }
        send(`[QEMU] Existing binary too small (${size} bytes) — re-downloading`);
        fs.unlinkSync(binPath);
    }

    // ── Download ──────────────────────────────────────────────────────────────
    send(`[QEMU] Binary not found — downloading Espressif QEMU...`);
    send(`[QEMU] Source: ${config.url}`);
    send(`[QEMU] This is a one-time download (~50–80 MB). Please wait...`);

    if (!fs.existsSync(resourcesDir)) {
        fs.mkdirSync(resourcesDir, { recursive: true });
    }

    const archivePath = path.join(resourcesDir, `qemu-download${config.archiveExt}`);

    // Clean up any partial previous download
    try { fs.unlinkSync(archivePath); } catch (_) { }

    let lastPct = -1;
    await downloadFile(config.url, archivePath, (downloaded, total) => {
        const pct = Math.floor((downloaded / total) * 100);
        if (pct !== lastPct && pct % 10 === 0) {
            send(`[QEMU] Downloading... ${pct}% (${(downloaded / 1024 / 1024).toFixed(1)} / ${(total / 1024 / 1024).toFixed(1)} MB)`);
            lastPct = pct;
        }
    });

    send(`[QEMU] Download complete. Extracting binary...`);

    // ── Extract ───────────────────────────────────────────────────────────────
    try {
        extractQemuBinary(archivePath, config, binPath);
    } finally {
        // Always clean up the archive — it's large and no longer needed
        try { fs.unlinkSync(archivePath); } catch (_) { }
    }

    // ── Verify ────────────────────────────────────────────────────────────────
    if (!fs.existsSync(binPath)) {
        throw new Error(`[QEMU] Extraction appeared to succeed but binary not found at: ${binPath}`);
    }

    const finalSize = fs.statSync(binPath).size;
    if (finalSize < 1024 * 1024) {
        fs.unlinkSync(binPath);
        throw new Error(`[QEMU] Extracted binary is too small (${finalSize} bytes) — archive may be corrupt`);
    }

    send(`[QEMU] ✓ qemu-system-xtensa installed: ${binPath} (${(finalSize / 1024 / 1024).toFixed(1)} MB)`);
    return binPath;
}

// ─────────────────────────────────────────────────────────────────────────────
// connectQMP() → Promise<net.Socket>
//
// Opens a QMP (QEMU Machine Protocol) connection on 127.0.0.1:5556.
// Handshake:
//   ← {"QMP": ...}                    (greeting from QEMU)
//   → {"execute":"qmp_capabilities"}
//   ← {"return": {}}                  (capabilities accepted)
// ─────────────────────────────────────────────────────────────────────────────
function connectQMP() {
    return new Promise((resolve) => {
        const sock = new net.Socket();
        let buffer = '';
        let greeted = false;

        sock.connect(5556, '127.0.0.1', () => {
            console.log('[QMP] Connected to 127.0.0.1:5556');
        });

        sock.on('data', (chunk) => {
            buffer += chunk.toString();
            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;

                let msg;
                try { msg = JSON.parse(trimmed); } catch (_) { continue; }

                if (!greeted && msg.QMP !== undefined) {
                    greeted = true;
                    console.log('[QMP] Received greeting, sending qmp_capabilities');
                    sock.write(JSON.stringify({ execute: 'qmp_capabilities' }) + '\n');
                    continue;
                }

                if (greeted && msg.return !== undefined) {
                    console.log('[QMP] Handshake complete');
                    qmpSocket = sock;
                    resolve(sock);
                }
            }
        });

        sock.on('error', (err) => {
            console.error('[QMP] Socket error:', err.message);
            resolve(null);
        });

        sock.on('close', () => {
            console.log('[QMP] Socket closed');
            if (qmpSocket === sock) qmpSocket = null;
        });
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// sendQMPCommand(socket, cmd) → Promise<any>
// ─────────────────────────────────────────────────────────────────────────────
function sendQMPCommand(socket, cmd) {
    return new Promise((resolve) => {
        if (!socket || socket.destroyed) {
            console.error('[QMP] sendQMPCommand called with invalid socket');
            resolve(null);
            return;
        }

        let buffer = '';

        function onData(chunk) {
            buffer += chunk.toString();
            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;

                let msg;
                try { msg = JSON.parse(trimmed); } catch (_) { continue; }

                if (msg.return !== undefined || msg.error !== undefined) {
                    socket.removeListener('data', onData);
                    if (msg.error) console.error('[QMP] Command error:', JSON.stringify(msg.error));
                    resolve(msg);
                    return;
                }
            }
        }

        socket.on('data', onData);
        socket.write(JSON.stringify(cmd) + '\n');
        console.log('[QMP] Sent:', JSON.stringify(cmd));
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// connectSerial(mainWindow)
//
// TCP :5555 → renderer 'serial-data' IPC.
// After connect: QMP handshake → 'cont' to resume the paused CPU.
// ─────────────────────────────────────────────────────────────────────────────
function connectSerial(mainWindow) {
    const sock = new net.Socket();

    sock.connect(5555, '127.0.0.1', async () => {
        console.log('[Serial] Connected to 127.0.0.1:5555');

        const qmp = await connectQMP();
        if (qmp) {
            await sendQMPCommand(qmp, { execute: 'cont' });
            console.log('[QEMU] CPU resumed via QMP cont');
        } else {
            console.error('[QEMU] QMP unavailable — CPU may remain paused');
        }
    });

    sock.on('data', (data) => {
        const text = data.toString();
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('serial-data', text);
        }
    });

    sock.on('error', (err) => {
        console.error('[Serial] Socket error:', err.message);
    });

    sock.on('close', () => {
        console.log('[Serial] Socket closed');
        if (serialSocket === sock) serialSocket = null;
    });

    serialSocket = sock;
}

// ─────────────────────────────────────────────────────────────────────────────
// startQemu(binPath, mainWindow)
//
// 1. Ensures qemu-system-xtensa is installed (downloads if missing).
// 2. Spawns QEMU with the compiled ESP32 .bin image.
// 3. CPU starts paused (-S); connectSerial → QMP → 'cont' releases it.
// ─────────────────────────────────────────────────────────────────────────────
async function startQemu(binPath, mainWindow) {
    // Clean up any previous instance first
    stopQemu();

    // ── Ensure QEMU binary is present ────────────────────────────────────────
    let qemuBin;
    try {
        qemuBin = await ensureQemu(mainWindow);
    } catch (err) {
        const msg = `[QEMU] Failed to install QEMU: ${err.message}`;
        console.error(msg);
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('serial-data', msg + '\n');
            mainWindow.webContents.send('serial-data',
                '[QEMU] Manual install: https://github.com/espressif/qemu/releases\n'
            );
        }
        return;
    }

    // ── Verify the .bin file still exists ────────────────────────────────────
    if (!fs.existsSync(binPath)) {
        const msg = `[QEMU] .bin file not found: ${binPath}`;
        console.error(msg);
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('serial-data', msg + '\n');
        }
        return;
    }

    const args = [
        '-nographic',
        '-machine', 'esp32',
        '-drive', `file=${binPath},if=mtd,format=raw`,
        '-serial', 'tcp::5555,server,nowait',
        '-monitor', 'tcp::5556,server,nowait',
        '-S',   // start CPU paused — 'cont' sent after serial+QMP connect
    ];

    console.log('[QEMU] Launching:', qemuBin);
    console.log('[QEMU] Args:', args.join(' '));

    qemuProcess = spawn(qemuBin, args, {
        env: { ...process.env },
    });

    qemuProcess.stdout.on('data', (d) => {
        console.log('[QEMU stdout]', d.toString().trimEnd());
    });

    qemuProcess.stderr.on('data', (d) => {
        const text = d.toString().trimEnd();
        console.error('[QEMU stderr]', text);
        // Forward QEMU startup errors to the serial monitor so the user sees them
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('serial-data', `[QEMU] ${text}\n`);
        }
    });

    qemuProcess.on('close', (code) => {
        console.log(`[QEMU] Process exited with code ${code}`);
        qemuProcess = null;
    });

    qemuProcess.on('error', (err) => {
        const msg = `[QEMU] Failed to start process: ${err.message}`;
        console.error(msg);
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('serial-data', msg + '\n');
        }
        qemuProcess = null;
    });

    // Give QEMU 800 ms to open its TCP server sockets before connecting
    setTimeout(() => connectSerial(mainWindow), 800);
}

// ─────────────────────────────────────────────────────────────────────────────
// stopQemu()
// ─────────────────────────────────────────────────────────────────────────────
function stopQemu() {
    if (serialSocket) {
        try { serialSocket.destroy(); } catch (_) { }
        serialSocket = null;
    }

    if (qmpSocket) {
        try { qmpSocket.destroy(); } catch (_) { }
        qmpSocket = null;
    }

    if (qemuProcess) {
        try { qemuProcess.kill(); } catch (_) { }
        qemuProcess = null;
    }

    console.log('[QEMU] Stopped');
}

module.exports = { startQemu, stopQemu, sendQMPCommand, connectQMP };
