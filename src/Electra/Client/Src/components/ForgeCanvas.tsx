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
import { Plus, Play, Square, RotateCcw, Code } from 'lucide-react';

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
  showEditor?: boolean;
  onToggleEditor?: () => void;
}

const ForgeCanvasInner: React.FC<ForgeCanvasProps> = ({ 
  onToggleSimulation, 
  isCompiling,
  showEditor = true,
  onToggleEditor
}) => {
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
  };

  return (
    <div
      className="forge-canvas-container"
      style={{
        width: '100%',
        height: '100%',
        background: 'var(--lp-dark-bg)',
        position: 'relative',
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)',
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
          size={1}
          color="rgba(255,255,255,0.05)"
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
        .react-flow__attribution { display: none !important; }
        
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

      {/* ── FLOATING ACTION PANEL (Tinkercad Style Toolbar) ────────────────── */}
      <div className="canvas-action-panel" style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 12px',
        background: 'var(--lp-glass)',
        border: '1px solid var(--lp-border-active)',
        borderRadius: '24px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(8px)',
        zIndex: 100
      }}>
        {/* Play/Stop Labeled Simulation Button */}
        <button
          onClick={onToggleSimulation || toggleStoreSimulation}
          disabled={isCompiling}
          className="canvas-btn sim-btn"
          style={{
            height: '38px',
            padding: '0 16px',
            borderRadius: '19px',
            background: isSimulating ? 'var(--lp-rose)' : 'var(--lp-emerald)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            boxShadow: isSimulating ? '0 0 10px rgba(244,63,94,0.3)' : '0 0 10px rgba(16,185,129,0.3)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
        >
          {isCompiling ? (
            <div className="spinner" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          ) : isSimulating ? (
            <>
              <Square size={14} fill="currentColor" />
              <span>Stop Simulation</span>
            </>
          ) : (
            <>
              <Play size={14} fill="currentColor" />
              <span>Start Simulation</span>
            </>
          )}
        </button>

        {/* Reset Button */}
        <button
          onClick={store.resetSimulation}
          className="canvas-btn secondary"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '19px',
            background: 'var(--lp-zinc-800)',
            border: '1px solid var(--lp-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--lp-zinc-400)',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--lp-accent-primary)'; e.currentTarget.style.borderColor = 'var(--lp-accent-primary)'; e.currentTarget.style.background = 'var(--lp-zinc-700)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--lp-zinc-400)'; e.currentTarget.style.borderColor = 'var(--lp-border)'; e.currentTarget.style.background = 'var(--lp-zinc-800)'; }}
          title="Reset Simulation"
        >
          <RotateCcw size={16} />
        </button>

        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)', margin: '0 4px' }} />

        {/* Code Panel Toggle Button */}
        {onToggleEditor && (
          <button
            onClick={onToggleEditor}
            className={`canvas-btn secondary ${showEditor ? 'active' : ''}`}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '19px',
              background: showEditor ? 'var(--lp-accent-primary)' : 'var(--lp-zinc-800)',
              border: showEditor ? 'none' : '1px solid var(--lp-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: showEditor ? 'var(--lp-btn-text, #000)' : 'var(--lp-zinc-400)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!showEditor) {
                e.currentTarget.style.color = 'var(--lp-accent-primary)';
                e.currentTarget.style.borderColor = 'var(--lp-accent-primary)';
                e.currentTarget.style.background = 'var(--lp-zinc-700)';
              }
            }}
            onMouseLeave={(e) => {
              if (!showEditor) {
                e.currentTarget.style.color = 'var(--lp-zinc-400)';
                e.currentTarget.style.borderColor = 'var(--lp-border)';
                e.currentTarget.style.background = 'var(--lp-zinc-800)';
              }
            }}
            title="Toggle Code Panel"
          >
            <Code size={16} />
          </button>
        )}

        {/* Add Component (Part Picker) Button */}
        <button
          onClick={() => store.setShowPartPicker(!store.showPartPicker)}
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '19px',
            background: store.showPartPicker ? 'var(--lp-accent-bright)' : 'var(--lp-accent-primary)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--lp-btn-text, #000)',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--lp-accent-bright)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--lp-accent-primary)'; }}
          title="Toggle Components Panel"
        >
          <Plus size={20} />
        </button>

      </div>

      {/* ComponentSidebar is now docked in ForgeStudio */}
    </div>
  );
};

const ForgeCanvas: React.FC<ForgeCanvasProps> = (props) => (
  <ReactFlowProvider>
    <ForgeCanvasInner {...props} />
  </ReactFlowProvider>
);

export default ForgeCanvas;
