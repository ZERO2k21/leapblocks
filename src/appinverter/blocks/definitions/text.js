/**
 * Text Blocks for App Inventor
 * Includes: text values, join, length, substring
 */
import * as Blockly from 'blockly';

// Text Value
Blockly.Blocks['text'] = Blockly.Blocks['text'] || {
    init: function () {
        this.appendDummyInput()
            .appendField(new Blockly.FieldTextInput(""), "TEXT");
        this.setOutput(true, "String");
        this.setColour(160);
        this.setTooltip("A text string");
    }
};

// Join Text
Blockly.Blocks['text_join'] = Blockly.Blocks['text_join'] || {
    init: function () {
        this.appendValueInput("ADD0")
            .appendField("join");
        this.appendValueInput("ADD1");
        this.setOutput(true, "String");
        this.setColour(160);
        this.setTooltip("Join two pieces of text");
        this.setMutator(new Blockly.Mutator(['text_create_join_item']));
        this.itemCount_ = 2;
    }
};

// Text Length
Blockly.Blocks['text_length'] = Blockly.Blocks['text_length'] || {
    init: function () {
        this.appendValueInput("VALUE")
            .setCheck("String")
            .appendField("length of");
        this.setOutput(true, "Number");
        this.setColour(160);
        this.setTooltip("Returns length of text");
    }
};

// Is Empty
Blockly.Blocks['text_isEmpty'] = Blockly.Blocks['text_isEmpty'] || {
    init: function () {
        this.appendValueInput("VALUE")
            .setCheck("String")
            .appendField("is empty");
        this.setOutput(true, "Boolean");
        this.setColour(160);
        this.setTooltip("Returns true if text is empty");
    }
};

// Index Of
Blockly.Blocks['text_indexOf'] = Blockly.Blocks['text_indexOf'] || {
    init: function () {
        this.appendValueInput("VALUE")
            .setCheck("String")
            .appendField("in text");
        this.appendValueInput("FIND")
            .setCheck("String")
            .appendField(new Blockly.FieldDropdown([
                ["find first", "FIRST"],
                ["find last", "LAST"]
            ]), "END");
        this.setInputsInline(true);
        this.setOutput(true, "Number");
        this.setColour(160);
        this.setTooltip("Find position of text");
    }
};

// Character At
Blockly.Blocks['text_charAt'] = Blockly.Blocks['text_charAt'] || {
    init: function () {
        this.appendValueInput("VALUE")
            .setCheck("String")
            .appendField("in text");
        this.appendValueInput("AT")
            .setCheck("Number")
            .appendField(new Blockly.FieldDropdown([
                ["get letter #", "FROM_START"],
                ["get letter # from end", "FROM_END"],
                ["get first letter", "FIRST"],
                ["get last letter", "LAST"]
            ]), "WHERE");
        this.setInputsInline(true);
        this.setOutput(true, "String");
        this.setColour(160);
        this.setTooltip("Get character at position");
    }
};

// Substring
Blockly.Blocks['text_getSubstring'] = Blockly.Blocks['text_getSubstring'] || {
    init: function () {
        this.appendValueInput("STRING")
            .setCheck("String")
            .appendField("in text");
        this.appendValueInput("AT1")
            .setCheck("Number")
            .appendField("get substring from");
        this.appendValueInput("AT2")
            .setCheck("Number")
            .appendField("to");
        this.setInputsInline(true);
        this.setOutput(true, "String");
        this.setColour(160);
        this.setTooltip("Get substring");
    }
};

// Change Case
Blockly.Blocks['text_changeCase'] = Blockly.Blocks['text_changeCase'] || {
    init: function () {
        this.appendValueInput("TEXT")
            .setCheck("String")
            .appendField(new Blockly.FieldDropdown([
                ["to UPPERCASE", "UPPERCASE"],
                ["to lowercase", "LOWERCASE"],
                ["to Title Case", "TITLECASE"]
            ]), "CASE");
        this.setOutput(true, "String");
        this.setColour(160);
        this.setTooltip("Change text case");
    }
};

// Trim
Blockly.Blocks['text_trim'] = Blockly.Blocks['text_trim'] || {
    init: function () {
        this.appendValueInput("TEXT")
            .setCheck("String")
            .appendField(new Blockly.FieldDropdown([
                ["trim spaces from both sides", "BOTH"],
                ["trim spaces from left side", "LEFT"],
                ["trim spaces from right side", "RIGHT"]
            ]), "MODE");
        this.setOutput(true, "String");
        this.setColour(160);
        this.setTooltip("Trim spaces from text");
    }
};

// Contains
Blockly.Blocks['text_contains'] = {
    init: function () {
        this.appendValueInput("TEXT")
            .setCheck("String")
            .appendField("text");
        this.appendValueInput("FIND")
            .setCheck("String")
            .appendField("contains");
        this.setInputsInline(true);
        this.setOutput(true, "Boolean");
        this.setColour(160);
        this.setTooltip("Check if text contains substring");
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
