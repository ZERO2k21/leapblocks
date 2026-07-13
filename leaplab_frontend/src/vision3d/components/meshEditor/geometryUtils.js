import * as THREE from 'three';

const _vA = new THREE.Vector3();
const _vB = new THREE.Vector3();
const _vC = new THREE.Vector3();

export function getDirectSelection(geo, selectedVertices, selectedEdges, selectedFaces) {
  const connected = new Set();
  const idx = geo.index;
  const posAttr = geo.attributes.position;

  for (const v of selectedVertices) connected.add(v.index);
  for (const e of selectedEdges) { connected.add(e.a); connected.add(e.b); }
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

  const EPSILON = 0.01;
  const expanded = new Set(connected);

  // Spatial weld selected vertices — find all coincident vertices
  for (const vi of connected) {
    _vA.fromBufferAttribute(posAttr, vi);
    for (let i = 0; i < posAttr.count; i++) {
      _vB.fromBufferAttribute(posAttr, i);
      if (_vA.distanceTo(_vB) < EPSILON) {
        expanded.add(i);
      }
    }
  }

  return expanded;
}

export function falloffSmooth(r) {
  if (r >= 1) return 0;
  return 3 * r * r - 2 * r * r * r; // smoothstep
}

export function applyProportionalFalloff(r) {
  return falloffSmooth(r);
}

export function getConnectedVertices(geo, selectedVertices, selectedEdges, selectedFaces) {
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

  const EPSILON = 0.01;
  const expanded = new Set(connected);

  // STEP 1: Spatial weld selected vertices — find all coincident vertices
  for (const vi of connected) {
    _vA.fromBufferAttribute(posAttr, vi);
    for (let i = 0; i < posAttr.count; i++) {
      _vB.fromBufferAttribute(posAttr, i);
      if (_vA.distanceTo(_vB) < EPSILON) {
        expanded.add(i);
      }
    }
  }

  // STEP 2: Find neighbors — vertices connected by an edge to any selected/welded vertex
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

  // STEP 3: Spatial weld neighbor vertices — ensure coincident neighbor vertices are grouped
  const finalNeighbors = new Set(neighbors);
  for (const ni of neighbors) {
    _vA.fromBufferAttribute(posAttr, ni);
    for (let i = 0; i < posAttr.count; i++) {
      if (expanded.has(i)) continue; // skip selected/welded vertices
      _vB.fromBufferAttribute(posAttr, i);
      if (_vA.distanceTo(_vB) < EPSILON) {
        finalNeighbors.add(i);
      }
    }
  }

  return { selected: expanded, neighbors: finalNeighbors };
}
