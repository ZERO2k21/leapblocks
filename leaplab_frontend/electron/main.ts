import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import { spawn, ChildProcess } from 'child_process';

// Dynamic requires for local helpers
let buildApk: any;
try {
  buildApk = require(path.join(__dirname, '..', 'src', 'creova', 'apk', 'electron-bridge.js'));
} catch (err) {
  buildApk = async () => { throw new Error('APK build bridge not found'); };
}

let makeESP32Compiler: any;
let cleanupESP32Build: any = (_dir: string) => {};
try {
  const compiler = require('./esp32Compiler');
  makeESP32Compiler = compiler.makeESP32Compiler;
  cleanupESP32Build = compiler.cleanupESP32Build || cleanupESP32Build;
} catch (err) {
  makeESP32Compiler = () => ({
    compileESP32: async () => ({ success: false, error: 'ESP32 compiler module not found' })
  });
}

let makeESP32Uploader: any;
try {
  makeESP32Uploader = require('./esp32Uploader').makeESP32Uploader;
} catch (err) {
  makeESP32Uploader = () => {};
}

const qemuManager = {
  stopQemu: () => { },
  startQemu: async (_binPath?: string, _win?: any) => { },
  connectQMP: async (): Promise<any> => { throw new Error('QMP not available'); },
  sendQMPCommand: async (_socket?: any, _cmd?: any) => { },
  ensureQemuSilent: async () => { },
};

const isDev = !app.isPackaged;
const APP_ROOT = app.getAppPath();

// ── forge-lib paths ────────────────────────
const FORGE_LIB_DIR = isDev
  ? path.join(APP_ROOT, 'forge-lib')
  : path.join(process.resourcesPath, 'forge-lib');

const FORGE_LIB_LIBRARIES = path.join(FORGE_LIB_DIR, 'libraries');
const FORGE_CLI_YAML = path.join(FORGE_LIB_DIR, 'arduino-cli.yaml');

const CLI_PATH = isDev
  ? path.join(APP_ROOT, 'src', 'drivers', 'arduino-cli', 'arduino-cli.exe')
  : path.join(process.resourcesPath, 'arduino-cli', 'arduino-cli.exe');

export interface CLIResult {
  stdout: string;
  stderr: string;
  code: number;
}

/** Run arduino-cli with the forge-lib config and return { stdout, stderr, code } */
async function runCLI(args: string[]): Promise<CLIResult> {
  return new Promise((resolve) => {
    const proc = spawn(CLI_PATH, ['--config-file', FORGE_CLI_YAML, ...args], {
      env: { ...process.env }
    });
    let stdout = '', stderr = '';
    proc.stdout.on('data', d => { stdout += d.toString(); });
    proc.stderr.on('data', d => { stderr += d.toString(); });
    proc.on('close', code => resolve({ stdout, stderr, code: code ?? -1 }));
    proc.on('error', err => resolve({ stdout: '', stderr: err.message, code: -1 }));
  });
}

// ── Local Build Server Management ─────────
let buildServerProcess: ChildProcess | null = null;

function startBuildServer(): void {
  const serverPath = isDev
    ? path.join(__dirname, '..', 'src', 'studio', 'build-server', 'server.js')
    : path.join(process.resourcesPath, 'src', 'studio', 'build-server', 'server.js');

  if (!fs.existsSync(serverPath)) {
    console.log('[BUILD-SERVER] Server file not found at:', serverPath);
    return;
  }

  buildServerProcess = spawn('node', [serverPath], {
    env: { ...process.env, BUILD_PORT: '3002' },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
  });

  buildServerProcess.stdout?.on('data', (data: Buffer | string) => {
    console.log(`[BUILD-SERVER] ${data.toString().trim()}`);
  });

  buildServerProcess.stderr?.on('data', (data: Buffer | string) => {
    console.error(`[BUILD-SERVER ERROR] ${data.toString().trim()}`);
  });

  buildServerProcess.on('close', (code: number | null) => {
    console.log(`[BUILD-SERVER] Exited with code ${code}`);
    buildServerProcess = null;
  });

  console.log('[BUILD-SERVER] Started on http://localhost:3001');
}

