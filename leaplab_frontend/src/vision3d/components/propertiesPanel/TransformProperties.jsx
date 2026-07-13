import React from 'react';

export const TransformProperties = ({ selectedShape, inputClass, labelClass, handlePositionChange, handleRotationChange, handleScaleChange }) => {
  return (
    <>
      <div>
        <label className={labelClass}>Position</label>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-1.5">
            <span className="text-[13px] font-black w-4 text-center text-red-500">X</span>
            <input type="number" value={selectedShape.position[0].toFixed(2)}
              onChange={(e) => handlePositionChange('x', parseFloat(e.target.value) || 0)}
              step={0.1} className={inputClass} />
          </div>
          <div className="flex-1 flex items-center gap-1.5">
            <span className="text-[13px] font-black w-4 text-center text-green-500">Y</span>
            <input type="number" value={selectedShape.position[1].toFixed(2)}
              onChange={(e) => handlePositionChange('y', parseFloat(e.target.value) || 0)}
              step={0.1} className={inputClass} />
          </div>
          <div className="flex-1 flex items-center gap-1.5">
            <span className="text-[13px] font-black w-4 text-center text-blue-500">Z</span>
            <input type="number" value={selectedShape.position[2].toFixed(2)}
              onChange={(e) => handlePositionChange('z', parseFloat(e.target.value) || 0)}
              step={0.1} className={inputClass} />
          </div>
        </div>
      </div>

      <div>
        <label className={labelClass}>Rotation (degrees)</label>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-1.5">
            <span className="text-[13px] font-black w-4 text-center text-red-500">X</span>
            <input type="number" value={((selectedShape.rotation[0] * 180) / Math.PI).toFixed(1)}
              onChange={(e) => handleRotationChange('x', parseFloat(e.target.value) || 0)}
              step={15} className={inputClass} />
          </div>
          <div className="flex-1 flex items-center gap-1.5">
            <span className="text-[13px] font-black w-4 text-center text-green-500">Y</span>
            <input type="number" value={((selectedShape.rotation[1] * 180) / Math.PI).toFixed(1)}
              onChange={(e) => handleRotationChange('y', parseFloat(e.target.value) || 0)}
              step={15} className={inputClass} />
          </div>
          <div className="flex-1 flex items-center gap-1.5">
            <span className="text-[13px] font-black w-4 text-center text-blue-500">Z</span>
            <input type="number" value={((selectedShape.rotation[2] * 180) / Math.PI).toFixed(1)}
              onChange={(e) => handleRotationChange('z', parseFloat(e.target.value) || 0)}
              step={15} className={inputClass} />
          </div>
        </div>
      </div>

      <div>
        <label className={labelClass}>Scale</label>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-1.5">
            <span className="text-[13px] font-black w-4 text-center text-red-500">X</span>
            <input type="number" value={selectedShape.scale[0].toFixed(2)}
              onChange={(e) => handleScaleChange('x', parseFloat(e.target.value) || 1)}
              step={0.1} min={0.1} className={inputClass} />
          </div>
          <div className="flex-1 flex items-center gap-1.5">
            <span className="text-[13px] font-black w-4 text-center text-green-500">Y</span>
            <input type="number" value={selectedShape.scale[1].toFixed(2)}
              onChange={(e) => handleScaleChange('y', parseFloat(e.target.value) || 1)}
              step={0.1} min={0.1} className={inputClass} />
          </div>
          <div className="flex-1 flex items-center gap-1.5">
            <span className="text-[13px] font-black w-4 text-center text-blue-500">Z</span>
            <input type="number" value={selectedShape.scale[2].toFixed(2)}
              onChange={(e) => handleScaleChange('z', parseFloat(e.target.value) || 1)}
              step={0.1} min={0.1} className={inputClass} />
          </div>
        </div>
      </div>
    </>
  );
};
