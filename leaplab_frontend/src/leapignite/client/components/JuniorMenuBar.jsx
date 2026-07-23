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
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
            <button
                onClick={() => {
                    sessionStorage.setItem('landingActiveTab', 'modules');
                    sessionStorage.removeItem('myProjectsSelectedMode');
                    onBack?.();
                }}
                className="flex items-center justify-center w-10 h-10 bg-white/8 border border-white/8 rounded-xl text-white/80 cursor-pointer transition-all shrink-0 hover:bg-white/15 hover:text-white"
                title="Back to Home"
            >
                <Home size={20} strokeWidth={2.2} />
            </button>

            <div className="h-8 w-px bg-white/8 shrink-0" />

            <div className="flex items-center mr-3.5 shrink-0">
                <Logo height={48} />
                <div className="flex flex-col justify-center ml-3 leading-tight">
                    <span className="text-white text-[22px] font-black tracking-widest font-sans">IGNITE</span>
                </div>
            </div>

            <div className="w-px h-7 bg-white/10 shrink-0" />

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
        <div className="flex items-center justify-center px-5">
            <ProjectNameInput
                value={projectName}
                onChange={(val) => onProjectNameChange?.(val)}
                onSave={() => onFileAction?.('save')}
            />
        </div>
    );

    const renderRightSection = () => (
        <div className="flex items-center justify-end gap-5 flex-1 min-w-0">
            {showDesktopMenus ? (
                <>
                    <div className="flex items-center gap-4 pr-5 border-r border-white/8 h-8 shrink-0">
                        <TopbarShareButton size={20} onSave={onSave} projectName={projectName}>
                            {({ onClick, loading }) => (
                                <button
                                    className="bg-transparent border-none text-white/45 cursor-pointer p-0 transition-all flex items-center hover:text-white hover:scale-115"
                                    onClick={onClick}
                                    disabled={loading}
                                    title="Share project"
                                >
                                    <Share2 size={20} strokeWidth={2.2} />
                                </button>
                            )}
                        </TopbarShareButton>
                    </div>

                    <LeapLabAuthButton variant="dark" size="sm" className="h-[34px] rounded-full box-border" />

                    {showCreoleap && (
                        <div className="ml-4 flex items-center shrink-0 h-11 overflow-hidden">
                            <img
                                src="assets/logo-creoleap.png"
                                alt="CREOLEAP"
                                className="w-[150px] h-auto object-contain block shrink-0 opacity-90 brightness-110 contrast-105"
                            />
                        </div>
                    )}
                </>
            ) : (
                <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/8 border border-white/8 text-white/80 cursor-pointer shrink-0 hover:bg-white/15 hover:text-white"
                >
                    <MenuIcon size={20} strokeWidth={2.2} />
                </button>
            )}
        </div>
    );

    return (
        <div className="flex items-center justify-between h-[68px] px-7 bg-gradient-to-r from-[#0a015a] via-[#0f0b3a] to-[#080a25] shadow-[0_4px_24px_rgba(8,10,37,0.5),inset_0_1px_0_rgba(255,255,255,0.08)] z-[100] border-b border-sky-400/10">
            {renderLeftSection()}
            {renderCenterSection()}
            {renderRightSection()}

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

                <div className="text-[11px] font-bold uppercase tracking-wider opacity-50">Tutorials</div>
                {tutorialsMenuItems.map((item, idx) => (
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

                <div className="text-[11px] font-bold uppercase tracking-wider opacity-50">Utilities</div>
                <TopbarShareButton size={20} onSave={onSave} projectName={projectName}>
                    {({ onClick, loading }) => (
                        <button
                            onClick={() => { onClick?.(); setMobileMenuOpen(false); }}
                            disabled={loading}
                            className="flex items-center gap-2.5 w-full p-2 px-2.5 border-none rounded-lg bg-transparent text-gray-200 text-[13px] font-medium cursor-pointer text-left transition-all hover:bg-purple-600/25 hover:text-white"
                        >
                            <Share2 size={15} color="#a78bfa" strokeWidth={2} />
                            Share
                        </button>
                    )}
                </TopbarShareButton>

                <div className="mt-auto flex flex-col gap-2">
                    <LeapLabAuthButton variant="dark" size="sm" className="w-full h-[34px] rounded-full box-border" />
                </div>
            </MobileDrawer>
        </div>
    );
}
