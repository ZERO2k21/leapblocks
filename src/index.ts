/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';
import { SerialManager } from './serial/SerialManager';
import { ArduinoUploader } from './upload/ArduinoUploader';
import { PythonManager } from './pythonBackend/PythonManager';
import { join } from 'path';

// ── ESP32 QEMU simulation imports ────────────────────────────────────────
// electron/ files live at the repo root, not inside dist/main/.
// Use app.getAppPath() at call time — app may not be ready at module load.
// We lazy-require inside a getter to avoid the timing issue.
let _qemuManager: any = null;
let _cleanupESP32Build: ((dir: string) => void) | null = null;

function getQemuManager() {
  if (!_qemuManager) {
    const root = app.getAppPath();
    _qemuManager = require(join(root, 'electron', 'qemuManager.js'));
  }
  return _qemuManager;
}

function getCleanupESP32Build(): (dir: string) => void {
  if (!_cleanupESP32Build) {
    const root = app.getAppPath();
    const mod = require(join(root, 'electron', 'esp32Compiler.js'));
    _cleanupESP32Build = mod.cleanupESP32Build;
  }
  return _cleanupESP32Build!;
}

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL STATE & SERVICES
// ═══════════════════════════════════════════════════════════════════════════
let mainWindow: BrowserWindow | null = null;
let serialManager: SerialManager;
let arduinoUploader: ArduinoUploader;
let pythonManager: PythonManager;

// ── ESP32 QEMU state ─────────────────────────────────────────────────────
let lastESP32BinTempDir: string | null = null;
let esp32CoreReady = false;

