const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/leapCodex/client/pythonApp.jsx');
let content = fs.readFileSync(file, 'utf8');

const map = {
    'âœ“': '✓',
    'âœ—': '✗',
    'â–¶': '▶',
    'â”€': '─',
    'â†’': '→',
    'âš ': '⚠',
    'â ¹': '⏹',
    'â ±': '⏱',
    'â ³': '⏳',
    'âš™': '⚙',
    'â• ': '═',
    'ðŸ’¡': '💡'
};

for (const [key, val] of Object.entries(map)) {
    content = content.split(key).join(val);
}

fs.writeFileSync(file, content);
console.log('Mojibake fixed');
