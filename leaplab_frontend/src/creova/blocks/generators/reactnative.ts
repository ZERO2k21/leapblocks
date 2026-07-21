import { javascriptGenerator } from 'blockly/javascript';
import { COMPONENT_METADATA } from '../../data/componentMetadata';

function registerGenerator(type: string, fn: (block: any) => string | [string, number]) {
    (javascriptGenerator as any)[type] = fn;
    if ((javascriptGenerator as any).forBlock) {
        (javascriptGenerator as any).forBlock[type] = fn;
    }
}

registerGenerator('component_event', function (block) {
    const component = block.getFieldValue('INSTANCE') || block.instanceName || block.getFieldValue('COMPONENT');
    const event = block.eventName || block.getFieldValue('EVENT');
    const typeName = block.typeName;
    const statements = javascriptGenerator.statementToCode(block, 'DO');

    const componentDef = (COMPONENT_METADATA as any)[typeName];
    const eventDef = componentDef?.events.find((e: any) => e.name === event);
    const params = eventDef && eventDef.parameters ? eventDef.parameters.map((p: any) => p.name) : [];
    const paramsStr = params.join(', ');

    return `window.${component}_${event} = function(${paramsStr}) {\n${statements}};\n`;
});

registerGenerator('component_get_property', function (block) {
    const component = block.getFieldValue('INSTANCE') || block.instanceName || block.getFieldValue('COMPONENT');
    const property = block.getFieldValue('PROPERTY') || block.propertyName;

    return [`${component}.${property}`, javascriptGenerator.ORDER_MEMBER];
});

registerGenerator('component_set_property', function (block) {
    const component = block.getFieldValue('INSTANCE') || block.instanceName || block.getFieldValue('COMPONENT');
    const property = block.getFieldValue('PROPERTY') || block.propertyName;
    const value = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_ASSIGNMENT) || '""';

    return `${component}.${property} = ${value};\n`;
});

registerGenerator('component_method', function (block) {
    const component = block.getFieldValue('INSTANCE') || block.instanceName || block.getFieldValue('COMPONENT');
    const method = block.getFieldValue('METHOD') || block.methodName;
    const typeName = block.typeName;

    const componentDef = (COMPONENT_METADATA as any)[typeName];
    const methodDef = componentDef?.methods.find((m: any) => m.name === method);
    const args: string[] = [];
    if (methodDef && methodDef.parameters) {
        methodDef.parameters.forEach((param: any) => {
            const argVal = javascriptGenerator.valueToCode(block, 'ARG_' + param.name, javascriptGenerator.ORDER_COMMA) || 'null';
            args.push(argVal);
        });
    }

    if (block.outputConnection) {
        return [`${component}.${method}(${args.join(', ')})`, javascriptGenerator.ORDER_FUNCTION_CALL];
    } else {
        return `${component}.${method}(${args.join(', ')});\n`;
    }
});

registerGenerator('any_component_event', function (block) {
    const event = block.eventName || block.getFieldValue('EVENT');
    const typeName = block.typeName;
    const statements = javascriptGenerator.statementToCode(block, 'DO');

    const componentDef = (COMPONENT_METADATA as any)[typeName];
    const eventDef = componentDef?.events.find((e: any) => e.name === event);
    const params = eventDef && eventDef.parameters ? eventDef.parameters.map((p: any) => p.name) : [];
    const allParams = ['component', ...params];
    const paramsStr = allParams.join(', ');

    return `window.any_${typeName}_${event} = function(${paramsStr}) {\n${statements}};\n`;
});

registerGenerator('any_component_method', function (block) {
    const component = javascriptGenerator.valueToCode(block, 'COMPONENT', javascriptGenerator.ORDER_MEMBER) || 'null';
    const method = block.getFieldValue('METHOD') || block.methodName;
    const typeName = block.typeName;

    const componentDef = (COMPONENT_METADATA as any)[typeName];
    const methodDef = componentDef?.methods.find((m: any) => m.name === method);
    const args: string[] = [];
    if (methodDef && methodDef.parameters) {
        methodDef.parameters.forEach((param: any) => {
            const argVal = javascriptGenerator.valueToCode(block, 'ARG_' + param.name, javascriptGenerator.ORDER_COMMA) || 'null';
            args.push(argVal);
        });
    }

    if (block.outputConnection) {
        return [`(${component} ? ${component}.${method}(${args.join(', ')}) : null)`, javascriptGenerator.ORDER_FUNCTION_CALL];
    } else {
        return `if (${component}) { ${component}.${method}(${args.join(', ')}); }\n`;
    }
});

