/**
 * Leap App Inventor Text and List Blocks
 */
import * as Blockly from 'blockly';
import { MIT_COLORS } from './builtin_blocks';

// ============================================================================
// TEXT BLOCKS
// ============================================================================

// text block
Blockly.Blocks['text'] = {
    init: function () {
        this.setColour(MIT_COLORS.text);
        this.appendDummyInput()
            .appendField(new Blockly.FieldTextInput(''), 'TEXT');
        this.setOutput(true, 'String');
        this.setTooltip('A text string.');
    }
};

// join block
Blockly.Blocks['text_join'] = {
    init: function () {
        this.setColour(MIT_COLORS.text);
        this.appendValueInput('ADD0')
            .setCheck('String')
            .appendField('join');
        this.appendValueInput('ADD1')
            .setCheck('String');
        this.setOutput(true, 'String');
        this.setTooltip('Create a piece of text by joining together any number of strings.');
        this.itemCount_ = 2;
    }
};

// length block
Blockly.Blocks['text_length'] = {
    init: function () {
        this.setColour(MIT_COLORS.text);
        this.appendValueInput('VALUE')
            .setCheck('String')
            .appendField('length');
        this.setOutput(true, 'Number');
        this.setTooltip('Returns the number of letters (including spaces) in the provided text.');
    }
};

// is empty block
Blockly.Blocks['text_isEmpty'] = {
    init: function () {
        this.setColour(MIT_COLORS.text);
        this.appendValueInput('VALUE')
            .setCheck('String')
            .appendField('is empty');
        this.setOutput(true, 'Boolean');
        this.setTooltip('Returns true if the length of the text is 0, false otherwise.');
    }
};

// compare texts block
Blockly.Blocks['text_compare'] = {
    init: function () {
        this.setColour(MIT_COLORS.text);
        this.appendValueInput('TEXT1')
            .setCheck('String')
            .appendField('compare texts');
        this.appendValueInput('TEXT2')
            .setCheck('String')
            .appendField(new Blockly.FieldDropdown([
                ['<', 'LT'],
                ['=', 'EQUAL'],
                ['>', 'GT']
            ]), 'OP');
        this.setInputsInline(true);
        this.setOutput(true, 'Boolean');
        this.setTooltip('Tests whether the first string is lexicographically <, =, or > the second string.');
    }
};

// trim block
Blockly.Blocks['text_trim'] = {
    init: function () {
        this.setColour(MIT_COLORS.text);
        this.appendValueInput('TEXT')
            .setCheck('String')
            .appendField('trim');
        this.setOutput(true, 'String');
        this.setTooltip('Returns a copy of the text with any leading or trailing spaces removed.');
    }
};

// upcase block
Blockly.Blocks['text_changeCase'] = {
    init: function () {
        this.setColour(MIT_COLORS.text);
        this.appendValueInput('TEXT')
            .setCheck('String')
            .appendField(new Blockly.FieldDropdown([
                ['upcase', 'UPPERCASE'],
                ['downcase', 'LOWERCASE']
            ]), 'CASE');
        this.setOutput(true, 'String');
        this.setTooltip('Returns a copy of the text in all uppercase or lowercase.');
    }
};

// starts at block
Blockly.Blocks['text_indexOf'] = {
    init: function () {
        this.setColour(MIT_COLORS.text);
        this.appendValueInput('VALUE')
            .setCheck('String')
            .appendField('in text');
        this.appendValueInput('FIND')
            .setCheck('String')
            .appendField('find');
        this.setInputsInline(true);
        this.setOutput(true, 'Number');
        this.setTooltip('Returns the position where the piece first appears in the text, or 0 if not present.');
    }
};

// contains block
Blockly.Blocks['text_contains'] = {
    init: function () {
        this.setColour(MIT_COLORS.text);
        this.appendValueInput('TEXT')
            .setCheck('String')
            .appendField('in text');
        this.appendValueInput('PIECE')
            .setCheck('String')
            .appendField('contains');
        this.setInputsInline(true);
        this.setOutput(true, 'Boolean');
        this.setTooltip('Tests whether piece appears in text.');
    }
};

