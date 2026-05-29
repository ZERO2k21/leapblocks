/**
 * LeapBlocks – ESP32C3SimulationRunner  (permanent replacement)
 *
 * This module is the authoritative simulation runner for all ESP32 boards.
 * It replaces the old firmware-scan / timeline-replay approach with a
 * true cycle-accurate RV32IMC soft-core, full MMIO peripheral map, and
 * the same CircuitEngine integration that the AVR runner uses.
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │               ESP32-C3 Simulation Stack (v2)                 │
 * ├─────────────────────────────────────────────────────────────┤
 * │  ForgeStudio.tsx                                            │
 * │    ↓ compile(sketch) → .bin or .elf                         │
 * │  ESP32C3SimulationRunner.init(bin)                          │
 * │    ├─ FirmwareLoader: parse ELF/BIN → load IRAM/DRAM        │
 * │    ├─ ESP32C3Platform: wire up all MMIO peripherals         │
 * │    │     GPIO  │ UART0  │ ADC1  │ I2C0  │ SPI2  │ SYSTIMER │
 * │    └─ RiscVCore: RV32IMC soft-core                          │
 * │    ↓ run()                                                   │
 * │  requestAnimationFrame loop                                  │
 * │    ├─ runCycles(CYCLES_PER_FRAME)                           │
 * │    ├─ SysTimer.tick() — alarm callbacks                     │
 * │    ├─ GPIO.onPinChange → setPinState → CircuitEngine        │
 * │    └─ UART.onSerialOutput → SimulationRunner.serialLine     │
 * └─────────────────────────────────────────────────────────────┘
 *
 * Integration with existing SimulationRunner:
 *   ESP32C3SimulationRunner wraps setPinState / getPinState /
 *   injectSensorValue so CircuitEngine sees the same API as AVR.
 */

import { RiscVCore } from './cpu/RiscVCore';
import { ESP32C3GPIO } from './peripherals/GPIO';
import { ESP32C3UART } from './peripherals/UART';
import { ESP32C3ADC } from './peripherals/ADC';
import { ESP32C3I2C } from './peripherals/I2C';
import { ESP32C3SPI } from './peripherals/SPI';
import { ESP32C3SysTimer } from './peripherals/SysTimer';
import { FirmwareLoader } from './compiler/FirmwareLoader';
import { ArduinoRuntime } from './ArduinoRuntime';
import { SimulationOrchestrator } from '../../simulation/SimulationOrchestrator';
import { VelxioEngine } from '../../simulation/engines/VelxioEngine';
import { TranspiledJSEngine } from '../../simulation/engines/TranspiledJSEngine';
import { RiscVEngine } from '../../simulation/engines/RiscVEngine';

// ---------------------------------------------------------------------------
// Types shared with the parent SimulationRunner
// ---------------------------------------------------------------------------

export type PinState = 'HIGH' | 'LOW' | number; // number = PWM 0–255
export type PinListener = (pin: string, state: PinState) => void;
export type SerialListener = (line: string) => void;

/** Pin name format: ESP<n>  e.g. "ESP2", "ESP13" */
export function gpioToPinName(gpio: number): string {
    return `ESP${gpio}`;
}
export function pinNameToGpio(name: string): number {
    return parseInt(name.replace('ESP', ''), 10);
}

// ---------------------------------------------------------------------------
// ESP32-C3 Platform — assembles all MMIO peripherals into one unit
// ---------------------------------------------------------------------------

class ESP32C3Platform {
    readonly core: RiscVCore;
    readonly gpio: ESP32C3GPIO;
    readonly uart0: ESP32C3UART;
    readonly uart1: ESP32C3UART;
    readonly adc: ESP32C3ADC;
    readonly i2c0: ESP32C3I2C;
    readonly i2c1: ESP32C3I2C;
    readonly spi2: ESP32C3SPI;
    readonly spi3: ESP32C3SPI;
    readonly sysTimer: ESP32C3SysTimer;

