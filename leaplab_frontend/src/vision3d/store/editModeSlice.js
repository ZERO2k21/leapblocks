/**
 * Vision3D - Edit Mode Slice
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import { log } from '../utils/logger';

export const createEditModeSlice = (set, get) => ({
  editMode: 'object',
  editShapeId: null,
  selectedVertices: [],
  selectedEdges: [],
  selectedFaces: [],
  editTool: null,
  geometryCache: {},
  geometryVersion: 0,
  proportionalRadius: 2.0,

  setEditMode: (mode) => {
    const state = get();
    log('setEditMode:', mode, state.editMode, '->', mode);
    if (mode === state.editMode) return;
    if (mode === 'object') {
      set({
        editMode: 'object',
        editShapeId: null,
        selectedVertices: [],
        selectedEdges: [],
        selectedFaces: [],
        editTool: null,
        geometryCache: {},
      });
    } else {
      const wasInEdit = state.editMode !== 'object';
      const shapeId = state.selectedIds.length === 1 ? state.selectedIds[0] : null;
      set({
        editMode: mode,
        editShapeId: shapeId,
        selectedVertices: wasInEdit ? state.selectedVertices : [],
        selectedEdges: wasInEdit ? state.selectedEdges : [],
        selectedFaces: wasInEdit ? state.selectedFaces : [],
        editTool: null,
      });
    }
  },

  setEditTool: (tool) => {
    log('setEditTool:', tool);
    set({ editTool: tool });
  },

  setProportionalRadius: (radius) => {
    set({ proportionalRadius: Math.max(0.1, radius) });
  },

  selectVertex: (shapeId, index, multi = false) => {
    set((state) => {
      if (multi) {
        const exists = state.selectedVertices.find(v => v.shapeId === shapeId && v.index === index);
        return {
          selectedVertices: exists
            ? state.selectedVertices.filter(v => !(v.shapeId === shapeId && v.index === index))
            : [...state.selectedVertices, { shapeId, index }],
        };
      }
      return { selectedVertices: [{ shapeId, index }] };
    });
  },

  selectEdge: (shapeId, a, b, multi = false) => {
    set((state) => {
      const key = (e) => `${e.shapeId}:${Math.min(e.a, e.b)}-${Math.max(e.a, e.b)}`;
      const newEdge = { shapeId, a: Math.min(a, b), b: Math.max(a, b) };
      if (multi) {
        const exists = state.selectedEdges.find(e => key(e) === key(newEdge));
        return {
          selectedEdges: exists
            ? state.selectedEdges.filter(e => key(e) !== key(newEdge))
            : [...state.selectedEdges, newEdge],
        };
      }
      return { selectedEdges: [newEdge] };
    });
  },

  selectEdges: (edges, append = false) => {
    set((state) => {
      const key = (e) => `${e.shapeId}:${Math.min(e.a, e.b)}-${Math.max(e.a, e.b)}`;
      const formatted = edges.map(e => ({
        shapeId: e.shapeId,
        a: Math.min(e.a, e.b),
        b: Math.max(e.a, e.b)
      }));
      if (append) {
        const existingKeys = new Set(state.selectedEdges.map(key));
        const newEdges = formatted.filter(e => !existingKeys.has(key(e)));
        return { selectedEdges: [...state.selectedEdges, ...newEdges] };
      }
      return { selectedEdges: formatted };
    });
  },

  selectFace: (shapeId, index, multi = false) => {
    set((state) => {
      if (multi) {
        const exists = state.selectedFaces.find(f => f.shapeId === shapeId && f.index === index);
        return {
          selectedFaces: exists
            ? state.selectedFaces.filter(f => !(f.shapeId === shapeId && f.index === index))
            : [...state.selectedFaces, { shapeId, index }],
        };
      }
      return { selectedFaces: [{ shapeId, index }] };
    });
  },

  clearComponentSelection: () => {
    set({ selectedVertices: [], selectedEdges: [], selectedFaces: [] });
  },

  cacheGeometry: (shapeId, geometry) => {
    set((state) => ({
      geometryCache: { ...state.geometryCache, [shapeId]: geometry },
      geometryVersion: state.geometryVersion + 1,
    }));
  },

  removeCachedGeometry: (shapeId) => {
    set((state) => {
      const cache = { ...state.geometryCache };
      delete cache[shapeId];
      return { geometryCache: cache };
    });
  },

  applyGeometryEdit: (shapeId, newGeometry) => {
    const state = get();
    const shape = state.shapes.find(s => s.id === shapeId);
    if (!shape) return;
    set((s) => ({
      shapes: s.shapes.map(sh =>
        sh.id === shapeId ? { ...sh, _customGeometry: newGeometry } : sh
      ),
      geometryCache: { ...s.geometryCache, [shapeId]: newGeometry },
      geometryVersion: s.geometryVersion + 1,
      isProjectDirty: true,
    }));
    get().pushHistory();
  },
});
