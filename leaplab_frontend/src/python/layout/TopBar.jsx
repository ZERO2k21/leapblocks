/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useEffect, useRef } from "react";
import { Home, Save, Settings, User, HelpCircle, Upload, Scissors, Copy, Clipboard, Undo, Redo, Hash, Wand2, Search, Menu as MenuIcon, Share, FolderOpen } from "lucide-react";
import Logo, { CreoleapLogo } from "../../components/Logo";
import LeapLabAuthButton from "../../../auth/LeapLabAuthButton";
import TopbarShareButton from "../../../components/common/TopbarShareButton";
import ProjectNameInput from "../../../components/common/ProjectNameInput";
import ModeSwitcher from "../../../components/common/ModeSwitcher";
import ActionButton from "../../../components/common/ActionButton";
import { useWindowWidth } from "../../../hooks/useWindowWidth";
import MobileDrawer from "../../../components/common/MobileDrawer";

// ─── Theme (LeapBlox Colors) ─────────────────────────────────────────────────
const C = {
    PURPLE: "#0a015a",  // Updated header color
    DARK_PURPLE: "#080a25",
    LIGHT_PURPLE: "#EDE9FE",
    BORDER: "#E5E7EB",
    TEXT: "#1F2937",
    MUTED: "#6B7280",
};

