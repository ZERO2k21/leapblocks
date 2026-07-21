import * as Blockly from 'blockly';
import { BLOCK_COLORS } from '../utils/blockColors';
export const LEAP_COLORS = BLOCK_COLORS;

// ============================================================================
// CONTROL BLOCKS
// ============================================================================

Blockly.Blocks['controls_if'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.control);
        this.appendValueInput('IF0')
            .setCheck('Boolean')
            .appendField('if');
        this.appendStatementInput('DO0')
            .appendField('then');
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip('If a condition is true, then do some blocks.');
        this.setMutator(new Blockly.icons.MutatorIcon(['controls_if_elseif', 'controls_if_else'], this));
        (this as any).elseifCount_ = 0;
        (this as any).elseCount_ = 0;
    },
    mutationToDom: function (this: Blockly.Block) {
        const self = this as any;
        if (!self.elseifCount_ && !self.elseCount_) return null;
        const container = Blockly.utils.xml.createElement('mutation');
        if (self.elseifCount_) container.setAttribute('elseif', self.elseifCount_);
        if (self.elseCount_) container.setAttribute('else', 1);
        return container;
    },
    domToMutation: function (this: Blockly.Block, xmlElement: Element) {
        const self = this as any;
        self.elseifCount_ = parseInt(xmlElement.getAttribute('elseif') as string, 10) || 0;
        self.elseCount_ = parseInt(xmlElement.getAttribute('else') as string, 10) || 0;
        self.updateShape_();
    },
    decompose: function (this: Blockly.Block, workspace: Blockly.Workspace) {
        const self = this as any;
        const containerBlock = workspace.newBlock('controls_if_if') as any;
        containerBlock.initSvg();
        let connection = containerBlock.nextConnection;
        for (let i = 1; i <= self.elseifCount_; i++) {
            const elseifBlock = workspace.newBlock('controls_if_elseif') as any;
            elseifBlock.initSvg();
            connection.connect(elseifBlock.previousConnection);
            connection = elseifBlock.nextConnection;
        }
        if (self.elseCount_) {
            const elseBlock = workspace.newBlock('controls_if_else') as any;
            elseBlock.initSvg();
            connection.connect(elseBlock.previousConnection);
        }
        return containerBlock;
    },
    compose: function (this: Blockly.Block, containerBlock: Blockly.Block) {
        const self = this as any;
        let clauseBlock = containerBlock.nextConnection && containerBlock.nextConnection.targetBlock() as any;
        self.elseifCount_ = 0;
        self.elseCount_ = 0;
        const valueConnections: any[] = [null];
        const statementConnections: any[] = [null];
        let elseStatementConnection: any = null;
        while (clauseBlock && !clauseBlock.isInsertionMarker()) {
            switch (clauseBlock.type) {
                case 'controls_if_elseif':
                    self.elseifCount_++;
                    valueConnections.push(clauseBlock.valueConnection_);
                    statementConnections.push(clauseBlock.statementConnection_);
                    break;
                case 'controls_if_else':
                    self.elseCount_++;
                    elseStatementConnection = clauseBlock.statementConnection_;
                    break;
                default:
                    throw TypeError('Unknown block type: ' + clauseBlock.type);
            }
            clauseBlock = clauseBlock.nextConnection && clauseBlock.nextConnection.targetBlock() as any;
        }
        self.updateShape_();
        self.reconnectChildBlocks_(valueConnections, statementConnections, elseStatementConnection);
    },
    saveConnections: function (this: Blockly.Block, containerBlock: Blockly.Block) {
        const self = this as any;
        let clauseBlock = containerBlock.nextConnection.targetBlock() as any;
        let i = 1;
        while (clauseBlock) {
            switch (clauseBlock.type) {
                case 'controls_if_elseif':
                    const inputIf = self.getInput('IF' + i);
                    const inputDo = self.getInput('DO' + i);
                    clauseBlock.valueConnection_ = inputIf && inputIf.connection.targetConnection;
                    clauseBlock.statementConnection_ = inputDo && inputDo.connection.targetConnection;
                    i++;
                    break;
                case 'controls_if_else':
                    const inputElse = self.getInput('ELSE');
                    clauseBlock.statementConnection_ = inputElse && inputElse.connection.targetConnection;
                    break;
                default:
                    throw TypeError('Unknown block type: ' + clauseBlock.type);
            }
            clauseBlock = clauseBlock.nextConnection && clauseBlock.nextConnection.targetBlock() as any;
        }
    },
    reconnectChildBlocks_: function (this: Blockly.Block, valueConnections: any[], statementConnections: any[], elseStatementConnection: any) {
        for (let i = 1; i <= (this as any).elseifCount_; i++) {
            if (valueConnections[i]) valueConnections[i].reconnect(this, 'IF' + i);
            if (statementConnections[i]) statementConnections[i].reconnect(this, 'DO' + i);
        }
        if (elseStatementConnection) elseStatementConnection.reconnect(this, 'ELSE');
    },
    updateShape_: function (this: Blockly.Block) {
        const self = this as any;
        if (self.getInput('ELSE')) self.removeInput('ELSE');
        let i = 1;
        while (self.getInput('IF' + i)) {
            self.removeInput('IF' + i);
            self.removeInput('DO' + i);
            i++;
        }
        for (let i = 1; i <= self.elseifCount_; i++) {
            self.appendValueInput('IF' + i).setCheck('Boolean').appendField('else if');
            self.appendStatementInput('DO' + i).appendField('then');
        }
        if (self.elseCount_) {
            self.appendStatementInput('ELSE').appendField('else');
        }
    }
};

