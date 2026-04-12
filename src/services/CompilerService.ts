import { IS_ELECTRON, CLOUD_COMPILER_URL } from '../config/platform';

export interface CompileRequest {
  code: string;
  board: string;
  libraries: string[];
}

export interface CompileResult {
  success: boolean;
  hexContent?: string;  // ✅ hex → hexContent ஆக மாற்றுங்கள்
  error?: string;       // ✅ errors[] → error string ஆக மாற்றுங்கள்
}

export const compileCode = async (req: CompileRequest): Promise<CompileResult> => {
  if (IS_ELECTRON) {
    // Electron: use local arduino-cli via IPC
    // Bridge expects: (code, fqbn, libraryPath)
    return await (window as any).electronAPI.compileCode(req.code, req.board);
  } else {
    try {
      console.log('[CompilerService] Calling:', CLOUD_COMPILER_URL);

      const res = await fetch(`${CLOUD_COMPILER_URL}/compile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });

      if (!res.ok) {
        return {
          success: false,
          error: `Server error: ${res.status}`
        };
      }

      const data = await res.json();
      console.log('[CompilerService] Response:', data);

      return {
        success: data.success,
        hexContent: data.hex,        // ✅ server hex → hexContent map
        error: Array.isArray(data.errors) 
          ? data.errors.join('\n')   // ✅ errors[] → single string
          : data.errors
      };

    } catch (err: any) {
      console.error('[CompilerService] Fetch error:', err.message);
      return {
        success: false,
        error: `Cloud compiler unreachable: ${err.message}`
      };
    }
  }
};