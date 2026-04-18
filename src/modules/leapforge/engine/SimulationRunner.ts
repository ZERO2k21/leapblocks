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
import { ESP32Engine } from './esp32/ESP32Engine';

/** Board IDs that use the ESP32 engine instead of AVR */
const ESP32_BOARDS = new Set(['esp32', 'esp32-s2', 'esp32-s3', 'esp32-c3']);

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

  /** ESP32 path — async, but we fire-and-forget so the existing sync API is preserved */
  private initESP32CPU(hexString: string) {
    this.esp32Engine = new ESP32Engine({
      tcpProxyUrl: TCP_PROXY_URL,
      simulatedIP: '192.168.1.100',
      onWiFiLog: (msg) => {
        import('../store/useForgeStore').then(({ useForgeStore }) => {
          useForgeStore.getState().appendSerial(msg + '\n');
          useForgeStore.getState().appendWiFiLog?.(msg);
        });
      },
      onPinChange: (pin, val) => {
        // Map ESP32 GPIO numbers to a synthetic pin ID for CircuitEngine compatibility
        const pinId = `ESP${pin}`;
        this.setPinState(pinId, val ? 'HIGH' : 'LOW');
      },
      onUARTData: (char) => {
        import('../store/useForgeStore').then(({ useForgeStore }) => {
          useForgeStore.getState().appendSerial(char);
        });
      },
    });

    this.esp32Engine.init(hexString).catch(err => {
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

  /**
   * Start the simulation loop
   */
  start() {
    // ── ESP32 path ────────────────────────────────────────────────
    if (ESP32_BOARDS.has(this.selectedBoard)) {
      if (this.esp32Running) return;
      this.esp32Running = true;
      this.esp32Engine?.start();
      console.log('[FORGE] ESP32 Simulator Engine started.');
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

    // Throttle massive execution spikes if browser tab sleeps
    const elapsedMs = Math.min(deltaMs, 100);

    const config = BOARDS[this.selectedBoard] || BOARDS['arduino-uno'];
    // Calculate elapsed clock cycles: 16MHz = 16,000 cycles per ms
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
        // FORCE YIELD: If we run too many instructions at once, we completely freeze React.
        // We break out early to let the browser repaint the screen and breathe!
        if (executedInstructions >= 250000) {
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
      set.forEach(l => l(state));
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
   * Bi-directional Sync: Force a pin state externally (e.g. from a virtual Button press)
   * This drives the underlying AVR CPU PORT hardware pins.
   */
  setVirtualInput(pinId: string, isHigh: boolean) {
    if (!this.cpu) return;
    const portLetter = pinId.charAt(1);
    const bit = parseInt(pinId.charAt(2), 10);

    const port = this.ports.get(portLetter);
    if (port) port.setPin(bit, isHigh);

    // Immediately echo changes to external UI listeners smoothly
    this.setPinState(pinId, isHigh ? 'HIGH' : 'LOW');
  }

  /**
   * Inject an analog voltage into a specific ADC channel (0-5 for Arduino A0-A5)
   */
  setAnalogInput(channel: number, voltage: number) {
    if (!this.adc) return;
    if (channel < 0 || channel >= this.adc.channelValues.length) return;

    // Set the voltage (0-5V) directly. avr8js converts this internally to 10-bit digital.
    this.adc.channelValues[channel] = voltage;
    // console.log(`[FORGE ENGINE] ADC Channel ${channel} set to ${voltage}V`);
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
}

// Export a singleton instance
export const simulationRunner = new SimulationRunner();
