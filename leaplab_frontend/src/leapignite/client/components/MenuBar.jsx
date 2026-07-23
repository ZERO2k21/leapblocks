/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
    File, FolderOpen, Save, Share, Download,
    Undo, Redo, Cpu, Home, Upload, Menu as MenuIcon
} from 'lucide-react';
import Logo from '../../../components/Logo';
import LeapLabAuthButton from '../../../auth/LeapLabAuthButton';
import TopbarShareButton from '../../../components/common/TopbarShareButton';
import ProjectNameInput from '../../../components/common/ProjectNameInput';
import ActionButton from '../../../components/common/ActionButton';
import { useWindowWidth } from '../../../hooks/useWindowWidth';
import MobileDrawer from '../../../components/common/MobileDrawer';
import DropdownMenu from './DropdownMenu';
import ModeToggle from './ModeToggle';
import PortsControl from './PortsControl';

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
    const [showCreoleap, setShowCreoleap] = useState(window.innerWidth >= 1760);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const mobileMenuRef = useRef(null);
    const windowWidth = useWindowWidth();
    const rightSideRef = useRef(null);

    // Upload mode has more right-side items, so use a higher breakpoint
    const desktopBreakpoint = mode === 'upload' ? 1760 : 1400;
    const showDesktopMenus = windowWidth >= desktopBreakpoint;

    useEffect(() => {
        const handleResize = () => setShowCreoleap(window.innerWidth >= 1760);
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
        <>
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center h-[56px] px-4 gap-2 bg-gradient-to-r from-[#0a0a1f] via-[#0a015a] to-[#080a25] shadow-[0_4px_20px_rgba(8,10,37,0.5),inset_0_-1px_0_rgba(255,255,255,0.06)] border-b border-sky-400/10 z-[100] shrink-0">

            {/* ══ LEFT: Home · Logo · "EMBED" · Menus ══════════════════════════ */}
            <div className="flex items-center gap-2.5">

                {/* Home button */}
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
                        EMBED
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
                        <DropdownMenu
                            label="Board"
                            icon={Cpu}
                            items={boardMenuItems}
                            isOpen={openMenu === 'board'}
                            onToggle={() => toggleMenu('board')}
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
            <div ref={rightSideRef} className="flex items-center gap-2.5 shrink-0 overflow-hidden max-w-full">

                {showDesktopMenus ? (
                    <>
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


                        {/* Divider */}
                        <div className="w-px h-7 bg-white/10 shrink-0" />

                        <TopbarShareButton
                            className="bg-transparent border-none text-white/70 cursor-pointer p-1.5 px-2 rounded flex items-center transition-colors hover:text-white"
                            size={18}
                            onSave={onSave}
                            projectName={projectName}
                        />

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
            {fileMenuItems.map((item, idx) =>
                item.divider ? (
                    <div key={idx} className="h-px bg-white/10 my-1" />
                ) : (
                    <button
                        key={idx}
                        onClick={() => { item.onClick?.(); setMobileMenuOpen(false); }}
                        className="flex items-center gap-2.5 w-full p-2 px-2.5 border-none rounded-lg bg-transparent text-gray-200 text-[13px] font-medium cursor-pointer text-left transition-all hover:bg-purple-600/25 hover:text-white"
                    >
                        {item.icon && <item.icon size={15} color="#a78bfa" strokeWidth={2} />}
                        {item.label}
                    </button>
                )
            )}

            <div className="h-px bg-white/10 my-1" />

            <div className="text-[11px] font-bold uppercase tracking-wider opacity-50">Edit Operations</div>
            {editMenuItems.map((item, idx) => (
                <button
                    key={idx}
                    onClick={() => { item.onClick?.(); setMobileMenuOpen(false); }}
                    className="flex items-center gap-2.5 w-full p-2 px-2.5 border-none rounded-lg bg-transparent text-gray-200 text-[13px] font-medium cursor-pointer text-left transition-all hover:bg-purple-600/25 hover:text-white"
                >
                    {item.icon && <item.icon size={15} color="#a78bfa" strokeWidth={2} />}
                    {item.label}
                </button>
            ))}

            <div className="h-px bg-white/10 my-1" />

            <div className="text-[11px] font-bold uppercase tracking-wider opacity-50">Board</div>
            {boardMenuItems.map((item, idx) =>
                item.divider ? (
                    <div key={idx} className="h-px bg-white/10 my-1" />
                ) : (
                    <button
                        key={idx}
                        onClick={() => { !item.disabled && item.onClick?.(); setMobileMenuOpen(false); }}
                        disabled={item.disabled}
                        className="flex items-center gap-2.5 w-full p-2 px-2.5 border-none rounded-lg bg-transparent text-gray-200 text-[13px] font-medium cursor-pointer text-left transition-all hover:bg-purple-600/25 hover:text-white disabled:cursor-not-allowed disabled:text-gray-600"
                    >
                        {item.icon && <item.icon size={15} color="#a78bfa" strokeWidth={2} />}
                        {item.label}
                    </button>
                )
            )}

            <div className="h-px bg-white/10 my-1" />

            <div className="text-[11px] font-bold uppercase tracking-wider opacity-50">Controls</div>
            <button
                onClick={() => { onModeChange?.(mode === 'upload' ? 'stage' : 'upload'); setMobileMenuOpen(false); }}
                className="flex items-center gap-2.5 w-full p-2 px-2.5 border-none rounded-lg bg-transparent text-gray-200 text-[13px] font-medium cursor-pointer text-left transition-all hover:bg-purple-600/25 hover:text-white"
            >
                Switch to {mode === 'upload' ? 'Stage' : 'Upload'} Mode
            </button>
            {mode === 'upload' && (
                <ActionButton
                    variant="warning"
                    icon={<Upload size={13} strokeWidth={2.5} />}
                    label={isUploading ? 'Uploading…' : 'UPLOAD'}
                    onClick={() => { onUpload?.(); setMobileMenuOpen(false); }}
                    disabled={isUploading}
                    loading={isUploading}
                    className="w-full"
                />
            )}

            <div className="h-px bg-white/10 my-1" />

            <TopbarShareButton size={20} onSave={onSave} projectName={projectName}>
                {({ onClick, loading }) => (
                    <button
                        onClick={() => { onClick?.(); setMobileMenuOpen(false); }}
                        disabled={loading}
                        className="flex items-center gap-2.5 w-full p-2 px-2.5 border-none rounded-lg bg-transparent text-gray-200 text-[13px] font-medium cursor-pointer text-left transition-all hover:bg-purple-600/25 hover:text-white"
                    >
                        <Share size={15} color="#a78bfa" strokeWidth={2} />
                        Share
                    </button>
                )}
            </TopbarShareButton>

            <div className="mt-auto flex flex-col gap-2">
                <LeapLabAuthButton variant="dark" size="sm" className="w-full h-[34px] rounded-full box-border" />
            </div>
        </MobileDrawer>
        </>
    );
}