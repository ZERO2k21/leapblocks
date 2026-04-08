import React, { useState, lazy, Suspense, useRef, useEffect } from 'react';
import { SerialMonitor } from './components/Editor/SerialMonitor';
import { Home, Save, FolderOpen, Settings, Play, Square, Code, Terminal } from 'lucide-react';
// Register official wokwi elements
import '@wokwi/elements';
import './ForgeStudio.css';
import { useForgeStore } from './store/useForgeStore';

// Lazy load complex inner components
const ForgeCanvas = lazy(() => import('./components/ForgeCanvas'));
const Sidebar = lazy(() => import('./components/Sidebar'));
const ForgeEditor = lazy(() => import('./components/Editor/ForgeEditor'));

interface ForgeStudioProps {
  onBack: () => void;
}

export default function ForgeStudio({ onBack }: ForgeStudioProps) {
  const { 
    nodes, 
    updateNodeData, 
    isSimulating, 
    startSimulation,
    stopSimulation,
    appendSerial,
    clearSerial,
    serialOutput
  } = useForgeStore();
  
  const [activeTab, setActiveTab] = useState<'code' | 'serial'>('code');
  
  const [code, setCode] = useState(`// LeapForge Serial Test
void setup() {
  Serial.begin(9600);
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH);
  Serial.println("LED ON");
  delay(1000);
  digitalWrite(13, LOW);
  Serial.println("LED OFF");
  delay(1000);
}`);

  const [isCompiling, setIsCompiling] = useState(false);
  const [compileError, setCompileError] = useState<string | null>(null);

  const handleToggleSimulation = async () => {
    console.log('[FORGE UI] Simulation button clicked. Currently simulating:', isSimulating);
    if (isSimulating) {
      console.log('[FORGE UI] Stopping simulation...');
      stopSimulation();
      return;
    }
    
    console.log('[FORGE UI] Preparing to compile code...');
    setIsCompiling(true);
    setCompileError(null);
    clearSerial();
    
    try {
      console.log('[FORGE UI] Sending IPC request to compileCode...');
      const result = await window.electronAPI.compileCode(code, 'arduino:avr:uno');
      console.log('[FORGE UI] IPC returned:', result.success ? 'Success' : 'Failed');
      
      if (result.success && result.hexContent) {
        console.log('[FORGE UI] Starting simulation with new hex code.');
        startSimulation(result.hexContent);
        appendSerial("Compilation successful. Simulation running...\n");
      } else {
        console.log('[FORGE UI] Compilation error:', result.error);
        setCompileError(result.error || 'Unknown compilation error');
        appendSerial(`[ERROR]: ${result.error || 'Unknown compilation error'}\n`);
      }
    } catch (err: any) {
      console.error('[FORGE UI] Exception during compilation:', err);
      setCompileError(err.message);
      appendSerial(`[ERROR]: ${err.message}\n`);
    } finally {
      setIsCompiling(false);
    }
  };

  // The new SimulationEngine (Phase 1-5) manages the loop internally via useForgeStore!
  // No need for duplicate useEffect mounts.

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
            type="button"
            onClick={handleToggleSimulation}
            disabled={isCompiling}
            className={`p-2 rounded-full flex items-center gap-2 transition-all ${
              isSimulating ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-green-500/20 text-green-400 border border-green-500/50'
            } ${isCompiling ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isCompiling ? (
               <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : isSimulating ? (
               <Square size={16} fill="currentColor" />
            ) : (
               <Play size={16} fill="currentColor" />
            )}
            <span className="text-xs font-bold uppercase tracking-wider">{isCompiling ? 'Compiling...' : isSimulating ? 'Stop' : 'Start Simulation'}</span>
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
        <div className="editor-pane" style={{ flex: 1, borderRight: '1px solid #2d2d2d', display: 'flex', flexDirection: 'column' }}>
          {/* ── EDITOR / MONITOR TABS ────────────────── */}
          <div style={{
            height: '36px',
            background: '#161b22',
            borderBottom: '1px solid #30363d',
            display: 'flex',
            padding: '0 16px'
          }}>
            <button 
              onClick={() => setActiveTab('code')}
              style={{ 
                background: activeTab === 'code' ? '#1f6feb' : 'transparent', 
                color: activeTab === 'code' ? '#fff' : '#8b949e',
                border: 'none',
                padding: '0 20px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
                borderBottom: activeTab === 'code' ? '2px solid #58a6ff' : 'none'
              }}
            >
              <Code size={14} /> SKETCH
            </button>
            <button 
              onClick={() => setActiveTab('serial')}
              style={{ 
                background: activeTab === 'serial' ? '#1f6feb' : 'transparent', 
                color: activeTab === 'serial' ? '#fff' : '#8b949e',
                border: 'none',
                padding: '0 20px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
                borderBottom: activeTab === 'serial' ? '2px solid #58a6ff' : 'none'
              }}
            >
              <Terminal size={14} /> SERIAL MONITOR {serialOutput.length > 0 && <span style={{ background: '#f85149', width: '6px', height: '6px', borderRadius: '50%' }} />}
            </button>
          </div>

          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            {activeTab === 'code' ? (
              <Suspense fallback={<div className="p-4 text-white">Loading Editor...</div>}>
                <ForgeEditor code={code} onChange={(val) => setCode(val || '')} />
              </Suspense>
            ) : (
              <SerialMonitor 
                output={serialOutput} 
                onClear={() => clearSerial()} 
              />
            )}
          </div>
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