registerGenerator('any_component_get_property', function (block) {
    const component = javascriptGenerator.valueToCode(block, 'COMPONENT', javascriptGenerator.ORDER_MEMBER) || 'null';
    const property = block.getFieldValue('PROPERTY') || block.propertyName;

    return [`(${component} ? ${component}.${property} : null)`, javascriptGenerator.ORDER_MEMBER];
});

registerGenerator('any_component_set_property', function (block) {
    const component = javascriptGenerator.valueToCode(block, 'COMPONENT', javascriptGenerator.ORDER_MEMBER) || 'null';
    const property = block.getFieldValue('PROPERTY') || block.propertyName;
    const value = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_ASSIGNMENT) || '""';

    return `if (${component}) { ${component}.${property} = ${value}; }\n`;
});

registerGenerator('component_choice', function (block) {
    const choiceValue = block.getFieldValue('CHOICE') || block.choiceValue;
    return [JSON.stringify(choiceValue), javascriptGenerator.ORDER_ATOMIC];
});

registerGenerator('navigate_screen', function (block) {
    const screen = block.getFieldValue('SCREEN');
    return `navigation.navigate('${screen}');\n`;
});

registerGenerator('close_screen', function () {
    return `navigation.goBack();\n`;
});

registerGenerator('notifier_show', function (block) {
    const message = javascriptGenerator.valueToCode(block, 'MESSAGE', javascriptGenerator.ORDER_NONE) || '""';
    return `Alert.alert(${message});\n`;
});

registerGenerator('sound_play', function (block) {
    const sound = block.getFieldValue('SOUND');
    return `${sound}.play();\n`;
});

registerGenerator('device_vibrate', function (block) {
    const duration = javascriptGenerator.valueToCode(block, 'DURATION', javascriptGenerator.ORDER_NONE) || '100';
    return `Vibration.vibrate(${duration});\n`;
});

registerGenerator('controls_if', function (block) {
    let n = 0;
    let code = '';
    let branchCode: string, conditionCode: string;
    do {
        conditionCode = javascriptGenerator.valueToCode(block, 'IF' + n, javascriptGenerator.ORDER_NONE) || 'false';
        branchCode = javascriptGenerator.statementToCode(block, 'DO' + n);
        code += (n > 0 ? ' else ' : '') + `if (${conditionCode}) {\n${branchCode}}`;
        n++;
    } while (block.getInput('IF' + n));

    if (block.getInput('ELSE') || block.elseCount_) {
        branchCode = javascriptGenerator.statementToCode(block, 'ELSE');
        code += ` else {\n${branchCode}}`;
    }
    return code + '\n';
});

registerGenerator('controls_forEach', function (block) {
    const variable = (javascriptGenerator as any).nameDB_.getName(block.getFieldValue('VAR'), 'VARIABLE');
    const list = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_NONE) || '[]';
    const statements = javascriptGenerator.statementToCode(block, 'DO');
    return `for (const ${variable} of ${list}) {\n${statements}}\n`;
});

registerGenerator('controls_forRange', function (block) {
    const variable = (javascriptGenerator as any).nameDB_.getName(block.getFieldValue('VAR'), 'VARIABLE');
    const start = javascriptGenerator.valueToCode(block, 'START', javascriptGenerator.ORDER_NONE) || '1';
    const end = javascriptGenerator.valueToCode(block, 'END', javascriptGenerator.ORDER_NONE) || '10';
    const step = javascriptGenerator.valueToCode(block, 'STEP', javascriptGenerator.ORDER_NONE) || '1';
    const statements = javascriptGenerator.statementToCode(block, 'DO');
    return `for (let ${variable} = ${start}; ${variable} <= ${end}; ${variable} += ${step}) {\n${statements}}\n`;
});

registerGenerator('controls_while', function (block) {
    const condition = javascriptGenerator.valueToCode(block, 'TEST', javascriptGenerator.ORDER_NONE) || 'false';
    const statements = javascriptGenerator.statementToCode(block, 'DO');
    return `while (${condition}) {\n${statements}}\n`;
});

