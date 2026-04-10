import fs from 'fs';

const harnessPath = '../src/modules/leapforge/engine/PinHarness.ts';
let harnessContent = fs.readFileSync(harnessPath, 'utf8');

const startIdx = harnessContent.indexOf('{');
const endIdx = harnessContent.lastIndexOf('}');
const objStr = harnessContent.substring(startIdx, endIdx + 1);

// We will use standard JSON.parse which is very strict and will tell us exactly where it failed.
// But we need to convert the TS object to valid JSON first.
let jsonLike = objStr.replace(/([a-zA-Z0-9_-]+)\s*:/g, '"$1":').replace(/"{2,}/g, '"');
try {
    JSON.parse(jsonLike);
    console.log("JSON PARSE OK");
} catch (e) {
    const match = e.message.match(/position (\d+)/);
    if (match) {
        const pos = parseInt(match[1], 10);
        console.log("JSON ERROR AROUND:");
        console.log(jsonLike.substring(Math.max(0, pos - 50), pos + 50));
    } else {
        console.log("JSON ERROR:", e.message);
    }
}
