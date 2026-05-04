/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */

const isElectronEnv = (): boolean => {
  try {
    return !!(window as any).electronAPI?.isElectron;
  } catch {
    return false;
  }
};

// Evaluate lazily so it works even if electronAPI loads after module init
export const IS_ELECTRON = isElectronEnv();
export const IS_WEB = !IS_ELECTRON;

export type PlatformMode = 'electron' | 'web';
export const PLATFORM: PlatformMode = IS_ELECTRON ? 'electron' : 'web';

/**
 * Compiler server base URL.
 * - Dev (npm run dev:full): Vite proxy forwards /compile, /transpile, /libraries
 *   to localhost:3001 automatically — leave this as empty string.
 * - Production: set VITE_COMPILER_URL env var to your deployed server URL,
 *   e.g. https://compiler.leapforge.dev
 */
export const CLOUD_COMPILER_URL: string =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_COMPILER_URL) ?? '';

/** Runtime check — use this instead of IS_ELECTRON when calling from async contexts */
export const isElectron = (): boolean => {
  try { return !!(window as any).electronAPI?.isElectron; } catch { return false; }
};