registerGenerator('controls_choose', function (block) {
    const condition = javascriptGenerator.valueToCode(block, 'TEST', javascriptGenerator.ORDER_CONDITIONAL) || 'false';
    const thenValue = javascriptGenerator.valueToCode(block, 'THENRETURN', javascriptGenerator.ORDER_CONDITIONAL) || 'null';
    const elseValue = javascriptGenerator.valueToCode(block, 'ELSERETURN', javascriptGenerator.ORDER_CONDITIONAL) || 'null';
    return [`(${condition} ? ${thenValue} : ${elseValue})`, javascriptGenerator.ORDER_CONDITIONAL];
});

registerGenerator('controls_do_then_return', function (block) {
    const statements = javascriptGenerator.statementToCode(block, 'STM');
    const value = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_NONE) || 'null';
    return [`(() => {\n${statements}  return ${value};\n})()`, javascriptGenerator.ORDER_FUNCTION_CALL];
});

registerGenerator('controls_eval_but_ignore', function (block) {
    const value = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_NONE) || 'null';
    return `${value};\n`;
});

registerGenerator('controls_openAnotherScreen', function (block) {
    const screen = javascriptGenerator.valueToCode(block, 'SCREEN', javascriptGenerator.ORDER_NONE) || '""';
    return `navigation.navigate(${screen});\n`;
});

registerGenerator('controls_closeScreen', function () {
    return `navigation.goBack();\n`;
});

registerGenerator('controls_break', function () {
    return `break;\n`;
});

(javascriptGenerator as any)['math_add'] = function (block: any) {
    const code: string[] = [];
    for (let i = 0; i < block.itemCount_; i++) {
        const val = javascriptGenerator.valueToCode(block, 'NUM' + i, javascriptGenerator.ORDER_ADDITION) || '0';
        code.push(`Number(${val})`);
    }
    return [code.join(' + '), javascriptGenerator.ORDER_ADDITION];
};

(javascriptGenerator as any)['math_subtract'] = function (block: any) {
    const a = javascriptGenerator.valueToCode(block, 'A', javascriptGenerator.ORDER_SUBTRACTION) || '0';
    const b = javascriptGenerator.valueToCode(block, 'B', javascriptGenerator.ORDER_SUBTRACTION) || '0';
    return [`${a} - ${b}`, javascriptGenerator.ORDER_SUBTRACTION];
};

(javascriptGenerator as any)['math_multiply'] = function (block: any) {
    const code: string[] = [];
    for (let i = 0; i < block.itemCount_; i++) {
        const val = javascriptGenerator.valueToCode(block, 'NUM' + i, javascriptGenerator.ORDER_MULTIPLICATION) || '1';
        code.push(val);
    }
    return [code.join(' * '), javascriptGenerator.ORDER_MULTIPLICATION];
};

(javascriptGenerator as any)['math_divide_regular'] = function (block: any) {
    const a = javascriptGenerator.valueToCode(block, 'A', javascriptGenerator.ORDER_DIVISION) || '0';
    const b = javascriptGenerator.valueToCode(block, 'B', javascriptGenerator.ORDER_DIVISION) || '1';
    return [`${a} / ${b}`, javascriptGenerator.ORDER_DIVISION];
};

(javascriptGenerator as any)['math_power'] = function (block: any) {
    const a = javascriptGenerator.valueToCode(block, 'A', javascriptGenerator.ORDER_COMMA) || '0';
    const b = javascriptGenerator.valueToCode(block, 'B', javascriptGenerator.ORDER_COMMA) || '1';
    return [`Math.pow(${a}, ${b})`, javascriptGenerator.ORDER_FUNCTION_CALL];
};

(javascriptGenerator as any)['matrices_add'] = function (block: any) {
    const code: string[] = [];
    for (let i = 0; i < block.itemCount_; i++) {
        const val = javascriptGenerator.valueToCode(block, 'NUM' + i, javascriptGenerator.ORDER_ADDITION) || 'null';
        code.push(val);
    }
    return [`matrixAdd(${code.join(', ')})`, javascriptGenerator.ORDER_FUNCTION_CALL];
};

