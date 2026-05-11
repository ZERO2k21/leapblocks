/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * React Native Code Generators for Blockly Blocks
 * Generates React Native/JavaScript code from blocks
 */
import { javascriptGenerator } from 'blockly/javascript';

// This file provides code generators for custom blocks
// The generators convert Blockly blocks to React Native JavaScript code

// Component Event Handler
javascriptGenerator['component_event'] = function (block) {
    const component = block.getFieldValue('COMPONENT');
    const event = block.getFieldValue('EVENT');
    const statements = javascriptGenerator.statementToCode(block, 'DO');

    return `// ${component}.${event} event handler\n${statements}\n`;
};

// Component Get Property
javascriptGenerator['component_get_property'] = function (block) {
    const component = block.getFieldValue('COMPONENT');
    const property = block.getFieldValue('PROPERTY');

    return [`${component}.${property}`, javascriptGenerator.ORDER_MEMBER];
};

// Component Set Property
javascriptGenerator['component_set_property'] = function (block) {
    const component = block.getFieldValue('COMPONENT');
    const property = block.getFieldValue('PROPERTY');
    const value = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_ASSIGNMENT) || '""';

    return `${component}.${property} = ${value};\n`;
};

// Component Method Call
javascriptGenerator['component_method'] = function (block) {
    const component = block.getFieldValue('COMPONENT');
    const method = block.getFieldValue('METHOD');

    return `${component}.${method}();\n`;
};

// Navigate Screen
javascriptGenerator['navigate_screen'] = function (block) {
    const screen = block.getFieldValue('SCREEN');

    return `navigation.navigate('${screen}');\n`;
};

// Close Screen
javascriptGenerator['close_screen'] = function (block) {
    return `navigation.goBack();\n`;
};

// Show Notifier
javascriptGenerator['notifier_show'] = function (block) {
    const message = javascriptGenerator.valueToCode(block, 'MESSAGE', javascriptGenerator.ORDER_NONE) || '""';

    return `Alert.alert(${message});\n`;
};

// Play Sound
javascriptGenerator['sound_play'] = function (block) {
    const sound = block.getFieldValue('SOUND');

    return `${sound}.play();\n`;
};

// Device Vibrate
javascriptGenerator['device_vibrate'] = function (block) {
    const duration = javascriptGenerator.valueToCode(block, 'DURATION', javascriptGenerator.ORDER_NONE) || '100';

    return `Vibration.vibrate(${duration});\n`;
};

// Control Blocks
javascriptGenerator['controls_if'] = function (block) {
    const condition = javascriptGenerator.valueToCode(block, 'IF0', javascriptGenerator.ORDER_NONE) || 'false';
    const statements = javascriptGenerator.statementToCode(block, 'DO0');

    return `if (${condition}) {\n${statements}}\n`;
};

javascriptGenerator['controls_if_else'] = function (block) {
    const condition = javascriptGenerator.valueToCode(block, 'IF0', javascriptGenerator.ORDER_NONE) || 'false';
    const thenStatements = javascriptGenerator.statementToCode(block, 'DO0');
    const elseStatements = javascriptGenerator.statementToCode(block, 'ELSE');

    return `if (${condition}) {\n${thenStatements}} else {\n${elseStatements}}\n`;
};

javascriptGenerator['controls_forEach'] = function (block) {
    const variable = javascriptGenerator.nameDB_.getName(block.getFieldValue('VAR'), 'VARIABLE');
    const list = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_NONE) || '[]';
    const statements = javascriptGenerator.statementToCode(block, 'DO');

    return `for (const ${variable} of ${list}) {\n${statements}}\n`;
};

javascriptGenerator['controls_forRange'] = function (block) {
    const variable = javascriptGenerator.nameDB_.getName(block.getFieldValue('VAR'), 'VARIABLE');
    const start = javascriptGenerator.valueToCode(block, 'START', javascriptGenerator.ORDER_NONE) || '1';
    const end = javascriptGenerator.valueToCode(block, 'END', javascriptGenerator.ORDER_NONE) || '10';
    const step = javascriptGenerator.valueToCode(block, 'STEP', javascriptGenerator.ORDER_NONE) || '1';
    const statements = javascriptGenerator.statementToCode(block, 'DO');

    return `for (let ${variable} = ${start}; ${variable} <= ${end}; ${variable} += ${step}) {\n${statements}}\n`;
};

javascriptGenerator['controls_while'] = function (block) {
    const condition = javascriptGenerator.valueToCode(block, 'TEST', javascriptGenerator.ORDER_NONE) || 'false';
    const statements = javascriptGenerator.statementToCode(block, 'DO');

    return `while (${condition}) {\n${statements}}\n`;
};

javascriptGenerator['controls_choose'] = function (block) {
    const condition = javascriptGenerator.valueToCode(block, 'TEST', javascriptGenerator.ORDER_CONDITIONAL) || 'false';
    const thenValue = javascriptGenerator.valueToCode(block, 'THENRETURN', javascriptGenerator.ORDER_CONDITIONAL) || 'null';
    const elseValue = javascriptGenerator.valueToCode(block, 'ELSERETURN', javascriptGenerator.ORDER_CONDITIONAL) || 'null';

    return [`(${condition} ? ${thenValue} : ${elseValue})`, javascriptGenerator.ORDER_CONDITIONAL];
};

javascriptGenerator['controls_do_then_return'] = function (block) {
    const statements = javascriptGenerator.statementToCode(block, 'STM');
    const value = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_NONE) || 'null';

    return [`(() => {\n${statements}  return ${value};\n})()`, javascriptGenerator.ORDER_FUNCTION_CALL];
};

javascriptGenerator['controls_eval_but_ignore'] = function (block) {
    const value = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_NONE) || 'null';

    return `${value};\n`;
};

javascriptGenerator['controls_openAnotherScreen'] = function (block) {
    const screen = javascriptGenerator.valueToCode(block, 'SCREEN', javascriptGenerator.ORDER_NONE) || '""';

    return `navigation.navigate(${screen});\n`;
};

javascriptGenerator['controls_closeScreen'] = function (block) {
    return `navigation.goBack();\n`;
};

javascriptGenerator['controls_break'] = function (block) {
    return `break;\n`;
};

export default javascriptGenerator;
