/**
 * Vision3D - Constants
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

export interface ShapeDefaults {
  width?: number
  height?: number
  depth?: number
  color?: string
  cornerRadius?: number
  radiusTop?: number
  radiusBottom?: number
  cylinderHeight?: number
  radialSegments?: number
  taper?: number
  radius?: number
  widthSegments?: number
  heightSegments?: number
  coneRadius?: number
  coneHeight?: number
  torusRadius?: number
  tubeRadius?: number
  torusRadialSegments?: number
  torusTubularSegments?: number
  roofWidth?: number
  roofDepth?: number
  roofHeight?: number
  roundRoofWidth?: number
  roundRoofDepth?: number
  roundRoofHeight?: number
  wedgeWidth?: number
  wedgeDepth?: number
  wedgeHeight?: number
  pyramidRadius?: number
  pyramidHeight?: number
  pyramidSides?: number
  halfSphereRadius?: number
  halfSphereSegments?: number
  paraboloidRadius?: number
  paraboloidHeight?: number
  paraboloidSegments?: number
  tubeOuterRadius?: number
  tubeInnerRadius?: number
  tubeHeight?: number
  tubeRadialSegments?: number
  starOuterRadius?: number
  starInnerRadius?: number
  starPoints?: number
  starHeight?: number
  heartSize?: number
  heartDepth?: number
  polygonRadius?: number
  polygonSides?: number
  polygonHeight?: number
  innerRadius?: number
  outerRadius?: number
  text?: string
  fontSize?: number
  textDepth?: number
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: [number, number, number]
}

export interface ShapeDefinition {
  type: string
  name: string
  icon: string
  category: string
  defaults: ShapeDefaults
}

export const SHAPE_DEFINITIONS: ShapeDefinition[] = [
  {
    type: 'box',
    name: 'Box',
    icon: '□',
    category: 'basic',
    defaults: { width: 2, height: 2, depth: 2, color: '#4F46E5', cornerRadius: 0 },
  },
  {
    type: 'cylinder',
    name: 'Cylinder',
    icon: '○',
    category: 'basic',
    defaults: { radiusTop: 1, radiusBottom: 1, cylinderHeight: 2, radialSegments: 32, color: '#14B8A6', taper: 0 },
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
  {
    type: 'text3d',
    name: '3D Text',
    icon: 'T',
    category: 'text',
    defaults: {
      text: 'Hello',
      fontSize: 1,
      textDepth: 0.5,
      color: '#1E293B',
      position: [2.0, 1.0, 1.0],
      rotation: [0.0, 0.0, 0.0],
      scale: [1.0, 1.0, 0.01],
    },
  },
  {
    type: 'group',
    name: 'Group',
    category: 'internal',
    icon: 'folder',
    defaults: {},
  },
]

export const DEFAULT_COLORS: string[] = [
  '#4F46E5',
  '#14B8A6',
  '#F97316',
  '#EC4899',
  '#8B5CF6',
  '#22C55E',
  '#EAB308',
  '#EF4444',
  '#06B6D4',
  '#A855F7',
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#6366F1',
  '#F472B6',
  '#84CC16',
]

export const GRID_PRESETS: number[] = [0.1, 0.25, 0.5, 1.0, 2.5, 5.0]

export const WORKPLANE_SIZE = 20

export const CAMERA_DEFAULTS: {
  position: [number, number, number]
  fov: number
  near: number
  far: number
  target: [number, number, number]
} = {
  position: [8, 6, 8],
  fov: 50,
  near: 0.1,
  far: 1000,
  target: [0, 0, 0],
}

export const SNAP_THRESHOLD = 0.05

export const KEYBOARD_SHORTCUTS: Record<string, string[]> = {
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
}