Blockly.Blocks['controls_if_if'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.control);
        this.appendDummyInput().appendField('if');
        this.setNextStatement(true);
        this.contextMenu = false;
    }
};

Blockly.Blocks['controls_forRange'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.control);
        this.appendDummyInput()
            .appendField('for each')
            .appendField(new Blockly.FieldVariable('number'), 'VAR');
        this.appendValueInput('START')
            .setCheck('Number')
            .appendField('from')
            .setAlign(Blockly.inputs.Align.RIGHT);
        this.appendValueInput('END')
            .setCheck('Number')
            .appendField('to')
            .setAlign(Blockly.inputs.Align.RIGHT);
        this.appendValueInput('STEP')
            .setCheck('Number')
            .appendField('by')
            .setAlign(Blockly.inputs.Align.RIGHT);
        this.appendStatementInput('DO')
            .appendField('do');
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip('Count from a start number to an end number by a step value.');
    }
};

Blockly.Blocks['controls_forEach'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.control);
        this.appendValueInput('LIST')
            .setCheck('List')
            .appendField('for each')
            .appendField(new Blockly.FieldVariable('item'), 'VAR')
            .appendField('in list');
        this.appendStatementInput('DO')
            .appendField('do');
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip('Run blocks for each item in a list.');
    }
};

Blockly.Blocks['controls_forEachDict'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.control);
        this.appendValueInput('DICT')
            .setCheck('Dictionary')
            .appendField('for each')
            .appendField(new Blockly.FieldVariable('key'), 'KEY')
            .appendField(new Blockly.FieldVariable('value'), 'VALUE')
            .appendField('in dictionary');
        this.appendStatementInput('DO')
            .appendField('do');
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip('Run blocks for each key-value pair in a dictionary.');
    }
};

Blockly.Blocks['controls_while'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.control);
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

Blockly.Blocks['controls_choose'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.control);
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

Blockly.Blocks['controls_do_then_return'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.control);
        this.appendStatementInput('STM')
            .appendField('do');
        this.appendValueInput('VALUE')
            .appendField('result');
        this.setOutput(true);
        this.setTooltip('Runs the blocks in do and returns a result.');
    }
};

Blockly.Blocks['controls_eval_but_ignore'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.control);
        this.appendValueInput('VALUE')
            .appendField('evaluate but ignore result');
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip('Evaluates the block but ignores the return value.');
    }
};

Blockly.Blocks['controls_openAnotherScreen'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.control);
        this.appendValueInput('SCREEN')
            .setCheck('String')
            .appendField('open another screen')
            .appendField('screenName');
        this.setPreviousStatement(true);
        this.setTooltip('Opens another screen in the app.');
    }
};

Blockly.Blocks['controls_closeScreen'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.control);
        this.appendDummyInput()
            .appendField('close screen');
        this.setPreviousStatement(true);
        this.setTooltip('Closes the current screen.');
    }
};

Blockly.Blocks['controls_break'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.control);
        this.appendDummyInput()
            .appendField('break');
        this.setPreviousStatement(true);
        this.setTooltip('Break out of the current loop.');
    }
};

