const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const buildApk = require('./buildApk');
const { makeESP32Compiler, cleanupESP32Build } = require('./esp32Compiler');
const qemuManager = require('./qemuManager');
const { makeESP32Uploader } = require('./esp32Uploader');

const isDev = !app.isPackaged;
const APP_ROOT = app.getAppPath();

// ── forge-lib paths ────────────────────────
const FORGE_LIB_DIR = isDev
  ? path.join(APP_ROOT, 'forge-lib')
  : path.join(process.resourcesPath, 'forge-lib');

const FORGE_LIB_LIBRARIES = path.join(FORGE_LIB_DIR, 'libraries');
const FORGE_CLI_YAML = path.join(FORGE_LIB_DIR, 'arduino-cli.yaml');

const CLI_PATH = isDev
  ? path.join(APP_ROOT, 'arduino-cli', 'arduino-cli.exe')
  : path.join(process.resourcesPath, 'arduino-cli', 'arduino-cli.exe');

/** Run arduino-cli with the forge-lib config and return { stdout, stderr, code } */
async function runCLI(args) {
  return new Promise((resolve) => {
    const proc = spawn(CLI_PATH, ['--config-file', FORGE_CLI_YAML, ...args], {
      env: { ...process.env }
    });
    let stdout = '', stderr = '';
    proc.stdout.on('data', d => { stdout += d.toString(); });
    proc.stderr.on('data', d => { stderr += d.toString(); });
    proc.on('close', code => resolve({ stdout, stderr, code }));
    proc.on('error', err => resolve({ stdout: '', stderr: err.message, code: -1 }));
  });
}

// ── Local Build Server Management ─────────
let buildServerProcess = null;

function startBuildServer() {
  const serverPath = isDev
    ? path.join(__dirname, '..', 'local-build-server', 'server.js')
    : path.join(process.resourcesPath, 'local-build-server', 'server.js');

  if (!fs.existsSync(serverPath)) {
    console.log('[BUILD-SERVER] Server file not found at:', serverPath);
    return;
  }

  buildServerProcess = spawn('node', [serverPath], {
    env: { ...process.env, BUILD_PORT: '3001' },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
  });

  buildServerProcess.stdout.on('data', (data) => {
    console.log(`[BUILD-SERVER] ${data.toString().trim()}`);
  });

  buildServerProcess.stderr.on('data', (data) => {
    console.error(`[BUILD-SERVER ERROR] ${data.toString().trim()}`);
  });

  buildServerProcess.on('close', (code) => {
    console.log(`[BUILD-SERVER] Exited with code ${code}`);
    buildServerProcess = null;
  });

  console.log('[BUILD-SERVER] Started on http://localhost:3001');
}

function stopBuildServer() {
  if (buildServerProcess) {
    buildServerProcess.kill();
    buildServerProcess = null;
    console.log('[BUILD-SERVER] Stopped');
  }
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    icon: path.join(__dirname, '../public/icon.png'),
    title: "LeapBlocks",
    // Hide until content is painted — eliminates the white flash on startup
    show: false,
    backgroundColor: '#f8fafc', // matches the app background so no flicker
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // Enable background throttling suppression for smoother startup
      backgroundThrottling: false,
    }
  });

  // Show the window only when the renderer has finished its first paint
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../build/index.html'));
  }
}

app.whenReady().then(async () => {
  // ── Parallel startup: show window immediately, run background tasks concurrently ──
  // createWindow() is called first so the UI appears as fast as possible.
  // All heavy background work (build server, ESP32 core check, QEMU check) runs
  // in parallel without blocking the window from loading.
  createWindow();
  startBuildServer();

  // Fire-and-forget background warmup tasks — run concurrently, never block the UI
  await Promise.allSettled([
    warmupESP32Core(),
    warmupQemu(),
  ]);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  stopBuildServer();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  stopBuildServer();
  qemuManager.stopQemu();
});

// IPC Handlers

ipcMain.handle('build-apk', async (event, appState) => {
  const logCallback = (msg) => {
    try {
      if (!event.sender.isDestroyed()) {
        event.sender.send('build-log', msg);
      }
    } catch (err) {
      console.error("Failed to send log:", err);
    }
  };

  try {
    const outputPath = await buildApk(appState, APP_ROOT, logCallback);
    return { success: true, outputPath };
  } catch (error) {
    return { success: false, error: error.message || error.toString() };
  }
});

