import React, { useCallback, useRef } from 'react';
import { EdgeProps, useReactFlow } from 'reactflow';
import { useForgeStore } from '../../../utils/store/useForgeStore';
import { type Point } from '../../lib/orthogonalRouting';

// ── Wokwi-style wire color palette ─────────────────────────────────────────
const WOKWI_WIRE_COLORS: Record<string, string> = {
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

// ── WireEdge component ─────────────────────────────────────────────────────

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
  const isDraggingWaypoint = useForgeStore(s => s.isDraggingWaypoint);
  const setIsDraggingWaypoint = useForgeStore(s => s.setIsDraggingWaypoint);

  const userWaypoints: Point[] = data?.waypoints ?? [];
  const hasUserWaypoints = userWaypoints.length > 0;

  // Source and target as points
  const src = { x: sourceX, y: sourceY };
  const tgt = { x: targetX, y: targetY };

  // Bend points: user-defined, or empty for a straight line
  const bendPoints: Point[] = hasUserWaypoints ? userWaypoints : [];

  // Full point list for path construction — straight line between each
  // consecutive point (no 90° orthogonal L-bends).
  const allPoints: Point[] = [src, ...bendPoints, tgt];
  const edgePath = allPoints.length < 2
    ? ''
    : allPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Resolve color name to hex (Wokwi-style)
  const wireColor = WOKWI_WIRE_COLORS[data?.color as keyof typeof WOKWI_WIRE_COLORS] || data?.color || '#22c55e';

  // ── Waypoint dragging ─────────────────────────────────────────────────────
  const draggingIdx = useRef<number | null>(null);
  const dragStart = useRef<{ mx: number; my: number; wx: number; wy: number } | null>(null);

  const onWaypointMouseDown = useCallback((e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDraggingWaypoint(true);
    draggingIdx.current = idx;
    dragStart.current = {
      mx: e.clientX,
      my: e.clientY,
      wx: bendPoints[idx].x,
      wy: bendPoints[idx].y,
    };

    const zoom = getZoom();

    const onMove = (ev: MouseEvent) => {
      if (draggingIdx.current === null || !dragStart.current) return;
      const dx = (ev.clientX - dragStart.current.mx) / zoom;
      const dy = (ev.clientY - dragStart.current.my) / zoom;
      const newBendPoints = bendPoints.map((wp, i) =>
        i === draggingIdx.current
          ? { x: dragStart.current!.wx + dx, y: dragStart.current!.wy + dy }
          : wp
      );
      updateEdgeData(id, { waypoints: newBendPoints });
    };

    const onUp = () => {
      draggingIdx.current = null;
      dragStart.current = null;
      setIsDraggingWaypoint(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [id, bendPoints, getZoom, updateEdgeData, setIsDraggingWaypoint]);

  // ── Add waypoint on midpoint click ───────────────────────────────────────
  const addWaypoint = useCallback((e: React.MouseEvent, insertAfterIdx: number, pt: Point) => {
    e.stopPropagation();
    e.preventDefault();
    const newWaypoints = [
      ...bendPoints.slice(0, insertAfterIdx),
      pt,
      ...bendPoints.slice(insertAfterIdx),
    ];
    updateEdgeData(id, { waypoints: newWaypoints });
  }, [id, bendPoints, updateEdgeData]);

  // ── Remove waypoint on double-click ──────────────────────────────────────
  const removeWaypoint = useCallback((e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    e.preventDefault();
    const newWaypoints = bendPoints.filter((_, i) => i !== idx);
    updateEdgeData(id, { waypoints: newWaypoints });
  }, [id, bendPoints, updateEdgeData]);

  const [isHovered, setIsHovered] = React.useState(false);

  // ── Midpoint add-handles ────────────────────────────────────────────────
  const midHandles = allPoints.slice(0, -1).map((pt, i) => {
    const next = allPoints[i + 1];
    const m = { x: (pt.x + next.x) / 2, y: (pt.y + next.y) / 2 };
    return { m, insertAfterIdx: i };
  });

  return (
    <g
      className="wire-edge-group"
      onMouseEnter={() => {
        if (isDraggingWaypoint) return;
        setIsHovered(true);
      }}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        pointerEvents: (isDraggingWaypoint && !selected) ? 'none' : 'auto'
      }}
    >
      {/* 1. SELECTION HIGHLIGHT — flat, no blur */}
      {(selected || isHovered) && (
        <path
          style={{
            stroke: wireColor,
            strokeWidth: 2.5,
            opacity: 0.2,
            fill: 'none',
          }}
          d={edgePath}
        />
      )}

      {/* 2. MAIN WIRE — straight line between consecutive points */}
      <path
        style={{
          ...style,
          stroke: wireColor,
          strokeWidth: 2,
          fill: 'none',
          strokeLinejoin: 'round',
          pointerEvents: 'none',
        }}
        className="react-flow__edge-path"
        d={edgePath}
      />

      {/* 3. INVISIBLE HIT AREA for easier selection — strokeLinecap round
          extends the hit area 10px beyond the endpoints so clicking near a
          terminal (pin handle) still registers on the wire. */}
      <path
        style={{
          stroke: 'transparent',
          strokeWidth: 2.5,
          fill: 'none',
          cursor: 'pointer',
          pointerEvents: 'stroke',
        }}
        className="react-flow__edge-interaction"
        d={edgePath}
      />

      {/* 5. SOURCE PIN DOT — visual only */}
      <circle
        cx={sourceX}
        cy={sourceY}
        r={1}
        fill={wireColor}
        stroke="none"
        style={{ pointerEvents: 'none' }}
      />

      {/* 6. TARGET PIN DOT — visual only */}
      <circle
        cx={targetX}
        cy={targetY}
        r={1}
        fill={wireColor}
        stroke="none"
        style={{ pointerEvents: 'none' }}
      />

      {/* 6. BEND-POINT HANDLES — drag to reposition, double-click to remove */}
      {(selected || isHovered) && bendPoints.map((wp, i) => (
        <g key={`wp-${i}`} style={{ cursor: 'grab' }}>
          <circle
            cx={wp.x}
            cy={wp.y}
            r={2.5}
            fill="#fff"
            stroke={wireColor}
            strokeWidth={1}
            onMouseDown={(e) => onWaypointMouseDown(e, i)}
            onDoubleClick={(e) => removeWaypoint(e, i)}
            style={{ cursor: 'grab' }}
          />
        </g>
      ))}

      {/* 7. MID-SEGMENT ADD HANDLES — click to add a bend point */}
      {(selected || isHovered) && midHandles.map(({ m, insertAfterIdx }, i) => (
        <g key={`mid-${i}`} style={{ cursor: 'crosshair' }}>
          <circle
            cx={m.x}
            cy={m.y}
            r={2}
            fill={wireColor}
            opacity={0.4}
            onClick={(e) => addWaypoint(e, insertAfterIdx, m)}
            style={{ cursor: 'crosshair', transition: 'all 0.15s' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.setAttribute('r', '3');
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.4';
              e.currentTarget.setAttribute('r', '2');
            }}
          />
        </g>
      ))}
    </g>
  );
};
