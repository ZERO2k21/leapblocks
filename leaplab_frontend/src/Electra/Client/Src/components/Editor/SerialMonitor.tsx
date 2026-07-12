/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */
import React, { useEffect, useRef } from 'react';
import { Trash2, Download, Terminal, ChevronRight, Send } from 'lucide-react';
import { useForgeStore } from '../../../utlis/store/useForgeStore';

interface SerialMonitorProps {
  output: string;
  onClear: () => void;
  onSend?: (data: string) => void;
}

export const SerialMonitor: React.FC<SerialMonitorProps> = ({ output, onClear, onSend }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = React.useState('');
  const [lineEnding, setLineEnding] = React.useState<'none' | 'nl' | 'cr' | 'crnl'>('nl');
  const [isInputFocused, setIsInputFocused] = React.useState(false);
  const uiTheme = useForgeStore(state => state.uiTheme);
  const isDark = uiTheme !== 'light';

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
    inputRef.current?.focus();
  };

  return (
    <div
      className={`flex flex-col h-full overflow-hidden ${
        isDark ? 'bg-[rgba(5,7,10,0.6)] text-[var(--lp-text-color)]' : 'bg-[#f8fafc] text-[#0f172a]'
      }`}
      style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
    >
      {/* ── OUTPUT ── */}
      <div
        ref={terminalRef}
        className={`flex-1 overflow-y-auto overflow-x-hidden relative p-[16px_20px] text-[12px] leading-[1.7] whitespace-pre-wrap break-all ${
          isDark ? 'text-[rgba(148,163,184,0.9)]' : 'text-[#334155]'
        }`}
        style={{
          background: isDark
            ? 'linear-gradient(180deg, rgba(5, 7, 10, 0.4) 0%, rgba(8, 10, 14, 0.6) 100%)'
            : 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
          backgroundImage: isDark
            ? 'radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.012) 1px, transparent 0)'
            : 'radial-gradient(circle at 1px 1px, rgba(0, 0, 0, 0.015) 1px, transparent 0)',
          backgroundSize: '18px 18px',
        }}
      >
        {/* Floating action buttons when output exists */}
        {output && (
          <div
            className="absolute flex items-center top-[12px] right-[12px] gap-[4px] z-[5]"
          >
            <button
              onClick={handleDownload}
              className={`flex items-center cursor-pointer transition-all duration-200 gap-[4px] p-[4px_8px] text-[9px] font-bold tracking-[0.05em] uppercase rounded-[5px] ${
                isDark
                  ? 'bg-[rgba(15,17,23,0.8)] text-[rgba(148,163,184,0.6)] border border-solid border-[rgba(255,255,255,0.06)] hover:text-[var(--lp-accent-bright)] hover:border-[rgba(59,130,246,0.3)]'
                  : 'bg-[rgba(255,255,255,0.9)] text-[rgba(100,116,139,0.6)] border border-solid border-[rgba(15,23,42,0.08)] hover:text-[#0284c7] hover:border-[rgba(2,132,199,0.2)]'
              }`}
              style={{ backdropFilter: 'blur(8px)' }}
            >
              <Download size={10} strokeWidth={2.5} /> Export
            </button>
            <button
              onClick={onClear}
              className={`flex items-center cursor-pointer transition-all duration-200 gap-[4px] p-[4px_8px] text-[9px] font-bold tracking-[0.05em] uppercase rounded-[5px] ${
                isDark
                  ? 'bg-[rgba(15,17,23,0.8)] text-[rgba(148,163,184,0.6)] border border-solid border-[rgba(255,255,255,0.06)]'
                  : 'bg-[rgba(255,255,255,0.9)] text-[rgba(100,116,139,0.6)] border border-solid border-[rgba(15,23,42,0.08)]'
              } hover:text-[#f43f5e] hover:border-[rgba(244,63,94,0.3)]`}
              style={{ backdropFilter: 'blur(8px)' }}
            >
              <Trash2 size={10} strokeWidth={2.5} /> Clear
            </button>
          </div>
        )}

        {output ? (
          <div className="font-['JetBrains_Mono',monospace]">
            {output.split('\n').map((line, i) => {
              if (line.includes('❌') || line.includes('ERROR')) {
                return <div key={i} className="text-[#f43f5e] font-medium">{line}</div>;
              }
              if (line.includes('━━━')) {
                return <div key={i} className={`${isDark ? 'text-[rgba(100,116,139,0.3)]' : 'text-[rgba(148,163,184,0.4)]'}`}>{line}</div>;
              }
              if (line.startsWith('✓') || line.includes('success')) {
                return <div key={i} className="text-[#10b981]">{line}</div>;
              }
              return <div key={i}>{line}</div>;
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full min-h-[160px] text-center select-none">
            <div
              className={`relative flex items-center justify-center w-[48px] h-[48px] rounded-[14px] mb-[14px] ${
                isDark
                  ? 'bg-[rgba(255,255,255,0.025)] border border-solid border-[rgba(255,255,255,0.04)]'
                  : 'bg-[rgba(15,23,42,0.025)] border border-solid border-[rgba(15,23,42,0.04)]'
              }`}
            >
              <Terminal
                size={20}
                strokeWidth={1.5}
                className={`${isDark ? 'text-[rgba(100,116,139,0.35)]' : 'text-[rgba(148,163,184,0.4)]'}`}
              />
              <div
                className="absolute inset-0 rounded-[14px]"
                style={{
                  border: `1px solid ${isDark ? 'rgba(100, 116, 139, 0.08)' : 'rgba(148, 163, 184, 0.08)'}`,
                  animation: 'serial-pulse 3s ease-in-out infinite',
                }}
              />
            </div>
            <div className={`text-[12px] font-medium mb-[4px] ${isDark ? 'text-[rgba(100,116,139,0.5)]' : 'text-[rgba(148,163,184,0.6)]'}`}>
              No serial output yet
            </div>
            <div className={`text-[10px] ${isDark ? 'text-[rgba(71,85,105,0.4)]' : 'text-[rgba(148,163,184,0.4)]'}`}>
              Start simulation to see serial data
            </div>
          </div>
        )}
      </div>

      {/* ── INPUT ── */}
      {onSend && (
        <div
          className={`shrink-0 p-[12px_16px] ${
            isDark ? 'bg-[rgba(10,12,16,0.5)]' : 'bg-[rgba(255,255,255,0.8)]'
          }`}
          style={{
            borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.06)'}`,
          }}
        >
          <div className="flex items-center gap-[8px]" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              className="relative flex-1 flex items-center rounded-[8px] transition-all duration-[0.25s]"
              style={{
                height: '36px',
                background: isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff',
                border: `1px solid ${
                  isInputFocused
                    ? (isDark ? 'rgba(59, 130, 246, 0.4)' : '#0284c7')
                    : (isDark ? 'rgba(255, 255, 255, 0.08)' : '#d1d5db')
                }`,
                boxShadow: isInputFocused
                  ? `0 0 0 3px ${isDark ? 'rgba(59, 130, 246, 0.08)' : 'rgba(2, 132, 199, 0.08)'}`
                  : 'none',
              }}
            >
              <ChevronRight
                size={15}
                className="absolute pointer-events-none left-[11px] transition-colors duration-[0.25s]"
                style={{
                  color: isInputFocused
                    ? (isDark ? 'var(--lp-accent-primary)' : '#0284c7')
                    : (isDark ? 'rgba(100, 116, 139, 0.5)' : '#9ca3af'),
                }}
                strokeWidth={2.5}
              />
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                placeholder="Type message..."
                className="w-full outline-none serial-input-field bg-transparent border-none text-[12px]"
                style={{
                  height: '100%',
                  fontFamily: "'JetBrains Mono', monospace",
                  color: isDark ? 'var(--lp-text-color)' : '#0f172a',
                  caretColor: isDark ? 'var(--lp-accent-primary)' : '#0284c7',
                  paddingLeft: '32px',
                  paddingRight: '12px',
                  paddingTop: 0,
                  paddingBottom: 0,
                }}
              />
            </div>

            <select
              value={lineEnding}
              onChange={(e) => setLineEnding(e.target.value as any)}
              className={`cursor-pointer outline-none text-[9px] font-bold tracking-[0.04em] uppercase rounded-[8px] transition-all duration-[0.2s] ${
                isDark
                  ? 'bg-[rgba(255,255,255,0.03)] border border-solid border-[rgba(255,255,255,0.08)] text-[rgba(148,163,184,0.6)] shadow-none'
                  : 'bg-[#ffffff] border border-solid border-[#d1d5db] text-[#64748b] shadow-[0_1px_2px_rgba(15,23,42,0.04)]'
              }`}
              style={{
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                paddingLeft: '12px',
                paddingRight: '12px',
              }}
            >
              <option value="none">No Ending</option>
              <option value="nl">Newline (\n)</option>
              <option value="cr">Return (\r)</option>
              <option value="crnl">Both (\r\n)</option>
            </select>

            <button
              onClick={handleSend}
              disabled={!inputValue}
              className={`flex items-center justify-center gap-[5px] text-[10px] font-extrabold tracking-[0.06em] uppercase rounded-[8px] border-none transition-all duration-[0.2s] ${
                inputValue
                  ? `cursor-pointer opacity-100 ${
                      isDark
                        ? 'bg-[var(--lp-accent-primary)] text-[var(--lp-btn-text,#000)] hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(59,130,246,0.25)]'
                        : 'bg-[#0284c7] text-[#ffffff] shadow-[0_1px_3px_rgba(2,132,199,0.15)] hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(2,132,199,0.2)]'
                    }`
                  : `cursor-not-allowed opacity-60 shadow-none ${
                      isDark
                        ? 'bg-[rgba(255,255,255,0.04)] text-[rgba(100,116,139,0.3)]'
                        : 'bg-[#f1f5f9] text-[#94a3b8]'
                    }`
              }`}
              style={{
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                paddingLeft: '16px',
                paddingRight: '16px',
              }}
            >
              <Send size={11} strokeWidth={2.5} />
              Send
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes serial-pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        .serial-input-field::placeholder {
          color: #9ca3af;
        }
      `}</style>
    </div>
  );
};
