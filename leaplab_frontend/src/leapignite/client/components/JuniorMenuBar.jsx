/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useRef, useEffect } from 'react';
import {
    ChevronDown, File, FolderOpen, Save, Download,
    Undo, Redo, BookOpen, HelpCircle, Home,
    MessageSquareWarning, Trophy, Settings,
    Share
} from 'lucide-react';
import Logo, { CreoleapLogo } from '../../../components/Logo';

// ═══════════════════════════════════════════════════════════════════════════
// DROPDOWN MENU — Glassmorphism + slide-in animation (same design as Intermediate)
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
                    gap: 5,
                    padding: '6px 12px',
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
                }}
                onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = isOpen ? 'rgba(255,255,255,0.18)' : 'transparent'; }}
            >
                {Icon && <Icon size={14} strokeWidth={2.2} style={{ opacity: 0.9 }} />}
                {label}
                <ChevronDown
                    size={12}
                    strokeWidth={2.5}
                    style={{
                        opacity: 0.5,
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
                    animation: 'jrMenuSlideIn 0.18s ease-out',
                }}>
                    <style>{`
                        @keyframes jrMenuSlideIn {
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
                                    fontSize: 15,
                                    fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                                    fontWeight: 500,
                                    textAlign: 'left',
                                    cursor: item.disabled ? 'not-allowed' : 'pointer',
                                    color: item.disabled ? '#bbb' : '#374151',
                                    transition: 'all 0.12s ease',
                                    borderRadius: 0,
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
// JUNIOR MENUBAR — Simplified for young children (no hardware)
// ═══════════════════════════════════════════════════════════════════════════
export default function JuniorMenuBar({
    projectName = "My Project",
    onProjectNameChange,
    onFileAction,
    onEditAction,
    onTutorialStart,
    onBack,
}) {
    const [openMenu, setOpenMenu] = useState(null);

    const toggleMenu = (menu) => {
        setOpenMenu(openMenu === menu ? null : menu);
    };

    const closeMenu = () => setOpenMenu(null);

    const fileMenuItems = [
        { label: 'New Project', icon: File, onClick: () => onFileAction?.('new') },
        { label: 'Open Project', icon: FolderOpen, onClick: () => onFileAction?.('open') },
        { divider: true },
        { label: 'Save', icon: Save, onClick: () => onFileAction?.('save') },
        { label: 'Share', icon: Share, onClick: () => onFileAction?.('share to') },
    ];

    const editMenuItems = [
        { label: 'Undo', icon: Undo, onClick: () => onEditAction?.('undo') },
        { label: 'Redo', icon: Redo, onClick: () => onEditAction?.('redo') },
    ];

    const tutorialsMenuItems = [
        { label: 'Getting Started', icon: BookOpen, onClick: () => onTutorialStart?.('getting_started') },
        { label: 'Move the Robo', icon: BookOpen, onClick: () => onTutorialStart?.('move_robo') },
        { label: 'Make Sounds', icon: BookOpen, onClick: () => onTutorialStart?.('make_sounds') },
    ];

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 64,
            padding: '0 18px',
            background: 'linear-gradient(135deg, #0a015a 0%, #080a25 100%)',
            boxShadow: '0 4px 20px rgba(8,10,37,0.45), inset 0 -1px 0 rgba(255,255,255,0.06)',
            zIndex: 100,
            borderBottom: '1px solid rgba(100,180,255,0.1)',
        }}>

            {/* LEFT SECTION: Home, Logo, Menus */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                <button
                    onClick={onBack}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 40,
                        height: 40,
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 12,
                        color: '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
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
                    <Home size={20} strokeWidth={2.2} />
                </button>

                <div style={{ height: 32, width: 1, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginRight: 14,
                    flexShrink: 0,
                    filter: 'drop-shadow(0 0 14px rgba(80,200,255,0.3)) drop-shadow(0 2px 6px rgba(0,0,0,0.3))',
                }}>
                    <Logo height={52} />
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        marginLeft: 10,
                        lineHeight: 1.1,
                    }}>
                        <span style={{
                            color: '#fff',
                            fontSize: 16,
                            fontWeight: 900,
                            letterSpacing: '0.08em',
                            fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                        }}>IGNITE</span>
                    </div>
                </div>

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
                        label="Tutorials"
                        icon={BookOpen}
                        items={tutorialsMenuItems}
                        isOpen={openMenu === 'tutorials'}
                        onToggle={() => toggleMenu('tutorials')}
                        onClose={closeMenu}
                    />
                </div>
            </div>

            {/* CENTER SECTION: Project Name + Save */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: 40,
                    background: 'rgba(0,0,0,0.25)',
                    borderRadius: 20,
                    paddingLeft: 18,
                    paddingRight: 5,
                    border: '1px solid rgba(255,255,255,0.08)',
                    gap: 8,
                    transition: 'all 0.2s ease',
                }}>
                    <span style={{ fontSize: 14, opacity: 0.45 }}>📁</span>
                    <input
                        type="text"
                        value={projectName}
                        onChange={(e) => onProjectNameChange?.(e.target.value)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#fff',
                            fontSize: 14,
                            fontWeight: 700,
                            fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                            width: 170,
                            textAlign: 'center',
                            outline: 'none',
                            letterSpacing: '0.01em',
                        }}
                        placeholder="My Project"
                    />
                    <button
                        onClick={() => onFileAction?.('save')}
                        style={{
                            background: 'linear-gradient(135deg, #10B981, #059669)',
                            border: 'none',
                            borderRadius: '50%',
                            width: 30,
                            height: 30,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#fff',
                            boxShadow: '0 2px 6px rgba(16,185,129,0.3)',
                            transition: 'all 0.15s ease',
                            flexShrink: 0,
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        title="Save Project"
                    >
                        <Save size={15} strokeWidth={2.8} />
                    </button>
                </div>
            </div>

            {/* RIGHT SECTION: Utilities, Profile, CREOLEAP Logo */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 20, flex: 1, minWidth: 0 }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    paddingRight: 16,
                    borderRight: '1px solid rgba(255,255,255,0.1)',
                    height: 32,
                    flexShrink: 0,
                }}>
                    {[
                        { Icon: MessageSquareWarning, title: 'Feedback' },
                        { Icon: Trophy, title: 'Achievements' },
                        { Icon: Settings, title: 'Settings' },
                        { Icon: HelpCircle, title: 'Help' },
                    ].map(({ Icon, title }) => (
                        <button
                            key={title}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'rgba(255,255,255,0.55)',
                                cursor: 'pointer',
                                padding: 0,
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.color = '#fff';
                                e.currentTarget.style.transform = 'scale(1.15)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.color = 'rgba(255,255,255,0.55)';
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                            title={title}
                        >
                            <Icon size={20} strokeWidth={2.2} />
                        </button>
                    ))}
                </div>


                {/* CREOLEAP Right Logo — Premium Fit */}
                <div style={{
                    marginLeft: 14,
                    display: 'flex',
                    alignItems: 'center',
                    flexShrink: 0,
                    filter: 'drop-shadow(0 0 14px rgba(255,255,255,0.15)) drop-shadow(0 2px 8px rgba(0,0,0,0.4))',
                }}>
                    <CreoleapLogo height={160} />
                </div>
            </div>
        </div>
    );
}
