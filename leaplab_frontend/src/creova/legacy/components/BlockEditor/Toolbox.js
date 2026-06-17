// Toolbox builder for Blockly
import { useVariables } from '../../context/VariablesContext';

const Toolbox = {
  // Build complete toolbox XML
  buildToolbox(state) {
    const { globalVariables, sprites, currentSpriteId } = state;
    const currentSprite = sprites[currentSpriteId] || { localVariables: {} };

    // Get all accessible variables (global + current sprite local)
    const allVariables = [
      ...Object.values(globalVariables).map(v => ({ ...v, scope: 'global' })),
      ...Object.values(currentSprite.localVariables).map(v => ({ ...v, scope: 'local' })),
    ];

    // Build variable blocks XML
    let variableBlocksXml = '';
    allVariables.forEach(variable => {
      variableBlocksXml += `
        <block type="variable_get" id="${variable.id}_get">
          <field name="VAR">${variable.name}</field>
        </block>
        <block type="variable_set" id="${variable.id}_set">
          <field name="VAR">${variable.name}</field>
          <value name="VALUE">
            <shadow type="math_number">
              <field name="NUM">0</field>
            </shadow>
          </value>
        </block>
        <block type="variable_change" id="${variable.id}_change">
          <field name="VAR">${variable.name}</field>
          <value name="DELTA">
            <shadow type="math_number">
              <field name="NUM">1</field>
            </shadow>
          </value>
        </block>
        <block type="variable_show" id="${variable.id}_show">
          <field name="VAR">${variable.name}</field>
        </block>
        <block type="variable_hide" id="${variable.id}_hide">
          <field name="VAR">${variable.name}</field>
        </block>
      `;
    });

    // Build standard leap/LeapBlox categories
    // Note: We'll add more categories as we implement them
    return `
      <xml id="toolbox" style="display: none">
        <category name="VARIABLES" colour="#FFBF00" custom="LEAP_VARIABLES">
        </category>

        <category name="LISTS" colour="#FF661A" custom="LEAP_LISTS">
        </category>

        <category name="TABLES" colour="#00A693">
          <button text="Make a Table" callback="showMakeTableModal"/>
          <sep/>
          <block type="table_get_cell"/>
          <block type="table_set_cell"/>
          <block type="table_add_row"/>
        </category>

        <category name="MY BLOCKS" colour="#FF6680" custom="PROCEDURE">
          <button text="Make a Block" callback="showMakeBlockModal"/>
        </category>

        <sep/>

        <category name="MOTION" colour="#4C97FF">
          <block type="move_steps"/>
          <block type="turn_right"/>
          <block type="turn_left"/>
          <block type="goto_xy"/>
          <block type="glide_to_xy"/>
        </category>

        <category name="LOOKS" colour="#9966FF">
          <block type="looks_say"/>
          <block type="looks_think"/>
        </category>

        <category name="CONTROL" colour="#FFAB19">
          <block type="controls_wait"/>
          <block type="controls_repeat">
            <value name="TIMES">
              <shadow type="math_whole_number">
                <field name="NUM">10</field>
              </shadow>
            </value>
          </block>
        </category>

        <category name="EVENTS" colour="#D9A6FF">
          <block type="event_when_flag"/>
          <block type="event_when_key"/>
          <block type="event_when_clicked"/>
        </category>
      </xml>
    `;
  },

  // Get just the variable section (for updates)
  buildVariableBlocks(state) {
    const { globalVariables, sprites, currentSpriteId } = state;
    const currentSprite = sprites[currentSpriteId] || { localVariables: {} };

    const allVariables = [
      ...Object.values(globalVariables).map(v => ({ ...v, scope: 'global' })),
      ...Object.values(currentSprite.localVariables).map(v => ({ ...v, scope: 'local' })),
    ];

    let xml = '';
    allVariables.forEach(variable => {
      xml += `
        <block type="variable_get" id="${variable.id}_get">
          <field name="VAR">${variable.name}</field>
        </block>
        <block type="variable_set" id="${variable.id}_set">
          <field name="VAR">${variable.name}</field>
          <value name="VALUE">
            <shadow type="math_number">
              <field name="NUM">0</field>
            </shadow>
          </value>
        </block>
        <block type="variable_change" id="${variable.id}_change">
          <field name="VAR">${variable.name}</field>
          <value name="DELTA">
            <shadow type="math_number">
              <field name="NUM">1</field>
            </shadow>
          </value>
        </block>
        <block type="variable_show" id="${variable.id}_show">
          <field name="VAR">${variable.name}</field>
        </block>
        <block type="variable_hide" id="${variable.id}_hide">
          <field name="VAR">${variable.name}</field>
        </block>
      `;
    });

    return xml;
  }
};

export default Toolbox;
