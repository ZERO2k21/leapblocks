/**
 * Vision3D - Helper Utilities
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import * as THREE from 'three';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { SHAPE_DEFINITIONS } from './constants';
import { debug } from './logger';
import helvetikerFont from '../assets/helvetiker_regular.typeface.json';

const fontLoader = new FontLoader();
const defaultFont = fontLoader.parse(helvetikerFont);

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
    // Box
    width: defaults.width,
    height: defaults.height,
    depth: defaults.depth,
    cornerRadius: defaults.cornerRadius || 0,
    // Cylinder
    radiusTop: defaults.radiusTop,
    radiusBottom: defaults.radiusBottom,
    cylinderHeight: defaults.cylinderHeight,
    radialSegments: defaults.radialSegments,
    taper: defaults.taper || 0,
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
    // Roof
    roofWidth: defaults.roofWidth,
    roofDepth: defaults.roofDepth,
    roofHeight: defaults.roofHeight,
    // Round Roof
    roundRoofWidth: defaults.roundRoofWidth,
    roundRoofDepth: defaults.roundRoofDepth,
    roundRoofHeight: defaults.roundRoofHeight,
    // Wedge
    wedgeWidth: defaults.wedgeWidth,
    wedgeDepth: defaults.wedgeDepth,
    wedgeHeight: defaults.wedgeHeight,
    // Pyramid
    pyramidRadius: defaults.pyramidRadius,
    pyramidHeight: defaults.pyramidHeight,
    pyramidSides: defaults.pyramidSides,
    // Half Sphere
    halfSphereRadius: defaults.halfSphereRadius,
    halfSphereSegments: defaults.halfSphereSegments,
    // Paraboloid
    paraboloidRadius: defaults.paraboloidRadius,
    paraboloidHeight: defaults.paraboloidHeight,
    paraboloidSegments: defaults.paraboloidSegments,
    // Tube
    tubeOuterRadius: defaults.tubeOuterRadius,
    tubeInnerRadius: defaults.tubeInnerRadius,
    tubeHeight: defaults.tubeHeight,
    tubeRadialSegments: defaults.tubeRadialSegments,
    // Star
    starOuterRadius: defaults.starOuterRadius,
    starInnerRadius: defaults.starInnerRadius,
    starPoints: defaults.starPoints,
    starHeight: defaults.starHeight,
    // Heart
    heartSize: defaults.heartSize,
    heartDepth: defaults.heartDepth,
    // Polygon
    polygonRadius: defaults.polygonRadius,
    polygonSides: defaults.polygonSides,
    polygonHeight: defaults.polygonHeight,
    // Ring
    innerRadius: defaults.innerRadius,
    outerRadius: defaults.outerRadius,
    // Text
    text: defaults.text,
    fontSize: defaults.fontSize,
    textDepth: defaults.textDepth,
    // Material
    metalness: 0.1,
    roughness: 0.7,
    opacity: 1,
  };
}

export function createGeometry(shape) {
  debug('createGeometry:', shape.type, shape.id);
  switch (shape.type) {
    case 'box': {
      const w = shape.width ?? 2;
      const h = shape.height ?? 2;
      const d = shape.depth ?? 2;
      const r = shape.cornerRadius ?? 0;
      if (r > 0) {
        const hw = w / 2, hh = h / 2, hd = d / 2;
        const cr = Math.min(r, hw, hh, hd);
        const shape2d = new THREE.Shape();
        shape2d.moveTo(-hw + cr, -hh);
        shape2d.lineTo(hw - cr, -hh);
        shape2d.quadraticCurveTo(hw, -hh, hw, -hh + cr);
        shape2d.lineTo(hw, hh - cr);
        shape2d.quadraticCurveTo(hw, hh, hw - cr, hh);
        shape2d.lineTo(-hw + cr, hh);
        shape2d.quadraticCurveTo(-hw, hh, -hw, hh - cr);
        shape2d.lineTo(-hw, -hh + cr);
        shape2d.quadraticCurveTo(-hw, -hh, -hw + cr, -hh);
        const geo = new THREE.ExtrudeGeometry(shape2d, { depth: d, bevelEnabled: false });
        geo.translate(0, 0, -hd);
        return geo;
      }
      return new THREE.BoxGeometry(w, h, d);
    }

    case 'cylinder': {
      const rTop = shape.radiusTop ?? 1;
      const rBot = shape.radiusBottom ?? 1;
      const taperAmount = shape.taper ?? 0;
      const cylH = shape.cylinderHeight ?? 2;
      const segs = shape.radialSegments ?? 32;
      if (taperAmount !== 0) {
        const t = taperAmount / 100;
        return new THREE.CylinderGeometry(
          rTop * (1 + t),
          rBot * (1 - t),
          cylH,
          segs
        );
      }
      return new THREE.CylinderGeometry(rTop, rBot, cylH, segs);
    }

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

    case 'roof': {
      const w = shape.roofWidth ?? 2;
      const d = shape.roofDepth ?? 2;
      const h = shape.roofHeight ?? 1;
      const geo = new THREE.BufferGeometry();
      const hw = w / 2, hd = d / 2;
      const vertices = new Float32Array([
        -hw, 0, -hd,   hw, 0, -hd,   hw, 0,  hd,
        -hw, 0, -hd,   hw, 0,  hd,  -hw, 0,  hd,
        -hw, 0, -hd,   hw, 0, -hd,   0,  h,  0,
         hw, 0, -hd,   hw, 0,  hd,   0,  h,  0,
         hw, 0,  hd,  -hw, 0,  hd,   0,  h,  0,
        -hw, 0,  hd,  -hw, 0, -hd,   0,  h,  0,
      ]);
      geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      geo.computeVertexNormals();
      return geo;
    }

    case 'roundRoof': {
      const w = shape.roundRoofWidth ?? 2;
      const d = shape.roundRoofDepth ?? 2;
      const h = shape.roundRoofHeight ?? 1;
      const geo = new THREE.CylinderGeometry(d / 2, d / 2, w, 32, 1, false, 0, Math.PI);
      geo.rotateZ(Math.PI / 2);
      geo.scale(1, h / (d / 2), 1);
      return geo;
    }

    case 'wedge': {
      const w = shape.wedgeWidth ?? 2;
      const d = shape.wedgeDepth ?? 2;
      const h = shape.wedgeHeight ?? 2;
      const geo = new THREE.BufferGeometry();
      const hw = w / 2, hd = d / 2;
      const vertices = new Float32Array([
        -hw, 0, -hd,   hw, 0, -hd,   hw, 0,  hd,
        -hw, 0, -hd,   hw, 0,  hd,  -hw, 0,  hd,
        -hw, 0, -hd,   hw, 0, -hd,   hw,  h, -hd,
        -hw, 0, -hd,   hw,  h, -hd,  -hw,  h, -hd,
         hw, 0, -hd,   hw, 0,  hd,   hw,  h, -hd,
        -hw, 0,  hd,  -hw,  h, -hd,   hw, 0,  hd,
        -hw, 0, -hd,  -hw, 0,  hd,  -hw,  h, -hd,
        -hw, 0,  hd,   hw, 0,  hd,   0,  h, -hd,
      ]);
      geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      geo.computeVertexNormals();
      return geo;
    }

    case 'pyramid':
      return new THREE.ConeGeometry(
        shape.pyramidRadius ?? 1,
        shape.pyramidHeight ?? 2,
        shape.pyramidSides ?? 4
      );

    case 'halfSphere': {
      const r = shape.halfSphereRadius ?? 1;
      const segs = shape.halfSphereSegments ?? 32;
      const geo = new THREE.SphereGeometry(r, segs, segs / 2, 0, Math.PI * 2, 0, Math.PI / 2);
      return geo;
    }

    case 'paraboloid': {
      const r = shape.paraboloidRadius ?? 1;
      const h = shape.paraboloidHeight ?? 2;
      const segs = shape.paraboloidSegments ?? 32;
      const pts = [];
      for (let i = 0; i <= 20; i++) {
        const t = i / 20;
        const y = t * h;
        const radius = r * Math.sqrt(t);
        pts.push(new THREE.Vector2(radius, y));
      }
      return new THREE.LatheGeometry(pts, segs);
    }

    case 'tube':
      return new THREE.CylinderGeometry(
        shape.tubeOuterRadius ?? 1,
        shape.tubeOuterRadius ?? 1,
        shape.tubeHeight ?? 2,
        shape.tubeRadialSegments ?? 32,
        1,
        true,
        0,
        Math.PI * 2
      );

    case 'star': {
      const outer = shape.starOuterRadius ?? 1;
      const inner = shape.starInnerRadius ?? 0.5;
      const points = shape.starPoints ?? 5;
      const height = shape.starHeight ?? 0.5;
      const shape2d = new THREE.Shape();
      for (let i = 0; i < points * 2; i++) {
        const angle = (i * Math.PI) / points - Math.PI / 2;
        const r = i % 2 === 0 ? outer : inner;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) shape2d.moveTo(x, y);
        else shape2d.lineTo(x, y);
      }
      shape2d.closePath();
      return new THREE.ExtrudeGeometry(shape2d, { depth: height, bevelEnabled: false });
    }

    case 'heart': {
      const s = shape.heartSize ?? 1;
      const depth = shape.heartDepth ?? 0.5;
      const shape2d = new THREE.Shape();
      shape2d.moveTo(0, -s * 0.7);
      shape2d.bezierCurveTo(-s * 1.0, -s * 0.3, -s * 1.0, s * 0.6, 0, s * 0.3);
      shape2d.bezierCurveTo(s * 1.0, s * 0.6, s * 1.0, -s * 0.3, 0, -s * 0.7);
      return new THREE.ExtrudeGeometry(shape2d, { depth, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 3 });
    }

    case 'polygon': {
      const r = shape.polygonRadius ?? 1;
      const sides = shape.polygonSides ?? 6;
      const h = shape.polygonHeight ?? 2;
      return new THREE.CylinderGeometry(r, r, h, sides);
    }

    case 'dodecahedron':
      return new THREE.DodecahedronGeometry(shape.radius ?? 1);

    case 'icosahedron':
      return new THREE.IcosahedronGeometry(shape.radius ?? 1);

    case 'octahedron':
      return new THREE.OctahedronGeometry(shape.radius ?? 1);

    case 'tetrahedron':
      return new THREE.TetrahedronGeometry(shape.radius ?? 1);

    case 'text3d': {
      const text = shape.text || 'Hello';
      const size = shape.fontSize ?? 1;
      const depth = shape.textDepth ?? 0.5;
      const geo = new TextGeometry(text, {
        font: defaultFont,
        size,
        height: depth,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.02,
        bevelSegments: 5,
      });
      geo.computeBoundingBox();
      geo.center();
      return geo;
    }

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
