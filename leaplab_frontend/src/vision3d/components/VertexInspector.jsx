/**
 * Vision3D - Vertex Inspector Component
 * Shows detailed information about selected vertices in edit mode.
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { use3DStore } from '../store/use3DStore';

const _vA = new THREE.Vector3();
const _vB = new THREE.Vector3();

/**
 * Extract all edges from geometry
 */
function extractAllEdges(geometry) {
  const pos = geometry.attributes.position;
  const index = geometry.index;
  const edgeSet = new Set();
  const edges = [];

  const addEdge = (a, b) => {
    const key = Math.min(a, b) + '-' + Math.max(a, b);
    if (!edgeSet.has(key)) {
      edgeSet.add(key);
      edges.push({ a: Math.min(a, b), b: Math.max(a, b) });
    }
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

  return edges;
}

/**
 * Extract all faces from geometry
 */
function extractAllFaces(geometry) {
  const index = geometry.index;
  const faces = [];

  if (index) {
    for (let i = 0; i < index.count; i += 3) {
      faces.push({
        a: index.getX(i),
        b: index.getX(i + 1),
        c: index.getX(i + 2),
      });
    }
  } else {
    for (let i = 0; i < geometry.attributes.position.count; i += 3) {
      faces.push({ a: i, b: i + 1, c: i + 2 });
    }
  }

  return faces;
}

/**
 * Find connected edges and faces for a vertex
 */
function findConnectedComponents(vertexIdx, edges, faces) {
  const connectedEdges = edges.filter(e => e.a === vertexIdx || e.b === vertexIdx);
  const connectedFaces = faces.filter(f => f.a === vertexIdx || f.b === vertexIdx || f.c === vertexIdx);
  return { connectedEdges, connectedFaces };
}

/**
 * Calculate vertex normal (average of connected face normals)
 */
function calculateVertexNormal(vertexIdx, geometry, faces) {
  const pos = geometry.attributes.position;
  const normal = new THREE.Vector3();

  for (const face of faces) {
    if (face.a !== vertexIdx && face.b !== vertexIdx && face.c !== vertexIdx) continue;

    _vA.fromBufferAttribute(pos, face.a);
    _vB.fromBufferAttribute(pos, face.b);
    const edge1 = _vB.clone().sub(_vA);

    _vB.fromBufferAttribute(pos, face.c);
    const edge2 = _vB.clone().sub(_vA);

    const faceNormal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();
    normal.add(faceNormal);
  }

  return normal.normalize();
}

export const VertexInspector = () => {
  const editMode = use3DStore((s) => s.editMode);
  const editShapeId = use3DStore((s) => s.editShapeId);
  const selectedVertices = use3DStore((s) => s.selectedVertices);
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

  // Compute vertex data for selected vertices
  const vertexData = useMemo(() => {
    if (!geo || editMode !== 'vertex' || selectedVertices.length === 0) return null;

    const allEdges = extractAllEdges(geo);
    const allFaces = extractAllFaces(geo);
    const pos = geo.attributes.position;
    const results = [];

    for (const vert of selectedVertices) {
      if (vert.shapeId !== editShapeId) continue;

      const vertex = new THREE.Vector3().fromBufferAttribute(pos, vert.index).applyMatrix4(worldMatrix);
      const normal = calculateVertexNormal(vert.index, geo, allFaces);
      const { connectedEdges, connectedFaces } = findConnectedComponents(vert.index, allEdges, allFaces);

      // Calculate edge lengths
      const edgeLengths = connectedEdges.map(edge => {
        _vA.fromBufferAttribute(pos, edge.a).applyMatrix4(worldMatrix);
        _vB.fromBufferAttribute(pos, edge.b).applyMatrix4(worldMatrix);
        return _vA.distanceTo(_vB);
      });

      // Calculate average edge length
      const avgEdgeLength = edgeLengths.length > 0
        ? edgeLengths.reduce((sum, l) => sum + l, 0) / edgeLengths.length
        : 0;

      results.push({
        index: vert.index,
        position: vertex.toArray(),
        normal: normal.toArray(),
        connectedEdges: connectedEdges.length,
        connectedFaces: connectedFaces.length,
        edgeLengths,
        avgEdgeLength,
        isBoundary: connectedFaces.length < 2,
        isCorner: connectedEdges.length <= 2,
        isInterior: connectedEdges.length > 2,
      });
    }

    return results;
  }, [geo, editMode, selectedVertices, editShapeId, worldMatrix]);

  if (editMode !== 'vertex' || !vertexData || vertexData.length === 0) {
    return null;
  }

  return (
    <div className="vertex-inspector">
      <div className="vertex-inspector-header">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"/>
        </svg>
        <span>Vertex Inspector</span>
        <span className="vertex-count">{vertexData.length} selected</span>
      </div>

      <div className="vertex-inspector-content">
        {vertexData.map((data, idx) => (
          <div key={idx} className="vertex-data-card">
            <div className="vertex-data-header">
              <span className="vertex-index">Vertex #{data.index}</span>
              <span className={`vertex-type ${data.isBoundary ? 'boundary' : data.isCorner ? 'corner' : 'interior'}`}>
                {data.isBoundary ? 'Boundary' : data.isCorner ? 'Corner' : 'Interior'}
              </span>
            </div>

            {/* Position */}
            <div className="vertex-property">
              <label>Position</label>
              <div className="vertex-value-coords">
                <span className="coord x">X: {data.position[0].toFixed(4)}</span>
                <span className="coord y">Y: {data.position[1].toFixed(4)}</span>
                <span className="coord z">Z: {data.position[2].toFixed(4)}</span>
              </div>
            </div>

            {/* Normal */}
            <div className="vertex-property">
              <label>Normal</label>
              <div className="vertex-value-coords">
                <span className="coord x">X: {data.normal[0].toFixed(4)}</span>
                <span className="coord y">Y: {data.normal[1].toFixed(4)}</span>
                <span className="coord z">Z: {data.normal[2].toFixed(4)}</span>
              </div>
            </div>

            {/* Connected Edges */}
            <div className="vertex-property">
              <label>Connected Edges</label>
              <span className="vertex-value">{data.connectedEdges}</span>
            </div>

            {/* Connected Faces */}
            <div className="vertex-property">
              <label>Connected Faces</label>
              <span className="vertex-value">{data.connectedFaces}</span>
            </div>

            {/* Average Edge Length */}
            {data.avgEdgeLength > 0 && (
              <div className="vertex-property">
                <label>Avg Edge Length</label>
                <span className="vertex-value">{data.avgEdgeLength.toFixed(4)}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VertexInspector;
