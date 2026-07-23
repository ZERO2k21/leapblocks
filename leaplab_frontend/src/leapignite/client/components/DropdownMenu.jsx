/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// DROPDOWN MENU — Glassmorphism + slide-in animation (same design as Intermediate)
// ═══════════════════════════════════════════════════════════════════════════
export default function DropdownMenu({ label, icon: Icon, items, isOpen, onToggle, onClose }) {
    const menuRef = useRef(null);
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
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
                className={`flex items-center gap-1.5 px-4 py-2 text-white text-sm font-semibold rounded-full transition-all tracking-wide cursor-pointer ${
                    isOpen ? 'bg-white/20 backdrop-blur-sm' : 'bg-transparent hover:bg-white/10'
                }`}
            >
                {Icon && <Icon size={16} strokeWidth={2.2} className="opacity-90" />}
                {label}
                <ChevronDown
                    size={14}
                    strokeWidth={2.5}
                    className={`opacity-50 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
                />
            </button>

            {isOpen && (
                <div className="absolute top-full mt-1.5 left-0 bg-white/90 backdrop-blur-xl rounded-xl shadow-2xl border border-white/60 min-w-[200px] overflow-hidden z-50 py-1.5 animate-[jrMenuSlideIn_0.18s_ease-out]">
                    <style>{`
                        @keyframes jrMenuSlideIn {
                            from { opacity: 0; transform: translateY(-6px) scale(0.98); }
                            to { opacity: 1; transform: translateY(0) scale(1); }
                        }
                    `}</style>
                    {items.map((item, idx) => (
                        item.divider ? (
                            <div key={idx} className="h-px bg-gradient-to-r from-transparent via-black/10 to-transparent my-1.5 mx-3" />
                        ) : (
                            <button
                                key={idx}
                                onClick={() => { item.onClick?.(); onClose(); }}
                                disabled={item.disabled}
                                className={`flex items-center gap-2.5 w-full px-3.5 py-2 text-sm font-medium text-left transition-all tracking-normal ${
                                    item.disabled
                                        ? 'cursor-not-allowed text-gray-300 bg-transparent'
                                        : 'cursor-pointer text-gray-700 hover:bg-purple-100/60 hover:text-purple-700'
                                }`}
                            >
                                {item.icon && <item.icon size={16} strokeWidth={2} className="text-purple-600 opacity-85 shrink-0" />}
                                <span className="flex-1">{item.label}</span>
                                {item.shortcut && (
                                    <span className="text-xs text-gray-400 font-medium bg-black/5 px-1.5 py-0.5 rounded font-mono">
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
