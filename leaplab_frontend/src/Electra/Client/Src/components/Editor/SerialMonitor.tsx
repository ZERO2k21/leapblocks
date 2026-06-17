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
    <div className="serial-monitor-container">
      {/* ── TOOLBAR ── */}
      <div className="serial-monitor-header">
        <div className="serial-monitor-title">
          <Terminal size={16} strokeWidth={2.5} />
          <span>SERIAL CONSOLE</span>
        </div>

        <div className="serial-monitor-buttons">
          <button onClick={handleDownload} className="serial-btn">
            <Download size={13} strokeWidth={2.5} /> EXPORT
          </button>
          <button onClick={onClear} className="serial-btn-clear">
            <Trash2 size={13} strokeWidth={2.5} /> CLEAR
          </button>
        </div>
      </div>

      {/* ── OUTPUT ── */}
      <div ref={terminalRef} className="serial-monitor-output">
        {output ? output : (
          <div style={{ color: 'var(--lp-zinc-600)', fontStyle: 'italic', textAlign: 'center', marginTop: '40px', fontSize: '14px' }}>
            <Terminal size={40} style={{ opacity: 0.2, marginBottom: '12px', color: 'var(--lp-zinc-600)' }} />
            <div>Ready for input. Start simulation to see serial data.</div>
          </div>
        )}
      </div>

      {/* ── INPUT ── */}
      {onSend && (
        <div className="serial-monitor-footer">
          <div className="serial-input-wrapper">
            <ChevronRight size={18} className="serial-input-icon" strokeWidth={2.5} />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type message..."
              className="serial-input-field"
            />
          </div>

          <select
            value={lineEnding}
            onChange={(e) => setLineEnding(e.target.value as any)}
            className="serial-select-ending"
          >
            <option value="none">NO ENDING</option>
            <option value="nl">NEWLINE (\\n)</option>
            <option value="cr">RETURN (\\r)</option>
            <option value="crnl">BOTH (\\r\\n)</option>
          </select>

          <button
            onClick={handleSend}
            disabled={!inputValue}
            className="serial-send-btn"
          >
            SEND
          </button>
        </div>
      )}
    </div>
  );
};
