import fs from 'fs';

const harnessPath = '../src/modules/leapforge/engine/PinHarness.ts';
let harnessContent = fs.readFileSync(harnessPath, 'utf8');

const startIdx = harnessContent.indexOf('{');
const endIdx = harnessContent.lastIndexOf('}');
const objStr = harnessContent.substring(startIdx, endIdx + 1);

try {
   eval('(' + objStr + ')');
   console.log("EVAL SUCCESS");
} catch(e) {
   console.error("EVAL ERROR:", e);
   
   // Try JSON.parse after basic cleanup to get a precise line number
   try {
       const cleanJson = objStr
           .replace(/([a-zA-Z0-9_-]+):/g, '"$1":')
           .replace(/"{2,}/g, '"')
           .replace(/,\s*}/g, '}')
           .replace(/,\s*\]/g, ']');
       JSON.parse(cleanJson);
       console.log("JSON.parse SUCCESS");
   } catch(err) {
       console.error("JSON Error:", err);
       // Show context around the error
       const match = err.message.match(/position (\d+)/);
       if (match) {
           const pos = parseInt(match[1], 10);
           console.log("Context around error:");
           console.log(cleanJson.substring(Math.max(0, pos - 50), pos + 50));
       }
   }
}