Blockly.Blocks['controls_openAnotherScreenWithStartValue'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.control);
        this.appendValueInput('SCREENNAME')
            .setCheck('String')
            .appendField('open another screen with start value')
            .appendField('screenName')
            .setAlign(Blockly.inputs.Align.RIGHT);
        this.appendValueInput('STARTVALUE')
            .appendField('startValue')
            .setAlign(Blockly.inputs.Align.RIGHT);
        this.setPreviousStatement(true);
        this.setTooltip('Opens another screen and passes a start value to it.');
    }
};

Blockly.Blocks['controls_getStartValue'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.control);
        this.appendDummyInput()
            .appendField('get start value');
        this.setOutput(true);
        this.setTooltip('Returns the start value given to the current screen.');
    }
};

Blockly.Blocks['controls_getPlainStartText'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.control);
        this.appendDummyInput()
            .appendField('get plain start text');
        this.setOutput(true, 'String');
        this.setTooltip('Returns the plain text that was passed to this screen when it was started by another app.');
    }
};

Blockly.Blocks['controls_closeScreenWithValue'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.control);
        this.appendValueInput('SCREEN')
            .appendField('close screen with value')
            .appendField('result')
            .setAlign(Blockly.inputs.Align.RIGHT);
        this.setPreviousStatement(true);
        this.setTooltip('Closes the current screen and returns a value to the screen that opened this one.');
    }
};

Blockly.Blocks['controls_closeScreenWithPlainText'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.control);
        this.appendValueInput('TEXT')
            .setCheck('String')
            .appendField('close screen with plain text')
            .appendField('text')
            .setAlign(Blockly.inputs.Align.RIGHT);
        this.setPreviousStatement(true);
        this.setTooltip('Closes the current screen and passes text to the app that opened this one.');
    }
};

Blockly.Blocks['controls_closeApplication'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.control);
        this.appendDummyInput()
            .appendField('close application');
        this.setPreviousStatement(true);
        this.setTooltip('Closes the application.');
    }
};

Blockly.Blocks['controls_for_each_dict'] = Blockly.Blocks['controls_forEachDict'];

Blockly.Blocks['logic_boolean'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.logic);
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown([['true', 'TRUE'], ['false', 'FALSE']]), 'BOOL');
        this.setOutput(true, 'Boolean');
        this.setTooltip('Returns either true or false.');
    }
};

Blockly.Blocks['logic_negate'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.logic);
        this.appendValueInput('BOOL')
            .setCheck('Boolean')
            .appendField('not');
        this.setOutput(true, 'Boolean');
        this.setTooltip('Returns true if the input is false. Returns false if the input is true.');
    }
};

Blockly.Blocks['logic_compare'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.logic);
        this.appendValueInput('A');
        this.appendValueInput('B')
            .appendField(new Blockly.FieldDropdown([
                ['=', 'EQ'],
                ['≠', 'NEQ']
            ]), 'OP');
        this.setInputsInline(true);
        this.setOutput(true, 'Boolean');
        this.setTooltip('Tests whether two things are equal.');
    }
};

Blockly.Blocks['logic_operation'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.logic);
        this.appendValueInput('A')
            .setCheck('Boolean');
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown([['and', 'AND'], ['or', 'OR']]), 'OP');
        this.appendValueInput('B')
            .setCheck('Boolean');
        this.setInputsInline(true);
        this.setOutput(true, 'Boolean');
        this.setTooltip('Returns true if both inputs are true (and) or if at least one input is true (or).');
    }
};

// ============================================================================
// MATH BLOCKS
// ============================================================================

Blockly.Blocks['math_number'] = {
    init: function (this: Blockly.Block) {
        this.setColour(LEAP_COLORS.math);
        this.appendDummyInput()
            .appendField(new Blockly.FieldNumber(0), 'NUM');
        this.setOutput(true, 'Number');
        this.setTooltip('A number.');
    }
};

