export class VirtualFileSystem {
    constructor() {
        this.files = new Map();
        this.modifiedFiles = new Set();
    }

    loadFromProjectFiles(projectFiles) {
        this.files.clear();
        this.modifiedFiles.clear();
        if (projectFiles) {
            for (const [name, content] of Object.entries(projectFiles)) {
                this.files.set(name, content);
            }
        }
    }

    getModifiedFiles() {
        const result = {};
        for (const name of this.modifiedFiles) {
            result[name] = this.files.get(name) || '';
        }
        return result;
    }

    exists(name) {
        return this.files.has(name);
    }

    readFile(name) {
        if (!this.files.has(name)) {
            throw new Error(`[Errno 2] No such file or directory: '${name}'`);
        }
        return this.files.get(name);
    }

    writeFile(name, content, append = false) {
        if (append && this.files.has(name)) {
            const existing = this.files.get(name);
            this.files.set(name, existing + content);
        } else {
            this.files.set(name, content);
        }
        this.modifiedFiles.add(name);
    }

    deleteFile(name) {
        this.files.delete(name);
        this.modifiedFiles.add(name);
    }

    listFiles() {
        return Array.from(this.files.keys());
    }

    isFile(name) {
        return this.files.has(name);
    }

    getFileSize(name) {
        if (!this.files.has(name)) {
            throw new Error(`[Errno 2] No such file or directory: '${name}'`);
        }
        return this.files.get(name).length;
    }
}
