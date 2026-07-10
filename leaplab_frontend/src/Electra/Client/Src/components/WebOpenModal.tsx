import React from 'react';
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
    <div className="fixed inset-0 flex items-center justify-center z-[2000] bg-black/70 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]" onClick={onClose}>
      <div className="flex flex-col w-[500px] max-h-[80vh] animate-[modalScale_0.2s_cubic-bezier(0.34,1.56,0.64,1)] bg-[var(--lp-dark-surface)] border border-[var(--lp-accent-primary)] rounded-[var(--lp-radius)] shadow-[0_0_40px_rgba(34,211,238,0.2),var(--lp-shadow-lg)]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b border-[var(--lp-border)]">
          <h3 className="m-0 text-[18px] uppercase tracking-[1px] text-[var(--lp-accent-primary)]">Recent Projects</h3>
          <button className="bg-transparent border-none text-[24px] cursor-pointer text-[var(--lp-zinc-400)]" onClick={onClose}>×</button>
        </div>
        <div className="flex-1 overflow-y-auto p-2.5">
          {recentProjects.length === 0 ? (
            <div className="p-10 text-center text-[#64748b]">
              No saved projects found in browser storage.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {recentProjects.map(p => (
                <div key={p.id} className="flex justify-between items-center p-[15px] cursor-pointer border border-transparent rounded-[var(--lp-radius-sm)] transition-all duration-200 hover:translate-x-1 bg-[var(--lp-zinc-800)]" onClick={() => loadWebProject(p)}>
                  <div>
                    <div className="font-semibold text-white mb-1">{p.name}</div>
                    <div className="text-[11px] text-[var(--lp-zinc-400)]">Last saved: {new Date(p.updatedAt).toLocaleString()}</div>
                  </div>
                  <div className="font-mono text-[10px] opacity-60 text-[var(--lp-accent-primary)]">{p.id.slice(0, 8)}...</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
