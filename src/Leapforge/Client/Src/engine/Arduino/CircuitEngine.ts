/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import { useForgeStore } from '../../../utlis/store/useForgeStore';
import { simulationRunner, PinState } from './SimulationRunner';
import { HD44780 } from './HD44780';
import { I2CBusManager } from './I2CBusManager';
import { PCF8574 } from './PCF8574';
import { DHT } from './DHT';
import { NeoPixelEmulator } from './NeoPixelEmulator';
import { StepperEmulator, SteppingMode } from './StepperEmulator';
import { SSD1306I2CSlave } from './SSD1306I2CSlave';
import { ILI9341SPISlave } from './ILI9341SPISlave';
import { MPU6050I2CSlave } from './MPU6050I2CSlave';
import { DS1307Emulator } from './DS1307Emulator';
import { KeypadEmulator } from './KeypadEmulator';
import { RotaryDialerEmulator } from './RotaryDialerEmulator';
import { TiltSwitchEmulator } from './TiltSwitchEmulator';
import { RotaryEncoderEmulator } from './RotaryEncoderEmulator';
import { ESP32_BOARD_CONFIG, ESP32_BOARDS, type ESP32PinInfo } from './ESP32BoardConfig.js';

/** Simplified ECG pulse shape used by the heart-beat sensor emulator. Returns -1..+1 for phase 0..1 */
function heartEcgPulse(phase: number): number {
  if (phase < 0.15) return 0.3 * Math.sin(Math.PI * phase / 0.15);
  if (phase < 0.25) return 0;
  if (phase < 0.28) return -0.3 * (phase - 0.25) / 0.03;
  if (phase < 0.32) return 1.0 * (phase - 0.28) / 0.04;
  if (phase < 0.36) return 1.0 - 1.3 * (phase - 0.32) / 0.04;
  if (phase < 0.40) return -0.3 + 0.3 * (phase - 0.36) / 0.04;
  if (phase < 0.55) return 0;
  if (phase < 0.75) return 0.4 * Math.sin(Math.PI * (phase - 0.55) / 0.20);
  return 0;
}

/**
 * Real PulseSensor.com ADC output model.
 * Returns a raw ADC value (0–1023) that matches what analogRead() sees:
 *   - Baseline between beats: ~512 (mid-supply, 2.5V)
 *   - Slow breathing oscillation: ±50 ADC
 *   - Beat peak (QRS): spikes to ~750–900
 *   - Post-beat dip: drops to ~350–450
 *   - Noise: ±10 ADC
 */
function pulseSensorADC(phase: number): number {
  // Slow baseline drift from breathing (~0.2 Hz, much slower than heartbeat)
  const breathingDrift = 40 * Math.sin(2 * Math.PI * phase * 0.15);

  // Beat waveform — sharp systolic peak followed by diastolic notch
  let beat = 0;
  if (phase < 0.05) {
    // Rising edge of QRS
    beat = 380 * (phase / 0.05);
  } else if (phase < 0.10) {
    // Peak and falling edge
    beat = 380 * (1 - (phase - 0.05) / 0.05);
  } else if (phase < 0.18) {
    // Diastolic notch (dip below baseline)
    beat = -80 * Math.sin(Math.PI * (phase - 0.10) / 0.08);
  } else if (phase < 0.35) {
    // T-wave: gentle positive bump
    beat = 60 * Math.sin(Math.PI * (phase - 0.18) / 0.17);
  }
  // else: diastole — flat at baseline

  // Small random noise (deterministic pseudo-noise based on phase)
  const noise = 8 * Math.sin(phase * 137.5) + 5 * Math.sin(phase * 251.3);

  return Math.round(512 + breathingDrift + beat + noise);
}

/**
 * CircuitEngine
 * Bridges the abstract ReactFlow graph (nodes/edges) with the low-level AVR SimulationRunner.
 * Handles signal propagation across wires.
 */
class CircuitEngine {
  private activeSubscriptions = new Map<string, () => void>();
  private lcdEmulators = new Map<string, HD44780>();
  private peripheralPinBuffers = new Map<string, Record<string, boolean>>();
  private i2cBusManager = new I2CBusManager();
  private dhtEmulators = new Map<string, DHT>();
  private neoPixelEmulators = new Map<string, NeoPixelEmulator>();
  private stepperEmulators = new Map<string, StepperEmulator>();
  private ili9341Slaves = new Map<string, ILI9341SPISlave>();
  private mpu6050Slaves = new Map<string, MPU6050I2CSlave>();
  private ssd1306Slaves = new Map<string, SSD1306I2CSlave>();
  private keypadEmulators = new Map<string, KeypadEmulator>();
  private rotaryDialerEmulators = new Map<string, RotaryDialerEmulator>();
  private tiltSwitchEmulators = new Map<string, TiltSwitchEmulator>();
  private rotaryEncoderEmulators = new Map<string, RotaryEncoderEmulator>();
  private _pendingLibraryClasses = new Map<string, any>();
  private heartBeatTimers = new Map<string, number>(); // nodeId → requestAnimationFrame id
  private isInitialized = false;
  private a4988DebugLogged = false; // Debug flag for A4988 diagnostics
  private a4988MotorCache = new Map<string, { motorId: string | null; edges: any[] }>(); // A4988 nodeId → motor connection cache

