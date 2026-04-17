/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved.
 */
import React, { useState, useRef, useEffect } from 'react';
import {
    ChevronDown, File, FolderOpen, Save, Share,
    Undo, Redo, Cpu, Bluetooth, Usb, Wifi,
    Upload, Home, RotateCcw, Monitor, Rocket
} from 'lucide-react';
import Logo from '../../components/Logo';

// DropdownMenu Component (Converted to Tailwind)
function DropdownMenu({ label, icon: Icon, items, isOpen, onToggle, onClose }) {
    const menuRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        };
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside, true);
        }, 0);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClickOutside, true);
        };
    }, [isOpen, onClose]);

    return (
        <div ref={menuRef} className="relative">
            <button
                onClick={onToggle}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-white rounded-xl transition-all duration-200 ${isOpen ? 'bg-white/20 backdrop-blur-md' : 'hover:bg-white/10'
                    }`}
            >
                {Icon && <Icon size={16} strokeWidth={2.2} />}
                {label}
                <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && (
                <div className="absolute top-[calc(100%+8px)] left-0 bg-white/95 backdrop-blur-2xl border border-white/60 rounded-2xl shadow-2xl py-1.5 min-w-[200px] z-50">
                    {items.map((item, idx) => (
                        item.divider ? (
                            <div
                                key={idx}
                                className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-2 mx-4"
                            />
                        ) : (
                            <button
                                key={idx}
                                onClick={() => { item.onClick?.(); onClose(); }}
                                disabled={item.disabled}
                                className="w-full px-4 py-2.5 text-left flex items-center gap-3 text-sm text-gray-700 hover:bg-violet-50 hover:text-violet-700 disabled:opacity-50 transition-colors"
                            >
                                {item.icon && <item.icon size={17} className="text-violet-600" />}
                                <span className="flex-1">{item.label}</span>
                                {item.shortcut && (
                                    <span className="text-xs text-gray-400 font-mono bg-gray-100 px-2 py-0.5 rounded">
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

// Modern Sliding Toggle Switch for Stage / Upload
function ModeToggle({ mode, onModeChange }) {
    return (
        <div
            onClick={() => onModeChange(mode === 'stage' ? 'upload' : 'stage')}
            className="relative flex items-center bg-zinc-900/80 border border-white/10 rounded-3xl p-1 cursor-pointer w-[152px] h-9 hover:border-white/20 transition-all"
        >
            {/* Sliding Background */}
            <div
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-3xl transition-all duration-300 shadow-md ${mode === 'stage'
                    ? 'left-1 bg-gradient-to-r from-emerald-500 to-teal-600'
                    : 'left-1/2 bg-gradient-to-r from-blue-600 to-indigo-600'
                    }`}
            />

            {/* Stage Label */}
            <div
                className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold z-10 transition-colors ${mode === 'stage' ? 'text-white' : 'text-white/60'
                    }`}
            >
                <Monitor size={15} strokeWidth={2.5} />
                <span className="hidden sm:inline">Stage</span>
            </div>

            {/* Upload Label */}
            <div
                className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold z-10 transition-colors ${mode === 'upload' ? 'text-white' : 'text-white/60'
                    }`}
            >
                <Rocket size={15} strokeWidth={2.5} />
                <span className="hidden sm:inline">Upload</span>
            </div>
        </div>
    );
}

