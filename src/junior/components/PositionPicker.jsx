import React from 'react';
import '../styles/positionPicker.css';

export default function PositionPicker({ onPick, onClose }) {
    const cols = 23; // 0 to 22
    const rows = 22; // -1 to 20

    return (
        <div className="pos-overlay" onClick={onClose}>
            <div className="pos-grid" onClick={(e) => e.stopPropagation()}>
                {[...Array(rows)].map((_, row) =>
                    [...Array(cols)].map((_, col) => {
                        const x = col; 
                        const y = 20 - row; 
                        return (
                            <div
                                key={`${col}-${row}`}
                                className="pos-cell"
                                title={`x: ${x}, y: ${y}`}
                                onClick={() => {
                                    onPick(x, y);
                                    onClose();
                                }}
                            />
                        );
                    })
                )}
            </div>
        </div>
    );
}
