import * as Blockly from 'blockly';
import { BLOCK_COLORS } from '../utils/blockColors';

Blockly.Blocks['text'] = {
    init: function (this: Blockly.Block) {
        this.appendDummyInput()
            .appendField('"')
            .appendField(new Blockly.FieldTextInput(""), "TEXT")
            .appendField('"');
        this.setOutput(true, "String");
        this.setColour(BLOCK_COLORS.text);
        this.setTooltip("A text string");
    }
};

Blockly.Blocks['text_join'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.text);
        this.appendValueInput("ADD0")
            .appendField("join");
        this.appendValueInput("ADD1");
        this.setOutput(true, "String");
        this.setTooltip("Join two pieces of text");
        this.setMutator(new Blockly.icons.MutatorIcon(['text_create_join_item'], this));
        (this as any).itemCount_ = 2;
    },
    mutationToDom: function (this: Blockly.Block): Element {
        const container = Blockly.utils.xml.createElement('mutation');
        container.setAttribute('items', String((this as any).itemCount_));
        return container;
    },
    domToMutation: function (this: Blockly.Block, xmlElement: Element) {
        (this as any).itemCount_ = parseInt(xmlElement.getAttribute('items') || '10', 10) || 2;
        (this as any).updateShape_();
    },
    decompose: function (this: Blockly.Block, workspace: Blockly.Workspace) {
        const self = this as any;
        const containerBlock = workspace.newBlock('text_create_join_container');
        containerBlock.initSvg();
        let connection = containerBlock.nextConnection;
        for (let i = 0; i < self.itemCount_; i++) {
            const itemBlock = workspace.newBlock('text_create_join_item');
            itemBlock.initSvg();
            if (connection) connection.connect(itemBlock.previousConnection);
            connection = itemBlock.nextConnection;
        }
        return containerBlock;
    },
    compose: function (this: Blockly.Block, containerBlock: Blockly.Block) {
        const self = this as any;
        let itemBlock = containerBlock.nextConnection?.targetBlock() || null;
        const connections: Array<Blockly.Connection | null> = [];
        while (itemBlock && !itemBlock.isInsertionMarker()) {
            connections.push((itemBlock as any).valueConnection_);
            itemBlock = itemBlock.nextConnection && itemBlock.nextConnection.targetBlock();
        }
        self.itemCount_ = connections.length;
        self.updateShape_();
        for (let i = 0; i < self.itemCount_; i++) {
            if (connections[i]) connections[i].reconnect(this, 'ADD' + i);
        }
    },
    saveConnections: function (this: Blockly.Block, containerBlock: Blockly.Block) {
        let itemBlock = containerBlock.nextConnection?.targetBlock() || null;
        let i = 0;
        while (itemBlock) {
            const input = this.getInput('ADD' + i);
            (itemBlock as any).valueConnection_ = input && input.connection?.targetConnection;
            i++;
            itemBlock = itemBlock.nextConnection && itemBlock.nextConnection.targetBlock();
        }
    },
    updateShape_: function (this: Blockly.Block) {
        const self = this as any;
        if (self.itemCount_ < 0) self.itemCount_ = 0;
        for (let i = 0; this.getInput('ADD' + i); i++) {
            this.removeInput('ADD' + i);
        }
        for (let i = 0; i < self.itemCount_; i++) {
            const input = this.appendValueInput('ADD' + i).setCheck(null);
            if (i === 0) {
                input.appendField('join');
            }
        }
    }
};

Blockly.Blocks['text_create_join_container'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.text);
        this.appendDummyInput().appendField("join");
        this.setNextStatement(true);
        this.contextMenu = false;
    }
};

Blockly.Blocks['text_create_join_item'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.text);
        this.appendDummyInput().appendField("item");
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.contextMenu = false;
    }
};

Blockly.Blocks['text_length'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.text);
        this.appendValueInput("VALUE")
            .setCheck("String")
            .appendField("length");
        this.setOutput(true, "Number");
        this.setTooltip("Returns length of text");
    }
};

Blockly.Blocks['text_isEmpty'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.text);
        this.appendValueInput("VALUE")
            .setCheck("String")
            .appendField("is empty");
        this.setOutput(true, "Boolean");
        this.setTooltip("Returns true if text is empty");
    }
};

Blockly.Blocks['text_compare'] = {
    init: function (this: Blockly.Block) {
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

Blockly.Blocks['text_trim'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.text);
        this.appendValueInput("TEXT")
            .setCheck("String")
            .appendField("trim");
        this.setOutput(true, "String");
        this.setTooltip("Trim spaces from text");
    }
};

Blockly.Blocks['text_changeCase'] = {
    init: function (this: Blockly.Block) {
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

Blockly.Blocks['text_contains'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.text);
        this.appendValueInput("TEXT")
            .setCheck("String")
            .appendField(new Blockly.FieldDropdown([
                ["contains", "CONTAINS"],
                ["contains any", "CONTAINS_ANY"],
                ["contains all", "CONTAINS_ALL"]
            ]), "MODE");
        this.appendValueInput("PIECE")
            .setCheck(null)
            .appendField("text")
            .appendField("piece");
        this.setInputsInline(false);
        this.setOutput(true, 'Boolean');
        this.setTooltip('Check if text contains the given piece, any of the pieces, or all of the pieces.');
    }
};

