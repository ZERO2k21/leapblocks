// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Table Blocks for Blockly
// Defines operations for Pictoblox-style Tables
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Blockly.Blocks['table_get_cell'] = {
  init: function() {
    this.appendValueInput('ROW')
        .setCheck('Number')
        .appendField('get cell at row');
    this.appendValueInput('COL')
        .setCheck(null)
        .appendField('column');
    this.appendDummyInput()
        .appendField('of')
        .appendField(new Blockly.FieldVariable('table'), 'TABLE');
    this.setOutput(true, null);
    this.setColour(200, '#00A693'); // Teal-ish for Tables
    this.setTooltip('Returns the value of a specific cell in the table');
  }
};

Blockly.Blocks['table_set_cell'] = {
  init: function() {
    this.appendValueInput('ROW')
        .setCheck('Number')
        .appendField('set cell at row');
    this.appendValueInput('COL')
        .setCheck(null)
        .appendField('column');
    this.appendDummyInput()
        .appendField('of')
        .appendField(new Blockly.FieldVariable('table'), 'TABLE')
        .appendField('to');
    this.appendValueInput('VALUE')
        .setCheck(null);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(200, '#00A693');
    this.setTooltip('Sets the value of a specific cell in the table');
  }
};

Blockly.Blocks['table_add_row'] = {
  init: function() {
    this.appendDummyInput()
        .appendField('add row to')
        .appendField(new Blockly.FieldVariable('table'), 'TABLE');
    this.appendValueInput('DATA')
        .setCheck('Array')
        .appendField('with data');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(200, '#00A693');
    this.setTooltip('Adds a new row to the table');
  }
};

export default function registerTableBlocks() {
  console.log('[TableBlocks] Registered custom table blocks');
}
