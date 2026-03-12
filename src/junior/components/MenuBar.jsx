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
            <div className="flex items-end gap-2 mr-5">
                <Logo height={44} />
                <span className="text-[#FFD500] text-xs font-extrabold uppercase tracking-wider mb-[10px]">
                    INTERMEDIATE BLOCKS
                </span>
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
            <div className="flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded-lg mx-1">
                <button
                    onClick={onRefreshPorts}
                    title="Refresh Ports"
                    className="bg-transparent border-none text-white cursor-pointer flex items-center opacity-80"
                >
                    <RotateCcw size={14} />
                </button>
                <select
                    value={selectedPort}
                    onChange={(e) => onPortSelect?.(e.target.value)}
                    className="bg-transparent border-none text-white text-xs outline-none cursor-pointer p-1 max-w-[120px]"
                >
                    <option value="" className="text-gray-700">
                        {ports.length === 0 ? 'No Ports Found' : 'Select Port'}
                    </option>
                    {ports.map(p => (
                        <option key={p.path} value={p.path} className={p.path === 'BRIDGE_DETECTED' ? 'text-red-500' : 'text-gray-700'}>
                            {p.path === 'BRIDGE_DETECTED' ? `⚠ Driver Needed: ${p.manufacturer}` : `${p.path} (${p.manufacturer || 'Unknown'})`}
                        </option>
                    ))}
                </select>
                <button
                    onClick={onConnect}
                    className={`border-none rounded-md text-white px-2.5 py-1 text-[11px] font-bold cursor-pointer ml-1 transition-all duration-200 ${connectionStatus === 'connected' ? 'bg-emerald-500' : 'bg-white/15'}`}
                >
                    {connectionStatus === 'connected' ? 'CONNECTED' : 'CONNECT'}
                </button>
            </div>

            {/* Upload Button - Only in Upload Mode */}
            {mode === 'upload' && (
                <button
                    onClick={onUpload}
                    disabled={isUploading}
                    className={`border-none rounded-[17px] px-5 py-1.5 text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-[0_2px_4px_rgba(0,0,0,0.2)] transition-all duration-200 mr-2 ${isUploading ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-[#FFD500] text-black'}`}
                >
                    <Upload size={14} />
                    {isUploading ? 'UPLOADING...' : 'UPLOAD'}
                </button>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Project Name */}
            <div className="flex items-center bg-white/10 rounded-md px-3">
                <span className="mr-2 text-sm">📁</span>
                <input
                    type="text"
                    value={projectName}
                    onChange={(e) => onProjectNameChange?.(e.target.value)}
                    className="bg-transparent border-none text-white text-[13px] font-medium w-[150px] outline-none"
                    placeholder="Project Name"
                />
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Connection Status */}
            <div className="flex items-center gap-1.5 mr-4">
                <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span className="text-white/70 text-[11px]">
                    {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
                </span>
            </div>

            {/* Mode Toggle */}
            <ModeToggle mode={mode} onModeChange={onModeChange} />

            {/* Help Button */}
            <button className="flex items-center justify-center w-8 h-8 ml-2 bg-white/10 border-none rounded-full cursor-pointer text-white">
                <HelpCircle size={18} />
            </button>
        </div>
    );
}