Blockly.Blocks['math_add'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.math);
        this.appendValueInput('NUM0').setCheck('Number');
        this.appendValueInput('NUM1')
            .setCheck('Number')
            .appendField('+');
        this.setInputsInline(true);
        this.setOutput(true, 'Number');
        this.setTooltip('Return the sum of two or more numbers.');
        this.setMutator(new Blockly.icons.MutatorIcon(['math_mutator_item'], this));
        (this as any).itemCount_ = 2;
    },
    mutationToDom: function (this: Blockly.Block) {
        const container = Blockly.utils.xml.createElement('mutation');
        container.setAttribute('items', (this as any).itemCount_);
        return container;
    },
    domToMutation: function (this: Blockly.Block, xmlElement: Element) {
        (this as any).itemCount_ = parseInt(xmlElement.getAttribute('items') as string, 10) || 2;
        (this as any).updateShape_();
    },
    decompose: function (this: Blockly.Block, workspace: Blockly.Workspace) {
        const self = this as any;
        const containerBlock = workspace.newBlock('math_mutator_container') as any;
        containerBlock.initSvg();
        let connection = containerBlock.nextConnection;
        for (let i = 0; i < self.itemCount_; i++) {
            const itemBlock = workspace.newBlock('math_mutator_item') as any;
            itemBlock.initSvg();
            connection.connect(itemBlock.previousConnection);
            connection = itemBlock.nextConnection;
        }
        return containerBlock;
    },
    compose: function (this: Blockly.Block, containerBlock: Blockly.Block) {
        const self = this as any;
        let itemBlock = containerBlock.nextConnection.targetBlock() as any;
        const connections: any[] = [];
        while (itemBlock && !itemBlock.isInsertionMarker()) {
            connections.push(itemBlock.valueConnection_);
            itemBlock = itemBlock.nextConnection && itemBlock.nextConnection.targetBlock() as any;
        }
        self.itemCount_ = connections.length;
        self.updateShape_();
        for (let i = 0; i < self.itemCount_; i++) {
            if (connections[i]) connections[i].reconnect(this, 'NUM' + i);
        }
    },
    saveConnections: function (this: Blockly.Block, containerBlock: Blockly.Block) {
        const self = this as any;
        let itemBlock = containerBlock.nextConnection.targetBlock() as any;
        let i = 0;
        while (itemBlock) {
            const input = self.getInput('NUM' + i);
            itemBlock.valueConnection_ = input && input.connection.targetConnection;
            i++;
            itemBlock = itemBlock.nextConnection && itemBlock.nextConnection.targetBlock() as any;
        }
    },
    updateShape_: function (this: Blockly.Block) {
        const self = this as any;
        if (self.itemCount_ < 2) self.itemCount_ = 2;
        let i = 0;
        while (self.getInput('NUM' + i)) {
            self.removeInput('NUM' + i);
            i++;
        }
        for (let i = 0; i < self.itemCount_; i++) {
            const input = self.appendValueInput('NUM' + i).setCheck('Number');
            if (i > 0) {
                input.appendField('+');
            }
        }
    }
};

Blockly.Blocks['math_subtract'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.math);
        this.appendValueInput('A').setCheck('Number');
        this.appendValueInput('B').setCheck('Number').appendField('-');
        this.setInputsInline(true);
        this.setOutput(true, 'Number');
        this.setTooltip('Return the difference of two numbers.');
    }
};

Blockly.Blocks['math_multiply'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.math);
        this.appendValueInput('NUM0').setCheck('Number');
        this.appendValueInput('NUM1')
            .setCheck('Number')
            .appendField('×');
        this.setInputsInline(true);
        this.setOutput(true, 'Number');
        this.setTooltip('Return the product of two or more numbers.');
        this.setMutator(new Blockly.icons.MutatorIcon(['math_mutator_item'], this));
        (this as any).itemCount_ = 2;
    },
    mutationToDom: Blockly.Blocks['math_add'].mutationToDom,
    domToMutation: Blockly.Blocks['math_add'].domToMutation,
    decompose: Blockly.Blocks['math_add'].decompose,
    compose: Blockly.Blocks['math_add'].compose,
    saveConnections: Blockly.Blocks['math_add'].saveConnections,
    updateShape_: function (this: Blockly.Block) {
        const self = this as any;
        if (self.itemCount_ < 2) self.itemCount_ = 2;
        let i = 0;
        while (self.getInput('NUM' + i)) {
            self.removeInput('NUM' + i);
            i++;
        }
        for (let i = 0; i < self.itemCount_; i++) {
            const input = self.appendValueInput('NUM' + i).setCheck('Number');
            if (i > 0) {
                input.appendField('×');
            }
        }
    }
};

Blockly.Blocks['math_divide_regular'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.math);
        this.appendValueInput('A').setCheck('Number');
        this.appendValueInput('B').setCheck('Number').appendField('/');
        this.setInputsInline(true);
        this.setOutput(true, 'Number');
        this.setTooltip('Return the quotient of two numbers.');
    }
};

