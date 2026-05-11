/**
 * Procedure Blocks for App Inventor
 * MIT App Inventor compatible procedure/function operations
 */
import * as Blockly from 'blockly';

// Procedure Definition (no return)
Blockly.Blocks['procedures_defnoreturn'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("to")
            .appendField(new Blockly.FieldTextInput("procedure"), "NAME");
        this.appendStatementInput("STACK")
            .setCheck(null)
            .appendField("do");
        this.setColour(290);
        this.setTooltip("Define a procedure");
        this.setHelpUrl("");
        this.arguments_ = [];
        this.setMutator(new Blockly.icons.MutatorIcon(['procedures_mutatorarg'], this));
    },
    mutationToDom: function () {
        const container = Blockly.utils.xml.createElement('mutation');
        for (let i = 0; i < this.arguments_.length; i++) {
            const parameter = Blockly.utils.xml.createElement('arg');
            parameter.setAttribute('name', this.arguments_[i]);
            container.appendChild(parameter);
        }
        return container;
    },
    domToMutation: function (xmlElement) {
        this.arguments_ = [];
        for (let i = 0, childNode; (childNode = xmlElement.childNodes[i]); i++) {
            if (childNode.nodeName.toLowerCase() === 'arg') {
                this.arguments_.push(childNode.getAttribute('name'));
            }
        }
        this.updateParams_();
    },
    updateParams_: function () {
        // Remove all parameter inputs
        for (let i = 0; this.getInput('ARG' + i); i++) {
            this.removeInput('ARG' + i);
        }
        // Remove STACK input
        if (this.getInput('STACK')) {
            this.removeInput('STACK');
        }
        // Add parameter inputs
        for (let i = 0; i < this.arguments_.length; i++) {
            const input = this.appendDummyInput('ARG' + i);
            input.appendField(new Blockly.FieldTextInput(this.arguments_[i]), 'ARGNAME' + i);
        }
        // Re-add STACK input
        this.appendStatementInput('STACK')
            .setCheck(null)
            .appendField('do');
    }
};

// Procedure Definition (with return)
Blockly.Blocks['procedures_defreturn'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("to")
            .appendField(new Blockly.FieldTextInput("procedure"), "NAME");
        this.appendValueInput("RETURN")
            .setCheck(null)
            .appendField("result");
        this.setColour(290);
        this.setTooltip("Define a procedure that returns a value");
        this.setHelpUrl("");
        this.arguments_ = [];
        this.setMutator(new Blockly.icons.MutatorIcon(['procedures_mutatorarg'], this));
    },
    mutationToDom: function () {
        const container = Blockly.utils.xml.createElement('mutation');
        for (let i = 0; i < this.arguments_.length; i++) {
            const parameter = Blockly.utils.xml.createElement('arg');
            parameter.setAttribute('name', this.arguments_[i]);
            container.appendChild(parameter);
        }
        return container;
    },
    domToMutation: function (xmlElement) {
        this.arguments_ = [];
        for (let i = 0, childNode; (childNode = xmlElement.childNodes[i]); i++) {
            if (childNode.nodeName.toLowerCase() === 'arg') {
                this.arguments_.push(childNode.getAttribute('name'));
            }
        }
        this.updateParams_();
    },
    updateParams_: function () {
        // Remove all parameter inputs
        for (let i = 0; this.getInput('ARG' + i); i++) {
            this.removeInput('ARG' + i);
        }
        // Remove RETURN input
        if (this.getInput('RETURN')) {
            this.removeInput('RETURN');
        }
        // Add parameter inputs
        for (let i = 0; i < this.arguments_.length; i++) {
            const input = this.appendDummyInput('ARG' + i);
            input.appendField(new Blockly.FieldTextInput(this.arguments_[i]), 'ARGNAME' + i);
        }
        // Re-add RETURN input
        this.appendValueInput('RETURN')
            .setCheck(null)
            .appendField('result');
    }
};

