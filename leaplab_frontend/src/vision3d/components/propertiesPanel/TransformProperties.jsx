import React, { useState, useEffect, useRef } from 'react';

const NumberField = ({ value, onCommit, step, min, digits, inputClass }) => {
  const formatted = Number(value).toFixed(digits);
  const [local, setLocal] = useState(formatted);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!focused) setLocal(formatted);
  }, [formatted, focused]);

  const commit = () => {
    setFocused(false);
    const parsed = parseFloat(local);
    if (Number.isNaN(parsed)) {
      setLocal(formatted);
      return;
    }
    const clamped = min !== undefined ? Math.max(min, parsed) : parsed;
    if (clamped !== value) onCommit(clamped);
    else setLocal(formatted);
  };

  const handleFocus = (e) => {
    setFocused(true);
    setLocal(formatted);
    requestAnimationFrame(() => {
      try { e.target.select(); } catch {}
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setLocal(formatted);
      setFocused(false);
      e.currentTarget.blur();
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      value={focused ? local : formatted}
      onChange={(e) => setLocal(e.target.value)}
      onFocus={handleFocus}
      onBlur={commit}
      onKeyDown={handleKeyDown}
      className={inputClass}
    />
  );
};

export const TransformProperties = ({ selectedShape, inputClass, labelClass, handlePositionChange, handleRotationChange, handleScaleChange }) => {
  return (
    <>
      <div>
        <label className={labelClass}>Position</label>
        <div className="flex gap-2">
          <div className="flex-1 flex flex-col gap-1 min-w-0">
            <span className="text-[10px] font-extrabold text-red-500 text-center uppercase tracking-wider">X</span>
            <NumberField value={selectedShape.position[0]} digits={2} step={0.1} onCommit={(v) => handlePositionChange('x', v)} inputClass={inputClass} />
          </div>
          <div className="flex-1 flex flex-col gap-1 min-w-0">
            <span className="text-[10px] font-extrabold text-green-500 text-center uppercase tracking-wider">Y</span>
            <NumberField value={selectedShape.position[1]} digits={2} step={0.1} onCommit={(v) => handlePositionChange('y', v)} inputClass={inputClass} />
          </div>
          <div className="flex-1 flex flex-col gap-1 min-w-0">
            <span className="text-[10px] font-extrabold text-blue-500 text-center uppercase tracking-wider">Z</span>
            <NumberField value={selectedShape.position[2]} digits={2} step={0.1} onCommit={(v) => handlePositionChange('z', v)} inputClass={inputClass} />
          </div>
        </div>
      </div>

      <div>
        <label className={labelClass}>Rotation (degrees)</label>
        <div className="flex gap-2">
          <div className="flex-1 flex flex-col gap-1 min-w-0">
            <span className="text-[10px] font-extrabold text-red-500 text-center uppercase tracking-wider">X</span>
            <NumberField value={(selectedShape.rotation[0] * 180) / Math.PI} digits={1} step={15} onCommit={(v) => handleRotationChange('x', v)} inputClass={inputClass} />
          </div>
          <div className="flex-1 flex flex-col gap-1 min-w-0">
            <span className="text-[10px] font-extrabold text-green-500 text-center uppercase tracking-wider">Y</span>
            <NumberField value={(selectedShape.rotation[1] * 180) / Math.PI} digits={1} step={15} onCommit={(v) => handleRotationChange('y', v)} inputClass={inputClass} />
          </div>
          <div className="flex-1 flex flex-col gap-1 min-w-0">
            <span className="text-[10px] font-extrabold text-blue-500 text-center uppercase tracking-wider">Z</span>
            <NumberField value={(selectedShape.rotation[2] * 180) / Math.PI} digits={1} step={15} onCommit={(v) => handleRotationChange('z', v)} inputClass={inputClass} />
          </div>
        </div>
      </div>

      <div>
        <label className={labelClass}>Scale</label>
        <div className="flex gap-2">
          <div className="flex-1 flex flex-col gap-1 min-w-0">
            <span className="text-[10px] font-extrabold text-red-500 text-center uppercase tracking-wider">X</span>
            <NumberField value={selectedShape.scale[0]} digits={2} step={0.1} min={0.1} onCommit={(v) => handleScaleChange('x', v)} inputClass={inputClass} />
          </div>
          <div className="flex-1 flex flex-col gap-1 min-w-0">
            <span className="text-[10px] font-extrabold text-green-500 text-center uppercase tracking-wider">Y</span>
            <NumberField value={selectedShape.scale[1]} digits={2} step={0.1} min={0.1} onCommit={(v) => handleScaleChange('y', v)} inputClass={inputClass} />
          </div>
          <div className="flex-1 flex flex-col gap-1 min-w-0">
            <span className="text-[10px] font-extrabold text-blue-500 text-center uppercase tracking-wider">Z</span>
            <NumberField value={selectedShape.scale[2]} digits={2} step={0.1} min={0.1} onCommit={(v) => handleScaleChange('z', v)} inputClass={inputClass} />
          </div>
        </div>
      </div>
    </>
  );
};
