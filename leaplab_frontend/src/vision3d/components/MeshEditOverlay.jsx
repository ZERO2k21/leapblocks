/**
 * MeshEditOverlay.jsx — Visual overlay for vertex/edge/face selection
 * Renders highlighted vertices, edges, and faces on top of the edited mesh.
 */
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { use3DStore } from '../store/use3DStore';

const VERTEX_COLOR = '#22d3ee';   // cyan
const EDGE_COLOR = '#f59e0b';     // amber
const FACE_COLOR = '#a855f7';     // purple
const HOVER_COLOR = '#ffffff';    // white

const vertexGeo = new THREE.SphereGeometry(0.06, 8, 8);
const edgeGeo = new THREE.BufferGeometry();
const faceVertexGeo = new THREE.BufferGeometry();

const vertexMat = new THREE.MeshBasicMaterial({ color: VERTEX_COLOR, depthTest: false, transparent: true, opacity: 0.95 });
const edgeMat = new THREE.LineBasicMaterial({ color: EDGE_COLOR, linewidth: 2, depthTest: false, transparent: true, opacity: 0.9 });

export const MeshEditOverlay = () => {
  const editMode = use3DStore((s) => s.editMode);
  const editShapeId = use3DStore((s) => s.editShapeId);
  const selectedVertices = use3DStore((s) => s.selectedVertices);
  const selectedEdges = use3DStore((s) => s.selectedEdges);
  const selectedFaces = use3DStore((s) => s.selectedFaces);
  const geometryCache = use3DStore((s) => s.geometryCache);
  const shapes = use3DStore((s) => s.shapes);

  const geo = geometryCache[editShapeId] || null;
  const shape = shapes.find(s => s.id === editShapeId);

  // Compute world matrix for the edited shape
  const worldMatrix = useMemo(() => {
    if (!shape) return new THREE.Matrix4();
    const m = new THREE.Matrix4();
    m.compose(
      new THREE.Vector3(...(shape.position || [0, 0, 0])),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...(shape.rotation || [0, 0, 0]))),
      new THREE.Vector3(...(shape.scale || [1, 1, 1]))
    );
    return m;
  }, [shape?.position, shape?.rotation, shape?.scale]);

  // Vertex positions for selected vertices
  const vertexPositions = useMemo(() => {
    if (!geo || editMode !== 'vertex' || selectedVertices.length === 0) return null;
    const pos = geo.attributes.position;
    const positions = [];
    for (const v of selectedVertices) {
      if (v.shapeId !== editShapeId) continue;
      const x = pos.getX(v.index);
      const y = pos.getY(v.index);
      const z = pos.getZ(v.index);
      positions.push(x, y, z);
    }
    return positions.length > 0 ? new Float32Array(positions) : null;
  }, [geo, editMode, selectedVertices, editShapeId]);

  // Edge line segments for selected edges
  const edgePositions = useMemo(() => {
    if (!geo || editMode !== 'edge' || selectedEdges.length === 0) return null;
    const pos = geo.attributes.position;
    const positions = [];
    for (const e of selectedEdges) {
      if (e.shapeId !== editShapeId) continue;
      positions.push(pos.getX(e.a), pos.getY(e.a), pos.getZ(e.a));
      positions.push(pos.getX(e.b), pos.getY(e.b), pos.getZ(e.b));
    }
    return positions.length > 0 ? new Float32Array(positions) : null;
  }, [geo, editMode, selectedEdges, editShapeId]);

  // Face triangle positions for selected faces
  const facePositions = useMemo(() => {
    if (!geo || editMode !== 'face' || selectedFaces.length === 0) return null;
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
      positions.push(
        pos.getX(a), pos.getY(a), pos.getZ(a),
        pos.getX(b), pos.getY(b), pos.getZ(b),
        pos.getX(c), pos.getY(c), pos.getZ(c),
      );
    }
    return positions.length > 0 ? new Float32Array(positions) : null;
  }, [geo, editMode, selectedFaces, editShapeId]);

  // All vertex dots (small, semi-transparent) when in vertex mode
  const allVertexPositions = useMemo(() => {
    if (!geo || editMode !== 'vertex') return null;
    const pos = geo.attributes.position;
    const positions = [];
    // Limit to first 500 vertices for performance
    const count = Math.min(pos.count, 500);
    for (let i = 0; i < count; i++) {
      positions.push(pos.getX(i), pos.getY(i), pos.getZ(i));
    }
    return positions.length > 0 ? new Float32Array(positions) : null;
  }, [geo, editMode]);

  if (editMode === 'object' || !editShapeId) return null;

  return (
    <group matrixWorld={worldMatrix} matrixAutoUpdate={false}>
      {/* All vertices (small dots) in vertex mode */}
      {allVertexPositions && (
        <points>
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

      {/* Selected vertices (larger, bright) */}
      {vertexPositions && (
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={vertexPositions.length / 3}
              array={vertexPositions}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.1}
            color={VERTEX_COLOR}
            depthTest={false}
            transparent
            opacity={1}
            sizeAttenuation={false}
          />
        </points>
      )}

      {/* Selected edges */}
      {edgePositions && (
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={edgePositions.length / 3}
              array={edgePositions}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color={EDGE_COLOR} linewidth={2} depthTest={false} transparent opacity={0.9} />
        </lineSegments>
      )}

      {/* Selected faces (semi-transparent purple overlay) */}
      {facePositions && (
        <mesh>
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
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
};

export default MeshEditOverlay;
