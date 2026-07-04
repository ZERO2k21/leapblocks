/**
 * MeshEditor.jsx — Blender-like vertex/edge/face editing
 * Handles raycasting, selection, and transform of mesh components.
 */
import { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { use3DStore } from '../store/use3DStore';

const _raycaster = new THREE.Raycaster();
const _mouse = new THREE.Vector2();
const _plane = new THREE.Plane();
const _intersectPoint = new THREE.Vector3();
const _camDir = new THREE.Vector3();

// Pre-allocated objects for transforms
const _vA = new THREE.Vector3();
const _vB = new THREE.Vector3();
const _vC = new THREE.Vector3();
const _edgeMid = new THREE.Vector3();
const _faceCenter = new THREE.Vector3();
const _normal = new THREE.Vector3();

/**
 * Extract unique edges from indexed geometry.
 * Returns array of { a, b } where a < b (vertex indices).
 */
function extractEdges(geometry) {
  const pos = geometry.attributes.position;
  const index = geometry.index;
  const edgeSet = new Set();
  const edges = [];

  if (index) {
    for (let i = 0; i < index.count; i += 3) {
      const tri = [index.getX(i), index.getX(i + 1), index.getX(i + 2)];
      for (let j = 0; j < 3; j++) {
        const a = tri[j];
        const b = tri[(j + 1) % 3];
        const key = Math.min(a, b) + '-' + Math.max(a, b);
        if (!edgeSet.has(key)) {
          edgeSet.add(key);
          edges.push({ a: Math.min(a, b), b: Math.max(a, b) });
        }
      }
    }
  } else {
    for (let i = 0; i < pos.count; i += 3) {
      const tri = [i, i + 1, i + 2];
      for (let j = 0; j < 3; j++) {
        const a = tri[j];
        const b = tri[(j + 1) % 3];
        const key = Math.min(a, b) + '-' + Math.max(a, b);
        if (!edgeSet.has(key)) {
          edgeSet.add(key);
          edges.push({ a: Math.min(a, b), b: Math.max(a, b) });
        }
      }
    }
  }
  return edges;
}

/**
 * Extract face centers and normals from geometry.
 */
function extractFaces(geometry) {
  const pos = geometry.attributes.position;
  const index = geometry.index;
  const faces = [];

  const addFace = (a, b, c) => {
    _vA.fromBufferAttribute(pos, a);
    _vB.fromBufferAttribute(pos, b);
    _vC.fromBufferAttribute(pos, c);
    _faceCenter.copy(_vA).add(_vB).add(_vC).divideScalar(3);
    _normal.crossVectors(_vB.sub(_vA), _vC.sub(_vA)).normalize();
    faces.push({
      index: faces.length,
      center: _faceCenter.clone(),
      normal: _normal.clone(),
      verts: [a, b, c],
    });
  };

  if (index) {
    for (let i = 0; i < index.count; i += 3) {
      addFace(index.getX(i), index.getX(i + 1), index.getX(i + 2));
    }
  } else {
    for (let i = 0; i < pos.count; i += 3) {
      addFace(i, i + 1, i + 2);
    }
  }
  return faces;
}

/**
 * MeshEditor — active only in vertex/edge/face edit modes.
 * Listens to pointer events on the canvas for selection and transform.
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
  const geometryCache = use3DStore((s) => s.geometryCache);
  const applyGeometryEdit = use3DStore((s) => s.applyGeometryEdit);
  const shapes = use3DStore((s) => s.shapes);
  const { camera, gl, scene } = useThree();

  const dragRef = useRef(null);
  const edgesRef = useRef([]);
  const facesRef = useRef([]);
  const meshRef = useRef(null);

  // Find the target mesh and cache its geometry
  const getTargetMesh = useCallback(() => {
    if (!editShapeId) return null;
    let found = null;
    scene?.traverse?.((child) => {
      if (child.isMesh && child.userData.shapeId === editShapeId) {
        found = child;
      }
    });
    return found;
  }, [editShapeId, scene]);

  // Cache geometry when entering edit mode or shape changes
  useEffect(() => {
    if (editMode === 'object' || !editShapeId) return;
    const mesh = getTargetMesh();
    if (!mesh) return;

    meshRef.current = mesh;
    const geo = mesh.geometry.clone();
    cacheGeometry(editShapeId, geo);

    edgesRef.current = extractEdges(geo);
    facesRef.current = extractFaces(geo);
  }, [editMode, editShapeId, getTargetMesh, cacheGeometry]);

  // Get the live geometry (cached or from mesh)
  const getGeometry = useCallback(() => {
    if (geometryCache[editShapeId]) return geometryCache[editShapeId];
    const mesh = getTargetMesh();
    return mesh?.geometry || null;
  }, [editShapeId, geometryCache, getTargetMesh]);

  // Raycast to find nearest component
  const raycastComponent = useCallback((clientX, clientY) => {
    const mesh = getTargetMesh();
    if (!mesh) return null;

    const rect = gl.domElement.getBoundingClientRect();
    _mouse.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    _raycaster.setFromCamera(_mouse, camera);
    const hits = _raycaster.intersectObject(mesh, false);
    if (hits.length === 0) return null;

    const hit = hits[0];
    const geo = getGeometry();
    if (!geo) return null;

    const pos = geo.attributes.position;
    const face = hit.face;

    if (editMode === 'vertex') {
      // Find the closest vertex to the hit point
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
      return { type: 'vertex', index: closestIdx };
    }

    if (editMode === 'edge') {
      // Find the closest edge to the hit point
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
      return { type: 'edge', a: Math.min(bestEdge.a, bestEdge.b), b: Math.max(bestEdge.a, bestEdge.b) };
    }

    if (editMode === 'face') {
      // Determine which face was hit using face index
      const index = geo.index;
      let faceIdx;
      if (index) {
        faceIdx = Math.floor(hit.faceIndex);
      } else {
        faceIdx = Math.floor(hit.faceIndex);
      }
      return { type: 'face', index: faceIdx };
    }

    return null;
  }, [editMode, getTargetMesh, getGeometry, camera, gl]);

  // Apply edit tool operation
  const applyEditTool = useCallback((tool) => {
    const geo = getGeometry();
    if (!geo || !editShapeId) return;

    const mesh = getTargetMesh();
    if (!mesh) return;

    if (tool === 'extrude' && selectedFaces.length > 0) {
      // Extrude: duplicate face vertices and push along normal
      const newGeo = geo.clone();
      const pos = newGeo.attributes.position;
      const idx = newGeo.index;

      for (const sel of selectedFaces) {
        if (sel.shapeId !== editShapeId) continue;
        const faceIdx = sel.index;

        // Get face vertices
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

        // Compute face normal
        _vA.fromBufferAttribute(pos, a);
        _vB.fromBufferAttribute(pos, b);
        _vC.fromBufferAttribute(pos, c);
        _normal.crossVectors(_vB.sub(_vA), _vC.sub(_vA)).normalize();

        // Duplicate vertices
        const newCount = pos.count;
        const arr = pos.array;
        // Add 3 new vertices (copy of face)
        const newArr = new Float32Array(arr.length + 9);
        newArr.set(arr);
        newArr[arr.length] = arr[a * 3]; newArr[arr.length + 1] = arr[a * 3 + 1]; newArr[arr.length + 2] = arr[a * 3 + 2];
        newArr[arr.length + 3] = arr[b * 3]; newArr[arr.length + 4] = arr[b * 3 + 1]; newArr[arr.length + 5] = arr[b * 3 + 2];
        newArr[arr.length + 6] = arr[c * 3]; newArr[arr.length + 7] = arr[c * 3 + 1]; newArr[arr.length + 8] = arr[c * 3 + 2];

        pos.array = newArr;
        pos.count = pos.count + 3;
        pos.needsUpdate = true;

        // Push original face along normal by 1 unit
        const extrudeDist = 1.0;
        for (const vi of [a, b, c]) {
          pos.array[vi * 3] += _normal.x * extrudeDist;
          pos.array[vi * 3 + 1] += _normal.y * extrudeDist;
          pos.array[vi * 3 + 2] += _normal.z * extrudeDist;
        }

        // Update index to connect new face
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
      applyGeometryEdit(editShapeId, newGeo);
    }

    if (tool === 'bevel' && selectedEdges.length > 0) {
      // Bevel: split each selected edge into two, pushing vertices apart
      const newGeo = geo.clone();
      const pos = newGeo.attributes.position;

      for (const sel of selectedEdges) {
        if (sel.shapeId !== editShapeId) continue;
        const { a, b } = sel;

        _vA.fromBufferAttribute(pos, a);
        _vB.fromBufferAttribute(pos, b);
        _edgeMid.copy(_vA).add(_vB).multiplyScalar(0.5);

        // Push both vertices slightly toward midpoint (flatten the edge)
        const bevelAmount = 0.3;
        _vA.lerp(_edgeMid, bevelAmount);
        _vB.lerp(_edgeMid, bevelAmount);

        pos.array[a * 3] = _vA.x; pos.array[a * 3 + 1] = _vA.y; pos.array[a * 3 + 2] = _vA.z;
        pos.array[b * 3] = _vB.x; pos.array[b * 3 + 1] = _vB.y; pos.array[b * 3 + 2] = _vB.z;
      }

      pos.needsUpdate = true;
      newGeo.computeVertexNormals();
      applyGeometryEdit(editShapeId, newGeo);
    }

    if (tool === 'inset' && selectedFaces.length > 0) {
      // Inset: shrink selected faces toward their center
      const newGeo = geo.clone();
      const pos = newGeo.attributes.position;

      for (const sel of selectedFaces) {
        if (sel.shapeId !== editShapeId) continue;
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
      applyGeometryEdit(editShapeId, newGeo);
    }

    if (tool === 'merge' && selectedVertices.length >= 2) {
      // Merge: collapse selected vertices to their average position
      const newGeo = geo.clone();
      const pos = newGeo.attributes.position;

      // Compute average position
      _faceCenter.set(0, 0, 0);
      let count = 0;
      for (const sel of selectedVertices) {
        if (sel.shapeId !== editShapeId) continue;
        _vA.fromBufferAttribute(pos, sel.index);
        _faceCenter.add(_vA);
        count++;
      }
      if (count > 0) _faceCenter.divideScalar(count);

      // Move all selected vertices to average
      for (const sel of selectedVertices) {
        if (sel.shapeId !== editShapeId) continue;
        pos.array[sel.index * 3] = _faceCenter.x;
        pos.array[sel.index * 3 + 1] = _faceCenter.y;
        pos.array[sel.index * 3 + 2] = _faceCenter.z;
      }

      pos.needsUpdate = true;
      newGeo.computeVertexNormals();
      applyGeometryEdit(editShapeId, newGeo);
      clearComponentSelection();
    }
  }, [editShapeId, selectedFaces, selectedEdges, selectedVertices, getGeometry, getTargetMesh, applyGeometryEdit, clearComponentSelection]);

  // Apply tool when editTool changes
  useEffect(() => {
    if (editTool) {
      applyEditTool(editTool);
    }
  }, [editTool, applyEditTool]);

  // Pointer event handlers
  useEffect(() => {
    if (editMode === 'object') return;

    const canvas = gl.domElement;

    const onPointerDown = (e) => {
      if (e.button !== 0) return; // left click only
      if (window.__gizmoActive) return;

      const result = raycastComponent(e.clientX, e.clientY);
      if (!result) {
        clearComponentSelection();
        return;
      }

      const ctrl = e.ctrlKey || e.metaKey;

      if (result.type === 'vertex') {
        selectVertex(editShapeId, result.index, ctrl);
      } else if (result.type === 'edge') {
        selectEdge(editShapeId, result.a, result.b, ctrl);
      } else if (result.type === 'face') {
        selectFace(editShapeId, result.index, ctrl);
      }

      // Start drag for move
      const mesh = getTargetMesh();
      if (!mesh) return;

      _raycaster.setFromCamera(
        new THREE.Vector2(
          ((e.clientX - canvas.getBoundingClientRect().left) / canvas.getBoundingClientRect().width) * 2 - 1,
          -((e.clientY - canvas.getBoundingClientRect().top) / canvas.getBoundingClientRect().height) * 2 + 1
        ),
        camera
      );

      // Get the drag plane (perpendicular to camera, through hit point)
      camera.getWorldDirection(_camDir);
      _plane.setFromNormalAndCoplanarPoint(_camDir, hit_point_ref.current || mesh.position);

      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        moved: false,
      };
    };

    const onPointerMove = (e) => {
      if (!dragRef.current) return;

      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      if (Math.abs(dx) + Math.abs(dy) > 3) {
        dragRef.current.moved = true;
      }
    };

    const onPointerUp = (e) => {
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
  }, [editMode, editShapeId, camera, gl, raycastComponent, selectVertex, selectEdge, selectFace, clearComponentSelection, getTargetMesh]);

  return null; // This component only handles events, no visual output
};

// Ref to store the hit point for drag plane
const hit_point_ref = { current: null };

export default MeshEditor;
