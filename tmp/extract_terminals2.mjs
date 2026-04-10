import fs from 'fs';
import path from 'path';

const srcDir = './wokwi-elements/src';
const files = fs.readdirSync(srcDir).filter(f => f.endsWith('-element.ts'));

const mmToPix = 3.7795275590551185;

const elements = {};

for (const file of files) {
  const content = fs.readFileSync(path.join(srcDir, file), 'utf8');
  
  const tagMatch = content.match(/@customElement\(['"]([^'"]+)['"]\)/);
  if (!tagMatch) continue;
  let tag = tagMatch[1].replace('wokwi-', ''); 
  
  const viewBoxMatch = content.match(/viewBox=["']([^"']+)["']/);
  let viewBox = { minX: 0, minY: 0, width: 0, height: 0 };
  if (viewBoxMatch) {
    const parts = viewBoxMatch[1].split(/[ ,]+/).map(parseFloat);
    if (parts.length === 4) {
      viewBox = { minX: parts[0], minY: parts[1], width: parts[2], height: parts[3] };
    }
  }

  // Find the pin declarations. We look for `{ name: 'xxx', x: yyy, y: zzz ... }`
  let pins = [];
  const pinRegex = /name\s*:\s*['"`]([^'"`]+)['"`]\s*,\s*x\s*:\s*([^,]+)\s*,\s*y\s*:\s*([^,}]+)/g;
  
  // Clean up content to remove newlines inside pin objects to make regex easier
  // actually just use [\s\S]
  const betterPinRegex = /name\s*:\s*['"`]([^'"`]+)['"`][\s\S]*?x\s*:\s*([^,]+),[\s\S]*?y\s*:\s*([^,}]+)/g;

  // Let's do a block extraction if we see `pinInfo`, extract that chunk
  let startIdx = content.indexOf('pinInfo');
  if (startIdx === -1) startIdx = 0; // Search whole file if not found
  
  let pMatch;
  // Let's use a specialized parsing to avoid bad regex
  while ((pMatch = betterPinRegex.exec(content)) !== null) {
      // Evaluate x and y just in case they have math like `this.travelLength * mmToPix`
      let xStr = pMatch[2].replace(/this\.travelLength/g, '30').replace(/this\.columns/g, '16').replace(/this\.rows/g, '2');
      let yStr = pMatch[3].replace(/this\.travelLength/g, '30');
      
      let x, y;
      try { x = eval(xStr); } catch (e) { x = parseFloat(xStr); }
      try { y = eval(yStr); } catch (e) { y = parseFloat(yStr); }
      
      // Make sure it looks like a valid coordinate
      if (!isNaN(x) && !isNaN(y)) {
          // ensure no duplicates
          if (!pins.find(p => p.name === pMatch[1])) {
              pins.push({ name: pMatch[1], x, y });
          }
      }
  }

  // For potentiometer specifically which has `pinInfo` as a getter
  if (tag === 'potentiometer') {
      pins = [
        {name: "GND", x: 6, y: 3.5},
        {name: "SIG", x: 26, y: 3.5},
        {name: "VCC", x: 45.6, y: 3.5}
      ]
  }

  if (viewBox.width > 0 && pins.length > 0) {
     elements[tag] = { viewBox, pins };
  }
}

fs.writeFileSync('./extracted_pins2.json', JSON.stringify(elements, null, 2));
console.log(`Extracted ${Object.keys(elements).length} elements.`);
