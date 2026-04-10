/**
 * CompilerService.ts
 * Bridges the Forge Editor (C++) with the Arduino-CLI compiler via Electron IPC.
 * Parses Intel HEX output into Uint16Array for the AVR8js simulator.
 */

export interface CompileResult {
  success: boolean;
  hex?: string;
  program?: Uint16Array;
  error?: string;
}

export class CompilerService {
  /**
   * Compiles C++ Arduino code to HEX using the native build server.
   */
  static async compile(code: string): Promise<CompileResult> {
    try {
      const api = (window as any).electronAPI;
      if (!api) {
        throw new Error('Electron API not found. Compilation requires the desktop app.');
      }

      const result = await api.compileArduino(code);
      if (!result.success) {
        return { success: false, error: result.error };
      }

      // Convert HEX string to Uint16Array for AVR8js
      const program = this.parseHex(result.hex);
      return { success: true, program, hex: result.hex };
    } catch (err: any) {
      return { success: false, error: err.message || 'Internal Compiler Error' };
    }
  }

  /**
   * Basic Intel HEX Parser
   * Transforms string content into a Uint16Array (Flash Memory representation)
   */
  private static parseHex(hex: string): Uint16Array {
    const lines = hex.split('\n');
    const FLASH_SIZE = 32768; // 32KB for ATmega328P
    const data = new Uint8Array(FLASH_SIZE);
    
    for (const line of lines) {
      if (line.startsWith(':')) {
        const len = parseInt(line.substr(1, 2), 16);
        const addr = parseInt(line.substr(3, 4), 16);
        const type = parseInt(line.substr(7, 2), 16);
        
        if (type === 0) { // Data record
          for (let i = 0; i < len; i++) {
            data[addr + i] = parseInt(line.substr(9 + i * 2, 2), 16);
          }
        }
      }
    }

    // Convert to Uint16Array (AVR instructions are 2 bytes)
    const program = new Uint16Array(FLASH_SIZE / 2);
    for (let i = 0; i < program.length; i++) {
        program[i] = data[i * 2] | (data[i * 2 + 1] << 8);
    }
    
    return program;
  }
}
