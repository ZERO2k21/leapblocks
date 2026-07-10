/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */
import React from 'react';
import { X, ArrowRight, Cpu, Wifi } from 'lucide-react';
import { useForgeStore } from '../../utlis/store/useForgeStore';

interface BoardSelectionModalProps {
    onSelect: (board: 'arduino-uno' | 'esp32-c3') => void;
    onClose: () => void;
}

const BOARDS = [
    {
        id: 'arduino' as const,
        boardId: 'arduino-uno' as const,
        title: 'Arduino Uno',
        description: 'Classic AVR microcontroller perfect for learning electronics and embedded programming.',
        tags: ['ATmega328P', '14 Digital I/O', '6 Analog Inputs'],
        accent: '#fb923c',
        accentRgb: '251, 146, 60',
        Preview: 'leap-arduino-uno' as any,
        icon: Cpu,
    },
    {
        id: 'esp32' as const,
        boardId: 'esp32-c3' as const,
        title: 'ESP32-C3',
        description: 'Modern RISC-V microcontroller with built-in WiFi and Bluetooth for IoT projects.',
        tags: ['RISC-V 32-bit', 'WiFi & BLE 5.0', '22 GPIO Pins'],
        accent: '#06b6d4',
        accentRgb: '6, 182, 212',
        Preview: 'leap-esp32-c3' as any,
        icon: Wifi,
    },
];

