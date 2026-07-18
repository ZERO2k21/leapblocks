/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */
import React, { useState } from 'react';
import { shareCloudProject, revokeCloudProjectShare, renameCloudProject, getShareUrl, CloudProject } from '../../services/cloudProjectApi';

interface ShareProjectModalProps {
    project: CloudProject;
    onClose: () => void;
    onUpdate: (updatedProject: CloudProject) => void;
}

export default function ShareProjectModal({ project, onClose, onUpdate }: ShareProjectModalProps) {
    const [permission, setPermission] = useState<'viewer' | 'editor'>(project.sharePermission || 'viewer');
    const [editName, setEditName] = useState(project.name);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    React.useEffect(() => {
        if (project.sharePermission) {
            setPermission(project.sharePermission);
        }
    }, [project.sharePermission]);

    const isShared = project.isShared === 1 && project.shareId;
    const shareUrl = isShared ? getShareUrl(project.shareId as string) : '';
    const nameChanged = editName.trim() !== '' && editName.trim() !== project.name;

    const handleRename = async () => {
        if (!nameChanged) return;
        setLoading(true);
        try {
            const updated = await renameCloudProject(project.id, editName.trim());
            onUpdate(updated);
        } catch (err: any) {
            console.error('[ShareProjectModal] Failed to rename project:', err);
            alert(err?.message || 'Failed to rename project');
        } finally {
            setLoading(false);
        }
    };

    const handleShare = async () => {
        setLoading(true);
        try {
            if (nameChanged) {
                const renamed = await renameCloudProject(project.id, editName.trim());
                onUpdate(renamed);
                const updated = await shareCloudProject(renamed.id, permission);
                onUpdate(updated);
            } else {
                const updated = await shareCloudProject(project.id, permission);
                onUpdate(updated);
            }
        } catch (err: any) {
            console.error('[ShareProjectModal] Failed to share project:', err);
            alert(err?.message || 'Failed to share project');
        } finally {
            setLoading(false);
        }
    };

    const handleRevoke = async () => {
        if (!window.confirm('Revoke sharing for this project?')) return;
        setLoading(true);
        try {
            const updated = await revokeCloudProjectShare(project.id);
            onUpdate(updated);
        } catch (err: any) {
            console.error('[ShareProjectModal] Failed to revoke share:', err);
            alert(err?.message || 'Failed to revoke share');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            const input = document.createElement('input');
            input.value = shareUrl;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-[rgba(0,0,0,0.6)] backdrop-blur-[6px] flex items-center justify-center p-4" onClick={onClose}>
            <div className="w-full max-w-[440px] bg-[#0f172a] rounded-2xl overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] animate-[modalScaleIn_0.3s_cubic-bezier(0.34,1.56,0.64,1)_forwards]" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 pt-6 pb-0">
                    <h3 className="text-xl font-extrabold text-white m-0 tracking-[-0.01em]">Share Project</h3>
                    <button className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white text-lg leading-none cursor-pointer transition-colors" onClick={onClose}>×</button>
                </div>

                <div className="px-6 py-5 space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
                            Project Name
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onBlur={handleRename}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); }}
                                disabled={loading}
                                className="flex-1 px-3 py-2 rounded-lg border border-white/12 bg-white/6 text-white text-sm font-medium outline-none focus:border-white/25"
                            />
                            {nameChanged && (
                                <button
                                    onClick={handleRename}
                                    disabled={loading}
                                    className="px-3.5 py-2 rounded-lg border-none bg-indigo-500/20 text-indigo-300 cursor-pointer text-[13px] font-semibold whitespace-nowrap hover:bg-indigo-500/30 transition-colors"
                                >
                                    {loading ? '...' : 'Rename'}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="flex gap-3 p-3 rounded-lg bg-white/5 border border-white/8 cursor-pointer hover:bg-white/8 transition-colors">
                            <input
                                type="radio"
                                name="permission"
                                value="viewer"
                                checked={permission === 'viewer'}
                                onChange={() => setPermission('viewer')}
                                disabled={loading}
                                className="mt-0.5 scale-110"
                                style={{ accentColor: '#4f46e5' }}
                            />
                            <div>
                                <span className="block text-sm font-semibold text-white">Viewer</span>
                                <span className="block text-xs text-white/50 mt-0.5">Anyone with the link can view and load the project.</span>
                            </div>
                        </label>
                        <label className="flex gap-3 p-3 rounded-lg bg-white/5 border border-white/8 cursor-pointer hover:bg-white/8 transition-colors">
                            <input
                                type="radio"
                                name="permission"
                                value="editor"
                                checked={permission === 'editor'}
                                onChange={() => setPermission('editor')}
                                disabled={loading}
                                className="mt-0.5 scale-110"
                                style={{ accentColor: '#4f46e5' }}
                            />
                            <div>
                                <span className="block text-sm font-semibold text-white">Editor</span>
                                <span className="block text-xs text-white/50 mt-0.5">Anyone with the link can load and save changes back to this project.</span>
                            </div>
                        </label>
                    </div>

                    {isShared && (
                        <div>
                            <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Share link</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={shareUrl}
                                    className="flex-1 px-3 py-2 rounded-lg border border-white/12 bg-white/6 text-white text-sm font-mono outline-none"
                                    onFocus={(e) => e.target.select()}
                                />
                                <button className="px-4 py-2 rounded-lg border-none bg-indigo-500 text-white text-sm font-semibold cursor-pointer hover:bg-indigo-600 transition-colors" onClick={handleCopy} disabled={copied}>
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-end gap-3 px-6 pb-6 pt-2">
                    {isShared ? (
                        <>
                            <button className="px-4 py-2.5 rounded-lg border border-red-500/30 bg-transparent text-red-400 text-sm font-semibold cursor-pointer hover:bg-red-500/10 transition-colors" onClick={handleRevoke} disabled={loading}>
                                {loading ? '...' : 'Revoke Share'}
                            </button>
                            <button className="px-4 py-2.5 rounded-lg border-none bg-indigo-500 text-white text-sm font-semibold cursor-pointer hover:bg-indigo-600 transition-colors" onClick={handleShare} disabled={loading}>
                                {loading ? 'Updating...' : 'Update Permission'}
                            </button>
                        </>
                    ) : (
                        <button className="px-4 py-2.5 rounded-lg border-none bg-indigo-500 text-white text-sm font-semibold cursor-pointer hover:bg-indigo-600 transition-colors" onClick={handleShare} disabled={loading}>
                            {loading ? 'Generating...' : 'Generate Share Link'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
