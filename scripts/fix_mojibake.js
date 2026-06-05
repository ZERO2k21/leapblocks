const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/leapLogix/client/pythonApp.jsx');
let content = fs.readFileSync(file, 'utf8');

const map = {
    'âœ ': '✏',
    'âš¡': '⚡',
    'âž¡ï¸ ': '➡️',
    'âš ': '⚠', // this is âš + \xA0 (non breaking space). I'll use regex.
    'â ¹': '⏹',
    'â ±': '⏱',
    'â ³': '⏳',
    'â• ': '═',
    'â€”': '—',
};

for (const [key, val] of Object.entries(map)) {
    content = content.split(key).join(val);
}

// Special case for warning sign with trailing space
content = content.replace(/âš\xA0/g, '⚠️');

fs.writeFileSync(file, content);
console.log('Remaining Mojibake fixed');
