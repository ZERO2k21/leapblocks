/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */
import React, { useState } from 'react';
import { shareCloudProject, revokeCloudProjectShare, renameCloudProject, getShareUrl, CloudProject } from '../../services/cloudProjectApi';
import { Copy, Check, X } from 'lucide-react';

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
        <div 
            className="fixed inset-0 z-[9999] bg-slate-950/50 backdrop-blur-md flex items-center justify-center p-4" 
            onClick={onClose}
        >
            <div 
                className="w-full max-w-[440px] bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-modal-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 px-6 pb-4 border-b border-slate-100">
                    <h3 className="text-lg font-black text-slate-900 m-0 tracking-tight">Share Project</h3>
                    <button 
                        type="button"
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-transparent text-slate-400 border-0 cursor-pointer transition-all hover:bg-slate-100 hover:text-slate-700"
                        onClick={onClose}
                    >
                        <X size={16} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col gap-5">
                    {/* Project Name */}
                    <div className="flex flex-col gap-2">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                            Project Name
                        </label>
                        <div className="flex gap-2.5 w-full">
                            <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onBlur={handleRename}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); }}
                                disabled={loading}
                                className="flex-1 p-2.5 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-medium outline-none focus:border-indigo-600 focus:bg-white transition-all box-border"
                            />
                            {nameChanged && (
                                <button
                                    type="button"
                                    onClick={handleRename}
                                    disabled={loading}
                                    className="p-2.5 px-4.5 rounded-xl border-0 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 cursor-pointer text-xs font-semibold transition-all"
                                >
                                    {loading ? '...' : 'Rename'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Permission Radio Options */}
                    <div className="flex flex-col gap-3">
                        {/* Viewer Card */}
                        <label 
                            className={`flex gap-3.5 p-4 rounded-xl border cursor-pointer transition-all box-border ${
                                permission === 'viewer' ? 'border-indigo-600 bg-indigo-50/50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                            }`}
                        >
                            <input
                                type="radio"
                                name="permission"
                                value="viewer"
                                checked={permission === 'viewer'}
                                onChange={() => setPermission('viewer')}
                                disabled={loading}
                                className="mt-0.75 accent-indigo-600 w-4 h-4 cursor-pointer shrink-0"
                            />
                            <div className="flex flex-col gap-1">
                                <span className="text-sm font-semibold text-slate-900">Viewer</span>
                                <span className="text-xs text-slate-500 leading-relaxed">Anyone with the link can view and load the project.</span>
                            </div>
                        </label>

                        {/* Editor Card */}
                        <label 
                            className={`flex gap-3.5 p-4 rounded-xl border cursor-pointer transition-all box-border ${
                                permission === 'editor' ? 'border-indigo-600 bg-indigo-50/50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                            }`}
                        >
                            <input
                                type="radio"
                                name="permission"
                                value="editor"
                                checked={permission === 'editor'}
                                onChange={() => setPermission('editor')}
                                disabled={loading}
                                className="mt-0.75 accent-indigo-600 w-4 h-4 cursor-pointer shrink-0"
                            />
                            <div className="flex flex-col gap-1">
                                <span className="text-sm font-semibold text-slate-900">Editor</span>
                                <span className="text-xs text-slate-500 leading-relaxed">Anyone with the link can load and save changes back to this project.</span>
                            </div>
                        </label>
                    </div>

                    {/* Share Link */}
                    {isShared && (
                        <div className="flex flex-col gap-2">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                Share link
                            </label>
                            <div className="relative flex w-full">
                                <input
                                    type="text"
                                    readOnly
                                    value={shareUrl}
                                    className="w-full p-2.5 pr-12 pl-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-mono outline-none box-border"
                                    onFocus={(e) => e.target.select()}
                                />
                                <button 
                                    type="button"
                                    onClick={handleCopy} 
                                    disabled={copied}
                                    title={copied ? 'Copied!' : 'Copy Link'}
                                    className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg border-0 flex items-center justify-center cursor-pointer transition-all ${
                                        copied ? 'bg-emerald-600 text-white' : 'bg-slate-200/80 hover:bg-slate-300 text-slate-700'
                                    }`}
                                >
                                    {copied ? (
                                        <Check size={14} strokeWidth={2.5} />
                                    ) : (
                                        <Copy size={14} strokeWidth={2.5} />
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 p-4 px-6 pb-6 border-t border-slate-100 bg-slate-50/50">
                    {isShared ? (
                        <>
                            <button 
                                type="button"
                                onClick={handleRevoke} 
                                disabled={loading}
                                className="p-2.5 px-5 rounded-xl border border-red-200 bg-white text-red-600 hover:bg-red-50 text-xs font-semibold cursor-pointer transition-all"
                            >
                                {loading ? '...' : 'Revoke Share'}
                            </button>
                            <button 
                                type="button"
                                onClick={handleShare} 
                                disabled={loading}
                                className="p-2.5 px-5 rounded-xl border-0 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer transition-all shadow-md shadow-indigo-600/20"
                            >
                                {loading ? 'Updating...' : 'Update Permission'}
                            </button>
                        </>
                    ) : (
                        <button 
                            type="button"
                            onClick={handleShare} 
                            disabled={loading}
                            className="p-2.5 px-5 rounded-xl border-0 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer transition-all shadow-md shadow-indigo-600/20"
                        >
                            {loading ? 'Generating...' : 'Generate Share Link'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
