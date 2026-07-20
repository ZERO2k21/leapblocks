/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from 'react';

export default function PositionPicker({ onPick, onClose }) {
    const cols = 23;
    const rows = 22;

    return (
        <div className="fixed inset-0 bg-black/40 z-[2000] flex justify-center items-center" onClick={onClose}>
            <div className="grid grid-cols-[repeat(23,20px)] grid-rows-[repeat(22,20px)] gap-[2px] bg-[#e0e0e0] p-[10px] rounded-lg shadow-[0_4px_15px_rgba(0,0,0,0.3)]" onClick={(e) => e.stopPropagation()}>
                {[...Array(rows)].map((_, row) =>
                    [...Array(cols)].map((_, col) => {
                        const x = col;
                        const y = 20 - row;
                        return (
                            <div
                                key={`${col}-${row}`}
                                className="w-5 h-5 bg-white border border-[#ccc] cursor-pointer hover:bg-[#5FA8F5] hover:border-[#3b82f6]"
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
