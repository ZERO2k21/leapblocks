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
import { Plus, Play, Square, RotateCcw, Code, Sun, Moon } from 'lucide-react';

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
    updateNodePosition,
    uiTheme,
    toggleUiTheme
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
        backgroundImage: uiTheme === 'light'
          ? 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.04) 1px, transparent 0)'
          : 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)',
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
          color="var(--lp-border-active)"
        />

        <Controls
          className="glass-controls"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            background: 'var(--lp-glass)',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--lp-border)',
            borderRadius: 12,
            padding: 4,
            boxShadow: 'var(--lp-shadow)'
          }}
        />

        <MiniMap
          className="glass-minimap"
          style={{
            background: 'var(--lp-glass)',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--lp-border)',
            borderRadius: 16,
            overflow: 'hidden'
          }}
          nodeColor={(n: any) => n.data?.type === 'boards' ? 'var(--lp-accent-primary)' : '#cbd5e1'}
          maskColor="rgba(0, 0, 0, 0.6)"
        />
      </ReactFlow>

      <style>{`
        .react-flow__edges { z-index: 1000 !important; }
        .react-flow__connectionline { z-index: 1001 !important; pointer-events: none; }
        .react-flow__edge { pointer-events: all; }
        .react-flow__nodes { z-index: 50 !important; }
        .react-flow__handle { z-index: 10 !important; }
        .react-flow__attribution { display: none !important; }
        
        /* Modern Zoom Controls Styling */
        .glass-controls {
          border: 1px solid var(--lp-border) !important;
          border-radius: 8px !important;
          background: var(--lp-glass) !important;
          box-shadow: var(--lp-shadow) !important;
          padding: 2px !important;
        }
        .theme-light .glass-controls {
          border: 1px solid rgba(15, 23, 42, 0.08) !important;
          background: rgba(255, 255, 255, 0.7) !important;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04) !important;
        }
        .glass-controls button {
          background: transparent !important;
          border: none !important;
          border-radius: 6px !important;
          color: var(--lp-zinc-400) !important;
          transition: all 0.2s !important;
          margin: 1px !important;
        }
        .glass-controls button:hover {
          background: var(--lp-zinc-700) !important;
          color: var(--lp-accent-primary) !important;
        }
        .theme-light .glass-controls button {
          color: #64748b !important;
        }
        .theme-light .glass-controls button:hover {
          background: rgba(0, 0, 0, 0.04) !important;
          color: var(--lp-accent-primary) !important;
        }
        .react-flow__controls-button svg {
          fill: currentColor !important;
        }

        /* Modern MiniMap Styling */
        .glass-minimap {
          border: 1px solid var(--lp-border) !important;
          border-radius: 12px !important;
          background: var(--lp-glass) !important;
          box-shadow: var(--lp-shadow) !important;
          overflow: hidden !important;
        }
        .theme-light .glass-minimap {
          border: 1px solid rgba(15, 23, 42, 0.08) !important;
          background: rgba(255, 255, 255, 0.7) !important;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04) !important;
        }

        /* Floating Action Panel */
        .canvas-action-panel {
          position: absolute;
          top: 16px;
          right: 16px;
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background: var(--lp-glass);
          border: 1px solid var(--lp-border);
          border-radius: 24px;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35), 0 2px 4px rgba(0, 0, 0, 0.15);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          z-index: 100;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .theme-light .canvas-action-panel {
          background: #ffffff !important;
          border: 1px solid rgba(15, 23, 42, 0.08) !important;
          box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12), 0 2px 4px rgba(15, 23, 42, 0.04) !important;
        }

        /* Divider */
        .canvas-divider {
          width: 1px;
          height: 18px;
          background: rgba(255, 255, 255, 0.12);
          margin: 0 4px;
        }
        .theme-light .canvas-divider {
          background: rgba(15, 23, 42, 0.08);
        }

        /* Floating Panel Buttons */
        .canvas-btn {
          height: 38px;
          border-radius: 19px;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          font-family: inherit;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Simulation Buttons */
        .sim-btn {
          padding: 0 16px;
          background: var(--lp-emerald);
          color: #ffffff;
          gap: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .sim-btn:hover {
          background: #059669;
          transform: translateY(-1.5px);
          box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3), 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .sim-btn.simulating {
          background: var(--lp-rose);
        }
        .sim-btn.simulating:hover {
          background: #e11d48;
          box-shadow: 0 6px 16px rgba(244, 63, 94, 0.3), 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        /* Secondary Round Buttons */
        .canvas-btn.secondary {
          width: 38px;
          background: var(--lp-zinc-800);
          border: 1px solid var(--lp-border);
          color: var(--lp-zinc-400);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
        }
        .canvas-btn.secondary:hover {
          color: var(--lp-accent-bright);
          border-color: rgba(96, 165, 250, 0.3);
          background: var(--lp-zinc-700);
          transform: translateY(-1.5px);
          box-shadow: 0 6px 14px rgba(0, 0, 0, 0.25);
        }
        .canvas-btn.secondary.active {
          background: var(--lp-accent-primary);
          border-color: transparent;
          color: #ffffff;
          box-shadow: 0 2px 6px rgba(59, 130, 246, 0.25);
        }
        .canvas-btn.secondary.active:hover {
          background: var(--lp-accent-bright);
          transform: translateY(-1.5px);
          box-shadow: 0 6px 14px rgba(59, 130, 246, 0.35);
        }

        /* Primary Add Button */
        .canvas-btn.primary-add {
          width: 38px;
          background: var(--lp-accent-primary);
          color: #ffffff;
          box-shadow: 0 2px 6px rgba(59, 130, 246, 0.2);
        }
        .canvas-btn.primary-add:hover {
          background: var(--lp-accent-bright);
          transform: translateY(-1.5px);
          box-shadow: 0 6px 14px rgba(59, 130, 246, 0.3);
        }
        .canvas-btn.primary-add.active {
          background: var(--lp-accent-bright);
        }


        /* Compiling Spinner */
        .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @media (max-width: 768px) {
          .glass-minimap {
            display: none !important;
          }
        }
      `}</style>

      {/* ── SELECTION TOOLBAR ─────────────────────────── */}
      <SelectionToolbar />

      {/* ── FLOATING ACTION PANEL (Tinkercad Style Toolbar) ────────────────── */}
      <div className="canvas-action-panel">
        {/* Play/Stop Labeled Simulation Button */}
        <button
          onClick={onToggleSimulation || toggleStoreSimulation}
          disabled={isCompiling}
          className={`canvas-btn sim-btn ${isSimulating ? 'simulating' : ''}`}
        >
          {isCompiling ? (
            <div className="spinner" />
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
          title="Reset Simulation"
        >
          <RotateCcw size={16} />
        </button>

        <div className="canvas-divider" />

        {/* Code Panel Toggle Button */}
        {onToggleEditor && (
          <button
            onClick={onToggleEditor}
            className={`canvas-btn secondary ${showEditor ? 'active' : ''}`}
            title="Toggle Code Panel"
          >
            <Code size={16} />
          </button>
        )}

        {/* Theme Toggle Button */}
        <button
          onClick={toggleUiTheme}
          className="canvas-btn secondary"
          title={uiTheme === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}
        >
          {uiTheme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>

        {/* Add Component (Part Picker) Button */}
        <button
          onClick={() => {
            if (!store.showPartPicker && window.innerWidth <= 1024 && showEditor && onToggleEditor) {
              onToggleEditor();
            }
            store.setShowPartPicker(!store.showPartPicker);
          }}
          className={`canvas-btn primary-add ${store.showPartPicker ? 'active' : ''}`}
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
