/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
    File, FolderOpen, Save, Download,
    Undo, Redo, BookOpen, Home,
    Share, Share2, Menu as MenuIcon
} from 'lucide-react';
import Logo, { CreoleapLogo } from '../../../components/Logo';
import LeapLabAuthButton from '../../../auth/LeapLabAuthButton';
import TopbarShareButton from '../../../components/common/TopbarShareButton';
import ProjectNameInput from '../../../components/common/ProjectNameInput';
import { useWindowWidth } from '../../../hooks/useWindowWidth';
import MobileDrawer from '../../../components/common/MobileDrawer';
import DropdownMenu from './DropdownMenu';

const styles = {
    bar: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 68,
        padding: '0 28px',
        background: 'linear-gradient(135deg, #0a015a 0%, #0f0b3a 50%, #080a25 100%)',
        boxShadow: '0 4px 24px rgba(8,10,37,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
        zIndex: 100,
        borderBottom: '1px solid rgba(120,160,255,0.08)',
    },
    homeBtn: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        color: 'rgba(255,255,255,0.8)',
        cursor: 'pointer',
        transition: 'all 0.2s',
        flexShrink: 0,
    },
    separator: { height: 32, width: 1, background: 'rgba(255,255,255,0.08)', flexShrink: 0 },
    logoWrapper: {
        display: 'flex',
        alignItems: 'center',
        marginRight: 14,
        flexShrink: 0,
    },
    logoText: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 900,
        letterSpacing: '0.08em',
        fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
    },

    utilityGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        paddingRight: 20,
        borderRight: '1px solid rgba(255,255,255,0.08)',
        height: 32,
        flexShrink: 0,
    },
    utilityBtn: {
        background: 'transparent',
        border: 'none',
        color: 'rgba(255,255,255,0.45)',
        cursor: 'pointer',
        padding: 0,
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
    },
    creoleapWrapper: {
        marginLeft: 16,
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
        height: 44,
        overflow: 'hidden',
    },
    menuBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        padding: '7px 14px',
        border: 'none',
        color: 'rgba(255,255,255,0.85)',
        fontSize: 13,
        fontWeight: 600,
        fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
        cursor: 'pointer',
        borderRadius: 20,
        transition: 'all 0.2s',
        background: 'transparent',
        letterSpacing: '0.02em',
    },
};

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

    const toggleMenu = (menu) => setOpenMenu(openMenu === menu ? null : menu);
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
            label: 'My Projects', icon: FolderOpen,
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
            <button
                onClick={() => {
                    sessionStorage.setItem('landingActiveTab', 'modules');
                    sessionStorage.removeItem('myProjectsSelectedMode');
                    onBack?.();
                }}
                style={styles.homeBtn}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
                title="Back to Home"
            >
                <Home size={20} strokeWidth={2.2} />
            </button>

            <div style={styles.separator} />

            <div style={styles.logoWrapper}>
                <Logo height={48} />
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', marginLeft: 12, lineHeight: 1.1 }}>
                    <span style={styles.logoText}>IGNITE</span>
                </div>
            </div>

            <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />

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
                        label="Tutorials"
                        icon={BookOpen}
                        items={tutorialsMenuItems}
                        isOpen={openMenu === 'tutorials'}
                        onToggle={() => toggleMenu('tutorials')}
                        onClose={closeMenu}
                    />
                </div>
            )}
        </div>
    );

    const renderCenterSection = () => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
            <ProjectNameInput
                value={projectName}
                onChange={(val) => onProjectNameChange?.(val)}
                onSave={() => onFileAction?.('save')}
            />
        </div>
    );

    const renderRightSection = () => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 20, flex: 1, minWidth: 0 }}>
            {showDesktopMenus ? (
                <>
                    <div style={styles.utilityGroup}>
                        <TopbarShareButton size={20} onSave={onSave} projectName={projectName}>
                            {({ onClick, loading }) => (
                                <button
                                    style={styles.utilityBtn}
                                    onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'scale(1.15)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; e.currentTarget.style.transform = 'scale(1)'; }}
                                    onClick={onClick}
                                    disabled={loading}
                                    title="Share project"
                                >
                                    <Share2 size={20} strokeWidth={2.2} />
                                </button>
                            )}
                        </TopbarShareButton>
                    </div>

                    <LeapLabAuthButton variant="dark" size="sm" style={{ height: '34px', borderRadius: '18px', boxSizing: 'border-box' }} />

                    {showCreoleap && (
                        <div style={styles.creoleapWrapper}>
                            <img
                                src="assets/logo-creoleap.png"
                                alt="CREOLEAP"
                                style={{
                                    width: '150px',
                                    height: 'auto',
                                    objectFit: 'contain',
                                    display: 'block',
                                    flexShrink: 0,
                                    opacity: 0.9,
                                    filter: 'brightness(1.1) contrast(1.04)',
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
                        width: 40, height: 40, borderRadius: 12,
                        background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)',
                        color: 'rgba(255,255,255,0.8)', cursor: 'pointer', flexShrink: 0,
                    }}
                >
                    <MenuIcon size={20} strokeWidth={2.2} />
                </button>
            )}
        </div>
    );

    return (
        <div style={styles.bar}>
            {renderLeftSection()}
            {renderCenterSection()}
            {renderRightSection()}

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

                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.5 }}>Tutorials</div>
                {tutorialsMenuItems.map((item, idx) => (
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

                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.5 }}>Utilities</div>
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
                            <Share2 size={15} color="#a78bfa" strokeWidth={2} />
                            Share
                        </button>
                    )}
                </TopbarShareButton>

                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <LeapLabAuthButton variant="dark" size="sm" style={{ width: '100%', height: '34px', borderRadius: '18px', boxSizing: 'border-box' }} />
                </div>
            </MobileDrawer>
        </div>
    );
}
