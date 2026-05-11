/**
 * Dictionary Blocks for App Inventor
 * MIT App Inventor compatible dictionary operations
 */
import * as Blockly from 'blockly';

// Create Empty Dictionary
Blockly.Blocks['dictionaries_create_empty'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("create empty dictionary");
        this.setOutput(true, "Dictionary");
        this.setColour(0);
        this.setTooltip("Create an empty dictionary");
    }
};

// Make a Dictionary
Blockly.Blocks['dictionaries_create_with'] = {
    init: function () {
        this.appendValueInput("KEY0")
            .setCheck(null)
            .appendField("make a dictionary");
        this.appendValueInput("VALUE0")
            .setCheck(null)
            .appendField(":");
        this.setOutput(true, "Dictionary");
        this.setColour(0);
        this.setTooltip("Create a dictionary with key-value pairs");
        this.setMutator(new Blockly.Mutator(['dictionaries_create_with_item']));
        this.pairCount_ = 1;
    },
    mutationToDom: function () {
        const container = Blockly.utils.xml.createElement('mutation');
        container.setAttribute('pairs', this.pairCount_);
        return container;
    },
    domToMutation: function (xmlElement) {
        this.pairCount_ = parseInt(xmlElement.getAttribute('pairs'), 10);
        this.updateShape_();
    },
    updateShape_: function () {
        // Remove all inputs
        for (let i = 0; this.getInput('KEY' + i); i++) {
            this.removeInput('KEY' + i);
            this.removeInput('VALUE' + i);
        }
        // Add new inputs
        for (let i = 0; i < this.pairCount_; i++) {
            const keyInput = this.appendValueInput('KEY' + i).setCheck(null);
            if (i === 0) {
                keyInput.appendField('make a dictionary');
            }
            this.appendValueInput('VALUE' + i)
                .setCheck(null)
                .appendField(':');
        }
    }
};

// Get Value for Key
Blockly.Blocks['dictionaries_lookup'] = {
    init: function () {
        this.appendValueInput("DICTIONARY")
            .setCheck("Dictionary")
            .appendField("get value for key");
        this.appendValueInput("KEY")
            .setCheck(null)
            .appendField("dictionary")
            .appendField("key");
        this.appendValueInput("NOT_FOUND")
            .setCheck(null)
            .appendField("notFound");
        this.setOutput(true, null);
        this.setColour(0);
        this.setTooltip("Get the value associated with a key");
    }
};

// Set Value for Key
Blockly.Blocks['dictionaries_set_pair'] = {
    init: function () {
        this.appendValueInput("DICTIONARY")
            .setCheck("Dictionary")
            .appendField("set value for key");
        this.appendValueInput("KEY")
            .setCheck(null)
            .appendField("dictionary")
            .appendField("key");
        this.appendValueInput("VALUE")
            .setCheck(null)
            .appendField("to");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(0);
        this.setTooltip("Set the value for a key in the dictionary");
    }
};

// Delete Entry
Blockly.Blocks['dictionaries_delete_pair'] = {
    init: function () {
        this.appendValueInput("DICTIONARY")
            .setCheck("Dictionary")
            .appendField("delete entry");
        this.appendValueInput("KEY")
            .setCheck(null)
            .appendField("dictionary")
            .appendField("key");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(0);
        this.setTooltip("Delete a key-value pair from the dictionary");
    }
};

// Get Keys
Blockly.Blocks['dictionaries_get_keys'] = {
    init: function () {
        this.appendValueInput("DICTIONARY")
            .setCheck("Dictionary")
            .appendField("get keys");
        this.appendDummyInput()
            .appendField("dictionary");
        this.setOutput(true, "Array");
        this.setColour(0);
        this.setTooltip("Get a list of all keys in the dictionary");
    }
};

// Get Values
Blockly.Blocks['dictionaries_get_values'] = {
    init: function () {
        this.appendValueInput("DICTIONARY")
            .setCheck("Dictionary")
            .appendField("get values");
        this.appendDummyInput()
            .appendField("dictionary");
        this.setOutput(true, "Array");
        this.setColour(0);
        this.setTooltip("Get a list of all values in the dictionary");
    }
};

// Is Key in Dictionary?
Blockly.Blocks['dictionaries_is_key_in'] = {
    init: function () {
        this.appendValueInput("DICTIONARY")
            .setCheck("Dictionary")
            .appendField("is key in dictionary?");
        this.appendValueInput("KEY")
            .setCheck(null)
            .appendField("dictionary")
            .appendField("key");
        this.setOutput(true, "Boolean");
        this.setColour(0);
        this.setTooltip("Check if a key exists in the dictionary");
    }
};

// Size of Dictionary
Blockly.Blocks['dictionaries_length'] = {
    init: function () {
        this.appendValueInput("DICTIONARY")
            .setCheck("Dictionary")
            .appendField("size of dictionary");
        this.setOutput(true, "Number");
        this.setColour(0);
        this.setTooltip("Get the number of key-value pairs in the dictionary");
    }
};