  /**
   * Traces an electrical net from a starting point (board pin) and returns all 
   * reachable endpoints (LEDs, Buzzers, etc.) along with the total resistance in the path.
   */
  private traceNet(startNodeId: string, startPin: string): { nodeId: string, pinName: string, resistance: number, type: string }[] {
    const { nodes, edges } = useForgeStore.getState();
    const targets: { nodeId: string, pinName: string, resistance: number, type: string }[] = [];
    const queue = [{ id: startNodeId, pin: startPin, resistance: 0 }];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      const key = `${current.id}-${current.pin}`;
      if (visited.has(key)) continue;
      visited.add(key);

      const node = nodes.find(n => n.id === current.id);
      if (!node) continue;

      const nodeType = node.data?.type;

      if (['led', 'buzzer', 'rgb-led', 'neopixel', 'neopixel-matrix', 'led-ring'].includes(nodeType)) {
        targets.push({ nodeId: current.id, pinName: current.pin, resistance: current.resistance, type: nodeType });
      } else if (nodeType === 'ks2e-m-dc5') {
        // Relay contact traversal: signal enters on a pole pin (P1/P2) and exits via the active contact
        const relayNode = nodes.find(n => n.id === current.id);
        const energized = relayNode?.data?.relayEnergized ?? false;

        // Map pole → active contact based on relay state
        const contactMap: Record<string, string> = energized
          ? { 'P1': 'NO1', 'P2': 'NO2' }
          : { 'P1': 'NC1', 'P2': 'NC2' };

        const exitPin = contactMap[current.pin];
        if (exitPin) {
          const downstreamEdges = edges.filter(e =>
            (e.source === current.id && e.sourceHandle === exitPin) ||
            (e.target === current.id && e.targetHandle === exitPin)
          );
          for (const edge of downstreamEdges) {
            const nextId = edge.source === current.id ? edge.target : edge.source;
            const nextPin = (edge.source === current.id ? edge.targetHandle : edge.sourceHandle) || '';
            queue.push({ id: nextId, pin: nextPin, resistance: current.resistance });
          }
        }
      } else if (nodeType === 'resistor') {
        const rValue = Number(node.data?.sensorValues?.value ?? 0);
        console.log(`[FORGE CIRCUIT] Net trace through resistor (${current.id}): +${rValue} ohms`);

        // Find the other pin of the resistor
        let exitPin = '';
        if (current.pin === '1' || current.pin === 'pin_1' || current.pin === 'IN') {
          exitPin = node.data?.pinOUT ? 'OUT' : '2';
        } else {
          exitPin = node.data?.pinIN ? 'IN' : '1';
        }

        // Robust fallback: if we don't know the pins, check if they are 'IN'/'OUT'
        if (current.pin === 'IN') exitPin = 'OUT';
        else if (current.pin === 'OUT') exitPin = 'IN';
        else if (current.pin === '1' || current.pin === 'pin_1') exitPin = '2';
        else if (current.pin === '2' || current.pin === 'pin_2') exitPin = '1';

        const downstreamEdges = edges.filter(e =>
          (e.source === current.id && e.sourceHandle === exitPin) ||
          (e.target === current.id && e.targetHandle === exitPin)
        );

        for (const edge of downstreamEdges) {
          const nextId = edge.source === current.id ? edge.target : edge.source;
          const nextPin = (edge.source === current.id ? edge.targetHandle : edge.sourceHandle) || '';
          queue.push({ id: nextId, pin: nextPin, resistance: current.resistance + rValue });
        }
      }
    }
    return targets;
  }

  constructor() { }

  /**
   * Resolve an Arduino-label pin (e.g. "21", "32") to its ESP32PinInfo using
   * ESP32_BOARD_CONFIG.  Throws if the label is not in the GPIO map.
   * Used by syncCircuitGraph to wire ESP32-C3 RISC-V GPIO/ADC listeners.
   */
  public convertESP32Pin(label: string): ESP32PinInfo {
    const gpioNum = ESP32_BOARD_CONFIG.gpio[label];
    if (gpioNum === undefined) {
      throw new Error(`[CircuitEngine] Unknown ESP32-C3 pin label: "${label}"`);
    }
    const adcChannel = ESP32_BOARD_CONFIG.adc[label];
    const i2c = ESP32_BOARD_CONFIG.i2c;
    return {
      gpioNum,
      adcChannel,
      isI2CSDA: gpioNum === i2c.sda,
      isI2CSCL: gpioNum === i2c.scl,
    };
  }

  public init() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    console.log('[FORGE CIRCUIT] Engine connected (Version: Ideal Mode - Indestructible)');

    // Listen to changes in the visual circuit board
    let previousEdgesCount = -1;
    let previousIsSimulating = false;
    useForgeStore.subscribe((state) => {
      // Re-sync only when edges change while already simulating (not on the start transition)
      const edgesChanged = state.edges.length !== previousEdgesCount;
      const wasAlreadySimulating = previousIsSimulating && state.isSimulating;

      // Handle simulation stop to clean up emulators
      if (previousIsSimulating && !state.isSimulating) {
        this.cleanup();
      }

      previousEdgesCount = state.edges.length;
      previousIsSimulating = state.isSimulating;
      if (edgesChanged && wasAlreadySimulating) {
        this.syncCircuitGraph();
      }
    });
  }

  /**
   * Re-applies the I2C bus bridge to ArduinoRuntime after initTranspiled() creates it.
   * Called by SimulationRunner.start() on the transpiled path.
   */
  public syncI2CBridge() {
    const esp32Runtime = simulationRunner.ESP32C3Runner?.runtime;
    console.log(`[OLED BRIDGE] syncI2CBridge() called. Runtime exists: ${!!esp32Runtime}, ssd1306Slaves: ${this.ssd1306Slaves.size}`);

    // ── Always register the Adafruit_SSD1306 class for injection ─────────────
    // This is stored on CircuitEngine and pulled by initTranspiled() before
    // loadTranspiledCode() runs, so the class is available as a parameter.
    const ssd1306Slaves = this.ssd1306Slaves;

    const RealAdafruitSSD1306 = class {
      private _w: number;
      private _h: number;
      private _addr: number;
      private _slave: SSD1306I2CSlave | null = null;
      private _buf: Uint8Array;
      private _cursor_x = 0;
      private _cursor_y = 0;
      private _textsize = 1;
      private _textcolor = 1;
      private _displayOn = false;

      private static readonly FONT5X7: number[][] = [
        [0x00, 0x00, 0x00, 0x00, 0x00], [0x00, 0x00, 0x5F, 0x00, 0x00], [0x00, 0x07, 0x00, 0x07, 0x00], [0x14, 0x7F, 0x14, 0x7F, 0x14],
        [0x24, 0x2A, 0x7F, 0x2A, 0x12], [0x23, 0x13, 0x08, 0x64, 0x62], [0x36, 0x49, 0x55, 0x22, 0x50], [0x00, 0x05, 0x03, 0x00, 0x00],
        [0x00, 0x1C, 0x22, 0x41, 0x00], [0x00, 0x41, 0x22, 0x1C, 0x00], [0x14, 0x08, 0x3E, 0x08, 0x14], [0x08, 0x08, 0x3E, 0x08, 0x08],
        [0x00, 0x50, 0x30, 0x00, 0x00], [0x08, 0x08, 0x08, 0x08, 0x08], [0x00, 0x60, 0x60, 0x00, 0x00], [0x20, 0x10, 0x08, 0x04, 0x02],
        [0x3E, 0x51, 0x49, 0x45, 0x3E], [0x00, 0x42, 0x7F, 0x40, 0x00], [0x42, 0x61, 0x51, 0x49, 0x46], [0x21, 0x41, 0x45, 0x4B, 0x31],
        [0x18, 0x14, 0x12, 0x7F, 0x10], [0x27, 0x45, 0x45, 0x45, 0x39], [0x3C, 0x4A, 0x49, 0x49, 0x30], [0x01, 0x71, 0x09, 0x05, 0x03],
        [0x36, 0x49, 0x49, 0x49, 0x36], [0x06, 0x49, 0x49, 0x29, 0x1E], [0x00, 0x36, 0x36, 0x00, 0x00], [0x00, 0x56, 0x36, 0x00, 0x00],
        [0x08, 0x14, 0x22, 0x41, 0x00], [0x14, 0x14, 0x14, 0x14, 0x14], [0x00, 0x41, 0x22, 0x14, 0x08], [0x02, 0x01, 0x51, 0x09, 0x06],
        [0x32, 0x49, 0x79, 0x41, 0x3E], [0x7E, 0x11, 0x11, 0x11, 0x7E], [0x7F, 0x49, 0x49, 0x49, 0x36], [0x3E, 0x41, 0x41, 0x41, 0x22],
        [0x7F, 0x41, 0x41, 0x22, 0x1C], [0x7F, 0x49, 0x49, 0x49, 0x41], [0x7F, 0x09, 0x09, 0x09, 0x01], [0x3E, 0x41, 0x49, 0x49, 0x7A],
        [0x7F, 0x08, 0x08, 0x08, 0x7F], [0x00, 0x41, 0x7F, 0x41, 0x00], [0x20, 0x40, 0x41, 0x3F, 0x01], [0x7F, 0x08, 0x14, 0x22, 0x41],
        [0x7F, 0x40, 0x40, 0x40, 0x40], [0x7F, 0x02, 0x0C, 0x02, 0x7F], [0x7F, 0x04, 0x08, 0x10, 0x7F], [0x3E, 0x41, 0x41, 0x41, 0x3E],
        [0x7F, 0x09, 0x09, 0x09, 0x06], [0x3E, 0x41, 0x51, 0x21, 0x5E], [0x7F, 0x09, 0x19, 0x29, 0x46], [0x46, 0x49, 0x49, 0x49, 0x31],
        [0x01, 0x01, 0x7F, 0x01, 0x01], [0x3F, 0x40, 0x40, 0x40, 0x3F], [0x1F, 0x20, 0x40, 0x20, 0x1F], [0x3F, 0x40, 0x38, 0x40, 0x3F],
        [0x63, 0x14, 0x08, 0x14, 0x63], [0x07, 0x08, 0x70, 0x08, 0x07], [0x61, 0x51, 0x49, 0x45, 0x43], [0x00, 0x7F, 0x41, 0x41, 0x00],
        [0x02, 0x04, 0x08, 0x10, 0x20], [0x00, 0x41, 0x41, 0x7F, 0x00], [0x04, 0x02, 0x01, 0x02, 0x04], [0x40, 0x40, 0x40, 0x40, 0x40],
        [0x00, 0x01, 0x02, 0x04, 0x00], [0x20, 0x54, 0x54, 0x54, 0x78], [0x7F, 0x48, 0x44, 0x44, 0x38], [0x38, 0x44, 0x44, 0x44, 0x20],
        [0x38, 0x44, 0x44, 0x48, 0x7F], [0x38, 0x54, 0x54, 0x54, 0x18], [0x08, 0x7E, 0x09, 0x01, 0x02], [0x0C, 0x52, 0x52, 0x52, 0x3E],
        [0x7F, 0x08, 0x04, 0x04, 0x78], [0x00, 0x44, 0x7D, 0x40, 0x00], [0x20, 0x40, 0x44, 0x3D, 0x00], [0x7F, 0x10, 0x28, 0x44, 0x00],
        [0x00, 0x41, 0x7F, 0x40, 0x00], [0x7C, 0x04, 0x18, 0x04, 0x78], [0x7C, 0x08, 0x04, 0x04, 0x78], [0x38, 0x44, 0x44, 0x44, 0x38],
        [0x7C, 0x14, 0x14, 0x14, 0x08], [0x08, 0x14, 0x14, 0x18, 0x7C], [0x7C, 0x08, 0x04, 0x04, 0x08], [0x48, 0x54, 0x54, 0x54, 0x20],
        [0x04, 0x3F, 0x44, 0x40, 0x20], [0x3C, 0x40, 0x40, 0x40, 0x3C], [0x1C, 0x20, 0x40, 0x20, 0x1C], [0x3C, 0x40, 0x30, 0x40, 0x3C],
        [0x44, 0x28, 0x10, 0x28, 0x44], [0x0C, 0x50, 0x50, 0x50, 0x3C], [0x44, 0x64, 0x54, 0x4C, 0x44], [0x00, 0x08, 0x36, 0x41, 0x00],
        [0x00, 0x00, 0x7F, 0x00, 0x00], [0x00, 0x41, 0x36, 0x08, 0x00], [0x10, 0x08, 0x08, 0x10, 0x08],
      ];

      constructor(w: number, h: number, _wire?: any, _rst?: number) {
        this._w = w || 128; this._h = h || 64; this._addr = 0x3C;
        this._buf = new Uint8Array(Math.ceil((this._w * this._h) / 8));
      }

      begin(_vcc?: number, addr?: number): boolean {
        this._addr = addr || 0x3C;
        console.log(`[OLED] begin() called: addr=0x${this._addr.toString(16)}, ssd1306Slaves.size=${ssd1306Slaves.size}`);

        // Find the matching slave by address
        for (const [nodeId, slave] of ssd1306Slaves) {
          console.log(`[OLED] Checking slave: nodeId=${nodeId}, i2cAddress=0x${slave.i2cAddress.toString(16)}`);
          if (slave.i2cAddress === this._addr) {
            this._slave = slave;
            console.log(`[OLED] ✓ Found matching slave by address 0x${this._addr.toString(16)}`);
            break;
          }
        }

        // If only one OLED on canvas, use it regardless of address
        if (!this._slave && ssd1306Slaves.size > 0) {
          this._slave = ssd1306Slaves.values().next().value ?? null;
          console.log(`[OLED] Using first available slave (fallback)`);
        }

        if (!this._slave) {
          console.warn(`[OLED] ⚠ No physical OLED on canvas — running in virtual mode (display calls will be no-ops).`);
        }

        this._displayOn = true;
        this._buf.fill(0);
        console.log(`[OLED] Buffer initialized: ${this._buf.length} bytes`);
        this._flush();
        console.log(`[OLED] begin() complete`);
        return true;
      }
      clearDisplay() {
        this._buf.fill(0);
        console.log(`[OLED] clearDisplay()`);
      }
      display() {
        console.log(`[OLED] display() called — flushing ${this._buf.length} bytes to emulator`);
        this._flush();
      }
      setTextSize(s: number) { this._textsize = Math.max(1, s | 0); }
      setTextColor(c: number) { this._textcolor = c; }
      setCursor(x: number, y: number) { this._cursor_x = x | 0; this._cursor_y = y | 0; }
      setRotation(_r: number) { } invertDisplay(_i: boolean) { }
      startscrollright(_s: number, _e: number) { } stopscroll() { } dim(_d: boolean) { }
      width() { return this._w; } height() { return this._h; }

      drawPixel(x: number, y: number, color: number) {
        x = x | 0; y = y | 0;
        if (x < 0 || x >= this._w || y < 0 || y >= this._h) return;
        const idx = Math.floor(y / 8) * this._w + x;
        if (color) this._buf[idx] |= (1 << (y & 7));
        else this._buf[idx] &= ~(1 << (y & 7));
      }
      fillScreen(c: number) { this._buf.fill(c ? 0xFF : 0x00); }
      fillRect(x: number, y: number, w: number, h: number, c: number) {
        for (let i = x; i < x + w; i++) for (let j = y; j < y + h; j++) this.drawPixel(i, j, c);
      }
      drawRect(x: number, y: number, w: number, h: number, c: number) {
        for (let i = x; i < x + w; i++) { this.drawPixel(i, y, c); this.drawPixel(i, y + h - 1, c); }
        for (let j = y + 1; j < y + h - 1; j++) { this.drawPixel(x, j, c); this.drawPixel(x + w - 1, j, c); }
      }
      drawCircle(x0: number, y0: number, r: number, c: number) {
        let x = r, y = 0, err = 0;
        while (x >= y) {
          [x0 + x, x0 + y, x0 - y, x0 - x].forEach((px, i) => this.drawPixel(px, y0 + [y, x, x, y][i], c));
          [x0 - x, x0 - y, x0 + y, x0 + x].forEach((px, i) => this.drawPixel(px, y0 - [y, x, x, y][i], c));
          y++; err += 1 + 2 * y;
          if (2 * (err - x) + 1 > 0) { x--; err += 1 - 2 * x; }
        }
      }
      fillCircle(x0: number, y0: number, r: number, c: number) {
        for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (dx * dx + dy * dy <= r * r) this.drawPixel(x0 + dx, y0 + dy, c);
      }
      drawLine(x0: number, y0: number, x1: number, y1: number, c: number) {
        const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;
        for (; ;) { this.drawPixel(x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 > -dy) { err -= dy; x0 += sx; } if (e2 < dx) { err += dx; y0 += sy; } }
      }
      drawBitmap(x: number, y: number, bmp: number[], w: number, h: number, c: number) {
        for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (bmp[Math.floor((j * w + i) / 8)] & (0x80 >> ((j * w + i) % 8))) this.drawPixel(x + i, y + j, c);
      }
      print(v: any, base?: number) {
        const s = (typeof v === 'number' && base !== undefined && base !== 10) ? (v >>> 0).toString(base).toUpperCase() : String(v);
        console.log(`[OLED] print("${s}")`);
        this._writeStr(s);
      }
      println(v: any = '', base?: number) {
        const s = (typeof v === 'number' && base !== undefined && base !== 10) ? (v >>> 0).toString(base).toUpperCase() : String(v);
        console.log(`[OLED] println("${s}")`);
        this._writeStr(s + '\n');
      }
      write(c: number) { this._writeChar(c); }

      private _writeStr(s: string) {
        for (let i = 0; i < s.length; i++) {
          const c = s.charCodeAt(i);
          if (c === 10) { this._cursor_x = 0; this._cursor_y += 8 * this._textsize; }
          else this._writeChar(c);
        }
      }
      private _writeChar(c: number) {
        if (c < 32 || c > 126) return;
        const g = (RealAdafruitSSD1306 as any).FONT5X7[c - 32];
        if (!g) return;
        for (let col = 0; col < 5; col++) {
          let line = g[col];
          for (let row = 0; row < 8; row++) {
            if (line & 1) for (let sy = 0; sy < this._textsize; sy++) for (let sx = 0; sx < this._textsize; sx++)
              this.drawPixel(this._cursor_x + col * this._textsize + sx, this._cursor_y + row * this._textsize + sy, this._textcolor);
            line >>= 1;
          }
        }
        this._cursor_x += 6 * this._textsize;
        if (this._cursor_x > this._w - 6 * this._textsize) { this._cursor_x = 0; this._cursor_y += 8 * this._textsize; }
      }
      private _flush() {
        if (!this._slave) {
          return; // Virtual mode — no physical OLED to flush to
        }
        const em = this._slave.getEmulator();
        const pixBuf = em.getPixelBuffer();
        pixBuf.set(this._buf);

        // Count non-zero bytes to verify pixels were written
        let nonZero = 0;
        for (let i = 0; i < this._buf.length; i++) if (this._buf[i] !== 0) nonZero++;
        console.log(`[OLED] _flush(): ${nonZero}/${this._buf.length} non-zero bytes → calling forceFlush(true)`);

        em.forceFlush(true);
        console.log(`[OLED] _flush() complete`);
      }
    };

    // Store for use by initTranspiled (called after syncI2CBridge)
    this._pendingLibraryClasses.set('Adafruit_SSD1306', RealAdafruitSSD1306);
    console.log(`[OLED BRIDGE] RealAdafruitSSD1306 stored in _pendingLibraryClasses`);

    // ── Inject real Keypad class ──────────────────────────────────────────────
    // Reads from KeypadEmulator which is driven by pushKeypadKey() from the UI.
    // Fixes: auto-repeat, double-print, stops after first press.
    const keypadEmulators = this.keypadEmulators;

    const RealKeypad = class {
      private _keymap: string[][];
      private _lastKey: string | null = null;
      private _emulator: any = null;

      constructor(keymap: any, _rowPins?: any, _colPins?: any, _rows?: number, _cols?: number) {
        // keymap may be a 2D array from makeKeymap or the keys array directly
        this._keymap = Array.isArray(keymap) ? keymap : [
          ['1', '2', '3', 'A'], ['4', '5', '6', 'B'], ['7', '8', '9', 'C'], ['*', '0', '#', 'D']
        ];
        // Find the first registered keypad emulator
        if (keypadEmulators.size > 0) {
          this._emulator = keypadEmulators.values().next().value;
          console.log(`[KEYPAD] Keypad instance created, emulator found: ${!!this._emulator}`);
        } else {
          console.warn(`[KEYPAD] Keypad instance created but no emulator registered yet`);
        }
      }

      getKey(): string | null {
        // Re-find emulator if not set yet (lazy init)
        if (!this._emulator && keypadEmulators.size > 0) {
          this._emulator = keypadEmulators.values().next().value;
        }
        // Read current pressed key from emulator
        const current = this._emulator?.currentKey ?? null;
        // Edge-triggered: only return key on the transition from null → key
        // This prevents auto-repeat on every loop() frame
        if (current !== null && current !== this._lastKey) {
          this._lastKey = current;
          console.log(`[KEYPAD] getKey() → '${current}'`);
          return current;
        }
        // Key released: reset so next press is detected
        if (current === null) {
          this._lastKey = null;
        }
        return null;
      }

      isPressed(key: string): boolean {
        const current = this._emulator?.currentKey ?? null;
        return current === key;
      }

      getState(): number { return 0; }
      addEventListener(): void { }
    };

    const RealMakeKeymap = function (keymap: any, rowPins?: any, colPins?: any, rows?: number, cols?: number) {
      return new RealKeypad(keymap, rowPins, colPins, rows, cols);
    };

    this._pendingLibraryClasses.set('Keypad', RealKeypad);
    this._pendingLibraryClasses.set('makeKeymap', RealMakeKeymap);
    console.log(`[KEYPAD] RealKeypad + makeKeymap stored in _pendingLibraryClasses`);

    // ── ILI9341 TFT emulator class ──────────────────────────────────────────────
    // Captures Adafruit_ILI9341 API calls and renders to a 240×320 RGBA buffer,
    // pushed to the component via updateNodeData — same pattern as the SSD1306 above.
    const RealAdafruitILI9341 = class {
      private _w = 240;
      private _h = 320;
      private _rotation = 0;
      private _pixels: Uint8ClampedArray;  // RGBA flat buffer (240*320*4)
      private _cursor_x = 0;
      private _cursor_y = 0;
      private _textsize = 1;
      private _textcolor = 0xFFFF; // white RGB565
      private _nodeId: string | null = null;

      private static readonly FONT5X7: number[][] = [
        [0x00, 0x00, 0x00, 0x00, 0x00], [0x00, 0x00, 0x5F, 0x00, 0x00], [0x00, 0x07, 0x00, 0x07, 0x00], [0x14, 0x7F, 0x14, 0x7F, 0x14],
        [0x24, 0x2A, 0x7F, 0x2A, 0x12], [0x23, 0x13, 0x08, 0x64, 0x62], [0x36, 0x49, 0x55, 0x22, 0x50], [0x00, 0x05, 0x03, 0x00, 0x00],
        [0x00, 0x1C, 0x22, 0x41, 0x00], [0x00, 0x41, 0x22, 0x1C, 0x00], [0x14, 0x08, 0x3E, 0x08, 0x14], [0x08, 0x08, 0x3E, 0x08, 0x08],
        [0x00, 0x50, 0x30, 0x00, 0x00], [0x08, 0x08, 0x08, 0x08, 0x08], [0x00, 0x60, 0x60, 0x00, 0x00], [0x20, 0x10, 0x08, 0x04, 0x02],
        [0x3E, 0x51, 0x49, 0x45, 0x3E], [0x00, 0x42, 0x7F, 0x40, 0x00], [0x42, 0x61, 0x51, 0x49, 0x46], [0x21, 0x41, 0x45, 0x4B, 0x31],
        [0x18, 0x14, 0x12, 0x7F, 0x10], [0x27, 0x45, 0x45, 0x45, 0x39], [0x3C, 0x4A, 0x49, 0x49, 0x30], [0x01, 0x71, 0x09, 0x05, 0x03],
        [0x36, 0x49, 0x49, 0x49, 0x36], [0x06, 0x49, 0x49, 0x29, 0x1E], [0x00, 0x36, 0x36, 0x00, 0x00], [0x00, 0x56, 0x36, 0x00, 0x00],
        [0x08, 0x14, 0x22, 0x41, 0x00], [0x14, 0x14, 0x14, 0x14, 0x14], [0x00, 0x41, 0x22, 0x14, 0x08], [0x02, 0x01, 0x51, 0x09, 0x06],
        [0x32, 0x49, 0x79, 0x41, 0x3E], [0x7E, 0x11, 0x11, 0x11, 0x7E], [0x7F, 0x49, 0x49, 0x49, 0x36], [0x3E, 0x41, 0x41, 0x41, 0x22],
        [0x7F, 0x41, 0x41, 0x22, 0x1C], [0x7F, 0x49, 0x49, 0x49, 0x41], [0x7F, 0x09, 0x09, 0x09, 0x01], [0x3E, 0x41, 0x49, 0x49, 0x7A],
        [0x7F, 0x08, 0x08, 0x08, 0x7F], [0x00, 0x41, 0x7F, 0x41, 0x00], [0x20, 0x40, 0x41, 0x3F, 0x01], [0x7F, 0x08, 0x14, 0x22, 0x41],
        [0x7F, 0x40, 0x40, 0x40, 0x40], [0x7F, 0x02, 0x0C, 0x02, 0x7F], [0x7F, 0x04, 0x08, 0x10, 0x7F], [0x3E, 0x41, 0x41, 0x41, 0x3E],
        [0x7F, 0x09, 0x09, 0x09, 0x06], [0x3E, 0x41, 0x51, 0x21, 0x5E], [0x7F, 0x09, 0x19, 0x29, 0x46], [0x46, 0x49, 0x49, 0x49, 0x31],
        [0x01, 0x01, 0x7F, 0x01, 0x01], [0x3F, 0x40, 0x40, 0x40, 0x3F], [0x1F, 0x20, 0x40, 0x20, 0x1F], [0x3F, 0x40, 0x38, 0x40, 0x3F],
        [0x63, 0x14, 0x08, 0x14, 0x63], [0x07, 0x08, 0x70, 0x08, 0x07], [0x61, 0x51, 0x49, 0x45, 0x43], [0x00, 0x7F, 0x41, 0x41, 0x00],
        [0x02, 0x04, 0x08, 0x10, 0x20], [0x00, 0x41, 0x41, 0x7F, 0x00], [0x04, 0x02, 0x01, 0x02, 0x04], [0x40, 0x40, 0x40, 0x40, 0x40],
        [0x00, 0x01, 0x02, 0x04, 0x00], [0x20, 0x54, 0x54, 0x54, 0x78], [0x7F, 0x48, 0x44, 0x44, 0x38], [0x38, 0x44, 0x44, 0x44, 0x20],
        [0x38, 0x44, 0x44, 0x48, 0x7F], [0x38, 0x54, 0x54, 0x54, 0x18], [0x08, 0x7E, 0x09, 0x01, 0x02], [0x0C, 0x52, 0x52, 0x52, 0x3E],
        [0x7F, 0x08, 0x04, 0x04, 0x78], [0x00, 0x44, 0x7D, 0x40, 0x00], [0x20, 0x40, 0x44, 0x3D, 0x00], [0x7F, 0x10, 0x28, 0x44, 0x00],
        [0x00, 0x41, 0x7F, 0x40, 0x00], [0x7C, 0x04, 0x18, 0x04, 0x78], [0x7C, 0x08, 0x04, 0x04, 0x78], [0x38, 0x44, 0x44, 0x44, 0x38],
        [0x7C, 0x14, 0x14, 0x14, 0x08], [0x08, 0x14, 0x14, 0x18, 0x7C], [0x7C, 0x08, 0x04, 0x04, 0x08], [0x48, 0x54, 0x54, 0x54, 0x20],
        [0x04, 0x3F, 0x44, 0x40, 0x20], [0x3C, 0x40, 0x40, 0x40, 0x3C], [0x1C, 0x20, 0x40, 0x20, 0x1C], [0x3C, 0x40, 0x30, 0x40, 0x3C],
        [0x44, 0x28, 0x10, 0x28, 0x44], [0x0C, 0x50, 0x50, 0x50, 0x3C], [0x44, 0x64, 0x54, 0x4C, 0x44], [0x00, 0x08, 0x36, 0x41, 0x00],
        [0x00, 0x00, 0x7F, 0x00, 0x00], [0x00, 0x41, 0x36, 0x08, 0x00], [0x10, 0x08, 0x08, 0x10, 0x08],
      ];

      // Arduino-style value-to-string formatting (handles HEX, OCT, BIN, DEC bases)
      private static _formatValue(v: any, base?: number): string {
        if (typeof v === 'number' && base !== undefined && base !== 10) {
          return (v >>> 0).toString(base).toUpperCase();
        }
        return String(v);
      }

      constructor(_cs?: number, _dc?: number, _mosi?: number, _sck?: number, _rst?: number, _miso?: number) {
        this._pixels = new Uint8ClampedArray(240 * 320 * 4);
        for (let i = 3; i < this._pixels.length; i += 4) this._pixels[i] = 255;

        try {
          const { nodes } = useForgeStore.getState();
          for (const n of nodes) {
            if (n.data?.type === 'ili9341') {
              this._nodeId = n.id;
              console.log(`[TFT] constructor: found ILI9341 node ${this._nodeId}`);
              break;
            }
          }
        } catch (e) { /* store not available */ }
      }

      begin(_freq?: number) {
        console.log(`[TFT] begin()`);
        this.fillScreen(0x0000);
      }

      // setRotation stores rotation value and adjusts width()/height() return values
      // for API compatibility, but all pixel rendering always uses 240×320 native buffer.
      setRotation(r: number) {
        this._rotation = r & 3;
        // width()/height() report rotated dimensions to the sketch
        // but internal drawing always uses native 240×320
      }

      width() { return (this._rotation & 1) ? 320 : 240; }
      height() { return (this._rotation & 1) ? 240 : 320; }
      invertDisplay(_i: boolean) { }

      private _rgb565toRGBA(c: number): [number, number, number] {
        const r = ((c >> 11) & 0x1F) * 255 / 31;
        const g = ((c >> 5) & 0x3F) * 255 / 63;
        const b = (c & 0x1F) * 255 / 31;
        return [r | 0, g | 0, b | 0];
      }

      // Always draw in native 240×320 portrait coordinates — no rotation mapping.
      // This ensures characters render upright and text flows left-to-right.
      drawPixel(x: number, y: number, color: number) {
        x = x | 0; y = y | 0;
        if (x < 0 || x >= 240 || y < 0 || y >= 320) return;
        const [r, g, b] = this._rgb565toRGBA(color);
        const idx = (y * 240 + x) * 4;
        this._pixels[idx] = r; this._pixels[idx + 1] = g; this._pixels[idx + 2] = b; this._pixels[idx + 3] = 255;
      }

      fillScreen(color: number) {
        const [r, g, b] = this._rgb565toRGBA(color);
        for (let i = 0; i < this._pixels.length; i += 4) {
          this._pixels[i] = r; this._pixels[i + 1] = g; this._pixels[i + 2] = b; this._pixels[i + 3] = 255;
        }
        this._flush();
      }

      fillRect(x: number, y: number, w: number, h: number, c: number) {
        for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.drawPixel(i, j, c);
        this._flush();
      }
      drawRect(x: number, y: number, w: number, h: number, c: number) {
        this.drawLine(x, y, x + w - 1, y, c);
        this.drawLine(x, y + h - 1, x + w - 1, y + h - 1, c);
        this.drawLine(x, y, x, y + h - 1, c);
        this.drawLine(x + w - 1, y, x + w - 1, y + h - 1, c);
      }
      drawLine(x0: number, y0: number, x1: number, y1: number, c: number) {
        const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;
        for (; ;) { this.drawPixel(x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 > -dy) { err -= dy; x0 += sx; } if (e2 < dx) { err += dx; y0 += sy; } }
      }
      drawCircle(x0: number, y0: number, r: number, c: number) {
        let x = r, y = 0, err = 0;
        while (x >= y) {
          this.drawPixel(x0 + x, y0 + y, c); this.drawPixel(x0 + y, y0 + x, c);
          this.drawPixel(x0 - y, y0 + x, c); this.drawPixel(x0 - x, y0 + y, c);
          this.drawPixel(x0 - x, y0 - y, c); this.drawPixel(x0 - y, y0 - x, c);
          this.drawPixel(x0 + y, y0 - x, c); this.drawPixel(x0 + x, y0 - y, c);
          y++; err += 1 + 2 * y;
          if (2 * (err - x) + 1 > 0) { x--; err += 1 - 2 * x; }
        }
      }
      fillCircle(x0: number, y0: number, r: number, c: number) {
        for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (dx * dx + dy * dy <= r * r) this.drawPixel(x0 + dx, y0 + dy, c);
        this._flush();
      }
      drawTriangle(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, c: number) {
        this.drawLine(x0, y0, x1, y1, c); this.drawLine(x1, y1, x2, y2, c); this.drawLine(x2, y2, x0, y0, c);
      }
      fillTriangle(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, c: number) {
        const pts = [[x0, y0], [x1, y1], [x2, y2]].sort((a, b) => a[1] - b[1]);
        for (let y = pts[0][1]; y <= pts[2][1]; y++) {
          let xa = pts[0][1] !== pts[2][1] ? pts[0][0] + (y - pts[0][1]) * (pts[2][0] - pts[0][0]) / (pts[2][1] - pts[0][1]) : pts[0][0];
          let xb: number;
          if (y < pts[1][1]) xb = pts[0][1] !== pts[1][1] ? pts[0][0] + (y - pts[0][1]) * (pts[1][0] - pts[0][0]) / (pts[1][1] - pts[0][1]) : pts[0][0];
          else xb = pts[1][1] !== pts[2][1] ? pts[1][0] + (y - pts[1][1]) * (pts[2][0] - pts[1][0]) / (pts[2][1] - pts[1][1]) : pts[1][0];
          if (xa > xb) { const t = xa; xa = xb; xb = t; }
          for (let x = Math.ceil(xa); x <= Math.floor(xb); x++) this.drawPixel(x, y, c);
        }
        this._flush();
      }
      drawRoundRect(x: number, y: number, w: number, h: number, _r: number, c: number) { this.drawRect(x, y, w, h, c); }
      fillRoundRect(x: number, y: number, w: number, h: number, _r: number, c: number) { this.fillRect(x, y, w, h, c); }

      // ── Text rendering ───────────────────────────────────────────────
      setCursor(x: number, y: number) { this._cursor_x = x | 0; this._cursor_y = y | 0; }
      setTextColor(c: number, _bg?: number) { this._textcolor = c; }
      setTextSize(s: number) { this._textsize = Math.max(1, s | 0); }

      print(v: any, base?: number) {
        this._writeStr((RealAdafruitILI9341 as any)._formatValue(v, base));
        this._flush();
      }
      println(v: any = '', base?: number) {
        this._writeStr((RealAdafruitILI9341 as any)._formatValue(v, base) + '\n');
        this._flush();
      }

      private _writeStr(s: string) {
        for (let i = 0; i < s.length; i++) {
          const c = s.charCodeAt(i);
          if (c === 10) { this._cursor_x = 0; this._cursor_y += 8 * this._textsize; }
          else this._writeChar(c);
        }
      }
      private _writeChar(c: number) {
        if (c < 32 || c > 126) return;
        const g = (RealAdafruitILI9341 as any).FONT5X7[c - 32];
        if (!g) return;
        for (let col = 0; col < 5; col++) {
          let line = g[col];
          for (let row = 0; row < 8; row++) {
            if (line & 1) for (let sy = 0; sy < this._textsize; sy++) for (let sx = 0; sx < this._textsize; sx++)
              this.drawPixel(this._cursor_x + col * this._textsize + sx, this._cursor_y + row * this._textsize + sy, this._textcolor);
            line >>= 1;
          }
        }
        this._cursor_x += 6 * this._textsize;
        if (this._cursor_x > this._w - 6 * this._textsize) { this._cursor_x = 0; this._cursor_y += 8 * this._textsize; }
      }

      private _flush() {
        if (!this._nodeId) return;
        try {
          const imageData = new ImageData(new Uint8ClampedArray(this._pixels), 240, 320);
          const { updateNodeData } = useForgeStore.getState();
          updateNodeData(this._nodeId, { tftImageData: imageData, tftRotation: this._rotation });
        } catch (e) {
          console.warn('[TFT] _flush failed:', e);
        }
      }
    };

    this._pendingLibraryClasses.set('Adafruit_ILI9341', RealAdafruitILI9341);
    console.log(`[TFT BRIDGE] RealAdafruitILI9341 stored in _pendingLibraryClasses`);

    // If runtime already exists (re-sync case), inject immediately
    if (esp32Runtime) {
      esp32Runtime.injectLibraryClass('Adafruit_SSD1306', RealAdafruitSSD1306);
      esp32Runtime.injectLibraryClass('Adafruit_ILI9341', RealAdafruitILI9341);
      this._wireI2CBus(esp32Runtime);
      console.log('[OLED BRIDGE] ✓ Runtime exists — injected SSD1306 + ILI9341 + wired I2C bus');
    } else {
      console.log('[OLED BRIDGE] Runtime not yet created — classes queued for initTranspiled()');
    }
  }

  /** Called by ESP32C3SimulationRunner.initTranspiled() to get pending library classes */
  public getPendingLibraryClasses(): Map<string, any> {
    return this._pendingLibraryClasses;
  }

  /** Wire the I2C bus to an ArduinoRuntime instance */
  private _wireI2CBus(runtime: import('../esp32c3/ArduinoRuntime').ArduinoRuntime) {
    const bus = this.i2cBusManager;
    let _rxBuf: number[] = [], _rxPos = 0;
    console.log(`[OLED BRIDGE] _wireI2CBus: wiring I2C bus. Registered slaves: ${[...bus['slaves']?.keys() ?? []].map((a: number) => '0x' + a.toString(16)).join(', ')}`);
    runtime.setI2CBus({
      startTransmission(addr: number) {
        console.log(`[I2C WIRE] beginTransmission(0x${addr.toString(16)})`);
        bus['activeSlave'] = null;
        const slave = bus['slaves']?.get(addr) ?? null;
        if (slave) {
          slave.onStart(false);
          slave.onConnect(true);
          bus['activeSlave'] = slave;
          console.log(`[I2C WIRE] ✓ Connected to slave at 0x${addr.toString(16)}`);
        } else {
          console.warn(`[I2C WIRE] ✗ No slave at 0x${addr.toString(16)}`);
        }
      },
      write(val: number) { const s = bus['activeSlave']; if (s) s.onWrite(val & 0xFF); },
      endTransmission() {
        const s = bus['activeSlave'];
        if (s) s.onStop();
        bus['activeSlave'] = null;
      },
      requestFrom(addr: number, qty: number) {
        _rxBuf = []; _rxPos = 0;
        const slave = bus['slaves']?.get(addr) ?? null;
        if (slave) { slave.onStart(false); slave.onConnect(false); for (let i = 0; i < qty; i++) _rxBuf.push(slave.onRead(i < qty - 1)); slave.onStop(); }
      },
      available() { return _rxBuf.length - _rxPos; },
      read() { return _rxPos < _rxBuf.length ? _rxBuf[_rxPos++] : 0; },
    });
    console.log('[OLED BRIDGE] ✓ Wire → I2CBusManager connected');
  }

  /**
   * Clears all active emulators, timers, and AVR listeners.
   */
  public cleanup() {
    this.activeSubscriptions.forEach((unsubscribe) => unsubscribe());
    this.activeSubscriptions.clear();
    this.lcdEmulators.clear();
    this.peripheralPinBuffers.clear();
    this.i2cBusManager.clear();
    this.dhtEmulators.clear();
    this.neoPixelEmulators.clear();
    this.stepperEmulators.forEach(e => e.destroy());
    this.stepperEmulators.clear();
    this.ili9341Slaves.forEach(s => s.detach());
    this.ili9341Slaves.clear();
    this.mpu6050Slaves.clear();
    this.ssd1306Slaves.clear();
    this.keypadEmulators.clear();
    this.rotaryDialerEmulators.clear();
    this.tiltSwitchEmulators.clear();
    this.rotaryEncoderEmulators.clear();
    // Cancel all heart-beat animation timers
    this.heartBeatTimers.forEach(id => cancelAnimationFrame(id));
    this.heartBeatTimers.clear();
    // Clear A4988 motor connection cache and debug flag
    this.a4988MotorCache.clear();
    this.a4988DebugLogged = false;
  }

  /**
   * Called whenever wires are drawn/removed. Rebuilds the routing table.
   */
  public syncCircuitGraph() {
    console.log('[FORGE CIRCUIT] syncCircuitGraph triggered. Re-evaluating electrical routing table...');
    // 1. Clear all old AVR listeners hooked by the circuit engine
    this.cleanup();

    const { nodes, edges, updateNodeData } = useForgeStore.getState();
    const currentStateStore = useForgeStore.getState();

    // 2.1 Register I2C Slaves and Reset States
    nodes.forEach(node => {
      // Reset damaged/visual states on sync (e.g. simulation start)
      if (node.data?.damaged || node.data?.pinStates) {
        updateNodeData(node.id, { damaged: false, pinStates: {} });
      }

      if (node.data?.type === 'lcd1602' || node.data?.type === 'lcd2004' ||
        node.data?.type === 'lcd1602-i2c' || node.data?.type === 'lcd2004-i2c') {
        // Create an emulator for the display
        const isWide = node.data?.type === 'lcd2004' || node.data?.type === 'lcd2004-i2c';
        const cols = isWide ? 20 : 16;
        const rows = isWide ? 4 : 2;
        const emulator = new HD44780(cols, rows);
        this.lcdEmulators.set(node.id, emulator);

        // I2C variants always use the PCF8574 backpack at 0x27
        const isI2C = node.data?.type === 'lcd1602-i2c' || node.data?.type === 'lcd2004-i2c';
        const i2cAddr = isI2C ? (node.data?.i2cAddress ?? 0x27) : node.data?.i2cAddress;
        if (i2cAddr) {
          const backpack = new PCF8574(i2cAddr, emulator, (state) => {
            updateNodeData(node.id, { lcdState: state });
          });
          this.i2cBusManager.registerSlave(backpack);
        }
      }

      // Register SSD1306 OLED as I2C slave (default address 0x3C)
      if (node.data?.type === 'ssd1306') {
        const i2cAddr = node.data?.i2cAddress ?? 0x3C;
        console.log(`[OLED] Registering SSD1306 slave: nodeId=${node.id}, addr=0x${i2cAddr.toString(16)}`);
        const slave = new SSD1306I2CSlave(i2cAddr, (pixels, displayOn) => {
          console.log(`[OLED] onUpdate callback fired! displayOn=${displayOn}, pixels.length=${pixels.length}`);
          // Convert the page-addressed pixel buffer to RGBA ImageData
          const imageData = new ImageData(128, 64);
          let litPixels = 0;
          for (let page = 0; page < 8; page++) {
            for (let col = 0; col < 128; col++) {
              const byte = pixels[page * 128 + col];
              for (let bit = 0; bit < 8; bit++) {
                const row = page * 8 + bit;
                const idx = (row * 128 + col) * 4;
                const on = displayOn && ((byte >> bit) & 1) === 1;
                if (on) litPixels++;
                imageData.data[idx] = on ? 255 : 0;   // R
                imageData.data[idx + 1] = on ? 255 : 0;   // G
                imageData.data[idx + 2] = on ? 255 : 0;   // B
                imageData.data[idx + 3] = 255;             // A
              }
            }
          }
          console.log(`[OLED] ImageData created: ${litPixels} lit pixels → calling updateNodeData for node ${node.id}`);
          updateNodeData(node.id, { oledImageData: imageData });
          console.log(`[OLED] updateNodeData called ✓`);
        });
        this.i2cBusManager.registerSlave(slave);
        this.ssd1306Slaves.set(node.id, slave);
        console.log(`[OLED] SSD1306 slave registered. Total slaves: ${this.ssd1306Slaves.size}`);
      }

      // Register membrane-keypad emulator
      if (node.data?.type === 'membrane-keypad') {
        const nodeId = node.id;
        const emulator = new KeypadEmulator(
          [], [], // row/col pins — not used in transpiled path, UI drives via pushKeypadKey
          (_pin: string, _high: boolean) => { } // no-op pin setter for transpiled path
        );
        this.keypadEmulators.set(nodeId, emulator);
        console.log(`[KEYPAD] Registered membrane-keypad emulator: nodeId=${nodeId}`);
      }

      // Register rotary-dialer emulator
      if (node.data?.type === 'rotary-dialer') {
        const nodeId = node.id;
        const emulator = new RotaryDialerEmulator(
          'DIAL', 'PULSE',
          (pin: string, high: boolean) => {
            this.pushInputSignal(nodeId, pin, high);
          }
        );
        this.rotaryDialerEmulators.set(nodeId, emulator);
        console.log(`[ROTARY] Registered rotary-dialer emulator: nodeId=${nodeId}`);
      }

      // Register tilt-switch emulator
      if (node.data?.type === 'tilt-switch') {
        const nodeId = node.id;
        const emulator = new TiltSwitchEmulator(
          'OUT',
          (pin: string, high: boolean) => {
            this.pushInputSignal(nodeId, pin, high);
          }
        );
        this.tiltSwitchEmulators.set(nodeId, emulator);

        // Set initial tilt state from node data
        const initialTilted = node.data?.sensorValues?.tilted ?? false;
        emulator.setTilted(initialTilted);

        console.log(`[TILT] Registered tilt-switch emulator: nodeId=${nodeId}, initial state=${initialTilted ? 'TILTED' : 'UPRIGHT'}`);
      }

      // Register KY-040 rotary encoder emulator
      if (node.data?.type === 'ky-040') {
        const nodeId = node.id;
        const emulator = new RotaryEncoderEmulator(
          'CLK', 'DT',
          (pin: string, high: boolean) => {
            this.pushInputSignal(nodeId, pin, high);
          }
        );
        this.rotaryEncoderEmulators.set(nodeId, emulator);

        // Initialize SW button pin to HIGH (pull-up state) immediately
        this.pushInputSignal(nodeId, 'SW', true);
        console.log(`[KY-040] Registered rotary encoder emulator: nodeId=${nodeId}, SW initialized to HIGH`);
      }

      // Register ILI9341 TFT as SPI peripheral
      // The slave is created here; pin listeners (D/C, CS) are wired in the edge-scan loop below.
      if (node.data?.type === 'ili9341') {
        const nodeId = node.id;
        const spi = simulationRunner.SPI;
        if (spi) {
          const slave = new ILI9341SPISlave(spi, (pixels, displayOn) => {
            // Build an ImageData from the RGBA pixel buffer and push to the node
            const imageData = new ImageData(new Uint8ClampedArray(pixels), 240, 320);
            updateNodeData(nodeId, { tftImageData: imageData, tftDisplayOn: displayOn });
          });
          slave.attach();
          this.ili9341Slaves.set(nodeId, slave);
          console.log(`[FORGE CIRCUIT] ILI9341 (${nodeId}) registered on SPI bus`);
        } else {
          console.warn(`[FORGE CIRCUIT] ILI9341 (${nodeId}): SPI bus not available on this board`);
        }
      }

      // Register MPU6050 as I2C slave (default address 0x68, AD0=LOW)
      if (node.data?.type === 'mpu6050') {
        const nodeId = node.id;
        const i2cAddr = node.data?.i2cAddress ?? 0x68;
        const slave = new MPU6050I2CSlave(i2cAddr);

        // Push current sensor values from store into the emulator immediately
        const sv = node.data?.sensorValues;
        if (sv) {
          slave.setSensorValues({
            accelX: sv.accelX ?? 0,
            accelY: sv.accelY ?? 0,
            accelZ: sv.accelZ ?? 1,
            gyroX: sv.gyroX ?? 0,
            gyroY: sv.gyroY ?? 0,
            gyroZ: sv.gyroZ ?? 0,
            temp: sv.temp ?? 25,
          });
        }

        this.i2cBusManager.registerSlave(slave);
        this.mpu6050Slaves.set(nodeId, slave);
        console.log(`[FORGE CIRCUIT] MPU6050 (${nodeId}) registered at I2C 0x${i2cAddr.toString(16)}`);
      }

      // Register DS1307 RTC as I2C slave (default address 0x68)
      if (node.data?.type === 'ds1307') {
        const nodeId = node.id;
        const slave = new DS1307Emulator();
        this.i2cBusManager.registerSlave(slave);
        console.log(`[FORGE CIRCUIT] DS1307 (${nodeId}) registered at I2C 0x68`);
      }

      // Register heart-beat sensor — drives OUT ADC channel with a time-varying pulse voltage
      if (node.data?.type === 'heart-beat-sensor') {
        const nodeId = node.id;
        let phase = 0;
        let lastTime = performance.now();

        const tick = () => {
          const now = performance.now();
          const dt = (now - lastTime) / 1000; // seconds
          lastTime = now;

          // Read current BPM from store (slider may have changed)
          const currentNode = useForgeStore.getState().nodes.find(n => n.id === nodeId);
          if (!currentNode) return;

          const bpm = currentNode.data?.sensorValues?.bpm ?? 72;
          const freq = bpm / 60; // beats per second

          // Advance phase
          phase = (phase + freq * dt) % 1;

          // Compute pulse sensor ADC value matching real PulseSensor.com output:
          // Baseline ~512, beat peak ~750–900, diastolic dip ~350–450
          const adcValue = Math.max(0, Math.min(1023, pulseSensorADC(phase)));
          const voltage = (adcValue / 1023) * 5.0;

          // Push to ADC — find the OUT wire
          const { edges } = useForgeStore.getState();
          const outWire = edges.find(e => {
            const srcMatch = e.source === nodeId && (e.sourceHandle === 'OUT' || e.sourceHandle === 'OUT__target');
            const tgtMatch = e.target === nodeId && (e.targetHandle === 'OUT' || e.targetHandle === 'OUT__target');
            return srcMatch || tgtMatch;
          });

          if (outWire) {
            const boardPin = (outWire.source === nodeId ? outWire.targetHandle : outWire.sourceHandle) ?? '';
            const cleanPin = boardPin.replace(/__target$/, '');

            // Try ESP32-C3 RISC-V runner first, then AVR
            const esp32Mapping = simulationRunner.convertESP32Pin(cleanPin);
            if (esp32Mapping && esp32Mapping.avrPin && esp32Mapping.avrPin.startsWith('ESP')) {
              // ESP32-C3 RISC-V path
              if (simulationRunner.isESP32C3Board && esp32Mapping.adcChannel !== undefined) {
                const gpioNum = parseInt(esp32Mapping.avrPin.replace('ESP', ''), 10);
                const scaledVoltage = (adcValue / 1023) * 3.3;
                simulationRunner.setESP32C3AnalogInput(gpioNum, scaledVoltage);
              }
            } else {
              const mapping = simulationRunner.convertArduinoPin(cleanPin);
              if (mapping && mapping.adcChannel !== undefined) {
                simulationRunner.setAnalogInput(mapping.adcChannel, voltage);
              }
            }
          }

          // Update beatPhase and current ADC value in store for visual element
          updateNodeData(nodeId, {
            sensorValues: {
              ...useForgeStore.getState().nodes.find(n => n.id === nodeId)?.data?.sensorValues,
              beatPhase: phase,
              adcValue,
            },
          });

          // Schedule next tick
          const rafId = requestAnimationFrame(tick);
          this.heartBeatTimers.set(nodeId, rafId);
        };

        const rafId = requestAnimationFrame(tick);
        this.heartBeatTimers.set(nodeId, rafId);
        console.log(`[FORGE CIRCUIT] Heart-beat sensor (${nodeId}) timer started`);
      }
    });

    // 2.2 Attach Bus Manager to Master
    if (simulationRunner.TWI) {
      // Arduino/AVR: attach via hardware TWI
      simulationRunner.TWI.eventHandler = this.i2cBusManager;
    }

    // 2.3 Wire I2CBusManager into ArduinoRuntime (ESP32 transpiled path)
    // Applied via syncI2CBridge() called from SimulationRunner.start() after initTranspiled()
    this.syncI2CBridge();

    // 2. Map board nodes (Arduino/ESP32) and their connected peripherals
    const boardNodes = nodes.filter(n =>
      n.data?.type === 'arduino-uno' ||
      n.data?.type === 'arduino-nano' ||
      n.data?.type === 'arduino-mega' ||
      n.data?.type === 'boards' ||
      n.data?.type === 'esp32-c3'
    );

    boardNodes.forEach(board => {
      // Find all wires connected to this Arduino
      const connectedEdges = edges.filter(e => e.source === board.id || e.target === board.id);

      connectedEdges.forEach(edge => {
        // Determine the flow direction (Assuming Board -> Peripheral for now, Phase 3 propagation)
        // If the Arduino is the source of the edge (e.g., standard digital output)
        const isOutput = edge.source === board.id;
        // Strip ReactFlow's __target suffix — handles are stored as "PIN" or "PIN__target"
        const arduinoPinName = (isOutput ? edge.sourceHandle : edge.targetHandle)?.replace(/__target$/, '');
        const peripheralId = isOutput ? edge.target : edge.source;
        const peripheralPinName = (isOutput ? edge.targetHandle : edge.sourceHandle)?.replace(/__target$/, '');

        if (!arduinoPinName || !peripheralPinName) return;

        // For ESP32: GPIO numbers map directly to ESP{n} pin IDs.
        // For AVR boards: convert Arduino pin number to AVR port pin (e.g. "13" → "PB5").
        const isESP32Board = board.data?.type === 'esp32-c3';
        let pinId: string;

        if (isESP32Board) {
          // Use the full ESP32 pin map — handles D{n}, VP, VN, RX2, TX2 etc.
          // Power/GND pins return null and are silently skipped.
          const esp32Mapping = simulationRunner.convertESP32Pin(arduinoPinName);
          if (!esp32Mapping) return;
          pinId = esp32Mapping.avrPin;
          console.log(`[FORGE CIRCUIT 7SEG] ESP32 Wired: Board[${arduinoPinName}→${pinId}] <==> Peripheral[${peripheralPinName}]`);
        } else {
          const mapping = simulationRunner.convertArduinoPin(arduinoPinName);
          if (!mapping) return;
          pinId = mapping.avrPin;
          console.log(`[FORGE CIRCUIT] Wired Logic Route: Board[${arduinoPinName}] <==> ${pinId} <==> Peripheral[${peripheralPinName}]`);
        }

        // Keep avrPin as an alias for the rest of the listener body (DHT, NeoPixel etc.)
        const avrPin = pinId;

        // --- Custom Peripheral Emulation ---
        let trigStartCycles = 0;
        let pwmStartCycles = 0;

        // Ensure buffers exist for this peripheral
        if (!this.peripheralPinBuffers.has(peripheralId)) {
          const pType = nodes.find(n => n.id === peripheralId)?.data?.type;
          // Set A4988 pin defaults per Wokwi spec:
          //   ENABLE  → pulled-down (LOW = 0 = enabled by default)
          //   SLEEP   → pulled-up (HIGH = 1 = awake by default)
          //   RESET   → floating (treat as HIGH = not in reset)
          //   MS1/2/3 → pulled-down (LOW = full step by default)
          const initialBuf: Record<string, boolean> = {};
          if (pType === 'a4988') {
            initialBuf['ENABLE'] = false; // pulled-down → LOW → driver enabled
            initialBuf['SLEEP'] = true;  // pulled-up  → HIGH → awake
            initialBuf['RESET'] = true;  // floating   → treat as HIGH → not in reset
            initialBuf['MS1'] = false;
            initialBuf['MS2'] = false;
            initialBuf['MS3'] = false;
          }
          this.peripheralPinBuffers.set(peripheralId, initialBuf);
        }

        // Create a dedicated listener that pushes the HIGH/LOW state across the wire to the target node
        const listener = (state: PinState) => {
          const isHigh = state === 'HIGH';
          const currentStateStore = useForgeStore.getState();

          // Identify peripheral type once
          const pType = currentStateStore.nodes.find(n => n.id === peripheralId)?.data?.type;

          // Log 7-segment related activity
          if (pType === '7segment') {
            console.log(`[CIRCUIT 7SEG] Listener triggered: ${avrPin} = ${state}, peripheral pin: ${peripheralPinName}`);
          }

          const isComplexPeripheral = ['stepper-motor', 'a4988', 'biaxial-stepper', 'dht22', 'dht11', 'servo', 'hc-sr04',
            'lcd1602', 'lcd2004', 'lcd1602-i2c', 'lcd2004-i2c', 'neopixel', 'neopixel-matrix', 'led-ring', 'ks2e-m-dc5',
            '7segment', 'ili9341', 'pir-motion-sensor', 'heart-beat-sensor', 'hx711', 'ds1307', 'membrane-keypad', 'rotary-dialer'].includes(pType);

          // 1. Trace the electrical network — only for simple output peripherals
          if (!isComplexPeripheral) {
            const reachableTargets = this.traceNet(peripheralId, peripheralPinName);
            console.log(`[CIRCUIT LED] Traced from ${peripheralId}/${peripheralPinName}, found ${reachableTargets.length} targets:`, reachableTargets);
            reachableTargets.forEach(target => {
              const targetNode = currentStateStore.nodes.find(n => n.id === target.nodeId);
              if (!targetNode) return;

              const currentPinStates = targetNode.data?.pinStates || {};
              const pinKey = `pin_${target.pinName}`;

              console.log(`[CIRCUIT LED] Updating ${target.nodeId} pin ${pinKey} to ${isHigh ? 'HIGH' : 'LOW'}`);

              if (currentPinStates[pinKey] !== isHigh) {
                const updates: any = {
                  pinStates: { ...currentPinStates, [pinKey]: isHigh }
                };

                const intensity = isHigh ? 1.0 : 0.0;

                if (target.type === 'led') {
                  updates.brightness = intensity;
                  updates.value = isHigh;  // LED requires both brightness AND value to glow
                  console.log(`[CIRCUIT LED] Setting LED brightness to ${intensity}, value to ${isHigh}`);
                }
                else if (target.type === 'rgb-led') updates[`intensity_${target.pinName}`] = intensity;
                else if (target.type === 'buzzer') {
                  updates.intensity = intensity;
                  updates.hasSignal = isHigh;
                }

                updates.damaged = false;
                console.log(`[CIRCUIT LED] Calling updateNodeData for ${target.nodeId}:`, updates);
                updateNodeData(target.nodeId, updates);
              } else {
                console.log(`[CIRCUIT LED] Pin state unchanged, skipping update`);
              }
            });
          }

          // 2. Specialized Peripheral Emulation (Servo, LCD, etc. - keep original logic for these)
          const peripheralNode = currentStateStore.nodes.find(n => n.id === peripheralId);

          if (peripheralNode) {
            // ... (rest of the specialized logic for HC-SR04, Servo, LCD, DHT)
            // Note: We only keep the physics simulation here. 
            // The pin state update for these complex peripherals is handled below.

            // Emulate HC-SR04 Hardware Physics
            if (peripheralNode.data?.type === 'hc-sr04' && peripheralPinName === 'TRIG') {
              if (isHigh) {
                trigStartCycles = simulationRunner.getCycles();
              } else {
                const distStr = peripheralNode.data?.sensorValues?.distance;
                const distParam = distStr !== undefined ? parseFloat(distStr) : 100;
                const echoPulseUs = distParam * 58;

                const echoWire = currentStateStore.edges.find(e =>
                  (e.source === peripheralId && (e.sourceHandle === 'ECHO' || e.sourceHandle === 'ECHO__target')) ||
                  (e.target === peripheralId && (e.targetHandle === 'ECHO' || e.targetHandle === 'ECHO__target'))
                );
                if (!echoWire) return;

                const _boardPinName = (echoWire.source === peripheralId ? echoWire.targetHandle : echoWire.sourceHandle)
                  ?.replace(/__target$/, '') ?? '';

                if (isESP32Board) {
                  // ESP32: use setTimeout (no CPU cycles available)
                  const echoMapping = simulationRunner.convertESP32Pin(_boardPinName);
                  if (echoMapping) {
                    setTimeout(() => {
                      simulationRunner.setVirtualInput(echoMapping.avrPin, true);
                      setTimeout(() => {
                        simulationRunner.setVirtualInput(echoMapping.avrPin, false);
                      }, echoPulseUs / 1000); // µs → ms
                    }, 0.5);
                  }
                } else {
                  // AVR: use cycle-accurate scheduleEvent
                  const pulseCycles = simulationRunner.getCycles() - trigStartCycles;
                  const durationUs = pulseCycles / 16;
                  if (durationUs >= 2) {
                    const echoPulseCycles = Math.floor(echoPulseUs * 16);
                    const _echoMapping = simulationRunner.convertArduinoPin(_boardPinName);
                    if (_echoMapping) {
                      simulationRunner.scheduleEvent(500, () => {
                        simulationRunner.setVirtualInput(_echoMapping.avrPin, true);
                        simulationRunner.scheduleEvent(echoPulseCycles, () => {
                          simulationRunner.setVirtualInput(_echoMapping.avrPin, false);
                        });
                      });
                    }
                  }
                }
              }
            }

            // Emulate Servo PWM Physics
            // AVR: measure pulse width in CPU cycles → angle
            // ESP32: servo angle is driven directly by the stub's servoWrite action — skip cycle math
            if (peripheralNode.data?.type === 'servo' && peripheralPinName === 'PWM' && !isESP32Board) {
              if (isHigh) {
                pwmStartCycles = simulationRunner.getCycles();
              } else {
                const pulseCycles = simulationRunner.getCycles() - pwmStartCycles;
                const durationUs = pulseCycles / 16;
                if (durationUs >= 400 && durationUs <= 2600) {
                  const angle = Math.max(0, Math.min(180, ((durationUs - 1000) / 1000) * 180));
                  const currentAngle = peripheralNode.data?.angle ?? 0;
                  if (Math.abs(currentAngle - angle) >= 0.5) {
                    updateNodeData(peripheralId, { angle });
                  }
                }
              }
            }

            // --- LCD Display Emulation (parallel mode only) ---
            if ((peripheralNode.data?.type === 'lcd1602' || peripheralNode.data?.type === 'lcd2004') &&
              peripheralNode.data?.type !== 'lcd1602-i2c' && peripheralNode.data?.type !== 'lcd2004-i2c') {
              const buffer = this.peripheralPinBuffers.get(peripheralId)!;
              const prevE = buffer['E'];
              buffer[peripheralPinName] = isHigh;
              if (prevE === true && isHigh === false && peripheralPinName === 'E') {
                const emulator = this.lcdEmulators.get(peripheralId)!;
                const rs = !!buffer['RS'];
                let data = 0;
                if (buffer['D4']) data |= 0x10;
                if (buffer['D5']) data |= 0x20;
                if (buffer['D6']) data |= 0x40;
                if (buffer['D7']) data |= 0x80;
                emulator.processPulse(rs, data);
                updateNodeData(peripheralId, { lcdState: emulator.getState() });
              }
            }

            // --- 7-Segment Display Emulation ---
            // Segment order in values[]: A=0, B=1, C=2, D=3, E=4, F=5, G=6, DP=7
            // Common-cathode: segment is ON when pin is HIGH.
            if (peripheralNode.data?.type === '7segment') {
              const buffer = this.peripheralPinBuffers.get(peripheralId)!;
              buffer[peripheralPinName] = isHigh;
              console.log(`[7SEG] Pin ${peripheralPinName} = ${isHigh ? 'HIGH' : 'LOW'}, buffer:`, buffer);

              const segOrder = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'DP'];
              const values = segOrder.map(seg => (buffer[seg] ? 1 : 0));
              const currentValues = peripheralNode.data?.segValues;
              console.log(`[7SEG] Computed values:`, values, 'current:', currentValues);
              // Only update if something changed
              if (!currentValues || values.some((v, i) => v !== currentValues[i])) {
                console.log(`[7SEG] Updating node ${peripheralId} with segValues:`, values);
                updateNodeData(peripheralId, { segValues: values });
              }
            }

            // --- DHT Sensor Emulation ---
            if (peripheralNode.data?.type === 'dht22' || peripheralNode.data?.type === 'dht11') {
              if (peripheralPinName === 'SDA' || peripheralPinName === 'DATA') {
                if (!this.dhtEmulators.has(peripheralId)) {
                  // Pass nodeId so the emulator reads from the correct node's sensorValues
                  this.dhtEmulators.set(peripheralId, new DHT(avrPin, peripheralNode.data.type, peripheralId));
                }
                const emulator = this.dhtEmulators.get(peripheralId)!;
                emulator.processSignal(state);
              }
            }

            // --- ILI9341 TFT SPI Display Emulation ---
            // D/C pin controls command vs data mode; CS pin enables/disables the chip.
            if (peripheralNode.data?.type === 'ili9341') {
              const slave = this.ili9341Slaves.get(peripheralId);
              if (slave) {
                if (peripheralPinName === 'D/C') {
                  slave.setDC(isHigh);
                } else if (peripheralPinName === 'CS') {
                  // CS is active-LOW: chip is selected when the pin is LOW
                  slave.setCS(!isHigh);
                }
                // MOSI/SCK are handled by the SPI bus hardware (simulationRunner.SPI.onByte)
              }
            }

            // --- PIR Motion Sensor Emulation ---
            // PIR is a pure INPUT sensor — signal flows from sensor → Arduino, never the reverse.
            // The listener here fires when the AVR writes to Port D (output direction).
            // We must NOT call setVirtualInput here — that would fight against user-injected signals.
            // Initial state injection is handled below, outside this listener, after registration.

            // --- Relay Emulation (KS2E-M-DC5 DPDT) ---
            // COIL1 = signal pin (HIGH = energized), COIL2 = GND reference.
            // When energized: P1↔NO1, P2↔NO2 are closed; P1↔NC1, P2↔NC2 open.
            // When de-energized: P1↔NC1, P2↔NC2 are closed; P1↔NO1, P2↔NO2 open.
            if (peripheralNode.data?.type === 'ks2e-m-dc5') {
              const buf = this.peripheralPinBuffers.get(peripheralId)!;
              buf[peripheralPinName] = isHigh;

              // Coil is energized when COIL1 is HIGH (COIL2 is GND)
              const coil1High = !!buf['COIL1'];
              const wasEnergized = peripheralNode.data?.relayEnergized ?? false;

              if (coil1High !== wasEnergized) {
                console.log(`[RELAY] Node ${peripheralId} — coil ${coil1High ? 'ENERGIZED' : 'DE-ENERGIZED'}`);
                updateNodeData(peripheralId, { relayEnergized: coil1High });

                // Re-propagate signals through the relay contacts
                // Find what is connected to P1 and P2 and route to the active contact
                const relayEdges = currentStateStore.edges.filter(e =>
                  e.source === peripheralId || e.target === peripheralId
                );

                // For each pole (P1, P2), find the signal on P and push it to the active contact
                for (const pole of ['P1', 'P2'] as const) {
                  const suffix = pole === 'P1' ? '1' : '2';
                  const activeContact = coil1High ? `NO${suffix}` : `NC${suffix}`;
                  const inactiveContact = coil1High ? `NC${suffix}` : `NO${suffix}`;

                  // Find the signal level on the pole pin
                  const poleEdge = relayEdges.find(e =>
                    (e.source === peripheralId && e.sourceHandle === pole) ||
                    (e.target === peripheralId && e.targetHandle === pole)
                  );

                  if (poleEdge) {
                    // Trace what's downstream of the active contact
                    const activeTargets = this.traceNet(peripheralId, activeContact);
                    const inactiveTargets = this.traceNet(peripheralId, inactiveContact);

                    // Get the current signal level on the pole from the board
                    const poleSignal = buf[pole] ?? false;

                    // Push signal to newly-active contact targets
                    activeTargets.forEach(target => {
                      const targetNode = currentStateStore.nodes.find(n => n.id === target.nodeId);
                      if (!targetNode) return;
                      const pinStates = { ...(targetNode.data?.pinStates || {}), [`pin_${target.pinName}`]: poleSignal };
                      updateNodeData(target.nodeId, { pinStates, damaged: false });
                    });

                    // Cut signal to newly-inactive contact targets
                    inactiveTargets.forEach(target => {
                      const targetNode = currentStateStore.nodes.find(n => n.id === target.nodeId);
                      if (!targetNode) return;
                      const pinStates = { ...(targetNode.data?.pinStates || {}), [`pin_${target.pinName}`]: false };
                      updateNodeData(target.nodeId, { pinStates, damaged: false });
                    });
                  }
                }
              }
            }

            // --- Stepper Motor Emulation ---
            // Supports both wiring modes:
            //   4-wire (A+, B+, A-, B-) — Arduino Stepper.h / ULN2003
            //   STEP+DIR (A4988 / DRV8825)
            if (peripheralNode.data?.type === 'stepper-motor') {
              if (!this.stepperEmulators.has(peripheralId)) {
                console.log(`[STEPPER] Wiring 4-wire emulator for node ${peripheralId} — pin ${peripheralPinName} ← AVR ${avrPin}`);

                // Check if this motor is also connected to an A4988 (double-wiring issue)
                const { nodes, edges } = useForgeStore.getState();
                const motorToA4988Edges = edges.filter(e => {
                  const srcHandle = (e.sourceHandle || '').replace(/__target$/, '');
                  const tgtHandle = (e.targetHandle || '').replace(/__target$/, '');
                  const isMotorPin = ['A+', 'A-', 'B+', 'B-'].includes(srcHandle) || ['A+', 'A-', 'B+', 'B-'].includes(tgtHandle);
                  return (e.source === peripheralId || e.target === peripheralId) && isMotorPin;
                });

                const a4988Nodes = motorToA4988Edges
                  .map(e => e.source === peripheralId ? e.target : e.source)
                  .map(id => nodes.find(n => n.id === id))
                  .filter(n => n?.data?.type === 'a4988');

                if (a4988Nodes.length > 0) {
                  console.warn(`[STEPPER] WARNING: Motor ${peripheralId} is connected to BOTH:`);
                  console.warn(`[STEPPER]   1. ESP32 pins directly (4-wire mode) - CORRECT for Arduino Stepper library`);
                  console.warn(`[STEPPER]   2. A4988 driver(s): ${a4988Nodes.map(n => n!.id).join(', ')}`);
                  console.warn(`[STEPPER] This creates conflicting control paths. Choose ONE:`);
                  console.warn(`[STEPPER]   Option A: Remove A4988, keep direct wiring, use Arduino Stepper library`);
                  console.warn(`[STEPPER]   Option B: Remove direct wiring, wire ESP32→A4988(STEP/DIR)→Motor, use AccelStepper`);
                }

                let pendingUpdate: { angle: number; stepCount: number; energized: boolean; actualAngle?: number; actualAngleUnbounded?: number } | null = null;
                let rafScheduled = false;
                this.stepperEmulators.set(peripheralId, new StepperEmulator(({ angle, stepCount, energized, actualAngle, actualAngleUnbounded }) => {
                  pendingUpdate = { angle, stepCount, energized, actualAngle, actualAngleUnbounded };
                  if (!rafScheduled) {
                    rafScheduled = true;
                    requestAnimationFrame(() => {
                      rafScheduled = false;
                      if (pendingUpdate) {
                        const { angle: a, stepCount: s, energized: e, actualAngle: smoothAngle, actualAngleUnbounded: smoothUnbounded } = pendingUpdate;
                        pendingUpdate = null;
                        // Use smooth physics angle if available for display
                        const displayAngle = smoothAngle !== undefined ? smoothAngle : a;
                        // Use unbounded smooth angle for CSS transform if available
                        const transformAngle = smoothUnbounded !== undefined ? smoothUnbounded : (s / 200) * 360;
                        updateNodeData(peripheralId, {
                          // For CSS transform, use smooth unbounded angle for realistic motion
                          angle: transformAngle,
                          value: `${transformAngle.toFixed(1)}°`,
                          units: `${s > 0 ? '+' : ''}${s} steps`,
                          arrow: e ? '#BEF264' : '',
                        });
                      }
                    });
                  }
                }, { stepsPerRev: 200 }, peripheralId));
              }
              const stepper = this.stepperEmulators.get(peripheralId)!;
              const buf = this.peripheralPinBuffers.get(peripheralId)!;
              const oldValue = buf[peripheralPinName];
              buf[peripheralPinName] = isHigh;

              if (peripheralPinName === 'STEP') {
                stepper.processStep(isHigh);
              } else if (peripheralPinName === 'DIR') {
                stepper.setDirection(isHigh);
              } else {
                // 4-wire mode — order must match Stepper.h: processCoils(A+, B+, A-, B-)
                // Log only when a coil state actually changes
                if (oldValue !== isHigh) {
                  console.log(`[STEPPER] Coil ${peripheralPinName} changed: ${oldValue ? 'HIGH' : 'LOW'} → ${isHigh ? 'HIGH' : 'LOW'}`);
                  console.log(`[STEPPER] Current coil state: A+=${!!buf['A+']}, B+=${!!buf['B+']}, A-=${!!buf['A-']}, B-=${!!buf['B-']}`);
                }
                stepper.processCoils(
                  !!buf['A+'],
                  !!buf['B+'],
                  !!buf['A-'],
                  !!buf['B-'],
                );
              }
            }

            // --- Biaxial Stepper Emulation ---
            // Two independent 4-wire steppers in one body.
            // Outer shaft: A1+, A1-, B1+, B1-
            // Inner shaft: A2+, A2-, B2+, B2-
            if (peripheralNode.data?.type === 'biaxial-stepper') {
              const buf = this.peripheralPinBuffers.get(peripheralId)!;
              buf[peripheralPinName] = isHigh;

              const outerKey = `${peripheralId}__outer`;
              const innerKey = `${peripheralId}__inner`;

              // Create outer emulator (motor 1)
              if (!this.stepperEmulators.has(outerKey)) {
                console.log(`[BIAXIAL] Wiring outer emulator for node ${peripheralId}`);
                let pending: { angle: number; energized: boolean; actualAngleUnbounded?: number } | null = null;
                let rafPending = false;
                this.stepperEmulators.set(outerKey, new StepperEmulator(({ angle, energized, actualAngleUnbounded }) => {
                  pending = { angle, energized, actualAngleUnbounded };
                  if (!rafPending) {
                    rafPending = true;
                    requestAnimationFrame(() => {
                      rafPending = false;
                      if (pending) {
                        const { angle: a, energized: e, actualAngleUnbounded: smoothAngle } = pending;
                        pending = null;
                        // Use smooth angle if available
                        const displayAngle = smoothAngle !== undefined ? smoothAngle : a;
                        updateNodeData(peripheralId, { outerHandAngle: displayAngle, outerEnergized: e });
                      }
                    });
                  }
                }, { stepsPerRev: 200 }, `${peripheralId}-outer`));
              }

              // Create inner emulator (motor 2)
              if (!this.stepperEmulators.has(innerKey)) {
                console.log(`[BIAXIAL] Wiring inner emulator for node ${peripheralId}`);
                let pending: { angle: number; energized: boolean; actualAngleUnbounded?: number } | null = null;
                let rafPending = false;
                this.stepperEmulators.set(innerKey, new StepperEmulator(({ angle, energized, actualAngleUnbounded }) => {
                  pending = { angle, energized, actualAngleUnbounded };
                  if (!rafPending) {
                    rafPending = true;
                    requestAnimationFrame(() => {
                      rafPending = false;
                      if (pending) {
                        const { angle: a, energized: e, actualAngleUnbounded: smoothAngle } = pending;
                        pending = null;
                        // Use smooth angle if available
                        const displayAngle = smoothAngle !== undefined ? smoothAngle : a;
                        updateNodeData(peripheralId, { innerHandAngle: displayAngle, innerEnergized: e });
                      }
                    });
                  }
                }, { stepsPerRev: 200 }, `${peripheralId}-inner`));
              }

              const outerStepper = this.stepperEmulators.get(outerKey)!;
              const innerStepper = this.stepperEmulators.get(innerKey)!;

              // Route pins to the correct emulator
              // Outer motor coils: A1+, A1-, B1+, B1-
              if (['A1+', 'A1-', 'B1+', 'B1-'].includes(peripheralPinName)) {
                outerStepper.processCoils(
                  !!buf['A1+'],
                  !!buf['B1+'],
                  !!buf['A1-'],
                  !!buf['B1-'],
                );
              }
              // Inner motor coils: A2+, A2-, B2+, B2-
              if (['A2+', 'A2-', 'B2+', 'B2-'].includes(peripheralPinName)) {
                innerStepper.processCoils(
                  !!buf['A2+'],
                  !!buf['B2+'],
                  !!buf['A2-'],
                  !!buf['B2-'],
                );
              }
            }

            // --- NeoPixel Emulation (WS2812B protocol) ---
            // Handled via addRawListener above — every edge is captured without deduplication.

            // --- A4988 Stepper Driver Emulation ---
            // Bridges STEP/DIR from Arduino to the stepper motor connected on 1A/1B/2A/2B
            if (peripheralNode.data?.type === 'a4988') {
              const buf = this.peripheralPinBuffers.get(peripheralId)!;
              // Skip buffer update for FLOATING state — preserves A4988 hardware
              // default pin states (RESET=HIGH via pull-up, SLEEP=HIGH via pull-up,
              // ENABLE=LOW via pull-down). The initial addListener() call fires with
              // FLOATING before any real signal arrives, which would incorrectly
              // overwrite these defaults and disable the driver.
              if (state === 'FLOATING') return;
              buf[peripheralPinName] = isHigh;

              // Debug: Log all pin changes to diagnose wiring issues
              if (!this.a4988DebugLogged) {
                this.a4988DebugLogged = true;
                console.log(`[A4988 DEBUG] First pin change detected: ${peripheralPinName} = ${isHigh ? 'HIGH' : 'LOW'}`);
                console.log(`[A4988 DEBUG] A4988 node ID: ${peripheralId}`);

                // Check if user is trying to use 4-wire mode with A4988
                const { edges } = useForgeStore.getState();
                const inputEdges = edges.filter(e => {
                  const srcHandle = (e.sourceHandle || '').replace(/__target$/, '');
                  const tgtHandle = (e.targetHandle || '').replace(/__target$/, '');
                  return (e.target === peripheralId && ['STEP', 'DIR'].includes(tgtHandle)) ||
                    (e.source === peripheralId && ['STEP', 'DIR'].includes(srcHandle));
                });

                if (inputEdges.length === 0) {
                  console.error(`[A4988 ERROR] No STEP/DIR pins connected to A4988!`);
                  console.error(`[A4988 ERROR] The A4988 driver requires STEP and DIR signals from your microcontroller.`);
                  console.error(`[A4988 ERROR] If you're using Arduino's Stepper library in 4-wire mode, you have two options:`);
                  console.error(`[A4988 ERROR]   1. Remove the A4988 and wire ESP32 pins directly to the stepper motor`);
                  console.error(`[A4988 ERROR]   2. Change your code to use AccelStepper library with STEP/DIR mode`);
                } else {
                  console.log(`[A4988 DEBUG] STEP/DIR pins properly connected: ${inputEdges.length} edges`);
                }
              }

              // Handle control pins: ENABLE, RESET, SLEEP, MS1, MS2, MS3, STEP, DIR
              // Update A4988 element UI state for all pins
              {
                const currentPinStates = peripheralNode.data?.pinStates || {};
                updateNodeData(peripheralId, {
                  pinStates: {
                    ...currentPinStates,
                    [`pin_${peripheralPinName}`]: isHigh
                  }
                });
              }

              if (peripheralPinName === 'STEP' || peripheralPinName === 'DIR') {

                // Find the stepper motor connected to this A4988's motor pins (1A/1B/2A/2B)
                // Cache the result to avoid filtering edges on every pin change (performance optimization)
                let cached = this.a4988MotorCache.get(peripheralId);

                if (!cached) {
                  // First time - find and cache the motor connection
                  const motorEdges = currentStateStore.edges.filter(e => {
                    const srcHandle = (e.sourceHandle || '').replace(/__target$/, '');
                    const tgtHandle = (e.targetHandle || '').replace(/__target$/, '');
                    return (e.source === peripheralId && ['1A', '1B', '2A', '2B'].includes(srcHandle)) ||
                      (e.target === peripheralId && ['1A', '1B', '2A', '2B'].includes(tgtHandle));
                  });

                  if (motorEdges.length === 0) {
                    console.warn(`[A4988] No motor edges found for A4988 node ${peripheralId}. Wire 1A/1B/2A/2B to a stepper motor.`);
                    cached = { motorId: null, edges: [] };
                  } else {
                    console.log(`[A4988] Motor edges found: ${motorEdges.length} connections`);
                    const motorId = motorEdges[0].source === peripheralId ? motorEdges[0].target : motorEdges[0].source;
                    cached = { motorId, edges: motorEdges };
                  }

                  // Cache the result
                  this.a4988MotorCache.set(peripheralId, cached);
                }

                const motorNodeId = cached.motorId;
                const motorEdges = cached.edges;

                if (motorNodeId) {
                  const motorNode = currentStateStore.nodes.find(n => n.id === motorNodeId);
                  const isBiaxial = motorNode?.data?.type === 'biaxial-stepper';

                  // Check if driver is enabled per Wokwi A4988 spec:
                  //   ENABLE is active-low (default pulled-down → LOW = enabled)
                  //   RESET  is active-low (default floating → treat as HIGH = not in reset)
                  //   SLEEP  is active-low (default pulled-up → HIGH = awake)
                  // Note: undefined means pin not connected, use default state
                  const enableLow = buf['ENABLE'] !== true; // LOW or undefined = enabled
                  const resetHigh = buf['RESET'] !== false; // HIGH or undefined = not in reset
                  const sleepHigh = buf['SLEEP'] !== false; // HIGH or undefined = awake
                  const driverEnabled = enableLow && resetHigh && sleepHigh;

                  if (!driverEnabled) {
                    // Driver is disabled, motor should not move
                    if (!this.a4988DebugLogged) {
                      console.warn(`[A4988] Driver disabled! Motor will not move. Check ENABLE/RESET/SLEEP pins.`);
                      console.warn(`[A4988] State: ENABLE=${buf['ENABLE']}, RESET=${buf['RESET']}, SLEEP=${buf['SLEEP']}`);
                      this.a4988DebugLogged = true;
                    }
                    return;
                  }

                  // Determine microstepping mode from MS1/MS2/MS3 pins
                  const ms1 = !!buf['MS1'];
                  const ms2 = !!buf['MS2'];
                  const ms3 = !!buf['MS3'];
                  let microstepDivisor = 1;
                  let steppingMode: SteppingMode = 'full';

                  if (!ms1 && !ms2 && !ms3) {
                    microstepDivisor = 1;
                    steppingMode = 'full';
                  } else if (ms1 && !ms2 && !ms3) {
                    microstepDivisor = 2;
                    steppingMode = 'half';
                  } else if (!ms1 && ms2 && !ms3) {
                    microstepDivisor = 4;
                    steppingMode = 'micro';
                  } else if (ms1 && ms2 && !ms3) {
                    microstepDivisor = 8;
                    steppingMode = 'micro';
                  } else if (ms1 && ms2 && ms3) {
                    microstepDivisor = 16;
                    steppingMode = 'micro';
                  }

                  if (isBiaxial) {
                    // Determine which shaft this A4988 drives by inspecting which biaxial pins are wired.
                    // motorEdges are edges between the A4988 (peripheralId) and the biaxial motor (motorNodeId).
                    // We need the biaxial motor's pin handles to determine inner vs outer shaft.
                    const connectedBiaxialPins = motorEdges.map(e =>
                      e.source === motorNodeId ? e.sourceHandle : e.targetHandle
                    );
                    const isInner = connectedBiaxialPins.some(p => {
                      const h = (p || '').replace(/__target$/, '');
                      return ['A2+', 'A2-', 'B2+', 'B2-'].includes(h);
                    });
                    const shaftKey = isInner ? `${motorNodeId}__inner` : `${motorNodeId}__outer`;
                    const shaftLabel = isInner ? 'inner' : 'outer';

                    if (!this.stepperEmulators.has(shaftKey)) {
                      console.log(`[BIAXIAL] Wiring A4988 STEP/DIR emulator for ${shaftLabel} shaft of node ${motorNodeId}`);
                      let pending: { angle: number; energized: boolean; actualAngleUnbounded?: number } | null = null;
                      let rafPending = false;
                      this.stepperEmulators.set(shaftKey, new StepperEmulator(({ angle, energized, actualAngleUnbounded }) => {
                        pending = { angle, energized, actualAngleUnbounded };
                        if (!rafPending) {
                          rafPending = true;
                          requestAnimationFrame(() => {
                            rafPending = false;
                            if (pending) {
                              const { angle: a, energized: e, actualAngleUnbounded: smoothAngle } = pending;
                              pending = null;
                              const prop = isInner ? 'innerHandAngle' : 'outerHandAngle';
                              const energizedProp = isInner ? 'innerEnergized' : 'outerEnergized';
                              // Use smooth angle if available
                              const displayAngle = smoothAngle !== undefined ? smoothAngle : a;
                              updateNodeData(motorNodeId, { [prop]: displayAngle, [energizedProp]: e });
                            }
                          });
                        }
                      }, { stepsPerRev: 200, steppingMode, microstepDivisor }, `${motorNodeId}-${shaftLabel}`));
                    }
                    const stepper = this.stepperEmulators.get(shaftKey)!;
                    // Update microstepping mode dynamically
                    stepper.setSteppingMode(steppingMode, microstepDivisor);
                    if (peripheralPinName === 'DIR') {
                      stepper.setDirection(isHigh);
                    } else if (peripheralPinName === 'STEP') {
                      stepper.processStep(isHigh);
                    }
                  } else {
                    // Standard single stepper motor
                    if (!this.stepperEmulators.has(motorNodeId)) {
                      console.log(`[STEPPER] Wiring A4988 STEP/DIR emulator for motor node ${motorNodeId}`);
                      let pendingUpdate: { angle: number; stepCount: number; energized: boolean; actualAngle?: number; actualAngleUnbounded?: number } | null = null;
                      let rafScheduled = false;
                      this.stepperEmulators.set(motorNodeId, new StepperEmulator(({ angle, stepCount, energized, actualAngle, actualAngleUnbounded }) => {
                        pendingUpdate = { angle, stepCount, energized, actualAngle, actualAngleUnbounded };
                        if (!rafScheduled) {
                          rafScheduled = true;
                          requestAnimationFrame(() => {
                            rafScheduled = false;
                            if (pendingUpdate) {
                              const { angle: a, stepCount: s, energized: e, actualAngle: smoothAngle, actualAngleUnbounded: smoothUnbounded } = pendingUpdate;
                              pendingUpdate = null;
                              // Use smooth physics angle if available for display
                              const displayAngle = smoothAngle !== undefined ? smoothAngle : a;
                              // Use unbounded smooth angle for CSS transform if available
                              const transformAngle = smoothUnbounded !== undefined ? smoothUnbounded : (s / 200) * 360;
                              updateNodeData(motorNodeId, {
                                // Keep rotation cumulative/unbounded for correct CW/CCW animation with smooth physics
                                angle: transformAngle,
                                value: `${displayAngle.toFixed(1)}°`,
                                units: `${s > 0 ? '+' : ''}${s} steps`,
                                arrow: e ? '#BEF264' : '',
                              });
                            }
                          });
                        }
                      }, { stepsPerRev: 200, steppingMode, microstepDivisor }, motorNodeId));
                    }
                    const stepper = this.stepperEmulators.get(motorNodeId)!;
                    // Update microstepping mode dynamically
                    stepper.setSteppingMode(steppingMode, microstepDivisor);
                    if (peripheralPinName === 'DIR') {
                      stepper.setDirection(isHigh);
                    } else if (peripheralPinName === 'STEP') {
                      stepper.processStep(isHigh);
                    }
                  }
                }
              }
            }

            // Update the target peripheral's UI state so standard Leap Elements react
            // Skip for complex peripherals that manage their own state
            if (!isComplexPeripheral) {
              const currentPinStates = peripheralNode.data?.pinStates || {};
              if (currentPinStates[`pin_${peripheralPinName}`] !== isHigh) {
                updateNodeData(peripheralId, {
                  pinStates: {
                    ...currentPinStates,
                    [`pin_${peripheralPinName}`]: isHigh
                  }
                });
              }
            }
          }
        };

        // Attach to the simulation runner
        // ── AVR path ──────────────────────────────────────────────────────────
        simulationRunner.addListener(avrPin, listener);

        // Log 7-segment listener registration
        const pType = nodes.find(n => n.id === peripheralId)?.data?.type;
        if (pType === '7segment') {
          console.log(`[CIRCUIT 7SEG] Registered listener for ${avrPin} → peripheral pin ${peripheralPinName}`);
        }

        // For NeoPixel DIN pins: also attach a RAW listener that fires on every edge
        // (WS2812B protocol requires every HIGH/LOW transition, dedup breaks it)
        let neoRawListener: ((portLetter: string, bit: number, isHigh: boolean, cycles: number) => void) | null = null;
        const peripheralNodeForNeo = nodes.find(n => n.id === peripheralId);
        if (
          peripheralNodeForNeo &&
          ['neopixel', 'neopixel-matrix', 'led-ring'].includes(peripheralNodeForNeo.data?.type) &&
          peripheralPinName === 'DIN'
        ) {
          const neoType = peripheralNodeForNeo.data.type;
          const numPixels = neoType === 'neopixel' ? 1
            : neoType === 'led-ring' ? (peripheralNodeForNeo.data?.pixels ?? 16)
              : (peripheralNodeForNeo.data?.rows ?? 8) * (peripheralNodeForNeo.data?.cols ?? 8);

          const emitter = new NeoPixelEmulator(numPixels, 16, (pixels) => {
            if (neoType === 'neopixel' && pixels.length > 0) {
              updateNodeData(peripheralId, {
                neopixelR: pixels[0].r / 255,
                neopixelG: pixels[0].g / 255,
                neopixelB: pixels[0].b / 255,
              });
            } else {
              updateNodeData(peripheralId, { neopixelPixels: pixels });
            }
          });
          this.neoPixelEmulators.set(peripheralId, emitter);

          neoRawListener = (_portLetter, _bit, isHigh, cycles) => {
            emitter.processSignal(isHigh, cycles);
          };
          simulationRunner.addRawListener(avrPin, neoRawListener);
        }

        // Store the unsubscribe thunk to clean up if the wire is deleted
        this.activeSubscriptions.set(edge.id, () => {
          simulationRunner.removeListener(avrPin, listener);
          if (neoRawListener) simulationRunner.removeRawListener(avrPin, neoRawListener);
        });

        // PIR: inject the initial pin state once after the AVR has had a chance to
        // run setup() and configure DDR. We defer by one event-loop turn so the
        // AVR tick loop starts first and the sketch's pinMode() runs before we set
        // the external pin value.
        const peripheralNodeForPIR = nodes.find(n => n.id === peripheralId);
        if (
          peripheralNodeForPIR?.data?.type === 'pir-motion-sensor' &&
          peripheralPinName === 'OUT'
        ) {
          const initialMotion = peripheralNodeForPIR.data?.sensorValues?.motionDetected ?? false;
          // Delay 200ms — enough for setup() to run and configure pinMode
          setTimeout(() => {
            simulationRunner.setVirtualInput(avrPin, initialMotion);
            console.log(`[FORGE CIRCUIT] PIR (${peripheralId}) initial state injected: ${initialMotion ? 'HIGH' : 'LOW'} on ${avrPin}`);
          }, 200);
        }
      });
    });
  }

  /**
   * Push live MPU6050 sensor values from the SensorOverlay sliders into the I2C emulator.
   * Called whenever any slider changes.
   */
  public pushMPU6050Values(nodeId: string, values: {
    accelX: number; accelY: number; accelZ: number;
    gyroX: number; gyroY: number; gyroZ: number;
    temp: number;
  }) {
    const slave = this.mpu6050Slaves.get(nodeId);
    if (slave) {
      slave.setSensorValues(values);
    }
  }

  /**
   * Push a key press/release into the membrane keypad emulator.
   * Called by LeapNode when it receives 'button-press' / 'button-release' events.
   */
  public pushKeypadKey(nodeId: string, key: string | null) {
    const emulator = this.keypadEmulators.get(nodeId);
    if (emulator) {
      emulator.pressKey(key);
    }
    // Persist pressed key in node data so transpiled sketch can read it
    const { updateNodeData } = useForgeStore.getState();
    updateNodeData(nodeId, { pressedKey: key });
    console.log(`[FORGE CIRCUIT] Keypad (${nodeId}) key ${key ?? 'released'}`);
  }

  /**
   * Push a dial digit into the rotary-dialer emulator.
   * Called by LeapNode when it receives 'dial-start' events.
   */
  public pushRotaryDialerDigit(nodeId: string, digit: number) {
    const emulator = this.rotaryDialerEmulators.get(nodeId);
    if (emulator) {
      emulator.dial(digit);
    }
    console.log(`[FORGE CIRCUIT] Rotary Dialer (${nodeId}) digit ${digit}`);
  }

  /**
   * Toggle the tilt switch state.
   * Called by LeapNode when it receives 'tilt-toggle' events.
   */
  public pushTiltSwitchState(nodeId: string, tilted: boolean) {
    const emulator = this.tiltSwitchEmulators.get(nodeId);
    if (emulator) {
      emulator.setTilted(tilted);
    }
    // Persist tilt state in node data for UI visualization
    const { updateNodeData } = useForgeStore.getState();
    updateNodeData(nodeId, {
      sensorValues: { tilted }
    });
    console.log(`[FORGE CIRCUIT] Tilt Switch (${nodeId}) state: ${tilted ? 'TILTED' : 'UPRIGHT'}`);
  }

  /**
   * Rotate the KY-040 encoder clockwise.
   * Called by LeapNode when it receives 'rotate-cw' events.
   */
  public pushRotaryEncoderCW(nodeId: string) {
    const emulator = this.rotaryEncoderEmulators.get(nodeId);
    if (emulator) {
      emulator.stepCW();
    }
    console.log(`[FORGE CIRCUIT] Rotary Encoder (${nodeId}) rotated CW`);
  }

  /**
   * Rotate the KY-040 encoder counter-clockwise.
   * Called by LeapNode when it receives 'rotate-ccw' events.
   */
  public pushRotaryEncoderCCW(nodeId: string) {
    const emulator = this.rotaryEncoderEmulators.get(nodeId);
    if (emulator) {
      emulator.stepCCW();
    }
    console.log(`[FORGE CIRCUIT] Rotary Encoder (${nodeId}) rotated CCW`);
  }

  /**
   * Update slide switch state (SPDT behavior).
   * Called by LeapNode when it receives 'input' events from the slide switch.
   * 
   * SPDT Logic:
   * - Pin 1 (COM) is always the common terminal
   * - When value=0 (OFF): Pin 1 connects to Pin 3 (NC - Normally Closed)
   * - When value=1 (ON):  Pin 1 connects to Pin 2 (NO - Normally Open)
   */
  public pushSlideSwitchState(nodeId: string, value: number) {
    const { updateNodeData, edges, nodes } = useForgeStore.getState();
    const switchNode = nodes.find(n => n.id === nodeId);
    if (!switchNode) return;

    // Update node data for UI
    updateNodeData(nodeId, { value });

    console.log(`[SLIDE SWITCH] Node ${nodeId} state: ${value ? 'ON (COM→NO)' : 'OFF (COM→NC)'}`);

    // Find wires connected to each pin
    const getConnectedWire = (pinName: string) => {
      return edges.find(e => {
        const srcMatch = e.source === nodeId && (e.sourceHandle === pinName || e.sourceHandle === `${pinName}__target`);
        const tgtMatch = e.target === nodeId && (e.targetHandle === pinName || e.targetHandle === `${pinName}__target`);
        return srcMatch || tgtMatch;
      });
    };

    const wire1 = getConnectedWire('1'); // COM
    const wire2 = getConnectedWire('2'); // NO
    const wire3 = getConnectedWire('3'); // NC

    if (!wire1) {
      console.warn(`[SLIDE SWITCH] Pin 1 (COM) not connected - switch has no effect`);
      return;
    }

    // Get the board pin connected to COM
    const comBoardPin = (wire1.source === nodeId ? wire1.targetHandle : wire1.sourceHandle) || '';
    const comBoardNodeId = wire1.source === nodeId ? wire1.target : wire1.source;
    const cleanComBoardPin = comBoardPin.replace(/__target$/, '');

    // Check if COM is connected to power (5V, 3.3V, VCC) or GND
    const comNode = nodes.find(n => n.id === comBoardNodeId);
    const comPinUpper = cleanComBoardPin.toUpperCase();
    const isComPower = comPinUpper.includes('5V') || comPinUpper.includes('3V3') || comPinUpper.includes('VCC') || comPinUpper.includes('3.3V');
    const isComGND = comPinUpper.includes('GND');

    // Determine the signal level based on COM connection
    let activeSignal = false;
    let inactiveSignal = false;

    if (isComPower) {
      // COM connected to power → active pin gets HIGH, inactive gets LOW (floating/disconnected)
      activeSignal = true;
      inactiveSignal = false;
      console.log(`[SLIDE SWITCH] COM connected to power`);
    } else if (isComGND) {
      // COM connected to GND → active pin gets LOW, inactive gets HIGH (floating/pulled up)
      activeSignal = false;
      inactiveSignal = true;
      console.log(`[SLIDE SWITCH] COM connected to GND`);
    } else {
      // COM connected to Arduino pin → assume it's being driven HIGH
      activeSignal = true;
      inactiveSignal = false;
      console.log(`[SLIDE SWITCH] COM connected to Arduino pin (assumed HIGH)`);
    }

    // Inject signals to BOTH pins (active and inactive)
    // This ensures the inactive pin is properly disconnected
    if (value === 1) {
      // Switch ON: Pin 2 (NO) is active, Pin 3 (NC) is inactive
      if (wire2) {
        this.pushInputSignal(nodeId, '2', activeSignal);
        console.log(`[SLIDE SWITCH] Pin 2 (NO) = ${activeSignal ? 'HIGH' : 'LOW'} (ACTIVE)`);
      }
      if (wire3) {
        this.pushInputSignal(nodeId, '3', inactiveSignal);
        console.log(`[SLIDE SWITCH] Pin 3 (NC) = ${inactiveSignal ? 'HIGH' : 'LOW'} (INACTIVE)`);
      }
    } else {
      // Switch OFF: Pin 3 (NC) is active, Pin 2 (NO) is inactive
      if (wire3) {
        this.pushInputSignal(nodeId, '3', activeSignal);
        console.log(`[SLIDE SWITCH] Pin 3 (NC) = ${activeSignal ? 'HIGH' : 'LOW'} (ACTIVE)`);
      }
      if (wire2) {
        this.pushInputSignal(nodeId, '2', inactiveSignal);
        console.log(`[SLIDE SWITCH] Pin 2 (NO) = ${inactiveSignal ? 'HIGH' : 'LOW'} (INACTIVE)`);
      }
    }
  }

  /**
   * Push analog values from analog-joystick into CircuitEngine.
   */
  public pushJoystickAnalog(nodeId: string, x: number, y: number) {
    const { updateNodeData, nodes } = useForgeStore.getState();
    const peripheralNode = nodes.find(n => n.id === nodeId);
    if (!peripheralNode) return;

    updateNodeData(nodeId, {
      sensorValues: { ...peripheralNode.data?.sensorValues, xValue: x, yValue: y }
    });

    // We trigger pushInputSignal, passing false for digital isHigh since it's analog
    this.pushInputSignal(nodeId, 'HORZ', false);
    this.pushInputSignal(nodeId, 'VERT', false);
  }

  /**
   * Called by interactive UI nodes (e.g. Buttons, PIR sensors) to push signals backwards into the board.
   * Handles both AVR (Arduino) and ESP32 boards.
   */
  public pushInputSignal(nodeId: string, pinName: string, isHigh: boolean) {
    console.log(`[FORGE CIRCUIT] Peripheral Node ${nodeId} requesting inject on pin ${pinName} to ${isHigh ? 'HIGH' : 'LOW'}`);
    const { edges, nodes } = useForgeStore.getState();

    const wire = edges.find(e => {
      const srcMatch = e.source === nodeId &&
        (e.sourceHandle === pinName || e.sourceHandle === `${pinName}__target`);
      const tgtMatch = e.target === nodeId &&
        (e.targetHandle === pinName || e.targetHandle === `${pinName}__target`);
      return srcMatch || tgtMatch;
    });

    if (!wire) {
      console.warn(`[FORGE CIRCUIT] Input: no wire found for node ${nodeId} pin ${pinName}`);
      return;
    }

    const boardNodeId = wire.source === nodeId ? wire.target : wire.source;
    const boardPinName = wire.source === nodeId ? wire.targetHandle : wire.sourceHandle;
    if (!boardPinName) return;

    const boardNode = nodes.find(n => n.id === boardNodeId);
    if (!boardNode) return;

    const cleanBoardPin = boardPinName.replace(/__target$/, '');
    const isESP32 = boardNode.data?.type === 'esp32-c3';

    // ── ESP32 path ────────────────────────────────────────────────────────
    if (isESP32) {
      const peripheralNode = nodes.find(n => n.id === nodeId);
      const pType = peripheralNode?.data?.type;
      const sv = peripheralNode?.data?.sensorValues;

      // Use full ESP32 pin map (handles D{n}, VP, VN, ADC pins etc.)
      const esp32Mapping = simulationRunner.convertESP32Pin(cleanBoardPin);
      if (!esp32Mapping) return; // power/GND pin — skip

      const gpioNum = parseInt(esp32Mapping.avrPin.replace('ESP', ''), 10);

      // Analog sensors → inject voltage into ESP32 ADC (3.3V reference)
      const analogSensors = [
        'potentiometer', 'slide-potentiometer', 'mq2',
        'ntc-temperature-sensor', 'photoresistor-sensor', 'flame-sensor',
        'gas-sensor', 'big-sound-sensor', 'small-sound-sensor', 'photoresistor',
        'heart-beat-sensor',
      ];

      // Digital-only sensors that should never use analog path
      const digitalOnlySensors = [
        'tilt-switch', 'push-button', 'pushbutton-6mm', 'slide-switch',
        'dip-switch-8', 'pir-motion-sensor', 'membrane-keypad', 'rotary-dialer',
        'ky-040'  // KY-040 rotary encoder (CLK, DT, SW are all digital)
      ];

      // Only use analog path if it's an analog sensor AND not a digital-only sensor
      if (analogSensors.includes(pType) && !digitalOnlySensors.includes(pType)) {
        const voltage = this.computeSensorVoltage(pType, sv, 3.3, pinName);

        // ESP32-C3 RISC-V path
        if (simulationRunner.isESP32C3Board && esp32Mapping.adcChannel !== undefined) {
          const gpioNum = parseInt(esp32Mapping.avrPin.replace('ESP', ''), 10);
          simulationRunner.setESP32C3AnalogInput(gpioNum, voltage);
        }
        else {
          // Non-ESP32-C3 board: update pin state map so listeners fire
          simulationRunner.setVirtualInput(esp32Mapping.avrPin, voltage > 0.1);
        }
        console.log(`[FORGE CIRCUIT] ESP32 Analog: ${esp32Mapping.avrPin} = ${voltage.toFixed(3)}V (${pType})`);

        // Also inject threshold digital output pins (DO/DOUT) for dual-output sensors
        const injectESP32Threshold = (pinHandle: string, high: boolean, label: string) => {
          const w = edges.find(e => {
            const s = e.source === nodeId && (e.sourceHandle === pinHandle || e.sourceHandle === `${pinHandle}__target`);
            const t = e.target === nodeId && (e.targetHandle === pinHandle || e.targetHandle === `${pinHandle}__target`);
            return s || t;
          });
          if (!w) return;
          const bp = ((w.source === nodeId ? w.targetHandle : w.sourceHandle) ?? '').replace(/__target$/, '');
          const m = simulationRunner.convertESP32Pin(bp);
          if (m) { simulationRunner.setVirtualInput(m.avrPin, high); console.log(`[FORGE CIRCUIT] ESP32 ${label}: ${m.avrPin} = ${high ? 'HIGH' : 'LOW'}`); }
        };

        if (pType === 'photoresistor-sensor') {
          injectESP32Threshold('DO', (sv?.value ?? 500) >= (sv?.threshold ?? 500), 'LDR DO');
        } else if (pType === 'gas-sensor') {
          injectESP32Threshold('DOUT', (sv?.value ?? 0) <= (sv?.threshold ?? 50), 'Gas DOUT');
        } else if (pType === 'flame-sensor') {
          injectESP32Threshold('DOUT', (sv?.value ?? 0) <= (sv?.threshold ?? 50), 'Flame DOUT');
        } else if (pType === 'big-sound-sensor' || pType === 'small-sound-sensor') {
          injectESP32Threshold('DOUT', (sv?.value ?? 0) > (sv?.threshold ?? 50), 'Sound DOUT');
        }
        return;
      }

      // Digital sensors → inject HIGH/LOW
      simulationRunner.setVirtualInput(esp32Mapping.avrPin, isHigh);
      console.log(`[FORGE CIRCUIT] ESP32 Digital: ${esp32Mapping.avrPin} = ${isHigh ? 'HIGH' : 'LOW'}`);
      return;
    }

    // ── AVR path — now unified via convertPin ────────────────────────────
    const mapping = simulationRunner.convertPin(cleanBoardPin, false);
    if (mapping) {
      if (mapping.adcChannel !== undefined || mapping.avrPin.startsWith('ESP')) {
        // --- Analog Mapping ---
        const peripheralNode = nodes.find(n => n.id === nodeId);
        const pType = peripheralNode?.data?.type;
        const sv = peripheralNode?.data?.sensorValues;

        // Use shared voltage computation (5V for AVR)
        const voltage = this.computeSensorVoltage(pType, sv, 5.0, pinName);

        simulationRunner.setAnalogInput(mapping.adcChannel!, voltage);
        console.log(`[FORGE CIRCUIT] Analog Signal: Peripheral[${nodeId}] pin ${pinName} -> ${voltage.toFixed(3)}V on ADC ch${mapping.adcChannel}`);

        // Helper: inject a digital threshold output pin (DO/DOUT) for dual-output sensors
        const injectThresholdPin = (pinHandle: string, isHigh: boolean, label: string) => {
          const wire = edges.find(e => {
            const s = e.source === nodeId && (e.sourceHandle === pinHandle || e.sourceHandle === `${pinHandle}__target`);
            const t = e.target === nodeId && (e.targetHandle === pinHandle || e.targetHandle === `${pinHandle}__target`);
            return s || t;
          });
          if (!wire) return;
          const boardPin = ((wire.source === nodeId ? wire.targetHandle : wire.sourceHandle) ?? '').replace(/__target$/, '');
          const m = simulationRunner.convertPin(boardPin, isESP32);
          if (m && m.adcChannel === undefined) {
            simulationRunner.setVirtualInput(m.avrPin, isHigh);
            console.log(`[FORGE CIRCUIT] ${label}: ${isHigh ? 'HIGH' : 'LOW'} on ${m.avrPin}`);
          }
        };

        if (pType === 'photoresistor-sensor') {
          injectThresholdPin('DO', (sv?.value ?? 500) >= (sv?.threshold ?? 500), 'LDR DO');
        }
        if (pType === 'gas-sensor') {
          injectThresholdPin('DOUT', (sv?.value ?? 0) <= (sv?.threshold ?? 50), 'Gas DOUT');
        }
        if (pType === 'flame-sensor') {
          injectThresholdPin('DOUT', (sv?.value ?? 0) <= (sv?.threshold ?? 50), 'Flame DOUT');
        }
        if (pType === 'big-sound-sensor' || pType === 'small-sound-sensor') {
          injectThresholdPin('DOUT', (sv?.value ?? 0) <= (sv?.threshold ?? 50), 'Sound DOUT');
        }
      } else {
        // --- Digital Mapping ---
        simulationRunner.setVirtualInput(mapping.avrPin, isHigh);
        console.log(`[FORGE CIRCUIT] Digital Signal: Peripheral[${nodeId}] pin ${pinName} -> ${isHigh ? 'HIGH' : 'LOW'} on ${mapping.avrPin}`);
      }
    } else {
      console.warn(`[FORGE CIRCUIT] pushInputSignal: could not map board pin '${cleanBoardPin}' to pin`);
    }
  }

  /**
   * Compute the analog output voltage for a sensor given its type and current sensorValues.
   * vcc: supply voltage (5.0 for Arduino, 3.3 for ESP32)
   */
  private computeSensorVoltage(pType: string, sv: any, vcc = 5.0, pinName?: string): number {
    switch (pType) {
      case 'potentiometer':
      case 'slide-potentiometer': {
        // Potentiometer value is 0-100 (percentage)
        // Map to 0..VCC voltage
        const percentage = sv?.value ?? 0;
        return (percentage / 100) * vcc;
      }
      case 'mq2': {
        // MQ2 gas sensor value is 0-1023 (raw ADC)
        // Map to 0..VCC voltage
        const rawValue = sv?.value ?? 0;
        return (rawValue / 1023) * vcc;
      }
      case 'analog-joystick': {
        const x = sv?.xValue ?? 0;
        const y = sv?.yValue ?? 0;
        // x and y from element are -1 to 1.
        // Map to 0..VCC, centered at VCC/2.
        const val = pinName === 'HORZ' ? x : (pinName === 'VERT' ? y : 0);
        return (vcc / 2) + (val * (vcc / 2));
      }
      case 'ntc-temperature-sensor': {
        const tempC = sv?.value ?? 25;
        const R0 = 10000, B = 3950, T0 = 298.15, Rs = 10000;
        const T = tempC + 273.15;
        const R_ntc = R0 * Math.exp(B * (1 / T - 1 / T0));
        return vcc * R_ntc / (Rs + R_ntc);
      }
      case 'photoresistor-sensor':
      case 'photoresistor': {
        const lux = sv?.value ?? 500;
        const R_ldr = 500000 / Math.max(1, lux);
        return vcc * 10000 / (R_ldr + 10000);
      }
      case 'flame-sensor': {
        const intensity = sv?.value ?? 0;
        return vcc * (1 - Math.max(0, Math.min(100, intensity)) / 100);
      }
      case 'gas-sensor': {
        const concentration = sv?.value ?? 0;
        return vcc * Math.max(0, Math.min(100, concentration)) / 100;
      }
      case 'big-sound-sensor':
      case 'small-sound-sensor': {
        const level = sv?.value ?? 0;
        return vcc * Math.max(0, Math.min(100, level)) / 100;
      }
      default: {
        const val = sv?.value ?? 0;
        return val > vcc ? (val / 1023) * vcc : val;
      }
    }
  }
}

export const circuitEngine = new CircuitEngine();
