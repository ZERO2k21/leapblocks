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
const FORGE_CLI_YAML      = path.join(FORGE_LIB_DIR, 'arduino-cli.yaml');

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
        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch(e) {}
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

// ── forge-compile: compile sketch with forge-lib libraries ────────────────
ipcMain.handle('forge-compile', async (_, { code, board }) => {
  const tempDir = path.join(app.getPath('temp'), `forge_sketch_${Date.now()}`);
  const sketchPath = path.join(tempDir, 'sketch.ino');

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

    if (exitCode === 0) {
      const hexPath = path.join(tempDir, 'sketch.ino.hex');
      if (fs.existsSync(hexPath)) {
        const hexContent = fs.readFileSync(hexPath, 'utf-8');
        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}
        return { success: true, hex: hexContent };
      }
      return { success: false, error: 'HEX file not generated' };
    } else {
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}
      return { success: false, error: stderr || stdout };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
});
