/**
 * List Blocks for App Inventor
 * Leap App Inventor compatible list operations
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
        this.itemCount_ = parseInt(xmlElement.getAttribute('items'), 10) || 2;
        this.updateShape_();
    },
    decompose: function (workspace) {
        const containerBlock = workspace.newBlock('lists_create_with_container');
        containerBlock.initSvg();
        let connection = containerBlock.nextConnection;
        for (let i = 0; i < this.itemCount_; i++) {
            const itemBlock = workspace.newBlock('lists_create_with_item');
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
            if (connections[i]) connections[i].reconnect(this, 'ADD' + i);
        }
    },
    saveConnections: function (containerBlock) {
        let itemBlock = containerBlock.nextConnection.targetBlock();
        let i = 0;
        while (itemBlock) {
            const input = this.getInput('ADD' + i);
            itemBlock.valueConnection_ = input && input.connection.targetConnection;
            i++;
            itemBlock = itemBlock.nextConnection && itemBlock.nextConnection.targetBlock();
        }
    },
    updateShape_: function () {
        if (this.itemCount_ < 0) this.itemCount_ = 0;
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

Blockly.Blocks['lists_create_with_container'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.lists);
        this.appendDummyInput().appendField("list");
        this.setNextStatement(true);
        this.contextMenu = false;
    }
};

Blockly.Blocks['lists_create_with_item'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.lists);
        this.appendDummyInput().appendField("item");
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.contextMenu = false;
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
Blockly.Blocks['lists_isEmpty'] = {
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
Blockly.Blocks['lists_indexOf'] = {
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
Blockly.Blocks['lists_getIndex'] = {
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
Blockly.Blocks['lists_setIndex'] = {
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
Blockly.Blocks['lists_append'] = {
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

// Join with Separator
Blockly.Blocks['lists_join_with_separator'] = {
    init: function () {
        this.appendValueInput("SEPARATOR")
            .setCheck("String")
            .appendField("join with separator");
        this.appendValueInput("LIST")
            .setCheck("List")
            .appendField("list");
        this.setOutput(true, "String");
        this.setColour(BLOCK_COLORS.lists);
        this.setTooltip("Join list items with a separator");
    }
};

// Sort List
Blockly.Blocks['lists_sort'] = {
    init: function () {
        this.appendValueInput("LIST")
            .setCheck("List")
            .appendField("sort list");
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown([
                ["numeric", "NUMERIC"],
                ["alphabetic", "ALPHABETIC"]
            ]), "TYPE")
            .appendField(new Blockly.FieldDropdown([
                ["ascending", "ASCENDING"],
                ["descending", "DESCENDING"]
            ]), "ORDER");
        this.setOutput(true, "List");
        this.setColour(BLOCK_COLORS.lists);
        this.setTooltip("Sort items in a list");
    }
};

// Repeat List
Blockly.Blocks['lists_repeat'] = {
    init: function () {
        this.appendValueInput("ITEM")
            .setCheck(null)
            .appendField("make a list by repeating item");
        this.appendValueInput("NUM")
            .setCheck("Number")
            .appendField("length");
        this.setOutput(true, "List");
        this.setColour(BLOCK_COLORS.lists);
        this.setTooltip("Create a list by repeating an item n times");
    }
};

// Lookup in Pairs
Blockly.Blocks['lists_lookup_in_pairs'] = {
    init: function() {
        this.setColour(BLOCK_COLORS.lists);
        this.appendValueInput('KEY').appendField('lookup in pairs');
        this.appendValueInput('LIST').setCheck('List').appendField('key');
        this.appendValueInput('NOTFOUND').appendField('pairs').appendField('notFound');
        this.setInputsInline(true);
        this.setOutput(true);
        this.setTooltip('Look up a key in a list of pairs (key-value pairs).');
    }
};

// ==================== MIT FUNCTIONAL LIST BLOCKS ====================

// Map — make new mapped list (MIT: mapnondest)
Blockly.Blocks['lists_map'] = {
    init: function () {
        this.appendValueInput('LIST')
            .setCheck('List')
            .appendField('map over list');
        this.appendDummyInput()
            .appendField('using variable')
            .appendField(new Blockly.FieldVariable('item'), 'VAR');
        this.appendValueInput('TO')
            .appendField('to');
        this.setOutput(true, 'List');
        this.setColour(BLOCK_COLORS.lists);
        this.setTooltip('Creates a new list by applying an expression to every item in the input list.');
    }
};

// Filter — make new filtered list (MIT: filternondest)
Blockly.Blocks['lists_filter'] = {
    init: function () {
        this.appendValueInput('LIST')
            .setCheck('List')
            .appendField('filter list');
        this.appendDummyInput()
            .appendField('using variable')
            .appendField(new Blockly.FieldVariable('item'), 'VAR');
        this.appendValueInput('TEST')
            .setCheck('Boolean')
            .appendField('test');
        this.setOutput(true, 'List');
        this.setColour(BLOCK_COLORS.lists);
        this.setTooltip('Creates a new list containing only items from the input list that satisfy the test.');
    }
};

// Reduce — reduce list to a single value
Blockly.Blocks['lists_reduce'] = {
    init: function () {
        this.appendValueInput('LIST')
            .setCheck('List')
            .appendField('reduce list');
        this.appendValueInput('INITANSWER')
            .appendField('with initialAnswer');
        this.appendDummyInput()
            .appendField('using')
            .appendField(new Blockly.FieldVariable('answerSoFar'), 'VAR1')
            .appendField(new Blockly.FieldVariable('item'), 'VAR2');
        this.appendValueInput('COMBINE')
            .appendField('combine');
        this.setOutput(true);
        this.setColour(BLOCK_COLORS.lists);
        this.setTooltip('Returns an accumulated value by reducing the input list. answerSoFar is initialized to initialAnswer, then the combine block is evaluated for each item.');
    }
};

// Sort List in Ascending Order (MIT: generic sort)
Blockly.Blocks['lists_sort_ascending'] = {
    init: function () {
        this.appendValueInput('LIST')
            .setCheck('List')
            .appendField('sort list');
        this.setOutput(true, 'List');
        this.setColour(BLOCK_COLORS.lists);
        this.setTooltip('Create a new list from sorting the input list in ascending order. Works on lists of any type.');
    }
};

// Sort List with Comparator (MIT: sortwithcomparator)
Blockly.Blocks['lists_sort_comparator'] = {
    init: function () {
        this.appendValueInput('LIST')
            .setCheck('List')
            .appendField('sort list with comparator');
        this.appendDummyInput()
            .appendField('using')
            .appendField(new Blockly.FieldVariable('item1'), 'VAR1')
            .appendField(new Blockly.FieldVariable('item2'), 'VAR2');
        this.appendValueInput('COMPARE')
            .setCheck('Boolean')
            .appendField('test');
        this.setOutput(true, 'List');
        this.setColour(BLOCK_COLORS.lists);
        this.setTooltip('Sorts the list using a custom comparator. The test should return true if item1 should come before item2.');
    }
};

// Sort List with Key (MIT: sortwithkey)
Blockly.Blocks['lists_sort_key'] = {
    init: function () {
        this.appendValueInput('LIST')
            .setCheck('List')
            .appendField('sort list with key');
        this.appendDummyInput()
            .appendField('using variable')
            .appendField(new Blockly.FieldVariable('item'), 'VAR');
        this.appendValueInput('KEY')
            .appendField('key');
        this.setOutput(true, 'List');
        this.setColour(BLOCK_COLORS.lists);
        this.setTooltip('Sort the list using proxy values (keys) generated from each item by the key expression.');
    }
};

// Minimum Value in List
Blockly.Blocks['lists_minimum_value'] = {
    init: function () {
        this.appendValueInput('LIST')
            .setCheck('List')
            .appendField('minimum value in list');
        this.setOutput(true, 'Number');
        this.setColour(BLOCK_COLORS.lists);
        this.setTooltip('Return the minimum number in the input list.');
    }
};

// Maximum Value in List
Blockly.Blocks['lists_maximum_value'] = {
    init: function () {
        this.appendValueInput('LIST')
            .setCheck('List')
            .appendField('maximum value in list');
        this.setOutput(true, 'Number');
        this.setColour(BLOCK_COLORS.lists);
        this.setTooltip('Return the maximum number in the input list.');
    }
};

// All But First
Blockly.Blocks['lists_but_first'] = {
    init: function () {
        this.appendValueInput('LIST')
            .setCheck('List')
            .appendField('all but first');
        this.setOutput(true, 'List');
        this.setColour(BLOCK_COLORS.lists);
        this.setTooltip('Return a list without the first item in the input list.');
    }
};

// All But Last
Blockly.Blocks['lists_but_last'] = {
    init: function () {
        this.appendValueInput('LIST')
            .setCheck('List')
            .appendField('all but last');
        this.setOutput(true, 'List');
        this.setColour(BLOCK_COLORS.lists);
        this.setTooltip('Return a list without the last item in the input list.');
    }
};

// List Slices
Blockly.Blocks['lists_slice'] = {
    init: function () {
        this.appendValueInput('LIST')
            .setCheck('List')
            .appendField('list slices');
        this.appendValueInput('INDEX1')
            .setCheck('Number')
            .appendField('list')
            .appendField('index1');
        this.appendValueInput('INDEX2')
            .setCheck('Number')
            .appendField('index2');
        this.setOutput(true, 'List');
        this.setColour(BLOCK_COLORS.lists);
        this.setTooltip('Return a list from slicing the input list. Contains items from index1 up to but not including index2.');
    }
};

export default {
    'lists_create_empty': Blockly.Blocks['lists_create_empty'],
    'lists_create_with': Blockly.Blocks['lists_create_with'],
    'lists_add_items': Blockly.Blocks['lists_add_items'],
    'lists_is_in': Blockly.Blocks['lists_is_in'],
    'lists_length': Blockly.Blocks['lists_length'],
    'lists_isEmpty': Blockly.Blocks['lists_isEmpty'],
    'lists_pick_random': Blockly.Blocks['lists_pick_random'],
    'lists_indexOf': Blockly.Blocks['lists_indexOf'],
    'lists_getIndex': Blockly.Blocks['lists_getIndex'],
    'lists_setIndex': Blockly.Blocks['lists_setIndex'],
    'lists_remove_item': Blockly.Blocks['lists_remove_item'],
    'lists_insert_item': Blockly.Blocks['lists_insert_item'],
    'lists_append': Blockly.Blocks['lists_append'],
    'lists_copy': Blockly.Blocks['lists_copy'],
    'lists_is_list': Blockly.Blocks['lists_is_list'],
    'lists_reverse': Blockly.Blocks['lists_reverse'],
    'lists_to_csv_row': Blockly.Blocks['lists_to_csv_row'],
    'lists_from_csv_row': Blockly.Blocks['lists_from_csv_row'],
    'lists_to_csv_table': Blockly.Blocks['lists_to_csv_table'],
    'lists_from_csv_table': Blockly.Blocks['lists_from_csv_table'],
    'lists_lookup_in_pairs': Blockly.Blocks['lists_lookup_in_pairs'],
    'lists_join_with_separator': Blockly.Blocks['lists_join_with_separator'],
    'lists_sort': Blockly.Blocks['lists_sort'],
    'lists_repeat': Blockly.Blocks['lists_repeat'],
    'lists_map': Blockly.Blocks['lists_map'],
    'lists_filter': Blockly.Blocks['lists_filter'],
    'lists_reduce': Blockly.Blocks['lists_reduce'],
    'lists_sort_ascending': Blockly.Blocks['lists_sort_ascending'],
    'lists_sort_comparator': Blockly.Blocks['lists_sort_comparator'],
    'lists_sort_key': Blockly.Blocks['lists_sort_key'],
    'lists_minimum_value': Blockly.Blocks['lists_minimum_value'],
    'lists_maximum_value': Blockly.Blocks['lists_maximum_value'],
    'lists_but_first': Blockly.Blocks['lists_but_first'],
    'lists_but_last': Blockly.Blocks['lists_but_last'],
    'lists_slice': Blockly.Blocks['lists_slice']
};

