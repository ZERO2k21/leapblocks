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
                    className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center z-[9999]"
                    onClick={() => setShowSaveConfirm(false)}
                >
                    <div
                        className="bg-white rounded-2xl py-7 px-8 max-w-sm w-[90%] shadow-2xl border border-slate-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-slate-800 m-0 mb-2 text-lg font-bold">
                            Save Project First
                        </h3>
                        <p className="text-slate-500 m-0 mb-6 text-sm leading-relaxed font-medium">
                            You need to save your project to the cloud before sharing.
                            {projectName ? ` "${projectName}"` : ''} Save now?
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                type="button"
                                onClick={() => setShowSaveConfirm(false)}
                                className="py-2 px-5 rounded-lg border border-slate-300 bg-white text-slate-600 cursor-pointer text-sm font-bold transition-all duration-200 hover:bg-slate-50 hover:text-slate-900"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveAndShare}
                                disabled={loading}
                                className={`py-2 px-5 rounded-lg border-0 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white cursor-pointer text-sm font-bold shadow-md shadow-indigo-500/20 transition-all duration-200 hover:from-indigo-600 hover:to-indigo-700 ${loading ? 'opacity-70' : ''}`}
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
