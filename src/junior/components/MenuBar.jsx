/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */
import React, { useState, useRef, useEffect } from 'react';
import {
    ChevronDown, File, FolderOpen, Save, Share,
    Undo, Redo, Cpu, Bluetooth, Usb, Wifi,
    Play, Upload, Settings, HelpCircle, Home, RotateCcw,
    Monitor, Rocket
} from 'lucide-react';
import Logo, { CreoleapLogo } from '../../components/Logo';

// ═══════════════════════════════════════════════════════════════════════════
// DROPDOWN MENU — Glassmorphism + slide-in animation (Inline Styles)
// ═══════════════════════════════════════════════════════════════════════════
function DropdownMenu({ label, icon: Icon, items, isOpen, onToggle, onClose }) {
    const menuRef = useRef(null);
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onCloseRef.current();
            }
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
                    gap: 6,
                    padding: '6px 14px',
                    border: 'none',
                    color: '#fff',
                    fontSize: 13.5,
                    fontWeight: 600,
                    fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                    cursor: 'pointer',
                    borderRadius: 10,
                    transition: 'all 0.2s ease',
                    background: isOpen ? 'rgba(255,255,255,0.18)' : 'transparent',
                    backdropFilter: isOpen ? 'blur(6px)' : 'none',
                    letterSpacing: '0.02em',
                }}
                onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
                onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = 'transparent'; }}
            >
                {Icon && <Icon size={16} strokeWidth={2.2} style={{ opacity: 0.9 }} />}
                {label}
                <ChevronDown
                    size={14}
                    strokeWidth={2.5}
                    style={{
                        opacity: 0.65,
                        transition: 'transform 0.25s ease',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                />
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    background: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(22px)',
                    WebkitBackdropFilter: 'blur(22px)',
                    borderRadius: 14,
                    boxShadow: '0 10px 40px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.08)',
                    border: '1px solid rgba(255,255,255,0.65)',
                    minWidth: 210,
                    overflow: 'hidden',
                    zIndex: 1000,
                    padding: '8px 0',
                    animation: 'menuSlideIn 0.2s cubic-bezier(0.23, 1, 0.32, 1)',
                }}>
                    <style>{`
                        @keyframes menuSlideIn {
                            from { opacity: 0; transform: translateY(-8px) scale(0.96); }
                            to { opacity: 1; transform: translateY(0) scale(1); }
                        }
                    `}</style>
                    {items.map((item, idx) => (
                        item.divider ? (
                            <div key={idx} style={{
                                height: 1,
                                background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.1), transparent)',
                                margin: '6px 14px',
                            }} />
                        ) : (
                            <button
                                key={idx}
                                onClick={() => { item.onClick?.(); onClose(); }}
                                disabled={item.disabled}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    width: '100%',
                                    padding: '10px 16px',
                                    border: 'none',
                                    background: 'transparent',
                                    fontSize: 13.5,
                                    fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                                    fontWeight: 500,
                                    textAlign: 'left',
                                    cursor: item.disabled ? 'not-allowed' : 'pointer',
                                    color: item.disabled ? '#9ca3af' : '#1f2937',
                                    transition: 'all 0.15s ease',
                                    borderRadius: 0,
                                }}
                                onMouseEnter={e => {
                                    if (!item.disabled) {
                                        e.currentTarget.style.background = 'rgba(124, 58, 237, 0.08)';
                                        e.currentTarget.style.color = '#6B46C1';
                                    }
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = item.disabled ? '#9ca3af' : '#1f2937';
                                }}
                            >
                                {item.icon && <item.icon size={17} color="#7C3AED" strokeWidth={2.1} style={{ opacity: 0.9 }} />}
                                <span style={{ flex: 1 }}>{item.label}</span>
                                {item.shortcut && (
                                    <span style={{
                                        fontSize: 11.5,
                                        color: '#6b7280',
                                        fontWeight: 500,
                                        background: 'rgba(0,0,0,0.05)',
                                        padding: '2px 7px',
                                        borderRadius: 5,
                                        fontFamily: 'ui-monospace, monospace',
                                    }}>{item.shortcut}</span>
                                )}
                            </button>
                        )
                    ))}
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// MODE TOGGLE — Premium sliding pill (Stage / Upload)
// ═══════════════════════════════════════════════════════════════════════════
function ModeToggle({ mode, onModeChange }) {
    return (
        <div style={{
            display: 'flex',
            position: 'relative',
            background: 'rgba(0,0,0,0.28)',
            borderRadius: 30,
            padding: 4,
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.3)',
        }}>
            {/* Sliding indicator */}
            <div style={{
                position: 'absolute',
                top: 4,
                left: mode === 'stage' ? 4 : 'calc(50% + 2px)',
                width: 'calc(50% - 8px)',
                height: 'calc(100% - 8px)',
                borderRadius: 26,
                background: mode === 'stage'
                    ? 'linear-gradient(135deg, #10B981, #059669)'
                    : 'linear-gradient(135deg, #3B82F6, #2563EB)',
                transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 3px 10px rgba(0,0,0,0.3)',
            }} />

            <button
                onClick={() => onModeChange('stage')}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 18px',
                    border: 'none',
                    borderRadius: 26,
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                    cursor: 'pointer',
                    background: 'transparent',
                    color: mode === 'stage' ? '#fff' : 'rgba(255,255,255,0.65)',
                    position: 'relative',
                    zIndex: 2,
                    transition: 'color 0.2s ease',
                    letterSpacing: '0.03em',
                }}
            >
                <Monitor size={15} strokeWidth={2.6} />
                Stage
            </button>

            <button
                onClick={() => onModeChange('upload')}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 18px',
                    border: 'none',
                    borderRadius: 26,
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                    cursor: 'pointer',
                    background: 'transparent',
                    color: mode === 'upload' ? '#fff' : 'rgba(255,255,255,0.65)',
                    position: 'relative',
                    zIndex: 2,
                    transition: 'color 0.2s ease',
                    letterSpacing: '0.03em',
                }}
            >
                <Rocket size={15} strokeWidth={2.6} />
                Upload
            </button>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN MENUBAR — Full Inline Styles
