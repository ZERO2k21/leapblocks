// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AppForge — Block Editor (Blockly)
// Visual block-based programming
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import React, { useEffect, useRef, useMemo } from 'react';
import type * as BlocklyType from 'blockly/core';
import type { AFProject } from '../../AppForgeStudio';
import componentsData from '../../data/components.json';
import { getToolboxConfig } from './BlockToolbox';

interface BlockEditorProps {
  project: AFProject;
  updateProject: (updates: Partial<AFProject>) => void;
}

export default function BlockEditor({ project, updateProject }: BlockEditorProps) {
  const blocklyDiv = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<BlocklyType.WorkspaceSvg | null>(null);

  const currentScreen = project.screens[project.activeScreenIndex];
  const componentsList = currentScreen?.components || [];

  // Memoize toolbox to avoid re-registering on every render
  const toolbox = useMemo(() => getToolboxConfig(componentsList), [componentsList]);

  useEffect(() => {
    if (!blocklyDiv.current) return;

    let workspace: BlocklyType.WorkspaceSvg | null = null;

    const initBlockly = async () => {
      try {
        // Dynamic imports to prevent circular dependencies in production
        const BlocklyModule = await import('@blockly-runtime');
        const Blockly = (BlocklyModule.default || BlocklyModule) as typeof BlocklyType;
        const { registerCustomBlocks } = await import('./CustomBlocks');

        // Register all custom blocks
        registerCustomBlocks(Blockly, componentsData as any[]);

        workspace = Blockly.inject(blocklyDiv.current!, {
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
           renderer: 'leap',
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
            const json = Blockly.serialization.workspaces.save(workspace!);
            updateProject({ blocks: json });
          } catch (e) {
            // Ignore serialization errors during drag
          }
        };
        workspace.addChangeListener(onChange);
      } catch (err) {
        console.error('Blockly init error:', err);
      }
    };

    initBlockly();

    return () => {
      if (workspace) {
        workspace.dispose();
      }
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