function stopBuildServer(): void {
  if (buildServerProcess) {
    buildServerProcess.kill();
    buildServerProcess = null;
    console.log('[BUILD-SERVER] Stopped');
  }
}

// ── Electra Compile Server (Arduino compile + transpile) ─────────────────
let compileServerProcess: ChildProcess | null = null;

function startCompileServer(): void {
  const serverPath = isDev
    ? (fs.existsSync(path.join(__dirname, '..', 'server', 'server.ts'))
        ? path.join(__dirname, '..', 'server', 'server.ts')
        : path.join(__dirname, '..', 'server', 'server.js'))
    : path.join(process.resourcesPath, 'server', 'server.js');

  if (!fs.existsSync(serverPath)) {
    console.log('[COMPILE-SERVER] Server file not found at:', serverPath);
    console.log('[COMPILE-SERVER] Run: cd server && npm install');
    return;
  }

  // Check node_modules exist for the compiler-server
  const nmPath = isDev
    ? path.join(__dirname, '..', 'server', 'node_modules')
    : path.join(process.resourcesPath, 'server', 'node_modules');

  if (!fs.existsSync(nmPath)) {
    console.log('[COMPILE-SERVER] node_modules missing — run: cd server && npm install');
    return;
  }

  compileServerProcess = spawn('node', [serverPath], {
    env: {
      ...process.env,
      PORT: '3001',
      // Point arduino-cli to the bundled binary
      ARDUINO_CLI_PATH: isDev
        ? path.join(__dirname, '..', 'src', 'drivers', 'arduino-cli', 'arduino-cli.exe')
        : path.join(process.resourcesPath, 'arduino-cli', 'arduino-cli.exe'),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
  });

  compileServerProcess.stdout?.on('data', (data: Buffer | string) => {
    console.log(`[COMPILE-SERVER] ${data.toString().trim()}`);
  });
  compileServerProcess.stderr?.on('data', (data: Buffer | string) => {
    console.error(`[COMPILE-SERVER ERROR] ${data.toString().trim()}`);
  });
  compileServerProcess.on('close', (code: number | null) => {
    console.log(`[COMPILE-SERVER] Exited with code ${code}`);
    compileServerProcess = null;
  });

  console.log('[COMPILE-SERVER] Started on http://localhost:3001');
}

function stopCompileServer(): void {
  if (compileServerProcess) {
    compileServerProcess.kill();
    compileServerProcess = null;
    console.log('[COMPILE-SERVER] Stopped');
  }
}

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  const iconPath = isDev
    ? path.join(APP_ROOT, 'public', 'assets', 'leaplabicon.ico')
    : path.join(process.resourcesPath, 'public', 'assets', 'leaplabicon.ico');
  const resolvedIcon = fs.existsSync(iconPath) ? iconPath : undefined;

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    icon: resolvedIcon,
    title: "LeapLab",
    // Hide until content is painted — eliminates the white flash on startup
    show: false,
    backgroundColor: '#f8fafc', // matches the app background so no flicker
    webPreferences: {
      preload: isDev
        ? path.join(__dirname, '../dist/preload/preload.js')
        : path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // Enable background throttling suppression for smoother startup
      backgroundThrottling: false,
    }
  });

  // Show the window only when the renderer has finished its first paint
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../build/index.html'));
  }
}

app.whenReady().then(async () => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.creoleap.leapblocks');
  }
  createWindow();
  startBuildServer();
  startCompileServer();

  await Promise.allSettled([
    warmupESP32Core(),
  ]);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  stopBuildServer();
  stopCompileServer();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  stopBuildServer();
  stopCompileServer();
  qemuManager.stopQemu();
});

// IPC Handlers

ipcMain.handle('build-apk', async (event, appState) => {
  const logCallback = (msg: string) => {
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
  } catch (error: any) {
    return { success: false, error: error.message || error.toString() };
  }
});

ipcMain.handle('compile-arduino', async (_, code: string) => {
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
  } catch (err: any) {
    return { success: false, error: err.message };
  } finally {
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) { }
  }
});

ipcMain.handle('show-in-folder', (_, filePath: string) => {
  shell.showItemInFolder(filePath);
});

