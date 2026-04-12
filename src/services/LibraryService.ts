import { IS_ELECTRON, CLOUD_COMPILER_URL } from '../config/platform';

const WEB_LIBS_KEY = 'leapforge_selected_libs';

const safeLocalStorage = {
  getItem: (key: string) => {
    try { return localStorage.getItem(key); } 
    catch { return null; }
  },
  setItem: (key: string, value: string) => {
    try { localStorage.setItem(key, value); } 
    catch { console.warn('Storage blocked by browser'); }
  }
};

export interface Library {
  name: string;
  author: string;
  description: string;
  version: string;
  isInstalled?: boolean;
}

// SEARCH
export const searchLibraries = async (query: string): Promise<Library[]> => {
  if (IS_ELECTRON) {
    const data = await (window as any).electronAPI.searchLibrary(query);
    return data.libraries.map((l: any) => ({
      name: l.name,
      author: l.author,
      description: l.sentence || l.description,
      version: l.version
    }));
  } else {
    const res = await fetch(
      `${CLOUD_COMPILER_URL}/libraries/search?q=${encodeURIComponent(query)}`
    );
    return await res.json();
  }
};

// GET INSTALLED / SELECTED
export const getLibraries = async (): Promise<Library[]> => {
  if (IS_ELECTRON) {
    return await (window as any).electronAPI.getInstalledLibraries();
  } else {
    const stored = safeLocalStorage.getItem(WEB_LIBS_KEY);
    return stored ? JSON.parse(stored) : [];
  }
};

// INSTALL / ADD
export const installLibrary = async (lib: Library): Promise<void> => {
  if (IS_ELECTRON) {
    // Installs to [AppRoot]/forge-lib/libraries/
    await (window as any).electronAPI.installLibrary(lib.name);
  } else {
    // Web: save to localStorage — sent to cloud at compile time
    const current = await getLibraries();
    const already = current.find(l => l.name === lib.name);
    if (!already) {
      safeLocalStorage.setItem(WEB_LIBS_KEY, JSON.stringify([...current, lib]));
    }
  }
};

// REMOVE
export const removeLibrary = async (name: string): Promise<void> => {
  if (IS_ELECTRON) {
    await (window as any).electronAPI.removeLibrary(name);
  } else {
    const current = await getLibraries();
    safeLocalStorage.setItem(
      WEB_LIBS_KEY,
      JSON.stringify(current.filter(l => l.name !== name))
    );
  }
};
