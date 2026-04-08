import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  Connection, 
  ConnectionMode,
  Edge,
  Node,
  useNodesState,
  useEdgesState,
  ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useForgeStore } from '../store/useForgeStore';
import { LeapNode } from './Nodes/LeapNode';
import { PartPicker } from './Library/PartPicker';
import { Plus, Play, Square, Info, RotateCcw } from 'lucide-react';

// Define custom node types outside component to prevent re-renders
const nodeTypes = {
  leap: LeapNode,
};

const ForgeCanvasInner: React.FC = () => {
  const store = useForgeStore();
  const { 
    isSimulating,
    toggleSimulation: toggleStoreSimulation,
    nodes: storeNodes, 
    edges: storeEdges, 
    addNode, 
    addEdge: addStoreEdge,
    updateNodePosition
  } = store;
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showPicker, setShowPicker] = useState(false);

  // Sync store -> local React Flow state
  useEffect(() => {
    setNodes(storeNodes);
  }, [storeNodes, setNodes]);

  useEffect(() => {
    setEdges(storeEdges);
  }, [storeEdges, setEdges]);

  // Handle new connections (wiring)
  const onConnect = useCallback(
    (params: Connection | Edge) => {
      addStoreEdge(params as Edge);
    },
    [addStoreEdge]
  );

  // Sync local position -> store
  const onNodeDragStop = useCallback((_: any, node: Node) => {
    updateNodePosition(node.id, node.position);
  }, [updateNodePosition]);

  // Record node click in Global Store to stabilize the slider UI
  const onNodeClick = useCallback((_: any, node: Node) => {
    store.setSelectedNode(node.id);
  }, [store]);

  // Record pane click to clear selection
  const onPaneClick = useCallback(() => {
    store.setSelectedNode(null);
  }, [store]);

  // Handle drag and drop from sidebar (kept for backward compatibility)
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/forge-component');
      if (!type) return;

      const reactFlowBounds = document.querySelector('.forge-canvas-container')?.getBoundingClientRect();
      if (!reactFlowBounds) return;

      const position = {
        x: event.clientX - reactFlowBounds.left - 50,
        y: event.clientY - reactFlowBounds.top - 50,
      };

      addNode(type, position, { label: `${type.toUpperCase()}` });
    },
    [addNode]
  );

  const handleAddPart = (type: string) => {
    const center = { x: 400, y: 300 }; // Default center
    addNode(type, center, { label: `${type.toUpperCase()}` });
    setShowPicker(false);
  };

  const Bg = Background as any;
  const Mm = MiniMap as any;

  return (
    <div 
      className="forge-canvas-container" 
      style={{ width: '100%', height: '100%', background: '#0f172a', position: 'relative' }}
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[20, 20]}
        connectionMode={ConnectionMode.Loose}
        style={{ background: '#0f172a' }}
      >
        <Bg color="#1e293b" gap={20} />
        <Controls />
        <Mm 
          style={{ background: '#1e293b' }} 
          nodeColor={(n: any) => n.data?.type === 'boards' ? '#BEF264' : '#64748b'}
        />
      </ReactFlow>

      {/* ── FLOATING TOOLBAR (Leap Style) ────────────────── */}
      <div className="canvas-fab-group" style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        display: 'flex',
        gap: '12px',
        zIndex: 100
      }}>
        {/* Play/Stop Toggle */}
        <button 
          onClick={toggleStoreSimulation}
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: isSimulating ? '#ef4444' : '#22c55e',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
            cursor: 'pointer',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          {isSimulating ? <Square size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
        </button>

        {/* Reset Simulation Button */}
        <button 
          onClick={store.resetSimulation}
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: '#eab308',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
            cursor: 'pointer',
            transition: 'transform 0.2s'
          }}
          title="Reset Simulation"
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <RotateCcw size={18} />
        </button>

        {/* Add Part Button */}
        <button 
          onClick={() => setShowPicker(!showPicker)}
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: '#3b82f6',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
            cursor: 'pointer',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Plus size={22} />
        </button>

        {/* Help Menu */}
        <button 
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: '#475569',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
            cursor: 'pointer'
          }}
        >
          <Info size={18} />
        </button>
      </div>

      {/* ── PART PICKER POPOVER ─────────────────────────── */}
      {showPicker && (
        <PartPicker 
          onSelect={handleAddPart} 
          onClose={() => setShowPicker(false)} 
        />
      )}
    </div>
  );
};

const ForgeCanvas: React.FC = () => (
  <ReactFlowProvider>
    <ForgeCanvasInner />
  </ReactFlowProvider>
);

export default ForgeCanvas;
