const fs = require('fs');
const path = require('path');
const https = require('https');

const GUI_DIR = path.join(__dirname, 'scratch-gui-temp');
const TARGET_DIR = path.join(__dirname, 'src', 'components');
const ASSETS_DIR = path.join(__dirname, 'public', 'assets');

// Ensure target directories exist
if (!fs.existsSync(path.join(ASSETS_DIR, 'backdrops'))) {
    fs.mkdirSync(path.join(ASSETS_DIR, 'backdrops'), { recursive: true });
}
if (!fs.existsSync(path.join(ASSETS_DIR, 'sounds'))) {
    fs.mkdirSync(path.join(ASSETS_DIR, 'sounds'), { recursive: true });
}

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(dest)) {
            resolve();
            return;
        }
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close(resolve);
                });
            } else {
                file.close();
                fs.unlink(dest, () => reject(`Server responded with ${response.statusCode}: ${url}`));
            }
        }).on('error', (err) => {
            fs.unlink(dest, () => reject(err));
        });
    });
}

const SCRATCH_CDN = "https://cdn.assets.scratch.mit.edu/internalapi/asset";

async function run() {
    console.log('Starting downloading assets...');
    try {
        const backdropsJsonPath = path.join(GUI_DIR, 'src', 'lib', 'libraries', 'backdrops.json');
        if (fs.existsSync(backdropsJsonPath)) {
            console.log('Reading backdrops.json...');
            const backdropsData = JSON.parse(fs.readFileSync(backdropsJsonPath, 'utf8'));

            let count = 0;
            console.log(`Downloading ${backdropsData.length} backdrop assets...`);
            for (const bd of backdropsData) {
                const filename = bd.md5ext || bd.md5;
                const url = `${SCRATCH_CDN}/${filename}/get/`;
                const dest = path.join(ASSETS_DIR, 'backdrops', filename);
                try {
                    await downloadFile(url, dest);
                    count++;
                } catch (e) {
                    console.error('Failed to download', filename, e);
                }
            }
            console.log(`✅ Downloaded ${count} backdrop assets.`);
        }

        const soundsJsonPath = path.join(GUI_DIR, 'src', 'lib', 'libraries', 'sounds.json');
        if (fs.existsSync(soundsJsonPath)) {
            console.log('Reading sounds.json...');
            const soundsData = JSON.parse(fs.readFileSync(soundsJsonPath, 'utf8'));

            let count = 0;
            console.log(`Downloading ${soundsData.length} sound assets...`);
            for (const sd of soundsData) {
                const filename = sd.md5ext || sd.md5;
                const url = `${SCRATCH_CDN}/${filename}/get/`;
                const dest = path.join(ASSETS_DIR, 'sounds', filename);
                try {
                    await downloadFile(url, dest);
                    count++;
                } catch (e) {
                    // console.error('Failed to download', filename, e);
                }
            }
            console.log(`✅ Downloaded ${count} sound assets.`);
        }
        console.log('Extraction & Downloading complete!');
    } catch (e) {
        console.error('Error:', e);
    }
}

run();
