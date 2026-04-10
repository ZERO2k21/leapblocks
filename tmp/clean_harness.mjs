import fs from 'fs';

const harnessPath = '../src/modules/leapforge/engine/PinHarness.ts';
let harnessContent = fs.readFileSync(harnessPath, 'utf8');

// The file PinHarness is just an export object. Let's run a small regex that strips duplicates.
// Wait, rather than parsing regex, since it's just JSON wrapped in export const LEAP_PINS = ...
const startIdx = harnessContent.indexOf('{');
const endIdx = harnessContent.lastIndexOf('}');

if (startIdx !== -1 && endIdx !== -1) {
    const objStr = harnessContent.substring(startIdx, endIdx + 1);
    
    // We can evaluate this object, deduplicate, and write it back.
    try {
        const obj = eval('(' + objStr + ')');
        
        const cleanContent = `export const LEAP_PINS: Record<string, { viewBox: {minX: number, minY: number, width: number, height: number}, pins: {name: string, x: number, y: number}[] }> = ${JSON.stringify(obj, null, 2)};\n`;
        
        fs.writeFileSync(harnessPath, cleanContent);
        console.log("Deduplicated and formatted PinHarness.ts successfully!");
    } catch (e) {
        console.error("Failed to parse PinHarness.ts", e);
    }
}
