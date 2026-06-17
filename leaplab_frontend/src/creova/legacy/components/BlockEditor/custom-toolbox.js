import * as Blockly from 'blockly';

/**
 * Custom category for Variables and Lists that adds checkboxes
 * to toggle visibility on the stage (leap-like behavior).
 */
export class CustomDataCategory extends Blockly.ToolboxCategory {
  /** @override */
  constructor(categoryDef, toolbox, opt_parent) {
    super(categoryDef, toolbox, opt_parent);
  }

  /**
   * We actually want to customize the FLYOUT, not just the category label.
   * In standard Blockly, the flyout is populated by a callback.
   * To add checkboxes, we can either:
   * 1. Use custom blocks that have a checkbox field.
   * 2. Override the flyout renderer.
   * 
   * Given the constraints, the best way to "fix" the session is to 
   * provide a specialized flyout callback that creates blocks with checkbox fields.
   */
}

/**
 * Registry for custom variable blocks with checkboxes
 */
export const registerCustomFlyoutBlocks = () => {
  // Define a special 'reporter' block with a checkbox for the flyout
  Blockly.Blocks['variable_reporter_checkbox'] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldCheckbox('FALSE', (newValue) => {
          // Trigger visibility toggle
          const varName = this.getFieldValue('VAR');
          if (window.onToggleVisibility) {
            window.onToggleVisibility(varName, newValue === 'TRUE', 'variable');
          }
        }), 'CHECKBOX')
        .appendField(new Blockly.FieldLabelSerializable(''), 'VAR');
      this.setOutput(true, null);
      this.setColour(300, '#FFBF00');
      this.setEditable(false);
    }
  };

  Blockly.Blocks['list_reporter_checkbox'] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldCheckbox('FALSE', (newValue) => {
          const listName = this.getFieldValue('VAR');
          if (window.onToggleVisibility) {
            window.onToggleVisibility(listName, newValue === 'TRUE', 'list');
          }
        }), 'CHECKBOX')
        .appendField(new Blockly.FieldLabelSerializable(''), 'VAR');
      this.setOutput(true, null);
      this.setColour(330, '#FF661A');
      this.setEditable(false);
    }
  };
};

/**
 * Flyout callback for Variables
 */
export const variableFlyoutCallback = (workspace) => {
  const variableList = workspace.getVariableMap().getVariablesOfType('');
  const xmlList = [];

  // 1. Add "Make a Variable" button
  const button = document.createElement('button');
  button.setAttribute('text', 'Make a Variable');
  button.setAttribute('callbackKey', 'showMakeVariableModal');
  xmlList.push(button);

  // 2. Add variables with checkboxes
  variableList.forEach(variable => {
    const block = Blockly.utils.xml.createElement('block');
    block.setAttribute('type', 'variable_reporter_checkbox');

    // Set checked state from actual visibility (need a way to get this!)
    const isVisible = window.getVariableVisibility ? window.getVariableVisibility(variable.name, 'variable') : false;

    const fieldVar = Blockly.utils.xml.createElement('field');
    fieldVar.setAttribute('name', 'VAR');
    fieldVar.textContent = variable.name;
    block.appendChild(fieldVar);

    const fieldCheck = Blockly.utils.xml.createElement('field');
    fieldCheck.setAttribute('name', 'CHECKBOX');
    fieldCheck.textContent = isVisible ? 'TRUE' : 'FALSE';
    block.appendChild(fieldCheck);

    xmlList.push(block);
  });

  // 3. Add standard set/change/show/hide blocks
  if (variableList.length > 0) {
    const sep = document.createElement('sep');
    xmlList.push(sep);

    const setBlock = Blockly.utils.xml.createElement('block');
    setBlock.setAttribute('type', 'variable_set');
    xmlList.push(setBlock);

    const changeBlock = Blockly.utils.xml.createElement('block');
    changeBlock.setAttribute('type', 'variable_change');
    xmlList.push(changeBlock);

    const showBlock = Blockly.utils.xml.createElement('block');
    showBlock.setAttribute('type', 'variable_show');
    xmlList.push(showBlock);

    const hideBlock = Blockly.utils.xml.createElement('block');
    hideBlock.setAttribute('type', 'variable_hide');
    xmlList.push(hideBlock);
  }

  return xmlList;
};

/**
 * Flyout callback for Lists
 */
export const listFlyoutCallback = (workspace) => {
  const listVariables = workspace.getVariableMap().getVariablesOfType('list');
  const xmlList = [];

  const button = document.createElement('button');
  button.setAttribute('text', 'Make a List');
  button.setAttribute('callbackKey', 'showMakeListModal');
  xmlList.push(button);

  listVariables.forEach(list => {
    const block = Blockly.utils.xml.createElement('block');
    block.setAttribute('type', 'list_reporter_checkbox');

    const isVisible = window.getVariableVisibility ? window.getVariableVisibility(list.name, 'list') : false;

    const fieldVar = Blockly.utils.xml.createElement('field');
    fieldVar.setAttribute('name', 'VAR');
    fieldVar.textContent = list.name;
    block.appendChild(fieldVar);

    const fieldCheck = Blockly.utils.xml.createElement('field');
    fieldCheck.setAttribute('name', 'CHECKBOX');
    fieldCheck.textContent = isVisible ? 'TRUE' : 'FALSE';
    block.appendChild(fieldCheck);

    xmlList.push(block);
  });

  if (listVariables.length > 0) {
    const sep = document.createElement('sep');
    xmlList.push(sep);

    ['list_add', 'list_delete', 'list_delete_all', 'list_insert', 'list_replace', 'list_item_of', 'list_length', 'list_contains'].forEach(type => {
      const block = Blockly.utils.xml.createElement('block');
      block.setAttribute('type', type);
      xmlList.push(block);
    });
  }

  return xmlList;
};