// split block
Blockly.Blocks['text_split'] = {
    init: function () {
        this.setColour(MIT_COLORS.text);
        this.appendValueInput('TEXT')
            .setCheck('String')
            .appendField('split');
        this.appendValueInput('AT')
            .setCheck('String')
            .appendField('at');
        this.setInputsInline(true);
        this.setOutput(true, 'List');
        this.setTooltip('Divides text into pieces using at as the dividing point, and returns the result as a list.');
    }
};

// segment block
Blockly.Blocks['text_charAt'] = {
    init: function () {
        this.setColour(MIT_COLORS.text);
        this.appendValueInput('VALUE')
            .setCheck('String')
            .appendField('in text');
        this.appendValueInput('AT')
            .setCheck('Number')
            .appendField('get letter #');
        this.setInputsInline(true);
        this.setOutput(true, 'String');
        this.setTooltip('Returns the letter at the given position in the text.');
    }
};

// substring block
Blockly.Blocks['text_getSubstring'] = {
    init: function () {
        this.setColour(MIT_COLORS.text);
        this.appendValueInput('STRING')
            .setCheck('String')
            .appendField('in text');
        this.appendValueInput('AT1')
            .setCheck('Number')
            .appendField('get substring from');
        this.appendValueInput('AT2')
            .setCheck('Number')
            .appendField('to');
        this.setInputsInline(true);
        this.setOutput(true, 'String');
        this.setTooltip('Returns a substring from the given positions.');
    }
};

// replace all block
Blockly.Blocks['text_replace_all'] = {
    init: function () {
        this.setColour(MIT_COLORS.text);
        this.appendValueInput('TEXT')
            .setCheck('String')
            .appendField('replace all');
        this.appendValueInput('SEGMENT')
            .setCheck('String')
            .appendField('segment');
        this.appendValueInput('REPLACEMENT')
            .setCheck('String')
            .appendField('replacement');
        this.setInputsInline(true);
        this.setOutput(true, 'String');
        this.setTooltip('Returns a new text obtained by replacing all occurrences of the segment with the replacement.');
    }
};

// ============================================================================
// LIST BLOCKS
// ============================================================================

// create empty list block
Blockly.Blocks['lists_create_empty'] = {
    init: function () {
        this.setColour(MIT_COLORS.lists);
        this.appendDummyInput()
            .appendField('create empty list');
        this.setOutput(true, 'List');
        this.setTooltip('Returns a list with no items.');
    }
};

// make a list block
Blockly.Blocks['lists_create_with'] = {
    init: function () {
        this.setColour(MIT_COLORS.lists);
        this.appendValueInput('ADD0')
            .appendField('make a list');
        this.appendValueInput('ADD1');
        this.setOutput(true, 'List');
        this.setTooltip('Create a list with any number of items.');
        this.itemCount_ = 2;
    }
};

// add items to list block
Blockly.Blocks['lists_add_items'] = {
    init: function () {
        this.setColour(MIT_COLORS.lists);
        this.appendValueInput('LIST')
            .setCheck('List')
            .appendField('add items to list');
        this.appendValueInput('ITEM0')
            .appendField('item');
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip('Adds items to the end of a list.');
        this.itemCount_ = 1;
    }
};

// is in list block
Blockly.Blocks['lists_is_in'] = {
    init: function () {
        this.setColour(MIT_COLORS.lists);
        this.appendValueInput('ITEM')
            .appendField('is in list?');
        this.appendValueInput('LIST')
            .setCheck('List')
            .appendField('thing');
        this.appendDummyInput()
            .appendField('list');
        this.setInputsInline(true);
        this.setOutput(true, 'Boolean');
        this.setTooltip('Returns true if the thing is an item in the list, false otherwise.');
    }
};

