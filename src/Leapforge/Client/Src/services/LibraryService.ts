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
 *               → arduino-cli lib install → forge-lib/libraries/
 *   List    → electronAPI.getInstalledLibraries()
 *               → IPC: get-installed-libraries
 *               → ArduinoUploader.getInstalledLibraries()
 *   Remove  → electronAPI.removeLibrary(name)
 *               → IPC: remove-library
 *               → ArduinoUploader.uninstallLibrary()
 */

import { IS_ELECTRON, isElectron } from '../../../../config/platform';
import { CLOUD_COMPILER_URL } from '../../../../config/platform';
const WEB_LIBS_KEY = 'leapforge_selected_libs';
const LIBRARY_INDEX_URL = 'https://downloads.arduino.cc/libraries/library_index.json';

export interface Library {
  name: string;
  author: string;
  description: string;
  version: string;
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
      }));
    } catch (err) {
      console.warn('[LibraryService] getInstalledLibraries failed:', err);
      return [];
    }
  }
  // Web: ask the local compile server — silently return [] if server not running
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${CLOUD_COMPILER_URL}/libraries/installed`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: any) {
    if (err?.name !== 'AbortError') {
      console.warn('[LibraryService] /libraries/installed unavailable (server not running)');
    }
    return [];
  }
};

export const installLibrary = async (lib: Library): Promise<{ success: boolean; error?: string }> => {
  if (IS_ELECTRON || isElectron()) {
    const result = await (window as any).electronAPI.installLibrary(lib.name);
    return result ?? { success: false, error: 'No response from installer' };
  }
  try {
    const res = await fetch(`${CLOUD_COMPILER_URL}/libraries/install`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: lib.name }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

export const removeLibrary = async (name: string): Promise<void> => {
  if (IS_ELECTRON || isElectron()) {
    await (window as any).electronAPI.removeLibrary(name);
    return;
  }
  try {
    await fetch(`${CLOUD_COMPILER_URL}/libraries/remove`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
  } catch (err) {
    console.warn('[LibraryService] /libraries/remove failed:', err);
  }
};