ipcMain.handle('compile-arduino', async (_, code) => {
  const tempDir = path.join(app.getPath('temp'), `sketch_${Date.now()}`);
  const sketchPath = path.join(tempDir, 'sketch.ino');

  try {
    fs.mkdirSync(tempDir, { recursive: true });
    fs.writeFileSync(sketchPath, code);

    const { stdout, stderr, code: exitCode } = await runCLI([
      'compile',
      '--fqbn', 'arduino:avr:uno',
      '--output-dir', tempDir,
      sketchPath,
    ]);

    if (exitCode === 0) {
      const hexPath = path.join(tempDir, 'sketch.ino.hex');
      if (fs.existsSync(hexPath)) {
        const hexContent = fs.readFileSync(hexPath, 'utf-8');
        return { success: true, hex: hexContent };
      }
      return { success: false, error: 'HEX file not generated' };
    } else {
      return { success: false, error: stderr || `Compiler exited with code ${exitCode}` };
    }
  } catch (err) {
    return { success: false, error: err.message };
  } finally {
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) { }
  }
});

// Original IPC Handlers conclude below...
ipcMain.handle('show-in-folder', (_, filePath) => {
  shell.showItemInFolder(filePath);
});

ipcMain.handle('save-project', async (_, data) => {
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Save LeapBlocks Project',
    defaultPath: 'project.lbp',
    filters: [
      { name: 'LeapBlocks Project', extensions: ['lbp'] }
    ]
  });

  if (filePath) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  }
  return false;
});

ipcMain.handle('open-project', async () => {
  const { filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Open LeapBlocks Project',
    properties: ['openFile'],
    filters: [
      { name: 'LeapBlocks Project', extensions: ['lbp'] }
    ]
  });

  if (filePaths && filePaths.length > 0) {
    const content = fs.readFileSync(filePaths[0], 'utf-8');
    try {
      return JSON.parse(content);
    } catch (e) {
      console.error("Invalid project file", e);
      return null;
    }
  }
  return null;
});

// ── forge-lib: install a library via arduino-cli ──────────────────────────
ipcMain.handle('forge-lib-install', async (_, libraryName) => {
  console.log(`[FORGE-LIB] Installing: ${libraryName}`);
  fs.mkdirSync(FORGE_LIB_LIBRARIES, { recursive: true });

  const { stdout, stderr, code } = await runCLI([
    'lib', 'install', libraryName
  ]);

  console.log(`[FORGE-LIB] install exit ${code}\n${stdout}\n${stderr}`);

  if (code === 0) {
    return { success: true };
  } else {
    return { success: false, error: stderr || stdout };
  }
});

// ── forge-lib: list installed libraries ──────────────────────────────────
ipcMain.handle('forge-lib-list', async () => {
  if (!fs.existsSync(FORGE_LIB_LIBRARIES)) return [];

  const entries = fs.readdirSync(FORGE_LIB_LIBRARIES, { withFileTypes: true });
  const libs = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const libDir = path.join(FORGE_LIB_LIBRARIES, entry.name);
    const propFile = path.join(libDir, 'library.properties');
    if (fs.existsSync(propFile)) {
      const props = {};
      fs.readFileSync(propFile, 'utf-8').split('\n').forEach(line => {
        const [k, ...v] = line.split('=');
        if (k && v.length) props[k.trim()] = v.join('=').trim();
      });
      libs.push({
        name: props.name || entry.name,
        version: props.version || '?',
        author: props.author || '',
        description: props.sentence || '',
      });
    } else {
      libs.push({ name: entry.name, version: '?', author: '', description: '' });
    }
  }

  return libs;
});

// ── forge-lib: remove a library ──────────────────────────────────────────
ipcMain.handle('forge-lib-remove', async (_, libraryName) => {
  console.log(`[FORGE-LIB] Removing: ${libraryName}`);
  const { code, stderr } = await runCLI(['lib', 'uninstall', libraryName]);
  return code === 0 ? { success: true } : { success: false, error: stderr };
});

