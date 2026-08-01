/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
// const isElectronEnv = (): boolean => {
//   try {
//     return !!(window as any).electronAPI?.isElectron;
//   } catch {
//     return false;
//   }
// };

// export const IS_ELECTRON = isElectronEnv();
// export const IS_WEB = !IS_ELECTRON;

// export type PlatformMode = 'electron' | 'web';
// export const PLATFORM: PlatformMode = IS_ELECTRON ? 'electron' : 'web';

// // Cloud compiler endpoint
// //export const CLOUD_COMPILER_URL = 'https://compiler.electra.dev';
// export const CLOUD_COMPILER_URL = 'http://localhost:3001';

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

const isLocal = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '[::1]');

/** True when the app is served from localhost (dev server / Electron). */
export const isLocalHost = (): boolean => isLocal;

/**
 * Compile server URL resolution — CLOUD FIRST:
 * 1. Always prefer the cloud compiler server (VITE_COMPILER_URL or Render).
 * 2. detectCompilerServer() probes it once on startup; if it is not
 *    responding within 3s, CLOUD_COMPILER_URL switches to the local fallback
 *    (http://localhost:3001, started by Electron / run locally).
 * 3. webflash additionally retries each compile request against the other
 *    URL when the chosen one is unreachable (see src/webflash/index.ts).
 */
export const COMPILER_URL_LOCAL = 'http://localhost:3001';

const getPrimaryUrl = (): string => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_COMPILER_URL) {
    return (import.meta as any).env.VITE_COMPILER_URL as string;
  }
  return 'https://leapblocks-server.onrender.com';
};

/** Primary cloud compiler URL. */
export const getPrimaryCompilerUrl = (): string => getPrimaryUrl();

/** Local fallback compiler URL (used when the cloud server is not responding). */
export const getFallbackCompilerUrl = (): string => COMPILER_URL_LOCAL;

// 2. Live binding export so it can be updated dynamically
export let CLOUD_COMPILER_URL: string = getPrimaryUrl();

// Dedicated backend database and sharing API URL
export const BACKEND_API_URL = isLocal ? COMPILER_URL_LOCAL : getPrimaryUrl();

/**
 * Probes the cloud compiler server and updates CLOUD_COMPILER_URL.
 * Returns true when the cloud is reachable. NOTE: free-tier Render spins down
 * after idle time and takes ~1 min to wake — a failed probe here only means
 * "cold right now", so hosted builds re-probe before every compile.
 */
export const detectCompilerServer = async (): Promise<boolean> => {
  const primary = getPrimaryUrl();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout (Render cold starts)

    const res = await fetch(`${primary}/health`, {
      signal: controller.signal,
      mode: 'cors'
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      CLOUD_COMPILER_URL = primary;
      console.log(`[Platform] Cloud compiler server detected (${primary}). Using cloud.`);
      return true;
    }
    CLOUD_COMPILER_URL = COMPILER_URL_LOCAL;
    console.log(`[Platform] Cloud server returned error status (${res.status}). Using local fallback: ${COMPILER_URL_LOCAL}`);
  } catch {
    CLOUD_COMPILER_URL = COMPILER_URL_LOCAL;
    console.log(`[Platform] Cloud compiler server not reachable (cold start?). Using local fallback: ${COMPILER_URL_LOCAL}`);
  }
  return false;
};

console.log(`[Platform] CLOUD_COMPILER_URL = ${CLOUD_COMPILER_URL} (cloud first, fallback: ${COMPILER_URL_LOCAL})`);

if (typeof window !== 'undefined') {
  detectCompilerServer();
}

/** Runtime check — use this instead of IS_ELECTRON when calling from async contexts */
export const isElectron = (): boolean => {
  try { return !!(window as any).electronAPI?.isElectron; } catch { return false; }
};