const log = (category: string, msg: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [MAIN:${category}] ${msg}`, data ?? '');
};

console.log('[MAIN] Starting LeapBlocks main process...');

if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    height: 800,
    width: 1400,
    minHeight: 600,
    minWidth: 1000,
    title: 'LeetBlocks - Block Programming IDE',
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // electron-vite: use env var for dev server URL, file path for production
  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Initialize service instances with current window
  serialManager = new SerialManager(mainWindow);
  arduinoUploader = new ArduinoUploader(mainWindow);
  pythonManager = new PythonManager(mainWindow);

  mainWindow.on('closed', () => {
    mainWindow = null;
    serialManager.setWindow(null);
    arduinoUploader.setWindow(null);
    if (pythonManager) pythonManager.setWindow(null);
  });
};

// ═══════════════════════════════════════════════════════════════════════════
// ESP32 QEMU HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/** Run arduino-cli with a given config file and return { stdout, stderr, code } */
function runCLI(cliPath: string, configYaml: string, args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    const proc = spawn(cliPath, ['--config-file', configYaml, ...args], {
      env: { ...process.env },
    });
    let stdout = '', stderr = '';
    proc.stdout.on('data', (d: Buffer) => { stdout += d.toString(); });
    proc.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });
    proc.on('close', (code: number) => resolve({ stdout, stderr, code }));
    proc.on('error', (err: Error) => resolve({ stdout: '', stderr: err.message, code: -1 }));
  });
}

/** Migrate ESP32 LEDC API v2 → v3 (ledcSetup/ledcAttachPin → ledcAttach) */
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

/** Ensure the ESP32 arduino core is installed. Caches result in esp32CoreReady. */
async function ensureESP32Core(): Promise<boolean> {
  if (esp32CoreReady) return true;

  const isDev = !app.isPackaged;
  const APP_ROOT = app.getAppPath();
  const FORGE_LIB_DIR = isDev
    ? path.join(APP_ROOT, 'forge-lib')
    : path.join(process.resourcesPath, 'forge-lib');
  const FORGE_CLI_YAML = path.join(FORGE_LIB_DIR, 'arduino-cli.yaml');
  const CLI_PATH = isDev
    ? path.join(APP_ROOT, 'arduino-cli', 'arduino-cli.exe')
    : path.join(process.resourcesPath, 'arduino-cli', 'arduino-cli.exe');

  const send = (msg: string) => {
    log('ESP32', msg);
    if (mainWindow?.webContents) {
      mainWindow.webContents.send('serial-data', `[ESP32 SETUP] ${msg}\n`);
    }
  };

  const ESP32_URLS = [
    'https://dl.espressif.com/dl/package_esp32_index.json',
    'https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json',
  ];

  // Ensure board manager URLs are in the config
  try {
    const cfg = fs.readFileSync(FORGE_CLI_YAML, 'utf-8');
    if (!cfg.includes('dl.espressif.com') && !cfg.includes('espressif/arduino-esp32')) {
      const updated = cfg.trimEnd() + `\n\nboard_manager:\n  additional_urls:\n${ESP32_URLS.map(u => `    - ${u}`).join('\n')}\n`;
      fs.writeFileSync(FORGE_CLI_YAML, updated, 'utf-8');
      send('Added ESP32 board manager URLs to config');
    }
  } catch (err: any) {
    log('ESP32', `Could not update arduino-cli.yaml: ${err.message}`);
  }

  try {
    send('Checking for ESP32 core installation...');
    const { stdout, code: listCode } = await runCLI(CLI_PATH, FORGE_CLI_YAML, ['core', 'list', '--format', 'json']);
    if (listCode !== 0) { send('ERROR: Failed to list installed cores'); return false; }

    let cores: any[] = [];
    try { cores = JSON.parse(stdout); } catch (_) { }

    const installed = Array.isArray(cores) && cores.some((c: any) =>
      (c.id && (c.id.startsWith('esp32:') || c.id.startsWith('espressif:'))) ||
      (c.platform?.id && (c.platform.id.startsWith('esp32:') || c.platform.id.startsWith('espressif:')))
    );

    if (!installed) {
      send('ESP32 core not found — installing (this may take 2-5 minutes)...');

      const { code: updateCode } = await runCLI(CLI_PATH, FORGE_CLI_YAML, [
        'core', 'update-index', '--additional-urls', ESP32_URLS.join(','),
      ]);
      if (updateCode !== 0) { send('ERROR: Failed to update package index'); return false; }

      let installOk = false;
      for (const url of ESP32_URLS) {
        const { code: installCode } = await runCLI(CLI_PATH, FORGE_CLI_YAML, [
          'core', 'install', 'esp32:esp32', '--additional-urls', url,
        ]);
        if (installCode === 0) { installOk = true; send('✓ ESP32 core installed!'); break; }
        send(`Install via ${url.includes('espressif.com') ? 'CDN' : 'GitHub'} failed, trying next...`);
      }

      if (!installOk) { send('ERROR: All ESP32 core install attempts failed'); return false; }
    } else {
      send('✓ ESP32 core already installed');
    }

    esp32CoreReady = true;
    return true;
  } catch (err: any) {
    send(`ERROR: ${err.message}`);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FLASH IMAGE BUILDER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Merges the three ESP32 flash regions into a single raw image that QEMU
 * accepts via  -drive file=<image>,if=mtd,format=raw
 *
 * Flash layout (default ESP32 single_factory partition scheme):
 *   0x001000  bootloader.bin   (max ~28 KB)
 *   0x008000  partitions.bin   (max ~3 KB)
 *   0x010000  app.bin          (rest of flash)
 *
 * The image is zero-padded to exactly 4 MB — the smallest QEMU-supported
 * size that fits the default ESP32 DevKit V1 flash.
 */
function buildMergedFlashImage(
  tempDir: string,
  files: string[],
  appBinPath: string,
  outPath: string,
): void {
  const FLASH_SIZE = 4 * 1024 * 1024; // 4 MB
  const BOOTLOADER_OFFSET = 0x1000;
  const PARTITIONS_OFFSET = 0x8000;
  const APP_OFFSET = 0x10000;

  // Allocate a 4 MB buffer filled with 0xFF (erased flash state)
  const image = Buffer.alloc(FLASH_SIZE, 0xff);

  // ── Bootloader ────────────────────────────────────────────────────────────
  const bootFile = files.find(f => f.includes('bootloader') && f.endsWith('.bin'));
  if (bootFile) {
    const bootBin = fs.readFileSync(path.join(tempDir, bootFile));
    if (BOOTLOADER_OFFSET + bootBin.length > PARTITIONS_OFFSET) {
      throw new Error(`Bootloader too large: ${bootBin.length} bytes overflows partition table region`);
    }
    bootBin.copy(image, BOOTLOADER_OFFSET);
    log('FLASH', `Bootloader @ 0x${BOOTLOADER_OFFSET.toString(16)}: ${bootBin.length} bytes`);
  } else {
    log('FLASH', 'No bootloader.bin found — region left as 0xFF (erased)');
  }

  // ── Partition table ───────────────────────────────────────────────────────
  const partFile = files.find(f => (f.includes('partition') || f.includes('partitions')) && f.endsWith('.bin'));
  if (partFile) {
    const partBin = fs.readFileSync(path.join(tempDir, partFile));
    if (PARTITIONS_OFFSET + partBin.length > APP_OFFSET) {
      throw new Error(`Partition table too large: ${partBin.length} bytes overflows app region`);
    }
    partBin.copy(image, PARTITIONS_OFFSET);
    log('FLASH', `Partitions @ 0x${PARTITIONS_OFFSET.toString(16)}: ${partBin.length} bytes`);
  } else {
    log('FLASH', 'No partitions.bin found — region left as 0xFF (erased)');
  }

  // ── Application binary ────────────────────────────────────────────────────
  const appBin = fs.readFileSync(appBinPath);
  if (APP_OFFSET + appBin.length > FLASH_SIZE) {
    throw new Error(`App binary too large: ${appBin.length} bytes exceeds 4 MB flash`);
  }
  appBin.copy(image, APP_OFFSET);
  log('FLASH', `App @ 0x${APP_OFFSET.toString(16)}: ${appBin.length} bytes`);

  fs.writeFileSync(outPath, image);
  log('FLASH', `✓ Merged flash image: ${outPath} (${(FLASH_SIZE / 1024 / 1024).toFixed(0)} MB)`);
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  if (serialManager) {
    serialManager.disconnect();
  }
  if (pythonManager) {
    pythonManager.stopAll();
  }
  // Stop QEMU if running
  try { getQemuManager().stopQemu(); } catch (_) { }
});

// ═══════════════════════════════════════════════════════════════════════════
// IPC HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

ipcMain.handle('get-ports', async () => {
  return await serialManager.listPorts();
});

ipcMain.handle('connect-port', async (event, portPath: string, baudRate: number, board?: string) => {
  try {
    const result = await serialManager.connect(portPath, baudRate, board || 'arduino_uno');
    return result;
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('disconnect-port', async () => {
  return await serialManager.disconnect();
});

ipcMain.handle('send-serial', async (event, data: string) => {
  serialManager.write(data);
});

ipcMain.handle('upload-code', async (event, code: string, selectedPort: string, fqbn: string) => {
  const wasConnected = serialManager.isConnected();

  // 1. Auto-disconnect if connected
  if (wasConnected) {
    await serialManager.disconnect();
    // Delay to let Windows fully release the COM port handle
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  // 2. Perform upload (renderer handles reconnection via IPC)
  const result = await arduinoUploader.upload(code, selectedPort, fqbn);

  return result;
});

ipcMain.handle('compile-code', async (event, code: string, fqbn: string, libraryPath?: string) => {
  log('IPC', `compile-code request received. FQBN: ${fqbn}`);

  const isESP32 = typeof fqbn === 'string' && fqbn.startsWith('esp32:');
  log('IPC', `isESP32: ${isESP32}`);

  if (isESP32) {
    // ── ESP32 QEMU path ─────────────────────────────────────────────────────
    log('IPC', 'ESP32 detected — using QEMU compile path');

    if (mainWindow?.webContents) {
      mainWindow.webContents.send('serial-data', '[SYSTEM] Checking ESP32 platform installation...\n');
    }

    const coreOk = await ensureESP32Core();
    log('IPC', `ensureESP32Core returned: ${coreOk}`);
    if (!coreOk) {
      return {
        success: false,
        error: 'ESP32 core installation failed. Please install manually:\narduino-cli core install esp32:esp32',
      };
    }

    const tempDir = path.join(app.getPath('temp'), `forge_esp32_${Date.now()}`);
    const sketchDir = path.join(tempDir, 'sketch');
    const sketchPath = path.join(sketchDir, 'sketch.ino');

    log('IPC', `tempDir: ${tempDir}`);
    log('IPC', `sketchDir: ${sketchDir}`);

    try {
      fs.mkdirSync(sketchDir, { recursive: true });

      // Inject GPIO monitor header so QEMU serial output carries __LF_GPIO lines
      const GPIO_MONITOR_HEADER = `\
// ---- LeapForge GPIO monitor (auto-injected) ----
static void __lf_digitalWrite(uint8_t pin, uint8_t val) {
  digitalWrite(pin, val);
  Serial.printf("__LF_GPIO:%d:%d\\n", pin, (int)val);
}
#define digitalWrite(p,v) __lf_digitalWrite((p),(v))
// ---- end LeapForge injection ----
`;
      // Preprocess: replace Servo.h, migrate LEDC API
      let processedCode = code.replace(/#include\s*[<"]Servo\.h[>"]/g, '#include <ESP32Servo.h>');
      processedCode = migrateESP32LedcAPI(processedCode);
      fs.writeFileSync(sketchPath, GPIO_MONITOR_HEADER + '\n' + processedCode, 'utf-8');

      const isDev = !app.isPackaged;
      const APP_ROOT = app.getAppPath();
      const FORGE_LIB_DIR = isDev
        ? path.join(APP_ROOT, 'forge-lib')
        : path.join(process.resourcesPath, 'forge-lib');
      const FORGE_CLI_YAML = path.join(FORGE_LIB_DIR, 'arduino-cli.yaml');
      const CLI_PATH = isDev
        ? path.join(APP_ROOT, 'arduino-cli', 'arduino-cli.exe')
        : path.join(process.resourcesPath, 'arduino-cli', 'arduino-cli.exe');

      log('IPC', `CLI_PATH: ${CLI_PATH}`);
      log('IPC', `FORGE_CLI_YAML: ${FORGE_CLI_YAML}`);

      const { stdout, stderr, code: exitCode } = await runCLI(CLI_PATH, FORGE_CLI_YAML, [
        'compile', '--fqbn', fqbn, '--output-dir', tempDir, sketchDir,
      ]);

      log('IPC', `compile-code ESP32 exit=${exitCode}`);
      if (stdout) log('IPC', `stdout: ${stdout.slice(0, 300)}`);
      if (stderr) log('IPC', `stderr: ${stderr.slice(0, 300)}`);

      if (exitCode !== 0) {
        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) { }
        return { success: false, error: stderr || stdout || `Compiler exited with code ${exitCode}` };
      }

      const files = fs.readdirSync(tempDir);
      log('IPC', `output files: ${files.join(', ')}`);

      // arduino-cli (esp32 core v2+) emits sketch.ino.merged.bin — a ready-to-use
      // 4 MB flash image with bootloader + partitions + app already merged.
      // Prefer it directly; fall back to building our own merge if absent.
      const mergedReady = files.find(f => f === 'sketch.ino.merged.bin');

      let finalBinPath: string;

      if (mergedReady) {
        finalBinPath = path.join(tempDir, mergedReady);
        log('IPC', `Using arduino-cli merged image: ${finalBinPath}`);
      } else {
        // Older arduino-cli: merge manually from the three separate files
        const binFile = files.find(f => f === 'sketch.ino.bin')
          ?? files.find(f => f.endsWith('.bin') && !f.includes('bootloader') && !f.includes('partition'));

        log('IPC', `binFile found: ${binFile}`);

        if (!binFile) {
          try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) { }
          return { success: false, error: `ESP32 compiled but no .bin found. Files: ${files.join(', ')}` };
        }

        const appBinPath = path.join(tempDir, binFile);
        const mergedPath = path.join(tempDir, 'flash_image.bin');
        try {
          buildMergedFlashImage(tempDir, files, appBinPath, mergedPath);
          log('IPC', `Flash image merged manually: ${mergedPath}`);
        } catch (mergeErr: any) {
          log('IPC', `Flash merge failed: ${mergeErr.message}`);
          try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) { }
          return { success: false, error: `Flash image merge failed: ${mergeErr.message}` };
        }
        finalBinPath = mergedPath;
      }

      // Clean up previous build temp dir
      if (lastESP32BinTempDir) {
        getCleanupESP32Build()(lastESP32BinTempDir);
      }
      lastESP32BinTempDir = tempDir;

      log('IPC', `compile-code ESP32 returning: { success: true, binPath: "${finalBinPath}" }`);
      return { success: true, binPath: finalBinPath };

    } catch (err: any) {
      log('IPC', `compile-code ESP32 exception: ${err.message}`);
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) { }
      return { success: false, error: err.message };
    }
  }

  // ── AVR path ─────────────────────────────────────────────────────────────
  log('IPC', `compile-code AVR path, FQBN: ${fqbn}`);
  const result = await arduinoUploader.compileForSimulation(code, fqbn);
  log('IPC', `compile-code completed. Result: ${result.success ? 'Success' : 'Failure'}`);
  return result;
});

// ── ESP32 QEMU simulation IPC handlers ───────────────────────────────────

ipcMain.handle('esp32-start', async (_, binPath: string) => {
  await getQemuManager().startQemu(binPath, mainWindow);
  return { ok: true };
});

ipcMain.handle('esp32-stop', async () => {
  getQemuManager().stopQemu();
  if (lastESP32BinTempDir) {
    getCleanupESP32Build()(lastESP32BinTempDir);
    lastESP32BinTempDir = null;
  }
  return { ok: true };
});

ipcMain.handle('esp32-gpio-set', async (_, pin: number, high: boolean) => {
  const socket = await getQemuManager().connectQMP();
  if (socket) {
    await getQemuManager().sendQMPCommand(socket, {
      execute: 'gpio-set',
      arguments: { name: `GPIO${pin}`, level: high ? 1 : 0 },
    });
    socket.destroy();
  }
});

ipcMain.handle('esp32-adc-set', async (_, channel: number, voltage: number) => {
  const socket = await getQemuManager().connectQMP();
  if (socket) {
    await getQemuManager().sendQMPCommand(socket, {
      execute: 'qom-set',
      arguments: {
        path: `/machine/soc/adc/channel[${channel}]`,
        property: 'voltage',
        value: voltage,
      },
    });
    socket.destroy();
  }
});

// Library Handlers (Wokwi Centralized Management)
ipcMain.handle('search-library', async (event, query: string) => {
  return await arduinoUploader.searchLibraries(query);
});

ipcMain.handle('install-library', async (event, libName: string) => {
  return await arduinoUploader.installLibrary(libName);
});

ipcMain.handle('remove-library', async (event, libName: string) => {
  return await arduinoUploader.uninstallLibrary(libName);
});

ipcMain.handle('get-installed-libraries', async () => {
  return await arduinoUploader.getInstalledLibraries();
});

ipcMain.handle('get-forge-lib-path', async () => {
  return arduinoUploader.getForgeLibCachePath();
});

ipcMain.handle('get-default-project-path', async () => {
  log('IPC', 'get-default-project-path request received');
  const appRoot = app.isPackaged
    ? path.dirname(app.getPath('exe'))
    : process.cwd();

  const forgeLibDir = path.join(appRoot, 'forge-lib');
  log('IPC', `Checking/Creating forge-lib dir at: ${forgeLibDir}`);

  if (!fs.existsSync(forgeLibDir)) {
    fs.mkdirSync(forgeLibDir, { recursive: true });
  }

  const libsDir = path.join(forgeLibDir, 'libs');
  if (!fs.existsSync(libsDir)) {
    fs.mkdirSync(libsDir, { recursive: true });
  }

  return forgeLibDir;
});

ipcMain.handle('forge-lib-cache-info', async () => {
  return arduinoUploader.getForgeLibCacheInfo();
});

// Python Handlers
ipcMain.handle('python-run', async (event, code: string) => {
  await pythonManager.runCode(code);
});
ipcMain.handle('python-repl-start', async () => {
  await pythonManager.startRepl();
});
ipcMain.handle('python-repl-send', async (event, input: string) => {
  pythonManager.sendRepl(input);
});
ipcMain.handle('python-stop', async () => {
  pythonManager.stopAll();
});
ipcMain.handle('python-pip-install', async (event, pkg: string) => {
  await pythonManager.installPipPackage(pkg);
});

ipcMain.handle('remove-background', async (event, imagePath: string) => {
  const { exec } = require('child_process');
  const fs = require('fs');
  const crypto = require('crypto');

  let targetPath = imagePath;
  let isTempFile = false;
  let returnAsBase64 = false;

  // Handle Base64 Data URL
  if (imagePath.startsWith('data:image/')) {
    isTempFile = true;
    returnAsBase64 = true;
    const matches = imagePath.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return { success: false, error: 'Invalid base64 image data' };
    }
    const buffer = Buffer.from(matches[2], 'base64');
    const tempName = crypto.randomBytes(16).toString('hex') + '.png';
    targetPath = path.join(app.getPath('temp'), tempName);
    fs.writeFileSync(targetPath, buffer);
  }

  // Convert to absolute path if not already
  const fullPath = path.isAbsolute(targetPath)
    ? targetPath
    : path.join(app.getAppPath(), targetPath);

  return new Promise((resolve) => {
    // Note: ensure python is in PATH or use a specific path
    exec(`python "${path.join(app.getAppPath(), 'remove_bg.py')}" "${fullPath}"`, (error: any, stdout: any, stderr: any) => {
      let resultBase64;

      // If we used a temp file, the python script outputs a new file (replace extension with .png)
      // Since we forced the input to be .png, the output is the same path.
      if (returnAsBase64 && fs.existsSync(fullPath) && !error) {
        const outBuffer = fs.readFileSync(fullPath);
        resultBase64 = `data:image/png;base64,${outBuffer.toString('base64')}`;
      }

      // Cleanup temp file
      if (isTempFile && fs.existsSync(fullPath)) {
        try { fs.unlinkSync(fullPath); } catch (e) { }
      }

      if (error) {
        console.error(`[MAIN:BG_REMOVAL] Error: ${error}`);
        resolve({ success: false, error: error.message, stderr });
        return;
      }

      resolve({ success: true, stdout, stderr, base64: resultBase64 });
    });
  });
});

ipcMain.handle('build-apk', async (event, appState) => {
  // In Vite/Electron-Vite, we can just use regular require for our external build script
  const buildApkPath = path.join(app.getAppPath(), 'electron', 'buildApk.js');
  let buildApk: any;
  try {
    buildApk = require(buildApkPath);
  } catch (e) {
    console.error('Could not load buildApk from', buildApkPath, e);
    return { success: false, error: `Build script not found at ${buildApkPath}` };
  }


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
    const outputPath = await buildApk(appState, app.getAppPath(), logCallback);
    return { success: true, outputPath };
  } catch (error: any) {
    return { success: false, error: error.message || error.toString() };
  }
});

ipcMain.handle('show-in-folder', (_, filePath) => {
  shell.showItemInFolder(filePath);
});

ipcMain.handle('save-project', async (_, data, existingPath?: string) => {
  if (!mainWindow) return { success: false };

  let targetPath = existingPath;

  if (!targetPath) {
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Save LeapBlocks Project Folder',
      defaultPath: 'MyLeapProject',
      buttonLabel: 'Create Project Folder'
    });
    if (!filePath) return { success: false };
    targetPath = filePath;
  }

  const fsMod = require('fs');
  const pathMod = require('path');

  try {
    if (!fsMod.existsSync(targetPath)) {
      log('PROJECT', `Creating project directory: ${targetPath}`);
      fsMod.mkdirSync(targetPath, { recursive: true });
    }

    // Save the .lbp file inside the folder
    const projectName = pathMod.basename(targetPath);
    const lbpPath = pathMod.join(targetPath, `${projectName}.lbp`);
    log('PROJECT', `Saving project file: ${lbpPath}`);
    fsMod.writeFileSync(lbpPath, JSON.stringify(data, null, 2));

    // Ensure libs folder exists
    const libsDir = pathMod.join(targetPath, 'libs');
    if (!fsMod.existsSync(libsDir)) {
      log('PROJECT', `Ensuring libraries folder exists: ${libsDir}`);
      fsMod.mkdirSync(libsDir, { recursive: true });
    }

    log('PROJECT', `Project successfully saved to: ${targetPath}`);
    return { success: true, projectPath: targetPath };
  } catch (err: any) {
    log('PROJECT', `Failed to save project: ${err.message}`, err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('open-project', async () => {
  if (!mainWindow) return null;

  // Choose Folder Mode
  const { filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Select LeapBlocks Project Folder',
    properties: ['openDirectory']
  });

  if (filePaths && filePaths.length > 0) {
    const projectPath = filePaths[0];
    const fsMod = require('fs');
    const pathMod = require('path');

    // Look for any .lbp file in the root
    const files = fsMod.readdirSync(projectPath);
    const lbpFile = files.find((f: string) => f.endsWith('.lbp'));

    if (lbpFile) {
      const content = fsMod.readFileSync(pathMod.join(projectPath, lbpFile), 'utf-8');
      try {
        const data = JSON.parse(content);
        return { data, projectPath };
      } catch (e) {
        console.error("Invalid project file", e);
        return null;
      }
    }
  }
  return null;
});
