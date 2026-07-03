/**
 * ClassifierLayout — Wraps all classifier screens.
 * Provides: NeuraHeader + sub-header (project info) + 3-panel content area.
 */
import React from 'react';
import NeuraHeader from './NeuraHeader';

export default function ClassifierLayout({ project, onBack, children }) {
    return (
        <div className="neura-app">
            <NeuraHeader
                onBack={onBack}
                showProjectInput={true}
                projectName={project?.name}
                onProjectNameChange={(name) => console.log('Project name:', name)}
                onSave={() => console.log('Save:', project?.name)}
            />

            {/* Sub-header */}
            <div className="neura-subheader">
                <div className="flex items-center gap-4">
                    <div className="neura-project-badge">
                        <span className="text-lg">🧠</span>
                        <div>
                            <div className="text-white text-sm font-bold leading-tight">{project?.name || 'Untitled Project'}</div>
                            <div className="text-white/60 text-[11px] font-medium">{project?.type || 'ML Project'}</div>
                        </div>
                    </div>
                    <div className={`neura-status-pill ${project?.status === 'Trained' ? 'trained' : 'untrained'}`}>
                        {project?.status || 'Untrained'}
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="neura-subheader-btn">
                        <span>📤</span> Export Model
                    </button>
                    <button className="neura-subheader-btn">
                        <span>⚙️</span> Settings
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 overflow-hidden">
                {children}
            </div>
        </div>
    );
}
