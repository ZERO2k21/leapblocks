/**
 * Leap App Inventor Dictionary Blocks
 */
import * as Blockly from 'blockly';
import { BLOCK_COLORS } from '../utils/blockColors';

// make a dictionary block
Blockly.Blocks['dictionaries_create_with'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.lists); // Leap uses same color for lists and dictionaries mostly or similar shades
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

// is key in dictionary?
Blockly.Blocks['dictionaries_is_key_in'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.lists);
        this.appendValueInput('KEY')
            .appendField('is key in dictionary?');
        this.appendValueInput('DICT')
            .setCheck('Dictionary')
            .appendField('key')
            .appendField('dictionary');
        this.setOutput(true, 'Boolean');
        this.setTooltip('Tests whether a key is in a dictionary.');
    }
};

// size of dictionary
Blockly.Blocks['dictionaries_length'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.lists);
        this.appendValueInput('DICT')
            .setCheck('Dictionary')
            .appendField('size of dictionary');
        this.setOutput(true, 'Number');
        this.setTooltip('Returns the number of key-value pairs in the dictionary.');
    }
};

// list of keys
Blockly.Blocks['dictionaries_get_keys'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.lists);
        this.appendValueInput('DICT')
            .setCheck('Dictionary')
            .appendField('list of keys');
        this.setOutput(true, 'List');
        this.setTooltip('Returns a list containing all the keys in the dictionary.');
    }
};

// list of values
Blockly.Blocks['dictionaries_get_values'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.lists);
        this.appendValueInput('DICT')
            .setCheck('Dictionary')
            .appendField('list of values');
        this.setOutput(true, 'List');
        this.setTooltip('Returns a list containing all the values in the dictionary.');
    }
};

// combine dictionaries
Blockly.Blocks['dictionaries_combine'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.lists);
        this.appendValueInput('DICT1')
            .setCheck('Dictionary')
            .appendField('merge into dictionary');
        this.appendValueInput('DICT2')
            .setCheck('Dictionary')
            .appendField('from dictionary');
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip('Combines two dictionaries. If keys conflict, values from the second dictionary are used.');
    }
};

// is a dictionary?
Blockly.Blocks['dictionaries_is_a_dictionary'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.lists);
        this.appendValueInput('THING')
            .appendField('is a dictionary?');
        this.setOutput(true, 'Boolean');
        this.setTooltip('Returns true if the given value is a dictionary, otherwise false.');
    }
};

// get value at key path
Blockly.Blocks['dictionaries_walk_tree'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.lists);
        this.appendValueInput('DICT')
            .setCheck('Dictionary')
            .appendField('get value at key path');
        this.appendValueInput('PATH')
            .setCheck('List')
            .appendField('dictionary')
            .appendField('path');
        this.setOutput(true);
        this.setTooltip('Walks a path of keys in a dictionary and returns the value found at the end of the path.');
    }
};

// walk all at level
Blockly.Blocks['dictionaries_walk_all'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.lists);
        this.appendValueInput('DICT')
            .appendField('walk all at level');
        this.appendValueInput('PATH')
            .setCheck('List')
            .appendField('dictionary')
            .appendField('path');
        this.setOutput(true, 'List');
        this.setTooltip('Returns a list of all values found by walking the path at each level of the dictionary.');
    }
};

export default {
    'dictionaries_create_with': Blockly.Blocks['dictionaries_create_with'],
    'dictionaries_pair': Blockly.Blocks['dictionaries_pair'],
    'dictionaries_set_pair': Blockly.Blocks['dictionaries_set_pair'],
    'dictionaries_delete_pair': Blockly.Blocks['dictionaries_delete_pair'],
    'dictionaries_get_value': Blockly.Blocks['dictionaries_get_value'],
    'dictionaries_alist_to_dict': Blockly.Blocks['dictionaries_alist_to_dict'],
    'dictionaries_dict_to_alist': Blockly.Blocks['dictionaries_dict_to_alist'],
    'dictionaries_is_key_in': Blockly.Blocks['dictionaries_is_key_in'],
    'dictionaries_length': Blockly.Blocks['dictionaries_length'],
    'dictionaries_get_keys': Blockly.Blocks['dictionaries_get_keys'],
    'dictionaries_get_values': Blockly.Blocks['dictionaries_get_values'],
    'dictionaries_combine': Blockly.Blocks['dictionaries_combine'],
    'dictionaries_is_a_dictionary': Blockly.Blocks['dictionaries_is_a_dictionary'],
    'dictionaries_walk_tree': Blockly.Blocks['dictionaries_walk_tree'],
    'dictionaries_walk_all': Blockly.Blocks['dictionaries_walk_all']
};

