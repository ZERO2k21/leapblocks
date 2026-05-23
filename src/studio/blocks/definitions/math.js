/**
 * Math Blocks for App Inventor
 * Includes: numbers, arithmetic, functions
 */
import * as Blockly from 'blockly';

// Number Block
Blockly.Blocks['math_number'] = Blockly.Blocks['math_number'] || {
    init: function () {
        this.appendDummyInput()
            .appendField(new Blockly.FieldNumber(0), "NUM");
        this.setOutput(true, "Number");
        this.setColour(230);
        this.setTooltip("A number");
    }
};

// Arithmetic Block
Blockly.Blocks['math_arithmetic'] = Blockly.Blocks['math_arithmetic'] || {
    init: function () {
        this.appendValueInput("A")
            .setCheck("Number");
        this.appendValueInput("B")
            .setCheck("Number")
            .appendField(new Blockly.FieldDropdown([
                ["+", "ADD"],
                ["-", "MINUS"],
                ["×", "MULTIPLY"],
                ["÷", "DIVIDE"],
                ["^", "POWER"]
            ]), "OP");
        this.setInputsInline(true);
        this.setOutput(true, "Number");
        this.setColour(230);
        this.setTooltip("Basic arithmetic operations");
    }
};

// Single Math Function
Blockly.Blocks['math_single'] = Blockly.Blocks['math_single'] || {
    init: function () {
        this.appendValueInput("NUM")
            .setCheck("Number")
            .appendField(new Blockly.FieldDropdown([
                ["square root", "ROOT"],
                ["absolute", "ABS"],
                ["-", "NEG"],
                ["ln", "LN"],
                ["log10", "LOG10"],
                ["e^", "EXP"],
                ["10^", "POW10"]
            ]), "OP");
        this.setOutput(true, "Number");
        this.setColour(230);
        this.setTooltip("Math function");
    }
};

// Trig Functions
Blockly.Blocks['math_trig'] = Blockly.Blocks['math_trig'] || {
    init: function () {
        this.appendValueInput("NUM")
            .setCheck("Number")
            .appendField(new Blockly.FieldDropdown([
                ["sin", "SIN"],
                ["cos", "COS"],
                ["tan", "TAN"],
                ["asin", "ASIN"],
                ["acos", "ACOS"],
                ["atan", "ATAN"]
            ]), "OP");
        this.setOutput(true, "Number");
        this.setColour(230);
        this.setTooltip("Trigonometric function");
    }
};

// Random Integer
Blockly.Blocks['math_random_int'] = Blockly.Blocks['math_random_int'] || {
    init: function () {
        this.appendValueInput("FROM")
            .setCheck("Number")
            .appendField("random integer from");
        this.appendValueInput("TO")
            .setCheck("Number")
            .appendField("to");
        this.setInputsInline(true);
        this.setOutput(true, "Number");
        this.setColour(230);
        this.setTooltip("Random integer between two numbers");
    }
};

// Random Fraction
Blockly.Blocks['math_random_float'] = Blockly.Blocks['math_random_float'] || {
    init: function () {
        this.appendDummyInput()
            .appendField("random fraction");
        this.setOutput(true, "Number");
        this.setColour(230);
        this.setTooltip("Random number between 0.0 and 1.0");
    }
};

// Min/Max
Blockly.Blocks['math_on_list'] = Blockly.Blocks['math_on_list'] || {
    init: function () {
        this.appendValueInput("LIST")
            .setCheck("List")
            .appendField(new Blockly.FieldDropdown([
                ["min", "MIN"],
                ["max", "MAX"],
                ["sum", "SUM"],
                ["average", "AVERAGE"]
            ]), "OP")
            .appendField("of list");
        this.setOutput(true, "Number");
        this.setColour(230);
        this.setTooltip("Math operation on list");
    }
};

// Modulo
Blockly.Blocks['math_modulo'] = Blockly.Blocks['math_modulo'] || {
    init: function () {
        this.appendValueInput("DIVIDEND")
            .setCheck("Number")
            .appendField("remainder of");
        this.appendValueInput("DIVISOR")
            .setCheck("Number")
            .appendField("÷");
        this.setInputsInline(true);
        this.setOutput(true, "Number");
        this.setColour(230);
        this.setTooltip("Remainder of division");
    }
};

// Round
Blockly.Blocks['math_round'] = Blockly.Blocks['math_round'] || {
    init: function () {
        this.appendValueInput("NUM")
            .setCheck("Number")
            .appendField(new Blockly.FieldDropdown([
                ["round", "ROUND"],
                ["round up", "ROUNDUP"],
                ["round down", "ROUNDDOWN"]
            ]), "OP");
        this.setOutput(true, "Number");
        this.setColour(230);
        this.setTooltip("Round number");
    }
};

export default {
    'math_number': Blockly.Blocks['math_number'],
    'math_arithmetic': Blockly.Blocks['math_arithmetic'],
    'math_single': Blockly.Blocks['math_single'],
    'math_trig': Blockly.Blocks['math_trig'],
    'math_random_int': Blockly.Blocks['math_random_int'],
    'math_random_float': Blockly.Blocks['math_random_float'],
    'math_on_list': Blockly.Blocks['math_on_list'],
    'math_modulo': Blockly.Blocks['math_modulo'],
    'math_round': Blockly.Blocks['math_round']
};