Blockly.Blocks['text_split'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.text);
        this.appendValueInput("TEXT")
            .setCheck("String")
            .appendField(new Blockly.FieldDropdown([
                ["split", "SPLIT"],
                ["split at first", "SPLIT_FIRST"],
                ["split at first of any", "SPLIT_FIRST_ANY"],
                ["split at any", "SPLIT_ANY"],
                ["split at spaces", "SPLIT_SPACES"]
            ]), "MODE");
        this.appendValueInput("AT")
            .setCheck(null)
            .appendField("text")
            .appendField("at");
        this.setInputsInline(false);
        this.setOutput(true, "List");
    }
};

Blockly.Blocks['text_indexOf'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.text);
        this.appendValueInput('VALUE').setCheck('String').appendField('in text');
        this.appendValueInput('FIND').setCheck('String').appendField('find');
        this.setInputsInline(true);
        this.setOutput(true, 'Number');
        this.setTooltip('Returns the position of the first occurrence of the first text in the second text, or 0 if it is not present.');
    }
};

Blockly.Blocks['text_charAt'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.text);
        this.appendValueInput('VALUE').setCheck('String').appendField('in text');
        this.appendValueInput('AT').setCheck('Number').appendField('get letter #');
        this.setInputsInline(true);
        this.setOutput(true, 'String');
        this.setTooltip('Returns the letter at the specified position.');
    }
};

Blockly.Blocks['text_getSubstring'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.text);
        this.appendValueInput('STRING').setCheck('String').appendField('in text');
        this.appendValueInput('AT1').setCheck('Number').appendField('get substring from');
        this.appendValueInput('AT2').setCheck('Number').appendField('to');
        this.setInputsInline(true);
        this.setOutput(true, 'String');
        this.setTooltip('Returns the specified part of the text.');
    }
};

Blockly.Blocks['text_segment'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.text);
        this.appendValueInput('TEXT').setCheck('String').appendField('segment');
        this.appendValueInput('START').setCheck('Number').appendField('text').appendField('start');
        this.appendValueInput('LENGTH').setCheck('Number').appendField('length');
        this.setInputsInline(true);
        this.setOutput(true, 'String');
        this.setTooltip('Extracts part of the text starting at start position and continuing for length characters.');
    }
};

Blockly.Blocks['text_replace_all'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.text);
        this.appendValueInput('TEXT').setCheck('String').appendField('replace all');
        this.appendValueInput('SEGMENT').setCheck('String').appendField('text').appendField('segment');
        this.appendValueInput('REPLACEMENT').setCheck('String').appendField('replacement');
        this.setInputsInline(false);
        this.setOutput(true, 'String');
        this.setTooltip('Returns a new text string obtained by replacing all occurrences of the substring with the replacement.');
    }
};

Blockly.Blocks['text_obfuscated'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.text);
        this.appendDummyInput()
            .appendField('obfuscated text')
            .appendField(new Blockly.FieldTextInput(''), 'TEXT');
        this.setOutput(true, 'String');
        this.setTooltip('Produces text that is not easily discoverable by examining the app contents. Use for API keys.');
    }
};

Blockly.Blocks['text_is_string'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.text);
        this.appendValueInput('THING')
            .appendField('is a string?');
        this.setOutput(true, 'Boolean');
        this.setTooltip('Returns true if the given value is a text string, otherwise false.');
    }
};

Blockly.Blocks['text_reverse'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.text);
        this.appendValueInput('TEXT')
            .setCheck('String')
            .appendField('reverse');
        this.setOutput(true, 'String');
        this.setTooltip('Reverse the given text.');
    }
};

Blockly.Blocks['text_replace_all_mappings'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.text);
        this.appendValueInput('TEXT')
            .setCheck('String')
            .appendField('replace all mappings');
        this.appendValueInput('MAPPINGS')
            .setCheck('Dictionary')
            .appendField('text')
            .appendField('mappings');
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown([
                ['dictionary order', 'DICTIONARY_ORDER'],
                ['longest string first order', 'LONGEST_STRING_FIRST']
            ]), 'ORDER');
        this.setInputsInline(false);
        this.setOutput(true, 'String');
        this.setTooltip('Given a dictionary of mappings, replaces the key entries in the text with the corresponding values.');
    }
};

Blockly.Blocks['text_starts_at'] = {
    init: function (this: Blockly.Block) {
        this.setColour(BLOCK_COLORS.text);
        this.appendValueInput('TEXT').setCheck('String').appendField('starts at');
        this.appendValueInput('PIECE').setCheck('String').appendField('text').appendField('piece');
        this.setInputsInline(true);
        this.setOutput(true, 'Number');
        this.setTooltip('Returns the character position where the first character of piece first appears in text, or 0 if not present.');
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
    'text_contains': Blockly.Blocks['text_contains'],
    'text_compare': Blockly.Blocks['text_compare'],
    'text_split': Blockly.Blocks['text_split'],
    'text_segment': Blockly.Blocks['text_segment'],
    'text_replace_all': Blockly.Blocks['text_replace_all'],
    'text_obfuscated': Blockly.Blocks['text_obfuscated'],
    'text_is_string': Blockly.Blocks['text_is_string'],
    'text_reverse': Blockly.Blocks['text_reverse'],
    'text_replace_all_mappings': Blockly.Blocks['text_replace_all_mappings'],
    'text_starts_at': Blockly.Blocks['text_starts_at']
};
