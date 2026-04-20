/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
/**
 * SimulationRunner - The heart of the circuit simulation.
 * Decouples logic execution from UI rendering.
 * Provides a high-frequency tick loop and pin-state management mapped dynamically to AVR8js.
 */
import { avrInstruction, CPU, AVRTimer, AVRIOPort, AVRUSART, usart0Config, AVRADC, adcConfig, AVRTWI, twiConfig, AVRSPI, spiConfig, AVREEPROM, EEPROMMemoryBackend, AVRWatchdog, watchdogConfig, AVRClock, clockConfig, ATtinyTimer1, attinyTimer1Config, AVRUSI } from '../lib/avr8js';
import { parseHexString } from './HexParser';
import { BLINK_HEX } from './TestSketches';
import { USARTEmulator } from './USARTEmulator';
import { BOARDS, MCUConfig } from './BoardConfig';
import { ESP32Engine, injectStoreRef } from './esp32/ESP32Engine';

/** Board IDs that use the ESP32 engine instead of AVR */
const ESP32_BOARDS = new Set(['esp32', 'esp32-devkit-v1', 'esp32-s2', 'esp32-s3', 'esp32-c3']);

/** TCP proxy URL — override via VITE_TCP_PROXY_URL env var */
const TCP_PROXY_URL =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_TCP_PROXY_URL) ||
  'wss://leapforge-tcp-proxy.railway.app';

export type PinState = 'HIGH' | 'LOW' | 'FLOATING';
export type PinListener = (state: PinState) => void;
export type RawPortListener = (portLetter: string, bit: number, isHigh: boolean, cycles: number) => void;

export interface PinMapping {
  avrPin: string;
  adcChannel?: number;
}

class SimulationRunner {
  private pinStates: Map<string, PinState> = new Map();
  private listeners: Map<string, Set<PinListener>> = new Map();
  private rawPortListeners: Map<string, Set<RawPortListener>> = new Map(); // pin-keyed, fires every edge

  private cpu: CPU | null = null;
  private usart: AVRUSART | null = null;
  private usartEmulator: USARTEmulator | null = null;
  private adc: AVRADC | null = null;
  private twi: AVRTWI | null = null;
  private spi: AVRSPI | null = null;
  private eeprom: AVREEPROM | null = null;
  private eepromBackend: EEPROMMemoryBackend | null = null;
  private watchdog: AVRWatchdog | null = null;
  private clock: AVRClock | null = null;

  // ── ESP32 engine (parallel to AVR) ──────────────────────────────────────
  private esp32Engine: ESP32Engine | null = null;
  private esp32Running = false;
  private esp32InitPromise: Promise<void> | null = null;
  private pendingSketchSource = '';

  private selectedBoard: string = 'arduino-uno';

  // Custom Event Scheduler for Peripheral Emulation
  private scheduledEvents: { targetCycles: number, callback: () => void }[] = [];

  // Ports
  private ports = new Map<string, AVRIOPort>();

  // Execution configuration
  private isRunning: boolean = false;
  private tickInterval: number | null = null;
  private lastTime: number = 0;
  private readonly MHZ = 16e6;

  constructor() { }

  /**
   * Initializes the inner AVR CPU with a compiled Hex buffer.
   * For ESP32 boards, initialises the ESP32Engine instead.
   */
  initCPU(hexString: string = BLINK_HEX) {
    if (ESP32_BOARDS.has(this.selectedBoard)) {
      this.initESP32CPU(hexString);
      return;
    }
    this.initAVRCPU(hexString);
  }

