/**
 * SD Card Simulator for LeapForge
 * Provides in-memory virtual file system compatible with Arduino SD library
 */

/**
 * VirtualFile - Represents both files and directories
 * Complete implementation with all Arduino File API methods
 */
export class VirtualFile {
    private _path: string;
    private _files: Map<string, Uint8Array>;
    private _mode: string;
    private _data: Uint8Array;
    private _position: number = 0;
    private _isDir: boolean;
    private _dirKeys: string[] = [];
    private _dirIndex: number = 0;

    constructor(
        path: string,
        files: Map<string, Uint8Array>,
        mode: string = 'r',
        isDirectory: boolean = false
    ) {
        this._path = path;
        this._files = files;
        this._mode = mode;
        this._isDir = isDirectory;
        this._data = files.get(path) ?? new Uint8Array(0);

        if (isDirectory) {
            // Collect all files inside this directory
            const prefix = path === '/' ? '/' : path + '/';
            this._dirKeys = Array.from(files.keys()).filter(k => {
                if (k === path) return false; // Skip the directory itself
                if (!k.startsWith(prefix)) return false; // Must be in this directory

                if (path === '/') {
                    // Root: direct children only (no nested paths)
                    const relativePath = k.substring(1); // Remove leading '/'
                    return !relativePath.includes('/');
                }

                // Get relative path after directory prefix
                const relativePath = k.substring(prefix.length);
                return !relativePath.includes('/'); // No nested paths
            });

            console.log(`[SD CARD] Directory ${path} contains ${this._dirKeys.length} files:`, this._dirKeys);
        }

        if (mode === 'a') {
            this._position = this._data.length;
        }
    }

    // ✅ isDirectory() - MUST be a function
    isDirectory(): boolean {
        return this._isDir;
    }

    // ✅ name() - returns filename only (not full path), uppercase
    name(): string {
        const parts = this._path.split('/').filter(p => p);
        if (parts.length === 0) return '/';
        const filename = parts[parts.length - 1];
        return filename.toUpperCase(); // FAT32 style
    }

    // ✅ size() - returns real byte count from filesystem
    size(): number {
        const d = this._files.get(this._path);
        return d ? d.length : 0;
    }

    // ✅ available() - returns unread bytes
    available(): number {
        return this._data.length - this._position;
    }

    // ✅ read() - returns next byte
    read(): number {
        if (this._position >= this._data.length) return -1;
        return this._data[this._position++];
    }

    // ✅ write() - appends bytes
    write(data: number | string | Uint8Array): number {
        let bytes: Uint8Array;

        if (typeof data === 'string') {
            bytes = new TextEncoder().encode(data);
        } else if (typeof data === 'number') {
            bytes = new Uint8Array([data]);
        } else {
            bytes = data;
        }

        const merged = new Uint8Array(this._data.length + bytes.length);
        merged.set(this._data);
        merged.set(bytes, this._data.length);
        this._data = merged;
        this._files.set(this._path, this._data);
        return bytes.length;
    }

    // ✅ println()
    println(str: string | number = ''): void {
        this.write(String(str) + '\n');
    }

    // ✅ print()
    print(str: string | number): void {
        this.write(String(str));
    }

    // ✅ close() - saves data back
    close(): void {
        if (this._mode !== 'r') {
            this._files.set(this._path, this._data);
        }
    }

    // ✅ openNextFile() - for directory iteration
    openNextFile(): VirtualFile | null {
        if (!this._isDir) return null;
        if (this._dirIndex >= this._dirKeys.length) {
            return null; // No more files
        }

        const nextPath = this._dirKeys[this._dirIndex++];
        console.log(`[SD CARD] openNextFile() returning: ${nextPath}`);

        // Check if it's a subdirectory
        const isSubDir = Array.from(this._files.keys()).some(k =>
            k.startsWith(nextPath + '/')
        );

        return new VirtualFile(nextPath, this._files, 'r', isSubDir);
    }

    // ✅ seek()
    seek(pos: number): boolean {
        if (pos < 0 || pos > this._data.length) return false;
        this._position = pos;
        return true;
    }

    // ✅ position()
    position(): number {
        return this._position;
    }

    // Legacy name for position
    position_get(): number {
        return this._position;
    }

    // ✅ Boolean conversion (if (file) {...})
    valueOf(): boolean {
        return this._files.has(this._path) || this._isDir;
    }

    // ✅ isOpen() - check if file is valid
    isOpen(): boolean {
        return this._files.has(this._path) || this._isDir;
    }

    // ✅ peek() - read without advancing
    peek(): number {
        if (this._position >= this._data.length) return -1;
        return this._data[this._position];
    }
}

export class SDCardSimulator {
    private static instance: SDCardSimulator;
    private initialized = false;
    private files: Map<string, Uint8Array> = new Map();
    private csPin: number = -1;

    private constructor() {
        // Singleton pattern
    }

    static getInstance(): SDCardSimulator {
        if (!SDCardSimulator.instance) {
            SDCardSimulator.instance = new SDCardSimulator();
        }
        return SDCardSimulator.instance;
    }

