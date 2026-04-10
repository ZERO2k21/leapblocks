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
  
  // Extract viewBox and support template strings like ${travelLength + 25}
  const viewBoxMatch = content.match(/viewBox=["'`]([^"'`]+)["'`]/);
  let viewBox = { minX: 0, minY: 0, width: 0, height: 0 };
  if (viewBoxMatch) {
    let vbStr = viewBoxMatch[1];
    vbStr = vbStr.replace(/\$\{this\.travelLength \+ 25\}/g, "55")
                 .replace(/\$\{travelLength \+ 25\}/g, "55")
                 .replace(/\$\{width\}/g, "30")
                 .replace(/\$\{height\}/g, "30")
                 .replace(/\$\{this\.columns \+ 1\}/g, "17")
                 .replace(/\$\{this\.rows\}/g, "2");
                 
    const parts = vbStr.split(/[ ,]+/).map(p => {
       // if still has ${}, default to something
       if (p.includes('${')) return 50;
       return parseFloat(p);
    });
    if (parts.length >= 4) {
      viewBox = { minX: parts[0], minY: parts[1], width: parts[2], height: parts[3] };
    }
  }

  if (viewBox.width === 0 || isNaN(viewBox.width)) {
      viewBox.width = 50;
      viewBox.height = 50;
  }

  let pins = [];
  
  // Instead of a single regex, we extract the object `{ ... }` blocks inside `pinInfo`
  let pinInfoIdx = content.indexOf('pinInfo');
  let searchSpace = pinInfoIdx !== -1 ? content.substring(pinInfoIdx) : content;
  
  // Find all objects with `name:`
  const objRegex = /\{[^{]*?name\s*:\s*['"`]([^'"`]+)['"`][^{}]*\}/g;
  let oMatch;
  while ((oMatch = objRegex.exec(searchSpace)) !== null) {
      const objStr = oMatch[0];
      const name = oMatch[1];
      
      const xMatch = objStr.match(/x\s*:\s*([^,]+)/);
      const yMatch = objStr.match(/y\s*:\s*([^,}]+)/);
      
      if (xMatch && yMatch) {
          let xStr = xMatch[1].replace(/this\.travelLength/g, '30').replace(/this\.columns/g, '16').replace(/this\.rows/g, '2');
          let yStr = yMatch[1].replace(/this\.travelLength/g, '30');
          
          let x, y;
          try { x = eval(xStr); } catch (e) { x = parseFloat(xStr); }
          try { y = eval(yStr); } catch (e) { y = parseFloat(yStr); }
          
          if (!isNaN(x) && !isNaN(y)) {
              if (!pins.find(p => p.name === name)) {
                  pins.push({ name, x, y });
              }
          }
      }
  }

  // Custom overrides for things that fail completely
  if (tag === 'potentiometer') {
      pins = [
        {name: "GND", x: 6, y: 3.5},
        {name: "SIG", x: 26, y: 3.5},
        {name: "VCC", x: 45.6, y: 3.5}
      ]
  }

  if (pins.length > 0) {
     elements[tag] = { viewBox, pins };
  }
}

fs.writeFileSync('./extracted_pins4.json', JSON.stringify(elements, null, 2));
console.log(`Extracted ${Object.keys(elements).length} elements.`);