// length of list block
Blockly.Blocks['lists_length'] = {
    init: function () {
        this.setColour(MIT_COLORS.lists);
        this.appendValueInput('LIST')
            .setCheck('List')
            .appendField('length of list');
        this.setOutput(true, 'Number');
        this.setTooltip('Returns the number of items in the list.');
    }
};

// is list empty block
Blockly.Blocks['lists_isEmpty'] = {
    init: function () {
        this.setColour(MIT_COLORS.lists);
        this.appendValueInput('LIST')
            .setCheck('List')
            .appendField('is list empty?');
        this.setOutput(true, 'Boolean');
        this.setTooltip('Returns true if the list is empty.');
    }
};

// pick random item block
Blockly.Blocks['lists_pick_random'] = {
    init: function () {
        this.setColour(MIT_COLORS.lists);
        this.appendValueInput('LIST')
            .setCheck('List')
            .appendField('pick a random item');
        this.setOutput(true);
        this.setTooltip('Picks an item at random from the list.');
    }
};

// index in list block
Blockly.Blocks['lists_indexOf'] = {
    init: function () {
        this.setColour(MIT_COLORS.lists);
        this.appendValueInput('LIST')
            .setCheck('List')
            .appendField('index in list');
        this.appendValueInput('ITEM')
            .appendField('thing');
        this.setInputsInline(true);
        this.setOutput(true, 'Number');
        this.setTooltip('Returns the position of the thing in the list. If not in the list, returns 0.');
    }
};

// select list item block
Blockly.Blocks['lists_getIndex'] = {
    init: function () {
        this.setColour(MIT_COLORS.lists);
        this.appendValueInput('LIST')
            .setCheck('List')
            .appendField('select list item');
        this.appendValueInput('INDEX')
            .setCheck('Number')
            .appendField('index');
        this.setInputsInline(true);
        this.setOutput(true);
        this.setTooltip('Returns the item at position index in the list.');
    }
};

// replace list item block
Blockly.Blocks['lists_setIndex'] = {
    init: function () {
        this.setColour(MIT_COLORS.lists);
        this.appendValueInput('LIST')
            .setCheck('List')
            .appendField('replace list item');
        this.appendValueInput('INDEX')
            .setCheck('Number')
            .appendField('index');
        this.appendValueInput('TO')
            .appendField('replacement');
        this.setInputsInline(true);
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip('Replaces the item at position index in the list.');
    }
};

// remove list item block
Blockly.Blocks['lists_remove_item'] = {
    init: function () {
        this.setColour(MIT_COLORS.lists);
        this.appendValueInput('LIST')
            .setCheck('List')
            .appendField('remove list item');
        this.appendValueInput('INDEX')
            .setCheck('Number')
            .appendField('index');
        this.setInputsInline(true);
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip('Removes the item at position index from the list.');
    }
};

// append to list block
Blockly.Blocks['lists_append'] = {
    init: function () {
        this.setColour(MIT_COLORS.lists);
        this.appendValueInput('LIST')
            .setCheck('List')
            .appendField('append to list');
        this.appendValueInput('ITEM')
            .appendField('item');
        this.setInputsInline(true);
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip('Add an item to the end of a list.');
    }
};

// copy list block
Blockly.Blocks['lists_copy'] = {
    init: function () {
        this.setColour(MIT_COLORS.lists);
        this.appendValueInput('LIST')
            .setCheck('List')
            .appendField('copy list');
        this.setOutput(true, 'List');
        this.setTooltip('Makes a copy of a list, including copying all sublists.');
    }
};

// is a list block
Blockly.Blocks['lists_is_list'] = {
    init: function () {
        this.setColour(MIT_COLORS.lists);
        this.appendValueInput('ITEM')
            .appendField('is a list?');
        this.setOutput(true, 'Boolean');
        this.setTooltip('Tests whether something is a list.');
    }
};

