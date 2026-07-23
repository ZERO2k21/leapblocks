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
      className={`flex flex-col h-full overflow-hidden font-mono ${
        isDark ? 'bg-slate-950/60 text-slate-200' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* ── OUTPUT ── */}
      <div
        ref={terminalRef}
        className={`flex-1 overflow-y-auto overflow-x-hidden relative p-4 text-xs leading-relaxed whitespace-pre-wrap break-all ${
          isDark
            ? 'bg-gradient-to-b from-slate-950/40 to-slate-950/60 text-slate-300 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.012)_1px,transparent_0)] bg-[size:18px_18px]'
            : 'bg-gradient-to-b from-slate-50 to-slate-100 text-slate-700 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.015)_1px,transparent_0)] bg-[size:18px_18px]'
        }`}
      >
        {/* Floating action buttons when output exists */}
        {output && (
          <div className="absolute flex items-center top-3 right-3 gap-1 z-10 backdrop-blur-md rounded-md p-0.5">
            <button
              type="button"
              onClick={handleDownload}
              className={`flex items-center cursor-pointer transition-all duration-200 gap-1 px-2 py-1 text-[9px] font-bold tracking-wider uppercase rounded ${
                isDark
                  ? 'bg-slate-900/80 text-slate-400 border border-white/10 hover:text-blue-400 hover:border-blue-500/40'
                  : 'bg-white/90 text-slate-500 border border-slate-200 hover:text-sky-600 hover:border-sky-500/30'
              }`}
            >
              <Download size={10} strokeWidth={2.5} /> Export
            </button>
            <button
              type="button"
              onClick={onClear}
              className={`flex items-center cursor-pointer transition-all duration-200 gap-1 px-2 py-1 text-[9px] font-bold tracking-wider uppercase rounded ${
                isDark
                  ? 'bg-slate-900/80 text-slate-400 border border-white/10'
                  : 'bg-white/90 text-slate-500 border border-slate-200'
              } hover:text-rose-500 hover:border-rose-500/40`}
            >
              <Trash2 size={10} strokeWidth={2.5} /> Clear
            </button>
          </div>
        )}

        {output ? (
          <div className="font-mono">
            {output.split('\n').map((line, i) => {
              if (line.includes('❌') || line.includes('ERROR')) {
                return <div key={i} className="text-rose-500 font-medium">{line}</div>;
              }
              if (line.includes('━━━')) {
                return <div key={i} className={isDark ? 'text-slate-600/60' : 'text-slate-400/60'}>{line}</div>;
              }
              if (line.startsWith('✓') || line.includes('success')) {
                return <div key={i} className="text-emerald-500">{line}</div>;
              }
              return <div key={i}>{line}</div>;
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full min-h-[160px] text-center select-none">
            <div
              className={`relative flex items-center justify-center w-12 h-12 rounded-xl mb-3.5 ${
                isDark
                  ? 'bg-white/[0.025] border border-white/5'
                  : 'bg-slate-900/[0.025] border border-slate-900/5'
              }`}
            >
              <Terminal
                size={20}
                strokeWidth={1.5}
                className={isDark ? 'text-slate-500' : 'text-slate-400'}
              />
              <div className="absolute inset-0 rounded-xl border border-slate-500/20 animate-ping opacity-30" />
            </div>
            <div className={`text-xs font-medium mb-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
              No serial output yet
            </div>
            <div className={`text-[10px] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
              Start simulation to see serial data
            </div>
          </div>
        )}
      </div>

      {/* ── INPUT ── */}
      {onSend && (
        <div
          className={`shrink-0 p-3 px-4 border-t ${
            isDark
              ? 'bg-slate-950/50 border-white/5'
              : 'bg-white/80 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`relative flex-1 flex items-center h-9 rounded-lg transition-all border ${
                isInputFocused
                  ? isDark
                    ? 'border-blue-500/60 ring-2 ring-blue-500/10'
                    : 'border-sky-600 ring-2 ring-sky-500/10'
                  : isDark
                    ? 'border-white/10 bg-white/[0.03]'
                    : 'border-slate-300 bg-white'
              }`}
            >
              <ChevronRight
                size={15}
                className={`absolute pointer-events-none left-2.5 transition-colors ${
                  isInputFocused
                    ? isDark ? 'text-blue-400' : 'text-sky-600'
                    : isDark ? 'text-slate-500' : 'text-slate-400'
                }`}
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
                className={`w-full h-full outline-none bg-transparent border-0 text-xs font-mono pl-8 pr-3 ${
                  isDark ? 'text-slate-100 placeholder:text-slate-500' : 'text-slate-900 placeholder:text-slate-400'
                }`}
              />
            </div>

            <select
              value={lineEnding}
              onChange={(e) => setLineEnding(e.target.value as any)}
              className={`h-9 px-3 cursor-pointer outline-none text-[9px] font-bold tracking-wider uppercase rounded-lg border transition-all ${
                isDark
                  ? 'bg-white/[0.03] border-white/10 text-slate-400'
                  : 'bg-white border-slate-300 text-slate-600 shadow-sm'
              }`}
            >
              <option value="none">No Ending</option>
              <option value="nl">Newline (\n)</option>
              <option value="cr">Return (\r)</option>
              <option value="crnl">Both (\r\n)</option>
            </select>

            <button
              type="button"
              onClick={handleSend}
              disabled={!inputValue}
              className={`h-9 px-4 flex items-center justify-center gap-1.5 text-[10px] font-extrabold tracking-wider uppercase rounded-lg border-0 transition-all ${
                inputValue
                  ? `cursor-pointer opacity-100 ${
                      isDark
                        ? 'bg-blue-600 text-white hover:-translate-y-0.5 shadow-md shadow-blue-600/20'
                        : 'bg-sky-600 text-white shadow-md shadow-sky-600/20 hover:-translate-y-0.5'
                    }`
                  : `cursor-not-allowed opacity-60 shadow-none ${
                      isDark
                        ? 'bg-white/5 text-slate-600'
                        : 'bg-slate-100 text-slate-400'
                    }`
              }`}
            >
              <Send size={11} strokeWidth={2.5} />
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
