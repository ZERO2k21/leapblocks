/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useEffect } from 'react';
import {
    File, FolderOpen, Save, Share, Download,
    Undo, Redo, Cpu, Home, Upload
} from 'lucide-react';
import Logo from '../../../components/Logo';
import LeapLabAuthButton from '../../../auth/LeapLabAuthButton';
import TopbarShareButton from '../../../components/common/TopbarShareButton';
import DropdownMenu from './DropdownMenu';
import ModeToggle from './ModeToggle';
import PortsControl from './PortsControl';

// ─── Main MenuBar ─────────────────────────────────────────────────────────────
export default function MenuBar({
    projectName = 'Untitled Project',
    onProjectNameChange,
    mode = 'stage',
    onModeChange,
    selectedBoard,
    onBoardSelect,
    connectionStatus = 'disconnected',
    onConnect,
    ports = [],
    selectedPort = '',
    onPortSelect,
    onRefreshPorts,
    onUpload,
    isUploading,
    onFileAction,
    onEditAction,
    onBack,
    onDownload,
    onSave,
}) {
    const [openMenu, setOpenMenu] = useState(null);
    const [showCreoleap, setShowCreoleap] = useState(window.innerWidth >= 1400);

    useEffect(() => {
        const handleResize = () => setShowCreoleap(window.innerWidth >= 1400);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isConnected = connectionStatus === 'connected';

    const toggleMenu = (menu) => setOpenMenu(openMenu === menu ? null : menu);
    const closeMenu = () => setOpenMenu(null);

    const fileMenuItems = [
        { label: 'New Project', icon: File, shortcut: 'Ctrl+N', onClick: () => onFileAction?.('new') },
        { label: 'Open Project', icon: FolderOpen, shortcut: 'Ctrl+O', onClick: () => onFileAction?.('open') },
        { divider: true },
        { label: 'Save', icon: Save, shortcut: 'Ctrl+S', onClick: () => onFileAction?.('save') },
        { label: 'Download .leap', icon: Download, onClick: () => onDownload?.() },
        { divider: true },
        { label: 'Share', icon: Share, onClick: () => onFileAction?.('share') },
        { divider: true },
        {
            label: 'My Projects',
            icon: FolderOpen,
            onClick: () => {
                sessionStorage.setItem('landingActiveTab', 'my-projects');
                sessionStorage.setItem('myProjectsSelectedMode', 'intermediate');
                onBack?.();
            }
        },
    ];

    const editMenuItems = [
        { label: 'Undo', icon: Undo, shortcut: 'Ctrl+Z', onClick: () => onEditAction?.('undo') },
        { label: 'Redo', icon: Redo, shortcut: 'Ctrl+Y', onClick: () => onEditAction?.('redo') },
    ];

    const boardMenuItems = [
        { label: 'Select Board…', icon: Cpu, onClick: () => onBoardSelect?.() },
        { divider: true },
        { label: selectedBoard || 'No Board Selected', disabled: true },
    ];

    return (
        <div style={{
            display: 'grid',
            /*
             * 3-column grid — identical pattern to IGNITE JuniorMenuBar:
             *   LEFT   → auto             never shrinks, always shows logo + menus
             *   CENTER → minmax(0,1fr)    stretches, clips gracefully
             *   RIGHT  → auto             never shrinks, CREOLEAP logo always visible
             */
            gridTemplateColumns: 'auto minmax(0,1fr) auto',
            alignItems: 'center',
            height: 56,
            padding: '0 16px',
            gap: 8,
            background: 'linear-gradient(135deg, #0a0a1f 0%, #0a015a 55%, #080a25 100%)',
            boxShadow: '0 4px 20px rgba(8,10,37,0.5), inset 0 -1px 0 rgba(255,255,255,0.06)',
            borderBottom: '1px solid rgba(100,180,255,0.08)',
            zIndex: 100,
            flexShrink: 0,
        }}>

            {/* ══ LEFT: Home · Logo · "EMBED" · Menus ══════════════════════════ */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

                {/* Home button */}
                <button
                    onClick={() => {
                        sessionStorage.setItem('landingActiveTab', 'modules');
                        sessionStorage.removeItem('myProjectsSelectedMode');
                        onBack?.();
                    }}
                    title="Back to Home"
                    style={{
                        width: 34, height: 34,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: 10,
                        color: '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        flexShrink: 0,
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                        e.currentTarget.style.transform = 'scale(1.06)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                >
                    <Home size={17} strokeWidth={2.2} />
                </button>

                {/* Divider */}
                <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />

                {/* Logo + brand label */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
                    filter: 'drop-shadow(0 0 12px rgba(80,180,255,0.25)) drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                }}>
                    <Logo height={48} />
                    <div style={{
                        color: '#fff', fontSize: 22, fontWeight: 900,
                        letterSpacing: '-0.3px',
                        fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                    }}>EMBED</div>
                </div>

                {/* Divider */}
                <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />

                {/* Menus */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <DropdownMenu
                        label="File"
                        items={fileMenuItems}
                        isOpen={openMenu === 'file'}
                        onToggle={() => toggleMenu('file')}
                        onClose={closeMenu}
                    />
                    <DropdownMenu
                        label="Edit"
                        items={editMenuItems}
                        isOpen={openMenu === 'edit'}
                        onToggle={() => toggleMenu('edit')}
                        onClose={closeMenu}
                    />
                    <DropdownMenu
                        label="Board"
                        icon={Cpu}
                        items={boardMenuItems}
                        isOpen={openMenu === 'board'}
                        onToggle={() => toggleMenu('board')}
                        onClose={closeMenu}
                    />
                </div>
            </div>

            {/* ══ CENTER: Project name pill (mirrors IGNITE exactly) ════════════ */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 12px', overflow: 'hidden',
            }}>
                <div
                    style={{
                        display: 'flex', alignItems: 'center',
                        height: 38,
                        background: 'rgba(0,0,0,0.28)',
                        borderRadius: 999,
                        paddingLeft: 16, paddingRight: 4,
                        border: '1px solid rgba(255,255,255,0.09)',
                        gap: 8,
                        maxWidth: 280,
                        width: '100%',
                        minWidth: 0,
                        transition: 'border-color 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'}
                >
                    <span style={{ fontSize: 14, opacity: 0.5, flexShrink: 0 }}>📁</span>
                    <input
                        type="text"
                        value={projectName}
                        onChange={(e) => onProjectNameChange?.(e.target.value)}
                        placeholder="My Project"
                        style={{
                            background: 'transparent', border: 'none',
                            color: '#fff', fontSize: 13, fontWeight: 700,
                            fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                            flex: 1, minWidth: 0, outline: 'none',
                            textAlign: 'center', letterSpacing: '0.01em',
                        }}
                    />
                    {/* Green circular save button — identical to IGNITE */}
                    <button
                        onClick={() => onFileAction?.('save')}
                        title="Save Project"
                        style={{
                            width: 30, height: 30, flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'linear-gradient(135deg, #10B981, #059669)',
                            border: 'none', borderRadius: '50%',
                            color: '#fff', cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(16,185,129,0.35)',
                            transition: 'transform 0.15s ease',
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <Save size={14} strokeWidth={2.8} />
                    </button>

                </div>
            </div>

            {/* ══ RIGHT: Ports · Toggle · Upload · CREOLEAP SVG ════════════════ */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>

                {/* Ports pill — only in upload mode */}
                {mode === 'upload' && (
                    <PortsControl
                        ports={ports}
                        selectedPort={selectedPort}
                        onPortSelect={onPortSelect}
                        onRefreshPorts={onRefreshPorts}
                        onConnect={onConnect}
                        isConnected={isConnected}
                    />
                )}

                {/* Stage / Upload mode toggle */}
                <ModeToggle mode={mode} onModeChange={onModeChange} />

                {/* UPLOAD action button — only in upload mode */}
                {mode === 'upload' && (
                    <button
                        onClick={onUpload}
                        disabled={isUploading}
                        title="Upload to board"
                        style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            padding: '6px 14px',
                            background: isUploading
                                ? 'rgba(255,255,255,0.15)'
                                : 'linear-gradient(135deg, #F59E0B, #D97706)',
                            border: 'none', borderRadius: 20,
                            color: isUploading ? 'rgba(255,255,255,0.6)' : '#1a1000',
                            fontWeight: 800, fontSize: 12,
                            fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                            letterSpacing: '0.06em',
                            cursor: isUploading ? 'not-allowed' : 'pointer',
                            boxShadow: isUploading ? 'none' : '0 2px 10px rgba(245,158,11,0.35)',
                            transition: 'all 0.2s ease',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                        }}
                        onMouseEnter={e => {
                            if (!isUploading) {
                                e.currentTarget.style.transform = 'scale(1.04)';
                                e.currentTarget.style.boxShadow = '0 4px 14px rgba(245,158,11,0.45)';
                            }
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = isUploading
                                ? 'none'
                                : '0 2px 10px rgba(245,158,11,0.35)';
                        }}
                    >
                        <Upload size={13} strokeWidth={2.5} />
                        {isUploading ? 'Uploading…' : 'UPLOAD'}
                    </button>
                )}


                {/* Divider */}
                <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />

                <TopbarShareButton
                    style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: '6px 8px', borderRadius: 4, display: 'flex', alignItems: 'center', transition: '0.2s' }}
                    size={18}
                    onSave={onSave}
                    projectName={projectName}
                />

                <LeapLabAuthButton variant="dark" size="sm" />

                {showCreoleap && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        flexShrink: 0,
                        paddingLeft: 4,
                        height: '60px',
                        overflow: 'hidden',
                    }}>
                        <img
                            src="assets/logo-creoleap.png"
                            alt="CREOLEAP"
                            style={{
                                width: '145px',
                                height: 'auto',
                                objectFit: 'contain',
                                display: 'block',
                                flexShrink: 0,
                                filter: [
                                    'drop-shadow(0 0 20px rgba(167,139,250,0.7))',
                                    'drop-shadow(0 0 8px rgba(255,255,255,0.25))',
                                    'drop-shadow(0 3px 10px rgba(0,0,0,0.5))',
                                    'brightness(1.2)',
                                    'contrast(1.06)',
                                ].join(' '),
                            }}
                        />
                    </div>
                )}

            </div>
        </div>
    );
}