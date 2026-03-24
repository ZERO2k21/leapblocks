// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BlockEditor - Main Blockly Workspace Component
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as Blockly from 'blockly';
import { useVariables } from '../../context/VariablesContext';
import Toolbox from './Toolbox';
import VariableMakerModal from './VariableMakerModal';
import VariableWatcher from '../StageDisplay/VariableWatcher';
import { initializeRuntime, onVariableUpdate } from '../../utils/runtime';

// Import block definitions and generators (must be imported to register)
import '../../blocks/index';
import '../../styles/blockly-styles.css';
import './BlockEditor.css';

const BlockEditor = () => {
  const workspaceRef = useRef(null);
  const blocklyWorkspaceRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const { state, actions, helpers } = useVariables();
  const [blocklyInitialized, setBlocklyInitialized] = useState(false);

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

    // Set up resize observer
    const resizeObserver = new ResizeObserver(() => {
      if (blocklyWorkspaceRef.current) {
        blocklyWorkspaceRef.current.resize();
      }
    });
    resizeObserver.observe(workspaceRef.current);

    // Set up custom callback for "Make a Variable" button
    const originalOnClick = window.showMakeVariableModal;
    window.showMakeVariableModal = () => {
      setShowModal(true);
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
    const variableManager = workspace.getVariableManager();

    // Get current accessible variables
    const { globalVariables, sprites, currentSpriteId } = state;
    const currentSprite = sprites[currentSpriteId] || { localVariables: {} };

    // Build list of all variables that should be accessible
    const allVariables = [
      ...Object.values(globalVariables).map(v => ({ ...v, scope: 'global' })),
      ...Object.values(currentSprite.localVariables).map(v => ({ ...v, scope: 'local' })),
    ];

    // Get existing variables from Blockly's variable manager (map: name -> Variable)
    const existingVars = variableManager.getVariables();
    const existingVarMap = {};
    existingVars.forEach(v => {
      existingVarMap[v.getName()] = v;
    });

    // Create a set of variable names we have in our state
    const stateVarNames = new Set(allVariables.map(v => v.name));

    // 1. Create new variables that don't exist yet
    allVariables.forEach(variable => {
      if (!existingVarMap[variable.name]) {
        variableManager.createVariable(variable.name, null, '');
      }
    });

    // 2. Remove variables that no longer exist in state
    existingVars.forEach(variable => {
      if (!stateVarNames.has(variable.getName())) {
        variableManager.deleteVariable(variable);
      }
    });

    // Refresh toolbox to pick up variable changes
    const toolbox = Toolbox.buildToolbox(state);
    workspace.refreshToolbox(toolbox);

  }, [state.globalVariables, state.sprites, state.currentSpriteId, blocklyInitialized]);

  // Handle variable creation
  const handleCreateVariable = useCallback((name, scope) => {
    actions.createVariable(name, scope, 0);
    setShowModal(false);
  }, [actions]);

  // Export workspace XML
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
    <div className="block-editor-container">
      {/* Toolbar */}
      <div className="block-editor-toolbar">
        <button className="toolbar-btn" onClick={handleRun} title="Run Code">
          ▶️ Run
        </button>
        <button className="toolbar-btn" onClick={handleExport} title="Export">
          📤 Export
        </button>
        <button
          className="toolbar-btn variable-btn"
          onClick={() => setShowModal(true)}
          title="Make a Variable"
        >
          ➕ Make a Variable
        </button>
        <div className="toolbar-spacer" />
        <span className="toolbar-info">
          {Object.keys(state.globalVariables).length + Object.values(state.sprites).reduce((acc, sprite) => acc + Object.keys(sprite.localVariables).length, 0)} variables
        </span>
      </div>

      {/* Blockly Workspace */}
      <div className="blockly-wrapper">
        <div
          ref={workspaceRef}
          className="blockly-workspace"
          style={{ height: '100%', width: '100%' }}
        />
      </div>

      {/* Variable Creation Modal */}
      {showModal && (
        <VariableMakerModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreateVariable}
        />
      )}

      {/* Stage Display for visible variables */}
      <div className="stage-overlay">
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
