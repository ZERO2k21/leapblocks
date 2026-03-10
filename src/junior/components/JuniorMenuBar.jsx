import React, { useState, useRef, useEffect } from 'react';
import {
    ChevronDown, File, FolderOpen, Save, Download,
    Undo, Redo, BookOpen, HelpCircle, Home,
    MessageSquareWarning, Trophy, Settings
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

// Junior MenuBar Component - Simplified for young children (no hardware)
export default function JuniorMenuBar({
    projectName = "My Project",
    onProjectNameChange,
    onFileAction,
    onEditAction,
    onBack,
}) {
    const [openMenu, setOpenMenu] = useState(null);

    const toggleMenu = (menu) => {
        setOpenMenu(openMenu === menu ? null : menu);
    };

    const closeMenu = () => setOpenMenu(null);

    // Menu definitions - simplified for Junior
    const fileMenuItems = [
        { label: 'New Project', icon: File, onClick: () => onFileAction?.('new') },
        { label: 'Open Project', icon: FolderOpen, onClick: () => onFileAction?.('open') },
        { divider: true },
        { label: 'Save', icon: Save, onClick: () => onFileAction?.('save') },
        { label: 'Save As...', icon: Download, onClick: () => onFileAction?.('save_as') },
    ];

    const editMenuItems = [
        { label: 'Undo', icon: Undo, onClick: () => onEditAction?.('undo') },
        { label: 'Redo', icon: Redo, onClick: () => onEditAction?.('redo') },
    ];

    const tutorialsMenuItems = [
        { label: 'Getting Started', icon: BookOpen, onClick: () => alert('Tutorial coming soon!') },
        { label: 'Move the Robo', icon: BookOpen, onClick: () => alert('Tutorial coming soon!') },
        { label: 'Make Sounds', icon: BookOpen, onClick: () => alert('Tutorial coming soon!') },
    ];

    return (
        <div className="flex items-center h-14 gap-2 shadow-[0_2px_8px_rgba(0,0,0,0.15)] z-[100]"
            style={{ background: 'linear-gradient(180deg, #7B4FC4 0%, #5A2D82 100%)' }}>

            {/* Home Button */}
            <button
                onClick={onBack}
                className="flex items-center justify-center w-8 h-8 bg-white/15 border-none rounded-full cursor-pointer text-white mr-2"
                title="Back to Home"
            >
                <Home size={18} />
            </button>

            {/* Logo */}
            <div className="flex items-end gap-2 mr-5">
                <Logo height={44} />
                <span className="text-[#FFD500] text-xs font-extrabold uppercase tracking-wider mb-[15px]">
                    JUNIOR
                </span>
            </div>

            {/* Menus - Only File, Edit, Tutorials for Junior */}
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

            {/* Spacer */}
            <div className="flex-1" />

            {/* Project Name and Save */}
            <div className="flex items-center gap-3 mr-4">
                <input
                    type="text"
                    value={projectName}
                    onChange={(e) => onProjectNameChange?.(e.target.value)}
                    className="bg-white/15 border border-white/10 text-white text-sm font-semibold w-[180px] outline-none px-3 py-1.5 rounded"
                    placeholder="My Project"
                />
                <button
                    onClick={() => onFileAction?.('save')}
                    className="bg-transparent border-none text-white cursor-pointer p-1 flex items-center justify-center opacity-90 hover:opacity-100"
                    title="Save Project"
                >
                    <Save size={20} strokeWidth={2.5} />
                </button>
            </div>

            {/* Right Side Utility Icons */}
            <div className="flex items-center gap-[18px] pl-4 border-l border-white/20">
                <button className="bg-transparent border-none text-white cursor-pointer p-0" title="Feedback">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                </button>
                <button className="bg-transparent border-none text-white cursor-pointer p-0" title="Achievements">
                    <Trophy size={20} strokeWidth={2.5} />
                </button>
                <button className="bg-transparent border-none text-white cursor-pointer p-0" title="Settings">
                    <Settings size={20} strokeWidth={2.5} />
                </button>

                {/* Sign In Button / Profile */}
                <button className="flex items-center gap-1.5 bg-transparent border-none cursor-pointer text-white font-semibold text-sm p-0">
                    <div className="w-7 h-7 bg-[#FFD166] rounded-full flex items-center justify-center text-base border-2 border-white">
                        🐻
                    </div>
                    Sign In
                </button>
            </div>
        </div>
    );
}
