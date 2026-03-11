import React, { useState, useRef, useEffect } from 'react';
import {
    ChevronDown, File, FolderOpen, Save, Download,
    Undo, Redo, Cpu, Bluetooth, Usb, Wifi,
    Play, Upload, Settings, HelpCircle, Home, RotateCcw
} from 'lucide-react';
import Logo from '../../components/Logo';

// Dropdown Menu Component
function DropdownMenu({ label, icon: Icon, items, isOpen, onToggle, onClose }) {
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    return (
        <div ref={menuRef} className="relative">
            <button
                onClick={onToggle}
                className={`flex items-center gap-1 px-3 py-2 border-none text-white text-[13px] font-medium cursor-pointer rounded transition-colors duration-150 ${isOpen ? 'bg-black/20' : 'bg-transparent hover:bg-white/15'}`}
            >
                {Icon && <Icon size={16} />}
                {label}
                <ChevronDown size={14} className="opacity-70" />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.15)] min-w-[180px] overflow-hidden z-[1000]">
                    {items.map((item, idx) => (
                        item.divider ? (
                            <div key={idx} className="h-px bg-gray-200 my-1" />
                        ) : (
                            <button
                                key={idx}
                                onClick={() => { item.onClick?.(); onClose(); }}
                                disabled={item.disabled}
                                className={`flex items-center gap-2.5 w-full px-3.5 py-2.5 border-none bg-transparent text-[13px] text-left transition-colors duration-100 ${item.disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 cursor-pointer hover:bg-gray-100'}`}
                            >
                                {item.icon && <item.icon size={16} color="#7B4FC4" />}
                                <span className="flex-1">{item.label}</span>
                                {item.shortcut && (
                                    <span className="text-[11px] text-gray-400">{item.shortcut}</span>
                                )}
                            </button>
                        )
                    ))}
                </div>
            )}
        </div>
    );
}

// Mode Toggle Component (Stage / Upload)
function ModeToggle({ mode, onModeChange }) {
    return (
        <div className="flex bg-black/20 rounded-[20px] p-[3px]">
            <button
                onClick={() => onModeChange('stage')}
                className={`px-4 py-1.5 border-none rounded-[17px] text-xs font-semibold cursor-pointer transition-all duration-200 ${mode === 'stage' ? 'bg-emerald-500 text-white' : 'bg-transparent text-white/70'}`}
            >
                Stage
            </button>
            <button
                onClick={() => onModeChange('upload')}
                className={`px-4 py-1.5 border-none rounded-[17px] text-xs font-semibold cursor-pointer transition-all duration-200 ${mode === 'upload' ? 'bg-blue-500 text-white' : 'bg-transparent text-white/70'}`}
            >
                Upload
            </button>
        </div>
    );
}

