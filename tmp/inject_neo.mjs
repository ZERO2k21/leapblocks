import fs from 'fs';

const harnessPath = '../src/modules/leapforge/engine/PinHarness.ts';
let harnessContent = fs.readFileSync(harnessPath, 'utf8');

const potData = {
    viewBox: {
      minX: 0,
      minY: 0,
      width: 5.6631,
      height: 5
    },
    pins: [
      { name: 'VDD', y: 3.5, x: 1 },
      { name: 'DOUT', y: 14, x: 1 },
      { name: 'VSS', y: 14, x: 21 },
      { name: 'DIN', y: 3.5, x: 21 }
    ]
};

// Check if neopixel already exists, if so replace it, otherwise inject it
if (harnessContent.includes('"neopixel": {')) {
    // Regex replace the whole "neopixel" block
    const regex = /"neopixel"\s*:\s*\{[\s\S]*?\}\s*\]\s*\}/g;
    harnessContent = harnessContent.replace(regex, `"neopixel": ${JSON.stringify(potData, null, 4)}`);
} else {
    const str = `  "neopixel": ${JSON.stringify(potData, null, 4)},\n`;
    harnessContent = harnessContent.replace('export const LEAP_PINS: Record<string, { viewBox: {minX: number, minY: number, width: number, height: number}, pins: {name: string, x: number, y: number}[] }> = {', 'export const LEAP_PINS: Record<string, { viewBox: {minX: number, minY: number, width: number, height: number}, pins: {name: string, x: number, y: number}[] }> = {\n' + str);
}

fs.writeFileSync(harnessPath, harnessContent);
console.log("Injected neopixel successfully!");
