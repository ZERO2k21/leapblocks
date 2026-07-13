/**
 * Vision3D - Edge Inspector Component
 * Shows detailed information about selected edges in edit mode.
 * Similar to Blender's Edge Data panel in the Sidebar.
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { use3DStore } from '../store/use3DStore';

const _vA = new THREE.Vector3();
const _vB = new THREE.Vector3();
const _vC = new THREE.Vector3();

/**
 * Calculate edge length in world space
 */
function calculateEdgeLength(geometry, edge, worldMatrix) {
  const pos = geometry.attributes.position;
  _vA.fromBufferAttribute(pos, edge.a).applyMatrix4(worldMatrix);
  _vB.fromBufferAttribute(pos, edge.b).applyMatrix4(worldMatrix);
  return _vA.distanceTo(_vB);
}

/**
 * Calculate edge midpoint in world space
 */
function calculateEdgeMidpoint(geometry, edge, worldMatrix) {
  const pos = geometry.attributes.position;
  _vA.fromBufferAttribute(pos, edge.a).applyMatrix4(worldMatrix);
  _vB.fromBufferAttribute(pos, edge.b).applyMatrix4(worldMatrix);
  return _vA.add(_vB).multiplyScalar(0.5);
}

/**
 * Calculate edge direction vector
 */
function calculateEdgeDirection(geometry, edge) {
  const pos = geometry.attributes.position;
  _vA.fromBufferAttribute(pos, edge.a);
  _vB.fromBufferAttribute(pos, edge.b);
  return _vB.sub(_vA).normalize();
}

/**
 * Calculate angle between two edges sharing a vertex
 */
function calculateEdgeAngle(geometry, edge1, edge2) {
  const pos = geometry.attributes.position;

  // Find shared vertex
  let shared = -1;
  let other1 = -1;
  let other2 = -1;

  if (edge1.a === edge2.a) {
    shared = edge1.a;
    other1 = edge1.b;
    other2 = edge2.b;
  } else if (edge1.a === edge2.b) {
    shared = edge1.a;
    other1 = edge1.b;
    other2 = edge2.a;
  } else if (edge1.b === edge2.a) {
    shared = edge1.b;
    other1 = edge1.a;
    other2 = edge2.b;
  } else if (edge1.b === edge2.b) {
    shared = edge1.b;
    other1 = edge1.a;
    other2 = edge2.a;
  }

  if (shared === -1) return null;

  _vA.fromBufferAttribute(pos, shared);
  _vB.fromBufferAttribute(pos, other1);
  _vC.fromBufferAttribute(pos, other2);

  const dir1 = _vB.clone().sub(_vA).normalize();
  const dir2 = _vC.clone().sub(_vA).normalize();

  const dot = dir1.dot(dir2);
  const angle = Math.acos(Math.max(-1, Math.min(1, dot)));

  return (angle * 180) / Math.PI;
}

/**
 * Find connected edges (edges sharing a vertex)
 */
function findConnectedEdges(geometry, edge, allEdges) {
  const connected = [];
  for (const other of allEdges) {
    if (other.a === edge.a || other.a === edge.b || other.b === edge.a || other.b === edge.b) {
      if (other.a !== edge.a || other.b !== edge.b) {
        connected.push(other);
      }
    }
  }
  return connected;
}

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

