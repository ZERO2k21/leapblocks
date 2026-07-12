// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// VariableWatcher - Displays a variable on stage
// Shows name and value, draggable
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import React, { useState, useRef, useEffect } from 'react';

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
    if (Array.isArray(val)) return `List (${val.length} items)`;
    if (val && typeof val === 'object') {
      if (val.rows && val.columns) {
        return `Table (${val.rows.length} x ${val.columns.length})`;
      }
      return 'Object';
    }
    if (typeof val === 'string') return `"${val}"`;
    if (typeof val === 'number') return val.toFixed(2).replace(/\.00$/, '');
    return String(val);
  };

  return (
    <div
      ref={watcherRef}
      className={`group absolute bg-gradient-to-br from-[#FFD93D] to-[#FFBF00] border-[3px] border-[#e6a800] rounded-xl p-0 min-w-[120px] shadow-[0_4px_8px_rgba(0,0,0,0.2),0_2px_4px_rgba(0,0,0,0.1)] cursor-move select-none z-[1000] overflow-hidden transition-shadow duration-200 before:content-[''] before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/30 before:to-transparent before:pointer-events-none before:rounded-xl ${isDragging ? 'z-[9999] shadow-[0_12px_24px_rgba(0,0,0,0.3),0_8px_16px_rgba(0,0,0,0.2)] opacity-95' : 'hover:shadow-[0_6px_12px_rgba(0,0,0,0.25),0_4px_8px_rgba(0,0,0,0.15)]'} ${animate ? 'animate-pulse-watcher' : ''}`}
      style={{
        left: `${variable.x}px`,
        top: `${variable.y}px`,
        fontFamily: "'Roboto', 'Arial', sans-serif",
      }}
      onMouseDown={handleMouseDown}
      title="Drag to reposition"
    >
      <div className="absolute top-1 right-1.5 w-5 h-5 bg-black/20 rounded-full flex items-center justify-center text-[16px] leading-none text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-500/50" onClick={(e) => { e.stopPropagation(); onClose && onClose(); }}>×</div>
      <div className="bg-black/15 px-3 py-2 border-b-2 border-black/10 text-[13px] font-bold text-[#333] uppercase tracking-[0.5px]">
        <span>{variable.name}</span>
      </div>
      <div className="px-3 py-3 text-[24px] font-bold text-[#222] text-center font-['Courier_New',monospace]">
        {formatValue(displayValue)}
      </div>
    </div>
  );
};

export default VariableWatcher;
