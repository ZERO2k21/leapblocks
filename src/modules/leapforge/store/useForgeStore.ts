/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import { create } from 'zustand';
import { Node, Edge, Connection, addEdge as rfAddEdge } from 'reactflow';
import { v4 as uuidv4 } from 'uuid';
import { simulationRunner } from '../engine/SimulationRunner';
import { circuitEngine } from '../engine/CircuitEngine';

export interface ForgeState {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  projectName: string;

  // Actions
  addNode: (type: string, position: { x: number; y: number }, data?: any) => void;
  removeNode: (id: string) => void;
  updateNodePosition: (id: string, position: { x: number; y: number }) => void;
  updateNodeData: (id: string, data: any) => void;

  addEdge: (edge: Edge | Connection) => void;
  removeEdge: (id: string) => void;
  updateEdgeData: (id: string, data: any) => void;

  setSelectedNode: (id: string | null) => void;
  setSelectedEdge: (id: string | null) => void;
  clearWorkspace: () => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  setProjectName: (name: string) => void;

  // Simulation
  isSimulating: boolean;
  startSimulation: (hexString: string) => void;
  stopSimulation: () => void;
  resetSimulation: () => void;
  toggleSimulation: () => void;

  // Serial Monitor
  serialOutput: string;
  appendSerial: (data: string) => void;
  clearSerial: () => void;

  // WiFi Log (ESP32 only)
  wifiLog: string[];
  appendWiFiLog: (msg: string) => void;
  clearWiFiLog: () => void;

  // Board Configuration
  board: string;
  setBoard: (board: string) => void;

  // Project Configuration
  projectPath: string | null;
  setProjectPath: (path: string | null) => void;

  // Libraries
  importedLibraries: string[];
  setImportedLibraries: (libs: string[]) => void;
  addImportedLibrary: (lib: string) => void;

  // Library Search Persistence
  librarySearchQuery: string;
  librarySearchResults: any[];
  setLibrarySearch: (query: string, results: any[]) => void;
}

/** Map canvas node data.type → store board ID */
const BOARD_NODE_TO_BOARD_ID: Record<string, string> = {
  'esp32-devkit-v1': 'esp32',
  'esp32': 'esp32',
  'arduino-uno': 'arduino-uno',
  'arduino-nano': 'arduino-nano',
  'arduino-mega': 'arduino-mega',
  'attiny85': 'attiny85',
};

/** Detect the board from a list of nodes — returns the first board node found, or null */
function detectBoardFromNodes(nodes: Node[]): string | null {
  for (const node of nodes) {
    const boardId = BOARD_NODE_TO_BOARD_ID[node.data?.type];
    if (boardId) return boardId;
  }
  return null;
}

