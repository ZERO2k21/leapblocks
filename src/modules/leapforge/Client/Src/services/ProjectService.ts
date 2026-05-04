/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import { IS_ELECTRON, isElectron } from '../../../../../leapembed/server/config/platform';

const PROJECT_PREFIX = 'leapforge_project_';

const safeLocalStorage = {
  getItem: (key: string) => {
    try { return localStorage.getItem(key); }
    catch { return null; }
  },
  setItem: (key: string, value: string) => {
    try { localStorage.setItem(key, value); }
    catch { console.warn('Storage blocked by browser'); }
  },
  length: () => {
    try { return localStorage.length; }
    catch { return 0; }
  },
  key: (index: number) => {
    try { return localStorage.key(index); }
    catch { return null; }
  }
};

export interface LeapProject {
  id: string;
  name: string;
  circuit: any;
  code: string;
  libraries: string[];
  updatedAt: string;
}

// SAVE
export const saveProject = async (project: LeapProject): Promise<void> => {
  if (IS_ELECTRON || isElectron()) {
    await (window as any).electronAPI.invoke('save-project', project);
  } else {
    safeLocalStorage.setItem(
      `${PROJECT_PREFIX}${project.id}`,
      JSON.stringify({ ...project, updatedAt: new Date().toISOString() })
    );
  }
};

// LOAD
export const loadProject = async (id: string): Promise<LeapProject | null> => {
  if (IS_ELECTRON || isElectron()) {
    const result = await (window as any).electronAPI.invoke('open-project');
    return result?.data || null;
  } else {
    const data = safeLocalStorage.getItem(`${PROJECT_PREFIX}${id}`);
    return data ? JSON.parse(data) : null;
  }
};

// LIST ALL
export const listProjects = async (): Promise<LeapProject[]> => {
  if (IS_ELECTRON || isElectron()) {
    return [];
  } else {
    const projects: LeapProject[] = [];
    const len = safeLocalStorage.length();
    for (let i = 0; i < len; i++) {
      const key = safeLocalStorage.key(i);
      if (key?.startsWith(PROJECT_PREFIX)) {
        const data = safeLocalStorage.getItem(key);
        if (data) projects.push(JSON.parse(data));
      }
    }
    return projects.sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }
};
