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
    <div className="flex flex-col h-full font-mono" style={{ background: 'var(--lp-dark-bg)', color: 'var(--lp-text-color)' }}>
      {/* ── TOOLBAR ── */}
      <div className="flex justify-between items-center px-4 py-1.5 backdrop-blur-[8px]" style={{ background: 'var(--lp-glass)', borderBottom: '1px solid var(--lp-border)', boxShadow: 'var(--lp-shadow)' }}>
        <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[1px]" style={{ color: 'var(--lp-accent-primary)' }}>
          <Terminal size={16} strokeWidth={2.5} />
          <span>SERIAL CONSOLE</span>
        </div>

        <div className="flex gap-2">
          <button onClick={handleDownload} className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.5px] cursor-pointer rounded-[var(--lp-radius-sm)] transition-all duration-200 hover:bg-[var(--lp-accent-primary)] hover:text-[var(--lp-btn-text,#000)] hover:border-[var(--lp-accent-primary)]" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--lp-border)', color: 'var(--lp-accent-bright)' }}>
            <Download size={13} strokeWidth={2.5} /> EXPORT
          </button>
          <button onClick={onClear} className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.5px] cursor-pointer rounded-[var(--lp-radius-sm)] transition-all duration-200 hover:bg-[var(--lp-rose)] hover:text-white hover:border-[var(--lp-rose)]" style={{ background: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.2)', color: 'var(--lp-rose)' }}>
            <Trash2 size={13} strokeWidth={2.5} /> CLEAR
          </button>
        </div>
      </div>

      {/* ── OUTPUT ── */}
      <div ref={terminalRef} className="flex-1 p-5 overflow-y-auto text-[12px] leading-[1.6] whitespace-pre-wrap break-all" style={{ color: 'var(--lp-zinc-400)', backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.015) 1px, transparent 0)', backgroundSize: '16px 16px', backgroundColor: 'rgba(5, 5, 8, 0.3)' }}>
        {output ? output : (
          <div className="text-center mt-10 text-[14px] italic" style={{ color: 'var(--lp-zinc-600)' }}>
            <Terminal size={40} className="opacity-20 mb-3" style={{ color: 'var(--lp-zinc-600)' }} />
            <div>Ready for input. Start simulation to see serial data.</div>
          </div>
        )}
      </div>

      {/* ── INPUT ── */}
      {onSend && (
        <div className="flex items-center gap-2 px-4 py-1.5 backdrop-blur-[12px]" style={{ background: 'var(--lp-glass)', borderTop: '1px solid var(--lp-border)' }}>
          <div className="relative flex-1 flex items-center">
            <ChevronRight size={18} className="absolute left-2 transition-all duration-300" strokeWidth={2.5} style={{ color: 'var(--lp-accent-primary)' }} />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type message..."
              className="w-full py-1.5 pr-2.5 pl-[30px] text-[12px] outline-none transition-all duration-200 rounded-[var(--lp-radius-sm)] focus:border-[var(--lp-accent-primary)] focus:bg-[rgba(255,255,255,0.04)]"
              style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--lp-border)', color: 'var(--lp-text-color)', fontFamily: 'inherit' }}
            />
          </div>

          <select
            value={lineEnding}
            onChange={(e) => setLineEnding(e.target.value as any)}
            className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.5px] cursor-pointer outline-none rounded-[var(--lp-radius-sm)] transition-all duration-200 focus:border-[var(--lp-accent-primary)]"
            style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--lp-border)', color: 'var(--lp-zinc-400)' }}
          >
            <option value="none">NO ENDING</option>
            <option value="nl">NEWLINE (\\n)</option>
            <option value="cr">RETURN (\\r)</option>
            <option value="crnl">BOTH (\\r\\n)</option>
          </select>

          <button
            onClick={handleSend}
            disabled={!inputValue}
            className="px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.8px] cursor-pointer rounded-[var(--lp-radius-sm)] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: !inputValue ? 'rgba(255, 255, 255, 0.05)' : 'var(--lp-accent-primary)', border: 'none', color: !inputValue ? 'var(--lp-zinc-600)' : 'var(--lp-btn-text, #000)' }}
          >
            SEND
          </button>
        </div>
      )}
    </div>
  );
};
