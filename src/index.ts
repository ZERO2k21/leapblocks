import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { SerialManager } from './serial/SerialManager';
import { ArduinoUploader } from './upload/ArduinoUploader';

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL STATE & SERVICES
// ═══════════════════════════════════════════════════════════════════════════
let mainWindow: BrowserWindow | null = null;
let serialManager: SerialManager;
let arduinoUploader: ArduinoUploader;

const log = (category: string, msg: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [MAIN:${category}] ${msg}`, data ?? '');
};

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

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
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Initialize service instances with current window
  serialManager = new SerialManager(mainWindow);
  arduinoUploader = new ArduinoUploader(mainWindow);

  mainWindow.on('closed', () => {
    mainWindow = null;
    serialManager.setWindow(null);
    arduinoUploader.setWindow(null);
  });
};

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