ipcMain.handle('save-project', async (_, data: any, existingPath?: string) => {
  let targetPath = existingPath;

  if (!targetPath) {
    if (!mainWindow) return { success: false, error: 'No main window' };
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Save LeapBlocks Project File',
      defaultPath: 'project.lbp',
      buttonLabel: 'Save Project',
      filters: [
        { name: 'LeapBlocks Project', extensions: ['lbp'] }
      ]
    });
    if (!filePath) return { success: false };
    targetPath = filePath;
  }

  try {
    fs.writeFileSync(targetPath, JSON.stringify(data, null, 2));
    return { success: true, projectPath: targetPath };
  } catch (err: any) {
    console.error("Failed to save project:", err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('open-project', async () => {
  if (!mainWindow) return null;
  const { filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Open LeapBlocks Project File',
    properties: ['openFile'],
    filters: [
      { name: 'LeapBlocks Project', extensions: ['lbp'] }
    ]
  });

  if (filePaths && filePaths.length > 0) {
    const projectPath = filePaths[0];
    try {
      const content = fs.readFileSync(projectPath, 'utf-8');
      const data = JSON.parse(content);
      return { data, projectPath };
    } catch (e) {
      console.error("Invalid project file", e);
      return null;
    }
  }
  return null;
});

// ── forge-lib: install a library via arduino-cli ──────────────────────────
ipcMain.handle('forge-lib-install', async (_, libraryName: string) => {
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
  const libs: any[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const libDir = path.join(FORGE_LIB_LIBRARIES, entry.name);
    const propFile = path.join(libDir, 'library.properties');
    if (fs.existsSync(propFile)) {
      const props: Record<string, string> = {};
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
ipcMain.handle('forge-lib-remove', async (_, libraryName: string) => {
  console.log(`[FORGE-LIB] Removing: ${libraryName}`);

  const { code, stderr } = await runCLI(['lib', 'uninstall', libraryName]);

  let manualRemoved = false;
  if (fs.existsSync(FORGE_LIB_LIBRARIES)) {
    try {
      const entries = fs.readdirSync(FORGE_LIB_LIBRARIES, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const libDir = path.join(FORGE_LIB_LIBRARIES, entry.name);

        let match = (entry.name === libraryName);
        if (!match) {
          const propFile = path.join(libDir, 'library.properties');
          if (fs.existsSync(propFile)) {
            const props = fs.readFileSync(propFile, 'utf-8').split('\n').reduce((acc: Record<string, string>, line) => {
              const [k, ...v] = line.split('=');
              if (k && v.length) acc[k.trim()] = v.join('=').trim();
              return acc;
            }, {});
            if (props.name === libraryName) match = true;
          }
        }

        if (match) {
          console.log(`[FORGE-LIB] Force removing directory: ${libDir}`);
          fs.rmSync(libDir, { recursive: true, force: true });
          manualRemoved = true;
        }
      }
    } catch (e: any) {
      console.warn('[FORGE-LIB] Manual cleanup error:', e.message);
    }
  }

  return (code === 0 || manualRemoved) ? { success: true, manualRemoved } : { success: false, error: stderr };
});

ipcMain.handle('compile-code', async (_, code: string, fqbn: string = 'arduino:avr:uno', _libraryPath?: string) => {
  console.log(`[compile-code] ========== COMPILE START ==========`);
  console.log(`[compile-code] FQBN: ${fqbn}`);

  const isESP32 = typeof fqbn === 'string' && fqbn.startsWith('esp32:');
  const isESP32QEMU = isESP32;

  console.log(`[compile-code] isESP32: ${isESP32}, isESP32QEMU: ${isESP32QEMU}`);

  const tempDir = path.join(app.getPath('temp'), `forge_sketch_${Date.now()}`);
  const sketchDir = path.join(tempDir, 'sketch');
  const sketchPath = path.join(sketchDir, 'sketch.ino');

  if (isESP32) {
    console.log('[compile-code] *** ESP32 DETECTED - CALLING ensureESP32Core() ***');

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

    let processedCode = code;
    if (isESP32) {
      processedCode = processedCode.replace(/#include\s*[<"]Servo\.h[>"]/g, '#include <ESP32Servo.h>');
      await ensureESP32Library('ESP32Servo');
      processedCode = migrateESP32LedcAPI(processedCode);
    }

    fs.writeFileSync(sketchPath, processedCode);

    const cliArgs = ['compile', '--fqbn', fqbn, '--output-dir', tempDir];

    if (!isESP32 && fs.existsSync(FORGE_LIB_LIBRARIES)) {
      cliArgs.push('--libraries', FORGE_LIB_LIBRARIES);
    }
    cliArgs.push(sketchDir);

    const { stdout, stderr, code: exitCode } = await runCLI(cliArgs);

    console.log(`[compile-code] exit=${exitCode} fqbn=${fqbn}`);
    if (stdout) console.log(`[compile-code] stdout: ${stdout.slice(0, 500)}`);
    if (stderr) console.log(`[compile-code] stderr: ${stderr.slice(0, 500)}`);

    if (exitCode !== 0) {
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) { }
      const errMsg = stderr || stdout || `Compiler exited with code ${exitCode}`;
      return { success: false, error: errMsg };
    }

    const files = fs.readdirSync(tempDir);
    console.log(`[compile-code] output files: ${files.join(', ')}`);

    if (isESP32) {
      const binFile = files.find(f => f === 'sketch.ino.bin')
        ?? files.find(f => f.endsWith('.bin') && !f.includes('bootloader') && !f.includes('partition'));
      if (binFile) {
        const binPath = path.join(tempDir, binFile);
        if (isESP32QEMU) {
          try {
            const mergedPath = path.join(tempDir, 'flash_image.bin');
            buildMergedFlashImage(tempDir, files, binPath, mergedPath);
            if (lastESP32BinTempDir) {
              cleanupESP32Build(lastESP32BinTempDir);
            }
            lastESP32BinTempDir = tempDir;
            return { success: true, binPath: mergedPath };
          } catch (mergeErr: any) {
            console.error('[compile-code] Flash merge failed:', mergeErr.message);
            try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) { }
            return { success: false, error: `Flash image merge failed: ${mergeErr.message}` };
          }
        }
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
  } catch (err: any) {
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) { }
    return { success: false, error: err.message };
  }
});

function buildMergedFlashImage(tempDir: string, files: string[], appBinPath: string, outPath: string): void {
  const FLASH_SIZE = 4 * 1024 * 1024;
  const BOOTLOADER_OFFSET = 0x1000;
  const PARTITIONS_OFFSET = 0x8000;
  const APP_OFFSET = 0x10000;

  const image = Buffer.alloc(FLASH_SIZE, 0xff);

  const bootFile = files.find(f => f.includes('bootloader') && f.endsWith('.bin'));
  if (bootFile) {
    const bootBin = fs.readFileSync(path.join(tempDir, bootFile));
    if (BOOTLOADER_OFFSET + bootBin.length > PARTITIONS_OFFSET) {
      throw new Error(`Bootloader too large: ${bootBin.length} bytes overflows partition table region`);
    }
    bootBin.copy(image, BOOTLOADER_OFFSET);
    console.log(`[Flash Merge] Bootloader @ 0x${BOOTLOADER_OFFSET.toString(16)}: ${bootBin.length} bytes`);
  } else {
    console.warn('[Flash Merge] No bootloader.bin found — region left as 0xFF (erased)');
  }

  const partFile = files.find(f => (f.includes('partition') || f.includes('partitions')) && f.endsWith('.bin'));
  if (partFile) {
    const partBin = fs.readFileSync(path.join(tempDir, partFile));
    if (PARTITIONS_OFFSET + partBin.length > APP_OFFSET) {
      throw new Error(`Partition table too large: ${partBin.length} bytes overflows app region`);
    }
    partBin.copy(image, PARTITIONS_OFFSET);
    console.log(`[Flash Merge] Partitions @ 0x${PARTITIONS_OFFSET.toString(16)}: ${partBin.length} bytes`);
  } else {
    console.warn('[Flash Merge] No partitions.bin found — region left as 0xFF (erased)');
  }

  const appBin = fs.readFileSync(appBinPath);
  if (APP_OFFSET + appBin.length > FLASH_SIZE) {
    throw new Error(`App binary too large: ${appBin.length} bytes exceeds 4 MB flash`);
  }
  appBin.copy(image, APP_OFFSET);
  console.log(`[Flash Merge] App @ 0x${APP_OFFSET.toString(16)}: ${appBin.length} bytes`);

  fs.writeFileSync(outPath, image);
  console.log(`[Flash Merge] ✓ Merged flash image written: ${outPath} (${(FLASH_SIZE / 1024 / 1024).toFixed(0)} MB)`);
}

function binToIntelHex(buf: Buffer): string {
  const RECORD_SIZE = 16;
  let hex = '';

  for (let offset = 0; offset < buf.length; offset += RECORD_SIZE) {
    const chunk = buf.slice(offset, Math.min(offset + RECORD_SIZE, buf.length));
    const len = chunk.length;
    const addr = offset & 0xFFFF;

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

  hex += ':00000001FF\n';
  return hex;
}

ipcMain.handle('forge-compile', async (_, { code, board }: { code: string; board?: string }) => {
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
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

function migrateESP32LedcAPI(code: string): string {
  const chMap = new Map<string, { freq: string; res: string; pin: string }>();

  for (const m of code.matchAll(/ledcSetup\s*\(\s*(\w+)\s*,\s*([^,]+?)\s*,\s*([^)]+?)\s*\)/g)) {
    const [, ch, freq, res] = m;
    const entry = chMap.get(ch) ?? { freq: freq.trim(), res: res.trim(), pin: '' };
    entry.freq = freq.trim(); entry.res = res.trim();
    chMap.set(ch, entry);
  }

  for (const m of code.matchAll(/ledcAttachPin\s*\(\s*([^,]+?)\s*,\s*(\w+)\s*\)/g)) {
    const [, pin, ch] = m;
    const entry = chMap.get(ch) ?? { freq: '5000', res: '8', pin: '' };
    entry.pin = pin.trim();
    chMap.set(ch, entry);
  }

  if (chMap.size === 0) return code;

  console.log('[FORGE] Migrating LEDC API v2 → v3:', [...chMap.entries()].map(([ch, v]) => `ch${ch}→pin${v.pin}`).join(', '));

  let result = code;
  result = result.replace(/[ \t]*ledcSetup\s*\([^)]*\)\s*;[ \t]*\n?/g, '');
  result = result.replace(/[ \t]*ledcAttachPin\s*\([^)]*\)\s*;[ \t]*\n?/g, '');

  const attachCalls = [...chMap.entries()]
    .filter(([, v]) => v.pin)
    .map(([, v]) => `  ledcAttach(${v.pin}, ${v.freq}, ${v.res});`)
    .join('\n');
  if (attachCalls) {
    result = result.replace(/(void\s+setup\s*\(\s*\)\s*\{)/, `$1\n${attachCalls}`);
  }

  result = result.replace(/ledcWrite\s*\(\s*(\w+)\s*,\s*([^)]+)\s*\)/g, (match, ch, duty) => {
    const entry = chMap.get(ch);
    return entry?.pin ? `ledcWrite(${entry.pin}, ${duty.trim()})` : match;
  });

  return result;
}

const { compileESP32 } = makeESP32Compiler({ runCLI, forgeLibDir: FORGE_LIB_DIR });
let lastESP32BinTempDir: string | null = null;

ipcMain.handle('compile-esp32-sim', async (_, code: string, fqbn?: string) => {
  if (lastESP32BinTempDir) {
    cleanupESP32Build(lastESP32BinTempDir);
    lastESP32BinTempDir = null;
  }

  const result = await compileESP32(code, fqbn || 'esp32:esp32:esp32c3');
  if (result.success && result.binPath) {
    lastESP32BinTempDir = path.dirname(result.binPath);
  }
  return result;
});

ipcMain.handle('esp32-start', async (_, binPath: string) => {
  await qemuManager.startQemu(binPath, mainWindow);
  return { ok: true };
});

ipcMain.handle('esp32-stop', async () => {
  qemuManager.stopQemu();
  if (lastESP32BinTempDir) {
    cleanupESP32Build(lastESP32BinTempDir);
    lastESP32BinTempDir = null;
  }
  return { ok: true };
});

ipcMain.handle('esp32-gpio-set', async (_, pin: number, high: boolean) => {
  const socket = await qemuManager.connectQMP();
  await qemuManager.sendQMPCommand(socket, {
    execute: 'gpio-set',
    arguments: { name: `GPIO${pin}`, level: high ? 1 : 0 },
  });
  socket.destroy();
});

ipcMain.handle('esp32-adc-set', async (_, channel: number, voltage: number) => {
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

ipcMain.handle('read-bin-file', async (_, filePath: string) => {
  console.log(`[MAIN:IPC] read-bin-file request: ${filePath}`);

  try {
    if (!fs.existsSync(filePath)) {
      console.error(`[MAIN:IPC] File not found: ${filePath}`);
      throw new Error(`Binary file not found: ${filePath}`);
    }

    const buffer = fs.readFileSync(filePath);
    console.log(`[MAIN:IPC] Read ${buffer.length} bytes from ${filePath}`);

    const preview = Array.from(buffer.slice(0, Math.min(16, buffer.length)))
      .map(b => '0x' + b.toString(16).padStart(2, '0'))
      .join(' ');
    console.log(`[MAIN:IPC] First bytes: ${preview}`);

    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  } catch (err: any) {
    console.error(`[MAIN:IPC] read-bin-file error:`, err);
    throw err;
  }
});

let esp32CoreReady = false;

async function warmupESP32Core(): Promise<void> {
  try {
    const { stdout, code } = await runCLI(['core', 'list', '--format', 'json']);
    if (code !== 0) return;
    let cores: any[] = [];
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
  } catch (err: any) {
    console.warn('[STARTUP] ESP32 core pre-check failed (non-fatal):', err.message);
  }
}

async function warmupQemu(): Promise<void> {
  try {
    await qemuManager.ensureQemuSilent();
    console.log('[STARTUP] QEMU pre-check: ✓ binary ready');
  } catch (err: any) {
    console.warn('[STARTUP] QEMU pre-check failed (non-fatal):', err.message);
  }
}

async function ensureESP32Core(): Promise<boolean> {
  if (esp32CoreReady) return true;

  const sendProgress = (msg: string) => {
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('serial-data', `[ESP32 SETUP] ${msg}\n`);
    }
    console.log(`[FORGE] ${msg}`);
  };

  const ESP32_URLS = [
    'https://dl.espressif.com/dl/package_esp32_index.json',
    'https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json',
  ];

  try {
    const configContent = fs.readFileSync(FORGE_CLI_YAML, 'utf-8');
    if (!configContent.includes('dl.espressif.com') && !configContent.includes('espressif/arduino-esp32')) {
      const updatedConfig = configContent.trimEnd() + `\n\nboard_manager:\n  additional_urls:\n${ESP32_URLS.map(u => `    - ${u}`).join('\n')}\n`;
      fs.writeFileSync(FORGE_CLI_YAML, updatedConfig, 'utf-8');
      sendProgress('Added ESP32 board manager URLs to config');
    }
  } catch (err: any) {
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

    let cores: any[] = [];
    try { cores = JSON.parse(stdout); } catch (e: any) {
      console.warn('[FORGE] Failed to parse core list:', e.message);
    }

    const installed = Array.isArray(cores) && cores.some(c =>
      (c.id && (c.id.startsWith('esp32:') || c.id.startsWith('espressif:'))) ||
      (c.platform && c.platform.id && (c.platform.id.startsWith('esp32:') || c.platform.id.startsWith('espressif:')))
    );

    if (!installed) {
      sendProgress('ESP32 core not found — installing (this may take 2-5 minutes)...');
      sendProgress('Please wait, downloading ESP32 platform...');

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
  } catch (err: any) {
    console.error('[FORGE] ESP32 core check/install error:', err.message);
    sendProgress(`ERROR: ${err.message}`);
    return false;
  }
}

const esp32LibsInstalled = new Set<string>();
async function ensureESP32Library(libName: string): Promise<void> {
  if (esp32LibsInstalled.has(libName)) return;
  try {
    const { stdout } = await runCLI(['lib', 'list', '--format', 'json']);
    let libs: any[] = [];
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
  } catch (err: any) {
    console.warn(`[FORGE] Library install warning (${libName}):`, err.message);
    esp32LibsInstalled.add(libName);
  }
}