export const EdgeInspector = () => {
  const editMode = use3DStore((s) => s.editMode);
  const editShapeId = use3DStore((s) => s.editShapeId);
  const selectedEdges = use3DStore((s) => s.selectedEdges);
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

  // Compute edge data for selected edges
  const edgeData = useMemo(() => {
    if (!geo || editMode !== 'edge' || selectedEdges.length === 0) return null;

    const allEdges = extractAllEdges(geo);
    const results = [];

    for (const edge of selectedEdges) {
      if (edge.shapeId !== editShapeId) continue;

      const length = calculateEdgeLength(geo, edge, worldMatrix);
      const midpoint = calculateEdgeMidpoint(geo, edge, worldMatrix);
      const direction = calculateEdgeDirection(geo, edge);
      const connected = findConnectedEdges(geo, edge, allEdges);

      // Get vertex positions
      const pos = geo.attributes.position;
      const vA = new THREE.Vector3().fromBufferAttribute(pos, edge.a).applyMatrix4(worldMatrix);
      const vB = new THREE.Vector3().fromBufferAttribute(pos, edge.b).applyMatrix4(worldMatrix);

      // Calculate angles with connected edges
      const angles = [];
      for (const conn of connected.slice(0, 4)) { // Limit to 4 connected edges
        const angle = calculateEdgeAngle(geo, edge, conn);
        if (angle !== null) {
          angles.push(angle);
        }
      }

      results.push({
        edge,
        length,
        midpoint: midpoint.toArray(),
        direction: direction.toArray(),
        vertexA: vA.toArray(),
        vertexB: vB.toArray(),
        connectedCount: connected.length,
        angles,
        isBoundary: connected.length === 1,
        isManifold: connected.length === 2,
      });
    }

    return results;
  }, [geo, editMode, selectedEdges, editShapeId, worldMatrix]);

  if (editMode !== 'edge' || !edgeData || edgeData.length === 0) {
    return null;
  }

  const formatAngle = (deg) => `${deg.toFixed(1)}°`;

  return (
    <div className="absolute top-3 left-3 z-[20] bg-white/96 border border-slate-200 rounded-lg shadow-lg text-[11px] text-slate-600 max-w-[280px] max-h-[60vh] overflow-y-auto backdrop-blur-[8px]">
      <div className="flex items-center gap-1.5 p-[8px_12px] border-b border-slate-200 font-semibold text-[12px] text-slate-800">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="5" y1="19" x2="19" y2="5" strokeWidth="2.5"/>
        </svg>
        <span>Edge Inspector</span>
        <span className="ml-auto text-[10px] font-medium text-slate-500 bg-slate-100 p-[2px_6px] rounded">{edgeData.length} selected</span>
      </div>

      <div className="p-1.5">
        {edgeData.map((data, idx) => (
          <div key={idx} className="p-2 mb-1 rounded-md bg-slate-50 border border-slate-200 last:mb-0">
            <div className="flex justify-between items-center mb-1.5 font-semibold text-[11px]">
              <span className="text-slate-600">Edge #{idx + 1}</span>
              <span className={`text-[9px] p-[1px_6px] rounded font-medium uppercase tracking-[0.5px] ${data.isBoundary ? 'bg-amber-100 text-amber-800' : data.isManifold ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {data.isBoundary ? 'Boundary' : data.isManifold ? 'Manifold' : 'Non-Manifold'}
              </span>
            </div>

            {/* Length */}
            <div className="flex justify-between items-center py-0.75 border-b border-slate-100 last:border-b-0">
              <label className="text-[10px] text-slate-500 font-medium">Length</label>
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-semibold text-slate-800 font-mono">{data.length.toFixed(4)}</span>
                <span className="text-[9px] text-slate-400">units</span>
              </div>
            </div>

            {/* Midpoint */}
            <div className="flex justify-between items-center py-0.75 border-b border-slate-100 last:border-b-0">
              <label className="text-[10px] text-slate-500 font-medium">Midpoint</label>
              <div className="flex gap-1.5 flex-wrap">
                <span className="font-mono text-[10px] font-medium text-red-500">X: {data.midpoint[0].toFixed(3)}</span>
                <span className="font-mono text-[10px] font-medium text-green-500">Y: {data.midpoint[1].toFixed(3)}</span>
                <span className="font-mono text-[10px] font-medium text-blue-500">Z: {data.midpoint[2].toFixed(3)}</span>
              </div>
            </div>

            {/* Vertex A */}
            <div className="flex justify-between items-center py-0.75 border-b border-slate-100 last:border-b-0">
              <label className="text-[10px] text-slate-500 font-medium">Vertex A (idx: {data.edge.a})</label>
              <div className="flex gap-1.5 flex-wrap">
                <span className="font-mono text-[10px] font-medium text-red-500">X: {data.vertexA[0].toFixed(3)}</span>
                <span className="font-mono text-[10px] font-medium text-green-500">Y: {data.vertexA[1].toFixed(3)}</span>
                <span className="font-mono text-[10px] font-medium text-blue-500">Z: {data.vertexA[2].toFixed(3)}</span>
              </div>
            </div>

            {/* Vertex B */}
            <div className="flex justify-between items-center py-0.75 border-b border-slate-100 last:border-b-0">
              <label className="text-[10px] text-slate-500 font-medium">Vertex B (idx: {data.edge.b})</label>
              <div className="flex gap-1.5 flex-wrap">
                <span className="font-mono text-[10px] font-medium text-red-500">X: {data.vertexB[0].toFixed(3)}</span>
                <span className="font-mono text-[10px] font-medium text-green-500">Y: {data.vertexB[1].toFixed(3)}</span>
                <span className="font-mono text-[10px] font-medium text-blue-500">Z: {data.vertexB[2].toFixed(3)}</span>
              </div>
            </div>

            {/* Direction */}
            <div className="flex justify-between items-center py-0.75 border-b border-slate-100 last:border-b-0">
              <label className="text-[10px] text-slate-500 font-medium">Direction</label>
              <div className="flex gap-1.5 flex-wrap">
                <span className="font-mono text-[10px] font-medium text-red-500">X: {data.direction[0].toFixed(3)}</span>
                <span className="font-mono text-[10px] font-medium text-green-500">Y: {data.direction[1].toFixed(3)}</span>
                <span className="font-mono text-[10px] font-medium text-blue-500">Z: {data.direction[2].toFixed(3)}</span>
              </div>
            </div>

            {/* Connected Edges */}
            <div className="flex justify-between items-center py-0.75 border-b border-slate-100 last:border-b-0">
              <label className="text-[10px] text-slate-500 font-medium">Connected Edges</label>
              <span className="text-[11px] font-semibold text-slate-800 font-mono">{data.connectedCount}</span>
            </div>

            {/* Angles */}
            {data.angles.length > 0 && (
              <div className="flex justify-between items-center py-0.75 border-b border-slate-100 last:border-b-0">
                <label className="text-[10px] text-slate-500 font-medium">Angles with Connected</label>
                <div className="flex gap-1 flex-wrap">
                  {data.angles.map((angle, i) => (
                    <span key={i} className="text-[9px] p-[2px_6px] rounded font-medium bg-slate-100 text-slate-700">{formatAngle(angle)}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EdgeInspector;
