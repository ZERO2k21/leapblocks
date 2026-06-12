/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, lazy, Suspense, useEffect, useRef } from 'react';
import { Node, Edge } from 'reactflow';
import { SerialMonitor } from './components/Editor/SerialMonitor';
import { Play, Square, Code, Terminal, Wifi, Library as LibraryIcon } from 'lucide-react';
// Register official leap elements
import '../utlis/elements/leap-elements';
import './ForgeElectra.css';
import { useForgeStore, getSimulationRunner } from '../utlis/store/useForgeStore';

// Lazy load complex inner components
const ForgeCanvas = lazy(() => import('./components/ForgeCanvas'));
const ForgeEditor = lazy(() => import('./components/Editor/ForgeEditor'));
import { LibraryManager } from './components/Library/LibraryManager';
import { PartPicker as ComponentSidebar } from './components/Library/PartPicker';
import { IgniteTopbar } from './components/Layout/Topbar';

import Loader from '../../../components/Loader';
import { compileCode } from './services/CompilerService';
import { IS_ELECTRON } from '../../../config/platform';
import * as ProjectService from './services/ProjectService';
import { v4 as uuidv4 } from 'uuid';
import * as LibraryService from './services/LibraryService';

interface ForgeElectraProps {
  onBack: () => void;
  initialBoard?: 'arduino-uno' | 'esp32-c3';
  onRedirectToCreova?: (data: unknown, projectName?: string | null, projectPath?: string | null) => void;
  redirectProjectData?: unknown;
  clearRedirectProjectData?: () => void;
}

const ESP32_DEFAULT_CODE = `// ESP32-C3 Project
void setup() {
  Serial.begin(115200);
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH);
  Serial.println("LED ON");
  delay(1000);
  digitalWrite(13, LOW);
  Serial.println("LED OFF");
  delay(1000);
}`;

const ARDUINO_DEFAULT_CODE = `// Electra Project
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
}`;

