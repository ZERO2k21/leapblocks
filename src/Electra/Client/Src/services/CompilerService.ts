/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 *
 * Compile flow (Electron):
 *   electronAPI.compileCode(code, fqbn)
 *     → IPC: compile-code
 *     → ArduinoUploader.compileForSimulation()
 *     → arduino-cli compile --libraries forge-lib/libraries/ ...
 *     → returns { success, hexContent }
 *
 * Compile flow (Web):
 *   POST /compile to compiler-server
 *     → arduino-cli compile
 *     → returns { success, binBase64 } for ESP32 (RISC-V firmware)
 *     → returns { success, hex } for AVR
 */
import { IS_ELECTRON, isElectron, CLOUD_COMPILER_URL } from '../../../../config/platform';

export interface CompileRequest {
  code: string;
  board: string;
  libraries: string[];
}

export interface CompileResult {
  success: boolean;
  hexContent?: string;
  binPath?: string;   // returned for esp32:esp32:* FQBNs in Electron (custom RISC-V emulator path)
  binBase64?: string; // returned for esp32 in Web mode (base64-encoded merged flash image)
  error?: string;
}

export const compileCode = async (req: CompileRequest): Promise<CompileResult> => {
  // Use runtime check — IS_ELECTRON may be stale if preload loaded after module init
  if (IS_ELECTRON || isElectron()) {
    try {
      const result = await (window as any).electronAPI.compileCode(
        req.code,
        req.board,
        req.libraries?.join(',') || undefined,
      );
      return {
        success: result.success,
        hexContent: result.hexContent,
        binPath: result.binPath,
        error: result.error,
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  // Web: POST to compiler-server
  try {
    const res = await fetch(`${CLOUD_COMPILER_URL}/compile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!res.ok) return { success: false, error: `Server error: ${res.status}` };
    const data = await res.json();
    return {
      success: data.success,
      hexContent: data.hex,
      binBase64: data.binBase64,   // ESP32: base64-encoded merged flash image for RISC-V emulator
      error: Array.isArray(data.errors) ? data.errors.join('\n') : data.errors,
    };
  } catch (err: any) {
    return { success: false, error: `Cloud compiler unreachable: ${err.message}` };
  }
};
