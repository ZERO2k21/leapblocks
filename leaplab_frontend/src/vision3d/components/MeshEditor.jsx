/**
 * MeshEditor.jsx — Blender-like vertex/edge/face editing
 * Handles raycasting, selection, and transform of mesh components.
 * Uses refs for mesh/geometry so the pointerdown listener stays stable.
 */
import { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { use3DStore } from '../store/use3DStore';
import { debug, warn } from '../utils/logger';

const _raycaster = new THREE.Raycaster();
const _mouse = new THREE.Vector2();

// Pre-allocated objects for transforms
const _vA = new THREE.Vector3();
const _vB = new THREE.Vector3();
const _vC = new THREE.Vector3();
const _edgeMid = new THREE.Vector3();
const _faceCenter = new THREE.Vector3();
const _normal = new THREE.Vector3();
const _delta = new THREE.Vector3();
const _intersectPlane = new THREE.Plane();
const _intersectPoint = new THREE.Vector3();

// Get directly selected vertex indices (no spatial weld, no neighbors)
function getDirectSelection(geo, selectedVertices, selectedEdges, selectedFaces) {
  const selected = new Set();
  for (const v of selectedVertices) selected.add(v.index);
  for (const e of selectedEdges) { selected.add(e.a); selected.add(e.b); }
  for (const f of selectedFaces) {
    const idx = geo.index;
    if (idx) {
      selected.add(idx.getX(f.index * 3));
      selected.add(idx.getX(f.index * 3 + 1));
      selected.add(idx.getX(f.index * 3 + 2));
    } else {
      selected.add(f.index * 3);
      selected.add(f.index * 3 + 1);
      selected.add(f.index * 3 + 2);
    }
  }
  return selected;
}

// Blender-style proportional editing falloff functions
function falloffSmooth(r) {
  if (r >= 1) return 0;
  return 3 * r * r - 2 * r * r * r; // smoothstep
}

function applyProportionalFalloff(r) {
  return falloffSmooth(r);
}

// Get all vertex indices connected to the selected components.
// Uses spatial coincidence detection for indexed geometry (e.g. BoxGeometry
// where adjacent faces have separate vertex copies at the same 3D position)
function getConnectedVertices(geo, selectedVertices, selectedEdges, selectedFaces) {
  const connected = new Set();
  const idx = geo.index;
  const posAttr = geo.attributes.position;

  // Add selected vertices directly
  for (const v of selectedVertices) connected.add(v.index);

  // For edges: add both endpoints
  for (const e of selectedEdges) { connected.add(e.a); connected.add(e.b); }

  // For faces: add all face vertices
  if (selectedFaces.length > 0) {
    for (const f of selectedFaces) {
      if (idx) {
        connected.add(idx.getX(f.index * 3));
        connected.add(idx.getX(f.index * 3 + 1));
        connected.add(idx.getX(f.index * 3 + 2));
      } else {
        connected.add(f.index * 3);
        connected.add(f.index * 3 + 1);
        connected.add(f.index * 3 + 2);
      }
    }
  }

  // STEP 1: Spatial weld — for indexed geometry, find vertices at the same
  // 3D position (within epsilon). BoxGeometry has 24 verts (4 per face) where
  // corners are duplicated per-face with different indices.
  const EPSILON = 0.0001;
  const expanded = new Set(connected);

  if (idx) {
    // Build a spatial position map: quantized position → [vertex indices]
    const posMap = new Map();
    for (let i = 0; i < posAttr.count; i++) {
      const x = Math.round(posAttr.getX(i) / EPSILON) * EPSILON;
      const y = Math.round(posAttr.getY(i) / EPSILON) * EPSILON;
      const z = Math.round(posAttr.getZ(i) / EPSILON) * EPSILON;
      const key = `${x},${y},${z}`;
      if (!posMap.has(key)) posMap.set(key, []);
      posMap.get(key).push(i);
    }

    // For every vertex in connected, also add all spatially coincident vertices
    for (const vi of connected) {
      const x = Math.round(posAttr.getX(vi) / EPSILON) * EPSILON;
      const y = Math.round(posAttr.getY(vi) / EPSILON) * EPSILON;
      const z = Math.round(posAttr.getZ(vi) / EPSILON) * EPSILON;
      const key = `${x},${y},${z}`;
      for (const w of posMap.get(key) || []) expanded.add(w);
    }
  }

  // STEP 2: Find neighbors — vertices connected by an edge to any selected vertex
  const neighbors = new Set();

  if (idx) {
    for (let i = 0; i < idx.count; i += 3) {
      const a = idx.getX(i), b = idx.getX(i + 1), c = idx.getX(i + 2);
      if (expanded.has(a) && !expanded.has(b)) neighbors.add(b);
      if (expanded.has(b) && !expanded.has(a)) neighbors.add(a);
      if (expanded.has(b) && !expanded.has(c)) neighbors.add(c);
      if (expanded.has(c) && !expanded.has(b)) neighbors.add(b);
      if (expanded.has(c) && !expanded.has(a)) neighbors.add(a);
      if (expanded.has(a) && !expanded.has(c)) neighbors.add(c);
    }
  } else {
    for (let i = 0; i < posAttr.count; i += 3) {
      const a = i, b = i + 1, c = i + 2;
      if (expanded.has(a) && !expanded.has(b)) neighbors.add(b);
      if (expanded.has(b) && !expanded.has(a)) neighbors.add(a);
      if (expanded.has(b) && !expanded.has(c)) neighbors.add(c);
      if (expanded.has(c) && !expanded.has(b)) neighbors.add(b);
      if (expanded.has(c) && !expanded.has(a)) neighbors.add(a);
      if (expanded.has(a) && !expanded.has(c)) neighbors.add(c);
    }
  }

  return { selected: expanded, neighbors };
}

/**
 * MeshEditor — active only in vertex/edge/face edit modes.
 * Listens to pointer events on the canvas for selection and transform.
 * Uses refs for mesh/geometry so the pointerdown effect has minimal deps.
 */
export const MeshEditor = () => {
  const editMode = use3DStore((s) => s.editMode);
  const editShapeId = use3DStore((s) => s.editShapeId);
  const selectedVertices = use3DStore((s) => s.selectedVertices);
  const selectedEdges = use3DStore((s) => s.selectedEdges);
  const selectedFaces = use3DStore((s) => s.selectedFaces);
  const editTool = use3DStore((s) => s.editTool);
  const selectVertex = use3DStore((s) => s.selectVertex);
  const selectEdge = use3DStore((s) => s.selectEdge);
  const selectFace = use3DStore((s) => s.selectFace);
  const clearComponentSelection = use3DStore((s) => s.clearComponentSelection);
  const cacheGeometry = use3DStore((s) => s.cacheGeometry);
  const applyGeometryEdit = use3DStore((s) => s.applyGeometryEdit);
  const { camera, gl, scene } = useThree();

  const dragRef = useRef(null);
  const meshRef = useRef(null);
  const geoRef = useRef(null);

  // Cache refs for values used inside event handlers (avoids stale closures)
  const editModeRef = useRef(editMode);
  editModeRef.current = editMode;
  const editShapeIdRef = useRef(editShapeId);
  editShapeIdRef.current = editShapeId;

  // Find the target mesh and cache its geometry
  useEffect(() => {
    if (editMode === 'object' || !editShapeId) {
      meshRef.current = null;
      geoRef.current = null;
      return;
    }

    // Clear any stuck gizmo-active flag from a previous object-mode drag
    window.__gizmoActive = false;

    let found = null;
    scene?.traverse?.((child) => {
      if (found) return;
      if (child.isMesh && child.userData.shapeId === editShapeId) {
        found = child;
      }
    });

    if (!found) {
      warn('MeshEditor: target mesh not found for shapeId=' + editShapeId);
      meshRef.current = null;
      geoRef.current = null;
      return;
    }

    meshRef.current = found;
    // Use the mesh's actual geometry — modifications in place are reflected in the mesh
    const geo = found.geometry;
    geoRef.current = geo;
    cacheGeometry(editShapeId, geo);

    debug('MeshEditor: cached geometry for ' + editShapeId + ' verts=' + geo.attributes.position.count);
  }, [editMode, editShapeId, scene, cacheGeometry]);

  // Apply edit tool operation — creates new geometry and syncs mesh + refs
  const applyEditTool = useCallback((tool) => {
    const geo = geoRef.current;
    const mesh = meshRef.current;
    if (!geo || !mesh || !editShapeIdRef.current) return;
    const shapeId = editShapeIdRef.current;

    // Helper: after tool modifies newGeo, sync everything
    const commitToolResult = (newGeo) => {
      newGeo.computeVertexNormals();
      // Update mesh geometry directly
      mesh.geometry = newGeo;
      // Update refs and cache
      geoRef.current = newGeo;
      cacheGeometry(shapeId, newGeo);
      // Persist to store
      applyGeometryEdit(shapeId, newGeo);
    };

    if (tool === 'extrude' && selectedFaces.length > 0) {
      const newGeo = geo.clone();
      const pos = newGeo.attributes.position;
      const idx = newGeo.index;

      for (const sel of selectedFaces) {
        if (sel.shapeId !== shapeId) continue;
        const faceIdx = sel.index;

        let a, b, c;
        if (idx) {
          a = idx.getX(faceIdx * 3);
          b = idx.getX(faceIdx * 3 + 1);
          c = idx.getX(faceIdx * 3 + 2);
        } else {
          a = faceIdx * 3;
          b = faceIdx * 3 + 1;
          c = faceIdx * 3 + 2;
        }

        _vA.fromBufferAttribute(pos, a);
        _vB.fromBufferAttribute(pos, b);
        _vC.fromBufferAttribute(pos, c);
        _normal.crossVectors(_vB.sub(_vA), _vC.sub(_vA)).normalize();

        const newCount = pos.count;
        const arr = pos.array;
        const newArr = new Float32Array(arr.length + 9);
        newArr.set(arr);
        newArr[arr.length] = arr[a * 3]; newArr[arr.length + 1] = arr[a * 3 + 1]; newArr[arr.length + 2] = arr[a * 3 + 2];
        newArr[arr.length + 3] = arr[b * 3]; newArr[arr.length + 4] = arr[b * 3 + 1]; newArr[arr.length + 5] = arr[b * 3 + 2];
        newArr[arr.length + 6] = arr[c * 3]; newArr[arr.length + 7] = arr[c * 3 + 1]; newArr[arr.length + 8] = arr[c * 3 + 2];

        pos.array = newArr;
        pos.count = pos.count + 3;
        pos.needsUpdate = true;

        const extrudeDist = 1.0;
        for (const vi of [a, b, c]) {
          pos.array[vi * 3] += _normal.x * extrudeDist;
          pos.array[vi * 3 + 1] += _normal.y * extrudeDist;
          pos.array[vi * 3 + 2] += _normal.z * extrudeDist;
        }

        if (idx) {
          const newIdx = new Uint32Array(idx.count + 3);
          newIdx.set(idx.array);
          newIdx[idx.count] = newCount;
          newIdx[idx.count + 1] = newCount + 1;
          newIdx[idx.count + 2] = newCount + 2;
          newGeo.index = new THREE.BufferAttribute(newIdx, 1);
        }
      }

      commitToolResult(newGeo);
    }

    if (tool === 'inset' && selectedFaces.length > 0) {
      const newGeo = geo.clone();
      const pos = newGeo.attributes.position;

      for (const sel of selectedFaces) {
        if (sel.shapeId !== shapeId) continue;
        const faceIdx = sel.index;

        let a, b, c;
        if (newGeo.index) {
          a = newGeo.index.getX(faceIdx * 3);
          b = newGeo.index.getX(faceIdx * 3 + 1);
          c = newGeo.index.getX(faceIdx * 3 + 2);
        } else {
          a = faceIdx * 3;
          b = faceIdx * 3 + 1;
          c = faceIdx * 3 + 2;
        }

        _vA.fromBufferAttribute(pos, a);
        _vB.fromBufferAttribute(pos, b);
        _vC.fromBufferAttribute(pos, c);
        _faceCenter.copy(_vA).add(_vB).add(_vC).divideScalar(3);

        const insetFactor = 0.6;
        _vA.lerp(_faceCenter, 1 - insetFactor);
        _vB.lerp(_faceCenter, 1 - insetFactor);
        _vC.lerp(_faceCenter, 1 - insetFactor);

        pos.array[a * 3] = _vA.x; pos.array[a * 3 + 1] = _vA.y; pos.array[a * 3 + 2] = _vA.z;
        pos.array[b * 3] = _vB.x; pos.array[b * 3 + 1] = _vB.y; pos.array[b * 3 + 2] = _vB.z;
        pos.array[c * 3] = _vC.x; pos.array[c * 3 + 1] = _vC.y; pos.array[c * 3 + 2] = _vC.z;
      }

      commitToolResult(newGeo);
    }

    if (tool === 'merge' && selectedVertices.length >= 2) {
      const newGeo = geo.clone();
      const pos = newGeo.attributes.position;

      _faceCenter.set(0, 0, 0);
      let count = 0;
      for (const sel of selectedVertices) {
        if (sel.shapeId !== shapeId) continue;
        _vA.fromBufferAttribute(pos, sel.index);
        _faceCenter.add(_vA);
        count++;
      }
      if (count > 0) _faceCenter.divideScalar(count);

      for (const sel of selectedVertices) {
        if (sel.shapeId !== shapeId) continue;
        pos.array[sel.index * 3] = _faceCenter.x;
        pos.array[sel.index * 3 + 1] = _faceCenter.y;
        pos.array[sel.index * 3 + 2] = _faceCenter.z;
      }

      commitToolResult(newGeo);
      clearComponentSelection();
    }
  }, [selectedFaces, selectedEdges, selectedVertices, applyGeometryEdit, clearComponentSelection]);

  // Apply tool when editTool changes (skip exclude/include — they are drag-based)
  useEffect(() => {
    if (editTool && editTool !== 'exclude' && editTool !== 'include') {
      applyEditTool(editTool);
    }
  }, [editTool, applyEditTool]);

  // Pointer event handlers — depends only on editMode + stable refs
  useEffect(() => {
    if (editMode === 'object') return;

    const canvas = gl.domElement;

    const onPointerDown = (e) => {
      if (e.button !== 0) return;
      if (window.__gizmoActive) return;

      const mesh = meshRef.current;
      const geo = geoRef.current;
      const shapeId = editModeRef.current === 'object' ? null : editShapeIdRef.current;
      if (!mesh || !geo || !shapeId) return;

      const rect = canvas.getBoundingClientRect();
      _mouse.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      _raycaster.setFromCamera(_mouse, camera);
      const hits = _raycaster.intersectObject(mesh, false);

      if (hits.length === 0) {
        debug('MeshEditor: raycast miss - clearing selection');
        clearComponentSelection();
        return;
      }

      const hit = hits[0];
      const pos = geo.attributes.position;
      const face = hit.face;
      const currentMode = editModeRef.current;
      const currentTool = use3DStore.getState().editTool;

      // Check if exclude/include mode — start drag-to-move
      if (currentTool === 'exclude' || currentTool === 'include') {
        const sel = use3DStore.getState();
        const hasSelection = sel.selectedVertices.length > 0 || sel.selectedEdges.length > 0 || sel.selectedFaces.length > 0;
        if (!hasSelection) {
          debug('MeshEditor: exclude/include but no selection — doing selection instead');
        } else {
          // Start drag-to-move: store original positions and set up plane
          let selected, neighbors;
          if (currentTool === 'exclude') {
            // Exclude: only directly selected vertices (no weld, no neighbors)
            selected = getDirectSelection(geo, sel.selectedVertices, sel.selectedEdges, sel.selectedFaces);
            neighbors = new Set();
          } else {
            // Include: selected + spatial-welded + connected neighbors with proportional falloff
            const result = getConnectedVertices(geo, sel.selectedVertices, sel.selectedEdges, sel.selectedFaces);
            selected = result.selected;
            neighbors = result.neighbors;
          }

          // Store original positions for all vertices we might move
          const origPositions = new Float32Array(pos.array.length);
          origPositions.set(pos.array);

          // Set up intersect plane from hit point and camera
          const camDir = new THREE.Vector3();
          camera.getWorldDirection(camDir);
          _intersectPlane.setFromNormalAndCoplanarPoint(camDir.negate(), hit.point);

          // Compute selection center (used for proportional falloff in Include mode)
          _faceCenter.set(0, 0, 0);
          if (selected.size > 0) {
            for (const vi of selected) {
              _vC.fromBufferAttribute(pos, vi);
              _faceCenter.add(_vC);
            }
            _faceCenter.divideScalar(selected.size);
          }

          dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            moved: false,
            mode: currentTool, // 'exclude' or 'include'
            selectedVerts: selected,
            neighborVerts: neighbors,
            origPositions,
            hitPoint: hit.point.clone(),
            selectionCenter: _faceCenter.clone(),
            proportionalRadius: use3DStore.getState().proportionalRadius || 2.0,
          };

          debug('MeshEditor: drag-to-move start mode=' + currentTool + ' selected=' + selected.size + ' neighbors=' + neighbors.size);
          e.stopPropagation();
          return;
        }
      }

      if (currentMode === 'vertex') {
        const candidates = [face.a, face.b, face.c];
        let minDist = Infinity;
        let closestIdx = face.a;
        for (const idx of candidates) {
          _vA.fromBufferAttribute(pos, idx);
          _vA.applyMatrix4(mesh.matrixWorld);
          const d = hit.point.distanceTo(_vA);
          if (d < minDist) {
            minDist = d;
            closestIdx = idx;
          }
        }
        debug('MeshEditor: vertex idx=' + closestIdx + ' shift=' + e.shiftKey);
        selectVertex(shapeId, closestIdx, e.shiftKey);
      } else if (currentMode === 'edge') {
        const candidates = [
          { a: face.a, b: face.b },
          { a: face.b, b: face.c },
          { a: face.c, b: face.a },
        ];
        let minDist = Infinity;
        let bestEdge = candidates[0];
        for (const edge of candidates) {
          _vA.fromBufferAttribute(pos, edge.a).applyMatrix4(mesh.matrixWorld);
          _vB.fromBufferAttribute(pos, edge.b).applyMatrix4(mesh.matrixWorld);
          _edgeMid.copy(_vA).add(_vB).multiplyScalar(0.5);
          const d = hit.point.distanceTo(_edgeMid);
          if (d < minDist) {
            minDist = d;
            bestEdge = edge;
          }
        }
        debug('MeshEditor: edge a=' + bestEdge.a + ' b=' + bestEdge.b + ' shift=' + e.shiftKey);
        selectEdge(shapeId, bestEdge.a, bestEdge.b, e.shiftKey);
      } else if (currentMode === 'face') {
        debug('MeshEditor: face idx=' + Math.floor(hit.faceIndex) + ' shift=' + e.shiftKey);
        selectFace(shapeId, Math.floor(hit.faceIndex), e.shiftKey);
      }
    };

    const onPointerMove = (e) => {
      if (!dragRef.current) return;

      const drag = dragRef.current;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      if (Math.abs(dx) + Math.abs(dy) > 3) {
        drag.moved = true;
      }

      // Handle exclude/include drag-to-move
      if (drag.mode && drag.moved) {
        const mesh = meshRef.current;
        const geo = geoRef.current;
        if (!mesh || !geo) return;

        const pos = geo.attributes.position;
        const orig = drag.origPositions;

        // Project mouse delta onto intersect plane
        const rect = canvas.getBoundingClientRect();
        _mouse.set(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1
        );
        _raycaster.setFromCamera(_mouse, camera);
        _raycaster.ray.intersectPlane(_intersectPlane, _intersectPoint);

        if (!_intersectPoint) return;

        // Delta from hit point to current intersection
        _delta.copy(_intersectPoint).sub(drag.hitPoint);

        if (drag.mode === 'exclude') {
          // Move ONLY selected vertices
          for (const vi of drag.selectedVerts) {
            pos.array[vi * 3] = orig[vi * 3] + _delta.x;
            pos.array[vi * 3 + 1] = orig[vi * 3 + 1] + _delta.y;
            pos.array[vi * 3 + 2] = orig[vi * 3 + 2] + _delta.z;
          }
        } else if (drag.mode === 'include') {
          // Move selected vertices at full strength + neighbors with proportional falloff
          for (const vi of drag.selectedVerts) {
            pos.array[vi * 3] = orig[vi * 3] + _delta.x;
            pos.array[vi * 3 + 1] = orig[vi * 3 + 1] + _delta.y;
            pos.array[vi * 3 + 2] = orig[vi * 3 + 2] + _delta.z;
          }
          const radius = drag.proportionalRadius;
          const center = drag.selectionCenter;
          for (const vi of drag.neighborVerts) {
            _vC.fromBufferAttribute(pos, vi);
            const dist = _vC.distanceTo(center);
            const r = dist / radius;
            const strength = applyProportionalFalloff(r);
            pos.array[vi * 3] = orig[vi * 3] + _delta.x * strength;
            pos.array[vi * 3 + 1] = orig[vi * 3 + 1] + _delta.y * strength;
            pos.array[vi * 3 + 2] = orig[vi * 3 + 2] + _delta.z * strength;
          }
        }

        pos.needsUpdate = true;
        geo.computeVertexNormals();
        geo.computeBoundingSphere();

        // Geometry is modified in place — mesh.geometry already points to it.
        // Just bump the version counter to force overlay recomputation.
        cacheGeometry(editShapeIdRef.current, geo);
      }
    };

    const onPointerUp = () => {
      if (dragRef.current?.mode && dragRef.current?.moved) {
        debug('MeshEditor: drag-to-move complete mode=' + dragRef.current.mode);
        // Persist the geometry change to the shape's _customGeometry
        const shapeId = editShapeIdRef.current;
        if (shapeId && geoRef.current) {
          geoRef.current.computeVertexNormals();
          geoRef.current.computeBoundingSphere();
          applyGeometryEdit(shapeId, geoRef.current);
        }
      }
      dragRef.current = null;
    };

    const onWheel = (e) => {
      const drag = dragRef.current;
      if (!drag || drag.mode !== 'include') return;
      // Adjust proportional radius with mouse wheel (Blender-style)
      const scale = e.deltaY > 0 ? 0.9 : 1.1;
      drag.proportionalRadius = Math.max(0.1, drag.proportionalRadius * scale);
      use3DStore.getState().setProportionalRadius(drag.proportionalRadius);
      debug('MeshEditor: proportional radius -> ' + drag.proportionalRadius.toFixed(2));
      e.preventDefault();
      e.stopPropagation();
    };

    canvas.addEventListener('pointerdown', onPointerDown, { capture: true });
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown, { capture: true });
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('wheel', onWheel);
    };
  }, [editMode, camera, gl, selectVertex, selectEdge, selectFace, clearComponentSelection, cacheGeometry, applyGeometryEdit]);

  return null;
};

export default MeshEditor;
