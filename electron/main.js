const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const buildApk = require('./buildApk');

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
function runCLI(args) {
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
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    // Open the DevTools.
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../build/index.html'));
  }
}

app.whenReady().then(() => {
  startBuildServer();
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  stopBuildServer();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  stopBuildServer();
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
  const cliPath = isDev
    ? path.join(APP_ROOT, 'arduino-cli', 'arduino-cli.exe')
    : path.join(process.resourcesPath, 'arduino-cli', 'arduino-cli.exe');

  try {
    fs.mkdirSync(tempDir, { recursive: true });
    fs.writeFileSync(sketchPath, code);

    return new Promise((resolve) => {
      const compile = spawn(cliPath, [
        'compile',
        '--fqbn', 'arduino:avr:uno',
        '--output-dir', tempDir,
        sketchPath
      ]);

      let errorOutput = '';
      compile.stderr.on('data', (data) => errorOutput += data.toString());

      compile.on('close', (code) => {
        if (code === 0) {
          const hexPath = path.join(tempDir, 'sketch.ino.hex');
          if (fs.existsSync(hexPath)) {
            const hexContent = fs.readFileSync(hexPath, 'utf-8');
            resolve({ success: true, hex: hexContent });
          } else {
            resolve({ success: false, error: 'HEX file not generated' });
          }
        } else {
          resolve({ success: false, error: errorOutput || `Compiler exited with code ${code}` });
        }
        // Cleanup
        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) { }
      });
    });
  } catch (err) {
    return { success: false, error: err.message };
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
ipcMain.handle('compile-code', async (_, code, fqbn = 'arduino:avr:uno', _libraryPath) => {
  const isESP32 = typeof fqbn === 'string' && fqbn.startsWith('esp32:');
  const tempDir = path.join(app.getPath('temp'), `forge_sketch_${Date.now()}`);
  // arduino-cli requires the sketch file to have the same name as its folder
  const sketchDir = path.join(tempDir, 'sketch');
  const sketchPath = path.join(sketchDir, 'sketch.ino');

  // Ensure ESP32 core is installed on first use (cached after first run)
  if (isESP32) {
    await ensureESP32Core();
  }

  try {
    fs.mkdirSync(sketchDir, { recursive: true });
    fs.writeFileSync(sketchPath, code);

    // Only pass --libraries if the directory actually exists (avoids cli errors)
    const cliArgs = [
      'compile',
      '--fqbn', fqbn,
      '--output-dir', tempDir,
    ];
    if (fs.existsSync(FORGE_LIB_LIBRARIES)) {
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
        const binContent = fs.readFileSync(path.join(tempDir, binFile));
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

// ── ensureESP32Core: install ESP32 arduino core on first use ─────────────
let esp32CoreReady = false;
async function ensureESP32Core() {
  if (esp32CoreReady) return; // already verified this session

  const ESP32_URL = 'https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json';
  try {
    // Check if already installed first (fast path)
    const { stdout } = await runCLI(['core', 'list', '--format', 'json']);
    let cores = [];
    try { cores = JSON.parse(stdout); } catch (_) { }
    const installed = Array.isArray(cores) && cores.some(c =>
      (c.id && c.id.startsWith('esp32:')) ||
      (c.platform && c.platform.id && c.platform.id.startsWith('esp32:'))
    );

    if (!installed) {
      console.log('[FORGE] ESP32 core not found — installing (this may take a few minutes)...');
      await runCLI(['core', 'update-index', '--additional-urls', ESP32_URL]);
      await runCLI(['core', 'install', 'esp32:esp32', '--additional-urls', ESP32_URL]);
      console.log('[FORGE] ESP32 core installed.');
    } else {
      console.log('[FORGE] ESP32 core already installed.');
    }
    esp32CoreReady = true;
  } catch (err) {
    console.warn('[FORGE] ESP32 core check/install warning:', err.message);
    // Don't block compilation — attempt anyway
    esp32CoreReady = true;
  }
}
