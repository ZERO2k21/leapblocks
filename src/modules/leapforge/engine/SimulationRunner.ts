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
import { ESP32SimulationRunner } from '../../../simulation/ESP32SimulationRunner.js';
import { ESP32_BOARDS as ESP32_QEMU_BOARDS } from '../../../simulation/ESP32BoardConfig.js';
import { ESP32C3SimulationRunner } from '../../../simulation/esp32c3/ESP32C3SimulationRunner';

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

  // ── ESP32 QEMU runner (FQBN-based boards: esp32:esp32:*) ─────────────
  private esp32Runner: ESP32SimulationRunner | null = null;
  // ── ESP32-C3 RISC-V runner (FQBN-based boards: esp32:esp32:esp32c3) ──
  private esp32c3Runner: ESP32C3SimulationRunner | null = null;
  // binPath is set by setBoard(boardId, binPath) when ForgeStudio receives the
  // compiled .bin from the main process.  It is consumed by start() to launch QEMU.
  private binPath: string | null = null;

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
   * For QEMU ESP32 boards (esp32:esp32:*), creates the QEMU runner instead.
   * For ESP32-C3 boards (esp32:esp32:esp32c3), creates the RISC-V runner instead.
   */
  initCPU(hexString: string = BLINK_HEX) {
    // ── ESP32-C3 RISC-V path (esp32:esp32:esp32c3) ──────────────────────
    const ESP32_C3_BOARDS = ['esp32:esp32:esp32c3'];
    if (ESP32_C3_BOARDS.includes(this.selectedBoard)) {
      this.esp32c3Runner = new ESP32C3SimulationRunner();
      return;
    }

    // ── QEMU ESP32 path (FQBN-style board IDs: esp32:esp32:*) ────────────
    if (ESP32_QEMU_BOARDS.has(this.selectedBoard)) {
      this.esp32Runner = new ESP32SimulationRunner();
      return;
    }
    this.initAVRCPU(hexString);
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

  /** ESP32-C3 RISC-V initialization path */
  private async initESP32C3CPU(firmwareBin: Uint8Array) {
    if (!this.esp32c3Runner) {
      this.esp32c3Runner = new ESP32C3SimulationRunner();
    }
    await this.esp32c3Runner.init(firmwareBin);
    console.log('[FORGE ENGINE] ESP32-C3 RISC-V core initialized');
  }

  public setBoard(boardId: string, binPath?: string) {
    this.selectedBoard = boardId;
    if (binPath) {
      this.binPath = binPath;
      console.log(`[SimulationRunner] binPath stored for QEMU: ${binPath}`);
    }
    if (this.isRunning) {
      this.reset();
    }
  }

  /**
   * Start the simulation loop
   */
  async start() {
    // ── ESP32-C3 RISC-V path (esp32:esp32:esp32c3) ──────────────────────
    const ESP32_C3_BOARDS = ['esp32:esp32:esp32c3'];
    if (ESP32_C3_BOARDS.includes(this.selectedBoard)) {
      if (!this.binPath) {
        throw new Error(
          '[FORGE] binPath is required for ESP32-C3 RISC-V simulation. ' +
          'Call setBoard(boardId, binPath) before start().'
        );
      }
      if (!this.esp32c3Runner) this.esp32c3Runner = new ESP32C3SimulationRunner();

      // Load firmware binary and start RISC-V simulation
      // For now, use a mock binary since we're using a mock CPU
      const firmwareBin = new Uint8Array(1024); // Mock 1KB binary
      firmwareBin.fill(0x13); // Fill with NOP instructions (addi x0, x0, 0)

      await this.esp32c3Runner.init(firmwareBin);
      this.esp32c3Runner.start();

      console.log('[FORGE] ESP32-C3 RISC-V runner started, binPath:', this.binPath);
      return; // no additional requestAnimationFrame loop needed
    }

    // ── QEMU ESP32 path (esp32:esp32:*) ──────────────────────
    if (ESP32_QEMU_BOARDS.has(this.selectedBoard)) {
      if (!this.binPath) {
        throw new Error(
          '[FORGE] binPath is required for QEMU ESP32 simulation. ' +
          'Call setBoard(boardId, binPath) before start().'
        );
      }
      if (!this.esp32Runner) this.esp32Runner = new ESP32SimulationRunner();
      await this.esp32Runner.start(this.binPath);
      console.log('[FORGE] QEMU ESP32 runner started, binPath:', this.binPath);
      return; // no requestAnimationFrame loop for QEMU
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
    // ── ESP32-C3 RISC-V path (esp32:esp32:esp32c3) ──────────────────────
    const ESP32_C3_BOARDS = ['esp32:esp32:esp32c3'];
    if (ESP32_C3_BOARDS.includes(this.selectedBoard)) {
      this.esp32c3Runner?.stop();
      this.binPath = null; // clear so a stale path can't be reused
      console.log('[FORGE] ESP32-C3 RISC-V runner stopped.');
      return;
    }

    // ── QEMU ESP32 path (esp32:esp32:*) ──────────────────────
    if (ESP32_QEMU_BOARDS.has(this.selectedBoard)) {
      this.esp32Runner?.stop();
      this.binPath = null; // clear so a stale path can't be reused
      console.log('[FORGE] QEMU ESP32 runner stopped.');
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
    // ── QEMU ESP32 path ───────────────────────────────────────────
    if (ESP32_QEMU_BOARDS.has(this.selectedBoard)) {
      this.esp32Runner?.stop();
      this.esp32Runner = null;
      this.binPath = null; // force caller to supply a fresh binPath on next start
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
   * channel = 0-5, voltage = 0-5V → writes to avr8js ADC.
   */
  setAnalogInput(channel: number, voltage: number) {
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
   * Inject an analog voltage — for AVR (ADC channel).
   */
  setAnalogInputForPin(mapping: PinMapping, voltage: number): void {
    if (mapping.adcChannel !== undefined) {
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

  /** Access the QEMU-backed ESP32 runner (esp32:esp32:* boards only) */
  public get ESP32Runner(): ESP32SimulationRunner | null {
    return this.esp32Runner;
  }

  /** Access the RISC-V-backed ESP32-C3 runner (esp32:esp32:esp32c3 board only) */
  public get ESP32C3Runner(): ESP32C3SimulationRunner | null {
    return this.esp32c3Runner;
  }

  public get isESP32Board(): boolean {
    return ESP32_QEMU_BOARDS.has(this.selectedBoard);
  }

  public get isESP32C3Board(): boolean {
    const ESP32_C3_BOARDS = ['esp32:esp32:esp32c3'];
    return ESP32_C3_BOARDS.includes(this.selectedBoard);
  }

  /**
   * ESP32-C3 analog input support - converts voltage to ADC channel
   * For ESP32-C3: GPIO0=CH0, GPIO1=CH1, GPIO2=CH2, GPIO3=CH3, GPIO4=CH4
   */
  setESP32C3AnalogInput(gpioNum: number, voltage: number): void {
    if (!this.esp32c3Runner) return;

    // ESP32-C3 ADC channel mapping
    const adcChannelMap: Record<number, number> = {
      0: 0, 1: 1, 2: 2, 3: 3, 4: 4
    };

    const channel = adcChannelMap[gpioNum];
    if (channel !== undefined) {
      this.esp32c3Runner.setAnalogInput(channel, voltage);
    }
  }

  /**
   * ESP32-C3 GPIO input support - sets digital input state
   */
  setESP32C3GPIOInput(gpioNum: number, high: boolean): void {
    if (!this.esp32c3Runner) return;
    this.esp32c3Runner.setGPIOInput(gpioNum, high);
  }

  /**
   * ESP32-C3 pin listener support - adds callback for GPIO output changes
   */
  addESP32C3PinListener(gpioNum: number, callback: (high: boolean) => void): void {
    if (!this.esp32c3Runner) return;
    this.esp32c3Runner.addPinListener(gpioNum, callback);
  }
}

// Export a singleton instance
export const simulationRunner = new SimulationRunner();