(javascriptGenerator as any)['matrices_subtract'] = function (block: any) {
    const a = javascriptGenerator.valueToCode(block, 'A', javascriptGenerator.ORDER_COMMA) || 'null';
    const b = javascriptGenerator.valueToCode(block, 'B', javascriptGenerator.ORDER_COMMA) || 'null';
    return [`matrixSubtract(${a}, ${b})`, javascriptGenerator.ORDER_FUNCTION_CALL];
};

(javascriptGenerator as any)['matrices_multiply'] = function (block: any) {
    const code: string[] = [];
    for (let i = 0; i < block.itemCount_; i++) {
        const val = javascriptGenerator.valueToCode(block, 'NUM' + i, javascriptGenerator.ORDER_COMMA) || 'null';
        code.push(val);
    }
    return [`matrixMultiply(${code.join(', ')})`, javascriptGenerator.ORDER_FUNCTION_CALL];
};

(javascriptGenerator as any)['matrices_power'] = function (block: any) {
    const a = javascriptGenerator.valueToCode(block, 'A', javascriptGenerator.ORDER_COMMA) || 'null';
    const b = javascriptGenerator.valueToCode(block, 'B', javascriptGenerator.ORDER_COMMA) || 'null';
    return [`matrixPower(${a}, ${b})`, javascriptGenerator.ORDER_FUNCTION_CALL];
};

(javascriptGenerator as any)['matrices_operation'] = function (block: any) {
    const op = block.getFieldValue('OP');
    const matrix = javascriptGenerator.valueToCode(block, 'MATRIX', javascriptGenerator.ORDER_COMMA) || 'null';
    let functionName = 'matrixInverse';
    if (op === 'TRANSPOSE') functionName = 'matrixTranspose';
    else if (op === 'ROTATE_LEFT') functionName = 'matrixRotateLeft';
    else if (op === 'ROTATE_RIGHT') functionName = 'matrixRotateRight';
    return [`${functionName}(${matrix})`, javascriptGenerator.ORDER_FUNCTION_CALL];
};

(javascriptGenerator as any)['matrices_is_matrix'] = function (block: any) {
    const matrix = javascriptGenerator.valueToCode(block, 'MATRIX', javascriptGenerator.ORDER_COMMA) || 'null';
    return [`isMatrix(${matrix})`, javascriptGenerator.ORDER_FUNCTION_CALL];
};

(javascriptGenerator as any)['colour_picker'] = function (block: any) {
    const colour = block.getFieldValue('COLOUR');
    return [JSON.stringify(colour), javascriptGenerator.ORDER_ATOMIC];
};

(javascriptGenerator as any)['colour_random'] = function () {
    return ['"#" + ("000000" + Math.floor(Math.random()*16777215).toString(16)).slice(-6)', javascriptGenerator.ORDER_FUNCTION_CALL];
};

(javascriptGenerator as any)['colour_rgb'] = function (block: any) {
    const r = javascriptGenerator.valueToCode(block, 'RED', javascriptGenerator.ORDER_COMMA) || '0';
    const g = javascriptGenerator.valueToCode(block, 'GREEN', javascriptGenerator.ORDER_COMMA) || '0';
    const b = javascriptGenerator.valueToCode(block, 'BLUE', javascriptGenerator.ORDER_COMMA) || '0';
    return [`"rgb(" + ${r} + "," + ${g} + "," + ${b} + ")"`, javascriptGenerator.ORDER_ADDITION];
};

(javascriptGenerator as any)['colour_split'] = function (block: any) {
    const colour = javascriptGenerator.valueToCode(block, 'COLOUR', javascriptGenerator.ORDER_COMMA) || '"#000000"';
    return [`parseColor(${colour})`, javascriptGenerator.ORDER_FUNCTION_CALL];
};

(javascriptGenerator as any)['colour_blend'] = function (block: any) {
    const colour1 = javascriptGenerator.valueToCode(block, 'COLOUR1', javascriptGenerator.ORDER_COMMA) || '"#000000"';
    const colour2 = javascriptGenerator.valueToCode(block, 'COLOUR2', javascriptGenerator.ORDER_COMMA) || '"#000000"';
    const ratio = javascriptGenerator.valueToCode(block, 'RATIO', javascriptGenerator.ORDER_COMMA) || '0.5';
    return [`blendColors(${colour1}, ${colour2}, ${ratio})`, javascriptGenerator.ORDER_FUNCTION_CALL];
};

