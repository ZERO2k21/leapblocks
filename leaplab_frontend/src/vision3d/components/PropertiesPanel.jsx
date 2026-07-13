/**
 * Vision3D - Properties Panel Component
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import React from 'react';
import { use3DStore } from '../store/use3DStore';
import { DEFAULT_COLORS } from '../utils/constants';
import { log, debug } from '../utils/logger';

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

  if (!selectedShape) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-[10px_14px] border-b border-slate-200">
          <h3>Inspector</h3>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#94a3b8' }} title="Close">x</button>
        </div>
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <p className="m-0 text-[13px] text-slate-400">Select an object to view its properties</p>
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
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-[10px_14px] border-b border-slate-200">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3>Inspector</h3>
          <span className="text-[10px] font-semibold p-[2px_8px] bg-indigo-50 text-indigo-600 rounded-full uppercase">{selectedShape.type}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button onClick={handleDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: 4, color: '#ef4444', display: 'flex', alignItems: 'center' }} title="Delete (Del)">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#94a3b8', padding: '4px' }} title="Close (Esc)">x</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-[10px_14px]">
        {/* Name */}
        <div className="mb-3">
          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Name</label>
          <input
            type="text"
            value={selectedShape.name}
            onChange={(e) => updateShape(selectedShape.id, { name: e.target.value })}
            className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]"
          />
        </div>

        {/* Shape-specific properties */}
        {selectedShape.type === 'box' && (
          <div className="mb-3">
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Dimensions</label>
            <div className="flex gap-1.25">
              <div className="flex-1 flex items-center gap-0.75">
                <span className="text-[10px] text-slate-500 whitespace-nowrap">W</span>
                <input type="number" value={selectedShape.width ?? 2} min={0.1} step={0.1}
                  onChange={(e) => updateProp('width', parseFloat(e.target.value) || 0.1)}
                  className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
              </div>
              <div className="flex-1 flex items-center gap-0.75">
                <span className="text-[10px] text-slate-500 whitespace-nowrap">H</span>
                <input type="number" value={selectedShape.height ?? 2} min={0.1} step={0.1}
                  onChange={(e) => updateProp('height', parseFloat(e.target.value) || 0.1)}
                  className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
              </div>
              <div className="flex-1 flex items-center gap-0.75">
                <span className="text-[10px] text-slate-500 whitespace-nowrap">D</span>
                <input type="number" value={selectedShape.depth ?? 2} min={0.1} step={0.1}
                  onChange={(e) => updateProp('depth', parseFloat(e.target.value) || 0.1)}
                  className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
              </div>
            </div>
            <div className="flex gap-1.25" style={{ marginTop: 4 }}>
              <div className="flex-1 flex items-center gap-0.75" style={{ flex: 1 }}>
                <span className="text-[10px] text-slate-500 whitespace-nowrap">Corner Radius</span>
                <input type="number" value={selectedShape.cornerRadius ?? 0} min={0} step={0.1}
                  onChange={(e) => updateProp('cornerRadius', Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
              </div>
            </div>
          </div>
        )}

        {(selectedShape.type === 'cylinder' || selectedShape.type === 'cone') && (
          <div className="mb-3">
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{selectedShape.type === 'cylinder' ? 'Cylinder' : 'Cone'}</label>
            <div className="flex gap-1.25">
              {selectedShape.type === 'cylinder' && (
                <div className="flex-1 flex items-center gap-0.75">
                  <span className="text-[10px] text-slate-500 whitespace-nowrap">R Top</span>
                  <input type="number" value={selectedShape.radiusTop ?? 1} min={0.1} step={0.1}
                    onChange={(e) => updateProp('radiusTop', parseFloat(e.target.value) || 0.1)}
                    className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
                </div>
              )}
              <div className="flex-1 flex items-center gap-0.75">
                <span className="text-[10px] text-slate-500 whitespace-nowrap">{selectedShape.type === 'cylinder' ? 'R Bot' : 'Radius'}</span>
                <input type="number" value={selectedShape.type === 'cylinder' ? (selectedShape.radiusBottom ?? 1) : (selectedShape.coneRadius ?? 1)} min={0.1} step={0.1}
                  onChange={(e) => updateProp(selectedShape.type === 'cylinder' ? 'radiusBottom' : 'coneRadius', parseFloat(e.target.value) || 0.1)}
                  className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
              </div>
              <div className="flex-1 flex items-center gap-0.75">
                <span className="text-[10px] text-slate-500 whitespace-nowrap">H</span>
                <input type="number" value={selectedShape.type === 'cylinder' ? (selectedShape.cylinderHeight ?? 2) : (selectedShape.coneHeight ?? 2)} min={0.1} step={0.1}
                  onChange={(e) => updateProp(selectedShape.type === 'cylinder' ? 'cylinderHeight' : 'coneHeight', parseFloat(e.target.value) || 0.1)}
                  className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
              </div>
            </div>
            <div className="flex gap-1.25" style={{ marginTop: 4 }}>
              <div className="flex-1 flex items-center gap-0.75">
                <span className="text-[10px] text-slate-500 whitespace-nowrap">Segments</span>
                <input type="number" value={selectedShape.radialSegments ?? 32} min={3} max={128} step={1}
                  onChange={(e) => updateProp('radialSegments', parseInt(e.target.value) || 3)}
                  className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
              </div>
              {selectedShape.type === 'cylinder' && (
                <div className="flex-1 flex items-center gap-0.75">
                  <span className="text-[10px] text-slate-500 whitespace-nowrap">Taper %</span>
                  <input type="number" value={selectedShape.taper ?? 0} min={-90} max={90} step={1}
                    onChange={(e) => updateProp('taper', parseFloat(e.target.value) || 0)}
                    className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
                </div>
              )}
            </div>
          </div>
        )}

        {(selectedShape.type === 'sphere' || selectedShape.type === 'dodecahedron' || selectedShape.type === 'icosahedron' || selectedShape.type === 'octahedron' || selectedShape.type === 'tetrahedron') && (
          <div className="mb-3">
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{selectedShape.type.charAt(0).toUpperCase() + selectedShape.type.slice(1)}</label>
            <div className="flex gap-1.25">
              <div className="flex-1 flex items-center gap-0.75">
                <span className="text-[10px] text-slate-500 whitespace-nowrap">Radius</span>
                <input type="number" value={selectedShape.radius ?? 1} min={0.1} step={0.1}
                  onChange={(e) => updateProp('radius', parseFloat(e.target.value) || 0.1)}
                  className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
              </div>
              {selectedShape.type === 'sphere' && (
                <>
                  <div className="flex-1 flex items-center gap-0.75">
                    <span className="text-[10px] text-slate-500 whitespace-nowrap">W Segs</span>
                    <input type="number" value={selectedShape.widthSegments ?? 32} min={3} max={128} step={1}
                      onChange={(e) => updateProp('widthSegments', parseInt(e.target.value) || 3)}
                      className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
                  </div>
                  <div className="flex-1 flex items-center gap-0.75">
                    <span className="text-[10px] text-slate-500 whitespace-nowrap">H Segs</span>
                    <input type="number" value={selectedShape.heightSegments ?? 16} min={2} max={128} step={1}
                      onChange={(e) => updateProp('heightSegments', parseInt(e.target.value) || 2)}
                      className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {selectedShape.type === 'torus' && (
          <div className="mb-3">
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Torus</label>
            <div className="flex gap-1.25">
              <div className="flex-1 flex items-center gap-0.75">
                <span className="text-[10px] text-slate-500 whitespace-nowrap">Major R</span>
                <input type="number" value={selectedShape.torusRadius ?? 1} min={0.1} step={0.1}
                  onChange={(e) => updateProp('torusRadius', parseFloat(e.target.value) || 0.1)}
                  className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
              </div>
              <div className="flex-1 flex items-center gap-0.75">
                <span className="text-[10px] text-slate-500 whitespace-nowrap">Tube R</span>
                <input type="number" value={selectedShape.tubeRadius ?? 0.4} min={0.05} step={0.05}
                  onChange={(e) => updateProp('tubeRadius', parseFloat(e.target.value) || 0.05)}
                  className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
              </div>
            </div>
            <div className="flex gap-1.25" style={{ marginTop: 4 }}>
              <div className="flex-1 flex items-center gap-0.75">
                <span className="text-[10px] text-slate-500 whitespace-nowrap">Radial Segs</span>
                <input type="number" value={selectedShape.torusRadialSegments ?? 16} min={3} max={64} step={1}
                  onChange={(e) => updateProp('torusRadialSegments', parseInt(e.target.value) || 3)}
                  className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
              </div>
              <div className="flex-1 flex items-center gap-0.75">
                <span className="text-[10px] text-slate-500 whitespace-nowrap">Tube Segs</span>
                <input type="number" value={selectedShape.torusTubularSegments ?? 32} min={3} max={128} step={1}
                  onChange={(e) => updateProp('torusTubularSegments', parseInt(e.target.value) || 3)}
                  className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
              </div>
            </div>
          </div>
        )}

        {selectedShape.type === 'roof' && (
          <div className="mb-3">
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Roof</label>
            <div className="flex gap-1.25">
              <div className="flex-1 flex items-center gap-0.75">
                <span className="text-[10px] text-slate-500 whitespace-nowrap">W</span>
                <input type="number" value={selectedShape.roofWidth ?? 2} min={0.1} step={0.1}
                  onChange={(e) => updateProp('roofWidth', parseFloat(e.target.value) || 0.1)}
                  className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
              </div>
              <div className="flex-1 flex items-center gap-0.75">
                <span className="text-[10px] text-slate-500 whitespace-nowrap">D</span>
                <input type="number" value={selectedShape.roofDepth ?? 2} min={0.1} step={0.1}
                  onChange={(e) => updateProp('roofDepth', parseFloat(e.target.value) || 0.1)}
                  className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
              </div>
              <div className="flex-1 flex items-center gap-0.75">
                <span className="text-[10px] text-slate-500 whitespace-nowrap">H</span>
                <input type="number" value={selectedShape.roofHeight ?? 1} min={0.1} step={0.1}
                  onChange={(e) => updateProp('roofHeight', parseFloat(e.target.value) || 0.1)}
                  className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
              </div>
            </div>
          </div>
        )}

        {selectedShape.type === 'roundRoof' && (
          <div className="mb-3">
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Round Roof</label>
            <div className="flex gap-1.25">
              <div className="flex-1 flex items-center gap-0.75">
                <span className="text-[10px] text-slate-500 whitespace-nowrap">W</span>
                <input type="number" value={selectedShape.roundRoofWidth ?? 2} min={0.1} step={0.1}
                  onChange={(e) => updateProp('roundRoofWidth', parseFloat(e.target.value) || 0.1)}
                  className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
              </div>
              <div className="flex-1 flex items-center gap-0.75">
                <span className="text-[10px] text-slate-500 whitespace-nowrap">D</span>
                <input type="number" value={selectedShape.roundRoofDepth ?? 2} min={0.1} step={0.1}
                  onChange={(e) => updateProp('roundRoofDepth', parseFloat(e.target.value) || 0.1)}
                  className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
              </div>
              <div className="flex-1 flex items-center gap-0.75">
                <span className="text-[10px] text-slate-500 whitespace-nowrap">H</span>
                <input type="number" value={selectedShape.roundRoofHeight ?? 1} min={0.1} step={0.1}
                  onChange={(e) => updateProp('roundRoofHeight', parseFloat(e.target.value) || 0.1)}
                  className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
              </div>
            </div>
          </div>
        )}

        {selectedShape.type === 'wedge' && (
          <div className="mb-3">
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Wedge</label>
            <div className="flex gap-1.25">
              <div className="flex-1 flex items-center gap-0.75">
                <span className="text-[10px] text-slate-500 whitespace-nowrap">W</span>
                <input type="number" value={selectedShape.wedgeWidth ?? 2} min={0.1} step={0.1}
                  onChange={(e) => updateProp('wedgeWidth', parseFloat(e.target.value) || 0.1)}
                  className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
              </div>
              <div className="flex-1 flex items-center gap-0.75">
                <span className="text-[10px] text-slate-500 whitespace-nowrap">D</span>
                <input type="number" value={selectedShape.wedgeDepth ?? 2} min={0.1} step={0.1}
                  onChange={(e) => updateProp('wedgeDepth', parseFloat(e.target.value) || 0.1)}
                  className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
              </div>
              <div className="flex-1 flex items-center gap-0.75">
                <span className="text-[10px] text-slate-500 whitespace-nowrap">H</span>
                <input type="number" value={selectedShape.wedgeHeight ?? 2} min={0.1} step={0.1}
                  onChange={(e) => updateProp('wedgeHeight', parseFloat(e.target.value) || 0.1)}
                  className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
              </div>
            </div>
          </div>
        )}

        {selectedShape.type === 'pyramid' && (
          <div className="mb-3">
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Pyramid</label>
            <div className="flex gap-1.25">
              <div className="flex-1 flex items-center gap-0.75">
                <span className="text-[10px] text-slate-500 whitespace-nowrap">Radius</span>
                <input type="number" value={selectedShape.pyramidRadius ?? 1} min={0.1} step={0.1}
                  onChange={(e) => updateProp('pyramidRadius', parseFloat(e.target.value) || 0.1)}
                  className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
              </div>
              <div className="flex-1 flex items-center gap-0.75">
                <span className="text-[10px] text-slate-500 whitespace-nowrap">H</span>
                <input type="number" value={selectedShape.pyramidHeight ?? 2} min={0.1} step={0.1}
                  onChange={(e) => updateProp('pyramidHeight', parseFloat(e.target.value) || 0.1)}
                  className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
              </div>
              <div className="flex-1 flex items-center gap-0.75">
                <span className="text-[10px] text-slate-500 whitespace-nowrap">Sides</span>
                <input type="number" value={selectedShape.pyramidSides ?? 4} min={3} max={32} step={1}
                  onChange={(e) => updateProp('pyramidSides', parseInt(e.target.value) || 3)}
                  className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
              </div>
            </div>
          </div>
        )}

        {selectedShape.type === 'halfSphere' && (
          <div className="mb-3">
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Half Sphere</label>
            <div className="flex gap-1.25">
              <div className="flex-1 flex items-center gap-0.75">
                <span className="text-[10px] text-slate-500 whitespace-nowrap">Radius</span>
                <input type="number" value={selectedShape.halfSphereRadius ?? 1} min={0.1} step={0.1}
                  onChange={(e) => updateProp('halfSphereRadius', parseFloat(e.target.value) || 0.1)}
                  className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
              </div>
              <div className="flex-1 flex items-center gap-0.75">
                <span className="text-[10px] text-slate-500 whitespace-nowrap">Segs</span>
                <input type="number" value={selectedShape.halfSphereSegments ?? 32} min={4} max={64} step={1}
                  onChange={(e) => updateProp('halfSphereSegments', parseInt(e.target.value) || 4)}
                  className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
              </div>
            </div>
          </div>
        )}

        {selectedShape.type === 'paraboloid' && (
          <div className="mb-3">
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Paraboloid</label>
            <div className="flex gap-1.25">
              <div className="flex-1 flex items-center gap-0.75">
                <span className="text-[10px] text-slate-500 whitespace-nowrap">Radius</span>
                <input type="number" value={selectedShape.paraboloidRadius ?? 1} min={0.1} step={0.1}
                  onChange={(e) => updateProp('paraboloidRadius', parseFloat(e.target.value) || 0.1)}
                  className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
              </div>
              <div className="flex-1 flex items-center gap-0.75">
                <span className="text-[10px] text-slate-500 whitespace-nowrap">H</span>
                <input type="number" value={selectedShape.paraboloidHeight ?? 2} min={0.1} step={0.1}
                  onChange={(e) => updateProp('paraboloidHeight', parseFloat(e.target.value) || 0.1)}
                  className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
              </div>
            </div>
          </div>
        )}

        {selectedShape.type === 'tube' && (
          <div className="mb-3">
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Tube</label>
            <div className="flex gap-1.25">
              <div className="flex-1 flex items-center gap-0.75">
                <span className="text-[10px] text-slate-500 whitespace-nowrap">Outer R</span>
                <input type="number" value={selectedShape.tubeOuterRadius ?? 1} min={0.1} step={0.1}
                  onChange={(e) => updateProp('tubeOuterRadius', parseFloat(e.target.value) || 0.1)}
                  className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
              </div>
              <div className="flex-1 flex items-center gap-0.75">
                <span className="text-[10px] text-slate-500 whitespace-nowrap">Inner R</span>
                <input type="number" value={selectedShape.tubeInnerRadius ?? 0.7} min={0.05} step={0.1}
                  onChange={(e) => updateProp('tubeInnerRadius', parseFloat(e.target.value) || 0.05)}
                  className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
              </div>
              <div className="flex-1 flex items-center gap-0.75">
                <span className="text-[10px] text-slate-500 whitespace-nowrap">H</span>
                <input type="number" value={selectedShape.tubeHeight ?? 2} min={0.1} step={0.1}
                  onChange={(e) => updateProp('tubeHeight', parseFloat(e.target.value) || 0.1)}
                  className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
              </div>
            </div>
          </div>
        )}

        {selectedShape.type === 'star' && (
          <div className="mb-3">
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Star</label>
            <div className="flex gap-1.25">
              <div className="flex-1 flex items-center gap-0.75">
                <span className="text-[10px] text-slate-500 whitespace-nowrap">Outer R</span>
                <input type="number" value={selectedShape.starOuterRadius ?? 1} min={0.1} step={0.1}
                  onChange={(e) => updateProp('starOuterRadius', parseFloat(e.target.value) || 0.1)}
                  className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
              </div>
              <div className="flex-1 flex items-center gap-0.75">
                <span className="text-[10px] text-slate-500 whitespace-nowrap">Inner R</span>
                <input type="number" value={selectedShape.starInnerRadius ?? 0.5} min={0.05} step={0.1}
                  onChange={(e) => updateProp('starInnerRadius', parseFloat(e.target.value) || 0.05)}
                  className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
              </div>
            </div>
            <div className="flex gap-1.25" style={{ marginTop: 4 }}>
              <div className="flex-1 flex items-center gap-0.75">
                <span className="text-[10px] text-slate-500 whitespace-nowrap">Points</span>
                <input type="number" value={selectedShape.starPoints ?? 5} min={3} max={32} step={1}
                  onChange={(e) => updateProp('starPoints', parseInt(e.target.value) || 3)}
                  className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
              </div>
              <div className="flex-1 flex items-center gap-0.75">
                <span className="text-[10px] text-slate-500 whitespace-nowrap">Depth</span>
                <input type="number" value={selectedShape.starHeight ?? 0.5} min={0.1} step={0.1}
                  onChange={(e) => updateProp('starHeight', parseFloat(e.target.value) || 0.1)}
                  className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
              </div>
            </div>
          </div>
        )}

        {selectedShape.type === 'heart' && (
          <div className="mb-3">
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Heart</label>
            <div className="flex gap-1.25">
              <div className="flex-1 flex items-center gap-0.75">
                <span className="text-[10px] text-slate-500 whitespace-nowrap">Size</span>
                <input type="number" value={selectedShape.heartSize ?? 1} min={0.1} step={0.1}
                  onChange={(e) => updateProp('heartSize', parseFloat(e.target.value) || 0.1)}
                  className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
              </div>
              <div className="flex-1 flex items-center gap-0.75">
                <span className="text-[10px] text-slate-500 whitespace-nowrap">Depth</span>
                <input type="number" value={selectedShape.heartDepth ?? 0.5} min={0.1} step={0.1}
                  onChange={(e) => updateProp('heartDepth', parseFloat(e.target.value) || 0.1)}
                  className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
              </div>
            </div>
          </div>
        )}

        {selectedShape.type === 'polygon' && (
          <div className="mb-3">
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Polygon</label>
            <div className="flex gap-1.25">
              <div className="flex-1 flex items-center gap-0.75">
                <span className="text-[10px] text-slate-500 whitespace-nowrap">Radius</span>
                <input type="number" value={selectedShape.polygonRadius ?? 1} min={0.1} step={0.1}
                  onChange={(e) => updateProp('polygonRadius', parseFloat(e.target.value) || 0.1)}
                  className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
              </div>
              <div className="flex-1 flex items-center gap-0.75">
                <span className="text-[10px] text-slate-500 whitespace-nowrap">Sides</span>
                <input type="number" value={selectedShape.polygonSides ?? 6} min={3} max={32} step={1}
                  onChange={(e) => updateProp('polygonSides', parseInt(e.target.value) || 3)}
                  className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
              </div>
              <div className="flex-1 flex items-center gap-0.75">
                <span className="text-[10px] text-slate-500 whitespace-nowrap">H</span>
                <input type="number" value={selectedShape.polygonHeight ?? 2} min={0.1} step={0.1}
                  onChange={(e) => updateProp('polygonHeight', parseFloat(e.target.value) || 0.1)}
                  className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
              </div>
            </div>
          </div>
        )}

        {selectedShape.type === 'ring' && (
          <div className="mb-3">
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Ring</label>
            <div className="flex gap-1.25">
              <div className="flex-1 flex items-center gap-0.75">
                <span className="text-[10px] text-slate-500 whitespace-nowrap">Inner R</span>
                <input type="number" value={selectedShape.innerRadius ?? 0.5} min={0.05} step={0.1}
                  onChange={(e) => updateProp('innerRadius', parseFloat(e.target.value) || 0.05)}
                  className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
              </div>
              <div className="flex-1 flex items-center gap-0.75">
                <span className="text-[10px] text-slate-500 whitespace-nowrap">Outer R</span>
                <input type="number" value={selectedShape.outerRadius ?? 1} min={0.1} step={0.1}
                  onChange={(e) => updateProp('outerRadius', parseFloat(e.target.value) || 0.1)}
                  className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
              </div>
            </div>
          </div>
        )}

        {selectedShape.type === 'text3d' && (
          <div className="mb-3">
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Text</label>
            <input type="text" value={selectedShape.text ?? 'Hello'}
              onChange={(e) => updateProp('text', e.target.value)}
              className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
            <div className="flex gap-1.25" style={{ marginTop: 4 }}>
              <div className="flex-1 flex items-center gap-0.75">
                <span className="text-[10px] text-slate-500 whitespace-nowrap">Font Size</span>
                <input type="number" value={selectedShape.fontSize ?? 1} min={0.1} step={0.1}
                  onChange={(e) => updateProp('fontSize', parseFloat(e.target.value) || 0.1)}
                  className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
              </div>
              <div className="flex-1 flex items-center gap-0.75">
                <span className="text-[10px] text-slate-500 whitespace-nowrap">Depth</span>
                <input type="number" value={selectedShape.textDepth ?? 0.5} min={0.05} step={0.1}
                  onChange={(e) => updateProp('textDepth', parseFloat(e.target.value) || 0.05)}
                  className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
              </div>
            </div>
          </div>
        )}

        {/* Position */}
        <div className="mb-3">
          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Position</label>
          <div className="flex gap-1.25">
            <div className="flex-1 flex items-center gap-0.75">
              <span className="text-[11px] font-bold w-3.5 text-center text-red-500">X</span>
              <input type="number" value={selectedShape.position[0].toFixed(2)}
                onChange={(e) => handlePositionChange('x', parseFloat(e.target.value) || 0)}
                step={0.1} className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
            </div>
            <div className="flex-1 flex items-center gap-0.75">
              <span className="text-[11px] font-bold w-3.5 text-center text-green-500">Y</span>
              <input type="number" value={selectedShape.position[1].toFixed(2)}
                onChange={(e) => handlePositionChange('y', parseFloat(e.target.value) || 0)}
                step={0.1} className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
            </div>
            <div className="flex-1 flex items-center gap-0.75">
              <span className="text-[11px] font-bold w-3.5 text-center text-blue-500">Z</span>
              <input type="number" value={selectedShape.position[2].toFixed(2)}
                onChange={(e) => handlePositionChange('z', parseFloat(e.target.value) || 0)}
                step={0.1} className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
            </div>
          </div>
        </div>

        {/* Rotation */}
        <div className="mb-3">
          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Rotation (degrees)</label>
          <div className="flex gap-1.25">
            <div className="flex-1 flex items-center gap-0.75">
              <span className="text-[11px] font-bold w-3.5 text-center text-red-500">X</span>
              <input type="number" value={((selectedShape.rotation[0] * 180) / Math.PI).toFixed(1)}
                onChange={(e) => handleRotationChange('x', parseFloat(e.target.value) || 0)}
                step={15} className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
            </div>
            <div className="flex-1 flex items-center gap-0.75">
              <span className="text-[11px] font-bold w-3.5 text-center text-green-500">Y</span>
              <input type="number" value={((selectedShape.rotation[1] * 180) / Math.PI).toFixed(1)}
                onChange={(e) => handleRotationChange('y', parseFloat(e.target.value) || 0)}
                step={15} className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
            </div>
            <div className="flex-1 flex items-center gap-0.75">
              <span className="text-[11px] font-bold w-3.5 text-center text-blue-500">Z</span>
              <input type="number" value={((selectedShape.rotation[2] * 180) / Math.PI).toFixed(1)}
                onChange={(e) => handleRotationChange('z', parseFloat(e.target.value) || 0)}
                step={15} className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
            </div>
          </div>
        </div>

        {/* Scale */}
        <div className="mb-3">
          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Scale</label>
          <div className="flex gap-1.25">
            <div className="flex-1 flex items-center gap-0.75">
              <span className="text-[11px] font-bold w-3.5 text-center text-red-500">X</span>
              <input type="number" value={selectedShape.scale[0].toFixed(2)}
                onChange={(e) => handleScaleChange('x', parseFloat(e.target.value) || 1)}
                step={0.1} min={0.1} className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
            </div>
            <div className="flex-1 flex items-center gap-0.75">
              <span className="text-[11px] font-bold w-3.5 text-center text-green-500">Y</span>
              <input type="number" value={selectedShape.scale[1].toFixed(2)}
                onChange={(e) => handleScaleChange('y', parseFloat(e.target.value) || 1)}
                step={0.1} min={0.1} className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
            </div>
            <div className="flex-1 flex items-center gap-0.75">
              <span className="text-[11px] font-bold w-3.5 text-center text-blue-500">Z</span>
              <input type="number" value={selectedShape.scale[2].toFixed(2)}
                onChange={(e) => handleScaleChange('z', parseFloat(e.target.value) || 1)}
                step={0.1} min={0.1} className="w-full p-[4px_6px] border border-slate-200 rounded-[5px] text-[11px] text-slate-900 bg-slate-50 outline-none transition-[border-color] duration-150 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15)]" />
            </div>
          </div>
        </div>

        {/* Color */}
        <div className="mb-3">
          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Color</label>
          <div className="flex flex-col gap-1.25">
            <input type="color" value={selectedShape.color}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-full h-7 border border-slate-200 rounded-[5px] cursor-pointer p-0.5" />
            <div className="flex flex-wrap gap-0.75">
              {DEFAULT_COLORS.map((color) => (
                <button
                  key={color}
                  className="w-4 h-4 border-2 rounded-[3px] cursor-pointer transition-all duration-150 hover:scale-125 border-slate-900 shadow-[0_0_0_2px_white] active"
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorChange(color)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Material Properties */}
        <div className="mb-3">
          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Material</label>
          <div className="flex gap-1.25">
            <div className="flex-1 flex items-center gap-0.75">
              <span className="text-[10px] text-slate-500 whitespace-nowrap">Metalness</span>
              <input type="range" min={0} max={1} step={0.05}
                value={selectedShape.metalness ?? 0.1}
                onChange={(e) => updateShape(selectedShape.id, { metalness: parseFloat(e.target.value) })}
                className="w-full h-1 appearance-none bg-slate-200 rounded-[2px] outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-[0_1px_3px_rgba(0,0,0,0.15)]" />
            </div>
            <div className="flex-1 flex items-center gap-0.75">
              <span className="text-[10px] text-slate-500 whitespace-nowrap">Roughness</span>
              <input type="range" min={0} max={1} step={0.05}
                value={selectedShape.roughness ?? 0.7}
                onChange={(e) => updateShape(selectedShape.id, { roughness: parseFloat(e.target.value) })}
                className="w-full h-1 appearance-none bg-slate-200 rounded-[2px] outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-[0_1px_3px_rgba(0,0,0,0.15)]" />
            </div>
          </div>
        </div>

        {/* Edge Smoothness */}
        <div className="mb-3">
          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Edge Smoothness</label>
          <div className="flex gap-1.25">
            <div className="flex-1 flex items-center gap-0.75" style={{ flex: 1 }}>
              <input type="range" min={0} max={1} step={0.01}
                value={selectedShape.cornerRadius ?? 0}
                onChange={(e) => updateShape(selectedShape.id, { cornerRadius: parseFloat(e.target.value) })}
                className="w-full h-1 appearance-none bg-slate-200 rounded-[2px] outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-[0_1px_3px_rgba(0,0,0,0.15)]" />
            </div>
            <span className="text-[11px] font-semibold text-slate-500 min-w-[32px] text-right select-none">{((selectedShape.cornerRadius ?? 0) * 100).toFixed(0)}%</span>
          </div>
        </div>

        {/* Toggles */}
        <div className="mb-3">
          <label className="text-[11px] font-semibold text-slate-700 mb-1.5 block">Options</label>
          <div className="flex gap-1">
            <button className={`px-2 py-1 text-[10px] font-medium rounded-[4px] border transition-all duration-150 ${selectedShape.isHole ? 'bg-indigo-500 text-white border-indigo-600' : 'bg-slate-50 text-slate-600 border-slate-200'}`} onClick={handleHoleToggle}>
              Hole
            </button>
            <button className={`px-2 py-1 text-[10px] font-medium rounded-[4px] border transition-all duration-150 ${selectedShape.visible ? 'bg-indigo-500 text-white border-indigo-600' : 'bg-slate-50 text-slate-600 border-slate-200'}`} onClick={handleVisibilityToggle}>
              Visible
            </button>
            <button className={`toggle-btn ${selectedShape.locked ? 'active' : ''}`} onClick={handleLockToggle}>
              Locked
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
