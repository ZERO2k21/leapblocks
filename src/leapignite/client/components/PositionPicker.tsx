/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from 'react';

interface PositionPickerProps {
    onPick: (x: number, y: number) => void;
    onClose: () => void;
}

export default function PositionPicker({ onPick, onClose }: PositionPickerProps) {
    const cols = 23;
    const rows = 22;

    return (
        <div
            className="fixed top-0 left-0 w-full h-full bg-black/40 z-[2000] flex justify-center items-center"
            onClick={onClose}
        >
            <div
                className="grid gap-0.5 bg-[#e0e0e0] p-2.5 rounded-lg shadow-[0_4px_15px_rgba(0,0,0,0.3)]"
                style={{ gridTemplateColumns: `repeat(${cols}, 20px)`, gridTemplateRows: `repeat(${rows}, 20px)` }}
                onClick={(e) => e.stopPropagation()}
            >
                {[...Array(rows)].map((_, row) =>
                    [...Array(cols)].map((_, col) => {
                        const x = col;
                        const y = 20 - row;
                        return (
                            <div
                                key={`${col}-${row}`}
                                className="w-5 h-5 bg-white border border-[#ccc] cursor-pointer hover:bg-[#5FA8F5] hover:border-blue-500"
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
