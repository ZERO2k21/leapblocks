/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
/**
 * HX711 Load Cell Amplifier Emulator
 *
 * Emulates the HX711 bit-banging protocol for AVR simulation:
 *   - Arduino drives SCK (clock output)
 *   - HX711 responds on DT (data input to Arduino)
 *   - 24 clock pulses → 24-bit ADC value shifted out MSB first
 *   - 25th pulse sets gain to 128 (channel A), which is the default
 *
 * Protocol timing (matches real HX711 datasheet):
 *   1. DT goes LOW → data is ready
 *   2. Arduino sets SCK HIGH → HX711 presents current bit on DT
 *   3. Arduino reads DT (gets bit value)
 *   4. Arduino sets SCK LOW → HX711 prepares next bit
 *   5. Repeat 24 times for full 24-bit conversion
 *   6. 25th pulse sets gain channel (128 for channel A)
 */

import { useForgeStore } from '../../../utlis/store/useForgeStore';
import { simulationRunner } from './SimulationRunner';

export class HX711Emulator {
  private dtAvrPin: string;
  private nodeId: string;

  private setVirtualInput: (pin: string, high: boolean) => void;

  // Protocol state
  private bitIndex = 0;
  private currentValue = 0;
  private sckWasHigh = false;
  private lastSckCycles = 0;

  constructor(
    sckAvrPin: string,
    dtAvrPin: string,
    nodeId: string,
    setVirtualInput: (pin: string, high: boolean) => void
  ) {
    this.dtAvrPin = dtAvrPin;
    this.nodeId = nodeId;
    this.setVirtualInput = setVirtualInput;

    // Signal data ready: DT = LOW (ready for first read)
    this.setVirtualInput(this.dtAvrPin, false);
    this.lastSckCycles = simulationRunner.getCycles();
  }