registerGenerator('logic_compare', function (block) {
    const op = block.getFieldValue('OP');
    const order = (op === 'EQ' || op === 'NEQ') ? javascriptGenerator.ORDER_EQUALITY : javascriptGenerator.ORDER_RELATIONAL;
    const a = javascriptGenerator.valueToCode(block, 'A', order) || '""';
    const b = javascriptGenerator.valueToCode(block, 'B', order) || '""';
    const jsOp = op === 'EQ' ? '===' : op === 'NEQ' ? '!==' : op === 'LT' ? '<' : op === 'LTE' ? '<=' : op === 'GT' ? '>' : '>=';
    return [`${a} ${jsOp} ${b}`, order];
});

registerGenerator('logic_boolean', function (block) {
    return [block.getFieldValue('BOOL') === 'TRUE' ? 'true' : 'false', javascriptGenerator.ORDER_ATOMIC];
});

registerGenerator('logic_negate', function (block) {
    const value = javascriptGenerator.valueToCode(block, 'BOOL', javascriptGenerator.ORDER_LOGICAL_NOT) || 'true';
    return [`!${value}`, javascriptGenerator.ORDER_LOGICAL_NOT];
});

registerGenerator('logic_operation', function (block) {
    const op = block.getFieldValue('OP');
    const order = op === 'AND' ? javascriptGenerator.ORDER_LOGICAL_AND : javascriptGenerator.ORDER_LOGICAL_OR;
    const a = javascriptGenerator.valueToCode(block, 'A', order) || 'false';
    const b = javascriptGenerator.valueToCode(block, 'B', order) || 'false';
    return [`${a} ${op === 'AND' ? '&&' : '||'} ${b}`, order];
});

registerGenerator('text', function (block) {
    const text = block.getFieldValue('TEXT') || '';
    return [JSON.stringify(text), javascriptGenerator.ORDER_ATOMIC];
});

registerGenerator('text_join', function (block) {
    const count = block.itemCount_ || 0;
    if (count === 0) return ['""', javascriptGenerator.ORDER_ATOMIC];
    const parts: string[] = [];
    for (let i = 0; i < count; i++) {
        const val = javascriptGenerator.valueToCode(block, 'ADD' + i, javascriptGenerator.ORDER_NONE) || '""';
        parts.push(`String(${val})`);
    }
    return [parts.join(' + '), javascriptGenerator.ORDER_ADDITION];
});

registerGenerator('text_length', function (block) {
    const value = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_MEMBER) || '""';
    return [`${value}.length`, javascriptGenerator.ORDER_MEMBER];
});

registerGenerator('text_isEmpty', function (block) {
    const value = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_MEMBER) || '""';
    return [`!${value}.length`, javascriptGenerator.ORDER_LOGICAL_NOT];
});

registerGenerator('math_number', function (block) {
    const num = Number(block.getFieldValue('NUM'));
    return [String(num), num >= 0 ? javascriptGenerator.ORDER_ATOMIC : javascriptGenerator.ORDER_UNARY_NEGATION];
});

registerGenerator('math_compare', function (block) {
    const op = block.getFieldValue('OP');
    const order = (op === 'EQ' || op === 'NEQ') ? javascriptGenerator.ORDER_EQUALITY : javascriptGenerator.ORDER_RELATIONAL;
    const a = javascriptGenerator.valueToCode(block, 'A', order) || '0';
    const b = javascriptGenerator.valueToCode(block, 'B', order) || '0';
    const jsOp = op === 'EQ' ? '===' : op === 'NEQ' ? '!==' : op === 'LT' ? '<' : op === 'LTE' ? '<=' : op === 'GT' ? '>' : '>=';
    return [`${a} ${jsOp} ${b}`, order];
});

