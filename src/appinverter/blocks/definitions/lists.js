/**
 * List Blocks for App Inventor
 * MIT App Inventor compatible list operations
 */
import * as Blockly from 'blockly';
import { BLOCK_COLORS } from '../utils/blockColors';

// Create Empty List
Blockly.Blocks['lists_create_empty'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("create empty list");
        this.setOutput(true, "List");
        this.setColour(BLOCK_COLORS.lists);
        this.setTooltip("Create an empty list");
    }
};

// Create List with Items
Blockly.Blocks['lists_create_with'] = {
    init: function () {
        this.appendValueInput("ADD0")
            .setCheck(null)
            .appendField("make a list");
        this.appendValueInput("ADD1")
            .setCheck(null);
        this.setOutput(true, "List");
        this.setColour(BLOCK_COLORS.lists);
        this.setTooltip("Create a list with items");
        this.setMutator(new Blockly.icons.MutatorIcon(['lists_create_with_item'], this));
        this.itemCount_ = 2;
    },
    mutationToDom: function () {
        const container = Blockly.utils.xml.createElement('mutation');
        container.setAttribute('items', this.itemCount_);
        return container;
    },
    domToMutation: function (xmlElement) {
        this.itemCount_ = parseInt(xmlElement.getAttribute('items'), 10);
        this.updateShape_();
    },
    updateShape_: function () {
        // Remove all inputs
        for (let i = 0; this.getInput('ADD' + i); i++) {
            this.removeInput('ADD' + i);
        }
        // Add new inputs
        for (let i = 0; i < this.itemCount_; i++) {
            const input = this.appendValueInput('ADD' + i).setCheck(null);
            if (i === 0) {
                input.appendField('make a list');
            }
        }
    }
};

// Add Items to List
Blockly.Blocks['lists_add_items'] = {
    init: function () {
        this.appendValueInput("LIST")
            .setCheck("List")
            .appendField("add items to list");
        this.appendValueInput("ITEM")
            .setCheck(null)
            .appendField("item");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(BLOCK_COLORS.lists);
        this.setTooltip("Add items to the end of a list");
    }
};

// Is in List?
Blockly.Blocks['lists_is_in'] = {
    init: function () {
        this.appendValueInput("ITEM")
            .setCheck(null)
            .appendField("is in list?");
        this.appendValueInput("LIST")
            .setCheck("List")
            .appendField("thing");
        this.appendDummyInput()
            .appendField("list");
        this.setOutput(true, "Boolean");
        this.setColour(BLOCK_COLORS.lists);
        this.setTooltip("Check if item is in list");
    }
};

// Length of List
Blockly.Blocks['lists_length'] = {
    init: function () {
        this.appendValueInput("LIST")
            .setCheck("List")
            .appendField("length of list");
        this.setOutput(true, "Number");
        this.setColour(BLOCK_COLORS.lists);
        this.setTooltip("Get the number of items in a list");
    }
};

// Is List Empty?
Blockly.Blocks['lists_is_empty'] = {
    init: function () {
        this.appendValueInput("LIST")
            .setCheck("List")
            .appendField("is list empty?");
        this.setOutput(true, "Boolean");
        this.setColour(BLOCK_COLORS.lists);
        this.setTooltip("Check if list is empty");
    }
};

// Pick Random Item
Blockly.Blocks['lists_pick_random'] = {
    init: function () {
        this.appendValueInput("LIST")
            .setCheck("List")
            .appendField("pick a random item from list");
        this.setOutput(true, null);
        this.setColour(BLOCK_COLORS.lists);
        this.setTooltip("Pick a random item from the list");
    }
};

// Index in List
Blockly.Blocks['lists_position_in'] = {
    init: function () {
        this.appendValueInput("ITEM")
            .setCheck(null)
            .appendField("index in list");
        this.appendValueInput("LIST")
            .setCheck("List")
            .appendField("thing");
        this.appendDummyInput()
            .appendField("list");
        this.setOutput(true, "Number");
        this.setColour(BLOCK_COLORS.lists);
        this.setTooltip("Find the position of an item in a list");
    }
};

// Select List Item
Blockly.Blocks['lists_select_item'] = {
    init: function () {
        this.appendValueInput("LIST")
            .setCheck("List")
            .appendField("select list item");
        this.appendValueInput("INDEX")
            .setCheck("Number")
            .appendField("list")
            .appendField("index");
        this.setOutput(true, null);
        this.setColour(BLOCK_COLORS.lists);
        this.setTooltip("Get item at index in list");
    }
};

// Replace List Item
Blockly.Blocks['lists_replace_item'] = {
    init: function () {
        this.appendValueInput("LIST")
            .setCheck("List")
            .appendField("replace list item");
        this.appendValueInput("INDEX")
            .setCheck("Number")
            .appendField("list")
            .appendField("index");
        this.appendValueInput("ITEM")
            .setCheck(null)
            .appendField("replacement");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(BLOCK_COLORS.lists);
        this.setTooltip("Replace item at index in list");
    }
};

// Remove List Item
Blockly.Blocks['lists_remove_item'] = {
    init: function () {
        this.appendValueInput("LIST")
            .setCheck("List")
            .appendField("remove list item");
        this.appendValueInput("INDEX")
            .setCheck("Number")
            .appendField("list")
            .appendField("index");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(BLOCK_COLORS.lists);
        this.setTooltip("Remove item at index from list");
    }
};