    // Simulate SD.begin(csPin)
    begin(csPin: number): boolean {
        console.log(`[SD CARD] Initializing SD card on CS pin ${csPin}`);
        this.csPin = csPin;
        this.initialized = true;

        // Pre-load default files if empty
        if (this.files.size === 0) {
            // Pre-load files with actual byte content
            this.writeFile('/leapforge.txt', 'Hello from LeapForge!\nThis is a simulated SD card.\nYou can read and write files!\n');
            this.writeFile('/data.csv', 'time,value\n0,100\n1,200\n2,150\n3,300\n');
            this.writeFile('/config.json', '{"version":"1.0","name":"LeapForge","enabled":true}');
            this.writeFile('/readme.md', '# LeapForge SD Card\n\nThis is a virtual SD card simulation.\n');
            console.log('[SD CARD] Loaded default files');
        }

        console.log(`[SD CARD] Initialized successfully with ${this.files.size} files`);
        return true;
    }

    // Simulate SD.open(path, mode) - returns VirtualFile (can be directory or file)
    open(path: string, mode: string = 'r'): VirtualFile | null {
        if (!this.initialized) {
            console.warn('[SD CARD] SD card not initialized. Call SD.begin() first.');
            return null;
        }

        // Normalize path
        const normalizedPath = path.endsWith('/') ? path.slice(0, -1) || '/' : path;
        const finalPath = normalizedPath.startsWith('/') ? normalizedPath : '/' + normalizedPath;

        console.log(`[SD CARD] Opening: ${finalPath} (mode: ${mode})`);

        // Check if it's a directory (root or has files starting with path/)
        const isDir = finalPath === '/' ||
            Array.from(this.files.keys()).some(k => k.startsWith(finalPath + '/'));

        if (isDir) {
            // Return directory VirtualFile
            console.log(`[SD CARD] Opening directory: ${finalPath}`);
            return new VirtualFile(finalPath, this.files, 'r', true);
        }

        // Regular file
        if (mode === 'w' || mode === 'a') {
            // Create if not exists
            if (!this.files.has(finalPath)) {
                this.files.set(finalPath, new Uint8Array(0));
                console.log(`[SD CARD] Created new file: ${finalPath}`);
            }
        }

        // Check if file exists for read mode
        if (mode === 'r' && !this.files.has(finalPath)) {
            console.warn(`[SD CARD] File not found: ${finalPath}`);
            return null;
        }

        return new VirtualFile(finalPath, this.files, mode, false);
    }

    // Simulate SD.exists(path)
    exists(path: string): boolean {
        if (!path.startsWith('/')) {
            path = '/' + path;
        }
        return this.files.has(path);
    }

    // Simulate SD.remove(path)
    remove(path: string): boolean {
        if (!path.startsWith('/')) {
            path = '/' + path;
        }
        const result = this.files.delete(path);
        if (result) {
            console.log(`[SD CARD] Deleted file: ${path}`);
        }
        return result;
    }

    // Simulate SD.mkdir(path)
    mkdir(path: string): boolean {
        if (!path.startsWith('/')) {
            path = '/' + path;
        }
        this.files.set(path + '/.dir', new Uint8Array(0));
        console.log(`[SD CARD] Created directory: ${path}`);
        return true;
    }

    // Simulate SD.rmdir(path)
    rmdir(path: string): boolean {
        if (!path.startsWith('/')) {
            path = '/' + path;
        }
        return this.files.delete(path + '/.dir');
    }

    // Write file helper (for UI and initialization)
    writeFile(path: string, content: string): void {
        if (!path.startsWith('/')) {
            path = '/' + path;
        }
        const encoder = new TextEncoder();
        this.files.set(path, encoder.encode(content));
        console.log(`[SD CARD] Wrote file: ${path} (${content.length} bytes)`);
    }

    // Read file helper (for UI)
    readFile(path: string): string | null {
        if (!path.startsWith('/')) {
            path = '/' + path;
        }
        const data = this.files.get(path);
        if (!data) return null;
        const decoder = new TextDecoder();
        return decoder.decode(data);
    }

    // List all files (for printDirectory and UI)
    listFiles(dir: string = '/'): Array<{ path: string; size: number; isDir: boolean }> {
        return Array.from(this.files.entries())
            .filter(([path]) => {
                if (dir === '/') return true;
                return path.startsWith(dir);
            })
            .map(([path, data]) => ({
                path,
                size: data.length,
                isDir: path.endsWith('/.dir')
            }));
    }

    // Get all files (for UI)
    getAllFiles(): Map<string, Uint8Array> {
        return new Map(this.files);
    }

    // Clear all files (for UI)
    clearAll(): void {
        this.files.clear();
        console.log('[SD CARD] Cleared all files');
    }

    // Get initialization status
    isInitialized(): boolean {
        return this.initialized;
    }

    // Get CS pin
    getCSPin(): number {
        return this.csPin;
    }
}

// Export singleton instance
export const sdCardSimulator = SDCardSimulator.getInstance();