export const useForgeStore = create<ForgeState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  projectName: 'Untitled Project',
  isSimulating: false,
  serialOutput: '',
  wifiLog: [],
  board: 'arduino-uno',
  projectPath: null,
  importedLibraries: [],
  librarySearchQuery: '',
  librarySearchResults: [],

  setProjectPath: (path) => {
    console.log(`[FORGE STORE] projectPath updated to: ${path}`);
    set({ projectPath: path });
  },
  setImportedLibraries: (libs) => {
    console.log(`[FORGE STORE] importedLibraries list updated (${libs.length} items)`);
    set({ importedLibraries: libs });
  },
  addImportedLibrary: (lib) => set((state) => {
    if (state.importedLibraries.includes(lib)) {
      return state;
    }
    console.log(`[FORGE STORE] Adding library to project: ${lib}`);
    return {
      importedLibraries: [...state.importedLibraries, lib]
    };
  }),

  setBoard: (board) => set(() => {
    simulationRunner.setBoard(board);
    return { board };
  }),

  setLibrarySearch: (query, results) => set({
    librarySearchQuery: query,
    librarySearchResults: results
  }),

  startSimulation: (hexString) => set((state) => {
    console.log('[FORGE STORE] startSimulation triggered. Hex length:', hexString.length);
    circuitEngine.init();

    // ── QEMU ESP32 boards (esp32:esp32:*) ─────────────────────────────
    // The sentinel '__esp32_qemu__' is passed when ForgeStudio has already
    // called simulationRunner.setBoard(board, binPath) with the compiled .bin.
    // We must NOT call simulationRunner.setBoard() again here — that would
    // overwrite the binPath that was just stored.
    // We must NOT call initCPU() — there is no AVR hex to load.
    // SimulationRunner.start() will call esp32Runner.start(this.binPath) directly.
    const isQEMU = hexString === '__esp32_qemu__';

    if (!isQEMU) {
      // AVR path: sync board (no binPath) then load the compiled .hex
      simulationRunner.setBoard(state.board);
      console.log('[FORGE STORE] Initializing AVR CPU with hex...');
      simulationRunner.initCPU(hexString);
    } else {
      // QEMU path: board + binPath already set by ForgeStudio.
      // We MUST call initCPU() here so it creates the ESP32SimulationRunner
      // instance BEFORE syncCircuitGraph() runs. CircuitEngine checks
      // simulationRunner.ESP32Runner to decide whether to wire QEMU pin
      // listeners — if the runner doesn't exist yet, it falls back to the
      // AVR path and the LED never responds to GPIO output.
      console.log('[FORGE STORE] QEMU ESP32 path — creating ESP32SimulationRunner before syncCircuitGraph...');
      simulationRunner.initCPU(''); // creates esp32Runner, no AVR hex needed

      // Wire ESP32 serial output → store.appendSerial so the serial monitor shows QEMU output.
      // The ESP32SimulationRunner forwards non-GPIO lines char-by-char via serialListeners.
      const esp32Runner = simulationRunner.ESP32Runner;
      if (esp32Runner) {
        esp32Runner.addSerialListener((char: string) => {
          useForgeStore.getState().appendSerial(char);
        });
        console.log('[FORGE STORE] ESP32 serial listener wired to store.appendSerial');
      }
    }

    circuitEngine.syncCircuitGraph();

    console.log('[FORGE STORE] Firing simulationRunner.start()');
    simulationRunner.start().catch(err => {
      console.error('[FORGE STORE] simulationRunner.start() failed:', err);
    });

    return { isSimulating: true, serialOutput: '', wifiLog: [] };
  }),

  stopSimulation: () => set(() => {
    console.log('[FORGE STORE] stopSimulation triggered.');
    simulationRunner.stop();
    return { isSimulating: false };
  }),

  resetSimulation: () => set(() => {
    console.log('[FORGE STORE] resetSimulation triggered (Clear Canvas/States).');
    simulationRunner.reset();
    return { isSimulating: false, serialOutput: '' };
  }),

  toggleSimulation: () => {
    const { isSimulating, stopSimulation } = get();
    if (isSimulating) {
      stopSimulation();
    } else {
      // Note: Full toggle logic usually handled in the UI button that has access to the hex data.
      console.warn('[FORGE STORE] toggleSimulation called, but start requires hex.');
    }
  },

  appendSerial: (data) => set((state) => ({
    serialOutput: state.serialOutput + data
  })),

  clearSerial: () => set({ serialOutput: '' }),

  appendWiFiLog: (msg) => set((state) => ({
    wifiLog: [...state.wifiLog.slice(-199), msg], // keep last 200 lines
  })),

  clearWiFiLog: () => set({ wifiLog: [] }),

  addNode: (type, position, data = {}) => set((state) => {
    const newNode = {
      id: uuidv4(),
      type: 'leap',
      position,
      data: { ...data, type }
    };
    const newNodes = [...state.nodes, newNode];
    // Auto-switch engine when a board node is placed
    const boardId = BOARD_NODE_TO_BOARD_ID[type];
    if (boardId && boardId !== state.board) {
      console.log(`[FORGE STORE] Board node "${type}" added → switching to "${boardId}"`);
      simulationRunner.setBoard(boardId);
      return { nodes: newNodes, board: boardId };
    }
    return { nodes: newNodes };
  }),

  removeNode: (id) => set((state) => {
    const removedNode = state.nodes.find(n => n.id === id);
    const newNodes = state.nodes.filter(n => n.id !== id);
    // If a board node was removed, detect remaining board or revert to default
    let newBoard = state.board;
    if (removedNode && BOARD_NODE_TO_BOARD_ID[removedNode.data?.type]) {
      const detected = detectBoardFromNodes(newNodes);
      newBoard = detected ?? 'arduino-uno';
      if (newBoard !== state.board) {
        console.log(`[FORGE STORE] Board node removed → switching to "${newBoard}"`);
        simulationRunner.setBoard(newBoard);
      }
    }
    return {
      nodes: newNodes,
      edges: state.edges.filter(e => e.source !== id && e.target !== id),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
      board: newBoard,
    };
  }),

  updateNodePosition: (id, position) => set((state) => ({
    nodes: state.nodes.map(n => n.id === id ? { ...n, position } : n)
  })),

  updateNodeData: (id, data) => set((state) => ({
    nodes: state.nodes.map(n => n.id === id ? { ...n, data: { ...n.data, ...data } } : n)
  })),

  addEdge: (connection) => set((state) => {
    const edge = {
      ...connection,
      id: `e-${uuidv4()}`,
      type: 'wire',
      data: { color: '#22c55e' } // Default Green
    };
    return {
      edges: rfAddEdge(edge as any, state.edges)
    };
  }),

  removeEdge: (id) => set((state) => ({
    edges: state.edges.filter(e => e.id !== id),
    selectedEdgeId: state.selectedEdgeId === id ? null : state.selectedEdgeId
  })),

  updateEdgeData: (id, data) => set((state) => ({
    edges: state.edges.map(e => e.id === id ? { ...e, data: { ...e.data, ...data } } : e)
  })),

  setSelectedNode: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
  setSelectedEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),

  clearWorkspace: () => set({ nodes: [], edges: [], selectedNodeId: null, selectedEdgeId: null }),

  setNodes: (nodes) => set((state) => {
    // Auto-detect board from loaded nodes
    const detected = detectBoardFromNodes(nodes);
    if (detected && detected !== state.board) {
      console.log(`[FORGE STORE] setNodes: detected board "${detected}" → switching engine`);
      simulationRunner.setBoard(detected);
      return { nodes, board: detected };
    }
    return { nodes };
  }),
  setEdges: (edges) => set({ edges }),
  setProjectName: (name) => set({ projectName: name }),
}));
