/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 *
 * ArduinoLibraries.ts — Complete Arduino library implementations for ESP32 simulation
 * 
 * This file provides Wokwi-level simulation quality for all major Arduino libraries.
 * Each library is implemented as a JavaScript class that mimics the real Arduino API.
 */

import { useForgeStore } from '../../../utlis/store/useForgeStore';

// ═══════════════════════════════════════════════════════════════════════════
// SERVO LIBRARY
// ═══════════════════════════════════════════════════════════════════════════

export function createServoClass(runtime: any) {
    return class Servo {
        private pin: number = -1;
        private angle: number = 90;
        private minPulse: number = 544;  // µs
        private maxPulse: number = 2400; // µs
        private _attached: boolean = false;

        attach(pin: number, min?: number, max?: number): number {
            this.pin = pin;
            this._attached = true;
            if (min !== undefined) this.minPulse = min;
            if (max !== undefined) this.maxPulse = max;
            runtime.pinMode(pin, 1); // OUTPUT
            console.log(`[Servo] Attached to pin ${pin}`);
            return pin;
        }

        write(angle: number): void {
            if (!this._attached || this.pin < 0) return;
            this.angle = Math.max(0, Math.min(180, angle));
            // Send angle directly to CircuitEngine (0-180 range)
            runtime.analogWrite(this.pin, this.angle);
            console.log(`[Servo] Pin ${this.pin} → ${this.angle}°`);
        }

        writeMicroseconds(us: number): void {
            if (!this._attached || this.pin < 0) return;
            // Convert microseconds to angle: 544µs=0°, 2400µs=180°
            const angle = ((us - this.minPulse) / (this.maxPulse - this.minPulse)) * 180;
            this.write(angle);
        }

        read(): number {
            return this.angle;
        }

        readMicroseconds(): number {
            return Math.round(this.minPulse + (this.angle / 180) * (this.maxPulse - this.minPulse));
        }

        attached(): boolean {
            return this._attached;
        }

        detach(): void {
            this._attached = false;
            this.pin = -1;
            console.log(`[Servo] Detached`);
        }
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// STEPPER LIBRARY
// ═══════════════════════════════════════════════════════════════════════════

export function createStepperClass(runtime: any) {
    return class Stepper {
        private stepsPerRev: number;
        private pins: number[];
        private currentStep: number = 0;
        private stepDelay: number = 1000; // µs per step
        private direction: number = 1;
        private lastStepTime: number = 0;

        constructor(steps: number, pin1: number, pin2: number, pin3?: number, pin4?: number) {
            this.stepsPerRev = steps;
            this.pins = [pin1, pin2];
            if (pin3 !== undefined) this.pins.push(pin3);
            if (pin4 !== undefined) this.pins.push(pin4);

            // Initialize all pins as OUTPUT
            this.pins.forEach(p => runtime.pinMode(p, 1));
            console.log(`[Stepper] Initialized: ${steps} steps/rev, pins: ${this.pins.join(',')}`);
        }

        setSpeed(rpm: number): void {
            // Calculate delay between steps in microseconds
            // delay = (60 seconds * 1,000,000 µs) / (steps_per_rev * rpm)
            this.stepDelay = (60 * 1000000) / (this.stepsPerRev * rpm);
            console.log(`[Stepper] Speed set to ${rpm} RPM (${this.stepDelay}µs per step)`);
        }

        step(steps: number): void {
            const stepsToMove = Math.abs(steps);
            this.direction = steps > 0 ? 1 : -1;

            for (let i = 0; i < stepsToMove; i++) {
                // Wait for step delay
                const now = runtime.micros();
                if (now - this.lastStepTime < this.stepDelay) {
                    const waitTime = this.stepDelay - (now - this.lastStepTime);
                    runtime.__delayMicroseconds(waitTime);
                }

                // Perform one step
                this.currentStep += this.direction;
                if (this.currentStep >= this.stepsPerRev) this.currentStep = 0;
                if (this.currentStep < 0) this.currentStep = this.stepsPerRev - 1;

                this.stepMotor(this.currentStep % (this.pins.length === 4 ? 4 : 8));
                this.lastStepTime = runtime.micros();
            }
        }

        private stepMotor(step: number): void {
            if (this.pins.length === 4) {
                // 4-wire bipolar stepper (full step)
                const sequence = [
                    [1, 0, 1, 0],
                    [0, 1, 1, 0],
                    [0, 1, 0, 1],
                    [1, 0, 0, 1]
                ];
                const pattern = sequence[step % 4];
                this.pins.forEach((pin, i) => {
                    runtime.digitalWrite(pin, pattern[i]);
                });
            } else if (this.pins.length === 2) {
                // 2-wire stepper (step + direction)
                runtime.digitalWrite(this.pins[0], 1); // STEP pulse
                runtime.digitalWrite(this.pins[1], this.direction > 0 ? 1 : 0); // DIR
                runtime.__delayMicroseconds(10);
                runtime.digitalWrite(this.pins[0], 0);
            }
        }
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// DHT SENSOR LIBRARY (DHT11, DHT22, DHT21)
// ═══════════════════════════════════════════════════════════════════════════

export function createDHTClass(runtime: any) {
    return class DHT {
        private pin: number;
        private type: number;
        private lastReadTime: number = 0;
        private temperature: number = 25.0;
        private humidity: number = 60.0;

        constructor(pin: number, type: number) {
            this.pin = pin;
            this.type = type; // DHT11=11, DHT22=22
            console.log(`[DHT] Initialized DHT${type} on pin ${pin}`);
        }

        begin(): void {
            runtime.pinMode(this.pin, 2); // INPUT_PULLUP
            console.log(`[DHT] Sensor ready`);
        }

        readTemperature(fahrenheit: boolean = false): number {
            this.readSensor();
            return fahrenheit ? (this.temperature * 9 / 5) + 32 : this.temperature;
        }

        readHumidity(): number {
            this.readSensor();
            return this.humidity;
        }

        computeHeatIndex(temperature: number, humidity: number, isFahrenheit: boolean = false): number {
            let t = temperature;
            if (!isFahrenheit) {
                t = (temperature * 9 / 5) + 32; // Convert to Fahrenheit
            }

            // Heat index formula (Rothfusz regression)
            const hi = -42.379 + 2.04901523 * t + 10.14333127 * humidity
                - 0.22475541 * t * humidity - 0.00683783 * t * t
                - 0.05481717 * humidity * humidity + 0.00122874 * t * t * humidity
                + 0.00085282 * t * humidity * humidity - 0.00000199 * t * t * humidity * humidity;

            return isFahrenheit ? hi : (hi - 32) * 5 / 9;
        }

        private readSensor(): void {
            const now = runtime.millis();
            // DHT sensors need 2 seconds between reads
            if (now - this.lastReadTime < 2000) return;
            this.lastReadTime = now;

            // Get sensor values from CircuitEngine
            try {
                const { nodes, edges } = useForgeStore.getState();

                // Find DHT sensor connected to this pin
                for (const edge of edges) {
                    const pinMatch = edge.sourceHandle === `${this.pin}` || edge.targetHandle === `${this.pin}`;
                    if (!pinMatch) continue;

                    const sensorId = edge.source.includes('dht') ? edge.source : edge.target;
                    const sensor = nodes.find(n => n.id === sensorId);

                    if (sensor && (sensor.data?.type === 'dht11' || sensor.data?.type === 'dht22')) {
                        const sv = sensor.data?.sensorValues || {};
                        this.temperature = sv.temperature ?? 25.0;
                        this.humidity = sv.humidity ?? 60.0;
                        console.log(`[DHT] Read: ${this.temperature}°C, ${this.humidity}%`);
                        return;
                    }
                }
            } catch (e) {
                console.warn('[DHT] Could not read from store:', e);
            }

            // Default values if sensor not found
            this.temperature = 25.0;
            this.humidity = 60.0;
        }
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// ADAFRUIT NEOPIXEL LIBRARY (WS2812B RGB LEDs)
// ═══════════════════════════════════════════════════════════════════════════

export function createNeoPixelClass(runtime: any) {
    return class Adafruit_NeoPixel {
        private pin: number;
        private _numPixels: number;
        private pixels: Uint8Array; // RGB data: [R0,G0,B0, R1,G1,B1, ...]
        private brightness: number = 255;
        private begun: boolean = false;

        // Color order constants
        static NEO_RGB = 0x06;
        static NEO_GRB = 0x52; // Default for WS2812B
        static NEO_KHZ800 = 0x0000;

        constructor(numPixels: number, pin: number, type: number = 0x52) {
            this._numPixels = numPixels;
            this.pin = pin;
            this.pixels = new Uint8Array(numPixels * 3);
            console.log(`[NeoPixel] Created: ${numPixels} pixels on pin ${pin}`);
        }

        begin(): void {
            runtime.pinMode(this.pin, 1); // OUTPUT
            this.begun = true;
            this.clear();
            this.show();
            console.log(`[NeoPixel] Initialized`);
        }

        show(): void {
            if (!this.begun) return;

            // Apply brightness scaling
            const scaledPixels = new Uint8Array(this.pixels.length);
            for (let i = 0; i < this.pixels.length; i++) {
                scaledPixels[i] = Math.round((this.pixels[i] * this.brightness) / 255);
            }

            // Send to CircuitEngine
            this.updateCircuitEngine(scaledPixels);
            console.log(`[NeoPixel] Updated ${this._numPixels} pixels`);
        }

        setPixelColor(n: number, ...args: number[]): void {
            if (n >= this._numPixels) return;

            let r: number, g: number, b: number;

            if (args.length === 1) {
                // 32-bit color
                const color = args[0];
                r = (color >> 16) & 0xFF;
                g = (color >> 8) & 0xFF;
                b = color & 0xFF;
            } else if (args.length === 3) {
                // Separate R, G, B
                [r, g, b] = args;
            } else {
                return;
            }

            const offset = n * 3;
            this.pixels[offset] = r;
            this.pixels[offset + 1] = g;
            this.pixels[offset + 2] = b;
        }

        fill(color: number, first: number = 0, count?: number): void {
            const end = count === undefined ? this._numPixels : first + count;
            for (let i = first; i < end && i < this._numPixels; i++) {
                this.setPixelColor(i, color);
            }
        }

        setBrightness(brightness: number): void {
            this.brightness = Math.max(0, Math.min(255, brightness));
        }

        clear(): void {
            this.pixels.fill(0);
        }

        getPixelColor(n: number): number {
            if (n >= this._numPixels) return 0;
            const offset = n * 3;
            return (this.pixels[offset] << 16) | (this.pixels[offset + 1] << 8) | this.pixels[offset + 2];
        }

        numPixels(): number {
            return this._numPixels;
        }

        // Static color helper
        static Color(r: number, g: number, b: number): number {
            return ((r & 0xFF) << 16) | ((g & 0xFF) << 8) | (b & 0xFF);
        }

        // Rainbow color wheel (0-255)
        static ColorHSV(hue: number, sat: number = 255, val: number = 255): number {
            const h = (hue * 6) / 256;
            const s = sat / 255;
            const v = val / 255;

            const i = Math.floor(h);
            const f = h - i;
            const p = v * (1 - s);
            const q = v * (1 - f * s);
            const t = v * (1 - (1 - f) * s);

            let r: number, g: number, b: number;
            switch (i % 6) {
                case 0: r = v; g = t; b = p; break;
                case 1: r = q; g = v; b = p; break;
                case 2: r = p; g = v; b = t; break;
                case 3: r = p; g = q; b = v; break;
                case 4: r = t; g = p; b = v; break;
                case 5: r = v; g = p; b = q; break;
                default: r = g = b = 0;
            }

            return ((Math.round(r * 255) & 0xFF) << 16) |
                ((Math.round(g * 255) & 0xFF) << 8) |
                (Math.round(b * 255) & 0xFF);
        }

        private updateCircuitEngine(pixelData: Uint8Array): void {
            try {
                const { nodes, edges } = useForgeStore.getState();

                // Find NeoPixel component connected to this pin
                for (const edge of edges) {
                    const pinMatch = edge.sourceHandle === `${this.pin}` || edge.targetHandle === `${this.pin}`;
                    if (!pinMatch) continue;

                    const componentId = edge.source.includes('neopixel') ? edge.source : edge.target;
                    const component = nodes.find(n => n.id === componentId);

                    if (component && (component.data?.type === 'neopixel' || component.data?.type === 'neopixel-matrix' || component.data?.type === 'led-ring')) {
                        // Convert pixel data to array of {r, g, b} objects
                        const colors = [];
                        for (let i = 0; i < this._numPixels; i++) {
                            const offset = i * 3;
                            colors.push({
                                r: pixelData[offset],
                                g: pixelData[offset + 1],
                                b: pixelData[offset + 2]
                            });
                        }

                        // Update component data
                        useForgeStore.getState().updateNodeData(componentId, {
                            pixels: colors,
                            numPixels: this._numPixels
                        });
                        return;
                    }
                }
            } catch (e) {
                console.warn('[NeoPixel] Could not update circuit:', e);
            }
        }
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// LIQUIDCRYSTAL_I2C LIBRARY (I2C LCD Displays)
// ═══════════════════════════════════════════════════════════════════════════

export function createLiquidCrystalI2CClass(runtime: any) {
    return class LiquidCrystal_I2C {
        private address: number;
        private cols: number;
        private rows: number;
        private buffer: string[][];
        private cursorCol: number = 0;
        private cursorRow: number = 0;
        private displayOn: boolean = true;
        private cursorOn: boolean = false;
        private blinkOn: boolean = false;
        private backlightOn: boolean = true;

        constructor(address: number, cols: number, rows: number) {
            this.address = address;
            this.cols = cols;
            this.rows = rows;
            this.buffer = Array(rows).fill(null).map(() => Array(cols).fill(' '));
            console.log(`[LCD_I2C] Created ${cols}x${rows} at address 0x${address.toString(16)}`);
        }

        begin(): void {
            this.init();
        }

        init(): void {
            // Initialize I2C communication
            if (runtime._i2cBus) {
                runtime._i2cBus.startTransmission(this.address);
                runtime._i2cBus.write(0x00); // Init command
                runtime._i2cBus.endTransmission();
            }
            this.clear();
            console.log(`[LCD_I2C] Initialized`);
        }

        clear(): void {
            this.buffer = Array(this.rows).fill(null).map(() => Array(this.cols).fill(' '));
            this.cursorCol = 0;
            this.cursorRow = 0;
            this.updateDisplay();
        }

        home(): void {
            this.cursorCol = 0;
            this.cursorRow = 0;
        }

        setCursor(col: number, row: number): void {
            this.cursorCol = Math.max(0, Math.min(this.cols - 1, col));
            this.cursorRow = Math.max(0, Math.min(this.rows - 1, row));
        }

        print(text: any): void {
            const str = String(text);
            for (let i = 0; i < str.length; i++) {
                if (this.cursorCol < this.cols) {
                    this.buffer[this.cursorRow][this.cursorCol] = str[i];
                    this.cursorCol++;
                }
            }
            this.updateDisplay();
        }

        write(char: number | string): void {
            const c = typeof char === 'number' ? String.fromCharCode(char) : char;
            if (this.cursorCol < this.cols) {
                this.buffer[this.cursorRow][this.cursorCol] = c;
                this.cursorCol++;
            }
            this.updateDisplay();
        }

        display(): void {
            this.displayOn = true;
            this.updateDisplay();
        }

        noDisplay(): void {
            this.displayOn = false;
            this.updateDisplay();
        }

        cursor(): void {
            this.cursorOn = true;
            this.updateDisplay();
        }

        noCursor(): void {
            this.cursorOn = false;
            this.updateDisplay();
        }

        blink(): void {
            this.blinkOn = true;
            this.updateDisplay();
        }

        noBlink(): void {
            this.blinkOn = false;
            this.updateDisplay();
        }

        backlight(): void {
            this.backlightOn = true;
            this.updateDisplay();
        }

        noBacklight(): void {
            this.backlightOn = false;
            this.updateDisplay();
        }

        scrollDisplayLeft(): void {
            // Shift all content left
            for (let row = 0; row < this.rows; row++) {
                this.buffer[row].push(this.buffer[row].shift()!);
            }
            this.updateDisplay();
        }

        scrollDisplayRight(): void {
            // Shift all content right
            for (let row = 0; row < this.rows; row++) {
                this.buffer[row].unshift(this.buffer[row].pop()!);
            }
            this.updateDisplay();
        }

        createChar(location: number, charmap: number[]): void {
            // Custom character creation (stored but not rendered in simulation)
            console.log(`[LCD_I2C] Custom char ${location} created`);
        }

        private updateDisplay(): void {
            try {
                const { nodes, edges } = useForgeStore.getState();

                // Find LCD component with matching I2C address
                for (const node of nodes) {
                    if ((node.data?.type === 'lcd1602-i2c' || node.data?.type === 'lcd2004-i2c') &&
                        node.data?.address === this.address) {

                        useForgeStore.getState().updateNodeData(node.id, {
                            buffer: this.buffer,
                            displayOn: this.displayOn,
                            cursorOn: this.cursorOn,
                            cursorCol: this.cursorCol,
                            cursorRow: this.cursorRow,
                            backlightOn: this.backlightOn
                        });
                        return;
                    }
                }
            } catch (e) {
                console.warn('[LCD_I2C] Could not update display:', e);
            }
        }
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// ULTRASONIC (HC-SR04) LIBRARY
// ═══════════════════════════════════════════════════════════════════════════

export function createUltrasonicClass(runtime: any) {
    return class Ultrasonic {
        private trigPin: number;
        private echoPin: number;

        constructor(trigPin: number, echoPin: number) {
            this.trigPin = trigPin;
            this.echoPin = echoPin;
            runtime.pinMode(trigPin, 1); // OUTPUT
            runtime.pinMode(echoPin, 0); // INPUT
            console.log(`[Ultrasonic] Initialized: TRIG=${trigPin}, ECHO=${echoPin}`);
        }

        read(unit: string = 'CM'): number {
            // Send 10µs trigger pulse
            runtime.digitalWrite(this.trigPin, 0);
            runtime.__delayMicroseconds(2);
            runtime.digitalWrite(this.trigPin, 1);
            runtime.__delayMicroseconds(10);
            runtime.digitalWrite(this.trigPin, 0);

            // Read echo pulse duration
            const duration = runtime.pulseIn(this.echoPin, 1, 30000);

            // Convert to distance
            if (unit === 'CM') {
                return duration / 58.0; // Speed of sound: 343 m/s
            } else if (unit === 'IN') {
                return duration / 148.0;
            }
            return duration;
        }

        distanceRead(unit: string = 'CM'): number {
            return this.read(unit);
        }
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// NEWPING LIBRARY (Alternative ultrasonic library)
// ═══════════════════════════════════════════════════════════════════════════

export function createNewPingClass(runtime: any) {
    return class NewPing {
        private trigPin: number;
        private echoPin: number;
        private maxDistance: number;

        constructor(trigPin: number, echoPin: number, maxDistance: number = 200) {
            this.trigPin = trigPin;
            this.echoPin = echoPin;
            this.maxDistance = maxDistance;
            runtime.pinMode(trigPin, 1); // OUTPUT
            runtime.pinMode(echoPin, 0); // INPUT
            console.log(`[NewPing] Initialized: TRIG=${trigPin}, ECHO=${echoPin}, MAX=${maxDistance}cm`);
        }

        ping(): number {
            // Returns round-trip time in microseconds
            runtime.digitalWrite(this.trigPin, 0);
            runtime.__delayMicroseconds(2);
            runtime.digitalWrite(this.trigPin, 1);
            runtime.__delayMicroseconds(10);
            runtime.digitalWrite(this.trigPin, 0);

            return runtime.pulseIn(this.echoPin, 1, this.maxDistance * 58 * 2);
        }

        ping_cm(): number {
            return this.ping() / 58;
        }

        ping_in(): number {
            return this.ping() / 148;
        }

        ping_median(iterations: number = 5): number {
            const readings: number[] = [];
            for (let i = 0; i < iterations; i++) {
                readings.push(this.ping());
                runtime.__delay(29); // Wait between pings
            }
            readings.sort((a, b) => a - b);
            return readings[Math.floor(iterations / 2)];
        }
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT ALL LIBRARY CREATORS
// ═══════════════════════════════════════════════════════════════════════════

export function injectAllLibraries(runtime: any): Record<string, any> {
    const Servo = createServoClass(runtime);
    const Stepper = createStepperClass(runtime);
    const DHT = createDHTClass(runtime);
    const Adafruit_NeoPixel = createNeoPixelClass(runtime);
    const LiquidCrystal_I2C = createLiquidCrystalI2CClass(runtime);
    const Ultrasonic = createUltrasonicClass(runtime);
    const NewPing = createNewPingClass(runtime);

    return {
        // Servo
        Servo,

        // Stepper
        Stepper,

        // DHT sensors
        DHT,
        DHT_Unified: DHT, // Alias

        // NeoPixel
        Adafruit_NeoPixel,

        // LCD
        LiquidCrystal_I2C,
        LiquidCrystal: LiquidCrystal_I2C, // Alias for parallel LCD

        // Ultrasonic
        Ultrasonic,
        NewPing,

        // NeoPixel static methods
        NEO_RGB: Adafruit_NeoPixel.NEO_RGB,
        NEO_GRB: Adafruit_NeoPixel.NEO_GRB,
        NEO_KHZ800: Adafruit_NeoPixel.NEO_KHZ800,
    };
}
