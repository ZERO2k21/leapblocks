/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */

interface CompileOptions {
    code: string;
    board: string;
    libraries?: string[];
}

interface CompileResult {
    success: boolean;
    hexContent?: string;
    binPath?: string;
    error?: string;
}

/**
 * Compile Arduino/ESP32 code using the Electron API
 */
export async function compileCode(options: CompileOptions): Promise<CompileResult> {
    const { code, board, libraries } = options;

    // Get library path if libraries are specified
    let libraryPath: string | undefined;
    if (libraries && libraries.length > 0 && window.electronAPI?.getForgeLibPath) {
        try {
            libraryPath = await window.electronAPI.getForgeLibPath();
        } catch (e) {
            console.warn('[CompilerService] Failed to get library path:', e);
        }
    }

    // Use the Electron API to compile the code
    if (window.electronAPI?.compileCode) {
        try {
            const result = await window.electronAPI.compileCode(code, board, libraryPath);
            return result;
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Compilation failed'
            };
        }
    }

    // Fallback if Electron API is not available
    return {
        success: false,
        error: 'Compiler not available (Electron API not found)'
    };
}
