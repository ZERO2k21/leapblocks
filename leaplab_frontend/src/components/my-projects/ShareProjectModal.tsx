/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */
import React, { useState } from 'react';
import { shareCloudProject, revokeCloudProjectShare, renameCloudProject, getShareUrl, CloudProject } from '../../services/cloudProjectApi';
import { Copy, Check } from 'lucide-react';

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
            className="fixed inset-0 z-[9999] bg-[rgba(0,0,0,0.6)] backdrop-blur-[6px]" 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
            onClick={onClose}
        >
            <div 
                style={{ 
                    width: '100%', 
                    maxWidth: '440px', 
                    backgroundColor: '#0f172a', 
                    border: '1px solid rgba(255, 255, 255, 0.08)', 
                    borderRadius: '20px', 
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    animation: 'modalScaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
                }} 
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'between', padding: '24px 24px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', margin: 0, tracking: '-0.01em' }}>Share Project</h3>
                    <button 
                        style={{ 
                            width: '32px', 
                            height: '32px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            borderRadius: '50%', 
                            backgroundColor: 'rgba(255, 255, 255, 0.06)', 
                            color: 'rgba(255, 255, 255, 0.6)', 
                            border: 'none', 
                            cursor: 'pointer', 
                            fontSize: '18px',
                            transition: 'all 0.2s' 
                        }} 
                        onClick={onClose}
                    >
                        &times;
                    </button>
                </div>
 
                {/* Content */}
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Project Name */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.45)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                            Project Name
                        </label>
                        <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                            <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onBlur={handleRename}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); }}
                                disabled={loading}
                                style={{
                                    flex: 1,
                                    padding: '10px 14px',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    color: '#ffffff',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                            {nameChanged && (
                                <button
                                    onClick={handleRename}
                                    disabled={loading}
                                    style={{
                                        padding: '10px 18px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        backgroundColor: 'rgba(99, 102, 241, 0.15)',
                                        color: '#a5b4fc',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {loading ? '...' : 'Rename'}
                                </button>
                            )}
                        </div>
                    </div>
 
                    {/* Permission Radio Options */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Viewer Card */}
                        <label 
                            style={{ 
                                display: 'flex', 
                                gap: '14px', 
                                padding: '16px', 
                                borderRadius: '12px', 
                                backgroundColor: 'rgba(255, 255, 255, 0.03)', 
                                border: permission === 'viewer' ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.06)', 
                                cursor: 'pointer', 
                                transition: 'all 0.2s',
                                boxSizing: 'border-box'
                            }}
                        >
                            <input
                                type="radio"
                                name="permission"
                                value="viewer"
                                checked={permission === 'viewer'}
                                onChange={() => setPermission('viewer')}
                                disabled={loading}
                                style={{ 
                                    marginTop: '3px', 
                                    accentColor: '#6366f1', 
                                    width: '16px', 
                                    height: '16px', 
                                    cursor: 'pointer', 
                                    flexShrink: 0 
                                }}
                            />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>Viewer</span>
                                <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.45)', lineHeight: 1.4 }}>Anyone with the link can view and load the project.</span>
                            </div>
                        </label>
 
                        {/* Editor Card */}
                        <label 
                            style={{ 
                                display: 'flex', 
                                gap: '14px', 
                                padding: '16px', 
                                borderRadius: '12px', 
                                backgroundColor: 'rgba(255, 255, 255, 0.03)', 
                                border: permission === 'editor' ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.06)', 
                                cursor: 'pointer', 
                                transition: 'all 0.2s',
                                boxSizing: 'border-box'
                            }}
                        >
                            <input
                                type="radio"
                                name="permission"
                                value="editor"
                                checked={permission === 'editor'}
                                onChange={() => setPermission('editor')}
                                disabled={loading}
                                style={{ 
                                    marginTop: '3px', 
                                    accentColor: '#6366f1', 
                                    width: '16px', 
                                    height: '16px', 
                                    cursor: 'pointer', 
                                    flexShrink: 0 
                                }}
                            />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>Editor</span>
                                <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.45)', lineHeight: 1.4 }}>Anyone with the link can load and save changes back to this project.</span>
                            </div>
                        </label>
                    </div>
 
                    {/* Share Link */}
                    {isShared && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.45)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                                Share link
                            </label>
                            <div style={{ position: 'relative', display: 'flex', width: '100%' }}>
                                <input
                                    type="text"
                                    readOnly
                                    value={shareUrl}
                                    style={{
                                        width: '100%',
                                        padding: '10px 48px 10px 14px',
                                        borderRadius: '10px',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        color: '#ffffff',
                                        fontSize: '13px',
                                        fontFamily: 'monospace',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                    onFocus={(e) => e.target.select()}
                                />
                                <button 
                                    onClick={handleCopy} 
                                    disabled={copied}
                                    title={copied ? 'Copied!' : 'Copy Link'}
                                    style={{
                                        position: 'absolute',
                                        right: '8px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        backgroundColor: copied ? '#10b981' : 'rgba(255, 255, 255, 0.06)',
                                        color: copied ? '#ffffff' : 'rgba(255, 255, 255, 0.8)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'end', gap: '12px', padding: '16px 24px 24px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    {isShared ? (
                        <>
                            <button 
                                onClick={handleRevoke} 
                                disabled={loading}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    backgroundColor: 'transparent',
                                    color: '#f87171',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {loading ? '...' : 'Revoke Share'}
                            </button>
                            <button 
                                onClick={handleShare} 
                                disabled={loading}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    backgroundColor: '#6366f1',
                                    color: '#ffffff',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
                                }}
                            >
                                {loading ? 'Updating...' : 'Update Permission'}
                            </button>
                        </>
                    ) : (
                        <button 
                            onClick={handleShare} 
                            disabled={loading}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '10px',
                                border: 'none',
                                backgroundColor: '#6366f1',
                                color: '#ffffff',
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
                            }}
                        >
                            {loading ? 'Generating...' : 'Generate Share Link'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
