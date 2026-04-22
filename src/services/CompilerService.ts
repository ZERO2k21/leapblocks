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
import { IS_ELECTRON, isElectron, CLOUD_COMPILER_URL } from '../config/platform';

export interface CompileRequest {
  code: string;
  board: string;
  libraries: string[];
}

export interface CompileResult {
  success: boolean;
  hexContent?: string;
  binPath?: string;   // returned for esp32:esp32:* FQBNs (QEMU path)
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

// ─── ESP32 Transpile: Arduino C++ → JavaScript ──────────────────

export interface TranspileResult {
  success: boolean;
  jsCode?: string;
  error?: string;
}

/**
 * Transpile an Arduino sketch to JavaScript for browser-side simulation.
 * In Electron mode: uses the cloud server's /transpile endpoint.
 * In Web mode: also uses the cloud server's /transpile endpoint.
 * Falls back to client-side transpilation if server is unreachable.
 */
export const transpileCode = async (code: string, board: string = 'esp32:esp32:esp32c3'): Promise<TranspileResult> => {
  try {
    const res = await fetch(`${CLOUD_COMPILER_URL}/transpile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, board }),
    });
    if (!res.ok) {
      // Server error — fall back to client-side transpilation
      console.warn('[Transpiler] Server returned error, falling back to client-side');
      return clientSideTranspile(code);
    }
    const data = await res.json();
    if (data.success && data.jsCode) {
      return { success: true, jsCode: data.jsCode };
    }
    return {
      success: false,
      error: Array.isArray(data.errors) ? data.errors.join('\n') : (data.errors || 'Transpilation failed'),
    };
  } catch (err: any) {
    // Network error — fall back to client-side transpilation
    console.warn('[Transpiler] Server unreachable, falling back to client-side:', err.message);
    return clientSideTranspile(code);
  }
};

/**
 * Client-side Arduino-to-JS transpiler (fallback when server is unreachable).
 * This is a simplified inline version — the full transpiler runs on the server.
 */
function clientSideTranspile(code: string): TranspileResult {
  try {
    let js = code;
    // Remove comments
    js = js.replace(/\/\/.*$/gm, '');
    js = js.replace(/\/\*[\s\S]*?\*\//g, '');
    // Remove #include
    js = js.replace(/^\s*#include\s*[<"].*?[>"]\s*$/gm, '');
    // #define → const
    js = js.replace(/^\s*#define\s+(\w+)\s+(.+)$/gm, (_m, n, v) => `const ${n} = ${v.trim()};`);
    // Type conversions
    js = js.replace(/\b(void|int|long|short|unsigned\s+\w+|uint8_t|uint16_t|uint32_t|int8_t|int16_t|int32_t|size_t|byte|char|float|double|boolean|bool)\s+(\w+)\s*\(([^)]*)\)\s*\{/g,
      (_m, _t, name, params) => {
        const jsParams = params.split(',').map((p: string) => p.trim().split(/\s+/).pop()).filter(Boolean).join(', ');
        const prefix = (name === 'setup' || name === 'loop') ? 'async ' : '';
        const jsName = name === 'setup' ? '__setup' : name === 'loop' ? '__loop' : name;
        return `${prefix}function ${jsName}(${jsParams}) {`;
      });
    // Variable types
    js = js.replace(/\b(int|long|short|unsigned\s+\w+|uint8_t|uint16_t|uint32_t|int8_t|int16_t|int32_t|size_t|byte|char|float|double|boolean|bool)\s+(\w+)\s*=/g,
      (_m, _t, n) => `let ${n} =`);
    js = js.replace(/\b(int|long|short|unsigned\s+\w+|uint8_t|uint16_t|uint32_t|int8_t|int16_t|int32_t|size_t|byte|char|float|double|boolean|bool)\s+(\w+)\s*;/g,
      (_m, _t, n) => `let ${n} = 0;`);
    // for loop types
    js = js.replace(/for\s*\(\s*(int|byte|uint8_t|uint16_t|uint32_t|size_t|long|short)\s+/g, 'for (let ');
    // delay → await __delay
    js = js.replace(/\bdelay\s*\(/g, 'await __delay(');
    js = js.replace(/\bdelayMicroseconds\s*\(/g, 'await __delayMicroseconds(');
    // Arduino utilities
    js = js.replace(/\bmap\s*\(/g, '__arduino_map(');
    js = js.replace(/\bconstrain\s*\(/g, '__arduino_constrain(');
    js = js.replace(/\brandom\s*\(/g, '__arduino_random(');
    js = js.replace(/\babs\s*\(/g, 'Math.abs(');
    js = js.replace(/\bmin\s*\(/g, 'Math.min(');
    js = js.replace(/\bmax\s*\(/g, 'Math.max(');

    const wrapped = `
// Auto-generated by LeapForge Client Transpiler
${js}
if (typeof __setup === 'function') { __exports.setup = __setup; }
if (typeof __loop === 'function') { __exports.loop = __loop; }
`;
    return { success: true, jsCode: wrapped };
  } catch (e: any) {
    return { success: false, error: `Client transpiler error: ${e.message}` };
  }
}

