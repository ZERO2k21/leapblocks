/**
 * Vision3D - Main Application Component
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import React, { useEffect, useCallback, useState, useRef } from 'react';
import { Canvas3D } from './components/Canvas3D';
import { ShapePanel } from './components/ShapePanel';
import { PropertiesPanel } from './components/PropertiesPanel';
import { Topbar } from './components/Topbar';
import { SceneList } from './components/SceneList';
import { use3DStore } from './store/use3DStore';
import './styles/Leap3D.css';
import { log, debug } from './utils/logger';

const GRID_PRESETS = [0, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0];

const Vision3DApp = ({ onBack }) => {
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
    mirrorShapes,
    dropToWorkplane,
    moveShapesByArrow,
    hideShapes,
    showAllHidden,
    toggleLock,
    gridSnap,
    setGridSnap,
    showGrid,
    setShowGrid,
    showAxes,
    setShowAxes,
    showInspector,
    updateShape,
    csgOperation,
    smartDuplicate,
    toggleCameraMode,
    cameraMode,
    setFitSelection,
    setFitAll,
    setTempWorkplane,
    clearTempWorkplane,
    tempWorkplane,
    alignShapes,
  } = use3DStore();

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleKeyDown = useCallback(
    (e) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      const state = use3DStore.getState();
      const ids = state.selectedIds;

      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (ids.length > 0) {
          log('Keyboard: Delete ' + ids.length + ' shapes');
          removeShapes(ids);
        }
      }

      // Group (Ctrl+G)
      if (e.ctrlKey && key === 'g' && !e.shiftKey) {
        e.preventDefault();
        if (ids.length >= 2) {
          log('Keyboard: Ctrl+G (group) ' + ids.length + ' shapes');
          groupShapes(ids);
        }
      }

      // Ungroup (Ctrl+Shift+G)
      if (e.ctrlKey && key === 'g' && e.shiftKey) {
        e.preventDefault();
        if (ids.length === 1) {
          log('Keyboard: Ctrl+Shift+G (ungroup) ' + ids[0]);
          ungroupShape(ids[0]);
        }
      }

      // Duplicate (Ctrl+D) - Smart duplicate with repeat
      if (e.ctrlKey && key === 'd') {
        e.preventDefault();
        if (ids.length > 0) {
          log('Keyboard: Ctrl+D (smart duplicate) ' + ids.length + ' shapes');
          smartDuplicate(ids);
        }
      }

      // Undo (Ctrl+Z)
      if (e.ctrlKey && key === 'z' && !e.shiftKey) {
        e.preventDefault();
        log('Keyboard: Ctrl+Z (undo)');
        undo();
      }

      // Redo (Ctrl+Shift+Z or Ctrl+Y)
      if (e.ctrlKey && key === 'z' && e.shiftKey) {
        e.preventDefault();
        log('Keyboard: Ctrl+Shift+Z (redo)');
        redo();
      }
      if (e.ctrlKey && key === 'y') {
        e.preventDefault();
        log('Keyboard: Ctrl+Y (redo)');
        redo();
      }

      // Select All (Ctrl+A)
      if (e.ctrlKey && key === 'a') {
        e.preventDefault();
        log('Keyboard: Ctrl+A (select all)');
        const allIds = state.shapes.map((s) => s.id);
        state.selectShapes(allIds);
      }

      // Escape (deselect)
      if (e.key === 'Escape') {
        log('Keyboard: Escape (deselect)');
        deselectAll();
      }

      // --- TinkerCAD-style shortcuts ---

      // Tool switching (V, G, R, S)
      if (key === 'v') { debug('Keyboard: V (select tool)'); setTool('select'); }
      if (key === 'g' && !e.ctrlKey) { debug('Keyboard: G (move tool)'); setTool('move'); }
      if (key === 'r' && !e.ctrlKey) { debug('Keyboard: R (rotate tool)'); setTool('rotate'); }
      if (key === 's' && !e.ctrlKey) { debug('Keyboard: S (scale tool)'); setTool('scale'); }

      // Drop to workplane (D)
      if (key === 'd' && !e.ctrlKey) {
        e.preventDefault();
        if (ids.length > 0) {
          log('Keyboard: D (drop to workplane) ' + ids.length + ' shapes');
          dropToWorkplane(ids);
        }
      }

      // Mirror (M)
      if (key === 'm' && !e.ctrlKey) {
        e.preventDefault();
        if (ids.length > 0) {
          log('Keyboard: M (mirror X) ' + ids.length + ' shapes');
          mirrorShapes(ids, 'x');
        }
      }

      // Arrow key movement (TinkerCAD-style)
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key) && ids.length > 0) {
        e.preventDefault();
        const fast = e.shiftKey;
        if (key === 'arrowright') {
          moveShapesByArrow(ids, 'x', 1, fast);
        } else if (key === 'arrowleft') {
          moveShapesByArrow(ids, 'x', -1, fast);
        } else if (key === 'arrowup') {
          moveShapesByArrow(ids, 'z', -1, fast);
        } else if (key === 'arrowdown') {
          moveShapesByArrow(ids, 'z', 1, fast);
        }
      }
      // Ctrl+Arrow = move on Y (vertical)
      if (e.ctrlKey && (key === 'arrowup' || key === 'arrowdown') && ids.length > 0) {
        e.preventDefault();
        const fast = e.shiftKey;
        moveShapesByArrow(ids, 'y', key === 'arrowup' ? 1 : -1, fast);
      }

      // Fit selection to view (F)
      if (key === 'f' && !e.ctrlKey) {
        e.preventDefault();
        log('Keyboard: F (fit selection to view)');
        use3DStore.getState().setFitSelection(ids);
      }

      // Make hole (H)
      if (key === 'h' && !e.ctrlKey && !e.ctrlKey) {
        if (ids.length > 0) {
          log('Keyboard: H (make hole) ' + ids.length + ' shapes');
          state.updateShapes(ids, { isHole: true });
        }
      }

      // Make solid (S - only when shift is held to not conflict with scale tool)
      if (e.shiftKey && key === 's') {
        if (ids.length > 0) {
          log('Keyboard: Shift+S (make solid) ' + ids.length + ' shapes');
          state.updateShapes(ids, { isHole: false });
        }
      }

      // Make transparent (T)
      if (key === 't' && !e.ctrlKey) {
        if (ids.length > 0) {
          log('Keyboard: T (toggle transparency)');
          const selectedShapes = state.shapes.filter((s) => ids.includes(s.id));
          const anyOpaque = selectedShapes.some((s) => (s.opacity ?? 1) === 1);
          state.updateShapes(ids, { opacity: anyOpaque ? 0.5 : 1.0 });
        }
      }

      // Hide selected (Ctrl+H)
      if (e.ctrlKey && key === 'h' && !e.shiftKey) {
        e.preventDefault();
        if (ids.length > 0) {
          log('Keyboard: Ctrl+H (hide) ' + ids.length + ' shapes');
          hideShapes(ids);
        }
      }

      // Show all hidden (Ctrl+Shift+H)
      if (e.ctrlKey && key === 'h' && e.shiftKey) {
        e.preventDefault();
        log('Keyboard: Ctrl+Shift+H (show all hidden)');
        showAllHidden();
      }

      // Lock/Unlock (Ctrl+L)
      if (e.ctrlKey && key === 'l') {
        e.preventDefault();
        if (ids.length > 0) {
          log('Keyboard: Ctrl+L (toggle lock) ' + ids.length + ' shapes');
          toggleLock(ids);
        }
      }

      // Snap grid cycle (N key)
      if (key === 'n' && !e.ctrlKey) {
        e.preventDefault();
        log('Keyboard: N (cycle grid snap)');
        state.cycleGridSnap();
      }

      // Toggle grid visibility (;)
      if (key === ';' && !e.ctrlKey) {
        e.preventDefault();
        log('Keyboard: ; (toggle grid)');
        setShowGrid(!state.showGrid);
      }

      // Workplane tool (W)
      if (key === 'w' && !e.ctrlKey) {
        e.preventDefault();
        log('Keyboard: W (workplane tool)');
        if (tempWorkplane) {
          clearTempWorkplane();
        }
        // Workplane mode is handled by Canvas3D click
      }

      // Toggle camera perspective/orthographic (P)
      if (key === 'p' && !e.ctrlKey) {
        e.preventDefault();
        log('Keyboard: P (toggle camera)');
        toggleCameraMode();
      }

      // Fit All (F when nothing selected, F with selection fits selection)
      if (key === 'f' && e.ctrlKey) {
        e.preventDefault();
        log('Keyboard: Ctrl+F (fit all)');
        setFitAll();
      }

      // CSG operations (Ctrl+1=Union, Ctrl+2=Subtract, Ctrl+3=Intersect)
      if (e.ctrlKey && key === '1') {
        e.preventDefault();
        if (ids.length >= 2) {
          log('Keyboard: Ctrl+1 (CSG Union)');
          csgOperation('union');
        }
      }
      if (e.ctrlKey && key === '2') {
        e.preventDefault();
        if (ids.length >= 2) {
          log('Keyboard: Ctrl+2 (CSG Subtract)');
          csgOperation('subtract');
        }
      }
      if (e.ctrlKey && key === '3') {
        e.preventDefault();
        if (ids.length >= 2) {
          log('Keyboard: Ctrl+3 (CSG Intersect)');
          csgOperation('intersect');
        }
      }

      // Align (L key) - center on X, Y, Z
      if (key === 'l' && !e.ctrlKey && !e.ctrlKey) {
        if (ids.length >= 2) {
          e.preventDefault();
          log('Keyboard: L (align center)');
          alignShapes(ids, 'x', 'center');
          alignShapes(ids, 'y', 'center');
          alignShapes(ids, 'z', 'center');
        }
      }

      // Escape - also clear workplane
      if (e.key === 'Escape') {
        if (tempWorkplane) {
          clearTempWorkplane();
        }
      }
    },
    [selectedIds, setTool, undo, redo, smartDuplicate, removeShapes, groupShapes, ungroupShape, deselectAll, moveShapesByArrow, hideShapes, showAllHidden, toggleLock, dropToWorkplane, mirrorShapes, setShowGrid, csgOperation, toggleCameraMode, setFitAll, setFitSelection, tempWorkplane, clearTempWorkplane, alignShapes]
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
    <div className="v3d-root">
      <Topbar
        onBack={onBack}
        title={projectName}
        onTitleChange={setProjectName}
        onSave={handleSave}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
      />

      <div className="v3d-workspace">
        {/* Canvas (center, fills remaining) */}
        <div className="v3d-canvas-area">
          <Canvas3D />
        </div>

        {/* Right side: Shapes Panel + Scene List */}
        <div className={`v3d-right-panel ${showInspector ? 'inspector-active' : ''}`}>
          {/* Inspector overlay (appears on selection) */}
          <div className={`v3d-inspector ${showInspector ? 'visible' : ''}`}>
            <PropertiesPanel />
          </div>

          {/* Shapes Panel (always present underneath) */}
          <div className={`v3d-shapes-panel ${showInspector && selectedIds.length > 0 ? 'hidden-behind' : ''}`}>
            <ShapePanel />
          </div>

          {/* Scene List (bottom of right panel) */}
          <div className="v3d-scene-list">
            <SceneList />
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="v3d-bottom-bar">
        <div className="v3d-bottom-left">
          <button
            className={`v3d-bottom-btn ${gridSnap === 0 ? 'active' : ''}`}
            onClick={() => setGridSnap(0)}
            title="Snap: Off (free movement)"
          >
            Free
          </button>
          {[0.1, 0.25, 0.5, 1.0, 2.5, 5.0].map((v) => (
            <button
              key={v}
              className={`v3d-bottom-btn ${gridSnap === v ? 'active' : ''}`}
              onClick={() => setGridSnap(v)}
              title={`Snap: ${v}mm`}
            >
              {v}
            </button>
          ))}
          <span className="v3d-bottom-separator" />
          <button
            className={`v3d-bottom-btn ${showGrid ? 'active' : ''}`}
            onClick={() => setShowGrid(!showGrid)}
            title="Toggle Grid"
          >
            Grid
          </button>
          <button
            className={`v3d-bottom-btn ${showAxes ? 'active' : ''}`}
            onClick={() => setShowAxes(!showAxes)}
            title="Toggle Axes"
          >
            Axes
          </button>
        </div>
        <div className="v3d-bottom-center">
          <span>Objects: {shapes.length}</span>
          <span className="v3d-bottom-separator" />
          <span>Selected: {selectedIds.length}</span>
        </div>
        <div className="v3d-bottom-right">
          <span className="v3d-shortcut-hint">
            V: Select | G: Move | R: Rotate | S: Scale | D: Drop | M: Mirror | Arrows: Nudge | N: Snap Grid | F: Fit
          </span>
        </div>
      </div>
    </div>
  );
};

export default Vision3DApp;
