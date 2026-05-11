/**
 * React Native Code Generators for App Inventor Blocks
 * Converts Blockly blocks to React Native JavaScript code
 */
import * as Blockly from 'blockly';
import { javascriptGenerator, Order } from 'blockly/javascript';

// ============================================================================
// COMPONENT BLOCKS
// ============================================================================

// Set Component Property
javascriptGenerator.forBlock['component_set_property'] = function (block) {
    const component = block.getFieldValue('COMPONENT');
    const property = block.getFieldValue('PROPERTY');
    const value = javascriptGenerator.valueToCode(block, 'VALUE', Order.ASSIGNMENT) || '""';

    return `set${component}${property}(${value});\n`;
};

// Get Component Property
javascriptGenerator.forBlock['component_get_property'] = function (block) {
    const component = block.getFieldValue('COMPONENT');
    const property = block.getFieldValue('PROPERTY');

    return [`${component.toLowerCase()}${property}`, Order.ATOMIC];
};

// Call Component Method
javascriptGenerator.forBlock['component_method'] = function (block) {
    const component = block.getFieldValue('COMPONENT');
    const method = block.getFieldValue('METHOD');

    return `${component.toLowerCase()}${method}();\n`;
};

// Navigate to Screen
javascriptGenerator.forBlock['navigate_screen'] = function (block) {
    const screen = block.getFieldValue('SCREEN');

    return `navigation.navigate('${screen}');\n`;
};

// Close Screen
javascriptGenerator.forBlock['close_screen'] = function (block) {
    return `navigation.goBack();\n`;
};

// Show Notifier
javascriptGenerator.forBlock['notifier_show'] = function (block) {
    const message = javascriptGenerator.valueToCode(block, 'MESSAGE', Order.NONE) || '""';

    return `Alert.alert('Alert', ${message});\n`;
};

// Play Sound
javascriptGenerator.forBlock['sound_play'] = function (block) {
    const sound = block.getFieldValue('SOUND');

    return `${sound.toLowerCase()}Play();\n`;
};

// Vibrate
javascriptGenerator.forBlock['device_vibrate'] = function (block) {
    const duration = javascriptGenerator.valueToCode(block, 'DURATION', Order.NONE) || '100';

    return `Vibration.vibrate(${duration});\n`;
};

// ============================================================================
// CONTROL BLOCKS
// ============================================================================

// Component Event
javascriptGenerator.forBlock['component_event'] = function (block) {
    const component = block.getFieldValue('COMPONENT');
    const event = block.getFieldValue('EVENT');
    const statements = javascriptGenerator.statementToCode(block, 'DO');

    return `handlers.${component}_${event} = () => {\n${statements}};\n`;
};

// If Block
javascriptGenerator.forBlock['controls_if'] = function (block) {
    let code = '';
    const condition = javascriptGenerator.valueToCode(block, 'IF0', Order.NONE) || 'false';
    const branch = javascriptGenerator.statementToCode(block, 'DO0');

    code += `if (${condition}) {\n${branch}}\n`;

    return code;
};

// For Loop
javascriptGenerator.forBlock['controls_for'] = function (block) {
    const variable = javascriptGenerator.nameDB_.getName(
        block.getFieldValue('VAR'), 'VARIABLE');
    const from = javascriptGenerator.valueToCode(block, 'FROM', Order.ASSIGNMENT) || '0';
    const to = javascriptGenerator.valueToCode(block, 'TO', Order.ASSIGNMENT) || '0';
    const by = javascriptGenerator.valueToCode(block, 'BY', Order.ASSIGNMENT) || '1';
    const branch = javascriptGenerator.statementToCode(block, 'DO');

    return `for (let ${variable} = ${from}; ${variable} <= ${to}; ${variable} += ${by}) {\n${branch}}\n`;
};

// While/Until Loop
javascriptGenerator.forBlock['controls_whileUntil'] = function (block) {
    const mode = block.getFieldValue('MODE');
    const condition = javascriptGenerator.valueToCode(block, 'BOOL', Order.NONE) || 'false';
    const branch = javascriptGenerator.statementToCode(block, 'DO');

    if (mode === 'UNTIL') {
        return `while (!(${condition})) {\n${branch}}\n`;
    } else {
        return `while (${condition}) {\n${branch}}\n`;
    }
};

// Wait Block
javascriptGenerator.forBlock['controls_wait'] = function (block) {
    const duration = javascriptGenerator.valueToCode(block, 'DURATION', Order.NONE) || '1000';

    return `await new Promise(resolve => setTimeout(resolve, ${duration}));\n`;
};

