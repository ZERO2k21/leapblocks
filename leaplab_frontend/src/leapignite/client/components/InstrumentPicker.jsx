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
        <div className="fixed inset-0 w-screen h-screen z-50" onClick={onClose}>
            <div
                className="bg-fuchsia-500 rounded-xl p-2.5 grid grid-cols-3 gap-2 shadow-2xl min-w-[180px]"
                style={{
                    position: 'absolute',
                    left: position.x,
                    top: position.y
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-fuchsia-500"></div>
                {INSTRUMENTS.map((inst) => (
                    <div
                        key={inst.id}
                        className="bg-white/15 border border-white/30 rounded-lg h-14 flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-white/30 hover:scale-105"
                        onClick={() => {
                            onPick(inst.id, inst.icon);
                            onClose();
                        }}
                    >
                        <span className="text-3xl">{inst.icon}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
