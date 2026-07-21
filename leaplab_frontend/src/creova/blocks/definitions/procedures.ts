import * as Blockly from 'blockly';

Blockly.Blocks['procedures_defnoreturn'] = {
    init: function (this: Blockly.Block) {
        this.appendDummyInput()
            .appendField("to")
            .appendField(new Blockly.FieldTextInput("procedure"), "NAME");
        this.appendStatementInput("STACK")
            .setCheck(null)
            .appendField("do");
        this.setColour(290);
        this.setTooltip("Define a procedure");
        this.setHelpUrl("");
        (this as any).arguments_ = [];
        this.setMutator(new Blockly.icons.MutatorIcon(['procedures_mutatorarg'], this));
        (this as any).arguments_ = [];
    },
    mutationToDom: function (this: Blockly.Block): Element {
        const self = this as any;
        const container = Blockly.utils.xml.createElement('mutation');
        for (let i = 0; i < self.arguments_.length; i++) {
            const parameter = Blockly.utils.xml.createElement('arg');
            parameter.setAttribute('name', self.arguments_[i]);
            container.appendChild(parameter);
        }
        return container;
    },
    domToMutation: function (this: Blockly.Block, xmlElement: Element) {
        const self = this as any;
        self.arguments_ = [];
        for (let i = 0, childNode: ChildNode | null; (childNode = xmlElement.childNodes[i]); i++) {
            if (childNode.nodeName.toLowerCase() === 'arg') {
                self.arguments_.push((childNode as Element).getAttribute('name'));
            }
        }
        self.updateParams_();
    },
    decompose: function (this: Blockly.Block, workspace: Blockly.Workspace) {
        const self = this as any;
        const containerBlock = workspace.newBlock('procedures_mutatorcontainer');
        containerBlock.initSvg();
        let connection = containerBlock.nextConnection;
        for (let i = 0; i < self.arguments_.length; i++) {
            const itemBlock = workspace.newBlock('procedures_mutatorarg');
            itemBlock.setFieldValue(self.arguments_[i], 'NAME');
            itemBlock.initSvg();
            if (connection) connection.connect(itemBlock.previousConnection);
            connection = itemBlock.nextConnection;
        }
        return containerBlock;
    },
    compose: function (this: Blockly.Block, containerBlock: Blockly.Block) {
        const self = this as any;
        self.arguments_ = [];
        let itemBlock = containerBlock.nextConnection?.targetBlock() || null;
        while (itemBlock && !itemBlock.isInsertionMarker()) {
            self.arguments_.push(itemBlock.getFieldValue('NAME'));
            itemBlock = itemBlock.nextConnection && itemBlock.nextConnection.targetBlock();
        }
        self.updateParams_();
    },
    updateParams_: function (this: Blockly.Block) {
        const self = this as any;
        for (let i = 0; this.getInput('ARG' + i); i++) {
            this.removeInput('ARG' + i);
        }
        if (this.getInput('STACK')) {
            this.removeInput('STACK');
        }
        for (let i = 0; i < self.arguments_.length; i++) {
            const input = this.appendDummyInput('ARG' + i);
            input.appendField(new Blockly.FieldTextInput(self.arguments_[i]), 'ARGNAME' + i);
        }
        this.appendStatementInput('STACK')
            .setCheck(null)
            .appendField('do');
    }
};

Blockly.Blocks['procedures_mutatorcontainer'] = {
    init: function (this: Blockly.Block) {
        this.setColour(290);
        this.appendDummyInput().appendField("inputs");
        this.setNextStatement(true);
        this.contextMenu = false;
    }
};

Blockly.Blocks['procedures_defreturn'] = {
    init: function (this: Blockly.Block) {
        this.appendDummyInput()
            .appendField("to")
            .appendField(new Blockly.FieldTextInput("procedure"), "NAME");
        this.appendValueInput("RETURN")
            .setCheck(null)
            .appendField("result");
        this.setColour(290);
        this.setTooltip("Define a procedure that returns a value");
        this.setHelpUrl("");
        (this as any).arguments_ = [];
        this.setMutator(new Blockly.icons.MutatorIcon(['procedures_mutatorarg'], this));
        (this as any).arguments_ = [];
    },
    mutationToDom: function (this: Blockly.Block): Element {
        const self = this as any;
        const container = Blockly.utils.xml.createElement('mutation');
        for (let i = 0; i < self.arguments_.length; i++) {
            const parameter = Blockly.utils.xml.createElement('arg');
            parameter.setAttribute('name', self.arguments_[i]);
            container.appendChild(parameter);
        }
        return container;
    },
    domToMutation: function (this: Blockly.Block, xmlElement: Element) {
        const self = this as any;
        self.arguments_ = [];
        for (let i = 0, childNode: ChildNode | null; (childNode = xmlElement.childNodes[i]); i++) {
            if (childNode.nodeName.toLowerCase() === 'arg') {
                self.arguments_.push((childNode as Element).getAttribute('name'));
            }
        }
        self.updateParams_();
    },
    decompose: function (this: Blockly.Block, workspace: Blockly.Workspace) {
        const self = this as any;
        const containerBlock = workspace.newBlock('procedures_mutatorcontainer');
        containerBlock.initSvg();
        let connection = containerBlock.nextConnection;
        for (let i = 0; i < self.arguments_.length; i++) {
            const itemBlock = workspace.newBlock('procedures_mutatorarg');
            itemBlock.setFieldValue(self.arguments_[i], 'NAME');
            itemBlock.initSvg();
            if (connection) connection.connect(itemBlock.previousConnection);
            connection = itemBlock.nextConnection;
        }
        return containerBlock;
    },
    compose: function (this: Blockly.Block, containerBlock: Blockly.Block) {
        const self = this as any;
        self.arguments_ = [];
        let itemBlock = containerBlock.nextConnection?.targetBlock() || null;
        while (itemBlock && !itemBlock.isInsertionMarker()) {
            self.arguments_.push(itemBlock.getFieldValue('NAME'));
            itemBlock = itemBlock.nextConnection && itemBlock.nextConnection.targetBlock();
        }
        self.updateParams_();
    },
    updateParams_: function (this: Blockly.Block) {
        const self = this as any;
        for (let i = 0; this.getInput('ARG' + i); i++) {
            this.removeInput('ARG' + i);
        }
        if (this.getInput('RETURN')) {
            this.removeInput('RETURN');
        }
        for (let i = 0; i < self.arguments_.length; i++) {
            const input = this.appendDummyInput('ARG' + i);
            input.appendField(new Blockly.FieldTextInput(self.arguments_[i]), 'ARGNAME' + i);
        }
        this.appendValueInput('RETURN')
            .setCheck(null)
            .appendField('result');
    }
};

