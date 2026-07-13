/**
 * Vision3D - Scene List Component
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import React from 'react';
import { use3DStore } from '../store/use3DStore';
import { log, debug } from '../utils/logger';

const ShapeIcon = ({ type }) => {
  const iconMap = {
    box: '⬜',
    cylinder: '⚪',
    sphere: '🔵',
    cone: '🔺',
    torus: '🍩',
    dodecahedron: '💎',
    icosahedron: '💠',
    octahedron: '🔶',
    tetrahedron: '📐',
    ring: '⭕',
    plane: '🟩',
    text3d: '🔤',
    group: '📦',
  };

  return <span className="text-base mr-2 flex-none">{iconMap[type] || '❓'}</span>;
};

export const SceneList = () => {
  const shapes = use3DStore((s) => s.shapes);
  const selectedIds = use3DStore((s) => s.selectedIds);
  const selectShape = use3DStore((s) => s.selectShape);
  const updateShape = use3DStore((s) => s.updateShape);
  const removeShapes = use3DStore((s) => s.removeShapes);
  const pushHistory = use3DStore((s) => s.pushHistory);

  const handleShapeClick = (id, e) => {
    const multi = e.shiftKey || e.ctrlKey;
    debug('SceneList: shapeClick id=' + id + ' multi=' + multi);
    selectShape(id, multi);
  };

  const handleCheckboxChange = (id) => {
    selectShape(id, true);
    // Also show inspector
    use3DStore.setState({ showInspector: true });
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
    <div className="flex flex-col h-full bg-white select-none">
      <div className="flex items-center justify-between border-b border-slate-200" style={{ padding: '16px 20px' }}>
        <h3 className="m-0 text-[14px] font-extrabold text-slate-800 font-sans tracking-tight">Scene</h3>
        <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">{shapes.length} objects</span>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ padding: '16px 20px 20px 20px' }}>
        {sortedShapes.length === 0 ? (
          <div className="p-6 text-center">
            <p className="m-0 text-[13px] font-medium text-slate-400">No objects in scene</p>
            <p className="text-[11px] mt-1 text-slate-400">Drag shapes or click to add objects!</p>
          </div>
        ) : (
          <ul className="list-none m-0 p-0 flex flex-col gap-1.5">
            {sortedShapes.map((shape) => {
              const isSelected = selectedIds.includes(shape.id);
              return (
                <li
                  key={shape.id}
                  className={`flex items-center justify-between p-2.5 px-3 rounded-xl border transition-all duration-150 cursor-pointer ${isSelected ? 'bg-indigo-50/70 border-indigo-200 shadow-sm' : 'bg-transparent border-transparent hover:bg-slate-50'} ${!shape.visible ? 'opacity-50' : ''}`}
                  onClick={(e) => handleShapeClick(shape.id, e)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      className="w-4 h-4 cursor-pointer accent-indigo-600 shrink-0 m-0 rounded border-slate-300"
                      checked={isSelected}
                      onChange={() => handleCheckboxChange(shape.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <ShapeIcon type={shape.type} />
                    <span className="text-[13px] font-bold text-slate-700 truncate">{shape.name}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Visibility Toggle Button */}
                    <button
                      className={`w-7 h-7 flex items-center justify-center border border-slate-100 rounded-lg bg-white cursor-pointer transition-colors duration-150 text-slate-500 hover:bg-slate-100 ${shape.visible ? '' : 'text-slate-400 bg-slate-50'}`}
                      onClick={(e) => handleVisibilityToggle(shape.id, e)}
                      title={shape.visible ? 'Hide' : 'Show'}
                    >
                      {shape.visible ? (
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      )}
                    </button>

                    {/* Lock Toggle Button */}
                    <button
                      className={`w-7 h-7 flex items-center justify-center border border-slate-100 rounded-lg bg-white cursor-pointer transition-colors duration-150 text-slate-500 hover:bg-slate-100 ${shape.locked ? 'text-amber-500 bg-amber-50 border-amber-200' : ''}`}
                      onClick={(e) => handleLockToggle(shape.id, e)}
                      title={shape.locked ? 'Unlock' : 'Lock'}
                    >
                      {shape.locked ? (
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                        </svg>
                      )}
                    </button>

                    {/* Delete Button */}
                    <button
                      className="w-7 h-7 flex items-center justify-center border border-slate-100 rounded-lg bg-white cursor-pointer transition-colors duration-150 text-red-500 hover:bg-red-50 hover:border-red-200"
                      onClick={(e) => handleDeleteShape(shape.id, e)}
                      title="Delete"
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
