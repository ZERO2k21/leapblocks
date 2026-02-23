import * as Blockly from 'blockly';

// ═══════════════════════════════════════════════════════════════════════════
// LOGGING UTILITY
// ═══════════════════════════════════════════════════════════════════════════
const log = (blockType: string, msg: string, data?: any) => {
    console.log(`[GENERATOR:${blockType}] ${msg}`, data ?? '');
};

console.log('[GENERATOR] Creating Arduino generator...');
export const arduinoGenerator = new Blockly.Generator('Arduino');

const ORDER_ATOMIC = 0;
const ORDER_UNARY_PREFIX = 2;
const ORDER_MULTIPLICATIVE = 3;
const ORDER_ADDITIVE = 4;
const ORDER_RELATIONAL = 5;
const ORDER_LOGICAL_AND = 7;
const ORDER_LOGICAL_OR = 8;
const ORDER_NONE = 99;

// Initialize the generator
arduinoGenerator.init = function (workspace: Blockly.Workspace) {
    (this as any).definitions_ = {};
    (this as any).setups_ = {};
};

// Block scrubbing (concatenation)
arduinoGenerator.scrub_ = function (block: Blockly.Block, code: string, thisOnly?: boolean) {
    // Prevent floating non-hat blocks from rendering in global scope if event hats exist
    if (!block.getParent()) {
        const isHat = block.type === 'arduino_setup' || block.type === 'arduino_loop';
        if (!isHat) {
            const hasHats = block.workspace.getTopBlocks(false).some(
                b => b.type === 'arduino_setup' || b.type === 'arduino_loop'
            );
            if (hasHats) {
                return ''; // Nullify this entire floating stack's output string
            }
        }
    }

    const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
    if (nextBlock && !thisOnly) {
        return code + this.blockToCode(nextBlock);
    }
    return code;
};

