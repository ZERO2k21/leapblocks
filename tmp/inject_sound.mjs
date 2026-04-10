import fs from 'fs';

const harnessPath = '../src/modules/leapforge/engine/PinHarness.ts';
let harnessContent = fs.readFileSync(harnessPath, 'utf8');

const potData = {
    viewBox: {
      minX: 0,
      minY: 0,
      width: 133,
      height: 50.4
    },
    pins: [
      { name: 'AOUT', y: 11, x: 0 },
      { name: 'GND', y: 20.5, x: 0 },
      { name: 'VCC', y: 30.5, x: 0 },
      { name: 'DOUT', y: 40.5, x: 0 }
    ]
};

// Check if small-sound-sensor already exists, if so replace it
if (harnessContent.includes('"small-sound-sensor": {')) {
    // We'll replace the block.
    // Instead of regex which is failing with trailing commas, let's just delete the file's JSON and rewrite it.
    // But evaluating the file failed earlier. Let's try eval again, since we fixed the syntax error.
}

// Safer approach: use regex to replace just the small-sound-sensor block
const regex = /"small-sound-sensor"\s*:\s*\{[\s\S]*?\}\s*\]\s*\}/g;
if (regex.test(harnessContent)) {
    harnessContent = harnessContent.replace(regex, `"small-sound-sensor": ${JSON.stringify(potData, null, 4)}`);
} else {
    const str = `  "small-sound-sensor": ${JSON.stringify(potData, null, 4)},\n`;
    harnessContent = harnessContent.replace('export const LEAP_PINS: Record<string, { viewBox: {minX: number, minY: number, width: number, height: number}, pins: {name: string, x: number, y: number}[] }> = {', 'export const LEAP_PINS: Record<string, { viewBox: {minX: number, minY: number, width: number, height: number}, pins: {name: string, x: number, y: number}[] }> = {\n' + str);
}

fs.writeFileSync(harnessPath, harnessContent);
console.log("Injected small-sound-sensor successfully!");
