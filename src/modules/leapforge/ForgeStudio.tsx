import React, { useState, lazy, Suspense, useRef, useEffect } from 'react';
import { SerialMonitor } from './components/Editor/SerialMonitor';
import { Home, Save, FolderOpen, Settings, Play, Square, Code, Terminal } from 'lucide-react';
// Register internal leaplab forge elements (rebranded Wokwi)
import './lib/leap-elements/src/index';
import './ForgeStudio.css';
import { LeapSimulator } from './lib/SimulatorEngine';
import { PinBridge } from './lib/PinBridge';
import { CompilerService } from './lib/CompilerService';
import { BLINK_HEX } from './lib/BlinkFirmware'; // Fallback hex if needed
import { useForgeStore } from './store/useForgeStore';

// Lazy load complex inner components
const ForgeCanvas = lazy(() => import('./components/ForgeCanvas'));
const Sidebar = lazy(() => import('./components/Sidebar'));
const ForgeEditor = lazy(() => import('./components/Editor/ForgeEditor'));

interface ForgeStudioProps {
  onBack: () => void;
}

export default function ForgeStudio({ onBack }: ForgeStudioProps) {
  const [isCompiling, setIsCompiling] = useState(false);
  const simulatorRef = useRef<LeapSimulator | null>(null);
  const { 
    nodes, 
    updateNodeData, 
    isSimulating, 
    toggleSimulation,
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

  useEffect(() => {
    const runSimulation = async () => {
      if (isSimulating) {
        // 1. Find board
        const arduinoNode = nodes.find(n => n.data?.type && (n.data.type === 'arduino-uno' || n.data.type === 'arduino-nano'));
        
        if (!arduinoNode) {
          const hasMega = nodes.find(n => n.data?.type === 'arduino-mega');
          if (hasMega) {
            alert('Arduino Mega simulation is currently in development. Please use Uno or Nano for real-time logic.');
          } else {
            alert('Please add an Arduino (Uno or Nano) to the canvas first!');
          }
          toggleSimulation();
          return;
        }

        // 2. Compile user code
        setIsCompiling(true);
        console.log(`[LeapForge] Compiling program for ${arduinoNode.data.type}...`);
        
        const compileResult = await CompilerService.compile(code);
        setIsCompiling(false);

        if (!compileResult.success) {
          alert(`Compilation Error:\n${compileResult.error}`);
          toggleSimulation();
          return;
        }

        // 3. Start Simulator
        console.log(`[LeapForge] Successfully compiled. Starting simulation...`);
        const simulator = new LeapSimulator(compileResult.program || BLINK_HEX);
        const bridge = new PinBridge(simulator.getCpu()!, arduinoNode.id);
        
        // Serial Monitor Callback
        simulator.onSerialData = (byte: number) => {
          appendSerial(String.fromCharCode(byte));
        };
        
        (window as any).leapBridge = bridge;
        simulatorRef.current = simulator;
        simulator.start();
      } else {
        console.log(`[LeapForge] Stopping simulation`);
        simulatorRef.current?.stop();
        nodes.forEach(node => updateNodeData(node.id, { pinStates: {} }));
        delete (window as any).leapBridge;
        // Optionally clear serial on stop? Let's keep it for viewing.
      }
    };

    runSimulation();
  }, [isSimulating]);

  useEffect(() => {
    return () => {
      simulatorRef.current?.stop();
      delete (window as any).leapBridge;
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
            disabled={isCompiling}
            className={`p-2 rounded-full flex items-center gap-2 transition-all ${
              isSimulating ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-green-500/20 text-green-400 border border-green-500/50'
            }`}
          >
              {isCompiling ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-green-400 border-t-transparent rounded-full" />
                  <span className="text-xs font-bold uppercase tracking-wider">Compiling...</span>
                </div>
              ) : (
                <>
                  {isSimulating ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                  <span className="text-xs font-bold uppercase tracking-wider">{isSimulating ? 'Stop' : 'Start Simulation'}</span>
                </>
              )}
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