// Final code adjustments
arduinoGenerator.finish = function (code: string) {
    const generator = this as any;
    const defs = Object.values(generator.definitions_ || {}).join('\n');
    const setups = Object.values(generator.setups_ || {}).join('\n');

    let finalCode = '';
    if (defs) finalCode += defs + '\n\n';

    // Ensure code has balanced braces for functions
    let processedCode = code;
    const openBraces = (processedCode.match(/{/g) || []).length;
    const closeBraces = (processedCode.match(/}/g) || []).length;
    if (openBraces > closeBraces) {
        processedCode += '\n}\n'.repeat(openBraces - closeBraces);
    }

    // Check if user provided their own setup() or loop()
    const hasSetup = processedCode.includes('void setup()');
    const hasLoop = processedCode.includes('void loop()');

    if (!hasSetup) {
        finalCode += `void setup() {\n${setups}\n}\n\n`;
    } else {
        // Inject setups into the existing setup function - handle both with/without newline
        processedCode = processedCode.replace(/void setup\(\) {(\n)?/, `void setup() {\n${setups}\n`);
    }

    if (!hasLoop && processedCode.trim() && !hasSetup) {
        finalCode += `void loop() {\n${processedCode}\n}\n`;
    } else {
        finalCode += processedCode;
    }

    return finalCode;
};

// Helper to add setup code
(arduinoGenerator as any).addSetup = function (name: string, code: string) {
    if (!this.setups_) this.setups_ = {};
    this.setups_[name] = code;
};

// Helper to add definitions/includes
(arduinoGenerator as any).addDefinition = function (name: string, code: string) {
    if (!this.definitions_) this.definitions_ = {};
    this.definitions_[name] = code;
};

// ═══════════════════════════════════════════════════════════════════════════
// EVENTS
// ═══════════════════════════════════════════════════════════════════════════
arduinoGenerator.forBlock['arduino_setup'] = function (block, generator) {
    log('arduino_setup', 'Generating');
    // We don't return the full code here, just the opening. 
    // The finish() method will handle wrapping and closing if needed.
    return `void setup() {\n`;
};

arduinoGenerator.forBlock['arduino_loop'] = function (block, generator) {
    const doCode = generator.statementToCode(block, 'DO') || '';
    log('arduino_loop', 'Generating', { innerLength: doCode.length });

    return `}\n\nvoid loop() {\n${doCode}}\n`;
};

// ═══════════════════════════════════════════════════════════════════════════
// CONTROL
// ═══════════════════════════════════════════════════════════════════════════
arduinoGenerator.forBlock['arduino_delay'] = function (block) {
    const secs = block.getFieldValue('SECS');
    const ms = Math.round(secs * 1000);
    log('arduino_delay', 'Generating', { secs, ms });
    return `  delay(${ms});\n`;
};

arduinoGenerator.forBlock['arduino_repeat'] = function (block, generator) {
    const times = block.getFieldValue('TIMES');
    const doCode = generator.statementToCode(block, 'DO') || '';
    log('arduino_repeat', 'Generating', { times });
    return `  for (int i = 0; i < ${times}; i++) {\n${doCode}  }\n`;
};

arduinoGenerator.forBlock['arduino_if'] = function (block, generator) {
    const condition = generator.valueToCode(block, 'CONDITION', ORDER_NONE) || 'false';
    const doCode = generator.statementToCode(block, 'DO') || '';
    log('arduino_if', 'Generating', { condition });
    return `  if (${condition}) {\n${doCode}  }\n`;
};

arduinoGenerator.forBlock['arduino_if_else'] = function (block, generator) {
    const condition = generator.valueToCode(block, 'CONDITION', ORDER_NONE) || 'false';
    const doCode = generator.statementToCode(block, 'DO') || '';
    const elseCode = generator.statementToCode(block, 'ELSE') || '';
    log('arduino_if_else', 'Generating', { condition });
    return `  if (${condition}) {\n${doCode}  } else {\n${elseCode}  }\n`;
};

arduinoGenerator.forBlock['arduino_wait_until'] = function (block, generator) {
    const condition = generator.valueToCode(block, 'CONDITION', ORDER_NONE) || 'false';
    log('arduino_wait_until', 'Generating', { condition });
    return `  while (!(${condition})) { delay(10); }\n`;
};

arduinoGenerator.forBlock['arduino_repeat_until'] = function (block, generator) {
    const condition = generator.valueToCode(block, 'CONDITION', ORDER_NONE) || 'false';
    const doCode = generator.statementToCode(block, 'DO') || '';
    log('arduino_repeat_until', 'Generating', { condition });
    return `  while (!(${condition})) {\n${doCode}  }\n`;
};

arduinoGenerator.forBlock['arduino_stop'] = function (block) {
    log('arduino_stop', 'Generating');
    return `  while(true) { delay(1000); } // stop\n`;
};

// ═══════════════════════════════════════════════════════════════════════════
// GPIO
// ═══════════════════════════════════════════════════════════════════════════
arduinoGenerator.forBlock['arduino_digital_write'] = function (block) {
    const pin = block.getFieldValue('PIN');
    const value = block.getFieldValue('VALUE');
    (arduinoGenerator as any).addSetup(`pinMode_${pin}`, `  pinMode(${pin}, OUTPUT);`);
    log('arduino_digital_write', 'Generating', { pin, value });
    return `  digitalWrite(${pin}, ${value});\n`;
};

arduinoGenerator.forBlock['arduino_digital_read'] = function (block) {
    const pin = block.getFieldValue('PIN');
    (arduinoGenerator as any).addSetup(`pinMode_${pin}`, `  pinMode(${pin}, INPUT);`);
    log('arduino_digital_read', 'Generating', { pin });
    return [`digitalRead(${pin})`, ORDER_ATOMIC];
};

arduinoGenerator.forBlock['arduino_pir'] = function (block) {
    const pin = block.getFieldValue('PIN');
    (arduinoGenerator as any).addSetup(`pinMode_${pin}`, `  pinMode(${pin}, INPUT);`);
    log('arduino_pir', 'Generating', { pin });
    return [`digitalRead(${pin}) == HIGH`, ORDER_RELATIONAL];
};

arduinoGenerator.forBlock['arduino_digital_sensor'] = function (block) {
    const sensor = block.getFieldValue('SENSOR');
    const pin = block.getFieldValue('PIN');
    (arduinoGenerator as any).addSetup(`pinMode_${pin}`, `  pinMode(${pin}, INPUT);`);
    log('arduino_digital_sensor', 'Generating', { sensor, pin });

    // Most digital sensors (PIR, Soil Moisture, Hall, Touch) are Active High (1 when detected)
    // IR (Proximity) is often Active Low (0 when detected)
    // To keep it consistent for kids, we'll try to provide a "detected" state.
    // However, some users might want the raw state.
    // Based on the PictoBlox style, usually "read digital sensor" returns true if detection is high.
    // But for IR proximity, it's usually low.
    // Let's check the sensor type and handle inversion if it's IR.

    if (sensor === 'IR') {
        return [`digitalRead(${pin}) == LOW`, ORDER_RELATIONAL];
    }
    return [`digitalRead(${pin}) == HIGH`, ORDER_RELATIONAL];
};

arduinoGenerator.forBlock['arduino_analog_write'] = function (block) {
    const pin = block.getFieldValue('PIN');
    const value = block.getFieldValue('VALUE');
    (arduinoGenerator as any).addSetup(`pinMode_${pin}`, `  pinMode(${pin}, OUTPUT);`);
    log('arduino_analog_write', 'Generating', { pin, value });
    return `  analogWrite(${pin}, ${value});\n`;
};

arduinoGenerator.forBlock['arduino_analog_read'] = function (block) {
    const pin = block.getFieldValue('PIN');
    (arduinoGenerator as any).addSetup(`pinMode_${pin}`, `  pinMode(${pin}, INPUT);`);
    log('arduino_analog_read', 'Generating', { pin });
    return [`analogRead(${pin})`, ORDER_ATOMIC];
};

arduinoGenerator.forBlock['arduino_tone'] = function (block) {
    const pin = block.getFieldValue('PIN');
    const freq = block.getFieldValue('FREQ');
    (arduinoGenerator as any).addSetup(`pinMode_${pin}`, `  pinMode(${pin}, OUTPUT);`);
    log('arduino_tone', 'Generating', { pin, freq });
    return `  tone(${pin}, ${freq});\n`;
};

arduinoGenerator.forBlock['arduino_notone'] = function (block) {
    const pin = block.getFieldValue('PIN');
    (arduinoGenerator as any).addSetup(`pinMode_${pin}`, `  pinMode(${pin}, OUTPUT);`);
    log('arduino_notone', 'Generating', { pin });
    return `  noTone(${pin});\n`;
};

arduinoGenerator.forBlock['arduino_millis'] = function () {
    log('arduino_millis', 'Generating');
    return [`millis()`, ORDER_ATOMIC];
};

arduinoGenerator.forBlock['arduino_map'] = function (block, generator) {
    const value = generator.valueToCode(block, 'VALUE', ORDER_NONE) || '0';
    const inMin = block.getFieldValue('IN_MIN');
    const inMax = block.getFieldValue('IN_MAX');
    const outMin = block.getFieldValue('OUT_MIN');
    const outMax = block.getFieldValue('OUT_MAX');
    log('arduino_map', 'Generating', { value });
    return [`map(${value}, ${inMin}, ${inMax}, ${outMin}, ${outMax})`, ORDER_ATOMIC];
};

arduinoGenerator.forBlock['arduino_constrain'] = function (block, generator) {
    const value = generator.valueToCode(block, 'VALUE', ORDER_NONE) || '0';
    const min = block.getFieldValue('MIN');
    const max = block.getFieldValue('MAX');
    log('arduino_constrain', 'Generating', { value, min, max });
    return [`constrain(${value}, ${min}, ${max})`, ORDER_ATOMIC];
};

// ═══════════════════════════════════════════════════════════════════════════
// VARIABLES
// ═══════════════════════════════════════════════════════════════════════════
// Helper to extract variable info from both 'VAR' and 'VARIABLE' fields
const sanitizeName = (name: string) => {
    let safeName = name.replace(/[^a-zA-Z0-9]/g, '_');
    if (/^[0-9]/.test(safeName)) {
        safeName = '_' + safeName;
    }
    return safeName;
};

const getVarInfo = (block: any) => {
    const varId = block.getFieldValue('VAR') || block.getFieldValue('VARIABLE');
    const variable = block.workspace.getVariableById(varId);
    const rawName = variable ? (variable as any).name : varId;
    return {
        id: varId,
        name: sanitizeName(rawName),
        type: variable ? (variable as any).type : ''
    };
};

const ensureVarDeclared = (name: string, type: string) => {
    const declType = (type === 'String') ? 'String' : 'double';
    const initVal = (type === 'String') ? '""' : '0';
    (arduinoGenerator as any).addDefinition(`var_decl_${name}`, `${declType} ${name} = ${initVal};`);
};

arduinoGenerator.forBlock['variables_get'] = function (block) {
    const { name, type } = getVarInfo(block);
    ensureVarDeclared(name, type);
    log('variables_get', 'Generating', { name, type });
    return [name, ORDER_ATOMIC];
};

arduinoGenerator.forBlock['variables_set'] = function (block, generator) {
    const { name, type } = getVarInfo(block);
    const value = generator.valueToCode(block, 'VALUE', ORDER_NONE) || '0';
    ensureVarDeclared(name, type);
    log('variables_set', 'Generating', { name, type });
    return `  ${name} = ${value};\n`;
};

// PictoBlox/Scratch-style variable blocks used by LEAP_VARIABLES category
arduinoGenerator.forBlock['data_setvariableto'] = function (block, generator) {
    const { name, type } = getVarInfo(block);
    const value = generator.valueToCode(block, 'VALUE', ORDER_NONE) || '0';
    ensureVarDeclared(name, type);
    log('data_setvariableto', 'Generating', { name, type });
    return `  ${name} = ${value};\n`;
};

arduinoGenerator.forBlock['variables_set_intermediate'] = function (block, generator) {
    const { name, type } = getVarInfo(block);
    const value = generator.valueToCode(block, 'VALUE', ORDER_NONE) || '0';
    ensureVarDeclared(name, type);
    log('variables_set_intermediate', 'Generating', { name, type });
    return `  ${name} = ${value};\n`;
};

arduinoGenerator.forBlock['data_changevariableby'] = function (block, generator) {
    const { name, type } = getVarInfo(block);
    const value = generator.valueToCode(block, 'VALUE', ORDER_NONE) || '1';
    ensureVarDeclared(name, type);
    log('data_changevariableby', 'Generating', { name, type });
    return `  ${name} = ${name} + ${value};\n`;
};

arduinoGenerator.forBlock['data_showvariable'] = function (block) {
    return ''; // UI only, no Arduino code
};

arduinoGenerator.forBlock['data_hidevariable'] = function (block) {
    return ''; // UI only, no Arduino code
};

// ═══════════════════════════════════════════════════════════════════════════
// SERIAL
// ═══════════════════════════════════════════════════════════════════════════
arduinoGenerator.forBlock['arduino_serial_begin'] = function (block) {
    const baud = block.getFieldValue('BAUD') || '9600';
    log('arduino_serial_begin', 'Generating', { baud });
    (arduinoGenerator as any).addSetup('serial_begin', `  Serial.begin(${baud});`);
    return `  Serial.begin(${baud});\n`;
};

arduinoGenerator.forBlock['arduino_serial_print'] = function (block, generator) {
    const text = generator.valueToCode(block, 'TEXT', ORDER_NONE) || '""';
    log('arduino_serial_print', 'Generating', { text });
    (arduinoGenerator as any).addSetup('serial_begin_fallback', '  Serial.begin(9600);');
    return `  Serial.print(${text});\n`;
};

arduinoGenerator.forBlock['arduino_serial_println'] = function (block, generator) {
    const text = generator.valueToCode(block, 'TEXT', ORDER_NONE) || '""';
    log('arduino_serial_println', 'Generating', { text });
    (arduinoGenerator as any).addSetup('serial_begin_fallback', '  Serial.begin(9600);');
    return `  Serial.println(${text});\n`;
};

arduinoGenerator.forBlock['arduino_serial_print_labeled'] = function (block, generator) {
    const label = generator.valueToCode(block, 'LABEL', ORDER_ATOMIC) || '"label: "';
    const value = generator.valueToCode(block, 'VALUE', ORDER_ATOMIC) || '0';
    (arduinoGenerator as any).addSetup('serial_begin_fallback', '  Serial.begin(9600);');
    return `  Serial.print(${label});\n  Serial.println(${value});\n`;
};

arduinoGenerator.forBlock['arduino_serial_available'] = function () {
    log('arduino_serial_available', 'Generating');
    (arduinoGenerator as any).addSetup('serial_begin_fallback', '  Serial.begin(9600);');
    return [`Serial.available()`, ORDER_ATOMIC];
};

arduinoGenerator.forBlock['arduino_serial_read'] = function () {
    log('arduino_serial_read', 'Generating');
    (arduinoGenerator as any).addSetup('serial_begin_fallback', '  Serial.begin(9600);');
    return [`Serial.read()`, ORDER_ATOMIC];
};

// Advanced Communication Generators
arduinoGenerator.forBlock['arduino_bluetooth_serial_begin'] = function (block) {
    const baud = block.getFieldValue('BAUD');
    (arduinoGenerator as any).addDefinition('bt_serial_include', '#ifdef ARDUINO_ARCH_ESP32\n#include "BluetoothSerial.h"\n#endif');
    (arduinoGenerator as any).addDefinition('bt_serial_def', '#ifdef ARDUINO_ARCH_ESP32\nBluetoothSerial SerialBT;\n#endif');
    (arduinoGenerator as any).addSetup('bt_serial_begin', `#ifdef ARDUINO_ARCH_ESP32\n  SerialBT.begin("LeapBlocks_ESP32");\n#else\n  // Bluetooth Serial only supported on ESP32\n#endif\n  // Baud ${baud} ignored by BT Serial normally but kept for compatibility`);
    return '';
};

const getSerialPortName = (port: string) => {
    return port === '0' ? 'Serial' : `Serial${port}`;
};

arduinoGenerator.forBlock['arduino_serial_multi_write'] = function (block, generator) {
    const value = generator.valueToCode(block, 'VALUE', ORDER_NONE) || '""';
    return `  Serial.println(${value});\n`;
};

// ═══════════════════════════════════════════════════════════════════════════
// OPERATORS
// ═══════════════════════════════════════════════════════════════════════════
arduinoGenerator.forBlock['arduino_math_add'] = function (block, generator) {
    const a = generator.valueToCode(block, 'A', ORDER_ADDITIVE) || '0';
    const b = generator.valueToCode(block, 'B', ORDER_ADDITIVE) || '0';
    log('arduino_math_add', 'Generating', { a, b });
    return [`(${a} + ${b})`, ORDER_ADDITIVE];
};

arduinoGenerator.forBlock['arduino_math_subtract'] = function (block, generator) {
    const a = generator.valueToCode(block, 'A', ORDER_ADDITIVE) || '0';
    const b = generator.valueToCode(block, 'B', ORDER_ADDITIVE) || '0';
    log('arduino_math_subtract', 'Generating', { a, b });
    return [`(${a} - ${b})`, ORDER_ADDITIVE];
};

arduinoGenerator.forBlock['arduino_math_multiply'] = function (block, generator) {
    const a = generator.valueToCode(block, 'A', ORDER_MULTIPLICATIVE) || '0';
    const b = generator.valueToCode(block, 'B', ORDER_MULTIPLICATIVE) || '0';
    log('arduino_math_multiply', 'Generating', { a, b });
    return [`(${a} * ${b})`, ORDER_MULTIPLICATIVE];
};

arduinoGenerator.forBlock['arduino_math_divide'] = function (block, generator) {
    const a = generator.valueToCode(block, 'A', ORDER_MULTIPLICATIVE) || '0';
    const b = generator.valueToCode(block, 'B', ORDER_MULTIPLICATIVE) || '1';
    log('arduino_math_divide', 'Generating', { a, b });
    return [`(${a} / ${b})`, ORDER_MULTIPLICATIVE];
};

arduinoGenerator.forBlock['arduino_random'] = function (block) {
    const min = block.getFieldValue('MIN');
    const max = block.getFieldValue('MAX');
    log('arduino_random', 'Generating', { min, max });
    return [`random(${min}, ${max + 1})`, ORDER_ATOMIC];
};

arduinoGenerator.forBlock['arduino_compare_gt'] = function (block, generator) {
    const a = generator.valueToCode(block, 'A', ORDER_RELATIONAL) || '0';
    const b = generator.valueToCode(block, 'B', ORDER_RELATIONAL) || '0';
    log('arduino_compare_gt', 'Generating', { a, b });
    return [`(${a} > ${b})`, ORDER_RELATIONAL];
};

arduinoGenerator.forBlock['arduino_compare_lt'] = function (block, generator) {
    const a = generator.valueToCode(block, 'A', ORDER_RELATIONAL) || '0';
    const b = generator.valueToCode(block, 'B', ORDER_RELATIONAL) || '0';
    log('arduino_compare_lt', 'Generating', { a, b });
    return [`(${a} < ${b})`, ORDER_RELATIONAL];
};

arduinoGenerator.forBlock['arduino_compare_eq'] = function (block, generator) {
    const a = generator.valueToCode(block, 'A', ORDER_RELATIONAL) || '0';
    const b = generator.valueToCode(block, 'B', ORDER_RELATIONAL) || '0';
    log('arduino_compare_eq', 'Generating', { a, b });
    return [`(${a} == ${b})`, ORDER_RELATIONAL];
};

arduinoGenerator.forBlock['arduino_logic_and'] = function (block, generator) {
    const a = generator.valueToCode(block, 'A', ORDER_LOGICAL_AND) || 'false';
    const b = generator.valueToCode(block, 'B', ORDER_LOGICAL_AND) || 'false';
    log('arduino_logic_and', 'Generating', { a, b });
    return [`(${a} && ${b})`, ORDER_LOGICAL_AND];
};

arduinoGenerator.forBlock['arduino_logic_or'] = function (block, generator) {
    const a = generator.valueToCode(block, 'A', ORDER_LOGICAL_OR) || 'false';
    const b = generator.valueToCode(block, 'B', ORDER_LOGICAL_OR) || 'false';
    log('arduino_logic_or', 'Generating', { a, b });
    return [`(${a} || ${b})`, ORDER_LOGICAL_OR];
};

arduinoGenerator.forBlock['arduino_logic_not'] = function (block, generator) {
    const a = generator.valueToCode(block, 'A', ORDER_UNARY_PREFIX) || 'false';
    log('arduino_logic_not', 'Generating', { a });
    return [`!${a}`, ORDER_UNARY_PREFIX];
};

arduinoGenerator.forBlock['arduino_number'] = function (block) {
    const num = block.getFieldValue('NUM');
    log('arduino_number', 'Generating', { num });
    return [String(num), ORDER_ATOMIC];
};

arduinoGenerator.forBlock['arduino_text'] = function (block) {
    const text = block.getFieldValue('TEXT');
    log('arduino_text', 'Generating', { text });
    return [`"${text}"`, ORDER_ATOMIC];
};

arduinoGenerator.forBlock['arduino_mod'] = function (block, generator) {
    const a = generator.valueToCode(block, 'A', ORDER_MULTIPLICATIVE) || '0';
    const b = generator.valueToCode(block, 'B', ORDER_MULTIPLICATIVE) || '1';
    log('arduino_mod', 'Generating', { a, b });
    return [`(${a} % ${b})`, ORDER_MULTIPLICATIVE];
};

arduinoGenerator.forBlock['arduino_round'] = function (block, generator) {
    const num = generator.valueToCode(block, 'NUM', ORDER_NONE) || '0';
    log('arduino_round', 'Generating', { num });
    return [`round(${num})`, ORDER_ATOMIC];
};

arduinoGenerator.forBlock['arduino_abs'] = function (block, generator) {
    const num = generator.valueToCode(block, 'NUM', ORDER_NONE) || '0';
    log('arduino_abs', 'Generating', { num });
    return [`abs(${num})`, ORDER_ATOMIC];
};

// ═══════════════════════════════════════════════════════════════════════════
// ACTUATORS
// ═══════════════════════════════════════════════════════════════════════════
arduinoGenerator.forBlock['arduino_servo'] = function (block) {
    const pin = block.getFieldValue('PIN');
    const angle = block.getFieldValue('ANGLE');

    // Choose library based on architecture
    const libDef = '#ifdef ARDUINO_ARCH_ESP32\n#include <ESP32Servo.h>\n#else\n#include <Servo.h>\n#endif';
    (arduinoGenerator as any).addDefinition('servo_include', libDef);
    (arduinoGenerator as any).addDefinition(`servo_def_${pin}`, `Servo servo_${pin};`);
    (arduinoGenerator as any).addSetup(`servo_attach_${pin}`, `  servo_${pin}.attach(${pin});`);

    log('arduino_servo', 'Generating', { pin, angle });
    return `  servo_${pin}.write(${angle});\n`;
};

arduinoGenerator.forBlock['arduino_motor'] = function (block) {
    const motor = block.getFieldValue('MOTOR');
    const dir = block.getFieldValue('DIR');
    const speed = block.getFieldValue('SPEED');

    // Define a simple motor control if not already defined
    // This is a placeholder for actual shield logic
    const motorDef = `
class Motor {
public:
  void forward(int s) { /* implement for your shield */ }
  void backward(int s) { /* implement for your shield */ }
  void stop() { /* implement for your shield */ }
};
Motor motorA, motorB;
`;
    (arduinoGenerator as any).addDefinition('motor_class', motorDef);

    log('arduino_motor', 'Generating', { motor, dir, speed });
    if (dir === 'stop') {
        return `  motor${motor}.stop();\n`;
    }
    return `  motor${motor}.${dir}(${speed});\n`;
};

arduinoGenerator.forBlock['arduino_led'] = function (block) {
    const pin = block.getFieldValue('PIN');
    const brightness = block.getFieldValue('BRIGHTNESS');
    (arduinoGenerator as any).addSetup(`pinMode_${pin}`, `  pinMode(${pin}, OUTPUT);`);
    log('arduino_led', 'Generating', { pin, brightness });
    return `  analogWrite(${pin}, ${brightness});\n`;
};

arduinoGenerator.forBlock['arduino_relay'] = function (block) {
    const pin = block.getFieldValue('PIN');
    const state = block.getFieldValue('STATE');
    (arduinoGenerator as any).addSetup(`pinMode_${pin}`, `  pinMode(${pin}, OUTPUT);`);
    log('arduino_relay', 'Generating', { pin, state });
    return `  digitalWrite(${pin}, ${state});\n`;
};

// ═══════════════════════════════════════════════════════════════════════════
// SENSORS
// ═══════════════════════════════════════════════════════════════════════════
arduinoGenerator.forBlock['arduino_ultrasonic'] = function (block, generator) {
    const trig = block.getFieldValue('TRIG');
    const echo = block.getFieldValue('ECHO');

    const functionName = '_readUltrasonicDistance';
    const functionDef = [
        'long ' + functionName + '(int trigPin, int echoPin) {',
        '  pinMode(trigPin, OUTPUT);',
        '  pinMode(echoPin, INPUT);',
        '  digitalWrite(trigPin, LOW);',
        '  delayMicroseconds(2);',
        '  digitalWrite(trigPin, HIGH);',
        '  delayMicroseconds(10);',
        '  digitalWrite(trigPin, LOW);',
        '  noInterrupts(); // Disable interrupts to prevent Servo/Timer collision with pulseIn',
        '  long duration = pulseIn(echoPin, HIGH, 30000UL); // 30ms timeout',
        '  interrupts(); // Re-enable interrupts',
        '  if (duration == 0) {',
        '    pinMode(echoPin, OUTPUT);',
        '    digitalWrite(echoPin, LOW);',
        '    delayMicroseconds(200);',
        '    pinMode(echoPin, INPUT);',
        '    return 0; // Timeout/No pulse',
        '  }',
        '  return (duration / 2) / 29; // Integer conversion (29 microseconds per cm)',
        '}'
    ].join('\n');

    (generator as any).addDefinition('ultrasonic_distance', functionDef);

    return [`${functionName}(${trig}, ${echo})`, ORDER_ATOMIC];
};

arduinoGenerator.forBlock['arduino_dht_temp'] = function (block) {
    const type = block.getFieldValue('TYPE');
    const pin = block.getFieldValue('PIN');
    (arduinoGenerator as any).addDefinition('dht_include', '#include "DHT.h"');
    (arduinoGenerator as any).addDefinition(`dht_def_${pin}`, `DHT dht_${pin}(${pin}, DHT11);`);
    (arduinoGenerator as any).addSetup(`dht_begin_${pin}`, `  dht_${pin}.begin();`);

    log('arduino_dht_temp', 'Generating', { type, pin });
    return [`dht_${pin}.read${type === 'temperature' ? 'Temperature' : 'Humidity'}()`, ORDER_ATOMIC];
};

arduinoGenerator.forBlock['arduino_button'] = function (block) {
    const pin = block.getFieldValue('PIN');
    log('arduino_button', 'Generating', { pin });
    return [`digitalRead(${pin}) == LOW`, ORDER_RELATIONAL];
};

arduinoGenerator.forBlock['arduino_ldr'] = function (block) {
    const pin = block.getFieldValue('PIN');
    log('arduino_ldr', 'Generating', { pin });
    return [`analogRead(${pin})`, ORDER_ATOMIC];
};

arduinoGenerator.forBlock['arduino_potentiometer'] = function (block) {
    const pin = block.getFieldValue('PIN');
    log('arduino_potentiometer', 'Generating', { pin });
    return [`analogRead(${pin})`, ORDER_ATOMIC];
};

arduinoGenerator.forBlock['arduino_pir'] = function (block) {
    const pin = block.getFieldValue('PIN');
    log('arduino_pir', 'Generating', { pin });
    return [`digitalRead(${pin}) == HIGH`, ORDER_RELATIONAL];
};

console.log('[GENERATOR] All block generators registered');
