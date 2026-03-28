// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AppForge — Block Editor (Blockly)
// Visual block-based programming
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import type * as Blockly from '@blockly-runtime';
import type { AFProject } from '../../AppForgeStudio';
import componentsData from '../../data/components.json';
import { getToolboxConfig } from './BlockToolbox';

interface BlockEditorProps {
  project: AFProject;
  updateProject: (updates: Partial<AFProject>) => void;
}

export default function BlockEditor({ project, updateProject }: BlockEditorProps) {
  const blocklyDiv = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);

  // ✅ FIX 1: Keep a ref to the latest updateProject callback
  // This avoids the stale closure bug where the onChange listener
  // was capturing the initial (possibly outdated) updateProject function.
  const updateProjectRef = useRef(updateProject);
  useEffect(() => {
    updateProjectRef.current = updateProject;
  }, [updateProject]);

  // ✅ FIX 2: Keep a ref to the initial blocks so we can restore them
  // on mount without adding project to the main effect's deps
  // (which would cause the workspace to re-initialize on every project change).
  const initialBlocksRef = useRef(project.blocks);

  const currentScreen = project.screens[project.activeScreenIndex];
  const componentsList = currentScreen?.components || [];

  // Memoize toolbox config — only recalculates when componentsList changes
  const toolbox = useMemo(() => getToolboxConfig(componentsList), [componentsList]);

  // ✅ FIX 3: Stable onChange handler using the ref, wrapped in useCallback
  // so it doesn't get recreated on every render.
  const handleWorkspaceChange = useCallback(() => {
    const workspace = workspaceRef.current;
    if (!workspace) return;
    try {
      // Dynamically import to avoid circular deps — safe because Blockly
      // is already loaded by the time this listener fires.
      import('@blockly-runtime').then((Blockly) => {
        const json = Blockly.serialization.workspaces.save(workspace);
        // Always calls the LATEST updateProject via the ref
        updateProjectRef.current({ blocks: json });
      });
    } catch (e) {
      // Ignore serialization errors during drag operations
    }
  }, []); // No deps — uses ref internally, so always stable

  // ─── Main Init Effect ───────────────────────────────────────────────
  // Runs ONCE on mount (empty dep array is intentional).
  // Workspace is expensive to create/destroy, so we never re-initialize it.
  useEffect(() => {
    if (!blocklyDiv.current) return;

    let workspace: Blockly.WorkspaceSvg | null = null;

    const initBlockly = async () => {
      try {
        const Blockly = await import('@blockly-runtime');
        const { registerCustomBlocks } = await import('./CustomBlocks');

        // Register custom blocks before injecting the workspace
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
          zoom: {
            controls: true,
            wheel: true,
            startScale: 0.9,
            maxScale: 2,
            minScale: 0.3,
          },
          move: { scrollbars: true, drag: true, wheel: true },
          sounds: false,
          renderer: 'leap',
          trashcan: true,
        });

        workspaceRef.current = workspace;

        // Restore saved blocks from the snapshot captured at mount time.
        // We use initialBlocksRef so we don't need `project` in the deps array.
        if (initialBlocksRef.current) {
          try {
            Blockly.serialization.workspaces.load(initialBlocksRef.current, workspace);
          } catch (e) {
            console.warn('Failed to restore blocks:', e);
          }
        }

        // ✅ FIX 1 applied here: use handleWorkspaceChange (stable ref-based handler)
        workspace.addChangeListener(handleWorkspaceChange);
      } catch (err) {
        console.error('Blockly init error:', err);
      }
    };

    initBlockly();

    // Cleanup: dispose workspace on unmount to free memory & event listeners
    return () => {
      if (workspace) {
        workspace.removeChangeListener(handleWorkspaceChange);
        workspace.dispose();
      }
      workspaceRef.current = null;
    };
  }, []); // ← intentionally empty: workspace is initialized once only

  // ─── Toolbox Sync Effect ─────────────────────────────────────────────
  // Runs whenever the component list changes (e.g. user adds a new component).
  // Updates the toolbox categories without touching the workspace itself.
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