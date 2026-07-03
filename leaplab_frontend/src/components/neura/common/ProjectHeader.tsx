/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

import React from 'react';
import { Home, Save, Download, Settings, HelpCircle, BookOpen, Trophy, MessageSquareWarning, Sun, Moon, Search } from 'lucide-react';
import LeapLabAuthButton from '../../../auth/LeapLabAuthButton';
import { useNeuraTheme } from './NeuraThemeContext';
import TopbarShareButton from '../../common/TopbarShareButton';

interface ProjectHeaderProps {
    icon?: string;
    title?: string;
    onBack?: () => void;
    onSave?: () => void;
    onDownload?: () => void;
    onUploadFolder?: () => void;
    projectName?: string;
    onProjectNameChange?: (name: string) => void;
    showMiddleSection?: boolean;
}

export default function ProjectHeader({
    icon,
    title,
    onBack,
    onSave,
    onDownload,
    onUploadFolder,
    projectName,
    onProjectNameChange,
    showMiddleSection = true,
}: ProjectHeaderProps) {
    const { theme, toggleTheme, isDark } = useNeuraTheme();

    return (
        <div className="flex items-center justify-between h-14 sm:h-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#0a015a] to-[#080a25] shadow-[0_4px_20px_rgba(8,10,37,0.45),inset_0_-1px_0_rgba(255,255,255,0.06)] z-[100] border-b border-white/10 select-none shrink-0 relative">
            {/* Subtle glass overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
                backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.15) 0%, transparent 50%)'
            }} />

            {/* ── LEFT SECTION ────────────────────────────────────────────────────────── */}
            <div className="relative flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                {onBack && (
                    <button
                        title="Back to Dashboard"
                        onClick={onBack}
                        className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-white/10 border border-white/10 rounded-xl text-white cursor-pointer transition-all duration-200 hover:bg-white/[0.15] hover:border-white/20 hover:shadow-[0_0_12px_rgba(255,255,255,0.1)] shrink-0 active:scale-95"
                    >
                        <Home size={18} strokeWidth={2.2} />
                    </button>
                )}

                <div className="h-6 sm:h-8 w-px bg-white/10 shrink-0" />

                <div className="flex items-center sm:mr-3.5 shrink-0 filter drop-shadow-[0_0_14px_rgba(80,200,255,0.3)] drop-shadow-[0_2px_6px_rgba(0,0,0,0.3)]">
                    <img
                        alt="LeapLab"
                        src="assets/leaplab_logo_transparent.png"
                        className="h-12 object-contain"
                    />
                    <div className="flex flex-col justify-center ml-1.5 sm:ml-2.5 leading-[1.1]">
                        <span className="text-yellow-400 text-[7px] sm:text-[8px] font-[900] uppercase tracking-[0.18em] font-['Segoe_UI',Inter,sans-serif] hidden sm:block">
                            LEAPLAB
                        </span>
                        <span className="text-white text-sm sm:text-base font-[900] tracking-[0.08em] font-['Segoe_UI',Inter,sans-serif]">
                            NEURA ML
                        </span>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-2">
                    <button className="flex items-center gap-1.5 px-3.5 py-2 border-none text-white text-[13px] font-semibold font-['Segoe_UI',Inter,sans-serif] cursor-pointer rounded-full transition-all duration-200 bg-transparent tracking-[0.02em] hover:bg-white/10 active:scale-95">
                        <BookOpen size={14} strokeWidth={2.2} className="opacity-90" />
                        Tutorials
                    </button>
                </div>
            </div>

            {/* ── MIDDLE SECTION ──────────────────────────────────────────────────────── */}
            <div className="relative hidden sm:flex items-center justify-center gap-4 px-4 shrink-0">
                {showMiddleSection && title ? (
                    <div className="flex items-center h-10 bg-black/25 rounded-2xl pl-[18px] pr-1.5 border border-white/8 gap-2 transition-all duration-200 hover:bg-black/30 focus-within:bg-black/30 focus-within:border-white/15">
                        <span className="text-sm opacity-45">{icon || '🧠'}</span>
                        <input
                            placeholder={title}
                            type="text"
                            value={projectName || title || ''}
                            onChange={(e) => onProjectNameChange && onProjectNameChange(e.target.value)}
                            className="bg-transparent border-none text-white text-sm font-bold font-['Segoe_UI',Inter,sans-serif] w-[120px] sm:w-[170px] text-center outline-none tracking-[0.01em] placeholder:text-white/40"
                        />
                        {onSave && (
                            <button
                                title="Save Project"
                                onClick={onSave}
                                className="bg-emerald-500 border-none rounded-full w-9 h-9 sm:w-[42px] sm:h-[42px] flex items-center justify-center cursor-pointer text-white shadow-[0_4px_6px_-1px_rgba(0,0,0,0.3)] transition-all duration-200 shrink-0 hover:bg-emerald-400 hover:scale-105 hover:shadow-[0_0_16px_rgba(34,197,94,0.4)] active:scale-95"
                            >
                                <Save size={16} strokeWidth={2.8} />
                            </button>
                        )}
                        {onDownload && (
                            <button
                                title="Download .leap file"
                                onClick={onDownload}
                                className="bg-blue-500 border-none rounded-full w-9 h-9 sm:w-[42px] sm:h-[42px] flex items-center justify-center cursor-pointer text-white shadow-[0_4px_6px_-1px_rgba(0,0,0,0.3)] transition-all duration-200 shrink-0 ml-1 sm:ml-2 hover:bg-blue-400 hover:scale-105 hover:shadow-[0_0_16px_rgba(59,130,246,0.4)] active:scale-95"
                            >
                                <Download size={16} strokeWidth={2.8} />
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center h-10 bg-black/20 rounded-xl px-4 border border-white/[0.08] gap-2.5 transition-all duration-200 hover:bg-black/25 focus-within:bg-black/25 focus-within:border-white/15 w-full max-w-[420px]">
                        <Search size={16} className="text-white/40 shrink-0" strokeWidth={2} />
                        <input
                            placeholder="Search projects, models, datasets..."
                            type="text"
                            className="bg-transparent border-none text-white text-sm font-normal font-['Segoe_UI',Inter,sans-serif] w-full outline-none tracking-[0.01em] placeholder:text-white/35"
                        />
                    </div>
                )}
            </div>

            {/* ── RIGHT SECTION ───────────────────────────────────────────────────────── */}
            <div className="relative flex items-center justify-end gap-4 sm:gap-6 flex-1 min-w-0">
                {onUploadFolder && (
                    <button
                        onClick={onUploadFolder}
                        className="hidden sm:flex px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-[13px] font-semibold cursor-pointer items-center gap-1.5 transition-all duration-200 hover:bg-white/30 active:scale-95"
                    >
                        <span>📁</span> Upload Folder
                    </button>
                )}

                <div className="hidden sm:flex items-center gap-4 pr-4 border-r border-white/10 h-9 shrink-0">
                    <button title="Feedback" className="bg-transparent border-none text-white/50 cursor-pointer p-0 transition-all duration-200 flex items-center hover:text-white/90 hover:scale-110 active:scale-95">
                        <MessageSquareWarning size={22} strokeWidth={2.2} />
                    </button>
                    <button title="Achievements" className="bg-transparent border-none text-white/50 cursor-pointer p-0 transition-all duration-200 flex items-center hover:text-white/90 hover:scale-110 active:scale-95">
                        <Trophy size={22} strokeWidth={2.2} />
                    </button>
                    <button
                        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        onClick={toggleTheme}
                        className="bg-transparent border-none text-white/60 hover:text-white cursor-pointer p-1 rounded-lg hover:bg-white/10 transition-all duration-200 flex items-center hover:scale-110 active:scale-95"
                    >
                        {isDark ? <Sun size={20} strokeWidth={2.2} /> : <Moon size={20} strokeWidth={2.2} />}
                    </button>
                    <button title="Settings" className="bg-transparent border-none text-white/50 cursor-pointer p-0 transition-all duration-200 flex items-center hover:text-white/90 hover:scale-110 active:scale-95">
                        <Settings size={22} strokeWidth={2.2} />
                    </button>
                    <button title="Help" className="bg-transparent border-none text-white/50 cursor-pointer p-0 transition-all duration-200 flex items-center hover:text-white/90 hover:scale-110 active:scale-95">
                        <HelpCircle size={22} strokeWidth={2.2} />
                    </button>
                </div>

                {/* Mobile: compact icon buttons */}
                <div className="flex sm:hidden items-center gap-2.5">
                    <button
                        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        onClick={toggleTheme}
                        className="bg-transparent border-none text-white/60 hover:text-white cursor-pointer p-1 rounded-lg hover:bg-white/10 transition-all duration-200 flex items-center active:scale-95"
                    >
                        {isDark ? <Sun size={20} strokeWidth={2.2} /> : <Moon size={20} strokeWidth={2.2} />}
                    </button>
                    <button title="Settings" className="bg-transparent border-none text-white/50 cursor-pointer p-1 transition-all duration-200 flex items-center hover:text-white/90 active:scale-95">
                        <Settings size={20} strokeWidth={2.2} />
                    </button>
                    <button title="Help" className="bg-transparent border-none text-white/50 cursor-pointer p-1 transition-all duration-200 flex items-center hover:text-white/90 active:scale-95">
                        <HelpCircle size={20} strokeWidth={2.2} />
                    </button>
                </div>

                <LeapLabAuthButton variant="dark" style={{ height: '34px', borderRadius: '8px', boxSizing: 'border-box', fontSize: '13px' }} />

                <div className="hidden lg:flex ml-3.5 items-center shrink-0 h-8 overflow-hidden filter drop-shadow-[0_0_14px_rgba(255,255,255,0.15)] drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
                    <img
                        alt="Leap into the AI Future"
                        src="/assets/logo - creoleap.png"
                        className="w-[145px] h-auto object-contain block shrink-0 brightness-120 contrast-110 drop-shadow-[0_0_2px_rgba(255,255,255,0.2)]"
                    />
                </div>
            </div>
        </div>
    );
}
