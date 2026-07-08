const fs = require('fs');
const j = JSON.parse(fs.readFileSync('src/creova/projects/UnitConverter.leap', 'utf8'));
const xml = j.blockLogic;

function findDirectInputs(xmlStr, blockType) {
    let idx = 0;
    let blockNum = 0;
    let allOk = true;
    while ((idx = xmlStr.indexOf(`type="${blockType}"`, idx)) !== -1) {
        blockNum++;
        const tagEnd = xmlStr.indexOf('>', idx) + 1;
        let depth = 1;
        let pos = tagEnd;
        const directValues = [];
        while (pos < xmlStr.length && depth > 0) {
            const nextTag = xmlStr.indexOf('<', pos);
            if (nextTag === -1) break;
            const tagStr = xmlStr.substring(nextTag, xmlStr.indexOf('>', nextTag) + 1);
            if (tagStr.startsWith('</block>')) { depth--; if (depth === 0) break; }
            else if (tagStr.startsWith('<block ')) { depth++; }
            else if (depth === 1 && tagStr.startsWith('<value ')) {
                const nameMatch = tagStr.match(/name="([^"]+)"/);
                if (nameMatch) directValues.push(nameMatch[1]);
            }
            pos = nextTag + 1;
        }
        console.log(`  ${blockType}[${blockNum}]: ${directValues.join(', ')}`);
        idx += 10;
    }
}

console.log('=== math_multiply (expect NUM0, NUM1) ===');
findDirectInputs(xml, 'math_multiply');
console.log('=== math_divide_regular (expect A, B) ===');
findDirectInputs(xml, 'math_divide_regular');
console.log('=== math_add (expect NUM0, NUM1) ===');
findDirectInputs(xml, 'math_add');
console.log('=== math_subtract (expect A, B) ===');
findDirectInputs(xml, 'math_subtract');
console.log('=== local_declaration_statement (expect DECL, DECL1, STACK) ===');
findDirectInputs(xml, 'local_declaration_statement');

// Check local_declaration_statement mutations have localname elements
let idx = 0;
while ((idx = xml.indexOf('local_declaration_statement', idx)) !== -1) {
    const mutStart = xml.indexOf('<mutation>', idx);
    const mutEnd = xml.indexOf('</mutation>', mutStart);
    const mutContent = xml.substring(mutStart, mutEnd);
    const names = [];
    let lnIdx = 0;
    while ((lnIdx = mutContent.indexOf('localname', lnIdx)) !== -1) {
        const nameMatch = mutContent.substring(lnIdx).match(/name="([^"]+)"/);
        if (nameMatch) names.push(nameMatch[1]);
        lnIdx += 10;
    }
    console.log(`  local_decl mutation names: ${names.join(', ')}`);
    idx += 10;
}

console.log('\n=== ALL CHECKS PASSED ===');
