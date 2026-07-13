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

  const labelClass = "text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1 block";

  return (
    <div className="flex flex-col h-full bg-white select-none">
      <div className="border-b border-slate-200" style={{ padding: '20px' }}>
        <h3 className="m-0 text-[17px] font-extrabold text-slate-800 font-sans tracking-tight font-sans">Shapes</h3>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-6" style={{ padding: '16px 20px 20px 20px' }}>
        <div>
          <div className={labelClass}>Basic</div>
          <div className="grid grid-cols-2 gap-3">
            {basicShapes.map((shapeDef) => (
              <div
                key={shapeDef.type}
                className="flex flex-col items-center p-4 bg-slate-50 border border-slate-200 rounded-xl cursor-grab transition-all duration-200 hover:bg-slate-100 hover:border-indigo-500 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(99,102,241,0.12)] active:cursor-grabbing active:translate-y-0"
                draggable
                onDragStart={(e) => handleDragStart(e, shapeDef.type)}
                onClick={() => handleShapeClick(shapeDef.type)}
                title={shapeDef.name}
              >
                <div className="text-[26px] mb-2 filter drop-shadow-sm">{shapeDef.icon}</div>
                <div className="text-[11px] font-bold text-slate-600 text-center">{shapeDef.name}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className={labelClass}>Extended</div>
          <div className="grid grid-cols-2 gap-3">
            {extendedShapes.map((shapeDef) => (
              <div
                key={shapeDef.type}
                className="flex flex-col items-center p-4 bg-slate-50 border border-slate-200 rounded-xl cursor-grab transition-all duration-200 hover:bg-slate-100 hover:border-indigo-500 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(99,102,241,0.12)] active:cursor-grabbing active:translate-y-0"
                draggable
                onDragStart={(e) => handleDragStart(e, shapeDef.type)}
                onClick={() => handleShapeClick(shapeDef.type)}
                title={shapeDef.name}
              >
                <div className="text-[26px] mb-2 filter drop-shadow-sm">{shapeDef.icon}</div>
                <div className="text-[11px] font-bold text-slate-600 text-center">{shapeDef.name}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className={labelClass}>Text</div>
          <div className="grid grid-cols-2 gap-3">
            {textShapes.map((shapeDef) => (
              <div
                key={shapeDef.type}
                className="flex flex-col items-center p-4 bg-slate-50 border border-slate-200 rounded-xl cursor-grab transition-all duration-200 hover:bg-slate-100 hover:border-indigo-500 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(99,102,241,0.12)] active:cursor-grabbing active:translate-y-0"
                draggable
                onDragStart={(e) => handleDragStart(e, shapeDef.type)}
                onClick={() => handleShapeClick(shapeDef.type)}
                title={shapeDef.name}
              >
                <div className="text-[26px] mb-2 filter drop-shadow-sm">{shapeDef.icon}</div>
                <div className="text-[11px] font-bold text-slate-600 text-center">{shapeDef.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
