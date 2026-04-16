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
  forgeLibList: ()         => ipcRenderer.invoke("forge-lib-list"),
  forgeLibRemove: (name)   => ipcRenderer.invoke("forge-lib-remove", name),
  forgeCompile: (req)      => ipcRenderer.invoke("forge-compile", req),
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  platform: process.platform,
  isElectron: true
});
