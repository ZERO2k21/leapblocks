/**
 * Vision3D - CSG Boolean Engine
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 *
 * Implements Union, Subtract, and Intersect operations
 * using three-bvh-csg for real constructive solid geometry.
 */

import * as THREE from 'three';
import { Evaluator, Brush, ADDITION, SUBTRACTION, INTERSECTION } from 'three-bvh-csg';
import { createGeometry } from '../utils/helpers';
import { generateShapeId } from '../utils/helpers';
import { log, debug, error } from '../utils/logger';

const evaluator = new Evaluator();

/**
 * Build a THREE.BufferGeometry from a shape definition
 */
function buildGeometry(shape) {
  const geo = createGeometry(shape);
  geo.computeBoundingBox();
  return geo;
}

/**
 * Create a Brush (CSG-ready mesh) from a shape
 */
function createBrush(shape) {
  const geometry = buildGeometry(shape);
  const matrix = new THREE.Matrix4();

  matrix.compose(
    new THREE.Vector3(...shape.position),
    new THREE.Quaternion().setFromEuler(
      new THREE.Euler(
        (shape.rotation?.[0] || 0) * Math.PI / 180,
        (shape.rotation?.[1] || 0) * Math.PI / 180,
        (shape.rotation?.[2] || 0) * Math.PI / 180
      )
    ),
    new THREE.Vector3(...(shape.scale || [1, 1, 1]))
  );

  geometry.applyMatrix4(matrix);

  const brush = new Brush(geometry);
  brush.updateMatrixWorld();
  return brush;
}

/**
 * Perform a CSG operation on two shapes
 * @param {Object} shapeA - First shape
 * @param {Object} shapeB - Second shape
 * @param {'union'|'subtract'|'intersect'} operation
 * @returns {Object|null} Resulting shape or null on failure
 */
export function performCSG(shapeA, shapeB, operation) {
  debug(`CSG: ${operation} on ${shapeA.type} + ${shapeB.type}`);

  try {
    const brushA = createBrush(shapeA);
    const brushB = createBrush(shapeB);

    let csgOp;
    switch (operation) {
      case 'union': csgOp = ADDITION; break;
      case 'subtract': csgOp = SUBTRACTION; break;
      case 'intersect': csgOp = INTERSECTION; break;
      default:
        error('CSG: unknown operation:', operation);
        return null;
    }

    const result = evaluator.evaluate(brushA, brushB, csgOp);

    if (!result || !result.geometry) {
      error('CSG: operation produced no result');
      return null;
    }

    const resultGeometry = result.geometry;
    resultGeometry.computeBoundingBox();
    resultGeometry.computeBoundingSphere();

    // Calculate center offset
    const bbox = resultGeometry.boundingBox;
    const center = new THREE.Vector3();
    bbox.getCenter(center);

    // Translate geometry so its center is at origin
    resultGeometry.translate(-center.x, -center.y, -center.z);

    // Create a new shape from the result
    const newShape = {
      id: generateShapeId(),
      type: 'csg_result',
      name: `CSG ${operation}`,
      position: [
        shapeA.position[0] + center.x,
        shapeA.position[1] + center.y,
        shapeA.position[2] + center.z,
      ],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: shapeA.color || '#6366f1',
      metalness: shapeA.metalness ?? 0.1,
      roughness: shapeA.roughness ?? 0.7,
      opacity: 1,
      visible: true,
      locked: false,
      isHole: false,
      parentId: shapeA.parentId || shapeB.parentId || undefined,
      // Store the computed geometry as a serializable attribute
      _csgGeometry: resultGeometry,
    };

    log(`CSG: ${operation} completed, result has ${resultGeometry.attributes.position?.count || 0} vertices`);
    return newShape;
  } catch (err) {
    error('CSG operation failed:', err);
    return null;
  }
}

/**
 * Perform CSG on multiple shapes (left-to-right fold)
 * @param {Object[]} shapes - Array of shapes
 * @param {'union'|'subtract'|'intersect'} operation
 * @returns {Object|null} Resulting shape
 */
export function performMultiCSG(shapes, operation) {
  if (shapes.length < 2) return null;

  let result = shapes[0];
  for (let i = 1; i < shapes.length; i++) {
    result = performCSG(result, shapes[i], operation);
    if (!result) return null;
  }
  return result;
}

/**
 * Check if a CSG operation is valid for the given shapes
 */
export function isCSGValid(shapes) {
  if (shapes.length < 2) return false;
  // All shapes must be visible and not locked
  return shapes.every(s => s.visible && !s.locked);
}