    constructor() {
        let illegalCount = 0;
        this.core = new RiscVCore({
            onIllegal: (c, insn) => {
                illegalCount++;
                console.error(`[ESP32-C3] Illegal insn 0x${insn.toString(16)} @ PC=0x${c.pc.toString(16)} (count=${illegalCount})`);
                if (insn === 0) {
                    // Instruction 0x0 means fetching from uninitialised memory.
                    // Try to recover by returning via ra (x1) — the function
                    // that called/jumped here likely has a valid return address.
                    const ra = c.regs[1] >>> 0;
                    if (ra !== 0 && ra !== c.pc) {
                        console.warn(`[ESP32-C3] Recovering from insn 0x0 — returning via ra=0x${ra.toString(16)}`);
                        c.pc = ra;
                        return; // don't halt
                    }
                }
                // Halt after too many consecutive illegal instructions
                if (illegalCount > 10) {
                    console.error(`[ESP32-C3] Halting CPU — too many illegal instructions (${illegalCount})`);
                    c.halted = true;
                }
            },
        });

        this.gpio = new ESP32C3GPIO();
        this.uart0 = new ESP32C3UART(0);
        this.uart1 = new ESP32C3UART(1);
        this.adc = new ESP32C3ADC();
        this.i2c0 = new ESP32C3I2C(0);
        this.i2c1 = new ESP32C3I2C(1);
        this.spi2 = new ESP32C3SPI(2);
        this.spi3 = new ESP32C3SPI(3);
        this.sysTimer = new ESP32C3SysTimer();

        // Wire peripherals into MMIO bus
        const bus = this.core.mmio;
        bus.register(this.uart0);
        bus.register(this.uart1);
        bus.register(this.gpio);
        bus.register(this.adc);
        bus.register(this.i2c0);
        bus.register(this.i2c1);
        bus.register(this.spi2);
        bus.register(this.spi3);
        bus.register(this.sysTimer);

        // Wire interrupt sources → interrupt controller
        const irqCtrl = this.core.irqCtrl;
        const raiseIRQ = (n: number) => irqCtrl.raise(n);
        this.uart0.onInterrupt(raiseIRQ);
        this.uart1.onInterrupt(raiseIRQ);
        this.i2c0.onInterrupt(raiseIRQ);
        this.i2c1.onInterrupt(raiseIRQ);
        this.sysTimer.onInterrupt(raiseIRQ);
    }
}

// ---------------------------------------------------------------------------
// Main runner
// ---------------------------------------------------------------------------

/** How many simulated CPU cycles to run per animation frame (60 FPS target).
 *  ESP32-C3 runs at 160 MHz → 160,000,000 / 60 ≈ 2,666,666 cycles/frame.
 *  We run 1/10th of that per JS frame to keep the browser responsive and
 *  allow CircuitEngine updates to propagate quickly.  Users can tune this.
 */
const CYCLES_PER_FRAME = 266_666;

export class ESP32C3SimulationRunner {
    private platform: ESP32C3Platform | null = null;
    private worker: Worker | null = null;
    private rafHandle: number | null = null;
    private running: boolean = false;

    // ── Arduino Runtime (transpiled JS path — recommended) ──
    private arduinoRuntime: ArduinoRuntime | null = null;
    private usingTranspiledPath: boolean = false;

    // ── Simulation Orchestrator (priority-ordered engine chain) ──
    // Priority: TranspiledJS (P1) → Velxio (P2) → RISC-V (P3)
    private orchestrator = new SimulationOrchestrator([
        new TranspiledJSEngine(this),
        new VelxioEngine({
            velxioUrl: this.config?.velxioUrl ?? 'http://localhost:3080',
            timeoutMs: 5000,
            retries: 1,
        }),
        new RiscVEngine(this.platform?.core ?? new RiscVCore()),
    ]);

    /** Optional Velxio configuration (overrides defaults) */
    public config?: { velxioUrl?: string };

    // Listeners registered by CircuitEngine / ForgeStudio
    private pinListeners: Map<string, PinListener[]> = new Map();
    private serialListeners: SerialListener[] = [];

