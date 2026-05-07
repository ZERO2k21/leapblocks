/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */
import React from 'react';

export type BoardType =
    | 'arduino-uno'
    | 'esp32-c3';

interface Props {
    selected: BoardType;
    onChange: (b: BoardType) => void;
    disabled?: boolean;
}

const BOARDS: { id: BoardType; label: string; chip: string; color: string; badge?: string }[] = [
    { id: 'arduino-uno', label: 'Arduino Uno', chip: 'ATmega328P', color: '#2196F3' },
    { id: 'esp32-c3', label: 'ESP32-C3', chip: 'RISC-V', color: '#E53935', badge: 'WiFi' },
];

export const BoardSelector: React.FC<Props> = ({ selected, onChange, disabled }) => (
    <div style={{
        display: 'flex',
        gap: 4,
        padding: '3px 6px',
        background: 'rgba(255,255,255,0.04)',
        borderRadius: 8,
        border: '0.5px solid rgba(255,255,255,0.08)',
        flexWrap: 'wrap',
    }}>
        {BOARDS.map(b => {
            const active = selected === b.id;
            return (
                <button
                    key={b.id}
                    disabled={disabled}
                    onClick={() => onChange(b.id)}
                    title={b.chip}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '3px 9px',
                        borderRadius: 5,
                        border: 'none',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        background: active ? b.color : 'transparent',
                        color: active ? '#fff' : 'rgba(255,255,255,0.45)',
                        fontSize: 11,
                        fontWeight: active ? 600 : 400,
                        transition: 'all 0.15s',
                        opacity: disabled ? 0.5 : 1,
                        whiteSpace: 'nowrap',
                    }}
                >
                    {/* Dot indicator */}
                    <span style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: active ? 'rgba(255,255,255,0.75)' : b.color,
                        flexShrink: 0,
                    }} />

                    {b.label}

                    {/* WiFi / feature badge */}
                    {b.badge && (
                        <span style={{
                            fontSize: 9,
                            padding: '1px 4px',
                            borderRadius: 3,
                            background: active ? 'rgba(255,255,255,0.2)' : 'rgba(229,57,53,0.18)',
                            color: active ? '#fff' : '#E57373',
                            marginLeft: 1,
                        }}>
                            {b.badge}
                        </span>
                    )}
                </button>
            );
        })}
    </div>
);