// ── compile-code: unified handler called by CompilerService (Electron path) ──
// Routes to AVR (.hex) or ESP32 (.bin) compilation based on FQBN.
// For esp32:esp32:* FQBNs, returns { success, binPath } and keeps the
// temp dir alive so QEMU can load the .bin.  Cleanup happens on esp32-stop.
ipcMain.handle('compile-code', async (_, code, fqbn = 'arduino:avr:uno', _libraryPath) => {
  console.log(`[compile-code] ========== COMPILE START ==========`);
  console.log(`[compile-code] FQBN: ${fqbn}`);

  // All esp32:* FQBNs use the QEMU path — return binPath, keep tempDir alive.
  const isESP32 = typeof fqbn === 'string' && fqbn.startsWith('esp32:');
  const isESP32QEMU = isESP32; // all ESP32 boards use QEMU simulation

  console.log(`[compile-code] isESP32: ${isESP32}, isESP32QEMU: ${isESP32QEMU}`);

  const tempDir = path.join(app.getPath('temp'), `forge_sketch_${Date.now()}`);
  const sketchDir = path.join(tempDir, 'sketch');
  const sketchPath = path.join(sketchDir, 'sketch.ino');

  if (isESP32) {
    console.log('[compile-code] *** ESP32 DETECTED - CALLING ensureESP32Core() ***');

    // Send immediate feedback to user
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('serial-data', '[SYSTEM] Checking ESP32 platform installation...\n');
    }

    const coreInstalled = await ensureESP32Core();
    console.log(`[compile-code] ensureESP32Core() returned: ${coreInstalled}`);

    if (!coreInstalled) {
      const errorMsg = 'ESP32 core installation failed. Please install manually:\narduino-cli core install esp32:esp32 --additional-urls https://dl.espressif.com/dl/package_esp32_index.json';
      console.error(`[compile-code] ${errorMsg}`);
      return {
        success: false,
        error: errorMsg
      };
    }
    console.log('[compile-code] ESP32 core verified, proceeding with compilation...');
  }

  try {
    fs.mkdirSync(sketchDir, { recursive: true });

    // ── ESP32 sketch preprocessing ──────────────────────────────────────────
    // Replace AVR-only Servo.h with ESP32Servo.h (incompatible with ESP32 core v3+)
    // Also migrate LEDC API from v2 (ledcSetup/ledcAttachPin) to v3 (ledcAttach)
    let processedCode = code;
    if (isESP32) {
      processedCode = processedCode.replace(/#include\s*[<"]Servo\.h[>"]/g, '#include <ESP32Servo.h>');
      await ensureESP32Library('ESP32Servo');
      // Migrate LEDC API v2 → v3
      processedCode = migrateESP32LedcAPI(processedCode);
    }

    fs.writeFileSync(sketchPath, processedCode);

    const cliArgs = ['compile', '--fqbn', fqbn, '--output-dir', tempDir];

    // For ESP32: skip forge-lib/libraries to avoid AVR-only library conflicts
    if (!isESP32 && fs.existsSync(FORGE_LIB_LIBRARIES)) {
      cliArgs.push('--libraries', FORGE_LIB_LIBRARIES);
    }
    cliArgs.push(sketchDir);

    const { stdout, stderr, code: exitCode } = await runCLI(cliArgs);

    console.log(`[compile-code] exit=${exitCode} fqbn=${fqbn}`);
    // Log full output for debugging
    if (stdout) console.log(`[compile-code] stdout: ${stdout.slice(0, 500)}`);
    if (stderr) console.log(`[compile-code] stderr: ${stderr.slice(0, 500)}`);

    if (exitCode !== 0) {
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) { }
      // Return the actual compiler error so the user sees it in serial monitor
      const errMsg = stderr || stdout || `Compiler exited with code ${exitCode}`;
      return { success: false, error: errMsg };
    }

    // Scan output dir for the compiled artifact
    const files = fs.readdirSync(tempDir);
    console.log(`[compile-code] output files: ${files.join(', ')}`);

    if (isESP32) {
      // arduino-cli outputs: sketch.ino.bin (app binary)
      // Also may output: sketch.ino.bootloader.bin, sketch.ino.partitions.bin
      // We want the main app binary — prefer sketch.ino.bin
      const binFile = files.find(f => f === 'sketch.ino.bin')
        ?? files.find(f => f.endsWith('.bin') && !f.includes('bootloader') && !f.includes('partition'));
      if (binFile) {
        const binPath = path.join(tempDir, binFile);
        if (isESP32QEMU) {
          // QEMU path: return the .bin file path on disk — do NOT delete tempDir.
          // QEMU needs the file to still exist when startQemu() is called.
          // Cleanup happens in esp32-stop via cleanupESP32Build().
          if (lastESP32BinTempDir) {
            cleanupESP32Build(lastESP32BinTempDir);
          }
          lastESP32BinTempDir = tempDir;
          return { success: true, binPath };
        }
        // Legacy esp32: path — convert to Intel HEX for the old simulation path
        const binContent = fs.readFileSync(binPath);
        const hexContent = binToIntelHex(binContent);
        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) { }
        return { success: true, hexContent };
      }
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) { }
      return { success: false, error: `ESP32 compiled (exit 0) but no .bin found. Files: ${files.join(', ')}` };
    } else {
      const hexFile = files.find(f => f.endsWith('.hex'));
      if (hexFile) {
        const hexContent = fs.readFileSync(path.join(tempDir, hexFile), 'utf-8');
        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) { }
        return { success: true, hexContent };
      }
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) { }
      return { success: false, error: `Compiled (exit 0) but no .hex found. Files: ${files.join(', ')}` };
    }
  } catch (err) {
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) { }
    return { success: false, error: err.message };
  }
});

