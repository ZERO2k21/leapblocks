/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, lazy, Suspense, useRef, useEffect } from 'react';
import { SerialMonitor } from './components/Editor/SerialMonitor';
import { Home, Save, FolderOpen, Settings, Play, Square, Code, Terminal, Wifi } from 'lucide-react';
// Register official leap elements
import '../utlis/elements/leap-elements';
import './ForgeStudio.css';
import { useForgeStore, getSimulationRunner } from '../utlis/store/useForgeStore';
import { BoardSelector, BoardType } from './components/BoardSelector';

// Lazy load complex inner components
const ForgeCanvas = lazy(() => import('./components/ForgeCanvas'));
const Sidebar = lazy(() => import('./components/Sidebar'));
const ForgeEditor = lazy(() => import('./components/Editor/ForgeEditor'));
import { LibraryManager } from './components/Library/LibraryManager';
import { Library as LibraryIcon } from 'lucide-react';
import { IgniteTopbar } from './components/Layout/Topbar';
import { compileCode } from './services/CompilerService';

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

  // WiFi status derived from WiFi log messages
  const [wifiStatus, setWifiStatus] = useState('');

  // Update WiFi status when WiFi log changes
  useEffect(() => {
    if (board !== 'esp32-c3' || !isSimulating) {
      setWifiStatus('');
      return;
    }

    // Parse the latest WiFi log entry to update status
    if (wifiLog.length > 0) {
      const latestLog = wifiLog[wifiLog.length - 1];
      if (latestLog.includes('connected')) {
        setWifiStatus('Connected');
      } else if (latestLog.includes('disconnected')) {
        setWifiStatus('Disconnected');
      } else if (latestLog.startsWith('ip:')) {
        const ip = latestLog.replace('ip:', '').trim();
        setWifiStatus(`IP: ${ip}`);
      }
    }
  }, [wifiLog, board, isSimulating]);

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

  const ESP32_BOARD_IDS = new Set(['esp32-c3']);

  const handleToggleSimulation = async () => {
    console.log('[FORGE UI] Simulation button clicked. Currently simulating:', isSimulating);
    if (isSimulating) {
      console.log('[FORGE UI] Stopping simulation...');
      stopSimulation();
      setWifiStatus('');
      return;
    }

    const FQBN: Record<string, string> = {
      'arduino-uno': 'arduino:avr:uno',
      'arduino-nano': 'arduino:avr:nano:cpu=atmega328old',
      'arduino-mega': 'arduino:avr:mega',
      'attiny85': 'attiny:avr:ATtinyX5:cpu=attiny85,clock=internal8',
      'esp32-c3': 'esp32:esp32:esp32c3',
    };

    const isESP32 = ESP32_BOARD_IDS.has(board);

    console.log('[FORGE UI] Preparing to compile code...');
    setIsCompiling(true);
    setCompileError(null);
    clearSerial();

    try {
      // ── WiFi Board Check ────────────────────────────────────────────────────
      // WiFi is only supported on ESP32 boards
      if (code.includes('#include <WiFi.h>') && !isESP32) {
        const errorMsg = 'WiFi is only supported on ESP32-C3 board. Please select ESP32-C3 from the board selector.';
        setCompileError(errorMsg);
        appendSerial(`[ERROR]: ${errorMsg}\n`);
        setIsCompiling(false);
        return;
      }

      // ── ESP32 Arduino Transpilation path ────────────────────────────────────
      if (isESP32) {
        console.log('[FORGE UI] ESP32-C3 board detected — using transpilation path...');
        const { transpileCode } = await import('./services/CompilerService');
        const result = await transpileCode(code, 'esp32:esp32:esp32c3');
        console.log('[FORGE UI] Transpile result:', result.success ? 'Success' : result.error);

        if (!result.success || !result.jsCode) {
          setCompileError(result.error || 'ESP32 transpilation failed');
          appendSerial(`[ERROR]: ${result.error || 'ESP32 transpilation failed'}\n`);
          return;
        }

        // Pass transpiled JS to SimulationRunner
        const runner = await getSimulationRunner();
        runner.setBoard(board);
        runner.setTranspiledJS(result.jsCode);
        startSimulation('__esp32_c3_transpiled__');
        appendSerial('ESP32-C3 compiled. Starting Arduino API simulation...\n');
        return;
      }

      // ── AVR path ───────────────────────────────────────────────────────────
      console.log('[FORGE UI] Sending quest to CompilerService...');
      const result = await compileCode({
        code,
        board: FQBN[board] ?? 'arduino:avr:uno',
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

  // Sync BoardSelector with canvas board node — if user places a board node,
  // the store.board updates automatically; the selector just reflects it.
  // If user changes selector manually, update the store (no canvas node change needed
  // since CircuitEngine detects board type from the canvas node, not the store.board).

  const handleBoardChange = (b: BoardType) => {
    if (isSimulating) {
      stopSimulation();
      setWifiStatus('');
    }
    setBoard(b);
  };

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
            minHeight: '44px',
            background: '#161b22',
            borderBottom: '1px solid #30363d',
            display: 'flex',
            padding: '0 8px',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap',
          }}>
            {/* Board selector */}
            <BoardSelector
              selected={board as BoardType}
              onChange={handleBoardChange}
              disabled={isSimulating}
            />

            <div style={{ width: 1, height: 20, background: '#30363d', margin: '0 4px' }} />

            <button
              onClick={() => setActiveTab('code')}
              style={{
                background: 'transparent',
                color: activeTab === 'code' ? '#fff' : '#8b949e',
                border: 'none',
                padding: '0 14px',
                height: '36px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
                borderBottom: activeTab === 'code' ? '2px solid #58a6ff' : '2px solid transparent',
              }}
            >
              <Code size={14} /> SKETCH
            </button>
            <button
              onClick={() => setActiveTab('serial')}
              style={{
                background: 'transparent',
                color: activeTab === 'serial' ? '#fff' : '#8b949e',
                border: 'none',
                padding: '0 14px',
                height: '36px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
                borderBottom: activeTab === 'serial' ? '2px solid #58a6ff' : '2px solid transparent',
              }}
            >
              <Terminal size={14} /> SERIAL {serialOutput.length > 0 && <span style={{ background: '#f85149', width: '6px', height: '6px', borderRadius: '50%' }} />}
            </button>

            {board === 'esp32-c3' && (
              <button
                onClick={() => setActiveTab('wifi')}
                style={{
                  background: 'transparent',
                  color: activeTab === 'wifi' ? '#fff' : '#8b949e',
                  border: 'none',
                  padding: '0 14px',
                  height: '36px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                  borderBottom: activeTab === 'wifi' ? '2px solid #4CAF50' : '2px solid transparent',
                }}
              >
                <Wifi size={14} /> WiFi {wifiLog.length > 0 && <span style={{ background: '#4CAF50', width: '6px', height: '6px', borderRadius: '50%' }} />}
              </button>
            )}

            <button
              onClick={() => setActiveTab('libraries')}
              style={{
                background: 'transparent',
                color: activeTab === 'libraries' ? '#fff' : '#8b949e',
                border: 'none',
                padding: '0 14px',
                height: '36px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
                borderBottom: activeTab === 'libraries' ? '2px solid #58a6ff' : '2px solid transparent',
              }}
            >
              <LibraryIcon size={14} /> LIBRARIES
            </button>

            {/* WiFi status pill */}
            {board === 'esp32-c3' && isSimulating && (
              <div style={{
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 11,
                color: wifiStatus ? '#4CAF50' : '#8b949e',
                paddingRight: 4,
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: wifiStatus ? '#4CAF50' : '#555',
                }} />
                {wifiStatus || 'Connecting...'}
              </div>
            )}
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
                onSend={async (data) => {
                  // Send data to the simulation runner (works for both AVR and ESP32)
                  const runner = await getSimulationRunner();
                  if (runner && isSimulating) {
                    runner.sendSerialInput(data);
                  } else {
                    console.warn('[FORGE STUDIO] Cannot send serial data: simulation not running');
                  }
                }}
              />
            ) : activeTab === 'wifi' ? (
              <div style={{ fontFamily: 'monospace', fontSize: 11, padding: 8, overflowY: 'auto', flex: 1, background: '#0d1117' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: '#8b949e' }}>WiFi / Network log</span>
                  <button
                    onClick={() => clearWiFiLog()}
                    style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer', fontSize: 10 }}
                  >
                    Clear
                  </button>
                </div>
                {wifiLog.length === 0
                  ? <div style={{ color: '#555' }}>No WiFi activity yet. Run an ESP32 sketch with WiFi.begin().</div>
                  : wifiLog.map((line, i) => (
                    <div key={i} style={{
                      color: line.includes('ERROR') ? '#f85149'
                        : line.includes('Connected') || line.includes('Got IP') ? '#3fb950'
                          : line.includes('[HTTP]') ? '#79c0ff'
                            : line.includes('[TCP]') ? '#d2a8ff'
                              : '#8b949e',
                      lineHeight: '1.6',
                    }}>
                      {line}
                    </div>
                  ))
                }
              </div>
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
          {isSimulating && board !== 'esp32-c3' && <span style={{ color: '#ef4444' }}>● AVR Simulation Live</span>}
          {isSimulating && board === 'esp32-c3' && (
            <span style={{ color: '#ef4444' }}>
              ● ESP32 Simulation Live
              {wifiStatus && <span style={{ color: '#4CAF50', marginLeft: 8 }}>· {wifiStatus}</span>}
            </span>
          )}
        </div>
        <div>
          {new Date().toLocaleTimeString()}
        </div>
      </footer>
    </div>
  );
}
