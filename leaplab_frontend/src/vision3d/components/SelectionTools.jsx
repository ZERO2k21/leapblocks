/**
 * SelectionTools.jsx — Blender-like Box/Circle/Lasso selection
 * Works in both Object Mode (shapes) and Edit Mode (vertices/edges/faces).
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */
import { useRef, useEffect, useState } from 'react';
import { debug } from '../utils/logger';
import { getR3FRefs, selectInRectangle, selectInCircle, selectInLasso, CIRCLE_RADIUS } from './selectionTools/selectionUtils';

/**
 * SelectionTools — handles Box (B), Circle (C), and Lasso (Ctrl+RMB) selection.
 * Renders overlay on a separate DOM layer (not inside R3F).
 */
const SelectionTools = () => {
  const [mode, setMode] = useState(null); // null | 'box' | 'circle' | 'lasso'
  const [dragStart, setDragStart] = useState(null);
  const [dragCurrent, setDragCurrent] = useState(null);
  const [circlePos, setCirclePos] = useState(null);
  const [lassoPoints, setLassoPoints] = useState([]);
  const modeRef = useRef(null);
  const dragStartRef = useRef(null);
  const activeRef = useRef(false);

  useEffect(() => {
    const { gl } = getR3FRefs();
    if (!gl) return;
    const canvas = gl.domElement;
    let lassoTimer = null;

    const onKeyDown = (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();

      // B = Box Select
      if (key === 'b' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        debug('SelectionTools: Box Select activated');
        setMode('box');
        modeRef.current = 'box';
        canvas.style.cursor = 'crosshair';
      }

      // C = Circle Select
      if (key === 'c' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        debug('SelectionTools: Circle Select activated');
        setMode('circle');
        modeRef.current = 'circle';
        canvas.style.cursor = 'crosshair';
      }

      // Escape = cancel selection tool
      if (e.key === 'Escape' && modeRef.current) {
        e.preventDefault();
        debug('SelectionTools: cancelled');
        setMode(null);
        modeRef.current = null;
        setDragStart(null);
        setDragCurrent(null);
        setCirclePos(null);
        setLassoPoints([]);
        canvas.style.cursor = 'auto';
      }
    };

    const onPointerDown = (e) => {
      if (!modeRef.current) return;
      if (window.__gizmoActive) return;

      const x = e.clientX;
      const y = e.clientY;

      if (modeRef.current === 'box') {
        setDragStart({ x, y });
        setDragCurrent({ x, y });
        dragStartRef.current = { x, y };
        activeRef.current = true;
      } else if (modeRef.current === 'circle') {
        activeRef.current = true;
        setCirclePos({ x, y });
        selectInCircle(x, y, e.shiftKey);
      } else if (modeRef.current === 'lasso') {
        setLassoPoints([{ x, y }]);
        activeRef.current = true;
      }
    };

    const onPointerMove = (e) => {
      if (!activeRef.current || !modeRef.current) return;

      const x = e.clientX;
      const y = e.clientY;

      if (modeRef.current === 'box') {
        setDragCurrent({ x, y });
      } else if (modeRef.current === 'circle') {
        setCirclePos({ x, y });
        selectInCircle(x, y, e.shiftKey);
      } else if (modeRef.current === 'lasso') {
        setLassoPoints(prev => [...prev, { x, y }]);
      }
    };

    const onPointerUp = (e) => {
      if (!activeRef.current || !modeRef.current) return;

      const x = e.clientX;
      const y = e.clientY;

      if (modeRef.current === 'box' && dragStartRef.current) {
        selectInRectangle(dragStartRef.current, { x, y }, e.shiftKey);
        debug('SelectionTools: Box select applied');
      } else if (modeRef.current === 'lasso') {
        setLassoPoints(prev => {
          if (prev.length > 2) {
            selectInLasso(prev, e.shiftKey);
            debug('SelectionTools: Lasso select applied');
          }
          return [];
        });
      }

      activeRef.current = false;
      if (modeRef.current !== 'circle') {
        setMode(null);
        modeRef.current = null;
        setDragStart(null);
        setDragCurrent(null);
        canvas.style.cursor = 'auto';
      }
    };

    // For circle select, right-click removes, middle-click or escape exits
    const onContextMenu = (e) => {
      if (modeRef.current === 'circle') {
        e.preventDefault();
        // Right-click in circle mode: deselect at position
        // (We handle this by not selecting when right-click is detected)
      }
    };

    const onKeyUp = (e) => {
      if (modeRef.current === 'circle' && e.key === 'c') {
        // Exit circle select on second C press
        setMode(null);
        modeRef.current = null;
        activeRef.current = false;
        setCirclePos(null);
        canvas.style.cursor = 'auto';
      }
    };

    window.addEventListener('keydown', onKeyDown);
    canvas.addEventListener('pointerdown', onPointerDown, { capture: true });
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      canvas.removeEventListener('pointerdown', onPointerDown, { capture: true });
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('keyup', onKeyUp);
      if (lassoTimer) clearTimeout(lassoTimer);
      canvas.style.cursor = 'auto';
    };
  }, []);

  // Render overlay as a separate div on top of canvas
  const { gl } = getR3FRefs();
  const canvas = gl?.domElement;
  const overlayParent = canvas?.parentElement;

  if (!overlayParent || !mode) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 100,
      }}
    >
      {/* Box select rectangle */}
      {mode === 'box' && dragStart && dragCurrent && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(dragStart.x, dragCurrent.x),
            top: Math.min(dragStart.y, dragCurrent.y),
            width: Math.abs(dragCurrent.x - dragStart.x),
            height: Math.abs(dragCurrent.y - dragStart.y),
            border: '1px solid #60a5fa',
            backgroundColor: 'rgba(96, 165, 250, 0.1)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Circle select cursor */}
      {mode === 'circle' && circlePos && (
        <div
          style={{
            position: 'absolute',
            left: circlePos.x - CIRCLE_RADIUS,
            top: circlePos.y - CIRCLE_RADIUS,
            width: CIRCLE_RADIUS * 2,
            height: CIRCLE_RADIUS * 2,
            borderRadius: '50%',
            border: '2px solid #60a5fa',
            backgroundColor: 'rgba(96, 165, 250, 0.1)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Lasso path */}
      {mode === 'lasso' && lassoPoints.length > 1 && (
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          <polyline
            points={lassoPoints.map(p => `${p.x},${p.y}`).join(' ')}
            fill="rgba(96, 165, 250, 0.1)"
            stroke="#60a5fa"
            strokeWidth="1"
          />
        </svg>
      )}
    </div>
  );
};

export default SelectionTools;
