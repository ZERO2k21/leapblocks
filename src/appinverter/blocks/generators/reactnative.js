/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * React Native Code Generators for Blockly Blocks
 * Generates React Native/JavaScript code from blocks
 */
import { javascriptGenerator } from 'blockly/javascript';
import { COMPONENT_METADATA } from '../../data/componentMetadata';

// Component Event Handler (Fixed)
javascriptGenerator['component_event'] = function (block) {
    const component = block.getFieldValue('INSTANCE') || block.instanceName || block.getFieldValue('COMPONENT');
    const event = block.eventName || block.getFieldValue('EVENT');
    const typeName = block.typeName;
    const statements = javascriptGenerator.statementToCode(block, 'DO');

    // Resolve event parameters from COMPONENT_METADATA
    const componentDef = COMPONENT_METADATA[typeName];
    const eventDef = componentDef?.events.find(e => e.name === event);
    const params = eventDef && eventDef.parameters ? eventDef.parameters.map(p => p.name) : [];
    const paramsStr = params.join(', ');

    return `window.${component}_${event} = function(${paramsStr}) {\n${statements}};\n`;
};

// Component Get Property (Fixed)
javascriptGenerator['component_get_property'] = function (block) {
    const component = block.getFieldValue('INSTANCE') || block.instanceName || block.getFieldValue('COMPONENT');
    const property = block.getFieldValue('PROPERTY') || block.propertyName;

    return [`${component}.${property}`, javascriptGenerator.ORDER_MEMBER];
};

// Component Set Property (Fixed)
javascriptGenerator['component_set_property'] = function (block) {
    const component = block.getFieldValue('INSTANCE') || block.instanceName || block.getFieldValue('COMPONENT');
    const property = block.getFieldValue('PROPERTY') || block.propertyName;
    const value = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_ASSIGNMENT) || '""';

    return `${component}.${property} = ${value};\n`;
};

// Component Method Call (Fixed)
javascriptGenerator['component_method'] = function (block) {
    const component = block.getFieldValue('INSTANCE') || block.instanceName || block.getFieldValue('COMPONENT');
    const method = block.getFieldValue('METHOD') || block.methodName;
    const typeName = block.typeName;

    // Retrieve method metadata from COMPONENT_METADATA
    const componentDef = COMPONENT_METADATA[typeName];
    const methodDef = componentDef?.methods.find(m => m.name === method);
    const args = [];
    if (methodDef && methodDef.parameters) {
        methodDef.parameters.forEach(param => {
            const argVal = javascriptGenerator.valueToCode(block, 'ARG_' + param.name, javascriptGenerator.ORDER_COMMA) || 'null';
            args.push(argVal);
        });
    }

    const code = `${component}.${method}(${args.join(', ')});\n`;

    if (block.outputConnection) {
        return [`${component}.${method}(${args.join(', ')})`, javascriptGenerator.ORDER_FUNCTION_CALL];
    } else {
        return code;
    }
};

// Generic Component Event Handler (Any Component)
javascriptGenerator['any_component_event'] = function (block) {
    const event = block.eventName || block.getFieldValue('EVENT');
    const typeName = block.typeName;
    const statements = javascriptGenerator.statementToCode(block, 'DO');

    // Resolve event parameters from COMPONENT_METADATA
    const componentDef = COMPONENT_METADATA[typeName];
    const eventDef = componentDef?.events.find(e => e.name === event);
    const params = eventDef && eventDef.parameters ? eventDef.parameters.map(p => p.name) : [];
    // Generic events receive the component instance as the first parameter
    const allParams = ['component', ...params];
    const paramsStr = allParams.join(', ');

    return `window.any_${typeName}_${event} = function(${paramsStr}) {\n${statements}};\n`;
};

// Generic Component Method Call (Any Component)
javascriptGenerator['any_component_method'] = function (block) {
    const component = javascriptGenerator.valueToCode(block, 'COMPONENT', javascriptGenerator.ORDER_MEMBER) || 'null';
    const method = block.getFieldValue('METHOD') || block.methodName;
    const typeName = block.typeName;

    // Retrieve method metadata
    const componentDef = COMPONENT_METADATA[typeName];
    const methodDef = componentDef?.methods.find(m => m.name === method);
    const args = [];
    if (methodDef && methodDef.parameters) {
        methodDef.parameters.forEach(param => {
            const argVal = javascriptGenerator.valueToCode(block, 'ARG_' + param.name, javascriptGenerator.ORDER_COMMA) || 'null';
            args.push(argVal);
        });
    }

    const code = `if (${component}) { ${component}.${method}(${args.join(', ')}); }\n`;

    if (block.outputConnection) {
        return [`(${component} ? ${component}.${method}(${args.join(', ')}) : null)`, javascriptGenerator.ORDER_FUNCTION_CALL];
    } else {
        return code;
    }
};

// Generic Component Get Property (Any Component)
javascriptGenerator['any_component_get_property'] = function (block) {
    const component = javascriptGenerator.valueToCode(block, 'COMPONENT', javascriptGenerator.ORDER_MEMBER) || 'null';
    const property = block.getFieldValue('PROPERTY') || block.propertyName;

    return [`(${component} ? ${component}.${property} : null)`, javascriptGenerator.ORDER_MEMBER];
};