Blockly.Blocks['math_power'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.math);
        this.appendValueInput('A').setCheck('Number');
        this.appendValueInput('B').setCheck('Number').appendField('^');
        this.setInputsInline(true);
        this.setOutput(true, 'Number');
        this.setTooltip('Return the first number raised to the power of the second.');
    }
};

Blockly.Blocks['math_mutator_container'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.math);
        this.appendDummyInput().appendField('arithmetic');
        this.setNextStatement(true);
        this.contextMenu = false;
    }
};

Blockly.Blocks['math_bitwise'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.math);
        this.appendValueInput('A')
            .setCheck('Number')
            .appendField(new Blockly.FieldDropdown([
                ['bitwise and', 'AND'],
                ['bitwise or', 'OR'],
                ['bitwise xor', 'XOR']
            ]), 'OP');
        this.appendValueInput('B')
            .setCheck('Number');
        this.setInputsInline(true);
        this.setOutput(true, 'Number');
        this.setTooltip('Perform bitwise operation.');
    }
};

Blockly.Blocks['math_random_set_seed'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.math);
        this.appendValueInput('SEED')
            .setCheck('Number')
            .appendField('random set seed to');
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip('Set the seed for the random number generator.');
    }
};

Blockly.Blocks['math_single'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.math);
        this.appendValueInput('NUM')
            .setCheck('Number')
            .appendField(new Blockly.FieldDropdown([
                ['square root', 'ROOT'],
                ['absolute', 'ABS'],
                ['-', 'NEG'],
                ['log', 'LN'],
                ['e^', 'EXP'],
                ['round', 'ROUND'],
                ['ceiling', 'CEILING'],
                ['floor', 'FLOOR']
            ]), 'OP');
        this.setOutput(true, 'Number');
        this.setTooltip('Return the square root, absolute value, negation, natural logarithm, exponential, rounding of a number.');
    }
};

Blockly.Blocks['math_trig'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.math);
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

Blockly.Blocks['math_constant'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.math);
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

Blockly.Blocks['math_number_property'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.math);
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

Blockly.Blocks['math_round'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.math);
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

Blockly.Blocks['math_divide'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.math);
        this.appendValueInput('DIVIDEND')
            .setCheck('Number')
            .appendField(new Blockly.FieldDropdown([
                ['modulo of', 'MODULO'],
                ['remainder of', 'REMAINDER'],
                ['quotient of', 'QUOTIENT']
            ]), 'OP');
        this.appendValueInput('DIVISOR')
            .setCheck('Number')
            .appendField('÷');
        this.setInputsInline(true);
        this.setOutput(true, 'Number');
        this.setTooltip('Return the modulo, remainder, or quotient from dividing two numbers.');
    }
};

Blockly.Blocks['math_modulo'] = Blockly.Blocks['math_divide'];

Blockly.Blocks['math_random_int'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.math);
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

Blockly.Blocks['math_random_float'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.math);
        this.appendDummyInput()
            .appendField('random fraction');
        this.setOutput(true, 'Number');
        this.setTooltip('Return a random fraction between 0.0 (inclusive) and 1.0 (exclusive).');
    }
};

Blockly.Blocks['math_on_list'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.math);
        this.appendValueInput('A')
            .setCheck('Number')
            .appendField(new Blockly.FieldDropdown([
                ['min', 'MIN'],
                ['max', 'MAX']
            ]), 'OP');
        this.appendValueInput('B')
            .setCheck('Number');
        this.setInputsInline(true);
        this.setOutput(true, 'Number');
        this.setTooltip('Return the smallest or largest value of a set of numbers.');
    }
};

Blockly.Blocks['math_atan2'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.math);
        this.appendDummyInput()
            .appendField('atan2');
        this.appendValueInput('Y')
            .setCheck('Number')
            .appendField('y')
            .setAlign(Blockly.inputs.Align.RIGHT);
        this.appendValueInput('X')
            .setCheck('Number')
            .appendField('x')
            .setAlign(Blockly.inputs.Align.RIGHT);
        this.setInputsInline(false);
        this.setOutput(true, 'Number');
        this.setTooltip('Returns the arctangent of y/x, given y and x.');
    }
};

