/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 *
 * WireEdge — Clean wire style matching Wokwi/Velxio simulators.
 * Smooth bezier curves with configurable wire colors.
 */
import React, { useCallback, useRef } from 'react';
import { EdgeProps, useReactFlow } from 'reactflow';
import { useForgeStore } from '../../../utlis/store/useForgeStore';

// ── Geometry helpers ──────────────────────────────────────────────────────────

interface Point { x: number; y: number }

/**
 * Build a smooth SVG path through points using bezier curves.
 * When no waypoints: simple bezier between source and target.
 * When waypoints: smooth curve through all points.
 */
function buildSmoothPath(points: Point[]): string {
  if (points.length < 2) return '';
  if (points.length === 2) {
    // Simple bezier curve between two points (like Wokwi default)
    const [p0, p1] = points;
    const dx = Math.abs(p1.x - p0.x) * 0.4;
    const dy = Math.abs(p1.y - p0.y) * 0.4;
    const tension = Math.min(dx, dy, 50);
    return `M ${p0.x} ${p0.y} C ${p0.x + tension} ${p0.y}, ${p1.x - tension} ${p1.y}, ${p1.x} ${p1.y}`;
  }

  // With waypoints: smooth catmull-rom-like bezier through all points
  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const tension = 0.3;

    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  return d;
}

/** Midpoint between two points */
function mid(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

// ── Wokwi-style wire color palette ─────────────────────────────────────────
const WOKWI_WIRE_COLORS = {
  green: '#22c55e',
  red: '#ef4444',
  blue: '#3b82f6',
  yellow: '#eab308',
  black: '#1e293b',
  white: '#f8fafc',
  orange: '#f97316',
  purple: '#a855f7',
  pink: '#ec4899',
  cyan: '#06b6d4',
};

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

  // Waypoints stored in edge data
  const waypoints: Point[] = data?.waypoints ?? [];

  // Full point list: source → waypoints → target
  const allPoints: Point[] = [
    { x: sourceX, y: sourceY },
    ...waypoints,
    { x: targetX, y: targetY },
  ];

  const edgePath = buildSmoothPath(allPoints);
  // Resolve color name to hex (Wokwi-style)
  const wireColor = WOKWI_WIRE_COLORS[data?.color as keyof typeof WOKWI_WIRE_COLORS] || data?.color || '#22c55e';

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
    return { m, insertAfterIdx: i };
  });

  return (
    <g
      className="wire-edge-group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 1. SELECTION HIGHLIGHT */}
      {(selected || isHovered) && (
        <path
          style={{
            stroke: wireColor,
            strokeWidth: 5,
            opacity: 0.25,
            fill: 'none',
            filter: 'blur(3px)',
          }}
          d={edgePath}
        />
      )}

      {/* 2. MAIN WIRE — Wokwi-style clean colored line */}
      <path
        style={{
          ...style,
          stroke: wireColor,
          strokeWidth: 2.5,
          fill: 'none',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }}
        className="react-flow__edge-path"
        d={edgePath}
      />

      {/* 3. INVISIBLE HIT AREA for easier selection */}
      <path
        style={{
          stroke: 'transparent',
          strokeWidth: 12,
          fill: 'none',
          cursor: 'pointer',
        }}
        className="react-flow__edge-interaction"
        d={edgePath}
      />

      {/* 4. SOURCE PIN DOT — small colored circle like Wokwi */}
      <circle
        cx={sourceX}
        cy={sourceY}
        r={3}
        fill={wireColor}
        stroke="#fff"
        strokeWidth={0.5}
        style={{ pointerEvents: 'none' }}
      />

      {/* 5. TARGET PIN DOT */}
      <circle
        cx={targetX}
        cy={targetY}
        r={3}
        fill={wireColor}
        stroke="#fff"
        strokeWidth={0.5}
        style={{ pointerEvents: 'none' }}
      />

      {/* 6. WAYPOINT HANDLES — only when selected or hovered */}
      {(selected || isHovered) && waypoints.map((wp, i) => (
        <g key={`wp-${i}`} style={{ cursor: 'grab' }}>
          <circle
            cx={wp.x}
            cy={wp.y}
            r={4}
            fill="#fff"
            stroke={wireColor}
            strokeWidth={1.5}
            onMouseDown={(e) => onWaypointMouseDown(e, i)}
            onDoubleClick={(e) => removeWaypoint(e, i)}
            style={{
              cursor: 'grab',
              filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.2))',
            }}
          />
        </g>
      ))}

      {/* 7. MID-SEGMENT ADD HANDLES — click to add bend point */}
      {(selected || isHovered) && midHandles.map(({ m, insertAfterIdx }, i) => (
        <g key={`mid-${i}`} style={{ cursor: 'crosshair' }}>
          <circle
            cx={m.x}
            cy={m.y}
            r={3}
            fill={wireColor}
            opacity={0.4}
            onClick={(e) => addWaypoint(e, insertAfterIdx, m)}
            style={{ cursor: 'crosshair', transition: 'all 0.15s' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.setAttribute('r', '5');
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.4';
              e.currentTarget.setAttribute('r', '3');
            }}
          />
        </g>
      ))}
    </g>
  );
};
