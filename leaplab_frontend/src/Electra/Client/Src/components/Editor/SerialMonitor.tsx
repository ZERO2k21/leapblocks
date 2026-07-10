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
      className="flex flex-col h-full overflow-hidden"
      style={{
        background: isDark ? 'rgba(5, 7, 10, 0.6)' : '#f8fafc',
        color: isDark ? 'var(--lp-text-color)' : '#0f172a',
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      }}
    >
      {/* ── OUTPUT ── */}
      <div
        ref={terminalRef}
        className="flex-1 overflow-y-auto overflow-x-hidden relative"
        style={{
          padding: '16px 20px',
          fontSize: '12px',
          lineHeight: '1.7',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          color: isDark ? 'rgba(148, 163, 184, 0.9)' : '#334155',
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
            className="absolute flex items-center"
            style={{
              top: '12px',
              right: '12px',
              gap: '4px',
              zIndex: 5,
            }}
          >
            <button
              onClick={handleDownload}
              className="flex items-center cursor-pointer transition-all duration-200"
              style={{
                gap: '4px',
                padding: '4px 8px',
                fontSize: '9px',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                borderRadius: '5px',
                background: isDark ? 'rgba(15, 17, 23, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.08)'}`,
                color: isDark ? 'rgba(148, 163, 184, 0.6)' : 'rgba(100, 116, 139, 0.6)',
                backdropFilter: 'blur(8px)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = isDark ? 'var(--lp-accent-bright)' : '#0284c7';
                e.currentTarget.style.borderColor = isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(2, 132, 199, 0.2)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = isDark ? 'rgba(148, 163, 184, 0.6)' : 'rgba(100, 116, 139, 0.6)';
                e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.08)';
              }}
            >
              <Download size={10} strokeWidth={2.5} /> Export
            </button>
            <button
              onClick={onClear}
              className="flex items-center cursor-pointer transition-all duration-200"
              style={{
                gap: '4px',
                padding: '4px 8px',
                fontSize: '9px',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                borderRadius: '5px',
                background: isDark ? 'rgba(15, 17, 23, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.08)'}`,
                color: isDark ? 'rgba(148, 163, 184, 0.6)' : 'rgba(100, 116, 139, 0.6)',
                backdropFilter: 'blur(8px)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#f43f5e';
                e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.3)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = isDark ? 'rgba(148, 163, 184, 0.6)' : 'rgba(100, 116, 139, 0.6)';
                e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.08)';
              }}
            >
              <Trash2 size={10} strokeWidth={2.5} /> Clear
            </button>
          </div>
        )}

        {output ? (
          <div style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {output.split('\n').map((line, i) => {
              if (line.includes('❌') || line.includes('ERROR')) {
                return <div key={i} style={{ color: '#f43f5e', fontWeight: 500 }}>{line}</div>;
              }
              if (line.includes('━━━')) {
                return <div key={i} style={{ color: isDark ? 'rgba(100, 116, 139, 0.3)' : 'rgba(148, 163, 184, 0.4)' }}>{line}</div>;
              }
              if (line.startsWith('✓') || line.includes('success')) {
                return <div key={i} style={{ color: '#10b981' }}>{line}</div>;
              }
              return <div key={i}>{line}</div>;
            })}
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center"
            style={{
              height: '100%',
              minHeight: '160px',
              textAlign: 'center',
              userSelect: 'none',
            }}
          >
            <div
              className="relative flex items-center justify-center"
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: isDark ? 'rgba(255, 255, 255, 0.025)' : 'rgba(15, 23, 42, 0.025)',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.04)'}`,
                marginBottom: '14px',
              }}
            >
              <Terminal
                size={20}
                strokeWidth={1.5}
                style={{ color: isDark ? 'rgba(100, 116, 139, 0.35)' : 'rgba(148, 163, 184, 0.4)' }}
              />
              <div
                className="absolute inset-0"
                style={{
                  borderRadius: '14px',
                  border: `1px solid ${isDark ? 'rgba(100, 116, 139, 0.08)' : 'rgba(148, 163, 184, 0.08)'}`,
                  animation: 'serial-pulse 3s ease-in-out infinite',
                }}
              />
            </div>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: isDark ? 'rgba(100, 116, 139, 0.5)' : 'rgba(148, 163, 184, 0.6)',
                marginBottom: '4px',
              }}
            >
              No serial output yet
            </div>
            <div
              style={{
                fontSize: '10px',
                color: isDark ? 'rgba(71, 85, 105, 0.4)' : 'rgba(148, 163, 184, 0.4)',
              }}
            >
              Start simulation to see serial data
            </div>
          </div>
        )}
      </div>

      {/* ── INPUT ── */}
      {onSend && (
        <div
          className="shrink-0"
          style={{
            padding: '10px 16px',
            background: isDark ? 'rgba(10, 12, 16, 0.5)' : 'rgba(255, 255, 255, 0.8)',
            borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.06)'}`,
          }}
        >
          <div className="flex items-center" style={{ gap: '8px' }}>
            <div
              className="relative flex-1 flex items-center"
              style={{
                borderRadius: '8px',
                transition: 'all 0.25s ease',
                background: isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff',
                border: `1px solid ${
                  isInputFocused
                    ? (isDark ? 'rgba(59, 130, 246, 0.4)' : 'rgba(2, 132, 199, 0.35)')
                    : (isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.08)')
                }`,
                boxShadow: isInputFocused
                  ? `0 0 0 3px ${isDark ? 'rgba(59, 130, 246, 0.08)' : 'rgba(2, 132, 199, 0.06)'}`
                  : isDark ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)',
              }}
            >
              <ChevronRight
                size={15}
                className="absolute pointer-events-none"
                style={{
                  left: '11px',
                  color: isInputFocused
                    ? (isDark ? 'var(--lp-accent-primary)' : '#0284c7')
                    : (isDark ? 'rgba(100, 116, 139, 0.35)' : 'rgba(15, 23, 42, 0.2)'),
                  transition: 'color 0.25s ease',
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
                className="w-full outline-none serial-input-field"
                style={{
                  padding: '8px 12px 8px 32px',
                  fontSize: '12px',
                  fontFamily: "'JetBrains Mono', monospace",
                  background: 'transparent',
                  border: 'none',
                  color: isDark ? 'var(--lp-text-color)' : '#0f172a',
                  caretColor: isDark ? 'var(--lp-accent-primary)' : '#0284c7',
                }}
              />
            </div>

            <select
              value={lineEnding}
              onChange={(e) => setLineEnding(e.target.value as any)}
              className="cursor-pointer outline-none"
              style={{
                padding: '7px 10px',
                fontSize: '9px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                borderRadius: '8px',
                background: isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.08)'}`,
                color: isDark ? 'rgba(148, 163, 184, 0.6)' : 'rgba(15, 23, 42, 0.4)',
                boxShadow: isDark ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.04)',
                transition: 'all 0.2s ease',
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
              className="flex items-center cursor-pointer transition-all duration-200"
              style={{
                gap: '5px',
                padding: '8px 14px',
                fontSize: '10px',
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                borderRadius: '8px',
                border: 'none',
                background: inputValue
                  ? (isDark ? 'var(--lp-accent-primary)' : '#0284c7')
                  : (isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.03)'),
                color: inputValue
                  ? (isDark ? 'var(--lp-btn-text, #000)' : '#ffffff')
                  : (isDark ? 'rgba(100, 116, 139, 0.3)' : 'rgba(15, 23, 42, 0.2)'),
                opacity: inputValue ? 1 : 0.6,
                cursor: inputValue ? 'pointer' : 'not-allowed',
                boxShadow: inputValue && !isDark ? '0 1px 3px rgba(2, 132, 199, 0.15)' : 'none',
              }}
              onMouseEnter={e => {
                if (inputValue) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = isDark
                    ? '0 4px 12px rgba(59, 130, 246, 0.25)'
                    : '0 4px 12px rgba(2, 132, 199, 0.2)';
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
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
          color: rgba(15, 23, 42, 0.3);
        }
      `}</style>
    </div>
  );
};
