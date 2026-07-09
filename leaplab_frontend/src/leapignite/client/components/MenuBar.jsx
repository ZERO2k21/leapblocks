/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useRef, useEffect } from 'react';
import {
    ChevronDown, File, FolderOpen, Save, Share, Download,
    Undo, Redo, Cpu, RotateCcw, Home, Upload, Monitor, Rocket
} from 'lucide-react';
import Logo from '../../../components/Logo';
import LeapLabAuthButton from '../../../auth/LeapLabAuthButton';
import TopbarShareButton from '../../../components/common/TopbarShareButton';

// ─── Dropdown ────────────────────────────────────────────────────────────────
function DropdownMenu({ label, icon: Icon, items, isOpen, onToggle, onClose }) {
    const menuRef = useRef(null);
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) onCloseRef.current();
        };
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside, true);
        }, 0);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClickOutside, true);
        };
    }, [isOpen]);

    return (
        <div ref={menuRef} style={{ position: 'relative' }}>
            <button
                onClick={onToggle}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '5px 10px',
                    border: 'none',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                    cursor: 'pointer',
                    borderRadius: 20,
                    transition: 'all 0.2s ease',
                    background: isOpen ? 'rgba(255,255,255,0.18)' : 'transparent',
                    backdropFilter: isOpen ? 'blur(4px)' : 'none',
                    letterSpacing: '0.02em',
                    whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = isOpen ? 'rgba(255,255,255,0.18)' : 'transparent'; }}
            >
                {Icon && <Icon size={14} strokeWidth={2.2} style={{ opacity: 0.85, flexShrink: 0 }} />}
                {label}
                <ChevronDown
                    size={12}
                    strokeWidth={2.5}
                    style={{
                        opacity: 0.5,
                        transition: 'transform 0.2s ease',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        flexShrink: 0,
                    }}
                />
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    background: 'rgba(255,255,255,0.96)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderRadius: 12,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.08)',
                    border: '1px solid rgba(255,255,255,0.6)',
                    minWidth: 190,
                    overflow: 'hidden',
                    zIndex: 1000,
                    padding: '6px 0',
                    animation: 'embedMenuSlideIn 0.18s ease-out',
                }}>
                    <style>{`
                        @keyframes embedMenuSlideIn {
                            from { opacity: 0; transform: translateY(-6px) scale(0.98); }
                            to   { opacity: 1; transform: translateY(0)  scale(1);    }
                        }
                    `}</style>
                    {items.map((item, idx) =>
                        item.divider ? (
                            <div key={idx} style={{
                                height: 1,
                                background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.08), transparent)',
                                margin: '5px 12px',
                            }} />
                        ) : (
                            <button
                                key={idx}
                                onClick={() => { item.onClick?.(); onClose(); }}
                                disabled={item.disabled}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    width: '100%',
                                    padding: '9px 14px',
                                    border: 'none',
                                    background: 'transparent',
                                    fontSize: 14,
                                    fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                                    fontWeight: 500,
                                    textAlign: 'left',
                                    cursor: item.disabled ? 'not-allowed' : 'pointer',
                                    color: item.disabled ? '#bbb' : '#374151',
                                    transition: 'all 0.12s ease',
                                    letterSpacing: '0.01em',
                                }}
                                onMouseEnter={e => {
                                    if (!item.disabled) {
                                        e.currentTarget.style.background = 'rgba(10,1,90,0.07)';
                                        e.currentTarget.style.color = '#0a015a';
                                    }
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = item.disabled ? '#bbb' : '#374151';
                                }}
                            >
                                {item.icon && (
                                    <item.icon
                                        size={16}
                                        strokeWidth={2}
                                        style={{ opacity: 0.8, flexShrink: 0, color: '#0a015a' }}
                                    />
                                )}
                                <span style={{ flex: 1 }}>{item.label}</span>
                                {item.shortcut && (
                                    <span style={{
                                        fontSize: 11, color: '#aaa', fontWeight: 500,
                                        background: 'rgba(0,0,0,0.04)', padding: '2px 6px',
                                        borderRadius: 4, fontFamily: 'monospace',
                                    }}>{item.shortcut}</span>
                                )}
                            </button>
                        )
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Mode Toggle (Stage ↔ Upload) ────────────────────────────────────────────
function ModeToggle({ mode, onModeChange }) {
    return (
        <div
            onClick={() => onModeChange(mode === 'stage' ? 'upload' : 'stage')}
            title={`Switch to ${mode === 'stage' ? 'Upload' : 'Stage'} mode`}
            style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(0,0,0,0.35)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 999,
                padding: 3,
                cursor: 'pointer',
                width: 136,
                height: 32,
                flexShrink: 0,
                transition: 'border-color 0.2s',
                boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.3)',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.28)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
        >
            {/* Sliding pill */}
            <div style={{
                position: 'absolute',
                top: 3,
                bottom: 3,
                width: 'calc(50% - 3px)',
                borderRadius: 999,
                transition: 'left 0.28s cubic-bezier(0.4,0,0.2,1)',
                left: mode === 'stage' ? 3 : 'calc(50%)',
                background: mode === 'stage'
                    ? 'linear-gradient(135deg, #10B981, #059669)'
                    : 'linear-gradient(135deg, #3B82F6, #4F46E5)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
            }} />
            {/* Stage label */}
            <div style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 4, zIndex: 1, fontSize: 11, fontWeight: 700,
                color: mode === 'stage' ? '#fff' : 'rgba(255,255,255,0.45)',
                fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                transition: 'color 0.2s',
            }}>
                <Monitor size={12} strokeWidth={2.5} />
                Stage
            </div>
            {/* Upload label */}
            <div style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 4, zIndex: 1, fontSize: 11, fontWeight: 700,
                color: mode === 'upload' ? '#fff' : 'rgba(255,255,255,0.45)',
                fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                transition: 'color 0.2s',
            }}>
                <Rocket size={12} strokeWidth={2.5} />
                Upload
            </div>
        </div>
    );
}

