import React, { useState, lazy, Suspense, useRef, useEffect } from 'react';
import { Home, Play, Square, Save, FolderOpen, Settings, Layers, Box } from 'lucide-react';
// Register internal leaplab forge elements (rebranded Wokwi)
import './lib/leap-elements/src/index';
import './ForgeStudio.css';
import ScriptRunner from './engine/ScriptRunner';

// Lazy load complex inner components
const ForgeCanvas = lazy(() => import('./components/ForgeCanvas'));
const Sidebar = lazy(() => import('./components/Sidebar'));
const ForgeEditor = lazy(() => import('./components/Editor/ForgeEditor'));

interface ForgeStudioProps {
  onBack: () => void;
}

export default function ForgeStudio({ onBack }: ForgeStudioProps) {
  const [isSimulating, setIsSimulating] = useState(false);
  const runnerRef = useRef<ScriptRunner | null>(null);
  
  const [code, setCode] = useState(`// LeapForge Sketch
void setup() {
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH);
  delay(1000);
  digitalWrite(13, LOW);
  delay(1000);
}`);

  const toggleSimulation = () => {
    if (isSimulating) {
      runnerRef.current?.stop();
      setIsSimulating(false);
    } else {
      const runner = new ScriptRunner(code);
      runnerRef.current = runner;
      runner.start();
      setIsSimulating(true);
    }
  };

  useEffect(() => {
    return () => {
      runnerRef.current?.stop();
    };
  }, []);

  return (
    <div className="forge-root dark" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ── TOPBAR ──────────────────────────── */}
      <header className="forge-topbar" style={{ 
        height: '48px', 
        background: '#1a1a1b', 
        borderBottom: '1px solid #2d2d2d',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        justifyContent: 'space-between'
      }}>
        <div className="forge-topbar-left" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}>
            <Home size={18} />
          </button>
          <div style={{ color: '#e0e0e0', fontWeight: 'bold' }}>LeapLab <span style={{ color: '#BEF264' }}>Forge</span></div>
        </div>

        <div className="forge-controls">
          <button 
            onClick={toggleSimulation}
            style={{
              background: isSimulating ? '#ef4444' : '#BEF264',
              color: isSimulating ? '#fff' : '#000',
              border: 'none',
              padding: '6px 16px',
              borderRadius: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
          >
            {isSimulating ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
            <span>{isSimulating ? 'Stop' : 'Play'}</span>
          </button>
        </div>

        <div className="forge-topbar-right" style={{ display: 'flex', gap: '10px' }}>
          <button className="action-icon" title="Save Project"><Save size={18} /></button>
          <button className="action-icon" title="Open Project"><FolderOpen size={18} /></button>
          <button className="action-icon" title="Settings"><Settings size={18} /></button>
        </div>
      </header>

      {/* ── MAIN SPLIT LAYOUT ────────────────── */}
      <div className="forge-main-split" style={{ flex: 1, display: 'flex', background: '#0f172a' }}>
        {/* Left: Code Editor */}
        <div className="editor-pane" style={{ flex: 1, borderRight: '1px solid #2d2d2d' }}>
          <Suspense fallback={<div className="forge-loader">Loading Editor...</div>}>
            <ForgeEditor code={code} onChange={(val) => setCode(val || '')} />
          </Suspense>
        </div>

        {/* Right: Circuit Canvas */}
        <div className="canvas-pane" style={{ flex: 1, position: 'relative' }}>
          <Suspense fallback={<div className="forge-loader">Initializing Canvas...</div>}>
            <ForgeCanvas />
          </Suspense>
        </div>
      </div>

      {/* ── FOOTER ──────────────────────────── */}
      <footer className="forge-footer" style={{ 
        height: '28px', 
        background: '#1a1a1b', 
        borderTop: '1px solid #2d2d2d',
        fontSize: '11px',
        color: '#888',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', gap: '15px' }}>
          <span>Engine: <b style={{ color: '#BEF264' }}>LeapLab Simulator v1.0</b></span>
          {isSimulating && <span style={{ color: '#ef4444' }}>● Simulation Live</span>}
        </div>
        <div>
          {new Date().toLocaleTimeString()}
        </div>
      </footer>
    </div>
  );
}
