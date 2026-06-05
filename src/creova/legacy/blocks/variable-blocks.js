// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Variable Blocks for Blockly
// Defines custom blocks for show/hide variables
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Standard variable blocks (variables_get, variables_set, variables_math)
// are already provided by Blockly. We only need custom blocks for show/hide.

Blockly.Blocks['variable_show'] = {
  init: function() {
    this.appendDummyInput()
        .appendField('show variable')
        .appendField(new Blockly.FieldVariable(), 'VAR');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(230, 'FFBF00'); // Orange (Variables category)
    this.setTooltip('Show the variable on the stage');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['variable_hide'] = {
  init: function() {
    this.appendDummyInput()
        .appendField('hide variable')
        .appendField(new Blockly.FieldVariable(), 'VAR');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(230, 'FFBF00'); // Orange
    this.setTooltip('Hide the variable from the stage');
    this.setHelpUrl('');
  }
};

// Optional: Custom block for "show variable" with checkbox-like behavior could be:
// Blockly.Blocks['variable_set_visible'] = {
//   init: function() {
//     this.appendDummyInput()
//         .appendField('set variable')
//         .appendField(new Blockly.FieldVariable(), 'VAR')
//         .appendField('visible to')
//         .appendField(new Blockly.FieldDropdown([['true', 'true'], ['false', 'false']]), 'VISIBLE');
//     this.setPreviousStatement(true, null);
//     this.setNextStatement(true, null);
//     this.setColour(230, 'FFBF00');
//   }
// };

export default function registerVariableBlocks() {
  // Blocks are registered globally when this file is imported
  console.log('[VariableBlocks] Registered custom variable blocks');
}
