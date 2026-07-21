export class VirtualFileSystem {
    files: Map<string, string>;
    modifiedFiles: Set<string>;

    constructor() {
        this.files = new Map();
        this.modifiedFiles = new Set();
    }

    loadFromProjectFiles(projectFiles: Record<string, string>): void {
        this.files.clear();
        this.modifiedFiles.clear();
        if (projectFiles) {
            for (const [name, content] of Object.entries(projectFiles)) {
                this.files.set(name, content);
            }
        }
    }

    getModifiedFiles(): Record<string, string> {
        const result: Record<string, string> = {};
        for (const name of this.modifiedFiles) {
            result[name] = this.files.get(name) || '';
        }
        return result;
    }

    exists(name: string): boolean {
        return this.files.has(name);
    }

    readFile(name: string): string {
        if (!this.files.has(name)) {
            throw new Error(`[Errno 2] No such file or directory: '${name}'`);
        }
        return this.files.get(name)!;
    }

    writeFile(name: string, content: string, append = false): void {
        if (append && this.files.has(name)) {
            const existing = this.files.get(name)!;
            this.files.set(name, existing + content);
        } else {
            this.files.set(name, content);
        }
        this.modifiedFiles.add(name);
    }

    deleteFile(name: string): void {
        this.files.delete(name);
        this.modifiedFiles.add(name);
    }

    listFiles(): string[] {
        return Array.from(this.files.keys());
    }

    isFile(name: string): boolean {
        return this.files.has(name);
    }

    getFileSize(name: string): number {
        if (!this.files.has(name)) {
            throw new Error(`[Errno 2] No such file or directory: '${name}'`);
        }
        return this.files.get(name)!.length;
    }
}
