/**
 * Control Flow Blocks for App Inventor
 * Includes: component events, if/else, loops, wait
 */
import * as Blockly from 'blockly';

// Component Event Block (when Button.Click, etc.)
Blockly.Blocks['component_event'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("when")
            .appendField(new Blockly.FieldDropdown([
                ["Button1", "Button1"],
                ["Button2", "Button2"],
                ["Label1", "Label1"]
            ]), "COMPONENT")
            .appendField(".")
            .appendField(new Blockly.FieldDropdown([
                ["Click", "Click"],
                ["LongClick", "LongClick"],
                ["GotFocus", "GotFocus"],
                ["LostFocus", "LostFocus"]
            ]), "EVENT");
        this.appendStatementInput("DO")
            .setCheck(null)
            .appendField("do");
        this.setColour(230);
        this.setTooltip("Execute code when component event occurs");
        this.setHelpUrl("");
    }
};

// If Block (uses Blockly's built-in)
Blockly.Blocks['controls_if'] = Blockly.Blocks['controls_if'] || {
    init: function () {
        this.appendValueInput("IF0")
            .setCheck("Boolean")
            .appendField("if");
        this.appendStatementInput("DO0")
            .appendField("do");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(210);
        this.setTooltip("If condition is true, execute statements");
    }
};

// For Loop Block
Blockly.Blocks['controls_for'] = Blockly.Blocks['controls_for'] || {
    init: function () {
        this.appendDummyInput()
            .appendField("count with")
            .appendField(new Blockly.FieldVariable("i"), "VAR")
            .appendField("from");
        this.appendValueInput("FROM")
            .setCheck("Number");
        this.appendValueInput("TO")
            .setCheck("Number")
            .appendField("to");
        this.appendValueInput("BY")
            .setCheck("Number")
            .appendField("by");
        this.appendStatementInput("DO")
            .appendField("do");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(120);
        this.setTooltip("Count from start to end");
    }
};

// While Loop Block
Blockly.Blocks['controls_whileUntil'] = Blockly.Blocks['controls_whileUntil'] || {
    init: function () {
        this.appendValueInput("BOOL")
            .setCheck("Boolean")
            .appendField(new Blockly.FieldDropdown([
                ["while", "WHILE"],
                ["until", "UNTIL"]
            ]), "MODE");
        this.appendStatementInput("DO")
            .appendField("do");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(120);
        this.setTooltip("Repeat while/until condition is true");
    }
};

// Wait Block (delay)
Blockly.Blocks['controls_wait'] = {
    init: function () {
        this.appendValueInput("DURATION")
            .setCheck("Number")
            .appendField("wait");
        this.appendDummyInput()
            .appendField("milliseconds");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(120);
        this.setTooltip("Wait for specified milliseconds");
    }
};

// Break Block
Blockly.Blocks['controls_break'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("break");
        this.setPreviousStatement(true, null);
        this.setColour(120);
        this.setTooltip("Break out of loop");
    }
};

export default {
    'component_event': Blockly.Blocks['component_event'],
    'controls_if': Blockly.Blocks['controls_if'],
    'controls_for': Blockly.Blocks['controls_for'],
    'controls_whileUntil': Blockly.Blocks['controls_whileUntil'],
    'controls_wait': Blockly.Blocks['controls_wait'],
    'controls_break': Blockly.Blocks['controls_break']
};
