import { parseHexString } from './src/modules/leapforge/engine/HexParser';
import { CPU, AVRTimer, timer0Config, timer1Config, timer2Config, AVRIOPort, portBConfig, portCConfig, portDConfig, usart0Config, AVRUSART } from 'avr8js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

async function test() {
    const sketchDir = path.join(os.tmpdir(), 'leapblocks_sketch_tmp');
    if (!fs.existsSync(sketchDir)) fs.mkdirSync(sketchDir, { recursive: true });
    
    const code = `
    void setup() {
      Serial.begin(9600);
      pinMode(13, OUTPUT);
    }
    void loop() {
      digitalWrite(13, HIGH);
      Serial.println("LED ON");
      delay(100);
      digitalWrite(13, LOW);
      Serial.println("LED OFF");
      delay(100);
    }`;
    fs.writeFileSync(path.join(sketchDir, 'test.ino'), code);
    
    const buildPath = path.join(sketchDir, 'build');
    if (!fs.existsSync(buildPath)) fs.mkdirSync(buildPath, { recursive: true });
    
    // Use the local arduino-cli path or global
    try {
        console.log("Compiling sketch...");
        execSync(`arduino-cli compile --fqbn arduino:avr:uno --export-binaries --build-path "${buildPath}" "${sketchDir}"`);
        console.log("Compilation complete!");
        
        const hexFile = path.join(buildPath, 'test.ino.hex');
        const hexContent = fs.readFileSync(hexFile, 'utf-8');
        
        const progData = parseHexString(hexContent);
        console.log("First 10 words of progData:", progData.slice(0, 10));
        
        const cpu = new CPU(progData);
        new AVRTimer(cpu, timer0Config);
        new AVRTimer(cpu, timer1Config);
        new AVRTimer(cpu, timer2Config);
        
        const usart = new AVRUSART(cpu, usart0Config, 16e6);
        usart.onByteTransmit = (data) => {
            console.log("SERIAL RX:", String.fromCharCode(data));
        };
        
        const portB = new AVRIOPort(cpu, portBConfig);
        portB.addListener((state) => {
            console.log("PORT B changed:", state.toString(16));
        });
        
        console.log("Running simulation for 1 second (16M cycles)...");
        let cycles = 0;
        try {
            while (cycles < 16e6) {
                cpu.tick();
                cycles++;
            }
        } catch (e) {
            console.error("CRASH AT CYCLE", cycles, e);
        }
        console.log("Simulation finished.", cycles, "cycles run.");
    } catch (e: any) {
        console.error("Test failed:", e.message, e.stderr?.toString());
    }
}

test();
