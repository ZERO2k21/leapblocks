import { parseHexString } from './src/modules/leapforge/engine/HexParser';
import { CPU, AVRTimer, timer0Config, timer1Config, timer2Config, AVRIOPort, portBConfig, portCConfig, portDConfig, usart0Config, AVRUSART, avrInstruction } from 'avr8js';
import * as fs from 'fs';
import * as path from 'path';

const hexFile = path.join(process.env.TEMP || '', 'leapblocks_sketch', 'build', 'leapblocks_sketch.ino.hex');
const hexContent = fs.readFileSync(hexFile, 'utf-8');
const progData = parseHexString(hexContent);
const cpu = new CPU(progData);

new AVRTimer(cpu, timer0Config);
new AVRTimer(cpu, timer1Config);
new AVRTimer(cpu, timer2Config);

const portB = new AVRIOPort(cpu, portBConfig);
portB.addListener((state) => {
    console.log("PORT B changed:", state);
});

console.log("Memory at 0: " + cpu.progMem[0].toString(16));
console.log("avrInstruction: " + typeof avrInstruction);

for (let i = 0; i < 5; i++) {
    const pcBefore = cpu.pc;
    const cyclesBefore = cpu.cycles;
    avrInstruction(cpu);
    cpu.tick();
    console.log("Tick " + i + ": PC " + pcBefore + " -> " + cpu.pc + ", cycles delta = " + (cpu.cycles - cyclesBefore));
}
