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
        accentClass: 'text-amber-500',
        activeBorder: 'border-amber-500/40 bg-amber-500/5 shadow-amber-500/10',
        activeBadge: 'text-amber-600 bg-amber-500/10 border-amber-500/20',
        Preview: 'leap-arduino-uno' as any,
        icon: Cpu,
    },
    {
        id: 'esp32' as const,
        boardId: 'esp32-c3' as const,
        title: 'ESP32-C3',
        description: 'Modern RISC-V microcontroller with built-in WiFi and Bluetooth for IoT projects.',
        tags: ['RISC-V 32-bit', 'WiFi & BLE 5.0', '22 GPIO Pins'],
        accentClass: 'text-cyan-500',
        activeBorder: 'border-cyan-500/40 bg-cyan-500/5 shadow-cyan-500/10',
        activeBadge: 'text-cyan-600 bg-cyan-500/10 border-cyan-500/20',
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
            className={`fixed inset-0 z-[99999] flex items-center justify-center p-4 backdrop-blur-xl animate-[fadeIn_0.3s_ease-out] ${
                isDark ? 'bg-slate-950/90' : 'bg-slate-900/60'
            }`}
        >
            {/* Ambient glow behind modal */}
            <div
                className={`absolute pointer-events-none w-[600px] h-[400px] rounded-full blur-3xl ${
                    isDark
                        ? 'bg-blue-600/10'
                        : 'bg-blue-500/10'
                }`}
            />

            <div
                className={`relative max-w-[880px] w-full max-h-[90vh] overflow-y-auto rounded-3xl border p-8 md:p-12 shadow-2xl animate-[modalSlideUp_0.4s_cubic-bezier(0.16,1,0.3,1)] ${
                    isDark
                        ? 'bg-gradient-to-b from-slate-900/95 to-slate-950/98 border-white/10 text-slate-100'
                        : 'bg-gradient-to-b from-white to-slate-50 border-slate-200 text-slate-900'
                }`}
            >
                {/* Close Button */}
                <button
                    type="button"
                    className={`absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-xl cursor-pointer transition-all duration-200 bg-transparent border-0 ${
                        isDark
                            ? 'text-slate-400 hover:bg-white/10 hover:text-white'
                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                    onClick={onClose}
                    aria-label="Close modal"
                >
                    <X size={18} strokeWidth={2} />
                </button>

                {/* Header */}
                <div className="text-center mb-9">
                    <h1
                        className={`m-0 font-extrabold tracking-tight text-3xl mb-2.5 ${
                            isDark ? 'text-white' : 'text-slate-900'
                        }`}
                    >
                        Choose Your Board
                    </h1>
                    <p
                        className={`m-0 text-sm font-medium ${
                            isDark ? 'text-slate-400' : 'text-slate-600'
                        }`}
                    >
                        Select a microcontroller to start your simulation
                    </p>
                </div>

                {/* Board Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {BOARDS.map((board) => {
                        const isActive = hovered === board.id;

                        return (
                            <div
                                key={board.id}
                                className={`relative cursor-pointer flex flex-col overflow-hidden rounded-2xl p-6 transition-all duration-300 border ${
                                    isActive
                                        ? `-translate-y-1 shadow-xl ${board.activeBorder}`
                                        : isDark
                                            ? 'bg-white/[0.02] border-white/10 hover:border-white/20'
                                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                                }`}
                                onClick={() => onSelect(board.boardId)}
                                onMouseEnter={() => setHovered(board.id)}
                                onMouseLeave={() => setHovered(null)}
                            >
                                {/* Image Container */}
                                <div
                                    className={`relative w-full h-[180px] mb-6 flex items-center justify-center overflow-hidden rounded-xl border ${
                                        isDark
                                            ? 'bg-gradient-to-b from-black/40 to-black/20 border-white/5'
                                            : 'bg-gradient-to-b from-slate-100 to-slate-200/80 border-slate-200'
                                    }`}
                                >
                                    <div className="flex items-center justify-center pointer-events-none w-full h-full relative z-10">
                                        <board.Preview
                                            className={`block pointer-events-none origin-center transition-all duration-300 scale-75 ${
                                                isActive ? 'drop-shadow-lg scale-80' : ''
                                            }`}
                                        />
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex flex-col flex-1 relative z-10">
                                    <h2
                                        className={`m-0 mb-3 font-bold text-xl leading-snug ${
                                            isDark ? 'text-white' : 'text-slate-900'
                                        }`}
                                    >
                                        {board.title}
                                    </h2>

                                    {/* Description */}
                                    <p
                                        className={`m-0 mb-4 text-xs leading-relaxed ${
                                            isDark ? 'text-slate-400' : 'text-slate-600'
                                        }`}
                                    >
                                        {board.description}
                                    </p>

                                    {/* Tags */}
                                    <div className="flex flex-wrap gap-1.5 mb-5">
                                        {board.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className={`text-[10px] font-mono font-medium px-2.5 py-1 rounded-md border transition-all ${
                                                    isActive
                                                        ? board.activeBadge
                                                        : isDark
                                                            ? 'text-slate-400 bg-white/5 border-white/10'
                                                            : 'text-slate-600 bg-slate-200/60 border-slate-300/60'
                                                }`}
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>

                                    {/* CTA */}
                                    <div className="flex items-center gap-2 mt-auto">
                                        <span
                                            className={`text-xs font-bold transition-colors ${
                                                isActive
                                                    ? board.accentClass
                                                    : isDark
                                                        ? 'text-slate-500'
                                                        : 'text-slate-400'
                                            }`}
                                        >
                                            Start Simulation
                                        </span>
                                        <ArrowRight
                                            size={15}
                                            strokeWidth={2.5}
                                            className={`transition-transform duration-200 ${
                                                isActive
                                                    ? `translate-x-1 ${board.accentClass}`
                                                    : isDark
                                                        ? 'text-slate-500'
                                                        : 'text-slate-400'
                                            }`}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Cancel */}
                <div className="flex justify-center mt-7">
                    <button
                        type="button"
                        onClick={onClose}
                        className={`cursor-pointer transition-all duration-200 text-xs font-semibold px-8 py-2.5 rounded-xl border ${
                            isDark
                                ? 'bg-transparent border-white/10 text-slate-400 hover:bg-white/5 hover:border-white/20 hover:text-white'
                                : 'bg-transparent border-slate-300 text-slate-600 hover:bg-slate-100 hover:border-slate-400 hover:text-slate-900'
                        }`}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};
