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

/**
 * Compile server URL resolution — CLOUD ONLY:
 * The compiler is always the cloud server (VITE_COMPILER_URL or Render).
 * There is no localhost fallback; detectCompilerServer() only reports
 * reachability (free-tier Render can be cold on the first request).
 */
export const COMPILER_URL_LOCAL = 'http://localhost:3001';

const getPrimaryUrl = (): string => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_COMPILER_URL) {
    return (import.meta as any).env.VITE_COMPILER_URL as string;
  }
  return 'https://leapblocks-server-6qwr.onrender.com';
};

/** Primary cloud compiler URL. */
export const getPrimaryCompilerUrl = (): string => getPrimaryUrl();

// Compile server binding — always the cloud endpoint.
export const CLOUD_COMPILER_URL: string = getPrimaryUrl();

// Dedicated backend database and sharing API URL
export const BACKEND_API_URL = isLocal ? COMPILER_URL_LOCAL : getPrimaryUrl();

/**
 * Probes the cloud compiler server. Returns true when it is reachable.
 * CLOUD_COMPILER_URL is never changed — the cloud is always the compiler,
 * even during cold starts (a failed probe only means "cold right now").
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

    console.log(`[Platform] Cloud compiler ${res.ok ? 'reachable' : `returned status ${res.status}`} (${primary})`);
    return res.ok;
  } catch {
    console.log(`[Platform] Cloud compiler not reachable yet (cold start?) (${primary})`);
    return false;
  }
};

console.log(`[Platform] CLOUD_COMPILER_URL = ${CLOUD_COMPILER_URL} (cloud only — no localhost fallback)`);

if (typeof window !== 'undefined') {
  detectCompilerServer();
}

/** Runtime check — use this instead of IS_ELECTRON when calling from async contexts */
export const isElectron = (): boolean => {
  try { return !!(window as any).electronAPI?.isElectron; } catch { return false; }
};