/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from 'react';

export default function DirectionPicker({ onPick }) {
    const btnClass = "w-12 h-12 rounded-xl border-none bg-white/25 text-white text-xl cursor-pointer transition-all duration-200 hover:bg-white/40 hover:scale-105 active:scale-95";

    return (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-[1000]">
            <div className="bg-[#4A90E2] p-4 rounded-xl flex flex-col gap-[10px] relative shadow-[0_4px_15px_rgba(0,0,0,0.2)]" onClick={(e) => e.stopPropagation()}>
                <div className="absolute -bottom-[10px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[10px] border-l-transparent border-r-transparent border-t-[#4A90E2]" />

                <div className="flex justify-center">
                    <button className={btnClass} onClick={() => onPick("UP")}>⬆</button>
                </div>

                <div className="flex gap-[10px]">
                    <button className={btnClass} onClick={() => onPick("LEFT")}>⬅</button>
                    <button className={btnClass} onClick={() => onPick("CENTER")}>📍</button>
                    <button className={btnClass} onClick={() => onPick("RIGHT")}>⮕</button>
                </div>

                <div className="flex justify-center">
                    <button className={btnClass} onClick={() => onPick("DOWN")}>⬇</button>
                </div>
            </div>
        </div>
    );
}