registerGenerator('math_single', function (block) {
    const op = block.getFieldValue('OP');
    const arg = javascriptGenerator.valueToCode(block, 'NUM', javascriptGenerator.ORDER_FUNCTION_CALL) || '0';
    const opMap: Record<string, string> = { ROOT: `Math.sqrt(${arg})`, ABS: `Math.abs(${arg})`, NEG: `(-${arg})`, LN: `Math.log(${arg})`, LOG10: `Math.log10(${arg})`, EXP: `Math.exp(${arg})`, ROUND: `Math.round(${arg})`, CEILING: `Math.ceil(${arg})`, FLOOR: `Math.floor(${arg})` };
    return [opMap[op] || arg, javascriptGenerator.ORDER_FUNCTION_CALL];
});

registerGenerator('math_random_int', function (block) {
    const from = javascriptGenerator.valueToCode(block, 'FROM', javascriptGenerator.ORDER_COMMA) || '1';
    const to = javascriptGenerator.valueToCode(block, 'TO', javascriptGenerator.ORDER_COMMA) || '100';
    return [`Math.floor(Math.random() * (${to} - ${from} + 1) + ${from})`, javascriptGenerator.ORDER_FUNCTION_CALL];
});

registerGenerator('math_random_float', function () {
    return ['Math.random()', javascriptGenerator.ORDER_FUNCTION_CALL];
});

registerGenerator('lists_create_empty', function () {
    return ['[]', javascriptGenerator.ORDER_ATOMIC];
});

registerGenerator('lists_add_items', function (block) {
    const list = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]';
    const item = javascriptGenerator.valueToCode(block, 'ITEM', javascriptGenerator.ORDER_NONE) || 'null';
    return `${list}.push(${item});\n`;
});

registerGenerator('lists_remove_item', function (block) {
    const list = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]';
    const index = javascriptGenerator.valueToCode(block, 'INDEX', javascriptGenerator.ORDER_SUBTRACTION) || '1';
    return `${list}.splice(${index} - 1, 1);\n`;
});

registerGenerator('lists_getIndex', function (block) {
    const list = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]';
    const index = javascriptGenerator.valueToCode(block, 'INDEX', javascriptGenerator.ORDER_SUBTRACTION) || '1';
    return [`${list}[${index} - 1]`, javascriptGenerator.ORDER_MEMBER];
});

registerGenerator('lists_setIndex', function (block) {
    const list = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]';
    const index = javascriptGenerator.valueToCode(block, 'INDEX', javascriptGenerator.ORDER_SUBTRACTION) || '1';
    const item = javascriptGenerator.valueToCode(block, 'ITEM', javascriptGenerator.ORDER_ASSIGNMENT) || 'null';
    return `${list}[${index} - 1] = ${item};\n`;
});

registerGenerator('lists_isEmpty', function (block) {
    const list = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]';
    return [`!${list}.length`, javascriptGenerator.ORDER_LOGICAL_NOT];
});

registerGenerator('lists_length', function (block) {
    const list = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]';
    return [`${list}.length`, javascriptGenerator.ORDER_MEMBER];
});

registerGenerator('lexical_variable_get', function (block) {
    const field = block.getField('VAR');
    const variable = field && field.getText ? field.getText() : block.getFieldValue('VAR');
    return [variable, javascriptGenerator.ORDER_ATOMIC];
});

registerGenerator('lexical_variable_set', function (block) {
    const field = block.getField('VAR');
    const variable = field && field.getText ? field.getText() : block.getFieldValue('VAR');
    const value = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_ASSIGNMENT) || 'null';
    return `${variable} = ${value};\n`;
});

registerGenerator('global_declaration', function (block) {
    const name = block.getFieldValue('NAME');
    const value = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_ASSIGNMENT) || 'null';
    return `var ${name} = ${value};\n`;
});

registerGenerator('local_declaration_statement', function (block) {
    let code = '{\n';
    for (let i = 0; i < block.localCount_; i++) {
        const name = block.getFieldValue('VAR' + i) || 'name';
        const inputName = i === 0 ? 'DECL' : 'DECL' + i;
        const val = javascriptGenerator.valueToCode(block, inputName, javascriptGenerator.ORDER_ASSIGNMENT) || 'null';
        code += `  let ${name} = ${val};\n`;
    }
    const stack = javascriptGenerator.statementToCode(block, 'STACK');
    code += stack;
    code += '}\n';
    return code;
});