export default function MenuBar({
    projectName = "Untitled Project",
    onProjectNameChange,
    mode = "stage",
    onModeChange,
    selectedBoard,
    onBoardSelect,
    connectionStatus = "disconnected",
    onConnect,
    ports = [],
    selectedPort = "",
    onPortSelect,
    onRefreshPorts,
    onUpload,
    isUploading,
    onFileAction,
    onEditAction,
    onBack,
}) {
    const [openMenu, setOpenMenu] = useState(null);
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1920);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleMenu = (menu) => setOpenMenu(openMenu === menu ? null : menu);
    const closeMenu = () => setOpenMenu(null);
    const isConnected = connectionStatus === 'connected';

    const fileMenuItems = [
        { label: 'New Project', icon: File, shortcut: 'Ctrl+N', onClick: () => onFileAction?.('new') },
        { label: 'Open Project', icon: FolderOpen, shortcut: 'Ctrl+O', onClick: () => onFileAction?.('open') },
        { divider: true },
        { label: 'Save', icon: Save, shortcut: 'Ctrl+S', onClick: () => onFileAction?.('save') },
        { label: 'Share', icon: Share, onClick: () => onFileAction?.('share') },
    ];

    const editMenuItems = [
        { label: 'Undo', icon: Undo, shortcut: 'Ctrl+Z', onClick: () => onEditAction?.('undo') },
        { label: 'Redo', icon: Redo, shortcut: 'Ctrl+Y', onClick: () => onEditAction?.('redo') },
    ];

    const boardMenuItems = [
        { label: 'Select Board...', icon: Cpu, onClick: () => onBoardSelect?.() },
        { divider: true },
        { label: selectedBoard || 'No Board Selected', disabled: true },
    ];

    return (
        <div className="flex items-center h-14 px-5 gap-4 bg-gradient-to-r from-[#0a015a] to-[#080a25] border-b border-white/10 shadow-xl z-50">
            {/* Left Side */}
            <button
                onClick={onBack}
                className="w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all active:scale-95"
                title="Back to Home"
            >
                <Home size={19} />
            </button>

            <div className="flex items-center gap-3">
                <Logo height={42} />
                <div className="leading-tight">
                    <div className="text-[#FFD500] text-[10px] font-black tracking-[0.12em] uppercase">LEAPLAB</div>
                    <div className="text-white text-[15px] font-black tracking-wider">EMBED</div>
                </div>
            </div>

            {/* Menu Dropdowns */}
            <div className="flex items-center gap-1 ml-6">
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

            {/* Hardware Port Section */}
            <div className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-2xl px-4 py-1.5 ml-4">
                <button
                    onClick={onRefreshPorts}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                >
                    <RotateCcw size={15} />
                </button>
                <select
                    value={selectedPort}
                    onChange={(e) => onPortSelect?.(e.target.value)}
                    className="bg-white/10 border border-white/20 rounded-xl text-white text-xs px-3 py-1.5 outline-none cursor-pointer max-w-[140px]"
                >
                    <option value="">{ports.length === 0 ? 'No Ports' : 'Select Port'}</option>
                    {ports.map(p => (
                        <option key={p.path} value={p.path}>{p.path}</option>
                    ))}
                </select>
                <button
                    onClick={onConnect}
                    className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${isConnected ? 'bg-emerald-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}
                >
                    {isConnected ? '● Connected' : 'Connect'}
                </button>
            </div>

            <div className="flex-1" />

            {/* Project Name */}
            <div className="flex items-center bg-black/30 border border-white/10 rounded-2xl px-4 h-9 gap-3">
                <span>📁</span>
                <input
                    type="text"
                    value={projectName}
                    onChange={(e) => onProjectNameChange?.(e.target.value)}
                    className="bg-transparent text-white text-sm font-medium outline-none w-40"
                    placeholder="Project Name"
                />
                <button
                    onClick={() => onFileAction?.('save')}
                    className="w-8 h-8 bg-emerald-600 hover:bg-emerald-500 rounded-xl flex items-center justify-center transition-all active:scale-95"
                >
                    <Save size={16} />
                </button>
            </div>

            <div className="flex-1" />

            {/* ==================== RIGHT PANEL WITH MASSIVE LOGO ==================== */}
            <div className="flex items-center gap-3 pr-4">
                {/* Connection Status */}
                <div className="flex items-center gap-2 text-sm font-medium text-white/70">
                    <div
                        className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-red-500 shadow-red-500/50'
                            }`}
                    />
                    <span className="hidden sm:inline">
                        {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                </div>

                {/* Stage / Upload Toggle Switch */}
                <ModeToggle mode={mode} onModeChange={onModeChange} />

                {/* Upload Button - Only visible in Upload mode */}
                {mode === 'upload' && (
                    <button
                        onClick={onUpload}
                        disabled={isUploading}
                        className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 disabled:from-gray-500 disabled:to-gray-600 text-[#1a1a2e] font-bold text-sm rounded-2xl transition-all active:scale-95 shadow-md disabled:cursor-not-allowed"
                    >
                        <Upload size={17} />
                        {isUploading ? 'UPLOADING...' : 'UPLOAD'}
                    </button>
                )}

                {/* CREOLEAP Logo - MASSIVE PREMIUM FIT */}
                <div className="flex items-center pl-4 border-l border-white/20">
                    <img
                        src="/assets/creoleap_logo.svg"
                        alt="CREOLEAP"
                        className="h-14 md:h-16 lg:h-[68px] xl:h-20 w-auto object-contain"
                        style={{
                            filter: 'drop-shadow(0 0 24px rgba(255,255,255,0.6))',
                            maxWidth: '320px'
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
