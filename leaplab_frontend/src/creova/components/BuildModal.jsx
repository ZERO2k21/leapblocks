/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useEffect, useRef } from 'react';
import { Loader2, CheckCircle, XCircle, FolderOpen, RefreshCw, X, Terminal } from 'lucide-react';

export default function BuildModal({ isOpen, onClose, buildState, logs, appName, packageName, onOpenFile, onRetry }) {
  const logsEndRef = useRef(null);

  useEffect(() => {
    // Auto-scroll logs to bottom
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  if (!isOpen) return null;

  // Clean log message parsing to extract timestamps if already present
  const parseLog = (log) => {
    const timeRegex = /^\[\d{1,2}:\d{2}:\d{2}(?:\s?[AP]M)?\]/i;
    const match = log.match(timeRegex);
    if (match) {
      const timestamp = match[0];
      const message = log.substring(timestamp.length).trim();
      return { timestamp, message };
    }
    return { timestamp: null, message: log };
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 z-[9999] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-[20px] shadow-[0_24px_60px_-15px_rgba(0,0,0,0.15)] w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 animate-scale-in">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Terminal className="h-5 w-5 text-indigo-600" />
              <span>Building APK</span>
            </h2>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 font-medium">
              <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-semibold">{appName}</span>
              <span>•</span>
              <span className="font-mono text-[10px] text-slate-400">{packageName}</span>
            </div>
          </div>
          {buildState === 'idle' && (
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-xl transition-all duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Progress Indication */}
        <div className="px-6 py-5 bg-white border-b border-slate-100 flex items-center min-h-[5.5rem] shrink-0">
          {buildState === 'building' && (
            <div className="flex items-center gap-4 w-full">
              <div className="relative flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-indigo-600 animate-spin shrink-0 z-10" />
                <div className="absolute h-10 w-10 bg-indigo-50 rounded-full animate-ping opacity-40"></div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-slate-700">Compiling with Gradle...</span>
                  <span className="text-xs text-indigo-600 font-medium animate-pulse">In Progress</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 w-1/2 rounded-full relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/30 animate-[pulse_1.5s_ease-in-out_infinite] translate-x-[-100%] shadow-[2px_0_10px_white]"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {buildState === 'success' && (
            <div className="flex items-center gap-3 text-emerald-600 bg-emerald-50/50 border border-emerald-100/50 px-4 py-3 rounded-xl w-full">
              <div className="h-8 w-8 bg-emerald-100 rounded-full flex items-center justify-center shrink-0 shadow-sm shadow-emerald-200">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <span className="font-bold text-base block">Build Successful!</span>
                <span className="text-xs text-emerald-700">Your application package is compiled and ready for distribution.</span>
              </div>
            </div>
          )}
          
          {buildState === 'error' && (
            <div className="flex items-center gap-3 text-red-600 bg-red-50/50 border border-red-100/50 px-4 py-3 rounded-xl w-full">
              <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center shrink-0 shadow-sm shadow-red-200">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <span className="font-bold text-base block">Build Failed</span>
                <span className="text-xs text-red-700">Check the terminal log below to locate compilation errors.</span>
              </div>
            </div>
          )}
          
          {buildState === 'idle' && (
            <div className="text-sm text-slate-400 italic flex items-center gap-2">
              <div className="h-2 w-2 bg-slate-300 rounded-full animate-ping"></div>
              <span>Waiting to start build pipeline...</span>
            </div>
          )}
        </div>

        {/* Terminal Logs */}
        <div className="flex-1 bg-[#090d16] border-y border-slate-950 p-5 overflow-y-auto font-mono text-[11px] leading-relaxed min-h-[180px] max-h-[400px] flex flex-col gap-1.5 shadow-inner">
          {logs.map((log, i) => {
            const parsed = parseLog(log);
            const isError = log.toLowerCase().includes('error') || log.toLowerCase().includes('failed');
            const isSuccess = log.includes('✓');
            const isWarning = log.toLowerCase().includes('warning');
            
            let textColor = 'text-slate-300';
            if (isError) textColor = 'text-red-400 font-semibold';
            else if (isSuccess) textColor = 'text-emerald-400 font-semibold';
            else if (isWarning) textColor = 'text-amber-400 font-medium';

            return (
              <div key={i} className="whitespace-pre-wrap flex items-start">
                {parsed.timestamp && (
                  <span className="text-slate-600 mr-2 select-none shrink-0 font-medium">{parsed.timestamp}</span>
                )}
                <span className={`${textColor} flex-1`}>{parsed.message}</span>
              </div>
            );
          })}
          {buildState === 'building' && (
            <div className="text-indigo-400/50 mt-1 animate-pulse select-none">▋</div>
          )}
          <div ref={logsEndRef} />
        </div>

        {/* Footer Actions */}
        <div 
          style={{
            padding: '28px 24px',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            alignItems: 'center',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            flexShrink: 0
          }}
        >
          {buildState === 'idle' && (
            <button 
              onClick={onClose}
              style={{
                minWidth: '120px',
                padding: '14px 28px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '14px',
                fontWeight: 800,
                fontSize: '15px',
                transition: 'all 0.2s',
                border: '1px solid #cbd5e1',
                backgroundColor: '#f8fafc',
                color: '#334155',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f1f5f9';
                e.currentTarget.style.color = '#0f172a';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.color = '#334155';
              }}
            >
              Cancel
            </button>
          )}
          
          {buildState === 'success' && (
            <>
              <button 
                onClick={onClose}
                style={{
                  minWidth: '120px',
                  padding: '14px 28px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '14px',
                  fontWeight: 800,
                  fontSize: '15px',
                  transition: 'all 0.2s',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#f8fafc',
                  color: '#334155',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f1f5f9';
                  e.currentTarget.style.color = '#0f172a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                  e.currentTarget.style.color = '#334155';
                }}
              >
                Close
              </button>
              <button 
                onClick={() => { onOpenFile(); onClose(); }}
                style={{
                  minWidth: '150px',
                  padding: '14px 28px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  borderRadius: '14px',
                  fontWeight: 800,
                  fontSize: '15px',
                  transition: 'all 0.2s',
                  border: 'none',
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(5, 150, 105, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#047857';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(5, 150, 105, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#059669';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(5, 150, 105, 0.2)';
                }}
              >
                <FolderOpen className="h-5 w-5" />
                <span>Get APK</span>
              </button>
            </>
          )}

          {buildState === 'error' && (
            <>
              <button 
                onClick={onClose}
                style={{
                  minWidth: '120px',
                  padding: '14px 28px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '14px',
                  fontWeight: 800,
                  fontSize: '15px',
                  transition: 'all 0.2s',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#f8fafc',
                  color: '#334155',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f1f5f9';
                  e.currentTarget.style.color = '#0f172a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                  e.currentTarget.style.color = '#334155';
                }}
              >
                Close
              </button>
              <button 
                onClick={onRetry}
                style={{
                  minWidth: '150px',
                  padding: '14px 28px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  borderRadius: '14px',
                  fontWeight: 800,
                  fontSize: '15px',
                  transition: 'all 0.2s',
                  border: 'none',
                  backgroundColor: '#4f46e5',
                  color: '#ffffff',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#4338ca';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(79, 70, 229, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#4f46e5';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(79, 70, 229, 0.2)';
                }}
              >
                <RefreshCw className="h-5 w-5" />
                <span>Try Again</span>
              </button>
            </>
          )}

          {buildState === 'building' && (
            <button 
              disabled
              style={{
                minWidth: '130px',
                padding: '10px 20px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '13px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#f1f5f9',
                color: '#94a3b8',
                cursor: 'not-allowed'
              }}
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Building...</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
