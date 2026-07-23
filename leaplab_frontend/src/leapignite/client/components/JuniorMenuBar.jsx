/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
    Home, File, FolderOpen, Save, Download, Share, Undo, Redo,
    Cpu, Zap, Play, Upload, HelpCircle, ChevronDown, Check, Menu as MenuIcon
} from 'lucide-react';

import Logo from '../../../components/Logo';
import LeapLabAuthButton from '../../../auth/LeapLabAuthButton';
import TopbarShareButton from '../../../components/common/TopbarShareButton';
import ProjectNameInput from '../../../components/common/ProjectNameInput';
import ModeToggle from './ModeToggle';
import ActionButton from '../../../components/common/ActionButton';
import DropdownMenu from './DropdownMenu';
import MobileDrawer from '../../../components/common/MobileDrawer';

export default function JuniorMenuBar({
    projectName = 'Untitled',
    onProjectNameChange,
    onFileAction,
    onUndo,
    canUndo = false,
    onRedo,
    canRedo = false,
    onBack,
    onDownload,
    onSave,
}) {
    const [openMenu, setOpenMenu] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showCreoleap, setShowCreoleap] = useState(window.innerWidth >= 1710);
    const [showDesktopMenus, setShowDesktopMenus] = useState(window.innerWidth >= 1100);

    useEffect(() => {
        const handleResize = () => {
            setShowCreoleap(window.innerWidth >= 1710);
            setShowDesktopMenus(window.innerWidth >= 1100);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleMenu = (menuName) => {
        setOpenMenu((prev) => (prev === menuName ? null : menuName));
    };

    const closeMenu = () => setOpenMenu(null);

    const editMenuItems = [
        { label: 'Undo', icon: Undo, shortcut: 'Ctrl+Z', disabled: !canUndo, onClick: () => onUndo?.() },
        { label: 'Redo', icon: Redo, shortcut: 'Ctrl+Y', disabled: !canRedo, onClick: () => onRedo?.() },
    ];

    return (
        <TopbarShareButton size={18} onSave={onSave} projectName={projectName}>
            {({ onClick: handleShareClick, loading: shareLoading }) => {
                const fileMenuItems = [
                    { label: 'New Project', icon: File, onClick: () => onFileAction?.('new') },
                    { label: 'Open Project', icon: FolderOpen, onClick: () => onFileAction?.('open') },
                    { divider: true },
                    { label: 'Save', icon: Save, onClick: () => onFileAction?.('save') },
                    { label: 'Download .leap', icon: Download, onClick: () => onDownload?.() },
                    { divider: true },
                    { label: 'Share', icon: Share, onClick: () => { closeMenu(); handleShareClick(); onFileAction?.('share to'); } },
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

                return (
                    <>
                    <div className="w-full bg-gradient-to-r from-[#0a0a1f] via-[#0a015a] to-[#080a25] border-b border-sky-400/10 h-[68px] px-3 flex items-center justify-between text-white select-none z-[100] relative font-sans shadow-[0_4px_20px_rgba(8,10,37,0.5),inset_0_-1px_0_rgba(255,255,255,0.06)]">
                        {/* ══ LEFT: Home button · Brand logo · Dropdown menus ══════════════ */}
                        <div className="flex items-center gap-2.5 shrink-0">
                            {/* Home icon button */}
                            <button
                                onClick={() => {
                                    sessionStorage.setItem('landingActiveTab', 'modules');
                                    sessionStorage.removeItem('myProjectsSelectedMode');
                                    onBack?.();
                                }}
                                title="Back to Home"
                                className="w-8.5 h-8.5 flex items-center justify-center bg-white/10 border border-white/12 rounded-xl text-white cursor-pointer transition-all duration-200 shrink-0 hover:bg-white/20 hover:scale-105"
                            >
                                <Home size={17} strokeWidth={2.2} />
                            </button>

                            {/* Divider */}
                            <div className="w-px h-7 bg-white/10 shrink-0" />

                            {/* Logo + brand label */}
                            <div className="flex items-center gap-2 shrink-0 drop-shadow-[0_0_12px_rgba(80,180,255,0.25)]">
                                <Logo height={48} />
                                <div className="text-white text-22px font-black tracking-tighter font-sans">
                                    IGNITE
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="w-px h-7 bg-white/10 shrink-0" />

                            {/* Menus */}
                            {showDesktopMenus && (
                                <div className="flex items-center gap-0.5">
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
                                </div>
                            )}
                        </div>

                        {/* ══ CENTER: Project name pill ════════════════════════════════════ */}
                        <div className="flex items-center justify-center px-3 overflow-hidden">
                            <ProjectNameInput
                                value={projectName}
                                onChange={(val) => onProjectNameChange?.(val)}
                                onSave={() => onFileAction?.('save')}
                            />
                        </div>

                        {/* ══ RIGHT: Ports · Toggle · Upload · CREOLEAP SVG ════════════════ */}
                        <div className="flex items-center gap-2.5 shrink-0 overflow-hidden max-w-full">
                            {showDesktopMenus ? (
                                <>
                                    {/* Divider */}
                                    <div className="w-px h-7 bg-white/10 shrink-0" />

                                    <button
                                        type="button"
                                        title="Share project"
                                        onClick={handleShareClick}
                                        disabled={shareLoading}
                                        className="bg-transparent border-none text-white/70 cursor-pointer p-1.5 px-2 rounded flex items-center transition-colors hover:text-white"
                                    >
                                        {shareLoading ? (
                                            <span className="inline-block rounded-full border-2 border-current border-t-transparent animate-spin w-4.5 h-4.5" />
                                        ) : (
                                            <Share size={18} strokeWidth={2.2} />
                                        )}
                                    </button>

                                    <LeapLabAuthButton variant="dark" size="sm" />

                                    {showCreoleap && (
                                        <div className="flex items-center shrink-0 pl-1 h-[60px] overflow-hidden">
                                            <img
                                                src="assets/logo-creoleap.png"
                                                alt="CREOLEAP"
                                                className="w-[145px] h-auto object-contain block shrink-0 drop-shadow-[0_0_20px_rgba(167,139,250,0.7)] drop-shadow-[0_0_8px_rgba(255,255,255,0.25)] drop-shadow-[0_3px_10px_rgba(0,0,0,0.5)] brightness-120 contrast-105"
                                            />
                                        </div>
                                    )}
                                </>
                            ) : (
                                <button
                                    onClick={() => setMobileMenuOpen(true)}
                                    className="flex items-center justify-center w-8.5 h-8.5 rounded-xl bg-white/10 border border-white/15 text-white cursor-pointer shrink-0 hover:bg-white/20"
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
                        <div className="text-[11px] font-bold uppercase tracking-wider opacity-50">File Operations</div>
                        {[
                            { label: 'New Project', icon: File, onClick: () => onFileAction?.('new') },
                            { label: 'Open Project', icon: FolderOpen, onClick: () => onFileAction?.('open') },
                            { label: 'Save', icon: Save, onClick: () => onFileAction?.('save') },
                            { label: 'Download .leap', icon: Download, onClick: () => onDownload?.() },
                            { label: 'Share', icon: Share, onClick: () => { setMobileMenuOpen(false); handleShareClick(); } },
                            {
                                label: 'My Projects', icon: FolderOpen,
                                onClick: () => {
                                    sessionStorage.setItem('landingActiveTab', 'my-projects');
                                    sessionStorage.setItem('myProjectsSelectedMode', 'junior');
                                    onBack?.();
                                }
                            },
                        ].map((item, i) => (
                            <button key={i} onClick={() => { item.onClick?.(); setMobileMenuOpen(false); }}
                                className="flex items-center gap-2.5 w-full px-2.5 py-2 border-none rounded-lg bg-transparent text-gray-200 text-[13px] font-medium cursor-pointer text-left transition-all hover:bg-white/10 hover:text-white"
                            >
                                {item.icon && <item.icon size={15} color="#a78bfa" strokeWidth={2} />}
                                {item.label}
                            </button>
                        ))}

                        <div className="h-px bg-white/10 my-1" />

                        <div className="text-[11px] font-bold uppercase tracking-wider opacity-50">Edit Operations</div>
                        {[
                            { label: 'Undo', icon: Undo, disabled: !canUndo, onClick: () => onUndo?.() },
                            { label: 'Redo', icon: Redo, disabled: !canRedo, onClick: () => onRedo?.() },
                        ].map((item, i) => (
                            <button key={i} disabled={item.disabled} onClick={() => { item.onClick?.(); setMobileMenuOpen(false); }}
                                className={`flex items-center gap-2.5 w-full px-2.5 py-2 border-none rounded-lg bg-transparent text-[13px] font-medium text-left transition-all ${item.disabled ? 'opacity-40 cursor-not-allowed text-gray-400' : 'cursor-pointer text-gray-200 hover:bg-white/10 hover:text-white'}`}
                            >
                                {item.icon && <item.icon size={15} color="#a78bfa" strokeWidth={2} />}
                                {item.label}
                            </button>
                        ))}

                        <div className="mt-auto flex flex-col gap-2 pt-4">
                            <LeapLabAuthButton variant="dark" size="sm" style={{ width: '100%', height: 34, borderRadius: '9999px', boxSizing: 'border-box' }} />
                        </div>
                    </MobileDrawer>
                    </>
                );
            }}
        </TopbarShareButton>
    );
}
