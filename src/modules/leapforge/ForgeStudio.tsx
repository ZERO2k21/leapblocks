import React, { useState, lazy, Suspense } from 'react';
import { Home, Play, Square, Save, FolderOpen, Settings, Layers, Box } from 'lucide-react';
// Register internal leaplab forge elements (rebranded Wokwi)
import '@leaplab/forge-elements';
import './ForgeStudio.css';

// Lazy load complex inner components
const ForgeCanvas = lazy(() => import('./components/ForgeCanvas'));
const Sidebar = lazy(() => import('./components/Sidebar'));

interface ForgeStudioProps {
  onBack: () => void;
}

export default function ForgeStudio({ onBack }: ForgeStudioProps) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeLayer, setActiveLayer] = useState<'schematic' | 'pcb'>('schematic');

  const toggleSimulation = () => {
    setIsSimulating(!isSimulating);
  };

  return (
    <div className="forge-root dark">
      {/* ── TOPBAR ──────────────────────────── */}
      <header className="forge-topbar">
        <div className="forge-topbar-left">
          <button className="forge-home-btn" onClick={onBack}>
            <Home size={18} />
          </button>
          <div className="forge-divider" />
          <div className="forge-brand">
            <span className="brand-leap">LeapLab</span>
            <span className="brand-forge">Forge</span>
          </div>
          <div className="forge-tag">PRO SIMULATOR</div>
        </div>

        <div className="forge-controls">
          <button 
            className={`control-btn ${isSimulating ? 'simulating' : ''}`} 
            onClick={toggleSimulation}
          >
            {isSimulating ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
            <span>{isSimulating ? 'Stop Simulation' : 'Run Simulation'}</span>
          </button>
        </div>

        <div className="forge-topbar-right">
          <button className="action-icon" title="Save Project"><Save size={18} /></button>
          <button className="action-icon" title="Open Project"><FolderOpen size={18} /></button>
          <div className="forge-divider" />
          <button className="action-icon" title="Settings"><Settings size={18} /></button>
        </div>
      </header>

      {/* ── MAIN LAYOUT ─────────────────────── */}
      <div className="forge-main">
        <Suspense fallback={<div className="forge-loader">Loading Sidebar...</div>}>
          <Sidebar />
        </Suspense>

        <section className="forge-workspace">
          <div className="workspace-header">
            <div className="layer-tabs">
              <button 
                className={`layer-tab ${activeLayer === 'schematic' ? 'active' : ''}`}
                onClick={() => setActiveLayer('schematic')}
              >
                <Layers size={14} />
                Schematic
              </button>
              <button 
                className={`layer-tab ${activeLayer === 'pcb' ? 'active' : ''}`}
                onClick={() => setActiveLayer('pcb')}
              >
                <Box size={14} />
                3D View
              </button>
            </div>
            <div className="workspace-status">
              {isSimulating && <span className="status-live">● LIVE</span>}
              <span className="grid-info">Grid: 10px</span>
            </div>
          </div>
          
          <div className="forge-canvas-container">
            <Suspense fallback={<div className="forge-loader">Initializing Canvas...</div>}>
              <ForgeCanvas />
            </Suspense>
          </div>
        </section>
      </div>

      {/* ── FOOTER/STATUS ───────────────────── */}
      <footer className="forge-footer">
        <div className="status-left">
          <span className="status-item">Engine: <b>LeapForge v1.0 (Internal)</b></span>
          <span className="status-item">Latency: <b>0.8ms</b></span>
        </div>
        <div className="status-right">
          <span>{new Date().toLocaleTimeString()}</span>
        </div>
      </footer>
    </div>
  );
}
