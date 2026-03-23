// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AppForge Studio — Preload Bridge
// Exposes secure APIs from main process to React renderer
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('appforge', {
  // ── Dialog APIs ──────────────────────────
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  openFile: (filters) => ipcRenderer.invoke('dialog:openFile', filters),
  saveFile: (defaultName) => ipcRenderer.invoke('dialog:saveFile', defaultName),

  // ── File System APIs ─────────────────────
  readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
  writeFile: (filePath, data) => ipcRenderer.invoke('fs:writeFile', filePath, data),
  fileExists: (filePath) => ipcRenderer.invoke('fs:exists', filePath),

  // ── Shell APIs ───────────────────────────
  openFolder: (folderPath) => ipcRenderer.invoke('shell:openFolder', folderPath),
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),

  // ── Build Engine APIs ────────────────────
  getToolsPath: () => ipcRenderer.invoke('build:getToolsPath'),
  getOutputPath: () => ipcRenderer.invoke('build:getOutputPath'),

  // ── App Info ─────────────────────────────
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  getAppName: () => ipcRenderer.invoke('app:getName'),

  // ── Build Server Communication ───────────
  // React app calls localhost:3001 directly via fetch/axios
  // These helpers provide the server URL based on environment
  getBuildServerUrl: () => 'http://localhost:3001',
});
