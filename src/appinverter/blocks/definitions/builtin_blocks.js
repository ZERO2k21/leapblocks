/**
 * MIT App Inventor Built-in Blocks
 * All standard blocks that are always available
 */
import * as Blockly from 'blockly/core';

// MIT App Inventor Block Colors
export const MIT_COLORS = {
    control: '#F59E0B',
    logic: '#4A90E2',
    math: '#5B67A5',
    text: '#68A83A',
    lists: '#C03838',
    colors: '#A55BA5',
    variables: '#F97316',
    procedures: '#894FC4',
    events: '#FACC15',
    methods: '#894FC4',
    getters: '#439970',
    setters: '#266643'
};

// ============================================================================
// CONTROL BLOCKS
// ============================================================================

// if/then block
Blockly.Blocks['controls_if'] = {
    init: function () {
        this.setColour(MIT_COLORS.control);
        this.appendValueInput('IF0')
            .setCheck('Boolean')
            .appendField('if');
        this.appendStatementInput('DO0')
            .appendField('then');
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip('If a condition is true, then do some blocks.');
        this.setHelpUrl('');
    }
};

// if/then/else block
Blockly.Blocks['controls_if_else'] = {
    init: function () {
        this.setColour(MIT_COLORS.control);
        this.appendValueInput('IF0')
            .setCheck('Boolean')
            .appendField('if');
        this.appendStatementInput('DO0')
            .appendField('then');
        this.appendStatementInput('ELSE')
            .appendField('else');
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip('If a condition is true, do the first block. Otherwise, do the second block.');
    }
};

// for each number from/to/by block
Blockly.Blocks['controls_forRange'] = {
    init: function () {
        this.setColour(MIT_COLORS.control);
        this.appendDummyInput()
            .appendField('for each')
            .appendField(new Blockly.FieldVariable('i'), 'VAR')
            .appendField('from');
        this.appendValueInput('FROM')
            .setCheck('Number');
        this.appendValueInput('TO')
            .setCheck('Number')
            .appendField('to');
        this.appendValueInput('BY')
            .setCheck('Number')
            .appendField('by');
        this.appendStatementInput('DO')
            .appendField('do');
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip('Count from a start number to an end number by a step value.');
    }
};

// for each item in list block
Blockly.Blocks['controls_forEach'] = {
    init: function () {
        this.setColour(MIT_COLORS.control);
        this.appendDummyInput()
            .appendField('for each')
            .appendField(new Blockly.FieldVariable('item'), 'VAR')
            .appendField('in list');
        this.appendValueInput('LIST')
            .setCheck('Array');
        this.appendStatementInput('DO')
            .appendField('do');
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip('Run blocks for each item in a list.');
    }
};

// while block
Blockly.Blocks['controls_while'] = {
    init: function () {
        this.setColour(MIT_COLORS.control);
        this.appendValueInput('TEST')
            .setCheck('Boolean')
            .appendField('while');
        this.appendStatementInput('DO')
            .appendField('do');
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip('While a condition is true, do some blocks.');
    }
};

// choose (ternary) block
Blockly.Blocks['controls_choose'] = {
    init: function () {
        this.setColour(MIT_COLORS.control);
        this.appendValueInput('TEST')
            .setCheck('Boolean')
            .appendField('if');
        this.appendValueInput('THENRETURN')
            .appendField('then');
        this.appendValueInput('ELSERETURN')
            .appendField('else');
        this.setOutput(true);
        this.setTooltip('If test is true, return then-return value, otherwise return else-return value.');
    }
};

// do/result block
Blockly.Blocks['controls_do_then_return'] = {
    init: function () {
        this.setColour(MIT_COLORS.control);
        this.appendStatementInput('STM')
            .appendField('do');
        this.appendValueInput('VALUE')
            .appendField('result');
        this.setOutput(true);
        this.setTooltip('Runs the blocks in do and returns a result.');
    }
};

// evaluate but ignore block
Blockly.Blocks['controls_eval_but_ignore'] = {
    init: function () {
        this.setColour(MIT_COLORS.control);
        this.appendValueInput('VALUE')
            .appendField('evaluate but ignore result');
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip('Evaluates the block but ignores the return value.');
    }
};

