const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld("electronAPI", {
  buildApk: (appState) => ipcRenderer.invoke("build-apk", appState),
  onBuildLog: (cb) => ipcRenderer.on("build-log", (_, m) => cb(m)),
  removeBuildLogListener: () => ipcRenderer.removeAllListeners("build-log"),
  showInFolder: (p) => ipcRenderer.invoke("show-in-folder", p),
  saveProject: (d) => ipcRenderer.invoke("save-project", d),
  openProject: () => ipcRenderer.invoke("open-project"),
  compileArduino: (code) => ipcRenderer.invoke("compile-arduino", code),
  // forge-lib
  forgeLibInstall: (name) => ipcRenderer.invoke("forge-lib-install", name),
  forgeLibList: () => ipcRenderer.invoke("forge-lib-list"),
  forgeLibRemove: (name) => ipcRenderer.invoke("forge-lib-remove", name),
  forgeCompile: (req) => ipcRenderer.invoke("forge-compile", req),
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),

  // ── Unified compile handler (AVR .hex + ESP32 .bin) ──────────────────────
  // Called by CompilerService.ts → electronAPI.compileCode(code, fqbn)
  // Routes to ipcMain.handle('compile-code') in main.js.
  // Returns { success, hexContent } for AVR boards.
  // Returns { success, binPath }   for espressif:esp32:* boards (QEMU path).
  compileCode: (code, fqbn, libraryPath) =>
    ipcRenderer.invoke('compile-code', code, fqbn || 'arduino:avr:uno', libraryPath),

  // ── ESP32 QEMU serial stream ──────────────────────────────────────────────
  // Pushed from qemuManager.js → mainWindow.webContents.send('serial-data', text)
  onSerialData: (cb) => ipcRenderer.on('serial-data', (_, data) => cb(data)),
  removeSerialDataListener: () => ipcRenderer.removeAllListeners('serial-data'),

  // ── ESP32 QEMU simulation lifecycle ──────────────────────────────────────
  // compile-esp32-sim: compile sketch → .bin, return binPath (kept for compat)
  compileESP32Sim: (code, fqbn) => ipcRenderer.invoke('compile-esp32-sim', code, fqbn),

  platform: process.platform,
  isElectron: true
});
