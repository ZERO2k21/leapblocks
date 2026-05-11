/**
 * Variable Blocks for App Inventor
 * MIT App Inventor compatible variable operations
 */
import * as Blockly from 'blockly';

// Initialize Global Variable
Blockly.Blocks['global_declaration'] = {
    init: function () {
        this.appendValueInput("VALUE")
            .setCheck(null)
            .appendField("initialize global")
            .appendField(new Blockly.FieldTextInput("name"), "NAME")
            .appendField("to");
        this.setColour(100);
        this.setTooltip("Create a global variable");
        this.setHelpUrl("");
    }
};

// Get Global Variable
Blockly.Blocks['lexical_variable_get'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("get")
            .appendField(new Blockly.FieldVariable("variable"), "VAR");
        this.setOutput(true, null);
        this.setColour(100);
        this.setTooltip("Get the value of a variable");
    }
};

// Set Global Variable
Blockly.Blocks['lexical_variable_set'] = {
    init: function () {
        this.appendValueInput("VALUE")
            .setCheck(null)
            .appendField("set")
            .appendField(new Blockly.FieldVariable("variable"), "VAR")
            .appendField("to");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(100);
        this.setTooltip("Set the value of a variable");
    }
};

// Initialize Local Variable (in do)
Blockly.Blocks['local_declaration_statement'] = {
    init: function () {
        this.appendValueInput("DECL0")
            .setCheck(null)
            .appendField("initialize local")
            .appendField(new Blockly.FieldTextInput("name"), "VAR0")
            .appendField("to");
        this.appendStatementInput("STACK")
            .setCheck(null)
            .appendField("in");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(100);
        this.setTooltip("Create a local variable");
        this.setMutator(new Blockly.icons.MutatorIcon(['local_declaration_item'], this));
        this.localCount_ = 1;
    },
    mutationToDom: function () {
        const container = Blockly.utils.xml.createElement('mutation');
        container.setAttribute('locals', this.localCount_);
        return container;
    },
    domToMutation: function (xmlElement) {
        this.localCount_ = parseInt(xmlElement.getAttribute('locals'), 10);
        this.updateShape_();
    },
    updateShape_: function () {
        // Remove all declaration inputs
        for (let i = 0; this.getInput('DECL' + i); i++) {
            this.removeInput('DECL' + i);
        }
        // Remove STACK input
        if (this.getInput('STACK')) {
            this.removeInput('STACK');
        }
        // Add new declaration inputs
        for (let i = 0; i < this.localCount_; i++) {
            const input = this.appendValueInput('DECL' + i).setCheck(null);
            if (i === 0) {
                input.appendField('initialize local');
            }
            input.appendField(new Blockly.FieldTextInput('name'), 'VAR' + i)
                .appendField('to');
        }
        // Re-add STACK input
        this.appendStatementInput('STACK')
            .setCheck(null)
            .appendField('in');
    }
};

// Initialize Local Variable (in return)
Blockly.Blocks['local_declaration_expression'] = {
    init: function () {
        this.appendValueInput("DECL0")
            .setCheck(null)
            .appendField("initialize local")
            .appendField(new Blockly.FieldTextInput("name"), "VAR0")
            .appendField("to");
        this.appendValueInput("RETURN")
            .setCheck(null)
            .appendField("in");
        this.setOutput(true, null);
        this.setColour(100);
        this.setTooltip("Create a local variable with return value");
        this.setMutator(new Blockly.icons.MutatorIcon(['local_declaration_item'], this));
        this.localCount_ = 1;
    },
    mutationToDom: function () {
        const container = Blockly.utils.xml.createElement('mutation');
        container.setAttribute('locals', this.localCount_);
        return container;
    },
    domToMutation: function (xmlElement) {
        this.localCount_ = parseInt(xmlElement.getAttribute('locals'), 10);
        this.updateShape_();
    },
    updateShape_: function () {
        // Remove all declaration inputs
        for (let i = 0; this.getInput('DECL' + i); i++) {
            this.removeInput('DECL' + i);
        }
        // Remove RETURN input
        if (this.getInput('RETURN')) {
            this.removeInput('RETURN');
        }
        // Add new declaration inputs
        for (let i = 0; i < this.localCount_; i++) {
            const input = this.appendValueInput('DECL' + i).setCheck(null);
            if (i === 0) {
                input.appendField('initialize local');
            }
            input.appendField(new Blockly.FieldTextInput('name'), 'VAR' + i)
                .appendField('to');
        }
        // Re-add RETURN input
        this.appendValueInput('RETURN')
            .setCheck(null)
            .appendField('in');
    }
};

// Mutator block for local declarations
Blockly.Blocks['local_declaration_item'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("local");
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setColour(100);
        this.setTooltip("Add a local variable");
        this.contextMenu = false;
    }
};

export default {
    'global_declaration': Blockly.Blocks['global_declaration'],
    'lexical_variable_get': Blockly.Blocks['lexical_variable_get'],
    'lexical_variable_set': Blockly.Blocks['lexical_variable_set'],
    'local_declaration_statement': Blockly.Blocks['local_declaration_statement'],
    'local_declaration_expression': Blockly.Blocks['local_declaration_expression'],
    'local_declaration_item': Blockly.Blocks['local_declaration_item']
};
