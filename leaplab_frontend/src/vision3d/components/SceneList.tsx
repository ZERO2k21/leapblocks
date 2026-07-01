/**
 * Vision3D - Scene List Component
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import React from 'react';
import { use3DStore } from '../store/use3DStore';
import { Shape3D } from '../types';

const ShapeIcon: React.FC<{ type: Shape3D['type'] }> = ({ type }) => {
  const iconMap: Record<string, string> = {
    box: '□',
    cylinder: '○',
    sphere: '●',
    cone: '△',
    torus: '◎',
    dodecahedron: '⬡',
    icosahedron: '⬢',
    octahedron: '◇',
    tetrahedron: '△',
    ring: '○',
    plane: '▭',
    text3d: 'T',
    group: '⊞',
  };

  return <span className="shape-list-icon">{iconMap[type] || '?'}</span>;
};

export const SceneList: React.FC = () => {
  const shapes = use3DStore((s) => s.shapes);
  const selectedIds = use3DStore((s) => s.selectedIds);
  const selectShape = use3DStore((s) => s.selectShape);
  const updateShape = use3DStore((s) => s.updateShape);

  const handleShapeClick = (id: string, e: React.MouseEvent) => {
    selectShape(id, e.shiftKey);
  };

  const handleVisibilityToggle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const shape = shapes.find((s) => s.id === id);
    if (shape) {
      updateShape(id, { visible: !shape.visible });
    }
  };

  const handleLockToggle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const shape = shapes.find((s) => s.id === id);
    if (shape) {
      updateShape(id, { locked: !shape.locked });
    }
  };

  // Sort shapes: groups first, then by name
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
                    {shape.visible ? '👁' : '👁‍🗨'}
                  </button>
                  <button
                    className={`shape-list-btn ${shape.locked ? 'locked' : ''}`}
                    onClick={(e) => handleLockToggle(shape.id, e)}
                    title={shape.locked ? 'Unlock' : 'Lock'}
                  >
                    {shape.locked ? '🔒' : '🔓'}
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
