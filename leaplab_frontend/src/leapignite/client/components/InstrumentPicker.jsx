/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from 'react';

const INSTRUMENTS = [
    { id: 'piano', name: 'Piano', icon: '🎹' },
    { id: 'organ', name: 'Keyboard', icon: '🎛️' },
    { id: 'flute', name: 'Flute', icon: '🪈' },
    { id: 'guitar', name: 'Acoustic', icon: '🎸' },
    { id: 'electric_guitar', name: 'Electric', icon: '🎸'},
];

export default function InstrumentPicker({ onPick, onClose, position }) {
    if (!position) return null;

    return (
        <div className="fixed inset-0 w-screen h-screen z-[9000]" onClick={onClose}>
            <div
                className="bg-[#CF63CF] rounded-xl p-[10px] grid grid-cols-3 gap-2 shadow-[0_8px_24px_rgba(0,0,0,0.2)] min-w-[180px]"
                style={{
                    position: 'absolute',
                    left: position.x,
                    top: position.y
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-b-2 border-l-transparent border-r-transparent border-b-[#CF63CF]" style={{ borderLeftWidth: '8px', borderRightWidth: '8px', borderBottomWidth: '8px' }}></div>
                {INSTRUMENTS.map((inst) => (
                    <div
                        key={inst.id}
                        className="bg-white/15 border border-white/30 rounded-lg h-[60px] flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-white/30 hover:scale-105"
                        onClick={() => {
                            onPick(inst.id, inst.icon);
                            onClose();
                        }}
                    >
                        <span className="text-[32px]">{inst.icon}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
