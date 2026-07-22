import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export interface ElectronAPI {
  buildApk: (appState: any) => Promise<any>;
  onBuildLog: (cb: (msg: string) => void) => void;
  removeBuildLogListener: () => void;
  showInFolder: (p: string) => Promise<void>;
  saveProject: (d: any, path?: string) => Promise<any>;
  openProject: () => Promise<any>;
  compileArduino: (code: string) => Promise<any>;
  forgeLibInstall: (name: string) => Promise<any>;
  forgeLibList: () => Promise<any>;
  forgeLibRemove: (name: string) => Promise<any>;
  forgeCompile: (req: any) => Promise<any>;
  invoke: (channel: string, ...args: any[]) => Promise<any>;
  compileCode: (code: string, fqbn?: string, libraryPath?: string) => Promise<any>;
  onSerialData: (cb: (data: string) => void) => void;
  removeSerialDataListener: () => void;
  onESP32Status: (cb: (payload: any) => void) => void;
  removeESP32StatusListener: () => void;
  compileESP32Sim: (code: string, fqbn?: string) => Promise<any>;
  readBinFile: (filePath: string) => Promise<ArrayBuffer>;
  platform: string;
  isElectron: boolean;
}

contextBridge.exposeInMainWorld("electronAPI", {
  buildApk: (appState: any) => ipcRenderer.invoke("build-apk", appState),
  onBuildLog: (cb: (msg: string) => void) => 
    ipcRenderer.on("build-log", (_: IpcRendererEvent, m: string) => cb(m)),
  removeBuildLogListener: () => ipcRenderer.removeAllListeners("build-log"),
  showInFolder: (p: string) => ipcRenderer.invoke("show-in-folder", p),
  saveProject: (d: any, path?: string) => ipcRenderer.invoke("save-project", d, path),
  openProject: () => ipcRenderer.invoke("open-project"),
  compileArduino: (code: string) => ipcRenderer.invoke("compile-arduino", code),
  // forge-lib
  forgeLibInstall: (name: string) => ipcRenderer.invoke("forge-lib-install", name),
  forgeLibList: () => ipcRenderer.invoke("forge-lib-list"),
  forgeLibRemove: (name: string) => ipcRenderer.invoke("forge-lib-remove", name),
  forgeCompile: (req: any) => ipcRenderer.invoke("forge-compile", req),
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),

  // ── Unified compile handler (AVR .hex + ESP32 .bin) ──────────────────────
  // Called by CompilerService.ts → electronAPI.compileCode(code, fqbn)
  // Routes to ipcMain.handle('compile-code') in main.js.
  compileCode: (code: string, fqbn?: string, libraryPath?: string) =>
    ipcRenderer.invoke('compile-code', code, fqbn || 'arduino:avr:uno', libraryPath),

  // ── ESP32 QEMU serial stream ──────────────────────────────────────────────
  onSerialData: (cb: (data: string) => void) => 
    ipcRenderer.on('serial-data', (_: IpcRendererEvent, data: string) => cb(data)),
  removeSerialDataListener: () => ipcRenderer.removeAllListeners('serial-data'),

  // ── ESP32 status / progress events ───────────────────────────────────────
  onESP32Status: (cb: (payload: any) => void) => 
    ipcRenderer.on('esp32-status', (_: IpcRendererEvent, payload: any) => cb(payload)),
  removeESP32StatusListener: () => ipcRenderer.removeAllListeners('esp32-status'),

  // ── ESP32 QEMU simulation lifecycle ──────────────────────────────────────
  compileESP32Sim: (code: string, fqbn?: string) => ipcRenderer.invoke('compile-esp32-sim', code, fqbn),

  // ── Read compiled .bin file for ESP32-C3 firmware scanner ────────────────
  readBinFile: (filePath: string) => ipcRenderer.invoke('read-bin-file', filePath),

  platform: process.platform,
  isElectron: true
});
