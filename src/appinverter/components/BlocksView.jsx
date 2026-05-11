/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useEffect, useRef } from 'react';
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';

// Import block definitions - these register blocks globally
import '../blocks/definitions/control';
import '../blocks/definitions/logic';
import '../blocks/definitions/math';
import '../blocks/definitions/text';
import '../blocks/definitions/components';

// Import code generator
import '../blocks/generators/reactnative';

export default function BlocksView({ appState }) {
  const blocklyDiv = useRef(null);
  const workspaceRef = useRef(null);

  useEffect(() => {
    if (!blocklyDiv.current) return;

    // Dispose existing workspace if any
    if (workspaceRef.current) {
      workspaceRef.current.dispose();
      workspaceRef.current = null;
    }

    // Create toolbox from app components
    const toolbox = createToolbox(appState);

    // Initialize Blockly workspace with proper configuration
    try {
      workspaceRef.current = Blockly.inject(blocklyDiv.current, {
        toolbox: toolbox,
        grid: {
          spacing: 20,
          length: 3,
          colour: '#ccc',
          snap: true
        },
        zoom: {
          controls: true,
          wheel: true,
          startScale: 1.0,
          maxScale: 3,
          minScale: 0.3,
          scaleSpeed: 1.2
        },
        trashcan: true,
        sounds: false,
        theme: Blockly.Themes.Classic,
        move: {
          scrollbars: true,
          drag: true,
          wheel: true
        },
        media: 'https://unpkg.com/blockly/media/', // Use CDN for media files
        renderer: 'zelos', // Use modern Zelos renderer for better visuals
        horizontalLayout: false,
        toolboxPosition: 'start'
      });

      // Resize workspace to fit container
      Blockly.svgResize(workspaceRef.current);

      // Listen for changes
      workspaceRef.current.addChangeListener((event) => {
        try {
          // Only generate code on meaningful changes
          if (event.type === Blockly.Events.BLOCK_CHANGE ||
            event.type === Blockly.Events.BLOCK_CREATE ||
            event.type === Blockly.Events.BLOCK_DELETE ||
            event.type === Blockly.Events.BLOCK_MOVE) {
            const code = javascriptGenerator.workspaceToCode(workspaceRef.current);

            // Update app state with block logic
            if (appState.setBlockLogic) {
              appState.setBlockLogic(code);
            }
          }
        } catch (error) {
          console.error('Error generating code:', error);
        }
      });

      console.log('✅ Blockly workspace initialized successfully');
      console.log('📦 Registered blocks:', Object.keys(Blockly.Blocks).length);
    } catch (error) {
      console.error('❌ Error initializing Blockly:', error);
    }

    return () => {
      if (workspaceRef.current) {
        workspaceRef.current.dispose();
        workspaceRef.current = null;
      }
    };
  }, [appState]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (workspaceRef.current) {
        Blockly.svgResize(workspaceRef.current);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const createToolbox = (appState) => {
    const components = appState.screens.flatMap(s => s.components);

    return {
      kind: 'categoryToolbox',
      contents: [
        {
          kind: 'category',
          name: 'Events',
          colour: '230',
          contents: [
            {
              kind: 'block',
              type: 'component_event'
            }
          ]
        },
        {
          kind: 'category',
          name: 'Control',
          colour: '120',
          contents: [
            { kind: 'block', type: 'controls_if' },
            { kind: 'block', type: 'controls_for' },
            { kind: 'block', type: 'controls_whileUntil' },
            { kind: 'block', type: 'controls_wait' },
            { kind: 'block', type: 'controls_break' }
          ]
        },
        {
          kind: 'category',
          name: 'Logic',
          colour: '210',
          contents: [
            { kind: 'block', type: 'logic_compare' },
            { kind: 'block', type: 'logic_operation' },
            { kind: 'block', type: 'logic_negate' },
            { kind: 'block', type: 'logic_boolean' },
            { kind: 'block', type: 'logic_null' },
            { kind: 'block', type: 'logic_ternary' }
          ]
        },
        {
          kind: 'category',
          name: 'Math',
          colour: '230',
          contents: [
            { kind: 'block', type: 'math_number' },
            { kind: 'block', type: 'math_arithmetic' },
            { kind: 'block', type: 'math_single' },
            { kind: 'block', type: 'math_trig' },
            { kind: 'block', type: 'math_random_int' },
            { kind: 'block', type: 'math_random_float' },
            { kind: 'block', type: 'math_modulo' },
            { kind: 'block', type: 'math_round' }
          ]
        },
        {
          kind: 'category',
          name: 'Text',
          colour: '160',
          contents: [
            { kind: 'block', type: 'text' },
            { kind: 'block', type: 'text_join' },
            { kind: 'block', type: 'text_length' },
            { kind: 'block', type: 'text_isEmpty' },
            { kind: 'block', type: 'text_contains' },
            { kind: 'block', type: 'text_changeCase' },
            { kind: 'block', type: 'text_trim' }
          ]
        },
        {
          kind: 'category',
          name: 'Components',
          colour: '160',
          contents: [
            { kind: 'block', type: 'component_set_property' },
            { kind: 'block', type: 'component_get_property' },
            { kind: 'block', type: 'component_method' }
          ]
        },
        {
          kind: 'category',
          name: 'Screen',
          colour: '290',
          contents: [
            { kind: 'block', type: 'navigate_screen' },
            { kind: 'block', type: 'close_screen' },
            { kind: 'block', type: 'notifier_show' }
          ]
        },
        {
          kind: 'category',
          name: 'Media',
          colour: '290',
          contents: [
            { kind: 'block', type: 'sound_play' },
            { kind: 'block', type: 'device_vibrate' }
          ]
        }
      ]
    };
  };

  const handleClearWorkspace = () => {
    if (workspaceRef.current && window.confirm('Clear all blocks?')) {
      workspaceRef.current.clear();
    }
  };

  const handleExportBlocks = () => {
    if (workspaceRef.current) {
      const xml = Blockly.Xml.workspaceToDom(workspaceRef.current);
      const xmlText = Blockly.Xml.domToText(xml);

      const blob = new Blob([xmlText], { type: 'text/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${appState.appName}_blocks.xml`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleImportBlocks = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xml';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const xml = Blockly.Xml.textToDom(event.target.result);
            Blockly.Xml.clearWorkspaceAndLoadFromXml(xml, workspaceRef.current);
          } catch (error) {
            alert('Error loading blocks: ' + error.message);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      backgroundColor: '#f9fafb',
      position: 'relative',
      isolation: 'isolate' // Create new stacking context
    }}>
      {/* Toolbar */}
      <div style={{
        height: '48px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: '8px',
        flexShrink: 0,
        zIndex: 10,
        position: 'relative'
      }}>
        <button
          onClick={handleClearWorkspace}
          style={{
            padding: '6px 12px',
            fontSize: '13px',
            backgroundColor: '#ef4444',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600,
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
        >
          🗑️ Clear
        </button>
        <button
          onClick={handleExportBlocks}
          style={{
            padding: '6px 12px',
            fontSize: '13px',
            backgroundColor: '#3b82f6',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600,
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
        >
          💾 Export
        </button>
        <button
          onClick={handleImportBlocks}
          style={{
            padding: '6px 12px',
            fontSize: '13px',
            backgroundColor: '#10b981',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600,
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
        >
          📂 Import
        </button>
        <div style={{ flex: 1 }}></div>
        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>
          Drag blocks from the left to build your app logic
        </div>
      </div>

      {/* Blockly Workspace - Full Height with proper isolation */}
      <div style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        height: '100%'
      }}>
        <div
          ref={blocklyDiv}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%'
          }}
        />
      </div>
    </div>
  );
}
