/**
 * Vision3D - Snap Tools
 * Vertex, edge, and face snapping for precise modeling.
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import * as THREE from 'three';
import { createGeometry } from './helpers';

/**
 * Extract all vertex positions from a shape
 */
export function getShapeVertices(shape) {
  const geometry = createGeometry(shape);
  const positions = geometry.attributes.position;
  const vertices = [];
  const matrix = new THREE.Matrix4().compose(
    new THREE.Vector3(...shape.position),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(...shape.rotation)),
    new THREE.Vector3(...shape.scale)
  );

  for (let i = 0; i < positions.count; i++) {
    const v = new THREE.Vector3(positions.getX(i), positions.getY(i), positions.getZ(i));
    v.applyMatrix4(matrix);
    vertices.push(v);
  }

  geometry.dispose();
  return vertices;
}

/**
 * Extract edge midpoints from a shape
 */
export function getShapeEdgeMidpoints(shape) {
  const geometry = createGeometry(shape);
  const positions = geometry.attributes.position;
  const index = geometry.index;
  const midpoints = [];
  const matrix = new THREE.Matrix4().compose(
    new THREE.Vector3(...shape.position),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(...shape.rotation)),
    new THREE.Vector3(...shape.scale)
  );

  const seen = new Set();

  if (index) {
    for (let i = 0; i < index.count; i += 3) {
      const a = index.getX(i);
      const b = index.getX(i + 1);
      const c = index.getX(i + 2);
      const edges = [[a, b], [b, c], [c, a]];
      for (const [ea, eb] of edges) {
        const key = `${Math.min(ea, eb)}-${Math.max(ea, eb)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const va = new THREE.Vector3(positions.getX(ea), positions.getY(ea), positions.getZ(ea));
        const vb = new THREE.Vector3(positions.getX(eb), positions.getY(eb), positions.getZ(eb));
        va.applyMatrix4(matrix);
        vb.applyMatrix4(matrix);
        midpoints.push(va.add(vb).multiplyScalar(0.5));
      }
    }
  } else {
    for (let i = 0; i < positions.count; i += 3) {
      const edges = [[i, i + 1], [i + 1, i + 2], [i + 2, i]];
      for (const [ea, eb] of edges) {
        if (eb >= positions.count) continue;
        const key = `${Math.min(ea, eb)}-${Math.max(ea, eb)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const va = new THREE.Vector3(positions.getX(ea), positions.getY(ea), positions.getZ(ea));
        const vb = new THREE.Vector3(positions.getX(eb), positions.getY(eb), positions.getZ(eb));
        va.applyMatrix4(matrix);
        vb.applyMatrix4(matrix);
        midpoints.push(va.add(vb).multiplyScalar(0.5));
      }
    }
  }

  geometry.dispose();
  return midpoints;
}

/**
 * Extract face centers from a shape
 */
export function getShapeFaceCenters(shape) {
  const geometry = createGeometry(shape);
  const positions = geometry.attributes.position;
  const index = geometry.index;
  const centers = [];
  const matrix = new THREE.Matrix4().compose(
    new THREE.Vector3(...shape.position),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(...shape.rotation)),
    new THREE.Vector3(...shape.scale)
  );

  const processTriangle = (a, b, c) => {
    const va = new THREE.Vector3(positions.getX(a), positions.getY(a), positions.getZ(a));
    const vb = new THREE.Vector3(positions.getX(b), positions.getY(b), positions.getZ(b));
    const vc = new THREE.Vector3(positions.getX(c), positions.getY(c), positions.getZ(c));
    va.applyMatrix4(matrix);
    vb.applyMatrix4(matrix);
    vc.applyMatrix4(matrix);
    centers.push(va.add(vb).add(vc).multiplyScalar(1 / 3));
  };

  if (index) {
    for (let i = 0; i < index.count; i += 3) {
      processTriangle(index.getX(i), index.getX(i + 1), index.getX(i + 2));
    }
  } else {
    for (let i = 0; i < positions.count; i += 3) {
      if (i + 2 < positions.count) {
        processTriangle(i, i + 1, i + 2);
      }
    }
  }

  geometry.dispose();
  return centers;
}

/**
 * Find the nearest snap point from all shapes
 */
export function findNearestSnapPoint(position, shapes, snapMode, threshold = 0.3) {
  const pos = new THREE.Vector3(...position);
  let nearest = null;
  let minDist = threshold;

  for (const shape of shapes) {
    if (!shape.visible || shape.locked) continue;

    let points;
    switch (snapMode) {
      case 'vertex':
        points = getShapeVertices(shape);
        break;
      case 'edge':
        points = getShapeEdgeMidpoints(shape);
        break;
      case 'face':
        points = getShapeFaceCenters(shape);
        break;
      default:
        continue;
    }

    for (const point of points) {
      const dist = pos.distanceTo(point);
      if (dist < minDist) {
        minDist = dist;
        nearest = point.toArray();
      }
    }
  }

  return nearest;
}

/**
 * Snap a position to the nearest vertex/edge/face center
 */
export function snapToFeature(position, shapes, snapMode, threshold = 0.3) {
  const snapped = findNearestSnapPoint(position, shapes, snapMode, threshold);
  return snapped || position;
}