// open another screen block
Blockly.Blocks['controls_openAnotherScreen'] = {
    init: function () {
        this.setColour(MIT_COLORS.control);
        this.appendValueInput('SCREEN')
            .setCheck('String')
            .appendField('open another screen');
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip('Opens another screen in the app.');
    }
};

// close screen block
Blockly.Blocks['controls_closeScreen'] = {
    init: function () {
        this.setColour(MIT_COLORS.control);
        this.appendDummyInput()
            .appendField('close screen');
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip('Closes the current screen.');
    }
};

// break block
Blockly.Blocks['controls_break'] = {
    init: function () {
        this.setColour(MIT_COLORS.control);
        this.appendDummyInput()
            .appendField('break');
        this.setPreviousStatement(true);
        this.setTooltip('Break out of the current loop.');
    }
};

// ============================================================================
// LOGIC BLOCKS
// ============================================================================

// true/false block
Blockly.Blocks['logic_boolean'] = {
    init: function () {
        this.setColour(MIT_COLORS.logic);
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown([['true', 'TRUE'], ['false', 'FALSE']]), 'BOOL');
        this.setOutput(true, 'Boolean');
        this.setTooltip('Returns either true or false.');
    }
};

// not block
Blockly.Blocks['logic_negate'] = {
    init: function () {
        this.setColour(MIT_COLORS.logic);
        this.appendValueInput('BOOL')
            .setCheck('Boolean')
            .appendField('not');
        this.setOutput(true, 'Boolean');
        this.setTooltip('Returns true if the input is false. Returns false if the input is true.');
    }
};

// comparison block
Blockly.Blocks['logic_compare'] = {
    init: function () {
        this.setColour(MIT_COLORS.logic);
        this.appendValueInput('A');
        this.appendValueInput('B')
            .appendField(new Blockly.FieldDropdown([
                ['=', 'EQ'],
                ['≠', 'NEQ'],
                ['<', 'LT'],
                ['≤', 'LTE'],
                ['>', 'GT'],
                ['≥', 'GTE']
            ]), 'OP');
        this.setInputsInline(true);
        this.setOutput(true, 'Boolean');
        this.setTooltip('Tests whether two numbers are equal, not equal, or one is greater or less than the other.');
    }
};

// and/or block
Blockly.Blocks['logic_operation'] = {
    init: function () {
        this.setColour(MIT_COLORS.logic);
        this.appendValueInput('A')
            .setCheck('Boolean');
        this.appendValueInput('B')
            .setCheck('Boolean')
            .appendField(new Blockly.FieldDropdown([['and', 'AND'], ['or', 'OR']]), 'OP');
        this.setInputsInline(true);
        this.setOutput(true, 'Boolean');
        this.setTooltip('Returns true if both inputs are true (and) or if at least one input is true (or).');
    }
};

// ============================================================================
// MATH BLOCKS
// ============================================================================

// number block
Blockly.Blocks['math_number'] = {
    init: function () {
        this.setColour(MIT_COLORS.math);
        this.appendDummyInput()
            .appendField(new Blockly.FieldNumber(0), 'NUM');
        this.setOutput(true, 'Number');
        this.setTooltip('A number.');
    }
};

// arithmetic block
Blockly.Blocks['math_arithmetic'] = {
    init: function () {
        this.setColour(MIT_COLORS.math);
        this.appendValueInput('A')
            .setCheck('Number');
        this.appendValueInput('B')
            .setCheck('Number')
            .appendField(new Blockly.FieldDropdown([
                ['+', 'ADD'],
                ['-', 'MINUS'],
                ['×', 'MULTIPLY'],
                ['/', 'DIVIDE'],
                ['^', 'POWER']
            ]), 'OP');
        this.setInputsInline(true);
        this.setOutput(true, 'Number');
        this.setTooltip('Return the sum, difference, product, quotient, or power of two numbers.');
    }
};

// single operation block (sqrt, abs, etc.)
Blockly.Blocks['math_single'] = {
    init: function () {
        this.setColour(MIT_COLORS.math);
        this.appendValueInput('NUM')
            .setCheck('Number')
            .appendField(new Blockly.FieldDropdown([
                ['square root', 'ROOT'],
                ['absolute', 'ABS'],
                ['-', 'NEG'],
                ['log', 'LN'],
                ['e^', 'EXP'],
                ['10^', 'POW10']
            ]), 'OP');
        this.setOutput(true, 'Number');
        this.setTooltip('Return the square root, absolute value, negation, natural logarithm, or exponential of a number.');
    }
};

