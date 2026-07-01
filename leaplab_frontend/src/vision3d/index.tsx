/**
 * Vision3D - Main Application Component
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import React, { useEffect, useCallback, useState } from 'react';
import { Canvas3D } from './components/Canvas3D';
import { ShapePanel } from './components/ShapePanel';
import { PropertiesPanel } from './components/PropertiesPanel';
import { Topbar } from './components/Topbar';
import { SceneList } from './components/SceneList';
import { use3DStore } from './store/use3DStore';
import './styles/Leap3D.css';
import { log, debug } from './utils/logger';

interface Vision3DAppProps {
  onBack?: () => void;
}

const Vision3DApp: React.FC<Vision3DAppProps> = ({ onBack }) => {
  const [projectName, setProjectName] = useState('My Project');
  log('Vision3DApp: mounted');

  const {
    setTool,
    undo,
    redo,
    duplicateShapes,
    removeShapes,
    selectedIds,
    groupShapes,
    ungroupShape,
    deselectAll,
    shapes,
    autoSaveProject,
    historyIndex,
    history,
  } = use3DStore();

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (selectedIds.length > 0) {
          log('Keyboard: Delete ' + selectedIds.length + ' shapes');
          removeShapes(selectedIds);
        }
      }

      if (e.ctrlKey && key === 'g' && !e.shiftKey) {
        e.preventDefault();
        if (selectedIds.length >= 2) {
          log('Keyboard: Ctrl+G (group) ' + selectedIds.length + ' shapes');
          groupShapes(selectedIds);
        }
      }

      if (e.ctrlKey && key === 'g' && e.shiftKey) {
        e.preventDefault();
        if (selectedIds.length === 1) {
          log('Keyboard: Ctrl+Shift+G (ungroup) ' + selectedIds[0]);
          ungroupShape(selectedIds[0]);
        }
      }

      if (e.ctrlKey && key === 'd') {
        e.preventDefault();
        if (selectedIds.length > 0) {
          log('Keyboard: Ctrl+D (duplicate) ' + selectedIds.length + ' shapes');
          duplicateShapes(selectedIds);
        }
      }

      if (e.ctrlKey && key === 'z' && !e.shiftKey) {
        e.preventDefault();
        log('Keyboard: Ctrl+Z (undo)');
        undo();
      }

      if (e.ctrlKey && key === 'z' && e.shiftKey) {
        e.preventDefault();
        log('Keyboard: Ctrl+Shift+Z (redo)');
        redo();
      }

      if (e.ctrlKey && key === 'a') {
        e.preventDefault();
        log('Keyboard: Ctrl+A (select all)');
        const allIds = use3DStore.getState().shapes.map((s) => s.id);
        use3DStore.getState().selectShapes(allIds);
      }

      if (e.key === 'Escape') {
        log('Keyboard: Escape (deselect)');
        deselectAll();
      }

      if (key === 'v') { log.debug('Keyboard: V (select tool)'); setTool('select'); }
      if (key === 'g' && !e.ctrlKey) { log.debug('Keyboard: G (move tool)'); setTool('move'); }
      if (key === 'r' && !e.ctrlKey) { log.debug('Keyboard: R (rotate tool)'); setTool('rotate'); }
      if (key === 's' && !e.ctrlKey) { log.debug('Keyboard: S (scale tool)'); setTool('scale'); }
    },
    [
      selectedIds,
      setTool,
      undo,
      redo,
      duplicateShapes,
      removeShapes,
      groupShapes,
      ungroupShape,
      deselectAll,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleSave = () => {
    log('Vision3DApp: save triggered');
    autoSaveProject();
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 font-[system-ui,-apple-system,sans-serif]">
      {/* Top Bar */}
      <Topbar
        onBack={onBack!}
        title={projectName}
        onTitleChange={setProjectName}
        onSave={handleSave}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Shapes */}
        <div className="flex flex-col bg-white border-r border-slate-200 overflow-y-auto w-60 shrink-0">
          <ShapePanel />
        </div>

        {/* Center - 3D Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <Canvas3D />
        </div>

        {/* Right Panel - Properties & Scene */}
        <div className="flex flex-col bg-white border-l border-slate-200 w-72 shrink-0 overflow-y-auto">
          <div className="flex-1 min-h-0">
            <PropertiesPanel />
          </div>
          <div className="flex-1 min-h-0 border-t border-slate-200">
            <SceneList />
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between h-7 px-4 bg-white border-t border-slate-200 text-[11px] text-slate-500">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            Objects: {shapes.length}
          </span>
          <span className="flex items-center gap-1">
            Selected: {selectedIds.length}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            Grid: {use3DStore.getState().gridSnap}
          </span>
          <span className="opacity-60">
            V: Select | G: Move | R: Rotate | S: Scale
          </span>
        </div>
      </div>
    </div>
  );
};

export default Vision3DApp;
