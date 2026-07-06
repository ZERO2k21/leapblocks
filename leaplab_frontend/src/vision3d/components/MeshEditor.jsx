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
    const geo = found.geometry.clone();
    geoRef.current = geo;
    cacheGeometry(editShapeId, geo);

    debug('MeshEditor: cached geometry for ' + editShapeId + ' verts=' + geo.attributes.position.count);
  }, [editMode, editShapeId, scene, cacheGeometry]);

  // Apply edit tool operation
  const applyEditTool = useCallback((tool) => {
    const geo = geoRef.current;
    const mesh = meshRef.current;
    if (!geo || !mesh || !editShapeIdRef.current) return;
    const shapeId = editShapeIdRef.current;

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

      newGeo.computeVertexNormals();
      applyGeometryEdit(shapeId, newGeo);
    }

    if (tool === 'bevel' && selectedEdges.length > 0) {
      const newGeo = geo.clone();
      const pos = newGeo.attributes.position;

      for (const sel of selectedEdges) {
        if (sel.shapeId !== shapeId) continue;
        const { a, b } = sel;

        _vA.fromBufferAttribute(pos, a);
        _vB.fromBufferAttribute(pos, b);
        _edgeMid.copy(_vA).add(_vB).multiplyScalar(0.5);

        const bevelAmount = 0.3;
        _vA.lerp(_edgeMid, bevelAmount);
        _vB.lerp(_edgeMid, bevelAmount);

        pos.array[a * 3] = _vA.x; pos.array[a * 3 + 1] = _vA.y; pos.array[a * 3 + 2] = _vA.z;
        pos.array[b * 3] = _vB.x; pos.array[b * 3 + 1] = _vB.y; pos.array[b * 3 + 2] = _vB.z;
      }

      pos.needsUpdate = true;
      newGeo.computeVertexNormals();
      applyGeometryEdit(shapeId, newGeo);
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

      pos.needsUpdate = true;
      newGeo.computeVertexNormals();
      applyGeometryEdit(shapeId, newGeo);
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

      pos.needsUpdate = true;
      newGeo.computeVertexNormals();
      applyGeometryEdit(shapeId, newGeo);
      clearComponentSelection();
    }
  }, [selectedFaces, selectedEdges, selectedVertices, applyGeometryEdit, clearComponentSelection]);

  // Apply tool when editTool changes
  useEffect(() => {
    if (editTool) {
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
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      if (Math.abs(dx) + Math.abs(dy) > 3) {
        dragRef.current.moved = true;
      }
    };

    const onPointerUp = () => {
      dragRef.current = null;
    };

    canvas.addEventListener('pointerdown', onPointerDown, { capture: true });
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown, { capture: true });
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [editMode, camera, gl, selectVertex, selectEdge, selectFace, clearComponentSelection]);

  return null;
};

export default MeshEditor;
