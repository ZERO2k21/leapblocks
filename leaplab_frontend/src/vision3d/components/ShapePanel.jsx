/**
 * Vision3D - Shape Panel Component
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import React from 'react';
import { use3DStore } from '../store/use3DStore';
import { SHAPE_DEFINITIONS } from '../utils/constants';
import { log } from '../utils/logger';

export const ShapePanel = () => {
  const addShape = use3DStore((s) => s.addShape);

  const basicShapes = SHAPE_DEFINITIONS.filter((s) => s.category === 'basic');
  const extendedShapes = SHAPE_DEFINITIONS.filter((s) => s.category === 'extended');
  const textShapes = SHAPE_DEFINITIONS.filter((s) => s.category === 'text');

  const handleDragStart = (e, type) => {
    log('ShapePanel: dragStart type=' + type);
    e.dataTransfer.setData('shapeType', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleShapeClick = (type) => {
    log('ShapePanel: shapeClick type=' + type);
    const x = (Math.random() - 0.5) * 6;
    const z = (Math.random() - 0.5) * 6;
    addShape(type, [x, 1, z]);
  };

  return (
    <div className="shape-panel">
      <div className="shape-panel-header">
        <h3>Shapes</h3>
      </div>

      <div className="shape-panel-content">
        <div className="shape-section">
          <div className="shape-section-title">Basic</div>
          <div className="shape-grid">
            {basicShapes.map((shapeDef) => (
              <div
                key={shapeDef.type}
                className="shape-item"
                draggable
                onDragStart={(e) => handleDragStart(e, shapeDef.type)}
                onClick={() => handleShapeClick(shapeDef.type)}
                title={shapeDef.name}
              >
                <div className="shape-icon">{shapeDef.icon}</div>
                <div className="shape-name">{shapeDef.name}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="shape-section">
          <div className="shape-section-title">Extended</div>
          <div className="shape-grid">
            {extendedShapes.map((shapeDef) => (
              <div
                key={shapeDef.type}
                className="shape-item"
                draggable
                onDragStart={(e) => handleDragStart(e, shapeDef.type)}
                onClick={() => handleShapeClick(shapeDef.type)}
                title={shapeDef.name}
              >
                <div className="shape-icon">{shapeDef.icon}</div>
                <div className="shape-name">{shapeDef.name}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="shape-section">
          <div className="shape-section-title">Text</div>
          <div className="shape-grid">
            {textShapes.map((shapeDef) => (
              <div
                key={shapeDef.type}
                className="shape-item"
                draggable
                onDragStart={(e) => handleDragStart(e, shapeDef.type)}
                onClick={() => handleShapeClick(shapeDef.type)}
                title={shapeDef.name}
              >
                <div className="shape-icon">{shapeDef.icon}</div>
                <div className="shape-name">{shapeDef.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
