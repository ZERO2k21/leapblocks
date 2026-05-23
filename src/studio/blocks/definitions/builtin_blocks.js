/**
 * Leap App Inventor Built-in Blocks
 * All standard blocks that are always available
 */
import * as Blockly from 'blockly';

// Leap App Inventor Block Colors
// Leap App Inventor Block Colors from Utility
import { BLOCK_COLORS } from '../utils/blockColors';
export const MIT_COLORS = BLOCK_COLORS;

// ============================================================================
// CONTROL BLOCKS
// ============================================================================

// if block
Blockly.Blocks['controls_if'] = {
    init: function () {
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
        this.elseifCount_ = 0;
        this.elseCount_ = 0;
    },
    mutationToDom: function () {
        if (!this.elseifCount_ && !this.elseCount_) return null;
        const container = Blockly.utils.xml.createElement('mutation');
        if (this.elseifCount_) container.setAttribute('elseif', this.elseifCount_);
        if (this.elseCount_) container.setAttribute('else', 1);
        return container;
    },
    domToMutation: function (xmlElement) {
        this.elseifCount_ = parseInt(xmlElement.getAttribute('elseif'), 10) || 0;
        this.elseCount_ = parseInt(xmlElement.getAttribute('else'), 10) || 0;
        this.updateShape_();
    },
    decompose: function (workspace) {
        const containerBlock = workspace.newBlock('controls_if_if');
        containerBlock.initSvg();
        let connection = containerBlock.nextConnection;
        for (let i = 1; i <= this.elseifCount_; i++) {
            const elseifBlock = workspace.newBlock('controls_if_elseif');
            elseifBlock.initSvg();
            connection.connect(elseifBlock.previousConnection);
            connection = elseifBlock.nextConnection;
        }
        if (this.elseCount_) {
            const elseBlock = workspace.newBlock('controls_if_else');
            elseBlock.initSvg();
            connection.connect(elseBlock.previousConnection);
        }
        return containerBlock;
    },
    compose: function (containerBlock) {
        let clauseBlock = containerBlock.nextConnection.targetBlock();
        this.elseifCount_ = 0;
        this.elseCount_ = 0;
        const valueConnections = [null];
        const statementConnections = [null];
        let elseStatementConnection = null;
        while (clauseBlock && !clauseBlock.isInsertionMarker()) {
            switch (clauseBlock.type) {
                case 'controls_if_elseif':
                    this.elseifCount_++;
                    valueConnections.push(clauseBlock.valueConnection_);
                    statementConnections.push(clauseBlock.statementConnection_);
                    break;
                case 'controls_if_else':
                    this.elseCount_++;
                    elseStatementConnection = clauseBlock.statementConnection_;
                    break;
                default:
                    throw TypeError('Unknown block type: ' + clauseBlock.type);
            }
            clauseBlock = clauseBlock.nextConnection && clauseBlock.nextConnection.targetBlock();
        }
        this.updateShape_();
        // Reconnect any child blocks.
        this.reconnectChildBlocks_(valueConnections, statementConnections, elseStatementConnection);
    },
    saveConnections: function (containerBlock) {
        let clauseBlock = containerBlock.nextConnection.targetBlock();
        let i = 1;
        while (clauseBlock) {
            switch (clauseBlock.type) {
                case 'controls_if_elseif':
                    const inputIf = this.getInput('IF' + i);
                    const inputDo = this.getInput('DO' + i);
                    clauseBlock.valueConnection_ = inputIf && inputIf.connection.targetConnection;
                    clauseBlock.statementConnection_ = inputDo && inputDo.connection.targetConnection;
                    i++;
                    break;
                case 'controls_if_else':
                    const inputElse = this.getInput('ELSE');
                    clauseBlock.statementConnection_ = inputElse && inputElse.connection.targetConnection;
                    break;
                default:
                    throw TypeError('Unknown block type: ' + clauseBlock.type);
            }
            clauseBlock = clauseBlock.nextConnection && clauseBlock.nextConnection.targetBlock();
        }
    },
    reconnectChildBlocks_: function (valueConnections, statementConnections, elseStatementConnection) {
        for (let i = 1; i <= this.elseifCount_; i++) {
            if (valueConnections[i]) valueConnections[i].reconnect(this, 'IF' + i);
            if (statementConnections[i]) statementConnections[i].reconnect(this, 'DO' + i);
        }
        if (elseStatementConnection) elseStatementConnection.reconnect(this, 'ELSE');
    },
    updateShape_: function () {
        // Delete everything.
        if (this.getInput('ELSE')) this.removeInput('ELSE');
        let i = 1;
        while (this.getInput('IF' + i)) {
            this.removeInput('IF' + i);
            this.removeInput('DO' + i);
            i++;
        }
        // Rebuild block.
        for (let i = 1; i <= this.elseifCount_; i++) {
            this.appendValueInput('IF' + i).setCheck('Boolean').appendField('else if');
            this.appendStatementInput('DO' + i).appendField('then');
        }
        if (this.elseCount_) {
            this.appendStatementInput('ELSE').appendField('else');
        }
    }
};

