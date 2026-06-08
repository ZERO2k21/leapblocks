/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import ReactFlow, {
  Background,
  MiniMap,
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

import { getComponentPins } from '../lib/PinMap';
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

  const { zoomIn, zoomOut, fitView, getNodes, setViewport, getViewport, screenToFlowPosition } = useReactFlow();
  const currentViewport = useViewport();
  const store = useForgeStore();
  const {
    isSimulating,
    toggleSimulation: toggleStoreSimulation,
    nodes: storeNodes,
    edges: storeEdges,
    addNode,
    updateNodePosition,
    uiTheme,
    toggleUiTheme,
    viewport: savedViewport,
    setViewportState,
    wireDraft,
    pendingSource,
    addWireWaypoint,
    cancelWireDraft,
    setPendingSource,
  } = store;

  // Ref-style bridge to WireDraftOverlay. The overlay registers its setMousePos
  // here on mount; we call it on every throttled mouse move. This keeps the
  // heavy <ReactFlow> / <MiniMap> subtree from re-rendering on each frame.
  const wireOverlayUpdateRef = useRef<((pos: { x: number; y: number } | null) => void) | null>(null);
  const registerWireOverlayUpdate = useCallback((fn: ((pos: { x: number; y: number } | null) => void) | null) => {
    wireOverlayUpdateRef.current = fn;
  }, []);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Sync store -> local React Flow state
  useEffect(() => {
    setNodes(storeNodes);
  }, [storeNodes, setNodes]);

  useEffect(() => {
    setEdges(storeEdges);
  }, [storeEdges, setEdges]);

  // ── Double-click-drag pan mode ─────────────────────────────────────────
  // Single left-click on empty canvas: no pan.
  // Double-click on empty canvas: toggles "pan-drag mode" — while active,
  // left-click-hold + drag pans the viewport. Single clicks without drag
  // still fire onPaneClick (waypoints/deselect). Escape or double-click
  // again exits pan mode.
  const [panDragEnabled, setPanDragEnabled] = useState(false);

  // ── Escape exits pan-drag mode ─────────────────────────────────────
  useEffect(() => {
    if (!panDragEnabled) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPanDragEnabled(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [panDragEnabled]);

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

  // ── Escape cancels wire draft AND any armed pending pin ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (wireDraft || pendingSource)) {
        cancelWireDraft();
        wireOverlayUpdateRef.current?.(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [wireDraft, pendingSource, cancelWireDraft]);

  // ── Tinkercad-style drag-release wire cancellation ──
  // When the user mouse-downs on a pin and releases on empty space (a drag, not a click),
  // the in-progress wire must be cancelled. A quick mousedown+mouseup on empty space
  // (a click) is NOT a drag — it should fall through to onPaneClick and add a waypoint.
  // Also handles the case where a pin is "armed" (pendingSource set) and the user
  // released on empty space without clicking another pin — clears the armed state.
  useEffect(() => {
    if (!wireDraft && !pendingSource) return;
    let downPos: { x: number; y: number } | null = null;

    const onMouseDown = (e: MouseEvent) => {
      // Only track button 0 (left click) and only if the press started outside any handle
      // (the handle's own onMouseDown starts the draft — we just need to detect drags).
      const target = e.target as HTMLElement | null;
      if (target?.closest('.react-flow__handle')) return;
      downPos = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      // If the release lands on a pin handle, that handle's onMouseUp will complete the wire.
      if (target?.closest('.react-flow__handle')) {
        downPos = null;
        return;
      }
      // Detect drag: moved more than 5px between mousedown and mouseup on empty space.
      if (downPos) {
        const dx = e.clientX - downPos.x;
        const dy = e.clientY - downPos.y;
        const moved = Math.hypot(dx, dy) > 5;
        downPos = null;
        if (moved) {
          // User dragged from a pin and released on empty canvas — cancel the wire.
          cancelWireDraft();
          wireOverlayUpdateRef.current?.(null);
          return;
        }
        // Otherwise: it was a click on the pane — let onPaneClick add the waypoint.
        // But if a pin is armed (pendingSource) and we didn't move, the user effectively
        // just clicked on empty space — clear the armed state so the next click is fresh.
        if (pendingSource) {
          setPendingSource(null);
        }
      } else if (pendingSource && !wireDraft) {
        // Mouseup outside any tracked press (rare) — clear armed pin.
        setPendingSource(null);
      }
    };

    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [wireDraft, pendingSource, cancelWireDraft, setPendingSource]);

  // ── Track mouse for draft wire end ──
  // Throttled with requestAnimationFrame so we only commit a state update once
  // per frame (~60Hz max). We push the latest cursor position to the
  // WireDraftOverlay via a ref-callback — the parent does NOT keep a
  // `mousePos` state, so the heavy <ReactFlow> / <MiniMap> subtree is not
  // forced to reconcile on every frame. Only the small overlay re-renders.
  const rafRef = useRef<number | null>(null);
  const latestScreenPosRef = useRef<{ x: number; y: number } | null>(null);
  const onContainerMouseMove = useCallback((event: React.MouseEvent) => {
    if (!wireDraft) return;
    const target = event.currentTarget as HTMLElement | null;
    if (!target) return;
    latestScreenPosRef.current = { x: event.clientX, y: event.clientY };
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const pos = latestScreenPosRef.current;
      if (!pos) return;
      const bounds = target.getBoundingClientRect();
      const vp = getViewport();
      wireOverlayUpdateRef.current?.({
        x: (pos.x - bounds.left - vp.x) / vp.zoom,
        y: (pos.y - bounds.top - vp.y) / vp.zoom,
      });
    });
  }, [wireDraft, getViewport]);

  // Clean up any pending rAF if the component unmounts mid-draft
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  // Note: draft wire source pin position and SVG path are computed inside
  // `WireDraftOverlay` (a separate memoized component) so the parent
  // `ForgeCanvasInner` is not forced to re-render on every mouse move.
  // See <WireDraftOverlay wireDraft={wireDraft} ... /> below.

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

  const onNodeDragStop = useCallback((_: any, node: Node) => {
    updateNodePosition(node.id, node.position);
  }, [updateNodePosition]);

  // ── Edge auto-scroll while dragging a node ──
  // When the user drags a component and the cursor approaches the canvas
  // border (while still INSIDE the canvas), the viewport pans in that
  // direction at a speed proportional to the cursor's distance from the
  // edge. The moment the cursor leaves the canvas bounds, panning stops
  // and the canvas stays static — the user wanted the auto-scroll to be
  // bounded to the canvas area only, not the surrounding panels / toolbar.
  const AUTO_SCROLL_EDGE = 60;     // px from the edge where panning starts
  const AUTO_SCROLL_MAX = 14;      // max viewport delta per drag event
  const onNodeDrag = useCallback((event: React.MouseEvent, _node: Node) => {
    const canvas = document.querySelector('.forge-canvas-container') as HTMLElement | null;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = event.clientX;
    const cy = event.clientY;

    // Only auto-scroll when the cursor is strictly INSIDE the canvas.
    // If the cursor exits (over toolbar, panels, browser chrome, etc.),
    // the canvas stays static.
    if (cx < rect.left || cx > rect.right || cy < rect.top || cy > rect.bottom) {
      return;
    }

    let dx = 0;
    let dy = 0;

    // Horizontal: cursor near left/right edge
    const distLeft = cx - rect.left;
    const distRight = rect.right - cx;
    if (distLeft < AUTO_SCROLL_EDGE) {
      dx = -AUTO_SCROLL_MAX * (1 - distLeft / AUTO_SCROLL_EDGE);
    } else if (distRight < AUTO_SCROLL_EDGE) {
      dx = AUTO_SCROLL_MAX * (1 - distRight / AUTO_SCROLL_EDGE);
    }

    // Vertical: cursor near top/bottom edge
    const distTop = cy - rect.top;
    const distBottom = rect.bottom - cy;
    if (distTop < AUTO_SCROLL_EDGE) {
      dy = -AUTO_SCROLL_MAX * (1 - distTop / AUTO_SCROLL_EDGE);
    } else if (distBottom < AUTO_SCROLL_EDGE) {
      dy = AUTO_SCROLL_MAX * (1 - distBottom / AUTO_SCROLL_EDGE);
    }

    if (dx !== 0 || dy !== 0) {
      const vp = getViewport();
      setViewport({ x: vp.x + dx, y: vp.y + dy, zoom: vp.zoom });
    }
  }, [getViewport, setViewport]);

  const onNodeClick = useCallback((_: any, node: Node) => {
    store.setSelectedNode(node.id);
  }, [store]);

  const lastPaneClickTimeRef = useRef(0);
  const lastPaneClickPosRef = useRef<{ x: number; y: number } | null>(null);

  const onPaneClick = useCallback((event: React.MouseEvent) => {
    const now = performance.now();
    const clickPos = { x: event.clientX, y: event.clientY };
    const prevPos = lastPaneClickPosRef.current;
    const prevTime = lastPaneClickTimeRef.current;
    const dt = now - prevTime;
    const dist = prevPos
      ? Math.hypot(clickPos.x - prevPos.x, clickPos.y - prevPos.y)
      : Infinity;
    const isDoubleClick = prevTime > 0 && dt < 350 && dist < 12;

    if (isDoubleClick) {
      // Toggle pan-drag mode instead of centering the viewport.
      setPanDragEnabled(prev => !prev);
      // Reset the tracker so a third click is treated as a fresh single click.
      lastPaneClickTimeRef.current = 0;
      lastPaneClickPosRef.current = null;
      return;
    }

    lastPaneClickTimeRef.current = now;
    lastPaneClickPosRef.current = clickPos;

    if (wireDraft) {
      const pos = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      addWireWaypoint(pos);
    } else if (!panDragEnabled) {
      // Deselect on single click only when NOT in pan mode.
      store.setSelectedNode(null);
      store.setSelectedEdge(null);
    }
    // In pan mode, single click does nothing (no deselect).
  }, [wireDraft, addWireWaypoint, store, screenToFlowPosition, panDragEnabled]);

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
      onMouseMove={onContainerMouseMove}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{ type: 'wire', updatable: false }}
        nodesConnectable={false}
        nodesDraggable
        // Double-click-drag pan: panOnDrag is disabled by default. Double-click
        // on empty canvas toggles pan-drag mode — while active, left-click-hold
        // + drag pans the viewport. Node drag and pin interactions always take
        // priority. Right-click reserved for browser context menu.
        //   double-click empty   → toggle pan-drag mode
        //   left-drag (pan mode) → canvas pans
        //   drag component       → component moves (with edge auto-scroll)
        //   drag pin             → wire draft
        panOnDrag={panDragEnabled ? [0] : false}
        selectionOnDrag={false}
        panOnScroll={false}
        fitView
        snapToGrid
        snapGrid={[10, 10]}
        minZoom={0.1}
        maxZoom={4}
        zoomOnScroll
        zoomOnPinch
        zoomOnDoubleClick={false}
        style={{ background: 'transparent', cursor: panDragEnabled ? 'grab' : undefined }}
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

      {/* Draft wire overlay (click-to-route) — isolated in its own memoized
          component so the heavy parent (<ReactFlow> + <MiniMap> + toolbar)
          does not re-render on every mouse move during a wire draft. */}
      {wireDraft && (
        <WireDraftOverlay
          wireDraft={wireDraft}
          onRequestUpdate={registerWireOverlayUpdate}
        />
      )}

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

      {/* ComponentSidebar is now docked in ForgeCreova */}
    </div>
  );
};


