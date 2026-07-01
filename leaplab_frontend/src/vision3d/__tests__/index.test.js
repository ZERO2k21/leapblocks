// @vitest-environment jsdom
/**
 * Vision3D - Test Cases
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { use3DStore } from '../store/use3DStore';
import { createShape, cloneShape, snapToGrid, snapPositionToGrid, generateShapeId } from '../utils/helpers';
import { SHAPE_DEFINITIONS } from '../utils/constants';

// Mock IndexedDB
const indexedDBMock = {
  open: vi.fn(() => ({
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null,
    result: {
      transaction: vi.fn(() => ({
        objectStore: vi.fn(() => ({
          put: vi.fn(() => ({ onsuccess: null, onerror: null })),
          get: vi.fn(() => ({ onsuccess: null, onerror: null })),
          getAll: vi.fn(() => ({ onsuccess: null, onerror: null })),
          delete: vi.fn(() => ({ onsuccess: null, onerror: null })),
          index: vi.fn(() => ({
            getAll: vi.fn(() => ({ onsuccess: null, onerror: null })),
            openCursor: vi.fn(() => ({ onsuccess: null, onerror: null })),
          })),
        })),
      })),
    },
  })),
};

Object.defineProperty(window, 'indexedDB', {
  value: indexedDBMock,
  writable: true,
});

describe('Vision3D Helpers', () => {
  describe('generateShapeId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateShapeId();
      const id2 = generateShapeId();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^shape_\d+_\d+$/);
    });
  });

  describe('createShape', () => {
    it('should create a box shape with default values', () => {
      const shape = createShape('box', [1, 2, 3]);
      expect(shape.type).toBe('box');
      expect(shape.position).toEqual([1, 2, 3]);
      expect(shape.rotation).toEqual([0, 0, 0]);
      expect(shape.scale).toEqual([1, 1, 1]);
      expect(shape.width).toBe(2);
      expect(shape.height).toBe(2);
      expect(shape.depth).toBe(2);
      expect(shape.isHole).toBe(false);
      expect(shape.visible).toBe(true);
    });

    it('should create a sphere shape with default values', () => {
      const shape = createShape('sphere');
      expect(shape.type).toBe('sphere');
      expect(shape.radius).toBe(1);
      expect(shape.widthSegments).toBe(32);
      expect(shape.heightSegments).toBe(16);
    });

    it('should create a cylinder shape with default values', () => {
      const shape = createShape('cylinder');
      expect(shape.type).toBe('cylinder');
      expect(shape.radiusTop).toBe(1);
      expect(shape.radiusBottom).toBe(1);
      expect(shape.cylinderHeight).toBe(2);
    });

    it('should create a cone shape with default values', () => {
      const shape = createShape('cone');
      expect(shape.type).toBe('cone');
      expect(shape.coneRadius).toBe(1);
      expect(shape.coneHeight).toBe(2);
    });

    it('should create a torus shape with default values', () => {
      const shape = createShape('torus');
      expect(shape.type).toBe('torus');
      expect(shape.torusRadius).toBe(1);
      expect(shape.tubeRadius).toBe(0.4);
    });

    it('should throw error for unknown shape type', () => {
      expect(() => createShape('unknown')).toThrow('Unknown shape type: unknown');
    });
  });

  describe('cloneShape', () => {
    it('should clone a shape with new ID', () => {
      const original = createShape('box', [1, 2, 3]);
      const clone = cloneShape(original);
      expect(clone.id).not.toBe(original.id);
      expect(clone.name).toBe(`${original.name}_copy`);
      expect(clone.position).toEqual(original.position);
      expect(clone.type).toBe(original.type);
    });

    it('should not share children with original', () => {
      const original = createShape('box');
      original.children = ['child1', 'child2'];
      const clone = cloneShape(original);
      expect(clone.children).toBeUndefined();
    });
  });

  describe('snapToGrid', () => {
    it('should snap to nearest grid point', () => {
      expect(snapToGrid(0.3, 0.5)).toBe(0.5);
      expect(snapToGrid(0.7, 0.5)).toBe(0.5);
      expect(snapToGrid(0.8, 0.5)).toBe(1.0);
      expect(snapToGrid(1.2, 1.0)).toBe(1.0);
      expect(snapToGrid(1.7, 1.0)).toBe(2.0);
    });

    it('should handle negative values', () => {
      expect(snapToGrid(-0.3, 0.5)).toBe(-0.5);
      expect(snapToGrid(-0.7, 0.5)).toBe(-0.5);
    });

    it('should handle zero', () => {
      expect(snapToGrid(0, 1.0)).toBe(0);
    });
  });

  describe('snapPositionToGrid', () => {
    it('should snap all coordinates', () => {
      const position = [0.3, 1.7, 2.4];
      const snapped = snapPositionToGrid(position, 0.5);
      expect(snapped).toEqual([0.5, 1.5, 2.5]);
    });
  });
});

describe('Vision3D Store', () => {
  beforeEach(() => {
    use3DStore.setState({
      shapes: [],
      selectedIds: [],
      activeTool: 'select',
      gridSnap: 1.0,
      showGrid: true,
      showAxes: true,
      history: [[]],
      historyIndex: 0,
      project: null,
      isProjectDirty: false,
    });
  });

  describe('addShape', () => {
    it('should add a shape to the store', () => {
      const { addShape } = use3DStore.getState();
      addShape('box', [1, 0, 1]);
      const { shapes, selectedIds } = use3DStore.getState();
      expect(shapes).toHaveLength(1);
      expect(shapes[0].type).toBe('box');
      expect(selectedIds).toHaveLength(1);
    });

    it('should snap position to grid', () => {
      const { addShape, setGridSnap } = use3DStore.getState();
      setGridSnap(0.5);
      addShape('box', [0.3, 0, 0.7]);
      const { shapes } = use3DStore.getState();
      expect(shapes[0].position[0]).toBe(0.5);
      expect(shapes[0].position[2]).toBe(0.5);
    });
  });

  describe('removeShape', () => {
    it('should remove a shape by ID', () => {
      const { addShape, removeShape } = use3DStore.getState();
      addShape('box');
      const { shapes } = use3DStore.getState();
      const shapeId = shapes[0].id;
      removeShape(shapeId);
      const { shapes: updatedShapes } = use3DStore.getState();
      expect(updatedShapes).toHaveLength(0);
    });

    it('should deselect removed shape', () => {
      const { addShape, removeShape } = use3DStore.getState();
      addShape('box');
      const { shapes, selectedIds } = use3DStore.getState();
      const shapeId = shapes[0].id;
      expect(selectedIds).toContain(shapeId);
      removeShape(shapeId);
      const { selectedIds: updatedSelectedIds } = use3DStore.getState();
      expect(updatedSelectedIds).not.toContain(shapeId);
    });
  });

  describe('selectShape', () => {
    it('should select a single shape', () => {
      const { addShape, selectShape } = use3DStore.getState();
      addShape('box');
      addShape('sphere');
      const { shapes } = use3DStore.getState();
      selectShape(shapes[0].id);
      const { selectedIds } = use3DStore.getState();
      expect(selectedIds).toEqual([shapes[0].id]);
    });

    it('should multi-select with shift', () => {
      const { addShape, selectShape } = use3DStore.getState();
      addShape('box');
      addShape('sphere');
      addShape('cone');
      const { shapes } = use3DStore.getState();
      selectShape(shapes[0].id);
      selectShape(shapes[1].id, true);
      selectShape(shapes[2].id, true);
      const { selectedIds } = use3DStore.getState();
      expect(selectedIds).toHaveLength(3);
    });

    it('should deselect when clicking same shape with shift', () => {
      const { addShape, selectShape } = use3DStore.getState();
      addShape('box');
      addShape('sphere');
      const { shapes } = use3DStore.getState();
      selectShape(shapes[0].id);
      selectShape(shapes[1].id, true);
      selectShape(shapes[1].id, true);
      const { selectedIds } = use3DStore.getState();
      expect(selectedIds).toHaveLength(1);
      expect(selectedIds).toContain(shapes[0].id);
    });
  });

  describe('deselectAll', () => {
    it('should deselect all shapes', () => {
      const { addShape, deselectAll } = use3DStore.getState();
      addShape('box');
      addShape('sphere');
      deselectAll();
      const { selectedIds } = use3DStore.getState();
      expect(selectedIds).toHaveLength(0);
    });
  });

  describe('updateShape', () => {
    it('should update shape properties', () => {
      const { addShape, updateShape } = use3DStore.getState();
      addShape('box');
      const { shapes } = use3DStore.getState();
      const shapeId = shapes[0].id;
      updateShape(shapeId, { color: '#ff0000', isHole: true });
      const { shapes: updatedShapes } = use3DStore.getState();
      const updatedShape = updatedShapes.find((s) => s.id === shapeId);
      expect(updatedShape?.color).toBe('#ff0000');
      expect(updatedShape?.isHole).toBe(true);
    });
  });

  describe('duplicateShapes', () => {
    it('should duplicate selected shapes', () => {
      const { addShape, duplicateShapes, selectShape } = use3DStore.getState();
      addShape('box');
      const { shapes } = use3DStore.getState();
      const shapeId = shapes[0].id;
      selectShape(shapeId);
      duplicateShapes([shapeId]);
      const { shapes: updatedShapes } = use3DStore.getState();
      expect(updatedShapes).toHaveLength(2);
      expect(updatedShapes[1].name).toBe('Box_copy');
    });
  });

  describe('setTool', () => {
    it('should change active tool', () => {
      const { setTool } = use3DStore.getState();
      setTool('move');
      expect(use3DStore.getState().activeTool).toBe('move');
      setTool('rotate');
      expect(use3DStore.getState().activeTool).toBe('rotate');
      setTool('scale');
      expect(use3DStore.getState().activeTool).toBe('scale');
    });
  });

  describe('groupShapes', () => {
    it('should group multiple shapes', () => {
      const { addShape, groupShapes } = use3DStore.getState();
      addShape('box', [0, 0, 0]);
      addShape('sphere', [2, 0, 0]);
      const { shapes } = use3DStore.getState();
      const ids = shapes.map((s) => s.id);
      groupShapes(ids);
      const { shapes: updatedShapes } = use3DStore.getState();
      const group = updatedShapes.find((s) => s.type === 'group');
      expect(group).toBeDefined();
      expect(group?.children).toEqual(ids);
    });

    it('should not group less than 2 shapes', () => {
      const { addShape, groupShapes } = use3DStore.getState();
      addShape('box');
      const { shapes } = use3DStore.getState();
      groupShapes([shapes[0].id]);
      const { shapes: updatedShapes } = use3DStore.getState();
      expect(updatedShapes.find((s) => s.type === 'group')).toBeUndefined();
    });
  });

  describe('alignShapes', () => {
    it('should align shapes to center on X axis', () => {
      const { addShape, alignShapes } = use3DStore.getState();
      addShape('box', [0, 0, 0]);
      addShape('sphere', [4, 0, 0]);
      const { shapes } = use3DStore.getState();
      const ids = shapes.map((s) => s.id);
      alignShapes(ids, 'x', 'center');
      const { shapes: updatedShapes } = use3DStore.getState();
      const xPositions = updatedShapes
        .filter((s) => ids.includes(s.id))
        .map((s) => s.position[0]);
      expect(xPositions[0]).toBe(xPositions[1]);
    });
  });

  describe('undo/redo', () => {
    it('should undo last action', () => {
      const { addShape, pushHistory, undo } = use3DStore.getState();
      pushHistory();
      addShape('box');
      pushHistory();
      undo();
      const { shapes } = use3DStore.getState();
      expect(shapes).toHaveLength(0);
    });

    it('should redo undone action', () => {
      const { addShape, pushHistory, undo, redo } = use3DStore.getState();
      pushHistory();
      addShape('box');
      pushHistory();
      undo();
      redo();
      const { shapes } = use3DStore.getState();
      expect(shapes).toHaveLength(1);
    });
  });

  describe('clearScene', () => {
    it('should remove all shapes', () => {
      const { addShape, clearScene } = use3DStore.getState();
      addShape('box');
      addShape('sphere');
      addShape('cone');
      clearScene();
      const { shapes, selectedIds } = use3DStore.getState();
      expect(shapes).toHaveLength(0);
      expect(selectedIds).toHaveLength(0);
    });
  });
});

describe('Vision3D Shape Definitions', () => {
  it('should have definitions for all basic shapes', () => {
    const basicShapes = SHAPE_DEFINITIONS.filter((d) => d.category === 'basic');
    expect(basicShapes.length).toBeGreaterThanOrEqual(5);
    const types = basicShapes.map((d) => d.type);
    expect(types).toContain('box');
    expect(types).toContain('cylinder');
    expect(types).toContain('sphere');
    expect(types).toContain('cone');
    expect(types).toContain('torus');
  });

  it('should have definitions for extended shapes', () => {
    const extendedShapes = SHAPE_DEFINITIONS.filter((d) => d.category === 'extended');
    expect(extendedShapes.length).toBeGreaterThanOrEqual(5);
    const types = extendedShapes.map((d) => d.type);
    expect(types).toContain('dodecahedron');
    expect(types).toContain('icosahedron');
    expect(types).toContain('octahedron');
    expect(types).toContain('tetrahedron');
    expect(types).toContain('ring');
  });

  it('each definition should have required properties', () => {
    SHAPE_DEFINITIONS.forEach((def) => {
      expect(def.type).toBeDefined();
      expect(def.name).toBeDefined();
      expect(def.icon).toBeDefined();
      expect(def.category).toBeDefined();
      expect(def.defaults).toBeDefined();
    });
  });
});
