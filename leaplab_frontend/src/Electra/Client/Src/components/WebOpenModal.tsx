import React from 'react';
import { X, FolderOpen, FileCode } from 'lucide-react';
import * as ProjectService from '../services/ProjectService';

interface WebOpenModalProps {
  isOpen: boolean;
  onClose: () => void;
  recentProjects: ProjectService.LeapProject[];
  loadWebProject: (project: ProjectService.LeapProject) => void;
}

export const WebOpenModal: React.FC<WebOpenModalProps> = ({
  isOpen,
  onClose,
  recentProjects,
  loadWebProject,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[2000] bg-black/75 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]" onClick={onClose}>
      <div 
        className="flex flex-col w-full max-w-[500px] max-h-[80vh] animate-[modalScale_0.2s_cubic-bezier(0.34,1.56,0.64,1)] bg-[#0d0e12] border border-zinc-800 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_80px_rgba(34,211,238,0.05)] overflow-hidden" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-zinc-800/80 bg-zinc-900/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/15">
              <FolderOpen className="h-4.5 w-4.5 text-cyan-400" />
            </div>
            <h3 className="m-0 text-[16px] font-extrabold text-white tracking-wide uppercase">Recent Projects</h3>
          </div>
          <button 
            className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer text-zinc-400 hover:text-white hover:bg-zinc-800/50 border-none bg-transparent transition-all" 
            onClick={onClose}
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {recentProjects.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center border border-zinc-800/80 text-zinc-500 mb-4">
                <FileCode size={20} />
              </div>
              <p className="text-[13.5px] font-semibold text-zinc-400 m-0 mb-1">No Projects Found</p>
              <p className="text-[11.5px] text-zinc-500 m-0 max-w-[240px] leading-relaxed">No saved projects found in browser storage.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {recentProjects.map(p => (
                <div 
                  key={p.id} 
                  className="flex justify-between items-center p-4 cursor-pointer border border-zinc-800 hover:border-cyan-500/30 rounded-2xl transition-all duration-200 hover:translate-x-1 bg-zinc-900/30 hover:bg-zinc-800/40" 
                  onClick={() => loadWebProject(p)}
                >
                  <div className="min-w-0 pr-4">
                    <div className="font-extrabold text-white text-[13.5px] mb-1.5 truncate" title={p.name}>{p.name}</div>
                    <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Last saved: {new Date(p.updatedAt).toLocaleString()}</div>
                  </div>
                  <div className="font-mono text-[9px] font-bold text-cyan-400 bg-cyan-950/40 px-2 py-1 rounded-md border border-cyan-500/10 shrink-0">
                    ID: {p.id.slice(0, 8)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
