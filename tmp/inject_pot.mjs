import fs from 'fs';

const harnessPath = '../src/modules/leapforge/engine/PinHarness.ts';
let harnessContent = fs.readFileSync(harnessPath, 'utf8');

const potData = {
    viewBox: {
      minX: 0,
      minY: 0,
      width: 55,
      height: 29
    },
    pins: [
      { name: 'VCC', x: 1, y: 43 },
      { name: 'SIG', x: 1, y: 63 },
      { name: 'GND', x: 207, y: 43 }
    ]
};

const str = `  "slide-potentiometer": ${JSON.stringify(potData, null, 4)},\n  "slide-pot": ${JSON.stringify(potData, null, 4)},\n`;

harnessContent = harnessContent.replace('export const LEAP_PINS: Record<string, { viewBox: {minX: number, minY: number, width: number, height: number}, pins: {name: string, x: number, y: number}[] }> = {', 'export const LEAP_PINS: Record<string, { viewBox: {minX: number, minY: number, width: number, height: number}, pins: {name: string, x: number, y: number}[] }> = {\n' + str);

fs.writeFileSync(harnessPath, harnessContent);
console.log("Injected slide-potentiometer and slide-pot manually into PinHarness.ts!");
