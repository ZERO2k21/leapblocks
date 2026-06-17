/**
 * Minimal electron stub for Vitest Node environment.
 * Prevents "Cannot find module 'electron'" errors in unit tests.
 * Only the symbols actually imported by tested modules need to be present.
 */
export const app = {
    isPackaged: false,
    getAppPath: () => process.cwd(),
    getPath: (_name: string) => '/tmp',
};

export const ipcMain = {
    handle: () => { },
    on: () => { },
};

export const ipcRenderer = {
    invoke: async () => { },
    on: () => { },
    removeAllListeners: () => { },
};

export const BrowserWindow = class { };
export const contextBridge = { exposeInMainWorld: () => { } };

export default { app, ipcMain, ipcRenderer, BrowserWindow, contextBridge };