Blockly.Blocks['math_convert_angles'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.math);
        this.appendValueInput('NUM')
            .setCheck('Number')
            .appendField('convert')
            .appendField(new Blockly.FieldDropdown([
                ['radians to degrees', 'RADIANS_TO_DEGREES'],
                ['degrees to radians', 'DEGREES_TO_RADIANS']
            ]), 'OP');
        this.setOutput(true, 'Number');
        this.setTooltip('Convert between radians and degrees.');
    }
};

Blockly.Blocks['math_format_as_decimal'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.math);
        this.appendDummyInput()
            .appendField('format as decimal');
        this.appendValueInput('NUM')
            .setCheck('Number')
            .appendField('number')
            .setAlign(Blockly.inputs.Align.RIGHT);
        this.appendValueInput('PLACES')
            .setCheck('Number')
            .appendField('places')
            .setAlign(Blockly.inputs.Align.RIGHT);
        this.setInputsInline(false);
        this.setOutput(true, 'Number');
        this.setTooltip('Formats a number as a decimal with a given number of places after the decimal point.');
    }
};

Blockly.Blocks['math_is_a_number'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.math);
        this.appendValueInput('NUM')
            .appendField(new Blockly.FieldDropdown([
                ['is a number?', 'NUMBER'],
                ['is Base 10?', 'BASE10'],
                ['is hexadecimal?', 'HEXADECIMAL'],
                ['is binary?', 'BINARY']
            ]), 'OP');
        this.setOutput(true, 'Boolean');
        this.setTooltip('Tests whether the given value is a number.');
    }
};

Blockly.Blocks['math_convert_number'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.math);
        this.appendValueInput('NUM')
            .appendField('convert number')
            .appendField(new Blockly.FieldDropdown([
                ['dec to hex', 'DEC_TO_HEX'],
                ['hex to dec', 'HEX_TO_DEC'],
                ['dec to bin', 'DEC_TO_BIN'],
                ['bin to dec', 'BIN_TO_DEC']
            ]), 'OP');
        this.setOutput(true, 'String');
        this.setTooltip('Converts a number from one base to another.');
    }
};

Blockly.Blocks['math_number_radix'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.math);
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown([
                ['decimal', 'DEC'],
                ['binary', 'BIN'],
                ['octal', 'OCT'],
                ['hexadecimal', 'HEX']
            ]), 'BASE')
            .appendField(new Blockly.FieldTextInput('0'), 'NUM');
        this.setOutput(true, 'Number');
        this.setTooltip('A number in a specific base (decimal, binary, octal, or hexadecimal).');
    }
};

Blockly.Blocks['math_on_list2'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.math);
        this.appendValueInput('LIST')
            .setCheck('Array')
            .appendField(new Blockly.FieldDropdown([
                ['average', 'AVG'],
                ['min of list', 'MIN'],
                ['max of list', 'MAX'],
                ['geometric mean', 'GM'],
                ['standard deviation', 'SD'],
                ['standard error', 'SE']
            ]), 'OP');
        this.setOutput(true, 'Number');
        this.setTooltip('Performs a mathematical operation on all items in a list.');
    }
};

Blockly.Blocks['math_on_list_op'] = Blockly.Blocks['math_on_list2'];

Blockly.Blocks['math_mode_of_list'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.math);
        this.appendValueInput('LIST')
            .setCheck('Array')
            .appendField('mode of list');
        this.setOutput(true, 'Array');
        this.setTooltip('Returns a list of the modes (most frequently occurring values) in the given list.');
    }
};

Blockly.Blocks['math_compare'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.math);
        this.appendValueInput('A')
            .setCheck('Number');
        this.appendValueInput('B')
            .setCheck('Number')
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
        this.setTooltip('Compare two numbers.');
    }
};

// ============================================================================
// MUTATOR HELPER BLOCKS
// ============================================================================

Blockly.Blocks['controls_if_elseif'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.control);
        this.appendDummyInput()
            .appendField('else if');
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip('Add a condition to the if block.');
        this.contextMenu = false;
    }
};

Blockly.Blocks['controls_if_else'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.control);
        this.appendDummyInput()
            .appendField('else');
        this.setPreviousStatement(true);
        this.setTooltip('Add a final, catch-all condition to the if block.');
        this.contextMenu = false;
    }
};

Blockly.Blocks['math_mutator_item'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.math);
        this.appendDummyInput()
            .appendField('number');
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip('Add a number to the arithmetic operation.');
        this.contextMenu = false;
    }
};
