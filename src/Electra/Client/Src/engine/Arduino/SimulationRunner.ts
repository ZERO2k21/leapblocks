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
import { avrInstruction, CPU, AVRTimer, AVRIOPort, AVRUSART, usart0Config, AVRADC, adcConfig, AVRTWI, twiConfig, AVRSPI, spiConfig, AVREEPROM, EEPROMMemoryBackend, AVRWatchdog, watchdogConfig, AVRClock, clockConfig, ATtinyTimer1, attinyTimer1Config, AVRUSI } from '../../lib/avr8js';
import { parseHexString } from './HexParser';
import { BLINK_HEX } from './TestSketches';
import { USARTEmulator } from './USARTEmulator';
import { BOARDS } from './BoardConfig';
import { ESP32C3SimulationRunner } from '../esp32c3/ESP32C3SimulationRunner';

export type PinState = 'HIGH' | 'LOW' | 'FLOATING' | number;
export type PinListener = (state: PinState) => void;
export type RawPortListener = (portLetter: string, bit: number, isHigh: boolean, cycles: number) => void;

export interface PinMapping {
  avrPin: string;
  adcChannel?: number;
}

class SimulationRunner {
  private pinStates: Map<string, PinState> = new Map();
  private pinOutputs: Map<string, boolean> = new Map();
  private virtualInputs: Map<string, boolean> = new Map();
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

  // ── ESP32-C3 RISC-V runner (FQBN-based boards: esp32:esp32:esp32c3) ──
  private esp32c3Runner: ESP32C3SimulationRunner | null = null;
  // binPath is set by setBoard(boardId, binPath) when ForgeStudio receives the
  // compiled .bin from the main process.  It is consumed by start() to launch the simulation.
  private binPath: string | null = null;

  // Transpiled JavaScript code for ArduinoRuntime-based simulation (recommended path)
  private _transpiledJS: string | null = null;
  private _binBase64: string | null = null;
  private _sourceCode: string = '';

  // Track whether ESP32 serial/pin listeners have been wired to avoid duplication on restart
  private _esp32ListenersWired = false;
  // Track reverse-bridge listener functions for cleanup
  private _esp32ReverseBridgeListeners: Array<{ pinId: string; fn: (state: PinState) => void }> = [];

  private selectedBoard = 'arduino-uno';

  // Custom Event Scheduler for Peripheral Emulation
  private scheduledEvents: { targetCycles: number, callback: () => void }[] = [];

  // Ports
  private ports = new Map<string, AVRIOPort>();

  // Execution configuration
  public isRunning = false;
  private tickInterval: number | null = null;
  private lastTime = 0;
  private readonly MHZ = 16e6;


