/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * 
 * Browser Library Storage - IndexedDB-based library storage for web version
 * Mimics the Electron app's forge-lib/libraries/ folder structure
 */

const DB_NAME = 'ElectraLibraries';
const DB_VERSION = 1;
const STORE_NAME = 'libraries';

export interface StoredLibrary {
    name: string;
    version: string;
    author: string;
    description: string;
    files: {
        [path: string]: string; // path -> content
    };
    installedAt: number;
}

class BrowserLibraryStorage {
    private db: IDBDatabase | null = null;

    async init(): Promise<void> {
        if (this.db) return;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                console.log('[BROWSER STORAGE] IndexedDB initialized');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'name' });
                    store.createIndex('version', 'version', { unique: false });
                    store.createIndex('installedAt', 'installedAt', { unique: false });
                    console.log('[BROWSER STORAGE] Object store created');
                }
            };
        });
    }

    async installLibrary(lib: {
        name: string;
        version: string;
        author: string;
        description: string;
        url?: string;
    }): Promise<{ success: boolean; error?: string }> {
        try {
            await this.init();

            console.log(`[BROWSER STORAGE] Downloading library: ${lib.name}`);

            // Download library files from Arduino CDN
            const files = await this.downloadLibraryFiles(lib.name, lib.version, lib.author, lib.url);

            if (!files || Object.keys(files).length === 0) {
                return { success: false, error: 'Failed to download library files. Please check your internet connection or try again.' };
            }

            const storedLib: StoredLibrary = {
                name: lib.name,
                version: lib.version,
                author: lib.author,
                description: lib.description,
                files,
                installedAt: Date.now(),
            };

            await this.saveToIndexedDB(storedLib);

            console.log(`[BROWSER STORAGE] Library ${lib.name} installed successfully`);
            return { success: true };
        } catch (error: any) {
            console.error('[BROWSER STORAGE] Installation failed:', error);
            return { success: false, error: error.message };
        }
    }

    async uninstallLibrary(name: string): Promise<{ success: boolean; error?: string }> {
        try {
            await this.init();

            return new Promise((resolve, reject) => {
                const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.delete(name);

                request.onsuccess = () => {
                    console.log(`[BROWSER STORAGE] Library ${name} uninstalled`);
                    resolve({ success: true });
                };

                request.onerror = () => {
                    reject({ success: false, error: request.error?.message });
                };
            });
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    async getInstalledLibraries(): Promise<StoredLibrary[]> {
        try {
            await this.init();

            return new Promise((resolve, reject) => {
                const transaction = this.db!.transaction([STORE_NAME], 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.getAll();

                request.onsuccess = () => {
                    console.log(`[BROWSER STORAGE] Found ${request.result.length} installed libraries`);
                    resolve(request.result);
                };

                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('[BROWSER STORAGE] Failed to get libraries:', error);
            return [];
        }
    }

    async getLibrary(name: string): Promise<StoredLibrary | null> {
        try {
            await this.init();

            return new Promise((resolve, reject) => {
                const transaction = this.db!.transaction([STORE_NAME], 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.get(name);

                request.onsuccess = () => resolve(request.result || null);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('[BROWSER STORAGE] Failed to get library:', error);
            return null;
        }
    }

    async getLibraryFiles(name: string): Promise<{ [path: string]: string } | null> {
        const lib = await this.getLibrary(name);
        return lib ? lib.files : null;
    }

    private async saveToIndexedDB(lib: StoredLibrary): Promise<void> {
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(lib);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    private async downloadLibraryFiles(
        name: string,
        version: string,
        author: string,
        url?: string
    ): Promise<{ [path: string]: string }> {
        try {
            // Try to download from Arduino library repository
            // Pattern: https://downloads.arduino.cc/libraries/github.com/author/Name-version.zip
            const sanitizedName = name.replace(/\s+/g, '_');
            const sanitizedAuthor = author.replace(/\s+/g, '').toLowerCase();
            
            // Try with author prefix (common for Adafruit, etc.)
            const urls = [];
            if (url) {
                urls.push(url.replace('http://', 'https://'));
            }
            urls.push(
                `https://downloads.arduino.cc/libraries/github.com/${sanitizedAuthor}/${sanitizedName}-${version}.zip`,
                `https://downloads.arduino.cc/libraries/github.com/arduino-libraries/${sanitizedName}-${version}.zip`,
                `https://downloads.arduino.cc/libraries/github.com/${sanitizedName}-${version}.zip`
            );

            let response = null;
            for (const url of urls) {
                console.log(`[BROWSER STORAGE] Attempting download from: ${url}`);
                try {
                    const r = await fetch(url);
                    if (r.ok) {
                        response = r;
                        break;
                    }
                } catch (e) {
                    console.warn(`[BROWSER STORAGE] Fetch failed for ${url}:`, e);
                }
            }

            if (!response) {
                throw new Error(`Failed to download library: All download sources returned 404 or were blocked.`);
            }

            return await this.extractZipFiles(await response.blob(), name);
        } catch (error: any) {
            console.error('[BROWSER STORAGE] Download failed:', error);
            return {};
        }
    }

    private async extractZipFiles(blob: Blob, libName: string): Promise<{ [path: string]: string }> {
        try {
            // Use JSZip to extract files
            const JSZip = (await import('jszip')).default;
            const zip = await JSZip.loadAsync(blob);

            const files: { [path: string]: string } = {};

            for (const [path, file] of Object.entries(zip.files)) {
                if (!file.dir && (path.endsWith('.h') || path.endsWith('.cpp') || path.endsWith('.c'))) {
                    const content = await file.async('text');
                    files[path] = content;
                }
            }

            console.log(`[BROWSER STORAGE] Extracted ${Object.keys(files).length} files from ${libName}`);
            return files;
        } catch (error: any) {
            console.error('[BROWSER STORAGE] Zip extraction failed:', error);
            return {};
        }
    }

    private createMinimalLibrary(name: string, version: string): { [path: string]: string } {
        // Create minimal library structure for compilation
        const headerFile = `${name}.h`;
        const cppFile = `${name}.cpp`;

        return {
            [headerFile]: `// ${name} Library v${version}\n#ifndef ${name.toUpperCase()}_H\n#define ${name.toUpperCase()}_H\n\n#include <Arduino.h>\n\nclass ${name} {\npublic:\n  ${name}();\n  void begin();\n};\n\n#endif\n`,
            [cppFile]: `// ${name} Library v${version}\n#include "${headerFile}"\n\n${name}::${name}() {}\n\nvoid ${name}::begin() {}\n`,
            'library.properties': `name=${name}\nversion=${version}\nauthor=Arduino\nmaintainer=Arduino\nsentence=Arduino library\nparagraph=\ncategory=Other\nurl=https://arduino.cc\narchitectures=*\n`,
        };
    }

    async clearAll(): Promise<void> {
        await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => {
                console.log('[BROWSER STORAGE] All libraries cleared');
                resolve();
            };

            request.onerror = () => reject(request.error);
        });
    }

    async getStorageSize(): Promise<number> {
        const libs = await this.getInstalledLibraries();
        let totalSize = 0;

        for (const lib of libs) {
            for (const content of Object.values(lib.files)) {
                totalSize += new Blob([content]).size;
            }
        }

        return totalSize;
    }
}

// Singleton instance
export const browserLibraryStorage = new BrowserLibraryStorage();
