/**
 * MIT App Inventor Dictionary Blocks
 */
import * as Blockly from 'blockly';
import { BLOCK_COLORS } from '../utils/blockColors';

// make a dictionary block
Blockly.Blocks['dictionaries_create_with'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.lists); // MIT uses same color for lists and dictionaries mostly or similar shades
        this.appendDummyInput()
            .appendField('make a dictionary');
        this.setOutput(true, 'Dictionary');
        this.setTooltip('Create a dictionary with pairs.');
    }
};

// make a pair block
Blockly.Blocks['dictionaries_pair'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.lists);
        this.appendValueInput('KEY')
            .appendField('make a pair');
        this.appendValueInput('VALUE')
            .appendField('key')
            .appendField('value');
        this.setOutput(true, 'Pair');
        this.setTooltip('Create a key-value pair for a dictionary.');
    }
};

// set value for key block
Blockly.Blocks['dictionaries_set_pair'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.lists);
        this.appendValueInput('DICT')
            .setCheck('Dictionary')
            .appendField('set value for key');
        this.appendValueInput('KEY')
            .appendField('dictionary')
            .appendField('key');
        this.appendValueInput('VALUE')
            .appendField('value');
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip('Sets the value for a key in a dictionary.');
    }
};

// delete entry for key block
Blockly.Blocks['dictionaries_delete_pair'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.lists);
        this.appendValueInput('DICT')
            .setCheck('Dictionary')
            .appendField('delete entry for key');
        this.appendValueInput('KEY')
            .appendField('dictionary')
            .appendField('key');
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip('Deletes the entry for a key in a dictionary.');
    }
};

// get value for key block
Blockly.Blocks['dictionaries_get_value'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.lists);
        this.appendValueInput('DICT')
            .setCheck('Dictionary')
            .appendField('get value for key');
        this.appendValueInput('KEY')
            .appendField('dictionary')
            .appendField('key');
        this.appendValueInput('NOTFOUND')
            .appendField('notFound');
        this.setOutput(true);
        this.setTooltip('Gets the value for a key in a dictionary.');
    }
};

// list of pairs to dictionary
Blockly.Blocks['dictionaries_alist_to_dict'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.lists);
        this.appendValueInput('LIST')
            .setCheck('List')
            .appendField('list of pairs to dictionary');
        this.setOutput(true, 'Dictionary');
        this.setTooltip('Converts a list of pairs into a dictionary.');
    }
};

// dictionary to list of pairs
Blockly.Blocks['dictionaries_dict_to_alist'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.lists);
        this.appendValueInput('DICT')
            .setCheck('Dictionary')
            .appendField('dictionary to list of pairs');
        this.setOutput(true, 'List');
        this.setTooltip('Converts a dictionary into a list of pairs.');
    }
};