/**
 * Convert a raw binary Buffer to a minimal Intel HEX string.
 * The ESP32Engine's parseHex() will decode this back to bytes.
 * Uses 16-byte data records (type 00) with correct checksums.
 */
function binToIntelHex(buf) {
  const RECORD_SIZE = 16;
  let hex = '';

  for (let offset = 0; offset < buf.length; offset += RECORD_SIZE) {
    const chunk = buf.slice(offset, Math.min(offset + RECORD_SIZE, buf.length));
    const len = chunk.length;
    const addr = offset & 0xFFFF;

    // Extended Linear Address record every 64KB
    if (offset > 0 && (offset & 0xFFFF) === 0) {
      const seg = (offset >> 16) & 0xFFFF;
      const segHi = (seg >> 8) & 0xFF;
      const segLo = seg & 0xFF;
      const segCheck = (0x100 - ((2 + 0 + 4 + segHi + segLo) & 0xFF)) & 0xFF;
      hex += `:02000004${segHi.toString(16).padStart(2, '0').toUpperCase()}${segLo.toString(16).padStart(2, '0').toUpperCase()}${segCheck.toString(16).padStart(2, '0').toUpperCase()}\n`;
    }

    let sum = len + ((addr >> 8) & 0xFF) + (addr & 0xFF) + 0x00;
    let data = '';
    for (let i = 0; i < len; i++) {
      sum += chunk[i];
      data += chunk[i].toString(16).padStart(2, '0').toUpperCase();
    }
    const checksum = (0x100 - (sum & 0xFF)) & 0xFF;

    hex += `:${len.toString(16).padStart(2, '0').toUpperCase()}${addr.toString(16).padStart(4, '0').toUpperCase()}00${data}${checksum.toString(16).padStart(2, '0').toUpperCase()}\n`;
  }

  hex += ':00000001FF\n'; // EOF record
  return hex;
}

// ── forge-compile: kept for backward compat, delegates to compile-code logic ─
ipcMain.handle('forge-compile', async (_, { code, board }) => {
  const isESP32 = board && board.startsWith('esp32:');
  const tempDir = path.join(app.getPath('temp'), `forge_sketch_${Date.now()}`);
  const sketchPath = path.join(tempDir, 'sketch.ino');

  if (isESP32) await ensureESP32Core();

  try {
    fs.mkdirSync(tempDir, { recursive: true });
    fs.writeFileSync(sketchPath, code);

    const { stdout, stderr, code: exitCode } = await runCLI([
      'compile',
      '--fqbn', board || 'arduino:avr:uno',
      '--libraries', FORGE_LIB_LIBRARIES,
      '--output-dir', tempDir,
      sketchPath
    ]);

    if (exitCode !== 0) {
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) { }
      return { success: false, error: stderr || stdout };
    }

    const files = fs.readdirSync(tempDir);

    if (isESP32) {
      const binFile = files.find(f => f.endsWith('.bin'));
      if (binFile) {
        const hexContent = binToIntelHex(fs.readFileSync(path.join(tempDir, binFile)));
        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) { }
        return { success: true, hexContent };
      }
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) { }
      return { success: false, error: 'No .bin output found.' };
    } else {
      const hexFile = files.find(f => f.endsWith('.hex'));
      if (hexFile) {
        const hexContent = fs.readFileSync(path.join(tempDir, hexFile), 'utf-8');
        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) { }
        return { success: true, hex: hexContent };
      }
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) { }
      return { success: false, error: 'HEX file not generated' };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ── migrateESP32LedcAPI: rewrite old LEDC v2 API to v3 ───────────────────
