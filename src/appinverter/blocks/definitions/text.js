/**
 * Text Blocks for App Inventor
 * Includes: text values, join, length, substring
 */
import * as Blockly from 'blockly';

import { BLOCK_COLORS } from '../utils/blockColors';

// Text Value
Blockly.Blocks['text'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('\"')
            .appendField(new Blockly.FieldTextInput(""), "TEXT")
            .appendField('\"');
        this.setOutput(true, "String");
        this.setColour(BLOCK_COLORS.text);
        this.setTooltip("A text string");
    }
};

// Join Text
Blockly.Blocks['text_join'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.text);
        this.appendValueInput("ADD0")
            .appendField("join");
        this.appendValueInput("ADD1");
        this.setOutput(true, "String");
        this.setTooltip("Join two pieces of text");
        this.setMutator(new Blockly.icons.MutatorIcon(['text_create_join_item'], this));
        this.itemCount_ = 2;
    }
};

// Text Length
Blockly.Blocks['text_length'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.text);
        this.appendValueInput("VALUE")
            .setCheck("String")
            .appendField("length");
        this.setOutput(true, "Number");
        this.setTooltip("Returns length of text");
    }
};

// Is Empty
Blockly.Blocks['text_isEmpty'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.text);
        this.appendValueInput("VALUE")
            .setCheck("String")
            .appendField("is empty");
        this.setOutput(true, "Boolean");
        this.setTooltip("Returns true if text is empty");
    }
};

// Compare Texts
Blockly.Blocks['text_compare'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.text);
        this.appendValueInput('A')
            .setCheck('String')
            .appendField('compare texts');
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown([
                ['=', 'EQ'],
                ['<', 'LT'],
                ['>', 'GT']
            ]), 'OP');
        this.appendValueInput('B')
            .setCheck('String');
        this.setInputsInline(true);
        this.setOutput(true, 'Boolean');
    }
};

// Trim
Blockly.Blocks['text_trim'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.text);
        this.appendValueInput("TEXT")
            .setCheck("String")
            .appendField("trim");
        this.setOutput(true, "String");
        this.setTooltip("Trim spaces from text");
    }
};

// Change Case
Blockly.Blocks['text_changeCase'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.text);
        this.appendValueInput("TEXT")
            .setCheck("String")
            .appendField(new Blockly.FieldDropdown([
                ["upcase", "UPPERCASE"],
                ["downcase", "LOWERCASE"]
            ]), "CASE");
        this.setOutput(true, "String");
        this.setTooltip("Change text case");
    }
};

// Contains
Blockly.Blocks['text_contains'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.text);
        this.appendValueInput("TEXT")
            .setCheck("String")
            .appendField(new Blockly.FieldDropdown([
                ["contains", "CONTAINS"],
                ["starts at", "STARTS_AT"]
            ]), "MODE");
        this.appendValueInput("PIECE")
            .setCheck("String")
            .appendField("text")
            .appendField("piece");
        this.setInputsInline(false);
        this.setOutput(true, null);
    }
};

// Split
Blockly.Blocks['text_split'] = {
    init: function () {
        this.setColour(BLOCK_COLORS.text);
        this.appendValueInput("TEXT")
            .setCheck("String")
            .appendField(new Blockly.FieldDropdown([
                ["split", "SPLIT"],
                ["split at first", "SPLIT_FIRST"],
                ["split at any", "SPLIT_ANY"],
                ["split at spaces", "SPLIT_SPACES"]
            ]), "MODE");
        this.appendValueInput("AT")
            .setCheck("String")
            .appendField("text")
            .appendField("at");
        this.setInputsInline(false);
        this.setOutput(true, "List");
    }
};

export default {
    'text': Blockly.Blocks['text'],
    'text_join': Blockly.Blocks['text_join'],
    'text_length': Blockly.Blocks['text_length'],
    'text_isEmpty': Blockly.Blocks['text_isEmpty'],
    'text_indexOf': Blockly.Blocks['text_indexOf'],
    'text_charAt': Blockly.Blocks['text_charAt'],
    'text_getSubstring': Blockly.Blocks['text_getSubstring'],
    'text_changeCase': Blockly.Blocks['text_changeCase'],
    'text_trim': Blockly.Blocks['text_trim'],
    'text_contains': Blockly.Blocks['text_contains']
};
