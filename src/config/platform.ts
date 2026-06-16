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

/**
 * Compile server URL.
 * - Local / Electron:  http://localhost:3001  (compiler-server started by Electron)
 * - Online (deployed): Uses the current origin if not localhost, or VITE_COMPILER_URL if set.
 *
 * To deploy: see leapblocks/compiler-server/README.md
 */
const isLocal = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '[::1]');

const getFallbackUrl = (): string => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_COMPILER_URL) {
    return (import.meta as any).env.VITE_COMPILER_URL as string;
  }
  return 'https://leapblocks-server.onrender.com';
};

// 2. Live binding export so it can be updated dynamically
export let CLOUD_COMPILER_URL: string = (() => {
  if (isLocal) {
    return 'http://localhost:3001';
  }
  return getFallbackUrl();
})();

// Dedicated backend database and sharing API URL
export const BACKEND_API_URL = isLocal ? 'http://localhost:3001' : getFallbackUrl();

const detectCompilerServer = async () => {
  if (!isLocal) {
    return;
  }

  const fallback = getFallbackUrl();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200); // 1.2s timeout

    const res = await fetch('http://localhost:3001/health', {
      signal: controller.signal,
      mode: 'cors'
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      CLOUD_COMPILER_URL = fallback;
      console.log(`[Platform] Local server returned error status. Switching to fallback: ${fallback}`);
    } else {
      CLOUD_COMPILER_URL = 'http://localhost:3001';
      console.log('[Platform] Local compiler server detected on port 3001. Using localhost.');
    }
  } catch {
    CLOUD_COMPILER_URL = fallback;
    console.log(`[Platform] Local compiler server not reachable. Switching to fallback: ${fallback}`);
  }
};

console.log(`[Platform] CLOUD_COMPILER_URL = ${CLOUD_COMPILER_URL}`);

if (typeof window !== 'undefined') {
  detectCompilerServer();
}

/** Runtime check — use this instead of IS_ELECTRON when calling from async contexts */
export const isElectron = (): boolean => {
  try { return !!(window as any).electronAPI?.isElectron; } catch { return false; }
};