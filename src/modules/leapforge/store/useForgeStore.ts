import { create } from 'zustand';
import { Node, Edge, Connection, addEdge as rfAddEdge } from 'reactflow';
import { v4 as uuidv4 } from 'uuid';
import { simulationRunner } from '../engine/SimulationRunner';
import { circuitEngine } from '../engine/CircuitEngine';

export interface ForgeState {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  
  // Actions
  addNode: (type: string, position: { x: number; y: number }, data?: any) => void;
  removeNode: (id: string) => void;
  updateNodePosition: (id: string, position: { x: number; y: number }) => void;
  updateNodeData: (id: string, data: any) => void;
  
  addEdge: (edge: Edge | Connection) => void;
  removeEdge: (id: string) => void;
  
  setSelectedNode: (id: string | null) => void;
  clearWorkspace: () => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  
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
  
  // Board Configuration
  board: string;
  setBoard: (board: string) => void;
}

export const useForgeStore = create<ForgeState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  isSimulating: false,
  serialOutput: '',
  board: 'arduino-uno',
  
  setBoard: (board) => set(() => {
    simulationRunner.setBoard(board);
    return { board };
  }),
  
  startSimulation: (hexString) => set((state) => {
    console.log('[FORGE STORE] startSimulation triggered. Hex length:', hexString.length);
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
    console.log('[FORGE STORE] resetSimulation triggered.');
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

  addNode: (type, position, data = {}) => set((state) => ({
    nodes: [
      ...state.nodes, 
      { 
        id: uuidv4(), 
        type: 'wokwi', // Use our custom generic node
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

  addEdge: (connection) => set((state) => ({
    edges: rfAddEdge(connection, state.edges)
  })),

  removeEdge: (id) => set((state) => ({
    edges: state.edges.filter(e => e.id !== id)
  })),

  setSelectedNode: (id) => set({ selectedNodeId: id }),

  clearWorkspace: () => set({ nodes: [], edges: [], selectedNodeId: null }),

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
}));