// Procedure Call (no return)
Blockly.Blocks['procedures_callnoreturn'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("call")
            .appendField(new Blockly.FieldTextInput("procedure"), "NAME");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(290);
        this.setTooltip("Call a procedure");
        this.arguments_ = [];
        this.setMutator(new Blockly.icons.MutatorIcon(['procedures_mutatorarg'], this));
    },
    mutationToDom: function () {
        const container = Blockly.utils.xml.createElement('mutation');
        container.setAttribute('name', this.getFieldValue('NAME'));
        for (let i = 0; i < this.arguments_.length; i++) {
            const parameter = Blockly.utils.xml.createElement('arg');
            parameter.setAttribute('name', this.arguments_[i]);
            container.appendChild(parameter);
        }
        return container;
    },
    domToMutation: function (xmlElement) {
        const name = xmlElement.getAttribute('name');
        this.setFieldValue(name, 'NAME');
        this.arguments_ = [];
        for (let i = 0, childNode; (childNode = xmlElement.childNodes[i]); i++) {
            if (childNode.nodeName.toLowerCase() === 'arg') {
                this.arguments_.push(childNode.getAttribute('name'));
            }
        }
        this.updateShape_();
    },
    updateShape_: function () {
        // Remove all argument inputs
        for (let i = 0; this.getInput('ARG' + i); i++) {
            this.removeInput('ARG' + i);
        }
        // Add argument inputs
        for (let i = 0; i < this.arguments_.length; i++) {
            const input = this.appendValueInput('ARG' + i)
                .setCheck(null);
            input.appendField(this.arguments_[i]);
        }
    }
};

// Procedure Call (with return)
Blockly.Blocks['procedures_callreturn'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("call")
            .appendField(new Blockly.FieldTextInput("procedure"), "NAME");
        this.setOutput(true, null);
        this.setColour(290);
        this.setTooltip("Call a procedure that returns a value");
        this.arguments_ = [];
        this.setMutator(new Blockly.icons.MutatorIcon(['procedures_mutatorarg'], this));
    },
    mutationToDom: function () {
        const container = Blockly.utils.xml.createElement('mutation');
        container.setAttribute('name', this.getFieldValue('NAME'));
        for (let i = 0; i < this.arguments_.length; i++) {
            const parameter = Blockly.utils.xml.createElement('arg');
            parameter.setAttribute('name', this.arguments_[i]);
            container.appendChild(parameter);
        }
        return container;
    },
    domToMutation: function (xmlElement) {
        const name = xmlElement.getAttribute('name');
        this.setFieldValue(name, 'NAME');
        this.arguments_ = [];
        for (let i = 0, childNode; (childNode = xmlElement.childNodes[i]); i++) {
            if (childNode.nodeName.toLowerCase() === 'arg') {
                this.arguments_.push(childNode.getAttribute('name'));
            }
        }
        this.updateShape_();
    },
    updateShape_: function () {
        // Remove all argument inputs
        for (let i = 0; this.getInput('ARG' + i); i++) {
            this.removeInput('ARG' + i);
        }
        // Add argument inputs
        for (let i = 0; i < this.arguments_.length; i++) {
            const input = this.appendValueInput('ARG' + i)
                .setCheck(null);
            input.appendField(this.arguments_[i]);
        }
    }
};

// Mutator block for procedure arguments
Blockly.Blocks['procedures_mutatorarg'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("input:")
            .appendField(new Blockly.FieldTextInput("x"), "NAME");
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setColour(290);
        this.setTooltip("Add an input parameter");
        this.contextMenu = false;
    }
};

// Get Procedure Argument
Blockly.Blocks['procedures_getarg'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("get")
            .appendField(new Blockly.FieldTextInput("x"), "VAR");
        this.setOutput(true, null);
        this.setColour(290);
        this.setTooltip("Get the value of a procedure argument");
    }
};

export default {
    'procedures_defnoreturn': Blockly.Blocks['procedures_defnoreturn'],
    'procedures_defreturn': Blockly.Blocks['procedures_defreturn'],
    'procedures_callnoreturn': Blockly.Blocks['procedures_callnoreturn'],
    'procedures_callreturn': Blockly.Blocks['procedures_callreturn'],
    'procedures_mutatorarg': Blockly.Blocks['procedures_mutatorarg'],
    'procedures_getarg': Blockly.Blocks['procedures_getarg']
};
