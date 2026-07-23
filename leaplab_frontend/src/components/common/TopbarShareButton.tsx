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
                    className={`pr-4 mr-2 ${className}`}
                    style={style}
                    onClick={handleClick}
                    disabled={loading}
                >
                    {loading ? (
                        <span
                            className="inline-block rounded-full border-2 border-current border-t-transparent animate-spin"
                            style={{ width: size, height: size }}
                        />
                    ) : (
                        <Share2 size={size} strokeWidth={strokeWidth} />
                    )}
                </button>
            )}

            {showSaveConfirm && (
                <div
                    className="fixed inset-0 bg-[rgba(15,23,42,0.3)] backdrop-blur-[4px] flex items-center justify-center z-[10000]"
                    onClick={() => setShowSaveConfirm(false)}
                >
                    <div
                        className="bg-white rounded-2xl py-7 px-8 max-w-[400px] w-[90%] shadow-[0_20px_60px_rgba(15,23,42,0.15)] border border-[#e2e8f0]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-[#1e293b] m-0 mb-2 text-lg font-bold">
                            Save Project First
                        </h3>
                        <p className="text-[#64748b] m-0 mb-6 text-sm leading-relaxed font-medium">
                            You need to save your project to the cloud before sharing.
                            {projectName ? ` "${projectName}"` : ''} Save now?
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowSaveConfirm(false)}
                                className="py-2 px-5 rounded-lg border border-[#cbd5e1] bg-white text-[#475569] cursor-pointer text-sm font-bold transition-all duration-200 hover:bg-[#f8fafc] hover:text-[#0f172a]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveAndShare}
                                disabled={loading}
                                className={`py-2 px-5 rounded-lg border-none bg-gradient-to-br from-[#6366f1] to-[#4f46e5] text-white cursor-pointer text-sm font-bold shadow-[0_4px_12px_rgba(79,70,229,0.2)] transition-all duration-200 hover:from-[#4f46e5] hover:to-[#4338ca] hover:shadow-[0_6px_16px_rgba(79,70,229,0.3)] ${loading ? 'opacity-70' : ''}`}
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
