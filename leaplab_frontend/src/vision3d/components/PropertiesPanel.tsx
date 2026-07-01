/**
 * Vision3D - Properties Panel Component
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import React from 'react';
import { use3DStore } from '../store/use3DStore';
import { DEFAULT_COLORS } from '../utils/constants';
import { log, debug } from '../utils/logger';

export const PropertiesPanel: React.FC = () => {
  const shapes = use3DStore((s) => s.shapes);
  const selectedIds = use3DStore((s) => s.selectedIds);
  const updateShape = use3DStore((s) => s.updateShape);

  const selectedShape = shapes.find((s) => s.id === selectedIds[0]);

  if (!selectedShape) {
    return (
      <div className="properties-panel">
        <div className="properties-panel-header">
          <h3>Properties</h3>
        </div>
        <div className="properties-empty">
          <p>Select an object to view its properties</p>
        </div>
      </div>
    );
  }

  const handlePositionChange = (axis: 'x' | 'y' | 'z', value: number) => {
    debug('PropertiesPanel: position ' + axis + '=' + value.toFixed(2) + ' id=' + selectedShape.id);
    const newPosition: [number, number, number] = [...selectedShape.position];
    const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
    newPosition[axisIndex] = value;
    updateShape(selectedShape.id, { position: newPosition });
  };

  const handleRotationChange = (axis: 'x' | 'y' | 'z', value: number) => {
    log.debug('PropertiesPanel: rotation ' + axis + '=' + value + 'deg id=' + selectedShape.id);
    const newRotation: [number, number, number] = [...selectedShape.rotation];
    const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
    newRotation[axisIndex] = (value * Math.PI) / 180;
    updateShape(selectedShape.id, { rotation: newRotation });
  };

  const handleScaleChange = (axis: 'x' | 'y' | 'z', value: number) => {
    log.debug('PropertiesPanel: scale ' + axis + '=' + value.toFixed(2) + ' id=' + selectedShape.id);
    const newScale: [number, number, number] = [...selectedShape.scale];
    const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
    newScale[axisIndex] = Math.max(0.1, value);
    updateShape(selectedShape.id, { scale: newScale });
  };

  const handleColorChange = (color: string) => {
    log.debug('PropertiesPanel: color=' + color + ' id=' + selectedShape.id);
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

  const updateProp = (key: string, value: number | string) => {
    log.debug('PropertiesPanel: prop ' + key + '=' + value + ' id=' + selectedShape.id);
    updateShape(selectedShape.id, { [key]: value } as any);
  };

  return (
    <div className="properties-panel">
      <div className="properties-panel-header">
        <h3>Properties</h3>
        <span className="shape-type-badge">{selectedShape.type}</span>
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
        {(selectedShape.type === 'box') && (
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
              <input
                type="number"
                value={selectedShape.position[0].toFixed(2)}
                onChange={(e) => handlePositionChange('x', parseFloat(e.target.value) || 0)}
                step={0.1}
                className="property-input"
              />
            </div>
            <div className="property-field">
              <span className="axis-label y">Y</span>
              <input
                type="number"
                value={selectedShape.position[1].toFixed(2)}
                onChange={(e) => handlePositionChange('y', parseFloat(e.target.value) || 0)}
                step={0.1}
                className="property-input"
              />
            </div>
            <div className="property-field">
              <span className="axis-label z">Z</span>
              <input
                type="number"
                value={selectedShape.position[2].toFixed(2)}
                onChange={(e) => handlePositionChange('z', parseFloat(e.target.value) || 0)}
                step={0.1}
                className="property-input"
              />
            </div>
          </div>
        </div>

        {/* Rotation */}
        <div className="property-group">
          <label>Rotation (degrees)</label>
          <div className="property-row">
            <div className="property-field">
              <span className="axis-label x">X</span>
              <input
                type="number"
                value={((selectedShape.rotation[0] * 180) / Math.PI).toFixed(1)}
                onChange={(e) => handleRotationChange('x', parseFloat(e.target.value) || 0)}
                step={15}
                className="property-input"
              />
            </div>
            <div className="property-field">
              <span className="axis-label y">Y</span>
              <input
                type="number"
                value={((selectedShape.rotation[1] * 180) / Math.PI).toFixed(1)}
                onChange={(e) => handleRotationChange('y', parseFloat(e.target.value) || 0)}
                step={15}
                className="property-input"
              />
            </div>
            <div className="property-field">
              <span className="axis-label z">Z</span>
              <input
                type="number"
                value={((selectedShape.rotation[2] * 180) / Math.PI).toFixed(1)}
                onChange={(e) => handleRotationChange('z', parseFloat(e.target.value) || 0)}
                step={15}
                className="property-input"
              />
            </div>
          </div>
        </div>

        {/* Scale */}
        <div className="property-group">
          <label>Scale</label>
          <div className="property-row">
            <div className="property-field">
              <span className="axis-label x">X</span>
              <input
                type="number"
                value={selectedShape.scale[0].toFixed(2)}
                onChange={(e) => handleScaleChange('x', parseFloat(e.target.value) || 1)}
                step={0.1}
                min={0.1}
                className="property-input"
              />
            </div>
            <div className="property-field">
              <span className="axis-label y">Y</span>
              <input
                type="number"
                value={selectedShape.scale[1].toFixed(2)}
                onChange={(e) => handleScaleChange('y', parseFloat(e.target.value) || 1)}
                step={0.1}
                min={0.1}
                className="property-input"
              />
            </div>
            <div className="property-field">
              <span className="axis-label z">Z</span>
              <input
                type="number"
                value={selectedShape.scale[2].toFixed(2)}
                onChange={(e) => handleScaleChange('z', parseFloat(e.target.value) || 1)}
                step={0.1}
                min={0.1}
                className="property-input"
              />
            </div>
          </div>
        </div>

        {/* Color */}
        <div className="property-group">
          <label>Color</label>
          <div className="color-picker">
            <input
              type="color"
              value={selectedShape.color}
              onChange={(e) => handleColorChange(e.target.value)}
              className="color-input"
            />
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
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={selectedShape.metalness ?? 0.1}
                onChange={(e) =>
                  updateShape(selectedShape.id, { metalness: parseFloat(e.target.value) })
                }
                className="property-slider"
              />
            </div>
            <div className="property-field">
              <span className="property-label">Roughness</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={selectedShape.roughness ?? 0.7}
                onChange={(e) =>
                  updateShape(selectedShape.id, { roughness: parseFloat(e.target.value) })
                }
                className="property-slider"
              />
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="property-group">
          <label>Options</label>
          <div className="toggle-row">
            <button
              className={`toggle-btn ${selectedShape.isHole ? 'active' : ''}`}
              onClick={handleHoleToggle}
            >
              Hole
            </button>
            <button
              className={`toggle-btn ${selectedShape.visible ? 'active' : ''}`}
              onClick={handleVisibilityToggle}
            >
              Visible
            </button>
            <button
              className={`toggle-btn ${selectedShape.locked ? 'active' : ''}`}
              onClick={handleLockToggle}
            >
              Locked
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