export const BoardSelectionModal: React.FC<BoardSelectionModalProps> = ({ onSelect, onClose }) => {
    const uiTheme = useForgeStore(state => state.uiTheme);
    const isDark = uiTheme !== 'light';
    const [hovered, setHovered] = React.useState<'arduino' | 'esp32' | null>(null);

    return (
        <div
            className="fixed inset-0 z-[10000] flex items-center justify-center"
            style={{
                background: isDark ? 'rgba(8, 9, 12, 0.88)' : 'rgba(241, 245, 249, 0.85)',
                backdropFilter: 'blur(20px) saturate(1.2)',
                WebkitBackdropFilter: 'blur(20px) saturate(1.2)',
                animation: 'overlay-fade-in 0.3s ease-out',
            }}
        >
            {/* Ambient glow behind modal */}
            <div
                className="absolute pointer-events-none"
                style={{
                    width: '600px',
                    height: '400px',
                    borderRadius: '50%',
                    background: isDark
                        ? 'radial-gradient(ellipse, rgba(59, 130, 246, 0.06) 0%, transparent 70%)'
                        : 'radial-gradient(ellipse, rgba(59, 130, 246, 0.04) 0%, transparent 70%)',
                    filter: 'blur(60px)',
                }}
            />

            <div
                className="relative max-w-[880px] w-[92%] max-md:max-w-[460px]"
                style={{
                    background: isDark
                        ? 'linear-gradient(180deg, rgba(15, 17, 23, 0.95) 0%, rgba(10, 11, 14, 0.98) 100%)'
                        : 'linear-gradient(180deg, #ffffff 0%, #fafbfc 100%)',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(15, 23, 42, 0.08)',
                    borderRadius: '24px',
                    padding: '44px 52px',
                    boxShadow: isDark
                        ? '0 0 0 1px rgba(255,255,255,0.03), 0 25px 60px -12px rgba(0, 0, 0, 0.5), 0 0 120px -40px rgba(59, 130, 246, 0.08)'
                        : '0 0 0 1px rgba(0,0,0,0.02), 0 25px 50px -12px rgba(15, 23, 42, 0.12), 0 0 80px -30px rgba(59, 130, 246, 0.04)',
                    animation: 'modal-slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
            >
                {/* Close Button */}
                <button
                    className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-xl cursor-pointer transition-all duration-200"
                    onClick={onClose}
                    aria-label="Close modal"
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: isDark ? 'rgba(148, 163, 184, 0.6)' : 'rgba(100, 116, 139, 0.5)',
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.04)';
                        e.currentTarget.style.color = isDark ? '#f8fafc' : '#0f172a';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = isDark ? 'rgba(148, 163, 184, 0.6)' : 'rgba(100, 116, 139, 0.5)';
                    }}
                >
                    <X size={18} strokeWidth={2} />
                </button>

                {/* Header */}
                <div className="text-center" style={{ marginBottom: '36px' }}>
                    <h1
                        className="m-0 font-bold tracking-[-0.02em]"
                        style={{
                            fontSize: '30px',
                            lineHeight: '1.2',
                            color: isDark ? '#f1f5f9' : '#0f172a',
                            marginBottom: '10px',
                        }}
                    >
                        Choose Your Board
                    </h1>
                    <p
                        className="m-0"
                        style={{
                            fontSize: '14px',
                            fontWeight: 400,
                            lineHeight: '1.5',
                            color: isDark ? 'rgba(148, 163, 184, 0.8)' : 'rgba(71, 85, 105, 0.8)',
                        }}
                    >
                        Select a microcontroller to start your simulation
                    </p>
                </div>

                {/* Board Cards */}
                <div className="grid grid-cols-2 max-md:grid-cols-1" style={{ gap: '20px' }}>
                    {BOARDS.map((board) => {
                        const isActive = hovered === board.id;
                        const Icon = board.icon;

                        return (
                            <div
                                key={board.id}
                                className="relative cursor-pointer flex flex-col overflow-hidden"
                                style={{
                                    borderRadius: '16px',
                                    padding: '28px',
                                    transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                                    transform: isActive ? 'translateY(-4px)' : 'translateY(0)',
                                    background: isActive
                                        ? (isDark ? `rgba(${board.accentRgb}, 0.04)` : '#ffffff')
                                        : (isDark ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc'),
                                    border: isActive
                                        ? `1px solid rgba(${board.accentRgb}, ${isDark ? '0.2' : '0.3'})`
                                        : (isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(15, 23, 42, 0.06)'),
                                    boxShadow: isActive
                                        ? (isDark
                                            ? `0 20px 40px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(${board.accentRgb}, 0.08), inset 0 1px 0 rgba(255,255,255,0.03)`
                                            : `0 16px 32px -8px rgba(15, 23, 42, 0.1), 0 0 0 1px rgba(${board.accentRgb}, 0.06)`)
                                        : (isDark
                                            ? 'inset 0 1px 0 rgba(255,255,255,0.02)'
                                            : '0 1px 3px rgba(15, 23, 42, 0.04)'),
                                }}
                                onClick={() => onSelect(board.boardId)}
                                onMouseEnter={() => setHovered(board.id)}
                                onMouseLeave={() => setHovered(null)}
                            >
                                {/* Hover glow overlay */}
                                <div
                                    className="absolute inset-0 pointer-events-none transition-opacity duration-500"
                                    style={{
                                        borderRadius: '16px',
                                        opacity: isActive ? 1 : 0,
                                        background: `radial-gradient(ellipse at 50% 0%, rgba(${board.accentRgb}, ${isDark ? '0.06' : '0.04'}) 0%, transparent 60%)`,
                                    }}
                                />

                                {/* Image Container */}
                                <div
                                    className="relative w-full flex items-center justify-center overflow-hidden"
                                    style={{
                                        height: '180px',
                                        borderRadius: '12px',
                                        marginBottom: '24px',
                                        background: isDark
                                            ? 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.15) 100%)'
                                            : 'linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)',
                                        border: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(15,23,42,0.04)',
                                    }}
                                >
                                    {/* Subtle grid pattern */}
                                    <div
                                        className="absolute inset-0 pointer-events-none"
                                        style={{
                                            backgroundImage: isDark
                                                ? 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.015) 1px, transparent 0)'
                                                : 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.02) 1px, transparent 0)',
                                            backgroundSize: '20px 20px',
                                        }}
                                    />
                                    {/* Accent glow on hover */}
                                    <div
                                        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
                                        style={{
                                            opacity: isActive ? 0.15 : 0,
                                            background: `radial-gradient(circle at center, rgba(${board.accentRgb}, 0.4) 0%, transparent 60%)`,
                                        }}
                                    />
                                    <div className="flex items-center justify-center pointer-events-none w-full h-full relative z-10">
                                        <board.Preview
                                            className="block pointer-events-none"
                                            style={{
                                                transform: 'scale(0.6)',
                                                transformOrigin: 'center center',
                                                filter: isActive
                                                    ? `drop-shadow(0 4px 20px rgba(${board.accentRgb}, 0.2))`
                                                    : 'none',
                                                transition: 'filter 0.4s ease, transform 0.4s ease',
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex flex-col flex-1 relative z-10">
                                    {/* Title row with icon */}
                                    <div className="flex items-center gap-2.5" style={{ marginBottom: '8px' }}>
                                        <div
                                            className="flex items-center justify-center"
                                            style={{
                                                width: '28px',
                                                height: '28px',
                                                borderRadius: '8px',
                                                background: isActive
                                                    ? `rgba(${board.accentRgb}, ${isDark ? '0.15' : '0.1'})`
                                                    : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)'),
                                                transition: 'background 0.3s ease',
                                            }}
                                        >
                                            <Icon
                                                size={14}
                                                style={{
                                                    color: isActive ? board.accent : (isDark ? '#64748b' : '#94a3b8'),
                                                    transition: 'color 0.3s ease',
                                                }}
                                            />
                                        </div>
                                        <h2
                                            className="m-0 font-semibold"
                                            style={{
                                                fontSize: '18px',
                                                lineHeight: '1.3',
                                                color: isDark ? '#f1f5f9' : '#0f172a',
                                            }}
                                        >
                                            {board.title}
                                        </h2>
                                    </div>

                                    {/* Description */}
                                    <p
                                        className="m-0"
                                        style={{
                                            fontSize: '13px',
                                            lineHeight: '1.6',
                                            color: isDark ? 'rgba(148, 163, 184, 0.7)' : 'rgba(71, 85, 105, 0.7)',
                                            marginBottom: '16px',
                                        }}
                                    >
                                        {board.description}
                                    </p>

                                    {/* Tags */}
                                    <div className="flex flex-wrap" style={{ gap: '6px', marginBottom: '20px' }}>
                                        {board.tags.map(tag => (
                                            <span
                                                key={tag}
                                                style={{
                                                    fontSize: '10px',
                                                    fontFamily: "'JetBrains Mono', monospace",
                                                    fontWeight: 500,
                                                    letterSpacing: '0.02em',
                                                    padding: '4px 10px',
                                                    borderRadius: '6px',
                                                    color: isActive ? `rgba(${board.accentRgb}, 0.8)` : (isDark ? 'rgba(148, 163, 184, 0.6)' : 'rgba(71, 85, 105, 0.6)'),
                                                    background: isActive ? `rgba(${board.accentRgb}, ${isDark ? '0.08' : '0.06'})` : (isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(15, 23, 42, 0.03)'),
                                                    border: isActive
                                                        ? `1px solid rgba(${board.accentRgb}, ${isDark ? '0.15' : '0.12'})`
                                                        : (isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(15, 23, 42, 0.05)'),
                                                    transition: 'all 0.3s ease',
                                                }}
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>

                                    {/* CTA */}
                                    <div
                                        className="flex items-center mt-auto"
                                        style={{ gap: '8px' }}
                                    >
                                        <span
                                            style={{
                                                fontSize: '13px',
                                                fontWeight: 600,
                                                color: isActive ? board.accent : (isDark ? '#64748b' : '#94a3b8'),
                                                transition: 'color 0.25s ease',
                                            }}
                                        >
                                            Start Simulation
                                        </span>
                                        <ArrowRight
                                            size={15}
                                            strokeWidth={2.5}
                                            style={{
                                                color: isActive ? board.accent : (isDark ? '#64748b' : '#94a3b8'),
                                                transition: 'all 0.25s ease',
                                                transform: isActive ? 'translateX(4px)' : 'translateX(0)',
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Cancel */}
                <div className="flex justify-center" style={{ marginTop: '28px' }}>
                    <button
                        onClick={onClose}
                        className="cursor-pointer transition-all duration-200"
                        style={{
                            padding: '10px 32px',
                            fontSize: '13px',
                            fontWeight: 500,
                            borderRadius: '10px',
                            background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(15, 23, 42, 0.02)',
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.1)',
                            color: isDark ? 'rgba(148, 163, 184, 0.7)' : 'rgba(100, 116, 139, 0.7)',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.04)';
                            e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(15, 23, 42, 0.15)';
                            e.currentTarget.style.color = isDark ? '#e2e8f0' : '#334155';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(15, 23, 42, 0.02)';
                            e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.1)';
                            e.currentTarget.style.color = isDark ? 'rgba(148, 163, 184, 0.7)' : 'rgba(100, 116, 139, 0.7)';
                        }}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};
