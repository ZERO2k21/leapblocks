import { useState } from 'react';
import { useForgeStore, getSimulationRunner } from '../../utils/store/useForgeStore';
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
          // Compilation failed — surface the error immediately. Do NOT fall back to
          // ESP32 transpiled JS while board is still `arduino-uno`; that sentinel
          // ('__esp32_c3_transpiled__') + AVR board causes SimulationRunner to
          // init an empty AVR CPU (empty hex) and leaves isSimulating=true with
          // no serial output — appears as infinite spinner (reported PIR+Servo bug).
          // Transpiled JS is only valid for `esp32-c3` (ArduinoRuntime).
          const { appendSerial } = useForgeStore.getState();
          // Surface cloud/server error
          if (result.error) {
            appendSerial('❌ COMPILATION ERROR:\n');
            appendSerial('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            appendSerial(result.error + '\n');
            appendSerial('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            if (result.error.includes('unreachable') || result.error.includes('Server error') || result.error.includes('cold')) {
              appendSerial('\nTip: Cloud compiler (Render) may be cold-starting. Wait 20-30s and try again, or check your network.\n');
            } else {
              appendSerial('\nPlease fix the errors and try again.\n');
            }
          } else {
            appendSerial('❌ COMPILATION ERROR:\n');
            appendSerial('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            appendSerial('Unknown compiler error. Please check your code.\n');
            appendSerial('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
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