  /**
   * Initializes the inner AVR CPU with a compiled Hex buffer.
   * For ESP32-C3 boards (esp32-c3), creates the RISC-V runner instead.
   */
  initCPU(hexString: string = BLINK_HEX) {
    // ── ESP32-C3 RISC-V path ──────────────────────
    const ESP32_C3_BOARD_IDS = ['esp32-c3', 'esp32'];
    if (ESP32_C3_BOARD_IDS.includes(this.selectedBoard)) {
      this.esp32c3Runner = new ESP32C3SimulationRunner();
      console.log(`[FORGE ENGINE] ESP32-C3 RISC-V runner created for board: ${this.selectedBoard}`);
      return;
    }

    // ── AVR path (default) ───────────────────────────────────────────────
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
      port.addListener((state: number) => this.pushPortState(letter, state));

      // Install a readHook on the PIN register to force-refresh from pinValue
      // before every CPU read. This ensures external inputs (from setVirtualInput /
      // port.setPin) are always reflected when the AVR code does digitalRead().
      // Without this, the PIN register can contain stale values if updatePinRegister
      // hasn't been called since the last setPin.
      this.cpu!.readHooks[portConfig.PIN] = () => {
        port.refreshPinRegister();
        const val = this.cpu!.data[portConfig.PIN];
        if (letter === 'D') {
          console.log(`[SimulationRunner] Read PIND: 0x${val.toString(16)} (bit 3 DT = ${(val >> 3) & 1}, bit 2 SCK = ${(val >> 2) & 1})`);
        }
        return val;
      };
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
        import('../../../utlis/store/useForgeStore').then(({ useForgeStore }) => {
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
      import('./CircuitEngine').then(({ circuitEngine }) => {
        if (this.twi) {
          this.twi.eventHandler = (circuitEngine as any).i2cBusManager;
          console.log('[FORGE] TWI eventHandler bound to CircuitEngine i2cBusManager');
        }
      });
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

  public setFirmwareBase64(base64: string) {
    this._binBase64 = base64;
    console.log(`[SimulationRunner] Base64 firmware stored (${base64.length} bytes)`);
  }

  public setBoard(boardId: string, binPath?: string) {
    console.log(`[SimulationRunner] setBoard called: boardId="${boardId}", binPath="${binPath}"`);
    const prevBoard = this.selectedBoard;
    this.selectedBoard = boardId;

    if (binPath) {
      // Explicit binPath provided — always store it
      this.binPath = binPath;
      console.log(`[SimulationRunner] binPath stored for ESP32-C3: ${binPath}`);
    } else {
      // No binPath provided (e.g. canvas node added, board selector changed)
      // Only clear binPath if switching AWAY from an ESP32 board
      const ESP32_C3_BOARD_IDS = ['esp32-c3', 'esp32'];
      const wasESP32 = ESP32_C3_BOARD_IDS.includes(prevBoard);
      const isESP32 = ESP32_C3_BOARD_IDS.includes(boardId);
      if (wasESP32 && !isESP32) {
        this.binPath = null;
        console.log(`[SimulationRunner] Cleared binPath (switched from ESP32 to ${boardId})`);
      }
      // If staying on ESP32 board, preserve existing binPath
    }

    if (this.isRunning) {
      this.reset();
    }
  }

  /**
   * Store transpiled JavaScript for ArduinoRuntime-based ESP32-C3 simulation.
   * Call this instead of (or in addition to) setBoard() when using the transpiled path.
   */
  setTranspiledJS(jsCode: string): void {
    this._transpiledJS = jsCode;
    console.log(`[SimulationRunner] Transpiled JS stored (${jsCode.length} bytes)`);
  }

  setSourceCode(code: string): void {
    this._sourceCode = code || '';
  }

  getSourceCode(): string {
    return this._sourceCode;
  }

  /**
   * Start the simulation loop
   */
  async start() {
    console.log(`[SimulationRunner] start() called, selectedBoard="${this.selectedBoard}"`);
    // ── ESP32-C3 path ──────────────────────
    const ESP32_C3_BOARD_IDS = ['esp32-c3', 'esp32'];
    if (ESP32_C3_BOARD_IDS.includes(this.selectedBoard)) {
      console.log('[SimulationRunner] ESP32-C3 board detected');
      this.isRunning = true;
      if (!this.esp32c3Runner) {
        this.esp32c3Runner = new ESP32C3SimulationRunner();
      }

      // Wire serial/pin listeners ONCE (guard against duplicate registration on restart)
      if (!this._esp32ListenersWired) {
        // Wire serial output from ESP32 runner to the Zustand store
        this.esp32c3Runner.addSerialListener((text: string) => {
          import('../../../utlis/store/useForgeStore').then(({ useForgeStore }) => {
            // Parse __LF_WIFI: prefixed messages and route to WiFi log
            const wifiMatch = text.match(/__LF_WIFI:(.+)/);
            if (wifiMatch) {
              const wifiMsg = wifiMatch[1].trim();
              useForgeStore.getState().appendWiFiLog(wifiMsg);
              return; // Don't append to serial output
            }

            // Regular serial output
            useForgeStore.getState().appendSerial(text);
          });
        });
        // Wire pin changes to the pin state map
        this.esp32c3Runner.addPinListener('*', (pin, state) => {
          // Map ESP pin names to the common format
          const pinNum = pin.replace('ESP', '');
          this.setPinState(`ESP${pinNum}`, state);
        });
        this._esp32ListenersWired = true;
      }

      // ── Path A: Transpiled JS (recommended — works on web & Electron) ──
      if (this._transpiledJS) {
        console.log('[SimulationRunner] Using transpiled JS path (ArduinoRuntime)');
        await this.esp32c3Runner.initTranspiled(this._transpiledJS);

        // Clean up any previous reverse-bridge listeners before adding new ones
        for (const { pinId, fn } of this._esp32ReverseBridgeListeners) {
          this.removeListener(pinId, fn);
        }
        this._esp32ReverseBridgeListeners = [];

        // Reverse bridge: forward external pin changes (PIR, HC-SR04, etc.)
        // from SimulationRunner into ArduinoRuntime so digitalRead() works.
        const runtime = this.esp32c3Runner.runtime;
        if (runtime) {
          for (let gpio = 0; gpio <= 39; gpio++) {
            const pinId = `ESP${gpio}`;
            const g = gpio;
            const fn = (state: PinState) => {
              // Only forward digital inputs into the runtime for pins that are NOT OUTPUTs
              const pinMode = runtime.getPinMode ? runtime.getPinMode(g) : 'INPUT';
              if (pinMode === 'OUTPUT') return;

              if (state === 'HIGH') {
                runtime.setDigitalInput(g, true);
              } else if (state === 'LOW') {
                runtime.setDigitalInput(g, false);
              }
            };
            this.addListener(pinId, fn);
            this._esp32ReverseBridgeListeners.push({ pinId, fn });
          }
        }

        this.applyVirtualInputs();
        this.esp32c3Runner.run();
        console.log('[FORGE] ESP32-C3 transpiled simulation started');
        return;
      }

      // ── Path B: RISC-V binary (Web + Electron) ──
      if (this.binPath || this._binBase64) {
        console.log('[SimulationRunner] Using RISC-V binary path');
        let firmwareBin: Uint8Array;

        if (this._binBase64) {
          // Decode base64 to Uint8Array in Web browser mode
          const binaryString = atob(this._binBase64);
          const len = binaryString.length;
          firmwareBin = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            firmwareBin[i] = binaryString.charCodeAt(i);
          }
          console.log(`[FORGE] Loaded base64 firmware: ${firmwareBin.length} bytes`);
        } else {
          try {
            console.log(`[FORGE] Attempting to read binary from: ${this.binPath}`);
            const buffer = await (window as any).electronAPI.readBinFile(this.binPath);
            firmwareBin = new Uint8Array(buffer);
            console.log(`[FORGE] Loaded firmware: ${firmwareBin.length} bytes from ${this.binPath}`);
          } catch (err) {
            console.error('[FORGE] Could not read .bin via IPC:', err);
            throw new Error(`Failed to load ESP32-C3 firmware from ${this.binPath}: ${err}`);
          }
        }

        if (firmwareBin.length === 0) {
          throw new Error(`Binary file is empty: ${this.binPath || 'base64'}`);
        }

        await this.esp32c3Runner.init(firmwareBin);
        this.applyVirtualInputs();
        this.esp32c3Runner.run();
        console.log('[FORGE] ESP32-C3 RISC-V runner started, binPath:', this.binPath);
        return;
      }

      throw new Error(
        '[FORGE] ESP32-C3 simulation requires either transpiled JS or a binPath. ' +
        'Call setTranspiledJS() or setBoard(boardId, binPath) before start().'
      );
    }

    console.log('[SimulationRunner] Not an ESP32-C3 board, entering AVR path');
    // ── AVR path (default) ───────────────────────────────────────────────
    if (this.isRunning) return;
    if (!this.cpu) this.initCPU(); // Auto init if not instantiated

    this.isRunning = true;
    this.applyVirtualInputs();
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
    // ── ESP32-C3 path ──────────────────────
    const ESP32_C3_BOARD_IDS = ['esp32-c3', 'esp32'];
    if (ESP32_C3_BOARD_IDS.includes(this.selectedBoard)) {
      this.isRunning = false;
      this.esp32c3Runner?.stop();
      this.binPath = null;
      this._transpiledJS = null;
      this._binBase64 = null;

      // Clean up reverse-bridge listeners to prevent accumulation on restart
      for (const { pinId, fn } of this._esp32ReverseBridgeListeners) {
        this.removeListener(pinId, fn);
      }
      this._esp32ReverseBridgeListeners = [];

      // Reset the runner so a fresh one is created on next start
      this.esp32c3Runner = null;
      this._esp32ListenersWired = false;

      // Broadcast LOW to visually turn off LEDs/peripherals immediately
      this.pinStates.forEach((_, pinId) => {
        this.setPinState(pinId, 'LOW');
      });

      console.log('[FORGE] ESP32-C3 simulation stopped and cleaned up.');
      return;
    }

    // ── AVR path ──────────────────────────────────────────────────
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.tickInterval !== null) {
      cancelAnimationFrame(this.tickInterval);
      this.tickInterval = null;
    }

    // Broadcast LOW to visually turn off LEDs/peripherals immediately
    this.pinStates.forEach((_, pinId) => {
      this.setPinState(pinId, 'LOW');
    });

    console.log('[FORGE] AVR Simulator Engine stopped.');
  }

  /**
   * Tears down the CPU instance and clears pin states.
   */
  reset() {
    // ── ESP32-C3 RISC-V path (board IDs that map to ESP32-C3) ───────────────────────────────────────────
    const ESP32_C3_BOARD_IDS = ['esp32-c3', 'esp32'];
    if (ESP32_C3_BOARD_IDS.includes(this.selectedBoard)) {
      this.isRunning = false;
      this.esp32c3Runner?.stop();
      this.esp32c3Runner = null;
      this.binPath = null;
      this._transpiledJS = null;
      this._binBase64 = null; // force caller to supply a fresh binPath on next start
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
    this.pinOutputs.clear();
    this.virtualInputs.clear();
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
    const isOutput = this.isPinOutput(pinId);
    const prevOutput = this.pinOutputs.get(pinId) ?? false;

    if (currentState === state && prevOutput === isOutput) return;

    this.pinOutputs.set(pinId, isOutput);
    this.pinStates.set(pinId, state);
    this.notifyListeners(pinId, state);
  }

  getPinState(pinId: string): PinState {
    return this.pinStates.get(pinId) || 'FLOATING';
  }

  getFrequency(): number {
    const config = BOARDS[this.selectedBoard] || BOARDS['arduino-uno'];
    return config.frequency;
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
   * For OUTPUT pins, uses the writeGpio-provided state (driven by PORT register).
   * For INPUT pins, reads the actual PIN register which includes external inputs
   * injected via setVirtualInput/port.setPin — critical for keypad column scanning.
   */
  private pushPortState(portLetter: string, state: number) {
    const cycles = this.cpu?.cycles ?? 0;

    // Read DDR and PIN registers to distinguish output-driven vs input-sensed values
    const port = this.ports.get(portLetter);
    let ddr = 0;
    let pinReg = 0;
    if (this.cpu && port) {
      ddr = this.cpu.data[port.portConfig.DDR];
      pinReg = this.cpu.data[port.portConfig.PIN];
    }

    for (let bit = 0; bit < 8; bit++) {
      const bitMask = 1 << bit;
      // For OUTPUT pins (DDR bit=1): use the writeGpio output state
      // For INPUT pins (DDR bit=0): use the PIN register which reflects external inputs
      const isOutput = (ddr & bitMask) !== 0;
      const isHigh = isOutput
        ? (state & bitMask) !== 0
        : (pinReg & bitMask) !== 0;

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
   * Convert an ESP32-C3 pin label to a synthetic PinMapping.
   * avrPin = "ESP{gpio}" — used as the listener key in SimulationRunner.
   * adcChannel is set for ADC-capable pins so analog sensors work.
   *
   * Pin map matches esp32-c3-element.ts pinInfo exactly.
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

      // ESP32-C3 ADC capable pins
      'D0': { gpio: 0, ch: 0 },
      'D1': { gpio: 1, ch: 1 },
      'D2': { gpio: 2, ch: 2 },
      'D3': { gpio: 3, ch: 3 },
      'D4': { gpio: 4, ch: 4 },
      'D5': { gpio: 5, ch: 5 },
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
      // Pins present on ESP32 DevKit board element but previously missing
      'D25': 25, 'D26': 26, 'D27': 27,
      'D32': 32, 'D33': 33, 'D34': 34, 'D35': 35,
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
   * Helper to check if a pin is configured as an OUTPUT.
   * Works for both AVR and ESP32.
   */
  isPinOutput(pinId: string): boolean {
    if (pinId.startsWith('ESP')) {
      const gpioNum = parseInt(pinId.replace('ESP', ''), 10);
      if (isNaN(gpioNum)) return false;
      // 1. Check ArduinoRuntime (transpiled path)
      if (this.esp32c3Runner?.runtime) {
        return this.esp32c3Runner.runtime.getPinMode(gpioNum) === 'OUTPUT';
      }
      // 2. Check ESP32C3 soft-core platform
      if (this.esp32c3Runner?.platform_) {
        return this.esp32c3Runner.platform_.gpio.isOutput(gpioNum);
      }
      return false;
    }

    if (!this.cpu) return false;
    const portLetter = pinId.charAt(1);
    const bit = parseInt(pinId.charAt(2), 10);

    let ddrAddr = 0;
    if (portLetter === 'B') ddrAddr = 0x24;
    else if (portLetter === 'C') ddrAddr = 0x27;
    else if (portLetter === 'D') ddrAddr = 0x2a;
    else return false;

    const ddrValue = this.cpu.data[ddrAddr];
    return (ddrValue & (1 << bit)) !== 0;
  }

  /**
   * Inject a digital HIGH/LOW into a pin — works for both AVR and ESP32.
   * For ESP32 pins (ESP{n}), updates the pin state map directly and injects input.
   * For AVR pins (P{L}{n}), drives the hardware port register.
   */
  setVirtualInput(pinId: string, isHigh: boolean) {
    this.virtualInputs.set(pinId, isHigh);
    if (pinId.startsWith('ESP')) {
      // ESP32 path — no hardware port, just update state map and inject to runner
      this.setPinState(pinId, isHigh ? 'HIGH' : 'LOW');
      if (this.esp32c3Runner) {
        this.esp32c3Runner.injectInput(pinId, isHigh, false);
      }
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

  private applyVirtualInputs() {
    this.virtualInputs.forEach((isHigh, pinId) => {
      if (pinId.startsWith('ESP')) {
        if (this.esp32c3Runner) {
          this.esp32c3Runner.injectInput(pinId, isHigh, false);
        }
      } else {
        if (this.cpu) {
          const portLetter = pinId.charAt(1);
          const bit = parseInt(pinId.charAt(2), 10);
          const port = this.ports.get(portLetter);
          if (port) port.setPin(bit, isHigh);
        }
      }
    });
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

  /** Access the RISC-V-backed ESP32-C3 runner (esp32:esp32:esp32c3 board only) */
  public get ESP32C3Runner(): ESP32C3SimulationRunner | null {
    return this.esp32c3Runner;
  }

  public get isESP32C3Board(): boolean {
    const ESP32_C3_BOARD_IDS = ['esp32-c3', 'esp32'];
    return ESP32_C3_BOARD_IDS.includes(this.selectedBoard);
  }

  /**
   * Send data to Serial input (from Serial Monitor)
   * Works for both AVR and ESP32-C3 boards
   */
  public sendSerialInput(data: string): void {
    // ESP32-C3 path
    if (this.esp32c3Runner?.runtime) {
      this.esp32c3Runner.runtime.sendSerialInput(data);
      return;
    }

    // AVR path
    if (this.usartEmulator) {
      this.usartEmulator.sendData(data);
    } else {
      console.warn('[SimulationRunner] Cannot send serial data: USART not initialized');
    }
  }

  /**
   * ESP32-C3 analog input support - converts voltage to ADC channel
   * For ESP32-C3: GPIO0=CH0, GPIO1=CH1, GPIO2=CH2, GPIO3=CH3, GPIO4=CH4
   */
  setESP32C3AnalogInput(gpioNum: number, voltage: number): void {
    if (!this.esp32c3Runner) return;

    // Convert ESP32 voltage (0-3.3V) to 12-bit ADC value (0-4095)
    const adcValue = Math.round(Math.min(4095, Math.max(0, (voltage / 3.3) * 4095)));
    const pinName = `ESP${gpioNum}`;

    this.esp32c3Runner.injectInput(pinName, adcValue, true);
  }

  /**
   * ESP32-C3 GPIO input support - sets digital input state
   */
  setESP32C3GPIOInput(gpioNum: number, high: boolean): void {
    if (!this.esp32c3Runner) return;
    const pinName = `ESP${gpioNum}`;
    this.esp32c3Runner.injectInput(pinName, high, false);
  }

  /**
   * ESP32-C3 pin listener support - adds callback for GPIO output changes
   */
  addESP32C3PinListener(gpioNum: number, callback: (high: boolean) => void): void {
    if (!this.esp32c3Runner) return;
    const pinName = `ESP${gpioNum}`;
    // Wrap the callback to convert PinState to boolean
    this.esp32c3Runner.addPinListener(pinName, (pin, state) => {
      const high = state === 'HIGH' || (typeof state === 'number' && state > 0);
      callback(high);
    });
  }
}

// Export a singleton instance
export const simulationRunner = new SimulationRunner();