// ═══════════════════════════════════════════════════════════════════════════
export default function MenuBar({
    projectName = "Untitled Project",
    onProjectNameChange,
    mode = "stage",
    onModeChange,
    selectedBoard,
    onBoardSelect,
    connectionStatus = "disconnected",
    onConnect,
    ports = [],
    selectedPort = "",
    onPortSelect,
    onRefreshPorts,
    onUpload,
    isUploading,
    onFileAction,
    onEditAction,
    onBack,
}) {
    const [openMenu, setOpenMenu] = useState(null);

    const toggleMenu = (menu) => {
        setOpenMenu(openMenu === menu ? null : menu);
    };

    const closeMenu = () => setOpenMenu(null);

    const fileMenuItems = [
        { label: 'New Project', icon: File, shortcut: 'Ctrl+N', onClick: () => onFileAction?.('new') },
        { label: 'Open Project', icon: FolderOpen, shortcut: 'Ctrl+O', onClick: () => onFileAction?.('open') },
        { divider: true },
        { label: 'Save', icon: Save, shortcut: 'Ctrl+S', onClick: () => onFileAction?.('save') },
        { label: 'Share', icon: Share, onClick: () => onFileAction?.('share') },
    ];

    const editMenuItems = [
        { label: 'Undo', icon: Undo, shortcut: 'Ctrl+Z', onClick: () => onEditAction?.('undo') },
        { label: 'Redo', icon: Redo, shortcut: 'Ctrl+Y', onClick: () => onEditAction?.('redo') },
    ];

    const boardMenuItems = [
        { label: 'Select Board...', icon: Cpu, onClick: () => onBoardSelect?.() },
        { divider: true },
        { label: selectedBoard || 'No Board Selected', disabled: true },
    ];

    const isConnected = connectionStatus === 'connected';

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            height: 58,
            padding: '0 20px',
            gap: 8,
            background: 'linear-gradient(135deg, #0a015a 0%, #080a25 100%)',
            boxShadow: '0 4px 25px rgba(8,10,37,0.5), inset 0 -1px 0 rgba(255,255,255,0.08)',
            zIndex: 100,
            borderBottom: '1px solid rgba(100,180,255,0.12)',
            position: 'relative',
            userSelect: 'none',
        }}>

            {/* Home Button */}
            <button
                onClick={onBack}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 38,
                    height: 38,
                    background: 'rgba(255,255,255,0.09)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 12,
                    color: '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    flexShrink: 0,
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.22)';
                    e.currentTarget.style.transform = 'scale(1.06)';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.09)';
                    e.currentTarget.style.transform = 'scale(1)';
                }}
                title="Back to Home"
            >
                <Home size={19} strokeWidth={2.2} />
            </button>

            {/* LeapLab Logo */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                marginRight: 16,
                flexShrink: 0,
                filter: 'drop-shadow(0 0 14px rgba(36,0,85,0.9)) drop-shadow(0 2px 8px rgba(0,0,0,0.4))',
            }}>
                <Logo height={46} />
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    marginLeft: 12,
                    lineHeight: 1.05,
                }}>
                    <span style={{
                        color: '#FFD500',
                        fontSize: 9,
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        letterSpacing: '0.2em',
                    }}>LEAPLAB</span>
                    <span style={{
                        color: '#fff',
                        fontSize: 15.5,
                        fontWeight: 900,
                        letterSpacing: '0.09em',
                    }}>EMBED</span>
                </div>
            </div>

            {/* Menu Dropdowns */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
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

            {/* Hardware Port Section */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(0,0,0,0.25)',
                padding: '5px 12px',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.08)',
            }}>
                <button
                    onClick={onRefreshPorts}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'rgba(255,255,255,0.75)',
                        cursor: 'pointer',
                        padding: 5,
                        borderRadius: 8,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                    <RotateCcw size={15} strokeWidth={2.4} />
                </button>

                <select
                    value={selectedPort}
                    onChange={(e) => onPortSelect?.(e.target.value)}
                    style={{
                        background: 'rgba(255,255,255,0.09)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: 8,
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 500,
                        padding: '6px 10px',
                        maxWidth: 145,
                        outline: 'none',
                        cursor: 'pointer',
                    }}
                >
                    <option value="">{ports.length === 0 ? 'No Ports' : 'Select Port'}</option>
                    {ports.map(p => (
                        <option key={p.path} value={p.path}>
                            {p.path}
                        </option>
                    ))}
                </select>

                <button
                    onClick={onConnect}
                    style={{
                        border: 'none',
                        borderRadius: 9,
                        color: '#fff',
                        padding: '6px 16px',
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: isConnected
                            ? 'linear-gradient(135deg, #10B981, #059669)'
                            : 'rgba(255,255,255,0.13)',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                    }}
                >
                    {isConnected ? '● Connected' : 'Connect'}
                </button>
            </div>

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Project Name */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(0,0,0,0.22)',
                borderRadius: 12,
                padding: '0 6px 0 14px',
                border: '1px solid rgba(255,255,255,0.09)',
                height: 36,
                gap: 8,
            }}>
                <span style={{ fontSize: 15, opacity: 0.6 }}>📁</span>
                <input
                    type="text"
                    value={projectName}
                    onChange={(e) => onProjectNameChange?.(e.target.value)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#fff',
                        fontSize: 13.5,
                        fontWeight: 600,
                        width: 160,
                        outline: 'none',
                    }}
                    placeholder="Project Name"
                />
                <button
                    onClick={() => onFileAction?.('save')}
                    style={{
                        background: 'linear-gradient(135deg, #10B981, #059669)',
                        border: 'none',
                        borderRadius: 8,
                        width: 30,
                        height: 30,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#fff',
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <Save size={15} strokeWidth={2.5} />
                </button>
            </div>

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Right Side */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

                {/* Connection Status */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                }}>
                    <div style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: isConnected ? '#10B981' : '#EF4444',
                        boxShadow: isConnected 
                            ? '0 0 10px rgba(16,185,129,0.6)' 
                            : '0 0 10px rgba(239,68,68,0.5)',
                    }} />
                    <span style={{
                        color: 'rgba(255,255,255,0.65)',
                        fontSize: 12.5,
                        fontWeight: 500,
                    }}>
                        {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                </div>

                {/* Mode Toggle */}
                <ModeToggle mode={mode} onModeChange={onModeChange} />

                {/* Upload Button */}
                {mode === 'upload' && (
                    <button
                        onClick={onUpload}
                        disabled={isUploading}
                        style={{
                            border: 'none',
                            borderRadius: 22,
                            padding: '8px 20px',
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: isUploading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 7,
                            background: isUploading
                                ? 'rgba(255,255,255,0.18)'
                                : 'linear-gradient(135deg, #FFD500, #F59E0B)',
                            color: isUploading ? 'rgba(255,255,255,0.75)' : '#1e2937',
                            boxShadow: isUploading ? 'none' : '0 3px 12px rgba(245,158,11,0.4)',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <Upload size={16} strokeWidth={2.5} />
                        {isUploading ? 'UPLOADING...' : 'UPLOAD'}
                    </button>
                )}

                {/* Creoleap Logo */}
                <div style={{
                    marginLeft: 8,
                    filter: 'drop-shadow(0 0 18px rgba(255,255,255,0.25))',
                }}>
                    <CreoleapLogo height={68} />
                </div>
            </div>
        </div>
    );
}