// ─── Ports pill ───────────────────────────────────────────────────────────────
function PortsControl({ ports, selectedPort, onPortSelect, onRefreshPorts, onConnect, isConnected }) {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 20,
            padding: '0 8px',
            height: 32,
            flexShrink: 0,
        }}>
            <button
                onClick={onRefreshPorts}
                title="Refresh ports"
                style={{
                    background: 'none', border: 'none',
                    color: 'rgba(255,255,255,0.6)',
                    cursor: 'pointer', padding: 2,
                    display: 'flex', alignItems: 'center',
                    borderRadius: 6, transition: 'color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
            >
                <RotateCcw size={12} strokeWidth={2.5} />
            </button>

            <select
                value={selectedPort}
                onChange={(e) => onPortSelect?.(e.target.value)}
                style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(255,255,255,0.85)',
                    fontSize: 11,
                    fontWeight: 600,
                    outline: 'none',
                    cursor: 'pointer',
                    width: 80,
                    fontFamily: "'Segoe UI', Inter, monospace, sans-serif",
                }}
            >
                <option value="" style={{ background: '#0a015a' }}>
                    {ports.length === 0 ? 'No Ports' : 'Select Port'}
                </option>
                {ports.map(p => (
                    <option key={p.path} value={p.path} style={{ background: '#0a015a' }}>
                        {p.path}
                    </option>
                ))}
            </select>

            <button
                onClick={onConnect}
                style={{
                    padding: '3px 10px',
                    fontSize: 10,
                    fontWeight: 700,
                    border: 'none',
                    borderRadius: 12,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: isConnected
                        ? 'linear-gradient(135deg, #10B981, #059669)'
                        : 'rgba(255,255,255,0.12)',
                    color: '#fff',
                    fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                    letterSpacing: '0.04em',
                }}
                onMouseEnter={e => { if (!isConnected) e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; }}
                onMouseLeave={e => { if (!isConnected) e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
            >
                {isConnected ? '● ON' : 'CONNECT'}
            </button>
        </div>
    );
}

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

                {/* Logo + "LEAPLAB / EMBED" stacked label */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
                    filter: 'drop-shadow(0 0 12px rgba(80,180,255,0.25)) drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                }}>
                    <Logo height={48} />
                    <div style={{ lineHeight: 1.1 }}>
                        <div style={{
                            color: '#FFD500', fontSize: 8, fontWeight: 900,
                            letterSpacing: '1.5px', textTransform: 'uppercase',
                            fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                        }}>LEAPLAB</div>
                        <div style={{
                            color: '#fff', fontSize: 14, fontWeight: 900,
                            letterSpacing: '-0.3px',
                            fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                        }}>EMBED</div>
                    </div>
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