registerGenerator('local_declaration_expression', function (block) {
    const decls: string[] = [];
    for (let i = 0; i < block.localCount_; i++) {
        const name = block.getFieldValue('VAR' + i) || 'name';
        const inputName = i === 0 ? 'DECL' : 'DECL' + i;
        const val = javascriptGenerator.valueToCode(block, inputName, javascriptGenerator.ORDER_ASSIGNMENT) || 'null';
        decls.push(`let ${name} = ${val};`);
    }
    const returnVal = javascriptGenerator.valueToCode(block, 'RETURN', javascriptGenerator.ORDER_NONE) || 'null';
    const code = `(() => {\n  ${decls.join('\n  ')}\n  return ${returnVal};\n})()`;
    return [code, javascriptGenerator.ORDER_FUNCTION_CALL];
});

registerGenerator('dictionaries_create_with', function (block) {
    const count = block.itemCount_ || 0;
    if (count === 0) return ['{}', javascriptGenerator.ORDER_ATOMIC];
    const pairs: string[] = [];
    for (let i = 0; i < count; i++) {
        const pair = javascriptGenerator.valueToCode(block, 'ADD' + i, javascriptGenerator.ORDER_NONE);
        if (pair) pairs.push(pair);
    }
    return [`Object.fromEntries([${pairs.join(', ')}])`, javascriptGenerator.ORDER_FUNCTION_CALL];
});

registerGenerator('dictionaries_pair', function (block) {
    const key = javascriptGenerator.valueToCode(block, 'KEY', javascriptGenerator.ORDER_COMMA) || '""';
    const value = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_COMMA) || 'null';
    return [`[${key}, ${value}]`, javascriptGenerator.ORDER_ATOMIC];
});

registerGenerator('dictionaries_set_pair', function (block) {
    const dict = javascriptGenerator.valueToCode(block, 'DICT', javascriptGenerator.ORDER_MEMBER) || '{}';
    const key = javascriptGenerator.valueToCode(block, 'KEY', javascriptGenerator.ORDER_NONE) || '""';
    const value = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_ASSIGNMENT) || 'null';
    return `if (${dict} && typeof ${dict} === 'object') { ${dict}[${key}] = ${value}; }\n`;
});

registerGenerator('dictionaries_delete_pair', function (block) {
    const dict = javascriptGenerator.valueToCode(block, 'DICT', javascriptGenerator.ORDER_MEMBER) || '{}';
    const key = javascriptGenerator.valueToCode(block, 'KEY', javascriptGenerator.ORDER_NONE) || '""';
    return `if (${dict} && typeof ${dict} === 'object') { delete ${dict}[${key}]; }\n`;
});

registerGenerator('dictionaries_get_value', function (block) {
    const dict = javascriptGenerator.valueToCode(block, 'DICT', javascriptGenerator.ORDER_MEMBER) || '{}';
    const key = javascriptGenerator.valueToCode(block, 'KEY', javascriptGenerator.ORDER_NONE) || '""';
    const notFound = javascriptGenerator.valueToCode(block, 'NOTFOUND', javascriptGenerator.ORDER_NONE) || 'null';
    return [`((${dict} && typeof ${dict} === 'object' && ${key} in ${dict}) ? ${dict}[${key}] : ${notFound})`, javascriptGenerator.ORDER_CONDITIONAL];
});

registerGenerator('dictionaries_lookup', function (block) {
    const dict = javascriptGenerator.valueToCode(block, 'DICT', javascriptGenerator.ORDER_MEMBER) || '{}';
    const key = javascriptGenerator.valueToCode(block, 'KEY', javascriptGenerator.ORDER_NONE) || '""';
    const notFound = javascriptGenerator.valueToCode(block, 'NOTFOUND', javascriptGenerator.ORDER_NONE) || 'null';
    return [`((${dict} && typeof ${dict} === 'object' && ${key} in ${dict}) ? ${dict}[${key}] : ${notFound})`, javascriptGenerator.ORDER_CONDITIONAL];
});

registerGenerator('dictionaries_length', function (block) {
    const dict = javascriptGenerator.valueToCode(block, 'DICT', javascriptGenerator.ORDER_COMMA) || '{}';
    return [`(${dict} ? Object.keys(${dict}).length : 0)`, javascriptGenerator.ORDER_CONDITIONAL];
});

