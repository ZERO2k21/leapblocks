/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 *
 * ESP32Engine — wraps the QEMU Xtensa WASM binary when available,
 * or falls back to a sketch-aware stub that simulates WiFi / Serial / GPIO
 * by parsing the sketch source and driving SimulationRunner pin states directly.
 */

import { NetworkBridge, NetworkBridgeOptions } from './NetworkBridge';
import type { PinState } from '../SimulationRunner';

export type PinChangeCallback = (pin: number, value: boolean) => void;
export type UARTCallback = (char: string) => void;

export interface ESP32EngineOptions extends NetworkBridgeOptions {
    onPinChange?: PinChangeCallback;
    onUARTData?: UARTCallback;
    /** Original sketch source — used by stub mode to simulate Serial / WiFi / GPIO */
    sketchSource?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Cache the runner reference after first resolution to avoid per-call async overhead
let _runnerRef: { setPinState: (id: string, state: PinState) => void; getPinState: (id: string) => PinState; getESP32AnalogVoltage: (gpio: number) => number } | null = null;

// Cache the store reference for synchronous reads (sensor values, node data)
let _storeRef: { getState: () => { nodes: any[] } } | null = null;

function resolveRunner(): void {
    if (_runnerRef) return;
    import('../SimulationRunner').then(({ simulationRunner }) => {
        _runnerRef = simulationRunner;
    });
}

function resolveStore(): void {
    if (_storeRef) return;
    import('../../store/useForgeStore').then(({ useForgeStore }) => {
        _storeRef = useForgeStore;
    });
}

/** Read a sensor node's sensorValues synchronously — always reads live store state */
function getSensorValue(type: string, key: string, fallback: number): number {
    // Ensure store ref is populated
    if (!_storeRef) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const mod = require('../../store/useForgeStore');
            _storeRef = mod.useForgeStore ?? mod.default;
        } catch { /* ignore */ }
    }
    if (!_storeRef) return fallback;

    // Always read fresh state (not cached) so slider changes are reflected immediately
    const nodes = (_storeRef as any).getState().nodes as any[];
    const node = nodes.find((n: any) => n.data?.type === type);
    if (!node) return fallback;
    const val = node.data?.sensorValues?.[key];
    if (val === undefined || val === null) return fallback;
    const parsed = parseFloat(String(val));
    return isNaN(parsed) ? fallback : parsed;
}

/** Drive an ESP32 GPIO pin state into SimulationRunner synchronously once resolved */
function setESP32Pin(gpio: number, high: boolean): void {
    if (_runnerRef) {
        _runnerRef.setPinState(`ESP${gpio}`, high ? 'HIGH' : 'LOW');
    } else {
        import('../SimulationRunner').then(({ simulationRunner }) => {
            _runnerRef = simulationRunner;
            simulationRunner.setPinState(`ESP${gpio}`, high ? 'HIGH' : 'LOW');
        });
    }
}

function floatESP32Pin(gpio: number): void {
    if (_runnerRef) {
        _runnerRef.setPinState(`ESP${gpio}`, 'FLOATING');
    } else {
        import('../SimulationRunner').then(({ simulationRunner }) => {
            _runnerRef = simulationRunner;
            simulationRunner.setPinState(`ESP${gpio}`, 'FLOATING');
        });
    }
}

/** Get store state synchronously — uses cached ref, falls back to dynamic import */
function withStore(fn: (nodes: any[], updateNodeData: (id: string, data: any) => void) => void): void {
    if (_storeRef) {
        const { nodes, updateNodeData } = (_storeRef as any).getState();
        fn(nodes, updateNodeData);
    } else {
        import('../../store/useForgeStore').then(({ useForgeStore }) => {
            _storeRef = useForgeStore;
            const { nodes, updateNodeData } = useForgeStore.getState();
            fn(nodes, updateNodeData);
        });
    }
}

// Pre-resolve on module load
resolveRunner();
resolveStore();

// ─── Stub-mode sketch interpreter ────────────────────────────────────────────
// Parses the sketch source and replays digitalWrite / Serial.print / WiFi.begin
// with real timing so the circuit canvas and serial monitor stay useful even
// without the WASM binary.

interface StubTask {
    intervalMs: number;
    lastRun: number;
    fn: () => void;
}

class SketchStub {
    private tasks: StubTask[] = [];
    private rafId: number | null = null;
    private running = false;
    private touchedPins = new Set<number>();

    constructor(
        private source: string,
        private uart: (char: string) => void,
        private bridge: NetworkBridge,
        private log: (msg: string) => void,
    ) { }

    start(): void {
        this.running = true;
        this.tasks = [];
        this.parseAndSchedule();
        this.tick();
    }

    stop(): void {
        this.running = false;
        if (this.rafId !== null) { cancelAnimationFrame(this.rafId); this.rafId = null; }
        // Float all pins we touched
        this.touchedPins.forEach(gpio => floatESP32Pin(gpio));
        this.touchedPins.clear();
    }

    private tick = () => {
        if (!this.running) return;
        const now = performance.now();
        for (const t of this.tasks) {
            if (now - t.lastRun >= t.intervalMs) {
                t.lastRun = now;
                t.fn();
            }
        }
        this.rafId = requestAnimationFrame(this.tick);
    };

    private emit(text: string): void {
        for (const ch of text) this.uart(ch);
    }

    private drivePin(gpio: number, high: boolean): void {
        this.touchedPins.add(gpio);
        setESP32Pin(gpio, high);
    }

