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
 */
import { IS_ELECTRON, CLOUD_COMPILER_URL } from '../config/platform';

export interface CompileRequest {
  code: string;
  board: string;
  libraries: string[];
}

export interface CompileResult {
  success: boolean;
  hexContent?: string;
  error?: string;
}

export const compileCode = async (req: CompileRequest): Promise<CompileResult> => {
  if (IS_ELECTRON) {
    try {
      // Routes through the unified 'compile-code' IPC handler in main.js
      // which handles both AVR (.hex) and ESP32 (.bin → hex) compilation.
      const result = await (window as any).electronAPI.compileCode(
        req.code,
        req.board,
      );
      return {
        success: result.success,
        hexContent: result.hexContent,
        error: result.error,
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  // Web: POST to local build server
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
      error: Array.isArray(data.errors) ? data.errors.join('\n') : data.errors,
    };
  } catch (err: any) {
    return { success: false, error: `Cloud compiler unreachable: ${err.message}` };
  }
};
