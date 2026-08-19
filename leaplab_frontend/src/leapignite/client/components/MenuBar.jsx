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
import PortsControl from './PortsControl';
import MobileDrawer from '../../../components/common/MobileDrawer';

export default function MenuBar({
    projectName = 'Untitled',
    onProjectNameChange,
    board = 'arduino_uno',
    boardName = 'Arduino Uno',
    onBoardChange,
    onOpenBoardModal,
    mode = 'stage',
    onModeChange,
    ports = [],
    selectedPort = '',
    onPortSelect,
    onRefreshPorts,
    onConnect,
    isConnected = false,
    onUpload,
    isUploading = false,
    onFileAction,
    onEditAction,
    onUndo = () => {},
    canUndo = false,
    onRedo = () => {},
    canRedo = false,
    onBack,
    onDownload,
    onSave,
}) {
    const [openMenu, setOpenMenu] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1920);

    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Progressive collapse breakpoints from 1800px down to prevent any element overlap:
    const showBoardSelect = windowWidth >= 1720;
    const showPorts = windowWidth >= 1680;
    const showAuthAndShare = windowWidth >= 1600;
    const showModeAndUpload = windowWidth >= 1350;
    const showFileEditMenus = windowWidth >= 900;
    const showHamburgerBtn = windowWidth < 1500;

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
                    { label: 'New Project', icon: File, shortcut: 'Ctrl+N', onClick: () => onFileAction?.('new') },
                    { label: 'Open Project', icon: FolderOpen, shortcut: 'Ctrl+O', onClick: () => onFileAction?.('open') },
                    { divider: true },
                    { label: 'Save', icon: Save, shortcut: 'Ctrl+S', onClick: () => onFileAction?.('save') },
                    { label: 'Download .leap', icon: Download, onClick: () => onDownload?.() },
                    { divider: true },
                    { label: 'Share', icon: Share, onClick: () => { closeMenu(); handleShareClick(); onFileAction?.('share'); } },
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

                return (
                    <>
                    <div className="w-full bg-gradient-to-r from-[#0a0a1f] via-[#0a015a] to-[#080a25] border-b border-sky-400/10 h-[68px] px-3 sm:px-6 flex items-center justify-between text-white select-none z-[100] relative font-sans shadow-[0_4px_20px_rgba(8,10,37,0.5),inset_0_-1px_0_rgba(255,255,255,0.06)] gap-2">
                        {/* ══ LEFT: Home button · Brand logo · Dropdown menus ══════════════ */}
                        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">

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
                            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 min-w-0 drop-shadow-[0_0_12px_rgba(80,180,255,0.25)]">
                                <Logo height={48} className="w-auto" />
                                <div className="hidden sm:block text-white text-[18px] sm:text-[20px] lg:text-[22px] font-black tracking-[0.08em] font-sans whitespace-nowrap">
                                    EMBED
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="w-px h-7 bg-white/10 shrink-0" />

                            {/* Menus — progressively collapses into hamburger menu below 1800px */}
                            {(showFileEditMenus || showBoardSelect) && (
                                <div className="flex items-center gap-0.5">
                                    {showFileEditMenus && (
                                        <>
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
                                        </>
                                    )}
                                    {showBoardSelect && mode !== 'stage' && (
                                        <button
                                            onClick={onOpenBoardModal}
                                            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-white text-sm font-semibold rounded-full transition-all tracking-wide cursor-pointer bg-transparent hover:bg-white/10"
                                            title="Select board"
                                        >
                                            <Cpu size={16} strokeWidth={2.2} className="opacity-90" />
                                            <span>{boardName}</span>
                                            <ChevronDown size={14} strokeWidth={2.5} className="opacity-50" />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* ══ CENTER: Project name pill ════════════════════════════════════ */}
                        <div className="flex items-center justify-center px-2 shrink min-w-0">
                            <ProjectNameInput
                                value={projectName}
                                onChange={(val) => onProjectNameChange?.(val)}
                                onSave={() => onFileAction?.('save')}
                            />
                        </div>

                        {/* ══ RIGHT: Ports · Toggle · Upload · CREOLEAP SVG · Hamburger ════════ */}
                        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                            {/* Ports pill — only in upload mode when showPorts is true */}
                            {showPorts && mode === 'upload' && (
                                <PortsControl
                                    ports={ports}
                                    selectedPort={selectedPort}
                                    onPortSelect={onPortSelect}
                                    onRefreshPorts={onRefreshPorts}
                                    onConnect={onConnect}
                                    isConnected={isConnected}
                                />
                            )}

                            {/* Stage / Upload mode toggle & Upload Button */}
                            {showModeAndUpload && (
                                <>
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
                                </>
                            )}

                            {/* Share & Auth buttons */}
                            {showAuthAndShare && (
                                <>
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
                                </>
                            )}

                            {/* Creoleap Logo image */}
                            <div className="hidden min-[1500px]:flex ml-2 items-center shrink-0 h-12 overflow-hidden filter drop-shadow-[0_0_20px_rgba(167,139,250,0.7)] drop-shadow-[0_0_8px_rgba(255,255,255,0.25)] drop-shadow-[0_3px_10px_rgba(0,0,0,0.5)]">
                                <img
                                    src="assets/logo-creoleap.png"
                                    alt="CREOLEAP"
                                    className="w-[145px] h-auto object-contain block shrink-0 brightness-[1.14] contrast-[1.05]"
                                />
                            </div>

                            {/* Hamburger Menu Icon Button when windowWidth < 1800px */}
                            {showHamburgerBtn && (
                                <button
                                    onClick={() => setMobileMenuOpen(true)}
                                    title="Menu options"
                                    className="flex items-center justify-center w-8.5 h-8.5 rounded-xl bg-white/10 border border-white/15 text-white cursor-pointer shrink-0 hover:bg-white/20 ml-1"
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
                        {!showFileEditMenus && (
                            <>
                                <div className="text-[11px] font-bold uppercase tracking-wider opacity-50 mb-1">File Operations</div>
                                {[
                                    { label: 'New Project', icon: File, onClick: () => onFileAction?.('new') },
                                    { label: 'Open Project', icon: FolderOpen, onClick: () => onFileAction?.('open') },
                                    { label: 'Save', icon: Save, onClick: () => onFileAction?.('save') },
                                    { label: 'Download .leap', icon: Download, onClick: () => onDownload?.() },
                                    {
                                        label: 'My Projects', icon: FolderOpen,
                                        onClick: () => {
                                            sessionStorage.setItem('landingActiveTab', 'my-projects');
                                            sessionStorage.setItem('myProjectsSelectedMode', 'intermediate');
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

                                <div className="h-px bg-white/10 my-2" />

                                <div className="text-[11px] font-bold uppercase tracking-wider opacity-50 mb-1">Edit Operations</div>
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
                                <div className="h-px bg-white/10 my-2" />
                            </>
                        )}

                        {!showBoardSelect && mode !== 'stage' && (
                            <>
                                <div className="text-[11px] font-bold uppercase tracking-wider opacity-50 mb-1">Board Selection</div>
                                <button onClick={() => { setMobileMenuOpen(false); onOpenBoardModal?.(); }}
                                    className="flex items-center gap-2.5 w-full px-2.5 py-2 border-none rounded-lg text-[13px] font-medium cursor-pointer text-left transition-all bg-transparent text-gray-200 hover:bg-white/10 hover:text-white mb-2"
                                >
                                    <Cpu size={15} color="#a78bfa" strokeWidth={2} />
                                    <span className="flex-1">Select Board</span>
                                    <span className="text-xs text-sky-300 font-semibold">{boardName}</span>
                                </button>
                                <div className="h-px bg-white/10 my-2" />
                            </>
                        )}

                        {!showModeAndUpload && (
                            <>
                                <div className="text-[11px] font-bold uppercase tracking-wider opacity-50 mb-1">Actions</div>
                                <ModeToggle mode={mode} onModeChange={onModeChange} />
                                <div className="h-px bg-white/10 my-2" />
                            </>
                        )}

                        {mode === 'upload' && (
                            <>
                                {!showPorts && (
                                    <PortsControl
                                        ports={ports}
                                        selectedPort={selectedPort}
                                        onPortSelect={onPortSelect}
                                        onRefreshPorts={onRefreshPorts}
                                        onConnect={onConnect}
                                        isConnected={isConnected}
                                    />
                                )}
                                {!showModeAndUpload && (
                                    <ActionButton
                                        variant="warning"
                                        icon={<Upload size={13} strokeWidth={2.5} />}
                                        label={isUploading ? 'Uploading…' : 'UPLOAD'}
                                        onClick={() => { onUpload?.(); setMobileMenuOpen(false); }}
                                        disabled={isUploading}
                                        loading={isUploading}
                                        title="Upload to board"
                                    />
                                )}
                                <div className="h-px bg-white/10 my-2" />
                            </>
                        )}

                        {!showAuthAndShare && (
                            <>
                                <button
                                    onClick={() => { setMobileMenuOpen(false); handleShareClick(); }}
                                    disabled={shareLoading}
                                    className="flex items-center gap-2.5 w-full p-2 px-2.5 border-none rounded-lg bg-transparent text-gray-200 text-[13px] font-medium cursor-pointer text-left transition-all hover:bg-white/10 hover:text-white mb-2"
                                >
                                    <Share size={15} color="#a78bfa" strokeWidth={2} />
                                    Share Project
                                </button>

                                <div className="mt-auto flex flex-col gap-2 pt-3 border-t border-white/10">
                                    <LeapLabAuthButton variant="dark" size="sm" style={{ width: '100%', height: 34, borderRadius: '9999px', boxSizing: 'border-box' }} />
                                </div>
                            </>
                        )}
                    </MobileDrawer>
                    </>
                );
            }}
        </TopbarShareButton>
    );
}