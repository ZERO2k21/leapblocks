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
  appendWiFiLog: (data: string) => void;

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

export const useForgeStore = create<ForgeState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  projectName: 'Untitled Project',
  isSimulating: false,
  serialOutput: '',
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
    // Force simulation engine refresh (Ideal Mode - Ver 1.0.1)
    circuitEngine.init();

    // Pass the downloaded compiled hex into the CPU
    console.log('[FORGE STORE] Initializing CPU and syncing graph...');
    simulationRunner.initCPU(hexString);
    circuitEngine.syncCircuitGraph();

    console.log('[FORGE STORE] Firing simulationRunner.start()');
    simulationRunner.start();

    return { isSimulating: true, serialOutput: '' };
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

  appendWiFiLog: (data) => set((state) => ({
    serialOutput: state.serialOutput + '[WiFi] ' + data + '\n'
  })),

  clearSerial: () => set({ serialOutput: '' }),

  addNode: (type, position, data = {}) => set((state) => ({
    nodes: [
      ...state.nodes,
      {
        id: uuidv4(),
        type: 'leap', // Use our custom generic node
        position,
        data: { ...data, type } // The real leap element type
      }
    ]
  })),

  removeNode: (id) => set((state) => ({
    nodes: state.nodes.filter(n => n.id !== id),
    edges: state.edges.filter(e => e.source !== id && e.target !== id),
    selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId
  })),

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

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setProjectName: (name) => set({ projectName: name }),
}));
