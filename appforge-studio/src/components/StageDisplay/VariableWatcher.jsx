// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// VariableWatcher - Displays a variable on stage
// Shows name and value, draggable
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import React, { useState, useRef, useEffect } from 'react';
import './VariableWatcher.css';

const VariableWatcher = ({ variable, onPositionChange, onClose }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const watcherRef = useRef(null);

  // When value changes, animate the display
  const [displayValue, setDisplayValue] = useState(variable.value);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (displayValue !== variable.value) {
      setAnimate(true);
      setDisplayValue(variable.value);
      const timer = setTimeout(() => setAnimate(false), 300);
      return () => clearTimeout(timer);
    }
  }, [variable.value]);

  // Drag handlers
  const handleMouseDown = (e) => {
    if (!watcherRef.current) return;

    const rect = watcherRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsDragging(true);
    e.preventDefault();
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      if (!watcherRef.current) return;

      const container = watcherRef.current.parentElement;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const x = e.clientX - containerRect.left - dragOffset.x;
      const y = e.clientY - containerRect.top - dragOffset.y;

      // Update position
      watcherRef.current.style.left = `${x}px`;
      watcherRef.current.style.top = `${y}px`;
    };

    const handleMouseUp = () => {
      if (!watcherRef.current) return;
      setIsDragging(false);

      // Save position
      const computedStyle = window.getComputedStyle(watcherRef.current);
      const x = parseInt(computedStyle.left, 10);
      const y = parseInt(computedStyle.top, 10);

      if (onPositionChange) {
        onPositionChange(variable.id, x, y);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, variable.id, onPositionChange]);

  // Format value for display
  const formatValue = (val) => {
    if (typeof val === 'string') return `"${val}"`;
    if (typeof val === 'number') return val.toFixed(2).replace(/\.00$/, '');
    return String(val);
  };

  return (
    <div
      ref={watcherRef}
      className={`variable-watcher ${isDragging ? 'dragging' : ''} ${animate ? 'pulse' : ''}`}
      style={{
        left: `${variable.x}px`,
        top: `${variable.y}px`,
      }}
      onMouseDown={handleMouseDown}
      title="Drag to reposition"
    >
      <div className="watcher-close" onClick={(e) => { e.stopPropagation(); onClose && onClose(); }}>×</div>
      <div className="watcher-header">
        <span className="watcher-name">{variable.name}</span>
      </div>
      <div className="watcher-value">
        {formatValue(displayValue)}
      </div>
    </div>
  );
};

export default VariableWatcher;
