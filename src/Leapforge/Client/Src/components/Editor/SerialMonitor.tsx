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
  onSend?: (data: string) => void;
}

export const SerialMonitor: React.FC<SerialMonitorProps> = ({ output, onClear, onSend }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = React.useState('');
  const [lineEnding, setLineEnding] = React.useState<'none' | 'nl' | 'cr' | 'crnl'>('nl');

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

  const handleSend = () => {
    if (!inputValue || !onSend) return;

    let dataToSend = inputValue;

    // Add line ending based on selection
    switch (lineEnding) {
      case 'nl':
        dataToSend += '\n';
        break;
      case 'cr':
        dataToSend += '\r';
        break;
      case 'crnl':
        dataToSend += '\r\n';
        break;
      case 'none':
      default:
        // No line ending
        break;
    }

    onSend(dataToSend);
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
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

      {/* ── INPUT SECTION ───────────────────────────── */}
      {onSend && (
        <div style={{
          padding: '12px 16px',
          background: '#161b22',
          borderTop: '1px solid #30363d',
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type message to send..."
            style={{
              flex: 1,
              padding: '8px 12px',
              background: '#0d1117',
              border: '1px solid #30363d',
              borderRadius: '6px',
              color: '#c9d1d9',
              fontSize: '13px',
              fontFamily: 'inherit',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#58a6ff'}
            onBlur={(e) => e.target.style.borderColor = '#30363d'}
          />

          <select
            value={lineEnding}
            onChange={(e) => setLineEnding(e.target.value as any)}
            style={{
              padding: '8px 12px',
              background: '#0d1117',
              border: '1px solid #30363d',
              borderRadius: '6px',
              color: '#8b949e',
              fontSize: '11px',
              fontFamily: 'inherit',
              cursor: 'pointer',
              outline: 'none'
            }}
            title="Line ending"
          >
            <option value="none">No line ending</option>
            <option value="nl">Newline (\\n)</option>
            <option value="cr">Carriage return (\\r)</option>
            <option value="crnl">Both (\\r\\n)</option>
          </select>

          <button
            onClick={handleSend}
            disabled={!inputValue}
            style={{
              padding: '8px 16px',
              background: inputValue ? '#238636' : '#21262d',
              border: 'none',
              borderRadius: '6px',
              color: inputValue ? '#ffffff' : '#484f58',
              fontSize: '13px',
              fontWeight: 600,
              cursor: inputValue ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (inputValue) {
                e.currentTarget.style.background = '#2ea043';
              }
            }}
            onMouseLeave={(e) => {
              if (inputValue) {
                e.currentTarget.style.background = '#238636';
              }
            }}
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
};
