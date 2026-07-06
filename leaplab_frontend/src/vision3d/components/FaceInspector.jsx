/**
 * Vision3D - Face Inspector Component
 * Shows detailed information about selected faces in edit mode.
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { use3DStore } from '../store/use3DStore';

const _vA = new THREE.Vector3();
const _vB = new THREE.Vector3();
const _vC = new THREE.Vector3();
const _edge1 = new THREE.Vector3();
const _edge2 = new THREE.Vector3();

/**
 * Calculate face area using cross product
 */
function calculateFaceArea(pos, a, b, c) {
  _vA.fromBufferAttribute(pos, a);
  _vB.fromBufferAttribute(pos, b);
  _vC.fromBufferAttribute(pos, c);

  _edge1.copy(_vB).sub(_vA);
  _edge2.copy(_vC).sub(_vA);

  return _edge1.cross(_edge2).length() * 0.5;
}

/**
 * Calculate face normal
 */
function calculateFaceNormal(pos, a, b, c) {
  _vA.fromBufferAttribute(pos, a);
  _vB.fromBufferAttribute(pos, b);
  _vC.fromBufferAttribute(pos, c);

  _edge1.copy(_vB).sub(_vA);
  _edge2.copy(_vC).sub(_vA);

  return _edge1.cross(_edge2).normalize();
}

/**
 * Calculate face perimeter
 */
function calculateFacePerimeter(pos, a, b, c) {
  _vA.fromBufferAttribute(pos, a);
  _vB.fromBufferAttribute(pos, b);
  _vC.fromBufferAttribute(pos, c);

  return _vA.distanceTo(_vB) + _vB.distanceTo(_vC) + _vC.distanceTo(_vA);
}

/**
 * Calculate angle between two edges at a vertex
 */
function calculateEdgeAngle(pos, vertex, other1, other2) {
  _vA.fromBufferAttribute(pos, vertex);
  _vB.fromBufferAttribute(pos, other1);
  _vC.fromBufferAttribute(pos, other2);

  const dir1 = _vB.clone().sub(_vA).normalize();
  const dir2 = _vC.clone().sub(_vA).normalize();

  const dot = dir1.dot(dir2);
  return Math.acos(Math.max(-1, Math.min(1, dot))) * (180 / Math.PI);
}

/**
 * Extract all faces from geometry
 */
function extractAllFaces(geometry) {
  const pos = geometry.attributes.position;
  const index = geometry.index;
  const faces = [];

  if (index) {
    for (let i = 0; i < index.count; i += 3) {
      faces.push({
        index: faces.length,
        a: index.getX(i),
        b: index.getX(i + 1),
        c: index.getX(i + 2),
      });
    }
  } else {
    for (let i = 0; i < pos.count; i += 3) {
      faces.push({
        index: faces.length,
        a: i,
        b: i + 1,
        c: i + 2,
      });
    }
  }

  return faces;
}

/**
 * Find adjacent faces (sharing an edge)
 */
function findAdjacentFaces(face, allFaces) {
  const adjacent = [];

  // Get edges of current face
  const edges = [
    Math.min(face.a, face.b) + '-' + Math.max(face.a, face.b),
    Math.min(face.b, face.c) + '-' + Math.max(face.b, face.c),
    Math.min(face.c, face.a) + '-' + Math.max(face.c, face.a),
  ];

  for (const other of allFaces) {
    if (other.index === face.index) continue;

    const otherEdges = [
      Math.min(other.a, other.b) + '-' + Math.max(other.a, other.b),
      Math.min(other.b, other.c) + '-' + Math.max(other.b, other.c),
      Math.min(other.c, other.a) + '-' + Math.max(other.c, other.a),
    ];

    for (const edge of edges) {
      if (otherEdges.includes(edge)) {
        adjacent.push(other);
        break;
      }
    }
  }

  return adjacent;
}

