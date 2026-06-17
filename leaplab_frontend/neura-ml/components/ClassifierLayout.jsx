/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from 'react';
import NeuraHeader from './NeuraHeader';

/**
 * Sub-header bar + project context
 * Wraps all classifier screens with consistent layout
 */
function ClassifierLayout({ project, onBack, children }) {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f9fafb', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            <NeuraHeader
                onBack={onBack}
                showProjectInput={true}
                projectName={project?.name}
                onProjectNameChange={(newName) => {
                    // Handle project name change if needed
                    console.log('Project name changed to:', newName);
                }}
                onSave={() => {
                    // Handle save
                    console.log('Save project:', project?.name);
                }}
            />

            {/* Sub-header with project info and actions */}
            <div style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '12px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '8px 16px',
                        background: 'rgba(255, 255, 255, 0.15)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                        <span style={{ fontSize: '20px' }}>🧠</span>
                        <div>
                            <div style={{ color: 'white', fontSize: '14px', fontWeight: 700 }}>{project?.name || 'Untitled Project'}</div>
                            <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '11px', fontWeight: 500 }}>{project?.type || 'ML Project'}</div>
                        </div>
                    </div>

                    <div style={{
                        padding: '6px 12px',
                        background: project?.status === 'Trained' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(251, 191, 36, 0.2)',
                        border: `1px solid ${project?.status === 'Trained' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(251, 191, 36, 0.4)'}`,
                        borderRadius: '20px',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 600
                    }}>
                        {project?.status || 'Untrained'}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={{
                        padding: '8px 16px',
                        background: 'rgba(255, 255, 255, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s'
                    }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                    >
                        <span>📤</span> Export Model
                    </button>
                    <button style={{
                        padding: '8px 16px',
                        background: 'rgba(255, 255, 255, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s'
                    }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                    >
                        <span>⚙️</span> Settings
                    </button>
                </div>
            </div>

            {/* Main content area */}
            <div style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
                {children}
            </div>
        </div>
    );
}

export default ClassifierLayout;