export default function ForgeElectra({
  onBack,
  initialBoard = 'arduino-uno',
  onRedirectToCreova,
  redirectProjectData,
  clearRedirectProjectData
}: ForgeElectraProps) {
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
    uiTheme,
    importedLibraries,
    setImportedLibraries,
  } = useForgeStore();

  // Undo/Redo History Management
  const [history, setHistory] = useState<Array<{ nodes: any[]; edges: any[]; code: string }>>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [code, setCode] = useState(initialBoard === 'esp32-c3' ? ESP32_DEFAULT_CODE : ARDUINO_DEFAULT_CODE);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const autoInstallLibraries = async (libs: string[]) => {
    if (!libs || libs.length === 0) return;
    try {
      console.log('[FORGE ELECTRA] Checking libraries for auto-installation:', libs);
      const installed = await LibraryService.getLibraries();
      const installedNames = new Set(installed.map((l: any) => l.name.toLowerCase()));
      
      for (const libName of libs) {
        if (!installedNames.has(libName.toLowerCase())) {
          console.log(`[FORGE ELECTRA] Auto-installing missing library: ${libName}`);
          
          let libToInstall: LibraryService.Library = {
            name: libName,
            author: '',
            description: '',
            version: '1.0.0',
          };
          
          try {
            const indexMatches = await LibraryService.searchLibraries(libName);
            const exactMatch = indexMatches.find(l => l.name.toLowerCase() === libName.toLowerCase());
            if (exactMatch) {
              libToInstall = exactMatch;
              console.log(`[FORGE ELECTRA] Found library metadata in index for ${libName}:`, exactMatch);
            } else {
              console.warn(`[FORGE ELECTRA] No exact match in index for ${libName}. Using fallback metadata.`);
            }
          } catch (searchErr) {
            console.warn(`[FORGE ELECTRA] Error searching library index for ${libName}:`, searchErr);
          }

          const result = await LibraryService.installLibrary(libToInstall);
          if (result.success) {
            console.log(`[FORGE ELECTRA] Successfully auto-installed: ${libName}`);
          } else {
            console.error(`[FORGE ELECTRA] Failed to auto-install: ${libName}. Error:`, result.error);
          }
        } else {
          console.log(`[FORGE ELECTRA] Library already installed: ${libName}`);
        }
      }
    } catch (err) {
      console.error('[FORGE ELECTRA] Error in autoInstallLibraries:', err);
    }
  };

  // Save current state to history
  const saveToHistory = () => {
    const newState = { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)), code };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    // Limit history to 50 states
    if (newHistory.length > 50) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Undo operation
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setNodes(prevState.nodes);
      setEdges(prevState.edges);
      setCode(prevState.code);
      setHistoryIndex(historyIndex - 1);
    }
  };

  // Redo operation
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setCode(nextState.code);
      setHistoryIndex(historyIndex + 1);
    }
  };

  // Stop simulation when navigating away from ForgeElectra
  useEffect(() => {
    return () => {
      if (useForgeStore.getState().isSimulating) {
        useForgeStore.getState().stopSimulation();
      }
    };
  }, []);

  // Initialize history on mount
  useEffect(() => {
    if (history.length === 0) {
      saveToHistory();
    }
  }, []);

  // Save to history when nodes, edges, or code changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (history.length > 0) {
        const lastState = history[historyIndex];
        const hasChanged =
          JSON.stringify(lastState?.nodes) !== JSON.stringify(nodes) ||
          JSON.stringify(lastState?.edges) !== JSON.stringify(edges) ||
          lastState?.code !== code;

        if (hasChanged) {
          saveToHistory();
        }
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(timer);
  }, [nodes, edges, code]);

  // Process redirect project data
  useEffect(() => {
    if (redirectProjectData && clearRedirectProjectData) {
      console.log('[FORGE ELECTRA] Processing redirect project data:', redirectProjectData);
      
      const projectObj = redirectProjectData as {
        data: {
          nodes?: unknown[];
          edges?: unknown[];
          circuit?: { nodes?: unknown[]; edges?: unknown[] };
          code?: string;
          board?: string;
          libraries?: string[];
        };
        projectName?: string | null;
        projectPath?: string | null;
      };

      const { data, projectName: rProjectName, projectPath: rProjectPath } = projectObj;
      
      const loadedNodes = (data.nodes || data.circuit?.nodes || []) as Node[];
      const loadedEdges = (data.edges || data.circuit?.edges || []) as Edge[];
      const loadedCode = data.code || '';
      const loadedLibs = data.libraries || [];
      
      setNodes(loadedNodes);
      setEdges(loadedEdges);
      setCode(loadedCode);
      setImportedLibraries(loadedLibs);
      autoInstallLibraries(loadedLibs);
      
      if (data.board) {
        setBoard(data.board);
      }
      
      if (rProjectPath) {
        setProjectPath(rProjectPath);
        const pathParts = rProjectPath.split(/[\\/]/);
        const folderName = pathParts[pathParts.length - 1];
        const cleanName = folderName ? folderName.replace(/\.(leap|lbp)$/i, '') : 'Loaded Project';
        setProjectName(cleanName);
      } else if (rProjectName) {
        setProjectName(rProjectName);
        setProjectPath(null);
      }
      
      setHistory([]);
      setHistoryIndex(-1);
      setTimeout(() => {
        saveToHistory();
      }, 0);
      
      clearRedirectProjectData();
    }
  }, [redirectProjectData, clearRedirectProjectData]);

  // Initialize board from prop on mount (does not re-fire on internal board changes)
  useEffect(() => {
    if (initialBoard && board !== initialBoard) {
      setBoard(initialBoard);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialBoard, setBoard]);

  // Add the selected board to canvas on mount if no nodes exist
  useEffect(() => {
    const state = useForgeStore.getState();
    console.log('[FORGE ELECTRA] Checking if board needs to be added. Current nodes:', state.nodes.length, 'Initial board:', initialBoard);

    if (state.nodes.length === 0 && initialBoard) {
      console.log('[FORGE ELECTRA] Adding board to canvas:', initialBoard);
      // Use the store's addNode function to properly add the board
      state.addNode(initialBoard, { x: 400, y: 300 }, {
        label: initialBoard === 'esp32-c3' ? 'ESP32-C3' : 'Arduino Uno'
      });
      console.log('[FORGE ELECTRA] Board added. New nodes count:', useForgeStore.getState().nodes.length);
    }
  }, [initialBoard]); // Run when initialBoard changes

  const [activeTab, setActiveTab] = useState<'code' | 'serial' | 'wifi' | 'libraries'>('code');
  const [showEditor, setShowEditor] = useState(true);
  const { showPartPicker, setShowPartPicker, rotateNode } = useForgeStore();
  const [wifiStatus, setWifiStatus] = useState('');
  const [showWebOpenModal, setShowWebOpenModal] = useState(false);
  const [recentProjects, setRecentProjects] = useState<ProjectService.LeapProject[]>([]);

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

  const [isCompiling, setIsCompiling] = useState(false);

  // File Operations
  const handleNewProject = () => {
    if (confirm('Create a new project? Unsaved changes will be lost.')) {
      if (isSimulating) {
        stopSimulation();
      } else {
        clearSerial();
        clearWiFiLog();
      }
      setNodes([]);
      setEdges([]);
      setCode(board === 'esp32-c3' ? ESP32_DEFAULT_CODE : ARDUINO_DEFAULT_CODE);
      setProjectName('Untitled Project');
      setProjectPath(null);
      setHistory([]);
      setHistoryIndex(-1);
      saveToHistory();

      // Add board back to canvas
      const state = useForgeStore.getState();
      state.addNode(board, { x: 400, y: 300 }, {
        label: board === 'esp32-c3' ? 'ESP32-C3' : 'Arduino Uno'
      });
    }
  };

  const handleOpenProject = async () => {
    if (IS_ELECTRON) {
      try {
        const result = await (window as any).electronAPI.openProject();
        if (result && result.data) {
          // Check if it's actually a Creova project (contains screens or schemaVersion)
          if (result.data.screens || result.data.schemaVersion) {
            console.log('[Electra/ForgeElectra] Detected Creova project file, redirecting...');
            if (onRedirectToCreova) {
              onRedirectToCreova(result.data, null, result.projectPath);
              return;
            }
          }

          if (isSimulating) {
            stopSimulation();
          } else {
            clearSerial();
            clearWiFiLog();
          }

          const { nodes: loadedNodes, edges: loadedEdges, code: loadedCode, libraries: loadedLibs } = result.data;
          setNodes(loadedNodes || []);
          setEdges(loadedEdges || []);
          setCode(loadedCode || '');
          setImportedLibraries(loadedLibs || []);
          autoInstallLibraries(loadedLibs || []);
          setProjectPath(result.projectPath);

          const pathParts = result.projectPath.split(/[\\/]/);
          const folderName = pathParts[pathParts.length - 1];
          const cleanName = folderName ? folderName.replace(/\.(leap|lbp)$/i, '') : 'Loaded Project';
          setProjectName(cleanName);

          setHistory([]);
          setHistoryIndex(-1);
          saveToHistory();
        }
      } catch (err) {
        console.error('[FORGE] Failed to open project:', err);
        alert('Failed to open project.');
      }
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleWebImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const projectData = JSON.parse(content);

        // Check if it's actually a Creova project (contains screens or schemaVersion)
        if (projectData.screens || projectData.schemaVersion) {
          console.log('[Electra/ForgeElectra] Detected Creova project file, redirecting...');
          if (onRedirectToCreova) {
            const nameWithoutExt = file.name.replace(/\.(leap|lbp|json)$/i, '');
            onRedirectToCreova(projectData, nameWithoutExt, null);
            return;
          }
        }

        if (projectData.nodes && projectData.edges) {
          if (isSimulating) {
            stopSimulation();
          } else {
            clearSerial();
            clearWiFiLog();
          }

          setNodes(projectData.nodes || []);
          setEdges(projectData.edges || []);
          setCode(projectData.code || '');
          setImportedLibraries(projectData.libraries || []);
          autoInstallLibraries(projectData.libraries || []);
          if (projectData.board) setBoard(projectData.board);

          const nameWithoutExt = file.name.replace(/\.(leap|lbp|json)$/i, '');
          setProjectName(nameWithoutExt);
          setProjectPath(null);

          setHistory([]);
          setHistoryIndex(-1);
          saveToHistory();
          alert('Project imported successfully!');
        } else {
          alert('Invalid project file format. Missing nodes or edges.');
        }
      } catch (err: any) {
        console.error('Failed to parse project file:', err);
        alert('Failed to parse project file: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const loadWebProject = (project: ProjectService.LeapProject) => {
    setNodes(project.circuit.nodes || []);
    setEdges(project.circuit.edges || []);
    setCode(project.code || '');
    setImportedLibraries(project.libraries || []);
    autoInstallLibraries(project.libraries || []);
    setProjectPath(project.id);
    setProjectName(project.name);
    setHistory([]);
    setHistoryIndex(-1);
    saveToHistory();
    setShowWebOpenModal(false);
  };

  const handleSaveProject = async () => {
    try {
      if (IS_ELECTRON) {
        const projectData = {
          nodes,
          edges,
          code,
          board,
          version: '1.0.0',
          timestamp: new Date().toISOString()
        };
        const result = await (window as any).electronAPI.saveProject(projectData, projectPath ?? undefined);
        if (result.success && result.projectPath) {
          setProjectPath(result.projectPath);
          const pathParts = result.projectPath.split(/[\\/]/);
          const folderName = pathParts[pathParts.length - 1];
          const cleanName = folderName ? folderName.replace(/\.(leap|lbp)$/i, '') : projectName;
          setProjectName(cleanName);
        }
      } else {
        const projectData = {
          nodes,
          edges,
          code,
          board,
          version: '1.0.0',
          timestamp: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectName || 'project'}.leap`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        const id = projectPath || uuidv4();
        await ProjectService.saveProject({
          id,
          name: projectName,
          circuit: { nodes, edges },
          code,
          updatedAt: new Date().toISOString()
        });
        setProjectPath(id);
      }
    } catch (err) {
      console.error('[FORGE] Failed to save project:', err);
      alert('Failed to save project.');
    }
  };

  const handleSaveAsProject = async () => {
    if (!IS_ELECTRON) {
      // In web mode, Save As behaves the same as Save (downloads the project file)
      handleSaveProject();
      return;
    }
    try {
      const projectData = {
        nodes,
        edges,
        code,
        board,
        version: '1.0.0',
        timestamp: new Date().toISOString()
      };
      const result = await (window as any).electronAPI.saveProject(projectData, undefined);
      if (result.success && result.projectPath) {
        setProjectPath(result.projectPath);
        const pathParts = result.projectPath.split(/[\\/]/);
        const folderName = pathParts[pathParts.length - 1];
        const cleanName = folderName ? folderName.replace(/\.(leap|lbp)$/i, '') : projectName;
        setProjectName(cleanName);
      }
    } catch (err) {
      console.error('[FORGE] Failed to save project as:', err);
      alert('Failed to save project.');
    }
  };

  // Edit Operations
  const handleCut = () => {
    // Copy selected nodes/edges to clipboard then delete
    handleCopy();
    const state = useForgeStore.getState();
    if (state.selectedNodeId) {
      state.removeNode(state.selectedNodeId);
    }
    if (state.selectedEdgeId) {
      state.removeEdge(state.selectedEdgeId);
    }
  };

  const handleCopy = () => {
    const state = useForgeStore.getState();
    const clipboardData: any = {};

    if (state.selectedNodeId) {
      const node = nodes.find(n => n.id === state.selectedNodeId);
      if (node) {
        clipboardData.node = JSON.parse(JSON.stringify(node));
      }
    }

    if (state.selectedEdgeId) {
      const edge = edges.find(e => e.id === state.selectedEdgeId);
      if (edge) {
        clipboardData.edge = JSON.parse(JSON.stringify(edge));
      }
    }

    // Store in sessionStorage (clipboard API requires user interaction)
    if (Object.keys(clipboardData).length > 0) {
      sessionStorage.setItem('forge-clipboard', JSON.stringify(clipboardData));
      console.log('[FORGE] Copied to clipboard:', clipboardData);
    }
  };

  const handlePaste = () => {
    try {
      const clipboardStr = sessionStorage.getItem('forge-clipboard');
      if (!clipboardStr) return;

      const clipboardData = JSON.parse(clipboardStr);
      const state = useForgeStore.getState();

      if (clipboardData.node) {
        // Paste node with offset position
        const newNode = {
          ...clipboardData.node,
          id: `${clipboardData.node.id}-copy-${Date.now()}`,
          position: {
            x: clipboardData.node.position.x + 50,
            y: clipboardData.node.position.y + 50
          }
        };
        state.addNode(newNode.data.type, newNode.position, newNode.data);
        console.log('[FORGE] Pasted node:', newNode);
      }
    } catch (err) {
      console.error('[FORGE] Failed to paste:', err);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S: Save
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSaveProject();
      }
      // Ctrl+Shift+S: Save As
      else if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        handleSaveAsProject();
      }
      // Ctrl+N: New Project
      else if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        handleNewProject();
      }
      // Ctrl+O: Open Project
      else if (e.ctrlKey && e.key === 'o') {
        e.preventDefault();
        handleOpenProject();
      }
      // Ctrl+Z: Undo
      else if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Ctrl+Y or Ctrl+Shift+Z: Redo
      else if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
        e.preventDefault();
        handleRedo();
      }
      // Ctrl+X: Cut
      else if (e.ctrlKey && e.key === 'x') {
        // Don't intercept if user is in code editor or input field
        const activeElement = document.activeElement;
        const isInEditor = activeElement?.classList.contains('monaco-editor') ||
          activeElement?.closest('.monaco-editor') ||
          activeElement?.tagName === 'INPUT' ||
          activeElement?.tagName === 'TEXTAREA';
        if (!isInEditor) {
          e.preventDefault();
          handleCut();
        }
      }
      // Ctrl+C: Copy
      else if (e.ctrlKey && e.key === 'c') {
        // Don't intercept if user is in code editor or input field
        const activeElement = document.activeElement;
        const isInEditor = activeElement?.classList.contains('monaco-editor') ||
          activeElement?.closest('.monaco-editor') ||
          activeElement?.tagName === 'INPUT' ||
          activeElement?.tagName === 'TEXTAREA';
        if (!isInEditor) {
          e.preventDefault();
          handleCopy();
        }
      }
      // Ctrl+V: Paste
      else if (e.ctrlKey && e.key === 'v') {
        // Don't intercept if user is in code editor or input field
        const activeElement = document.activeElement;
        const isInEditor = activeElement?.classList.contains('monaco-editor') ||
          activeElement?.closest('.monaco-editor') ||
          activeElement?.tagName === 'INPUT' ||
          activeElement?.tagName === 'TEXTAREA';
        if (!isInEditor) {
          e.preventDefault();
          handlePaste();
        }
      }
      // R: Rotate selected node (works regardless of CapsLock)
      else if (e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.metaKey) {
        const activeElement = document.activeElement;
        const isInEditor = activeElement?.classList.contains('monaco-editor') ||
          activeElement?.closest('.monaco-editor') ||
          activeElement?.tagName === 'INPUT' ||
          activeElement?.tagName === 'TEXTAREA';

        if (!isInEditor) {
          const state = useForgeStore.getState();
          if (state.selectedNodeId) {
            e.preventDefault();
            rotateNode(state.selectedNodeId);
          }
        }
      }
      // Delete / Backspace: Remove selected node or edge
      else if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeElement = document.activeElement;
        const isInEditor = activeElement?.classList.contains('monaco-editor') ||
          activeElement?.closest('.monaco-editor') ||
          activeElement?.tagName === 'INPUT' ||
          activeElement?.tagName === 'TEXTAREA' ||
          activeElement?.tagName === 'SELECT';

        if (!isInEditor) {
          const state = useForgeStore.getState();
          if (state.selectedNodeId) {
            // Prevent deleting board elements (ESP32, Arduino)
            const node = state.nodes.find(n => n.id === state.selectedNodeId);
            const isBoardNode = node && ['esp32-c3', 'esp32', 'arduino-uno'].includes(node.data?.type);
            if (!isBoardNode) {
              e.preventDefault();
              state.removeNode(state.selectedNodeId);
              state.setSelectedNode(null);
            }
          } else if (state.selectedEdgeId) {
            e.preventDefault();
            state.removeEdge(state.selectedEdgeId);
            state.setSelectedEdge(null);
          }
        }
      }

    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history, nodes, edges, code, projectPath]);

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
        // ── ESP32-C3 Simulation via Transpilation ──────────────────────────────
        // ESP32 firmware uses FreeRTOS for multitasking. We simulate FreeRTOS
        // via a cooperative scheduler (FreeRTOS.ts) that runs tasks in the
        // browser's event loop. Arduino C++ is transpiled to JavaScript and
        // run through ArduinoRuntime with FreeRTOS API stubs.
        try {
          const { transpileCode } = await import('./services/CompilerService');
          const transpileResult = await transpileCode(code, 'esp32:esp32:esp32c3');

          if (transpileResult.success && transpileResult.jsCode) {
            const runner = await getSimulationRunner();
            runner.setBoard(board);
            runner.setTranspiledJS(transpileResult.jsCode);
            startSimulation('__esp32_c3_transpiled__', code);
          } else if (transpileResult.error) {
            const { appendSerial } = useForgeStore.getState();
            appendSerial('❌ ESP32-C3 TRANSPILATION ERROR:\n');
            appendSerial('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            appendSerial(transpileResult.error + '\n');
            appendSerial('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            appendSerial('\nPlease fix the errors and try again.\n');
          }
        } catch (transpileErr: any) {
          const { appendSerial } = useForgeStore.getState();
          appendSerial('❌ ESP32-C3 TRANSPILATION ERROR:\n');
          appendSerial('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
          appendSerial((transpileErr.message || String(transpileErr)) + '\n');
          appendSerial('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
          appendSerial('\nPlease check your code and try again.\n');
        }
      } else {
        const result = await compileCode({
          code,
          board: FQBN[board] ?? 'arduino:avr:uno',
          libraries: useForgeStore.getState().importedLibraries
        });
        if (result.success && result.hexContent) {
          startSimulation(result.hexContent, code);
        } else if (result.error) {
          // Display compilation errors in Serial Monitor
          const { appendSerial } = useForgeStore.getState();
          appendSerial('❌ COMPILATION ERROR:\n');
          appendSerial('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
          appendSerial(result.error + '\n');
          appendSerial('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
          appendSerial('\nPlease fix the errors and try again.\n');
        }
      }
    } catch (err: any) {
      console.error(err);
      // Display unexpected errors in Serial Monitor
      const { appendSerial } = useForgeStore.getState();
      appendSerial('❌ UNEXPECTED ERROR:\n');
      appendSerial('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      appendSerial(err.message || String(err) + '\n');
      appendSerial('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      appendSerial('\nPlease check your code and try again.\n');
    } finally {
      setIsCompiling(false);
    }
  };

  const [showBoardConfirm, setShowBoardConfirm] = useState(false);
  const [pendingBoard, setPendingBoard] = useState<string | null>(null);

  const hasModifications = () => {
    const defaultCode = board === 'esp32-c3' ? ESP32_DEFAULT_CODE : ARDUINO_DEFAULT_CODE;
    return nodes.length > 1 || edges.length > 0 || code !== defaultCode;
  };

  const handleSwitchBoard = (targetBoard: string) => {
    if (targetBoard === board) return;

    if (hasModifications()) {
      setPendingBoard(targetBoard);
      setShowBoardConfirm(true);
      return;
    }

    executeBoardSwitch(targetBoard);
  };

  const executeBoardSwitch = (targetBoard: string) => {
    if (isSimulating) {
      stopSimulation();
      setWifiStatus('');
    }

    setNodes([]);
    setEdges([]);
    setCode(targetBoard === 'esp32-c3' ? ESP32_DEFAULT_CODE : ARDUINO_DEFAULT_CODE);
    setBoard(targetBoard);

    const state = useForgeStore.getState();
    state.addNode(targetBoard, { x: 400, y: 300 }, {
      label: targetBoard === 'esp32-c3' ? 'ESP32-C3' : 'Arduino Uno'
    });

    setHistory([]);
    setHistoryIndex(-1);
    saveToHistory();
  };

  const handleBack = () => {
    if (isSimulating) {
      stopSimulation();
      setWifiStatus('');
    }
    onBack();
  };

  return (
    <div className={`forge-root board-${board} theme-${uiTheme}`}>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".leap,.lbp,.json"
        onChange={handleWebImport}
      />
      <IgniteTopbar
        title={projectName}
        onTitleChange={setProjectName}
        onBack={handleBack}
        onSave={handleSaveProject}
        onSaveAs={handleSaveAsProject}
        onNew={handleNewProject}
        onOpen={handleOpenProject}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onCut={handleCut}
        onCopy={handleCopy}
        onPaste={handlePaste}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onSwitchBoard={handleSwitchBoard}
        currentBoard={board}
      />

      <main className="forge-main-split">
        {/* Far Left: Component Drawer */}
        {showPartPicker && (
          <div className="part-picker-pane">
            <ComponentSidebar
              onSelect={(type) => {
                const state = useForgeStore.getState();
                // Place part at the center of the currently visible viewport
                const container = document.querySelector('.forge-canvas-container');
                const vp = state.viewport;
                let pos = { x: 400, y: 300 };
                if (container) {
                  const rect = container.getBoundingClientRect();
                  // Convert screen center to flow coordinates
                  pos = {
                    x: (rect.width / 2 - vp.x) / vp.zoom,
                    y: (rect.height / 2 - vp.y) / vp.zoom,
                  };
                }
                state.addNode(type, pos, { label: type.toUpperCase() });
              }}
              onClose={() => setShowPartPicker(false)}
              currentBoard={board as any}
            />
          </div>
        )}

        {/* Middle: Simulation Canvas (takes flex: 1) */}
        <div className="canvas-pane">
          <div style={{ flex: 1, position: 'relative', height: '100%' }}>
            <Suspense fallback={<Loader />}>
              <ForgeCanvas 
                onToggleSimulation={handleToggleSimulation} 
                isCompiling={isCompiling} 
                showEditor={showEditor}
                onToggleEditor={() => {
                  if (!showEditor && window.innerWidth <= 1024 && showPartPicker) {
                    setShowPartPicker(false);
                  }
                  setShowEditor(!showEditor);
                }}
              />
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
        </div>

        {/* Middle/Right: Interactive Programming Pane */}
        {showEditor && (
          <div className="editor-pane">
            {/* Top: Sketch Editor */}
            <div style={{
              flex: activeTab === 'libraries' ? 1 : 1.5,
              display: 'flex',
              flexDirection: 'column',
              borderBottom: activeTab === 'libraries' ? 'none' : '1px solid var(--lp-border)',
              minHeight: 0
            }}>
              <div className="forge-tabs-container" style={{ height: 36 }}>
                {/* Board badge - non-interactive */}
                <div className="board-badge">
                  <div className="board-badge-dot" />
                  {board === 'esp32-c3' ? 'ESP32-C3' : 'ARDUINO UNO'}
                </div>

                <div style={{ width: 1, height: 20, background: 'rgba(255, 255, 255, 0.08)', margin: '0 12px' }} />

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
                  <Suspense fallback={<Loader />}>
                    <ForgeEditor code={code} onChange={(val) => setCode(val || '')} />
                  </Suspense>
                )}
              </div>
            </div>

            {/* Bottom: Terminal (Serial / WiFi) - Hidden when Libraries tab is active */}
            {activeTab !== 'libraries' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--lp-dark-bg)', minHeight: 0 }}>
                <div className="forge-tabs-container" style={{ height: 32, background: 'rgba(10, 11, 14, 0.15)', borderTop: '1px solid var(--lp-border)' }}>
                  <button
                    className={`forge-tab-btn ${activeTab === 'serial' || activeTab === 'code' ? 'active' : ''}`}
                    style={{ height: 24, fontSize: 10 }}
                    onClick={() => setActiveTab('serial')}
                  >
                    <Terminal size={14} /> SERIAL OUTPUT
                    {serialOutput.length > 0 && <span className="status-dot" style={{ marginLeft: 6 }} />}
                  </button>

                  {board === 'esp32-c3' && (
                    <button
                      className={`forge-tab-btn wifi ${activeTab === 'wifi' ? 'active' : ''}`}
                      style={{ height: 24, fontSize: 10 }}
                      onClick={() => setActiveTab('wifi')}
                    >
                      <Wifi size={14} /> WiFi LOG
                      {wifiLog.length > 0 && <span className="status-dot" style={{ background: '#10b981', boxShadow: '0 0 8px #10b981', marginLeft: 6 }} />}
                    </button>
                  )}
                </div>

                <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                  {activeTab === 'wifi' ? (
                    <div style={{ fontFamily: 'var(--code-font, "JetBrains Mono", monospace)', fontSize: 12, padding: 15, overflowY: 'auto', height: '100%', background: 'var(--lp-dark-bg)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ color: 'var(--lp-zinc-400)', fontSize: 9, fontWeight: 700, letterSpacing: '0.5px' }}>NETWORK LOG</span>
                        <button onClick={() => clearWiFiLog()} className="wifi-clear-btn">CLEAR</button>
                      </div>
                      {wifiLog.length === 0 ? (
                        <div style={{ color: 'var(--lp-zinc-600)', textAlign: 'center', marginTop: 20 }}>No network activity.</div>
                      ) : wifiLog.map((line, i) => (
                        <div key={i} style={{ color: line.includes('ERROR') ? '#ef4444' : 'var(--lp-zinc-400)', marginBottom: 2 }}>{line}</div>
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
            )}
          </div>
        )}
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

      {/* Web Open Project Modal */}
      {!IS_ELECTRON && showWebOpenModal && (
        <div className="web-modal-overlay" onClick={() => setShowWebOpenModal(false)}>
          <div className="web-modal-content" onClick={e => e.stopPropagation()}>
            <div className="web-modal-header">
              <h3>Recent Projects</h3>
              <button onClick={() => setShowWebOpenModal(false)}>×</button>
            </div>
            <div className="web-modal-body">
              {recentProjects.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  No saved projects found in browser storage.
                </div>
              ) : (
                <div className="project-list">
                  {recentProjects.map(p => (
                    <div key={p.id} className="project-item" onClick={() => loadWebProject(p)}>
                      <div className="project-info">
                        <div className="project-name">{p.name}</div>
                        <div className="project-date">Last saved: {new Date(p.updatedAt).toLocaleString()}</div>
                      </div>
                      <div className="project-id">{p.id.slice(0, 8)}...</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Board Switch Confirmation Modal */}
      {showBoardConfirm && pendingBoard && (
        <div className="web-modal-overlay" onClick={() => { setShowBoardConfirm(false); setPendingBoard(null); }}>
          <div className="web-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="web-modal-header">
              <h3>Switch Board?</h3>
              <button onClick={() => { setShowBoardConfirm(false); setPendingBoard(null); }}>×</button>
            </div>
            <div className="web-modal-body" style={{ padding: '24px' }}>
              <p style={{ color: '#a1a1aa', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
                Switching to <strong>{pendingBoard === 'esp32-c3' ? 'ESP32-C3' : 'Arduino Uno'}</strong> will clear the current circuit and code. Make sure to save your work before proceeding.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setShowBoardConfirm(false); setPendingBoard(null); }}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    border: '1px solid #27272a',
                    background: 'transparent',
                    color: '#a1a1aa',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: '"Segoe UI", Inter, sans-serif'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowBoardConfirm(false);
                    if (pendingBoard) executeBoardSwitch(pendingBoard);
                    setPendingBoard(null);
                  }}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #22d3ee, #06b6d4)',
                    color: '#09090b',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: '"Segoe UI", Inter, sans-serif'
                  }}
                >
                  Switch Anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
