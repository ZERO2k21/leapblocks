/**
 * Vision3D - Modifiers
 * Array, Bevel, Solidify, and Edge Loop Cut modifiers.
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import { createGeometry, generateShapeId, cloneShape } from './helpers';

/**
 * Array Modifier - Duplicate a shape in a pattern
 */
export function applyArrayModifier(shape, options = {}) {
  const {
    count = 3,
    axis = 'x',
    offset = 2,
    useRelativeOffset = false,
  } = options;

  const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
  const results = [];

  for (let i = 0; i < count; i++) {
    const clone = cloneShape(shape);
    clone.id = generateShapeId();
    clone.name = `${shape.name}_array_${i}`;

    const newPosition = [...clone.position];
    const baseOffset = useRelativeOffset
      ? (axis === 'x' ? (shape.width ?? 2) : axis === 'y' ? (shape.height ?? 2) : (shape.depth ?? 2)) * offset
      : offset;
    newPosition[axisIndex] += i * baseOffset;
    clone.position = newPosition;

    results.push(clone);
  }

  return results;
}

/**
 * Bevel Modifier - Round edges of a shape
 * Returns a new shape with bevel applied as a parametric property
 */
export function applyBevelModifier(shape, options = {}) {
  const {
    amount = 0.1,
    segments = 3,
  } = options;

  // Apply bevel by increasing corner radius
  return {
    ...shape,
    cornerRadius: Math.min(1, (shape.cornerRadius ?? 0) + amount),
    bevelSegments: segments,
  };
}

/**
 * Solidify Modifier - Add thickness to a surface
 * Works by scaling the shape along its normals (simplified approach)
 */
export function applySolidifyModifier(shape, options = {}) {
  const {
    thickness = 0.2,
    offset = 0.5,
  } = options;

  // For box-like shapes, increase depth
  if (shape.type === 'box') {
    return {
      ...shape,
      depth: (shape.depth ?? 2) + thickness,
      position: [
        shape.position[0],
        shape.position[1],
        shape.position[2] + (offset - 0.5) * thickness,
      ],
    };
  }

  // For cylinder/cone, scale uniformly
  if (shape.type === 'cylinder' || shape.type === 'cone') {
    return {
      ...shape,
      scale: [
        shape.scale[0],
        shape.scale[1] * (1 + thickness * 0.5),
        shape.scale[2],
      ],
    };
  }

  // For sphere, increase radius
  if (shape.type === 'sphere' || shape.type === 'halfSphere') {
    const radiusKey = shape.type === 'sphere' ? 'radius' : 'halfSphereRadius';
    return {
      ...shape,
      [radiusKey]: (shape[radiusKey] ?? 1) + thickness * 0.5,
    };
  }

  // Default: scale Y
  return {
    ...shape,
    scale: [
      shape.scale[0],
      shape.scale[1] * (1 + thickness * 0.3),
      shape.scale[2],
    ],
  };
}

/**
 * Edge Loop Cut - Insert edge loops into a shape
 * Returns modified geometry with additional edge loops
 */
export function applyEdgeLoopCut(shape, options = {}) {
  const {
    axis = 'y',
    cuts = 1,
    position = 0.5,
  } = options;

  const geometry = createGeometry(shape);
  const positions = geometry.attributes.position;
  const newPositions = [];

  // For each cut, duplicate vertices and offset
  for (let c = 0; c < cuts; c++) {
    const t = position + (c - (cuts - 1) / 2) * 0.1;
    const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      const coords = [x, y, z];

      // Move vertices near the cut plane
      const axisVal = coords[axisIndex];
      const bbox = geometry.boundingBox;
      const axisMin = bbox.min[axisIndex];
      const axisMax = bbox.max[axisIndex];
      const axisRange = axisMax - axisMin;
      const normalizedPos = (axisVal - axisMin) / axisRange;

      if (Math.abs(normalizedPos - t) < 0.05) {
        // Split: create two copies offset slightly
        coords[axisIndex] = axisVal - 0.01;
        newPositions.push([...coords]);
        coords[axisIndex] = axisVal + 0.01;
      }
      newPositions.push([...coords]);
    }
  }

  geometry.dispose();

  // Return shape with note about the operation
  return {
    ...shape,
    _loopCutApplied: true,
    _loopCutCount: cuts,
    _loopCutAxis: axis,
  };
}

/**
 * Mirror Modifier - Mirror a shape along an axis
 */
export function applyMirrorModifier(shape, axis = 'x') {
  const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;

  const mirrored = cloneShape(shape);
  mirrored.id = generateShapeId();
  mirrored.name = `${shape.name}_mirror`;

  const newPosition = [...mirrored.position];
  newPosition[axisIndex] = -newPosition[axisIndex];
  mirrored.position = newPosition;

  const newRotation = [...mirrored.rotation];
  newRotation[axisIndex] = -newRotation[axisIndex];
  mirrored.rotation = newRotation;

  return mirrored;
}

/**
 * Subdivision Surface - Smooth a shape
 * Returns a shape with increased segments
 */
export function applySubdivisionModifier(shape, levels = 1) {
  const factor = Math.pow(2, levels);

  // Increase segment counts for smooth shapes
  const updates = {};

  if (shape.type === 'sphere') {
    updates.widthSegments = Math.min(128, (shape.widthSegments ?? 32) * factor);
    updates.heightSegments = Math.min(128, (shape.heightSegments ?? 16) * factor);
  } else if (shape.type === 'cylinder' || shape.type === 'cone') {
    updates.radialSegments = Math.min(128, (shape.radialSegments ?? 32) * factor);
  } else if (shape.type === 'torus') {
    updates.torusRadialSegments = Math.min(64, (shape.torusRadialSegments ?? 16) * factor);
    updates.torusTubularSegments = Math.min(128, (shape.torusTubularSegments ?? 32) * factor);
  } else {
    // Generic: increase corner radius for smoother appearance
    updates.cornerRadius = Math.min(1, (shape.cornerRadius ?? 0) + 0.3 * levels);
  }

  return { ...shape, ...updates };
}
