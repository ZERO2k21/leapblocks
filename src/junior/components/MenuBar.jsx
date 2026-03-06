import React, { useState, useRef, useEffect } from 'react';
import {
    ChevronDown, File, FolderOpen, Save, Download,
    Undo, Redo, Cpu, Bluetooth, Usb, Wifi,
    Play, Upload, Settings, HelpCircle, Home, RotateCcw
} from 'lucide-react';
import Logo from '../../components/Logo';

// PictoBlox-inspired purple color scheme
const COLORS = {
    menuBar: 'linear-gradient(180deg, #7B4FC4 0%, #5A2D82 100%)',
    menuHover: 'rgba(255,255,255,0.15)',
    menuActive: 'rgba(0,0,0,0.2)',
    text: '#FFFFFF',
    accent: '#FFD500',
    stageMode: '#2ECC71',
    uploadMode: '#3498DB',
};

// Dropdown Menu Component
function DropdownMenu({ label, icon: Icon, items, isOpen, onToggle, onClose }) {
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    return (
        <div ref={menuRef} style={{ position: 'relative' }}>
            <button
                onClick={onToggle}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '8px 12px',
                    background: isOpen ? COLORS.menuActive : 'transparent',
                    border: 'none',
                    color: COLORS.text,
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    borderRadius: '4px',
                    transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                    if (!isOpen) e.target.style.background = COLORS.menuHover;
                }}
                onMouseLeave={(e) => {
                    if (!isOpen) e.target.style.background = 'transparent';
                }}
            >
                {Icon && <Icon size={16} />}
                {label}
                <ChevronDown size={14} style={{ opacity: 0.7 }} />
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '4px',
                    background: '#FFFFFF',
                    borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    minWidth: '180px',
                    overflow: 'hidden',
                    zIndex: 1000,
                }}>
                    {items.map((item, idx) => (
                        item.divider ? (
                            <div key={idx} style={{ height: '1px', background: '#eee', margin: '4px 0' }} />
                        ) : (
                            <button
                                key={idx}
                                onClick={() => { item.onClick?.(); onClose(); }}
                                disabled={item.disabled}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    width: '100%',
                                    padding: '10px 14px',
                                    border: 'none',
                                    background: 'transparent',
                                    color: item.disabled ? '#999' : '#333',
                                    fontSize: '13px',
                                    textAlign: 'left',
                                    cursor: item.disabled ? 'not-allowed' : 'pointer',
                                    transition: 'background 0.1s',
                                }}
                                onMouseEnter={(e) => {
                                    if (!item.disabled) e.target.style.background = '#f5f5f5';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'transparent';
                                }}
                            >
                                {item.icon && <item.icon size={16} color="#7B4FC4" />}
                                <span style={{ flex: 1 }}>{item.label}</span>
                                {item.shortcut && (
                                    <span style={{ fontSize: '11px', color: '#999' }}>{item.shortcut}</span>
                                )}
                            </button>
                        )
                    ))}
                </div>
            )}
        </div>
    );
}

// Mode Toggle Component (Stage / Upload)
function ModeToggle({ mode, onModeChange }) {
    return (
        <div style={{
            display: 'flex',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '20px',
            padding: '3px',
        }}>
            <button
                onClick={() => onModeChange('stage')}
                style={{
                    padding: '6px 16px',
                    border: 'none',
                    borderRadius: '17px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: mode === 'stage' ? COLORS.stageMode : 'transparent',
                    color: mode === 'stage' ? '#fff' : 'rgba(255,255,255,0.7)',
                }}
            >
                Stage
            </button>
            <button
                onClick={() => onModeChange('upload')}
                style={{
                    padding: '6px 16px',
                    border: 'none',
                    borderRadius: '17px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: mode === 'upload' ? COLORS.uploadMode : 'transparent',
                    color: mode === 'upload' ? '#fff' : 'rgba(255,255,255,0.7)',
                }}
            >
                Upload
            </button>
        </div>
    );
}

