/**
 * Vision3D - Helper Utilities
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import * as THREE from 'three';
import { SHAPE_DEFINITIONS } from './constants';
import { debug } from './logger';
import { createGeometry } from './geometry';

let idCounter = 0;

export function generateShapeId() {
  idCounter += 1;
  return `shape_${Date.now()}_${idCounter}`;
}

export function createShape(type, position = [0, 0, 0]) {
  debug('createShape:', type, 'at', position);
  const definition = SHAPE_DEFINITIONS.find((d) => d.type === type);
  if (!definition) {
    throw new Error(`Unknown shape type: ${type}`);
  }

  const id = generateShapeId();
  const defaults = definition.defaults;

  return {
    id,
    type,
    name: definition.name,
    position: defaults.position || position,
    rotation: defaults.rotation || [0, 0, 0],
    scale: defaults.scale || [1, 1, 1],
    color: defaults.color || '#4F46E5',
    isHole: false,
    visible: true,
    locked: false,
    width: defaults.width,
    height: defaults.height,
    depth: defaults.depth,
    cornerRadius: defaults.cornerRadius || 0,
    radiusTop: defaults.radiusTop,
    radiusBottom: defaults.radiusBottom,
    cylinderHeight: defaults.cylinderHeight,
    radialSegments: defaults.radialSegments,
    taper: defaults.taper || 0,
    radius: defaults.radius,
    widthSegments: defaults.widthSegments,
    heightSegments: defaults.heightSegments,
    coneRadius: defaults.coneRadius,
    coneHeight: defaults.coneHeight,
    torusRadius: defaults.torusRadius,
    tubeRadius: defaults.tubeRadius,
    torusRadialSegments: defaults.torusRadialSegments,
    torusTubularSegments: defaults.torusTubularSegments,
    roofWidth: defaults.roofWidth,
    roofDepth: defaults.roofDepth,
    roofHeight: defaults.roofHeight,
    roundRoofWidth: defaults.roundRoofWidth,
    roundRoofDepth: defaults.roundRoofDepth,
    roundRoofHeight: defaults.roundRoofHeight,
    wedgeWidth: defaults.wedgeWidth,
    wedgeDepth: defaults.wedgeDepth,
    wedgeHeight: defaults.wedgeHeight,
    pyramidRadius: defaults.pyramidRadius,
    pyramidHeight: defaults.pyramidHeight,
    pyramidSides: defaults.pyramidSides,
    halfSphereRadius: defaults.halfSphereRadius,
    halfSphereSegments: defaults.halfSphereSegments,
    paraboloidRadius: defaults.paraboloidRadius,
    paraboloidHeight: defaults.paraboloidHeight,
    paraboloidSegments: defaults.paraboloidSegments,
    tubeOuterRadius: defaults.tubeOuterRadius,
    tubeInnerRadius: defaults.tubeInnerRadius,
    tubeHeight: defaults.tubeHeight,
    tubeRadialSegments: defaults.tubeRadialSegments,
    starOuterRadius: defaults.starOuterRadius,
    starInnerRadius: defaults.starInnerRadius,
    starPoints: defaults.starPoints,
    starHeight: defaults.starHeight,
    heartSize: defaults.heartSize,
    heartDepth: defaults.heartDepth,
    polygonRadius: defaults.polygonRadius,
    polygonSides: defaults.polygonSides,
    polygonHeight: defaults.polygonHeight,
    innerRadius: defaults.innerRadius,
    outerRadius: defaults.outerRadius,
    text: defaults.text,
    fontSize: defaults.fontSize,
    textDepth: defaults.textDepth,
    metalness: 0.1,
    roughness: 0.7,
    opacity: 1,
  };
}

export function cloneShape(shape) {
  const newId = generateShapeId();
  debug('cloneShape:', shape.id, '->', newId);
  return {
    ...shape,
    id: newId,
    name: `${shape.name}_copy`,
    position: [...shape.position],
    rotation: [...shape.rotation],
    scale: [...shape.scale],
    children: undefined,
    parentId: undefined,
  };
}

export function getShapesCenter(shapes) {
  if (shapes.length === 0) return [0, 0, 0];
  const sum = shapes.reduce(
    (acc, shape) => [
      acc[0] + shape.position[0],
      acc[1] + shape.position[1],
      acc[2] + shape.position[2],
    ],
    [0, 0, 0]
  );
  return [sum[0] / shapes.length, sum[1] / shapes.length, sum[2] / shapes.length];
}

export function snapToGrid(value, gridSize) {
  const result = Math.round(value / gridSize) * gridSize;
  if (Math.abs(result - value) > 0.001) {
    debug('snapToGrid:', value.toFixed(3), '->', result.toFixed(3), `(grid: ${gridSize})`);
  }
  return result;
}

export function snapPositionToGrid(position, gridSize) {
  return [
    snapToGrid(position[0], gridSize),
    snapToGrid(position[1], gridSize),
    snapToGrid(position[2], gridSize),
  ];
}

export function validateShape(shape) {
  const errors = [];
  if (!shape.type) errors.push('Shape type is required');
  if (!shape.id) errors.push('Shape ID is required');
  if (shape.position) {
    if (!Array.isArray(shape.position) || shape.position.length !== 3) {
      errors.push('Position must be a 3-element array');
    }
  }
  if (shape.scale) {
    if (!Array.isArray(shape.scale) || shape.scale.length !== 3) {
      errors.push('Scale must be a 3-element array');
    }
    if (shape.scale.some((s) => s <= 0)) {
      errors.push('Scale values must be positive');
    }
  }
  return errors;
}