// trig block
Blockly.Blocks['math_trig'] = {
    init: function () {
        this.setColour(MIT_COLORS.math);
        this.appendValueInput('NUM')
            .setCheck('Number')
            .appendField(new Blockly.FieldDropdown([
                ['sin', 'SIN'],
                ['cos', 'COS'],
                ['tan', 'TAN'],
                ['asin', 'ASIN'],
                ['acos', 'ACOS'],
                ['atan', 'ATAN']
            ]), 'OP');
        this.setOutput(true, 'Number');
        this.setTooltip('Return the sine, cosine, tangent, arcsine, arccosine, or arctangent of a number.');
    }
};

// constant block
Blockly.Blocks['math_constant'] = {
    init: function () {
        this.setColour(MIT_COLORS.math);
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown([
                ['π', 'PI'],
                ['e', 'E'],
                ['φ', 'GOLDEN_RATIO'],
                ['sqrt(2)', 'SQRT2'],
                ['sqrt(½)', 'SQRT1_2'],
                ['∞', 'INFINITY']
            ]), 'CONSTANT');
        this.setOutput(true, 'Number');
        this.setTooltip('Return common mathematical constants: π (3.141...), e (2.718...), φ (1.618...), sqrt(2), sqrt(½), or ∞.');
    }
};

// number property block
Blockly.Blocks['math_number_property'] = {
    init: function () {
        this.setColour(MIT_COLORS.math);
        this.appendValueInput('NUMBER_TO_CHECK')
            .setCheck('Number');
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown([
                ['even', 'EVEN'],
                ['odd', 'ODD'],
                ['prime', 'PRIME'],
                ['whole', 'WHOLE'],
                ['positive', 'POSITIVE'],
                ['negative', 'NEGATIVE'],
                ['divisible by', 'DIVISIBLE_BY']
            ]), 'PROPERTY');
        this.setInputsInline(true);
        this.setOutput(true, 'Boolean');
        this.setTooltip('Check if a number is even, odd, prime, whole, positive, negative, or divisible by a certain number.');
    }
};

// round block
Blockly.Blocks['math_round'] = {
    init: function () {
        this.setColour(MIT_COLORS.math);
        this.appendValueInput('NUM')
            .setCheck('Number')
            .appendField(new Blockly.FieldDropdown([
                ['round', 'ROUND'],
                ['round up', 'ROUNDUP'],
                ['round down', 'ROUNDDOWN']
            ]), 'OP');
        this.setOutput(true, 'Number');
        this.setTooltip('Round a number up, down, or to the nearest integer.');
    }
};

// modulo block
Blockly.Blocks['math_modulo'] = {
    init: function () {
        this.setColour(MIT_COLORS.math);
        this.appendValueInput('DIVIDEND')
            .setCheck('Number')
            .appendField('remainder of');
        this.appendValueInput('DIVISOR')
            .setCheck('Number')
            .appendField('÷');
        this.setInputsInline(true);
        this.setOutput(true, 'Number');
        this.setTooltip('Return the remainder from dividing the two numbers.');
    }
};

// random integer block
Blockly.Blocks['math_random_int'] = {
    init: function () {
        this.setColour(MIT_COLORS.math);
        this.appendValueInput('FROM')
            .setCheck('Number')
            .appendField('random integer from');
        this.appendValueInput('TO')
            .setCheck('Number')
            .appendField('to');
        this.setInputsInline(true);
        this.setOutput(true, 'Number');
        this.setTooltip('Return a random integer between the two specified limits, inclusive.');
    }
};

// random fraction block
Blockly.Blocks['math_random_float'] = {
    init: function () {
        this.setColour(MIT_COLORS.math);
        this.appendDummyInput()
            .appendField('random fraction');
        this.setOutput(true, 'Number');
        this.setTooltip('Return a random fraction between 0.0 (inclusive) and 1.0 (exclusive).');
    }
};

// Continue in next file...
