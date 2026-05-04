import type { SDCardSPISlave } from './SDCardSPISlave';
import { sdCardSimulator, VirtualFile } from './SDCardSimulator';

export function createSDLibraryBridge(sdCardSlaves: Map<string, SDCardSPISlave>) {
  // Wrapper class that bridges VirtualFile to Arduino File API
  class RealFile {
    private _virtualFile: VirtualFile | null;
    private _card: SDCardSPISlave | null;

    constructor(card: SDCardSPISlave | null | undefined, virtualFile?: VirtualFile | null) {
      this._card = card ?? null;
      this._virtualFile = virtualFile ?? null;
    }

    name(): string {
      return this._virtualFile?.name() ?? 'file.txt';
    }

    // ✅ Arduino expects isDirectory() not isDir()
    isDirectory(): boolean {
      return this._virtualFile?.isDirectory() ?? false;
    }

    // Legacy alias
    isDir(): boolean {
      return this.isDirectory();
    }

    isFile(): boolean {
      return !this.isDirectory();
    }

    isOpen(): boolean {
      return this._virtualFile?.isOpen() ?? false;
    }

    close(): void {
      this._virtualFile?.close();
    }

    write(data: any): number {
      if (!this._virtualFile || this._virtualFile.isDirectory()) return 0;
      return this._virtualFile.write(data);
    }

    println(str: any = ''): number {
      if (!this._virtualFile || this._virtualFile.isDirectory()) return 0;
      this._virtualFile.println(str);
      return String(str).length + 1;
    }

    print(str: any = ''): number {
      if (!this._virtualFile || this._virtualFile.isDirectory()) return 0;
      this._virtualFile.print(str);
      return String(str).length;
    }

    read(): number {
      return this._virtualFile?.read() ?? -1;
    }

    available(): number {
      return this._virtualFile?.available() ?? 0;
    }

    seek(pos: number): boolean {
      return this._virtualFile?.seek(pos) ?? false;
    }

    size(): number {
      return this._virtualFile?.size() ?? 0;
    }

    rewindDirectory(): void {
      this._virtualFile?.seek(0);
    }

    openNextFile(): RealFile | null {
      const nextFile = this._virtualFile?.openNextFile();
      return nextFile ? new RealFile(this._card, nextFile) : null;
    }
  }

  class SDBackend {
    private _cardSelected: SDCardSPISlave | null = null;
    private _usingSimulator: boolean = false;

    begin(pin?: number, _speed?: number): boolean {
      console.log(`[SD] begin() called with CS pin ${pin}`);

      // Try to use physical SD card component first
      if (sdCardSlaves.size > 0) {
        this._cardSelected = sdCardSlaves.values().next().value ?? null;
        this._usingSimulator = false;
        console.log('[SD] Physical SD card component found on canvas');
        return true;
      }

      // Fall back to virtual SD card simulator
      this._cardSelected = null;
      this._usingSimulator = true;
      const result = sdCardSimulator.begin(pin ?? 5);
      console.log('[SD] Using virtual SD card simulator (no physical component on canvas)');
      return result;
    }

    exists(filename: string): boolean {
      if (this._usingSimulator) {
        return sdCardSimulator.exists(filename);
      }
      return false;
    }

    remove(filename: string): boolean {
      if (this._usingSimulator) {
        return sdCardSimulator.remove(filename);
      }
      return false;
    }

    mkdir(dirname: string): boolean {
      if (this._usingSimulator) {
        return sdCardSimulator.mkdir(dirname);
      }
      return false;
    }

    rmdir(dirname: string): boolean {
      if (this._usingSimulator) {
        return sdCardSimulator.rmdir(dirname);
      }
      return false;
    }

    open(filename: string, mode?: number): RealFile {
      if (this._usingSimulator) {
        // Convert Arduino file mode constants to string mode
        let modeStr = 'r';
        if (mode === 1) modeStr = 'w';  // FILE_WRITE
        if (mode === 2) modeStr = 'a';  // FILE_APPEND

        const virtualFile = sdCardSimulator.open(filename, modeStr);
        return new RealFile(this._cardSelected, virtualFile);
      }
      return new RealFile(this._cardSelected);
    }

    exists_file(filename: string): boolean {
      return this.exists(filename);
    }

    cardSize(): number {
      return 2 * 1024 * 1024 / 512;  // 2MB in 512-byte sectors
    }

    type(): number {
      return 2;  // SD card type
    }
  }

  const backend = new SDBackend();

  class SDNamespace {
    begin(pin?: number, speed?: number): boolean {
      return backend.begin(pin, speed);
    }

    static begin(pin?: number, speed?: number): boolean {
      return backend.begin(pin, speed);
    }

    exists(filename: string): boolean {
      return backend.exists(filename);
    }

    static exists(filename: string): boolean {
      return backend.exists(filename);
    }

    remove(filename: string): boolean {
      return backend.remove(filename);
    }

    static remove(filename: string): boolean {
      return backend.remove(filename);
    }

    mkdir(dirname: string): boolean {
      return backend.mkdir(dirname);
    }

    static mkdir(dirname: string): boolean {
      return backend.mkdir(dirname);
    }

    rmdir(dirname: string): boolean {
      return backend.rmdir(dirname);
    }

    static rmdir(dirname: string): boolean {
      return backend.rmdir(dirname);
    }

    open(filename: string, mode?: number): RealFile {
      return backend.open(filename, mode);
    }

    static open(filename: string, mode?: number): RealFile {
      return backend.open(filename, mode);
    }

    exists_file(filename: string): boolean {
      return backend.exists_file(filename);
    }

    static exists_file(filename: string): boolean {
      return backend.exists_file(filename);
    }

    cardSize(): number {
      return backend.cardSize();
    }

    static cardSize(): number {
      return backend.cardSize();
    }

    type(): number {
      return backend.type();
    }

    static type(): number {
      return backend.type();
    }
  }

  return {
    SD: SDNamespace,
    File: RealFile,
  };
}
