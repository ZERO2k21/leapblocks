/**
 * Logic Blocks for App Inventor
 * Includes: comparison, boolean operations, true/false
 */
import * as Blockly from 'blockly';

// Comparison Block
Blockly.Blocks['logic_compare'] = Blockly.Blocks['logic_compare'] || {
    init: function () {
        this.appendValueInput("A");
        this.appendValueInput("B")
            .appendField(new Blockly.FieldDropdown([
                ["=", "EQ"],
                ["≠", "NEQ"],
                ["<", "LT"],
                ["≤", "LTE"],
                [">", "GT"],
                ["≥", "GTE"]
            ]), "OP");
        this.setInputsInline(true);
        this.setOutput(true, "Boolean");
        this.setColour(210);
        this.setTooltip("Compare two values");
    }
};

// Boolean Operation (and/or)
Blockly.Blocks['logic_operation'] = Blockly.Blocks['logic_operation'] || {
    init: function () {
        this.appendValueInput("A")
            .setCheck("Boolean");
        this.appendValueInput("B")
            .setCheck("Boolean")
            .appendField(new Blockly.FieldDropdown([
                ["and", "AND"],
                ["or", "OR"]
            ]), "OP");
        this.setInputsInline(true);
        this.setOutput(true, "Boolean");
        this.setColour(210);
        this.setTooltip("Boolean AND or OR operation");
    }
};

// Not Block
Blockly.Blocks['logic_negate'] = Blockly.Blocks['logic_negate'] || {
    init: function () {
        this.appendValueInput("BOOL")
            .setCheck("Boolean")
            .appendField("not");
        this.setOutput(true, "Boolean");
        this.setColour(210);
        this.setTooltip("Returns opposite of boolean value");
    }
};

// Boolean Value (true/false)
Blockly.Blocks['logic_boolean'] = Blockly.Blocks['logic_boolean'] || {
    init: function () {
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown([
                ["true", "TRUE"],
                ["false", "FALSE"]
            ]), "BOOL");
        this.setOutput(true, "Boolean");
        this.setColour(210);
        this.setTooltip("Boolean true or false");
    }
};

// Null Block
Blockly.Blocks['logic_null'] = Blockly.Blocks['logic_null'] || {
    init: function () {
        this.appendDummyInput()
            .appendField("null");
        this.setOutput(true);
        this.setColour(210);
        this.setTooltip("Returns null value");
    }
};

// Ternary Operator (condition ? true : false)
Blockly.Blocks['logic_ternary'] = Blockly.Blocks['logic_ternary'] || {
    init: function () {
        this.appendValueInput("IF")
            .setCheck("Boolean")
            .appendField("if");
        this.appendValueInput("THEN")
            .appendField("then");
        this.appendValueInput("ELSE")
            .appendField("else");
        this.setOutput(true);
        this.setColour(210);
        this.setTooltip("Ternary operator: condition ? true : false");
    }
};

export default {
    'logic_compare': Blockly.Blocks['logic_compare'],
    'logic_operation': Blockly.Blocks['logic_operation'],
    'logic_negate': Blockly.Blocks['logic_negate'],
    'logic_boolean': Blockly.Blocks['logic_boolean'],
    'logic_null': Blockly.Blocks['logic_null'],
    'logic_ternary': Blockly.Blocks['logic_ternary']
};
