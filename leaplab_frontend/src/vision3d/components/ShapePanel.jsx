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
    <div className="flex flex-col h-full">
      <div className="p-[12px_14px] border-b border-slate-200">
        <h3 className="m-0 text-[13px] font-semibold text-slate-900">Shapes</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-2.5">
        <div className="mb-3">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 px-1">Basic</div>
          <div className="grid grid-cols-2 gap-1.25">
            {basicShapes.map((shapeDef) => (
              <div
                key={shapeDef.type}
                className="flex flex-col items-center p-[8px_4px] bg-slate-50 border border-slate-200 rounded-md cursor-grab transition-all duration-200 select-none hover:bg-slate-100 hover:border-indigo-500 hover:-translate-y-px hover:shadow-[0_3px_8px_rgba(99,102,241,0.12)] active:cursor-grabbing active:translate-y-0"
                draggable
                onDragStart={(e) => handleDragStart(e, shapeDef.type)}
                onClick={() => handleShapeClick(shapeDef.type)}
                title={shapeDef.name}
              >
                <div className="text-[20px] mb-0.75">{shapeDef.icon}</div>
                <div className="text-[9px] font-medium text-slate-500 text-center">{shapeDef.name}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-3">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 px-1">Extended</div>
          <div className="grid grid-cols-2 gap-1.25">
            {extendedShapes.map((shapeDef) => (
              <div
                key={shapeDef.type}
                className="flex flex-col items-center p-[8px_4px] bg-slate-50 border border-slate-200 rounded-md cursor-grab transition-all duration-200 select-none hover:bg-slate-100 hover:border-indigo-500 hover:-translate-y-px hover:shadow-[0_3px_8px_rgba(99,102,241,0.12)] active:cursor-grabbing active:translate-y-0"
                draggable
                onDragStart={(e) => handleDragStart(e, shapeDef.type)}
                onClick={() => handleShapeClick(shapeDef.type)}
                title={shapeDef.name}
              >
                <div className="text-[20px] mb-0.75">{shapeDef.icon}</div>
                <div className="text-[9px] font-medium text-slate-500 text-center">{shapeDef.name}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-3">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 px-1">Text</div>
          <div className="grid grid-cols-2 gap-1.25">
            {textShapes.map((shapeDef) => (
              <div
                key={shapeDef.type}
                className="flex flex-col items-center p-[8px_4px] bg-slate-50 border border-slate-200 rounded-md cursor-grab transition-all duration-200 select-none hover:bg-slate-100 hover:border-indigo-500 hover:-translate-y-px hover:shadow-[0_3px_8px_rgba(99,102,241,0.12)] active:cursor-grabbing active:translate-y-0"
                draggable
                onDragStart={(e) => handleDragStart(e, shapeDef.type)}
                onClick={() => handleShapeClick(shapeDef.type)}
                title={shapeDef.name}
              >
                <div className="text-[20px] mb-0.75">{shapeDef.icon}</div>
                <div className="text-[9px] font-medium text-slate-500 text-center">{shapeDef.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
