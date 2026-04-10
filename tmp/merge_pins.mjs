import fs from 'fs';
import path from 'path';

const harnessPath = '../src/modules/leapforge/engine/PinHarness.ts';
const pinsPath = './extracted_pins3.json';

const newPins = JSON.parse(fs.readFileSync(pinsPath, 'utf8'));

let harnessContent = fs.readFileSync(harnessPath, 'utf8');

const startIdx = harnessContent.indexOf(' = {');
if (startIdx !== -1) {
    let brackets = 0;
    let endIdx = -1;
    for (let i = startIdx + 3; i < harnessContent.length; i++) {
        if (harnessContent[i] === '{') brackets++;
        if (harnessContent[i] === '}') brackets--;
        if (brackets === 0) {
            endIdx = i;
            break;
        }
    }
    
    if (endIdx !== -1) {
        let existingObj = {};
        try {
            // Evaluated existing object to merge
            existingObj = eval('(' + harnessContent.substring(startIdx + 3, endIdx + 1) + ')');
        } catch (e) {
            console.error(e);
        }
        
        const mergedObj = { ...existingObj, ...newPins };
        
        const stringified = JSON.stringify(mergedObj, null, 2);
        
        const newHarnessContent = harnessContent.substring(0, startIdx + 3) + stringified + harnessContent.substring(endIdx + 1);
        
        fs.writeFileSync(harnessPath, newHarnessContent);
        console.log("Merged LEAP_PINS from extracted_pins3.json successfully.");
    }
}
