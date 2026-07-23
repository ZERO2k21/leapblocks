/**
 * Vision3D - Interactive 3D Net Folding Animations
 * Shows how 3D shapes are constructed from their nets.
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { getNetFaces, SHAPE_NAMES, NET_HAS } from './shapeNet/netDefinitions';
import { NetScene } from './shapeNet/NetScene';


const ShapeNet = ({ shape, onClose }) => {
  const data = useMemo(function () { return getNetFaces(shape); }, [shape]);
  const label = SHAPE_NAMES[shape.type] || shape.type;
  const has = NET_HAS[shape.type] || { f: 0, e: 0, v: 0 };
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [completed, setCompleted] = useState(false);

  useEffect(function () {
    if (!playing) return;
    const start = performance.now();
    const duration = 3000;
    let id;

    function tick() {
      const elapsed = (performance.now() - start) / duration;
      const p = Math.min(elapsed, 1);
      setT(p);
      if (p < 1) {
        id = requestAnimationFrame(tick);
      } else {
        setCompleted(true);
      }
    }

    id = requestAnimationFrame(tick);
    return function () { cancelAnimationFrame(id); };
  }, [playing, shape.type]);

  const handleReset = function () {
    setT(0);
    setPlaying(true);
    setCompleted(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col z-[10000]">
      <div className="p-3 px-5 flex items-center justify-between bg-slate-800 border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 24 24" className="w-5.5 h-5.5 fill-none stroke-indigo-400 stroke-2">
            <polygon points="5,3 19,12 5,21" />
          </svg>
          <span className="text-slate-200 text-[17px] font-semibold">How to Make a {label}</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleReset} 
            className="bg-slate-700 border border-slate-600 text-slate-200 p-1.75 px-3.5 rounded-md cursor-pointer text-xs transition-all hover:bg-slate-600"
          >
            Reset
          </button>
          <button 
            onClick={onClose} 
            className="bg-slate-700 border border-slate-600 text-slate-200 p-1.75 px-3.5 rounded-md cursor-pointer text-xs transition-all hover:bg-slate-600"
          >
            &times; Close
          </button>
        </div>
      </div>
      <div className="flex-1 relative">
        <Canvas camera={{ position: [6, 5, 6], fov: 50 }} shadows className="bg-slate-50">
          <NetScene data={data} t={t} shapeType={shape.type} />
        </Canvas>
        <div className="absolute top-4 left-4 bg-slate-800/94 rounded-xl p-3.5 px-4 text-slate-200 text-xs min-w-[150px]">
          <div className="font-bold mb-2 text-indigo-300">{label}</div>
          <div className="flex justify-between mb-1">
            <span className="text-slate-400">Faces</span><span>{has.f}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-slate-400">Edges</span><span>{has.e}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-slate-400">Vertices</span><span>{has.v}</span>
          </div>
          <div className="border-t border-slate-700 pt-2">
            {(data.flat || []).map(function (f) {
              return (
                <div key={f.id} className="flex items-center gap-1.5 mb-0.75">
                  <div className="w-2.5 h-2.5 rounded-xs" style={{ background: f.color }} />
                  <span className="text-slate-300 text-xs">{f.id}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="absolute bottom-4 left-4 bg-slate-800/90 rounded-md p-2 px-3 text-slate-400 text-[11px]">
          Drag to rotate &bull; Scroll to zoom
        </div>
      </div>
      <div className="p-3.5 px-5 flex items-center gap-3.5 bg-slate-800 border-t border-slate-700 shrink-0">
        <span className="text-slate-400 text-xs font-semibold min-w-[50px]">Flat Net</span>
        <input 
          type="range" 
          min={0} 
          max={100} 
          value={Math.round(t * 100)}
          onChange={function (e) { setT(parseInt(e.target.value) / 100); setPlaying(false); }}
          className="flex-1 accent-indigo-400 h-1.5 cursor-pointer" 
        />
        <span className="text-slate-400 text-xs font-semibold min-w-[50px]">3D Shape</span>
        <span className="text-indigo-400 text-sm font-bold min-w-[50px] text-right">
          {Math.round(t * 100)}%
        </span>
      </div>
    </div>
  );
};

export default ShapeNet;