registerGenerator('dictionaries_get_keys', function (block) {
    const dict = javascriptGenerator.valueToCode(block, 'DICT', javascriptGenerator.ORDER_COMMA) || '{}';
    return [`(${dict} ? Object.keys(${dict}) : [])`, javascriptGenerator.ORDER_CONDITIONAL];
});

registerGenerator('dictionaries_get_values', function (block) {
    const dict = javascriptGenerator.valueToCode(block, 'DICT', javascriptGenerator.ORDER_COMMA) || '{}';
    return [`(${dict} ? Object.values(${dict}) : [])`, javascriptGenerator.ORDER_CONDITIONAL];
});

registerGenerator('dictionaries_is_key_in', function (block) {
    const key = javascriptGenerator.valueToCode(block, 'KEY', javascriptGenerator.ORDER_NONE) || '""';
    const dict = javascriptGenerator.valueToCode(block, 'DICT', javascriptGenerator.ORDER_MEMBER) || '{}';
    return [`((${dict} && typeof ${dict} === 'object') ? (${key} in ${dict}) : false)`, javascriptGenerator.ORDER_CONDITIONAL];
});

registerGenerator('dictionaries_is_a_dictionary', function (block) {
    const thing = javascriptGenerator.valueToCode(block, 'THING', javascriptGenerator.ORDER_COMMA) || 'null';
    return [`(typeof ${thing} === 'object' && ${thing} !== null && !Array.isArray(${thing}))`, javascriptGenerator.ORDER_EQUALITY];
});

registerGenerator('variables_get', function (block) {
    const field = block.getField('VAR');
    const variable = field && field.getText ? field.getText() : block.getFieldValue('VAR');
    return [variable, javascriptGenerator.ORDER_ATOMIC];
});

registerGenerator('variables_set', function (block) {
    const field = block.getField('VAR');
    const variable = field && field.getText ? field.getText() : block.getFieldValue('VAR');
    const value = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_ASSIGNMENT) || 'null';
    return `${variable} = ${value};\n`;
});

registerGenerator('procedures_defnoreturn', function (block) {
    const name = block.getFieldValue('NAME') || 'unnamed_procedure';
    const args = block.arguments_ || [];
    const argsStr = args.join(', ');
    const body = javascriptGenerator.statementToCode(block, 'STACK');
    return `function ${name}(${argsStr}) {\n${body}}\n`;
});

registerGenerator('procedures_defreturn', function (block) {
    const name = block.getFieldValue('NAME') || 'unnamed_procedure';
    const args = block.arguments_ || [];
    const argsStr = args.join(', ');
    const body = javascriptGenerator.statementToCode(block, 'STACK');
    const returnVal = javascriptGenerator.valueToCode(block, 'RETURN', javascriptGenerator.ORDER_NONE) || 'null';
    return `function ${name}(${argsStr}) {\n${body}  return ${returnVal};\n}\n`;
});

registerGenerator('procedures_callnoreturn', function (block) {
    const name = block.getFieldValue('NAME') || 'unnamed_procedure';
    const args = block.arguments_ || [];
    const argsCode: string[] = [];
    for (let i = 0; i < args.length; i++) {
        argsCode.push(javascriptGenerator.valueToCode(block, 'ARG' + i, javascriptGenerator.ORDER_COMMA) || 'null');
    }
    return `${name}(${argsCode.join(', ')});\n`;
});

registerGenerator('procedures_callreturn', function (block) {
    const name = block.getFieldValue('NAME') || 'unnamed_procedure';
    const args = block.arguments_ || [];
    const argsCode: string[] = [];
    for (let i = 0; i < args.length; i++) {
        argsCode.push(javascriptGenerator.valueToCode(block, 'ARG' + i, javascriptGenerator.ORDER_COMMA) || 'null');
    }
    return [`${name}(${argsCode.join(', ')})`, javascriptGenerator.ORDER_FUNCTION_CALL];
});

export default javascriptGenerator;

if ((javascriptGenerator as any).forBlock) {
    const customBlockTypes = Object.keys(javascriptGenerator).filter(
        (t: string) => typeof (javascriptGenerator as any)[t] === 'function'
    );
    customBlockTypes.forEach((type: string) => {
        if ('forBlock' in javascriptGenerator && type !== 'forBlock') {
            (javascriptGenerator as any).forBlock[type] = (javascriptGenerator as any)[type];
        }
    });
}
