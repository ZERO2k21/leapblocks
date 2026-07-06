/**
 * MeshEditOverlay.jsx — Visual overlay for vertex/edge/face selection
 * Renders highlighted vertices, edges, and faces on top of the edited mesh.
 * Vertices are transformed to world space using the shape's transform.
 */
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { use3DStore } from '../store/use3DStore';

const VERTEX_COLOR = '#3b82f6';   // Vibrant Blue
const EDGE_COLOR = '#2563eb';     // Deep Royal Blue
const FACE_COLOR = '#3b82f6';     // Blue (rendered with opacity overlay)

const _v = new THREE.Vector3();

export const MeshEditOverlay = () => {
  const editMode = use3DStore((s) => s.editMode);
  const editShapeId = use3DStore((s) => s.editShapeId);
  const selectedVertices = use3DStore((s) => s.selectedVertices);
  const selectedEdges = use3DStore((s) => s.selectedEdges);
  const selectedFaces = use3DStore((s) => s.selectedFaces);
  const geometryCache = use3DStore((s) => s.geometryCache);
  const geometryVersion = use3DStore((s) => s.geometryVersion);
  const shapes = use3DStore((s) => s.shapes);

  const geo = geometryCache[editShapeId] || null;
  const shape = shapes.find(s => s.id === editShapeId);

  // Compute world matrix for the edited shape
  const worldMatrix = useMemo(() => {
    if (!shape) return new THREE.Matrix4();
    const m = new THREE.Matrix4();
    const pos = shape.position || [0, 0, 0];
    const rot = shape.rotation || [0, 0, 0];
    const scl = shape.scale || [1, 1, 1];
    m.compose(
      new THREE.Vector3(pos[0], pos[1], pos[2]),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(rot[0], rot[1], rot[2])),
      new THREE.Vector3(scl[0], scl[1], scl[2])
    );
    return m;
  }, [shape, geometryVersion]);

  // Helper: transform local position to world space
  const toWorld = (x, y, z) => {
    _v.set(x, y, z).applyMatrix4(worldMatrix);
    return [_v.x, _v.y, _v.z];
  };

  // All vertex dots (small, semi-transparent) when in vertex mode
  const allVertexPositions = useMemo(() => {
    if (!geo || editMode !== 'vertex') return null;
    const pos = geo.attributes.position;
    const positions = [];
    const count = Math.min(pos.count, 500);
    for (let i = 0; i < count; i++) {
      const [wx, wy, wz] = toWorld(pos.getX(i), pos.getY(i), pos.getZ(i));
      positions.push(wx, wy, wz);
    }
    return positions.length > 0 ? new Float32Array(positions) : null;
  }, [geo, editMode, worldMatrix, geometryVersion]);

  // Selected vertex positions (world space)
  const vertexPositions = useMemo(() => {
    if (!geo || selectedVertices.length === 0) return null;
    const pos = geo.attributes.position;
    const positions = [];
    for (const v of selectedVertices) {
      if (v.shapeId !== editShapeId) continue;
      const [wx, wy, wz] = toWorld(pos.getX(v.index), pos.getY(v.index), pos.getZ(v.index));
      positions.push(wx, wy, wz);
    }
    return positions.length > 0 ? new Float32Array(positions) : null;
  }, [geo, selectedVertices, editShapeId, worldMatrix, geometryVersion]);

  // Selected edge line segments (world space)
  const edgePositions = useMemo(() => {
    if (!geo || selectedEdges.length === 0) return null;
    const pos = geo.attributes.position;
    const positions = [];
    for (const e of selectedEdges) {
      if (e.shapeId !== editShapeId) continue;
      const [ax, ay, az] = toWorld(pos.getX(e.a), pos.getY(e.a), pos.getZ(e.a));
      const [bx, by, bz] = toWorld(pos.getX(e.b), pos.getY(e.b), pos.getZ(e.b));
      positions.push(ax, ay, az, bx, by, bz);
    }
    return positions.length > 0 ? new Float32Array(positions) : null;
  }, [geo, selectedEdges, editShapeId, worldMatrix, geometryVersion]);

  // Selected face positions (world space) — render as filled quads where possible
  const facePositions = useMemo(() => {
    if (!geo || selectedFaces.length === 0) return null;
    const pos = geo.attributes.position;
    const index = geo.index;
    const positions = [];

    for (const f of selectedFaces) {
      if (f.shapeId !== editShapeId) continue;
      let a, b, c;
      if (index) {
        a = index.getX(f.index * 3);
        b = index.getX(f.index * 3 + 1);
        c = index.getX(f.index * 3 + 2);
      } else {
        a = f.index * 3;
        b = f.index * 3 + 1;
        c = f.index * 3 + 2;
      }
      const [ax, ay, az] = toWorld(pos.getX(a), pos.getY(a), pos.getZ(a));
      const [bx, by, bz] = toWorld(pos.getX(b), pos.getY(b), pos.getZ(b));
      const [cx, cy, cz] = toWorld(pos.getX(c), pos.getY(c), pos.getZ(c));
      positions.push(ax, ay, az, bx, by, bz, cx, cy, cz);
    }
    return positions.length > 0 ? new Float32Array(positions) : null;
  }, [geo, editMode, selectedFaces, editShapeId, worldMatrix, geometryVersion]);

  // All edge wireframe (subtle, shown in all edit modes)
  const wireframePositions = useMemo(() => {
    if (!geo || editMode === 'object') return null;
    const pos = geo.attributes.position;
    const index = geo.index;
    const edgeSet = new Set();
    const positions = [];

    const addEdge = (a, b) => {
      const key = Math.min(a, b) + '-' + Math.max(a, b);
      if (edgeSet.has(key)) return;
      edgeSet.add(key);
      const [ax, ay, az] = toWorld(pos.getX(a), pos.getY(a), pos.getZ(a));
      const [bx, by, bz] = toWorld(pos.getX(b), pos.getY(b), pos.getZ(b));
      positions.push(ax, ay, az, bx, by, bz);
    };

    if (index) {
      for (let i = 0; i < index.count; i += 3) {
        addEdge(index.getX(i), index.getX(i + 1));
        addEdge(index.getX(i + 1), index.getX(i + 2));
        addEdge(index.getX(i + 2), index.getX(i));
      }
    } else {
      for (let i = 0; i < pos.count; i += 3) {
        addEdge(i, i + 1);
        addEdge(i + 1, i + 2);
        addEdge(i + 2, i);
      }
    }

    return positions.length > 0 ? new Float32Array(positions) : null;
  }, [geo, editMode, worldMatrix, geometryVersion]);

  if (editMode === 'object' || !editShapeId) return null;

  return (
    <group>
      {/* Wireframe overlay — subtle edges in all edit modes */}
      {wireframePositions && (
        <lineSegments key={`wire-${geometryVersion}`}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={wireframePositions.length / 3}
              array={wireframePositions}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#64748b" linewidth={1} depthTest={false} transparent opacity={0.4} />
        </lineSegments>
      )}

      {/* All vertices (small dots) in vertex mode */}
      {allVertexPositions && (
        <points key={`allv-${geometryVersion}`}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={allVertexPositions.length / 3}
              array={allVertexPositions}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.04}
            color="#94a3b8"
            depthTest={false}
            transparent
            opacity={0.5}
            sizeAttenuation={false}
          />
        </points>
      )}

      {/* Selected vertices (larger, bright cyan) */}
      {vertexPositions && (
        <points key={`vsel-${geometryVersion}`}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={vertexPositions.length / 3}
              array={vertexPositions}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.12}
            color={VERTEX_COLOR}
            depthTest={false}
            transparent
            opacity={1}
            sizeAttenuation={false}
          />
        </points>
      )}

      {/* Selected edges (thick amber lines) */}
      {edgePositions && (
        <lineSegments key={`esel-${geometryVersion}`}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={edgePositions.length / 3}
              array={edgePositions}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color={EDGE_COLOR} linewidth={3} depthTest={false} transparent opacity={0.95} />
        </lineSegments>
      )}

      {/* Selected faces (semi-transparent purple overlay) */}
      {facePositions && (
        <mesh key={`fsel-${geometryVersion}`}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={facePositions.length / 3}
              array={facePositions}
              itemSize={3}
            />
          </bufferGeometry>
          <meshBasicMaterial
            color={FACE_COLOR}
            depthTest={false}
            transparent
            opacity={0.35}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
};

export default MeshEditOverlay;
