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
// //export const CLOUD_COMPILER_URL = 'https://compiler.leapforge.dev';
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
export const CLOUD_COMPILER_URL = 'http://localhost:3001';

/** Runtime check — use this instead of IS_ELECTRON when calling from async contexts */
export const isElectron = (): boolean => {
  try { return !!(window as any).electronAPI?.isElectron; } catch { return false; }
};