// Generic Component Set Property (Any Component)
javascriptGenerator['any_component_set_property'] = function (block) {
    const component = javascriptGenerator.valueToCode(block, 'COMPONENT', javascriptGenerator.ORDER_MEMBER) || 'null';
    const property = block.getFieldValue('PROPERTY') || block.propertyName;
    const value = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_ASSIGNMENT) || '""';

    return `if (${component}) { ${component}.${property} = ${value}; }\n`;
};

// Component Choice Block (Dropdown Options)
javascriptGenerator['component_choice'] = function (block) {
    const choiceValue = block.getFieldValue('CHOICE') || block.choiceValue;
    return [JSON.stringify(choiceValue), javascriptGenerator.ORDER_ATOMIC];
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

// Math Arithmetic Blocks
javascriptGenerator['math_add'] = function(block) {
    let code = [];
    for (let i = 0; i < block.itemCount_; i++) {
        let val = javascriptGenerator.valueToCode(block, 'NUM' + i, javascriptGenerator.ORDER_ADDITION) || '0';
        code.push(val);
    }
    return [code.join(' + '), javascriptGenerator.ORDER_ADDITION];
};

javascriptGenerator['math_subtract'] = function(block) {
    const a = javascriptGenerator.valueToCode(block, 'A', javascriptGenerator.ORDER_SUBTRACTION) || '0';
    const b = javascriptGenerator.valueToCode(block, 'B', javascriptGenerator.ORDER_SUBTRACTION) || '0';
    return [`${a} - ${b}`, javascriptGenerator.ORDER_SUBTRACTION];
};

javascriptGenerator['math_multiply'] = function(block) {
    let code = [];
    for (let i = 0; i < block.itemCount_; i++) {
        let val = javascriptGenerator.valueToCode(block, 'NUM' + i, javascriptGenerator.ORDER_MULTIPLICATION) || '1';
        code.push(val);
    }
    return [code.join(' * '), javascriptGenerator.ORDER_MULTIPLICATION];
};

javascriptGenerator['math_divide_regular'] = function(block) {
    const a = javascriptGenerator.valueToCode(block, 'A', javascriptGenerator.ORDER_DIVISION) || '0';
    const b = javascriptGenerator.valueToCode(block, 'B', javascriptGenerator.ORDER_DIVISION) || '1';
    return [`${a} / ${b}`, javascriptGenerator.ORDER_DIVISION];
};

javascriptGenerator['math_power'] = function(block) {
    const a = javascriptGenerator.valueToCode(block, 'A', javascriptGenerator.ORDER_COMMA) || '0';
    const b = javascriptGenerator.valueToCode(block, 'B', javascriptGenerator.ORDER_COMMA) || '1';
    return [`Math.pow(${a}, ${b})`, javascriptGenerator.ORDER_FUNCTION_CALL];
};

// Matrices Arithmetic Blocks
javascriptGenerator['matrices_add'] = function(block) {
    let code = [];
    for (let i = 0; i < block.itemCount_; i++) {
        let val = javascriptGenerator.valueToCode(block, 'NUM' + i, javascriptGenerator.ORDER_ADDITION) || 'null';
        code.push(val);
    }
    return [`matrixAdd(${code.join(', ')})`, javascriptGenerator.ORDER_FUNCTION_CALL];
};

javascriptGenerator['matrices_subtract'] = function(block) {
    const a = javascriptGenerator.valueToCode(block, 'A', javascriptGenerator.ORDER_COMMA) || 'null';
    const b = javascriptGenerator.valueToCode(block, 'B', javascriptGenerator.ORDER_COMMA) || 'null';
    return [`matrixSubtract(${a}, ${b})`, javascriptGenerator.ORDER_FUNCTION_CALL];
};

javascriptGenerator['matrices_multiply'] = function(block) {
    let code = [];
    for (let i = 0; i < block.itemCount_; i++) {
        let val = javascriptGenerator.valueToCode(block, 'NUM' + i, javascriptGenerator.ORDER_COMMA) || 'null';
        code.push(val);
    }
    return [`matrixMultiply(${code.join(', ')})`, javascriptGenerator.ORDER_FUNCTION_CALL];
};

javascriptGenerator['matrices_power'] = function(block) {
    const a = javascriptGenerator.valueToCode(block, 'A', javascriptGenerator.ORDER_COMMA) || 'null';
    const b = javascriptGenerator.valueToCode(block, 'B', javascriptGenerator.ORDER_COMMA) || 'null';
    return [`matrixPower(${a}, ${b})`, javascriptGenerator.ORDER_FUNCTION_CALL];
};

javascriptGenerator['matrices_operation'] = function(block) {
    const op = block.getFieldValue('OP');
    const matrix = javascriptGenerator.valueToCode(block, 'MATRIX', javascriptGenerator.ORDER_COMMA) || 'null';
    let functionName = 'matrixInverse';
    if (op === 'TRANSPOSE') functionName = 'matrixTranspose';
    else if (op === 'ROTATE_LEFT') functionName = 'matrixRotateLeft';
    else if (op === 'ROTATE_RIGHT') functionName = 'matrixRotateRight';
    return [`${functionName}(${matrix})`, javascriptGenerator.ORDER_FUNCTION_CALL];
};

javascriptGenerator['matrices_is_matrix'] = function(block) {
    const matrix = javascriptGenerator.valueToCode(block, 'MATRIX', javascriptGenerator.ORDER_COMMA) || 'null';
    return [`isMatrix(${matrix})`, javascriptGenerator.ORDER_FUNCTION_CALL];
};

export default javascriptGenerator;
