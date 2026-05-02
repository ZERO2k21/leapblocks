/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import { BrowserWindow } from 'electron';
import path from 'path';
// Use standard require for serialport loaded as a native module
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

/**
 * Resolve the path to bundled board drivers.
 * In production: drivers are in extraResources → process.resourcesPath/drivers
 * In development: drivers are in src/leapembed/drivers
 */
function getDriversPath(): string {
    if (process.env.NODE_ENV === 'production') {
        return path.join(process.resourcesPath, 'drivers');
    }
    return path.join(__dirname, '..', '..', '..', 'src', 'leapembed', 'drivers');
}

export function getArduinoDriverPath(): string {
    return path.join(getDriversPath(), 'arduino', 'cp210x', 'silabser.inf');
}

export function getEsp32DriverPath(): string {
    return path.join(getDriversPath(), 'esp32');
}


export class SerialManager {
    private activePort: any = null;
    private mainWindow: BrowserWindow | null = null;
    private lastBaud: number = 9600;
    public lastBoard: string = 'arduino_uno';

    constructor(window: BrowserWindow | null) {
        this.mainWindow = window;
    }

    setWindow(window: BrowserWindow | null) {
        this.mainWindow = window;
    }

    async listPorts() {
        console.log('[SerialManager] Starting port scan...');
        try {
            const ports = await SerialPort.list();
            console.log(`[SerialManager] Found ${ports.length} standard COM ports:`, ports);

            // If no standard COM ports are found, let's check if there's a recognized Bridge 
            // that just hasn't been assigned a COM port yet (driver issue).
            if (ports.length === 0 && process.platform === 'win32') {
                try {
                    const { exec } = require('child_process');
                    const { promisify } = require('util');
                    const execAsync = promisify(exec);

                    console.log('[SerialManager] No COM ports found. Running PowerShell fallback scan for CP210x/CH340 bridges...');
                    // Search for common USB-to-UART bridge keywords in PNP entities
                    const { stdout } = await execAsync('powershell -Command "Get-CimInstance Win32_PnPEntity | Where-Object { $_.Caption -match \'CP210\' -or $_.Caption -match \'CH34\' -or $_.Caption -match \'USB to UART\' } | Select-Object Caption"');
                    console.log('[SerialManager] PowerShell fallback output:', stdout);

                    if (stdout && stdout.trim()) {
                        const lines = stdout.split('\n').filter((l: string) => l.trim() && !l.includes('Caption') && !l.includes('-------'));
                        if (lines.length > 0) {
                            console.log(`[SerialManager] Detected ${lines.length} unassigned bridge(s):`, lines);
                            const driverPath = getArduinoDriverPath();
                            console.log(`[SerialManager] Driver available at: ${driverPath}`);
                            return lines.map((line: string) => ({
                                path: 'BRIDGE_DETECTED',
                                manufacturer: line.trim(),
                                productId: 'MISSING_DRIVER_OR_COM',
                                driverPath,
                            }));
                        }
                    }
                } catch (pnpError) {
                    console.error('[SerialManager] Fallback bridge scan failed:', pnpError);
                }
            }

            return ports.map((p: any) => ({
                path: p.path,
                manufacturer: p.manufacturer,
                productId: p.productId,
            }));
        } catch (error) {
            console.error('[SerialManager] Error listing ports:', error);
            return [];
        }
    }

    async connect(portPath: string, baudRate: number, board: string = 'arduino_uno') {
        console.log(`[SerialManager] Attempting to connect to ${portPath} (Board: ${board}) at ${baudRate} baud...`);
        this.lastBaud = baudRate;
        this.lastBoard = board;
        if (this.activePort && this.activePort.isOpen) {
            console.log(`[SerialManager] Closing existing port ${this.activePort.path} before reconnecting...`);
            await this.disconnect();
        }

        return new Promise((resolve, reject) => {
            try {
                this.activePort = new SerialPort({
                    path: portPath,
                    baudRate: baudRate,
                    autoOpen: false,
                    hupcl: false,
                });

                const parser = this.activePort.pipe(new ReadlineParser({ delimiter: '\n' }));

                parser.on('data', (data: string) => {
                    if (this.mainWindow) {
                        // Remove any remaining \r characters and send
                        const cleanData = data.replace(/\r/g, '');
                        this.mainWindow.webContents.send('serial-data', cleanData + '\n');
                    }
                });

                this.activePort.on('error', (error: Error) => {
                    console.error('[SerialManager] Port error:', error);
                    if (this.mainWindow) {
                        this.mainWindow.webContents.send('connection-change', false);
                    }
                });

                this.activePort.on('close', () => {
                    if (this.mainWindow) {
                        this.mainWindow.webContents.send('connection-change', false);
                    }
                });

                this.activePort.open((err: Error | null) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    const isESP32 = board.includes('esp32');
                    const dtr = !isESP32;
                    const rts = !isESP32;
                    console.log(`[SerialManager] Port opened successfully. Board is ESP32: ${isESP32}. Setting DTR: ${dtr}, RTS: ${rts}`);

                    this.activePort.set({ dtr, rts }, (setErr: Error | null) => {
                        if (setErr) console.error('[SerialManager] Error setting DTR/RTS:', setErr);
                        if (this.mainWindow) {
                            this.mainWindow.webContents.send('connection-change', true);
                        }
                        resolve({ success: true });
                    });
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    async disconnect() {
        if (this.activePort && this.activePort.isOpen) {
            return new Promise((resolve) => {
                this.activePort.close(() => {
                    this.activePort = null;
                    if (this.mainWindow) {
                        this.mainWindow.webContents.send('connection-change', false);
                    }
                    resolve({ success: true });
                });
            });
        }
        return { success: true };
    }

    write(data: string) {
        if (this.activePort && this.activePort.isOpen) {
            this.activePort.write(data);
        }
    }

    isConnected(): boolean {
        return this.activePort && this.activePort.isOpen;
    }

    get activePortPath(): string | null {
        return this.activePort ? this.activePort.path : null;
    }

    get currentBaud(): number {
        return this.lastBaud;
    }
}
