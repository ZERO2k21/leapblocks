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
  const [code] = generator.addVariable(variableName);
  return `showVariable('${variableName}');\n`;
};

// Generate: hideVariable(variableId) - sets visible flag
javascriptGenerator.forBlock['variable_hide'] = function(block, generator) {
  const variableName = getVariableName(block);
  const [code] = generator.addVariable(variableName);
  return `hideVariable('${variableName}');\n`;
};

// Override variable_get to use runtime getter
// Blockly's default just returns the variable name directly
// We want to use getVariable() function for scope resolution
javascriptGenerator.forBlock['variables_get'] = function(block, generator) {
  const variableName = getVariableName(block);
  return `getVariable('${variableName}')`;
};

console.log('[BlockGenerator] Registered custom code generators for variable blocks');

export default javascriptGenerator;
