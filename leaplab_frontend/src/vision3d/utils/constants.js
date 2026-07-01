/**
 * Vision3D - Constants
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

export const SHAPE_DEFINITIONS = [
  // Basic Shapes
  {
    type: 'box',
    name: 'Box',
    icon: '□',
    category: 'basic',
    defaults: { width: 2, height: 2, depth: 2, color: '#4F46E5' },
  },
  {
    type: 'cylinder',
    name: 'Cylinder',
    icon: '○',
    category: 'basic',
    defaults: { radiusTop: 1, radiusBottom: 1, cylinderHeight: 2, radialSegments: 32, color: '#14B8A6' },
  },
  {
    type: 'sphere',
    name: 'Sphere',
    icon: '●',
    category: 'basic',
    defaults: { radius: 1, widthSegments: 32, heightSegments: 16, color: '#F97316' },
  },
  {
    type: 'cone',
    name: 'Cone',
    icon: '△',
    category: 'basic',
    defaults: { coneRadius: 1, coneHeight: 2, radialSegments: 32, color: '#EC4899' },
  },
  {
    type: 'torus',
    name: 'Torus',
    icon: '◎',
    category: 'basic',
    defaults: { torusRadius: 1, tubeRadius: 0.4, torusRadialSegments: 16, torusTubularSegments: 32, color: '#8B5CF6' },
  },
  {
    type: 'roof',
    name: 'Roof',
    icon: '△',
    category: 'basic',
    defaults: { roofWidth: 2, roofDepth: 2, roofHeight: 1, color: '#F43F5E' },
  },
  {
    type: 'roundRoof',
    name: 'Round Roof',
    icon: '⌒',
    category: 'basic',
    defaults: { roundRoofWidth: 2, roundRoofDepth: 2, roundRoofHeight: 1, color: '#0EA5E9' },
  },
  {
    type: 'wedge',
    name: 'Wedge',
    icon: '△',
    category: 'basic',
    defaults: { wedgeWidth: 2, wedgeDepth: 2, wedgeHeight: 2, color: '#8B5CF6' },
  },
  {
    type: 'pyramid',
    name: 'Pyramid',
    icon: '△',
    category: 'basic',
    defaults: { pyramidRadius: 1, pyramidHeight: 2, pyramidSides: 4, color: '#F59E0B' },
  },
  {
    type: 'halfSphere',
    name: 'Half Sphere',
    icon: '◐',
    category: 'basic',
    defaults: { halfSphereRadius: 1, halfSphereSegments: 32, color: '#14B8A6' },
  },
  {
    type: 'paraboloid',
    name: 'Paraboloid',
    icon: '∩',
    category: 'basic',
    defaults: { paraboloidRadius: 1, paraboloidHeight: 2, paraboloidSegments: 32, color: '#06B6D4' },
  },
  {
    type: 'tube',
    name: 'Tube',
    icon: '◎',
    category: 'basic',
    defaults: { tubeOuterRadius: 1, tubeInnerRadius: 0.7, tubeHeight: 2, tubeRadialSegments: 32, color: '#D946EF' },
  },
  {
    type: 'star',
    name: 'Star',
    icon: '★',
    category: 'basic',
    defaults: { starOuterRadius: 1, starInnerRadius: 0.5, starPoints: 5, starHeight: 0.5, color: '#EAB308' },
  },
  {
    type: 'heart',
    name: 'Heart',
    icon: '♥',
    category: 'basic',
    defaults: { heartSize: 1, heartDepth: 0.5, color: '#EF4444' },
  },
  {
    type: 'polygon',
    name: 'Polygon',
    icon: '⬡',
    category: 'basic',
    defaults: { polygonRadius: 1, polygonSides: 6, polygonHeight: 2, color: '#A855F7' },
  },
  // Extended Shapes
  {
    type: 'dodecahedron',
    name: 'Dodecahedron',
    icon: '⬡',
    category: 'extended',
    defaults: { radius: 1, color: '#22C55E' },
  },
  {
    type: 'icosahedron',
    name: 'Icosahedron',
    icon: '⬢',
    category: 'extended',
    defaults: { radius: 1, color: '#EAB308' },
  },
  {
    type: 'octahedron',
    name: 'Octahedron',
    icon: '◇',
    category: 'extended',
    defaults: { radius: 1, color: '#EF4444' },
  },
  {
    type: 'tetrahedron',
    name: 'Tetrahedron',
    icon: '△',
    category: 'extended',
    defaults: { radius: 1, color: '#06B6D4' },
  },
  {
    type: 'ring',
    name: 'Ring',
    icon: '○',
    category: 'extended',
    defaults: { innerRadius: 0.5, outerRadius: 1, color: '#A855F7' },
  },
  // Text
  {
    type: 'text3d',
    name: '3D Text',
    icon: 'T',
    category: 'text',
    defaults: { text: 'Hello', fontSize: 1, color: '#1E293B' },
  },
  {
    type: 'group',
    name: 'Group',
    category: 'basic',
    icon: 'folder',
    defaults: {},
  },
];

export const DEFAULT_COLORS = [
  '#4F46E5', // Indigo
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#EC4899', // Pink
  '#8B5CF6', // Violet
  '#22C55E', // Green
  '#EAB308', // Yellow
  '#EF4444', // Red
  '#06B6D4', // Cyan
  '#A855F7', // Purple
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#6366F1', // Indigo dark
  '#F472B6', // Light pink
  '#84CC16', // Lime
];

export const GRID_PRESETS = [0.1, 0.25, 0.5, 1.0, 2.5, 5.0];

export const WORKPLANE_SIZE = 20;

export const CAMERA_DEFAULTS = {
  position: [8, 6, 8],
  fov: 50,
  near: 0.1,
  far: 1000,
  target: [0, 0, 0],
};

export const SNAP_THRESHOLD = 0.05;

export const KEYBOARD_SHORTCUTS = {
  DELETE: ['Delete', 'Backspace'],
  GROUP: ['Control', 'g'],
  UNGROUP: ['Control', 'Shift', 'g'],
  DUPLICATE: ['Control', 'd'],
  UNDO: ['Control', 'z'],
  REDO: ['Control', 'Shift', 'z'],
  SELECT_ALL: ['Control', 'a'],
  DESELECT: ['Escape'],
  MOVE_TOOL: ['g'],
  ROTATE_TOOL: ['r'],
  SCALE_TOOL: ['s'],
  SELECT_TOOL: ['v'],
};