Blockly.Blocks['procedures_callnoreturn'] = {
    init: function (this: Blockly.Block) {
        this.appendDummyInput()
            .appendField("call")
            .appendField(new Blockly.FieldTextInput("procedure"), "NAME");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(290);
        this.setTooltip("Call a procedure");
        (this as any).arguments_ = [];
        this.setMutator(new Blockly.icons.MutatorIcon(['procedures_mutatorarg'], this));
    },
    mutationToDom: function (this: Blockly.Block): Element {
        const self = this as any;
        const container = Blockly.utils.xml.createElement('mutation');
        container.setAttribute('name', this.getFieldValue('NAME'));
        for (let i = 0; i < self.arguments_.length; i++) {
            const parameter = Blockly.utils.xml.createElement('arg');
            parameter.setAttribute('name', self.arguments_[i]);
            container.appendChild(parameter);
        }
        return container;
    },
    domToMutation: function (this: Blockly.Block, xmlElement: Element) {
        const self = this as any;
        const name = xmlElement.getAttribute('name');
        this.setFieldValue(name, 'NAME');
        self.arguments_ = [];
        for (let i = 0, childNode: ChildNode | null; (childNode = xmlElement.childNodes[i]); i++) {
            if (childNode.nodeName.toLowerCase() === 'arg') {
                self.arguments_.push((childNode as Element).getAttribute('name'));
            }
        }
        self.updateShape_();
    },
    updateShape_: function (this: Blockly.Block) {
        const self = this as any;
        for (let i = 0; this.getInput('ARG' + i); i++) {
            this.removeInput('ARG' + i);
        }
        for (let i = 0; i < self.arguments_.length; i++) {
            const input = this.appendValueInput('ARG' + i)
                .setCheck(null);
            input.appendField(self.arguments_[i]);
        }
    }
};

Blockly.Blocks['procedures_callreturn'] = {
    init: function (this: Blockly.Block) {
        this.appendDummyInput()
            .appendField("call")
            .appendField(new Blockly.FieldTextInput("procedure"), "NAME");
        this.setOutput(true, null);
        this.setColour(290);
        this.setTooltip("Call a procedure that returns a value");
        (this as any).arguments_ = [];
        this.setMutator(new Blockly.icons.MutatorIcon(['procedures_mutatorarg'], this));
    },
    mutationToDom: function (this: Blockly.Block): Element {
        const self = this as any;
        const container = Blockly.utils.xml.createElement('mutation');
        container.setAttribute('name', this.getFieldValue('NAME'));
        for (let i = 0; i < self.arguments_.length; i++) {
            const parameter = Blockly.utils.xml.createElement('arg');
            parameter.setAttribute('name', self.arguments_[i]);
            container.appendChild(parameter);
        }
        return container;
    },
    domToMutation: function (this: Blockly.Block, xmlElement: Element) {
        const self = this as any;
        const name = xmlElement.getAttribute('name');
        this.setFieldValue(name, 'NAME');
        self.arguments_ = [];
        for (let i = 0, childNode: ChildNode | null; (childNode = xmlElement.childNodes[i]); i++) {
            if (childNode.nodeName.toLowerCase() === 'arg') {
                self.arguments_.push((childNode as Element).getAttribute('name'));
            }
        }
        self.updateShape_();
    },
    updateShape_: function (this: Blockly.Block) {
        const self = this as any;
        for (let i = 0; this.getInput('ARG' + i); i++) {
            this.removeInput('ARG' + i);
        }
        for (let i = 0; i < self.arguments_.length; i++) {
            const input = this.appendValueInput('ARG' + i)
                .setCheck(null);
            input.appendField(self.arguments_[i]);
        }
    }
};

Blockly.Blocks['procedures_mutatorarg'] = {
    init: function (this: Blockly.Block) {
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

Blockly.Blocks['procedures_getarg'] = {
    init: function (this: Blockly.Block) {
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
