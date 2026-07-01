/**
 * Vision3D - Constants
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import { ShapeType } from '../types';

export interface ShapeDefinition {
  type: ShapeType;
  name: string;
  icon: string;
  category: 'basic' | 'extended' | 'text';
  defaults: Record<string, number | string | boolean>;
}

export const SHAPE_DEFINITIONS: ShapeDefinition[] = [
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
  position: [8, 6, 8] as [number, number, number],
  fov: 50,
  near: 0.1,
  far: 1000,
  target: [0, 0, 0] as [number, number, number],
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
} as const;
