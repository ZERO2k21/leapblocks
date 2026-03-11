const fs = require('fs');
const path = require('path');

const soundsJsonPath = path.join(__dirname, 'src', 'lib', 'libraries', 'sounds.json');
const soundsDir = path.join(__dirname, 'public', 'assets', 'sounds');

console.log('Reading sounds.json...');
const soundsConfig = JSON.parse(fs.readFileSync(soundsJsonPath, 'utf-8'));

console.log(`Original sounds count: ${soundsConfig.length}`);

const validSounds = [];
let missingCount = 0;

for (const sound of soundsConfig) {
    const filename = sound.md5ext;
    const soundFilePath = path.join(soundsDir, filename);

    if (fs.existsSync(soundFilePath)) {
        validSounds.push(sound);
    } else {
        missingCount++;
        // console.log(`Missing sound: ${sound.name} (${filename})`);
    }
}

console.log(`Missing sounds found: ${missingCount}`);
console.log(`Valid sounds: ${validSounds.length}`);

console.log('Writing updated sounds.json...');
fs.writeFileSync(soundsJsonPath, JSON.stringify(validSounds, null, 4), 'utf-8');

console.log('Cleanup complete!');
