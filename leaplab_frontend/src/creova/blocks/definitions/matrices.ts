import * as Blockly from 'blockly';
import { BLOCK_COLORS } from '../utils/blockColors';

Blockly.Blocks['matrices_create_2d'] = {
    init: function (this: Blockly.Block) {
        this.appendDummyInput()
            .appendField("create 2D matrix with size")
            .appendField(new Blockly.FieldNumber(2, 1), "ROWS")
            .appendField("×")
            .appendField(new Blockly.FieldNumber(2, 1), "COLS");
        this.appendDummyInput("DATA");
        this.setColour(BLOCK_COLORS.matrices);
        this.setOutput(true, "Matrix");
        this.setTooltip("Create a 2D matrix with specified dimensions.");
        (this as any).updateShape_();
    },
    updateShape_: function (this: Blockly.Block) {
    }
};

Blockly.Blocks['matrices_create_with_dimensions'] = {
    init: function (this: Blockly.Block) {
        this.appendValueInput("DIMENSIONS")
            .setCheck("List")
            .appendField("create matrix with dimension list");
        this.appendValueInput("INITIAL_VALUE")
            .appendField("initialized with value");
        this.setColour(BLOCK_COLORS.matrices);
        this.setOutput(true, "Matrix");
        this.setTooltip("Create a matrix with dimensions specified in a list.");
    }
};

Blockly.Blocks['matrices_get_cell'] = {
    init: function (this: Blockly.Block) {
        this.appendValueInput("MATRIX")
            .setCheck("Matrix")
            .appendField("get matrix cell")
            .appendField("matrix");
        this.appendValueInput("DIM1")
            .setCheck("Number")
            .appendField("dim1");
        this.appendValueInput("DIM2")
            .setCheck("Number")
            .appendField("dim2");
        this.setColour(BLOCK_COLORS.matrices);
        this.setOutput(true, null);
        this.setTooltip("Get value from a matrix cell.");
    }
};

Blockly.Blocks['matrices_set_cell'] = {
    init: function (this: Blockly.Block) {
        this.appendValueInput("MATRIX")
            .setCheck("Matrix")
            .appendField("set matrix cell")
            .appendField("matrix");
        this.appendValueInput("VALUE")
            .appendField("value");
        this.appendValueInput("DIM1")
            .setCheck("Number")
            .appendField("dim1");
        this.appendValueInput("DIM2")
            .setCheck("Number")
            .appendField("dim2");
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setColour(BLOCK_COLORS.matrices);
        this.setTooltip("Set value of a matrix cell.");
    }
};

Blockly.Blocks['matrices_get_row'] = {
    init: function (this: Blockly.Block) {
        this.appendValueInput("MATRIX")
            .setCheck("Matrix")
            .appendField("get matrix row")
            .appendField("matrix");
        this.appendValueInput("INDEX")
            .setCheck("Number")
            .appendField("row index");
        this.setColour(BLOCK_COLORS.matrices);
        this.setOutput(true, "List");
        this.setTooltip("Get a specific row from the matrix.");
    }
};

Blockly.Blocks['matrices_get_column'] = {
    init: function (this: Blockly.Block) {
        this.appendValueInput("MATRIX")
            .setCheck("Matrix")
            .appendField("get matrix column")
            .appendField("matrix");
        this.appendValueInput("INDEX")
            .setCheck("Number")
            .appendField("column index");
        this.setColour(BLOCK_COLORS.matrices);
        this.setOutput(true, "List");
        this.setTooltip("Get a specific column from the matrix.");
    }
};

Blockly.Blocks['matrices_get_dimensions'] = {
    init: function (this: Blockly.Block) {
        this.appendValueInput("MATRIX")
            .setCheck("Matrix")
            .appendField("get matrix dimensions")
            .appendField("matrix");
        this.setColour(BLOCK_COLORS.matrices);
        this.setOutput(true, "List");
        this.setTooltip("Get dimensions of the matrix as a list.");
    }
};

Blockly.Blocks['matrices_add'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.matrices);
        this.appendValueInput('NUM0').setCheck(['Matrix', 'Number']);
        this.appendValueInput('NUM1')
            .setCheck(['Matrix', 'Number'])
            .appendField('+');
        this.setInputsInline(true);
        this.setOutput(true, 'Matrix');
        this.setTooltip('Return the sum of two or more matrices.');
        this.setMutator(new Blockly.icons.MutatorIcon(['math_mutator_item'], this));
        (this as any).itemCount_ = 2;
    },
    mutationToDom: function (this: Blockly.Block): Element {
        const container = Blockly.utils.xml.createElement('mutation');
        container.setAttribute('items', String((this as any).itemCount_));
        return container;
    },
    domToMutation: function (this: Blockly.Block, xmlElement: Element) {
        (this as any).itemCount_ = parseInt(xmlElement.getAttribute('items') || '10', 10) || 2;
        (this as any).updateShape_();
    },
    decompose: function (this: Blockly.Block, workspace: Blockly.Workspace) {
        const self = this as any;
        const containerBlock = workspace.newBlock('math_mutator_container');
        containerBlock.initSvg();
        let connection = containerBlock.nextConnection;
        for (let i = 0; i < self.itemCount_; i++) {
            const itemBlock = workspace.newBlock('math_mutator_item');
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
        self.itemCount_ = connections.length;
        self.updateShape_();
        for (let i = 0; i < self.itemCount_; i++) {
            if (connections[i]) {
                connections[i].reconnect(this, 'NUM' + i);
            }
        }
    },
    saveConnections: function (this: Blockly.Block, containerBlock: Blockly.Block) {
        let itemBlock = containerBlock.nextConnection?.targetBlock() || null;
        let i = 0;
        while (itemBlock) {
            const input = this.getInput('NUM' + i);
            (itemBlock as any).valueConnection_ = input && input.connection?.targetConnection;
            i++;
            itemBlock = itemBlock.nextConnection && itemBlock.nextConnection.targetBlock();
        }
    },
    updateShape_: function (this: Blockly.Block) {
        const self = this as any;
        if (self.itemCount_ < 2) self.itemCount_ = 2;
        let i = 0;
        while (this.getInput('NUM' + i)) {
            this.removeInput('NUM' + i);
            i++;
        }
        for (let i = 0; i < self.itemCount_; i++) {
            const input = this.appendValueInput('NUM' + i).setCheck(['Matrix', 'Number']);
            if (i > 0) {
                input.appendField('+');
            }
        }
    }
};

