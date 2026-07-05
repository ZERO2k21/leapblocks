/**
 * ClassifierLayout — Wraps all classifier screens. (Pure Tailwind)
 */
import React from 'react';
import NeuraHeader from './NeuraHeader';
import type { ClassifierLayoutProps } from '../types';

export default function ClassifierLayout({
  project,
  onBack,
  children,
}: ClassifierLayoutProps): React.JSX.Element {
  return (
    <div className="flex flex-col h-screen bg-[#f0f2f7]">
      <NeuraHeader
        onBack={onBack}
        showProjectInput={true}
        projectName={project?.name}
        onProjectNameChange={(name: string) => console.log('Project name:', name)}
        onSave={() => console.log('Save:', project?.name)}
      />

      {/* Sub-header */}
      <div className="flex items-center justify-between px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-700 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">🧠</span>
            <div>
              <div className="text-white text-sm font-bold leading-tight">{project?.name || 'Untitled Project'}</div>
              <div className="text-white/60 text-[11px] font-medium">{project?.type || 'ML Project'}</div>
            </div>
          </div>
          <div className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
            project?.status === 'Trained'
              ? 'bg-green-400/20 text-green-200'
              : 'bg-white/15 text-white/60'
          }`}>
            {project?.status || 'Untrained'}
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-white/70 hover:text-white text-xs font-medium rounded-lg hover:bg-white/10 transition-colors">
            <span>📤</span> Export Model
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-white/70 hover:text-white text-xs font-medium rounded-lg hover:bg-white/10 transition-colors">
            <span>⚙️</span> Settings
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}
