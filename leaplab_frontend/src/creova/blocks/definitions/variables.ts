import * as Blockly from 'blockly';

Blockly.Blocks['global_declaration'] = {
    init: function (this: Blockly.Block) {
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

Blockly.Blocks['lexical_variable_get'] = {
    init: function (this: Blockly.Block) {
        this.appendDummyInput()
            .appendField("get")
            .appendField(new Blockly.FieldVariable("variable"), "VAR");
        this.setOutput(true, null);
        this.setColour(100);
        this.setTooltip("Get the value of a variable");
    }
};

Blockly.Blocks['lexical_variable_set'] = {
    init: function (this: Blockly.Block) {
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

Blockly.Blocks['local_declaration_statement'] = {
    init: function (this: Blockly.Block) {
        this.appendValueInput("DECL")
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
        (this as any).localCount_ = 1;
    },
    mutationToDom: function (this: Blockly.Block): Element {
        const self = this as any;
        const container = Blockly.utils.xml.createElement('mutation');
        for (let i = 0; i < self.localCount_; i++) {
            const localName = this.getFieldValue('VAR' + i) || 'name';
            const child = Blockly.utils.xml.createElement('localname');
            child.setAttribute('name', localName);
            container.appendChild(child);
        }
        return container;
    },
    domToMutation: function (this: Blockly.Block, xmlElement: Element) {
        const self = this as any;
        const localNames: string[] = [];
        for (let i = 0, child: ChildNode | null; (child = xmlElement.childNodes[i]); i++) {
            if (child.nodeName && child.nodeName.toLowerCase() === 'localname') {
                localNames.push((child as Element).getAttribute('name') || '');
            }
        }
        self.localCount_ = localNames.length || parseInt(xmlElement.getAttribute('locals') || '10', 10) || 1;
        self.updateShape_();
        for (let i = 0; i < localNames.length; i++) {
            const field = this.getField('VAR' + i);
            if (field && localNames[i]) {
                field.setValue(localNames[i]);
            }
        }
    },
    decompose: function (this: Blockly.Block, workspace: Blockly.Workspace) {
        const self = this as any;
        const containerBlock = workspace.newBlock('local_declaration_container');
        containerBlock.initSvg();
        let connection = containerBlock.nextConnection;
        for (let i = 0; i < self.localCount_; i++) {
            const itemBlock = workspace.newBlock('local_declaration_item');
            itemBlock.initSvg();
            if (connection) connection.connect(itemBlock.previousConnection);
            connection = itemBlock.nextConnection;
        }
        return containerBlock;
    },
    compose: function (this: Blockly.Block, containerBlock: Blockly.Block) {
        const self = this as any;
        let itemBlock = containerBlock.nextConnection?.targetBlock() || null;
        const connections: Array<Blockly.Connection | null> = [];
        while (itemBlock && !itemBlock.isInsertionMarker()) {
            connections.push((itemBlock as any).valueConnection_);
            itemBlock = itemBlock.nextConnection && itemBlock.nextConnection.targetBlock();
        }
        self.localCount_ = connections.length;
        self.updateShape_();
        for (let i = 0; i < self.localCount_; i++) {
            const inputName = i === 0 ? 'DECL' : 'DECL' + i;
            if (connections[i]) connections[i].reconnect(this, inputName);
        }
    },
    saveConnections: function (this: Blockly.Block, containerBlock: Blockly.Block) {
        let itemBlock = containerBlock.nextConnection?.targetBlock() || null;
        let i = 0;
        while (itemBlock) {
            const inputName = i === 0 ? 'DECL' : 'DECL' + i;
            const input = this.getInput(inputName);
            (itemBlock as any).valueConnection_ = input && input.connection?.targetConnection;
            i++;
            itemBlock = itemBlock.nextConnection && itemBlock.nextConnection.targetBlock();
        }
    },
    updateShape_: function (this: Blockly.Block) {
        const self = this as any;
        for (let i = 0; this.getInput('DECL' + i); i++) {
            this.removeInput('DECL' + i);
        }
        if (this.getInput('DECL')) {
            this.removeInput('DECL');
        }
        if (this.getInput('STACK')) {
            this.removeInput('STACK');
        }
        for (let i = 0; i < self.localCount_; i++) {
            const inputName = i === 0 ? 'DECL' : 'DECL' + i;
            const input = this.appendValueInput(inputName).setCheck(null);
            if (i === 0) {
                input.appendField('initialize local');
            }
            input.appendField(new Blockly.FieldTextInput('name'), 'VAR' + i)
                .appendField('to');
        }
        this.appendStatementInput('STACK')
            .setCheck(null)
            .appendField('in');
    }
};

Blockly.Blocks['local_declaration_container'] = {
    init: function (this: Blockly.Block) {
        this.setColour(100);
        this.appendDummyInput().appendField("local declarations");
        this.setNextStatement(true);
        this.contextMenu = false;
    }
};

Blockly.Blocks['local_declaration_expression'] = {
    init: function (this: Blockly.Block) {
        this.appendValueInput("DECL")
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
        (this as any).localCount_ = 1;
    },
    mutationToDom: function (this: Blockly.Block): Element {
        const self = this as any;
        const container = Blockly.utils.xml.createElement('mutation');
        for (let i = 0; i < self.localCount_; i++) {
            const localName = this.getFieldValue('VAR' + i) || 'name';
            const child = Blockly.utils.xml.createElement('localname');
            child.setAttribute('name', localName);
            container.appendChild(child);
        }
        return container;
    },
    domToMutation: function (this: Blockly.Block, xmlElement: Element) {
        const self = this as any;
        const localNames: string[] = [];
        for (let i = 0, child: ChildNode | null; (child = xmlElement.childNodes[i]); i++) {
            if (child.nodeName && child.nodeName.toLowerCase() === 'localname') {
                localNames.push((child as Element).getAttribute('name') || '');
            }
        }
        self.localCount_ = localNames.length || parseInt(xmlElement.getAttribute('locals') || '10', 10) || 1;
        self.updateShape_();
        for (let i = 0; i < localNames.length; i++) {
            const field = this.getField('VAR' + i);
            if (field && localNames[i]) {
                field.setValue(localNames[i]);
            }
        }
    },
    decompose: function (this: Blockly.Block, workspace: Blockly.Workspace) {
        const self = this as any;
        const containerBlock = workspace.newBlock('local_declaration_container');
        containerBlock.initSvg();
        let connection = containerBlock.nextConnection;
        for (let i = 0; i < self.localCount_; i++) {
            const itemBlock = workspace.newBlock('local_declaration_item');
            itemBlock.initSvg();
            if (connection) connection.connect(itemBlock.previousConnection);
            connection = itemBlock.nextConnection;
        }
        return containerBlock;
    },
    compose: function (this: Blockly.Block, containerBlock: Blockly.Block) {
        const self = this as any;
        let itemBlock = containerBlock.nextConnection?.targetBlock() || null;
        const connections: Array<Blockly.Connection | null> = [];
        while (itemBlock && !itemBlock.isInsertionMarker()) {
            connections.push((itemBlock as any).valueConnection_);
            itemBlock = itemBlock.nextConnection && itemBlock.nextConnection.targetBlock();
        }
        self.localCount_ = connections.length;
        self.updateShape_();
        for (let i = 0; i < self.localCount_; i++) {
            const inputName = i === 0 ? 'DECL' : 'DECL' + i;
            if (connections[i]) connections[i].reconnect(this, inputName);
        }
    },
    saveConnections: function (this: Blockly.Block, containerBlock: Blockly.Block) {
        let itemBlock = containerBlock.nextConnection?.targetBlock() || null;
        let i = 0;
        while (itemBlock) {
            const inputName = i === 0 ? 'DECL' : 'DECL' + i;
            const input = this.getInput(inputName);
            (itemBlock as any).valueConnection_ = input && input.connection?.targetConnection;
            i++;
            itemBlock = itemBlock.nextConnection && itemBlock.nextConnection.targetBlock();
        }
    },
    updateShape_: function (this: Blockly.Block) {
        const self = this as any;
        for (let i = 0; this.getInput('DECL' + i); i++) {
            this.removeInput('DECL' + i);
        }
        if (this.getInput('DECL')) {
            this.removeInput('DECL');
        }
        if (this.getInput('RETURN')) {
            this.removeInput('RETURN');
        }
        for (let i = 0; i < self.localCount_; i++) {
            const inputName = i === 0 ? 'DECL' : 'DECL' + i;
            const input = this.appendValueInput(inputName).setCheck(null);
            if (i === 0) {
                input.appendField('initialize local');
            }
            input.appendField(new Blockly.FieldTextInput('name'), 'VAR' + i)
                .appendField('to');
        }
        this.appendValueInput('RETURN')
            .setCheck(null)
            .appendField('in');
    }
};

Blockly.Blocks['local_declaration_item'] = {
    init: function (this: Blockly.Block) {
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