  /**
   * Read the current weight from the store slider and convert to a raw 24-bit
   * ADC value that matches what a real HX711 outputs.
   *
   * The HX711 outputs 24-bit two's complement.
   * For simulation, we directly map grams to the raw value so that
   * scale.read() returns a number proportional to the slider weight.
   *
   * Mapping: weight_grams × 1000  (simple linear scale)
   * This means 823g → 823000, which is well within the 24-bit range (max 8,388,607).
   */
  private readWeightFromStore(): number {
    try {
      const { nodes } = useForgeStore.getState();
      const node = nodes.find(n => n.id === this.nodeId);
      const weightGrams = node?.data?.sensorValues?.weight ?? 0;

      // ── Source Code Calibration Factor Parser ──────────────────────────────
      // Attempt to extract custom calibration factor from source code.
      // Default to 1000 if not found.
      let scaleFactor = 1000;
      const sourceCode = simulationRunner.getSourceCode();
      if (sourceCode) {
        // 1. Try to find: scale.set_scale(value); with a literal float/int
        const literalMatch = sourceCode.match(/scale\s*\.\s*set_scale\s*\(\s*(-?\d+(?:\.\d+)?)[fF]?\s*\)/i);
        if (literalMatch) {
          scaleFactor = parseFloat(literalMatch[1]);
        } else {
          // 2. Try to find if scale.set_scale(var_name) is called
          const varMatch = sourceCode.match(/scale\s*\.\s*set_scale\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)/i);
          if (varMatch) {
            const varName = varMatch[1];
            // Look for definition of the variable or macro
            const defineRegex = new RegExp(`#define\\s+${varName}\\s+(-?\\d+(?:\\.\\d+)?)[fF]?`, 'i');
            const assignRegex = new RegExp(`(?:const\\s+)?(?:float|double|int|long)\\s+${varName}\\s*=\\s*(-?\\d+(?:\\.\\d+)?)[fF]?`, 'i');
            const simpleAssignRegex = new RegExp(`${varName}\\s*=\\s*(-?\\d+(?:\\.\\d+)?)[fF]?`, 'i');

            const m1 = sourceCode.match(defineRegex);
            const m2 = sourceCode.match(assignRegex);
            const m3 = sourceCode.match(simpleAssignRegex);

            if (m1) scaleFactor = parseFloat(m1[1]);
            else if (m2) scaleFactor = parseFloat(m2[1]);
            else if (m3) scaleFactor = parseFloat(m3[1]);
          } else {
            // 3. Fallback: Search directly for common variable names if they are defined
            const commonVars = ['calibration_factor', 'calibrationFactor', 'scale_factor', 'scaleFactor'];
            for (const varName of commonVars) {
              const assignRegex = new RegExp(`(?:const\\s+)?(?:float|double|int|long)\\s+${varName}\\s*=\\s*(-?\\d+(?:\\.\\d+)?)[fF]?`, 'i');
              const m = sourceCode.match(assignRegex);
              if (m) {
                scaleFactor = parseFloat(m[1]);
                break;
              }
            }
          }
        }
      }

      // Safeguard: scaleFactor cannot be 0 to prevent divide-by-zero/static readings in sketch
      if (Math.abs(scaleFactor) < 0.0001) {
        scaleFactor = 1000;
      }

      // Map weight using the parsed scale factor.
      // E.g., if calibration_factor is -7050, then raw = weightGrams * -7050.
      // When sketch does (raw - offset) / -7050, it gets exactly weightGrams!
      const raw = Math.round(weightGrams * scaleFactor);
      const clamped = Math.max(-0x800000, Math.min(0x7FFFFF, raw));

      // Clamp to 24-bit signed range (-8388608 to 8388607)
      return clamped;
    } catch (e: any) {
      console.error(`[HX711 Emulator] Error in readWeightFromStore:`, e);
      return 0;
    }
  }

  /**
   * Called on every SCK pin state change from the Arduino.
   * Implements the HX711 serial clock protocol.
   *
   * CRITICAL TIMING: Data bits must be presented on the RISING edge of SCK
   * because the Arduino's shiftIn() reads DT immediately after setting SCK HIGH:
   *   digitalWrite(SCK, HIGH);  ← our listener fires here, we set DT
   *   digitalRead(DT);          ← Arduino reads the bit we just set
   *   digitalWrite(SCK, LOW);
   */
  public processSCK(isHigh: boolean): void {
    const currentCycles = simulationRunner.getCycles();
    const cycleDelta = currentCycles - this.lastSckCycles;
    this.lastSckCycles = currentCycles;

    // Reset bitIndex to 0 on inactivity of > 8000 cycles (0.5ms at 16MHz)
    if (cycleDelta > 8000) {
      this.bitIndex = 0;
      this.setVirtualInput(this.dtAvrPin, false); // Signal data ready (LOW)
    }

    if (isHigh && !this.sckWasHigh) {
      // ── SCK RISING EDGE ──────────────────────────────────
      // This is when the Arduino will read DT, so we must present the bit NOW.

      if (this.bitIndex === 0) {
        // First pulse: latch the current weight value from the slider
        this.currentValue = this.readWeightFromStore();
      }

      if (this.bitIndex < 24) {
        // Shift out MSB first: bit 23 down to bit 0
        const bitPosition = 23 - this.bitIndex;
        const bitValue = (this.currentValue >> bitPosition) & 1;
        this.setVirtualInput(this.dtAvrPin, bitValue === 1);
        this.bitIndex++;
      } else {
        // 25th+ pulse: gain setting pulses (25, 26, or 27)
        // Keep DT LOW so MCU detects ready for the next reading
        this.setVirtualInput(this.dtAvrPin, false);
        this.bitIndex++;
      }
    }

    this.sckWasHigh = isHigh;
  }

  /**
   * Force DT to signal "data ready" (LOW).
   * Called when the sensor is first wired up.
   */
  public signalReady(): void {
    this.setVirtualInput(this.dtAvrPin, false);
  }
}
