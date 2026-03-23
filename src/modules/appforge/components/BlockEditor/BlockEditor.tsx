// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AppForge — Block Editor (Blockly)
// Visual block-based programming
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import * as Blockly from 'blockly';
import type { AFProject } from '../../AppForgeStudio';
import componentsData from '../../data/components.json';
import { registerCustomBlocks } from './CustomBlocks';
import { getToolboxConfig } from './BlockToolbox';

interface BlockEditorProps {
  project: AFProject;
  updateProject: (updates: Partial<AFProject>) => void;
}

export default function BlockEditor({ project, updateProject }: BlockEditorProps) {
  const blocklyDiv = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);

  const currentScreen = project.screens[project.activeScreenIndex];
  const componentsList = currentScreen?.components || [];

  // Memoize toolbox to avoid re-registering on every render
  const toolbox = useMemo(() => getToolboxConfig(componentsList), [componentsList]);

  useEffect(() => {
    if (!blocklyDiv.current) return;

    // Register all custom blocks once
    registerCustomBlocks(componentsData as any[]);

    const workspace = Blockly.inject(blocklyDiv.current, {
      toolbox,
      theme: Blockly.Theme.defineTheme('appforge_dark', {
        name: 'appforge_dark',
        base: Blockly.Themes.Classic,
        blockStyles: {},
        categoryStyles: {},
        componentStyles: {
          workspaceBackgroundColour: '#0f0f13',
          toolboxBackgroundColour: '#16161d',
          toolboxForegroundColour: '#e4e4e7',
          flyoutBackgroundColour: '#1e1e28',
          flyoutForegroundColour: '#e4e4e7',
          flyoutOpacity: 0.95,
          scrollbarColour: '#3b3b5a',
          scrollbarOpacity: 0.6,
        },
        fontStyle: {
          family: 'Inter, sans-serif',
          size: 11,
          weight: '500',
        },
      }),
      grid: { spacing: 20, length: 3, colour: '#2a2a3a', snap: true },
      zoom: { controls: true, wheel: true, startScale: 0.9, maxScale: 2, minScale: 0.3 },
      move: { scrollbars: true, drag: true, wheel: true },
      sounds: false,
      renderer: 'zelos',
      trashcan: true,
    });

    workspaceRef.current = workspace;

    // Restore saved blocks
    if (project.blocks) {
      try {
        Blockly.serialization.workspaces.load(project.blocks, workspace);
      } catch (e) {
        console.warn('Failed to restore blocks:', e);
      }
    }

    // Auto-save on workspace change
    const onChange = () => {
      try {
        const json = Blockly.serialization.workspaces.save(workspace);
        updateProject({ blocks: json });
      } catch (e) {
        // Ignore serialization errors during drag
      }
    };
    workspace.addChangeListener(onChange);

    return () => {
      workspace.removeChangeListener(onChange);
      workspace.dispose();
      workspaceRef.current = null;
    };
  }, []); // Initialize once

  // Update toolbox when components change
  useEffect(() => {
    if (workspaceRef.current) {
      workspaceRef.current.updateToolbox(toolbox);
    }
  }, [toolbox]);

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <div ref={blocklyDiv} style={{ height: '100%', width: '100%' }} />
    </div>
  );
}
