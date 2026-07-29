import { useState } from 'react';
import { useForgeStore, getSimulationRunner } from '../../utlis/store/useForgeStore';
import { compileCode } from '../services/CompilerService';

interface UseElectraCompilerParams {
  board: string;
  code: string;
  isSimulating: boolean;
  startSimulation: (hex: string, code: string) => void;
  stopSimulation: () => void;
  clearSerial: () => void;
  setWifiStatus: (status: string) => void;
}

export function useElectraCompiler({
  board,
  code,
  isSimulating,
  startSimulation,
  stopSimulation,
  clearSerial,
  setWifiStatus,
}: UseElectraCompilerParams) {
  const [isCompiling, setIsCompiling] = useState(false);

  const handleToggleSimulation = async () => {
    if (isSimulating) {
      stopSimulation();
      setWifiStatus('');
      return;
    }

    const FQBN: Record<string, string> = {
      'arduino-uno': 'arduino:avr:uno',
      'esp32-c3': 'esp32:esp32:esp32c3',
    };

    setIsCompiling(true);
    clearSerial();

    try {
      if (board === 'esp32-c3') {
        // ── ESP32-C3 Simulation via Transpilation ──────────────────────────────
        try {
          const { transpileCode } = await import('../services/CompilerService');
          const transpileResult = await transpileCode(code, 'esp32:esp32:esp32c3');

          if (transpileResult.success && transpileResult.jsCode) {
            const runner = await getSimulationRunner();
            runner.setBoard(board);
            runner.setTranspiledJS(transpileResult.jsCode);
            startSimulation('__esp32_c3_transpiled__', code);
          } else if (transpileResult.error) {
            const { appendSerial } = useForgeStore.getState();
            appendSerial('❌ ESP32-C3 TRANSPILATION ERROR:\n');
            appendSerial('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            appendSerial(transpileResult.error + '\n');
            appendSerial('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            appendSerial('\nPlease fix the errors and try again.\n');
          }
        } catch (transpileErr: any) {
          const { appendSerial } = useForgeStore.getState();
          appendSerial('❌ ESP32-C3 TRANSPILATION ERROR:\n');
          appendSerial('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
          appendSerial((transpileErr.message || String(transpileErr)) + '\n');
          appendSerial('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
          appendSerial('\nPlease check your code and try again.\n');
        }
      } else {
        const result = await compileCode({
          code,
          board: FQBN[board] ?? 'arduino:avr:uno',
          libraries: useForgeStore.getState().importedLibraries
        });
        if (result.success && result.hexContent) {
          startSimulation(result.hexContent, code);
        } else {
          // Fallback to client-side transpiler so simulation runs in browser even without local CLI or server compiler
          try {
            const { transpileCode } = await import('../services/CompilerService');
            const transpileResult = await transpileCode(code, FQBN[board] ?? 'arduino:avr:uno');
            if (transpileResult.success && transpileResult.jsCode) {
              const runner = await getSimulationRunner();
              runner.setBoard(board);
              runner.setTranspiledJS(transpileResult.jsCode);
              startSimulation('__esp32_c3_transpiled__', code);
            } else if (result.error) {
              const { appendSerial } = useForgeStore.getState();
              appendSerial('❌ COMPILATION ERROR:\n');
              appendSerial('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
              appendSerial((result.error || transpileResult.error) + '\n');
              appendSerial('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
              appendSerial('\nPlease fix the errors and try again.\n');
            }
          } catch {
            if (result.error) {
              const { appendSerial } = useForgeStore.getState();
              appendSerial('❌ COMPILATION ERROR:\n');
              appendSerial('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
              appendSerial(result.error + '\n');
              appendSerial('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
              appendSerial('\nPlease fix the errors and try again.\n');
            }
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      const { appendSerial } = useForgeStore.getState();
      appendSerial('❌ UNEXPECTED ERROR:\n');
      appendSerial('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      appendSerial((err.message || String(err)) + '\n');
      appendSerial('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      appendSerial('\nPlease check your code and try again.\n');
    } finally {
      setIsCompiling(false);
    }
  };

  return {
    isCompiling,
    handleToggleSimulation,
  };
}
