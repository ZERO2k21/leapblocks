/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * Complete Control Blocks - MIT App Inventor Style
 * Inspired by MIT App Inventor (Apache 2.0) - Original implementation
 */
import * as Blockly from 'blockly/core';
import { BLOCK_COLORS } from '../utils/blockColors';

// ==================== IF/THEN ====================
Blockly.Blocks['controls_if'] = {
    init: function () {
        this.appendValueInput('IF0')
            .setCheck('Boolean')
            .appendField('if');
        this.appendStatementInput('DO0')
            .appendField('then');
        this.setColour(BLOCK_COLORS.control);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setTooltip('If a condition is true, then do some statements.');
    }
};

// IF/THEN/ELSE
Blockly.Blocks['controls_if_else'] = {
    init: function () {
        this.appendValueInput('IF0')
            .setCheck('Boolean')
            .appendField('if');
        this.appendStatementInput('DO0')
            .appendField('then');
        this.appendStatementInput('ELSE')
            .appendField('else');
        this.setColour(BLOCK_COLORS.control);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setTooltip('If true, do first block. Otherwise, do second block.');
    }
};

// FOR EACH IN LIST
Blockly.Blocks['controls_forEach'] = {
    init: function () {
        this.appendValueInput('LIST')
            .setCheck('Array')
            .appendField('for each')
            .appendField(new Blockly.FieldVariable('item'), 'VAR')
            .appendField('in list');
        this.appendStatementInput('DO')
            .appendField('do');
        this.setColour(BLOCK_COLORS.control);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setTooltip('Runs blocks for each item in the list.');
    }
};

// FOR RANGE
Blockly.Blocks['controls_forRange'] = {
    init: function () {
        this.appendValueInput('START')
            .setCheck('Number')
            .appendField('for each')
            .appendField(new Blockly.FieldVariable('number'), 'VAR')
            .appendField('from');
        this.appendValueInput('END')
            .setCheck('Number')
            .appendField('to');
        this.appendValueInput('STEP')
            .setCheck('Number')
            .appendField('by');
        this.appendStatementInput('DO')
            .appendField('do');
        this.setColour(BLOCK_COLORS.control);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setTooltip('Runs blocks for each number in range.');
    }
};

// WHILE
Blockly.Blocks['controls_while'] = {
    init: function () {
        this.appendValueInput('TEST')
            .setCheck('Boolean')
            .appendField('while');
        this.appendStatementInput('DO')
            .appendField('do');
        this.setColour(BLOCK_COLORS.control);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setTooltip('Runs blocks while condition is true.');
    }
};

// CHOOSE (TERNARY)
Blockly.Blocks['controls_choose'] = {
    init: function () {
        this.appendValueInput('TEST')
            .setCheck('Boolean')
            .appendField('if');
        this.appendValueInput('THENRETURN')
            .appendField('then');
        this.appendValueInput('ELSERETURN')
            .appendField('else');
        this.setOutput(true, null);
        this.setColour(BLOCK_COLORS.control);
        this.setTooltip('Returns then-value if true, else-value if false.');
    }
};

// DO/RESULT
Blockly.Blocks['controls_do_then_return'] = {
    init: function () {
        this.appendStatementInput('STM')
            .appendField('do');
        this.appendValueInput('VALUE')
            .appendField('result');
        this.setOutput(true, null);
        this.setColour(BLOCK_COLORS.control);
        this.setTooltip('Runs blocks and returns a value.');
    }
};

// EVALUATE BUT IGNORE
Blockly.Blocks['controls_eval_but_ignore'] = {
    init: function () {
        this.appendValueInput('VALUE')
            .appendField('evaluate but ignore result');
        this.setColour(BLOCK_COLORS.control);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setTooltip('Evaluates expression but ignores return value.');
    }
};

// OPEN ANOTHER SCREEN
Blockly.Blocks['controls_openAnotherScreen'] = {
    init: function () {
        this.appendValueInput('SCREEN')
            .setCheck('String')
            .appendField('open another screen')
            .appendField('screenName');
        this.setColour(BLOCK_COLORS.control);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setTooltip('Opens another screen.');
    }
};

// OPEN SCREEN WITH START VALUE
Blockly.Blocks['controls_openAnotherScreenWithStartValue'] = {
    init: function () {
        this.appendValueInput('SCREENNAME')
            .setCheck('String')
            .appendField('open another screen with start value');
        this.appendValueInput('STARTVALUE')
            .appendField('startValue');
        this.setColour(BLOCK_COLORS.control);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setTooltip('Opens screen and passes a value.');
    }
};

// GET START VALUE
Blockly.Blocks['controls_getStartValue'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('get start value');
        this.setOutput(true, null);
        this.setColour(BLOCK_COLORS.control);
        this.setTooltip('Returns start value from opening screen.');
    }
};

// CLOSE SCREEN
Blockly.Blocks['controls_closeScreen'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('close screen');
        this.setColour(BLOCK_COLORS.control);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setTooltip('Closes current screen.');
    }
};

// CLOSE SCREEN WITH VALUE
Blockly.Blocks['controls_closeScreenWithValue'] = {
    init: function () {
        this.appendValueInput('RESULT')
            .appendField('close screen with value')
            .appendField('result');
        this.setColour(BLOCK_COLORS.control);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setTooltip('Closes screen and returns value.');
    }
};

// CLOSE APPLICATION
Blockly.Blocks['controls_closeApplication'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('close application');
        this.setColour(BLOCK_COLORS.control);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setTooltip('Closes the application.');
    }
};

// BREAK
Blockly.Blocks['controls_break'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('break');
        this.setColour(BLOCK_COLORS.control);
        this.setPreviousStatement(true, null);
        this.setTooltip('Breaks out of current loop.');
    }
};

export default {
    'controls_if': Blockly.Blocks['controls_if'],
    'controls_if_else': Blockly.Blocks['controls_if_else'],
    'controls_forEach': Blockly.Blocks['controls_forEach'],
    'controls_forRange': Blockly.Blocks['controls_forRange'],
    'controls_while': Blockly.Blocks['controls_while'],
    'controls_choose': Blockly.Blocks['controls_choose'],
    'controls_do_then_return': Blockly.Blocks['controls_do_then_return'],
    'controls_eval_but_ignore': Blockly.Blocks['controls_eval_but_ignore'],
    'controls_openAnotherScreen': Blockly.Blocks['controls_openAnotherScreen'],
    'controls_openAnotherScreenWithStartValue': Blockly.Blocks['controls_openAnotherScreenWithStartValue'],
    'controls_getStartValue': Blockly.Blocks['controls_getStartValue'],
    'controls_closeScreen': Blockly.Blocks['controls_closeScreen'],
    'controls_closeScreenWithValue': Blockly.Blocks['controls_closeScreenWithValue'],
    'controls_closeApplication': Blockly.Blocks['controls_closeApplication'],
    'controls_break': Blockly.Blocks['controls_break']
};
