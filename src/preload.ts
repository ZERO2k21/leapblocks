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

    /**
     * Compile code to hex for simulation
     */
    compileCode: (code: string, fqbn?: string, libraryPath?: string): Promise<{ success: boolean; hexContent?: string; error?: string }> => {
        console.log('[PRELOAD] compileCode called', { codeLength: code.length, fqbn, libraryPath });
        return ipcRenderer.invoke('compile-code', code, fqbn || 'arduino:avr:uno', libraryPath);
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
        ['python-output', 'python-error', 'python-exit', 'python-repl-output', 'python-repl-error', 'python-repl-exit', 'python-pip-output', 'python-pip-error', 'python-pip-exit'].forEach(e => ipcRenderer.removeAllListeners(e));
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
    saveProject: (data: any, path?: string) => ipcRenderer.invoke("save-project", data, path),
    openProject: () => ipcRenderer.invoke("open-project"),
    librarySearch: (query: string) => ipcRenderer.invoke('library-search', query),
    libraryInstall: (libName: string, projectPath: string) => ipcRenderer.invoke('library-install', libName, projectPath),
    libraryListProject: (projectPath: string) => ipcRenderer.invoke('library-list-project', projectPath),
    libraryUninstall: (libName: string, projectPath: string) => ipcRenderer.invoke('library-uninstall', libName, projectPath),
    forgeLibCacheInfo: () => ipcRenderer.invoke('forge-lib-cache-info'),
    getDefaultProjectPath: (): Promise<string> => ipcRenderer.invoke('get-default-project-path'),
    isElectron: true,

    // ═══════════════════════════════════════════════════════════════════════
    // PYTHON NATIVE APIS
    // ═══════════════════════════════════════════════════════════════════════
    pythonRun: (code: string) => ipcRenderer.invoke('python-run', code),
    pythonReplStart: () => ipcRenderer.invoke('python-repl-start'),
    pythonReplSend: (input: string) => ipcRenderer.invoke('python-repl-send', input),
    pythonStop: () => ipcRenderer.invoke('python-stop'),
    pythonPipInstall: (pkg: string) => ipcRenderer.invoke('python-pip-install', pkg),

    onPythonOutput: (callback: (data: string) => void) => ipcRenderer.on('python-output', (_, msg) => callback(msg)),
    onPythonError: (callback: (data: string) => void) => ipcRenderer.on('python-error', (_, msg) => callback(msg)),
    onPythonExit: (callback: (code: number) => void) => ipcRenderer.on('python-exit', (_, code) => callback(code)),
    onPythonReplOutput: (callback: (data: string) => void) => ipcRenderer.on('python-repl-output', (_, msg) => callback(msg)),
    onPythonReplError: (callback: (data: string) => void) => ipcRenderer.on('python-repl-error', (_, msg) => callback(msg)),
    onPythonReplExit: (callback: (code: number) => void) => ipcRenderer.on('python-repl-exit', (_, code) => callback(code)),
    onPythonPipOutput: (callback: (data: string) => void) => ipcRenderer.on('python-pip-output', (_, msg) => callback(msg)),
    onPythonPipError: (callback: (data: string) => void) => ipcRenderer.on('python-pip-error', (_, msg) => callback(msg)),
    onPythonPipExit: (callback: (code: number) => void) => ipcRenderer.on('python-pip-exit', (_, code) => callback(code)),

    /**
     * Generic invoke for flexible IPC calls
     */
    invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
});

// Declare global type for TypeScript
declare global {
    interface ArduinoLib {
        name: string;
        author: string;
        version: string;
        sentence: string;
        paragraph?: string;
        website?: string;
    }
    interface Window {
        electronAPI: {
            getPorts: () => Promise<PortInfo[]>;
            connectPort: (path: string, baudRate: number, board?: string) => Promise<ConnectResult>;
            disconnectPort: () => Promise<ConnectResult>;
            sendSerial: (data: string) => Promise<void>;
            uploadCode: (code: string, port?: string, fqbn?: string) => Promise<UploadResult>;
            compileCode: (code: string, fqbn?: string, libraryPath?: string) => Promise<{ success: boolean; hexContent?: string; error?: string }>;
            onSerialData: (callback: (data: string) => void) => void;
            onConnectionChange: (callback: (connected: boolean) => void) => void;
            onUploadProgress: (callback: (progress: number, message: string) => void) => void;
            removeAllListeners: () => void;
            removeBackground: (imagePath: string) => Promise<{ success: boolean; error?: string; stdout?: string; stderr?: string; base64?: string }>;

            buildApk: (appState: any) => Promise<{ success: boolean, outputPath?: string, error?: string }>;
            onBuildLog: (cb: (msg: string) => void) => void;
            removeBuildLogListener: () => void;
            showInFolder: (p: string) => void;
            saveProject: (d: any, path?: string) => Promise<{ success: boolean; projectPath?: string; error?: string }>;
            openProject: () => Promise<any>;
            librarySearch: (query: string) => Promise<{ libraries: ArduinoLib[] }>;
            libraryInstall: (libName: string, projectPath: string) => Promise<{ success: boolean; error?: string }>;
            libraryListProject: (projectPath: string) => Promise<string[]>;
            libraryUninstall: (libName: string, projectPath: string) => Promise<{ success: boolean; error?: string }>;
            forgeLibCacheInfo: () => Promise<{ cachePath: string; manifest: { version: string; libraries: { name: string; version: string; cachedAt: string }[] } }>;
            getDefaultProjectPath: () => Promise<string>;
            isElectron: boolean;

            pythonRun: (code: string) => Promise<void>;
            pythonReplStart: () => Promise<void>;
            pythonReplSend: (input: string) => Promise<void>;
            pythonStop: () => Promise<void>;
            pythonPipInstall: (pkg: string) => Promise<void>;

            onPythonOutput: (callback: (data: string) => void) => void;
            onPythonError: (callback: (data: string) => void) => void;
            onPythonExit: (callback: (code: number) => void) => void;
            onPythonReplOutput: (callback: (data: string) => void) => void;
            onPythonReplError: (callback: (data: string) => void) => void;
            onPythonReplExit: (callback: (code: number) => void) => void;
            onPythonPipOutput: (callback: (data: string) => void) => void;
            onPythonPipError: (callback: (data: string) => void) => void;
            onPythonPipExit: (callback: (code: number) => void) => void;

            invoke: (channel: string, ...args: any[]) => Promise<any>;
        };
    }
}

console.log('[PRELOAD] IPC bridge initialized successfully');
