/**
 * selectionUtils.js — Shared selection logic for SelectionTools
 * Extracted from SelectionTools.jsx for modularity.
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */
import * as THREE from 'three';
import { use3DStore } from '../../store/use3DStore';

export const CIRCLE_RADIUS = 20; // pixels for circle select

// Helper to get Three.js refs (stored by Canvas3D's CameraController)
export function getR3FRefs() {
  return window.__r3fRefs || { camera: null, gl: null, scene: null };
}

// Collect all selectable meshes from scene
export function getShapeMeshes() {
  const { scene } = getR3FRefs();
  const meshes = [];
  scene?.traverse?.((child) => {
    if (child.isMesh && child.userData.shapeId && !child.userData.gizmoAxis) {
      meshes.push(child);
    }
  });
  return meshes;
}

// Get all component positions for edit mode raycasting
export function getComponentPositions() {
  const { editMode, editShapeId, geometryCache } = use3DStore.getState();
  if (editMode === 'object' || !editShapeId) return null;
  const geo = geometryCache[editShapeId];
  if (!geo) return null;

  const mesh = (() => {
    const { scene } = getR3FRefs();
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
}

// Project world position to screen coordinates
export function worldToScreen(worldPos) {
  const { camera, gl } = getR3FRefs();
  if (!camera || !gl) return { x: 0, y: 0 };
  const canvas = gl.domElement;
  const rect = canvas.getBoundingClientRect();
  const v = worldPos.clone().project(camera);
  return {
    x: ((v.x + 1) / 2) * rect.width + rect.left,
    y: ((-v.y + 1) / 2) * rect.height + rect.top,
  };
}

// Check if a screen point is inside a selection area
export function isInsideSelection(screenX, screenY, start, current, lasso) {
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
}

// Apply selection results to store
export function applySelection(selectedItems, additive) {
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
}

// Select items within screen rectangle
export function selectInRectangle(start, current, additive) {
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
}

// Select items within circle
export function selectInCircle(screenX, screenY, additive) {
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
}

// Select items within lasso
export function selectInLasso(points, additive) {
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
}
