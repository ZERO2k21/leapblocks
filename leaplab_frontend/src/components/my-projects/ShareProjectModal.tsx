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
        <div className="share-modal-overlay" onClick={onClose}>
            <div className="share-modal" onClick={(e) => e.stopPropagation()}>
                <div className="share-modal-header">
                    <h3>Share Project</h3>
                    <button className="share-modal-close" onClick={onClose}>×</button>
                </div>

                <div className="share-modal-body">
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Project Name
                        </label>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onBlur={handleRename}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); }}
                                disabled={loading}
                                style={{
                                    flex: 1,
                                    padding: '8px 12px',
                                    borderRadius: 8,
                                    border: '1px solid rgba(255,255,255,0.12)',
                                    background: 'rgba(255,255,255,0.06)',
                                    color: '#fff',
                                    fontSize: 14,
                                    fontWeight: 500,
                                    outline: 'none',
                                }}
                            />
                            {nameChanged && (
                                <button
                                    onClick={handleRename}
                                    disabled={loading}
                                    style={{
                                        padding: '8px 14px',
                                        borderRadius: 8,
                                        border: 'none',
                                        background: 'rgba(99,102,241,0.2)',
                                        color: '#818cf8',
                                        cursor: 'pointer',
                                        fontSize: 13,
                                        fontWeight: 600,
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {loading ? '...' : 'Rename'}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="share-permission-group">
                        <label className="share-permission-label">
                            <input
                                type="radio"
                                name="permission"
                                value="viewer"
                                checked={permission === 'viewer'}
                                onChange={() => setPermission('viewer')}
                                disabled={loading}
                            />
                            <span className="share-permission-title">Viewer</span>
                            <span className="share-permission-desc">Anyone with the link can view and load the project.</span>
                        </label>
                        <label className="share-permission-label">
                            <input
                                type="radio"
                                name="permission"
                                value="editor"
                                checked={permission === 'editor'}
                                onChange={() => setPermission('editor')}
                                disabled={loading}
                            />
                            <span className="share-permission-title">Editor</span>
                            <span className="share-permission-desc">Anyone with the link can load and save changes back to this project.</span>
                        </label>
                    </div>

                    {isShared && (
                        <div className="share-link-box">
                            <label className="share-link-label">Share link</label>
                            <div className="share-link-row">
                                <input
                                    type="text"
                                    readOnly
                                    value={shareUrl}
                                    className="share-link-input"
                                    onFocus={(e) => e.target.select()}
                                />
                                <button className="share-copy-btn" onClick={handleCopy} disabled={copied}>
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="share-modal-footer">
                    {isShared ? (
                        <>
                            <button className="share-revoke-btn" onClick={handleRevoke} disabled={loading}>
                                {loading ? '...' : 'Revoke Share'}
                            </button>
                            <button className="share-primary-btn" onClick={handleShare} disabled={loading}>
                                {loading ? 'Updating...' : 'Update Permission'}
                            </button>
                        </>
                    ) : (
                        <button className="share-primary-btn" onClick={handleShare} disabled={loading}>
                            {loading ? 'Generating...' : 'Generate Share Link'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
