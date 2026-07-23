/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * ActionMenu — vertical pill drop-up menu
 *
 * STATES:
 *   Default  → purple FAB (#6c3fc5) matching the topbar colour
 *   Hover/Open → crimson FAB (#E6194B) + dark purple pill slides up
 */

import React, { useState, useRef } from 'react';

export interface ActionMenuItem {
    id: string;
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
}

interface ActionMenuProps {
    mainIcon: React.ReactNode;
    color?: string;
    tooltipLabel: string;
    actions: ActionMenuItem[];
}

export const ActionMenu: React.FC<ActionMenuProps> = ({
    mainIcon,
    tooltipLabel,
    actions,
}) => {
    const [open, setOpen] = useState(false);
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleEnter = () => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        setOpen(true);
    };

    const handleLeave = () => {
        closeTimer.current = setTimeout(() => {
            setOpen(false);
            setHoveredId(null);
        }, 120);
    };

    // Default: purple (topbar colour). Active/hover: crimson.
    const fabBg = open ? '#E6194B' : '#6c3fc5';
    const fabShadow = open
        ? '0 4px 14px rgba(230,25,75,0.5)'
        : '0 4px 12px rgba(108,63,197,0.45)';
    const glowBg = open
        ? 'rgba(230,25,75,0.2)'
        : 'rgba(139,92,246,0.22)';

    return (
        <div
            className="relative inline-flex items-center overflow-visible"
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
        >
            {/* ── Drop-up pill menu ──────────────────────────────────────── */}
            <div className={`absolute bottom-[52px] left-1/2 flex flex-col items-center gap-0.5 py-2.5 bg-[#3D1A6E] rounded-[22px] w-[44px] shadow-[0_8px_24px_rgba(0,0,0,0.35)] z-[200] transition-all duration-180 ${
                open ? 'opacity-100 visible -translate-x-1/2 translate-y-0 pointer-events-auto' : 'opacity-0 invisible -translate-x-1/2 translate-y-[10px] pointer-events-none'
            }`}>
                {actions.map((action) => (
                    <div
                        key={action.id}
                        className="relative w-full flex justify-center"
                        onMouseEnter={() => setHoveredId(action.id)}
                        onMouseLeave={() => setHoveredId(null)}
                    >
                        {/* Tooltip — crimson pill to the left */}
                        <div className={`absolute right-[52px] top-1/2 -translate-y-1/2 bg-[#E6194B] text-white px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap pointer-events-none transition-opacity duration-150 shadow-[0_2px_8px_rgba(230,25,75,0.4)] z-[201] ${
                            hoveredId === action.id ? 'opacity-100' : 'opacity-0'
                        }`}>
                            {action.label}
                            {/* Arrow pointing right */}
                            <span className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[6px] border-l-[#E6194B]" />
                        </div>

                        {/* Icon button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpen(false);
                                setHoveredId(null);
                                action.onClick();
                            }}
                            title={action.label}
                            className={`w-8 h-8 rounded-full border-none text-white flex items-center justify-center cursor-pointer transition-colors duration-150 shrink-0 ${
                                hoveredId === action.id ? 'bg-white/15' : 'bg-transparent'
                            }`}
                        >
                            {action.icon}
                        </button>
                    </div>
                ))}
            </div>

            {/* ── Main FAB ──────────────────────────────────────────────── */}
            <div className="relative w-[44px] h-[44px] flex items-center justify-center">
                {/* Glow ring */}
                <div className={`absolute -inset-[5px] rounded-full transition-colors duration-200 ${
                    open ? 'bg-[#E6194B]/20' : 'bg-[#8B5CF6]/22'
                }`} />

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!open) {
                            setOpen(true);
                        } else {
                            const primary = actions.find(a => a.id === 'library') ?? actions[0];
                            primary?.onClick();
                            setOpen(false);
                        }
                    }}
                    title={tooltipLabel}
                    className={`w-[44px] h-[44px] rounded-full border-none text-white flex items-center justify-center cursor-pointer transition-all duration-200 relative z-[201] shrink-0 ${
                        open
                            ? 'bg-[#E6194B] shadow-[0_4px_14px_rgba(230,25,75,0.5)] scale-108'
                            : 'bg-[#6c3fc5] shadow-[0_4px_12px_rgba(108,63,197,0.45)] scale-100'
                    }`}
                >
                    {mainIcon}
                </button>
            </div>
        </div>
    );
};

export default ActionMenu;
