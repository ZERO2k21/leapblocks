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
            className={`fixed inset-0 z-[10000] flex items-center justify-center animate-[overlay-fade-in_0.3s_ease-out] ${
                isDark ? 'bg-[rgba(8,9,12,0.88)]' : 'bg-[rgba(241,245,249,0.85)]'
            }`}
            style={{
                backdropFilter: 'blur(20px) saturate(1.2)',
                WebkitBackdropFilter: 'blur(20px) saturate(1.2)'
            }}
        >
            {/* Ambient glow behind modal */}
            <div
                className={`absolute pointer-events-none w-[600px] h-[400px] rounded-[50%] blur-[60px] ${
                    isDark
                        ? 'bg-[radial-gradient(ellipse,rgba(59,130,246,0.06)_0%,transparent_70%)]'
                        : 'bg-[radial-gradient(ellipse,rgba(59,130,246,0.04)_0%,transparent_70%)]'
                }`}
            />

            <div
                className={`relative max-w-[880px] w-[92%] max-md:max-w-[460px] rounded-[24px] border border-solid ${
                    isDark
                        ? 'bg-[linear-gradient(180deg,rgba(15,17,23,0.95)_0%,rgba(10,11,14,0.98)_100%)] border-[rgba(255,255,255,0.06)] shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_25px_60px_-12px_rgba(0, 0, 0, 0.5), 0_0_120px_-40px_rgba(59,130,246,0.08)]'
                        : 'bg-[linear-gradient(180deg,#ffffff_0%,#fafbfc_100%)] border-[rgba(15,23,42,0.08)] shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_25px_50px_-12px_rgba(15, 23, 42, 0.12),0_0_80px_-30px_rgba(59, 130, 246, 0.04)]'
                }`}
                style={{
                    animation: 'modal-slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    padding: '40px 48px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                }}
            >
                {/* Close Button */}
                <button
                    className={`absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-xl cursor-pointer transition-all duration-200 bg-transparent border-none ${
                        isDark
                            ? 'text-[rgba(148,163,184,0.6)] hover:bg-[rgba(255,255,255,0.06)] hover:text-[#f8fafc]'
                            : 'text-[rgba(100,116,139,0.5)] hover:bg-[rgba(15,23,42,0.04)] hover:text-[#0f172a]'
                    }`}
                    onClick={onClose}
                    aria-label="Close modal"
                >
                    <X size={18} strokeWidth={2} />
                </button>

                {/* Header */}
                <div className="text-center mb-[36px]">
                    <h1
                        className={`m-0 font-bold tracking-[-0.02em] text-[30px] leading-[1.2] mb-[10px] ${
                            isDark ? 'text-[#f1f5f9]' : 'text-[#0f172a]'
                        }`}
                    >
                        Choose Your Board
                    </h1>
                    <p
                        className={`m-0 text-[14px] font-normal leading-[1.5] ${
                            isDark ? 'text-[rgba(148,163,184,0.8)]' : 'text-[rgba(71,85,105,0.8)]'
                        }`}
                    >
                        Select a microcontroller to start your simulation
                    </p>
                </div>

                {/* Board Cards */}
                <div className="grid grid-cols-2 max-md:grid-cols-1 gap-[20px]">
                    {BOARDS.map((board) => {
                        const isActive = hovered === board.id;

                        return (
                            <div
                                key={board.id}
                                className={`relative cursor-pointer flex flex-col overflow-hidden rounded-[16px] transition-all duration-[0.35s] ease-[cubic-bezier(0.16,1,0.3,1)] ${
                                    isActive ? '-translate-y-[4px]' : 'translate-y-0'
                                }`}
                                style={{
                                    padding: '24px',
                                    display: 'flex',
                                    flexDirection: 'column',
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
                                    className={`absolute inset-0 pointer-events-none rounded-[16px] transition-opacity duration-500 ${
                                        isActive ? 'opacity-100' : 'opacity-0'
                                    }`}
                                    style={{
                                        background: `radial-gradient(ellipse at 50% 0%, rgba(${board.accentRgb}, ${isDark ? '0.06' : '0.04'}) 0%, transparent 60%)`,
                                    }}
                                />

                                {/* Image Container */}
                                <div
                                    className={`relative w-full flex items-center justify-center overflow-hidden border border-solid ${
                                        isDark
                                            ? 'bg-[linear-gradient(180deg,rgba(0,0,0,0.3)_0%,rgba(0,0,0,0.15)_100%)] border-[rgba(255,255,255,0.04)]'
                                            : 'bg-[linear-gradient(180deg,#f1f5f9_0%,#e2e8f0_100%)] border-[rgba(15,23,42,0.04)]'
                                    }`}
                                    style={{
                                        width: '100%',
                                        height: '180px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden',
                                        borderRadius: '12px',
                                        marginBottom: '24px',
                                    }}
                                >
                                    {/* Subtle grid pattern */}
                                    <div
                                        className={`absolute inset-0 pointer-events-none ${
                                            isDark
                                                ? 'bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.015)_1px,transparent_0)]'
                                                : 'bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.02)_1px,transparent_0)]'
                                        }`}
                                        style={{
                                            backgroundSize: '20px 20px',
                                        }}
                                    />
                                    {/* Accent glow on hover */}
                                    <div
                                        className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${
                                            isActive ? 'opacity-[0.15]' : 'opacity-0'
                                        }`}
                                        style={{
                                            background: `radial-gradient(circle at center, rgba(${board.accentRgb}, 0.4) 0%, transparent 60%)`,
                                        }}
                                    />
                                    <div className="flex items-center justify-center pointer-events-none w-full h-full relative z-10">
                                        <board.Preview
                                            className="block pointer-events-none origin-center transition-all duration-[0.4s]"
                                            style={{
                                                transform: 'scale(0.6)',
                                                filter: isActive
                                                    ? `drop-shadow(0 4px 20px rgba(${board.accentRgb}, 0.2))`
                                                    : 'none',
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex flex-col flex-1 relative z-10" style={{ display: 'flex', flexDirection: 'column', flex: 1, position: 'relative', zIndex: 10 }}>
                                    <h2
                                        className={`m-0 font-semibold text-[20px] leading-[1.3] ${
                                            isDark ? 'text-[#f1f5f9]' : 'text-[#0f172a]'
                                        }`}
                                        style={{
                                            margin: '0 0 12px 0',
                                            fontWeight: 600,
                                            fontSize: '20px',
                                            lineHeight: 1.3,
                                        }}
                                    >
                                        {board.title}
                                    </h2>

                                    {/* Description */}
                                    <p
                                        className={`m-0 text-[13px] leading-[1.6] ${
                                            isDark ? 'text-[rgba(148,163,184,0.7)]' : 'text-[rgba(71,85,105,0.7)]'
                                        }`}
                                        style={{
                                            margin: '0 0 16px 0',
                                            fontSize: '13px',
                                            lineHeight: 1.6,
                                        }}
                                    >
                                        {board.description}
                                    </p>

                                    {/* Tags */}
                                    <div
                                        className="flex flex-wrap gap-[6px]"
                                        style={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: '6px',
                                            marginBottom: '20px',
                                        }}
                                    >
                                        {board.tags.map(tag => (
                                            <span
                                                key={tag}
                                                className="text-[10px] font-medium tracking-[0.02em] p-[4px_10px] rounded-[6px] transition-all duration-[0.3s]"
                                                style={{
                                                    fontFamily: "'JetBrains Mono', monospace",
                                                    color: isActive ? `rgba(${board.accentRgb}, 0.8)` : (isDark ? 'rgba(148, 163, 184, 0.6)' : 'rgba(71, 85, 105, 0.6)'),
                                                    background: isActive ? `rgba(${board.accentRgb}, ${isDark ? '0.08' : '0.06'})` : (isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(15, 23, 42, 0.03)'),
                                                    border: isActive
                                                        ? `1px solid rgba(${board.accentRgb}, ${isDark ? '0.15' : '0.12'})`
                                                        : (isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(15, 23, 42, 0.05)'),
                                                }}
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>

                                    {/* CTA */}
                                    <div
                                        className="flex items-center gap-[8px]"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            marginTop: 'auto',
                                        }}
                                    >
                                        <span
                                            className="text-[13px] font-semibold transition-colors duration-[0.25s]"
                                            style={{
                                                color: isActive ? board.accent : (isDark ? '#64748b' : '#94a3b8'),
                                            }}
                                        >
                                            Start Simulation
                                        </span>
                                        <ArrowRight
                                            size={15}
                                            strokeWidth={2.5}
                                            className={`transition-all duration-[0.25s] ${
                                                isActive ? 'translate-x-[4px]' : 'translate-x-0'
                                            }`}
                                            style={{
                                                color: isActive ? board.accent : (isDark ? '#64748b' : '#94a3b8'),
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Cancel */}
                <div
                    className="flex justify-center"
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        marginTop: '28px',
                    }}
                >
                    <button
                        onClick={onClose}
                        className={`cursor-pointer transition-all duration-200 px-[32px] py-[10px] text-[13px] font-medium rounded-[10px] border border-solid ${
                            isDark
                                ? 'bg-transparent border-white/10 text-slate-400 hover:bg-white/5 hover:border-white/20 hover:text-white'
                                : 'bg-transparent border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900'
                        }`}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};
