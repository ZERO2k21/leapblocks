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
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: '#0f172a', display: 'flex', flexDirection: 'column', zIndex: 10000,
    }}>
      <div style={{
        padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#1e293b', borderBottom: '1px solid #334155', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#818cf8" strokeWidth="2">
            <polygon points="5,3 19,12 5,21" />
          </svg>
          <span style={{ color: '#e2e8f0', fontSize: 17, fontWeight: 600 }}>How to Make a {label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={handleReset} style={{
            background: '#334155', border: '1px solid #475569', color: '#e2e8f0',
            padding: '7px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13,
          }}>Reset</button>
          <button onClick={onClose} style={{
            background: '#334155', border: '1px solid #475569', color: '#e2e8f0',
            padding: '7px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13,
          }}>&times; Close</button>
        </div>
      </div>
      <div style={{ flex: 1, position: 'relative' }}>
        <Canvas camera={{ position: [6, 5, 6], fov: 50 }} shadows style={{ background: '#f8fafc' }}>
          <NetScene data={data} t={t} shapeType={shape.type} />
        </Canvas>
        <div style={{
          position: 'absolute', top: 16, left: 16, background: 'rgba(30,41,59,0.94)',
          borderRadius: 10, padding: '14px 16px', color: '#e2e8f0', fontSize: 13, minWidth: 150,
        }}>
          <div style={{ fontWeight: 700, marginBottom: 8, color: '#a5b4fc' }}>{label}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: '#94a3b8' }}>Faces</span><span>{has.f}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: '#94a3b8' }}>Edges</span><span>{has.e}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: '#94a3b8' }}>Vertices</span><span>{has.v}</span>
          </div>
          <div style={{ borderTop: '1px solid #334155', paddingTop: 8 }}>
            {(data.flat || []).map(function (f) {
              return (
                <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: f.color }} />
                  <span style={{ color: '#cbd5e1', fontSize: 12 }}>{f.id}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{
          position: 'absolute', bottom: 16, left: 16, background: 'rgba(30,41,59,0.9)',
          borderRadius: 6, padding: '8px 12px', color: '#94a3b8', fontSize: 11,
        }}>
          Drag to rotate &bull; Scroll to zoom
        </div>
      </div>
      <div style={{
        padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14,
        background: '#1e293b', borderTop: '1px solid #334155', flexShrink: 0,
      }}>
        <span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600, minWidth: 50 }}>Flat Net</span>
        <input type="range" min={0} max={100} value={Math.round(t * 100)}
          onChange={function (e) { setT(parseInt(e.target.value) / 100); setPlaying(false); }}
          style={{ flex: 1, accentColor: '#818cf8', height: 6 }} />
        <span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600, minWidth: 50 }}>3D Shape</span>
        <span style={{ color: '#818cf8', fontSize: 15, fontWeight: 700, minWidth: 50, textAlign: 'right' }}>
          {Math.round(t * 100)}%
        </span>
      </div>
    </div>
  );
};

export default ShapeNet;
