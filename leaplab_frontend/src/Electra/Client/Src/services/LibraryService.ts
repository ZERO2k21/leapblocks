/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 *
 * Library flow (Electron):
 *   Search  → Arduino Library Index JSON (in-memory, no backend)
 *   Install → electronAPI.installLibrary(name)
 *               → IPC: install-library
 *               → ArduinoUploader.installLibrary()
 *               → pio pkg install --library <name> --storage-dir forge-lib/libraries/
 *   List    → electronAPI.getInstalledLibraries()
 *               → IPC: get-installed-libraries
 *               → ArduinoUploader.getInstalledLibraries()
 *   Remove  → electronAPI.removeLibrary(name)
 *               → IPC: remove-library
 *               → ArduinoUploader.uninstallLibrary()
 */

import { IS_ELECTRON, isElectron } from '../../../../config/platform';
import { CLOUD_COMPILER_URL } from '../../../../config/platform';
import { browserLibraryStorage } from './BrowserLibraryStorage';

const WEB_LIBS_KEY = 'electra_selected_libs';
const LIBRARY_INDEX_URL = 'https://downloads.arduino.cc/libraries/library_index.json';

export interface Library {
  name: string;
  author: string;
  description: string;
  version: string;
  url?: string;
  isInstalled?: boolean;
}

// ── In-memory index cache ────────────────────────────────────────────────────
let _indexCache: Library[] | null = null;
let _indexLoading: Promise<Library[]> | null = null;

async function loadIndex(): Promise<Library[]> {
  if (_indexCache) return _indexCache;
  if (_indexLoading) return _indexLoading;

  _indexLoading = (async () => {
    try {
      const res = await fetch(LIBRARY_INDEX_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      const latestMap = new Map<string, Library>();
      for (const entry of json.libraries ?? []) {
        const existing = latestMap.get(entry.name);
        if (!existing || compareVersions(entry.version, existing.version) > 0) {
          latestMap.set(entry.name, {
            name: entry.name,
            author: entry.author ?? entry.maintainer ?? '',
            description: entry.sentence ?? entry.paragraph ?? '',
            version: entry.version ?? '0.0.0',
            url: entry.url,
          });
        }
      }
      _indexCache = Array.from(latestMap.values());
      return _indexCache;
    } catch (err) {
      console.error('[LibraryService] Failed to load index:', err);
      _indexCache = [];
      return [];
    } finally {
      _indexLoading = null;
    }
  })();

  return _indexLoading;
}

function compareVersions(a: string, b: string): number {
  const pa = (a ?? '0').split('.').map(Number);
  const pb = (b ?? '0').split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

const safeLS = {
  get: (key: string) => { try { return localStorage.getItem(key); } catch { return null; } },
  set: (key: string, val: string) => { try { localStorage.setItem(key, val); } catch { /**/ } },
};

// ── Public API ───────────────────────────────────────────────────────────────

export const searchLibraries = async (query: string): Promise<Library[]> => {
  const all = await loadIndex();
  if (!query.trim()) return all;
  const q = query.toLowerCase();
  return all.filter(
    l =>
      l.name.toLowerCase().includes(q) ||
      l.author.toLowerCase().includes(q) ||
      l.description.toLowerCase().includes(q),
  );
};

export const getLibraries = async (): Promise<Library[]> => {
  // Use runtime check — IS_ELECTRON may be stale if preload loaded after module init
  if (IS_ELECTRON || isElectron()) {
    try {
      const libs = await (window as any).electronAPI.getInstalledLibraries();
      return (libs ?? []).map((l: any) => ({
        name: l.name ?? l.Name ?? '',
        author: l.author ?? l.Author ?? '',
        description: l.sentence ?? l.description ?? '',
        version: l.version ?? l.Version ?? '?',
        url: l.url,
      }));
    } catch (err) {
      console.warn('[LibraryService] getInstalledLibraries failed:', err);
      return [];
    }
  }

  // Web: Use browser storage (IndexedDB) + Sync with local server
  try {
    console.log('[LibraryService] Getting libraries from browser storage...');
    const storedLibs = await browserLibraryStorage.getInstalledLibraries();

    // Optional: Fetch from server to ensure sync
    try {
      const res = await fetch(`${CLOUD_COMPILER_URL}/libraries/installed`);
      if (res.ok) {
        const serverLibs = await res.json();
        // Merge or prioritize server libs? For now, we'll just trust browser storage
        // but this confirms server communication is working.
        console.log(`[LibraryService] Server has ${serverLibs.length} libraries installed.`);
      }
    } catch (e) {
      console.warn('[LibraryService] Could not reach compiler server for library sync.');
    }

    return storedLibs.map(l => ({
      name: l.name,
      author: l.author,
      description: l.description,
      version: l.version,
      url: (l as any).url,
    }));
  } catch (err) {
    console.warn('[LibraryService] Browser storage failed:', err);
    return [];
  }
};

export const installLibrary = async (lib: Library): Promise<{ success: boolean; error?: string }> => {
  if (IS_ELECTRON || isElectron()) {
    const result = await (window as any).electronAPI.installLibrary(lib.name);
    return result ?? { success: false, error: 'No response from installer' };
  }

  // Web: Use browser storage (IndexedDB) + Sync with local server
  try {
    console.log('[LibraryService] Installing library to browser storage:', lib.name);
    const result = await browserLibraryStorage.installLibrary(lib);

    if (result.success) {
      // Also trigger install on the compiler server so pio has it
      console.log('[LibraryService] Syncing installation with compiler server...');
      try {
        await fetch(`${CLOUD_COMPILER_URL}/libraries/install`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: lib.name }),
        });
      } catch (e) {
        console.warn('[LibraryService] Failed to sync install with server (it may be offline):', e);
      }
    }

    return result;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

export const removeLibrary = async (name: string): Promise<{ success: boolean; error?: string }> => {
  if (IS_ELECTRON || isElectron()) {
    try {
      const result = await (window as any).electronAPI.removeLibrary(name);
      return result ?? { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  // Web: Use browser storage (IndexedDB) + Sync with local server
  try {
    console.log('[LibraryService] Removing library from browser storage:', name);
    const result = await browserLibraryStorage.uninstallLibrary(name);

    if (result.success) {
      // Also trigger remove on the compiler server
      console.log('[LibraryService] Syncing removal with compiler server...');
      try {
        await fetch(`${CLOUD_COMPILER_URL}/libraries/remove`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        });
      } catch (e) {
        console.warn('[LibraryService] Failed to sync removal with server:', e);
      }
    }

    return result;
  } catch (err: any) {
    console.warn('[LibraryService] Browser storage removal failed:', err);
    return { success: false, error: err.message };
  }
};
