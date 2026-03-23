import { contextBridge, ipcRenderer } from 'electron';

// ═══════════════════════════════════════════════════════════════════════════
// PRELOAD - Exposes safe IPC APIs to renderer
// ═══════════════════════════════════════════════════════════════════════════

console.log('[PRELOAD] Initializing IPC bridge...');

// Types for API
interface PortInfo {
    path: string;
    manufacturer?: string;
    productId?: string;
}

interface ConnectResult {
    success: boolean;
    error?: string;
}

interface UploadResult {
    success: boolean;
    error?: string;
    output?: string;
}

// Expose secure API to renderer
contextBridge.exposeInMainWorld('electronAPI', {
    // ═══════════════════════════════════════════════════════════════════════
    // SERIAL PORT OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Get list of available serial ports
     */
    getPorts: (): Promise<PortInfo[]> => {
        console.log('[PRELOAD] getPorts called');
        return ipcRenderer.invoke('get-ports');
    },

    /**
     * Connect to a serial port
     */
    connectPort: (path: string, baudRate: number, board?: string): Promise<ConnectResult> => {
        console.log('[PRELOAD] connectPort called', { path, baudRate, board });
        return ipcRenderer.invoke('connect-port', path, baudRate, board);
    },

    /**
     * Disconnect from current port
     */
    disconnectPort: (): Promise<ConnectResult> => {
        console.log('[PRELOAD] disconnectPort called');
        return ipcRenderer.invoke('disconnect-port');
    },

    /**
     * Send data to connected port
     */
    sendSerial: (data: string): Promise<void> => {
        console.log('[PRELOAD] sendSerial called', { dataLength: data.length });
        return ipcRenderer.invoke('send-serial', data);
    },

    /**
     * Upload code to connected board
     */
    uploadCode: (code: string, port?: string, fqbn?: string): Promise<UploadResult> => {
        console.log('[PRELOAD] uploadCode called', { codeLength: code.length, port, fqbn });
        return ipcRenderer.invoke('upload-code', code, port, fqbn);
    },

    // ═══════════════════════════════════════════════════════════════════════
    // EVENT LISTENERS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Listen for incoming serial data
     */
    onSerialData: (callback: (data: string) => void): void => {
        console.log('[PRELOAD] onSerialData listener registered');
        ipcRenderer.on('serial-data', (event, data: string) => {
            callback(data);
        });
    },

    /**
     * Listen for connection status changes
     */
    onConnectionChange: (callback: (connected: boolean) => void): void => {
        console.log('[PRELOAD] onConnectionChange listener registered');
        ipcRenderer.on('connection-change', (event, connected: boolean) => {
            callback(connected);
        });
    },

    /**
     * Listen for upload progress
     */
    onUploadProgress: (callback: (progress: number, message: string) => void): void => {
        console.log('[PRELOAD] onUploadProgress listener registered');
        ipcRenderer.on('upload-progress', (event, progress: number, message: string) => {
            callback(progress, message);
        });
    },

    // ═══════════════════════════════════════════════════════════════════════
    // CLEANUP
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Remove all serial data listeners
     */
    /**
     * Remove all serial data listeners
     */
    removeAllListeners: (): void => {
        console.log('[PRELOAD] Removing all listeners');
        ipcRenderer.removeAllListeners('serial-data');
        ipcRenderer.removeAllListeners('connection-change');
        ipcRenderer.removeAllListeners('upload-progress');
    },

    removeBackground: (imagePath: string): Promise<{ success: boolean; error?: string; stdout?: string; stderr?: string, base64?: string }> => {
        console.log('[PRELOAD] removeBackground called', { imagePath });
        return ipcRenderer.invoke('remove-background', imagePath);
    },

    // ═══════════════════════════════════════════════════════════════════════
    // APP INVENTOR APIS
    // ═══════════════════════════════════════════════════════════════════════
    buildApk: (appState: any) => ipcRenderer.invoke("build-apk", appState),
    onBuildLog: (cb: (msg: string) => void) => ipcRenderer.on("build-log", (_, m) => cb(m)),
    removeBuildLogListener: () => ipcRenderer.removeAllListeners("build-log"),
    showInFolder: (p: string) => ipcRenderer.invoke("show-in-folder", p),
    saveProject: (d: any) => ipcRenderer.invoke("save-project", d),
    openProject: () => ipcRenderer.invoke("open-project"),
    isElectron: true
});

// Declare global type for TypeScript
declare global {
    interface Window {
        electronAPI: {
            getPorts: () => Promise<PortInfo[]>;
            connectPort: (path: string, baudRate: number, board?: string) => Promise<ConnectResult>;
            disconnectPort: () => Promise<ConnectResult>;
            sendSerial: (data: string) => Promise<void>;
            uploadCode: (code: string, port?: string, fqbn?: string) => Promise<UploadResult>;
            onSerialData: (callback: (data: string) => void) => void;
            onConnectionChange: (callback: (connected: boolean) => void) => void;
            onUploadProgress: (callback: (progress: number, message: string) => void) => void;
            removeAllListeners: () => void;
            removeBackground: (imagePath: string) => Promise<{ success: boolean; error?: string; stdout?: string; stderr?: string; base64?: string }>;
            
            buildApk: (appState: any) => Promise<{success: boolean, outputPath?: string, error?: string}>;
            onBuildLog: (cb: (msg: string) => void) => void;
            removeBuildLogListener: () => void;
            showInFolder: (p: string) => void;
            saveProject: (d: any) => Promise<boolean>;
            openProject: () => Promise<any>;
            isElectron: boolean;
        };
    }
}

console.log('[PRELOAD] IPC bridge initialized successfully');
