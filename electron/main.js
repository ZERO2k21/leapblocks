const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const buildApk = require('./buildApk');

const isDev = !app.isPackaged;
const APP_ROOT = app.getAppPath(); // Base path for resources

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
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
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
    } catch(e) {
      console.error("Invalid project file", e);
      return null;
    }
  }
  return null;
});