// ESP32 core v3 removed ledcSetup() and ledcAttachPin().
// Old: ledcSetup(ch, freq, res) + ledcAttachPin(pin, ch) + ledcWrite(ch, duty)
// New: ledcAttach(pin, freq, res) + ledcWrite(pin, duty)
function migrateESP32LedcAPI(code) {
  const chMap = new Map();

  // Collect ledcSetup(ch, freq, res)
  for (const m of code.matchAll(/ledcSetup\s*\(\s*(\w+)\s*,\s*([^,]+?)\s*,\s*([^)]+?)\s*\)/g)) {
    const [, ch, freq, res] = m;
    const entry = chMap.get(ch) ?? { freq: freq.trim(), res: res.trim(), pin: '' };
    entry.freq = freq.trim(); entry.res = res.trim();
    chMap.set(ch, entry);
  }
  // Collect ledcAttachPin(pin, ch)
  for (const m of code.matchAll(/ledcAttachPin\s*\(\s*([^,]+?)\s*,\s*(\w+)\s*\)/g)) {
    const [, pin, ch] = m;
    const entry = chMap.get(ch) ?? { freq: '5000', res: '8', pin: '' };
    entry.pin = pin.trim();
    chMap.set(ch, entry);
  }

  if (chMap.size === 0) return code; // nothing to migrate

  console.log('[FORGE] Migrating LEDC API v2 → v3:', [...chMap.entries()].map(([ch, v]) => `ch${ch}→pin${v.pin}`).join(', '));

  let result = code;
  // Remove old calls
  result = result.replace(/[ \t]*ledcSetup\s*\([^)]*\)\s*;[ \t]*\n?/g, '');
  result = result.replace(/[ \t]*ledcAttachPin\s*\([^)]*\)\s*;[ \t]*\n?/g, '');

  // Insert ledcAttach() calls at start of setup()
  const attachCalls = [...chMap.entries()]
    .filter(([, v]) => v.pin)
    .map(([, v]) => `  ledcAttach(${v.pin}, ${v.freq}, ${v.res});`)
    .join('\n');
  if (attachCalls) {
    result = result.replace(/(void\s+setup\s*\(\s*\)\s*\{)/, `$1\n${attachCalls}`);
  }

  // Replace ledcWrite(ch, duty) → ledcWrite(pin, duty)
  result = result.replace(/ledcWrite\s*\(\s*(\w+)\s*,\s*([^)]+)\s*\)/g, (match, ch, duty) => {
    const entry = chMap.get(ch);
    return entry?.pin ? `ledcWrite(${entry.pin}, ${duty.trim()})` : match;
  });

  return result;
}

// ── ESP32 QEMU simulation pipeline ───────────────────────────────────────
const ESP32_FQBNS = ['esp32:esp32:esp32', 'esp32:esp32:esp32s3'];
const { compileESP32 } = makeESP32Compiler({ runCLI, forgeLibDir: FORGE_LIB_DIR });

// Track the last binPath so we can clean it up after QEMU stops
let lastESP32BinTempDir = null;

/**
 * compile-esp32-sim: compile an ESP32 sketch and return the .bin path on disk.
 * The temp dir is NOT deleted — QEMU needs the file.
 * Call esp32-stop to stop QEMU, then the temp dir is cleaned up automatically.
 */