// Break Block
javascriptGenerator.forBlock['controls_break'] = function (block) {
    return 'break;\n';
};

// ============================================================================
// LOGIC BLOCKS
// ============================================================================

// Comparison
javascriptGenerator.forBlock['logic_compare'] = function (block) {
    const operators = {
        'EQ': '==',
        'NEQ': '!=',
        'LT': '<',
        'LTE': '<=',
        'GT': '>',
        'GTE': '>='
    };
    const operator = operators[block.getFieldValue('OP')];
    const order = (operator === '==' || operator === '!=') ? Order.EQUALITY : Order.RELATIONAL;
    const argument0 = javascriptGenerator.valueToCode(block, 'A', order) || '0';
    const argument1 = javascriptGenerator.valueToCode(block, 'B', order) || '0';

    return [`${argument0} ${operator} ${argument1}`, order];
};

// Boolean Operation (and/or)
javascriptGenerator.forBlock['logic_operation'] = function (block) {
    const operator = (block.getFieldValue('OP') === 'AND') ? '&&' : '||';
    const order = (operator === '&&') ? Order.LOGICAL_AND : Order.LOGICAL_OR;
    const argument0 = javascriptGenerator.valueToCode(block, 'A', order) || 'false';
    const argument1 = javascriptGenerator.valueToCode(block, 'B', order) || 'false';

    return [`${argument0} ${operator} ${argument1}`, order];
};

// Not
javascriptGenerator.forBlock['logic_negate'] = function (block) {
    const argument = javascriptGenerator.valueToCode(block, 'BOOL', Order.LOGICAL_NOT) || 'false';

    return [`!${argument}`, Order.LOGICAL_NOT];
};

// Boolean Value
javascriptGenerator.forBlock['logic_boolean'] = function (block) {
    const code = (block.getFieldValue('BOOL') === 'TRUE') ? 'true' : 'false';

    return [code, Order.ATOMIC];
};

// Null
javascriptGenerator.forBlock['logic_null'] = function (block) {
    return ['null', Order.ATOMIC];
};

// Ternary
javascriptGenerator.forBlock['logic_ternary'] = function (block) {
    const condition = javascriptGenerator.valueToCode(block, 'IF', Order.CONDITIONAL) || 'false';
    const trueValue = javascriptGenerator.valueToCode(block, 'THEN', Order.CONDITIONAL) || 'null';
    const falseValue = javascriptGenerator.valueToCode(block, 'ELSE', Order.CONDITIONAL) || 'null';

    return [`${condition} ? ${trueValue} : ${falseValue}`, Order.CONDITIONAL];
};

// ============================================================================
// MATH BLOCKS
// ============================================================================

// Number
javascriptGenerator.forBlock['math_number'] = function (block) {
    const code = Number(block.getFieldValue('NUM'));

    return [code, Order.ATOMIC];
};

// Arithmetic
javascriptGenerator.forBlock['math_arithmetic'] = function (block) {
    const operators = {
        'ADD': ['+', Order.ADDITION],
        'MINUS': ['-', Order.SUBTRACTION],
        'MULTIPLY': ['*', Order.MULTIPLICATION],
        'DIVIDE': ['/', Order.DIVISION],
        'POWER': ['**', Order.EXPONENTIATION]
    };
    const tuple = operators[block.getFieldValue('OP')];
    const operator = tuple[0];
    const order = tuple[1];
    const argument0 = javascriptGenerator.valueToCode(block, 'A', order) || '0';
    const argument1 = javascriptGenerator.valueToCode(block, 'B', order) || '0';

    return [`${argument0} ${operator} ${argument1}`, order];
};

// Single Math Function
javascriptGenerator.forBlock['math_single'] = function (block) {
    const operators = {
        'ROOT': 'Math.sqrt',
        'ABS': 'Math.abs',
        'NEG': '-',
        'LN': 'Math.log',
        'LOG10': 'Math.log10',
        'EXP': 'Math.exp',
        'POW10': function (x) { return `Math.pow(10, ${x})`; }
    };
    const operator = block.getFieldValue('OP');
    const argument = javascriptGenerator.valueToCode(block, 'NUM', Order.NONE) || '0';

    let code;
    if (operator === 'NEG') {
        code = `-${argument}`;
    } else if (operator === 'POW10') {
        code = `Math.pow(10, ${argument})`;
    } else {
        code = `${operators[operator]}(${argument})`;
    }

    return [code, Order.FUNCTION_CALL];
};

