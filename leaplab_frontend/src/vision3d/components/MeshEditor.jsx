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
import { getDirectSelection, getConnectedVertices, applyProportionalFalloff } from './meshEditor/geometryUtils';
import { applyEditTool as applyEditToolImpl } from './meshEditor/editOperations';

const _raycaster = new THREE.Raycaster();
const _mouse = new THREE.Vector2();

// Pre-allocated objects for transforms
const _vA = new THREE.Vector3();
const _vB = new THREE.Vector3();
const _vC = new THREE.Vector3();
const _edgeMid = new THREE.Vector3();
const _faceCenter = new THREE.Vector3();
const _delta = new THREE.Vector3();
const _intersectPlane = new THREE.Plane();
const _intersectPoint = new THREE.Vector3();

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
  const selectEdges = use3DStore((s) => s.selectEdges);
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

  // Apply edit tool operation — delegates to extracted module
  const applyEditTool = useCallback((tool) => {
    applyEditToolImpl(tool, {
      geoRef, meshRef, editShapeIdRef,
      selectedFaces, selectedVertices,
      cacheGeometry, applyGeometryEdit, clearComponentSelection,
    });
  }, [selectedFaces, selectedVertices, applyGeometryEdit, clearComponentSelection]);

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

    // Track modifier keys manually — Electron can consume ctrlKey from PointerEvents
    const keys = { ctrl: false, shift: false, meta: false };
    const onKeyDown = (e) => {
      if (e.key === 'Control') keys.ctrl = true;
      if (e.key === 'Shift') keys.shift = true;
      if (e.key === 'Meta') keys.meta = true;
    };
    const onKeyUp = (e) => {
      if (e.key === 'Control') keys.ctrl = false;
      if (e.key === 'Shift') keys.shift = false;
      if (e.key === 'Meta') keys.meta = false;
    };
    const onWindowBlur = () => {
      keys.ctrl = false; keys.shift = false; keys.meta = false;
    };
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);
    window.addEventListener('blur', onWindowBlur);

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
        // Only clear selection if no modifier key is held (preserve multi-select)
        if (!e.shiftKey && !e.ctrlKey && !e.metaKey && !keys.shift && !keys.ctrl && !keys.meta) {
          debug('MeshEditor: raycast miss - clearing selection');
          clearComponentSelection();
        }
        return;
      }

      const hit = hits[0];
      const pos = geo.attributes.position;
      const face = hit.face;
      const currentMode = editModeRef.current;
      const currentTool = use3DStore.getState().editTool;

      // 1. Identify clicked component
      let clickedIdx = null;
      let clickedEdge = null;
      let clickedFaceIdx = null;
      const isMulti = keys.shift || keys.ctrl || keys.meta || e.shiftKey || e.ctrlKey || e.metaKey;

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
        clickedIdx = closestIdx;
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
        clickedEdge = bestEdge;
      } else if (currentMode === 'face') {
        clickedFaceIdx = Math.floor(hit.faceIndex);
      }

      // 2. Check if clicked component is already selected
      const sel = use3DStore.getState();
      let clickedIsSelected = false;

      if (currentMode === 'vertex' && clickedIdx !== null) {
        clickedIsSelected = sel.selectedVertices.some(v => v.index === clickedIdx);
      } else if (currentMode === 'edge' && clickedEdge !== null) {
        clickedIsSelected = sel.selectedEdges.some(e => 
          Math.min(e.a, e.b) === Math.min(clickedEdge.a, clickedEdge.b) &&
          Math.max(e.a, e.b) === Math.max(clickedEdge.a, clickedEdge.b)
        );
      } else if (currentMode === 'face' && clickedFaceIdx !== null) {
        clickedIsSelected = sel.selectedFaces.some(f => f.index === clickedFaceIdx);
      }

      // 3. If Exclude/Include active and we clicked an already selected element, drag it.
      if ((currentTool === 'exclude' || currentTool === 'include') && clickedIsSelected) {
        // Start drag-to-move: store original positions and set up plane
        let selected, neighbors;
        if (currentTool === 'exclude') {
          selected = getDirectSelection(geo, sel.selectedVertices, sel.selectedEdges, sel.selectedFaces);
          neighbors = new Set();
        } else {
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

      // 4. Otherwise, handle selection / toggle of the clicked component
      if (currentMode === 'vertex' && clickedIdx !== null) {
        debug('MeshEditor: vertex idx=' + clickedIdx + ' multi=' + isMulti);
        selectVertex(shapeId, clickedIdx, isMulti);
      } else if (currentMode === 'edge' && clickedEdge !== null) {
        debug('MeshEditor: edge a=' + clickedEdge.a + ' b=' + clickedEdge.b + ' multi=' + isMulti);
        selectEdge(shapeId, clickedEdge.a, clickedEdge.b, isMulti);
      } else if (currentMode === 'face' && clickedFaceIdx !== null) {
        debug('MeshEditor: face idx=' + clickedFaceIdx + ' multi=' + isMulti);
        selectFace(shapeId, clickedFaceIdx, isMulti);
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
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
      window.removeEventListener('blur', onWindowBlur);
    };
  }, [editMode, camera, gl, selectVertex, selectEdge, selectFace, clearComponentSelection, cacheGeometry, applyGeometryEdit]);

  return null;
};

export default MeshEditor;
