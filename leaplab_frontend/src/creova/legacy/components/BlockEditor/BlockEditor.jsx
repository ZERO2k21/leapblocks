// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BlockEditor - Main Blockly Workspace Component
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as Blockly from 'blockly';
import { useVariables } from '../../context/VariablesContext';
import Toolbox from './Toolbox';
import {
  registerCustomFlyoutBlocks,
  variableFlyoutCallback,
  listFlyoutCallback
} from './custom-toolbox';
import VariableMakerModal from './VariableMakerModal';
import CustomBlockModal from './CustomBlockModal';
import VariableWatcher from '../StageDisplay/VariableWatcher';
import { initializeRuntime, onVariableUpdate } from '../../utils/runtime';

// Import block definitions and generators (must be imported to register)
import '../../blocks/index';
import '../../styles/blockly-styles.css';

const TOOLBAR_BUTTONS = [
  { label: '▶️ Run', title: 'Run Code', variant: 'default' },
  { label: '📤 Export', title: 'Export', variant: 'default' },
];

function validateBlock(block) {
  let error = null;
  let warning = null;

  block.inputList.forEach(input => {
    if (input.type === Blockly.inputs.inputTypes.VALUE && !input.connection?.targetConnection) {
      error = 'Error: Missing input — this socket needs a block attached.';
    }
  });

  const isRootType = block.type.includes('event') ||
    block.type.includes('procedures_def') ||
    block.type === 'global_declaration';

  if (!block.getParent() && !isRootType) {
    if (block.outputConnection || block.previousConnection) {
      warning = 'Warning: This block is not connected to any event or procedure, so it will not run.';
    }
  }

  return { error, warning };
}

