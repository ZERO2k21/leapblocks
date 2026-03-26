// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Custom Code Generators for Variable Blocks
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Make sure Blockly's JavaScript generator is loaded
if (typeof Blockly === 'undefined') {
  console.error('[BlockGenerator] Blockly is not loaded');
}

// Extend the JavaScript generator with custom block handlers
const javascriptGenerator = Blockly.JavaScript;

if (!javascriptGenerator) {
  console.error('[BlockGenerator] JavaScript generator not found');
}

// Helper: Get variable name from field
function getVariableName(block) {
  const varField = block.getField('VAR');
  return varField ? varField.getValue() : 'undefined_var';
}

// Generate: setVariable(variableId, value)
javascriptGenerator.forBlock['variable_set'] = function(block, generator) {
  const variableName = getVariableName(block);
  const valueCode = generator.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  const [code] = generator.addVariable(variableName);
  return `${code} = ${valueCode};\n`;
};

// Generate: changeVariable(variableId, delta)
javascriptGenerator.forBlock['variable_math'] = function(block, generator) {
  // This is the standard "change [var] by [value]" block
  const variableName = getVariableName(block);
  const deltaCode = generator.valueToCode(block, 'DELTA', Blockly.JavaScript.ORDER_ASSIGNMENT) || '1';
  const [code] = generator.addVariable(variableName);
  return `${code} += ${deltaCode};\n`;
};

// Generate: showVariable(variableId) - sets visible flag
javascriptGenerator.forBlock['variable_show'] = function(block, generator) {
  const variableName = getVariableName(block);
  return `showVariable('${variableName}');\n`;
};

// Generate: hideVariable(variableId) - sets visible flag
javascriptGenerator.forBlock['variable_hide'] = function(block, generator) {
  const variableName = getVariableName(block);
  return `hideVariable('${variableName}');\n`;
};

// ─────────────────────────────────────────────────────────────────────────────
// LIST GENERATORS
// ─────────────────────────────────────────────────────────────────────────────

javascriptGenerator.forBlock['list_add'] = function(block, generator) {
  const variableName = getVariableName(block);
  const itemCode = generator.valueToCode(block, 'ITEM', Blockly.JavaScript.ORDER_COMMA) || 'null';
  return `addToList('${variableName}', ${itemCode});\n`;
};

javascriptGenerator.forBlock['list_delete'] = function(block, generator) {
  const variableName = getVariableName(block);
  const indexCode = generator.valueToCode(block, 'INDEX', Blockly.JavaScript.ORDER_COMMA) || '1';
  return `deleteFromList('${variableName}', ${indexCode});\n`;
};

javascriptGenerator.forBlock['list_delete_all'] = function(block, generator) {
  const variableName = getVariableName(block);
  return `deleteAllFromList('${variableName}');\n`;
};

javascriptGenerator.forBlock['list_insert'] = function(block, generator) {
  const variableName = getVariableName(block);
  const itemCode = generator.valueToCode(block, 'ITEM', Blockly.JavaScript.ORDER_COMMA) || 'null';
  const indexCode = generator.valueToCode(block, 'INDEX', Blockly.JavaScript.ORDER_COMMA) || '1';
  return `insertInList('${variableName}', ${itemCode}, ${indexCode});\n`;
};

javascriptGenerator.forBlock['list_replace'] = function(block, generator) {
  const variableName = getVariableName(block);
  const indexCode = generator.valueToCode(block, 'INDEX', Blockly.JavaScript.ORDER_COMMA) || '1';
  const itemCode = generator.valueToCode(block, 'ITEM', Blockly.JavaScript.ORDER_COMMA) || 'null';
  return `replaceInList('${variableName}', ${indexCode}, ${itemCode});\n`;
};

javascriptGenerator.forBlock['list_item_of'] = function(block, generator) {
  const variableName = getVariableName(block);
  const indexCode = generator.valueToCode(block, 'INDEX', Blockly.JavaScript.ORDER_COMMA) || '1';
  return [`getItemOfList('${variableName}', ${indexCode})`, Blockly.JavaScript.ORDER_FUNCTION_CALL];
};

javascriptGenerator.forBlock['list_length'] = function(block, generator) {
  const variableName = getVariableName(block);
  return [`getListLength('${variableName}')`, Blockly.JavaScript.ORDER_FUNCTION_CALL];
};

javascriptGenerator.forBlock['list_contains'] = function(block, generator) {
  const variableName = getVariableName(block);
  const itemCode = generator.valueToCode(block, 'ITEM', Blockly.JavaScript.ORDER_COMMA) || 'null';
  return [`listContains('${variableName}', ${itemCode})`, Blockly.JavaScript.ORDER_FUNCTION_CALL];
};

// ─────────────────────────────────────────────────────────────────────────────
// TABLE GENERATORS
// ─────────────────────────────────────────────────────────────────────────────

javascriptGenerator.forBlock['table_get_cell'] = function(block, generator) {
  const tableName = getVariableName(block);
  const row = generator.valueToCode(block, 'ROW', Blockly.JavaScript.ORDER_COMMA) || '1';
  const col = generator.valueToCode(block, 'COL', Blockly.JavaScript.ORDER_COMMA) || '1';
  return [`getTableCell('${tableName}', ${row}, ${col})`, Blockly.JavaScript.ORDER_FUNCTION_CALL];
};

javascriptGenerator.forBlock['table_set_cell'] = function(block, generator) {
  const tableName = getVariableName(block);
  const row = generator.valueToCode(block, 'ROW', Blockly.JavaScript.ORDER_COMMA) || '1';
  const col = generator.valueToCode(block, 'COL', Blockly.JavaScript.ORDER_COMMA) || '1';
  const val = generator.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_COMMA) || '""';
  return `setTableCell('${tableName}', ${row}, ${col}, ${val});\n`;
};

javascriptGenerator.forBlock['table_add_row'] = function(block, generator) {
  const tableName = getVariableName(block);
  const data = generator.valueToCode(block, 'DATA', Blockly.JavaScript.ORDER_COMMA) || '[]';
  return `addTableRow('${tableName}', ${data});\n`;
};

// Override variable_get to use runtime getter
// Blockly's default just returns the variable name directly
// We want to use getVariable() function for scope resolution
javascriptGenerator.forBlock['variables_get'] = function(block, generator) {
  const variableName = getVariableName(block);
  return [`getVariable('${variableName}')`, Blockly.JavaScript.ORDER_ATOMIC];
};

javascriptGenerator.forBlock['variable_reporter_checkbox'] = function(block, generator) {
  const variableName = getVariableName(block);
  return [`getVariable('${variableName}')`, Blockly.JavaScript.ORDER_ATOMIC];
};

javascriptGenerator.forBlock['list_reporter_checkbox'] = function(block, generator) {
  const variableName = getVariableName(block);
  // Scratch lists joined by space when used as a reporter
  return [`getItemOfList('${variableName}', 'all').join(' ')`, Blockly.JavaScript.ORDER_ATOMIC];
};

console.log('[BlockGenerator] Registered custom code generators for variable blocks');

export default javascriptGenerator;