// Internal block for if mutator
Blockly.Blocks['controls_if_if'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.control);
        this.appendDummyInput().appendField('if');
        this.setNextStatement(true);
        this.contextMenu = false;
    }
};

// for each number from/to/by block
Blockly.Blocks['controls_forRange'] = {
    init: function () {
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

// for each item in list block
Blockly.Blocks['controls_forEach'] = {
    init: function () {
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

// for each key with value in dictionary block
Blockly.Blocks['controls_forEachDict'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.control);
        this.appendValueInput('DICT')
            .setCheck('Dictionary')
            .appendField('for each')
            .appendField(new Blockly.FieldVariable('key'), 'KEY')
            .appendField('with')
            .appendField(new Blockly.FieldVariable('value'), 'VALUE')
            .appendField('in dictionary');
        this.appendStatementInput('DO')
            .appendField('do');
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip('Run blocks for each key-value pair in a dictionary.');
    }
};

// while block
Blockly.Blocks['controls_while'] = {
    init: function () {
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

// choose (ternary) block
Blockly.Blocks['controls_choose'] = {
    init: function () {
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

// do/result block
Blockly.Blocks['controls_do_then_return'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.control);
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
        this.setColour(BLOCK_COLORS.control);
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
        this.setColour(BLOCK_COLORS.control);
        this.appendValueInput('SCREEN')
            .setCheck('String')
            .appendField('open another screen')
            .appendField('screenName');
        this.setPreviousStatement(true);
        this.setTooltip('Opens another screen in the app.');
    }
};

// close screen block
Blockly.Blocks['controls_closeScreen'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.control);
        this.appendDummyInput()
            .appendField('close screen');
        this.setPreviousStatement(true);
        this.setTooltip('Closes the current screen.');
    }
};

// break block
Blockly.Blocks['controls_break'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.control);
        this.appendDummyInput()
            .appendField('break');
        this.setPreviousStatement(true);
        this.setTooltip('Break out of the current loop.');
    }
};

// open another screen with start value (MIT-style: no next statement — terminates flow)
Blockly.Blocks['controls_openAnotherScreenWithStartValue'] = {
    init: function () {
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

// get start value
Blockly.Blocks['controls_getStartValue'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.control);
        this.appendDummyInput()
            .appendField('get start value');
        this.setOutput(true);
        this.setTooltip('Returns the start value given to the current screen.');
    }
};

// get plain start text
Blockly.Blocks['controls_getPlainStartText'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.control);
        this.appendDummyInput()
            .appendField('get plain start text');
        this.setOutput(true, 'String');
        this.setTooltip('Returns the plain text that was passed to this screen when it was started by another app.');
    }
};

// close screen with value (MIT-style: terminates flow)
Blockly.Blocks['controls_closeScreenWithValue'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.control);
        this.appendValueInput('SCREEN')
            .appendField('close screen with value')
            .appendField('result')
            .setAlign(Blockly.inputs.Align.RIGHT);
        this.setPreviousStatement(true);
        this.setTooltip('Closes the current screen and returns a value to the screen that opened this one.');
    }
};

// close screen with plain text (MIT-style: terminates flow)
Blockly.Blocks['controls_closeScreenWithPlainText'] = {
    init: function () {
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

// close application
Blockly.Blocks['controls_closeApplication'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.control);
        this.appendDummyInput()
            .appendField('close application');
        this.setPreviousStatement(true);
        this.setTooltip('Closes the application.');
    }
};

// Alias for camelCase reference
Blockly.Blocks['controls_for_each_dict'] = Blockly.Blocks['controls_forEachDict'];

// true/false block
Blockly.Blocks['logic_boolean'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.logic);
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown([['true', 'TRUE'], ['false', 'FALSE']]), 'BOOL');
        this.setOutput(true, 'Boolean');
        this.setTooltip('Returns either true or false.');
    }
};

// not block
Blockly.Blocks['logic_negate'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.logic);
        this.appendValueInput('BOOL')
            .setCheck('Boolean')
            .appendField('not');
        this.setOutput(true, 'Boolean');
        this.setTooltip('Returns true if the input is false. Returns false if the input is true.');
    }
};

