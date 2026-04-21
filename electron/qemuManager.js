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
// Startup cleanup — kill any orphaned qemu-system-xtensa processes from
// previous app sessions. Runs once when this module is first require()'d.
// ─────────────────────────────────────────────────────────────────────────────
if (process.platform === 'win32') {
    try {
        spawnSync('taskkill', ['/F', '/IM', 'qemu-system-xtensa.exe'], {
            timeout: 3000,
            stdio: 'ignore',
        });
        console.log('[QEMU] Startup cleanup: killed any orphaned qemu-system-xtensa processes');
    } catch (_) { /* non-fatal */ }
}

// ─────────────────────────────────────────────────────────────────────────────
// Port management — dynamic ports avoid conflicts with stale QEMU processes
// ─────────────────────────────────────────────────────────────────────────────
let activeSerialPort = 5555;
let activeMonitorPort = 5556;

async function findFreePort(startPort) {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.listen(startPort, '127.0.0.1', () => {
            const port = server.address().port;
            server.close(() => resolve(port));
        });
        server.on('error', () => resolve(findFreePort(startPort + 1)));
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// QEMU binary download config
// Source: Espressif's official QEMU fork (only build with esp32 machine target)
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
// Path helpers
// ─────────────────────────────────────────────────────────────────────────────
function getQemuBinPath() {
    const config = QEMU_DOWNLOAD_CONFIG[process.platform];
    const binName = config ? config.outName : 'qemu-system-xtensa';
    return app.isPackaged
        ? path.join(process.resourcesPath, binName)
        : path.join(__dirname, '../resources', binName);
}

function getResourcesDir() {
    return app.isPackaged ? process.resourcesPath : path.join(__dirname, '../resources');
}

// ─────────────────────────────────────────────────────────────────────────────
// sleep(ms) — awaitable delay
// ─────────────────────────────────────────────────────────────────────────────
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ─────────────────────────────────────────────────────────────────────────────
// downloadFile(url, destPath, onProgress?) → Promise<string>
//
// Downloads url → destPath following redirects.
// onProgress(downloaded, total) is called periodically.
// ─────────────────────────────────────────────────────────────────────────────
async function downloadFile(url, destPath, onProgress) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destPath);
        let downloaded = 0;

        const handleResponse = async (res) => {
            // Follow redirects (301, 302, 307, 308)
            if ([301, 302, 307, 308].includes(res.statusCode)) {
                file.close();
                try { fs.unlinkSync(destPath); } catch (_) { }
                const redirectUrl = res.headers.location;
                console.log(`[QEMU] Redirect → ${redirectUrl}`);
                try {
                    resolve(await downloadFile(redirectUrl, destPath, onProgress));
                } catch (err) {
                    reject(err);
                }
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
            file.on('finish', () => { file.close(); resolve(destPath); });
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
// Synchronous — spawnSync is appropriate here (one-time extraction at startup)
// ─────────────────────────────────────────────────────────────────────────────
function extractQemuBinary(archivePath, config, outPath) {
    if (config.archiveExt === '.zip') {
        const ps = `
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead('${archivePath.replace(/\\/g, '\\\\')}')
$entry = $zip.Entries | Where-Object { $_.Name -eq '${config.entryName}' } | Select-Object -First 1
if (-not $entry) { Write-Error "qemu-system-xtensa.exe not found in archive"; exit 1 }
$stream = $entry.Open()
$out = [System.IO.File]::Create('${outPath.replace(/\\/g, '\\\\')}')
$stream.CopyTo($out); $out.Close(); $stream.Close(); $zip.Dispose()
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
        const result = spawnSync('tar', ['xf', archivePath, '--to-stdout', config.entryName], {
            encoding: 'buffer',
            timeout: 60_000,
            maxBuffer: 100 * 1024 * 1024,
        });
        if (result.status !== 0) {
            throw new Error(`tar extract failed:\n${result.stderr.toString()}`);
        }
        fs.writeFileSync(outPath, result.stdout);
        if (process.platform !== 'win32') fs.chmodSync(outPath, 0o755);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ROM ELF config — required by Espressif QEMU 9.x to boot the ESP32
// ─────────────────────────────────────────────────────────────────────────────
const ROM_ELF_RELEASE = '20260313';
const ROM_ELF_NAME = 'esp32_rev0_rom.elf';
const ROM_ELF_TARBALL_URL = `https://github.com/espressif/esp-rom-elfs/releases/download/${ROM_ELF_RELEASE}/esp-rom-elfs-${ROM_ELF_RELEASE}.tar.gz`;

function getRomElfPath() {
    return path.join(getResourcesDir(), ROM_ELF_NAME);
}

// ─────────────────────────────────────────────────────────────────────────────
// ensureRomElf(mainWindow) → Promise<string>
//
// Downloads the ESP32 ROM ELF file if not already present.
// Required by Espressif QEMU 9.x — passed as -bios <path>.
// ─────────────────────────────────────────────────────────────────────────────
async function ensureRomElf(mainWindow, sendStatus) {
    const romPath = getRomElfPath();
    const resourcesDir = getResourcesDir();

    const send = (msg) => {
        console.log(msg);
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('serial-data', msg + '\n');
        }
    };

    if (fs.existsSync(romPath)) {
        const size = fs.statSync(romPath).size;
        if (size > 100 * 1024) {
            console.log(`[QEMU] ✓ ROM ELF found: ${romPath} (${(size / 1024).toFixed(0)} KB)`);
            return romPath;
        }
        send(`[QEMU] ROM ELF too small (${size} bytes) — re-downloading`);
        fs.unlinkSync(romPath);
    }

    send(`[QEMU] Downloading ESP32 ROM ELF (one-time, ~4 MB tarball)...`);
    if (sendStatus) sendStatus('downloading-rom', { progress: 0 });
    if (!fs.existsSync(resourcesDir)) fs.mkdirSync(resourcesDir, { recursive: true });

    const tarPath = path.join(resourcesDir, 'esp-rom-elfs.tar.gz');
    try { fs.unlinkSync(tarPath); } catch (_) { }

    try {
        await downloadFile(ROM_ELF_TARBALL_URL, tarPath, (downloaded, total) => {
            const pct = Math.floor((downloaded / total) * 100);
            if (pct % 10 === 0) {
                send(`[QEMU] ROM ELF download... ${pct}%`);
                if (sendStatus) sendStatus('downloading-rom', { progress: pct });
            }
        });
    } catch (err) {
        try { fs.unlinkSync(tarPath); } catch (_) { }
        throw err;
    }

    send(`[QEMU] Extracting ${ROM_ELF_NAME}...`);

    const result = spawnSync('tar', ['xzf', tarPath, '-C', resourcesDir, ROM_ELF_NAME], {
        encoding: 'utf8',
        timeout: 30_000,
    });

    try { fs.unlinkSync(tarPath); } catch (_) { }

    if (result.status !== 0) {
        throw new Error(`[QEMU] ROM ELF extraction failed:\n${result.stderr || result.stdout}`);
    }

    if (!fs.existsSync(romPath)) {
        throw new Error(`[QEMU] ROM ELF extraction succeeded but file not found at: ${romPath}`);
    }

    const finalSize = fs.statSync(romPath).size;
    if (finalSize < 100 * 1024) {
        fs.unlinkSync(romPath);
        throw new Error(`[QEMU] ROM ELF too small after extraction (${finalSize} bytes)`);
    }

    send(`[QEMU] ✓ ROM ELF installed: ${romPath} (${(finalSize / 1024).toFixed(0)} KB)`);
    if (sendStatus) sendStatus('downloading-rom', { progress: 100 });
    return romPath;
}


async function ensureQemu(mainWindow, sendStatus) {
    const config = QEMU_DOWNLOAD_CONFIG[process.platform];
    if (!config) throw new Error(`[QEMU] Unsupported platform: ${process.platform}`);

    const binPath = getQemuBinPath();
    const resourcesDir = getResourcesDir();

    const send = (msg) => {
        console.log(msg);
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('serial-data', msg + '\n');
        }
    };

    if (fs.existsSync(binPath)) {
        const size = fs.statSync(binPath).size;
        if (size > 1024 * 1024) {
            send(`[QEMU] ✓ Binary found: ${binPath} (${(size / 1024 / 1024).toFixed(1)} MB)`);
            return binPath;
        }
        send(`[QEMU] Existing binary too small (${size} bytes) — re-downloading`);
        fs.unlinkSync(binPath);
    }

    send(`[QEMU] Binary not found — downloading Espressif QEMU...`);
    send(`[QEMU] Source: ${config.url}`);
    send(`[QEMU] This is a one-time download (~50–80 MB). Please wait...`);
    if (sendStatus) sendStatus('downloading-qemu', { progress: 0 });

    if (!fs.existsSync(resourcesDir)) fs.mkdirSync(resourcesDir, { recursive: true });

    const archivePath = path.join(resourcesDir, `qemu-download${config.archiveExt}`);
    try { fs.unlinkSync(archivePath); } catch (_) { }

    let lastPct = -1;
    try {
        await downloadFile(config.url, archivePath, (downloaded, total) => {
            const pct = Math.floor((downloaded / total) * 100);
            if (pct !== lastPct && pct % 10 === 0) {
                send(`[QEMU] Downloading... ${pct}% (${(downloaded / 1024 / 1024).toFixed(1)} / ${(total / 1024 / 1024).toFixed(1)} MB)`);
                if (sendStatus) sendStatus('downloading-qemu', { progress: pct });
                lastPct = pct;
            }
        });
    } catch (err) {
        try { fs.unlinkSync(archivePath); } catch (_) { }
        throw err;
    }

    send(`[QEMU] Download complete. Extracting binary...`);

    try {
        extractQemuBinary(archivePath, config, binPath);
    } finally {
        try { fs.unlinkSync(archivePath); } catch (_) { }
    }

    if (!fs.existsSync(binPath)) {
        throw new Error(`[QEMU] Extraction succeeded but binary not found at: ${binPath}`);
    }

    const finalSize = fs.statSync(binPath).size;
    if (finalSize < 1024 * 1024) {
        fs.unlinkSync(binPath);
        throw new Error(`[QEMU] Extracted binary too small (${finalSize} bytes) — archive may be corrupt`);
    }

    send(`[QEMU] ✓ qemu-system-xtensa installed: ${binPath} (${(finalSize / 1024 / 1024).toFixed(1)} MB)`);
    if (sendStatus) sendStatus('downloading-qemu', { progress: 100 });
    return binPath;
}

// ─────────────────────────────────────────────────────────────────────────────
// ensureQemuSilent() → Promise<string | undefined>
//
// Silent version for background startup warmup — no IPC messages.
// ─────────────────────────────────────────────────────────────────────────────
async function ensureQemuSilent() {
    const config = QEMU_DOWNLOAD_CONFIG[process.platform];
    if (!config) return; // unsupported platform

    const binPath = getQemuBinPath();

    if (fs.existsSync(binPath)) {
        const size = fs.statSync(binPath).size;
        if (size > 1024 * 1024) {
            console.log(`[QEMU] ✓ Binary already present (${(size / 1024 / 1024).toFixed(1)} MB)`);
            return binPath;
        }
        fs.unlinkSync(binPath);
    }

    console.log('[QEMU] Binary not found — downloading in background...');
    const resourcesDir = getResourcesDir();
    if (!fs.existsSync(resourcesDir)) fs.mkdirSync(resourcesDir, { recursive: true });

    const archivePath = path.join(resourcesDir, `qemu-download${config.archiveExt}`);
    try { fs.unlinkSync(archivePath); } catch (_) { }

    await downloadFile(config.url, archivePath, (downloaded, total) => {
        const pct = Math.floor((downloaded / total) * 100);
        if (pct % 20 === 0) console.log(`[QEMU] Downloading... ${pct}%`);
    });

    extractQemuBinary(archivePath, config, binPath);
    try { fs.unlinkSync(archivePath); } catch (_) { }

    const size = fs.statSync(binPath).size;
    console.log(`[QEMU] ✓ Downloaded and installed (${(size / 1024 / 1024).toFixed(1)} MB)`);
    return binPath;
}

// ─────────────────────────────────────────────────────────────────────────────
// connectQMP() → Promise<net.Socket | null>
//
// Opens a QMP connection on 127.0.0.1:5556 and completes the handshake.
// Resolves with the live socket, or null on error.
// ─────────────────────────────────────────────────────────────────────────────
async function connectQMP() {
    return new Promise((resolve) => {
        const sock = new net.Socket();
        let buffer = '';
        let greeted = false;

        // 5-second timeout — if QMP doesn't respond, resolve null so CPU cont is skipped
        const timeout = setTimeout(() => {
            console.error('[QMP] Handshake timed out after 5s');
            sock.destroy();
            resolve(null);
        }, 5000);

        sock.connect(activeMonitorPort, '127.0.0.1', () => {
            console.log(`[QMP] Connected to 127.0.0.1:${activeMonitorPort}`);
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
                    clearTimeout(timeout);
                    qmpSocket = sock;
                    resolve(sock);
                }
            }
        });

        sock.on('error', (err) => {
            console.error('[QMP] Socket error:', err.message);
            clearTimeout(timeout);
            resolve(null);
        });

        sock.on('close', () => {
            console.log('[QMP] Socket closed');
            if (qmpSocket === sock) qmpSocket = null;
        });
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// sendQMPCommand(socket, cmd) → Promise<object | null>
// ─────────────────────────────────────────────────────────────────────────────
async function sendQMPCommand(socket, cmd) {
    if (!socket || socket.destroyed) {
        console.error('[QMP] sendQMPCommand called with invalid socket');
        return null;
    }

    return new Promise((resolve) => {
        let buffer = '';

        const onData = (chunk) => {
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
        };

        socket.on('data', onData);
        socket.write(JSON.stringify(cmd) + '\n');
        console.log('[QMP] Sent:', JSON.stringify(cmd));
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// waitForTcpPort(port, host, timeoutMs) → Promise<net.Socket>
//
// Polls until the TCP port is accepting connections, returns the live socket.
// Throws on timeout. Returns the connected socket directly to avoid TOCTOU.
// ─────────────────────────────────────────────────────────────────────────────
async function waitForTcpPort(port, host, timeoutMs = 10000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        const result = await new Promise((resolve) => {
            const sock = new net.Socket();
            sock.setTimeout(500);
            sock.once('connect', () => {
                sock.setTimeout(0);
                resolve({ connected: true, sock });
            });
            sock.once('error', () => { sock.destroy(); resolve({ connected: false }); });
            sock.once('timeout', () => { sock.destroy(); resolve({ connected: false }); });
            sock.connect(port, host);
        });
        if (result.connected) return result.sock;
        await sleep(200);
    }
    throw new Error(`[QEMU] TCP port ${port} on ${host} did not open within ${timeoutMs}ms`);
}

// ─────────────────────────────────────────────────────────────────────────────
// connectSerial(mainWindow) → Promise<void>
//
// Connects to QEMU's serial TCP port, forwards data to the renderer,
// then performs the QMP handshake and sends 'cont' to resume the CPU.
// ─────────────────────────────────────────────────────────────────────────────
async function connectSerial(mainWindow) {
    const send = (msg) => {
        console.log(msg);
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('serial-data', msg + '\n');
        }
    };

    send(`[QEMU] Waiting for serial port ${activeSerialPort}...`);
    const sock = await waitForTcpPort(activeSerialPort, '127.0.0.1', 15000);
    send(`[Serial] Connected to 127.0.0.1:${activeSerialPort}`);

    sock.on('data', (data) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('serial-data', data.toString());
        }
    });

    sock.on('error', (err) => console.error('[Serial] Socket error:', err.message));
    sock.on('close', () => {
        console.log('[Serial] Socket closed');
        if (serialSocket === sock) serialSocket = null;
    });

    serialSocket = sock;

    // QMP handshake → resume CPU
    send(`[QEMU] Connecting QMP on port ${activeMonitorPort}...`);
    // Poll until QMP port is open (opens slightly after serial port)
    const qmpDeadline = Date.now() + 5000;
    while (Date.now() < qmpDeadline) {
        const open = await new Promise((resolve) => {
            const s = new net.Socket();
            s.setTimeout(300);
            s.once('connect', () => { s.destroy(); resolve(true); });
            s.once('error', () => { s.destroy(); resolve(false); });
            s.once('timeout', () => { s.destroy(); resolve(false); });
            s.connect(activeMonitorPort, '127.0.0.1');
        });
        if (open) break;
        await sleep(200);
    }
    const qmp = await connectQMP();
    if (qmp) {
        send(`[QEMU] QMP connected — sending cont to resume CPU...`);
        await sendQMPCommand(qmp, { execute: 'cont' });
        send(`[QEMU] CPU running — sketch started`);
    } else {
        send(`[QEMU] WARNING: QMP unavailable — CPU remains paused, sketch will not run`);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// startQemu(binPath, mainWindow) → Promise<void>
//
// 1. Ensures qemu-system-xtensa is installed (downloads if missing).
// 2. Spawns QEMU with the compiled ESP32 .bin image.
// 3. Awaits TCP port readiness, then connects serial + QMP and resumes CPU.
// ─────────────────────────────────────────────────────────────────────────────
async function startQemu(binPath, mainWindow) {
    stopQemu();

    const sendStatus = (stage, extra = {}) => {
        console.log(`[QEMU] status: ${stage}`, extra);
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('esp32-status', { stage, ...extra });
        }
    };

    // Ensure QEMU binary is present
    let qemuBin;
    try {
        qemuBin = await ensureQemu(mainWindow, sendStatus);
    } catch (err) {
        const msg = `[QEMU] Failed to install QEMU: ${err.message}`;
        console.error(msg);
        sendStatus('error', { message: err.message });
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('serial-data', msg + '\n');
        }
        return;
    }

    // Ensure ROM ELF is present (required by Espressif QEMU 9.x)
    let romElfPath;
    try {
        romElfPath = await ensureRomElf(mainWindow, sendStatus);
    } catch (err) {
        const msg = `[QEMU] Failed to download ROM ELF: ${err.message}`;
        console.error(msg);
        sendStatus('error', { message: err.message });
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('serial-data', msg + '\n');
        }
        return;
    }

    if (!fs.existsSync(binPath)) {
        const msg = `[QEMU] .bin file not found: ${binPath}`;
        console.error(msg);
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('serial-data', msg + '\n');
        }
        return;
    }

    // Find free ports dynamically to avoid conflicts with stale QEMU processes
    activeSerialPort = await findFreePort(5555);
    activeMonitorPort = await findFreePort(activeSerialPort + 1);

    const send = (msg) => {
        console.log(msg);
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('serial-data', msg + '\n');
        }
    };

    send(`[QEMU] Using ports: serial=${activeSerialPort}, monitor=${activeMonitorPort}`);

    const args = [
        '-nographic',
        '-machine', 'esp32',
        '-bios', romElfPath,
        '-drive', `file=${binPath},if=mtd,format=raw`,
        '-serial', `tcp::${activeSerialPort},server,nowait`,
        '-qmp', `tcp::${activeMonitorPort},server,nowait`,
        '-S', // start CPU paused — 'cont' sent after serial+QMP connect
    ];

    console.log('[QEMU] Launching:', qemuBin);
    console.log('[QEMU] Args:', args.join(' '));

    qemuProcess = spawn(qemuBin, args, { env: { ...process.env } });

    qemuProcess.stdout.on('data', (d) => console.log('[QEMU stdout]', d.toString().trimEnd()));

    qemuProcess.stderr.on('data', (d) => {
        const text = d.toString().trimEnd();
        console.error('[QEMU stderr]', text);
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('serial-data', `[QEMU] ${text}\n`);
        }
    });

    qemuProcess.on('close', (code) => {
        console.log(`[QEMU] Process exited with code ${code}`);
        if (code !== 0 && mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('serial-data', `[QEMU] Process exited with code ${code}\n`);
        }
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

    // Give QEMU 1 second to initialize before polling for the TCP port.
    // Without this, the first poll attempt hits before QEMU's TCP server is ready.
    await sleep(1000);

    // Await TCP readiness then connect — returns the live socket directly
    try {
        await connectSerial(mainWindow);
    } catch (err) {
        const msg = `[QEMU] Serial connect failed: ${err.message}`;
        console.error(msg);
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('serial-data', msg + '\n');
        }
    }
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
        const pid = qemuProcess.pid;
        try { qemuProcess.kill('SIGKILL'); } catch (_) { }
        if (process.platform === 'win32' && pid) {
            try { spawnSync('taskkill', ['/F', '/T', '/PID', String(pid)], { timeout: 3000 }); } catch (_) { }
        }
        qemuProcess = null;
    }
    // On Windows, also kill any orphaned qemu-system-xtensa processes
    // that weren't tracked (e.g. from a previous app session).
    if (process.platform === 'win32') {
        try {
            spawnSync('taskkill', ['/F', '/IM', 'qemu-system-xtensa.exe'], { timeout: 3000 });
        } catch (_) { }
    }
    console.log('[QEMU] Stopped');
}

module.exports = { startQemu, stopQemu, sendQMPCommand, connectQMP, ensureQemuSilent };