// List of Pairs to Dictionary
Blockly.Blocks['dictionaries_alist_to_dict'] = {
    init: function () {
        this.appendValueInput("LIST")
            .setCheck("Array")
            .appendField("list of pairs to dictionary");
        this.setOutput(true, "Dictionary");
        this.setColour(0);
        this.setTooltip("Convert a list of pairs to a dictionary");
    }
};

// Dictionary to List of Pairs
Blockly.Blocks['dictionaries_dict_to_alist'] = {
    init: function () {
        this.appendValueInput("DICTIONARY")
            .setCheck("Dictionary")
            .appendField("dictionary to list of pairs");
        this.setOutput(true, "Array");
        this.setColour(0);
        this.setTooltip("Convert a dictionary to a list of pairs");
    }
};

// Copy Dictionary
Blockly.Blocks['dictionaries_copy'] = {
    init: function () {
        this.appendValueInput("DICTIONARY")
            .setCheck("Dictionary")
            .appendField("copy dictionary");
        this.setOutput(true, "Dictionary");
        this.setColour(0);
        this.setTooltip("Create a copy of the dictionary");
    }
};

// Merge Dictionaries
Blockly.Blocks['dictionaries_combine_dicts'] = {
    init: function () {
        this.appendValueInput("DICT1")
            .setCheck("Dictionary")
            .appendField("merge dictionaries");
        this.appendValueInput("DICT2")
            .setCheck("Dictionary")
            .appendField("dictionary1")
            .appendField("dictionary2");
        this.setOutput(true, "Dictionary");
        this.setColour(0);
        this.setTooltip("Merge two dictionaries");
    }
};

// Is a Dictionary?
Blockly.Blocks['dictionaries_is_dict'] = {
    init: function () {
        this.appendValueInput("ITEM")
            .setCheck(null)
            .appendField("is a dictionary?");
        this.appendDummyInput()
            .appendField("thing");
        this.setOutput(true, "Boolean");
        this.setColour(0);
        this.setTooltip("Check if something is a dictionary");
    }
};

// Walk All at Level
Blockly.Blocks['dictionaries_walk_tree'] = {
    init: function () {
        this.appendValueInput("TREE")
            .setCheck(null)
            .appendField("walk all at level");
        this.appendValueInput("PATH")
            .setCheck("Array")
            .appendField("tree")
            .appendField("path");
        this.setOutput(true, "Array");
        this.setColour(0);
        this.setTooltip("Walk through nested dictionaries/lists");
    }
};

// Walk Key Path
Blockly.Blocks['dictionaries_walk_key_path'] = {
    init: function () {
        this.appendValueInput("TREE")
            .setCheck(null)
            .appendField("get value at key path");
        this.appendValueInput("PATH")
            .setCheck("Array")
            .appendField("tree")
            .appendField("path");
        this.setOutput(true, null);
        this.setColour(0);
        this.setTooltip("Get value at a specific key path");
    }
};

// Set Value at Key Path
Blockly.Blocks['dictionaries_set_key_path'] = {
    init: function () {
        this.appendValueInput("TREE")
            .setCheck(null)
            .appendField("set value at key path");
        this.appendValueInput("PATH")
            .setCheck("Array")
            .appendField("tree")
            .appendField("path");
        this.appendValueInput("VALUE")
            .setCheck(null)
            .appendField("to");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(0);
        this.setTooltip("Set value at a specific key path");
    }
};

export default {
    'dictionaries_create_empty': Blockly.Blocks['dictionaries_create_empty'],
    'dictionaries_create_with': Blockly.Blocks['dictionaries_create_with'],
    'dictionaries_lookup': Blockly.Blocks['dictionaries_lookup'],
    'dictionaries_set_pair': Blockly.Blocks['dictionaries_set_pair'],
    'dictionaries_delete_pair': Blockly.Blocks['dictionaries_delete_pair'],
    'dictionaries_get_keys': Blockly.Blocks['dictionaries_get_keys'],
    'dictionaries_get_values': Blockly.Blocks['dictionaries_get_values'],
    'dictionaries_is_key_in': Blockly.Blocks['dictionaries_is_key_in'],
    'dictionaries_length': Blockly.Blocks['dictionaries_length'],
    'dictionaries_alist_to_dict': Blockly.Blocks['dictionaries_alist_to_dict'],
    'dictionaries_dict_to_alist': Blockly.Blocks['dictionaries_dict_to_alist'],
    'dictionaries_copy': Blockly.Blocks['dictionaries_copy'],
    'dictionaries_combine_dicts': Blockly.Blocks['dictionaries_combine_dicts'],
    'dictionaries_is_dict': Blockly.Blocks['dictionaries_is_dict'],
    'dictionaries_walk_tree': Blockly.Blocks['dictionaries_walk_tree'],
    'dictionaries_walk_key_path': Blockly.Blocks['dictionaries_walk_key_path'],
    'dictionaries_set_key_path': Blockly.Blocks['dictionaries_set_key_path']
};
