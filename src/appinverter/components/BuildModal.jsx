/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useEffect, useRef } from 'react';
import { Loader2, CheckCircle, XCircle, FolderOpen, RefreshCw, X } from 'lucide-react';

export default function BuildModal({ isOpen, onClose, buildState, logs, appName, packageName, onOpenFile, onRetry }) {
  const logsEndRef = useRef(null);

  useEffect(() => {
    // Auto-scroll logs to bottom
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Building APK</h2>
            <div className="flex items-center space-x-2 mt-1 text-sm text-gray-500">
              <span className="font-medium text-gray-700">{appName}</span>
              <span>•</span>
              <span className="font-mono text-xs">{packageName}</span>
            </div>
          </div>
          {buildState === 'idle' && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="h-6 w-6" />
            </button>
          )}
        </div>

        {/* Progress Indication */}
        <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center min-h-[5.5rem]">
          {buildState === 'building' && (
            <div className="flex items-center space-x-3 w-full">
               <Loader2 className="h-5 w-5 text-[#6c63ff] animate-spin shrink-0" />
               <div className="flex-1">
                 <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">Compiling with Gradle...</span>
                 </div>
                 <div className="w-full h-1.5 bg-purple-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#6c63ff] w-1/2 animate-[pulse_2s_ease-in-out_infinite] rounded-full relative overflow-hidden">
                       <div className="absolute inset-0 bg-white/20 animate-[pulse_1.5s_ease-in-out_infinite] translate-x-[-100%] shadow-[2px_0_10px_white]"></div>
                    </div>
                 </div>
               </div>
            </div>
          )}
          
          {buildState === 'success' && (
            <div className="flex items-center space-x-3 text-green-600">
               <CheckCircle className="h-6 w-6 shrink-0" />
               <span className="font-semibold text-lg">Build Successful!</span>
            </div>
          )}
          
          {buildState === 'error' && (
            <div className="flex items-center space-x-3 text-red-500">
               <XCircle className="h-6 w-6 shrink-0" />
               <span className="font-semibold text-lg">Build Failed</span>
            </div>
          )}
          
          {buildState === 'idle' && (
            <div className="text-sm text-gray-500 italic">
               Waiting to start...
            </div>
          )}
        </div>

        {/* Terminal Logs */}
        <div className="flex-1 bg-[#1e1e1e] p-4 overflow-y-auto font-mono text-xs leading-relaxed min-h-[300px] max-h-[400px]">
          {logs.map((log, i) => {
            const isError = log.toLowerCase().includes('error') || log.toLowerCase().includes('failed');
            const isSuccess = log.includes('✓');
            return (
              <div key={i} className={`whitespace-pre-wrap ${isError ? 'text-red-400' : isSuccess ? 'text-green-400 font-bold' : 'text-green-500/80 mb-1'}`}>
                <span className="text-gray-500 mr-2 opacity-50">[{new Date().toLocaleTimeString()}]</span>
                {log}
              </div>
            );
          })}
          {buildState === 'building' && (
             <div className="text-green-500/50 mt-2 animate-pulse">_</div>
          )}
          <div ref={logsEndRef} />
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3">
          {buildState === 'idle' && (
            <button 
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors"
            >
              Cancel
            </button>
          )}
          
          {buildState === 'success' && (
            <>
              <button 
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors"
              >
                Close
              </button>
              <button 
                onClick={() => { onOpenFile(); onClose(); }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors flex items-center space-x-2"
              >
                <FolderOpen className="h-4 w-4" />
                <span>Get APK</span>
              </button>
            </>
          )}

          {buildState === 'error' && (
            <>
              <button 
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors"
              >
                Close
              </button>
              <button 
                onClick={onRetry}
                className="px-4 py-2 bg-[#6c63ff] text-white rounded-lg hover:bg-[#5b54e5] font-medium transition-colors flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Try Again</span>
              </button>
            </>
          )}

          {buildState === 'building' && (
             <button 
              disabled
              className="px-4 py-2 border border-gray-200 text-gray-400 bg-gray-100 rounded-lg font-medium cursor-not-allowed"
            >
              Building...
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