const ForgeCanvas: React.FC<ForgeCanvasProps> = (props) => (
  <ReactFlowProvider>
    <ForgeCanvasInner {...props} />
  </ReactFlowProvider>
);

// ── WireDraftOverlay ──────────────────────────────────────────────────────
// Self-contained SVG overlay that renders the in-progress wire. It manages
// its own mousePos state so the heavy parent (ForgeCanvas) does NOT re-render
// on every mouse move — only the overlay does. The parent pushes cursor
// updates through a ref-style callback (`pushMousePos`), which is also
// rAF-throttled inside the parent to cap work at ~60Hz.
interface WireDraftOverlayProps {
  wireDraft: any;
  onRequestUpdate: (fn: ((pos: { x: number; y: number } | null) => void) | null) => void;
}
const WireDraftOverlayImpl: React.FC<WireDraftOverlayProps> = ({ wireDraft, onRequestUpdate }) => {
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const { getViewport } = useReactFlow();

  // Expose our setMousePos to the parent via a stable callback registration.
  // The parent calls it on every throttled mouse move. This avoids the parent
  // re-rendering on every mousemove.
  useEffect(() => {
    onRequestUpdate(setMousePos);
    return () => onRequestUpdate(null);
  }, [onRequestUpdate]);

  // Compute the source pin position once per draft change. waypoints are
  // stable per draft; mousePos is the only thing that changes per frame.
  const srcPinPos = useMemo(() => {
    if (!wireDraft) return null;
    if (wireDraft.sourcePosition) return wireDraft.sourcePosition;
    return null;
  }, [wireDraft]);

  // Build the SVG path. The screen-coordinate math uses the live viewport
  // (read once via getViewport()) so we don't allocate a new object on every
  // frame. Straight line construction is O(n) where n = waypoints + 2.
  const draftWirePath = useMemo(() => {
    if (!wireDraft || !mousePos || !srcPinPos) return '';
    const vp = getViewport();
    const allPoints = [srcPinPos, ...wireDraft.waypoints, mousePos];
    const screenPoints = allPoints.map(p => ({
      x: p.x * vp.zoom + vp.x,
      y: p.y * vp.zoom + vp.y,
    }));
    // Straight line between each consecutive point (no 90° L-bends)
    return screenPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }, [wireDraft, mousePos, srcPinPos, getViewport]);

  // Cached viewport for waypoint dot rendering (avoid calling getViewport
  // inside the map callback, which would re-execute on every frame).
  const waypointDots = useMemo(() => {
    if (!wireDraft) return null;
    const vp = getViewport();
    return wireDraft.waypoints.map((pt: { x: number; y: number }, i: number) => {
      const sx = pt.x * vp.zoom + vp.x;
      const sy = pt.y * vp.zoom + vp.y;
      return { key: i, sx, sy };
    });
  }, [wireDraft, mousePos, getViewport]);

  if (!wireDraft || !draftWirePath) return null;

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1001,
      }}
    >
      <path
        d={draftWirePath}
        stroke="#22c55e"
        strokeWidth={5}
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{ filter: 'drop-shadow(0 0 3px rgba(34, 197, 94, 0.5))' }}
      />
      {waypointDots?.map((dot: { key: number; sx: number; sy: number }) => (
        <circle key={dot.key} cx={dot.sx} cy={dot.sy} r={3} fill="#22c55e" stroke="#09090b" strokeWidth={1} />
      ))}
    </svg>
  );
};
const WireDraftOverlay = React.memo(WireDraftOverlayImpl);

export default ForgeCanvas;
