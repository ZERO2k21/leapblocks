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

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL STATE & SERVICES
// ═══════════════════════════════════════════════════════════════════════════
let mainWindow: BrowserWindow | null = null;
let serialManager: SerialManager;
let arduinoUploader: ArduinoUploader;
let pythonManager: PythonManager;

// ESP32-C3 related globals
let lastESP32BinTempDir: string | null = null;

function getCleanupESP32Build() {
  return (tempDir: string) => {
    log('ESP32', `Cleaning up build directory: ${tempDir}`);
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (error) {
      log('ESP32', `Failed to cleanup build directory: ${error}`);
    }
  };
}

const log = (category: string, msg: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [MAIN:${category}] ${msg}`, data ?? '');
};

console.log('[MAIN] Starting LeapBlocks main process...');
const STARTUP_TIME = Date.now();
const logTiming = (label: string) => {
  const elapsed = Date.now() - STARTUP_TIME;
  console.log(`[TIMING] ${elapsed}ms - ${label}`);
};

logTiming('Main process script loaded');

if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = (): void => {
  logTiming('createWindow() called');

  mainWindow = new BrowserWindow({
    height: 800,
    width: 1400,
    minHeight: 600,
    minWidth: 1000,
    title: 'LeapBlocks - Block Programming IDE',
    show: false, // hidden until ready-to-show fires — eliminates blank white flash
    backgroundColor: '#f8fafc', // matches app background so no flicker on show
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  logTiming('BrowserWindow created');

  // electron-vite: use env var for dev server URL, file path for production
  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
    logTiming('Started loading dev server URL');
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
    logTiming('Started loading renderer HTML');
  }

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
    logTiming('DevTools opened');

    // Suppress harmless DevTools autofill warnings
    mainWindow.webContents.on('console-message', (event, level, message) => {
      if (message.includes('Autofill.enable') || message.includes('Autofill.setAddresses')) {
        event.preventDefault();
      }
    });
  }

  // Track when renderer is ready
  mainWindow.webContents.on('did-finish-load', () => {
    logTiming('Renderer finished loading (did-finish-load)');
  });

  mainWindow.webContents.on('dom-ready', () => {
    logTiming('DOM ready');
  });

  mainWindow.once('ready-to-show', () => {
    logTiming('Window ready to show');
    mainWindow?.show();
  });

  // Safety fallback: show the window after 3 seconds regardless, so a stalled
  // renderer never leaves the user staring at nothing.
  setTimeout(() => {
    if (mainWindow && !mainWindow.isVisible()) {
      logTiming('Fallback show triggered (ready-to-show did not fire in time)');
      mainWindow.show();
    }
  }, 3000);

  // Initialize service instances with current window
  logTiming('Initializing SerialManager');
  serialManager = new SerialManager(mainWindow);
  logTiming('SerialManager initialized');

  logTiming('Initializing ArduinoUploader');
  arduinoUploader = new ArduinoUploader(mainWindow);
  logTiming('ArduinoUploader initialized');

  logTiming('Initializing PythonManager');
  pythonManager = new PythonManager(mainWindow);
  logTiming('PythonManager initialized');

  mainWindow.on('closed', () => {
    mainWindow = null;
    serialManager.setWindow(null);
    arduinoUploader.setWindow(null);
    if (pythonManager) pythonManager.setWindow(null);
  });
};

// ═══════════════════════════════════════════════════════════════════════════

app.on('ready', () => {
  logTiming('Electron app ready event fired');
  createWindow();
  logTiming('createWindow() completed');
  // ESP32 core check removed from startup — now runs on-demand during first ESP32 compile
  // This prevents blocking the app startup with a 7+ second installation
});

app.on('window-all-closed', () => {
  logTiming('All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  logTiming('App activated');
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  logTiming('App before-quit event');
  if (serialManager) {
    serialManager.disconnect();
  }
  if (pythonManager) {
    pythonManager.stopAll();
  }
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
      log('IPC', 'ESP32-C3 detected — passing to ArduinoUploader RISC-V compile path');
      const result = await arduinoUploader.compileESP32ForSimulation(code, fqbn);
      
      // We will perform temp folder cleanup here, assuming ArduinoUploader used its generated tmp path to output final result. 
      // The old temp dir cleanup handled by lastESP32BinTempDir requires tracking if it was sent back
      if (result.success && result.binPath) {
        const binDir = path.dirname(result.binPath);
        if (lastESP32BinTempDir && lastESP32BinTempDir !== binDir) {
           getCleanupESP32Build()(lastESP32BinTempDir);
        }
        lastESP32BinTempDir = binDir;
      }
      
      log('IPC', `compile-code ESP32 returning result from Uploader.`);
      return result;
    }

  // ── AVR path ─────────────────────────────────────────────────────────────
  log('IPC', `compile-code AVR path, FQBN: ${fqbn}`);
  const result = await arduinoUploader.compileForSimulation(code, fqbn);
  log('IPC', `compile-code completed. Result: ${result.success ? 'Success' : 'Failure'}`);
  return result;
});


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

// Read a compiled .bin file and return its contents as a Buffer
// Used by SimulationRunner to load ESP32-C3 firmware for the GPIO scanner
ipcMain.handle('read-bin-file', async (_, filePath: string) => {
  try {
    const data = fs.readFileSync(filePath);
    return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  } catch (err: any) {
    log('IPC', `read-bin-file error: ${err.message}`);
    throw err;
  }
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