const BlockEditor = () => {
  const workspaceRef = useRef(null);
  const blocklyWorkspaceRef = useRef(null);
  const [showModal, setShowModal] = useState(null);
  const { state, actions, helpers } = useVariables();
  const [blocklyInitialized, setBlocklyInitialized] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [warningCount, setWarningCount] = useState(0);

  // Initialize Blockly workspace
  useEffect(() => {
    if (!workspaceRef.current || blocklyInitialized) return;

    // Define toolbox XML
    const toolbox = Toolbox.buildToolbox(state);

    // Create workspace
    blocklyWorkspaceRef.current = Blockly.inject(workspaceRef.current, {
      toolbox: toolbox,
      scrollbars: true,
      trashcan: true,
      zoom: {
        controls: true,
        wheel: true,
        startScale: 1.0,
        maxScale: 3,
        minScale: 0.3,
        scaleSpeed: 1.2,
        pinch: true,
      },
      grid: {
        spacing: 20,
        length: 3,
        colour: '#ccc',
        snap: true,
      },
      theme: Blockly.Themes.Classic,
    });

    // Register custom flyout callbacks
    registerCustomFlyoutBlocks();
    blocklyWorkspaceRef.current.registerToolboxCategoryCallback(
      'LEAP_VARIABLES',
      variableFlyoutCallback
    );
    blocklyWorkspaceRef.current.registerToolboxCategoryCallback(
      'LEAP_LISTS',
      listFlyoutCallback
    );

    // Set up resize observer
    const resizeObserver = new ResizeObserver(() => {
      if (blocklyWorkspaceRef.current) {
        blocklyWorkspaceRef.current.resize();
      }
    });
    resizeObserver.observe(workspaceRef.current);

    // Set up custom callbacks for buttons
    window.showMakeVariableModal = () => setShowModal('variable');
    window.showMakeListModal = () => setShowModal('list');
    window.showMakeTableModal = () => setShowModal('table');
    window.showMakeBlockModal = () => setShowModal('custom_block');

    // Visibility helpers for checkboxes
    window.onToggleVisibility = (name, isVisible, type) => {
      // Find the variable/list ID and update it
      const accessible = helpers.getAccessibleVariables();
      const items = type === 'list' ? accessible.lists : accessible.variables;
      const item = items.find(i => i.name === name);
      if (item) {
        actions.setVariableVisible(item.id, isVisible);
      }
    };

    window.getVariableVisibility = (name, type) => {
      const accessible = helpers.getAccessibleVariables();
      const items = type === 'list' ? accessible.lists : accessible.variables;
      const item = items.find(i => i.name === name);
      return item ? item.visible : false;
    };

    setBlocklyInitialized(true);

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      if (blocklyWorkspaceRef.current) {
        blocklyWorkspaceRef.current.dispose();
      }
      window.showMakeVariableModal = originalOnClick;
    };
  }, [blocklyInitialized]);

  // Sync variables with Blockly's VariableManager and update toolbox
  useEffect(() => {
    if (!blocklyInitialized || !blocklyWorkspaceRef.current) return;

    const workspace = blocklyWorkspaceRef.current;
    const variableManager = workspace.getVariableMap ? workspace.getVariableMap() : workspace.getVariableManager();

    // Get current accessible data
    const accessible = helpers.getAccessibleVariables();
    const { variables, lists, tables } = accessible;

    // Sync variables (type: '')
    variables.forEach(v => {
      if (!variableManager.getVariableByNameAndType(v.name, '')) {
        variableManager.createVariable(v.name, '', v.id);
      }
    });

    // Sync lists (type: 'list')
    lists.forEach(l => {
      if (!variableManager.getVariableByNameAndType(l.name, 'list')) {
        variableManager.createVariable(l.name, 'list', l.id);
      }
    });

    // Sync tables (type: 'table')
    tables.forEach(t => {
      if (!variableManager.getVariableByNameAndType(t.name, 'table')) {
        variableManager.createVariable(t.name, 'table', t.id);
      }
    });

    // Refresh toolbox to pick up changes
    const toolbox = Toolbox.buildToolbox(state);
    workspace.refreshToolbox(toolbox);

  }, [blocklyInitialized, state.currentSpriteId, state.globalVariables, state.globalLists, state.sprites, helpers]);

  // Handle Sprite Switching (Load/Save Workspace)
  const currentSpriteIdRef = useRef(state.currentSpriteId);

  useEffect(() => {
    if (!blocklyInitialized || !blocklyWorkspaceRef.current) return;
    const workspace = blocklyWorkspaceRef.current;

    // 1. Save previous sprite's blocks if it changed
    if (currentSpriteIdRef.current !== state.currentSpriteId) {
      const xml = Blockly.Xml.workspaceToDom(workspace);
      const xmlString = new XMLSerializer().serializeToString(xml);
      actions.updateSpriteBlocks(currentSpriteIdRef.current, xmlString);

      // 2. Load the new sprite's blocks
      workspace.clear();
      const newBlocks = state.sprites[state.currentSpriteId]?.blocks;
      if (newBlocks) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(newBlocks, 'text/xml');
        Blockly.Xml.domToWorkspace(xmlDoc.documentElement, workspace);
      }

      currentSpriteIdRef.current = state.currentSpriteId;
    }
  }, [state.currentSpriteId, blocklyInitialized, state.sprites, actions]);

  // Autosave workspace + validate blocks on change
  useEffect(() => {
    if (!blocklyInitialized || !blocklyWorkspaceRef.current) return;
    const workspace = blocklyWorkspaceRef.current;

    let validationTimer;

    const onWorkspaceChange = (event) => {
      if (event.isUiEvent) return;
      const xml = Blockly.Xml.workspaceToDom(workspace);
      const xmlString = new XMLSerializer().serializeToString(xml);
      actions.updateSpriteBlocks(state.currentSpriteId, xmlString);

      if (validationTimer) clearTimeout(validationTimer);
      validationTimer = setTimeout(() => {
        let errors = 0;
        let warnings = 0;
        const allBlocks = workspace.getAllBlocks(false);
        allBlocks.forEach(block => {
          const { error, warning } = validateBlock(block);
          if (error) { block.setWarningText(error); errors++; }
          else if (warning) { block.setWarningText(warning); warnings++; }
          else block.setWarningText(null);
        });
        setErrorCount(errors);
        setWarningCount(warnings);
      }, 150);
    };

    workspace.addChangeListener(onWorkspaceChange);
    return () => {
      workspace.removeChangeListener(onWorkspaceChange);
      if (validationTimer) clearTimeout(validationTimer);
    };
  }, [blocklyInitialized, state.currentSpriteId, actions]);

  // Handle variable/list/table creation
  const handleCreateData = useCallback((name, arg2, arg3) => {
    // Variable: name, scope
    // List: name, scope
    // Table: name, columns, scope

    if (showModal === 'variable') {
      actions.createVariable(name, arg2, 0);
    } else if (showModal === 'list') {
      actions.createList(name, arg2);
    } else if (showModal === 'table') {
      actions.createTable(name, arg2, arg3);
    }

    setShowModal(null);
  }, [showModal, actions]);

  // Handle custom block creation
  const handleCreateCustomBlock = useCallback((data) => {
    if (!blocklyWorkspaceRef.current) return;
    const workspace = blocklyWorkspaceRef.current;

    // In leap/Blockly, we create a procedure definition block
    // This is a bit complex as it requires building the block XML or JSON
    // For now, we'll use a simplified version that adds a definition block

    Blockly.Events.setGroup(true);
    try {
      const topBlocks = workspace.getTopBlocks(true);
      const x = 50;
      const y = topBlocks.length * 150 + 50;

      // 1. Create the definition block
      const defBlock = workspace.newBlock('procedures_defnoreturn');

      // 2. Set the name
      defBlock.setFieldValue(data.name, 'NAME');

      // 3. Set arguments (this is for standard Blockly)
      // data.inputs: [{ type: 'number', name: 'arg1' }, ...]
      const argNames = data.inputs
        .filter(i => i.type !== 'label')
        .map(i => i.name);

      if (defBlock.updateParams_) {
        defBlock.arguments_ = [...argNames];
        defBlock.updateParams_();
      } else if (defBlock.setStatements_) {
        // Some versions use different internal methods
      }

      // 4. Handle 'Run without screen refresh' (warp)
      // In leap-Blocks this is a checkbox in the mutation
      if (data.noRefresh) {
        // This is a custom property we'll check during execution
        defBlock.customProperties_ = { warp: true };
      }

      defBlock.initSvg();
      defBlock.render();
      defBlock.moveBy(x, y);

      // Update toolbox to show the new 'call' block
      workspace.getToolbox().refreshSelection();

      setShowModal(null);
    } catch (err) {
      console.error('Error creating custom block:', err);
    } finally {
      Blockly.Events.setGroup(false);
    }
  }, []);
  const handleExport = useCallback(() => {
    if (blocklyWorkspaceRef.current) {
      const xml = Blockly.Xml.workspaceToDom(blocklyWorkspaceRef.current);
      const serializer = new XMLSerializer();
      const xmlString = serializer.serializeToString(xml);
      console.log('Exported XML:', xmlString);
      return xmlString;
    }
  }, []);

  // Import workspace XML
  const handleImport = useCallback((xmlString) => {
    if (!blocklyWorkspaceRef.current) return;
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    const dom = Blockly.Xml.domToWorkspace(xmlDoc, blocklyWorkspaceRef.current);
    return dom;
  }, []);

  // Run code
  const handleRun = useCallback(() => {
    if (!blocklyWorkspaceRef.current) return;

    try {
      // Generate JavaScript code
      const code = Blockly.JavaScript.workspaceToCode(blocklyWorkspaceRef.current);
      console.log('Generated code:', code);

      // Initialize runtime with current React state
      initializeRuntime(state);

      // Subscribe to runtime updates to sync back to React state
      onVariableUpdate((variableId, newValue, scope) => {
        actions.updateVariableValue(variableId, newValue, scope);
      });

      // Execute the generated code in a safe sandbox
      // Note: In production, consider using a Web Worker or vm2 for isolation
      const execute = new Function(code);
      execute();

      console.log('[BlockEditor] Code executed successfully');
      alert('Code executed successfully! Check console for details.');
    } catch (error) {
      console.error('Error executing code:', error);
      alert('Error executing code: ' + error.message);
    }
  }, [state, actions]);

  return (
    <div className="flex flex-col h-full w-full relative bg-[#f5f5f5]">
      <div className="flex items-center gap-3 px-5 py-3 bg-white border-b border-[#ddd] shadow-[0_2px_4px_rgba(0,0,0,0.05)] z-[100]">
        {TOOLBAR_BUTTONS.map((btn, i) => (
          <button
            key={i}
            className="px-4 py-2 border-none rounded-lg text-[14px] font-semibold cursor-pointer transition-all duration-[200ms] bg-[#f0f0f0] text-[#333] flex items-center gap-1.5 hover:bg-[#e0e0e0] hover:-translate-y-px active:translate-y-0"
            onClick={i === 0 ? handleRun : handleExport}
            title={btn.title}
          >
            {btn.label}
          </button>
        ))}
        <button
          className="px-4 py-2 border-none rounded-lg text-[14px] font-semibold cursor-pointer flex items-center gap-1.5 bg-gradient-to-r from-[#FF9F43] to-[#FF6B6B] text-white shadow-[0_4px_12px_rgba(255,159,67,0.3)] hover:shadow-[0_6px_16px_rgba(255,159,67,0.4)] hover:-translate-y-px active:translate-y-0 transition-all duration-[200ms]"
          onClick={() => setShowModal(true)}
          title="Make a Variable"
        >
          ➕ Make a Variable
        </button>
        <div className="flex items-center gap-2 mr-2">
          {(errorCount > 0 || warningCount > 0) && (
            <>
              {errorCount > 0 && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold text-[#e11d48] bg-[#fff1f2] border border-[#ffe4e6] cursor-help" title={`${errorCount} block(s) with missing inputs — hover the warning icons on blocks for details`}>
                  <span className="text-[13px]">●</span>
                  {errorCount}
                </span>
              )}
              {warningCount > 0 && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold text-[#d97706] bg-[#fef3c7] border border-[#fde68a] cursor-help" title={`${warningCount} orphan block(s) — not connected to any event or procedure`}>
                  <span className="text-[13px]">⚠</span>
                  {warningCount}
                </span>
              )}
            </>
          )}
          <span className="text-[13px] text-[#666] px-3 py-1.5 bg-[#f5f5f5] rounded-md">
            {Object.keys(state.globalVariables).length + Object.values(state.sprites).reduce((acc, sprite) => acc + Object.keys(sprite.localVariables).length, 0)} variables
          </span>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <div
          ref={workspaceRef}
          className="absolute inset-0"
          style={{ height: '100%', width: '100%' }}
        />
      </div>

      {showModal && showModal !== 'custom_block' && (
        <VariableMakerModal
          type={showModal}
          onClose={() => setShowModal(null)}
          onCreate={handleCreateData}
        />
      )}

      {showModal === 'custom_block' && (
        <CustomBlockModal
          onClose={() => setShowModal(null)}
          onCreate={handleCreateCustomBlock}
        />
      )}

      <div className="absolute inset-0 pointer-events-none overflow-hidden z-[500]">
        {(() => {
          // Gather all visible variables
          const visibleVars = [];

          // Add global visible variables
          Object.values(state.globalVariables).forEach(v => {
            if (v.visible) visibleVars.push({ ...v, scope: 'global' });
          });

          // Add current sprite's visible local variables
          const currentSprite = state.sprites[state.currentSpriteId];
          if (currentSprite) {
            Object.values(currentSprite.localVariables).forEach(v => {
              if (v.visible) visibleVars.push({ ...v, scope: 'local' });
            });
          }

          return visibleVars.map(variable => (
            <VariableWatcher
              key={variable.id}
              variable={variable}
              onPositionChange={(id, x, y) => {
                const scope = variable.scope;
                actions.updateVariablePosition(id, x, y, scope);
              }}
              onClose={() => actions.setVariableVisible(variable.id, false, variable.scope)}
            />
          ));
        })()}
      </div>
    </div>
  );
};

export default BlockEditor;