    private parseAndSchedule(): void {
        const src = this.source;

        // ── Resolve #define / const constants ────────────────────────────────
        const defines = new Map<string, number>();
        for (const m of src.matchAll(/#define\s+(\w+)\s+(\d+)/g)) {
            defines.set(m[1], parseInt(m[2], 10));
        }
        for (const m of src.matchAll(/(?:const\s+\w+|int|uint8_t)\s+(\w+)\s*=\s*(\d+)/g)) {
            defines.set(m[1], parseInt(m[2], 10));
        }

        const resolvePin = (token: string): number | null => {
            const n = parseInt(token, 10);
            if (!isNaN(n)) return n;
            const v = defines.get(token);
            return v !== undefined ? v : null;
        };

        // ── Build LEDC channel → GPIO pin map from ledcSetup/ledcAttachPin ──
        // This mirrors migrateESP32LedcAPI so the stub understands ledcWrite(ch, duty)
        const ledcChToPin = new Map<number, number>(); // channel → gpio
        for (const m of src.matchAll(/ledcAttachPin\s*\(\s*(\w+)\s*,\s*(\w+)\s*\)/g)) {
            const pin = resolvePin(m[1]);
            const ch = resolvePin(m[2]);
            if (pin !== null && ch !== null) {
                ledcChToPin.set(ch, pin);
            }
        }
        // v3 API: ledcAttach(pin, freq, res) — pin is used directly in ledcWrite(pin, duty)
        // No channel mapping needed; ledcWrite(pin, duty) uses pin directly
        if (ledcChToPin.size > 0) {
            console.log('[ESP32 Stub] LEDC ch→pin map:', [...ledcChToPin.entries()].map(([c, p]) => `ch${c}→GPIO${p}`).join(', '));
        }

        // ── Extract a function body by name ───────────────────────────────────
        const extractBody = (fnName: string): string => {
            const re = new RegExp(`void\\s+${fnName}\\s*\\(\\s*\\)\\s*\\{`);
            const m = src.match(re);
            if (!m || m.index === undefined) return '';
            let depth = 0;
            let i = m.index + m[0].length;
            const start = i;
            while (i < src.length) {
                if (src[i] === '{') depth++;
                else if (src[i] === '}') {
                    if (depth === 0) break;
                    depth--;
                }
                i++;
            }
            return src.slice(start, i);
        };

        // ── Action types ──────────────────────────────────────────────────────
        interface Action {
            type: 'digitalWrite' | 'print' | 'println' | 'delay'
            | 'printAnalog' | 'printDigital' | 'servoWrite'
            | 'varAssign' | 'printVar' | 'neopixelSet' | 'neopixelShow'
            | 'dhtRead'
            // ── New sensor actions ────────────────────────────────────────
            | 'lcdPrint' | 'lcdClear' | 'lcdSetCursor'
            | 'oledClear' | 'oledPrint' | 'oledDisplay'
            | 'stepperStep' | 'stepperSetSpeed' | 'stepperSetDir'
            | 'tonePlay' | 'toneStop'
            | 'sensorRead';   // generic: reads any sensor node value
            gpio?: number;
            high?: boolean;
            text?: string;
            ms?: number;
            newline?: boolean;
            varName?: string;
            varExpr?: string;
            servoName?: string;
            angleExpr?: string;
            pixelIndex?: string;
            r?: string; g?: string; b?: string;
            dhtType?: 'temp' | 'humidity';
            // lcd
            col?: number; row?: number;
            // stepper
            steps?: string; speed?: string; dir?: string;
            // tone
            freq?: number; pin?: number;
            // sensor
            sensorType?: string; sensorKey?: string;
        }

        // ── Runtime variable store ────────────────────────────────────────────
        const runtimeVars = new Map<string, number>();
        defines.forEach((v, k) => runtimeVars.set(k, v));

        const resolveValue = (token: string): number | null => {
            const n = parseFloat(token);
            if (!isNaN(n)) return n;
            return runtimeVars.get(token) ?? null;
        };

        // ── Parse a function body into an ordered action list ─────────────────
        const parseActions = (body: string): Action[] => {
            const result: Action[] = [];
            const lines = body.split(/[;\n]/).map(l => l.trim()).filter(Boolean);
            for (const line of lines) {
                if (line.startsWith('//') || line.startsWith('/*')) continue;

                // ── digitalWrite ──────────────────────────────────────────────
                const dw = line.match(/\bdigitalWrite\s*\(\s*(\w+)\s*,\s*(HIGH|LOW|1|0)\s*\)/);
                if (dw) {
                    const gpio = resolvePin(dw[1]);
                    if (gpio !== null) result.push({ type: 'digitalWrite', gpio, high: dw[2] === 'HIGH' || dw[2] === '1' });
                    continue;
                }

                // ── ledcWrite(channel_or_pin, duty) — ESP32 PWM ───────────────
                // duty 0 = OFF, 1-255 = ON (treat as digital for LED simulation)
                const lw = line.match(/\bledcWrite\s*\(\s*(\w+)\s*,\s*(\w+)\s*\)/);
                if (lw) {
                    const chOrPin = resolvePin(lw[1]);
                    const duty = resolvePin(lw[2]) ?? 0;
                    if (chOrPin !== null) {
                        // Resolve channel → GPIO pin using the ledcChToPin map
                        const gpio = ledcChToPin.get(chOrPin) ?? chOrPin;
                        result.push({ type: 'digitalWrite', gpio, high: duty > 0 });
                    }
                    continue;
                }

                // ── analogWrite(pin, duty) — ESP32 PWM shorthand ──────────────
                const aw = line.match(/\banalogWrite\s*\(\s*(\w+)\s*,\s*(\w+)\s*\)/);
                if (aw) {
                    const gpio = resolvePin(aw[1]);
                    const duty = resolvePin(aw[2]) ?? 0;
                    if (gpio !== null) result.push({ type: 'digitalWrite', gpio, high: duty > 0 });
                    continue;
                }

                // ── servo.write ───────────────────────────────────────────────
                const sw = line.match(/(\w+)\.write\s*\(\s*(\w+)\s*\)/);
                if (sw && sw[1] !== 'Serial' && sw[1] !== 'Wire') {
                    result.push({ type: 'servoWrite', servoName: sw[1], angleExpr: sw[2] });
                    continue;
                }

                // ── NeoPixel strip.setPixelColor(i, r, g, b) — 4-arg form ────
                const neo4 = line.match(/\w+\.setPixelColor\s*\(\s*(\w+)\s*,\s*(\w+)\s*,\s*(\w+)\s*,\s*(\w+)\s*\)/);
                if (neo4) {
                    result.push({ type: 'neopixelSet', pixelIndex: neo4[1], r: neo4[2], g: neo4[3], b: neo4[4] });
                    continue;
                }

                // ── NeoPixel strip.setPixelColor(i, strip.Color(r,g,b)) — inline Color() ──
                const neoInline = line.match(/\w+\.setPixelColor\s*\(\s*(\w+)\s*,\s*\w+\.Color\s*\(\s*(\w+)\s*,\s*(\w+)\s*,\s*(\w+)\s*\)\s*\)/);
                if (neoInline) {
                    result.push({ type: 'neopixelSet', pixelIndex: neoInline[1], r: neoInline[2], g: neoInline[3], b: neoInline[4] });
                    continue;
                }

                // ── NeoPixel strip.setPixelColor(i, colorVar) — 2-arg packed color ──
                const neo2 = line.match(/\w+\.setPixelColor\s*\(\s*(\w+)\s*,\s*(\w+)\s*\)/);
                if (neo2) {
                    // colorVar may be a packed uint32 from strip.Color() stored in runtimeVars
                    result.push({ type: 'neopixelSet', pixelIndex: neo2[1], r: `__packed_r_${neo2[2]}`, g: `__packed_g_${neo2[2]}`, b: `__packed_b_${neo2[2]}` });
                    continue;
                }

                // ── strip.Color(r, g, b) stored in variable ───────────────────
                // e.g. uint32_t c = strip.Color(255, 0, 0)
                const colorAssign = line.match(/(?:(?:uint32_t|int|long|auto)\s+)?(\w+)\s*=\s*\w+\.Color\s*\(\s*(\w+)\s*,\s*(\w+)\s*,\s*(\w+)\s*\)/);
                if (colorAssign) {
                    // Store packed color as __color_VAR_r/g/b in runtimeVars
                    result.push({ type: 'varAssign', varName: `__packed_r_${colorAssign[1]}`, varExpr: colorAssign[2] });
                    result.push({ type: 'varAssign', varName: `__packed_g_${colorAssign[1]}`, varExpr: colorAssign[3] });
                    result.push({ type: 'varAssign', varName: `__packed_b_${colorAssign[1]}`, varExpr: colorAssign[4] });
                    // Also store the variable itself as a numeric (packed) value for other uses
                    result.push({ type: 'varAssign', varName: colorAssign[1], varExpr: colorAssign[2] }); // approximate: store R as value
                    continue;
                }

                // ── strip.fill(color, first, count) ──────────────────────────
                const neoFill = line.match(/\w+\.fill\s*\(\s*\w+\.Color\s*\(\s*(\w+)\s*,\s*(\w+)\s*,\s*(\w+)\s*\)/);
                if (neoFill) {
                    // Fill all pixels with this color
                    result.push({ type: 'neopixelSet', pixelIndex: '0', r: neoFill[1], g: neoFill[2], b: neoFill[3] });
                    continue;
                }

                if (/\w+\.show\s*\(\s*\)/.test(line)) {
                    result.push({ type: 'neopixelShow' });
                    continue;
                }

                // ── strip.clear() / strip.begin() / strip.setBrightness() ────
                if (/\w+\.clear\s*\(\s*\)/.test(line) && /strip|pixels|neo/i.test(line)) {
                    result.push({ type: 'neopixelSet', pixelIndex: '0', r: '0', g: '0', b: '0' });
                    continue;
                }

                // ── DHT readTemperature / readHumidity ────────────────────────
                const dhtT = line.match(/(?:float|int)\s+(\w+)\s*=\s*\w+\.readTemperature\s*\(\s*\)/);
                if (dhtT) { result.push({ type: 'dhtRead', varName: dhtT[1], dhtType: 'temp' }); continue; }
                const dhtH = line.match(/(?:float|int)\s+(\w+)\s*=\s*\w+\.readHumidity\s*\(\s*\)/);
                if (dhtH) { result.push({ type: 'dhtRead', varName: dhtH[1], dhtType: 'humidity' }); continue; }
                const dhtTR = line.match(/^(\w+)\s*=\s*\w+\.readTemperature\s*\(\s*\)/);
                if (dhtTR) { result.push({ type: 'dhtRead', varName: dhtTR[1], dhtType: 'temp' }); continue; }
                const dhtHR = line.match(/^(\w+)\s*=\s*\w+\.readHumidity\s*\(\s*\)/);
                if (dhtHR) { result.push({ type: 'dhtRead', varName: dhtHR[1], dhtType: 'humidity' }); continue; }

                // ── Variable = analogRead(pin) ────────────────────────────────
                const vaAR = line.match(/(?:(?:int|float|long)\s+)?(\w+)\s*=\s*analogRead\s*\(\s*(\w+)\s*\)/);
                if (vaAR) {
                    const gpio = resolvePin(vaAR[2]);
                    if (gpio !== null) result.push({ type: 'varAssign', varName: vaAR[1], varExpr: `__ar_${gpio}` });
                    continue;
                }
                // ── Variable = digitalRead(pin) ───────────────────────────────
                const vaDR = line.match(/(?:(?:int|bool)\s+)?(\w+)\s*=\s*digitalRead\s*\(\s*(\w+)\s*\)/);
                if (vaDR) {
                    const gpio = resolvePin(vaDR[2]);
                    if (gpio !== null) result.push({ type: 'varAssign', varName: vaDR[1], varExpr: `__dr_${gpio}` });
                    continue;
                }
                // ── Variable = pulseIn(pin, HIGH/LOW) — HC-SR04 echo duration ─
                const vaPulse = line.match(/(?:(?:long|int|float)\s+)?(\w+)\s*=\s*pulseIn\s*\(\s*(\w+)\s*,\s*(HIGH|LOW)\s*\)/);
                if (vaPulse) {
                    // Store as __pulseIn marker; execAction reads HC-SR04 distance from store
                    result.push({ type: 'varAssign', varName: vaPulse[1], varExpr: '__pulseIn' });
                    continue;
                }
                // ── Variable = pulseIn(...) / divisor  (inline division) ────────
                const vaPulseDiv = line.match(/(?:(?:long|int|float)\s+)?(\w+)\s*=\s*pulseIn\s*\([^)]+\)\s*([*/])\s*([\d.]+)/);
                if (vaPulseDiv) {
                    result.push({ type: 'varAssign', varName: vaPulseDiv[1], varExpr: `__pulseIn${vaPulseDiv[2]}${vaPulseDiv[3]}` });
                    continue;
                }

                // ── Variable assignment ───────────────────────────────────────
                const va = line.match(/^(?:(?:int|float|long|bool|byte)\s+)?(\w+)\s*=\s*(.+)$/);
                if (va && !va[1].match(/^(if|while|for|void|const|return|else)$/)) {
                    result.push({ type: 'varAssign', varName: va[1], varExpr: va[2].trim() });
                    continue;
                }
                const vaInc = line.match(/^(\w+)\s*(\+\+|--)$/) || line.match(/^(\+\+|--)(\w+)$/);
                if (vaInc) {
                    const name = vaInc[1].match(/^\w+$/) ? vaInc[1] : vaInc[2];
                    const op = vaInc[1].match(/^\w+$/) ? vaInc[2] : vaInc[1];
                    result.push({ type: 'varAssign', varName: name, varExpr: op === '++' ? `${name}+1` : `${name}-1` });
                    continue;
                }
                const vaOp = line.match(/^(\w+)\s*(\+=|-=|\*=|\/=)\s*(.+)$/);
                if (vaOp) {
                    const opMap: Record<string, string> = { '+=': '+', '-=': '-', '*=': '*', '/=': '/' };
                    result.push({ type: 'varAssign', varName: vaOp[1], varExpr: `${vaOp[1]}${opMap[vaOp[2]]}${vaOp[3].trim()}` });
                    continue;
                }

                // ── Serial.print/println ──────────────────────────────────────
                const sp = line.match(/Serial\.print(ln)?\s*\(\s*["']([^"']*)['"]/);
                if (sp) { result.push({ type: sp[1] ? 'println' : 'print', text: sp[2] }); continue; }

                const spa = line.match(/Serial\.print(ln)?\s*\(\s*analogRead\s*\(\s*(\w+)\s*\)\s*\)/);
                if (spa) { const g = resolvePin(spa[2]); if (g !== null) { result.push({ type: 'printAnalog', gpio: g, newline: !!spa[1] }); continue; } }

                const spd = line.match(/Serial\.print(ln)?\s*\(\s*digitalRead\s*\(\s*(\w+)\s*\)\s*\)/);
                if (spd) { const g = resolvePin(spd[2]); if (g !== null) { result.push({ type: 'printDigital', gpio: g, newline: !!spd[1] }); continue; } }

                const spv = line.match(/Serial\.print(ln)?\s*\(\s*(\w+)\s*\)/);
                if (spv && spv[2] !== 'Serial') { result.push({ type: 'printVar', varName: spv[2], newline: !!spv[1] }); continue; }

                // ── delay / delayMicroseconds ─────────────────────────────────
                const dl = line.match(/\bdelay\s*\(\s*(\d+)\s*\)/);
                if (dl) result.push({ type: 'delay', ms: parseInt(dl[1]) });
                // delayMicroseconds — treat as no-op in stub (µs delays are too small to schedule)
                // The pulseIn() handler reads distance directly from the sensor node

                // ── LCD: lcd.print("text") / lcd.setCursor(col,row) / lcd.clear() ──
                const lcdPrint = line.match(/\w+\.print\s*\(\s*["']([^"']*)['"]\s*\)/);
                if (lcdPrint) { result.push({ type: 'lcdPrint', text: lcdPrint[1] }); continue; }
                const lcdPrintVar = line.match(/\w+\.print\s*\(\s*(\w+)\s*\)/);
                if (lcdPrintVar && lcdPrintVar[1] !== 'Serial') { result.push({ type: 'lcdPrint', varName: lcdPrintVar[1] }); continue; }
                const lcdCursor = line.match(/\w+\.setCursor\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/);
                if (lcdCursor) { result.push({ type: 'lcdSetCursor', col: parseInt(lcdCursor[1]), row: parseInt(lcdCursor[2]) }); continue; }
                if (/\w+\.clear\s*\(\s*\)/.test(line) && !/oled|display|u8g/i.test(line)) {
                    result.push({ type: 'lcdClear' }); continue;
                }

                // ── OLED: display.clearDisplay() / display.println() / display.display() ──
                if (/\w+\.clearDisplay\s*\(\s*\)/.test(line)) { result.push({ type: 'oledClear' }); continue; }
                const oledPrint = line.match(/\w+\.println?\s*\(\s*["']([^"']*)['"]\s*\)/);
                if (oledPrint && /display|oled|u8g/i.test(line)) { result.push({ type: 'oledPrint', text: oledPrint[1], newline: line.includes('println') }); continue; }
                if (/\w+\.display\s*\(\s*\)/.test(line)) { result.push({ type: 'oledDisplay' }); continue; }

                // ── Stepper: stepper.step(n) / stepper.setSpeed(n) ───────────
                const stepStep = line.match(/(\w+)\.step\s*\(\s*(-?\w+)\s*\)/);
                if (stepStep) { result.push({ type: 'stepperStep', steps: stepStep[2] }); continue; }
                const stepSpeed = line.match(/(\w+)\.setSpeed\s*\(\s*(\w+)\s*\)/);
                if (stepSpeed) { result.push({ type: 'stepperSetSpeed', speed: stepSpeed[2] }); continue; }

                // ── Tone: tone(pin, freq) / noTone(pin) ──────────────────────
                const toneM = line.match(/\btone\s*\(\s*(\w+)\s*,\s*(\d+)/);
                if (toneM) { result.push({ type: 'tonePlay', gpio: resolvePin(toneM[1]) ?? 0, freq: parseInt(toneM[2]) }); continue; }
                if (/\bnoTone\s*\(/.test(line)) { result.push({ type: 'toneStop' }); continue; }
            }
            return result;
        };

        // ── Execute an action immediately ─────────────────────────────────────
        const execAction = (action: Action) => {
            switch (action.type) {
                case 'digitalWrite': this.drivePin(action.gpio!, action.high!); break;
                case 'print': this.emit(action.text!); break;
                case 'println': this.emit(action.text! + '\n'); break;

                case 'varAssign': {
                    const expr = action.varExpr!;
                    // analogRead marker — synchronous via cached runner ref
                    if (expr.startsWith('__ar_')) {
                        const gpio = parseInt(expr.replace('__ar_', ''), 10);
                        const v = _runnerRef
                            ? (_runnerRef as any).getESP32AnalogVoltage(gpio)
                            : 0;
                        runtimeVars.set(action.varName!, Math.round((v / 3.3) * 4095));
                        break;
                    }
                    // digitalRead marker — synchronous via cached runner ref
                    if (expr.startsWith('__dr_')) {
                        const gpio = parseInt(expr.replace('__dr_', ''), 10);
                        const state = _runnerRef
                            ? (_runnerRef as any).getPinState(`ESP${gpio}`)
                            : 'LOW';
                        runtimeVars.set(action.varName!, state === 'HIGH' ? 1 : 0);
                        break;
                    }
                    // pulseIn marker — read HC-SR04 distance from store → µs duration (synchronous)
                    if (expr === '__pulseIn') {
                        const distCm = getSensorValue('hc-sr04', 'distance', 100);
                        runtimeVars.set(action.varName!, distCm * 58); // µs = cm × 58
                        break;
                    }
                    // pulseIn with inline arithmetic: __pulseIn/58.0 or __pulseIn*0.034
                    if (expr.startsWith('__pulseIn')) {
                        const distCm = getSensorValue('hc-sr04', 'distance', 100);
                        const durationUs = distCm * 58;
                        const rest = expr.slice('__pulseIn'.length); // e.g. "/58.0" or "*0.034"
                        const opMatch = rest.match(/^([*/])([\d.]+)$/);
                        if (opMatch) {
                            const b = parseFloat(opMatch[2]);
                            const result = opMatch[1] === '/' ? (b ? durationUs / b : 0) : durationUs * b;
                            runtimeVars.set(action.varName!, result);
                        } else {
                            runtimeVars.set(action.varName!, durationUs);
                        }
                        break;
                    }
                    // Simple arithmetic: supports a OP b and chained a OP b OP c
                    const m = expr.match(/^([\w.]+)\s*([+\-*/])\s*([\w.]+)$/);
                    if (m) {
                        const a = resolveValue(m[1]) ?? 0;
                        const b = resolveValue(m[3]) ?? 0;
                        const ops: Record<string, number> = { '+': a + b, '-': a - b, '*': a * b, '/': b ? a / b : 0 };
                        runtimeVars.set(action.varName!, ops[m[2]]);
                    } else {
                        // Try chained: a OP b OP c (left-to-right)
                        const parts = expr.match(/^([\w.]+)((?:\s*[+\-*/]\s*[\w.]+)+)$/);
                        if (parts) {
                            let result = resolveValue(parts[1]) ?? 0;
                            const ops = [...parts[2].matchAll(/\s*([+\-*/])\s*([\w.]+)/g)];
                            for (const op of ops) {
                                const b = resolveValue(op[2]) ?? 0;
                                switch (op[1]) {
                                    case '+': result += b; break;
                                    case '-': result -= b; break;
                                    case '*': result *= b; break;
                                    case '/': if (b) result /= b; break;
                                }
                            }
                            runtimeVars.set(action.varName!, result);
                        } else {
                            const v = resolveValue(expr);
                            if (v !== null) runtimeVars.set(action.varName!, v);
                        }
                    }
                    break;
                }

                case 'printVar': {
                    const v = resolveValue(action.varName!);
                    // Round to 2 decimal places for cleaner output
                    const text = v !== null
                        ? (Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100))
                        : action.varName!;
                    this.emit(action.newline ? text + '\n' : text);
                    break;
                }

                case 'dhtRead': {
                    withStore((nodes) => {
                        const dhtNode = nodes.find((n: any) => n.data?.type === 'dht22' || n.data?.type === 'dht11');
                        const sv = dhtNode?.data?.sensorValues ?? {};
                        const val = action.dhtType === 'temp' ? (sv.temperature ?? 25) : (sv.humidity ?? 50);
                        runtimeVars.set(action.varName!, val);
                    });
                    break;
                }

                case 'servoWrite': {
                    const angle = resolveValue(action.angleExpr!);
                    if (angle === null) break;
                    const clamped = Math.max(0, Math.min(180, angle));
                    withStore((nodes, updateNodeData) => {
                        const servoNode = nodes.find((n: any) => n.data?.type === 'servo');
                        if (servoNode) updateNodeData(servoNode.id, { angle: clamped });
                    });
                    break;
                }

                case 'neopixelSet': {
                    const idx = Math.round(resolveValue(action.pixelIndex!) ?? 0);
                    // Resolve r/g/b — may be direct values or __packed_r/g/b_ markers
                    const r = Math.round(resolveValue(action.r!) ?? runtimeVars.get(action.r!) ?? 0);
                    const g = Math.round(resolveValue(action.g!) ?? runtimeVars.get(action.g!) ?? 0);
                    const b = Math.round(resolveValue(action.b!) ?? runtimeVars.get(action.b!) ?? 0);
                    withStore((nodes, updateNodeData) => {
                        const neoNode = nodes.find((n: any) =>
                            n.data?.type === 'neopixel' || n.data?.type === 'neopixel-matrix' || n.data?.type === 'led-ring'
                        );
                        if (!neoNode) return;
                        if (neoNode.data?.type === 'neopixel' && idx === 0) {
                            updateNodeData(neoNode.id, { neopixelR: r / 255, neopixelG: g / 255, neopixelB: b / 255 });
                        } else {
                            const pixels = [...(neoNode.data?.neopixelPixels ?? [])];
                            pixels[idx] = { r, g, b };
                            updateNodeData(neoNode.id, { neopixelPixels: pixels });
                        }
                    });
                    break;
                }

                case 'neopixelShow': break;

                // ── LCD ───────────────────────────────────────────────────────
                case 'lcdClear': {
                    withStore((nodes, updateNodeData) => {
                        const lcd = nodes.find((n: any) => n.data?.type === 'lcd1602' || n.data?.type === 'lcd2004' || n.data?.type === 'lcd1602-i2c' || n.data?.type === 'lcd2004-i2c');
                        if (lcd) updateNodeData(lcd.id, { lcdState: { characters: new Array(32).fill(32), cursorX: 0, cursorY: 0, cursor: false, blink: false, backlight: true } });
                    });
                    break;
                }
                case 'lcdSetCursor': {
                    runtimeVars.set('__lcdCol', action.col ?? 0);
                    runtimeVars.set('__lcdRow', action.row ?? 0);
                    break;
                }
                case 'lcdPrint': {
                    const text = action.text ?? (action.varName ? String(resolveValue(action.varName!) ?? action.varName) : '');
                    withStore((nodes, updateNodeData) => {
                        const lcd = nodes.find((n: any) =>
                            n.data?.type === 'lcd1602' || n.data?.type === 'lcd2004' ||
                            n.data?.type === 'lcd1602-i2c' || n.data?.type === 'lcd2004-i2c'
                        );
                        if (!lcd) return;
                        const cols = (lcd.data?.type === 'lcd2004' || lcd.data?.type === 'lcd2004-i2c') ? 20 : 16;
                        const rows = (lcd.data?.type === 'lcd2004' || lcd.data?.type === 'lcd2004-i2c') ? 4 : 2;
                        const prev = lcd.data?.lcdState ?? {};
                        const chars: number[] = prev.characters ? [...prev.characters] : new Array(cols * rows).fill(32);
                        const col = runtimeVars.get('__lcdCol') ?? 0;
                        const row = runtimeVars.get('__lcdRow') ?? 0;
                        let pos = row * cols + col;
                        for (const ch of text) {
                            if (pos < chars.length) chars[pos++] = ch.charCodeAt(0);
                        }
                        runtimeVars.set('__lcdCol', Math.min(col + text.length, cols - 1));
                        updateNodeData(lcd.id, { lcdState: { ...prev, characters: chars } });
                    });
                    break;
                }

                // ── OLED ──────────────────────────────────────────────────────
                case 'oledClear': {
                    withStore((nodes, updateNodeData) => {
                        const oled = nodes.find((n: any) => n.data?.type === 'ssd1306');
                        if (oled) updateNodeData(oled.id, { oledImageData: new ImageData(128, 64) });
                    });
                    break;
                }
                case 'oledPrint': {
                    const oledText = action.text ?? '';
                    withStore((nodes, updateNodeData) => {
                        const oled = nodes.find((n: any) => n.data?.type === 'ssd1306');
                        if (!oled) return;
                        const lines: string[] = [...(oled.data?.oledLines ?? [])];
                        if (action.newline) { lines.push(oledText); } else {
                            if (lines.length === 0) lines.push('');
                            lines[lines.length - 1] += oledText;
                        }
                        while (lines.length > 8) lines.shift();
                        updateNodeData(oled.id, { oledLines: lines });
                    });
                    break;
                }
                case 'oledDisplay': {
                    withStore((nodes, updateNodeData) => {
                        const oled = nodes.find((n: any) => n.data?.type === 'ssd1306');
                        if (!oled) return;
                        const lines: string[] = oled.data?.oledLines ?? [];
                        const img = new ImageData(128, 64);
                        lines.forEach((line: string, row: number) => {
                            const y = row * 8;
                            [...line].forEach((ch: string, col: number) => {
                                const x = col * 6;
                                for (let dy = 1; dy < 7; dy++) {
                                    for (let dx = 0; dx < 5; dx++) {
                                        const px = (y + dy) * 128 + (x + dx);
                                        if (px < img.data.length / 4) {
                                            img.data[px * 4] = img.data[px * 4 + 1] = img.data[px * 4 + 2] = img.data[px * 4 + 3] = 255;
                                        }
                                    }
                                }
                            });
                        });
                        updateNodeData(oled.id, { oledImageData: img });
                    });
                    break;
                }

                // ── Stepper ───────────────────────────────────────────────────
                case 'stepperStep': {
                    const steps = Math.round(resolveValue(action.steps!) ?? 0);
                    if (steps === 0) break;
                    withStore((nodes, updateNodeData) => {
                        const stepper = nodes.find((n: any) => n.data?.type === 'stepper-motor');
                        if (!stepper) return;
                        const currentAngle = stepper.data?.angle ?? 0;
                        const delta = (steps / 200) * 360;
                        const newAngle = ((currentAngle + delta) % 360 + 360) % 360;
                        updateNodeData(stepper.id, {
                            angle: newAngle,
                            value: `${newAngle.toFixed(1)}°`,
                            units: `${steps > 0 ? '+' : ''}${steps} steps`,
                            arrow: '#BEF264',
                            stepCount: (stepper.data?.stepCount ?? 0) + steps,
                        });
                    });
                    break;
                }
                case 'stepperSetSpeed': break;

                // ── Tone ──────────────────────────────────────────────────────
                case 'tonePlay': {
                    withStore((nodes, updateNodeData) => {
                        const buzzer = nodes.find((n: any) => n.data?.type === 'buzzer');
                        if (buzzer) updateNodeData(buzzer.id, { hasSignal: true, intensity: 1.0, frequency: action.freq });
                    });
                    break;
                }
                case 'toneStop': {
                    withStore((nodes, updateNodeData) => {
                        const buzzer = nodes.find((n: any) => n.data?.type === 'buzzer');
                        if (buzzer) updateNodeData(buzzer.id, { hasSignal: false, intensity: 0 });
                    });
                    break;
                }

                case 'printAnalog': {
                    const voltage = _runnerRef ? (_runnerRef as any).getESP32AnalogVoltage(action.gpio!) : 0;
                    const raw = Math.round((voltage / 3.3) * 4095);
                    this.emit(action.newline ? `${raw}\n` : `${raw}`);
                    break;
                }
                case 'printDigital': {
                    const state = _runnerRef ? (_runnerRef as any).getPinState(`ESP${action.gpio!}`) : 'LOW';
                    const val = state === 'HIGH' ? '1' : '0';
                    this.emit(action.newline ? `${val}\n` : val);
                    break;
                }
            }
        };

        // ── WiFi.begin (anywhere in source) ──────────────────────────────────
        const wifiBegin = src.match(/WiFi\.begin\s*\(\s*["']([^"']+)["']/);
        if (wifiBegin) {
            const ssid = wifiBegin[1];
            setTimeout(() => {
                if (!this.running) return;
                this.log(`[WiFi] Connecting to "${ssid}"...`);
                this.emit(`Connecting to ${ssid}\n`);
                setTimeout(() => {
                    if (!this.running) return;
                    this.bridge.handleROMCall(0x400819DC, 0, 0, 0, 0);
                    this.emit(`WiFi connected!\nIP: ${this.bridge.ipAddress}\n`);
                }, 600);
            }, 400);
        }

        // ── Run setup() once immediately ──────────────────────────────────────
        const setupActions = parseActions(extractBody('setup'));
        // Execute setup actions sequentially with their delays
        let setupDelay = 0;
        for (const action of setupActions) {
            if (action.type === 'delay') {
                setupDelay += action.ms!;
            } else {
                const capturedDelay = setupDelay;
                const capturedAction = action;
                if (capturedDelay === 0) {
                    execAction(capturedAction);
                } else {
                    setTimeout(() => {
                        if (!this.running) return;
                        execAction(capturedAction);
                    }, capturedDelay);
                }
            }
        }

        // ── Schedule loop() to repeat ─────────────────────────────────────────
        const loopActions = parseActions(extractBody('loop'));

        if (loopActions.length === 0) {
            // Fallback heartbeat
            this.tasks.push({
                intervalMs: 1000,
                lastRun: performance.now(),
                fn: () => this.emit('[ESP32] Running...\n'),
            });
            return;
        }

        // Compute cumulative delay offsets
        let totalMs = 0;
        const schedule: { offsetMs: number; action: Action }[] = [];
        for (const action of loopActions) {
            schedule.push({ offsetMs: totalMs, action });
            if (action.type === 'delay') totalMs += action.ms!;
        }
        if (totalMs === 0) totalMs = 1000;

        // Offset loop start by however long setup() takes
        let loopStart = performance.now() + setupDelay;
        let fired = new Set<number>();

        this.tasks.push({
            intervalMs: 8,
            lastRun: performance.now(),
            fn: () => {
                const elapsed = performance.now() - loopStart;
                if (elapsed < 0) return; // still in setup delay

                for (let i = 0; i < schedule.length; i++) {
                    const { offsetMs, action } = schedule[i];
                    if (!fired.has(i) && elapsed >= offsetMs) {
                        fired.add(i);
                        execAction(action);
                    }
                }

                // Restart loop
                if (elapsed >= totalMs) {
                    loopStart = performance.now();
                    fired = new Set<number>();
                }
            },
        });

        // HTTP / WiFiClient usage
        const httpUrl = src.match(/http\.begin\s*\(\s*["']([^"']+)["']/)?.[1]
            ?? src.match(/client\.connect\s*\(\s*["']([^"']+)["']/)?.[1];
        if (httpUrl && wifiBegin) {
            setTimeout(() => {
                if (!this.running) return;
                this.log(`[HTTP] Simulating GET ${httpUrl}`);
            }, 1500);
        }
    }
}

// ─── Main engine class ────────────────────────────────────────────────────────

export class ESP32Engine {
    private wasmInstance: WebAssembly.Instance | null = null;
    private wasmMemory: WebAssembly.Memory | null = null;
    private running = false;
    private rafId: number | null = null;

    private networkBridge: NetworkBridge;
    private pinCallbacks: PinChangeCallback[] = [];
    private uartCallbacks: UARTCallback[] = [];
    private sketchSource: string;

    private stub: SketchStub | null = null;
    private isStubMode = false;

    private gpio = new Uint8Array(64);

    constructor(opts: ESP32EngineOptions) {
        this.networkBridge = new NetworkBridge(opts);
        this.sketchSource = opts.sketchSource ?? '';
        if (opts.onPinChange) this.pinCallbacks.push(opts.onPinChange);
        if (opts.onUARTData) this.uartCallbacks.push(opts.onUARTData);
    }

    // ─── init ───────────────────────────────────────────────────────────────

    async init(firmwareHex: string): Promise<void> {
        const wasmUrl = new URL('../esp32-wasm/esp32.wasm', import.meta.url).href;

        let wasmBytes: ArrayBuffer | null = null;
        try {
            const resp = await fetch(wasmUrl);
            if (resp.ok) {
                const buf = await resp.arrayBuffer();
                // Validate WASM magic bytes: 0x00 0x61 0x73 0x6D ("\0asm")
                const magic = new Uint8Array(buf, 0, 4);
                if (magic[0] === 0x00 && magic[1] === 0x61 && magic[2] === 0x73 && magic[3] === 0x6D) {
                    wasmBytes = buf;
                } else {
                    console.info('[ESP32Engine] Fetched file is not a valid WASM binary (got HTML/404) — using stub mode.');
                }
            }
        } catch { /* fall through to stub */ }

        if (!wasmBytes) {
            console.info('[ESP32Engine] WASM binary not available — running in stub mode.');
            this.isStubMode = true;
            this.wasmMemory = new WebAssembly.Memory({ initial: 4 });
            this.networkBridge.init(this.wasmMemory, {});
            this.stub = new SketchStub(
                this.sketchSource,
                (ch) => this.uartCallbacks.forEach(cb => cb(ch)),
                this.networkBridge,
                (msg) => { for (const ch of msg + '\n') this.uartCallbacks.forEach(cb => cb(ch)); },
            );
            return;
        }

        // ── Full WASM mode ────────────────────────────────────────────────────
        const memory = new WebAssembly.Memory({ initial: 256, maximum: 512 });
        this.wasmMemory = memory;

        const imports: WebAssembly.Imports = {
            env: {
                memory,
                gpio_set_pin: (pin: number, value: number) => {
                    this.gpio[pin] = value;
                    this.pinCallbacks.forEach(cb => cb(pin, value !== 0));
                    // Also drive SimulationRunner so CircuitEngine listeners fire
                    setESP32Pin(pin, value !== 0);
                },
                uart_write_byte: (byte: number) => {
                    this.uartCallbacks.forEach(cb => cb(String.fromCharCode(byte)));
                },
                get_time_us: () => Math.floor(performance.now() * 1000),
                millis: () => Math.floor(performance.now()),
                micros: () => Math.floor(performance.now() * 1000),
                rom_hook: (addr: number, a2: number, a3: number, a4: number, a5: number): number => {
                    return this.networkBridge.handleROMCall(addr, a2, a3, a4, a5);
                },
                esp_log_write: () => { },
                esp_random: () => Math.floor(Math.random() * 0xFFFFFFFF),
                nvs_open: () => 1,
                nvs_get_str: () => 0,
                nvs_set_str: () => 0,
                nvs_commit: () => 0,
                nvs_close: () => { },
                vTaskDelay: () => { },
                xTaskCreate: () => 1,
                xTaskGetTickCount: () => Math.floor(performance.now()),
            },
            wasi_snapshot_preview1: this.buildWASI(memory),
        };

        const { instance } = await WebAssembly.instantiate(wasmBytes, imports);
        this.wasmInstance = instance;
        this.networkBridge.init(memory, instance.exports);
        await this.loadFirmware(firmwareHex);
    }

    private async loadFirmware(hex: string): Promise<void> {
        const exports = this.wasmInstance?.exports as any;
        if (!exports) return;
        const binary = this.parseHex(hex);
        const flashPtr = exports.get_flash_ptr?.() ?? 0x10000;
        new Uint8Array(this.wasmMemory!.buffer).set(binary, flashPtr);
        exports.esp32_init?.();
        exports.esp32_reset?.();
    }

    // ─── run loop ────────────────────────────────────────────────────────────

    start(): void {
        if (this.running) return;
        this.running = true;

        if (this.isStubMode) {
            this.stub?.start();
            return;
        }

        const CYCLES_PER_FRAME = 240_000;
        const exports = this.wasmInstance?.exports as any;
        const step = () => {
            if (!this.running) return;
            if (exports?.esp32_step) {
                for (let i = 0; i < CYCLES_PER_FRAME; i++) exports.esp32_step();
            }
            this.rafId = requestAnimationFrame(step);
        };
        this.rafId = requestAnimationFrame(step);
    }

    stop(): void {
        this.running = false;
        if (this.rafId !== null) { cancelAnimationFrame(this.rafId); this.rafId = null; }
        this.stub?.stop();
        this.networkBridge.cleanup();
    }

    reset(): void {
        this.stop();
        if (!this.isStubMode) {
            const exports = this.wasmInstance?.exports as any;
            exports?.esp32_reset?.();
        }
        this.start();
    }

    setDigitalInput(pin: number, high: boolean): void {
        const exports = this.wasmInstance?.exports as any;
        exports?.esp32_set_gpio?.(pin, high ? 1 : 0);
    }

    setAnalogInput(pin: number, millivolts: number): void {
        const exports = this.wasmInstance?.exports as any;
        exports?.esp32_set_adc?.(pin, millivolts);
    }

    onPinChange(cb: PinChangeCallback): void { this.pinCallbacks.push(cb); }
    onUARTData(cb: UARTCallback): void { this.uartCallbacks.push(cb); }

    get networkConnected(): boolean { return this.networkBridge.isConnected; }
    get ipAddress(): string { return this.networkBridge.ipAddress; }

    // ─── Intel HEX parser ────────────────────────────────────────────────────

    private parseHex(hex: string): Uint8Array {
        const result: number[] = [];
        for (const line of hex.split('\n')) {
            if (!line.startsWith(':')) continue;
            const len = parseInt(line.slice(1, 3), 16);
            const type = parseInt(line.slice(7, 9), 16);
            if (type !== 0) continue;
            for (let i = 0; i < len; i++) {
                result.push(parseInt(line.slice(9 + i * 2, 11 + i * 2), 16));
            }
        }
        return new Uint8Array(result);
    }

    // ─── Minimal WASI shim ───────────────────────────────────────────────────

    private buildWASI(memory: WebAssembly.Memory) {
        return {
            fd_write: (_fd: number, iovsPtr: number, iovsLen: number, nwrittenPtr: number) => {
                const view = new DataView(memory.buffer);
                let written = 0;
                for (let i = 0; i < iovsLen; i++) {
                    const ptr = view.getUint32(iovsPtr + i * 8, true);
                    const len = view.getUint32(iovsPtr + i * 8 + 4, true);
                    const buf = new Uint8Array(memory.buffer, ptr, len);
                    new TextDecoder().decode(buf).split('').forEach(ch => {
                        this.uartCallbacks.forEach(cb => cb(ch));
                    });
                    written += len;
                }
                view.setUint32(nwrittenPtr, written, true);
                return 0;
            },
            fd_seek: () => 0,
            fd_close: () => 0,
            proc_exit: () => { this.stop(); },
            args_get: () => 0,
            args_sizes_get: () => 0,
            environ_get: () => 0,
            environ_sizes_get: () => 0,
            clock_time_get: (_id: number, _prec: bigint, timePtr: number) => {
                const view = new DataView(memory.buffer);
                view.setBigUint64(timePtr, BigInt(Math.floor(performance.now() * 1e6)), true);
                return 0;
            },
            path_open: () => 8,
            fd_read: () => 0,
            random_get: (bufPtr: number, bufLen: number) => {
                crypto.getRandomValues(new Uint8Array(memory.buffer, bufPtr, bufLen));
                return 0;
            },
        };
    }
}
