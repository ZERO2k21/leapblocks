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
    element.download = `electra-serial-${Date.now()}.txt`;
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
      background: '#0a0e1a',
      color: '#e2e8f0',
      fontFamily: 'JetBrains Mono, monospace'
    }}>
      {/* ── TOOLBAR ── */}
      <div style={{
        padding: '14px 24px',
        background: 'linear-gradient(135deg, rgba(21, 27, 46, 0.95), rgba(15, 20, 35, 0.9))',
        borderBottom: '2px solid rgba(168, 85, 247, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#c084fc', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
          <Terminal size={16} strokeWidth={2.5} />
          <span>SERIAL CONSOLE</span>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleDownload}
            style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(6, 182, 212, 0.1))',
              border: '1.5px solid rgba(168, 85, 247, 0.4)',
              color: '#c084fc',
              cursor: 'pointer',
              padding: '7px 14px',
              borderRadius: '10px',
              fontSize: '11px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #a855f7, #06b6d4)';
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(168, 85, 247, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(6, 182, 212, 0.1))';
              e.currentTarget.style.color = '#c084fc';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Download size={13} strokeWidth={2.5} /> EXPORT
          </button>
          <button
            onClick={onClear}
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1.5px solid rgba(239, 68, 68, 0.5)',
              color: '#ef4444',
              cursor: 'pointer',
              padding: '7px 14px',
              borderRadius: '10px',
              fontSize: '11px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#ef4444';
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
              e.currentTarget.style.color = '#ef4444';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Trash2 size={13} strokeWidth={2.5} /> CLEAR
          </button>
        </div>
      </div>

      {/* ── OUTPUT ── */}
      <div
        ref={terminalRef}
        style={{
          flex: 1,
          padding: '24px',
          overflowY: 'auto',
          fontSize: '13px',
          lineHeight: '1.7',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          color: '#e2e8f0',
          background: 'linear-gradient(180deg, #0a0e1a 0%, #0f1419 100%)'
        }}
      >
        {output ? output : (
          <div style={{ color: '#64748b', fontStyle: 'italic', textAlign: 'center', marginTop: '40px', fontSize: '14px' }}>
            <Terminal size={40} style={{ opacity: 0.2, marginBottom: '12px' }} />
            <div>Ready for input. Start simulation to see serial data.</div>
          </div>
        )}
      </div>

      {/* ── INPUT ── */}
      {onSend && (
        <div style={{
          padding: '18px 24px',
          background: 'linear-gradient(135deg, rgba(21, 27, 46, 0.95), rgba(15, 20, 35, 0.9))',
          borderTop: '2px solid rgba(168, 85, 247, 0.3)',
          display: 'flex',
          gap: '12px',
          alignItems: 'center'
        }}>
          <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
            <ChevronRight size={18} style={{ position: 'absolute', left: 14, color: '#a855f7' }} strokeWidth={2.5} />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type message..."
              style={{
                width: '100%',
                padding: '12px 14px 12px 40px',
                background: '#151b2e',
                border: '2px solid rgba(168, 85, 247, 0.3)',
                borderRadius: '12px',
                color: '#e2e8f0',
                fontSize: '13px',
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'all 0.3s ease',
                fontWeight: 500
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#a855f7';
                e.target.style.background = '#1a2137';
                e.target.style.boxShadow = '0 0 0 4px rgba(168, 85, 247, 0.15), 0 0 20px rgba(168, 85, 247, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(168, 85, 247, 0.3)';
                e.target.style.background = '#151b2e';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <select
            value={lineEnding}
            onChange={(e) => setLineEnding(e.target.value as any)}
            style={{
              padding: '12px 14px',
              background: '#151b2e',
              border: '2px solid rgba(168, 85, 247, 0.3)',
              borderRadius: '12px',
              color: '#94a3b8',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              outline: 'none',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
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
              padding: '12px 28px',
              background: inputValue ? 'linear-gradient(135deg, #a855f7, #06b6d4)' : '#1a2137',
              border: 'none',
              borderRadius: '12px',
              color: inputValue ? '#fff' : '#475569',
              fontSize: '12px',
              fontWeight: 800,
              cursor: inputValue ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s ease',
              boxShadow: inputValue ? '0 6px 16px rgba(168, 85, 247, 0.5)' : 'none',
              textTransform: 'uppercase',
              letterSpacing: '0.8px'
            }}
            onMouseEnter={(e) => {
              if (inputValue) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(168, 85, 247, 0.6)';
              }
            }}
            onMouseLeave={(e) => {
              if (inputValue) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(168, 85, 247, 0.5)';
              }
            }}
          >
            SEND
          </button>
        </div>
      )}
    </div>
  );
};