ipcMain.handle('compile-esp32-sim', async (_, code, fqbn) => {
  // Clean up previous build if still around
  if (lastESP32BinTempDir) {
    cleanupESP32Build(lastESP32BinTempDir);
    lastESP32BinTempDir = null;
  }

  const result = await compileESP32(code, fqbn || 'esp32:esp32:esp32');
  if (result.success) {
    // Remember the temp dir so we can clean it up on stop
    lastESP32BinTempDir = require('path').dirname(result.binPath);
  }
  return result; // { success, binPath } or { success: false, error }
});

ipcMain.handle('esp32-start', async (_, binPath) => {
  await qemuManager.startQemu(binPath, mainWindow);
  return { ok: true };
});

ipcMain.handle('esp32-stop', async () => {
  qemuManager.stopQemu();
  // Clean up the .bin temp dir now that QEMU has stopped
  if (lastESP32BinTempDir) {
    cleanupESP32Build(lastESP32BinTempDir);
    lastESP32BinTempDir = null;
  }
  return { ok: true };
});

ipcMain.handle('esp32-gpio-set', async (_, pin, high) => {
  const socket = await qemuManager.connectQMP();
  await qemuManager.sendQMPCommand(socket, {
    execute: 'gpio-set',
    arguments: { name: `GPIO${pin}`, level: high ? 1 : 0 },
  });
  socket.destroy();
});

ipcMain.handle('esp32-adc-set', async (_, channel, voltage) => {
  const socket = await qemuManager.connectQMP();
  await qemuManager.sendQMPCommand(socket, {
    execute: 'qom-set',
    arguments: {
      path: `/machine/soc/adc/channel[${channel}]`,
      property: 'voltage',
      value: voltage,
    },
  });
  socket.destroy();
});

// ── ensureESP32Core: install ESP32 arduino core on first use ─────────────
let esp32CoreReady = false;

// ── warmupESP32Core: silent background pre-check at app startup ──────────
// Runs once after the window opens. If the core is already installed this
// takes ~200 ms (one arduino-cli core list call) and sets esp32CoreReady=true
// so the first compile skips the check entirely.
async function warmupESP32Core() {
  try {
    const { stdout, code } = await runCLI(['core', 'list', '--format', 'json']);
    if (code !== 0) return;
    let cores = [];
    try { cores = JSON.parse(stdout); } catch (_) { return; }
    const installed = Array.isArray(cores) && cores.some(c =>
      (c.id && (c.id.startsWith('esp32:') || c.id.startsWith('espressif:'))) ||
      (c.platform?.id && (c.platform.id.startsWith('esp32:') || c.platform.id.startsWith('espressif:')))
    );
    if (installed) {
      esp32CoreReady = true;
      console.log('[STARTUP] ESP32 core pre-check: ✓ already installed');
    } else {
      console.log('[STARTUP] ESP32 core pre-check: not installed (will install on first compile)');
    }
  } catch (err) {
    console.warn('[STARTUP] ESP32 core pre-check failed (non-fatal):', err.message);
  }
}

// ── warmupQemu: verify QEMU binary exists at startup ─────────────────────
// Ensures the binary is present so the first ESP32 simulation doesn't stall
// on a download. If missing, triggers the download in the background.
async function warmupQemu() {
  try {
    await qemuManager.ensureQemuSilent();
    console.log('[STARTUP] QEMU pre-check: ✓ binary ready');
  } catch (err) {
    console.warn('[STARTUP] QEMU pre-check failed (non-fatal):', err.message);
  }
}

