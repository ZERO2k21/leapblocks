import React from 'react';
import '../styles/positionPicker.css';

export default function PositionPicker({ onPick, onClose }) {
    const cols = 20;
    const rows = 15;

    return (
        <div className="pos-overlay" onClick={onClose}>
            <div className="pos-grid" onClick={(e) => e.stopPropagation()}>
                {[...Array(rows)].map((_, row) =>
                    [...Array(cols)].map((_, col) => (
                        <div
                            key={`${col}-${row}`}
                            className="pos-cell"
                            title={`x: ${col + 1}, y: ${rows - row}`}
                            onClick={() => {
                                const x = col + 1;
                                const y = rows - row;
                                onPick(x, y);
                                onClose();
                            }}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
