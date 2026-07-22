/**
 * Vision3D - Store Tests
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { use3DStore } from '../store/use3DStore'

vi.mock('../utils/indexedDB', () => ({
  autoSave: vi.fn(),
  saveProject: vi.fn(),
  loadProject: vi.fn(),
}))

describe('Vision3D Store - Shape Operations', () => {
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
    } as any)
  })

  describe('Shape Properties', () => {
    it('should create shape with correct default properties', () => {
      const { addShape } = use3DStore.getState()
      addShape('box')
      const { shapes } = use3DStore.getState()
      const shape = shapes[0] as any

      expect(shape.id).toBeDefined()
      expect(shape.type).toBe('box')
      expect(shape.name).toBe('Box')
      expect(shape.position).toEqual([0, 1, 0])
      expect(shape.rotation).toEqual([0, 0, 0])
      expect(shape.scale).toEqual([1, 1, 1])
      expect(shape.color).toBe('#4F46E5')
      expect(shape.isHole).toBe(false)
      expect(shape.visible).toBe(true)
      expect(shape.locked).toBe(false)
      expect(shape.metalness).toBe(0.1)
      expect(shape.roughness).toBe(0.7)
      expect(shape.opacity).toBe(1)
    })

    it('should update multiple properties at once', () => {
      const { addShape, updateShape } = use3DStore.getState()
      addShape('box')
      const { shapes } = use3DStore.getState()
      const shapeId = (shapes[0] as any).id

      updateShape(shapeId, {
        color: '#ff0000',
        metalness: 0.5,
        roughness: 0.3,
        opacity: 0.8,
      })

      const { shapes: updatedShapes } = use3DStore.getState()
      const updatedShape = updatedShapes.find((s: any) => s.id === shapeId)
      expect(updatedShape?.color).toBe('#ff0000')
      expect(updatedShape?.metalness).toBe(0.5)
      expect(updatedShape?.roughness).toBe(0.3)
      expect(updatedShape?.opacity).toBe(0.8)
    })
  })

  describe('Multiple Shape Operations', () => {
    it('should handle adding multiple shapes', () => {
      const { addShape } = use3DStore.getState()
      addShape('box')
      addShape('sphere')
      addShape('cylinder')
      addShape('cone')
      const { shapes } = use3DStore.getState()
      expect(shapes).toHaveLength(4)
      const types = shapes.map((s: any) => s.type)
      expect(types).toContain('box')
      expect(types).toContain('sphere')
      expect(types).toContain('cylinder')
      expect(types).toContain('cone')
    })

    it('should remove multiple shapes', () => {
      const { addShape, removeShapes } = use3DStore.getState()
      addShape('box')
      addShape('sphere')
      addShape('cylinder')
      const { shapes } = use3DStore.getState()
      const idsToRemove = shapes.slice(0, 2).map((s: any) => s.id)
      removeShapes(idsToRemove)
      const { shapes: updatedShapes } = use3DStore.getState()
      expect(updatedShapes).toHaveLength(1)
    })

    it('should update multiple shapes at once', () => {
      const { addShape, updateShapes } = use3DStore.getState()
      addShape('box')
      addShape('sphere')
      const { shapes } = use3DStore.getState()
      const ids = shapes.map((s: any) => s.id)
      updateShapes(ids, { isHole: true })
      const { shapes: updatedShapes } = use3DStore.getState()
      updatedShapes.forEach((shape: any) => {
        if (ids.includes(shape.id)) {
          expect(shape.isHole).toBe(true)
        }
      })
    })
  })

  describe('Grid Snap', () => {
    it('should snap shapes to grid when adding', () => {
      const { addShape, setGridSnap } = use3DStore.getState()
      setGridSnap(0.5)
      addShape('box', [0.3, 0, 0.6])
      const { shapes } = use3DStore.getState()
      expect((shapes[0] as any).position[0]).toBe(0.5)
      expect((shapes[0] as any).position[2]).toBe(0.5)
    })

    it('should update grid snap setting', () => {
      const { setGridSnap } = use3DStore.getState()
      setGridSnap(0.25)
      expect(use3DStore.getState().gridSnap).toBe(0.25)
      setGridSnap(2.5)
      expect(use3DStore.getState().gridSnap).toBe(2.5)
    })
  })

  describe('Visibility and Lock', () => {
    it('should toggle visibility', () => {
      const { addShape, updateShape } = use3DStore.getState()
      addShape('box')
      const { shapes } = use3DStore.getState()
      const shapeId = (shapes[0] as any).id
      expect((shapes[0] as any).visible).toBe(true)
      updateShape(shapeId, { visible: false })
      expect((use3DStore.getState().shapes.find((s: any) => s.id === shapeId) as any).visible).toBe(false)
      updateShape(shapeId, { visible: true })
      expect((use3DStore.getState().shapes.find((s: any) => s.id === shapeId) as any).visible).toBe(true)
    })

    it('should toggle lock', () => {
      const { addShape, updateShape } = use3DStore.getState()
      addShape('box')
      const { shapes } = use3DStore.getState()
      const shapeId = (shapes[0] as any).id
      expect((shapes[0] as any).locked).toBe(false)
      updateShape(shapeId, { locked: true })
      expect((use3DStore.getState().shapes.find((s: any) => s.id === shapeId) as any).locked).toBe(true)
    })
  })

  describe('Selection Edge Cases', () => {
    it('should handle selecting non-existent shape', () => {
      const { selectShape } = use3DStore.getState()
      selectShape('non-existent-id')
      const { selectedIds } = use3DStore.getState()
      expect(selectedIds).toEqual(['non-existent-id'])
    })

    it('should handle deselecting non-selected shape', () => {
      const { addShape, selectShape } = use3DStore.getState()
      addShape('box')
      addShape('sphere')
      const { shapes } = use3DStore.getState()
      selectShape((shapes[0] as any).id)
      selectShape((shapes[0] as any).id, true)
      const { selectedIds } = use3DStore.getState()
      expect(selectedIds).toHaveLength(0)
    })
  })

  describe('Scene Management', () => {
    it('should set shapes directly', () => {
      const { setShapes } = use3DStore.getState()
      const customShapes = [
        {
          id: 'custom-1',
          type: 'box',
          name: 'Custom Box',
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          color: '#ff0000',
          isHole: false,
          visible: true,
          locked: false,
        },
      ]
      setShapes(customShapes)
      const { shapes } = use3DStore.getState()
      expect(shapes).toHaveLength(1)
      expect((shapes[0] as any).id).toBe('custom-1')
    })

    it('should track dirty state', () => {
      const { addShape } = use3DStore.getState()
      expect(use3DStore.getState().isProjectDirty).toBe(false)
      addShape('box')
      expect(use3DStore.getState().isProjectDirty).toBe(true)
    })
  })
})
