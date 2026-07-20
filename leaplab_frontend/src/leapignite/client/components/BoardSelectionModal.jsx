/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from 'react';
import { X, Cpu } from 'lucide-react';

const OVERLAY_STYLE = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', zIndex: 2000,
};

const MODAL_STYLE = {
    background: '#fff', borderRadius: '12px', width: '420px',
    maxHeight: '80vh', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
};

const HEADER_STYLE = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 20px',
    background: 'linear-gradient(180deg, #00B894 0%, #00A085 100%)', color: '#fff',
};

const CLOSE_BTN_STYLE = {
    background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%',
    width: '26px', height: '26px', display: 'flex', alignItems: 'center',
    justifyContent: 'center', cursor: 'pointer', color: '#fff',
};

const GRID_STYLE = {
    padding: '20px', display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px',
};

const BOARD_BTN_BASE = {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '16px 12px', borderRadius: '10px',
    cursor: 'pointer', transition: 'all 0.15s',
};

const BOARD_NAME_STYLE = { marginTop: '10px', fontSize: '12px', fontWeight: 600, color: '#333' };
const BOARD_DESC_STYLE = { marginTop: '2px', fontSize: '10px', color: '#888' };

const FOOTER_STYLE = {
    padding: '12px 20px', background: '#f8f8f8', borderTop: '1px solid #eee',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
};

const DONE_BTN_STYLE = {
    padding: '8px 20px', border: 'none', borderRadius: '6px',
    background: 'linear-gradient(180deg, #00B894 0%, #00A085 100%)',
    color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
};

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
    const isArduino = board.category === 'Arduino';
    return (
        <div style={{
            width: '60px',
            height: '45px',
            background: board.color,
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        }}>
            {/* Circuit pattern */}
            <div style={{
                position: 'absolute',
                top: '5px',
                left: '5px',
                right: '5px',
                height: '4px',
                background: 'rgba(255,255,255,0.3)',
                borderRadius: '2px',
            }} />

            {/* Chip icon */}
            <Cpu size={24} color="#fff" style={{ marginTop: '4px' }} />

            {/* Pin headers */}
            <div style={{
                position: 'absolute',
                bottom: '3px',
                left: '8px',
                right: '8px',
                height: '3px',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '1px',
            }} />
        </div>
    );
}

export default function BoardSelectionModal({ isOpen, onClose, onSelect, currentBoard }) {
    if (!isOpen) return null;

    const getBoardButtonStyle = (boardId) => ({
        ...BOARD_BTN_BASE,
        border: currentBoard === boardId ? '3px solid #7B4FC4' : '2px solid #e5e5e5',
        background: currentBoard === boardId ? 'rgba(123, 79, 196, 0.08)' : '#fff',
    });

    const handleBoardEnter = (e, boardId) => {
        if (currentBoard !== boardId) {
            e.currentTarget.style.borderColor = '#7B4FC4';
            e.currentTarget.style.background = 'rgba(123, 79, 196, 0.04)';
        }
    };

    const handleBoardLeave = (e, boardId) => {
        if (currentBoard !== boardId) {
            e.currentTarget.style.borderColor = '#e5e5e5';
            e.currentTarget.style.background = '#fff';
        }
    };

    const selectedBoardName = currentBoard ? getBoards().find(b => b.id === currentBoard)?.name : null;

    return (
        <div style={OVERLAY_STYLE} onClick={onClose}>
            <div style={MODAL_STYLE} onClick={e => e.stopPropagation()}>
                <div style={HEADER_STYLE}>
                    <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Select Board</h2>
                    <button onClick={onClose} style={CLOSE_BTN_STYLE}>
                        <X size={14} />
                    </button>
                </div>

                <div style={GRID_STYLE}>
                    {getBoards().map(board => (
                        <button
                            key={board.id}
                            onClick={() => { onSelect(board.id, board.name); onClose(); }}
                            style={getBoardButtonStyle(board.id)}
                            onMouseEnter={(e) => handleBoardEnter(e, board.id)}
                            onMouseLeave={(e) => handleBoardLeave(e, board.id)}
                        >
                            <BoardIcon board={board} />
                            <span style={BOARD_NAME_STYLE}>{board.name}</span>
                            <span style={BOARD_DESC_STYLE}>{board.description}</span>
                        </button>
                    ))}
                </div>

                <div style={FOOTER_STYLE}>
                    <span style={{ fontSize: '11px', color: '#666' }}>
                        {currentBoard ? `Selected: ${selectedBoardName}` : 'No board selected'}
                    </span>
                    <button onClick={onClose} style={DONE_BTN_STYLE}>Done</button>
                </div>
            </div>
        </div>
    );
}

