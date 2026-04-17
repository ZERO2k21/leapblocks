import React from 'react';
import { useNavigate } from 'react-router-dom';
import NeuraHeader from './NeuraHeader';

/**
 * Sub-header bar + project context
 * Wraps all classifier screens with consistent layout
 */
function ClassifierLayout({ project, children }) {
    const navigate = useNavigate();

    return (
        <div className="classifier-layout">
            <NeuraHeader />

            <div className="classifier-subheader">
                <button className="btn-back" onClick={() => navigate('/projects')}>
                    ← Back to Projects
                </button>

                <div className="project-info">
                    <h2>{project.name}</h2>
                    <span className="project-type-badge">{project.type}</span>
                </div>

                <div className="subheader-actions">
                    <button className="btn-save">💾 Save</button>
                    <button className="btn-export">📤 Export</button>
                </div>
            </div>

            <div className="classifier-content">
                {children}
            </div>
        </div>
    );
}

export default ClassifierLayout;