// Trig Functions
javascriptGenerator.forBlock['math_trig'] = function (block) {
    const operators = {
        'SIN': 'Math.sin',
        'COS': 'Math.cos',
        'TAN': 'Math.tan',
        'ASIN': 'Math.asin',
        'ACOS': 'Math.acos',
        'ATAN': 'Math.atan'
    };
    const operator = operators[block.getFieldValue('OP')];
    const argument = javascriptGenerator.valueToCode(block, 'NUM', Order.NONE) || '0';

    return [`${operator}(${argument})`, Order.FUNCTION_CALL];
};

// Random Integer
javascriptGenerator.forBlock['math_random_int'] = function (block) {
    const from = javascriptGenerator.valueToCode(block, 'FROM', Order.NONE) || '0';
    const to = javascriptGenerator.valueToCode(block, 'TO', Order.NONE) || '0';

    return [`Math.floor(Math.random() * (${to} - ${from} + 1)) + ${from}`, Order.FUNCTION_CALL];
};

// Random Fraction
javascriptGenerator.forBlock['math_random_float'] = function (block) {
    return ['Math.random()', Order.FUNCTION_CALL];
};

// Modulo
javascriptGenerator.forBlock['math_modulo'] = function (block) {
    const dividend = javascriptGenerator.valueToCode(block, 'DIVIDEND', Order.MODULUS) || '0';
    const divisor = javascriptGenerator.valueToCode(block, 'DIVISOR', Order.MODULUS) || '0';

    return [`${dividend} % ${divisor}`, Order.MODULUS];
};

// Round
javascriptGenerator.forBlock['math_round'] = function (block) {
    const operators = {
        'ROUND': 'Math.round',
        'ROUNDUP': 'Math.ceil',
        'ROUNDDOWN': 'Math.floor'
    };
    const operator = operators[block.getFieldValue('OP')];
    const argument = javascriptGenerator.valueToCode(block, 'NUM', Order.NONE) || '0';

    return [`${operator}(${argument})`, Order.FUNCTION_CALL];
};

// ============================================================================
// TEXT BLOCKS
// ============================================================================

// Text Value
javascriptGenerator.forBlock['text'] = function (block) {
    const code = javascriptGenerator.quote_(block.getFieldValue('TEXT'));

    return [code, Order.ATOMIC];
};

// Join Text
javascriptGenerator.forBlock['text_join'] = function (block) {
    const elements = [];
    for (let i = 0; i < 2; i++) {
        elements.push(javascriptGenerator.valueToCode(block, 'ADD' + i, Order.NONE) || '""');
    }

    return [elements.join(' + '), Order.ADDITION];
};

// Text Length
javascriptGenerator.forBlock['text_length'] = function (block) {
    const text = javascriptGenerator.valueToCode(block, 'VALUE', Order.MEMBER) || '""';

    return [`${text}.length`, Order.MEMBER];
};

// Is Empty
javascriptGenerator.forBlock['text_isEmpty'] = function (block) {
    const text = javascriptGenerator.valueToCode(block, 'VALUE', Order.MEMBER) || '""';

    return [`${text}.length === 0`, Order.EQUALITY];
};

// Contains
javascriptGenerator.forBlock['text_contains'] = function (block) {
    const text = javascriptGenerator.valueToCode(block, 'TEXT', Order.MEMBER) || '""';
    const find = javascriptGenerator.valueToCode(block, 'FIND', Order.NONE) || '""';

    return [`${text}.includes(${find})`, Order.FUNCTION_CALL];
};

// Change Case
javascriptGenerator.forBlock['text_changeCase'] = function (block) {
    const text = javascriptGenerator.valueToCode(block, 'TEXT', Order.MEMBER) || '""';
    const caseType = block.getFieldValue('CASE');

    let code;
    if (caseType === 'UPPERCASE') {
        code = `${text}.toUpperCase()`;
    } else if (caseType === 'LOWERCASE') {
        code = `${text}.toLowerCase()`;
    } else { // TITLECASE
        code = `${text}.replace(/\\w\\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())`;
    }

    return [code, Order.FUNCTION_CALL];
};

// Trim
javascriptGenerator.forBlock['text_trim'] = function (block) {
    const text = javascriptGenerator.valueToCode(block, 'TEXT', Order.MEMBER) || '""';
    const mode = block.getFieldValue('MODE');

    let code;
    if (mode === 'LEFT') {
        code = `${text}.trimStart()`;
    } else if (mode === 'RIGHT') {
        code = `${text}.trimEnd()`;
    } else { // BOTH
        code = `${text}.trim()`;
    }

    return [code, Order.FUNCTION_CALL];
};

export default javascriptGenerator;
