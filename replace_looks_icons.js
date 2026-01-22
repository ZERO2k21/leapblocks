const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/junior/blocks/looksBlocks.js');
let content = fs.readFileSync(filePath, 'utf8');

// Update juniorLooksBase to use FieldLabel
content = content.replace(
    /function juniorLooksBase\(block, iconPath, inputField, inputName\) \{[\s\S]*?\.appendField\(new Blockly\.FieldImage\(iconPath, 40, 40, "\*"\)\)/,
    `function juniorLooksBase(block, iconChar, inputField, inputName) {
        // Row 1: Icon
        block.appendDummyInput()
            .appendField(new Blockly.FieldLabel(iconChar, "junior-icon-large"))`
);

// Replace all /icons/*.svg paths in juniorLooksBase calls with unicode
content = content.replace(/juniorLooksBase\(this, "\/icons\/say\.svg"/g, 'juniorLooksBase(this, "💬"');
content = content.replace(/juniorLooksBase\(this, "\/icons\/show\.svg"/g, 'juniorLooksBase(this, "👁"');
content = content.replace(/juniorLooksBase\(this, "\/icons\/hide\.svg"/g, 'juniorLooksBase(this, "🙈"');
content = content.replace(/juniorLooksBase\(this, "\/icons\/size\.svg"/g, 'juniorLooksBase(this, "⬛"');
content = content.replace(/juniorLooksBase\(this, "\/icons\/right\.svg"/g, 'juniorLooksBase(this, "→"');

fs.writeFileSync(filePath, content, 'utf8');
console.log('looksBlocks.js updated successfully!');
