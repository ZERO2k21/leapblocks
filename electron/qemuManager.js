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
async function ensureRomElf(mainWindow) {
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
        if (size > 100 * 1024) { // ROM ELF is ~845 KB
            console.log(`[QEMU] ✓ ROM ELF found: ${romPath} (${(size / 1024).toFixed(0)} KB)`);
            return romPath;
        }
        send(`[QEMU] ROM ELF too small (${size} bytes) — re-downloading`);
        fs.unlinkSync(romPath);
    }

    send(`[QEMU] Downloading ESP32 ROM ELF (one-time, ~4 MB tarball)...`);
    if (!fs.existsSync(resourcesDir)) fs.mkdirSync(resourcesDir, { recursive: true });

    const tarPath = path.join(resourcesDir, 'esp-rom-elfs.tar.gz');
    try { fs.unlinkSync(tarPath); } catch (_) { }

    await downloadFile(ROM_ELF_TARBALL_URL, tarPath, (downloaded, total) => {
        const pct = Math.floor((downloaded / total) * 100);
        if (pct % 25 === 0) send(`[QEMU] ROM ELF download... ${pct}%`);
    });

    send(`[QEMU] Extracting ${ROM_ELF_NAME}...`);

    // Extract esp32_rev0_rom.elf from the tarball using tar
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
    return romPath;
}


//
// Checks whether qemu-system-xtensa is present in resources/.
// Downloads and extracts it if missing, sending progress to the renderer.
// Returns the resolved binary path on success, throws on failure.
// ─────────────────────────────────────────────────────────────────────────────
async function ensureQemu(mainWindow) {
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

    // Already installed?
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

    if (!fs.existsSync(resourcesDir)) fs.mkdirSync(resourcesDir, { recursive: true });

    const archivePath = path.join(resourcesDir, `qemu-download${config.archiveExt}`);
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
// waitForTcpPort(port, host, timeoutMs) → Promise<void>
//
// Polls until the TCP port is accepting connections, or throws on timeout.
// Replaces the fixed setTimeout before connectSerial.
// ─────────────────────────────────────────────────────────────────────────────
async function waitForTcpPort(port, host, timeoutMs = 5000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        const open = await new Promise((resolve) => {
            const sock = new net.Socket();
            sock.setTimeout(200);
            sock.once('connect', () => { sock.destroy(); resolve(true); });
            sock.once('error', () => { sock.destroy(); resolve(false); });
            sock.once('timeout', () => { sock.destroy(); resolve(false); });
            sock.connect(port, host);
        });
        if (open) return;
        await sleep(100);
    }
    throw new Error(`[QEMU] TCP port ${port} on ${host} did not open within ${timeoutMs}ms`);
}

// ─────────────────────────────────────────────────────────────────────────────
// connectSerial(mainWindow) → Promise<void>
//
// Connects to QEMU's serial TCP port (:5555), forwards data to the renderer,
// then performs the QMP handshake and sends 'cont' to resume the CPU.
// ─────────────────────────────────────────────────────────────────────────────
async function connectSerial(mainWindow) {
    // Wait until QEMU has opened its serial TCP server
    await waitForTcpPort(5555, '127.0.0.1', 8000);

    const sock = new net.Socket();

    await new Promise((resolve, reject) => {
        sock.connect(5555, '127.0.0.1', () => resolve());
        sock.once('error', reject);
    });

    console.log('[Serial] Connected to 127.0.0.1:5555');

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
    const qmp = await connectQMP();
    if (qmp) {
        await sendQMPCommand(qmp, { execute: 'cont' });
        console.log('[QEMU] CPU resumed via QMP cont');
    } else {
        console.error('[QEMU] QMP unavailable — CPU may remain paused');
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

    // Ensure QEMU binary is present
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

    // Ensure ROM ELF is present (required by Espressif QEMU 9.x)
    let romElfPath;
    try {
        romElfPath = await ensureRomElf(mainWindow);
    } catch (err) {
        const msg = `[QEMU] Failed to download ROM ELF: ${err.message}`;
        console.error(msg);
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

    const args = [
        '-nographic',
        '-machine', 'esp32',
        '-bios', romElfPath,
        '-drive', `file=${binPath},if=mtd,format=raw`,
        '-serial', 'tcp::5555,server,nowait',
        '-monitor', 'tcp::5556,server,nowait',
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

    // Await TCP readiness then connect — no more fixed setTimeout
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
// ─────────────────────────────────────────────────────────────────────────────
// Port management — find free ports dynamically to avoid conflicts
// ─────────────────────────────────────────────────────────────────────────────
let activeSerialPort = 5555;
let activeMonitorPort = 5556;

async function findFreePort(startPort) {
    return new Promise((resolve) => {
        const server = require('net').createServer();
        server.listen(startPort, '127.0.0.1', () => {
            const port = server.address().port;
            server.close(() => resolve(port));
        });
        server.on('error', () => {
            // Port in use, try next
            resolve(findFreePort(startPort + 1));
        });
    });
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
        // On Windows, also use taskkill to ensure the process tree is terminated
        if (process.platform === 'win32' && pid) {
            try {
                spawnSync('taskkill', ['/F', '/T', '/PID', String(pid)], { timeout: 3000 });
            } catch (_) { }
        }
        qemuProcess = null;
    }
    console.log('[QEMU] Stopped');
}

module.exports = { startQemu, stopQemu, sendQMPCommand, connectQMP, ensureQemuSilent };
