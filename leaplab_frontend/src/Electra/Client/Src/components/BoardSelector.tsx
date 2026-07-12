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
    { id: 'arduino-uno', label: 'Arduino Uno', chip: 'ATmega328P', color: '#00979C' },
    { id: 'esp32-c3', label: 'ESP32-C3', chip: 'ESP32-C3', color: '#E53935', badge: 'WiFi' },
];

export const BoardSelector: React.FC<Props> = ({ selected, onChange, disabled }) => (
    <div className="flex gap-[4px] p-[3px_6px] bg-[rgba(255,255,255,0.04)] rounded-[8px] border-[0.5px] border-solid border-[rgba(255,255,255,0.08)] flex-wrap">
        {BOARDS.map(b => {
            const active = selected === b.id;
            return (
                <button
                    key={b.id}
                    disabled={disabled}
                    onClick={() => onChange(b.id)}
                    title={b.chip}
                    className={`flex items-center gap-[5px] p-[3px_9px] rounded-[5px] border-none whitespace-nowrap transition-all duration-[0.15s] text-[11px] ${
                        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer opacity-100'
                    } ${
                        active
                            ? (b.id === 'arduino-uno' ? 'bg-[#00979C] text-white font-semibold' : 'bg-[#E53935] text-white font-semibold')
                            : 'bg-transparent text-[rgba(255,255,255,0.45)] font-normal'
                    }`}
                >
                    {/* Dot indicator */}
                    <span className={`w-[6px] h-[6px] rounded-[50%] shrink-0 ${
                        active ? 'bg-[rgba(255,255,255,0.75)]' : (b.id === 'arduino-uno' ? 'bg-[#00979C]' : 'bg-[#E53935]')
                    }`} />

                    {b.label}

                    {/* WiFi / feature badge */}
                    {b.badge && (
                        <span className={`ml-[1px] text-[9px] p-[1px_4px] rounded-[3px] ${
                            active
                                ? 'bg-[rgba(255,255,255,0.2)] text-white'
                                : 'bg-[rgba(229,57,53,0.18)] text-[#E57373]'
                        }`}>
                            {b.badge}
                        </span>
                    )}
                </button>
            );
        })}
    </div>
);
