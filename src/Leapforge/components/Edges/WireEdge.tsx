/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 *
 * WireEdge — movable, bendable wire with draggable waypoints.
 * Click the midpoint handle to add a bend; drag any waypoint to reshape.
 */
import React, { useCallback, useRef } from 'react';
import { EdgeProps, useReactFlow } from 'reactflow';
import { useForgeStore } from '../../store/useForgeStore';

// ── Geometry helpers ──────────────────────────────────────────────────────────

interface Point { x: number; y: number }

/** Build an SVG path string through a list of points with rounded corners */
function buildPath(points: Point[], radius = 8): string {
  if (points.length < 2) return '';
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];

    const d1 = Math.hypot(curr.x - prev.x, curr.y - prev.y);
    const d2 = Math.hypot(next.x - curr.x, next.y - curr.y);
    const r = Math.min(radius, d1 / 2, d2 / 2);

    const t1 = r / d1;
    const t2 = r / d2;

    const bx1 = curr.x - (curr.x - prev.x) * t1;
    const by1 = curr.y - (curr.y - prev.y) * t1;
    const bx2 = curr.x + (next.x - curr.x) * t2;
    const by2 = curr.y + (next.y - curr.y) * t2;

    d += ` L ${bx1} ${by1} Q ${curr.x} ${curr.y} ${bx2} ${by2}`;
  }
  d += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;
  return d;
}

