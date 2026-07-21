/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */
import React, { useState } from 'react';
import { Share2 } from 'lucide-react';
import { getCloudProject, CloudProject } from '../../services/cloudProjectApi';
import { useCloudProjectStore } from '../../store/cloudProjectStore';
import ShareProjectModal from '../my-projects/ShareProjectModal';

interface TopbarShareButtonProps {
    className?: string;
    style?: React.CSSProperties;
    size?: number;
    strokeWidth?: number;
    onSave?: () => Promise<void> | void;
    projectName?: string;
    children?: (props: { onClick: () => void; loading: boolean }) => React.ReactNode;
}

export default function TopbarShareButton({
    className = '',
    style,
    size = 16,
    strokeWidth = 2.2,
    onSave,
    projectName,
    children,
}: TopbarShareButtonProps) {
    const [shareProject, setShareProject] = useState<CloudProject | null>(null);
    const [loading, setLoading] = useState(false);
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);
    const activeProjectId = useCloudProjectStore((s) => s.activeProjectId);

    const fetchAndOpen = async () => {
        const id = useCloudProjectStore.getState().activeProjectId;
        if (!id) return;
        setLoading(true);
        try {
            const project = await getCloudProject(id);
            setShareProject(project);
        } catch (err: any) {
            console.error('[TopbarShareButton] Failed to load project:', err);
            alert(err?.message || 'Failed to load project for sharing.');
        } finally {
            setLoading(false);
        }
    };

    const handleClick = async () => {
        const currentId = useCloudProjectStore.getState().activeProjectId;
        if (!currentId) {
            setShowSaveConfirm(true);
            return;
        }
        await fetchAndOpen();
    };

    const handleSaveAndShare = async () => {
        setShowSaveConfirm(false);
        if (!onSave) return;
        setLoading(true);
        try {
            await onSave();
            await new Promise((r) => setTimeout(r, 500));
            await fetchAndOpen();
        } catch (err: any) {
            console.error('[TopbarShareButton] Save failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = (updated: CloudProject) => {
        setShareProject(updated);
    };

    return (
        <>
            {children ? (
                children({ onClick: handleClick, loading })
            ) : (
                <button
                    title="Share project"
                    className={className}
                    style={{ paddingRight: '16px', marginRight: '8px', ...style }}
                    onClick={handleClick}
                    disabled={loading}
                >
                    {loading ? (
                        <span
                            style={{
                                width: size,
                                height: size,
                                border: '2px solid currentColor',
                                borderTopColor: 'transparent',
                                borderRadius: '50%',
                                animation: 'spin 0.6s linear infinite',
                                display: 'inline-block',
                            }}
                        />
                    ) : (
                        <Share2 size={size} strokeWidth={strokeWidth} />
                    )}
                </button>
            )}

            {showSaveConfirm && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(15, 23, 42, 0.3)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10000,
                    }}
                    onClick={() => setShowSaveConfirm(false)}
                >
                    <div
                        style={{
                            background: '#ffffff',
                            borderRadius: 16,
                            padding: '28px 32px',
                            maxWidth: 400,
                            width: '90%',
                            boxShadow: '0 20px 60px rgba(15, 23, 42, 0.15)',
                            border: '1px solid #e2e8f0',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ color: '#1e293b', margin: '0 0 8px', fontSize: 18, fontWeight: 700 }}>
                            Save Project First
                        </h3>
                        <p style={{ color: '#64748b', margin: '0 0 24px', fontSize: 14, lineHeight: 1.5, fontWeight: 500 }}>
                            You need to save your project to the cloud before sharing.
                            {projectName ? ` "${projectName}"` : ''} Save now?
                        </p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setShowSaveConfirm(false)}
                                style={{
                                    padding: '8px 20px',
                                    borderRadius: 8,
                                    border: '1px solid #cbd5e1',
                                    background: '#ffffff',
                                    color: '#475569',
                                    cursor: 'pointer',
                                    fontSize: 14,
                                    fontWeight: 700,
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#f8fafc';
                                    e.currentTarget.style.color = '#0f172a';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#ffffff';
                                    e.currentTarget.style.color = '#475569';
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveAndShare}
                                disabled={loading}
                                style={{
                                    padding: '8px 20px',
                                    borderRadius: 8,
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    fontSize: 14,
                                    fontWeight: 700,
                                    opacity: loading ? 0.7 : 1,
                                    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    if (!loading) {
                                        e.currentTarget.style.background = 'linear-gradient(135deg, #4f46e5, #4338ca)';
                                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(79, 70, 229, 0.3)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!loading) {
                                        e.currentTarget.style.background = 'linear-gradient(135deg, #6366f1, #4f46e5)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(79, 70, 229, 0.2)';
                                    }
                                }}
                            >
                                {loading ? 'Saving...' : 'Save & Share'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {shareProject && (
                <ShareProjectModal
                    project={shareProject}
                    onClose={() => setShareProject(null)}
                    onUpdate={handleUpdate}
                />
            )}
        </>
    );
}