// reverse list block
Blockly.Blocks['lists_reverse'] = {
    init: function () {
        this.setColour(MIT_COLORS.lists);
        this.appendValueInput('LIST')
            .setCheck('List')
            .appendField('reverse list');
        this.setOutput(true, 'List');
        this.setTooltip('Reverses the order of the items in a list.');
    }
};

// list to csv row block
Blockly.Blocks['lists_to_csv_row'] = {
    init: function () {
        this.setColour(MIT_COLORS.lists);
        this.appendValueInput('LIST')
            .setCheck('List')
            .appendField('list to csv row');
        this.setOutput(true, 'String');
        this.setTooltip('Interprets the list as a row of a table and returns a CSV (comma-separated value) text.');
    }
};

// list from csv row block
Blockly.Blocks['lists_from_csv_row'] = {
    init: function () {
        this.setColour(MIT_COLORS.lists);
        this.appendValueInput('TEXT')
            .setCheck('String')
            .appendField('list from csv row');
        this.setOutput(true, 'List');
        this.setTooltip('Parses a text as a CSV (comma-separated value) formatted row to produce a list.');
    }
};

// list to csv table block
Blockly.Blocks['lists_to_csv_table'] = {
    init: function () {
        this.setColour(MIT_COLORS.lists);
        this.appendValueInput('LIST')
            .setCheck('List')
            .appendField('list to csv table');
        this.setOutput(true, 'String');
        this.setTooltip('Interprets the list as a table in row-major format and returns a CSV (comma-separated value) text.');
    }
};

// list from csv table block
Blockly.Blocks['lists_from_csv_table'] = {
    init: function () {
        this.setColour(MIT_COLORS.lists);
        this.appendValueInput('TEXT')
            .setCheck('String')
            .appendField('list from csv table');
        this.setOutput(true, 'List');
        this.setTooltip('Parses a text as a CSV (comma-separated value) formatted table to produce a list of lists.');
    }
};

// lookup in pairs block
Blockly.Blocks['lists_lookup_in_pairs'] = {
    init: function () {
        this.setColour(MIT_COLORS.lists);
        this.appendValueInput('KEY')
            .appendField('lookup in pairs');
        this.appendValueInput('LIST')
            .setCheck('List')
            .appendField('key');
        this.appendValueInput('NOTFOUND')
            .appendField('pairs')
            .appendField('notFound');
        this.setInputsInline(true);
        this.setOutput(true);
        this.setTooltip('Look up a key in a list of pairs (key-value pairs).');
    }
};

// join with separator block
Blockly.Blocks['lists_join_with_separator'] = {
    init: function () {
        this.setColour(MIT_COLORS.lists);
        this.appendValueInput('LIST')
            .setCheck('List')
            .appendField('join items using separator');
        this.appendValueInput('SEPARATOR')
            .setCheck('String')
            .appendField('list')
            .appendField('separator');
        this.setInputsInline(true);
        this.setOutput(true, 'String');
        this.setTooltip('Joins all items in a list into a string separated by the separator.');
    }
};

// sort list block
Blockly.Blocks['lists_sort'] = {
    init: function () {
        this.setColour(MIT_COLORS.lists);
        this.appendValueInput('LIST')
            .setCheck('List')
            .appendField('sort');
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown([
                ['ascending', 'ASCENDING'],
                ['descending', 'DESCENDING']
            ]), 'DIRECTION');
        this.setInputsInline(true);
        this.setOutput(true, 'List');
        this.setTooltip('Sorts a list in ascending or descending order.');
    }
};

// repeat block
Blockly.Blocks['lists_repeat'] = {
    init: function () {
        this.setColour(MIT_COLORS.lists);
        this.appendValueInput('ITEM')
            .appendField('make list');
        this.appendValueInput('NUM')
            .setCheck('Number')
            .appendField('item')
            .appendField('length');
        this.setInputsInline(true);
        this.setOutput(true, 'List');
        this.setTooltip('Creates a list consisting of the given value repeated the specified number of times.');
    }
};

