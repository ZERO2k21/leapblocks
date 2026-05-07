/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
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
  ReactFlowProvider,
  BackgroundVariant
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useForgeStore } from '../../utlis/store/useForgeStore';
import { LeapNode } from './Nodes/LeapNode';
import { PartPicker } from './Library/PartPicker';
import { SelectionToolbar } from './SelectionToolbar';
import { WireEdge } from './Edges/WireEdge';
import { PhysicalConnectionLine } from './Edges/PhysicalConnectionLine';
import { Plus, Play, Square, CircleHelp, RotateCcw } from 'lucide-react';

// Define custom node types outside component to prevent re-renders
const nodeTypes = {
  leap: LeapNode,
};

const edgeTypes = {
  wire: WireEdge,
};

interface ForgeCanvasProps {
  onToggleSimulation?: () => void;
  isCompiling?: boolean;
}

const ForgeCanvasInner: React.FC<ForgeCanvasProps> = ({ onToggleSimulation, isCompiling }) => {
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
      const normalized = {
        ...params,
        sourceHandle: (params.sourceHandle || '').replace('__target', ''),
        targetHandle: (params.targetHandle || '').replace('__target', ''),
      };
      addStoreEdge(normalized as Edge);
    },
    [addStoreEdge]
  );

  const onNodeDragStop = useCallback((_: any, node: Node) => {
    updateNodePosition(node.id, node.position);
  }, [updateNodePosition]);

  const onNodeClick = useCallback((_: any, node: Node) => {
    store.setSelectedNode(node.id);
  }, [store]);

  const onPaneClick = useCallback(() => {
    store.setSelectedNode(null);
    store.setSelectedEdge(null);
  }, [store]);

  const onEdgeClick = useCallback((_: any, edge: Edge) => {
    store.setSelectedEdge(edge.id);
  }, [store]);

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
    const center = { x: 400, y: 300 };
    addNode(type, center, { label: `${type.toUpperCase()}` });
    setShowPicker(false);
  };

  return (
    <div
      className="forge-canvas-container"
      style={{
        width: '100%',
        height: '100%',
        background: '#f8fafc',
        position: 'relative',
        backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0,0,0,0.03) 1px, transparent 0)',
        backgroundSize: '24px 24px'
      }}
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
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{ type: 'wire' }}
        fitView
        snapToGrid
        snapGrid={[10, 10]}
        connectionLineComponent={PhysicalConnectionLine}
        connectionMode={ConnectionMode.Loose}
        style={{ background: 'transparent' }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          color="rgba(0,0,0,0.15)"
        />

        <Controls
          className="glass-controls"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            background: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0,0,0,0.06)',
            borderRadius: 12,
            padding: 4,
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}
        />

        <MiniMap
          className="glass-minimap"
          style={{
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0,0,0,0.06)',
            borderRadius: 16,
            overflow: 'hidden'
          }}
          nodeColor={(n: any) => n.data?.type === 'boards' ? '#7B4FC4' : '#cbd5e1'}
          maskColor="rgba(248, 250, 252, 0.6)"
        />
      </ReactFlow>

      <style>{`
        .react-flow__edges { z-index: 1000 !important; }
        .react-flow__connectionline { z-index: 1001 !important; pointer-events: none; }
        .react-flow__edge { pointer-events: all; }
        .react-flow__nodes { z-index: 50 !important; }
        .react-flow__handle { z-index: 10 !important; }
        
        /* Modern Controls Styling */
        .glass-controls button {
          background: transparent !important;
          border: none !important;
          border-radius: 8px !important;
          color: #64748b !important;
          transition: all 0.2s !important;
        }
        .glass-controls button:hover {
          background: rgba(123, 79, 196, 0.1) !important;
          color: #7B4FC4 !important;
        }
        .react-flow__controls-button svg {
          fill: currentColor !important;
        }
      `}</style>

      {/* ── SELECTION TOOLBAR ─────────────────────────── */}
      <SelectionToolbar />

      {/* ── FLOATING ACTION PANEL (Leap Style) ────────────────── */}
      <div className="canvas-action-panel" style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '8px',
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(0,0,0,0.06)',
        borderRadius: '24px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        zIndex: 100
      }}>
        {/* Play/Stop Button */}
        <button
          onClick={onToggleSimulation || toggleStoreSimulation}
          disabled={isCompiling}
          className="canvas-btn"
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '20px',
            background: isSimulating ? '#ef4444' : '#10b981',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: isSimulating ? '0 0 20px rgba(239, 68, 68, 0.4)' : '0 4px 12px rgba(16, 185, 129, 0.3)'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          {isCompiling ? (
            <div className="spinner" style={{ width: 18, height: 18, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          ) : isSimulating ? (
            <Square size={20} fill="currentColor" />
          ) : (
            <Play size={20} fill="currentColor" style={{ marginLeft: 3 }} />
          )}
        </button>

        {/* Reset Button */}
        <button
          onClick={store.resetSimulation}
          className="canvas-btn secondary"
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '20px',
            background: '#ffffff',
            border: '1px solid rgba(0,0,0,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#7B4FC4'; e.currentTarget.style.background = 'rgba(123, 79, 196, 0.05)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = '#ffffff'; }}
        >
          <RotateCcw size={20} />
        </button>

        <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '4px 8px' }} />

        {/* Add Component Button */}
        <button
          onClick={() => setShowPicker(!showPicker)}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '20px',
            background: '#7B4FC4',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            cursor: 'pointer',
            transition: 'all 0.3s',
            boxShadow: '0 4px 12px rgba(123, 79, 196, 0.3)'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.background = '#8B5CF6'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = '#7B4FC4'; }}
        >
          <Plus size={24} />
        </button>

        {/* Help Button */}
        <button
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '20px',
            background: 'transparent',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
            cursor: 'pointer'
          }}
        >
          <CircleHelp size={20} />
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

const ForgeCanvas: React.FC<ForgeCanvasProps> = (props) => (
  <ReactFlowProvider>
    <ForgeCanvasInner {...props} />
  </ReactFlowProvider>
);

export default ForgeCanvas;
