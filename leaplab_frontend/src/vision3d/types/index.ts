/**
 * Vision3D - Type Definitions
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

export type ShapeType =
  | 'box'
  | 'cylinder'
  | 'sphere'
  | 'cone'
  | 'torus'
  | 'dodecahedron'
  | 'icosahedron'
  | 'octahedron'
  | 'tetrahedron'
  | 'ring'
  | 'plane'
  | 'text3d'
  | 'group';

export type ActiveTool = 'select' | 'move' | 'rotate' | 'scale';

export type AlignAxis = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';

export interface Shape3D {
  id: string;
  type: ShapeType;
  name: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  isHole: boolean;
  visible: boolean;
  locked: boolean;
  children?: string[];
  parentId?: string;
  // Box specific
  width?: number;
  height?: number;
  depth?: number;
  // Cylinder specific
  radiusTop?: number;
  radiusBottom?: number;
  cylinderHeight?: number;
  radialSegments?: number;
  // Sphere specific
  radius?: number;
  widthSegments?: number;
  heightSegments?: number;
  // Cone specific
  coneRadius?: number;
  coneHeight?: number;
  // Torus specific
  torusRadius?: number;
  tubeRadius?: number;
  torusRadialSegments?: number;
  torusTubularSegments?: number;
  // Ring specific
  innerRadius?: number;
  outerRadius?: number;
  // Text specific
  text?: string;
  fontSize?: number;
  // Material properties
  metalness?: number;
  roughness?: number;
  opacity?: number;
}

export interface EditorState {
  shapes: Shape3D[];
  selectedIds: string[];
  activeTool: ActiveTool;
  gridSnap: number;
  showGrid: boolean;
  showAxes: boolean;
  cameraPosition: [number, number, number];
  // History for undo/redo
  history: Shape3D[][];
  historyIndex: number;
}

export interface ExportOptions {
  format: 'stl' | 'obj' | 'gltf' | 'glb';
  includeGrid: boolean;
  includeHidden: boolean;
}

export interface Project3D {
  id: string;
  name: string;
  shapes: Shape3D[];
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
}
