import React, { useState, useRef, useEffect } from 'react';
import {
    ChevronDown, File, FolderOpen, Save, Download,
    Undo, Redo, BookOpen, HelpCircle, Home
} from 'lucide-react';

// PictoBlox Junior-inspired purple color scheme
const COLORS = {
    menuBar: 'linear-gradient(180deg, #7B4FC4 0%, #5A2D82 100%)',
    menuHover: 'rgba(255,255,255,0.15)',
    menuActive: 'rgba(0,0,0,0.2)',
    text: '#FFFFFF',
    accent: '#FFD500',
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

// Junior MenuBar Component - Simplified for young children (no hardware)
export default function JuniorMenuBar({
    projectName = "My Project",
    onProjectNameChange,
    onFileAction,
    onEditAction,
    onBack,
}) {
    const [openMenu, setOpenMenu] = useState(null);

    const toggleMenu = (menu) => {
        setOpenMenu(openMenu === menu ? null : menu);
    };

    const closeMenu = () => setOpenMenu(null);

    // Menu definitions - simplified for Junior
    const fileMenuItems = [
        { label: 'New Project', icon: File, onClick: () => onFileAction?.('new') },
        { label: 'Open Project', icon: FolderOpen, onClick: () => onFileAction?.('open') },
        { divider: true },
        { label: 'Save', icon: Save, onClick: () => onFileAction?.('save') },
        { label: 'Save As...', icon: Download, onClick: () => onFileAction?.('save_as') },
    ];

    const editMenuItems = [
        { label: 'Undo', icon: Undo, onClick: () => onEditAction?.('undo') },
        { label: 'Redo', icon: Redo, onClick: () => onEditAction?.('redo') },
    ];

    const tutorialsMenuItems = [
        { label: 'Getting Started', icon: BookOpen, onClick: () => alert('Tutorial coming soon!') },
        { label: 'Move the Bear', icon: BookOpen, onClick: () => alert('Tutorial coming soon!') },
        { label: 'Make Sounds', icon: BookOpen, onClick: () => alert('Tutorial coming soon!') },
    ];

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            height: '48px',
            background: COLORS.menuBar,
            padding: '0 12px',
            gap: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 100,
        }}>
            {/* Home Button */}
            <button
                onClick={onBack}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '36px',
                    height: '36px',
                    background: 'rgba(255,255,255,0.15)',
                    border: 'none',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    color: COLORS.text,
                    marginRight: '8px',
                }}
                title="Back to Home"
            >
                <Home size={20} />
            </button>

            {/* Logo */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginRight: '16px',
            }}>
                <span style={{ fontSize: '24px' }}>🚀</span>
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                    <span style={{
                        color: COLORS.text,
                        fontSize: '14px',
                        fontWeight: 700,
                    }}>
                        LeapBlocks
                    </span>
                    <span style={{
                        color: 'rgba(255,255,255,0.7)',
                        fontSize: '10px',
                        fontWeight: 500,
                    }}>
                        Junior
                    </span>
                </div>
            </div>

            {/* Menus - Only File, Edit, Tutorials for Junior */}
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
                label="Tutorials"
                icon={BookOpen}
                items={tutorialsMenuItems}
                isOpen={openMenu === 'tutorials'}
                onToggle={() => toggleMenu('tutorials')}
                onClose={closeMenu}
            />

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Project Name - centered */}
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
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: COLORS.text,
                        fontSize: '13px',
                        fontWeight: 500,
                        width: '140px',
                        outline: 'none',
                    }}
                    placeholder="My Project"
                />
            </div>

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Help Button */}
            <button
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '36px',
                    height: '36px',
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    color: COLORS.text,
                }}
                title="Help"
            >
                <HelpCircle size={20} />
            </button>
        </div>
    );
}