// Main MenuBar Component
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

    const toggleMenu = (menu) => {
        setOpenMenu(openMenu === menu ? null : menu);
    };

    const closeMenu = () => setOpenMenu(null);

    // Menu definitions
    const fileMenuItems = [
        { label: 'New Project', icon: File, shortcut: 'Ctrl+N', onClick: () => onFileAction?.('new') },
        { label: 'Open Project', icon: FolderOpen, shortcut: 'Ctrl+O', onClick: () => onFileAction?.('open') },
        { divider: true },
        { label: 'Save', icon: Save, shortcut: 'Ctrl+S', onClick: () => onFileAction?.('save') },
        { label: 'Save As...', icon: Download, onClick: () => onFileAction?.('save_as') },
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

    const connectMenuItems = [
        {
            label: 'Serial',
            icon: Usb,
            onClick: () => onConnect?.('serial'),
        },
        {
            label: 'Bluetooth',
            icon: Bluetooth,
            onClick: () => onConnect?.('bluetooth'),
        },
        {
            label: 'WiFi',
            icon: Wifi,
            onClick: () => onConnect?.('wifi'),
            disabled: true,
        },
    ];

    return (
        <div className="flex items-center h-14 px-3 gap-2 shadow-[0_2px_8px_rgba(0,0,0,0.15)] z-[100] border-b border-white/10"
            style={{ background: 'linear-gradient(180deg, #7B4FC4 0%, #5A2D82 100%)' }}>

            {/* Home Link */}
            <button
                onClick={onBack}
                className="flex items-center gap-1.5 bg-white/15 border-none rounded-lg text-white px-3 py-1.5 cursor-pointer text-[13px] font-semibold mr-2"
            >
                <Home size={16} />
            </button>

            {/* Logo */}
            <div className="flex items-center gap-4 mr-10 group cursor-pointer transition-transform duration-300 hover:scale-[1.02]">
                <Logo height={42} />
                <div className="flex flex-col">
                    <span className="text-[#FFD500] text-[12px] font-[900] uppercase tracking-[0.25em] leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                        INTERMEDIATE
                    </span>
                </div>
            </div>

            {/* Menus */}
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

            {/* Hardware Port Section */}
            <div className="flex items-center gap-2 bg-gradient-to-r from-black/25 to-black/15 px-3 py-1.5 rounded-xl mx-2 border border-white/5 backdrop-blur-md shadow-inner">
                <button
                    onClick={onRefreshPorts}
                    title="Refresh Ports"
                    className="bg-transparent border-none text-white/70 hover:text-white cursor-pointer flex items-center transition-colors duration-200"
                >
                    <RotateCcw size={16} />
                </button>
                <div className="w-[1px] h-4 bg-white/10 mx-1" />
                <select
                    value={selectedPort}
                    onChange={(e) => onPortSelect?.(e.target.value)}
                    className="bg-transparent border-none text-white text-xs font-semibold outline-none cursor-pointer p-0.5 max-w-[140px] hover:text-blue-300 transition-colors"
                >
                    <option value="" className="text-gray-900 bg-white">
                        {ports.length === 0 ? 'No Ports Found' : 'Select Port'}
                    </option>
                    {ports.map(p => (
                        <option key={p.path} value={p.path} className={p.path === 'BRIDGE_DETECTED' ? 'text-red-600 bg-white' : 'text-gray-900 bg-white'}>
                            {p.path === 'BRIDGE_DETECTED' ? `⚠ Driver Needed: ${p.manufacturer}` : `${p.path} (${p.manufacturer || 'Unknown'})`}
                        </option>
                    ))}
                </select>
                <button
                    onClick={onConnect}
                    className={`border-none rounded-lg text-white px-4 py-1.5 text-[11px] font-[800] cursor-pointer ml-2 transition-all duration-300 shadow-lg ${connectionStatus === 'connected'
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 scale-105 ring-2 ring-emerald-400/30'
                        : 'bg-white/10 hover:bg-white/20 active:scale-95'
                        }`}
                >
                    {connectionStatus === 'connected' ? 'CONNECTED' : 'CONNECT'}
                </button>
            </div>

            {/* Upload Button - Only in Upload Mode */}
            {mode === 'upload' && (
                <button
                    onClick={onUpload}
                    disabled={isUploading}
                    className={`border-none rounded-xl px-6 py-2 text-xs font-[900] cursor-pointer flex items-center gap-2 shadow-xl transition-all duration-300 active:scale-95 mr-4 ${isUploading
                        ? 'bg-gray-500 text-white/50 cursor-not-allowed'
                        : 'bg-gradient-to-b from-[#FFE600] to-[#FFCC00] text-black hover:brightness-110 ring-2 ring-[#FFD500]/20'
                        }`}
                >
                    <Upload size={16} strokeWidth={3} />
                    {isUploading ? 'UPLOADING...' : 'UPLOAD'}
                </button>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Project Name */}
            <div className="flex items-center bg-black/20 rounded-xl px-4 py-1.5 border border-white/5 hover:bg-black/30 transition-colors duration-200 group">
                <span className="mr-3 text-lg filter grayscale group-hover:grayscale-0 transition-all duration-300">📁</span>
                <input
                    type="text"
                    value={projectName}
                    onChange={(e) => onProjectNameChange?.(e.target.value)}
                    className="bg-transparent border-none text-white text-[14px] font-bold w-[180px] outline-none placeholder:text-white/20"
                    placeholder="Project Name"
                />
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Connection Status */}
            <div className="flex items-center gap-2 mr-6 bg-black/10 px-3 py-1.5 rounded-full border border-white/5">
                <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] ${connectionStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                <span className={`text-[11px] font-[800] uppercase tracking-wider ${connectionStatus === 'connected' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {connectionStatus === 'connected' ? 'LIVE' : 'OFFLINE'}
                </span>
            </div>

            {/* Mode Toggle */}
            <ModeToggle mode={mode} onModeChange={onModeChange} />

            {/* Help Button */}
            <button className="flex items-center justify-center w-9 h-9 ml-3 bg-white/10 hover:bg-white/20 border border-white/5 rounded-full cursor-pointer text-white transition-all active:scale-95 shadow-lg">
                <HelpCircle size={20} />
            </button>
        </div>
    );
}
