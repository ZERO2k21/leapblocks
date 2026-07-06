/**
 * SelectionTools.jsx — Blender-like Box/Circle/Lasso selection
 * Works in both Object Mode (shapes) and Edit Mode (vertices/edges/faces).
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */
import { useRef, useEffect, useState, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { use3DStore } from '../store/use3DStore';
import { debug } from '../utils/logger';

const CIRCLE_RADIUS = 20; // pixels for circle select

/**
 * SelectionTools — handles Box (B), Circle (C), and Lasso (Ctrl+RMB) selection.
 * Renders overlay on a separate DOM layer (not inside R3F).
 */
const SelectionTools = () => {
  const { camera, gl, scene } = useThree();
  const [mode, setMode] = useState(null); // null | 'box' | 'circle' | 'lasso'
  const [dragStart, setDragStart] = useState(null);
  const [dragCurrent, setDragCurrent] = useState(null);
  const [circlePos, setCirclePos] = useState(null);
  const [lassoPoints, setLassoPoints] = useState([]);
  const modeRef = useRef(null);
  const dragStartRef = useRef(null);
  const activeRef = useRef(false);

  const editMode = use3DStore((s) => s.editMode);
  const editShapeId = use3DStore((s) => s.editShapeId);
  const geometryCache = use3DStore((s) => s.geometryCache);

  // Collect all selectable meshes from scene
  const getShapeMeshes = useCallback(() => {
    const meshes = [];
    scene?.traverse?.((child) => {
      if (child.isMesh && child.userData.shapeId && !child.userData.gizmoAxis) {
        meshes.push(child);
      }
    });
    return meshes;
  }, [scene]);

  // Get all component positions for edit mode raycasting
  const getComponentPositions = useCallback(() => {
    if (editMode === 'object' || !editShapeId) return null;
    const geo = geometryCache[editShapeId];
    if (!geo) return null;

    const mesh = (() => {
      let found = null;
      scene?.traverse?.((child) => {
        if (found) return;
        if (child.isMesh && child.userData.shapeId === editShapeId) found = child;
      });
      return found;
    })();
    if (!mesh) return null;

    const pos = geo.attributes.position;
    const index = geo.index;
    const results = [];

    if (editMode === 'vertex') {
      for (let i = 0; i < pos.count; i++) {
        const v = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
        v.applyMatrix4(mesh.matrixWorld);
        results.push({ type: 'vertex', index: i, worldPos: v });
      }
    } else if (editMode === 'edge') {
      const edgeSet = new Set();
      const addEdge = (a, b) => {
        const key = Math.min(a, b) + '-' + Math.max(a, b);
        if (edgeSet.has(key)) return;
        edgeSet.add(key);
        const va = new THREE.Vector3(pos.getX(a), pos.getY(a), pos.getZ(a)).applyMatrix4(mesh.matrixWorld);
        const vb = new THREE.Vector3(pos.getX(b), pos.getY(b), pos.getZ(b)).applyMatrix4(mesh.matrixWorld);
        const mid = va.clone().add(vb).multiplyScalar(0.5);
        results.push({ type: 'edge', a: Math.min(a, b), b: Math.max(a, b), worldPos: mid });
      };
      if (index) {
        for (let i = 0; i < index.count; i += 3) {
          addEdge(index.getX(i), index.getX(i + 1));
          addEdge(index.getX(i + 1), index.getX(i + 2));
          addEdge(index.getX(i + 2), index.getX(i));
        }
      } else {
        for (let i = 0; i < pos.count; i += 3) {
          addEdge(i, i + 1); addEdge(i + 1, i + 2); addEdge(i + 2, i);
        }
      }
    } else if (editMode === 'face') {
      const faceCount = index ? index.count / 3 : pos.count / 3;
      for (let i = 0; i < faceCount; i++) {
        let a, b, c;
        if (index) {
          a = index.getX(i * 3); b = index.getX(i * 3 + 1); c = index.getX(i * 3 + 2);
        } else { a = i * 3; b = i * 3 + 1; c = i * 3 + 2; }
        const va = new THREE.Vector3(pos.getX(a), pos.getY(a), pos.getZ(a)).applyMatrix4(mesh.matrixWorld);
        const vb = new THREE.Vector3(pos.getX(b), pos.getY(b), pos.getZ(b)).applyMatrix4(mesh.matrixWorld);
        const vc = new THREE.Vector3(pos.getX(c), pos.getY(c), pos.getZ(c)).applyMatrix4(mesh.matrixWorld);
        const center = va.clone().add(vb).add(vc).divideScalar(3);
        results.push({ type: 'face', index: i, worldPos: center });
      }
    }
    return results;
  }, [editMode, editShapeId, geometryCache, scene]);

  // Project world position to screen coordinates
  const worldToScreen = useCallback((worldPos) => {
    const canvas = gl.domElement;
    const rect = canvas.getBoundingClientRect();
    const v = worldPos.clone().project(camera);
    return {
      x: ((v.x + 1) / 2) * rect.width + rect.left,
      y: ((-v.y + 1) / 2) * rect.height + rect.top,
    };
  }, [camera, gl]);

  // Check if a screen point is inside a selection area
  const isInsideSelection = useCallback((screenX, screenY, start, current, lasso) => {
    if (lasso && lasso.length > 2) {
      // Point-in-polygon test for lasso
      let inside = false;
      for (let i = 0, j = lasso.length - 1; i < lasso.length; j = i++) {
        const xi = lasso[i].x, yi = lasso[i].y;
        const xj = lasso[j].x, yj = lasso[j].y;
        if (((yi > screenY) !== (yj > screenY)) && (screenX < (xj - xi) * (screenY - yi) / (yj - yi) + xi)) {
          inside = !inside;
        }
      }
      return inside;
    }
    if (start && current) {
      const minX = Math.min(start.x, current.x);
      const maxX = Math.max(start.x, current.x);
      const minY = Math.min(start.y, current.y);
      const maxY = Math.max(start.y, current.y);
      return screenX >= minX && screenX <= maxX && screenY >= minY && screenY <= maxY;
    }
    return false;
  }, []);

  // Apply selection results to store
  const applySelection = useCallback((selectedItems, additive) => {
    const store = use3DStore.getState();

    if (store.editMode === 'object') {
      const shapeIds = selectedItems.map(item => item.shapeId);
      if (additive) {
        const currentIds = new Set(store.selectedIds);
        shapeIds.forEach(id => currentIds.add(id));
        store.selectShapes([...currentIds]);
      } else {
        store.selectShapes(shapeIds);
      }
    } else {
      const mode = store.editMode;
      const shapeId = store.editShapeId;
      if (mode === 'vertex') {
        const verts = selectedItems.map(item => ({ shapeId, index: item.index }));
        if (additive) {
          const existing = new Set(store.selectedVertices.map(v => v.index));
          const newVerts = verts.filter(v => !existing.has(v.index));
          use3DStore.setState({ selectedVertices: [...store.selectedVertices, ...newVerts] });
        } else {
          use3DStore.setState({ selectedVertices: verts });
        }
      } else if (mode === 'edge') {
        const edges = selectedItems.map(item => ({ shapeId, a: item.a, b: item.b }));
        if (additive) {
          const edgeKey = (e) => `${Math.min(e.a, e.b)}-${Math.max(e.a, e.b)}`;
          const existing = new Set(store.selectedEdges.map(edgeKey));
          const newEdges = edges.filter(e => !existing.has(edgeKey(e)));
          use3DStore.setState({ selectedEdges: [...store.selectedEdges, ...newEdges] });
        } else {
          use3DStore.setState({ selectedEdges: edges });
        }
      } else if (mode === 'face') {
        const faces = selectedItems.map(item => ({ shapeId, index: item.index }));
        if (additive) {
          const existing = new Set(store.selectedFaces.map(f => f.index));
          const newFaces = faces.filter(f => !existing.has(f.index));
          use3DStore.setState({ selectedFaces: [...store.selectedFaces, ...newFaces] });
        } else {
          use3DStore.setState({ selectedFaces: faces });
        }
      }
    }
  }, []);

  // Select items within screen rectangle
  const selectInRectangle = useCallback((start, current, additive) => {
    const store = use3DStore.getState();

    if (store.editMode === 'object') {
      const meshes = getShapeMeshes();
      const selected = [];
      for (const mesh of meshes) {
        const screen = worldToScreen(mesh.position);
        if (isInsideSelection(screen.x, screen.y, start, current, null)) {
          selected.push({ shapeId: mesh.userData.shapeId });
        }
      }
      applySelection(selected, additive);
    } else {
      const components = getComponentPositions();
      if (!components) return;
      const selected = [];
      for (const comp of components) {
        const screen = worldToScreen(comp.worldPos);
        if (isInsideSelection(screen.x, screen.y, start, current, null)) {
          selected.push(comp);
        }
      }
      applySelection(selected, additive);
    }
  }, [getShapeMeshes, getComponentPositions, worldToScreen, isInsideSelection, applySelection]);

  // Select items within circle
  const selectInCircle = useCallback((screenX, screenY, additive) => {
    const store = use3DStore.getState();

    if (store.editMode === 'object') {
      const meshes = getShapeMeshes();
      const selected = [];
      for (const mesh of meshes) {
        const screen = worldToScreen(mesh.position);
        const dist = Math.sqrt((screen.x - screenX) ** 2 + (screen.y - screenY) ** 2);
        if (dist <= CIRCLE_RADIUS) {
          selected.push({ shapeId: mesh.userData.shapeId });
        }
      }
      if (selected.length > 0) applySelection(selected, additive);
    } else {
      const components = getComponentPositions();
      if (!components) return;
      const selected = [];
      for (const comp of components) {
        const screen = worldToScreen(comp.worldPos);
        const dist = Math.sqrt((screen.x - screenX) ** 2 + (screen.y - screenY) ** 2);
        if (dist <= CIRCLE_RADIUS) {
          selected.push(comp);
        }
      }
      if (selected.length > 0) applySelection(selected, additive);
    }
  }, [getShapeMeshes, getComponentPositions, worldToScreen, applySelection]);

  // Select items within lasso
  const selectInLasso = useCallback((points, additive) => {
    if (points.length < 3) return;
    const store = use3DStore.getState();

    if (store.editMode === 'object') {
      const meshes = getShapeMeshes();
      const selected = [];
      for (const mesh of meshes) {
        const screen = worldToScreen(mesh.position);
        if (isInsideSelection(screen.x, screen.y, null, null, points)) {
          selected.push({ shapeId: mesh.userData.shapeId });
        }
      }
      applySelection(selected, additive);
    } else {
      const components = getComponentPositions();
      if (!components) return;
      const selected = [];
      for (const comp of components) {
        const screen = worldToScreen(comp.worldPos);
        if (isInsideSelection(screen.x, screen.y, null, null, points)) {
          selected.push(comp);
        }
      }
      applySelection(selected, additive);
    }
  }, [getShapeMeshes, getComponentPositions, worldToScreen, isInsideSelection, applySelection]);

  useEffect(() => {
    const canvas = gl.domElement;
    let lassoTimer = null;

    const onKeyDown = (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();

      // B = Box Select
      if (key === 'b' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        debug('SelectionTools: Box Select activated');
        setMode('box');
        modeRef.current = 'box';
        canvas.style.cursor = 'crosshair';
      }

      // C = Circle Select
      if (key === 'c' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        debug('SelectionTools: Circle Select activated');
        setMode('circle');
        modeRef.current = 'circle';
        canvas.style.cursor = 'crosshair';
      }

      // Escape = cancel selection tool
      if (e.key === 'Escape' && modeRef.current) {
        e.preventDefault();
        debug('SelectionTools: cancelled');
        setMode(null);
        modeRef.current = null;
        setDragStart(null);
        setDragCurrent(null);
        setCirclePos(null);
        setLassoPoints([]);
        canvas.style.cursor = 'auto';
      }
    };

    const onPointerDown = (e) => {
      if (!modeRef.current) return;
      if (window.__gizmoActive) return;

      const x = e.clientX;
      const y = e.clientY;

      if (modeRef.current === 'box') {
        setDragStart({ x, y });
        setDragCurrent({ x, y });
        dragStartRef.current = { x, y };
        activeRef.current = true;
      } else if (modeRef.current === 'circle') {
        activeRef.current = true;
        setCirclePos({ x, y });
        selectInCircle(x, y, e.shiftKey);
      } else if (modeRef.current === 'lasso') {
        setLassoPoints([{ x, y }]);
        activeRef.current = true;
      }
    };

    const onPointerMove = (e) => {
      if (!activeRef.current || !modeRef.current) return;

      const x = e.clientX;
      const y = e.clientY;

      if (modeRef.current === 'box') {
        setDragCurrent({ x, y });
      } else if (modeRef.current === 'circle') {
        setCirclePos({ x, y });
        selectInCircle(x, y, e.shiftKey);
      } else if (modeRef.current === 'lasso') {
        setLassoPoints(prev => [...prev, { x, y }]);
      }
    };

    const onPointerUp = (e) => {
      if (!activeRef.current || !modeRef.current) return;

      const x = e.clientX;
      const y = e.clientY;

      if (modeRef.current === 'box' && dragStartRef.current) {
        selectInRectangle(dragStartRef.current, { x, y }, e.shiftKey);
        debug('SelectionTools: Box select applied');
      } else if (modeRef.current === 'lasso') {
        setLassoPoints(prev => {
          if (prev.length > 2) {
            selectInLasso(prev, e.shiftKey);
            debug('SelectionTools: Lasso select applied');
          }
          return [];
        });
      }

      activeRef.current = false;
      if (modeRef.current !== 'circle') {
        setMode(null);
        modeRef.current = null;
        setDragStart(null);
        setDragCurrent(null);
        canvas.style.cursor = 'auto';
      }
    };

    // For circle select, right-click removes, middle-click or escape exits
    const onContextMenu = (e) => {
      if (modeRef.current === 'circle') {
        e.preventDefault();
        // Right-click in circle mode: deselect at position
        // (We handle this by not selecting when right-click is detected)
      }
    };

    const onKeyUp = (e) => {
      if (modeRef.current === 'circle' && e.key === 'c') {
        // Exit circle select on second C press
        setMode(null);
        modeRef.current = null;
        activeRef.current = false;
        setCirclePos(null);
        canvas.style.cursor = 'auto';
      }
    };

    window.addEventListener('keydown', onKeyDown);
    canvas.addEventListener('pointerdown', onPointerDown, { capture: true });
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      canvas.removeEventListener('pointerdown', onPointerDown, { capture: true });
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('keyup', onKeyUp);
      if (lassoTimer) clearTimeout(lassoTimer);
      canvas.style.cursor = 'auto';
    };
  }, [gl, camera, scene, selectInRectangle, selectInCircle, selectInLasso]);

  // Render overlay as a separate div on top of canvas
  const canvas = gl?.domElement;
  const overlayParent = canvas?.parentElement;

  if (!overlayParent || !mode) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 100,
      }}
    >
      {/* Box select rectangle */}
      {mode === 'box' && dragStart && dragCurrent && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(dragStart.x, dragCurrent.x),
            top: Math.min(dragStart.y, dragCurrent.y),
            width: Math.abs(dragCurrent.x - dragStart.x),
            height: Math.abs(dragCurrent.y - dragStart.y),
            border: '1px solid #60a5fa',
            backgroundColor: 'rgba(96, 165, 250, 0.1)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Circle select cursor */}
      {mode === 'circle' && circlePos && (
        <div
          style={{
            position: 'absolute',
            left: circlePos.x - CIRCLE_RADIUS,
            top: circlePos.y - CIRCLE_RADIUS,
            width: CIRCLE_RADIUS * 2,
            height: CIRCLE_RADIUS * 2,
            borderRadius: '50%',
            border: '2px solid #60a5fa',
            backgroundColor: 'rgba(96, 165, 250, 0.1)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Lasso path */}
      {mode === 'lasso' && lassoPoints.length > 1 && (
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          <polyline
            points={lassoPoints.map(p => `${p.x},${p.y}`).join(' ')}
            fill="rgba(96, 165, 250, 0.1)"
            stroke="#60a5fa"
            strokeWidth="1"
          />
        </svg>
      )}
    </div>
  );
};

export default SelectionTools;
