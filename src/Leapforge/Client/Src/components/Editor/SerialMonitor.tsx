/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useEffect, useRef } from 'react';
import { Trash2, Download, Terminal, ChevronRight } from 'lucide-react';

interface SerialMonitorProps {
  output: string;
  onClear: () => void;
  onSend?: (data: string) => void;
}

export const SerialMonitor: React.FC<SerialMonitorProps> = ({ output, onClear, onSend }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = React.useState('');
  const [lineEnding, setLineEnding] = React.useState<'none' | 'nl' | 'cr' | 'crnl'>('nl');

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
    switch (lineEnding) {
      case 'nl': dataToSend += '\n'; break;
      case 'cr': dataToSend += '\r'; break;
      case 'crnl': dataToSend += '\r\n'; break;
    }
    onSend(dataToSend);
    setInputValue('');
  };

  return (
    <div className="serial-monitor-container" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#fdfdfd',
      color: '#1e293b',
      fontFamily: 'JetBrains Mono, monospace'
    }}>
      {/* ── TOOLBAR ── */}
      <div style={{
        padding: '12px 20px',
        background: 'rgba(255, 255, 255, 0.5)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '11px', fontWeight: 700 }}>
          <Terminal size={14} />
          <span>SERIAL CONSOLE</span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleDownload}
            style={{ 
              background: 'rgba(123, 79, 196, 0.05)', 
              border: 'none', 
              color: '#7B4FC4', 
              cursor: 'pointer', 
              padding: '6px 12px', 
              borderRadius: '8px',
              fontSize: '11px', 
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Download size={13} /> EXPORT
          </button>
          <button
            onClick={onClear}
            style={{ 
              background: 'rgba(239, 68, 68, 0.05)', 
              border: 'none', 
              color: '#ef4444', 
              cursor: 'pointer', 
              padding: '6px 12px', 
              borderRadius: '8px',
              fontSize: '11px', 
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Trash2 size={13} /> CLEAR
          </button>
        </div>
      </div>

      {/* ── OUTPUT ── */}
      <div
        ref={terminalRef}
        style={{
          flex: 1,
          padding: '20px',
          overflowY: 'auto',
          fontSize: '13px',
          lineHeight: '1.6',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          color: '#334155'
        }}
      >
        {output ? output : (
          <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>
            Ready for input. Start simulation to see serial data.
          </div>
        )}
      </div>

      {/* ── INPUT ── */}
      {onSend && (
        <div style={{
          padding: '16px 20px',
          background: 'rgba(255, 255, 255, 0.8)',
          borderTop: '1px solid rgba(0,0,0,0.06)',
          display: 'flex',
          gap: '10px',
          alignItems: 'center'
        }}>
          <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
            <ChevronRight size={16} style={{ position: 'absolute', left: 12, color: '#94a3b8' }} />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type message..."
              style={{
                width: '100%',
                padding: '10px 12px 10px 32px',
                background: '#f8fafc',
                border: '1px solid rgba(123, 79, 196, 0.1)',
                borderRadius: '12px',
                color: '#1e293b',
                fontSize: '13px',
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'all 0.2s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#7B4FC4';
                e.target.style.background = '#fff';
                e.target.style.boxShadow = '0 0 0 4px rgba(123, 79, 196, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(123, 79, 196, 0.1)';
                e.target.style.background = '#f8fafc';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <select
            value={lineEnding}
            onChange={(e) => setLineEnding(e.target.value as any)}
            style={{
              padding: '10px 12px',
              background: '#f8fafc',
              border: '1px solid rgba(0,0,0,0.06)',
              borderRadius: '12px',
              color: '#64748b',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="none">NO ENDING</option>
            <option value="nl">NEWLINE (\\n)</option>
            <option value="cr">RETURN (\\r)</option>
            <option value="crnl">BOTH (\\r\\n)</option>
          </select>

          <button
            onClick={handleSend}
            disabled={!inputValue}
            style={{
              padding: '10px 24px',
              background: inputValue ? '#7B4FC4' : '#e2e8f0',
              border: 'none',
              borderRadius: '12px',
              color: inputValue ? '#fff' : '#94a3b8',
              fontSize: '13px',
              fontWeight: 700,
              cursor: inputValue ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              boxShadow: inputValue ? '0 4px 12px rgba(123, 79, 196, 0.2)' : 'none'
            }}
          >
            SEND
          </button>
        </div>
      )}
    </div>
  );
};
