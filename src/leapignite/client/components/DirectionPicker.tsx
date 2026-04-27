/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from 'react';

interface DirectionPickerProps {
    onPick: (dir: "UP" | "DOWN" | "LEFT" | "RIGHT" | "CENTER") => void;
}

export default function DirectionPicker({ onPick }: DirectionPickerProps) {
    return (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-[1000]">
            <div
                className="relative bg-[#4A90E2] p-4 rounded-xl flex flex-col gap-2.5 shadow-[0_4px_15px_rgba(0,0,0,0.2)] after:content-[''] after:absolute after:-bottom-2.5 after:left-1/2 after:-translate-x-1/2 after:border-[10px] after:border-transparent after:border-t-[#4A90E2]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Top Arrow */}
                <div className="flex justify-center">
                    <button
                        onClick={() => onPick("UP")}
                        className="w-12 h-12 rounded-[10px] border-none bg-white/25 text-white text-xl cursor-pointer transition-all duration-200 hover:bg-white/40 hover:scale-105 active:scale-95"
                    >⬆</button>
                </div>

                <div className="flex gap-2.5">
                    <button
                        onClick={() => onPick("LEFT")}
                        className="w-12 h-12 rounded-[10px] border-none bg-white/25 text-white text-xl cursor-pointer transition-all duration-200 hover:bg-white/40 hover:scale-105 active:scale-95"
                    >⬅</button>
                    <button
                        onClick={() => onPick("CENTER")}
                        className="w-12 h-12 rounded-[10px] border-none bg-white/25 text-white text-xl cursor-pointer transition-all duration-200 hover:bg-white/40 hover:scale-105 active:scale-95"
                    >📍</button>
                    <button
                        onClick={() => onPick("RIGHT")}
                        className="w-12 h-12 rounded-[10px] border-none bg-white/25 text-white text-xl cursor-pointer transition-all duration-200 hover:bg-white/40 hover:scale-105 active:scale-95"
                    >⮕</button>
                </div>

                <div className="flex justify-center">
                    <button
                        onClick={() => onPick("DOWN")}
                        className="w-12 h-12 rounded-[10px] border-none bg-white/25 text-white text-xl cursor-pointer transition-all duration-200 hover:bg-white/40 hover:scale-105 active:scale-95"
                    >⬇</button>
                </div>
            </div>
        </div>
    );
}
