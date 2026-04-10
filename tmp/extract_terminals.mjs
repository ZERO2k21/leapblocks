import fs from 'fs';
import path from 'path';

const srcDir = './wokwi-elements/src';
const files = fs.readdirSync(srcDir).filter(f => f.endsWith('-element.ts'));

const elements = {};

for (const file of files) {
  const content = fs.readFileSync(path.join(srcDir, file), 'utf8');
  
  // Extract Component Name (from @customElement('wokwi-dht22'))
  const tagMatch = content.match(/@customElement\(['"]([^'"]+)['"]\)/);
  if (!tagMatch) continue;
  let tag = tagMatch[1].replace('wokwi-', ''); // e.g., dht22
  
  // Extract viewBox="... "
  const viewBoxMatch = content.match(/viewBox=["']([^"']+)["']/);
  let viewBox = { minX: 0, minY: 0, width: 0, height: 0 };
  if (viewBoxMatch) {
    const parts = viewBoxMatch[1].split(/[ ,]+/).map(parseFloat);
    if (parts.length === 4) {
      viewBox = { minX: parts[0], minY: parts[1], width: parts[2], height: parts[3] };
    }
  }

  // Extract pinInfo block
  // This takes everything between pinInfo: ... [ and the closing ]
  let pins = [];
  const startIdx = content.indexOf('pinInfo');
  if (startIdx !== -1) {
    const arrayStart = content.indexOf('[', startIdx);
    if (arrayStart !== -1) {
        let arrayEnd = arrayStart;
        let brackets = 1;
        for (let i = arrayStart + 1; i < content.length; i++) {
           if (content[i] === '[') brackets++;
           if (content[i] === ']') brackets--;
           if (brackets === 0) {
               arrayEnd = i;
               break;
           }
        }
        
        const pinString = content.substring(arrayStart, arrayEnd + 1);
        
        // Find individual pins: name: 'VCC', x: 25, y: 12
        const pinRegex = /name\s*:\s*['"`]([^'"`]+)['"`][^}]*?x\s*:\s*([-\d\.]+)[^}]*?y\s*:\s*([-\d\.]+)/g;
        let pMatch;
        while ((pMatch = pinRegex.exec(pinString)) !== null) {
            pins.push({
                name: pMatch[1],
                x: parseFloat(pMatch[2]),
                y: parseFloat(pMatch[3])
            });
        }
    }
  }

  // Handle some manual overrides where 'pinInfo' isn't explicitly defined like that, or pins are generated programmatically
  // e.g., Arduino Mega, Uno have it in `const pinInfo = ...`
  if (pins.length === 0) {
      const altPinRegex = /\{[^}]*name\s*:\s*['"`]([^'"`]+)['"`][^}]*?x\s*:\s*([-\d\.]+)[^}]*?y\s*:\s*([-\d\.]+)[^}]*}/g;
      let pMatch;
      while ((pMatch = altPinRegex.exec(content)) !== null) {
          pins.push({
              name: pMatch[1],
              x: parseFloat(pMatch[2]),
              y: parseFloat(pMatch[3])
          });
      }
  }

  if (viewBox.width > 0 && pins.length > 0) {
     elements[tag] = { viewBox, pins };
  }
}

fs.writeFileSync('./extracted_pins.json', JSON.stringify(elements, null, 2));
console.log(`Extracted ${Object.keys(elements).length} elements.`);
