/**
 * Vision3D - Zustand Store
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import { create } from 'zustand';
import { Shape3D, ActiveTool, EditorState, Project3D } from '../types';
import { createShape, cloneShape, snapPositionToGrid, generateShapeId } from '../utils/helpers';
import { ShapeType } from '../types';
import { autoSave, saveProject, loadProject } from '../utils/indexedDB';
import * as log from '../utils/logger';

interface StoreState extends EditorState {
  project: Project3D | null;
  isProjectDirty: boolean;

  // Shape actions
  addShape: (type: ShapeType, position?: [number, number, number]) => string;
  removeShape: (id: string) => void;
  removeShapes: (ids: string[]) => void;
  selectShape: (id: string | null, multi?: boolean) => void;
  selectShapes: (ids: string[]) => void;
  deselectAll: () => void;
  updateShape: (id: string, updates: Partial<Shape3D>) => void;
  updateShapes: (ids: string[], updates: Partial<Shape3D>) => void;
  duplicateShapes: (ids: string[]) => string[];

  // Tool actions
  setTool: (tool: ActiveTool) => void;
  setGridSnap: (size: number) => void;
  setShowGrid: (show: boolean) => void;
  setShowAxes: (show: boolean) => void;

  // Group actions
  groupShapes: (ids: string[]) => void;
  ungroupShape: (id: string) => void;

  // Align actions
  alignShapes: (ids: string[], axis: 'x' | 'y' | 'z', mode: 'min' | 'center' | 'max') => void;

  // History actions
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;

  // Project actions
  setProject: (project: Project3D) => void;
  loadProjectFromDB: (projectId: string) => Promise<void>;
  autoSaveProject: () => void;

  // Bulk actions
  setShapes: (shapes: Shape3D[]) => void;
  clearScene: () => void;
}

const MAX_HISTORY = 50;

export const use3DStore = create<StoreState>((set, get) => ({
  // Initial state
  shapes: [],
  selectedIds: [],
  activeTool: 'select',
  gridSnap: 1.0,
  showGrid: true,
  showAxes: true,
  cameraPosition: [8, 6, 8],
  history: [[]],
  historyIndex: 0,
  project: null,
  isProjectDirty: false,

  // Shape actions
  addShape: (type, position = [0, 1, 0]) => {
    const state = get();
    const snappedPosition = snapPositionToGrid(position, state.gridSnap);
    const newShape = createShape(type, snappedPosition);
    log('addShape:', type, '-> id:', newShape.id, 'pos:', snappedPosition);

    set((state) => ({
      shapes: [...state.shapes, newShape],
      selectedIds: [newShape.id],
      isProjectDirty: true,
    }));

    // Auto-save
    setTimeout(() => get().autoSaveProject(), 100);

    return newShape.id;
  },

  removeShape: (id) => {
    const shape = get().shapes.find((s) => s.id === id);
    log('removeShape:', id, shape ? `(${shape.name})` : '(not found)');
    set((state) => ({
      shapes: state.shapes.filter((s) => s.id !== id),
      selectedIds: state.selectedIds.filter((sid) => sid !== id),
      isProjectDirty: true,
    }));
    setTimeout(() => get().autoSaveProject(), 100);
  },

  removeShapes: (ids) => {
    log('removeShapes:', ids.length, 'shapes');
    set((state) => ({
      shapes: state.shapes.filter((s) => !ids.includes(s.id)),
      selectedIds: [],
      isProjectDirty: true,
    }));
    setTimeout(() => get().autoSaveProject(), 100);
  },

  selectShape: (id, multi = false) => {
    debug('selectShape:', id, multi ? '(multi)' : '(single)');
    set((state) => {
      if (id === null) {
        return { selectedIds: [] };
      }

      if (multi) {
        const isSelected = state.selectedIds.includes(id);
        return {
          selectedIds: isSelected
            ? state.selectedIds.filter((sid) => sid !== id)
            : [...state.selectedIds, id],
        };
      }

      return { selectedIds: [id] };
    });
  },

  selectShapes: (ids) => {
    debug('selectShapes:', ids.length, 'shapes');
    set({ selectedIds: ids });
  },

  deselectAll: () => {
    debug('deselectAll');
    set({ selectedIds: [] });
  },

  updateShape: (id, updates) => {
    const keys = Object.keys(updates).join(', ');
    debug('updateShape:', id, '->', keys);
    set((state) => ({
      shapes: state.shapes.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      isProjectDirty: true,
    }));
  },

  updateShapes: (ids, updates) => {
    const keys = Object.keys(updates).join(', ');
    log('updateShapes:', ids.length, 'shapes ->', keys);
    set((state) => ({
      shapes: state.shapes.map((s) =>
        ids.includes(s.id) ? { ...s, ...updates } : s
      ),
      isProjectDirty: true,
    }));
  },

  duplicateShapes: (ids) => {
    log('duplicateShapes:', ids.length, 'shapes');
    const state = get();
    const shapesToDuplicate = state.shapes.filter((s) => ids.includes(s.id));
    const newShapes = shapesToDuplicate.map((s) => {
      const clone = cloneShape(s);
      // Offset slightly
      clone.position = [
        clone.position[0] + 2,
        clone.position[1],
        clone.position[2],
      ];
      return clone;
    });

    const newIds = newShapes.map((s) => s.id);

    set((state) => ({
      shapes: [...state.shapes, ...newShapes],
      selectedIds: newIds,
      isProjectDirty: true,
    }));

    return newIds;
  },

  // Tool actions
  setTool: (tool) => {
    log('setTool:', tool);
    set({ activeTool: tool });
  },
  setGridSnap: (size) => {
    log('setGridSnap:', size);
    set({ gridSnap: size });
  },
  setShowGrid: (show) => {
    log('setShowGrid:', show);
    set({ showGrid: show });
  },
  setShowAxes: (show) => {
    log('setShowAxes:', show);
    set({ showAxes: show });
  },

  // Group actions
  groupShapes: (ids) => {
    log('groupShapes:', ids.length, 'shapes');
    const state = get();
    const shapesToGroup = state.shapes.filter((s) => ids.includes(s.id));

    if (shapesToGroup.length < 2) return;

    // Create a group shape
    const groupShape = createShape('group', [0, 0, 0]);
    groupShape.name = 'Group';
    groupShape.children = ids;

    // Calculate group center
    const centerX =
      shapesToGroup.reduce((sum, s) => sum + s.position[0], 0) /
      shapesToGroup.length;
    const centerY =
      shapesToGroup.reduce((sum, s) => sum + s.position[1], 0) /
      shapesToGroup.length;
    const centerZ =
      shapesToGroup.reduce((sum, s) => sum + s.position[2], 0) /
      shapesToGroup.length;

    groupShape.position = [centerX, centerY, centerZ];

    // Update children to reference parent
    const updatedShapes = state.shapes.map((s) => {
      if (ids.includes(s.id)) {
        return { ...s, parentId: groupShape.id };
      }
      return s;
    });

    set((state) => ({
      shapes: [...updatedShapes, groupShape],
      selectedIds: [groupShape.id],
      isProjectDirty: true,
    }));
  },

  ungroupShape: (id) => {
    log('ungroupShape:', id);
    const state = get();
    const shape = state.shapes.find((s) => s.id === id);

    if (!shape || shape.type !== 'group' || !shape.children) return;

    set((state) => ({
      shapes: state.shapes
        .filter((s) => s.id !== id)
        .map((s) => {
          if (s.parentId === id) {
            return { ...s, parentId: undefined };
          }
          return s;
        }),
      selectedIds: shape.children,
      isProjectDirty: true,
    }));
  },

  // Align actions
  alignShapes: (ids, axis, mode) => {
    log('alignShapes:', ids.length, 'shapes, axis:', axis, 'mode:', mode);
    const state = get();
    const shapesToAlign = state.shapes.filter((s) => ids.includes(s.id));

    if (shapesToAlign.length < 2) return;

    let targetValue: number;
    const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;

    if (mode === 'min') {
      targetValue = Math.min(
        ...shapesToAlign.map((s) => s.position[axisIndex])
      );
    } else if (mode === 'max') {
      targetValue = Math.max(
        ...shapesToAlign.map((s) => s.position[axisIndex])
      );
    } else {
      targetValue =
        shapesToAlign.reduce((sum, s) => sum + s.position[axisIndex], 0) /
        shapesToAlign.length;
    }

    set((state) => ({
      shapes: state.shapes.map((s) => {
        if (ids.includes(s.id)) {
          const newPosition: [number, number, number] = [...s.position];
          newPosition[axisIndex] = targetValue;
          return { ...s, position: newPosition };
        }
        return s;
      }),
      isProjectDirty: true,
    }));
  },

  // History actions
  pushHistory: () => {
    debug('pushHistory');
    const state = get();
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(state.shapes)));

    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift();
    }

    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  undo: () => {
    const state = get();
    if (state.historyIndex > 0) {
      log('undo: index', state.historyIndex, '->', state.historyIndex - 1);
      const newIndex = state.historyIndex - 1;
      set({
        shapes: JSON.parse(JSON.stringify(state.history[newIndex])),
        historyIndex: newIndex,
        selectedIds: [],
      });
    }
  },

  redo: () => {
    const state = get();
    if (state.historyIndex < state.history.length - 1) {
      log('redo: index', state.historyIndex, '->', state.historyIndex + 1);
      const newIndex = state.historyIndex + 1;
      set({
        shapes: JSON.parse(JSON.stringify(state.history[newIndex])),
        historyIndex: newIndex,
        selectedIds: [],
      });
    }
  },

  // Project actions
  setProject: (project) => {
    log('setProject:', project.id, project.name);
    set({ project });
    saveProject(project);
  },

  loadProjectFromDB: async (projectId) => {
    log('loadProjectFromDB:', projectId);
    try {
      const project = await loadProject(projectId);
      if (project) {
        set({ project });
        log('loadProjectFromDB: loaded', project.name);
      } else {
        warn('loadProjectFromDB: project not found:', projectId);
      }
    } catch (err) {
      error('Failed to load project:', err);
    }
  },

  autoSaveProject: () => {
    const state = get();
    if (state.project) {
      debug('autoSaveProject: saving', state.shapes.length, 'shapes');
      autoSave(state.project, state.shapes);
    }
  },

  // Bulk actions
  setShapes: (shapes) => {
    log('setShapes:', shapes.length, 'shapes');
    set({ shapes, isProjectDirty: true });
  },

  clearScene: () => {
    log('clearScene');
    set({
      shapes: [],
      selectedIds: [],
      isProjectDirty: true,
    });
    setTimeout(() => get().autoSaveProject(), 100);
  },
}));
