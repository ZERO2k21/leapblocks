/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useEffect } from 'react';
import {
    File, FolderOpen, Save, Download,
    Undo, Redo, BookOpen, HelpCircle, Home,
    MessageSquareWarning, Trophy, Settings,
    Share, Share2
} from 'lucide-react';
import Logo, { CreoleapLogo } from '../../../components/Logo';
import LeapLabAuthButton from '../../../auth/LeapLabAuthButton';
import TopbarShareButton from '../../../components/common/TopbarShareButton';
import DropdownMenu from './DropdownMenu';

// ── Style Constants ────────────────────────────────────────────────────────
const BAR_STYLE = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64,
    padding: '0 18px',
    background: 'linear-gradient(135deg, #0a015a 0%, #080a25 100%)',
    boxShadow: '0 4px 20px rgba(8,10,37,0.45), inset 0 -1px 0 rgba(255,255,255,0.06)',
    zIndex: 100,
    borderBottom: '1px solid rgba(100,180,255,0.1)',
};

const HOME_BUTTON_STYLE = {
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
};

const SEPARATOR_STYLE = { height: 32, width: 1, background: 'rgba(255,255,255,0.1)', flexShrink: 0 };

const LOGO_WRAPPER_STYLE = {
    display: 'flex',
    alignItems: 'center',
    marginRight: 14,
    flexShrink: 0,
    filter: 'drop-shadow(0 0 14px rgba(80,200,255,0.3)) drop-shadow(0 2px 6px rgba(0,0,0,0.3))',
};

const LOGO_TEXT_STYLE = {
    color: '#fff',
    fontSize: 16,
    fontWeight: 900,
    letterSpacing: '0.08em',
    fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
};

const PROJECT_WRAPPER_STYLE = {
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
};

const PROJECT_INPUT_STYLE = {
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
};

const SAVE_BTN_STYLE = {
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
};

const UTILITY_GROUP_STYLE = {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    paddingRight: 16,
    borderRight: '1px solid rgba(255,255,255,0.1)',
    height: 32,
    flexShrink: 0,
};

const UTILITY_BTN_STYLE = {
    background: 'transparent',
    border: 'none',
    color: 'rgba(255,255,255,0.55)',
    cursor: 'pointer',
    padding: 0,
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
};

const CREOLEAP_WRAPPER_STYLE = {
    marginLeft: 14,
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
    height: '44px',
    overflow: 'hidden',
    filter: 'drop-shadow(0 0 14px rgba(255,255,255,0.15)) drop-shadow(0 2px 8px rgba(0,0,0,0.4))',
};

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

    const toggleMenu = (menu) => {
        setOpenMenu(openMenu === menu ? null : menu);
    };

    const closeMenu = () => setOpenMenu(null);

    const fileMenuItems = [
        { label: 'New Project', icon: File, onClick: () => onFileAction?.('new') },
        { label: 'Open Project', icon: FolderOpen, onClick: () => onFileAction?.('open') },
        { divider: true },
        { label: 'Save', icon: Save, onClick: () => onFileAction?.('save') },
        { label: 'Download .leap', icon: Download, onClick: () => onDownload?.() },
        { divider: true },
        { label: 'Share', icon: Share, onClick: () => onFileAction?.('share to') },
        { divider: true },
        {
            label: 'My Projects',
            icon: FolderOpen,
            onClick: () => {
                sessionStorage.setItem('landingActiveTab', 'my-projects');
                sessionStorage.setItem('myProjectsSelectedMode', 'junior');
                onBack?.();
            }
        },
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

    const renderLeftSection = () => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
            <button
                onClick={() => {
                    sessionStorage.setItem('landingActiveTab', 'modules');
                    sessionStorage.removeItem('myProjectsSelectedMode');
                    onBack?.();
                }}
                style={HOME_BUTTON_STYLE}
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

            <div style={SEPARATOR_STYLE} />

            <div style={LOGO_WRAPPER_STYLE}>
                <Logo height={48} />
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    marginLeft: 10,
                    lineHeight: 1.1,
                }}>
                    <span style={LOGO_TEXT_STYLE}>IGNITE</span>
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
    );

    const renderCenterSection = () => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
            <div style={PROJECT_WRAPPER_STYLE}>
                <span style={{ fontSize: 14, opacity: 0.45 }}>📁</span>
                <input
                    type="text"
                    value={projectName}
                    onChange={(e) => onProjectNameChange?.(e.target.value)}
                    style={PROJECT_INPUT_STYLE}
                    placeholder="My Project"
                />
                <button
                    onClick={() => onFileAction?.('save')}
                    style={SAVE_BTN_STYLE}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    title="Save Project"
                >
                    <Save size={15} strokeWidth={2.8} />
                </button>
            </div>
        </div>
    );

    const renderRightSection = () => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 20, flex: 1, minWidth: 0 }}>
            <div style={UTILITY_GROUP_STYLE}>
                <TopbarShareButton size={20} onSave={onSave} projectName={projectName}>
                    {({ onClick, loading }) => (
                        <button
                            style={UTILITY_BTN_STYLE}
                            onMouseEnter={e => {
                                e.currentTarget.style.color = '#fff';
                                e.currentTarget.style.transform = 'scale(1.15)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.color = 'rgba(255,255,255,0.55)';
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                            onClick={onClick}
                            disabled={loading}
                            title="Share project"
                        >
                            <Share2 size={20} strokeWidth={2.2} />
                        </button>
                    )}
                </TopbarShareButton>
                {[
                    { Icon: MessageSquareWarning, title: 'Feedback' },
                    { Icon: Trophy, title: 'Achievements' },
                    { Icon: Settings, title: 'Settings' },
                    { Icon: HelpCircle, title: 'Help' },
                ].map(({ Icon, title }) => (
                    <button
                        key={title}
                        style={UTILITY_BTN_STYLE}
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

            <LeapLabAuthButton variant="dark" size="sm" style={{ height: '32px', borderRadius: '16px', boxSizing: 'border-box' }} />

            {showCreoleap && (
                <div style={CREOLEAP_WRAPPER_STYLE}>
                    <img
                        src="assets/logo-creoleap.png"
                        alt="CREOLEAP"
                        style={{
                            width: '145px',
                            height: 'auto',
                            objectFit: 'contain',
                            display: 'block',
                            flexShrink: 0,
                            filter: 'brightness(1.2) contrast(1.06)',
                        }}
                    />
                </div>
            )}
        </div>
    );

    return (
        <div style={BAR_STYLE}>
            {renderLeftSection()}
            {renderCenterSection()}
            {renderRightSection()}
        </div>
    );
}
