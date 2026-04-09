import React, { useState, lazy, Suspense, useRef, useEffect } from 'react';
import { SerialMonitor } from './components/Editor/SerialMonitor';
import { Home, Save, FolderOpen, Settings, Play, Square, Code, Terminal } from 'lucide-react';
// Register official leap elements
import './elements/leap-elements';
import './ForgeStudio.css';
import { useForgeStore } from './store/useForgeStore';

// Lazy load complex inner components
const ForgeCanvas = lazy(() => import('./components/ForgeCanvas'));
const Sidebar = lazy(() => import('./components/Sidebar'));
const ForgeEditor = lazy(() => import('./components/Editor/ForgeEditor'));
import { LibraryManager } from './components/Library/LibraryManager';
import { Library as LibraryIcon } from 'lucide-react';
import { IgniteTopbar } from './components/Layout/IgniteTopbar';

interface ForgeStudioProps {
  onBack: () => void;
}

export default function ForgeStudio({ onBack }: ForgeStudioProps) {
  const {
    nodes,
    edges,
    updateNodeData,
    isSimulating,
    startSimulation,
    stopSimulation,
    appendSerial,
    clearSerial,
    serialOutput,
    projectPath,
    setProjectPath,
    setNodes,
    setEdges,
    projectName,
    setProjectName
  } = useForgeStore();

  const [activeTab, setActiveTab] = useState<'code' | 'serial' | 'libraries'>('code');

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
      // Pass the libs folder path from the projectPath
      const libsFolder = projectPath ? `${projectPath}/libs` : undefined;
      const result = await window.electronAPI.compileCode(code, 'arduino:avr:uno', libsFolder);
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

  const handleSaveProject = async () => {
    const projectData = {
      nodes,
      edges,
      code,
      version: '1.0.0'
    };

    try {
      const result = await window.electronAPI.invoke('save-project', projectData, projectPath);
      if (result.success && result.projectPath) {
        setProjectPath(result.projectPath);
        console.log('[FORGE UI] Project saved to:', result.projectPath);
      }
    } catch (err) {
      console.error('Failed to save project:', err);
    }
  };

  const handleOpenProject = async () => {
    try {
      const result = await window.electronAPI.invoke('open-project');
      if (result && result.data) {
        setNodes(result.data.nodes || []);
        setEdges(result.data.edges || []);
        if (result.data.code) setCode(result.data.code);
        setProjectPath(result.projectPath);
        console.log('[FORGE UI] Project opened from:', result.projectPath);
      }
    } catch (err) {
      console.error('Failed to open project:', err);
    }
  };

  // The new SimulationEngine (Phase 1-5) manages the loop internally via useForgeStore!
  // No need for duplicate useEffect mounts.

  return (
    <div className="forge-root dark" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ── TOPBAR ──────────────────────────── */}
      <IgniteTopbar
        title={projectName}
        onTitleChange={setProjectName}
        onBack={onBack}
        onSave={handleSaveProject}  
      />

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
            <button
              onClick={() => setActiveTab('libraries')}
              style={{
                background: activeTab === 'libraries' ? '#1f6feb' : 'transparent',
                color: activeTab === 'libraries' ? '#fff' : '#8b949e',
                border: 'none',
                padding: '0 20px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
                borderBottom: activeTab === 'libraries' ? '2px solid #58a6ff' : 'none'
              }}
            >
              <LibraryIcon size={14} /> LIBRARIES
            </button>
          </div>

          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            {activeTab === 'code' ? (
              <Suspense fallback={<div className="p-4 text-white">Loading Editor...</div>}>
                <ForgeEditor code={code} onChange={(val) => setCode(val || '')} />
              </Suspense>
            ) : activeTab === 'serial' ? (
              <SerialMonitor
                output={serialOutput}
                onClear={() => clearSerial()}
              />
            ) : (
              <LibraryManager onInitializeProject={handleSaveProject} />
            )}
          </div>
        </div>

        {/* Right: Circuit Canvas */}
        <div className="canvas-pane" style={{ flex: 1, position: 'relative' }}>
          <Suspense fallback={<div className="forge-loader">Initializing Canvas...</div>}>
            <ForgeCanvas onToggleSimulation={handleToggleSimulation} isCompiling={isCompiling} />
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
