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
import { log, debug, error } from './utils/logger';
import { serializeGeometry } from './utils/helpers';

const Vision3DApp = ({ onBack }) => {
  const [projectName, setProjectName] = useState('My Project');
  const loadedRef = useRef(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [netOpen, setNetOpen] = useState(false);
  const [cloudProjectId, setCloudProjectId] = useState(null);

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

  useEffect(() => { log('Vision3DApp: mounted'); }, []);

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

      // Deselect All (Alt+A — Blender convention)
      if (e.altKey && key === 'a') {
        e.preventDefault();
        log('Keyboard: Alt+A (deselect all)');
        if (state.editMode !== 'object') {
          state.clearComponentSelection();
        } else {
          deselectAll();
        }
      }

      // Invert Selection (Ctrl+I — Blender convention)
      if (e.ctrlKey && key === 'i' && !e.shiftKey) {
        e.preventDefault();
        log('Keyboard: Ctrl+I (invert selection)');
        if (state.editMode !== 'object') {
          const geo = state.geometryCache[state.editShapeId];
          if (geo) {
            const pos = geo.attributes.position;
            const index = geo.index;
            if (state.editMode === 'vertex') {
              const selected = new Set(state.selectedVertices.filter(v => v.shapeId === state.editShapeId).map(v => v.index));
              const verts = [];
              for (let i = 0; i < pos.count; i++) {
                if (!selected.has(i)) verts.push({ shapeId: state.editShapeId, index: i });
              }
              use3DStore.setState({ selectedVertices: verts });
            } else if (state.editMode === 'edge') {
              const edgeKey = (a, b) => Math.min(a, b) + '-' + Math.max(a, b);
              const selected = new Set(state.selectedEdges.filter(e => e.shapeId === state.editShapeId).map(e => edgeKey(e.a, e.b)));
              const edgeSet = new Set();
              const edges = [];
              const addEdge = (a, b) => {
                const k = edgeKey(a, b);
                if (!edgeSet.has(k)) {
                  edgeSet.add(k);
                  if (!selected.has(k)) edges.push({ shapeId: state.editShapeId, a: Math.min(a, b), b: Math.max(a, b) });
                }
              };
              if (index) {
                for (let i = 0; i < index.count; i += 3) {
                  addEdge(index.getX(i), index.getX(i + 1));
                  addEdge(index.getX(i + 1), index.getX(i + 2));
                  addEdge(index.getX(i + 2), index.getX(i));
                }
              } else {
                for (let i = 0; i < pos.count; i += 3) { addEdge(i, i + 1); addEdge(i + 1, i + 2); addEdge(i + 2, i); }
              }
              use3DStore.setState({ selectedEdges: edges });
            } else if (state.editMode === 'face') {
              const selected = new Set(state.selectedFaces.filter(f => f.shapeId === state.editShapeId).map(f => f.index));
              const faceCount = index ? index.count / 3 : pos.count / 3;
              const faces = [];
              for (let i = 0; i < faceCount; i++) {
                if (!selected.has(i)) faces.push({ shapeId: state.editShapeId, index: i });
              }
              use3DStore.setState({ selectedFaces: faces });
            }
          }
        } else {
          const selectedSet = new Set(state.selectedIds);
          const allIds = state.shapes.map(s => s.id);
          const inverted = allIds.filter(id => !selectedSet.has(id));
          state.selectShapes(inverted);
        }
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

      // Edit tools — only in edit mode
      if (state.editMode !== 'object') {
        const mode = state.editMode;

        // E key: Exclude — move only selected components (tear effect)
        if (key === 'e' && !e.ctrlKey) {
          e.preventDefault();
          debug('Keyboard: E (exclude ' + mode + ')');
          setEditTool('exclude');
        }

        // I key: Include — move selected + connected components (smooth deformation)
        if (key === 'i' && !e.ctrlKey && !e.shiftKey) {
          e.preventDefault();
          debug('Keyboard: I (include ' + mode + ')');
          setEditTool('include');
        }

        // Expand Selection (Ctrl+Numpad Plus or Ctrl+=)
        if (e.ctrlKey && (e.key === '+' || e.key === '=' || e.code === 'NumpadAdd')) {
          e.preventDefault();
          debug('Keyboard: Ctrl++ (expand selection)');
          const geo = state.geometryCache[state.editShapeId];
          if (geo) {
            const index = geo.index;
            if (mode === 'vertex') {
              const selected = new Set(state.selectedVertices.filter(v => v.shapeId === state.editShapeId).map(v => v.index));
              const edges = new Set();
              const addEdge = (a, b) => { edges.add(Math.min(a, b) + '-' + Math.max(a, b)); };
              if (index) {
                for (let i = 0; i < index.count; i += 3) {
                  const a = index.getX(i), b = index.getX(i + 1), c = index.getX(i + 2);
                  if (selected.has(a) || selected.has(b)) addEdge(a, b);
                  if (selected.has(b) || selected.has(c)) addEdge(b, c);
                  if (selected.has(c) || selected.has(a)) addEdge(c, a);
                }
              }
              const newVerts = new Set(selected);
              edges.forEach(k => { const [a, b] = k.split('-').map(Number); newVerts.add(a); newVerts.add(b); });
              use3DStore.setState({ selectedVertices: [...newVerts].map(i => ({ shapeId: state.editShapeId, index: i })) });
            } else if (mode === 'edge') {
              const edgeKey = (a, b) => Math.min(a, b) + '-' + Math.max(a, b);
              const selected = new Set(state.selectedEdges.filter(e => e.shapeId === state.editShapeId).map(e => edgeKey(e.a, e.b)));
              const neighborEdges = new Set();
              const allEdges = new Set();
              const addAllEdges = (a, b) => { allEdges.add(edgeKey(a, b)); };
              if (index) {
                for (let i = 0; i < index.count; i += 3) {
                  const a = index.getX(i), b = index.getX(i + 1), c = index.getX(i + 2);
                  addAllEdges(a, b); addAllEdges(b, c); addAllEdges(c, a);
                  if (selected.has(edgeKey(a, b))) { neighborEdges.add(edgeKey(b, c)); neighborEdges.add(edgeKey(c, a)); }
                  if (selected.has(edgeKey(b, c))) { neighborEdges.add(edgeKey(a, b)); neighborEdges.add(edgeKey(c, a)); }
                  if (selected.has(edgeKey(c, a))) { neighborEdges.add(edgeKey(a, b)); neighborEdges.add(edgeKey(b, c)); }
                }
              }
              const newEdges = new Set(selected);
              neighborEdges.forEach(k => { if (!newEdges.has(k)) newEdges.add(k); });
              use3DStore.setState({ selectedEdges: [...newEdges].map(k => { const [a, b] = k.split('-').map(Number); return { shapeId: state.editShapeId, a, b }; }) });
            } else if (mode === 'face') {
              const selected = new Set(state.selectedFaces.filter(f => f.shapeId === state.editShapeId).map(f => f.index));
              const neighborFaces = new Set();
              if (index) {
                for (let i = 0; i < index.count; i += 3) {
                  const fi = Math.floor(i / 3);
                  const a = index.getX(i), b = index.getX(i + 1), c = index.getX(i + 2);
                  if (selected.has(fi)) {
                    for (let j = 0; j < index.count; j += 3) {
                      if (Math.floor(j / 3) === fi) continue;
                      const na = index.getX(j), nb = index.getX(j + 1), nc = index.getX(j + 2);
                      if ((a === na || a === nb || a === nc || b === na || b === nb || b === nc || c === na || c === nb || c === nc)) {
                        neighborFaces.add(Math.floor(j / 3));
                      }
                    }
                  }
                }
              }
              const newFaces = new Set(selected);
              neighborFaces.forEach(f => newFaces.add(f));
              use3DStore.setState({ selectedFaces: [...newFaces].map(i => ({ shapeId: state.editShapeId, index: i })) });
            }
          }
        }

        // Contract Selection (Ctrl+Numpad Minus or Ctrl+-)
        if (e.ctrlKey && (e.key === '-' || e.code === 'NumpadSubtract')) {
          e.preventDefault();
          debug('Keyboard: Ctrl+- (contract selection)');
          const geo = state.geometryCache[state.editShapeId];
          if (geo) {
            const index = geo.index;
            if (mode === 'vertex') {
              const selected = new Set(state.selectedVertices.filter(v => v.shapeId === state.editShapeId).map(v => v.index));
              const boundary = new Set();
              if (index) {
                for (let i = 0; i < index.count; i += 3) {
                  const a = index.getX(i), b = index.getX(i + 1), c = index.getX(i + 2);
                  if (selected.has(a) && selected.has(b) && selected.has(c)) {
                    boundary.add(a); boundary.add(b); boundary.add(c);
                  }
                }
              }
              use3DStore.setState({ selectedVertices: [...boundary].map(i => ({ shapeId: state.editShapeId, index: i })) });
            } else if (mode === 'edge') {
              const edgeKey = (a, b) => Math.min(a, b) + '-' + Math.max(a, b);
              const selected = new Set(state.selectedEdges.filter(e => e.shapeId === state.editShapeId).map(e => edgeKey(e.a, e.b)));
              const interior = new Set();
              if (index) {
                for (let i = 0; i < index.count; i += 3) {
                  const a = index.getX(i), b = index.getX(i + 1), c = index.getX(i + 2);
                  if (selected.has(edgeKey(a, b)) && selected.has(edgeKey(b, c)) && selected.has(edgeKey(c, a))) {
                    interior.add(edgeKey(a, b)); interior.add(edgeKey(b, c)); interior.add(edgeKey(c, a));
                  }
                }
              }
              use3DStore.setState({ selectedEdges: [...interior].map(k => { const [a, b] = k.split('-').map(Number); return { shapeId: state.editShapeId, a, b }; }) });
            } else if (mode === 'face') {
              const selected = new Set(state.selectedFaces.filter(f => f.shapeId === state.editShapeId).map(f => f.index));
              const interior = new Set();
              if (index) {
                for (let i = 0; i < index.count; i += 3) {
                  const fi = Math.floor(i / 3);
                  if (!selected.has(fi)) continue;
                  const a = index.getX(i), b = index.getX(i + 1), c = index.getX(i + 2);
                  let fullyShared = true;
                  for (let j = 0; j < index.count; j += 3) {
                    if (Math.floor(j / 3) === fi) continue;
                    const na = index.getX(j), nb = index.getX(j + 1), nc = index.getX(j + 2);
                    const shared = [a, b, c].filter(v => v === na || v === nb || v === nc).length;
                    if (shared >= 2 && !selected.has(Math.floor(j / 3))) { fullyShared = false; break; }
                  }
                  if (fullyShared) interior.add(fi);
                }
              }
              use3DStore.setState({ selectedFaces: [...interior].map(i => ({ shapeId: state.editShapeId, index: i })) });
            }
          }
        }

        // Select All in edit mode (A key)
        if (key === 'a' && !e.ctrlKey) {
          e.preventDefault();
          debug('Keyboard: A (select all ' + state.editMode + 's)');
          const geo = state.geometryCache[state.editShapeId];
          if (geo) {
            const pos = geo.attributes.position;
            const index = geo.index;
            if (state.editMode === 'vertex') {
              const verts = [];
              for (let i = 0; i < pos.count; i++) {
                verts.push({ shapeId: state.editShapeId, index: i });
              }
              use3DStore.setState({ selectedVertices: verts });
            } else if (state.editMode === 'edge') {
              const edgeSet = new Set();
              const edges = [];
              const addEdge = (a, b) => {
                const k = Math.min(a, b) + '-' + Math.max(a, b);
                if (!edgeSet.has(k)) { edgeSet.add(k); edges.push({ shapeId: state.editShapeId, a: Math.min(a, b), b: Math.max(a, b) }); }
              };
              if (index) {
                for (let i = 0; i < index.count; i += 3) {
                  addEdge(index.getX(i), index.getX(i + 1));
                  addEdge(index.getX(i + 1), index.getX(i + 2));
                  addEdge(index.getX(i + 2), index.getX(i));
                }
              } else {
                for (let i = 0; i < pos.count; i += 3) { addEdge(i, i + 1); addEdge(i + 1, i + 2); addEdge(i + 2, i); }
              }
              use3DStore.setState({ selectedEdges: edges });
            } else if (state.editMode === 'face') {
              const faces = [];
              const faceCount = index ? index.count / 3 : pos.count / 3;
              for (let i = 0; i < faceCount; i++) {
                faces.push({ shapeId: state.editShapeId, index: i });
              }
              use3DStore.setState({ selectedFaces: faces });
            }
          }
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
    const replacer = (key, val) => {
      if ((key === '_customGeometry' || key === '_csgGeometry') && val && val.attributes) {
        return serializeGeometry(val);
      }
      return val;
    };
    const blob = new Blob([JSON.stringify(payload, replacer, 2)], { type: 'application/json' });
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
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 font-['Inter','Segoe_UI',system-ui,-apple-system,sans-serif]">
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

      <div className="flex flex-1 overflow-hidden relative">
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex items-center justify-between h-[72px] px-6 bg-white/85 backdrop-blur-[12px] [backdrop-filter:saturate(180%)] border-b border-slate-200/80 shadow-[0_4px_30px_rgba(0,0,0,0.02)] text-[13px] text-slate-700 shrink-0 gap-4 overflow-x-auto relative z-[100] w-full box-border">
            <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
              <div className="flex items-center gap-1 rounded-[14px] p-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-200 box-border h-12 bg-blue-500/[0.06] border border-blue-500/[0.15]">
                <button
                  className={`inline-flex items-center justify-center gap-2 py-2 px-[18px] shrink-0 border-none rounded-[10px] text-[13px] font-semibold cursor-pointer transition-all duration-200 leading-[1.5] whitespace-nowrap select-none h-10 box-border ${activeTool === 'select' ? 'bg-blue-600 text-white shadow-[0_4px_10px_-1px_rgba(37,99,235,0.25)]' : 'bg-transparent text-slate-500 hover:bg-blue-500/[0.12] hover:text-blue-700'}`}
                  onClick={() => setTool('select')}
                  title="Select (V)"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg>
                  Select
                </button>
                <button
                  className={`inline-flex items-center justify-center gap-2 py-2 px-[18px] shrink-0 border-none rounded-[10px] text-[13px] font-semibold cursor-pointer transition-all duration-200 leading-[1.5] whitespace-nowrap select-none h-10 box-border ${activeTool === 'move' ? 'bg-blue-600 text-white shadow-[0_4px_10px_-1px_rgba(37,99,235,0.25)]' : 'bg-transparent text-slate-500 hover:bg-blue-500/[0.12] hover:text-blue-700'}`}
                  onClick={() => setTool('move')}
                  title="Move (G)"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/></svg>
                  Move
                </button>
                <button
                  className={`inline-flex items-center justify-center gap-2 py-2 px-[18px] shrink-0 border-none rounded-[10px] text-[13px] font-semibold cursor-pointer transition-all duration-200 leading-[1.5] whitespace-nowrap select-none h-10 box-border ${activeTool === 'rotate' ? 'bg-blue-600 text-white shadow-[0_4px_10px_-1px_rgba(37,99,235,0.25)]' : 'bg-transparent text-slate-500 hover:bg-blue-500/[0.12] hover:text-blue-700'}`}
                  onClick={() => setTool('rotate')}
                  title="Rotate (R)"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>
                  Rotate
                </button>
                <button
                  className={`inline-flex items-center justify-center gap-2 py-2 px-[18px] shrink-0 border-none rounded-[10px] text-[13px] font-semibold cursor-pointer transition-all duration-200 leading-[1.5] whitespace-nowrap select-none h-10 box-border ${activeTool === 'scale' ? 'bg-blue-600 text-white shadow-[0_4px_10px_-1px_rgba(37,99,235,0.25)]' : 'bg-transparent text-slate-500 hover:bg-blue-500/[0.12] hover:text-blue-700'}`}
                  onClick={() => setTool('scale')}
                  title="Scale (S)"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 3l-7 7M21 3v5M21 3h-5M3 21l7-7M3 21v-5M3 21h5"/></svg>
                  Resize
                </button>
              </div>
              <span className="w-px h-8 bg-gradient-to-b from-transparent via-slate-300 to-transparent mx-3 shrink-0" />
              {/* Edit Mode Group (Blender-like) */}
              <div className="flex items-center gap-1 rounded-[14px] p-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-200 box-border h-12 bg-teal-500/[0.06] border border-teal-500/[0.15]">
                <button
                  className={`inline-flex items-center justify-center gap-2 py-2 px-[18px] shrink-0 border-none rounded-[10px] text-[13px] font-semibold cursor-pointer transition-all duration-200 leading-[1.5] whitespace-nowrap select-none h-10 box-border disabled:opacity-25 disabled:cursor-not-allowed disabled:pointer-events-none ${editMode === 'vertex' ? 'bg-teal-600 text-white shadow-[0_4px_10px_-1px_rgba(13,148,136,0.25)]' : 'bg-transparent text-slate-500 hover:bg-teal-500/[0.12] hover:text-teal-700'}`}
                  onClick={() => setEditMode(editMode === 'vertex' ? 'object' : 'vertex')}
                  disabled={selectedIds.length !== 1}
                  title="Vertex Edit (1)"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>
                  Points
                </button>
                <button
                  className={`inline-flex items-center justify-center gap-2 py-2 px-[18px] shrink-0 border-none rounded-[10px] text-[13px] font-semibold cursor-pointer transition-all duration-200 leading-[1.5] whitespace-nowrap select-none h-10 box-border disabled:opacity-25 disabled:cursor-not-allowed disabled:pointer-events-none ${editMode === 'edge' ? 'bg-teal-600 text-white shadow-[0_4px_10px_-1px_rgba(13,148,136,0.25)]' : 'bg-transparent text-slate-500 hover:bg-teal-500/[0.12] hover:text-teal-700'}`}
                  onClick={() => setEditMode(editMode === 'edge' ? 'object' : 'edge')}
                  disabled={selectedIds.length !== 1}
                  title="Edge Edit (2)"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="19" x2="19" y2="5" strokeWidth="2.5"/></svg>
                  Lines
                </button>
                <button
                  className={`inline-flex items-center justify-center gap-2 py-2 px-[18px] shrink-0 border-none rounded-[10px] text-[13px] font-semibold cursor-pointer transition-all duration-200 leading-[1.5] whitespace-nowrap select-none h-10 box-border disabled:opacity-25 disabled:cursor-not-allowed disabled:pointer-events-none ${editMode === 'face' ? 'bg-teal-600 text-white shadow-[0_4px_10px_-1px_rgba(13,148,136,0.25)]' : 'bg-transparent text-slate-500 hover:bg-teal-500/[0.12] hover:text-teal-700'}`}
                  onClick={() => setEditMode(editMode === 'face' ? 'object' : 'face')}
                  disabled={selectedIds.length !== 1}
                  title="Face Edit (3)"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12,3 3,21 21,21"/></svg>
                  Sides
                </button>
              </div>
              {/* Edit Tools (shown when in edit mode) */}
              {editMode !== 'object' && (
                <>
                  <span className="w-px h-8 bg-gradient-to-b from-transparent via-slate-300 to-transparent mx-3 shrink-0" />
                  <div className="flex items-center gap-1 rounded-[14px] p-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-200 box-border h-12 bg-amber-500/[0.06] border border-amber-500/[0.15]">
                    <button
                      className={`inline-flex items-center justify-center gap-2 py-2 px-[18px] shrink-0 border-none rounded-[10px] text-[13px] font-semibold cursor-pointer transition-all duration-200 leading-[1.5] whitespace-nowrap select-none h-10 box-border ${editTool === 'exclude' ? 'bg-amber-500 text-white shadow-[0_4px_10px_-1px_rgba(245,158,11,0.25)]' : 'bg-transparent text-slate-500 hover:bg-amber-500/[0.12] hover:text-amber-700'}`}
                      onClick={() => setEditTool('exclude')}
                      title="Move only selected (E)"
                    >
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v12M5 12l7 7 7-7"/></svg>
                      Move Selected
                    </button>
                    <button
                      className={`inline-flex items-center justify-center gap-2 py-2 px-[18px] shrink-0 border-none rounded-[10px] text-[13px] font-semibold cursor-pointer transition-all duration-200 leading-[1.5] whitespace-nowrap select-none h-10 box-border ${editTool === 'include' ? 'bg-amber-500 text-white shadow-[0_4px_10px_-1px_rgba(245,158,11,0.25)]' : 'bg-transparent text-slate-500 hover:bg-amber-500/[0.12] hover:text-amber-700'}`}
                      onClick={() => setEditTool('include')}
                      title="Move selected + connected (I)"
                    >
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="1"/><rect x="7" y="7" width="10" height="10" rx="1"/></svg>
                      Stretch Shape
                    </button>
                    {editMode === 'vertex' && (
                      <button
                        className="inline-flex items-center justify-center gap-2 py-2 px-[18px] shrink-0 border-none rounded-[10px] text-[13px] font-semibold cursor-pointer transition-all duration-200 leading-[1.5] whitespace-nowrap select-none h-10 box-border bg-transparent text-slate-500 hover:bg-amber-500/[0.12] hover:text-amber-700 disabled:opacity-25 disabled:cursor-not-allowed disabled:pointer-events-none"
                        onClick={() => setEditTool('merge')}
                        disabled={selectedVertices.length < 2}
                        title="Merge Vertices (M)"
                      >
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="8" cy="8" r="2"/><circle cx="16" cy="16" r="2"/><path d="M10 10l4 4"/></svg>
                        Join
                      </button>
                    )}
                    <button
                      className="inline-flex items-center justify-center gap-2 py-2 px-[18px] shrink-0 border-none rounded-[10px] text-[13px] font-semibold cursor-pointer transition-all duration-200 leading-[1.5] whitespace-nowrap select-none h-10 box-border bg-transparent text-slate-500 hover:bg-amber-500/[0.12] hover:text-amber-700"
                      onClick={() => clearComponentSelection()}
                      title="Deselect Components (Escape)"
                    >
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
                      Clear
                    </button>
                  </div>
                </>
              )}
              <span className="w-px h-8 bg-gradient-to-b from-transparent via-slate-300 to-transparent mx-3 shrink-0" />
              <div className="flex items-center gap-1 rounded-[14px] p-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-200 box-border h-12">
                <button
                  className={`inline-flex items-center justify-center gap-2 py-2 px-[18px] shrink-0 rounded-xl border text-[13px] font-semibold cursor-pointer transition-all duration-200 leading-[1.5] whitespace-nowrap select-none h-10 box-border ${rulerActive ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white border-transparent shadow-[0_4px_12px_rgba(37,99,235,0.25)]' : 'bg-slate-100/80 border-slate-200/80 text-slate-600 shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:bg-slate-100 hover:text-slate-800 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)]'}`}
                  onClick={toggleRuler}
                  title="Ruler / Measurement Tool (X)"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M3 12h18"/></svg>
                  Ruler
                </button>
                <button
                  className="inline-flex items-center justify-center gap-2 py-2 px-[18px] shrink-0 border border-slate-200/80 rounded-xl bg-slate-100/80 text-[13px] font-semibold text-slate-600 cursor-pointer transition-all duration-200 leading-[1.5] whitespace-nowrap select-none h-10 box-border shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:bg-slate-100 hover:text-slate-800 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)] disabled:opacity-25 disabled:cursor-not-allowed disabled:pointer-events-none"
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
                      className="inline-flex items-center justify-center gap-2 py-2 px-[18px] shrink-0 border border-slate-200/80 rounded-xl bg-slate-100/80 text-[13px] font-semibold text-slate-600 cursor-pointer transition-all duration-200 leading-[1.5] whitespace-nowrap select-none h-10 box-border shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:bg-slate-100 hover:text-slate-800 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)] disabled:opacity-25 disabled:cursor-not-allowed disabled:pointer-events-none"
                      onClick={() => {
                        if (hasNet) setNetOpen(true);
                      }}
                      disabled={!hasNet}
                      title={hasNet ? "Show how this shape is constructed from its net" : "Net animation not available for this shape"}
                    >
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="5,3 19,12 5,21"/>
                      </svg>
                      Animate
                    </button>
                  );
                })()}
                <button
                  className="inline-flex items-center justify-center gap-2 py-2 px-[18px] shrink-0 border border-slate-200/80 rounded-xl bg-slate-100/80 text-[13px] font-semibold text-slate-600 cursor-pointer transition-all duration-200 leading-[1.5] whitespace-nowrap select-none h-10 box-border shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:bg-slate-100 hover:text-slate-800 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)] disabled:opacity-25 disabled:cursor-not-allowed disabled:pointer-events-none"
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
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9"/>
                    <line x1="3" y1="12" x2="21" y2="12" strokeDasharray="3 2"/>
                  </svg>
                  Split
                </button>
              </div>
              <span className="w-px h-8 bg-gradient-to-b from-transparent via-slate-300 to-transparent mx-3 shrink-0" />
              <div className="text-[10px] font-extrabold uppercase tracking-[1.2px] text-slate-400 mx-2.5 select-none">Combine</div>
              <div className="flex items-center gap-1 rounded-[14px] p-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-200 box-border h-12 bg-purple-500/[0.06] border border-purple-500/[0.15]">
                <button
                  className="inline-flex items-center justify-center gap-2 py-2 px-[18px] shrink-0 border-none rounded-[10px] text-[13px] font-semibold cursor-pointer transition-all duration-200 leading-[1.5] whitespace-nowrap select-none h-10 box-border bg-transparent text-slate-500 hover:bg-purple-500/[0.12] hover:text-purple-700 disabled:opacity-25 disabled:cursor-not-allowed disabled:pointer-events-none"
                  onClick={() => csgOperation('union')}
                  disabled={selectedIds.length < 2}
                  title="Glue shapes together (Ctrl+1)"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="10" cy="10" r="6"/><circle cx="14" cy="14" r="6"/></svg>
                  Glue
                </button>
                <button
                  className="inline-flex items-center justify-center gap-2 py-2 px-[18px] shrink-0 border-none rounded-[10px] text-[13px] font-semibold cursor-pointer transition-all duration-200 leading-[1.5] whitespace-nowrap select-none h-10 box-border bg-transparent text-slate-500 hover:bg-purple-500/[0.12] hover:text-purple-700 disabled:opacity-25 disabled:cursor-not-allowed disabled:pointer-events-none"
                  onClick={() => csgOperation('subtract')}
                  disabled={selectedIds.length < 2}
                  title="Cut one shape from another (Ctrl+2)"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="7"/><rect x="8" y="8" width="8" height="8"/></svg>
                  Cut
                </button>
                <button
                  className="inline-flex items-center justify-center gap-2 py-2 px-[18px] shrink-0 border-none rounded-[10px] text-[13px] font-semibold cursor-pointer transition-all duration-200 leading-[1.5] whitespace-nowrap select-none h-10 box-border bg-transparent text-slate-500 hover:bg-purple-500/[0.12] hover:text-purple-700 disabled:opacity-25 disabled:cursor-not-allowed disabled:pointer-events-none"
                  onClick={() => csgOperation('intersect')}
                  disabled={selectedIds.length < 2}
                  title="Keep only the overlapping part (Ctrl+3)"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="10" cy="10" r="7"/><circle cx="14" cy="14" r="7"/><path d="M6 12a6 6 0 0 1 6-6"/></svg>
                  Overlap
                </button>
              </div>
              <span className="w-px h-8 bg-gradient-to-b from-transparent via-slate-300 to-transparent mx-3 shrink-0" />
              <button
                className={`inline-flex items-center justify-center gap-2 py-2 px-[18px] shrink-0 rounded-xl border text-[13px] font-semibold cursor-pointer transition-all duration-200 leading-[1.5] whitespace-nowrap select-none h-10 box-border disabled:opacity-25 disabled:cursor-not-allowed disabled:pointer-events-none ${(() => {
                  if (selectedIds.length === 0) return '';
                  const sel = shapes.filter((s) => selectedIds.includes(s.id));
                  const anyHole = sel.some((s) => s.isHole);
                  return anyHole ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white border-transparent shadow-[0_4px_12px_rgba(37,99,235,0.25)]' : '';
                })() || 'bg-slate-100/80 border-slate-200/80 text-slate-600 shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:bg-slate-100 hover:text-slate-800 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)]'}`}
                onClick={() => {
                  if (selectedIds.length === 0) return;
                  const sel = shapes.filter((s) => selectedIds.includes(s.id));
                  const anyHole = sel.some((s) => s.isHole);
                  updateShapes(selectedIds, { isHole: !anyHole });
                }}
                disabled={selectedIds.length === 0}
                title="Toggle Solid/Hollow (H)"
              >
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9"/>
                  <circle cx="12" cy="12" r="5" fill="currentColor" opacity={selectedIds.length > 0 && shapes.filter((s) => selectedIds.includes(s.id)).some((s) => s.isHole) ? 0 : 0.3}/>
                </svg>
                {selectedIds.length > 0 && shapes.filter((s) => selectedIds.includes(s.id)).some((s) => s.isHole) ? 'Make Solid' : 'Make Hole'}
              </button>
            </div>
            <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
              <div className="inline-flex items-center gap-1.5 py-2 px-3.5 text-xs font-semibold text-slate-500 bg-slate-100/80 border border-slate-200/80 rounded-[20px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)] select-none transition-all duration-200 h-10 box-border hover:bg-slate-100 hover:text-slate-600 hover:-translate-y-px" title="Objects in scene">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                {shapes.length}
              </div>
              <div className="inline-flex items-center gap-1.5 py-2 px-3.5 text-xs font-semibold text-slate-500 bg-slate-100/80 border border-slate-200/80 rounded-[20px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)] select-none transition-all duration-200 h-10 box-border hover:bg-slate-100 hover:text-slate-600 hover:-translate-y-px" title="Selected shapes">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
                {selectedIds.length}
              </div>
              {tempWorkplane && (
                <div className="inline-flex items-center gap-1.5 py-2 px-3.5 text-xs font-semibold text-slate-500 bg-slate-100/80 border border-slate-200/80 rounded-[20px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)] select-none transition-all duration-200 h-10 box-border hover:bg-slate-100 hover:text-slate-600 hover:-translate-y-px" style={{ color: '#f97316' }}>
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M3 12h18"/></svg>
                  Workplane
                </div>
              )}
              {rulerActive && (
                <div className="inline-flex items-center gap-1.5 py-2 px-3.5 text-xs font-semibold text-slate-500 bg-slate-100/80 border border-slate-200/80 rounded-[20px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)] select-none transition-all duration-200 h-10 box-border hover:bg-slate-100 hover:text-slate-600 hover:-translate-y-px" style={{ color: '#ef4444' }}>
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M3 12h18"/></svg>
                  Ruler
                </div>
              )}
              {editMode !== 'object' && (
                <div className="inline-flex items-center gap-1.5 py-2 px-3.5 text-xs font-semibold text-slate-500 bg-slate-100/80 border border-slate-200/80 rounded-[20px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)] select-none transition-all duration-200 h-10 box-border hover:bg-slate-100 hover:text-slate-600 hover:-translate-y-px" style={{ color: '#a855f7' }}>
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 22h20L12 2z"/></svg>
                  {editMode === 'vertex' ? `Vertex (${selectedVertices.length})` : editMode === 'edge' ? `Edge (${selectedEdges.length})` : `Face (${selectedFaces.length})`}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
              <div className="flex items-center gap-1 rounded-[14px] p-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-200 box-border h-12 bg-slate-500/[0.06] border border-slate-500/[0.15]">
                <button
                  className={`inline-flex items-center justify-center gap-2 py-2 px-[18px] shrink-0 border-none rounded-[10px] text-[13px] font-semibold cursor-pointer transition-all duration-200 leading-[1.5] whitespace-nowrap select-none h-10 box-border ${showGrid ? 'bg-slate-600 text-white shadow-[0_4px_10px_-1px_rgba(71,85,105,0.25)]' : 'bg-transparent text-slate-500 hover:bg-slate-500/[0.12] hover:text-slate-700'}`}
                  onClick={() => setShowGrid(!showGrid)}
                  title="Toggle Grid"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h18v18H3z"/><path d="M3 9h18M9 3v18"/></svg>
                  Grid
                </button>
                <button
                  className={`inline-flex items-center justify-center gap-2 py-2 px-[18px] shrink-0 border-none rounded-[10px] text-[13px] font-semibold cursor-pointer transition-all duration-200 leading-[1.5] whitespace-nowrap select-none h-10 box-border ${showAxes ? 'bg-slate-600 text-white shadow-[0_4px_10px_-1px_rgba(71,85,105,0.25)]' : 'bg-transparent text-slate-500 hover:bg-slate-500/[0.12] hover:text-slate-700'}`}
                  onClick={() => setShowAxes(!showAxes)}
                  title="Toggle Axes"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M2 12h20"/></svg>
                  Axes
                </button>
                <button
                  className="inline-flex items-center justify-center gap-2 py-2 px-[18px] shrink-0 border-none rounded-[10px] text-[13px] font-semibold cursor-pointer transition-all duration-200 leading-[1.5] whitespace-nowrap select-none h-10 box-border bg-transparent text-slate-500 hover:bg-slate-500/[0.12] hover:text-slate-700"
                  onClick={toggleCameraMode}
                  title="Toggle Perspective/Orthographic (P)"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 4v16h22V4z"/><circle cx="12" cy="12" r="3"/></svg>
                  {cameraMode === 'perspective' ? 'Persp' : 'Ortho'}
                </button>
                <span className="w-px h-8 bg-gradient-to-b from-transparent via-slate-300 to-transparent mx-3 shrink-0" />
                <button
                  className="inline-flex items-center justify-center gap-2 py-2 px-[18px] shrink-0 border border-slate-200/80 rounded-xl bg-slate-100/80 text-[13px] font-semibold text-slate-600 cursor-pointer transition-all duration-200 leading-[1.5] whitespace-nowrap select-none h-10 box-border shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:bg-slate-100 hover:text-slate-800 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)]"
                  onClick={() => setPreviewOpen(true)}
                  title="Preview (fullscreen auto-rotate)"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
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

          <div className="flex-1 relative overflow-hidden min-w-0 min-h-0 w-full">
            <Canvas3D />
          </div>
        </div>

        {/* Right side: Shapes Panel + Scene List */}
        <div className={`w-[260px] flex flex-col bg-white border-l border-slate-200 relative overflow-hidden shrink-0 max-lg:w-[220px] max-md:w-[200px]`}>
          {/* Inspector overlay (appears on selection) */}
          <div className={`absolute inset-0 bg-white z-10 transition-[transform_0.2s_ease-out,opacity_0.15s_ease-out] overflow-y-auto ${showInspector && selectedIds.length > 0 ? 'translate-x-0 opacity-100 pointer-events-auto' : 'translate-x-full opacity-0 pointer-events-none'}`}>
            <PropertiesPanel />
          </div>

          {/* Shapes Panel (always present underneath) */}
          <div className={`flex-1 overflow-y-auto transition-[opacity_0.2s_ease] ${showInspector && selectedIds.length > 0 ? 'opacity-0 pointer-events-none absolute inset-0' : ''}`}>
            <ShapePanel />
          </div>

          {/* Scene List (bottom of right panel) */}
          <div className="h-[200px] min-h-[120px] border-t border-slate-200 overflow-y-auto shrink-0">
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
