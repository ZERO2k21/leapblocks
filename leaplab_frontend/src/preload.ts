/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
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
     * Compile code to hex/bin for simulation.
     * Returns { success, hexContent } for AVR boards.
     * Returns { success, binPath }   for ESP32 boards (QEMU path).
     */
    compileCode: (code: string, fqbn?: string, libraryPath?: string): Promise<{ success: boolean; hexContent?: string; binPath?: string; error?: string }> => {
        console.log('[PRELOAD] compileCode called', { codeLength: code.length, fqbn, libraryPath });
        return ipcRenderer.invoke('compile-code', code, fqbn || 'arduino:avr:uno', libraryPath);
    },

    // ── ESP32 QEMU simulation ─────────────────────────────────────────────
    /** Start QEMU with the compiled .bin file */
    esp32Start: (binPath: string) => ipcRenderer.invoke('esp32-start', binPath),
    /** Stop QEMU and clean up */
    esp32Stop: () => ipcRenderer.invoke('esp32-stop'),
    /** Drive a GPIO input pin HIGH or LOW */
    esp32GpioSet: (pin: number, high: boolean) => ipcRenderer.invoke('esp32-gpio-set', pin, high),
    /** Inject an analog voltage into an ADC channel */
    esp32AdcSet: (channel: number, voltage: number) => ipcRenderer.invoke('esp32-adc-set', channel, voltage),

    // ── Read compiled .bin file for ESP32-C3 firmware scanner ────────────
    /** Read a compiled .bin file and return its contents as ArrayBuffer */
    readBinFile: (filePath: string): Promise<ArrayBuffer> => {
        console.log('[PRELOAD] readBinFile called', { filePath });
        return ipcRenderer.invoke('read-bin-file', filePath);
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
     * Remove all serial-data listeners (used by ESP32SimulationRunner.stop())
     */
    removeSerialDataListener: (): void => {
        ipcRenderer.removeAllListeners('serial-data');
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
        ['python-output', 'python-error', 'python-exit', 'python-repl-output', 'python-repl-error', 'python-repl-exit', 'python-pip-output', 'python-pip-error', 'python-pip-exit', 'python-shell-output', 'python-shell-error', 'python-shell-exit', 'python-download-progress', 'tool-download-progress'].forEach(e => ipcRenderer.removeAllListeners(e));
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
    searchLibrary: (query: string) => ipcRenderer.invoke('search-library', query),
    installLibrary: (libName: string) => ipcRenderer.invoke('install-library', libName),
    removeLibrary: (libName: string) => ipcRenderer.invoke('remove-library', libName),
    getInstalledLibraries: () => ipcRenderer.invoke('get-installed-libraries'),
    getForgeLibPath: () => ipcRenderer.invoke('get-forge-lib-path'),
    isElectron: typeof ipcRenderer !== 'undefined' && ipcRenderer !== null,

    // ═══════════════════════════════════════════════════════════════════════
    // PYTHON NATIVE APIS
    // ═══════════════════════════════════════════════════════════════════════
    pythonCheck: () => ipcRenderer.invoke('python-check'),
    pythonRun: (code: string, projectFiles?: Record<string, string>) => ipcRenderer.invoke('python-run', code, projectFiles),
    pythonSendInput: (input: string) => ipcRenderer.invoke('python-send-input', input),
    pythonReplStart: () => ipcRenderer.invoke('python-repl-start'),
    pythonReplSend: (input: string) => ipcRenderer.invoke('python-repl-send', input),
    pythonStop: () => ipcRenderer.invoke('python-stop'),
    pythonPipInstall: (pkg: string) => ipcRenderer.invoke('python-pip-install', pkg),
    pythonShellRun: (cmd: string) => ipcRenderer.invoke('python-shell-run', cmd),
    pythonShellStop: () => ipcRenderer.invoke('python-shell-stop'),
    onPythonFilesUpdated: (callback: (files: Record<string, string>) => void) => {
        const handler = (_: any, files: any) => callback(files as Record<string, string>);
        ipcRenderer.on('python-files-updated', handler);
        return () => ipcRenderer.removeListener('python-files-updated', handler);
    },

    onPythonOutput: (callback: (data: string) => void) => {
        const handler = (_: any, msg: any) => callback(msg as string);
        ipcRenderer.on('python-output', handler);
        return () => ipcRenderer.removeListener('python-output', handler);
    },
    onPythonError: (callback: (data: string) => void) => {
        const handler = (_: any, msg: any) => callback(msg as string);
        ipcRenderer.on('python-error', handler);
        return () => ipcRenderer.removeListener('python-error', handler);
    },
    onPythonExit: (callback: (code: number) => void) => {
        const handler = (_: any, code: any) => callback(code as number);
        ipcRenderer.on('python-exit', handler);
        return () => ipcRenderer.removeListener('python-exit', handler);
    },
    onPythonReplOutput: (callback: (data: string) => void) => {
        const handler = (_: any, msg: any) => callback(msg as string);
        ipcRenderer.on('python-repl-output', handler);
        return () => ipcRenderer.removeListener('python-repl-output', handler);
    },
    onPythonReplError: (callback: (data: string) => void) => {
        const handler = (_: any, msg: any) => callback(msg as string);
        ipcRenderer.on('python-repl-error', handler);
        return () => ipcRenderer.removeListener('python-repl-error', handler);
    },
    onPythonReplExit: (callback: (code: number) => void) => {
        const handler = (_: any, code: any) => callback(code as number);
        ipcRenderer.on('python-repl-exit', handler);
        return () => ipcRenderer.removeListener('python-repl-exit', handler);
    },
    onPythonPipOutput: (callback: (data: string) => void) => {
        const handler = (_: any, msg: any) => callback(msg as string);
        ipcRenderer.on('python-pip-output', handler);
        return () => ipcRenderer.removeListener('python-pip-output', handler);
    },
    onPythonPipError: (callback: (data: string) => void) => {
        const handler = (_: any, msg: any) => callback(msg as string);
        ipcRenderer.on('python-pip-error', handler);
        return () => ipcRenderer.removeListener('python-pip-error', handler);
    },
    onPythonPipExit: (callback: (code: number) => void) => {
        const handler = (_: any, msg: any) => callback(msg as number);
        ipcRenderer.on('python-pip-exit', handler);
        return () => ipcRenderer.removeListener('python-pip-exit', handler);
    },
    onPythonShellOutput: (callback: (data: string) => void) => {
        const handler = (_: any, msg: any) => callback(msg as string);
        ipcRenderer.on('python-shell-output', handler);
        return () => ipcRenderer.removeListener('python-shell-output', handler);
    },
    onPythonShellError: (callback: (data: string) => void) => {
        const handler = (_: any, msg: any) => callback(msg as string);
        ipcRenderer.on('python-shell-error', handler);
        return () => ipcRenderer.removeListener('python-shell-error', handler);
    },
    onPythonShellExit: (callback: (code: number) => void) => {
        const handler = (_: any, msg: any) => callback(msg as number);
        ipcRenderer.on('python-shell-exit', handler);
        return () => ipcRenderer.removeListener('python-shell-exit', handler);
    },
    onPythonDownloadProgress: (callback: (data: { status: string; message: string }) => void) => {
        const handler = (_: any, msg: any) => callback(msg as { status: string; message: string });
        ipcRenderer.on('python-download-progress', handler);
        return () => ipcRenderer.removeListener('python-download-progress', handler);
    },

    // ── Startup tool download notifications (Arduino CLI + Python 3.10) ──
    onToolDownloadProgress: (callback: (data: { tool: string; status: string; message: string }) => void) => {
        const handler = (_: any, msg: any) => callback(msg as { tool: string; status: string; message: string });
        ipcRenderer.on('tool-download-progress', handler);
        return () => ipcRenderer.removeListener('tool-download-progress', handler);
    },

    // ═══════════════════════════════════════════════════════════════════════
    // AUTO-UPDATE APIs
    // ═══════════════════════════════════════════════════════════════════════

    checkForUpdate: () => ipcRenderer.invoke('check-for-update'),
    downloadUpdate: (info: any) => ipcRenderer.invoke('download-update', info),
    installUpdate: (path: string) => ipcRenderer.invoke('install-update', path),

    onUpdateAvailable: (callback: (info: any) => void) => {
      const handler = (_: any, data: any) => callback(data);
      ipcRenderer.on('update-available', handler);
      return () => ipcRenderer.removeListener('update-available', handler);
    },

    onUpdateDownloadProgress: (callback: (progress: any) => void) => {
      const handler = (_: any, data: any) => callback(data);
      ipcRenderer.on('update-download-progress', handler);
      return () => ipcRenderer.removeListener('update-download-progress', handler);
    },

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
            compileCode: (code: string, fqbn?: string, libraryPath?: string) => Promise<{ success: boolean; hexContent?: string; binPath?: string; error?: string }>;
            onSerialData: (callback: (data: string) => void) => void;
            removeSerialDataListener: () => void;
            onConnectionChange: (callback: (connected: boolean) => void) => void;
            onUploadProgress: (callback: (progress: number, message: string) => void) => void;
            removeAllListeners: () => void;
            removeBackground: (imagePath: string) => Promise<{ success: boolean; error?: string; stdout?: string; stderr?: string; base64?: string }>;
            // ESP32 QEMU
            esp32Start: (binPath: string) => Promise<{ ok: boolean }>;
            esp32Stop: () => Promise<{ ok: boolean }>;
            esp32GpioSet: (pin: number, high: boolean) => Promise<void>;
            esp32AdcSet: (channel: number, voltage: number) => Promise<void>;
            // ESP32-C3 RISC-V firmware scanner
            readBinFile: (filePath: string) => Promise<ArrayBuffer>;
            buildApk: (appState: any) => Promise<{ success: boolean, outputPath?: string, error?: string }>;
            onBuildLog: (cb: (msg: string) => void) => void;
            removeBuildLogListener: () => void;
            showInFolder: (p: string) => void;
            saveProject: (d: any, path?: string) => Promise<{ success: boolean; projectPath?: string; error?: string }>;
            openProject: () => Promise<any>;
            searchLibrary: (query: string) => Promise<{ libraries: ArduinoLib[] }>;
            installLibrary: (libName: string) => Promise<{ success: boolean; error?: string }>;
            removeLibrary: (libName: string) => Promise<{ success: boolean; error?: string }>;
            getInstalledLibraries: () => Promise<ArduinoLib[]>;
            getForgeLibPath: () => Promise<string>;
            isElectron: boolean;

            pythonCheck: () => Promise<{ available: boolean; version?: string; error?: string }>;
            pythonRun: (code: string, projectFiles?: Record<string, string>) => Promise<void>;
            pythonSendInput: (input: string) => Promise<void>;
            pythonReplStart: () => Promise<void>;
            pythonReplSend: (input: string) => Promise<void>;
            pythonStop: () => Promise<void>;
            pythonPipInstall: (pkg: string) => Promise<void>;
            pythonShellRun: (cmd: string) => Promise<void>;
            pythonShellStop: () => Promise<void>;
            onPythonFilesUpdated: (callback: (files: Record<string, string>) => void) => () => void;

            onPythonOutput: (callback: (data: string) => void) => () => void;
            onPythonError: (callback: (data: string) => void) => () => void;
            onPythonExit: (callback: (code: number) => void) => () => void;
            onPythonReplOutput: (callback: (data: string) => void) => () => void;
            onPythonReplError: (callback: (data: string) => void) => () => void;
            onPythonReplExit: (callback: (code: number) => void) => () => void;
            onPythonPipOutput: (callback: (data: string) => void) => () => void;
            onPythonPipError: (callback: (data: string) => void) => () => void;
            onPythonPipExit: (callback: (code: number) => void) => () => void;
            onPythonShellOutput: (callback: (data: string) => void) => () => void;
            onPythonShellError: (callback: (data: string) => void) => () => void;
            onPythonShellExit: (callback: (code: number) => void) => () => void;
            onPythonDownloadProgress: (callback: (data: { status: string; message: string }) => void) => () => void;
            onToolDownloadProgress: (callback: (data: { tool: string; status: string; message: string }) => void) => () => void;

            // Auto-update
            checkForUpdate: () => Promise<any>;
            downloadUpdate: (info: any) => Promise<{ success: boolean; installerPath?: string; error?: string }>;
            installUpdate: (path: string) => Promise<{ success: boolean; error?: string }>;
            onUpdateAvailable: (callback: (info: any) => void) => () => void;
            onUpdateDownloadProgress: (callback: (progress: any) => void) => () => void;

            invoke: (channel: string, ...args: any[]) => Promise<any>;
        };
    }
}

console.log('[PRELOAD] IPC bridge initialized successfully');
