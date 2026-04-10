import fs from 'fs';
import path from 'path';

const content = fs.readFileSync('./wokwi-elements/src/slide-potentiometer-element.ts', 'utf8');

let pins = [];
const betterPinRegex = /name\s*:\s*['"`]([^'"`]+)['"`][\s\S]*?x\s*:\s*([^,]+),[\s\S]*?y\s*:\s*([^,}]+)/g;

let pMatch;
while ((pMatch = betterPinRegex.exec(content)) !== null) {
  pins.push({ n: pMatch[1], x: pMatch[2], y: pMatch[3]});
}

console.log(pins);
