// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// List Blocks for Blockly
// Defines standard list operations (add, delete, etc.)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Blockly.Blocks['list_add'] = {
  init: function() {
    this.appendValueInput('ITEM')
        .setCheck(null)
        .appendField('add');
    this.appendDummyInput()
        .appendField('to')
        .appendField(new Blockly.FieldVariable('list'), 'LIST');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(330, '#FF661A'); // Orange-red for Lists
    this.setTooltip('Add an item to the end of the list');
  }
};

Blockly.Blocks['list_delete'] = {
  init: function() {
    this.appendValueInput('INDEX')
        .setCheck('Number')
        .appendField('delete');
    this.appendDummyInput()
        .appendField('of')
        .appendField(new Blockly.FieldVariable('list'), 'LIST');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(330, '#FF661A');
    this.setTooltip('Delete the item at the specified position');
  }
};

Blockly.Blocks['list_delete_all'] = {
  init: function() {
    this.appendDummyInput()
        .appendField('delete all of')
        .appendField(new Blockly.FieldVariable('list'), 'LIST');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(330, '#FF661A');
    this.setTooltip('Delete all items in the list');
  }
};

Blockly.Blocks['list_insert'] = {
  init: function() {
    this.appendValueInput('ITEM')
        .setCheck(null)
        .appendField('insert');
    this.appendValueInput('INDEX')
        .setCheck('Number')
        .appendField('at');
    this.appendDummyInput()
        .appendField('of')
        .appendField(new Blockly.FieldVariable('list'), 'LIST');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(330, '#FF661A');
    this.setTooltip('Insert an item at the specified position');
  }
};

Blockly.Blocks['list_replace'] = {
  init: function() {
    this.appendValueInput('INDEX')
        .setCheck('Number')
        .appendField('replace item');
    this.appendDummyInput()
        .appendField('of')
        .appendField(new Blockly.FieldVariable('list'), 'LIST')
        .appendField('with');
    this.appendValueInput('ITEM')
        .setCheck(null);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(330, '#FF661A');
    this.setTooltip('Replace an item at the specified position');
  }
};

Blockly.Blocks['list_item_of'] = {
  init: function() {
    this.appendValueInput('INDEX')
        .setCheck('Number')
        .appendField('item');
    this.appendDummyInput()
        .appendField('of')
        .appendField(new Blockly.FieldVariable('list'), 'LIST');
    this.setOutput(true, null);
    this.setColour(330, '#FF661A');
    this.setTooltip('Returns the item at the specified position');
  }
};

Blockly.Blocks['list_length'] = {
  init: function() {
    this.appendDummyInput()
        .appendField('length of')
        .appendField(new Blockly.FieldVariable('list'), 'LIST');
    this.setOutput(true, 'Number');
    this.setColour(330, '#FF661A');
    this.setTooltip('Returns the number of items in the list');
  }
};

Blockly.Blocks['list_contains'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(new Blockly.FieldVariable('list'), 'LIST')
        .appendField('contains');
    this.appendValueInput('ITEM')
        .setCheck(null);
    this.appendDummyInput()
        .appendField('?');
    this.setOutput(true, 'Boolean');
    this.setColour(330, '#FF661A');
    this.setTooltip('Returns true if the list contains the item');
  }
};

export default function registerListBlocks() {
  console.log('[ListBlocks] Registered custom list blocks');
}
