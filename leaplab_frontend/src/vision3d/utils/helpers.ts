/**
 * Vision3D - Helper Utilities
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import * as THREE from 'three';
import { Shape3D, ShapeType } from '../types';
import { SHAPE_DEFINITIONS } from './constants';
import { debug } from './logger';

let idCounter = 0;

/**
 * Generate a unique ID for shapes
 */
export function generateShapeId(): string {
  idCounter += 1;
  return `shape_${Date.now()}_${idCounter}`;
}

/**
 * Create a new shape with default values
 */
export function createShape(
  type: ShapeType,
  position: [number, number, number] = [0, 0, 0]
): Shape3D {
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
    color: (defaults.color as string) || '#4F46E5',
    isHole: false,
    visible: true,
    locked: false,
    // Box
    width: defaults.width as number,
    height: defaults.height as number,
    depth: defaults.depth as number,
    // Cylinder
    radiusTop: defaults.radiusTop as number,
    radiusBottom: defaults.radiusBottom as number,
    cylinderHeight: defaults.cylinderHeight as number,
    radialSegments: defaults.radialSegments as number,
    // Sphere
    radius: defaults.radius as number,
    widthSegments: defaults.widthSegments as number,
    heightSegments: defaults.heightSegments as number,
    // Cone
    coneRadius: defaults.coneRadius as number,
    coneHeight: defaults.coneHeight as number,
    // Torus
    torusRadius: defaults.torusRadius as number,
    tubeRadius: defaults.tubeRadius as number,
    torusRadialSegments: defaults.torusRadialSegments as number,
    torusTubularSegments: defaults.torusTubularSegments as number,
    // Ring
    innerRadius: defaults.innerRadius as number,
    outerRadius: defaults.outerRadius as number,
    // Text
    text: defaults.text as string,
    fontSize: defaults.fontSize as number,
    // Material
    metalness: 0.1,
    roughness: 0.7,
    opacity: 1,
  };
}

/**
 * Create Three.js geometry from shape data
 */
export function createGeometry(shape: Shape3D): THREE.BufferGeometry {
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

/**
 * Clone a shape with a new ID
 */
export function cloneShape(shape: Shape3D): Shape3D {
  const newId = generateShapeId();
  debug('cloneShape:', shape.id, '->', newId);
  return {
    ...shape,
    id: newId,
    name: `${shape.name}_copy`,
    position: [...shape.position] as [number, number, number],
    rotation: [...shape.rotation] as [number, number, number],
    scale: [...shape.scale] as [number, number, number],
    children: undefined,
    parentId: undefined,
  };
}

/**
 * Calculate bounding box for a shape
 */
export function calculateBoundingBox(shape: Shape3D): {
  min: THREE.Vector3;
  max: THREE.Vector3;
} {
  const geometry = createGeometry(shape);
  geometry.computeBoundingBox();

  const bbox = geometry.boundingBox!;
  const scale = new THREE.Vector3(...shape.scale);
  const position = new THREE.Vector3(...shape.position);

  const min = bbox.min.clone().multiply(scale).add(position);
  const max = bbox.max.clone().multiply(scale).add(position);

  geometry.dispose();

  return { min, max };
}

/**
 * Get center of multiple shapes
 */
export function getShapesCenter(shapes: Shape3D[]): [number, number, number] {
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

/**
 * Snap value to grid
 */
export function snapToGrid(value: number, gridSize: number): number {
  const result = Math.round(value / gridSize) * gridSize;
  if (Math.abs(result - value) > 0.001) {
    debug('snapToGrid:', value.toFixed(3), '->', result.toFixed(3), `(grid: ${gridSize})`);
  }
  return result;
}

/**
 * Snap position to grid
 */
export function snapPositionToGrid(
  position: [number, number, number],
  gridSize: number
): [number, number, number] {
  return [
    snapToGrid(position[0], gridSize),
    snapToGrid(position[1], gridSize),
    snapToGrid(position[2], gridSize),
  ];
}

/**
 * Check if two shapes intersect (simple AABB check)
 */
export function checkIntersection(shapeA: Shape3D, shapeB: Shape3D): boolean {
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

/**
 * Get distance between two shapes
 */
export function getDistance(shapeA: Shape3D, shapeB: Shape3D): number {
  const dx = shapeA.position[0] - shapeB.position[0];
  const dy = shapeA.position[1] - shapeB.position[1];
  const dz = shapeA.position[2] - shapeB.position[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Convert hex color to Three.js color
 */
export function hexToThreeColor(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

/**
 * Get opposite color for hole visualization
 */
export function getHoleColor(originalColor: string): string {
  return '#888888';
}

/**
 * Validate shape data
 */
export function validateShape(shape: Partial<Shape3D>): string[] {
  const errors: string[] = [];

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
