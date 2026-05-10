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
import { useForgeStore } from '../../../utlis/store/useForgeStore';

// ── Geometry helpers ──────────────────────────────────────────────────────────

interface Point { x: number; y: number }

/** Build an SVG path string through a list of points with slightly rounded corners */
function buildPath(points: Point[], radius = 4): string {
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
    // Use a small sharp radius for electrical wire look
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

  const [isHovered, setIsHovered] = React.useState(false);

  // ── Midpoint add-handles (shown between each segment) ────────────────────
  const midHandles = allPoints.slice(0, -1).map((pt, i) => {
    const m = mid(pt, allPoints[i + 1]);
    return { m, insertAfterIdx: i }; // insert after waypoint index i-1 (0-based in waypoints array)
  });

  return (
    <g 
      className="wire-edge-group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 0. GLOW FILTER for plug terminals */}
      <defs>
        <filter id={`plug-glow-${id}`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      {/* 1. SELECTION GLOW */}
      {(selected || isHovered) && (
        <path
          style={{ stroke: wireColor, strokeWidth: 10, opacity: 0.15, fill: 'none', filter: 'blur(4px)' }}
          d={edgePath}
        />
      )}

      {/* 2. DROP SHADOW - Subtle for depth */}
      <path
        style={{
          stroke: 'rgba(0,0,0,0.3)', strokeWidth: 3.5, fill: 'none',
          strokeLinecap: 'round', strokeLinejoin: 'round', transform: 'translate(0.5px, 1px)', filter: 'blur(1px)',
        }}
        d={edgePath}
      />

      {/* 3. MAIN WIRE BODY - Thinner wire */}
      <path
        style={{ ...style, stroke: wireColor, strokeWidth: 3, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }}
        className="react-flow__edge-path"
        d={edgePath}
      />

      {/* 3b. WIRE HIGHLIGHT - thin bright line for 3D cable look */}
      <path
        style={{ stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round', pointerEvents: 'none' }}
        d={edgePath}
      />

      {/* 4. INVISIBLE HIT AREA */}
      <path
        style={{ stroke: 'transparent', strokeWidth: 16, fill: 'none', cursor: 'pointer' }}
        className="react-flow__edge-interaction"
        d={edgePath}
      />

      {/* 5. PLUG TERMINALS - Hidden, component pins will show the connection */}
      <g style={{ display: 'none' }}>
        {/* Terminals hidden - component pin handles show the connection points */}
        <circle cx={sourceX} cy={sourceY} r={0} fill="transparent" />
        <circle cx={targetX} cy={targetY} r={0} fill="transparent" />
      </g>

      {/* 6. WAYPOINT HANDLES (drag to bend) — only when selected or hovered */}
      {(selected || isHovered) && waypoints.map((wp, i) => (
        <g key={`wp-${i}`} style={{ cursor: 'grab' }}>
          <circle
            cx={wp.x} cy={wp.y} r={6}
            fill="#fff" stroke={wireColor} strokeWidth={2}
            onMouseDown={(e) => onWaypointMouseDown(e, i)}
            onDoubleClick={(e) => removeWaypoint(e, i)}
            style={{ cursor: 'grab', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
          />
        </g>
      ))}

      {/* 7. MID-SEGMENT ADD HANDLES (click to add bend point) — only when selected or hovered */}
      {(selected || isHovered) && midHandles.map(({ m, insertAfterIdx }, i) => (
        <g key={`mid-${i}`} style={{ cursor: 'crosshair' }}>
          <circle
            cx={m.x} cy={m.y} r={4}
            fill={wireColor}
            opacity={0.6}
            onClick={(e) => addWaypoint(e, insertAfterIdx, m)}
            style={{ cursor: 'crosshair', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.r = '6'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.r = '4'; }}
          />
        </g>
      ))}
    </g>
  );
};
