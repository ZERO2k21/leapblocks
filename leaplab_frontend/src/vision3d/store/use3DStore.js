/**
 * Vision3D - Zustand Store
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import { create } from 'zustand';
import { createShape, cloneShape, snapPositionToGrid } from '../utils/helpers';
import { autoSave, saveProject, loadProject } from '../utils/indexedDB';
import { performCSG, isCSGValid } from '../engine/CSGEngine';
import { log, debug, warn, error } from '../utils/logger';

const MAX_HISTORY = 50;

const GRID_PRESETS = [0, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0];

export const use3DStore = create((set, get) => ({
  // Initial state
  shapes: [],
  selectedIds: [],
  activeTool: 'select',
  gridSnap: 1.0,
  showGrid: true,
  showAxes: true,
  showShapePanel: true,
  showInspector: false,
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
        return { selectedIds: [], showInspector: false };
      }

      if (multi) {
        const isSelected = state.selectedIds.includes(id);
        const newIds = isSelected
          ? state.selectedIds.filter((sid) => sid !== id)
          : [...state.selectedIds, id];
        return {
          selectedIds: newIds,
          showInspector: newIds.length > 0,
        };
      }

      return { selectedIds: [id], showInspector: true };
    });
  },

  selectShapes: (ids) => {
    debug('selectShapes:', ids.length, 'shapes');
    set({ selectedIds: ids, showInspector: ids.length > 0 });
  },

  deselectAll: () => {
    debug('deselectAll');
    set({ selectedIds: [], showInspector: false });
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
  cycleGridSnap: () => {
    const current = get().gridSnap;
    const idx = GRID_PRESETS.indexOf(current);
    const next = GRID_PRESETS[(idx + 1) % GRID_PRESETS.length];
    log('cycleGridSnap:', current, '->', next);
    set({ gridSnap: next });
  },
  setShowGrid: (show) => {
    log('setShowGrid:', show);
    set({ showGrid: show });
  },
  setShowAxes: (show) => {
    log('setShowAxes:', show);
    set({ showAxes: show });
  },
  setShowShapePanel: (show) => set({ showShapePanel: show }),
  setShowInspector: (show) => set({ showInspector: show }),

  // Arrow key movement (TinkerCAD-style)
  moveShapesByArrow: (ids, axis, direction, fast) => {
    const state = get();
    const gridSnap = state.gridSnap || 1.0;
    const step = fast ? gridSnap * 10 : gridSnap;
    const delta = direction * step;
    const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;

    log('moveShapesByArrow:', ids.length, 'shapes, axis:', axis, 'delta:', delta);

    set((state) => ({
      shapes: state.shapes.map((s) => {
        if (ids.includes(s.id)) {
          const newPos = [...s.position];
          newPos[axisIndex] += delta;
          return { ...s, position: newPos };
        }
        return s;
      }),
      isProjectDirty: true,
    }));
  },

  // Hide/Show actions
  hideShapes: (ids) => {
    log('hideShapes:', ids.length, 'shapes');
    set((state) => ({
      shapes: state.shapes.map((s) =>
        ids.includes(s.id) ? { ...s, visible: false } : s
      ),
      isProjectDirty: true,
    }));
  },

  showAllHidden: () => {
    log('showAllHidden');
    set((state) => ({
      shapes: state.shapes.map((s) =>
        s.visible === false ? { ...s, visible: true } : s
      ),
      isProjectDirty: true,
    }));
  },

  // Lock/Unlock
  toggleLock: (ids) => {
    log('toggleLock:', ids.length, 'shapes');
    set((state) => ({
      shapes: state.shapes.map((s) =>
        ids.includes(s.id) ? { ...s, locked: !s.locked } : s
      ),
      isProjectDirty: true,
    }));
  },

  // Fit selection to view (stores target for camera)
  fitSelectionTarget: null,
  setFitSelection: (ids) => {
    const state = get();
    const selected = state.shapes.filter((s) => ids.includes(s.id));
    if (selected.length === 0) return;
    const center = selected.reduce(
      (acc, s) => [acc[0] + s.position[0], acc[1] + s.position[1], acc[2] + s.position[2]],
      [0, 0, 0]
    );
    center[0] /= selected.length;
    center[1] /= selected.length;
    center[2] /= selected.length;
    log('setFitSelection:', center);
    set({ fitSelectionTarget: center });
    setTimeout(() => set({ fitSelectionTarget: null }), 100);
  },

  // Group actions
  groupShapes: (ids) => {
    log('groupShapes:', ids.length, 'shapes');
    const state = get();
    const shapesToGroup = state.shapes.filter((s) => ids.includes(s.id));

    if (shapesToGroup.length < 2) return;

    const groupShape = createShape('group', [0, 0, 0]);
    groupShape.name = 'Group';
    groupShape.children = ids;

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

    let targetValue;
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
          const newPosition = [...s.position];
          newPosition[axisIndex] = targetValue;
          return { ...s, position: newPosition };
        }
        return s;
      }),
      isProjectDirty: true,
    }));
  },

  // Mirror actions
  mirrorShapes: (ids, axis) => {
    log('mirrorShapes:', ids.length, 'shapes, axis:', axis);
    const state = get();
    const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;

    set((state) => ({
      shapes: state.shapes.map((s) => {
        if (ids.includes(s.id)) {
          const newPosition = [...s.position];
          newPosition[axisIndex] = -newPosition[axisIndex];
          const newRotation = [...s.rotation];
          newRotation[axisIndex] = -newRotation[axisIndex];
          return { ...s, position: newPosition, rotation: newRotation };
        }
        return s;
      }),
      isProjectDirty: true,
    }));
  },

  // Drop to workplane
  dropToWorkplane: (ids) => {
    log('dropToWorkplane:', ids.length, 'shapes');
    set((state) => ({
      shapes: state.shapes.map((s) => {
        if (ids.includes(s.id)) {
          return { ...s, position: [s.position[0], 0, s.position[2]] };
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

  // ─── CSG Boolean Operations ───
  csgOperation: (operation) => {
    const state = get();
    const ids = state.selectedIds;
    if (ids.length < 2) {
      warn('CSG: need at least 2 selected shapes');
      return;
    }

    const shapes = state.shapes.filter((s) => ids.includes(s.id));
    if (!isCSGValid(shapes)) {
      warn('CSG: invalid selection (hidden or locked shapes)');
      return;
    }

    log('CSG:', operation, 'on', ids.length, 'shapes');
    const result = performCSG(shapes[0], shapes[1], operation);
    if (!result) {
      error('CSG: operation failed');
      return;
    }

    // Remove originals, add result
    set((state) => ({
      shapes: [
        ...state.shapes.filter((s) => !ids.includes(s.id)),
        result,
      ],
      selectedIds: [result.id],
      isProjectDirty: true,
    }));

    setTimeout(() => get().autoSaveProject(), 100);
  },

  // ─── Smart Duplicate with Repeat ───
  lastDuplicateTransform: null,

  smartDuplicate: (ids) => {
    const state = get();
    const shapesToDuplicate = state.shapes.filter((s) => ids.includes(s.id));

    // If we have a last duplicate transform, repeat it
    if (state.lastDuplicateTransform && state.lastDuplicateTransform.ids.length === ids.length) {
      const t = state.lastDuplicateTransform;
      const newShapes = shapesToDuplicate.map((s, i) => {
        const clone = cloneShape(s);
        clone.position = [
          s.position[0] + t.deltaX,
          s.position[1] + t.deltaY,
          s.position[2] + t.deltaZ,
        ];
        clone.rotation = [
          s.rotation[0] + t.rotDeltaX,
          s.rotation[1] + t.rotDeltaY,
          s.rotation[2] + t.rotDeltaZ,
        ];
        return clone;
      });

      const newIds = newShapes.map((s) => s.id);
      set((state) => ({
        shapes: [...state.shapes, ...newShapes],
        selectedIds: newIds,
        isProjectDirty: true,
      }));
      log('Smart duplicate: repeated transform');
      return newIds;
    }

    // First duplicate - offset by 2 on X
    const newShapes = shapesToDuplicate.map((s) => {
      const clone = cloneShape(s);
      clone.position = [s.position[0] + 2, s.position[1], s.position[2]];
      return clone;
    });

    const newIds = newShapes.map((s) => s.id);
    set((state) => ({
      shapes: [...state.shapes, ...newShapes],
      selectedIds: newIds,
      lastDuplicateTransform: {
        ids,
        deltaX: 2,
        deltaY: 0,
        deltaZ: 0,
        rotDeltaX: 0,
        rotDeltaY: 0,
        rotDeltaZ: 0,
      },
      isProjectDirty: true,
    }));

    log('Smart duplicate: first copy, offset +2 X');
    return newIds;
  },

  // Record transform delta for smart duplicate repeat
  recordTransformDelta: (ids, delta) => {
    set({ lastDuplicateTransform: { ids, ...delta } });
  },

  // ─── Camera Mode ───
  cameraMode: 'perspective',
  setCameraMode: (mode) => {
    log('setCameraMode:', mode);
    set({ cameraMode: mode });
  },
  toggleCameraMode: () => {
    const current = get().cameraMode;
    const next = current === 'perspective' ? 'orthographic' : 'perspective';
    log('toggleCameraMode:', current, '->', next);
    set({ cameraMode: next });
  },

  // ─── Temporary Workplane ───
  tempWorkplane: null,
  setTempWorkplane: (wp) => {
    log('setTempWorkplane:', wp);
    set({ tempWorkplane: wp });
  },
  clearTempWorkplane: () => {
    log('clearTempWorkplane');
    set({ tempWorkplane: null });
  },

  // ─── Marquee Selection ───
  marqueeActive: false,
  marqueeStart: null,
  marqueeEnd: null,

  startMarquee: (point) => {
    set({ marqueeActive: true, marqueeStart: point, marqueeEnd: point });
  },
  updateMarquee: (point) => {
    set({ marqueeEnd: point });
  },
  endMarquee: () => {
    set({ marqueeActive: false, marqueeStart: null, marqueeEnd: null });
  },

  // ─── Fit All ───
  fitAllTarget: null,
  setFitAll: () => {
    const state = get();
    if (state.shapes.length === 0) return;
    const center = state.shapes.reduce(
      (acc, s) => [acc[0] + s.position[0], acc[1] + s.position[1], acc[2] + s.position[2]],
      [0, 0, 0]
    );
    center[0] /= state.shapes.length;
    center[1] /= state.shapes.length;
    center[2] /= state.shapes.length;
    log('setFitAll:', center);
    set({ fitAllTarget: center });
    setTimeout(() => set({ fitAllTarget: null }), 100);
  },
}));
