/**
 * SimulationRunner - The heart of the circuit simulation.
 * Decouples logic execution from UI rendering.
 * Provides a high-frequency tick loop and pin-state management mapped dynamically to AVR8js.
 */
import { avrInstruction, CPU, AVRTimer, timer0Config, timer1Config, timer2Config, AVRIOPort, portBConfig, portCConfig, portDConfig, usart0Config, AVRUSART, AVRADC, adcConfig, AVRTWI, twiConfig, AVRSPI, spiConfig, AVREEPROM, eepromConfig, EEPROMMemoryBackend } from 'avr8js';
import { parseHexString } from './HexParser';
import { BLINK_HEX } from './TestSketches';
import { USARTEmulator } from './USARTEmulator';

export type PinState = 'HIGH' | 'LOW' | 'FLOATING';
export type PinListener = (state: PinState) => void;

export interface PinMapping {
  avrPin: string;
  adcChannel?: number;
}

class SimulationRunner {
  private pinStates: Map<string, PinState> = new Map();
  private listeners: Map<string, Set<PinListener>> = new Map();
  
  private cpu: CPU | null = null;
  private usart: AVRUSART | null = null;
  private usartEmulator: USARTEmulator | null = null;
  private adc: AVRADC | null = null;
  private twi: AVRTWI | null = null;
  private spi: AVRSPI | null = null;
  private eeprom: AVREEPROM | null = null;
  private eepromBackend: EEPROMMemoryBackend | null = null;

  // Custom Event Scheduler for Peripheral Emulation
  private scheduledEvents: { targetCycles: number, callback: () => void }[] = [];

  // Ports
  private portB: AVRIOPort | null = null;
  private portC: AVRIOPort | null = null;
  private portD: AVRIOPort | null = null;

  // Execution configuration
  private isRunning: boolean = false;
  private tickInterval: number | null = null;
  private lastTime: number = 0;
  private readonly MHZ = 16e6;

  constructor() {}

  /**
   * Initializes the inner AVR CPU with a compiled Hex buffer.
   */
  initCPU(hexString: string = BLINK_HEX) {
    console.log('[FORGE ENGINE] initCPU initializing. Parsing HEX string...');
    const progData = parseHexString(hexString);
    this.cpu = new CPU(progData);
    console.log('[FORGE ENGINE] CPU allocated in memory.');
    
    // Attach Core Timers
    new AVRTimer(this.cpu, timer0Config);
    new AVRTimer(this.cpu, timer1Config);
    new AVRTimer(this.cpu, timer2Config);

    // Attach Serial USART listener
    this.usart = new AVRUSART(this.cpu, usart0Config, this.MHZ);
    this.usartEmulator = new USARTEmulator(this.usart, (char) => {
      // Send Serial data to the React UI Panel
      import('../store/useForgeStore').then(({ useForgeStore }) => {
        useForgeStore.getState().appendSerial(char);
      });
      // console.log(`[AVR-Serial]: ${char}`);
    });

    // Attach Physical Ports
    this.portB = new AVRIOPort(this.cpu, portBConfig);
    this.portC = new AVRIOPort(this.cpu, portCConfig);
    this.portD = new AVRIOPort(this.cpu, portDConfig);
    
    // Bind Hardware Ports to UI Pin Emitters
    this.portB.addListener((state) => this.pushPortState('B', state));
    this.portC.addListener((state) => this.pushPortState('C', state));
    this.portD.addListener((state) => this.pushPortState('D', state));
    
    // Attach ADC
    this.adc = new AVRADC(this.cpu, adcConfig);

    // Attach I2C (TWI)
    this.twi = new AVRTWI(this.cpu, twiConfig, this.MHZ);

    // Attach SPI
    this.spi = new AVRSPI(this.cpu, spiConfig);

    // Attach EEPROM
    this.eepromBackend = new EEPROMMemoryBackend(1024); // 1KB for ATMega328P
    this.eeprom = new AVREEPROM(this.cpu!, this.eepromBackend, eepromConfig);
  }

  /**
   * Start the simulation loop
   */
  start() {
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
    this.stop();
    this.cpu = null;
    this.adc = null;
    
    // Broadcast FLOATING to visually turn off LEDs/peripherals
    this.pinStates.forEach((_, pinId) => {
      this.setPinState(pinId, 'FLOATING');
    });
    this.scheduledEvents = [];
    console.log('[FORGE] AVR Simulator Engine reset.');
  }

  /**
   * Hardware Peripheral Interface: Register a callback N cycles in the future.
   */
  public scheduleEvent(cyclesInFuture: number, callback: () => void) {
    if (!this.cpu) return;
    this.scheduledEvents.push({
      targetCycles: this.cpu.cycles + cyclesInFuture,
      callback
    });
    // Sort so the soonest event is always index 0
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

    // Calculate elapsed clock cycles: 16MHz = 16,000 cycles per ms
    const cyclesToRun = Math.floor(elapsedMs * (this.MHZ / 1000));
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

    // Uncomment the following for verbose tracing of every specific pin toggle dynamically.
    console.log(`[FORGE ENGINE] Pin ${pinId} state toggled to ${state}`);

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
    for (let bit = 0; bit < 8; bit++) {
      const isHigh = (state & (1 << bit)) !== 0;
      this.setPinState(`P${portLetter}${bit}`, isHigh ? 'HIGH' : 'LOW');
    }
  }

  /**
   * Bi-directional Sync: Force a pin state externally (e.g. from a virtual Button press)
   * This drives the underlying AVR CPU PORT hardware pins.
   */
  setVirtualInput(pinId: string, isHigh: boolean) {
    if (!this.cpu) return;
    console.log(`[FORGE ENGINE] Virtual Input injected on ${pinId} => ${isHigh ? 'HIGH' : 'LOW'}`);
    
    // Matches patterns like "PB5", "PD2"
    const portLetter = pinId.charAt(1);
    const bit = parseInt(pinId.charAt(2), 10);
    
    if (portLetter === 'B' && this.portB) this.portB.setPin(bit, isHigh);
    else if (portLetter === 'C' && this.portC) this.portC.setPin(bit, isHigh);
    else if (portLetter === 'D' && this.portD) this.portD.setPin(bit, isHigh);
    
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
}

// Export a singleton instance
export const simulationRunner = new SimulationRunner();
