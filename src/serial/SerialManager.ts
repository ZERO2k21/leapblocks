import { BrowserWindow } from 'electron';
// Use __non_webpack_require__ to bypass webpack bundling
declare const __non_webpack_require__: typeof require;
const { SerialPort } = __non_webpack_require__('serialport');
const { ReadlineParser } = __non_webpack_require__('@serialport/parser-readline');

export class SerialManager {
    private activePort: any = null;
    private mainWindow: BrowserWindow | null = null;
    private lastBaud: number = 9600;

    constructor(window: BrowserWindow | null) {
        this.mainWindow = window;
    }

    setWindow(window: BrowserWindow | null) {
        this.mainWindow = window;
    }

    async listPorts() {
        try {
            const ports = await SerialPort.list();
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

    async connect(portPath: string, baudRate: number) {
        this.lastBaud = baudRate;
        if (this.activePort && this.activePort.isOpen) {
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

                    this.activePort.set({ dtr: true, rts: true }, (setErr: Error | null) => {
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