  /** ESP32 path — waits for init to complete before starting */
  private initESP32CPU(hexString: string) {
    this.esp32Engine = new ESP32Engine({
      tcpProxyUrl: TCP_PROXY_URL,
      simulatedIP: '192.168.1.100',
      sketchSource: this.pendingSketchSource,
      onWiFiLog: (msg) => {
        import('../store/useForgeStore').then(({ useForgeStore }) => {
          useForgeStore.getState().appendSerial(msg + '\n');
          useForgeStore.getState().appendWiFiLog?.(msg);
        });
      },
      onPinChange: (pin, val) => {
        this.setPinState(`ESP${pin}`, val ? 'HIGH' : 'LOW');
      },
      onUARTData: (char) => {
        import('../store/useForgeStore').then(({ useForgeStore }) => {
          useForgeStore.getState().appendSerial(char);
        });
      },
    });

    // Store the promise so start() can wait for it
    this.esp32InitPromise = this.esp32Engine.init(hexString).catch(err => {
      console.error('[FORGE ENGINE] ESP32 init failed:', err);
    });
    console.log('[FORGE ENGINE] ESP32 engine initialised.');
  }

  /** Original AVR path — unchanged */
  private initAVRCPU(hexString: string = BLINK_HEX) {
    const config = BOARDS[this.selectedBoard] || BOARDS['arduino-uno'];
    console.log(`[FORGE ENGINE] initCPU initializing ${config.name}. Parsing HEX string...`);

    const progData = parseHexString(hexString);
    this.cpu = new CPU(progData);

    // Attach Dynamic Ports
    this.ports.clear();
    Object.entries(config.ports).forEach(([letter, portConfig]) => {
      const port = new AVRIOPort(this.cpu!, portConfig);
      this.ports.set(letter, port);
      port.addListener((state) => this.pushPortState(letter, state));
    });

    // Attach Dynamic Timers
    config.timers.forEach(timerConfig => {
      new AVRTimer(this.cpu!, timerConfig);
    });

    // Attach ATtiny Specialized Hardware
    if (this.selectedBoard === 'attiny85') {
      new ATtinyTimer1(this.cpu!, attinyTimer1Config);
      new AVRUSI(this.cpu!, this.ports.get('B')!, 0x16, 0, 2);
    }

    // Attach Serial USART
    if (config.hasUSART) {
      this.usart = new AVRUSART(this.cpu!, usart0Config, config.frequency);
      this.usartEmulator = new USARTEmulator(this.usart, (char) => {
        import('../store/useForgeStore').then(({ useForgeStore }) => {
          useForgeStore.getState().appendSerial(char);
        });
      });
    }

    // Attach ADC
    if (config.hasADC) {
      this.adc = new AVRADC(this.cpu!, adcConfig);
    }

    // Attach I2C (TWI)
    if (config.hasTWI) {
      this.twi = new AVRTWI(this.cpu!, twiConfig, config.frequency);
    }

    // Attach SPI
    if (config.hasSPI) {
      this.spi = new AVRSPI(this.cpu!, spiConfig, config.frequency);
    }

    // Attach EEPROM
    this.eepromBackend = new EEPROMMemoryBackend(config.eepromSize);
    this.eeprom = new AVREEPROM(this.cpu!, this.eepromBackend);
    console.log(`[FORGE ENGINE] EEPROM attached (${config.eepromSize} bytes)`);

    // Attach Clock & Watchdog
    this.clock = new AVRClock(this.cpu!, config.frequency, clockConfig);
    this.watchdog = new AVRWatchdog(this.cpu!, watchdogConfig, this.clock);
    console.log(`[FORGE ENGINE] MCU peripherals (Clock, Watchdog, ADC, Timers) initialized.`);
  } // end initAVRCPU

  public setBoard(boardId: string) {
    this.selectedBoard = boardId;
    if (this.isRunning || this.esp32Running) {
      this.reset();
    }
  }

  /** Store the sketch source so ESP32 stub mode can simulate Serial/WiFi output */
  public setSketchSource(source: string): void {
    this.pendingSketchSource = source;
  }