// comparison block (Logic category — only = and ≠, matching MIT)
Blockly.Blocks['logic_compare'] = {
    init: function () {
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

// and/or block
Blockly.Blocks['logic_operation'] = {
    init: function () {
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

// math_add block
Blockly.Blocks['math_add'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.math);
        this.appendValueInput('NUM0').setCheck('Number');
        this.appendValueInput('NUM1')
            .setCheck('Number')
            .appendField('+');
        this.setInputsInline(true);
        this.setOutput(true, 'Number');
        this.setTooltip('Return the sum of two or more numbers.');
        this.setMutator(new Blockly.icons.MutatorIcon(['math_mutator_item'], this));
        this.itemCount_ = 2;
    },
    mutationToDom: function () {
        const container = Blockly.utils.xml.createElement('mutation');
        container.setAttribute('items', this.itemCount_);
        return container;
    },
    domToMutation: function (xmlElement) {
        this.itemCount_ = parseInt(xmlElement.getAttribute('items'), 10) || 2;
        this.updateShape_();
    },
    decompose: function (workspace) {
        const containerBlock = workspace.newBlock('math_mutator_container');
        containerBlock.initSvg();
        let connection = containerBlock.nextConnection;
        for (let i = 0; i < this.itemCount_; i++) {
            const itemBlock = workspace.newBlock('math_mutator_item');
            itemBlock.initSvg();
            connection.connect(itemBlock.previousConnection);
            connection = itemBlock.nextConnection;
        }
        return containerBlock;
    },
    compose: function (containerBlock) {
        let itemBlock = containerBlock.nextConnection.targetBlock();
        const connections = [];
        while (itemBlock && !itemBlock.isInsertionMarker()) {
            connections.push(itemBlock.valueConnection_);
            itemBlock = itemBlock.nextConnection && itemBlock.nextConnection.targetBlock();
        }
        this.itemCount_ = connections.length;
        this.updateShape_();
        for (let i = 0; i < this.itemCount_; i++) {
            if (connections[i]) connections[i].reconnect(this, 'NUM' + i);
        }
    },
    saveConnections: function (containerBlock) {
        let itemBlock = containerBlock.nextConnection.targetBlock();
        let i = 0;
        while (itemBlock) {
            const input = this.getInput('NUM' + i);
            itemBlock.valueConnection_ = input && input.connection.targetConnection;
            i++;
            itemBlock = itemBlock.nextConnection && itemBlock.nextConnection.targetBlock();
        }
    },
    updateShape_: function () {
        if (this.itemCount_ < 2) this.itemCount_ = 2;
        let i = 0;
        while (this.getInput('NUM' + i)) {
            this.removeInput('NUM' + i);
            i++;
        }
        for (let i = 0; i < this.itemCount_; i++) {
            const input = this.appendValueInput('NUM' + i).setCheck('Number');
            if (i > 0) {
                input.appendField('+');
            }
        }
    }
};

// math_subtract block
Blockly.Blocks['math_subtract'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.math);
        this.appendValueInput('A').setCheck('Number');
        this.appendValueInput('B').setCheck('Number').appendField('-');
        this.setInputsInline(true);
        this.setOutput(true, 'Number');
        this.setTooltip('Return the difference of two numbers.');
    }
};

// math_multiply block
Blockly.Blocks['math_multiply'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.math);
        this.appendValueInput('NUM0').setCheck('Number');
        this.appendValueInput('NUM1')
            .setCheck('Number')
            .appendField('×');
        this.setInputsInline(true);
        this.setOutput(true, 'Number');
        this.setTooltip('Return the product of two or more numbers.');
        this.setMutator(new Blockly.icons.MutatorIcon(['math_mutator_item'], this));
        this.itemCount_ = 2;
    },
    mutationToDom: Blockly.Blocks['math_add'].mutationToDom,
    domToMutation: Blockly.Blocks['math_add'].domToMutation,
    decompose: Blockly.Blocks['math_add'].decompose,
    compose: Blockly.Blocks['math_add'].compose,
    saveConnections: Blockly.Blocks['math_add'].saveConnections,
    updateShape_: function () {
        if (this.itemCount_ < 2) this.itemCount_ = 2;
        let i = 0;
        while (this.getInput('NUM' + i)) {
            this.removeInput('NUM' + i);
            i++;
        }
        for (let i = 0; i < this.itemCount_; i++) {
            const input = this.appendValueInput('NUM' + i).setCheck('Number');
            if (i > 0) {
                input.appendField('×');
            }
        }
    }
};

// math_divide_appinv block (name it math_divide_appinv because math_divide is used for quotient/modulo/remainder)
// Actually, wait, let me check builtin_blocks.js for math_divide!