    // Current known pin states (for getPinState queries)
    private pinStates: Map<string, PinState> = new Map();

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    /**
     * Initialize the runner with compiled firmware bytes.
     * Must be called before run().
     *
     * @param firmware   Raw bytes of the compiled .bin or .elf firmware
     * @param entryPoint Optional override for the CPU entry point address
     */
    async init(firmware: Uint8Array, entryPoint?: number): Promise<void> {
        this.stop();

        // ── Diagnostic: Check firmware size ──
        console.log(`[ESP32-C3] init() called with firmware size: ${firmware.length} bytes`);
        if (firmware.length === 0) {
            throw new Error('[ESP32-C3] Firmware is empty! Cannot initialize simulation.');
        }
        if (firmware.length < 32) {
            console.warn('[ESP32-C3] Firmware suspiciously small (<32 bytes). May be invalid.');
        }

        if (typeof Worker === 'undefined') {
            console.log('[ESP32-C3] Worker undefined (Node/Vitest environment). Running in fallback in-thread mode.');
            this.platform = new ESP32C3Platform();
            const loader = new FirmwareLoader(this.platform.core);
            const result = loader.load(firmware);
            this.platform.core.reset(entryPoint ?? result.entryPoint);
            this.platform.sysTimer.cpuCycles = 0;

            // Wire up callbacks
            this.platform.gpio.onPinChange((gpioPin: number, value: number, isAnalog: boolean) => {
                const pin = gpioToPinName(gpioPin);
                const state: PinState = isAnalog ? value : (value ? 'HIGH' : 'LOW');
                this.setPinState(pin, state);
            });
            this.platform.uart0.onSerialOutput((line: string) => {
                this.serialListeners.forEach(cb => cb(line));
            });
            this.platform.uart1.onSerialOutput((line: string) => {
                this.serialListeners.forEach(cb => cb(line));
            });

            console.log(`[ESP32-C3] Initialized firmware in-thread: ${firmware.length} bytes`);
            return;
        }

        // Spawn the worker using native dynamic import URL
        this.worker = new Worker(
            new URL('./esp32Worker.ts', import.meta.url),
            { type: 'module' }
        );

        // Listen for events from background worker thread
        this.worker.onmessage = (e) => {
            const msg = e.data;
            switch (msg.type) {
                case 'gpioBatch': {
                    for (const evt of msg.events) {
                        const pin = gpioToPinName(evt.pin);
                        const state: PinState = evt.isAnalog ? evt.value : (evt.value ? 'HIGH' : 'LOW');
                        this.setPinState(pin, state);
                    }
                    break;
                }
                case 'uartBatch': {
                    for (const evt of msg.events) {
                        this.serialListeners.forEach(cb => cb(evt.line));
                    }
                    break;
                }
                case 'gpioChange': {
                    const pin = gpioToPinName(msg.pin);
                    const state: PinState = msg.isAnalog ? msg.value : (msg.value ? 'HIGH' : 'LOW');
                    this.setPinState(pin, state);
                    break;
                }
                case 'uartTx': {
                    this.serialListeners.forEach(cb => cb(msg.line));
                    break;
                }
                case 'error': {
                    console.error('[ESP32 Worker Error]:', msg.message);
                    break;
                }
                case 'halted': {
                    console.log('[ESP32 Worker] CPU halted');
                    this.running = false;
                    break;
                }
                case 'initialized': {
                    console.log(`[ESP32 Worker] Loaded engine ${msg.engine}, entry point 0x${msg.entryPoint.toString(16)}`);
                    break;
                }
            }
        };

        // Initialize the worker with binary payload
        this.worker.postMessage({
            type: 'init',
            firmware: firmware
        });

        console.log(`[ESP32-C3] Initialized firmware on Web Worker thread: ${firmware.length} bytes`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TRANSPILED JS PATH (recommended — uses ArduinoRuntime instead of RV32IMC)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Initialize with transpiled JavaScript code (Arduino API-level simulation).
     * This is the RECOMMENDED path — it bypasses RISC-V emulation entirely.
     *
     * @param jsCode  Transpiled JavaScript from the server/client transpiler
     */
    async initTranspiled(jsCode: string): Promise<void> {
        this.stop();
        this.usingTranspiledPath = true;

        this.arduinoRuntime = new ArduinoRuntime();

        // ── IMPORTANT ORDER OF OPERATIONS ──────────────────────────────────────
        // 1. Call syncI2CBridge() FIRST — this creates the RealAdafruitSSD1306
        //    class and stores it in _pendingLibraryClasses.
        // 2. THEN read getPendingLibraryClasses() and inject into runtime.
        // 3. THEN loadTranspiledCode() uses the injected classes.
        //
        // Previously this was reversed: classes were read before syncI2CBridge
        // created them, so the OLED class was never injected.
        try {
            const { circuitEngine } = await import('../Arduino/CircuitEngine');

            // Step 1: Wire the I2C bus — this creates RealAdafruitSSD1306 and
            // stores it in _pendingLibraryClasses via syncI2CBridge()
            console.log(`[ESP32 SIM] Calling syncI2CBridge() to create library classes...`);
            circuitEngine.syncI2CBridge();

            // Step 2: NOW read the pending classes (including the just-created
            // RealAdafruitSSD1306) and inject them into the runtime
            const pending = circuitEngine.getPendingLibraryClasses();
            console.log(`[ESP32 SIM] initTranspiled: pending library classes = [${[...pending.keys()].join(', ')}]`);
            for (const [name, cls] of pending) {
                this.arduinoRuntime.injectLibraryClass(name, cls);
                console.log(`[ESP32 SIM] ✓ Injected library class: ${name}`);
            }
        } catch (e) {
            console.warn('[ESP32 SIM] Could not inject library classes:', e);
        }

        // Wire GPIO pin changes to CircuitEngine
        this.arduinoRuntime.onPinChanged((gpio, value, isAnalog) => {
            const pin = gpioToPinName(gpio);
            const state: PinState = isAnalog ? value : (value ? 'HIGH' : 'LOW');
            this.setPinState(pin, state);
        });

        // Wire serial output to listeners
        this.arduinoRuntime.onSerialOutput(line => {
            this.serialListeners.forEach(cb => cb(line));
        });

        // Load the transpiled code (injected classes are now in context)
        try {
            this.arduinoRuntime.loadTranspiledCode(jsCode);
            console.log('[ESP32 SIM] ✓ Transpiled Arduino code loaded successfully.');
        } catch (e: any) {
            console.error('[ESP32 SIM] ✗ Failed to load transpiled code:', e);
            throw e;
        }
    }

    /**
     * Start the transpiled Arduino simulation.
     */
    async runTranspiled(): Promise<void> {
        if (!this.arduinoRuntime) {
            throw new Error('[ESP32-C3] ArduinoRuntime not initialized. Call initTranspiled() first.');
        }
        this.running = true;
        console.log('[ESP32-C3] Starting Arduino API simulation...');
        await this.arduinoRuntime.start();
    }

    /** Expose ArduinoRuntime so CircuitEngine can wire the I2C bus bridge */
    get runtime(): ArduinoRuntime | null {
        return this.arduinoRuntime;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RISC-V PATH (experimental — kept for future use)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Start the simulation loop.
     * If using transpiled path, delegates to runTranspiled().
     * Otherwise uses the RISC-V soft-core.
     */
    run(): void {
        // SimulationOrchestrator handles priority order: Velxio → TranspiledJS → RISC-V.
        // Call orchestrator.run(code, board) from ForgeStudio to use the full chain.
        // Fall through to existing paths below if orchestrator is not being used.
        console.info(`[ESP32-C3] Engine chain: ${this.orchestrator.getEngineStatus().map(e => `${e.name}(p${e.priority})`).join(' → ')}`);

        // If using transpiled path, delegate to runTranspiled
        if (this.usingTranspiledPath) {
            this.runTranspiled();
            return;
        }

        if (this.running) return;
        this.running = true;

        if (this.worker) {
            this.worker.postMessage({ type: 'start' });
            console.log('[ESP32-C3] Started background worker simulation');
        } else {
            if (!this.platform) return;
            this.scheduleFrame();
        }
    }

    stop(): void {
        this.running = false;

        if (this.worker) {
            this.worker.postMessage({ type: 'stop' });
            this.worker.terminate();
            this.worker = null;
            console.log('[ESP32-C3] Worker stopped and terminated');
        }

        // Stop Arduino runtime if active
        if (this.arduinoRuntime) {
            this.arduinoRuntime.stop();
            this.arduinoRuntime = null;
        }
        this.usingTranspiledPath = false;

        if (this.rafHandle !== null) {
            if (typeof cancelAnimationFrame !== 'undefined') {
                cancelAnimationFrame(this.rafHandle);
            } else {
                clearTimeout(this.rafHandle);
            }
            this.rafHandle = null;
        }
    }

    reset(): void {
        if (this.worker) {
            this.worker.postMessage({ type: 'reset' });
        } else if (this.platform) {
            this.platform.core.reset();
            this.platform.sysTimer.cpuCycles = 0;
        }
        this.pinStates.clear();
        console.log('[ESP32-C3] Reset');
    }

    get isRunning(): boolean { return this.running; }

    // -------------------------------------------------------------------------
    // Simulation frame loop
    // -------------------------------------------------------------------------

    private scheduleFrame(): void {
        if (!this.running) return;

        const tick = () => {
            if (!this.running || !this.platform) return;
            this.executeTick();
            this.scheduleFrame();
        };

        if (typeof requestAnimationFrame !== 'undefined') {
            this.rafHandle = requestAnimationFrame(tick);
        } else {
            // Electron / Node — use setImmediate or setTimeout
            this.rafHandle = setTimeout(tick, 16) as unknown as number;
        }
    }

    private frameCount: number = 0;
    private lastPC: number = 0;
    private stuckCount: number = 0;

    private executeTick(): void {
        if (!this.platform) return;
        const { core, sysTimer } = this.platform;

        // Execute CPU instructions
        const cyclesExecuted = core.runCycles(CYCLES_PER_FRAME);

        // Advance system timer
        sysTimer.cpuCycles += cyclesExecuted;
        sysTimer.tick();

        // Diagnostic: log PC every 60 frames (~1 second)
        this.frameCount++;
        if (this.frameCount % 60 === 0) {
            const snap = core.snapshot();
            console.log(`[ESP32-C3] Frame ${this.frameCount}: PC=0x${snap.pc.toString(16)} cycles=${snap.cycles} sp=0x${(snap.regs[2] >>> 0).toString(16)}`);

            // Detect stuck PC — read the instruction and surrounding memory
            if (snap.pc === this.lastPC) {
                this.stuckCount++;
                if (this.stuckCount === 1) {
                    // First time stuck — dump the instruction and nearby memory
                    const pc = snap.pc;
                    const insn0 = core.memRead32(pc);
                    const insn1 = core.memRead32(pc + 4);
                    const insn2 = core.memRead32(pc - 4);
                    console.log(`[ESP32-C3] STUCK at 0x${pc.toString(16)}: insn[-4]=0x${insn2.toString(16)} insn[0]=0x${insn0.toString(16)} insn[+4]=0x${insn1.toString(16)}`);
                    // Dump all registers
                    const regs = snap.regs;
                    for (let i = 0; i < 32; i += 4) {
                        console.log(`[ESP32-C3] x${i}=0x${(regs[i] >>> 0).toString(16)} x${i + 1}=0x${(regs[i + 1] >>> 0).toString(16)} x${i + 2}=0x${(regs[i + 2] >>> 0).toString(16)} x${i + 3}=0x${(regs[i + 3] >>> 0).toString(16)}`);
                    }
                }
            } else {
                this.stuckCount = 0;
            }
            this.lastPC = snap.pc;
        }

        if (core.halted) {
            console.log('[ESP32-C3] CPU halted');
            this.running = false;
        }
    }

    // -------------------------------------------------------------------------
    // Pin state management (CircuitEngine integration API)
    // -------------------------------------------------------------------------

    /** Called internally when GPIO fires a change event */
    setPinState(pin: string, state: PinState): void {
        this.pinStates.set(pin, state);
        const listeners = this.pinListeners.get(pin);
        if (listeners) listeners.forEach(cb => cb(pin, state));
        // Also notify wildcard listeners (registered with '*')
        const wildcards = this.pinListeners.get('*');
        if (wildcards) wildcards.forEach(cb => cb(pin, state));
    }

    /** Returns the last known state of a pin */
    getPinState(pin: string): PinState {
        return this.pinStates.get(pin) ?? 'LOW';
    }

    /**
     * Inject a digital or analog value into a GPIO input.
     * Called by CircuitEngine for buttons, sensors, potentiometers, etc.
     *
     * @param pin      e.g. "ESP0", "ESP4"
     * @param value    boolean for digital; 0–4095 for analog
     * @param isAnalog true → inject into ADC channel
     */
    injectInput(pin: string, value: boolean | number, isAnalog: boolean = false): void {
        const gpio = pinNameToGpio(pin);
        if (isNaN(gpio)) return;

        // Route to Arduino API if using the transpiled path
        if (this.usingTranspiledPath && this.arduinoRuntime) {
            if (isAnalog) {
                const v12 = typeof value === 'number' ? value : (value ? 4095 : 0);
                this.arduinoRuntime.setAnalogInput(gpio, v12);
            } else {
                const high = typeof value === 'boolean' ? value : value > 0;
                this.arduinoRuntime.setDigitalInput(gpio, high);
            }
            return;
        }

        if (this.worker) {
            this.worker.postMessage({
                type: 'gpioWrite',
                pin: gpio,
                value,
                isAnalog
            });
            return;
        }

        if (!this.platform) return;

        if (isAnalog) {
            const v12 = typeof value === 'number' ? value : (value ? 4095 : 0);
            this.platform.gpio.setAnalog(gpio, v12);
            this.platform.adc.setChannelValue(gpio, v12);
        } else {
            const high = typeof value === 'boolean' ? value : value > 0;
            this.platform.gpio.setInput(gpio, high);
        }
    }

    // -------------------------------------------------------------------------
    // Listener registration
    // -------------------------------------------------------------------------

    addPinListener(pin: string, cb: PinListener): void {
        if (!this.pinListeners.has(pin)) this.pinListeners.set(pin, []);
        this.pinListeners.get(pin)!.push(cb);
    }

    removePinListener(pin: string, cb: PinListener): void {
        const list = this.pinListeners.get(pin);
        if (!list) return;
        const idx = list.indexOf(cb);
        if (idx >= 0) list.splice(idx, 1);
    }

    addSerialListener(cb: SerialListener): void {
        this.serialListeners.push(cb);
    }

    removeSerialListener(cb: SerialListener): void {
        const idx = this.serialListeners.indexOf(cb);
        if (idx >= 0) this.serialListeners.splice(idx, 1);
    }

    // -------------------------------------------------------------------------
    // I2C / SPI device registration (for virtual peripherals like OLED, TFT)
    // -------------------------------------------------------------------------

    registerI2CDevice(bus: 0 | 1, device: import('./peripherals/I2C').I2CDevice): void {
        if (!this.platform) return;
        (bus === 0 ? this.platform.i2c0 : this.platform.i2c1).registerDevice(device);
    }

    registerSPIDevice(bus: 2 | 3, device: import('./peripherals/SPI').SPIDevice): void {
        if (!this.platform) return;
        (bus === 2 ? this.platform.spi2 : this.platform.spi3).attachDevice(device);
    }

    // -------------------------------------------------------------------------
    // UART RX injection (e.g. Serial.read() from sensor library)
    // -------------------------------------------------------------------------

    injectSerial(uart: 0 | 1, data: string): void {
        if (this.worker) {
            this.worker.postMessage({ type: 'uartRx', uart, data });
            return;
        }
        if (!this.platform) return;
        (uart === 0 ? this.platform.uart0 : this.platform.uart1).injectRx(data);
    }

    // -------------------------------------------------------------------------
    // Debug / inspection
    // -------------------------------------------------------------------------

    dumpRegisters(): void {
        if (!this.platform) return;
        const snap = this.platform.core.snapshot();
        const regNames = [
            'zero', 'ra', 'sp', 'gp', 'tp', 't0', 't1', 't2',
            's0/fp', 's1', 'a0', 'a1', 'a2', 'a3', 'a4', 'a5',
            'a6', 'a7', 's2', 's3', 's4', 's5', 's6', 's7',
            's8', 's9', 's10', 's11', 't3', 't4', 't5', 't6',
        ];
        console.group('[ESP32-C3] Register Dump');
        console.log(`PC: 0x${snap.pc.toString(16).padStart(8, '0')}`);
        for (let i = 0; i < 32; i++) {
            const name = regNames[i].padEnd(6);
            const val = snap.regs[i] >>> 0;
            console.log(`x${String(i).padStart(2, '0')} (${name}): 0x${val.toString(16).padStart(8, '0')} = ${val}`);
        }
        console.log(`Cycles: ${snap.cycles}`);
        console.groupEnd();
    }

    get cpuState() { return this.platform?.core.snapshot() ?? null; }
    get platform_() { return this.platform; }
}
