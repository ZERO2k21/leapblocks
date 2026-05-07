/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, lazy, Suspense, useEffect } from 'react';
import { SerialMonitor } from './components/Editor/SerialMonitor';
import { Play, Square, Code, Terminal, Wifi, Library as LibraryIcon } from 'lucide-react';
// Register official leap elements
import '../utlis/elements/leap-elements';
import './ForgeStudio.css';
import { useForgeStore, getSimulationRunner } from '../utlis/store/useForgeStore';
import { BoardSelector, BoardType } from './components/BoardSelector';

// Lazy load complex inner components
const ForgeCanvas = lazy(() => import('./components/ForgeCanvas'));
const ForgeEditor = lazy(() => import('./components/Editor/ForgeEditor'));
import { LibraryManager } from './components/Library/LibraryManager';
import { IgniteTopbar } from './components/Layout/Topbar';
import { compileCode } from './services/CompilerService';

interface ForgeStudioProps {
  onBack: () => void;
}

export default function ForgeStudio({ onBack }: ForgeStudioProps) {
  const {
    nodes,
    edges,
    isSimulating,
    startSimulation,
    stopSimulation,
    clearSerial,
    serialOutput,
    wifiLog,
    clearWiFiLog,
    projectPath,
    setProjectPath,
    setNodes,
    setEdges,
    projectName,
    setProjectName,
    board,
    setBoard,
  } = useForgeStore();

  const [activeTab, setActiveTab] = useState<'code' | 'serial' | 'wifi' | 'libraries'>('code');
  const [wifiStatus, setWifiStatus] = useState('');

  useEffect(() => {
    if (board !== 'esp32-c3' || !isSimulating) {
      setWifiStatus('');
      return;
    }

    if (wifiLog.length > 0) {
      const latestLog = wifiLog[wifiLog.length - 1];
      if (latestLog.includes('connected')) setWifiStatus('Connected');
      else if (latestLog.includes('disconnected')) setWifiStatus('Disconnected');
      else if (latestLog.startsWith('ip:')) setWifiStatus(`IP: ${latestLog.replace('ip:', '').trim()}`);
    }
  }, [wifiLog, board, isSimulating]);

  const [code, setCode] = useState(`// Electra Project
void setup() {
  Serial.begin(9600);
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH);
  Serial.println("System Active");
  delay(1000);
  digitalWrite(13, LOW);
  delay(1000);
}`);

  const [isCompiling, setIsCompiling] = useState(false);

  const handleToggleSimulation = async () => {
    if (isSimulating) {
      stopSimulation();
      setWifiStatus('');
      return;
    }

    const FQBN: Record<string, string> = {
      'arduino-uno': 'arduino:avr:uno',
      'esp32-c3': 'esp32:esp32:esp32c3',
    };

    setIsCompiling(true);
    clearSerial();

    try {
      if (board === 'esp32-c3') {
        const { transpileCode } = await import('./services/CompilerService');
        const result = await transpileCode(code, 'esp32:esp32:esp32c3');
        if (result.success && result.jsCode) {
          const runner = await getSimulationRunner();
          runner.setBoard(board);
          runner.setTranspiledJS(result.jsCode);
          startSimulation('__esp32_c3_transpiled__');
        }
      } else {
        const result = await compileCode({
          code,
          board: FQBN[board] ?? 'arduino:avr:uno',
          libraries: useForgeStore.getState().importedLibraries
        });
        if (result.success && result.hexContent) {
          startSimulation(result.hexContent);
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsCompiling(false);
    }
  };

  const handleSaveProject = async () => {
    const projectData = { nodes, edges, code, version: '1.0.0' };
    const result = await window.electronAPI.invoke('save-project', projectData, projectPath);
    if (result.success && result.projectPath) setProjectPath(result.projectPath);
  };

  return (
    <div className="forge-root">
      <IgniteTopbar
        title={projectName}
        onTitleChange={setProjectName}
        onBack={onBack}
        onSave={handleSaveProject}
      />

      <main className="forge-main-split">
        {/* Left: Interactive Pane (Editor/Serial/WiFi/Libs) */}
        <div className="editor-pane">
          {/* Top: Sketch Editor */}
          <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', borderBottom: '1px solid var(--lp-border)', minHeight: 0 }}>
            <div className="forge-tabs-container" style={{ height: 48 }}>
              <BoardSelector
                selected={board as BoardType}
                onChange={(b) => {
                  if (isSimulating) stopSimulation();
                  setBoard(b);
                }}
                disabled={isSimulating}
              />
              <div style={{ width: 1, height: 20, background: 'rgba(0,0,0,0.1)', margin: '0 12px' }} />
              
              <button 
                className={`forge-tab-btn ${activeTab === 'code' ? 'active' : ''}`}
                style={{ height: 32, fontSize: 11 }}
                onClick={() => setActiveTab('code')}
              >
                <Code size={14} /> SKETCH
              </button>

              <button 
                className={`forge-tab-btn ${activeTab === 'libraries' ? 'active' : ''}`}
                style={{ height: 32, fontSize: 11 }}
                onClick={() => setActiveTab('libraries')}
              >
                <LibraryIcon size={14} /> LIBRARIES
              </button>
            </div>
            
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              {activeTab === 'libraries' ? (
                <LibraryManager />
              ) : (
                <Suspense fallback={<div className="forge-loader"><div className="spinner" />Loading Editor...</div>}>
                  <ForgeEditor code={code} onChange={(val) => setCode(val || '')} />
                </Suspense>
              )}
            </div>
          </div>

          {/* Bottom: Terminal (Serial / WiFi) */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff', minHeight: 0 }}>
            <div className="forge-tabs-container" style={{ height: 40, background: 'rgba(0,0,0,0.02)' }}>
              <button 
                className={`forge-tab-btn ${activeTab === 'serial' || activeTab === 'code' ? 'active' : ''}`}
                style={{ height: 28, fontSize: 11, borderRadius: 8 }}
                onClick={() => setActiveTab('serial')}
              >
                <Terminal size={14} /> SERIAL OUTPUT
                {serialOutput.length > 0 && <span className="status-dot" style={{ marginLeft: 6 }} />}
              </button>

              {board === 'esp32-c3' && (
                <button 
                  className={`forge-tab-btn wifi ${activeTab === 'wifi' ? 'active' : ''}`}
                  style={{ height: 28, fontSize: 11, borderRadius: 8 }}
                  onClick={() => setActiveTab('wifi')}
                >
                  <Wifi size={14} /> WiFi LOG
                  {wifiLog.length > 0 && <span className="status-dot" style={{ background: '#10b981', boxShadow: '0 0 8px #10b981', marginLeft: 6 }} />}
                </button>
              )}
            </div>

            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              {activeTab === 'wifi' ? (
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, padding: 15, overflowY: 'auto', height: '100%', background: '#fdfdfd' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: '#94a3b8', fontSize: 10, fontWeight: 700 }}>NETWORK LOG</span>
                    <button onClick={() => clearWiFiLog()} style={{ background: 'none', border: 'none', color: '#7B4FC4', cursor: 'pointer', fontSize: 10, fontWeight: 700 }}>CLEAR</button>
                  </div>
                  {wifiLog.length === 0 ? (
                    <div style={{ color: '#cbd5e1', textAlign: 'center', marginTop: 20 }}>No network activity.</div>
                  ) : wifiLog.map((line, i) => (
                    <div key={i} style={{ color: line.includes('ERROR') ? '#ef4444' : '#64748b', marginBottom: 2 }}>{line}</div>
                  ))}
                </div>
              ) : (
                <SerialMonitor
                  output={serialOutput}
                  onClear={() => clearSerial()}
                  onSend={async (data) => {
                    const runner = await getSimulationRunner();
                    if (runner && isSimulating) runner.sendSerialInput(data);
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Right: Simulation Canvas */}
        <div className="canvas-pane">
          <Suspense fallback={<div className="forge-loader"><div className="spinner" />Initializing Physics...</div>}>
            <ForgeCanvas onToggleSimulation={handleToggleSimulation} isCompiling={isCompiling} />
          </Suspense>

          {/* Floating WiFi Status */}
          {board === 'esp32-c3' && isSimulating && wifiStatus && (
            <div style={{ position: 'absolute', bottom: 20, right: 20, zIndex: 10 }}>
              <div className="wifi-status-pill">
                <div className="wifi-dot" />
                {wifiStatus}
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="forge-footer">
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <span className="engine-pill">Electra Engine v1.0</span>
          {isSimulating && (
            <div className="sim-status-live">
              <div className="status-dot" />
              SIMULATION ACTIVE ({board.toUpperCase()})
            </div>
          )}
        </div>
        <div style={{ fontWeight: 600, letterSpacing: '0.05em' }}>
          {new Date().toLocaleTimeString()}
        </div>
      </footer>
    </div>
  );
}
