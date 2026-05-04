/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
/**
 * SerialMonitor.tsx
 * A high-speed, terminal-style component for displaying serial output from the LeapForge simulator.
 */

import React, { useEffect, useRef } from 'react';
import { Trash2, Download, Terminal } from 'lucide-react';

interface SerialMonitorProps {
  output: string;
  onClear: () => void;
}

export const SerialMonitor: React.FC<SerialMonitorProps> = ({ output, onClear }) => {
  const terminalRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([output], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `leapforge-serial-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      background: '#0d1117',
      color: '#c9d1d9',
      fontFamily: 'JetBrains Mono, "Fira Code", monospace'
    }}>
      {/* ── MONITOR TOOLBAR ────────────────────────── */}
      <div style={{
        padding: '8px 16px',
        background: '#161b22',
        borderBottom: '1px solid #30363d',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8b949e', fontSize: '12px' }}>
          <Terminal size={14} />
          <span style={{ fontWeight: 600, letterSpacing: '0.05em' }}>SERIAL MONITOR @ 9600 BAUD</span>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={handleDownload}
            style={{ background: 'transparent', border: 'none', color: '#8b949e', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}
            title="Download Logs"
          >
            <Download size={14} /> Export
          </button>
          <button 
            onClick={onClear}
            style={{ background: 'transparent', border: 'none', color: '#f85149', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}
            title="Clear Console"
          >
            <Trash2 size={14} /> Clear
          </button>
        </div>
      </div>

      {/* ── CONSOLE OUTPUT ───────────────────────────── */}
      <div 
        ref={terminalRef}
        style={{
          flex: 1,
          padding: '16px',
          overflowY: 'auto',
          fontSize: '13px',
          lineHeight: '1.6',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all'
        }}
      >
        {output ? output : (
          <div style={{ color: '#484f58', fontStyle: 'italic' }}>
            Waiting for Serial output...
          </div>
        )}
      </div>
    </div>
  );
};
