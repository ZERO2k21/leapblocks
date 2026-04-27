/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useRef, useEffect } from 'react';
import {
    ChevronDown, File, FolderOpen, Save,
    Undo, Redo, BookOpen, HelpCircle, Home,
    MessageSquareWarning, Trophy, Settings,
    Share, LucideIcon
} from 'lucide-react';
import Logo, { CreoleapLogo } from '../../../leapembed/client/components/Logo';

interface DropdownMenuItem {
    label?: string;
    icon?: LucideIcon;
    onClick?: () => void;
    disabled?: boolean;
    divider?: boolean;
    shortcut?: string;
}

interface DropdownMenuProps {
    label: string;
    icon?: LucideIcon;
    items: DropdownMenuItem[];
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// DROPDOWN MENU — Glassmorphism + slide-in animation
// ═══════════════════════════════════════════════════════════════════════════
function DropdownMenu({ label, icon: Icon, items, isOpen, onToggle, onClose }: DropdownMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
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
        <div ref={menuRef} className="relative">
            <button
                onClick={onToggle}
                className={`flex items-center gap-[5px] px-3 py-1.5 border-none text-white text-[13px] font-semibold font-[Segoe_UI,Inter,system-ui,sans-serif] cursor-pointer rounded-[20px] transition-all duration-200 tracking-[0.02em] ${
                    isOpen ? 'bg-white/[0.18] backdrop-blur-[4px]' : 'bg-transparent hover:bg-white/10'
                }`}
            >
                {Icon && <Icon size={14} strokeWidth={2.2} className="opacity-90 flex-shrink-0" />}
                {label}
                <ChevronDown
                    size={12}
                    strokeWidth={2.5}
                    className={`opacity-50 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
                />
            </button>

            {isOpen && (
                <div className="absolute top-[calc(100%+6px)] left-0 bg-white/[0.92] backdrop-blur-[20px] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.16),0_2px_8px_rgba(0,0,0,0.08)] border border-white/60 min-w-[200px] overflow-hidden z-[1000] py-1.5 animate-[jrMenuSlideIn_0.18s_ease-out]">
                    <style>{`
                        @keyframes jrMenuSlideIn {
                            from { opacity: 0; transform: translateY(-6px) scale(0.98); }
                            to { opacity: 1; transform: translateY(0) scale(1); }
                        }
                    `}</style>
                    {items.map((item, idx) => (
                        item.divider ? (
                            <div key={idx} className="h-px bg-gradient-to-r from-transparent via-black/[0.08] to-transparent mx-3 my-[5px]" />
                        ) : (
                            <button
                                key={idx}
                                onClick={() => { item.onClick?.(); onClose(); }}
                                disabled={item.disabled}
                                className={`flex items-center gap-2.5 w-full px-3.5 py-2.5 border-none bg-transparent text-[15px] font-[Segoe_UI,Inter,system-ui,sans-serif] font-medium text-left tracking-[0.01em] transition-all duration-[120ms] ${
                                    item.disabled
                                        ? 'cursor-not-allowed text-[#bbb]'
                                        : 'cursor-pointer text-gray-700 hover:bg-[rgba(107,70,193,0.08)] hover:text-[#6B46C1]'
                                }`}
                            >
                                {item.icon && <item.icon size={16} color="#7C3AED" strokeWidth={2} className="opacity-85 flex-shrink-0" />}
                                <span className="flex-1">{item.label}</span>
                                {item.shortcut && (
                                    <span className="text-[11px] text-[#aaa] font-medium bg-black/[0.04] px-1.5 py-0.5 rounded font-[Segoe_UI,monospace]">
                                        {item.shortcut}
                                    </span>
                                )}
                            </button>
                        )
                    ))}
                </div>
            )}
        </div>
    );
}

interface JuniorMenuBarProps {
    projectName?: string;
    onProjectNameChange?: (name: string) => void;
    onFileAction?: (action: string) => void;
    onEditAction?: (action: string) => void;
    onTutorialStart?: (tutorial: string) => void;
    onBack?: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// JUNIOR MENUBAR
// ═══════════════════════════════════════════════════════════════════════════
export default function JuniorMenuBar({
    projectName = "My Project",
    onProjectNameChange,
    onFileAction,
    onEditAction,
    onTutorialStart,
    onBack,
}: JuniorMenuBarProps) {
    const [openMenu, setOpenMenu] = useState<string | null>(null);

    const toggleMenu = (menu: string) => {
        setOpenMenu(openMenu === menu ? null : menu);
    };

    const closeMenu = () => setOpenMenu(null);

    const fileMenuItems: DropdownMenuItem[] = [
        { label: 'New Project', icon: File, onClick: () => onFileAction?.('new') },
        { label: 'Open Project', icon: FolderOpen, onClick: () => onFileAction?.('open') },
        { divider: true },
        { label: 'Save', icon: Save, onClick: () => onFileAction?.('save') },
        { label: 'Share', icon: Share, onClick: () => onFileAction?.('share to') },
    ];

    const editMenuItems: DropdownMenuItem[] = [
        { label: 'Undo', icon: Undo, onClick: () => onEditAction?.('undo') },
        { label: 'Redo', icon: Redo, onClick: () => onEditAction?.('redo') },
    ];

    const tutorialsMenuItems: DropdownMenuItem[] = [
        { label: 'Getting Started', icon: BookOpen, onClick: () => onTutorialStart?.('getting_started') },
        { label: 'Move the Robo', icon: BookOpen, onClick: () => onTutorialStart?.('move_robo') },
        { label: 'Make Sounds', icon: BookOpen, onClick: () => onTutorialStart?.('make_sounds') },
    ];

    return (
        <div className="flex items-center justify-between h-16 px-[18px] bg-gradient-to-br from-[#0a015a] to-[#080a25] shadow-[0_4px_20px_rgba(8,10,37,0.45),inset_0_-1px_0_rgba(255,255,255,0.06)] z-[100] border-b border-[rgba(100,180,255,0.1)]">

            {/* LEFT SECTION */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <button
                    onClick={onBack}
                    className="flex items-center justify-center w-10 h-10 bg-white/10 border border-white/10 rounded-xl text-white cursor-pointer transition-all duration-200 flex-shrink-0 hover:bg-white/20 hover:scale-105"
                    title="Back to Home"
                >
                    <Home size={20} strokeWidth={2.2} />
                </button>

                <div className="h-8 w-px bg-white/10 flex-shrink-0" />

                <div className="flex items-center mr-3.5 flex-shrink-0 drop-shadow-[0_0_14px_rgba(80,200,255,0.3)] drop-shadow-[0_2px_6px_rgba(0,0,0,0.3)]">
                    <Logo height={52} />
                    <div className="flex flex-col justify-center ml-2.5 leading-[1.1]">
                        <span className="text-white text-base font-black tracking-[0.08em] font-[Segoe_UI,Inter,system-ui,sans-serif]">
                            IGNITE
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-0.5">
                    <DropdownMenu label="File" items={fileMenuItems} isOpen={openMenu === 'file'} onToggle={() => toggleMenu('file')} onClose={closeMenu} />
                    <DropdownMenu label="Edit" items={editMenuItems} isOpen={openMenu === 'edit'} onToggle={() => toggleMenu('edit')} onClose={closeMenu} />
                    <DropdownMenu label="Tutorials" icon={BookOpen} items={tutorialsMenuItems} isOpen={openMenu === 'tutorials'} onToggle={() => toggleMenu('tutorials')} onClose={closeMenu} />
                </div>
            </div>

            {/* CENTER SECTION */}
            <div className="flex items-center justify-center px-4">
                <div className="flex items-center h-10 bg-black/25 rounded-[20px] pl-[18px] pr-[5px] border border-white/[0.08] gap-2 transition-all duration-200">
                    <span className="text-sm opacity-45">📁</span>
                    <input
                        type="text"
                        value={projectName}
                        onChange={(e) => onProjectNameChange?.(e.target.value)}
                        className="bg-transparent border-none text-white text-sm font-bold font-[Segoe_UI,Inter,system-ui,sans-serif] w-[170px] text-center outline-none tracking-[0.01em] placeholder:text-white/40"
                        placeholder="My Project"
                    />
                    <button
                        onClick={() => onFileAction?.('save')}
                        className="bg-gradient-to-br from-emerald-500 to-emerald-600 border-none rounded-full w-[30px] h-[30px] flex items-center justify-center cursor-pointer text-white shadow-[0_2px_6px_rgba(16,185,129,0.3)] transition-all flex-shrink-0 hover:scale-110"
                        title="Save Project"
                    >
                        <Save size={15} strokeWidth={2.8} />
                    </button>
                </div>
            </div>

            {/* RIGHT SECTION */}
            <div className="flex items-center justify-end gap-5 flex-1 min-w-0">
                <div className="flex items-center gap-3.5 pr-4 border-r border-white/10 h-8 flex-shrink-0">
                    {[
                        { Icon: MessageSquareWarning, title: 'Feedback' },
                        { Icon: Trophy, title: 'Achievements' },
                        { Icon: Settings, title: 'Settings' },
                        { Icon: HelpCircle, title: 'Help' },
                    ].map(({ Icon, title }) => (
                        <button
                            key={title}
                            className="bg-transparent border-none text-white/55 cursor-pointer p-0 transition-all duration-200 flex items-center hover:text-white hover:scale-[1.15]"
                            title={title}
                        >
                            <Icon size={20} strokeWidth={2.2} />
                        </button>
                    ))}
                </div>

                {/* Sign In */}
                <button className="flex items-center h-[38px] gap-2.5 bg-white/10 border border-white/10 rounded-[20px] cursor-pointer text-white font-bold text-[13px] font-[Segoe_UI,Inter,system-ui,sans-serif] pl-[5px] pr-[18px] transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.15)] flex-shrink-0 hover:bg-white/[0.18] hover:scale-[1.02]">
                    <div className="w-7 h-7 bg-gradient-to-br from-[#FFD166] to-amber-500 rounded-full flex items-center justify-center border-2 border-white/25 shadow-[0_2px_4px_rgba(0,0,0,0.15)]">
                        <span className="text-[#5A2D82] font-black text-[11px]">LB</span>
                    </div>
                    Sign In
                </button>

                {/* CREOLEAP Logo */}
                <div className="ml-3.5 flex items-center flex-shrink-0 drop-shadow-[0_0_14px_rgba(255,255,255,0.15)] drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
                    <CreoleapLogo height={160} />
                </div>
            </div>
        </div>
    );
}
