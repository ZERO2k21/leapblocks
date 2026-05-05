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
            style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', overflow: 'visible' }}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
        >
            {/* ── Drop-up pill menu ──────────────────────────────────────── */}
            <div style={{
                position: 'absolute',
                bottom: '52px',
                left: '50%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                padding: '10px 0',
                background: '#3D1A6E',
                borderRadius: '22px',
                width: '44px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
                opacity: open ? 1 : 0,
                visibility: open ? 'visible' : 'hidden',
                transform: open
                    ? 'translateX(-50%) translateY(0)'
                    : 'translateX(-50%) translateY(10px)',
                transition: 'opacity 0.18s ease, transform 0.18s cubic-bezier(0.34,1.56,0.64,1), visibility 0.18s',
                zIndex: 200,
                pointerEvents: open ? 'auto' : 'none',
            }}>
                {actions.map((action) => (
                    <div
                        key={action.id}
                        style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}
                        onMouseEnter={() => setHoveredId(action.id)}
                        onMouseLeave={() => setHoveredId(null)}
                    >
                        {/* Tooltip — crimson pill to the left */}
                        <div style={{
                            position: 'absolute',
                            right: '52px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: '#E6194B',
                            color: 'white',
                            padding: '6px 14px',
                            borderRadius: '20px',
                            fontSize: '13px',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            pointerEvents: 'none',
                            opacity: hoveredId === action.id ? 1 : 0,
                            transition: 'opacity 0.15s ease',
                            boxShadow: '0 2px 8px rgba(230,25,75,0.4)',
                            zIndex: 201,
                        }}>
                            {action.label}
                            {/* Arrow pointing right */}
                            <span style={{
                                position: 'absolute',
                                right: '-6px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: 0,
                                height: 0,
                                borderTop: '5px solid transparent',
                                borderBottom: '5px solid transparent',
                                borderLeft: '6px solid #E6194B',
                            }} />
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
                            style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: hoveredId === action.id
                                    ? 'rgba(255,255,255,0.15)'
                                    : 'transparent',
                                border: 'none',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'background 0.15s',
                                flexShrink: 0,
                            }}
                        >
                            {action.icon}
                        </button>
                    </div>
                ))}
            </div>

            {/* ── Main FAB ──────────────────────────────────────────────── */}
            <div style={{
                position: 'relative',
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                {/* Glow ring */}
                <div style={{
                    position: 'absolute',
                    inset: '-5px',
                    borderRadius: '50%',
                    background: glowBg,
                    transition: 'background 0.2s',
                }} />

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
                    style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: fabBg,
                        border: 'none',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: fabShadow,
                        transition: 'background 0.2s, box-shadow 0.2s, transform 0.15s',
                        transform: open ? 'scale(1.08)' : 'scale(1)',
                        position: 'relative',
                        zIndex: 201,
                        flexShrink: 0,
                    }}
                >
                    {mainIcon}
                </button>
            </div>
        </div>
    );
};

export default ActionMenu;
