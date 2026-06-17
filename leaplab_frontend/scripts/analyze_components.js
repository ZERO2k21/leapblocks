const fs = require('fs');
const path = require('path');

const directories = ['src/leapignite', 'src/leapembed', 'src/Logix'];

function analyzeDirectory(dirPath) {
    const stats = {
        ts: { files: 0, lines: 0 },
        tsx: { files: 0, lines: 0 },
        js: { files: 0, lines: 0 },
        jsx: { files: 0, lines: 0 }
    };

    if (!fs.existsSync(dirPath)) {
        return null;
    }

    function walk(dir) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                walk(fullPath);
            } else {
                const ext = path.extname(fullPath).toLowerCase();
                if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    const lines = content.split('\n').length;
                    const key = ext.substring(1);
                    stats[key].files++;
                    stats[key].lines += lines;
                }
            }
        }
    }

    walk(dirPath);
    return stats;
}

const results = {};
for (const dir of directories) {
    const p = path.join(__dirname, dir);
    results[dir] = analyzeDirectory(p);
}

console.log(JSON.stringify(results, null, 2));
