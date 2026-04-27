/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from 'react';
import '../styles/instrumentPicker.css';

const INSTRUMENTS = [
    { id: 'piano', name: 'Piano', icon: '🎹' },
    { id: 'organ', name: 'Keyboard', icon: '🎛️' }, // Using same emoji but could be distinct
    { id: 'flute', name: 'Flute', icon: '🪈' },
    { id: 'guitar', name: 'Acoustic', icon: '🎸' },
    { id: 'electric_guitar', name: 'Electric', icon: '🎸'},
];

interface InstrumentPickerProps {
    onPick: (id: string, icon: string) => void;
    onClose: () => void;
    position: { x: number; y: number } | null;
}

export default function InstrumentPicker({ onPick, onClose, position }: InstrumentPickerProps) {
    if (!position) return null;

    return (
        <div className="inst-overlay" onClick={onClose}>
            <div
                className="inst-grid"
                style={{
                    position: 'absolute',
                    left: position.x,
                    top: position.y
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="inst-arrow-up"></div>
                {INSTRUMENTS.map((inst) => (
                    <div
                        key={inst.id}
                        className="inst-option"
                        onClick={() => {
                            onPick(inst.id, inst.icon);
                            onClose();
                        }}
                    >
                        <span className="inst-icon">{inst.icon}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
