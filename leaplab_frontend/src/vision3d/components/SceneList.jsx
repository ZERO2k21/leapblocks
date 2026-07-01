/**
 * Vision3D - Scene List Component
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import React from 'react';
import { use3DStore } from '../store/use3DStore';
import { log, debug } from '../utils/logger';

const ShapeIcon = ({ type }) => {
  const iconMap = {
    box: '\u25A1',
    cylinder: '\u25CB',
    sphere: '\u25CF',
    cone: '\u25B3',
    torus: '\u25CE',
    dodecahedron: '\u2B21',
    icosahedron: '\u2B22',
    octahedron: '\u25C7',
    tetrahedron: '\u25B3',
    ring: '\u25CB',
    plane: '\u25AD',
    text3d: 'T',
    group: '\u229E',
  };

  return <span className="shape-list-icon">{iconMap[type] || '?'}</span>;
};

export const SceneList = () => {
  const shapes = use3DStore((s) => s.shapes);
  const selectedIds = use3DStore((s) => s.selectedIds);
  const selectShape = use3DStore((s) => s.selectShape);
  const updateShape = use3DStore((s) => s.updateShape);
  const removeShapes = use3DStore((s) => s.removeShapes);
  const pushHistory = use3DStore((s) => s.pushHistory);

  const handleShapeClick = (id, e) => {
    debug('SceneList: shapeClick id=' + id + ' shift=' + e.shiftKey);
    selectShape(id, e.shiftKey);
  };

  const handleVisibilityToggle = (id, e) => {
    e.stopPropagation();
    const shape = shapes.find((s) => s.id === id);
    if (shape) {
      log('SceneList: toggleVisibility id=' + id + ' visible=' + !shape.visible);
      updateShape(id, { visible: !shape.visible });
    }
  };

  const handleLockToggle = (id, e) => {
    e.stopPropagation();
    const shape = shapes.find((s) => s.id === id);
    if (shape) {
      log('SceneList: toggleLock id=' + id + ' locked=' + !shape.locked);
      updateShape(id, { locked: !shape.locked });
    }
  };

  const handleDeleteShape = (id, e) => {
    e.stopPropagation();
    log('SceneList: delete id=' + id);
    pushHistory();
    removeShapes([id]);
  };

  const sortedShapes = [...shapes].sort((a, b) => {
    if (a.type === 'group' && b.type !== 'group') return -1;
    if (a.type !== 'group' && b.type === 'group') return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="scene-list">
      <div className="scene-list-header">
        <h3>Scene</h3>
        <span className="shape-count">{shapes.length} objects</span>
      </div>

      <div className="scene-list-content">
        {sortedShapes.length === 0 ? (
          <div className="scene-empty">
            <p>No objects in scene</p>
            <p className="hint">Drag shapes from the panel or click to add</p>
          </div>
        ) : (
          <ul className="shape-list">
            {sortedShapes.map((shape) => (
              <li
                key={shape.id}
                className={`shape-list-item ${selectedIds.includes(shape.id) ? 'selected' : ''} ${!shape.visible ? 'hidden' : ''}`}
                onClick={(e) => handleShapeClick(shape.id, e)}
              >
                <div className="shape-list-info">
                  <ShapeIcon type={shape.type} />
                  <span className="shape-list-name">{shape.name}</span>
                </div>

                <div className="shape-list-actions">
                  <button
                    className={`shape-list-btn ${shape.visible ? '' : 'off'}`}
                    onClick={(e) => handleVisibilityToggle(shape.id, e)}
                    title={shape.visible ? 'Hide' : 'Show'}
                  >
                    {shape.visible ? '\uD83D\uDC41' : '\uD83D\uDC41\u200D\uD83D\uDDE3\uFE0F'}
                  </button>
                  <button
                    className={`shape-list-btn ${shape.locked ? 'locked' : ''}`}
                    onClick={(e) => handleLockToggle(shape.id, e)}
                    title={shape.locked ? 'Unlock' : 'Lock'}
                  >
                    {shape.locked ? '\uD83D\uDD12' : '\uD83D\uDD13'}
                  </button>
                  <button
                    className="shape-list-btn"
                    onClick={(e) => handleDeleteShape(shape.id, e)}
                    title="Delete"
                    style={{ color: '#ef4444' }}
                  >
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
