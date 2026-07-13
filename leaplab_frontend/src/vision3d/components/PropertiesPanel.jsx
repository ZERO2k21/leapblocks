/**
 * Vision3D - Properties Panel Component
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import React from 'react';
import { use3DStore } from '../store/use3DStore';
import { log, debug } from '../utils/logger';
import { TransformProperties } from './propertiesPanel/TransformProperties';
import { MaterialProperties } from './propertiesPanel/MaterialProperties';
import { ShapeSpecificProperties } from './propertiesPanel/ShapeSpecificProperties';

export const PropertiesPanel = () => {
  const shapes = use3DStore((s) => s.shapes);
  const selectedIds = use3DStore((s) => s.selectedIds);
  const updateShape = use3DStore((s) => s.updateShape);
  const removeShapes = use3DStore((s) => s.removeShapes);
  const deselectAll = use3DStore((s) => s.deselectAll);
  const pushHistory = use3DStore((s) => s.pushHistory);

  const handleClose = () => {
    log('PropertiesPanel: close');
    deselectAll();
  };

  const selectedShape = shapes.find((s) => s.id === selectedIds[0]);

  const inputClass = "w-full px-3 py-2 border border-slate-200 rounded-lg text-[13px] font-semibold text-slate-900 bg-slate-50 outline-none transition-all duration-150 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15";
  const labelClass = "block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2";

  if (!selectedShape) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="flex items-center justify-between border-b border-slate-200" style={{ padding: '20px' }}>
          <h3 className="text-[17px] font-extrabold text-slate-800 font-sans tracking-tight">Inspector</h3>
          <button onClick={handleClose} className="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer transition-all bg-transparent border-0 text-slate-400 hover:bg-slate-100 hover:text-slate-600 text-lg font-bold" title="Close">×</button>
        </div>
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <p className="m-0 text-sm font-medium text-slate-400">Select an object to view its properties</p>
        </div>
      </div>
    );
  }

  const handlePositionChange = (axis, value) => {
    debug('PropertiesPanel: position ' + axis + '=' + value.toFixed(2) + ' id=' + selectedShape.id);
    const newPosition = [...selectedShape.position];
    const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
    newPosition[axisIndex] = value;
    updateShape(selectedShape.id, { position: newPosition });
  };

  const handleRotationChange = (axis, value) => {
    debug('PropertiesPanel: rotation ' + axis + '=' + value + 'deg id=' + selectedShape.id);
    const newRotation = [...selectedShape.rotation];
    const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
    newRotation[axisIndex] = (value * Math.PI) / 180;
    updateShape(selectedShape.id, { rotation: newRotation });
  };

  const handleScaleChange = (axis, value) => {
    debug('PropertiesPanel: scale ' + axis + '=' + value.toFixed(2) + ' id=' + selectedShape.id);
    const newScale = [...selectedShape.scale];
    const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
    newScale[axisIndex] = Math.max(0.1, value);
    updateShape(selectedShape.id, { scale: newScale });
  };

  const handleColorChange = (color) => {
    debug('PropertiesPanel: color=' + color + ' id=' + selectedShape.id);
    updateShape(selectedShape.id, { color });
  };

  const handleHoleToggle = () => {
    log('PropertiesPanel: toggleHole id=' + selectedShape.id);
    updateShape(selectedShape.id, { isHole: !selectedShape.isHole });
  };

  const handleVisibilityToggle = () => {
    log('PropertiesPanel: toggleVisible id=' + selectedShape.id);
    updateShape(selectedShape.id, { visible: !selectedShape.visible });
  };

  const handleLockToggle = () => {
    log('PropertiesPanel: toggleLock id=' + selectedShape.id);
    updateShape(selectedShape.id, { locked: !selectedShape.locked });
  };

  const handleDelete = () => {
    log('PropertiesPanel: delete id=' + selectedShape.id);
    pushHistory();
    removeShapes([selectedShape.id]);
  };

  const updateProp = (key, value) => {
    debug('PropertiesPanel: prop ' + key + '=' + value + ' id=' + selectedShape.id);
    updateShape(selectedShape.id, { [key]: value });
  };

  return (
    <div className="flex flex-col h-full bg-white select-none">
      <div className="flex items-center justify-between border-b border-slate-200" style={{ padding: '20px' }}>
        <div className="flex items-center gap-2">
          <h3 className="text-[17px] font-extrabold text-slate-800 font-sans tracking-tight">Inspector</h3>
          <span className="text-[11px] font-bold px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full uppercase tracking-wider">{selectedShape.type}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleDelete} className="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer transition-all bg-transparent border-0 text-red-500 hover:bg-red-50" title="Delete (Del)">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
          <button onClick={handleClose} className="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer transition-all bg-transparent border-0 text-slate-400 hover:bg-slate-100 hover:text-slate-600 text-lg font-bold" title="Close (Esc)">×</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-5" style={{ padding: '20px' }}>
        {/* Name */}
        <div>
          <label className={labelClass}>Name</label>
          <input
            type="text"
            value={selectedShape.name}
            onChange={(e) => updateShape(selectedShape.id, { name: e.target.value })}
            className={inputClass}
          />
        </div>

        <ShapeSpecificProperties
          selectedShape={selectedShape}
          inputClass={inputClass}
          labelClass={labelClass}
          updateProp={updateProp}
        />
        <TransformProperties
          selectedShape={selectedShape}
          inputClass={inputClass}
          labelClass={labelClass}
          handlePositionChange={handlePositionChange}
          handleRotationChange={handleRotationChange}
          handleScaleChange={handleScaleChange}
        />
        <MaterialProperties
          selectedShape={selectedShape}
          inputClass={inputClass}
          labelClass={labelClass}
          updateShape={updateShape}
          handleColorChange={handleColorChange}
          handleHoleToggle={handleHoleToggle}
          handleVisibilityToggle={handleVisibilityToggle}
          handleLockToggle={handleLockToggle}
        />
      </div>
    </div>
  );
};