/** Midpoint between two points */
function mid(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

// ── WireEdge component ────────────────────────────────────────────────────────

export const WireEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style = {},
  data,
  selected,
}) => {
  const { getZoom } = useReactFlow();
  const updateEdgeData = useForgeStore(s => s.updateEdgeData);

  // Waypoints stored in edge data — array of {x, y} bend points between source and target
  const waypoints: Point[] = data?.waypoints ?? [];

  // Full point list: source → waypoints → target
  const allPoints: Point[] = [
    { x: sourceX, y: sourceY },
    ...waypoints,
    { x: targetX, y: targetY },
  ];

  const edgePath = buildPath(allPoints, 8);
  const wireColor = data?.color || '#22c55e';

  // ── Waypoint dragging ─────────────────────────────────────────────────────
  const draggingIdx = useRef<number | null>(null);
  const dragStart = useRef<{ mx: number; my: number; wx: number; wy: number } | null>(null);

  const onWaypointMouseDown = useCallback((e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    e.preventDefault();
    draggingIdx.current = idx;
    dragStart.current = {
      mx: e.clientX,
      my: e.clientY,
      wx: waypoints[idx].x,
      wy: waypoints[idx].y,
    };

    const zoom = getZoom();

    const onMove = (ev: MouseEvent) => {
      if (draggingIdx.current === null || !dragStart.current) return;
      const dx = (ev.clientX - dragStart.current.mx) / zoom;
      const dy = (ev.clientY - dragStart.current.my) / zoom;
      const newWaypoints = waypoints.map((wp, i) =>
        i === draggingIdx.current
          ? { x: dragStart.current!.wx + dx, y: dragStart.current!.wy + dy }
          : wp
      );
      updateEdgeData(id, { waypoints: newWaypoints });
    };

    const onUp = () => {
      draggingIdx.current = null;
      dragStart.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [id, waypoints, getZoom, updateEdgeData]);

  // ── Add waypoint on midpoint click ───────────────────────────────────────
  const addWaypoint = useCallback((e: React.MouseEvent, insertAfterIdx: number, pt: Point) => {
    e.stopPropagation();
    e.preventDefault();
    const newWaypoints = [
      ...waypoints.slice(0, insertAfterIdx),
      pt,
      ...waypoints.slice(insertAfterIdx),
    ];
    updateEdgeData(id, { waypoints: newWaypoints });
  }, [id, waypoints, updateEdgeData]);

  // ── Remove waypoint on double-click ──────────────────────────────────────
  const removeWaypoint = useCallback((e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    e.preventDefault();
    const newWaypoints = waypoints.filter((_, i) => i !== idx);
    updateEdgeData(id, { waypoints: newWaypoints });
  }, [id, waypoints, updateEdgeData]);

  // ── Midpoint add-handles (shown between each segment) ────────────────────
  const midHandles = allPoints.slice(0, -1).map((pt, i) => {
    const m = mid(pt, allPoints[i + 1]);
    return { m, insertAfterIdx: i }; // insert after waypoint index i-1 (0-based in waypoints array)
  });

  return (
    <g className="wire-edge-group">
      {/* 1. SELECTION GLOW */}
      {selected && (
        <path
          style={{ stroke: wireColor, strokeWidth: 10, opacity: 0.18, fill: 'none', filter: 'blur(4px)' }}
          d={edgePath}
        />
      )}

      {/* 2. DROP SHADOW */}
      <path
        style={{
          stroke: 'rgba(0,0,0,0.45)', strokeWidth: 5, fill: 'none',
          strokeLinecap: 'round', transform: 'translate(2px, 2.5px)', filter: 'blur(1px)',
        }}
        d={edgePath}
      />

      {/* 3. MAIN WIRE BODY */}
      <path
        style={{ ...style, stroke: wireColor, strokeWidth: 4, fill: 'none', strokeLinecap: 'round' }}
        className="react-flow__edge-path"
        d={edgePath}
      />

      {/* 4. WHITE CORE */}
      <path
        style={{ stroke: '#ffffff', strokeWidth: 1.5, fill: 'none', strokeLinecap: 'round', opacity: 0.75 }}
        d={edgePath}
      />

      {/* 5. GLOSS */}
      <path
        style={{
          stroke: 'rgba(255,255,255,0.3)', strokeWidth: 1, fill: 'none',
          strokeLinecap: 'round', transform: 'translate(-0.5px, -1px)',
        }}
        d={edgePath}
      />

      {/* 6. INVISIBLE HIT AREA */}
      <path
        style={{ stroke: 'transparent', strokeWidth: 14, fill: 'none', cursor: 'pointer' }}
        className="react-flow__edge-interaction"
        d={edgePath}
      />

      {/* 7. PLUG TERMINALS */}
      <g>
        <circle cx={sourceX} cy={sourceY} r={3} fill="#0a0a0a" stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
        <circle cx={sourceX} cy={sourceY} r={1.5} fill="#fff" opacity={0.9} />
        <circle cx={targetX} cy={targetY} r={3} fill="#0a0a0a" stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
        <circle cx={targetX} cy={targetY} r={1.5} fill="#fff" opacity={0.9} />
      </g>

      {/* 8. WAYPOINT HANDLES (drag to bend) — only when selected or hovered */}
      {selected && waypoints.map((wp, i) => (
        <g key={`wp-${i}`} style={{ cursor: 'grab' }}>
          {/* Outer ring */}
          <circle
            cx={wp.x} cy={wp.y} r={7}
            fill={wireColor} stroke="#fff" strokeWidth={1.5} opacity={0.9}
            onMouseDown={(e) => onWaypointMouseDown(e, i)}
            onDoubleClick={(e) => removeWaypoint(e, i)}
            style={{ cursor: 'grab' }}
          />
          {/* Inner dot */}
          <circle cx={wp.x} cy={wp.y} r={2.5} fill="#fff" opacity={0.9} style={{ pointerEvents: 'none' }} />
        </g>
      ))}

      {/* 9. MID-SEGMENT ADD HANDLES (click to add bend point) — only when selected */}
      {selected && midHandles.map(({ m, insertAfterIdx }, i) => (
        <g key={`mid-${i}`} style={{ cursor: 'crosshair' }}>
          <circle
            cx={m.x} cy={m.y} r={5}
            fill="rgba(255,255,255,0.08)" stroke={wireColor} strokeWidth={1.5}
            strokeDasharray="2 2"
            onClick={(e) => addWaypoint(e, insertAfterIdx, m)}
            style={{ cursor: 'crosshair' }}
          />
          <text
            x={m.x} y={m.y + 1}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={8} fill={wireColor} opacity={0.8}
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >+</text>
        </g>
      ))}
    </g>
  );
};
