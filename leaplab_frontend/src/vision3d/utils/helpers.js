/**
 * Vision3D - Helper Utilities
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import * as THREE from 'three';
import { SHAPE_DEFINITIONS } from './constants';
import { debug } from './logger';

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
    position,
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    color: defaults.color || '#4F46E5',
    isHole: false,
    visible: true,
    locked: false,
    // Box
    width: defaults.width,
    height: defaults.height,
    depth: defaults.depth,
    // Cylinder
    radiusTop: defaults.radiusTop,
    radiusBottom: defaults.radiusBottom,
    cylinderHeight: defaults.cylinderHeight,
    radialSegments: defaults.radialSegments,
    // Sphere
    radius: defaults.radius,
    widthSegments: defaults.widthSegments,
    heightSegments: defaults.heightSegments,
    // Cone
    coneRadius: defaults.coneRadius,
    coneHeight: defaults.coneHeight,
    // Torus
    torusRadius: defaults.torusRadius,
    tubeRadius: defaults.tubeRadius,
    torusRadialSegments: defaults.torusRadialSegments,
    torusTubularSegments: defaults.torusTubularSegments,
    // Ring
    innerRadius: defaults.innerRadius,
    outerRadius: defaults.outerRadius,
    // Text
    text: defaults.text,
    fontSize: defaults.fontSize,
    // Material
    metalness: 0.1,
    roughness: 0.7,
    opacity: 1,
  };
}

export function createGeometry(shape) {
  debug('createGeometry:', shape.type, shape.id);
  switch (shape.type) {
    case 'box':
      return new THREE.BoxGeometry(
        shape.width ?? 2,
        shape.height ?? 2,
        shape.depth ?? 2
      );

    case 'cylinder':
      return new THREE.CylinderGeometry(
        shape.radiusTop ?? 1,
        shape.radiusBottom ?? 1,
        shape.cylinderHeight ?? 2,
        shape.radialSegments ?? 32
      );

    case 'sphere':
      return new THREE.SphereGeometry(
        shape.radius ?? 1,
        shape.widthSegments ?? 32,
        shape.heightSegments ?? 16
      );

    case 'cone':
      return new THREE.ConeGeometry(
        shape.coneRadius ?? 1,
        shape.coneHeight ?? 2,
        shape.radialSegments ?? 32
      );

    case 'torus':
      return new THREE.TorusGeometry(
        shape.torusRadius ?? 1,
        shape.tubeRadius ?? 0.4,
        shape.torusRadialSegments ?? 16,
        shape.torusTubularSegments ?? 32
      );

    case 'dodecahedron':
      return new THREE.DodecahedronGeometry(shape.radius ?? 1);

    case 'icosahedron':
      return new THREE.IcosahedronGeometry(shape.radius ?? 1);

    case 'octahedron':
      return new THREE.OctahedronGeometry(shape.radius ?? 1);

    case 'tetrahedron':
      return new THREE.TetrahedronGeometry(shape.radius ?? 1);

    case 'ring':
      return new THREE.RingGeometry(
        shape.innerRadius ?? 0.5,
        shape.outerRadius ?? 1,
        32
      );

    case 'plane':
      return new THREE.PlaneGeometry(2, 2);

    default:
      return new THREE.BoxGeometry(1, 1, 1);
  }
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

export function calculateBoundingBox(shape) {
  const geometry = createGeometry(shape);
  geometry.computeBoundingBox();

  const bbox = geometry.boundingBox;
  const scale = new THREE.Vector3(...shape.scale);
  const position = new THREE.Vector3(...shape.position);

  const min = bbox.min.clone().multiply(scale).add(position);
  const max = bbox.max.clone().multiply(scale).add(position);

  geometry.dispose();

  return { min, max };
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

export function checkIntersection(shapeA, shapeB) {
  const boxA = calculateBoundingBox(shapeA);
  const boxB = calculateBoundingBox(shapeB);

  return (
    boxA.min.x <= boxB.max.x &&
    boxA.max.x >= boxB.min.x &&
    boxA.min.y <= boxB.max.y &&
    boxA.max.y >= boxB.min.y &&
    boxA.min.z <= boxB.max.z &&
    boxA.max.z >= boxB.min.z
  );
}

export function getDistance(shapeA, shapeB) {
  const dx = shapeA.position[0] - shapeB.position[0];
  const dy = shapeA.position[1] - shapeB.position[1];
  const dz = shapeA.position[2] - shapeB.position[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function hexToThreeColor(hex) {
  return new THREE.Color(hex);
}

export function getHoleColor(originalColor) {
  return '#888888';
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
