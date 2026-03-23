import React, { useState, useRef, useEffect } from 'react';
import {
    ChevronDown, File, FolderOpen, Save, Share,
    Undo, Redo, Cpu, Bluetooth, Usb, Wifi,
    Play, Upload, Settings, HelpCircle, Home, RotateCcw,
    Monitor, Rocket
} from 'lucide-react';
import Logo from '../../components/Logo';

// ═══════════════════════════════════════════════════════════════════════════
// DROPDOWN MENU — Glassmorphism + slide-in animation
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
        // Use setTimeout to avoid the same click that opened the menu from closing it
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
                    gap: 5,
                    padding: '6px 12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                    cursor: 'pointer',
                    borderRadius: 8,
                    transition: 'all 0.2s ease',
                    background: isOpen ? 'rgba(255,255,255,0.18)' : 'transparent',
                    backdropFilter: isOpen ? 'blur(4px)' : 'none',
                    letterSpacing: '0.02em',
                }}
                onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = 'transparent'; }}
            >
                {Icon && <Icon size={15} strokeWidth={2.2} style={{ opacity: 0.9 }} />}
                {label}
                <ChevronDown
                    size={13}
                    strokeWidth={2.5}
                    style={{
                        opacity: 0.6,
                        transition: 'transform 0.2s ease',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                />
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    background: 'rgba(255,255,255,0.92)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderRadius: 12,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.08)',
                    border: '1px solid rgba(255,255,255,0.6)',
                    minWidth: 200,
                    overflow: 'hidden',
                    zIndex: 1000,
                    padding: '6px 0',
                    animation: 'menuSlideIn 0.18s ease-out',
                }}>
                    <style>{`
                        @keyframes menuSlideIn {
                            from { opacity: 0; transform: translateY(-6px) scale(0.98); }
                            to { opacity: 1; transform: translateY(0) scale(1); }
                        }
                    `}</style>
                    {items.map((item, idx) => (
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
                                    fontSize: 13,
                                    fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                                    fontWeight: 500,
                                    textAlign: 'left',
                                    cursor: item.disabled ? 'not-allowed' : 'pointer',
                                    color: item.disabled ? '#bbb' : '#374151',
                                    transition: 'all 0.12s ease',
                                    borderRadius: 0,
                                    position: 'relative',
                                    letterSpacing: '0.01em',
                                }}
                                onMouseEnter={e => {
                                    if (!item.disabled) {
                                        e.currentTarget.style.background = 'rgba(107,70,193,0.08)';
                                        e.currentTarget.style.color = '#6B46C1';
                                    }
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = item.disabled ? '#bbb' : '#374151';
                                }}
                            >
                                {item.icon && <item.icon size={16} color="#7C3AED" strokeWidth={2} style={{ opacity: 0.85, flexShrink: 0 }} />}
                                <span style={{ flex: 1 }}>{item.label}</span>
                                {item.shortcut && (
                                    <span style={{
                                        fontSize: 11,
                                        color: '#aaa',
                                        fontWeight: 500,
                                        background: 'rgba(0,0,0,0.04)',
                                        padding: '2px 6px',
                                        borderRadius: 4,
                                        fontFamily: "'Segoe UI', monospace",
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
            background: 'rgba(0,0,0,0.25)',
            borderRadius: 22,
            padding: 3,
            border: '1px solid rgba(255,255,255,0.08)',
        }}>
            {/* Sliding indicator */}
            <div style={{
                position: 'absolute',
                top: 3,
                left: mode === 'stage' ? 3 : 'calc(50% + 1px)',
                width: 'calc(50% - 4px)',
                height: 'calc(100% - 6px)',
                borderRadius: 19,
                background: mode === 'stage'
                    ? 'linear-gradient(135deg, #10B981, #059669)'
                    : 'linear-gradient(135deg, #3B82F6, #2563EB)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            }} />
            <button
                onClick={() => onModeChange('stage')}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '6px 16px',
                    border: 'none',
                    borderRadius: 19,
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                    cursor: 'pointer',
                    background: 'transparent',
                    color: mode === 'stage' ? '#fff' : 'rgba(255,255,255,0.55)',
                    position: 'relative',
                    zIndex: 1,
                    transition: 'color 0.2s ease',
                    letterSpacing: '0.03em',
                }}
            >
                <Monitor size={13} strokeWidth={2.5} />
                Stage
            </button>
            <button
                onClick={() => onModeChange('upload')}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '6px 16px',
                    border: 'none',
                    borderRadius: 19,
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                    cursor: 'pointer',
                    background: 'transparent',
                    color: mode === 'upload' ? '#fff' : 'rgba(255,255,255,0.55)',
                    position: 'relative',
                    zIndex: 1,
                    transition: 'color 0.2s ease',
                    letterSpacing: '0.03em',
                }}
            >
                <Rocket size={13} strokeWidth={2.5} />
                Upload
            </button>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN MENUBAR
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
        { label: 'Share', icon: Share, onClick: () => onFileAction?.('share to') },
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

    const connectMenuItems = [
        { label: 'Serial', icon: Usb, onClick: () => onConnect?.('serial') },
        { label: 'Bluetooth', icon: Bluetooth, onClick: () => onConnect?.('bluetooth') },
        { label: 'WiFi', icon: Wifi, onClick: () => onConnect?.('wifi'), disabled: true },
    ];

    const isConnected = connectionStatus === 'connected';

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            height: 54,
            padding: '0 16px',
            gap: 6,
            background: 'linear-gradient(135deg, #7B4FC4 0%, #6236A0 50%, #4E2A84 100%)',
            boxShadow: '0 2px 12px rgba(78,42,132,0.35)',
            zIndex: 100,
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            position: 'relative',
        }}>

            {/* Home Button */}
            <button
                onClick={onBack}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 36,
                    height: 36,
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 10,
                    color: '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    marginRight: 8,
                    flexShrink: 0,
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.transform = 'scale(1)';
                }}
                title="Back to Home"
            >
                <Home size={18} strokeWidth={2.2} />
            </button>

            {/* Logo + Label */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginRight: 16,
                flexShrink: 0,
            }}>
                <Logo height={40} />
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    borderLeft: '1px solid rgba(255,255,255,0.15)',
                    paddingLeft: 10,
                }}>
                    <span style={{
                        color: '#FFD500',
                        fontSize: 9,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.15em',
                        lineHeight: 1.2,
                        fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                    }}>
                        LEAPBLOCKS
                    </span>
                    <span style={{
                        color: 'rgba(255,255,255,0.8)',
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: '0.02em',
                        lineHeight: 1.2,
                        fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                    }}>
                        Intermediate
                    </span>
                </div>
            </div>

            {/* Separator */}
            <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.12)', margin: '0 4px', flexShrink: 0 }} />

            {/* Menu Dropdowns */}
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

            {/* Separator */}
            <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.12)', margin: '0 6px', flexShrink: 0 }} />

            {/* Hardware Port Section */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(0,0,0,0.2)',
                padding: '4px 10px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.06)',
            }}>
                <button
                    onClick={onRefreshPorts}
                    title="Refresh Ports"
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'rgba(255,255,255,0.7)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        padding: 4,
                        borderRadius: 6,
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.color = '#fff';
                        e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                        e.currentTarget.style.background = 'transparent';
                    }}
                >
                    <RotateCcw size={13} strokeWidth={2.5} />
                </button>
                <select
                    value={selectedPort}
                    onChange={(e) => onPortSelect?.(e.target.value)}
                    style={{
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 6,
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 500,
                        fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                        outline: 'none',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        maxWidth: 130,
                        appearance: 'none',
                        WebkitAppearance: 'none',
                    }}
                >
                    <option value="" style={{ color: '#374151', background: '#fff' }}>
                        {ports.length === 0 ? 'No Ports' : 'Select Port'}
                    </option>
                    {ports.map(p => (
                        <option
                            key={p.path}
                            value={p.path}
                            style={{
                                color: p.path === 'BRIDGE_DETECTED' ? '#EF4444' : '#374151',
                                background: '#fff',
                            }}
                        >
                            {p.path === 'BRIDGE_DETECTED'
                                ? `⚠ Driver: ${p.manufacturer}`
                                : `${p.path} (${p.manufacturer || '?'})`}
                        </option>
                    ))}
                </select>
                <button
                    onClick={onConnect}
                    style={{
                        border: 'none',
                        borderRadius: 7,
                        color: '#fff',
                        padding: '4px 12px',
                        fontSize: 10,
                        fontWeight: 700,
                        fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        background: isConnected
                            ? 'linear-gradient(135deg, #10B981, #059669)'
                            : 'rgba(255,255,255,0.12)',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                    }}
                    onMouseEnter={e => {
                        if (!isConnected) e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                    }}
                    onMouseLeave={e => {
                        if (!isConnected) e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                    }}
                >
                    {isConnected ? '● Connected' : 'Connect'}
                </button>
            </div>

            {/* Upload Button — Upload Mode Only */}
            {mode === 'upload' && (
                <button
                    onClick={onUpload}
                    disabled={isUploading}
                    style={{
                        border: 'none',
                        borderRadius: 20,
                        padding: '7px 18px',
                        fontSize: 12,
                        fontWeight: 700,
                        fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                        cursor: isUploading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: isUploading ? 'none' : '0 2px 10px rgba(255,213,0,0.35)',
                        transition: 'all 0.2s ease',
                        background: isUploading
                            ? 'rgba(255,255,255,0.15)'
                            : 'linear-gradient(135deg, #FFD500, #FFB800)',
                        color: isUploading ? 'rgba(255,255,255,0.7)' : '#1a1a2e',
                        letterSpacing: '0.03em',
                        marginLeft: 4,
                    }}
                >
                    <Upload size={14} strokeWidth={2.5} />
                    {isUploading ? 'UPLOADING...' : 'UPLOAD'}
                </button>
            )}

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Project Name */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: 10,
                padding: '0 4px 0 12px',
                border: '1px solid rgba(255,255,255,0.08)',
                height: 36,
                gap: 6,
            }}>
                <span style={{ fontSize: 14, opacity: 0.5 }}>📁</span>
                <input
                    type="text"
                    value={projectName}
                    onChange={(e) => onProjectNameChange?.(e.target.value)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#fff',
                        fontSize: 13,
                        fontWeight: 600,
                        fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                        width: 140,
                        outline: 'none',
                        letterSpacing: '0.01em',
                    }}
                    placeholder="Project Name"
                />
                <button
                    onClick={() => onFileAction?.('save')}
                    style={{
                        background: 'linear-gradient(135deg, #10B981, #059669)',
                        border: 'none',
                        borderRadius: 7,
                        width: 28,
                        height: 28,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#fff',
                        transition: 'all 0.15s ease',
                        flexShrink: 0,
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    title="Save Project"
                >
                    <Save size={14} strokeWidth={2.5} />
                </button>
            </div>

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Connection Status Indicator */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginRight: 10,
            }}>
                <div style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: isConnected ? '#10B981' : '#EF4444',
                    boxShadow: isConnected ? '0 0 8px rgba(16,185,129,0.5)' : '0 0 8px rgba(239,68,68,0.4)',
                    animation: isConnected ? 'none' : undefined,
                }} />
                <span style={{
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: 11,
                    fontWeight: 500,
                    fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                }}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                </span>
            </div>

            {/* Mode Toggle */}
            <ModeToggle mode={mode} onModeChange={onModeChange} />

            {/* Help Button */}
            <button
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 34,
                    height: 34,
                    marginLeft: 8,
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    color: 'rgba(255,255,255,0.7)',
                    transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.18)';
                    e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                }}
                title="Help"
            >
                <HelpCircle size={17} strokeWidth={2.2} />
            </button>
        </div>
    );
}
