// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AppForge Studio — Electron Main Process
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const { spawn } = require('child_process');

const isDev = !app.isPackaged;

// ── Local Build Server Management ──────────────────
let localServer = null;

function startLocalBuildServer() {
  const serverPath = isDev
    ? path.join(__dirname, 'local-build-server', 'server.js')
    : path.join(process.resourcesPath, 'local-build-server', 'server.js');

  localServer = spawn('node', [serverPath], {
    detached: false,
    stdio: 'pipe',
    env: { ...process.env, PORT: '3001' }
  });

  localServer.stdout.on('data', (data) => {
    console.log('[LocalServer]', data.toString().trim());
  });

  localServer.stderr.on('data', (data) => {
    console.error('[LocalServer Error]', data.toString().trim());
  });

  localServer.on('close', (code) => {
    console.log('[LocalServer] Stopped with code:', code);
  });

  localServer.on('error', (err) => {
    console.error('[LocalServer] Failed to start:', err.message);
  });
}

function stopLocalBuildServer() {
  if (localServer) {
    localServer.kill();
    localServer = null;
  }
}

// ── Window ─────────────────────────────────────────
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: 'AppForge Studio',
    backgroundColor: '#0f0f13',
    icon: path.join(__dirname, 'public', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3456');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, 'build', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ── IPC Handlers ───────────────────────────────────

// File system operations
ipcMain.handle('dialog:openFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('dialog:openFile', async (_, filters) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: filters || [{ name: 'All Files', extensions: ['*'] }]
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('dialog:saveFile', async (_, defaultName) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName || 'project.json',
    filters: [
      { name: 'AppForge Project', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  return result.canceled ? null : result.filePath;
});

ipcMain.handle('fs:readFile', async (_, filePath) => {
  return fs.readFile(filePath, 'utf8');
});

ipcMain.handle('fs:writeFile', async (_, filePath, data) => {
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, data, 'utf8');
  return true;
});

ipcMain.handle('fs:exists', async (_, filePath) => {
  return fs.pathExists(filePath);
});

// Shell operations
ipcMain.handle('shell:openFolder', async (_, folderPath) => {
  shell.openPath(folderPath);
});

ipcMain.handle('shell:openExternal', async (_, url) => {
  shell.openExternal(url);
});

// Build engine — delegates to local build server
ipcMain.handle('build:getToolsPath', () => {
  return isDev
    ? path.join(__dirname, 'tools')
    : path.join(process.resourcesPath, 'tools');
});

ipcMain.handle('build:getOutputPath', () => {
  return isDev
    ? path.join(__dirname, 'output')
    : path.join(app.getPath('documents'), 'AppForge Studio', 'output');
});

// App info
ipcMain.handle('app:getVersion', () => app.getVersion());
ipcMain.handle('app:getName', () => 'AppForge Studio');

// ── App Lifecycle ──────────────────────────────────
app.whenReady().then(() => {
  startLocalBuildServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  stopLocalBuildServer();
});
