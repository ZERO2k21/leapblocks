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
            <div className={`absolute bottom-13 left-1/2 flex flex-col items-center gap-0.5 py-2.5 bg-purple-950 rounded-full w-11 shadow-2xl z-40 transition-all duration-150 ${
                open ? 'opacity-100 visible -translate-x-1/2 translate-y-0 pointer-events-auto' : 'opacity-0 invisible -translate-x-1/2 translate-y-2.5 pointer-events-none'
            }`}>
                {actions.map((action) => (
                    <div
                        key={action.id}
                        className="relative w-full flex justify-center"
                        onMouseEnter={() => setHoveredId(action.id)}
                        onMouseLeave={() => setHoveredId(null)}
                    >
                        {/* Tooltip — crimson pill to the left */}
                        <div className={`absolute right-13 top-1/2 -translate-y-1/2 bg-rose-600 text-white px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap pointer-events-none transition-opacity duration-150 shadow-md shadow-rose-600/40 z-50 ${
                            hoveredId === action.id ? 'opacity-100' : 'opacity-0'
                        }`}>
                            {action.label}
                            {/* Arrow pointing right */}
                            <span className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-[6px] border-l-rose-600" />
                        </div>

                        {/* Icon button */}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpen(false);
                                setHoveredId(null);
                                action.onClick();
                            }}
                            title={action.label}
                            className={`w-8 h-8 rounded-full border-0 text-white flex items-center justify-center cursor-pointer transition-colors duration-150 shrink-0 ${
                                hoveredId === action.id ? 'bg-white/15' : 'bg-transparent'
                            }`}
                        >
                            {action.icon}
                        </button>
                    </div>
                ))}
            </div>

            {/* ── Main FAB ──────────────────────────────────────────────── */}
            <div className="relative w-11 h-11 flex items-center justify-center">
                {/* Glow ring */}
                <div className={`absolute -inset-1.25 rounded-full transition-colors duration-200 ${
                    open ? 'bg-rose-600/20' : 'bg-purple-500/20'
                }`} />

                <button
                    type="button"
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
                    className={`w-11 h-11 rounded-full border-0 text-white flex items-center justify-center cursor-pointer transition-all duration-200 relative z-50 shrink-0 ${
                        open
                            ? 'bg-rose-600 shadow-lg shadow-rose-600/50 scale-105'
                            : 'bg-purple-600 shadow-lg shadow-purple-600/45 scale-100'
                    }`}
                >
                    {mainIcon}
                </button>
            </div>
        </div>
    );
};

export default ActionMenu;