async function ensureESP32Core() {
  if (esp32CoreReady) return true;

  // Send progress to renderer
  const sendProgress = (msg) => {
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('serial-data', `[ESP32 SETUP] ${msg}\n`);
    }
    console.log(`[FORGE] ${msg}`);
  };

  // Both URLs — Espressif CDN (primary) + GitHub fallback
  const ESP32_URLS = [
    'https://dl.espressif.com/dl/package_esp32_index.json',
    'https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json',
  ];

  // Ensure the config file has the board manager URLs
  try {
    const configContent = fs.readFileSync(FORGE_CLI_YAML, 'utf-8');
    if (!configContent.includes('dl.espressif.com') && !configContent.includes('espressif/arduino-esp32')) {
      const updatedConfig = configContent.trimEnd() + `\n\nboard_manager:\n  additional_urls:\n${ESP32_URLS.map(u => `    - ${u}`).join('\n')}\n`;
      fs.writeFileSync(FORGE_CLI_YAML, updatedConfig, 'utf-8');
      sendProgress('Added ESP32 board manager URLs to config');
    }
  } catch (err) {
    console.warn('[FORGE] Could not update arduino-cli.yaml:', err.message);
  }

  try {
    sendProgress('Checking for ESP32 core installation...');
    const { stdout, stderr, code: listCode } = await runCLI(['core', 'list', '--format', 'json']);

    if (listCode !== 0) {
      console.error('[FORGE] Failed to list cores:', stderr);
      sendProgress('ERROR: Failed to list installed cores');
      return false;
    }

    let cores = [];
    try { cores = JSON.parse(stdout); } catch (e) {
      console.warn('[FORGE] Failed to parse core list:', e.message);
    }

    const installed = Array.isArray(cores) && cores.some(c =>
      (c.id && (c.id.startsWith('esp32:') || c.id.startsWith('espressif:'))) ||
      (c.platform && c.platform.id && (c.platform.id.startsWith('esp32:') || c.platform.id.startsWith('espressif:')))
    );

    if (!installed) {
      sendProgress('ESP32 core not found — installing (this may take 2-5 minutes)...');
      sendProgress('Please wait, downloading ESP32 platform...');

      // Update index with both URLs
      const { code: updateCode, stderr: updateErr } = await runCLI([
        'core', 'update-index',
        '--additional-urls', ESP32_URLS.join(',')
      ]);

      if (updateCode !== 0) {
        console.error('[FORGE] Failed to update index:', updateErr);
        sendProgress('ERROR: Failed to update package index');
        return false;
      }

      sendProgress('Package index updated, installing ESP32 core...');

      // Try primary URL first, fall back to secondary
      let installOk = false;
      for (const url of ESP32_URLS) {
        const urlShort = url.includes('dl.espressif.com') ? 'Espressif CDN' : 'GitHub';
        sendProgress(`Attempting install via ${urlShort}...`);

        const { code: installCode, stdout: installOut, stderr: installErr } = await runCLI([
          'core', 'install', 'esp32:esp32',
          '--additional-urls', url
        ]);

        if (installCode === 0) {
          installOk = true;
          sendProgress(`✓ ESP32 core installed successfully!`);
          console.log(`[FORGE] ✓ ESP32 core installed successfully via ${url}`);
          break;
        } else {
          const errMsg = installErr || installOut || 'Unknown error';
          console.warn(`[FORGE] Install attempt failed with ${url}:`, errMsg);
          sendProgress(`Install via ${urlShort} failed, trying next...`);
        }
      }

      if (!installOk) {
        console.error('[FORGE] ✗ All ESP32 core install attempts failed.');
        sendProgress('ERROR: All ESP32 core install attempts failed');
        sendProgress('Please install manually: arduino-cli core install esp32:esp32');
        return false;
      }
    } else {
      sendProgress('✓ ESP32 core already installed');
      console.log('[FORGE] ✓ ESP32 core already installed.');
    }

    esp32CoreReady = true;
    return true;
  } catch (err) {
    console.error('[FORGE] ESP32 core check/install error:', err.message);
    sendProgress(`ERROR: ${err.message}`);
    return false;
  }
}

// ── ensureESP32Library: install an ESP32-compatible library ───────────────
const esp32LibsInstalled = new Set();
async function ensureESP32Library(libName) {
  if (esp32LibsInstalled.has(libName)) return;
  try {
    const { stdout } = await runCLI(['lib', 'list', '--format', 'json']);
    let libs = [];
    try { libs = JSON.parse(stdout || '[]'); } catch (_) { }
    const found = libs.some(l =>
      (l.library?.name ?? l.name ?? '').toLowerCase() === libName.toLowerCase()
    );
    if (!found) {
      console.log(`[FORGE] Installing ESP32 library: ${libName}`);
      await runCLI(['lib', 'install', libName]);
      console.log(`[FORGE] Installed: ${libName}`);
    }
    esp32LibsInstalled.add(libName);
  } catch (err) {
    console.warn(`[FORGE] Library install warning (${libName}):`, err.message);
    esp32LibsInstalled.add(libName); // don't retry
  }
}
