/**
 * Test script for Electra Compiler Server
 * 
 * Usage: node test-server.js [server-url]
 * Example: node test-server.js http://localhost:3001
 */

const SERVER_URL = process.argv[2] || 'http://localhost:3001';

console.log('========================================');
console.log('  Electra Compiler Server Test');
console.log('========================================');
console.log(`Testing: ${SERVER_URL}\n`);

// Test 1: Health Check
async function testHealth() {
    console.log('[TEST 1] Health Check...');
    try {
        const res = await fetch(`${SERVER_URL}/health`);
        const data = await res.json();

        if (data.status === 'ok') {
            console.log('✅ Server is running');
            console.log(`   Port: ${data.port}`);
            console.log(`   Uptime: ${data.uptime}s`);
            console.log(`   Arduino CLI: ${data.arduinoCli}`);
            console.log(`   ESP32 Core: ${data.esp32CoreReady ? 'Ready' : 'Not installed'}`);
            return true;
        } else {
            console.log('❌ Server returned unexpected status');
            return false;
        }
    } catch (err) {
        console.log(`❌ Failed to connect: ${err.message}`);
        console.log('   Make sure the server is running: npm start');
        return false;
    }
}

// Test 2: Transpilation (Fast)
async function testTranspile() {
    console.log('\n[TEST 2] Transpilation (Arduino C++ → JavaScript)...');

    const code = `
void setup() {
  pinMode(2, OUTPUT);
  Serial.begin(115200);
  Serial.println("ESP32 Test");
}

void loop() {
  digitalWrite(2, HIGH);
  delay(1000);
  digitalWrite(2, LOW);
  delay(1000);
}
`;

    try {
        const res = await fetch(`${SERVER_URL}/transpile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, board: 'esp32:esp32:esp32c3' })
        });

        const data = await res.json();

        if (data.success && data.jsCode) {
            console.log('✅ Transpilation successful');
            console.log(`   Output size: ${data.jsCode.length} bytes`);
            console.log(`   Contains setup: ${data.jsCode.includes('__setup')}`);
            console.log(`   Contains loop: ${data.jsCode.includes('__loop')}`);
            return true;
        } else {
            console.log('❌ Transpilation failed');
            console.log(`   Error: ${data.errors || 'Unknown error'}`);
            return false;
        }
    } catch (err) {
        console.log(`❌ Request failed: ${err.message}`);
        return false;
    }
}

// Test 3: AVR Compilation (Requires arduino-cli)
async function testCompileAVR() {
    console.log('\n[TEST 3] AVR Compilation (Arduino Uno)...');
    console.log('   This may take 5-10 seconds...');

    const code = `
void setup() {
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH);
  delay(1000);
  digitalWrite(13, LOW);
  delay(1000);
}
`;

    try {
        const res = await fetch(`${SERVER_URL}/compile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, board: 'arduino:avr:uno' })
        });

        const data = await res.json();

        if (data.success && data.hex) {
            console.log('✅ AVR compilation successful');
            console.log(`   HEX size: ${data.hex.length} bytes`);
            return true;
        } else {
            console.log('⚠️  AVR compilation failed (arduino-cli may not be installed)');
            console.log(`   Error: ${data.errors || 'Unknown error'}`);
            return false;
        }
    } catch (err) {
        console.log(`❌ Request failed: ${err.message}`);
        return false;
    }
}

// Test 4: ESP32 Compilation (Requires arduino-cli + ESP32 core)
async function testCompileESP32() {
    console.log('\n[TEST 4] ESP32 Compilation...');
    console.log('   This may take 30-60 seconds on first run...');

    const code = `
void setup() {
  Serial.begin(115200);
  Serial.println("ESP32-C3 Test");
}

void loop() {
  Serial.println("Hello from ESP32!");
  delay(1000);
}
`;

    try {
        const res = await fetch(`${SERVER_URL}/compile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, board: 'esp32:esp32:esp32c3' })
        });

        const data = await res.json();

        if (data.success && data.binBase64) {
            console.log('✅ ESP32 compilation successful');
            console.log(`   Binary size: ${data.binBase64.length} bytes (base64)`);
            console.log(`   HEX size: ${data.hex?.length || 0} bytes`);
            return true;
        } else {
            console.log('⚠️  ESP32 compilation failed (ESP32 core may not be installed)');
            console.log(`   Error: ${data.errors || 'Unknown error'}`);
            return false;
        }
    } catch (err) {
        console.log(`❌ Request failed: ${err.message}`);
        return false;
    }
}

// Run all tests
async function runTests() {
    const results = {
        health: false,
        transpile: false,
        compileAVR: false,
        compileESP32: false
    };

    results.health = await testHealth();

    if (results.health) {
        results.transpile = await testTranspile();
        results.compileAVR = await testCompileAVR();
        results.compileESP32 = await testCompileESP32();
    }

    console.log('\n========================================');
    console.log('  Test Results');
    console.log('========================================');
    console.log(`Health Check:       ${results.health ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Transpilation:      ${results.transpile ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`AVR Compilation:    ${results.compileAVR ? '✅ PASS' : '⚠️  SKIP'}`);
    console.log(`ESP32 Compilation:  ${results.compileESP32 ? '✅ PASS' : '⚠️  SKIP'}`);
    console.log('========================================\n');

    if (results.health && results.transpile) {
        console.log('✅ Server is ready for web mode (transpilation works)');
        console.log('   Update platform.ts with this URL:');
        console.log(`   export const CLOUD_COMPILER_URL = '${SERVER_URL}';`);
    } else {
        console.log('❌ Server has issues. Check the errors above.');
    }

    if (!results.compileAVR || !results.compileESP32) {
        console.log('\n⚠️  Compilation tests failed. This is OK for web mode.');
        console.log('   To enable compilation:');
        console.log('   1. Install arduino-cli: https://arduino.github.io/arduino-cli/');
        console.log('   2. Install ESP32 core: arduino-cli core install esp32:esp32');
    }

    console.log('');
}

runTests().catch(err => {
    console.error('Test suite failed:', err);
    process.exit(1);
});
