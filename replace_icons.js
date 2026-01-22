const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/junior/blocks/blocks.js');
let content = fs.readFileSync(filePath, 'utf8');

// Map of SVG icon paths to Unicode replacements
const replacements = [
    // 40x40 icons (large)
    [/new Blockly\.FieldImage\("\/icons\/compass\.svg", 40, 40, "\*"\)/g, 'new Blockly.FieldLabel("🧭", "junior-icon-large")'],
    [/new Blockly\.FieldImage\("\/icons\/flag\.svg", 40, 40, "\*"\)/g, 'new Blockly.FieldLabel("🚩", "junior-icon-large")'],

    // 20x20 icons (small)
    [/new Blockly\.FieldImage\("\/icons\/right\.svg", 20, 20, "\*"\)/g, 'new Blockly.FieldLabel("→", "junior-icon")'],
    [/new Blockly\.FieldImage\("\/icons\/left\.svg", 20, 20, "\*"\)/g, 'new Blockly.FieldLabel("←", "junior-icon")'],
    [/new Blockly\.FieldImage\("\/icons\/up\.svg", 20, 20, "\*"\)/g, 'new Blockly.FieldLabel("↑", "junior-icon")'],
    [/new Blockly\.FieldImage\("\/icons\/down\.svg", 20, 20, "\*"\)/g, 'new Blockly.FieldLabel("↓", "junior-icon")'],
    [/new Blockly\.FieldImage\("\/icons\/turn-right\.svg", 20, 20, "\*"\)/g, 'new Blockly.FieldLabel("↻", "junior-icon")'],
    [/new Blockly\.FieldImage\("\/icons\/turn-left\.svg", 20, 20, "\*"\)/g, 'new Blockly.FieldLabel("↺", "junior-icon")'],
    [/new Blockly\.FieldImage\("\/icons\/compass\.svg", 20, 20, "\*"\)/g, 'new Blockly.FieldLabel("🧭", "junior-icon")'],
    [/new Blockly\.FieldImage\("\/icons\/say\.svg", 20, 20, "\*"\)/g, 'new Blockly.FieldLabel("💬", "junior-icon")'],
    [/new Blockly\.FieldImage\("\/icons\/show\.svg", 20, 20, "\*"\)/g, 'new Blockly.FieldLabel("👁", "junior-icon")'],
    [/new Blockly\.FieldImage\("\/icons\/hide\.svg", 20, 20, "\*"\)/g, 'new Blockly.FieldLabel("🙈", "junior-icon")'],
    [/new Blockly\.FieldImage\("\/icons\/nav-expand\.svg", 20, 20, "\*"\)/g, 'new Blockly.FieldLabel("⊕", "junior-icon")'],
    [/new Blockly\.FieldImage\("\/icons\/nav-contract\.svg", 20, 20, "\*"\)/g, 'new Blockly.FieldLabel("⊖", "junior-icon")'],
    [/new Blockly\.FieldImage\("\/icons\/undo\.svg", 20, 20, "\*"\)/g, 'new Blockly.FieldLabel("↩", "junior-icon")'],
    [/new Blockly\.FieldImage\("\/icons\/megaphone\.svg", 20, 20, "\*"\)/g, 'new Blockly.FieldLabel("📢", "junior-icon")'],
    [/new Blockly\.FieldImage\("\/icons\/forever\.svg", 20, 20, "\*"\)/g, 'new Blockly.FieldLabel("🔄", "junior-icon")'],
    [/new Blockly\.FieldImage\("\/icons\/repeat\.svg", 20, 20, "\*"\)/g, 'new Blockly.FieldLabel("🔁", "junior-icon")'],
    [/new Blockly\.FieldImage\("\/icons\/hand-click\.svg", 20, 20, "\*"\)/g, 'new Blockly.FieldLabel("✋", "junior-icon")'],
    [/new Blockly\.FieldImage\("\/icons\/flag\.svg", 20, 20, "\*"\)/g, 'new Blockly.FieldLabel("🚩", "junior-icon")'],
    [/new Blockly\.FieldImage\("\/icons\/mail\.svg", 20, 20, "\*"\)/g, 'new Blockly.FieldLabel("📧", "junior-icon")'],
    [/new Blockly\.FieldImage\("\/icons\/pen-down\.svg", 20, 20, "\*"\)/g, 'new Blockly.FieldLabel("✏️", "junior-icon")'],
    [/new Blockly\.FieldImage\("\/icons\/pen-up\.svg", 20, 20, "\*"\)/g, 'new Blockly.FieldLabel("✒️", "junior-icon")'],
    [/new Blockly\.FieldImage\("\/icons\/erase\.svg", 20, 20, "\*"\)/g, 'new Blockly.FieldLabel("🧹", "junior-icon")'],
    [/new Blockly\.FieldImage\("\/icons\/sound\.svg", 20, 20, "\*"\)/g, 'new Blockly.FieldLabel("🔊", "junior-icon")'],
];

// Also replace the juniorBlockBase to use FieldLabel
content = content.replace(
    /function juniorBlockBase\(block, iconPath, fieldName, options\) \{[\s\S]*?\.appendField\(new Blockly\.FieldImage\(iconPath, 40, 40, "\*"\)\)/,
    `function juniorBlockBase(block, iconChar, fieldName, options) {
        // Row 1: Icon as large text (Centered)
        block.appendDummyInput()
            .appendField(new Blockly.FieldLabel(iconChar, "junior-block-icon"))`
);

// Replace all /icons/*.svg paths in juniorBlockBase calls with unicode
content = content.replace(/juniorBlockBase\(this, "\/icons\/right\.svg"/g, 'juniorBlockBase(this, "→"');
content = content.replace(/juniorBlockBase\(this, "\/icons\/left\.svg"/g, 'juniorBlockBase(this, "←"');
content = content.replace(/juniorBlockBase\(this, "\/icons\/up\.svg"/g, 'juniorBlockBase(this, "↑"');
content = content.replace(/juniorBlockBase\(this, "\/icons\/down\.svg"/g, 'juniorBlockBase(this, "↓"');
content = content.replace(/juniorBlockBase\(this, "\/icons\/turn-right\.svg"/g, 'juniorBlockBase(this, "↻"');
content = content.replace(/juniorBlockBase\(this, "\/icons\/turn-left\.svg"/g, 'juniorBlockBase(this, "↺"');

// Apply all replacements
for (const [pattern, replacement] of replacements) {
    content = content.replace(pattern, replacement);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('blocks.js updated successfully!');
