import React from 'react';
import { DEFAULT_COLORS } from '../../utils/constants';

export const MaterialProperties = ({ selectedShape, inputClass, labelClass, updateShape, handleColorChange, handleHoleToggle, handleVisibilityToggle, handleLockToggle }) => {
  return (
    <>
      <div>
        <label className={labelClass}>Color</label>
        <div className="flex flex-col gap-3">
          <input type="color" value={selectedShape.color}
            onChange={(e) => handleColorChange(e.target.value)}
            className="w-full h-10 border border-slate-200 rounded-lg cursor-pointer p-1 bg-slate-50 transition-all hover:bg-slate-100" />
          <div className="flex flex-wrap gap-2 justify-start">
            {DEFAULT_COLORS.map((color) => (
              <button
                key={color}
                className={`w-7 h-7 rounded-md cursor-pointer transition-all duration-150 hover:scale-115 border-[3px] shadow-[0_0_0_2px_rgba(255,255,255,1)] ${selectedShape.color.toLowerCase() === color.toLowerCase() ? 'border-indigo-600 scale-110 shadow-[0_0_0_2px_rgba(255,255,255,1)]' : 'border-transparent hover:border-slate-300'}`}
                style={{ backgroundColor: color }}
                onClick={() => handleColorChange(color)}
              />
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className={labelClass}>Material</label>
        <div className="flex flex-col gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500">Metalness</span>
              <span className="text-xs font-black text-indigo-600">{((selectedShape.metalness ?? 0.1) * 100).toFixed(0)}%</span>
            </div>
            <input type="range" min={0} max={1} step={0.05}
              value={selectedShape.metalness ?? 0.1}
              onChange={(e) => updateShape(selectedShape.id, { metalness: parseFloat(e.target.value) })}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500">Roughness</span>
              <span className="text-xs font-black text-indigo-600">{((selectedShape.roughness ?? 0.7) * 100).toFixed(0)}%</span>
            </div>
            <input type="range" min={0} max={1} step={0.05}
              value={selectedShape.roughness ?? 0.7}
              onChange={(e) => updateShape(selectedShape.id, { roughness: parseFloat(e.target.value) })}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
          </div>
        </div>
      </div>

      <div>
        <label className={labelClass}>Edge Smoothness</label>
        <div className="flex flex-col gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Bevel</span>
            <span className="text-xs font-black text-indigo-600">{((selectedShape.cornerRadius ?? 0) * 100).toFixed(0)}%</span>
          </div>
          <input type="range" min={0} max={1} step={0.01}
            value={selectedShape.cornerRadius ?? 0}
            onChange={(e) => updateShape(selectedShape.id, { cornerRadius: parseFloat(e.target.value) })}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
        </div>
      </div>

      <div>
        <label className={labelClass}>Options</label>
        <div className="flex gap-2">
          <button className={`flex-1 py-2 px-3 text-[12px] font-bold rounded-lg border transition-all duration-150 cursor-pointer ${selectedShape.isHole ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`} onClick={handleHoleToggle}>
            Hole
          </button>
          <button className={`flex-1 py-2 px-3 text-[12px] font-bold rounded-lg border transition-all duration-150 cursor-pointer ${selectedShape.visible ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`} onClick={handleVisibilityToggle}>
            Visible
          </button>
          <button className={`flex-1 py-2 px-3 text-[12px] font-bold rounded-lg border transition-all duration-150 cursor-pointer ${selectedShape.locked ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`} onClick={handleLockToggle}>
            Locked
          </button>
        </div>
      </div>
    </>
  );
};