export const FaceInspector = () => {
  const editMode = use3DStore((s) => s.editMode);
  const editShapeId = use3DStore((s) => s.editShapeId);
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

  // Compute face data for selected faces
  const faceData = useMemo(() => {
    if (!geo || editMode !== 'face' || selectedFaces.length === 0) return null;

    const allFaces = extractAllFaces(geo);
    const pos = geo.attributes.position;
    const results = [];

    for (const face of selectedFaces) {
      if (face.shapeId !== editShapeId) continue;

      const faceIdx = face.index;
      const faceInfo = allFaces[faceIdx];
      if (!faceInfo) continue;

      const { a, b, c } = faceInfo;

      // Transform vertices to world space
      const vA = new THREE.Vector3().fromBufferAttribute(pos, a).applyMatrix4(worldMatrix);
      const vB = new THREE.Vector3().fromBufferAttribute(pos, b).applyMatrix4(worldMatrix);
      const vC = new THREE.Vector3().fromBufferAttribute(pos, c).applyMatrix4(worldMatrix);

      // Calculate properties
      const area = calculateFaceArea(pos, a, b, c);
      const perimeter = calculateFacePerimeter(pos, a, b, c);
      const normal = calculateFaceNormal(pos, a, b, c);

      // Calculate angles at each vertex
      const angleA = calculateEdgeAngle(pos, a, b, c);
      const angleB = calculateEdgeAngle(pos, b, a, c);
      const calculateEdgeAngleC = calculateEdgeAngle(pos, c, a, b);

      // Calculate edge lengths
      const edgeAB = vA.distanceTo(vB);
      const edgeBC = vB.distanceTo(vC);
      const edgeCA = vC.distanceTo(vA);

      // Find adjacent faces
      const adjacent = findAdjacentFaces(faceInfo, allFaces);

      // Calculate center
      const center = vA.clone().add(vB).add(vC).divideScalar(3);

      results.push({
        faceIndex: faceIdx,
        vertices: [a, b, c],
        worldPositions: [vA.toArray(), vB.toArray(), vC.toArray()],
        center: center.toArray(),
        normal: normal.toArray(),
        area,
        perimeter,
        angles: [angleA, angleB, calculateEdgeAngleC],
        edgeLengths: [edgeAB, edgeBC, edgeCA],
        adjacentFaces: adjacent.length,
        isBoundary: adjacent.length < 3,
        isManifold: adjacent.length === 3,
      });
    }

    return results;
  }, [geo, editMode, selectedFaces, editShapeId, worldMatrix]);

  if (editMode !== 'face' || !faceData || faceData.length === 0) {
    return null;
  }

  // Calculate total area for multi-face selection
  const totalArea = faceData.reduce((sum, f) => sum + f.area, 0);

  return (
    <div className="face-inspector">
      <div className="face-inspector-header">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="12,3 3,21 21,21"/>
        </svg>
        <span>Face Inspector</span>
        <span className="face-count">{faceData.length} selected</span>
      </div>

      {faceData.length > 1 && (
        <div className="face-total-area">
          <label>Total Area</label>
          <span className="total-value">{totalArea.toFixed(4)} sq units</span>
        </div>
      )}

      <div className="face-inspector-content">
        {faceData.map((data, idx) => (
          <div key={idx} className="face-data-card">
            <div className="face-data-header">
              <span className="face-index">Face #{data.faceIndex}</span>
              <span className={`face-type ${data.isBoundary ? 'boundary' : 'manifold'}`}>
                {data.isBoundary ? 'Boundary' : 'Manifold'}
              </span>
            </div>

            {/* Vertices */}
            <div className="face-property">
              <label>Vertices</label>
              <div className="face-vertex-list">
                {data.vertices.map((v, i) => (
                  <span key={i} className="vertex-chip">V{v}</span>
                ))}
              </div>
            </div>

            {/* Center */}
            <div className="face-property">
              <label>Center</label>
              <div className="face-value-coords">
                <span className="coord x">X: {data.center[0].toFixed(3)}</span>
                <span className="coord y">Y: {data.center[1].toFixed(3)}</span>
                <span className="coord z">Z: {data.center[2].toFixed(3)}</span>
              </div>
            </div>

            {/* Normal */}
            <div className="face-property">
              <label>Normal</label>
              <div className="face-value-coords">
                <span className="coord x">X: {data.normal[0].toFixed(3)}</span>
                <span className="coord y">Y: {data.normal[1].toFixed(3)}</span>
                <span className="coord z">Z: {data.normal[2].toFixed(3)}</span>
              </div>
            </div>

            {/* Area */}
            <div className="face-property">
              <label>Area</label>
              <span className="face-value">{data.area.toFixed(4)} sq units</span>
            </div>

            {/* Perimeter */}
            <div className="face-property">
              <label>Perimeter</label>
              <span className="face-value">{data.perimeter.toFixed(4)} units</span>
            </div>

            {/* Edge Lengths */}
            <div className="face-property">
              <label>Edge Lengths</label>
              <div className="face-edge-lengths">
                <span className="edge-len">AB: {data.edgeLengths[0].toFixed(3)}</span>
                <span className="edge-len">BC: {data.edgeLengths[1].toFixed(3)}</span>
                <span className="edge-len">CA: {data.edgeLengths[2].toFixed(3)}</span>
              </div>
            </div>

            {/* Angles */}
            <div className="face-property">
              <label>Angles</label>
              <div className="face-angles">
                <span className="angle-chip">@V{data.vertices[0]}: {data.angles[0].toFixed(1)}°</span>
                <span className="angle-chip">@V{data.vertices[1]}: {data.angles[1].toFixed(1)}°</span>
                <span className="angle-chip">@V{data.vertices[2]}: {data.angles[2].toFixed(1)}°</span>
              </div>
            </div>

            {/* Adjacent Faces */}
            <div className="face-property">
              <label>Adjacent Faces</label>
              <span className="face-value">{data.adjacentFaces}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FaceInspector;
