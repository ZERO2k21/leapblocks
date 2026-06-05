/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import ReactFlow, {
  Background,
  MiniMap,
  Connection,
  ConnectionMode,
  Edge,
  Node,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  BackgroundVariant,
  useReactFlow,
  useViewport,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useForgeStore } from '../../utlis/store/useForgeStore';
import { LeapNode } from './Nodes/LeapNode';
import { PartPicker } from './Library/PartPicker';
import { SelectionToolbar } from './SelectionToolbar';
import { WireEdge } from './Edges/WireEdge';
import { PhysicalConnectionLine } from './Edges/PhysicalConnectionLine';
import { Plus, Play, Square, RotateCcw, Code, Sun, Moon, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

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
  const nodeTypes = useMemo(() => ({
    leap: LeapNode,
  }), []);

  const edgeTypes = useMemo(() => ({
    wire: WireEdge,
  }), []);

  const { zoomIn, zoomOut, fitView, getNodes, setViewport, getViewport } = useReactFlow();
  const currentViewport = useViewport();
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
    toggleUiTheme,
    viewport: savedViewport,
    setViewportState
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

  // ── Keyboard zoom shortcuts (Wokwi-style) ──────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        zoomIn({ duration: 200 });
      } else if (ctrl && e.key === '-') {
        e.preventDefault();
        zoomOut({ duration: 200 });
      } else if (ctrl && e.key === '0') {
        e.preventDefault();
        const selected = getNodes().filter((n) => n.selected);
        if (selected.length > 0) {
          fitView({ nodes: selected, duration: 300, padding: 0.3 });
        } else {
          fitView({ duration: 300, padding: 0.2 });
        }
      } else if (ctrl && e.key === '1') {
        e.preventDefault();
        // Zoom to 100%
        const vp = getViewport();
        setViewport({ ...vp, zoom: 1 }, { duration: 200 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomIn, zoomOut, fitView, setViewport, getViewport, getNodes]);

  // ── Blur editor safely on node/edge selection changes to enable canvas hotkeys without event interruption ──
  const selectedNodeId = store.selectedNodeId;
  const selectedEdgeId = store.selectedEdgeId;

  useEffect(() => {
    if (selectedNodeId || selectedEdgeId) {
      const active = document.activeElement;
      if (active && active instanceof HTMLElement) {
        if (
          active.closest('.monaco-editor') ||
          active.classList.contains('monaco-editor') ||
          active.tagName === 'TEXTAREA' ||
          active.tagName === 'INPUT'
        ) {
          active.blur();
        }
      }
    }
  }, [selectedNodeId, selectedEdgeId]);

  // ── Restore viewport from saved state on mount ────────────────────
  useEffect(() => {
    if (savedViewport.x !== 0 || savedViewport.y !== 0 || savedViewport.zoom !== 1) {
      setViewport(savedViewport);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Persist viewport to store on every pan/zoom change ────────────
  useEffect(() => {
    setViewportState(currentViewport);
  }, [currentViewport.x, currentViewport.y, currentViewport.zoom, setViewportState]);

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
        minZoom={0.1}
        maxZoom={4}
        zoomOnScroll
        zoomOnPinch
        zoomOnDoubleClick={false}
        style={{ background: 'transparent' }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="var(--lp-border-active)"
        />

        {/* ── Wokwi-style MiniMap with component labels ── */}
        <MiniMap
          className="glass-minimap"
          style={{
            background: 'var(--lp-glass)',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--lp-border)',
            borderRadius: 16,
            overflow: 'hidden'
          }}
          nodeColor={(n: any) => {
            const t = n.data?.type;
            if (t === 'boards') return 'var(--lp-accent-primary)';
            if (t?.includes('oled') || t?.includes('ssd1306')) return '#f59e0b';
            if (t?.includes('led')) return '#ef4444';
            if (t?.includes('sensor') || t?.includes('dht') || t?.includes('pir')) return '#10b981';
            if (t?.includes('motor') || t?.includes('servo') || t?.includes('stepper')) return '#8b5cf6';
            if (t?.includes('button') || t?.includes('keypad')) return '#6366f1';
            if (t?.includes('tft') || t?.includes('ili9341')) return '#06b6d4';
            return '#cbd5e1';
          }}
          nodeStrokeWidth={2}
          nodeBorderRadius={4}
          maskColor="rgba(0, 0, 0, 0.6)"
          pannable
          zoomable
        />

        {/* ── Zoom percentage display (Wokwi-style) ── */}
        <Panel position="bottom-right" style={{ marginBottom: 8, marginRight: 8 }}>
          <div className="zoom-display">
            {Math.round(currentViewport.zoom * 100)}%
          </div>
        </Panel>
      </ReactFlow>

      <style>{`
        .react-flow__edges { z-index: 1000 !important; }
        .react-flow__connectionline { z-index: 1001 !important; pointer-events: none; }
        .react-flow__edge { pointer-events: all; }
        .react-flow__nodes { z-index: 50 !important; }
        .react-flow__handle { z-index: 10 !important; }
        .react-flow__attribution { display: none !important; }
        
        /* Modern Zoom Controls Styling */
        .zoom-display {
          background: var(--lp-glass);
          backdrop-filter: blur(10px);
          border: 1px solid var(--lp-border);
          border-radius: 8px;
          padding: 4px 10px;
          font-size: 12px;
          font-weight: 600;
          color: var(--lp-text);
          font-family: 'JetBrains Mono', 'SF Mono', monospace;
          user-select: none;
          min-width: 48px;
          text-align: center;
          box-shadow: var(--lp-shadow);
        }
        .theme-light .zoom-display {
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: rgba(255, 255, 255, 0.7);
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
        }
        .glass-minimap {
          border-radius: 6px !important;
          color: var(--lp-zinc-400) !important;
          transition: all 0.2s !important;
          margin: 1px !important;
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

        /* Zoom label in toolbar (Wokwi-style) */
        .canvas-zoom-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--lp-text-secondary, #94a3b8);
          font-family: 'JetBrains Mono', 'SF Mono', monospace;
          user-select: none;
          min-width: 40px;
          text-align: center;
          padding: 0 4px;
          cursor: default;
        }
        .canvas-zoom-label:hover {
          color: var(--lp-text, #e2e8f0);
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

        {/* Zoom In Button */}
        <button
          onClick={() => zoomIn({ duration: 200 })}
          className="canvas-btn secondary"
          title="Zoom In (Ctrl+=)"
        >
          <ZoomIn size={16} />
        </button>

        {/* Zoom Percentage Display */}
        <div className="canvas-zoom-label" title="Current zoom level">
          {Math.round(currentViewport.zoom * 100)}%
        </div>

        {/* Zoom Out Button */}
        <button
          onClick={() => zoomOut({ duration: 200 })}
          className="canvas-btn secondary"
          title="Zoom Out (Ctrl+-)"
        >
          <ZoomOut size={16} />
        </button>

        {/* Fit View Button */}
        <button
          onClick={() => fitView({ duration: 400, padding: 0.2 })}
          className="canvas-btn secondary"
          title="Fit View (Ctrl+0)"
        >
          <Maximize size={16} />
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
