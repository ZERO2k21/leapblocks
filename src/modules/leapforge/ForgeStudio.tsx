/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
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
import { compileCode } from '../../services/CompilerService';

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

  // Auto-initialized state removed to enforce global-only forge-lib management.

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
      console.log('[FORGE UI] Sending quest to CompilerService...');
      // Compilation and Simulation strictly use the global forge-lib cache
      const result = await compileCode({
        code,
        board: 'arduino:avr:uno',
        libraries: useForgeStore.getState().importedLibraries
      });
      console.log('[FORGE UI] Compiler result:', result.success ? 'Success' : 'Failed');

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
      console.log('[FORGE UI] Requesting save-project...');
      const result = await window.electronAPI.invoke('save-project', projectData, projectPath);
      if (result.success && result.projectPath) {
        console.log(`[FORGE UI] Project saved successfully to: ${result.projectPath}`);
        setProjectPath(result.projectPath);
      }
    } catch (err) {
      console.error('[FORGE UI] Project save failed:', err);
    }
  };

  const handleOpenProject = async () => {
    try {
      console.log('[FORGE UI] Requesting open-project...');
      const result = await window.electronAPI.invoke('open-project');
      if (result && result.data) {
        console.log(`[FORGE UI] Opening project: ${result.projectPath}`);
        setNodes(result.data.nodes || []);
        setEdges(result.data.edges || []);
        if (result.data.code) setCode(result.data.code);
        setProjectPath(result.projectPath);
      } else {
        console.log('[FORGE UI] Open project cancelled or empty.');
      }
    } catch (err) {
      console.error('[FORGE UI] Project open failed:', err);
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
      <div className="forge-main-split" style={{ flex: 1, display: 'flex', background: '#0f172a', minHeight: 0, minWidth: 0 }}>
        {/* Left: Code Editor */}
        <div className="editor-pane" style={{ flex: 1, borderRight: '1px solid #2d2d2d', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
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

          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
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
              <LibraryManager />
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
