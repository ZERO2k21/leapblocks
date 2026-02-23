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

ipcMain.handle('connect-port', async (event, portPath: string, baudRate: number) => {
  try {
    const result = await serialManager.connect(portPath, baudRate);
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
  const activePath = serialManager.activePortPath;

  // 1. Auto-disconnect if connected
  if (wasConnected) {
    await serialManager.disconnect();
    // Delay to let Windows fully release the COM port handle
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  // 2. Perform upload
  const result = await arduinoUploader.upload(code, selectedPort, fqbn);

  // 3. Auto-reconnect if board was active
  if (result.success && wasConnected && activePath) {
    const baud = serialManager.currentBaud;
    setTimeout(async () => {
      await serialManager.connect(activePath, baud);
    }, 2000);
  }

  return result;
});
