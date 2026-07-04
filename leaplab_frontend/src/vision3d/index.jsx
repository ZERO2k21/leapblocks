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
import PreviewModal from './components/PreviewModal';
import ShapeNet from './components/ShapeNet';
import { use3DStore } from './store/use3DStore';
import { useCloudProjectStore } from '../store/cloudProjectStore';
import { importSTL, importOBJ, isImportableFile } from './engine/ImportManager';
import { saveVision3DProject } from './utils/cloudSave';
import { importProjectFromJSON } from './utils/indexedDB';
import './styles/Leap3D.css';
import { log, debug } from './utils/logger';

const Vision3DApp = ({ onBack }) => {
  const [projectName, setProjectName] = useState('My Project');
  const loadedRef = useRef(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [netOpen, setNetOpen] = useState(false);
  const [cloudProjectId, setCloudProjectId] = useState(null);
  log('Vision3DApp: mounted');

  const {
    activeTool,
    setTool,
    undo,
    redo,
    duplicateShapes,
    removeShapes,
    addShape,
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
    rotationSnap,
    setRotationSnap,
    showGrid,
    setShowGrid,
    showAxes,
    setShowAxes,
    showInspector,
    updateShape,
    updateShapes,
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
    toggleRuler,
    rulerActive,
    distributeShapes,
    importShape,
    clearScene,
    editMode,
    setEditMode,
    editShapeId,
    editTool,
    setEditTool,
    selectedVertices,
    selectedEdges,
    selectedFaces,
    clearComponentSelection,
  } = use3DStore();

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const fileInputRef = useRef(null);
  const openProjectInputRef = useRef(null);

  const handleImport = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file || !isImportableFile(file.name)) return;

    log('Importing file:', file.name);
    let result = null;
    if (/\.stl$/i.test(file.name)) {
      result = await importSTL(file);
    } else if (/\.obj$/i.test(file.name)) {
      result = await importOBJ(file);
    }

    if (result) {
      importShape({
        type: result.type || 'stl',
        name: result.name,
        color: result.color,
        position: [0, 1, 0],
        _customGeometry: result.geometry,
      });
    }
    e.target.value = '';
  }, [importShape]);

  const handleOpenProject = useCallback(() => {
    openProjectInputRef.current?.click();
  }, []);

  const handleOpenProjectFile = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file || !/\.(json|leap)$/i.test(file.name)) return;

    log('Opening project file:', file.name);
    try {
      const text = await file.text();
      const data = importProjectFromJSON(text);
      if (data.shapes) {
        clearScene();
        data.shapes.forEach((shape) => importShape(shape));
      }
      const name = data.projectName || data.project?.name;
      if (name) {
        setProjectName(name);
      }
      log('Project opened:', file.name);
    } catch (err) {
      error('Failed to open project:', err);
    }
    e.target.value = '';
  }, [clearScene, importShape, setProjectName]);

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

      // Open Project (Ctrl+O)
      if (e.ctrlKey && key === 'o') {
        e.preventDefault();
        log('Keyboard: Ctrl+O (open project)');
        handleOpenProject();
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

      // Escape (deselect / exit edit mode)
      if (e.key === 'Escape') {
        const st = use3DStore.getState();
        if (st.editMode !== 'object') {
          log('Keyboard: Escape (exit edit mode)');
          setEditMode('object');
        } else {
          log('Keyboard: Escape (deselect)');
          deselectAll();
        }
      }

      // --- TinkerCAD-style shortcuts ---

      // Tool switching (V, M, R, S)
      if (key === 'v') { debug('Keyboard: V (select tool)'); setTool('select'); }
      if (key === 'm' && !e.ctrlKey && state.editMode === 'object') { debug('Keyboard: M (move tool)'); setTool('move'); }
      if (key === 'r' && !e.ctrlKey) { debug('Keyboard: R (rotate tool)'); setTool('rotate'); }
      if (key === 's' && !e.ctrlKey && !e.shiftKey) { debug('Keyboard: S (scale tool)'); setTool('scale'); }

      // Edit Mode switching (Tab, 1, 2, 3)
      if (key === 'tab') {
        e.preventDefault();
        if (state.editMode !== 'object') {
          debug('Keyboard: Tab (exit edit mode)');
          setEditMode('object');
        } else if (ids.length === 1) {
          debug('Keyboard: Tab (enter vertex edit)');
          setEditMode('vertex');
        }
      }
      if (key === '1' && !e.ctrlKey && !e.altKey && ids.length === 1) {
        debug('Keyboard: 1 (vertex edit)');
        setEditMode(state.editMode === 'vertex' ? 'object' : 'vertex');
      }
      if (key === '2' && !e.ctrlKey && !e.altKey && ids.length === 1) {
        debug('Keyboard: 2 (edge edit)');
        setEditMode(state.editMode === 'edge' ? 'object' : 'edge');
      }
      if (key === '3' && !e.ctrlKey && !e.altKey && ids.length === 1) {
        debug('Keyboard: 3 (face edit)');
        setEditMode(state.editMode === 'face' ? 'object' : 'face');
      }

      // Edit tools (E, B, I) — only in edit mode
      if (state.editMode !== 'object') {
        if (key === 'e' && state.editMode === 'face' && state.selectedFaces.length > 0) {
          e.preventDefault();
          debug('Keyboard: E (extrude face)');
          setEditTool('extrude');
        }
        if (key === 'b' && state.editMode === 'edge' && state.selectedEdges.length > 0) {
          e.preventDefault();
          debug('Keyboard: B (bevel edge)');
          setEditTool('bevel');
        }
        if (key === 'i' && state.editMode === 'face' && state.selectedFaces.length > 0) {
          e.preventDefault();
          debug('Keyboard: I (inset face)');
          setEditTool('inset');
        }
      }

      // Drop to workplane (D)
      if (key === 'd' && !e.ctrlKey) {
        e.preventDefault();
        if (ids.length > 0) {
          log('Keyboard: D (drop to workplane) ' + ids.length + ' shapes');
          dropToWorkplane(ids);
        }
      }

      // Mirror (G)
      if (key === 'g' && !e.ctrlKey) {
        e.preventDefault();
        if (ids.length > 0) {
          log('Keyboard: G (mirror X) ' + ids.length + ' shapes');
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
        if (ids.length > 0) {
          log('Keyboard: F (fit selection to view)');
          setFitSelection(ids);
        } else {
          log('Keyboard: F (fit all - nothing selected)');
          setFitAll();
        }
      }

      // Make hole (H)
      if (key === 'h' && !e.ctrlKey) {
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
      if (key === 'l' && !e.ctrlKey) {
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
        if (state.rulerActive) {
          state.clearRuler();
        }
      }

      // Ruler tool (X key)
      if (key === 'x' && !e.ctrlKey) {
        e.preventDefault();
        log('Keyboard: X (ruler tool)');
        toggleRuler();
      }

      // Distribution (Ctrl+Shift+D = distribute on X, Ctrl+Shift+E = distribute on Y, Ctrl+Shift+F = distribute on Z)
      if (e.ctrlKey && e.shiftKey && key === 'd' && ids.length >= 3) {
        e.preventDefault();
        log('Keyboard: Ctrl+Shift+D (distribute X)');
        distributeShapes(ids, 'x');
      }
      if (e.ctrlKey && e.shiftKey && key === 'e' && ids.length >= 3) {
        e.preventDefault();
        log('Keyboard: Ctrl+Shift+E (distribute Y)');
        distributeShapes(ids, 'y');
      }
      if (e.ctrlKey && e.shiftKey && key === 'f' && ids.length >= 3) {
        e.preventDefault();
        log('Keyboard: Ctrl+Shift+F (distribute Z)');
        distributeShapes(ids, 'z');
      }
    },
    [selectedIds, setTool, undo, redo, smartDuplicate, removeShapes, groupShapes, ungroupShape, deselectAll, moveShapesByArrow, hideShapes, showAllHidden, toggleLock, dropToWorkplane, mirrorShapes, setShowGrid, csgOperation, toggleCameraMode, setFitAll, setFitSelection, tempWorkplane, clearTempWorkplane, alignShapes, toggleRuler, distributeShapes, handleOpenProject]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleSave = async () => {
    log('Vision3DApp: save triggered');
    autoSaveProject();
    try {
      const result = await saveVision3DProject(projectName, shapes, use3DStore.getState().project, cloudProjectId);
      if (result?.id && !cloudProjectId) {
        setCloudProjectId(result.id);
        useCloudProjectStore.getState().setActiveProjectId(result.id);
      }
    } catch (err) {
      log('Cloud save failed (offline mode):', err);
    }
  };

  const handleDownload = useCallback(() => {
    log('Vision3DApp: download triggered');
    const project = use3DStore.getState().project || {
      id: `project_${Date.now()}`,
      name: projectName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const payload = {
      version: "1.0",
      projectName,
      mode: "vision3d",
      timestamp: Date.now(),
      project,
      shapes
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanName = (projectName || '').trim() || 'project';
    link.download = `${cleanName.replace(/\s+/g, '_')}.leap`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [projectName, shapes]);

  useEffect(() => {
    if (loadedRef.current) return;
    const { pendingProject, clearPendingProject } = useCloudProjectStore.getState();
    if (pendingProject && pendingProject.mode === 'vision3d') {
      loadedRef.current = true;
      const data = pendingProject.data;
      log('Vision3DApp: loading cloud project', pendingProject.projectName);
      if (data.projectName) setProjectName(data.projectName);
      if (data.shapes) use3DStore.getState().setShapes(data.shapes);
      if (data.project) use3DStore.getState().setProject(data.project);
      const activeId = useCloudProjectStore.getState().activeProjectId;
      if (activeId) setCloudProjectId(activeId);
      clearPendingProject();
    }
  }, []);

  return (
    <div className="v3d-root">
      <Topbar
        onBack={onBack}
        title={projectName}
        onTitleChange={setProjectName}
        onSave={handleSave}
        onOpenProject={handleOpenProject}
        onDownload={handleDownload}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
      />

      <div className="v3d-workspace">
        <div className="v3d-canvas-wrapper">
          <div className="v3d-toolbar-bar">
            <div className="v3d-toolbar-left">
              <div className="v3d-toolbar-mode-group">
                <button
                  className={`v3d-toolbar-btn ${activeTool === 'select' ? 'active' : ''}`}
                  onClick={() => setTool('select')}
                  title="Select (V)"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg>
                  Select
                </button>
                <button
                  className={`v3d-toolbar-btn ${activeTool === 'move' ? 'active' : ''}`}
                  onClick={() => setTool('move')}
                  title="Move (G)"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/></svg>
                  Move
                </button>
                <button
                  className={`v3d-toolbar-btn ${activeTool === 'rotate' ? 'active' : ''}`}
                  onClick={() => setTool('rotate')}
                  title="Rotate (R)"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>
                  Rotate
                </button>
                <button
                  className={`v3d-toolbar-btn ${activeTool === 'scale' ? 'active' : ''}`}
                  onClick={() => setTool('scale')}
                  title="Scale (S)"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 3l-7 7M21 3v5M21 3h-5M3 21l7-7M3 21v-5M3 21h5"/></svg>
                  Scale
                </button>
              </div>
              <span className="v3d-toolbar-separator" />
              {/* Edit Mode Group (Blender-like) */}
              <div className="v3d-toolbar-mode-group">
                <button
                  className={`v3d-toolbar-btn ${editMode === 'vertex' ? 'active' : ''}`}
                  onClick={() => setEditMode(editMode === 'vertex' ? 'object' : 'vertex')}
                  disabled={selectedIds.length !== 1}
                  title="Vertex Edit (1)"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>
                  Vert
                </button>
                <button
                  className={`v3d-toolbar-btn ${editMode === 'edge' ? 'active' : ''}`}
                  onClick={() => setEditMode(editMode === 'edge' ? 'object' : 'edge')}
                  disabled={selectedIds.length !== 1}
                  title="Edge Edit (2)"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="19" x2="19" y2="5" strokeWidth="2.5"/></svg>
                  Edge
                </button>
                <button
                  className={`v3d-toolbar-btn ${editMode === 'face' ? 'active' : ''}`}
                  onClick={() => setEditMode(editMode === 'face' ? 'object' : 'face')}
                  disabled={selectedIds.length !== 1}
                  title="Face Edit (3)"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12,3 3,21 21,21"/></svg>
                  Face
                </button>
              </div>
              {/* Edit Tools (shown when in edit mode) */}
              {editMode !== 'object' && (
                <>
                  <span className="v3d-toolbar-separator" />
                  <div className="v3d-toolbar-actions-group">
                    {editMode === 'face' && (
                      <>
                        <button
                          className="v3d-toolbar-btn"
                          onClick={() => setEditTool('extrude')}
                          disabled={selectedFaces.length === 0}
                          title="Extrude Face (E)"
                        >
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v12M5 12l7 7 7-7"/></svg>
                          Extrude
                        </button>
                        <button
                          className="v3d-toolbar-btn"
                          onClick={() => setEditTool('inset')}
                          disabled={selectedFaces.length === 0}
                          title="Inset Face (I)"
                        >
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="1"/><rect x="7" y="7" width="10" height="10" rx="1"/></svg>
                          Inset
                        </button>
                      </>
                    )}
                    {editMode === 'edge' && (
                      <button
                        className="v3d-toolbar-btn"
                        onClick={() => setEditTool('bevel')}
                        disabled={selectedEdges.length === 0}
                        title="Bevel Edge (B)"
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 20L20 4"/><path d="M4 20h6l-6-6z" fill="currentColor" opacity="0.2"/></svg>
                        Bevel
                      </button>
                    )}
                    {editMode === 'vertex' && (
                      <button
                        className="v3d-toolbar-btn"
                        onClick={() => setEditTool('merge')}
                        disabled={selectedVertices.length < 2}
                        title="Merge Vertices (M)"
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="8" cy="8" r="2"/><circle cx="16" cy="16" r="2"/><path d="M10 10l4 4"/></svg>
                        Merge
                      </button>
                    )}
                    <button
                      className="v3d-toolbar-btn"
                      onClick={() => clearComponentSelection()}
                      title="Deselect Components (Escape)"
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
                      Clear
                    </button>
                  </div>
                </>
              )}
              <span className="v3d-toolbar-separator" />
              <div className="v3d-toolbar-actions-group">
                <button
                  className={`v3d-toolbar-btn ${rulerActive ? 'active' : ''}`}
                  onClick={toggleRuler}
                  title="Ruler / Measurement Tool (X)"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M3 12h18"/></svg>
                  Ruler
                </button>
                <button
                  className="v3d-toolbar-btn"
                  onClick={() => fileInputRef.current?.click()}
                  title="Import STL/OBJ file"
                >
                  Import
                </button>
                {(() => {
                  const NET_SUPPORTED = ['cube','box','cylinder','cone','tetrahedron','pyramid'];
                  const selShape = selectedIds.length === 1 ? shapes.find((s) => s.id === selectedIds[0]) : null;
                  const hasNet = selShape && NET_SUPPORTED.includes(selShape.type);
                  return (
                    <button
                      className="v3d-toolbar-btn"
                      onClick={() => {
                        if (hasNet) setNetOpen(true);
                      }}
                      disabled={!hasNet}
                      title={hasNet ? "Show how this shape is constructed from its net" : "Net animation not available for this shape"}
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="5,3 19,12 5,21"/>
                      </svg>
                      Animate
                    </button>
                  );
                })()}
                <button
                  className="v3d-toolbar-btn"
                  onClick={() => {
                    if (selectedIds.length !== 1) return;
                    const shape = shapes.find((s) => s.id === selectedIds[0]);
                    if (!shape) return;
                    if (shape.type === 'sphere' || shape.type === 'halfSphere') {
                      const r = shape.radius ?? shape.halfSphereRadius ?? 1;
                      const pos = shape.position;
                      const color = shape.color;
                      removeShapes([shape.id]);
                      addShape('halfSphere', {
                        position: [pos[0], pos[1] + r / 2, pos[2]],
                        color: color,
                        halfSphereRadius: r,
                      });
                      addShape('halfSphere', {
                        position: [pos[0], pos[1] - r / 2, pos[2]],
                        color: color,
                        halfSphereRadius: r,
                        rotation: [Math.PI, 0, 0],
                      });
                    }
                  }}
                  disabled={selectedIds.length !== 1}
                  title="Split sphere into two hemispheres"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9"/>
                    <line x1="3" y1="12" x2="21" y2="12" strokeDasharray="3 2"/>
                  </svg>
                  Split
                </button>
              </div>
              <span className="v3d-toolbar-separator" />
              <div className="v3d-toolbar-group-label">CSG</div>
              <button
                className="v3d-toolbar-btn"
                onClick={() => csgOperation('union')}
                disabled={selectedIds.length < 2}
                title="CSG Union (Ctrl+1)"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="10" cy="10" r="6"/><circle cx="14" cy="14" r="6"/></svg>
                Union
              </button>
              <button
                className="v3d-toolbar-btn"
                onClick={() => csgOperation('subtract')}
                disabled={selectedIds.length < 2}
                title="CSG Subtract (Ctrl+2)"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="7"/><rect x="8" y="8" width="8" height="8"/></svg>
                Subtract
              </button>
              <button
                className="v3d-toolbar-btn"
                onClick={() => csgOperation('intersect')}
                disabled={selectedIds.length < 2}
                title="CSG Intersect (Ctrl+3)"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="10" cy="10" r="7"/><circle cx="14" cy="14" r="7"/><path d="M6 12a6 6 0 0 1 6-6"/></svg>
                Intersect
              </button>
              <span className="v3d-toolbar-separator" />
              <button
                className={`v3d-toolbar-btn ${(() => {
                  if (selectedIds.length === 0) return '';
                  const sel = shapes.filter((s) => selectedIds.includes(s.id));
                  const anyHole = sel.some((s) => s.isHole);
                  return anyHole ? 'active' : '';
                })()}`}
                onClick={() => {
                  if (selectedIds.length === 0) return;
                  const sel = shapes.filter((s) => selectedIds.includes(s.id));
                  const anyHole = sel.some((s) => s.isHole);
                  updateShapes(selectedIds, { isHole: !anyHole });
                }}
                disabled={selectedIds.length === 0}
                title="Toggle Solid/Hollow (H)"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9"/>
                  <circle cx="12" cy="12" r="5" fill="currentColor" opacity={selectedIds.length > 0 && shapes.filter((s) => selectedIds.includes(s.id)).some((s) => s.isHole) ? 0 : 0.3}/>
                </svg>
                {selectedIds.length > 0 && shapes.filter((s) => selectedIds.includes(s.id)).some((s) => s.isHole) ? 'Solid' : 'Hollow'}
              </button>
            </div>
            <div className="v3d-toolbar-center">
              <div className="v3d-toolbar-info-item" title="Objects in scene">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                {shapes.length}
              </div>
              <div className="v3d-toolbar-info-item" title="Selected shapes">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
                {selectedIds.length}
              </div>
              {tempWorkplane && (
                <div className="v3d-toolbar-info-item" style={{ color: '#f97316' }}>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M3 12h18"/></svg>
                  Workplane
                </div>
              )}
              {rulerActive && (
                <div className="v3d-toolbar-info-item" style={{ color: '#ef4444' }}>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M3 12h18"/></svg>
                  Ruler
                </div>
              )}
              {editMode !== 'object' && (
                <div className="v3d-toolbar-info-item" style={{ color: '#a855f7' }}>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 22h20L12 2z"/></svg>
                  {editMode === 'vertex' ? `Vertex (${selectedVertices.length})` : editMode === 'edge' ? `Edge (${selectedEdges.length})` : `Face (${selectedFaces.length})`}
                </div>
              )}
            </div>
            <div className="v3d-toolbar-right">
              <div className="v3d-toolbar-view-group">
                <button
                  className={`v3d-toolbar-btn ${showGrid ? 'active' : ''}`}
                  onClick={() => setShowGrid(!showGrid)}
                  title="Toggle Grid"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h18v18H3z"/><path d="M3 9h18M9 3v18"/></svg>
                  Grid
                </button>
                <button
                  className={`v3d-toolbar-btn ${showAxes ? 'active' : ''}`}
                  onClick={() => setShowAxes(!showAxes)}
                  title="Toggle Axes"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M2 12h20"/></svg>
                  Axes
                </button>
                <button
                  className="v3d-toolbar-btn"
                  onClick={toggleCameraMode}
                  title="Toggle Perspective/Orthographic (P)"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 4v16h22V4z"/><circle cx="12" cy="12" r="3"/></svg>
                  {cameraMode === 'perspective' ? 'Persp' : 'Ortho'}
                </button>
                <span className="v3d-toolbar-separator" />
                <button
                  className="v3d-toolbar-btn"
                  onClick={() => setPreviewOpen(true)}
                  title="Preview (fullscreen auto-rotate)"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  Preview
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".stl,.obj"
                onChange={handleImport}
                style={{ display: 'none' }}
              />
              <input
                ref={openProjectInputRef}
                type="file"
                accept=".json,.leap"
                onChange={handleOpenProjectFile}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          <div className="v3d-canvas-area">
            <Canvas3D />
          </div>
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
      <PreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)} />
      {netOpen && selectedIds.length === 1 && (() => {
        const selectedShape = shapes.find((s) => s.id === selectedIds[0]);
        if (!selectedShape) return null;
        return (
          <ShapeNet
            shape={selectedShape}
            onClose={() => { setNetOpen(false); }}
          />
        );
      })()}
    </div>
  );
};
export default Vision3DApp;
