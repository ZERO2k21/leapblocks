import { create } from 'zustand';
import { Node, Edge, Connection, addEdge as rfAddEdge } from 'reactflow';
import { v4 as uuidv4 } from 'uuid';

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
}

export const useForgeStore = create<ForgeState>((set) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,

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
