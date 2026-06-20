/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */
import React, { useState } from 'react';
import { shareCloudProject, revokeCloudProjectShare, getShareUrl, CloudProject } from '../../services/cloudProjectApi';

interface ShareProjectModalProps {
    project: CloudProject;
    onClose: () => void;
    onUpdate: (updatedProject: CloudProject) => void;
}

export default function ShareProjectModal({ project, onClose, onUpdate }: ShareProjectModalProps) {
    const [permission, setPermission] = useState<'viewer' | 'editor'>(project.sharePermission || 'viewer');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    React.useEffect(() => {
        if (project.sharePermission) {
            setPermission(project.sharePermission);
        }
    }, [project.sharePermission]);

    const isShared = project.isShared === 1 && project.shareId;
    const shareUrl = isShared ? getShareUrl(project.shareId as string) : '';

    const handleShare = async () => {
        setLoading(true);
        try {
            const updated = await shareCloudProject(project.id, permission);
            onUpdate(updated);
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
            // Fallback for older browsers
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
                    <p className="share-project-name">{project.name}</p>

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