  /**
   * Start the simulation loop
   */
  start() {
    // ── ESP32 path ────────────────────────────────────────────────
    if (ESP32_BOARDS.has(this.selectedBoard)) {
      if (this.esp32Running) return;
      this.esp32Running = true;
      // Wait for async init (WASM fetch + stub setup) before starting the loop
      const doStart = () => {
        if (!this.esp32Running) return; // stopped before init finished
        this.esp32Engine?.start();
        console.log('[FORGE] ESP32 Simulator Engine started.');
      };
      if (this.esp32InitPromise) {
        this.esp32InitPromise.then(doStart);
      } else {
        doStart();
      }
      return;
    }

    // ── AVR path ──────────────────────────────────────────────────
    if (this.isRunning) return;
    if (!this.cpu) this.initCPU(); // Auto init if not instantiated

    this.isRunning = true;
    this.lastTime = performance.now();
    console.log('[FORGE] AVR Simulator Engine started.');

    // Tie to the browser's refresh rate for frictionless frame rendering
    const runner = () => {
      if (!this.isRunning) return;
      this.tick();
      this.tickInterval = requestAnimationFrame(runner);
    };
    this.tickInterval = requestAnimationFrame(runner);
  }

  /**
   * Stop the simulation
   */
  stop() {
    // ── ESP32 path ────────────────────────────────────────────────
    if (ESP32_BOARDS.has(this.selectedBoard)) {
      if (!this.esp32Running) return;
      this.esp32Running = false;
      this.esp32Engine?.stop();
      console.log('[FORGE] ESP32 Simulator Engine stopped.');
      return;
    }

    // ── AVR path ──────────────────────────────────────────────────
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.tickInterval !== null) {
      cancelAnimationFrame(this.tickInterval);
      this.tickInterval = null;
    }
    console.log('[FORGE] AVR Simulator Engine stopped.');
  }

  /**
   * Tears down the CPU instance and clears pin states.
   */
  reset() {
    if (ESP32_BOARDS.has(this.selectedBoard)) {
      this.esp32Engine?.stop();
      this.esp32Engine = null;
      this.esp32Running = false;
      this.esp32InitPromise = null;
    } else {
      this.stop();
      this.cpu = null;
      this.adc = null;
    }

    // Broadcast FLOATING to visually turn off LEDs/peripherals
    this.pinStates.forEach((_, pinId) => {
      this.setPinState(pinId, 'FLOATING');
    });
    this.scheduledEvents = [];
    console.log('[FORGE] Simulator Engine reset.');
  }

  /**
   * Hardware Peripheral Interface: Register a callback N cycles in the future.
   */
  public scheduleEvent(cyclesInFuture: number, callback: () => void) {
    if (!this.cpu) return;
    const targetCycles = this.cpu.cycles + Math.max(0, cyclesInFuture);
    this.scheduledEvents.push({ targetCycles, callback });
    this.scheduledEvents.sort((a, b) => a.targetCycles - b.targetCycles);
  }

  /**
   * Schedule a callback at an absolute CPU cycle count.
   * Preferred for DHT/NeoPixel emulators that pre-compute a full event timeline.
   */
  public scheduleAt(absoluteCycles: number, callback: () => void) {
    if (!this.cpu) return;
    this.scheduledEvents.push({ targetCycles: absoluteCycles, callback });
    this.scheduledEvents.sort((a, b) => a.targetCycles - b.targetCycles);
  }

  /**
   * A single simulation tick executing a time-slice natively.
   */
  private tick() {
    if (!this.cpu || !this.isRunning) return;

    const now = performance.now();
    const deltaMs = now - this.lastTime;
    this.lastTime = now;

    // Cap to 20ms max to prevent frame-budget overruns after tab sleep.
    // At 16MHz: 20ms × 16,000 = 320,000 cycles — but we further cap below.
    const elapsedMs = Math.min(deltaMs, 20);

    const config = BOARDS[this.selectedBoard] || BOARDS['arduino-uno'];
    const cyclesToRun = Math.floor(elapsedMs * (config.frequency / 1000));
    const startCycles = this.cpu.cycles;

    try {
      let executedInstructions = 0;
      while (this.cpu.cycles - startCycles < cyclesToRun) {
        avrInstruction(this.cpu);
        this.cpu.tick();

        // Process peripheral simulation events aligned precisely to clock cycles
        while (this.scheduledEvents.length > 0 && this.cpu.cycles >= this.scheduledEvents[0].targetCycles) {
          const event = this.scheduledEvents.shift();
          if (event) event.callback();
        }

        executedInstructions++;
        // Hard cap: keep each rAF handler under ~10ms so React can repaint.
        // 160,000 instructions ≈ 10ms of AVR time at 16MHz.
        if (executedInstructions >= 160_000) {
          break;
        }
      }
    } catch (e: any) {
      console.error("[FORGE ENGINE] AVR CPU CRASHED:", e);
      this.stop();
    }
  }

  /**
   * Update the value of a physical/virtual pin (Emits UI events)
   */
  setPinState(pinId: string, state: PinState) {
    const currentState = this.pinStates.get(pinId);
    if (currentState === state) return;

    // Log 7-segment related pin changes
    if (pinId.startsWith('ESP')) {
      console.log(`[SIM RUNNER 7SEG] setPinState: ${pinId} = ${state} (was ${currentState})`);
    }

    this.pinStates.set(pinId, state);
    this.notifyListeners(pinId, state);
  }

  getPinState(pinId: string): PinState {
    return this.pinStates.get(pinId) || 'FLOATING';
  }

  /**
   * Listen for changes on a specific pin (e.g., LED UI reacting to PORT changes)
   */
  addListener(pinId: string, listener: PinListener) {
    if (!this.listeners.has(pinId)) {
      this.listeners.set(pinId, new Set());
    }
    this.listeners.get(pinId)!.add(listener);

    // Initial call
    listener(this.getPinState(pinId));
  }

  removeListener(pinId: string, listener: PinListener) {
    const set = this.listeners.get(pinId);
    if (set) {
      set.delete(listener);
    }
  }

  /**
   * Raw listener — fires on EVERY port write for this pin, no deduplication.
   * Required for WS2812B / NeoPixel protocol decoding where every edge matters.
   */
  addRawListener(pinId: string, listener: RawPortListener) {
    if (!this.rawPortListeners.has(pinId)) {
      this.rawPortListeners.set(pinId, new Set());
    }
    this.rawPortListeners.get(pinId)!.add(listener);
  }

  removeRawListener(pinId: string, listener: RawPortListener) {
    const set = this.rawPortListeners.get(pinId);
    if (set) set.delete(listener);
  }

  private notifyListeners(pinId: string, state: PinState) {
    const set = this.listeners.get(pinId);
    if (set) {
      // Log when ESP32 pins have listeners
      if (pinId.startsWith('ESP')) {
        console.log(`[SIM RUNNER 7SEG] notifyListeners: ${pinId} = ${state}, ${set.size} listeners`);
      }
      set.forEach(l => l(state));
    } else if (pinId.startsWith('ESP')) {
      console.log(`[SIM RUNNER 7SEG] No listeners for ${pinId} = ${state}`);
    }
  }

  /**
   * Translates the 8-bit port logic state onto discrete UI pin channels.
   */
  private pushPortState(portLetter: string, state: number) {
    const cycles = this.cpu?.cycles ?? 0;
    for (let bit = 0; bit < 8; bit++) {
      const isHigh = (state & (1 << bit)) !== 0;
      const pinId = `P${portLetter}${bit}`;
      // Fire raw listeners on EVERY write (no dedup) — needed for WS2812B timing
      const rawSet = this.rawPortListeners.get(pinId);
      if (rawSet) rawSet.forEach(l => l(portLetter, bit, isHigh, cycles));
      // Deduped listeners for normal LED/buzzer etc.
      this.setPinState(pinId, isHigh ? 'HIGH' : 'LOW');
    }
  }

  /**
   * Inject an analog voltage into a specific ADC channel.
   * For Arduino: channel = 0-5, voltage = 0-5V → writes to avr8js ADC.
   * For ESP32: channel = GPIO number, voltage = 0-3.3V → writes to esp32AnalogValues.
   */
  setAnalogInput(channel: number, voltage: number) {
    // ESP32 boards route through the ESP32 analog store
    if (ESP32_BOARDS.has(this.selectedBoard)) {
      this.setESP32AnalogInput(channel, voltage);
      return;
    }
    // AVR path
    if (!this.adc) return;
    if (channel < 0 || channel >= this.adc.channelValues.length) return;
    this.adc.channelValues[channel] = voltage;
  }

  /** Expose selected board ID for CircuitEngine to detect ESP32 */
  public get selectedBoardId(): string {
    return this.selectedBoard;
  }

  /**
   * Utility for abstracting Arduino board numbers to AVR raw chip pins
   */
  convertArduinoPin(arduinoPin: number | string): PinMapping | null {
    const val = String(arduinoPin).toUpperCase();

    // Analog A0-A5 -> PC0-PC5
    if (val.startsWith('A')) {
      const p = parseInt(val.replace('A', ''), 10);
      if (p >= 0 && p <= 5) return { avrPin: `PC${p}`, adcChannel: p };
      return null;
    }

    // Digital Pins
    const p = parseInt(val, 10);
    if (isNaN(p)) return null;

    if (p >= 0 && p <= 7) return { avrPin: `PD${p}` };     // D0-D7 -> PD0-PD7
    if (p >= 8 && p <= 13) return { avrPin: `PB${p - 8}` }; // D8-D13 -> PB0-PB5

    return null;
  }

  /**
   * Convert an ESP32 DevKit V1 pin label to a synthetic PinMapping.
   * avrPin = "ESP{gpio}" — used as the listener key in SimulationRunner.
   * adcChannel is set for ADC-capable pins so analog sensors work.
   *
   * Pin map matches esp32-devkit-v1-element.ts pinInfo exactly.
   * Also supports A0-A7 aliases for analog sensor wiring.
   */
  convertESP32Pin(pinLabel: string): PinMapping | null {
    const p = String(pinLabel).replace(/__target$/, '').trim().toUpperCase();

    // ── ADC-capable pins (checked first — some overlap with digital map) ──
    const adcMap: Record<string, { gpio: number; ch: number }> = {
      // Labelled analog aliases (A0-A7)
      'A0': { gpio: 36, ch: 0 }, 'VP': { gpio: 36, ch: 0 },
      'A1': { gpio: 39, ch: 1 }, 'VN': { gpio: 39, ch: 1 },
      'A2': { gpio: 34, ch: 2 }, 'D34': { gpio: 34, ch: 2 },
      'A3': { gpio: 35, ch: 3 }, 'D35': { gpio: 35, ch: 3 },
      'A4': { gpio: 32, ch: 4 }, 'D32': { gpio: 32, ch: 4 },
      'A5': { gpio: 33, ch: 5 }, 'D33': { gpio: 33, ch: 5 },
      'A6': { gpio: 25, ch: 6 }, 'D25': { gpio: 25, ch: 6 },
      'A7': { gpio: 26, ch: 7 }, 'D26': { gpio: 26, ch: 7 },
      'D27': { gpio: 27, ch: 7 },  // ADC2_CH7
    };
    if (adcMap[p]) {
      const { gpio, ch } = adcMap[p];
      return { avrPin: `ESP${gpio}`, adcChannel: ch };
    }

    // ── Digital GPIO pins ─────────────────────────────────────────
    const digitalMap: Record<string, number> = {
      'D0': 0, 'D2': 2, 'D4': 4, 'D5': 5,
      'D12': 12, 'D13': 13, 'D14': 14, 'D15': 15,
      'D18': 18, 'D19': 19, 'D21': 21, 'D22': 22, 'D23': 23,
      'RX2': 16, 'TX2': 17, 'RX0': 3, 'TX0': 1,
    };
    if (digitalMap[p] !== undefined) {
      return { avrPin: `ESP${digitalMap[p]}` };
    }

    // ── Power / special pins — not routable ───────────────────────
    if (['3V3', 'VIN', 'EN', 'GND', 'GND.1', 'GND.2', 'GND.3'].includes(p)) return null;

    // ── Fallback: raw GPIO number string e.g. "2", "13" ──────────
    const num = parseInt(p.replace(/^D/, ''), 10);
    if (!isNaN(num) && num >= 0 && num <= 39) {
      return { avrPin: `ESP${num}` };
    }
    return null;
  }

  /**
   * Unified pin converter — returns PinMapping for both AVR and ESP32 boards.
   * isESP32: true → use convertESP32Pin, false → use convertArduinoPin
   */
  convertPin(pinLabel: string, isESP32: boolean): PinMapping | null {
    return isESP32 ? this.convertESP32Pin(pinLabel) : this.convertArduinoPin(pinLabel);
  }

  /**
   * Inject a digital HIGH/LOW into a pin — works for both AVR and ESP32.
   * For ESP32 pins (ESP{n}), updates the pin state map directly.
   * For AVR pins (P{L}{n}), drives the hardware port register.
   */
  setVirtualInput(pinId: string, isHigh: boolean) {
    if (pinId.startsWith('ESP')) {
      // ESP32 path — no hardware port, just update state map
      this.setPinState(pinId, isHigh ? 'HIGH' : 'LOW');
      return;
    }
    // AVR path
    if (!this.cpu) return;
    const portLetter = pinId.charAt(1);
    const bit = parseInt(pinId.charAt(2), 10);
    const port = this.ports.get(portLetter);
    if (port) port.setPin(bit, isHigh);
    this.setPinState(pinId, isHigh ? 'HIGH' : 'LOW');
  }

  /**
   * Inject an analog voltage — works for both AVR (ADC channel) and ESP32 (GPIO map).
   * For ESP32, the gpio number is derived from the avrPin string "ESP{n}".
   */
  setAnalogInputForPin(mapping: PinMapping, voltage: number): void {
    if (mapping.avrPin.startsWith('ESP')) {
      const gpio = parseInt(mapping.avrPin.replace('ESP', ''), 10);
      this.setESP32AnalogInput(gpio, voltage);
    } else if (mapping.adcChannel !== undefined) {
      this.setAnalogInput(mapping.adcChannel, voltage);
    }
  }

  public getCycles(): number {
    return this.cpu ? this.cpu.cycles : 0;
  }

  public get TWI(): AVRTWI | null {
    return this.twi;
  }

  public get SPI(): AVRSPI | null {
    return this.spi;
  }

  /**
   * EEPROM Support
   */
  public getEEPROMState(): Uint8Array {
    return this.eepromBackend?.memory || new Uint8Array(0);
  }

  public loadEEPROM(data: Uint8Array) {
    if (this.eepromBackend && data.length === this.eepromBackend.memory.length) {
      this.eepromBackend.memory.set(data);
    }
  }

  // ── ESP32 status getters ─────────────────────────────────────────────────

  public get isESP32Board(): boolean {
    return ESP32_BOARDS.has(this.selectedBoard);
  }

  public get esp32WiFiConnected(): boolean {
    return this.esp32Engine?.networkConnected ?? false;
  }

  public get esp32IPAddress(): string {
    return this.esp32Engine?.ipAddress ?? '';
  }

  /**
   * Inject a digital signal into an ESP32 GPIO pin (stub mode).
   * Equivalent to setVirtualInput() for AVR.
   * pinId format: "ESP4", "ESP13", etc.
   */
  public setESP32DigitalInput(gpioNum: number, isHigh: boolean): void {
    this.setPinState(`ESP${gpioNum}`, isHigh ? 'HIGH' : 'LOW');
  }

  /**
   * Inject an analog voltage into an ESP32 ADC pin (stub mode).
   * The stub's analogRead() parser will read from this map.
   * gpioNum: the GPIO number (e.g. 34, 35, 32, 33, 36, 39)
   * voltage: 0.0 – 3.3V (ESP32 ADC reference)
   */
  public setESP32AnalogInput(gpioNum: number, voltage: number): void {
    this.esp32AnalogValues.set(gpioNum, voltage);
    // Also notify any listeners watching this pin (for future WASM mode)
    this.setPinState(`ESP${gpioNum}`, voltage > 0.1 ? 'HIGH' : 'LOW');
  }

  /** Read the last injected analog voltage for an ESP32 GPIO (used by stub analogRead parser) */
  public getESP32AnalogVoltage(gpioNum: number): number {
    return this.esp32AnalogValues.get(gpioNum) ?? 0;
  }

  private esp32AnalogValues = new Map<number, number>();
}

// Export a singleton instance
export const simulationRunner = new SimulationRunner();
