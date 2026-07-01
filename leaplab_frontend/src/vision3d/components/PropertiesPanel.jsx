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
      <div className="properties-panel">
        <div className="properties-panel-header">
          <h3>Inspector</h3>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#94a3b8' }} title="Close">x</button>
        </div>
        <div className="properties-empty">
          <p>Select an object to view its properties</p>
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
    <div className="properties-panel">
      <div className="properties-panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3>Inspector</h3>
          <span className="shape-type-badge">{selectedShape.type}</span>
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

      <div className="properties-content">
        {/* Name */}
        <div className="property-group">
          <label>Name</label>
          <input
            type="text"
            value={selectedShape.name}
            onChange={(e) => updateShape(selectedShape.id, { name: e.target.value })}
            className="property-input"
          />
        </div>

        {/* Shape-specific properties */}
        {selectedShape.type === 'box' && (
          <div className="property-group">
            <label>Dimensions</label>
            <div className="property-row">
              <div className="property-field">
                <span className="property-label">W</span>
                <input type="number" value={selectedShape.width ?? 2} min={0.1} step={0.1}
                  onChange={(e) => updateProp('width', parseFloat(e.target.value) || 0.1)}
                  className="property-input" />
              </div>
              <div className="property-field">
                <span className="property-label">H</span>
                <input type="number" value={selectedShape.height ?? 2} min={0.1} step={0.1}
                  onChange={(e) => updateProp('height', parseFloat(e.target.value) || 0.1)}
                  className="property-input" />
              </div>
              <div className="property-field">
                <span className="property-label">D</span>
                <input type="number" value={selectedShape.depth ?? 2} min={0.1} step={0.1}
                  onChange={(e) => updateProp('depth', parseFloat(e.target.value) || 0.1)}
                  className="property-input" />
              </div>
            </div>
            <div className="property-row" style={{ marginTop: 4 }}>
              <div className="property-field" style={{ flex: 1 }}>
                <span className="property-label">Corner Radius</span>
                <input type="number" value={selectedShape.cornerRadius ?? 0} min={0} step={0.1}
                  onChange={(e) => updateProp('cornerRadius', Math.max(0, parseFloat(e.target.value) || 0))}
                  className="property-input" />
              </div>
            </div>
          </div>
        )}

        {(selectedShape.type === 'cylinder' || selectedShape.type === 'cone') && (
          <div className="property-group">
            <label>{selectedShape.type === 'cylinder' ? 'Cylinder' : 'Cone'}</label>
            <div className="property-row">
              {selectedShape.type === 'cylinder' && (
                <div className="property-field">
                  <span className="property-label">R Top</span>
                  <input type="number" value={selectedShape.radiusTop ?? 1} min={0.1} step={0.1}
                    onChange={(e) => updateProp('radiusTop', parseFloat(e.target.value) || 0.1)}
                    className="property-input" />
                </div>
              )}
              <div className="property-field">
                <span className="property-label">{selectedShape.type === 'cylinder' ? 'R Bot' : 'Radius'}</span>
                <input type="number" value={selectedShape.type === 'cylinder' ? (selectedShape.radiusBottom ?? 1) : (selectedShape.coneRadius ?? 1)} min={0.1} step={0.1}
                  onChange={(e) => updateProp(selectedShape.type === 'cylinder' ? 'radiusBottom' : 'coneRadius', parseFloat(e.target.value) || 0.1)}
                  className="property-input" />
              </div>
              <div className="property-field">
                <span className="property-label">H</span>
                <input type="number" value={selectedShape.type === 'cylinder' ? (selectedShape.cylinderHeight ?? 2) : (selectedShape.coneHeight ?? 2)} min={0.1} step={0.1}
                  onChange={(e) => updateProp(selectedShape.type === 'cylinder' ? 'cylinderHeight' : 'coneHeight', parseFloat(e.target.value) || 0.1)}
                  className="property-input" />
              </div>
            </div>
            <div className="property-row" style={{ marginTop: 4 }}>
              <div className="property-field">
                <span className="property-label">Segments</span>
                <input type="number" value={selectedShape.radialSegments ?? 32} min={3} max={128} step={1}
                  onChange={(e) => updateProp('radialSegments', parseInt(e.target.value) || 3)}
                  className="property-input" />
              </div>
              {selectedShape.type === 'cylinder' && (
                <div className="property-field">
                  <span className="property-label">Taper %</span>
                  <input type="number" value={selectedShape.taper ?? 0} min={-90} max={90} step={1}
                    onChange={(e) => updateProp('taper', parseFloat(e.target.value) || 0)}
                    className="property-input" />
                </div>
              )}
            </div>
          </div>
        )}

        {(selectedShape.type === 'sphere' || selectedShape.type === 'dodecahedron' || selectedShape.type === 'icosahedron' || selectedShape.type === 'octahedron' || selectedShape.type === 'tetrahedron') && (
          <div className="property-group">
            <label>{selectedShape.type.charAt(0).toUpperCase() + selectedShape.type.slice(1)}</label>
            <div className="property-row">
              <div className="property-field">
                <span className="property-label">Radius</span>
                <input type="number" value={selectedShape.radius ?? 1} min={0.1} step={0.1}
                  onChange={(e) => updateProp('radius', parseFloat(e.target.value) || 0.1)}
                  className="property-input" />
              </div>
              {selectedShape.type === 'sphere' && (
                <>
                  <div className="property-field">
                    <span className="property-label">W Segs</span>
                    <input type="number" value={selectedShape.widthSegments ?? 32} min={3} max={128} step={1}
                      onChange={(e) => updateProp('widthSegments', parseInt(e.target.value) || 3)}
                      className="property-input" />
                  </div>
                  <div className="property-field">
                    <span className="property-label">H Segs</span>
                    <input type="number" value={selectedShape.heightSegments ?? 16} min={2} max={128} step={1}
                      onChange={(e) => updateProp('heightSegments', parseInt(e.target.value) || 2)}
                      className="property-input" />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {selectedShape.type === 'torus' && (
          <div className="property-group">
            <label>Torus</label>
            <div className="property-row">
              <div className="property-field">
                <span className="property-label">Major R</span>
                <input type="number" value={selectedShape.torusRadius ?? 1} min={0.1} step={0.1}
                  onChange={(e) => updateProp('torusRadius', parseFloat(e.target.value) || 0.1)}
                  className="property-input" />
              </div>
              <div className="property-field">
                <span className="property-label">Tube R</span>
                <input type="number" value={selectedShape.tubeRadius ?? 0.4} min={0.05} step={0.05}
                  onChange={(e) => updateProp('tubeRadius', parseFloat(e.target.value) || 0.05)}
                  className="property-input" />
              </div>
            </div>
            <div className="property-row" style={{ marginTop: 4 }}>
              <div className="property-field">
                <span className="property-label">Radial Segs</span>
                <input type="number" value={selectedShape.torusRadialSegments ?? 16} min={3} max={64} step={1}
                  onChange={(e) => updateProp('torusRadialSegments', parseInt(e.target.value) || 3)}
                  className="property-input" />
              </div>
              <div className="property-field">
                <span className="property-label">Tube Segs</span>
                <input type="number" value={selectedShape.torusTubularSegments ?? 32} min={3} max={128} step={1}
                  onChange={(e) => updateProp('torusTubularSegments', parseInt(e.target.value) || 3)}
                  className="property-input" />
              </div>
            </div>
          </div>
        )}

        {selectedShape.type === 'roof' && (
          <div className="property-group">
            <label>Roof</label>
            <div className="property-row">
              <div className="property-field">
                <span className="property-label">W</span>
                <input type="number" value={selectedShape.roofWidth ?? 2} min={0.1} step={0.1}
                  onChange={(e) => updateProp('roofWidth', parseFloat(e.target.value) || 0.1)}
                  className="property-input" />
              </div>
              <div className="property-field">
                <span className="property-label">D</span>
                <input type="number" value={selectedShape.roofDepth ?? 2} min={0.1} step={0.1}
                  onChange={(e) => updateProp('roofDepth', parseFloat(e.target.value) || 0.1)}
                  className="property-input" />
              </div>
              <div className="property-field">
                <span className="property-label">H</span>
                <input type="number" value={selectedShape.roofHeight ?? 1} min={0.1} step={0.1}
                  onChange={(e) => updateProp('roofHeight', parseFloat(e.target.value) || 0.1)}
                  className="property-input" />
              </div>
            </div>
          </div>
        )}

        {selectedShape.type === 'roundRoof' && (
          <div className="property-group">
            <label>Round Roof</label>
            <div className="property-row">
              <div className="property-field">
                <span className="property-label">W</span>
                <input type="number" value={selectedShape.roundRoofWidth ?? 2} min={0.1} step={0.1}
                  onChange={(e) => updateProp('roundRoofWidth', parseFloat(e.target.value) || 0.1)}
                  className="property-input" />
              </div>
              <div className="property-field">
                <span className="property-label">D</span>
                <input type="number" value={selectedShape.roundRoofDepth ?? 2} min={0.1} step={0.1}
                  onChange={(e) => updateProp('roundRoofDepth', parseFloat(e.target.value) || 0.1)}
                  className="property-input" />
              </div>
              <div className="property-field">
                <span className="property-label">H</span>
                <input type="number" value={selectedShape.roundRoofHeight ?? 1} min={0.1} step={0.1}
                  onChange={(e) => updateProp('roundRoofHeight', parseFloat(e.target.value) || 0.1)}
                  className="property-input" />
              </div>
            </div>
          </div>
        )}

        {selectedShape.type === 'wedge' && (
          <div className="property-group">
            <label>Wedge</label>
            <div className="property-row">
              <div className="property-field">
                <span className="property-label">W</span>
                <input type="number" value={selectedShape.wedgeWidth ?? 2} min={0.1} step={0.1}
                  onChange={(e) => updateProp('wedgeWidth', parseFloat(e.target.value) || 0.1)}
                  className="property-input" />
              </div>
              <div className="property-field">
                <span className="property-label">D</span>
                <input type="number" value={selectedShape.wedgeDepth ?? 2} min={0.1} step={0.1}
                  onChange={(e) => updateProp('wedgeDepth', parseFloat(e.target.value) || 0.1)}
                  className="property-input" />
              </div>
              <div className="property-field">
                <span className="property-label">H</span>
                <input type="number" value={selectedShape.wedgeHeight ?? 2} min={0.1} step={0.1}
                  onChange={(e) => updateProp('wedgeHeight', parseFloat(e.target.value) || 0.1)}
                  className="property-input" />
              </div>
            </div>
          </div>
        )}

        {selectedShape.type === 'pyramid' && (
          <div className="property-group">
            <label>Pyramid</label>
            <div className="property-row">
              <div className="property-field">
                <span className="property-label">Radius</span>
                <input type="number" value={selectedShape.pyramidRadius ?? 1} min={0.1} step={0.1}
                  onChange={(e) => updateProp('pyramidRadius', parseFloat(e.target.value) || 0.1)}
                  className="property-input" />
              </div>
              <div className="property-field">
                <span className="property-label">H</span>
                <input type="number" value={selectedShape.pyramidHeight ?? 2} min={0.1} step={0.1}
                  onChange={(e) => updateProp('pyramidHeight', parseFloat(e.target.value) || 0.1)}
                  className="property-input" />
              </div>
              <div className="property-field">
                <span className="property-label">Sides</span>
                <input type="number" value={selectedShape.pyramidSides ?? 4} min={3} max={32} step={1}
                  onChange={(e) => updateProp('pyramidSides', parseInt(e.target.value) || 3)}
                  className="property-input" />
              </div>
            </div>
          </div>
        )}

        {selectedShape.type === 'halfSphere' && (
          <div className="property-group">
            <label>Half Sphere</label>
            <div className="property-row">
              <div className="property-field">
                <span className="property-label">Radius</span>
                <input type="number" value={selectedShape.halfSphereRadius ?? 1} min={0.1} step={0.1}
                  onChange={(e) => updateProp('halfSphereRadius', parseFloat(e.target.value) || 0.1)}
                  className="property-input" />
              </div>
              <div className="property-field">
                <span className="property-label">Segs</span>
                <input type="number" value={selectedShape.halfSphereSegments ?? 32} min={4} max={64} step={1}
                  onChange={(e) => updateProp('halfSphereSegments', parseInt(e.target.value) || 4)}
                  className="property-input" />
              </div>
            </div>
          </div>
        )}

        {selectedShape.type === 'paraboloid' && (
          <div className="property-group">
            <label>Paraboloid</label>
            <div className="property-row">
              <div className="property-field">
                <span className="property-label">Radius</span>
                <input type="number" value={selectedShape.paraboloidRadius ?? 1} min={0.1} step={0.1}
                  onChange={(e) => updateProp('paraboloidRadius', parseFloat(e.target.value) || 0.1)}
                  className="property-input" />
              </div>
              <div className="property-field">
                <span className="property-label">H</span>
                <input type="number" value={selectedShape.paraboloidHeight ?? 2} min={0.1} step={0.1}
                  onChange={(e) => updateProp('paraboloidHeight', parseFloat(e.target.value) || 0.1)}
                  className="property-input" />
              </div>
            </div>
          </div>
        )}

        {selectedShape.type === 'tube' && (
          <div className="property-group">
            <label>Tube</label>
            <div className="property-row">
              <div className="property-field">
                <span className="property-label">Outer R</span>
                <input type="number" value={selectedShape.tubeOuterRadius ?? 1} min={0.1} step={0.1}
                  onChange={(e) => updateProp('tubeOuterRadius', parseFloat(e.target.value) || 0.1)}
                  className="property-input" />
              </div>
              <div className="property-field">
                <span className="property-label">Inner R</span>
                <input type="number" value={selectedShape.tubeInnerRadius ?? 0.7} min={0.05} step={0.1}
                  onChange={(e) => updateProp('tubeInnerRadius', parseFloat(e.target.value) || 0.05)}
                  className="property-input" />
              </div>
              <div className="property-field">
                <span className="property-label">H</span>
                <input type="number" value={selectedShape.tubeHeight ?? 2} min={0.1} step={0.1}
                  onChange={(e) => updateProp('tubeHeight', parseFloat(e.target.value) || 0.1)}
                  className="property-input" />
              </div>
            </div>
          </div>
        )}

        {selectedShape.type === 'star' && (
          <div className="property-group">
            <label>Star</label>
            <div className="property-row">
              <div className="property-field">
                <span className="property-label">Outer R</span>
                <input type="number" value={selectedShape.starOuterRadius ?? 1} min={0.1} step={0.1}
                  onChange={(e) => updateProp('starOuterRadius', parseFloat(e.target.value) || 0.1)}
                  className="property-input" />
              </div>
              <div className="property-field">
                <span className="property-label">Inner R</span>
                <input type="number" value={selectedShape.starInnerRadius ?? 0.5} min={0.05} step={0.1}
                  onChange={(e) => updateProp('starInnerRadius', parseFloat(e.target.value) || 0.05)}
                  className="property-input" />
              </div>
            </div>
            <div className="property-row" style={{ marginTop: 4 }}>
              <div className="property-field">
                <span className="property-label">Points</span>
                <input type="number" value={selectedShape.starPoints ?? 5} min={3} max={32} step={1}
                  onChange={(e) => updateProp('starPoints', parseInt(e.target.value) || 3)}
                  className="property-input" />
              </div>
              <div className="property-field">
                <span className="property-label">Depth</span>
                <input type="number" value={selectedShape.starHeight ?? 0.5} min={0.1} step={0.1}
                  onChange={(e) => updateProp('starHeight', parseFloat(e.target.value) || 0.1)}
                  className="property-input" />
              </div>
            </div>
          </div>
        )}

        {selectedShape.type === 'heart' && (
          <div className="property-group">
            <label>Heart</label>
            <div className="property-row">
              <div className="property-field">
                <span className="property-label">Size</span>
                <input type="number" value={selectedShape.heartSize ?? 1} min={0.1} step={0.1}
                  onChange={(e) => updateProp('heartSize', parseFloat(e.target.value) || 0.1)}
                  className="property-input" />
              </div>
              <div className="property-field">
                <span className="property-label">Depth</span>
                <input type="number" value={selectedShape.heartDepth ?? 0.5} min={0.1} step={0.1}
                  onChange={(e) => updateProp('heartDepth', parseFloat(e.target.value) || 0.1)}
                  className="property-input" />
              </div>
            </div>
          </div>
        )}

        {selectedShape.type === 'polygon' && (
          <div className="property-group">
            <label>Polygon</label>
            <div className="property-row">
              <div className="property-field">
                <span className="property-label">Radius</span>
                <input type="number" value={selectedShape.polygonRadius ?? 1} min={0.1} step={0.1}
                  onChange={(e) => updateProp('polygonRadius', parseFloat(e.target.value) || 0.1)}
                  className="property-input" />
              </div>
              <div className="property-field">
                <span className="property-label">Sides</span>
                <input type="number" value={selectedShape.polygonSides ?? 6} min={3} max={32} step={1}
                  onChange={(e) => updateProp('polygonSides', parseInt(e.target.value) || 3)}
                  className="property-input" />
              </div>
              <div className="property-field">
                <span className="property-label">H</span>
                <input type="number" value={selectedShape.polygonHeight ?? 2} min={0.1} step={0.1}
                  onChange={(e) => updateProp('polygonHeight', parseFloat(e.target.value) || 0.1)}
                  className="property-input" />
              </div>
            </div>
          </div>
        )}

        {selectedShape.type === 'ring' && (
          <div className="property-group">
            <label>Ring</label>
            <div className="property-row">
              <div className="property-field">
                <span className="property-label">Inner R</span>
                <input type="number" value={selectedShape.innerRadius ?? 0.5} min={0.05} step={0.1}
                  onChange={(e) => updateProp('innerRadius', parseFloat(e.target.value) || 0.05)}
                  className="property-input" />
              </div>
              <div className="property-field">
                <span className="property-label">Outer R</span>
                <input type="number" value={selectedShape.outerRadius ?? 1} min={0.1} step={0.1}
                  onChange={(e) => updateProp('outerRadius', parseFloat(e.target.value) || 0.1)}
                  className="property-input" />
              </div>
            </div>
          </div>
        )}

        {selectedShape.type === 'text3d' && (
          <div className="property-group">
            <label>Text</label>
            <input type="text" value={selectedShape.text ?? 'Hello'}
              onChange={(e) => updateProp('text', e.target.value)}
              className="property-input" />
            <div className="property-row" style={{ marginTop: 4 }}>
              <div className="property-field">
                <span className="property-label">Font Size</span>
                <input type="number" value={selectedShape.fontSize ?? 1} min={0.1} step={0.1}
                  onChange={(e) => updateProp('fontSize', parseFloat(e.target.value) || 0.1)}
                  className="property-input" />
              </div>
            </div>
          </div>
        )}

        {/* Position */}
        <div className="property-group">
          <label>Position</label>
          <div className="property-row">
            <div className="property-field">
              <span className="axis-label x">X</span>
              <input type="number" value={selectedShape.position[0].toFixed(2)}
                onChange={(e) => handlePositionChange('x', parseFloat(e.target.value) || 0)}
                step={0.1} className="property-input" />
            </div>
            <div className="property-field">
              <span className="axis-label y">Y</span>
              <input type="number" value={selectedShape.position[1].toFixed(2)}
                onChange={(e) => handlePositionChange('y', parseFloat(e.target.value) || 0)}
                step={0.1} className="property-input" />
            </div>
            <div className="property-field">
              <span className="axis-label z">Z</span>
              <input type="number" value={selectedShape.position[2].toFixed(2)}
                onChange={(e) => handlePositionChange('z', parseFloat(e.target.value) || 0)}
                step={0.1} className="property-input" />
            </div>
          </div>
        </div>

        {/* Rotation */}
        <div className="property-group">
          <label>Rotation (degrees)</label>
          <div className="property-row">
            <div className="property-field">
              <span className="axis-label x">X</span>
              <input type="number" value={((selectedShape.rotation[0] * 180) / Math.PI).toFixed(1)}
                onChange={(e) => handleRotationChange('x', parseFloat(e.target.value) || 0)}
                step={15} className="property-input" />
            </div>
            <div className="property-field">
              <span className="axis-label y">Y</span>
              <input type="number" value={((selectedShape.rotation[1] * 180) / Math.PI).toFixed(1)}
                onChange={(e) => handleRotationChange('y', parseFloat(e.target.value) || 0)}
                step={15} className="property-input" />
            </div>
            <div className="property-field">
              <span className="axis-label z">Z</span>
              <input type="number" value={((selectedShape.rotation[2] * 180) / Math.PI).toFixed(1)}
                onChange={(e) => handleRotationChange('z', parseFloat(e.target.value) || 0)}
                step={15} className="property-input" />
            </div>
          </div>
        </div>

        {/* Scale */}
        <div className="property-group">
          <label>Scale</label>
          <div className="property-row">
            <div className="property-field">
              <span className="axis-label x">X</span>
              <input type="number" value={selectedShape.scale[0].toFixed(2)}
                onChange={(e) => handleScaleChange('x', parseFloat(e.target.value) || 1)}
                step={0.1} min={0.1} className="property-input" />
            </div>
            <div className="property-field">
              <span className="axis-label y">Y</span>
              <input type="number" value={selectedShape.scale[1].toFixed(2)}
                onChange={(e) => handleScaleChange('y', parseFloat(e.target.value) || 1)}
                step={0.1} min={0.1} className="property-input" />
            </div>
            <div className="property-field">
              <span className="axis-label z">Z</span>
              <input type="number" value={selectedShape.scale[2].toFixed(2)}
                onChange={(e) => handleScaleChange('z', parseFloat(e.target.value) || 1)}
                step={0.1} min={0.1} className="property-input" />
            </div>
          </div>
        </div>

        {/* Color */}
        <div className="property-group">
          <label>Color</label>
          <div className="color-picker">
            <input type="color" value={selectedShape.color}
              onChange={(e) => handleColorChange(e.target.value)}
              className="color-input" />
            <div className="color-presets">
              {DEFAULT_COLORS.map((color) => (
                <button
                  key={color}
                  className={`color-swatch ${selectedShape.color === color ? 'active' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorChange(color)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Material Properties */}
        <div className="property-group">
          <label>Material</label>
          <div className="property-row">
            <div className="property-field">
              <span className="property-label">Metalness</span>
              <input type="range" min={0} max={1} step={0.05}
                value={selectedShape.metalness ?? 0.1}
                onChange={(e) => updateShape(selectedShape.id, { metalness: parseFloat(e.target.value) })}
                className="property-slider" />
            </div>
            <div className="property-field">
              <span className="property-label">Roughness</span>
              <input type="range" min={0} max={1} step={0.05}
                value={selectedShape.roughness ?? 0.7}
                onChange={(e) => updateShape(selectedShape.id, { roughness: parseFloat(e.target.value) })}
                className="property-slider" />
            </div>
          </div>
        </div>

        {/* Edge Smoothness */}
        <div className="property-group">
          <label>Edge Smoothness</label>
          <div className="property-row">
            <div className="property-field" style={{ flex: 1 }}>
              <input type="range" min={0} max={1} step={0.01}
                value={selectedShape.cornerRadius ?? 0}
                onChange={(e) => updateShape(selectedShape.id, { cornerRadius: parseFloat(e.target.value) })}
                className="property-slider" />
            </div>
            <span className="property-value">{((selectedShape.cornerRadius ?? 0) * 100).toFixed(0)}%</span>
          </div>
        </div>

        {/* Toggles */}
        <div className="property-group">
          <label>Options</label>
          <div className="toggle-row">
            <button className={`toggle-btn ${selectedShape.isHole ? 'active' : ''}`} onClick={handleHoleToggle}>
              Hole
            </button>
            <button className={`toggle-btn ${selectedShape.visible ? 'active' : ''}`} onClick={handleVisibilityToggle}>
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