Blockly.Blocks['math_divide_regular'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.math);
        this.appendValueInput('A').setCheck('Number');
        this.appendValueInput('B').setCheck('Number').appendField('/');
        this.setInputsInline(true);
        this.setOutput(true, 'Number');
        this.setTooltip('Return the quotient of two numbers.');
    }
};

Blockly.Blocks['math_power'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.math);
        this.appendValueInput('A').setCheck('Number');
        this.appendValueInput('B').setCheck('Number').appendField('^');
        this.setInputsInline(true);
        this.setOutput(true, 'Number');
        this.setTooltip('Return the first number raised to the power of the second.');
    }
};

Blockly.Blocks['math_mutator_container'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.math);
        this.appendDummyInput().appendField('arithmetic');
        this.setNextStatement(true);
        this.contextMenu = false;
    }
};

// bitwise block
Blockly.Blocks['math_bitwise'] = {
    init: function () {
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

// random set seed block
Blockly.Blocks['math_random_set_seed'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.math);
        this.appendValueInput('SEED')
            .setCheck('Number')
            .appendField('random set seed to');
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip('Set the seed for the random number generator.');
    }
};

// single operation block (sqrt, abs, neg, ln, exp, round, ceiling, floor — matches MIT)
Blockly.Blocks['math_single'] = {
    init: function () {
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

// trig block
Blockly.Blocks['math_trig'] = {
    init: function () {
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

// constant block
Blockly.Blocks['math_constant'] = {
    init: function () {
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

// number property block
Blockly.Blocks['math_number_property'] = {
    init: function () {
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

// round block
Blockly.Blocks['math_round'] = {
    init: function () {
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

// modulo/remainder/quotient (unified block matching MIT's math_divide)
Blockly.Blocks['math_divide'] = {
    init: function () {
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

// Keep math_modulo as an alias for backwards compatibility
Blockly.Blocks['math_modulo'] = Blockly.Blocks['math_divide'];

// random integer block
Blockly.Blocks['math_random_int'] = {
    init: function () {
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

// random fraction block
Blockly.Blocks['math_random_float'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.math);
        this.appendDummyInput()
            .appendField('random fraction');
        this.setOutput(true, 'Number');
        this.setTooltip('Return a random fraction between 0.0 (inclusive) and 1.0 (exclusive).');
    }
};

// min/max block (mutator for multiple values)
Blockly.Blocks['math_on_list'] = {
    init: function () {
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

// atan2 block (MIT-style: header label + separate y / x value inputs)
Blockly.Blocks['math_atan2'] = {
    init: function () {
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

// convert radians to degrees / degrees to radians (MIT-style: "convert" label + dropdown)
Blockly.Blocks['math_convert_angles'] = {
    init: function () {
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

// format as decimal (MIT-style: "format as decimal" header + number/places inputs)
Blockly.Blocks['math_format_as_decimal'] = {
    init: function () {
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

// is a number? (MIT-style: dropdown with 4 options)
Blockly.Blocks['math_is_a_number'] = {
    init: function () {
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

// convert number (MIT-style: single directional dropdown)
Blockly.Blocks['math_convert_number'] = {
    init: function () {
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

// radix number
Blockly.Blocks['math_number_radix'] = {
    init: function () {
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

// list math operations — MIT's math_on_list2 (takes a LIST as input)
Blockly.Blocks['math_on_list2'] = {
    init: function () {
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
// Keep old name as alias for backwards compatibility
Blockly.Blocks['math_on_list_op'] = Blockly.Blocks['math_on_list2'];

// Mode of list (MIT has this as a separate standalone block)
Blockly.Blocks['math_mode_of_list'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.math);
        this.appendValueInput('LIST')
            .setCheck('Array')
            .appendField('mode of list');
        this.setOutput(true, 'Array');
        this.setTooltip('Returns a list of the modes (most frequently occurring values) in the given list.');
    }
};

// math_compare — MIT's Math comparison block (6 operators: =, ≠, <, ≤, >, ≥)
Blockly.Blocks['math_compare'] = {
    init: function () {
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
// MUTATOR HELPER BLOCKS (for IF and MATH)
// ============================================================================

Blockly.Blocks['controls_if_elseif'] = {
    init: function () {
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
    init: function () {
        this.setColour(BLOCK_COLORS.control);
        this.appendDummyInput()
            .appendField('else');
        this.setPreviousStatement(true);
        this.setTooltip('Add a final, catch-all condition to the if block.');
        this.contextMenu = false;
    }
};

Blockly.Blocks['math_mutator_item'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.math);
        this.appendDummyInput()
            .appendField('number');
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip('Add a number to the arithmetic operation.');
        this.contextMenu = false;
    }
};

