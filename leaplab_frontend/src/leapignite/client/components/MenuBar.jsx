/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
    File, FolderOpen, Save, Share, Download,
    Undo, Redo, Cpu, Home, Upload, Menu as MenuIcon
} from 'lucide-react';
import Logo from '../../../components/Logo';
import LeapLabAuthButton from '../../../auth/LeapLabAuthButton';
import TopbarShareButton from '../../../components/common/TopbarShareButton';
import ProjectNameInput from '../../../components/common/ProjectNameInput';
import ActionButton from '../../../components/common/ActionButton';
import { useWindowWidth } from '../../../hooks/useWindowWidth';
import MobileDrawer from '../../../components/common/MobileDrawer';
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
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const mobileMenuRef = useRef(null);
    const windowWidth = useWindowWidth();
    const showDesktopMenus = windowWidth >= 1400;

    useEffect(() => {
        const handleResize = () => setShowCreoleap(window.innerWidth >= 1400);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!mobileMenuOpen) return;
        const handleClickOutside = (e) => {
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
                setMobileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside, true);
        return () => document.removeEventListener('mousedown', handleClickOutside, true);
    }, [mobileMenuOpen]);

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
        <>
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
                {showDesktopMenus && (
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
                )}
            </div>

            {/* ══ CENTER: Project name pill ════════════════════════════════════ */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 12px', overflow: 'hidden',
            }}>
                <ProjectNameInput
                    value={projectName}
                    onChange={(val) => onProjectNameChange?.(val)}
                    onSave={() => onFileAction?.('save')}
                />
            </div>

            {/* ══ RIGHT: Ports · Toggle · Upload · CREOLEAP SVG ════════════════ */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>

                {showDesktopMenus ? (
                    <>
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

                        {mode === 'upload' && (
                            <ActionButton
                                variant="warning"
                                icon={<Upload size={13} strokeWidth={2.5} />}
                                label={isUploading ? 'Uploading…' : 'UPLOAD'}
                                onClick={onUpload}
                                disabled={isUploading}
                                loading={isUploading}
                                title="Upload to board"
                            />
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
                    </>
                ) : (
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 34, height: 34, borderRadius: 10,
                            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                            color: '#fff', cursor: 'pointer', flexShrink: 0,
                        }}
                    >
                        <MenuIcon size={18} strokeWidth={2.2} />
                    </button>
                )}

            </div>
        </div>

        <MobileDrawer
            isOpen={mobileMenuOpen}
            onClose={() => setMobileMenuOpen(false)}
            theme="dark"
        >
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.5 }}>File Operations</div>
            {fileMenuItems.map((item, idx) =>
                item.divider ? (
                    <div key={idx} style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
                ) : (
                    <button key={idx} onClick={() => { item.onClick?.(); setMobileMenuOpen(false); }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                            padding: '8px 10px', border: 'none', borderRadius: 8,
                            background: 'transparent', color: '#e0e0e0', fontSize: 13,
                            fontWeight: 500, cursor: 'pointer', textAlign: 'left',
                            transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.25)'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#e0e0e0'; }}
                    >
                        {item.icon && <item.icon size={15} color="#a78bfa" strokeWidth={2} />}
                        {item.label}
                    </button>
                )
            )}

            <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />

            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.5 }}>Edit Operations</div>
            {editMenuItems.map((item, idx) => (
                <button key={idx} onClick={() => { item.onClick?.(); setMobileMenuOpen(false); }}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                        padding: '8px 10px', border: 'none', borderRadius: 8,
                        background: 'transparent', color: '#e0e0e0', fontSize: 13,
                        fontWeight: 500, cursor: 'pointer', textAlign: 'left',
                        transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.25)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#e0e0e0'; }}
                >
                    {item.icon && <item.icon size={15} color="#a78bfa" strokeWidth={2} />}
                    {item.label}
                </button>
            ))}

            <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />

            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.5 }}>Board</div>
            {boardMenuItems.map((item, idx) =>
                item.divider ? (
                    <div key={idx} style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
                ) : (
                    <button key={idx} onClick={() => { !item.disabled && item.onClick?.(); setMobileMenuOpen(false); }}
                        disabled={item.disabled}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                            padding: '8px 10px', border: 'none', borderRadius: 8,
                            background: 'transparent',
                            color: item.disabled ? '#666' : '#e0e0e0', fontSize: 13,
                            fontWeight: 500, cursor: item.disabled ? 'not-allowed' : 'pointer', textAlign: 'left',
                            transition: 'all 0.15s ease',
                        }}
                    >
                        {item.icon && <item.icon size={15} color="#a78bfa" strokeWidth={2} />}
                        {item.label}
                    </button>
                )
            )}

            <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />

            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.5 }}>Controls</div>
            <button onClick={() => { onModeChange?.(mode === 'upload' ? 'stage' : 'upload'); setMobileMenuOpen(false); }}
                style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                    padding: '8px 10px', border: 'none', borderRadius: 8,
                    background: 'transparent', color: '#e0e0e0', fontSize: 13,
                    fontWeight: 500, cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.25)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#e0e0e0'; }}
            >
                Switch to {mode === 'upload' ? 'Stage' : 'Upload'} Mode
            </button>
            {mode === 'upload' && (
                <ActionButton
                    variant="warning"
                    icon={<Upload size={13} strokeWidth={2.5} />}
                    label={isUploading ? 'Uploading…' : 'UPLOAD'}
                    onClick={() => { onUpload?.(); setMobileMenuOpen(false); }}
                    disabled={isUploading}
                    loading={isUploading}
                    style={{ width: '100%' }}
                />
            )}

            <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />

            <TopbarShareButton size={20} onSave={onSave} projectName={projectName}>
                {({ onClick, loading }) => (
                    <button onClick={() => { onClick?.(); setMobileMenuOpen(false); }} disabled={loading}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                            padding: '8px 10px', border: 'none', borderRadius: 8,
                            background: 'transparent', color: '#e0e0e0', fontSize: 13,
                            fontWeight: 500, cursor: 'pointer', textAlign: 'left',
                            transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.25)'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#e0e0e0'; }}
                    >
                        <Share size={15} color="#a78bfa" strokeWidth={2} />
                        Share
                    </button>
                )}
            </TopbarShareButton>

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <LeapLabAuthButton variant="dark" size="sm" style={{ width: '100%', height: '34px', borderRadius: '20px', boxSizing: 'border-box' }} />
            </div>
        </MobileDrawer>
        </>
    );
}