export default function TopBar({ onBack, onSwitchToNotebook, showGuide, setShowGuide, mode, setMode, projectName = 'My Project', onProjectNameChange, onSave }) {
    const [showCreoleap, setShowCreoleap] = useState(window.innerWidth >= 1400);
    const windowWidth = useWindowWidth();
    const showDesktopMode = windowWidth >= 1400;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const mobileMenuRef = useRef(null);

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

    return (
        <>
        <header className="h-[68px] bg-gradient-to-r from-[#0a0a1f] via-[#0a015a] to-[#080a25] flex items-center px-7 justify-between text-white z-[100] shrink-0 shadow-[0_4px_20px_rgba(8,10,37,0.5),inset_0_-1px_0_rgba(255,255,255,0.06)] border-b border-sky-400/10">
            {/* Left Side: LeapLab Logo + App Name + Blocks/Python Tabs */}
            <div className="flex items-center gap-3">
                {/* Home Button */}
                <button
                    onClick={onBack}
                    className="flex items-center justify-center w-10 h-10 bg-white/10 border border-white/10 rounded-xl text-white cursor-pointer transition-all duration-200 shrink-0 mr-1 hover:bg-white/20 hover:scale-105"
                    title="Back to Home"
                >
                    <Home size={20} strokeWidth={2.2} />
                </button>

                <div className="h-7 w-px bg-white/15 mr-1" />

                {/* Logo + App Name */}
                <div className="flex items-center gap-2 mr-2 shrink-0">
                    <Logo height={48} />
                    <span className="text-white text-22px font-black tracking-wider leading-snug font-sans drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] border-l border-white/15 pl-2">
                        Logix{" "}
                    </span>
                </div>

                {showDesktopMode && (
                    <>
                        <div className="h-8 w-px bg-white/15 mr-1" />
                        <ModeSwitcher
                            modes={[
                                { id: 'blocks', label: 'Blocks', icon: <span className="text-sm">🧩</span> },
                                { id: 'python', label: 'Python', icon: <span className="text-sm">🐍</span> },
                            ]}
                            activeMode={mode}
                            onChange={(id) => setMode && setMode(id)}
                        />
                    </>
                )}
            </div>

            {/* Center: Project Name */}
            <div className="flex items-center flex-1 justify-center">
                {onProjectNameChange && onSave ? (
                    <ProjectNameInput
                        value={projectName}
                        onChange={onProjectNameChange}
                        onSave={onSave}
                    />
                ) : null}
            </div>

            {/* Right Side: Run/Stop + Upload Firmware + CREOLEAP Logo */}
            <div className="flex items-center gap-2">
                {showDesktopMode ? (
                    <>
                        <ActionButton
                            variant="success"
                            icon={<span className="text-sm">▶</span>}
                            label="Run"
                            onClick={() => {}}
                            title="Run Code"
                        />
                        <ActionButton
                            variant="danger"
                            icon={<span className="text-sm">●</span>}
                            label="Stop"
                            onClick={() => {}}
                            title="Stop"
                        />

                        <div className="w-px h-4.5 bg-white/30 mx-1" />

                        <ActionButton
                            variant="primary"
                            icon={<Upload size={14} />}
                            label="Upload Firmware"
                            onClick={() => {}}
                        />

                        {/* Camera, Window, Fullscreen icons */}
                        <div className="flex gap-1 ml-2">
                            <div className="p-1.5 px-2 cursor-pointer rounded text-white/80 transition-colors hover:bg-white/10">
                                📷
                            </div>
                            <div className="p-1.5 px-2 cursor-pointer rounded text-white/80 transition-colors hover:bg-white/10">
                                ⬜
                            </div>
                            <div className="p-1.5 px-2 cursor-pointer rounded text-white/80 transition-colors hover:bg-white/10">
                                ⛶
                            </div>
                        </div>

                        <TopbarShareButton
                            className="bg-transparent border-none text-white/70 cursor-pointer p-1.5 px-2 rounded flex items-center transition-colors hover:text-white"
                            size={18}
                        />

                        <LeapLabAuthButton variant="dark" size="sm" className="h-8 rounded box-border" />

                        {showCreoleap && (
                            <div className="ml-3 flex items-center shrink-0 h-[40px] overflow-hidden drop-shadow-[0_0_10px_rgba(255,255,255,0.15)]">
                                <img
                                    src="assets/logo-creoleap.png"
                                    alt="CREOLEAP"
                                    className="w-[145px] h-auto object-contain block shrink-0 brightness-120 contrast-105"
                                />
                            </div>
                        )}
                    </>
                ) : (
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 border border-white/15 text-white cursor-pointer shrink-0 hover:bg-white/20"
                    >
                        <MenuIcon size={20} strokeWidth={2.2} />
                    </button>
                )}
            </div>
        </header>

        <MobileDrawer
            isOpen={mobileMenuOpen}
            onClose={() => setMobileMenuOpen(false)}
            theme="dark"
        >
            <div className="text-[11px] font-bold uppercase tracking-wider opacity-50">Mode</div>
            {[
                { id: 'blocks', label: 'Blocks', icon: '🧩' },
                { id: 'python', label: 'Python', icon: '🐍' },
            ].map(({ id, label, icon }) => (
                <button
                    key={id}
                    onClick={() => { setMode?.(id); setMobileMenuOpen(false); }}
                    className={`flex items-center gap-2.5 w-full p-2.5 px-3 border-none rounded-lg text-white text-sm font-semibold cursor-pointer text-left transition-all ${
                        mode === id ? 'bg-purple-400/20' : 'bg-transparent'
                    }`}
                >
                    <span>{icon}</span>
                    <span>{label}</span>
                    {mode === id && <span className="ml-auto text-[11px] opacity-60">Active</span>}
                </button>
            ))}

            <div className="h-px bg-white/10 my-1" />

            <div className="text-[11px] font-bold uppercase tracking-wider opacity-50">Actions</div>
            {[
                { label: '▶ Run', onClick: () => {} },
                { label: '● Stop', onClick: () => {} },
                { label: 'Upload Firmware', onClick: () => {} },
            ].map(({ label, onClick }) => (
                <button
                    key={label}
                    onClick={() => { onClick?.(); setMobileMenuOpen(false); }}
                    className="flex items-center gap-2.5 w-full p-2.5 px-3 border-none rounded-lg bg-transparent text-gray-200 text-[13px] font-medium cursor-pointer text-left transition-all hover:bg-purple-400/25 hover:text-white"
                >
                    {label}
                </button>
            ))}

            <div className="h-px bg-white/10 my-1" />

            <div className="text-[11px] font-bold uppercase tracking-wider opacity-50">Utilities</div>
            {['📷', '⬜', '⛶'].map((emoji, i) => (
                <button
                    key={i}
                    className="flex items-center gap-2.5 w-full p-2.5 px-3 border-none rounded-lg bg-transparent text-gray-200 text-[13px] font-medium cursor-pointer text-left transition-all hover:bg-purple-400/25 hover:text-white"
                >
                    <span>{emoji}</span>
                </button>
            ))}

            <div className="h-px bg-white/10 my-1" />

            <TopbarShareButton size={20}>
                {({ onClick, loading }) => (
                    <button
                        onClick={onClick}
                        disabled={loading}
                        className="flex items-center gap-2.5 w-full p-2.5 px-3 border-none rounded-lg bg-transparent text-gray-200 text-[13px] font-medium cursor-pointer text-left transition-all hover:bg-purple-400/25 hover:text-white"
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