Blockly.Blocks['matrices_subtract'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.matrices);
        this.appendValueInput('A').setCheck(['Matrix', 'Number']);
        this.appendValueInput('B').setCheck(['Matrix', 'Number']).appendField('-');
        this.setInputsInline(true);
        this.setOutput(true, 'Matrix');
        this.setTooltip('Return the difference of two matrices.');
    }
};

Blockly.Blocks['matrices_multiply'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.matrices);
        this.appendValueInput('NUM0').setCheck(['Matrix', 'Number']);
        this.appendValueInput('NUM1')
            .setCheck(['Matrix', 'Number'])
            .appendField('×');
        this.setInputsInline(true);
        this.setOutput(true, 'Matrix');
        this.setTooltip('Return the product of two or more matrices.');
        this.setMutator(new Blockly.icons.MutatorIcon(['math_mutator_item'], this));
        (this as any).itemCount_ = 2;
    },
    mutationToDom: Blockly.Blocks['matrices_add'].mutationToDom,
    domToMutation: Blockly.Blocks['matrices_add'].domToMutation,
    decompose: Blockly.Blocks['matrices_add'].decompose,
    compose: Blockly.Blocks['matrices_add'].compose,
    saveConnections: Blockly.Blocks['matrices_add'].saveConnections,
    updateShape_: function (this: Blockly.Block) {
        const self = this as any;
        if (self.itemCount_ < 2) self.itemCount_ = 2;
        let i = 0;
        while (this.getInput('NUM' + i)) {
            this.removeInput('NUM' + i);
            i++;
        }
        for (let i = 0; i < self.itemCount_; i++) {
            const input = this.appendValueInput('NUM' + i).setCheck(['Matrix', 'Number']);
            if (i > 0) {
                input.appendField('×');
            }
        }
    }
};

Blockly.Blocks['matrices_power'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.matrices);
        this.appendValueInput('A').setCheck(['Matrix', 'Number']);
        this.appendValueInput('B').setCheck(['Matrix', 'Number']).appendField('^');
        this.setInputsInline(true);
        this.setOutput(true, 'Matrix');
        this.setTooltip('Return the first matrix raised to the power of the second.');
    }
};

Blockly.Blocks['matrices_operation'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.matrices);
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown([
                ['inverse', 'INVERSE'],
                ['transpose', 'TRANSPOSE'],
                ['rotate left', 'ROTATE_LEFT'],
                ['rotate right', 'ROTATE_RIGHT']
            ]), 'OP');
        this.appendValueInput('MATRIX').setCheck('Matrix');
        this.setInputsInline(true);
        this.setOutput(true, 'Matrix');
        this.setTooltip('Perform operation on a matrix.');
    }
};

Blockly.Blocks['matrices_is_matrix'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.matrices);
        this.appendDummyInput().appendField('is a matrix?');
        this.appendValueInput('MATRIX');
        this.setInputsInline(true);
        this.setOutput(true, 'Boolean');
        this.setTooltip('Check if the input is a matrix.');
    }
};

export default {
    'matrices_create_2d': Blockly.Blocks['matrices_create_2d'],
    'matrices_create_with_dimensions': Blockly.Blocks['matrices_create_with_dimensions'],
    'matrices_get_cell': Blockly.Blocks['matrices_get_cell'],
    'matrices_set_cell': Blockly.Blocks['matrices_set_cell'],
    'matrices_get_row': Blockly.Blocks['matrices_get_row'],
    'matrices_get_column': Blockly.Blocks['matrices_get_column'],
    'matrices_get_dimensions': Blockly.Blocks['matrices_get_dimensions'],
    'matrices_add': Blockly.Blocks['matrices_add'],
    'matrices_subtract': Blockly.Blocks['matrices_subtract'],
    'matrices_multiply': Blockly.Blocks['matrices_multiply'],
    'matrices_power': Blockly.Blocks['matrices_power'],
    'matrices_operation': Blockly.Blocks['matrices_operation'],
    'matrices_is_matrix': Blockly.Blocks['matrices_is_matrix']
};