// Insert List Item
Blockly.Blocks['lists_insert_item'] = {
    init: function () {
        this.appendValueInput("LIST")
            .setCheck("List")
            .appendField("insert list item");
        this.appendValueInput("INDEX")
            .setCheck("Number")
            .appendField("list")
            .appendField("index");
        this.appendValueInput("ITEM")
            .setCheck(null)
            .appendField("item");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(BLOCK_COLORS.lists);
        this.setTooltip("Insert item at index in list");
    }
};

// Append to List
Blockly.Blocks['lists_append_list'] = {
    init: function () {
        this.appendValueInput("LIST1")
            .setCheck("List")
            .appendField("append to list");
        this.appendValueInput("LIST2")
            .setCheck("List")
            .appendField("list1")
            .appendField("list2");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(BLOCK_COLORS.lists);
        this.setTooltip("Append list2 to list1");
    }
};

// Copy List
Blockly.Blocks['lists_copy'] = {
    init: function () {
        this.appendValueInput("LIST")
            .setCheck("List")
            .appendField("copy list");
        this.setOutput(true, "List");
        this.setColour(BLOCK_COLORS.lists);
        this.setTooltip("Create a copy of the list");
    }
};

// Is a List?
Blockly.Blocks['lists_is_list'] = {
    init: function () {
        this.appendValueInput("ITEM")
            .setCheck(null)
            .appendField("is a list?");
        this.appendDummyInput()
            .appendField("thing");
        this.setOutput(true, "Boolean");
        this.setColour(BLOCK_COLORS.lists);
        this.setTooltip("Check if something is a list");
    }
};

// Reverse List
Blockly.Blocks['lists_reverse'] = {
    init: function () {
        this.appendValueInput("LIST")
            .setCheck("List")
            .appendField("reverse list");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(BLOCK_COLORS.lists);
        this.setTooltip("Reverse the order of items in a list");
    }
};

// List to CSV Row
Blockly.Blocks['lists_to_csv_row'] = {
    init: function () {
        this.appendValueInput("LIST")
            .setCheck("List")
            .appendField("list to csv row");
        this.setOutput(true, "String");
        this.setColour(BLOCK_COLORS.lists);
        this.setTooltip("Convert list to CSV row");
    }
};

// List from CSV Row
Blockly.Blocks['lists_from_csv_row'] = {
    init: function () {
        this.appendValueInput("TEXT")
            .setCheck("String")
            .appendField("list from csv row");
        this.setOutput(true, "List");
        this.setColour(BLOCK_COLORS.lists);
        this.setTooltip("Convert CSV row to list");
    }
};

// List to CSV Table
Blockly.Blocks['lists_to_csv_table'] = {
    init: function () {
        this.appendValueInput("LIST")
            .setCheck("List")
            .appendField("list to csv table");
        this.setOutput(true, "String");
        this.setColour(BLOCK_COLORS.lists);
        this.setTooltip("Convert list of lists to CSV table");
    }
};

// List from CSV Table
Blockly.Blocks['lists_from_csv_table'] = {
    init: function () {
        this.appendValueInput("TEXT")
            .setCheck("String")
            .appendField("list from csv table");
        this.setOutput(true, "List");
        this.setColour(BLOCK_COLORS.lists);
        this.setTooltip("Convert CSV table to list of lists");
    }
};

// Lookup in Pairs
Blockly.Blocks['lists_lookup_in_pairs'] = {
    init: function () {
        this.appendValueInput("KEY")
            .setCheck(null)
            .appendField("lookup in pairs");
        this.appendValueInput("LIST")
            .setCheck("List")
            .appendField("key")
            .appendField("list");
        this.appendValueInput("NOT_FOUND")
            .setCheck(null)
            .appendField("notFound");
        this.setOutput(true, null);
        this.setColour(BLOCK_COLORS.lists);
        this.setTooltip("Look up a key in a list of pairs");
    }
};

export default {
    'lists_create_empty': Blockly.Blocks['lists_create_empty'],
    'lists_create_with': Blockly.Blocks['lists_create_with'],
    'lists_add_items': Blockly.Blocks['lists_add_items'],
    'lists_is_in': Blockly.Blocks['lists_is_in'],
    'lists_length': Blockly.Blocks['lists_length'],
    'lists_is_empty': Blockly.Blocks['lists_is_empty'],
    'lists_pick_random': Blockly.Blocks['lists_pick_random'],
    'lists_position_in': Blockly.Blocks['lists_position_in'],
    'lists_select_item': Blockly.Blocks['lists_select_item'],
    'lists_replace_item': Blockly.Blocks['lists_replace_item'],
    'lists_remove_item': Blockly.Blocks['lists_remove_item'],
    'lists_insert_item': Blockly.Blocks['lists_insert_item'],
    'lists_append_list': Blockly.Blocks['lists_append_list'],
    'lists_copy': Blockly.Blocks['lists_copy'],
    'lists_is_list': Blockly.Blocks['lists_is_list'],
    'lists_reverse': Blockly.Blocks['lists_reverse'],
    'lists_to_csv_row': Blockly.Blocks['lists_to_csv_row'],
    'lists_from_csv_row': Blockly.Blocks['lists_from_csv_row'],
    'lists_to_csv_table': Blockly.Blocks['lists_to_csv_table'],
    'lists_from_csv_table': Blockly.Blocks['lists_from_csv_table'],
    'lists_lookup_in_pairs': Blockly.Blocks['lists_lookup_in_pairs']
};
