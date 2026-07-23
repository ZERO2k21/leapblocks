/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from 'react';
import { X, Cpu } from 'lucide-react';

// Board definitions - Arduino and ESP32 focus with SVG icons
let _BOARDS = null;
export const getBoards = () => {
    if (!_BOARDS) {
        _BOARDS = [
            {
                id: 'arduino_uno',
                name: 'Arduino Uno',
                category: 'Arduino',
                color: '#00979D', // Arduino teal
                description: 'Perfect for beginners'
            },
            {
                id: 'arduino_mega',
                name: 'Arduino Mega',
                category: 'Arduino',
                color: '#00979D',
                description: 'More pins & memory'
            },
            {
                id: 'arduino_nano',
                name: 'Arduino Nano',
                category: 'Arduino',
                color: '#00979D',
                description: 'Compact size'
            },
            {
                id: 'esp32',
                name: 'ESP32',
                category: 'ESP',
                color: '#E7352C', // ESP red
                description: 'WiFi & Bluetooth'
            },
        ];
    }
    return _BOARDS;
};

// Simple Arduino board icon component
function BoardIcon({ board }) {
    return (
        <div
            className="w-[60px] h-[45px] rounded flex items-center justify-center relative shadow-[0_2px_4px_rgba(0,0,0,0.2)]"
            style={{ backgroundColor: board.color }}
        >
            {/* Circuit pattern */}
            <div className="absolute top-1 left-1 right-1 h-1 bg-white/30 rounded-sm" />

            {/* Chip icon */}
            <Cpu size={24} color="#fff" className="mt-1" />

            {/* Pin headers */}
            <div className="absolute bottom-1 left-2 right-2 h-0.75 bg-black/20 rounded-[1px]" />
        </div>
    );
}

export default function BoardSelectionModal({ isOpen, onClose, onSelect, currentBoard }) {
    if (!isOpen) return null;

    const selectedBoardName = currentBoard ? getBoards().find(b => b.id === currentBoard)?.name : null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000]" onClick={onClose}>
            <div className="bg-white rounded-xl w-[420px] max-h-[80vh] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.2)]" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-b from-[#00B894] to-[#00A085] text-white">
                    <h2 className="m-0 text-base font-semibold">Select Board</h2>
                    <button onClick={onClose} className="bg-white/20 border-none rounded-full w-6.5 h-6.5 flex items-center justify-center cursor-pointer text-white hover:bg-white/30 transition-colors">
                        <X size={14} />
                    </button>
                </div>

                <div className="p-5 grid grid-cols-2 gap-3.5">
                    {getBoards().map(board => (
                        <button
                            key={board.id}
                            onClick={() => { onSelect(board.id, board.name); onClose(); }}
                            className={`flex flex-col items-center justify-center px-3 py-4 rounded-lg cursor-pointer transition-all duration-150 ${
                                currentBoard === board.id
                                    ? 'border-[3px] border-[#7B4FC4] bg-[#7B4FC4]/10'
                                    : 'border-2 border-gray-200 bg-white hover:border-[#7B4FC4] hover:bg-[#7B4FC4]/5'
                            }`}
                        >
                            <BoardIcon board={board} />
                            <span className="mt-2.5 text-xs font-semibold text-gray-800">{board.name}</span>
                            <span className="mt-0.5 text-[10px] text-gray-400">{board.description}</span>
                        </button>
                    ))}
                </div>

                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-[11px] text-gray-500">
                        {currentBoard ? `Selected: ${selectedBoardName}` : 'No board selected'}
                    </span>
                    <button onClick={onClose} className="px-5 py-2 border-none rounded-md bg-gradient-to-b from-[#00B894] to-[#00A085] text-white text-xs font-semibold cursor-pointer hover:opacity-90 transition-opacity">Done</button>
                </div>
            </div>
        </div>
    );
}