// Main MenuBar Component
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

    // Menu definitions
    const fileMenuItems = [
        { label: 'New Project', icon: File, shortcut: 'Ctrl+N', onClick: () => onFileAction?.('new') },
        { label: 'Open Project', icon: FolderOpen, shortcut: 'Ctrl+O', onClick: () => onFileAction?.('open') },
        { divider: true },
        { label: 'Save', icon: Save, shortcut: 'Ctrl+S', onClick: () => onFileAction?.('save') },
        { label: 'Save As...', icon: Download, onClick: () => onFileAction?.('save_as') },
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
        {
            label: 'Serial',
            icon: Usb,
            onClick: () => onConnect?.('serial'),
        },
        {
            label: 'Bluetooth',
            icon: Bluetooth,
            onClick: () => onConnect?.('bluetooth'),
        },
        {
            label: 'WiFi',
            icon: Wifi,
            onClick: () => onConnect?.('wifi'),
            disabled: true,
        },
    ];

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            height: '48px',
            background: COLORS.menuBar,
            padding: '0 12px',
            gap: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 100,
            borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
            {/* Home Link */}
            <button
                onClick={onBack}
                style={{
                    background: 'rgba(255,255,255,0.15)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    padding: '6px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginRight: '8px'
                }}
            >
                <Home size={16} />
            </button>
            {/* Logo */}
            <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '8px',
                marginRight: '20px',
            }}>
                <Logo height={28} />
                <span style={{
                    color: '#FFD500',
                    fontSize: '12px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    marginBottom: '4px',
                }}>
                    INTERMEDIATE BLOCKS
                </span>
            </div>

            {/* Menus */}
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

            {/* Hardware Port Section (Styled for Premium Look) */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'rgba(0,0,0,0.2)',
                padding: '2px 8px',
                borderRadius: '8px',
                margin: '0 4px'
            }}>
                <button
                    onClick={onRefreshPorts}
                    title="Refresh Ports"
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        opacity: 0.8
                    }}
                >
                    <RotateCcw size={14} />
                </button>
                <select
                    value={selectedPort}
                    onChange={(e) => onPortSelect?.(e.target.value)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        fontSize: '12px',
                        outline: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        maxWidth: '120px'
                    }}
                >
                    <option value="" style={{ color: '#333' }}>
                        {ports.length === 0 ? 'No Ports Found' : 'Select Port'}
                    </option>
                    {ports.map(p => (
                        <option key={p.path} value={p.path} style={{ color: p.path === 'BRIDGE_DETECTED' ? '#E74C3C' : '#333' }}>
                            {p.path === 'BRIDGE_DETECTED' ? `⚠ Driver Needed: ${p.manufacturer}` : `${p.path} (${p.manufacturer || 'Unknown'})`}
                        </option>
                    ))}
                </select>
                <button
                    onClick={onConnect}
                    style={{
                        background: connectionStatus === 'connected' ? '#2ECC71' : 'rgba(255,255,255,0.15)',
                        border: 'none',
                        borderRadius: '6px',
                        color: 'white',
                        padding: '4px 10px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        marginLeft: '4px',
                        transition: 'all 0.2s'
                    }}
                >
                    {connectionStatus === 'connected' ? 'CONNECTED' : 'CONNECT'}
                </button>
            </div>

            {/* Upload Button - Only in Upload Mode */}
            {mode === 'upload' && (
                <button
                    onClick={onUpload}
                    disabled={isUploading}
                    style={{
                        background: isUploading ? '#999' : COLORS.accent,
                        border: 'none',
                        borderRadius: '17px',
                        color: isUploading ? '#fff' : '#000',
                        padding: '6px 20px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: isUploading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        transition: 'all 0.2s',
                        marginRight: '8px'
                    }}
                >
                    <Upload size={14} />
                    {isUploading ? 'UPLOADING...' : 'UPLOAD'}
                </button>
            )}

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Project Name */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '6px',
                padding: '0 12px',
            }}>
                <span style={{ marginRight: '8px', fontSize: '14px' }}>📁</span>
                <input
                    type="text"
                    value={projectName}
                    onChange={(e) => onProjectNameChange?.(e.target.value)}
                    onBlur={(e) => {
                        // Just an extra safety measure to ensure focus is lost
                        e.target.blur();
                    }}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: COLORS.text,
                        fontSize: '13px',
                        fontWeight: 500,
                        width: '150px',
                        outline: 'none',
                    }}
                    placeholder="Project Name"
                />
            </div>

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Connection Status */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginRight: '16px',
            }}>
                <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: connectionStatus === 'connected' ? '#2ECC71' : '#E74C3C',
                }} />
                <span style={{
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: '11px',
                }}>
                    {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
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
                    width: '32px',
                    height: '32px',
                    marginLeft: '8px',
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    color: COLORS.text,
                }}
            >
                <HelpCircle size={18} />
            </button>
        </div>
    );
}
